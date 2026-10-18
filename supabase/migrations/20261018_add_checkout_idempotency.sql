-- ==============================================================================
-- Migration: Add Checkout Idempotency to Orders and Atomic Order Creation RPC
-- Date: 2026-10-18
-- Description:
--   1. Adds nullable `idempotency_key VARCHAR(64)` column to `public.orders`.
--   2. Creates unique index on `public.orders (idempotency_key)` to enforce uniqueness.
--   3. Upgrades `public.create_order_with_inventory` RPC function to accept `p_idempotency_key`,
--      enforcing transaction-level serialization with `pg_advisory_xact_lock(hashtext(...))`.
--   4. Any repeated request with the same idempotency key safely returns the existing
--      order result without decrementing stock or incrementing coupon usage again.
-- NOTE:
--   - DO NOT EXECUTE AUTOMATICALLY. Review thoroughly before running in Supabase.
-- ==============================================================================

-- 1. Add idempotency_key and request_hash columns to public.orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(64);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS request_hash VARCHAR(64);

-- 2. Create partial unique index on idempotency_key (ignoring NULL for historical guest orders)
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_idempotency_key_unique
    ON public.orders (idempotency_key)
    WHERE idempotency_key IS NOT NULL;

-- 3. Safely drop legacy 13-argument function overload so only the 14-argument version exists in pg_proc
-- Verified from 20261017_create_coupons_table.sql (UUID, TEXT, TEXT, TEXT, JSONB, NUMERIC, NUMERIC, NUMERIC, TEXT, NUMERIC, TEXT, TEXT, JSONB)
-- This prevents PostgREST PGRST204 candidate function ambiguity and ensures clean resolution.
DROP FUNCTION IF EXISTS public.create_order_with_inventory(
    UUID, TEXT, TEXT, TEXT, JSONB, NUMERIC, NUMERIC, NUMERIC, TEXT, NUMERIC, TEXT, TEXT, JSONB
);

