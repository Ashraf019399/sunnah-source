-- ==============================================================================
-- Migration: Add Order Lifecycle Management & Atomic Inventory Restoration RPC
-- Date: 2026-10-19
-- Description:
--   1. Defines `public.update_order_status_with_inventory(p_order_id UUID, p_new_status TEXT)`
--      RPC used by admin order actions.
--   2. Defines `public.update_order_payment_status(p_order_id UUID, p_new_payment_status TEXT)`
--      RPC for database-level atomic payment status validation and updates.
--   3. Enforces strict Finite State Machine (FSM) status transitions:
--        pending    -> confirmed, cancelled
--        confirmed  -> processing, cancelled
--        processing -> shipped, cancelled
--        shipped    -> delivered, returned
--        delivered  -> returned (return-window return)
--        cancelled  -> (Terminal, reversals strictly prohibited)
--        returned   -> (Terminal, reversals strictly prohibited)
--   4. Idempotent Inventory & Coupon Restoration:
--        - Uniform Lock Acquisition Hierarchy:
--          orders -> coupons -> product_variants (sorted by UUID).
--          This order completely prevents cross-RPC deadlocks with create_order_with_inventory.
--        - Stock is restored at most once on cancellation or return.
--        - Unfulfilled cancellations restore coupon usage only when the matching coupon
--          row actually exists and is updated; missing coupons are handled safely.
--        - Returns do not restore coupon quotas.
--   5. Payment Status Transition Integrity:
--        - Paid payments cannot be reverted to unpaid.
--        - Cannot mark cancelled or returned orders as paid.
--        - Cannot refund unpaid orders.
--        - Refunding requires order to be in cancelled or returned state.
--        - Refunded is a terminal payment state (reversals strictly prohibited).
--   6. Grants & Security:
--        - SECURITY DEFINER with empty search_path.
--        - Schema-qualified objects.
--        - Accessible only to postgres and service_role; revoked from public/anon/authenticated.
-- ==============================================================================

