DO $$
DECLARE
    v_prod_id UUID := '99999999-6666-6666-6666-666666666666'::UUID;
    v_var_id  UUID := '88888888-6666-6666-6666-666666666661'::UUID;
    v_ord1_id UUID := '11111111-6666-6666-6666-666666666661'::UUID;
    v_ord2_id UUID := '11111111-6666-6666-6666-666666666662'::UUID;
    v_ord3_id UUID := '11111111-6666-6666-6666-666666666663'::UUID;
    v_ord4_id UUID := '11111111-6666-6666-6666-666666666664'::UUID;
    v_coupon_code TEXT := 'TESTCONCUR100';

    v_cat_id UUID;
    v_cat_slug VARCHAR(100);
BEGIN
    RAISE NOTICE '=======================================================';
    RAISE NOTICE 'SEEDING DEDICATED CONCURRENCY TEST FIXTURES';
    RAISE NOTICE '=======================================================';

    -- 1. Collision Checks
    IF EXISTS (SELECT 1 FROM public.products WHERE id = v_prod_id OR slug = 'test-concurrency-product') THEN
        RAISE EXCEPTION 'COLLISION ABORT: Product % already exists.', v_prod_id;
    END IF;
    IF EXISTS (SELECT 1 FROM public.product_variants WHERE id = v_var_id OR sku = 'TEST-CONCUR-SKU') THEN
        RAISE EXCEPTION 'COLLISION ABORT: Variant % already exists.', v_var_id;
    END IF;
    IF EXISTS (SELECT 1 FROM public.coupons WHERE UPPER(code) = v_coupon_code) THEN
        RAISE EXCEPTION 'COLLISION ABORT: Coupon % already exists.', v_coupon_code;
    END IF;
    IF EXISTS (SELECT 1 FROM public.orders WHERE id IN (v_ord1_id, v_ord2_id, v_ord3_id, v_ord4_id)
               OR order_number IN ('SS-CONCUR-001', 'SS-CONCUR-002', 'SS-CONCUR-003', 'SS-CONCUR-004')) THEN
        RAISE EXCEPTION 'COLLISION ABORT: Order fixtures already exist.';
    END IF;

    -- 2. Resolve Existing Active Category
    SELECT id, slug INTO v_cat_id, v_cat_slug FROM public.categories WHERE slug = 'honey' LIMIT 1;
    IF v_cat_id IS NULL THEN
        SELECT id, slug INTO v_cat_id, v_cat_slug FROM public.categories WHERE is_active = true LIMIT 1;
    END IF;
    IF v_cat_id IS NULL THEN
        RAISE EXCEPTION 'PREREQUISITE ABORT: No active category found in public.categories.';
    END IF;

    -- 3. Insert Product & Variant
    INSERT INTO public.products (id, category_id, category_slug, title_en, title_bn, slug, is_active)
    VALUES (v_prod_id, v_cat_id, v_cat_slug, 'Concurrency Test Product', 'টেস্ট কনকারেন্সি পণ্য', 'test-concurrency-product', true);

    -- Variant with 20 available base stock
    INSERT INTO public.product_variants (id, product_id, sku, display_name, regular_price, sale_price, stock_quantity)
    VALUES (v_var_id, v_prod_id, 'TEST-CONCUR-SKU', '500g', 600, 500, 20);

    -- 4. Insert Shared Coupon: 100 BDT off min 500 BDT.
    -- Initial times_used = 2 because Order 1 and Order 3 are active orders using it.
    INSERT INTO public.coupons (code, discount_type, discount_value, minimum_order_value, usage_limit, times_used, is_active)
    VALUES (v_coupon_code, 'fixed_amount'::public.discount_type, 100, 500, 5, 2, true);

    -- 5. Seed Order 1 (For Scenario A: Duplicate Cancellation)
    -- Initial status: pending, unpaid, uses coupon, qty = 2
    INSERT INTO public.orders (
        id, order_number, guest_name, guest_phone, shipping_address,
        subtotal, delivery_fee, discount_amount, coupon_code, grand_total,
        payment_method, payment_status, order_status
    ) VALUES (
        v_ord1_id, 'SS-CONCUR-001', 'Customer A', '01711111111',
        '{"fullAddress":"Dhaka","district":"Dhaka","zone":"inside_dhaka"}'::JSONB,
        1000, 70, 100, v_coupon_code, 970,
        'cod'::public.payment_method, 'unpaid'::public.payment_status, 'pending'::public.order_status
    );
    INSERT INTO public.order_items (order_id, product_id, variant_id, product_title, variant_name, unit_price, quantity, line_total)
    VALUES (v_ord1_id, v_prod_id, v_var_id, 'Concurrency Test Product', '500g', 500, 2, 1000);

    -- 6. Seed Order 2 (For Scenario B: Cancellation vs Payment Update)
    -- Initial status: pending, unpaid, no coupon, qty = 1
    INSERT INTO public.orders (
        id, order_number, guest_name, guest_phone, shipping_address,
        subtotal, delivery_fee, discount_amount, coupon_code, grand_total,
        payment_method, payment_status, order_status
    ) VALUES (
        v_ord2_id, 'SS-CONCUR-002', 'Customer B', '01722222222',
        '{"fullAddress":"Dhaka","district":"Dhaka","zone":"inside_dhaka"}'::JSONB,
        500, 70, 0, NULL, 570,
        'bkash'::public.payment_method, 'unpaid'::public.payment_status, 'pending'::public.order_status
    );
    INSERT INTO public.order_items (order_id, product_id, variant_id, product_title, variant_name, unit_price, quantity, line_total)
    VALUES (v_ord2_id, v_prod_id, v_var_id, 'Concurrency Test Product', '500g', 500, 1, 500);

    -- 7. Seed Order 3 (For Scenario C: Cancellation vs Checkout)
    -- Initial status: confirmed, unpaid, uses coupon, qty = 3
    INSERT INTO public.orders (
        id, order_number, guest_name, guest_phone, shipping_address,
        subtotal, delivery_fee, discount_amount, coupon_code, grand_total,
        payment_method, payment_status, order_status
    ) VALUES (
        v_ord3_id, 'SS-CONCUR-003', 'Customer C', '01733333333',
        '{"fullAddress":"Dhaka","district":"Dhaka","zone":"inside_dhaka"}'::JSONB,
        1500, 70, 100, v_coupon_code, 1470,
        'cod'::public.payment_method, 'unpaid'::public.payment_status, 'confirmed'::public.order_status
    );
    INSERT INTO public.order_items (order_id, product_id, variant_id, product_title, variant_name, unit_price, quantity, line_total)
    VALUES (v_ord3_id, v_prod_id, v_var_id, 'Concurrency Test Product', '500g', 500, 3, 1500);

    RAISE NOTICE '✓ Concurrency fixtures successfully seeded.';
    RAISE NOTICE '  Variant ID: % (Available Stock: 20)', v_var_id;
    RAISE NOTICE '  Coupon: % (times_used: 2, limit: 5)', v_coupon_code;
    RAISE NOTICE '  Order 1 ID: % (pending, unpaid, coupon, qty: 2)', v_ord1_id;
    RAISE NOTICE '  Order 2 ID: % (pending, unpaid, no coupon, qty: 1)', v_ord2_id;
    RAISE NOTICE '  Order 3 ID: % (confirmed, unpaid, coupon, qty: 3)', v_ord3_id;
END $$;
