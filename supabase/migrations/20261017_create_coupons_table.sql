-- ==============================================================================
-- Migration: Coupons Table Permissions, Schema Sync, and Atomic Checkout RPC
-- Date: 2026-10-17
-- Description:
--   1. Grants permissions on public.coupons (fixes error 42501 for service_role and postgres; revokes anon/authenticated).
--   2. Ensures public.coupons has all required columns and constraints.
--   3. Sets up RLS policies on public.coupons.
--   4. Upgrades public.create_order_with_inventory while strictly preserving all
--      original security definitions, validations, enum casts, search_path,
--      sorted deadlock-safe variant locking, and financial checks, while adding
--      atomic FOR UPDATE coupon locking, validation, and usage recording.
--
-- NOTE:
--   - DO NOT EXECUTE AUTOMATICALLY. Review thoroughly before running in Supabase.
--   - Does NOT touch permissions on orders or order_items.
--   - Does NOT seed live promotional codes automatically into production.
-- ==============================================================================

-- 1. Table Creation and Column Synchronization (Safe for existing public.coupons)
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL,
    discount_type public.discount_type NOT NULL DEFAULT 'percentage',
    discount_value NUMERIC(10, 2) NOT NULL DEFAULT 0,
    minimum_order_value NUMERIC(10, 2) NOT NULL DEFAULT 0,
    max_discount_cap NUMERIC(10, 2) NULL,
    usage_limit INTEGER NULL,
    times_used INTEGER NOT NULL DEFAULT 0,
    start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    end_date TIMESTAMPTZ NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    description TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Safely ensure optional / newly introduced columns exist on the existing table
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 2. Indexes on public.coupons
CREATE UNIQUE INDEX IF NOT EXISTS idx_coupons_code_unique ON public.coupons (UPPER(code));
CREATE INDEX IF NOT EXISTS idx_coupons_active_expiry ON public.coupons (is_active, end_date);
CREATE INDEX IF NOT EXISTS idx_coupons_created_at ON public.coupons (created_at DESC);

-- 3. Trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_coupons_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_coupons_updated_at ON public.coupons;
CREATE TRIGGER trg_coupons_updated_at
    BEFORE UPDATE ON public.coupons
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_coupons_updated_at();

-- 4. Permissions & Grants (Fixes error 42501 on public.coupons for service_role and postgres)
-- Security note: All coupon operations and lookups are performed via secure Server Actions
-- (adminClient/service_role) and the atomic RPC (SECURITY DEFINER). Public/anon access is NOT needed
-- and is explicitly revoked to prevent unauthorized enumeration or scraping of promotional codes.
GRANT ALL ON TABLE public.coupons TO postgres, service_role;
REVOKE ALL ON TABLE public.coupons FROM authenticated, anon;

-- 5. Row Level Security (RLS) on public.coupons
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Clean up any preexisting public policies
DROP POLICY IF EXISTS "Public can view active coupons" ON public.coupons;

-- Policy: Only service_role has full access
DROP POLICY IF EXISTS "Service role has full access to coupons" ON public.coupons;
CREATE POLICY "Service role has full access to coupons"
    ON public.coupons
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- 6. Upgraded Atomic Order Creation RPC Function
-- Preserves ALL original live behaviors, security definer, search_path,
-- sorted deadlock-safe inventory locks, enum casts, and financial checks.
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
    p_items JSONB
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
BEGIN
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
    -- Whitelist: 'cod', 'bkash', 'nagad', 'sslcommerz' (excludes unsupported 'bank_transfer')
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
            -- free_shipping correctly applies to the delivery fee, even when product subtotal is lower than delivery fee
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

    -- Step C: Insert Order Header with Enum Casts
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
        now(),
        now()
    );

    -- Step D: Insert Order Line Items with Strict Item Validations (relying on column default for id)
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
        'message', 'অর্ডার সফল হয়েছে!',
        'order_id', p_order_id,
        'order_number', p_order_number
    );
END;
$$;