-- 1. Order Status & Inventory Management Function
CREATE OR REPLACE FUNCTION public.update_order_status_with_inventory(
    p_order_id UUID,
    p_new_status TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
    v_order RECORD;
    v_item RECORD;
    v_old_status TEXT;
    v_clean_new_status TEXT;
    v_stock_restored BOOLEAN := false;
    v_coupon_restored BOOLEAN := false;
    v_is_valid_transition BOOLEAN := false;
    v_rows_affected INT;
    v_message TEXT;
BEGIN
    -- 1. Input Validation
    IF p_order_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'অর্ডার আইডি আবশ্যক।'
        );
    END IF;

    IF p_new_status IS NULL OR trim(p_new_status) = '' THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'অর্ডার স্ট্যাটাস আবশ্যক।'
        );
    END IF;

    v_clean_new_status := trim(lower(p_new_status));

    IF v_clean_new_status NOT IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned') THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'অবৈধ অর্ডার স্ট্যাটাস মান: ' || p_new_status
        );
    END IF;

    -- 2. Lock Order Row for Update (Level 1 in hierarchy: orders)
    SELECT id, order_number, order_status, payment_status, coupon_code
    INTO v_order
    FROM public.orders
    WHERE id = p_order_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'অর্ডারটি পাওয়া যায়নি।'
        );
    END IF;

    v_old_status := v_order.order_status::TEXT;

    -- 3. Idempotent No-Op Check
    IF v_old_status = v_clean_new_status THEN
        RETURN jsonb_build_object(
            'success', true,
            'is_noop', true,
            'order_id', v_order.id,
            'order_number', v_order.order_number,
            'old_status', v_old_status,
            'new_status', v_clean_new_status,
            'stock_restored', false,
            'coupon_restored', false,
            'message', 'অর্ডার ইতিমধ্যে এই স্ট্যাটাসে রয়েছে।'
        );
    END IF;

    -- 4. Finite State Machine (FSM) Transition Rules
    CASE v_old_status
        WHEN 'pending' THEN
            v_is_valid_transition := v_clean_new_status IN ('confirmed', 'cancelled');
        WHEN 'confirmed' THEN
            v_is_valid_transition := v_clean_new_status IN ('processing', 'cancelled');
        WHEN 'processing' THEN
            v_is_valid_transition := v_clean_new_status IN ('shipped', 'cancelled');
        WHEN 'shipped' THEN
            v_is_valid_transition := v_clean_new_status IN ('delivered', 'returned');
        WHEN 'delivered' THEN
            v_is_valid_transition := v_clean_new_status IN ('returned');
        WHEN 'cancelled' THEN
            -- Terminal state: Reversal strictly forbidden to maintain financial & inventory integrity
            v_is_valid_transition := false;
        WHEN 'returned' THEN
            -- Terminal state: Reversal strictly forbidden
            v_is_valid_transition := false;
        ELSE
            v_is_valid_transition := false;
    END CASE;

    IF NOT v_is_valid_transition THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'অবৈধ স্ট্যাটাস পরিবর্তন: ' || v_old_status || ' থেকে ' || v_clean_new_status || ' পরিবর্তন করা অনুমোদিত নয়।'
        );
    END IF;

    -- 5. Promotional Coupon Quota Restoration & Row Locking
    -- LOCK ORDER HIERARCHY:
    -- Level 2: Lock coupon row FOR UPDATE BEFORE touching product_variants.
    -- This enforces orders -> coupons -> product_variants across all RPCs,
    -- eliminating the cross-RPC deadlock condition with create_order_with_inventory.
    IF v_old_status IN ('pending', 'confirmed', 'processing')
       AND v_clean_new_status = 'cancelled'
       AND v_order.coupon_code IS NOT NULL
       AND trim(v_order.coupon_code) <> '' THEN

        PERFORM 1
        FROM public.coupons
        WHERE UPPER(code) = UPPER(trim(v_order.coupon_code))
        FOR UPDATE;

        IF FOUND THEN
            UPDATE public.coupons
            SET times_used = CASE WHEN times_used > 0 THEN times_used - 1 ELSE 0 END,
                updated_at = pg_catalog.now()
            WHERE UPPER(code) = UPPER(trim(v_order.coupon_code));

            GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
            v_coupon_restored := (v_rows_affected > 0);
        ELSE
            -- Coupon code does not exist in public.coupons (e.g. deleted or invalid reference).
            -- Safely proceed without falsely claiming quota restoration.
            v_coupon_restored := false;
        END IF;
    END IF;

    -- 6. Inventory Restoration (Atomic & Exactly Once)
    -- Level 3 in hierarchy: Lock product_variants in deterministic sorted UUID order.
    -- Stock is restored ONLY when:
    --   a) Order transitions from active holding state ('pending', 'confirmed', 'processing') to 'cancelled', OR
    --   b) Order transitions from in-transit/fulfilled state ('shipped', 'delivered') to 'returned'
    IF (v_old_status IN ('pending', 'confirmed', 'processing') AND v_clean_new_status = 'cancelled')
       OR (v_old_status IN ('shipped', 'delivered') AND v_clean_new_status = 'returned') THEN

        FOR v_item IN
            SELECT
                variant_id,
                SUM(quantity)::INT AS total_qty
            FROM public.order_items
            WHERE order_id = p_order_id
            GROUP BY variant_id
            ORDER BY variant_id
        LOOP
            -- Lock variant row
            PERFORM 1
            FROM public.product_variants
            WHERE id = v_item.variant_id
            FOR UPDATE;

            IF FOUND THEN
                -- Restore inventory
                UPDATE public.product_variants
                SET stock_quantity = stock_quantity + v_item.total_qty
                WHERE id = v_item.variant_id;

                v_stock_restored := true;
            END IF;
        END LOOP;
    END IF;

    -- 7. Update Order Status and Timestamp
    UPDATE public.orders
    SET order_status = v_clean_new_status::public.order_status,
        updated_at = pg_catalog.now()
    WHERE id = p_order_id;

    -- 8. User-Friendly Notification Construction
    IF v_clean_new_status = 'cancelled' THEN
        IF v_order.payment_status = 'paid' THEN
            IF v_stock_restored AND v_coupon_restored THEN
                v_message := 'অর্ডার সফলভাবে বাতিল করা হয়েছে এবং পণ্যের স্টক ও কুপন কোটা পুনরুদ্ধার হয়েছে। সতর্কতা: অর্ডারটি পেইড (Paid) ছিলো, অনুগ্রহ করে গ্রাহককে ম্যানুয়ালি রিফান্ড প্রদান নিশ্চিত করুন।';
            ELSIF v_stock_restored THEN
                v_message := 'অর্ডার সফলভাবে বাতিল করা হয়েছে এবং পণ্যের স্টক পুনরুদ্ধার হয়েছে। সতর্কতা: অর্ডারটি পেইড (Paid) ছিলো, অনুগ্রহ করে গ্রাহককে ম্যানুয়ালি রিফান্ড প্রদান নিশ্চিত করুন।';
            ELSIF v_coupon_restored THEN
                v_message := 'অর্ডার সফলভাবে বাতিল করা হয়েছে এবং কুপন কোটা পুনরুদ্ধার হয়েছে। সতর্কতা: অর্ডারটি পেইড (Paid) ছিলো, অনুগ্রহ করে গ্রাহককে ম্যানুয়ালি রিফান্ড প্রদান নিশ্চিত করুন।';
            ELSE
                v_message := 'অর্ডার সফলভাবে বাতিল করা হয়েছে। সতর্কতা: অর্ডারটি পেইড (Paid) ছিলো, অনুগ্রহ করে গ্রাহককে ম্যানুয়ালি রিফান্ড প্রদান নিশ্চিত করুন।';
            END IF;
        ELSE
            IF v_stock_restored AND v_coupon_restored THEN
                v_message := 'অর্ডার সফলভাবে বাতিল করা হয়েছে এবং পণ্যের স্টক ও কুপন কোটা পুনরুদ্ধার করা হয়েছে।';
            ELSIF v_stock_restored THEN
                v_message := 'অর্ডার সফলভাবে বাতিল করা হয়েছে এবং পণ্যের স্টক পুনরুদ্ধার করা হয়েছে।';
            ELSIF v_coupon_restored THEN
                v_message := 'অর্ডার সফলভাবে বাতিল করা হয়েছে এবং কুপন কোটা পুনরুদ্ধার করা হয়েছে।';
            ELSE
                v_message := 'অর্ডার সফলভাবে বাতিল করা হয়েছে।';
            END IF;
        END IF;
    ELSIF v_clean_new_status = 'returned' THEN
        IF v_stock_restored THEN
            v_message := 'পণ্য ফেরত (Returned) হিসেবে গৃহীত হয়েছে এবং ইনভেন্টরি স্টক গুদামে পুনরুদ্ধার করা হয়েছে।';
        ELSE
            v_message := 'পণ্য ফেরত (Returned) হিসেবে গৃহীত হয়েছে।';
        END IF;
    ELSIF v_clean_new_status = 'delivered' THEN
        v_message := 'অর্ডার সফলভাবে ডেলিভার্ড হিসেবে চিহ্নিত করা হয়েছে।';
    ELSE
        v_message := 'অর্ডারের স্ট্যাটাস সফলভাবে আপডেট হয়েছে।';
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'is_noop', false,
        'order_id', v_order.id,
        'order_number', v_order.order_number,
        'old_status', v_old_status,
        'new_status', v_clean_new_status,
        'stock_restored', v_stock_restored,
        'coupon_restored', v_coupon_restored,
        'message', v_message
    );