-- 4. Upgrade public.create_order_with_inventory RPC with atomic idempotency and payload verification
CREATE OR REPLACE FUNCTION public.create_order_with_inventory(
    p_order_id UUID,
    p_order_number TEXT,
    p_guest_name TEXT,
    p_guest_phone TEXT,
    p_shipping_address JSONB,
    p_subtotal NUMERIC,
    p_delivery_fee NUMERIC,
    p_discount_amount NUMERIC,
    p_coupon_code TEXT,
    p_grand_total NUMERIC,
    p_payment_method TEXT,
    p_payment_status TEXT,
    p_items JSONB,
    p_idempotency_key TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
    v_item JSONB;
    v_variant_record RECORD;
    v_variant_id UUID;
    v_qty INT;
    v_unit_price NUMERIC;
    v_line_total NUMERIC;
    v_stock INT;
    v_product_title TEXT;
    v_coupon RECORD;
    v_expected_discount NUMERIC;
    v_clean_idempotency_key TEXT;
    v_payload_hash TEXT;
    v_existing_order RECORD;
BEGIN
    -- Compute deterministic payload hash for idempotency binding using canonical JSONB serialization
    -- Binds all order intent fields: name, phone, full shipping address, items, all financial totals, coupon, and payment method
    v_payload_hash := pg_catalog.md5(
        jsonb_build_object(
            'customer_name', trim(COALESCE(p_guest_name, '')),
            'customer_phone', trim(COALESCE(p_guest_phone, '')),
            'shipping_address', p_shipping_address,
            'subtotal', p_subtotal,
            'delivery_fee', p_delivery_fee,
            'discount_amount', p_discount_amount,
            'grand_total', p_grand_total,
            'coupon_code', UPPER(trim(COALESCE(p_coupon_code, ''))),
            'payment_method', trim(COALESCE(p_payment_method, '')),
            'items', p_items
        )::TEXT
    );

    -- Step 0: Atomic Idempotency Check & Concurrency Lock
    IF p_idempotency_key IS NOT NULL AND trim(p_idempotency_key) <> '' THEN
        v_clean_idempotency_key := trim(p_idempotency_key);

        -- Acquire transaction-level advisory lock on hashtext of idempotency_key.
        -- Serializes concurrent requests with the identical key before any variant or coupon locks.
        -- The second request will wait until the first commits, then immediately read and return the existing order.
        PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext(v_clean_idempotency_key));

        SELECT id, order_number, grand_total, guest_phone, request_hash
        INTO v_existing_order
        FROM public.orders
        WHERE idempotency_key = v_clean_idempotency_key;

        IF FOUND THEN
            -- Verify that the same idempotency key is not being reused with a different cart or payload
            IF v_existing_order.request_hash IS NOT NULL AND v_existing_order.request_hash <> v_payload_hash THEN
                RETURN jsonb_build_object(
                    'success', false,
                    'is_duplicate', true,
                    'message', 'IDEMPOTENCY_PAYLOAD_MISMATCH: একই আইডেমপোটেন্সি কি দিয়ে ভিন্ন অর্ডারের অনুরোধ করা যাবে না।'
                );
            END IF;

            RETURN jsonb_build_object(
                'success', true,
                'is_duplicate', true,
                'message', 'অর্ডার পূর্বেই সফলভাবে গৃহীত হয়েছে।',
                'order_id', v_existing_order.id,
                'order_number', v_existing_order.order_number
            );
        END IF;
    END IF;

    -- Check 1: Required order, customer, and shipping presence
    IF p_order_id IS NULL OR p_order_number IS NULL OR p_guest_name IS NULL OR p_guest_phone IS NULL OR p_shipping_address IS NULL OR p_items IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'অর্ডার সংক্রান্ত তথ্য অসম্পূর্ণ।');
    END IF;

    -- Check 2: Cart JSON array validation
    IF jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
        RETURN jsonb_build_object('success', false, 'message', 'কার্ট খালি!');
    END IF;

    -- Check 3: Financial totals cannot be null or negative
    IF p_subtotal IS NULL OR p_delivery_fee IS NULL OR p_discount_amount IS NULL OR p_grand_total IS NULL
       OR p_subtotal < 0 OR p_delivery_fee < 0 OR p_discount_amount < 0 OR p_grand_total < 0 THEN
        RAISE EXCEPTION 'INVALID_FINANCIAL_TOTALS';
    END IF;

    -- Check 4: Grand total formula consistency
    IF p_grand_total <> (p_subtotal + p_delivery_fee - p_discount_amount) THEN
        RAISE EXCEPTION 'FINANCIAL_CALCULATION_MISMATCH: subtotal + fee - discount != grand_total';
    END IF;

    -- Check 5: Payment method validation against whitelist
    IF p_payment_method NOT IN ('cod', 'bkash', 'nagad', 'sslcommerz') THEN
        RAISE EXCEPTION 'INVALID_PAYMENT_METHOD: %', p_payment_method;
    END IF;

    -- Check 6: Payment status validation against enum
    IF p_payment_status NOT IN ('unpaid', 'paid', 'refunded') THEN
        RAISE EXCEPTION 'INVALID_PAYMENT_STATUS: %', p_payment_status;
    END IF;

    -- Step A: Atomic Coupon Validation, Row Locking, and Usage Increment
    IF p_coupon_code IS NOT NULL AND trim(p_coupon_code) <> '' THEN
        -- Row lock prevents simultaneous orders from exceeding usage_limit
        SELECT id, discount_type, discount_value, minimum_order_value, max_discount_cap, usage_limit, times_used, is_active, start_date, end_date
        INTO v_coupon
        FROM public.coupons
        WHERE UPPER(code) = UPPER(trim(p_coupon_code))
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'COUPON_ERROR:কুপন কোডটি খুঁজে পাওয়া যায়নি।';
        END IF;

        IF NOT v_coupon.is_active THEN
            RAISE EXCEPTION 'COUPON_ERROR:কুপনটি বর্তমানে নিষ্ক্রিয় রয়েছে।';
        END IF;

        IF v_coupon.start_date IS NOT NULL AND v_coupon.start_date > now() THEN
            RAISE EXCEPTION 'COUPON_ERROR:কুপনটির মেয়াদ এখনো শুরু হয়নি।';
        END IF;

        IF v_coupon.end_date IS NOT NULL AND v_coupon.end_date < now() THEN
            RAISE EXCEPTION 'COUPON_ERROR:কুপনটির মেয়াদ শেষ হয়ে গেছে।';
        END IF;

        IF v_coupon.usage_limit IS NOT NULL AND v_coupon.times_used >= v_coupon.usage_limit THEN
            RAISE EXCEPTION 'COUPON_ERROR:কুপনটির ব্যবহারের সর্বোচ্চ সীমা শেষ হয়ে গেছে।';
        END IF;

        IF p_subtotal < v_coupon.minimum_order_value THEN
            RAISE EXCEPTION 'COUPON_ERROR:ন্যূনতম অর্ডারের শর্ত পূরণ হয়নি (ন্যূনতম ৳%)।', v_coupon.minimum_order_value;
        END IF;

        -- Verify discount calculation consistency
        IF v_coupon.discount_type = 'percentage'::public.discount_type THEN
            v_expected_discount := round((p_subtotal * v_coupon.discount_value) / 100);
            IF v_coupon.max_discount_cap IS NOT NULL AND v_coupon.max_discount_cap > 0 THEN
                v_expected_discount := least(v_expected_discount, v_coupon.max_discount_cap);
            END IF;
            v_expected_discount := greatest(0, least(v_expected_discount, p_subtotal));
        ELSIF v_coupon.discount_type = 'fixed_amount'::public.discount_type THEN
            v_expected_discount := v_coupon.discount_value;
            v_expected_discount := greatest(0, least(v_expected_discount, p_subtotal));
        ELSE
            -- free_shipping correctly applies to the delivery fee
            v_expected_discount := greatest(0, p_delivery_fee);
        END IF;

        IF p_discount_amount <> v_expected_discount THEN
            RAISE EXCEPTION 'COUPON_ERROR:ডিসকাউন্টের হিসাব মেলেনি। প্রত্যাশিত: ৳%, প্রাপ্ত: ৳%', v_expected_discount, p_discount_amount;
        END IF;

        -- Increment times_used within this exact transaction
        UPDATE public.coupons
        SET times_used = times_used + 1,
            updated_at = now()
        WHERE id = v_coupon.id;
    ELSE
        -- If no coupon was supplied, discount_amount must be exactly 0
        IF p_discount_amount <> 0 THEN
            RAISE EXCEPTION 'INVALID_FINANCIAL_TOTALS';
        END IF;
    END IF;

    -- Step B1: Lock and validate all variants in sorted UUID order (Eliminates Concurrent Deadlocks)
    FOR v_variant_record IN
        SELECT
            (elem->>'variant_id')::UUID AS variant_id,
            SUM((elem->>'quantity')::INT) AS total_qty,
            MAX(elem->>'product_title') AS product_title
        FROM jsonb_array_elements(p_items) AS elem
        GROUP BY (elem->>'variant_id')::UUID
        ORDER BY (elem->>'variant_id')::UUID
    LOOP
        v_variant_id := v_variant_record.variant_id;
        v_qty := v_variant_record.total_qty;
        v_product_title := COALESCE(v_variant_record.product_title, 'পণ্য');

        -- Item quantity check
        IF v_qty IS NULL OR v_qty <= 0 THEN
            RAISE EXCEPTION 'পণ্যের পরিমাণ অন্তত ১ হতে হবে (%): %', v_product_title, COALESCE(v_qty::TEXT, '<NULL>');
        END IF;

        -- Lock variant row and check stock
        SELECT stock_quantity INTO v_stock
        FROM public.product_variants
        WHERE id = v_variant_id
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'পণ্য ভ্যারিয়েন্ট পাওয়া যায়নি: %', v_product_title;
        END IF;

        IF v_stock < v_qty THEN
            RAISE EXCEPTION 'OUT_OF_STOCK:%:%', v_product_title, v_stock;
        END IF;
    END LOOP;

    -- Step B2: Deduct aggregated stock quantities in a separate sorted pass
    FOR v_variant_record IN
        SELECT
            (elem->>'variant_id')::UUID AS variant_id,
            SUM((elem->>'quantity')::INT) AS total_qty
        FROM jsonb_array_elements(p_items) AS elem
        GROUP BY (elem->>'variant_id')::UUID
        ORDER BY (elem->>'variant_id')::UUID
    LOOP
        UPDATE public.product_variants
        SET stock_quantity = stock_quantity - v_variant_record.total_qty
        WHERE id = v_variant_record.variant_id;
    END LOOP;

    -- Step C: Insert Order Header with Enum Casts, idempotency_key, and request_hash
    INSERT INTO public.orders (
        id,
        order_number,
        guest_name,
        guest_phone,
        shipping_address,
        subtotal,
        delivery_fee,
        discount_amount,
        coupon_code,
        grand_total,
        payment_method,
        payment_status,
        order_status,
        idempotency_key,
        request_hash,
        created_at,
        updated_at
    ) VALUES (
        p_order_id,
        p_order_number,
        p_guest_name,
        p_guest_phone,
        p_shipping_address,
        p_subtotal,
        p_delivery_fee,
        p_discount_amount,
        CASE WHEN p_coupon_code IS NOT NULL AND trim(p_coupon_code) <> '' THEN UPPER(trim(p_coupon_code)) ELSE NULL END,
        p_grand_total,
        p_payment_method::public.payment_method,
        p_payment_status::public.payment_status,
        'pending'::public.order_status,
        v_clean_idempotency_key,
        v_payload_hash,
        now(),
        now()
    );

    -- Step D: Insert Order Line Items with Strict Item Validations
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_unit_price := (v_item->>'unit_price')::NUMERIC;
        v_qty := (v_item->>'quantity')::INT;
        v_line_total := (v_item->>'line_total')::NUMERIC;
        v_product_title := COALESCE(v_item->>'product_title', 'পণ্য');

        -- Item unit price check
        IF v_unit_price IS NULL OR v_unit_price < 0 THEN
            RAISE EXCEPTION 'INVALID_ITEM_PRICE_OR_QUANTITY';
        END IF;

        -- Item quantity check
        IF v_qty IS NULL OR v_qty <= 0 THEN
            RAISE EXCEPTION 'পণ্যের পরিমাণ অন্তত ১ হতে হবে (%): %', v_product_title, COALESCE(v_qty::TEXT, '<NULL>');
        END IF;

        -- Line total consistency check
        IF v_line_total IS NULL OR v_line_total <> (v_unit_price * v_qty) THEN
            RAISE EXCEPTION 'ITEM_LINE_TOTAL_MISMATCH';
        END IF;

        INSERT INTO public.order_items (
            order_id,
            product_id,
            variant_id,
            product_title,
            variant_name,
            unit_price,
            quantity,
            line_total,
            created_at
        ) VALUES (
            p_order_id,
            (v_item->>'product_id')::UUID,
            (v_item->>'variant_id')::UUID,
            v_product_title,
            v_item->>'variant_name',
            v_unit_price,
            v_qty,
            v_line_total,
            now()
        );
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'is_duplicate', false,
        'message', 'অর্ডার সফল হয়েছে!',
        'order_id', p_order_id,
        'order_number', p_order_number
    );
END;
$$;

-- 5. Set Permissions
GRANT EXECUTE ON FUNCTION public.create_order_with_inventory(
    UUID, TEXT, TEXT, TEXT, JSONB, NUMERIC, NUMERIC, NUMERIC, TEXT, NUMERIC, TEXT, TEXT, JSONB, TEXT
) TO postgres, service_role;
REVOKE EXECUTE ON FUNCTION public.create_order_with_inventory(
    UUID, TEXT, TEXT, TEXT, JSONB, NUMERIC, NUMERIC, NUMERIC, TEXT, NUMERIC, TEXT, TEXT, JSONB, TEXT
) FROM authenticated, anon;

-- 6. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