END;
$$;

-- 2. Atomic Order Payment Status Transition Function
CREATE OR REPLACE FUNCTION public.update_order_payment_status(
    p_order_id UUID,
    p_new_payment_status TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
    v_order RECORD;
    v_clean_status TEXT;
    v_old_payment_status TEXT;
BEGIN
    -- 1. Input Validation
    IF p_order_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'অর্ডার আইডি আবশ্যক।'
        );
    END IF;

    IF p_new_payment_status IS NULL OR trim(p_new_payment_status) = '' THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'পেমেন্ট স্ট্যাটাস আবশ্যক।'
        );
    END IF;

    v_clean_status := trim(lower(p_new_payment_status));

    IF v_clean_status NOT IN ('unpaid', 'paid', 'refunded') THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'অবৈধ পেমেন্ট স্ট্যাটাস মান: ' || p_new_payment_status
        );
    END IF;

    -- 2. Lock Order Row for Update (Prevents concurrent TOCTOU race conditions)
    SELECT id, order_number, order_status, payment_status
    INTO v_order
    FROM public.orders
    WHERE id = p_order_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'অর্ডারটি পাওয়া যায়নি।'
        );
    END IF;

    v_old_payment_status := v_order.payment_status::TEXT;

    -- 3. Idempotent No-Op Check
    IF v_old_payment_status = v_clean_status THEN
        RETURN jsonb_build_object(
            'success', true,
            'is_noop', true,
            'order_id', v_order.id,
            'order_number', v_order.order_number,
            'old_payment_status', v_old_payment_status,
            'new_payment_status', v_clean_status,
            'message', 'পেমেন্ট ইতিমধ্যে এই স্ট্যাটাসে রয়েছে।'
        );
    END IF;

    -- 4. Terminal State Protection: Refunded payments cannot be reversed
    IF v_old_payment_status = 'refunded' THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'রিফান্ডকৃত পেমেন্ট স্ট্যাটাস পরিবর্তন করা যাবে না।'
        );
    END IF;

    -- 5. Business Consistency Rule 1: Paid payments cannot be reverted to unpaid
    IF v_old_payment_status = 'paid' AND v_clean_status = 'unpaid' THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'পরিশোধিত (Paid) পেমেন্ট পুনরায় অপরিশোধিত (Unpaid) করা যাবে না।'
        );
    END IF;

    -- 6. Business Consistency Rule 2: Cannot mark cancelled or returned orders as paid
    IF v_clean_status = 'paid' AND v_order.order_status::TEXT IN ('cancelled', 'returned') THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'বাতিলকৃত বা ফেরতকৃত অর্ডারের পেমেন্ট পেইড হিসেবে চিহ্নিত করা যাবে না।'
        );
    END IF;

    -- 7. Business Consistency Rule 3: Cannot refund an order that was not paid
    IF v_clean_status = 'refunded' AND v_old_payment_status <> 'paid' THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'শুধুমাত্র পেইড (Paid) অর্ডারে রিফান্ড স্ট্যাটাস প্রদান করা যাবে।'
        );
    END IF;

    -- 8. Business Consistency Rule 4: Refunding requires order to be in cancelled or returned state
    IF v_clean_status = 'refunded' AND v_order.order_status::TEXT NOT IN ('cancelled', 'returned') THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'রিফান্ড করার পূর্বে অর্ডারটি বাতিল (Cancelled) বা ফেরত (Returned) স্ট্যাটাসে থাকতে হবে।'
        );
    END IF;

    -- 9. Apply Update
    UPDATE public.orders
    SET payment_status = v_clean_status::public.payment_status,
        updated_at = pg_catalog.now()
    WHERE id = p_order_id;

    RETURN jsonb_build_object(
        'success', true,
        'is_noop', false,
        'order_id', v_order.id,
        'order_number', v_order.order_number,
        'old_payment_status', v_old_payment_status,
        'new_payment_status', v_clean_status,
        'message', 'পেমেন্ট স্ট্যাটাস সফলভাবে আপডেট হয়েছে।'
    );
END;
$$;

-- 3. Set Least-Privilege Permissions
GRANT EXECUTE ON FUNCTION public.update_order_status_with_inventory(UUID, TEXT) TO postgres, service_role;
REVOKE EXECUTE ON FUNCTION public.update_order_status_with_inventory(UUID, TEXT) FROM authenticated, anon, public;

GRANT EXECUTE ON FUNCTION public.update_order_payment_status(UUID, TEXT) TO postgres, service_role;
REVOKE EXECUTE ON FUNCTION public.update_order_payment_status(UUID, TEXT) FROM authenticated, anon, public;

-- 4. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
