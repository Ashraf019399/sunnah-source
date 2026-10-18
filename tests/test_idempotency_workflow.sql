-- ==============================================================================
-- Sunnah Source: Test Database Validation Script for Checkout Idempotency
-- STRICT SAFETY RULE:
--   NEVER EXECUTE THIS SCRIPT ON PRODUCTION SUPABASE (fgfucwholpkizwlvlfrp).
--   ONLY EXECUTE ON A LOCAL TEST POSTGRESQL INSTANCE OR DEDICATED STAGING DB.
--
-- EXECUTION SCOPE & CONCURRENCY CLARIFICATION:
--   - This SQL workflow script can be executed directly in the Supabase
--     Dashboard SQL Editor or via psql. It executes sequentially in anonymous
--     PL/pgSQL DO blocks. It verifies schema prerequisites (columns, unique index,
--     14-argument RPC signature), sequential retry idempotency, coupon exhaustion
--     resilience, and payload mismatch rejection (IDEMPOTENCY_PAYLOAD_MISMATCH).
--   - This script DOES NOT claim to prove multi-transaction concurrency or
--     pg_advisory_xact_lock serialization across simultaneous client sessions.
--   - Real concurrent database transaction verification is executed via the
--     multi-client Node.js integration runner:
--     `tests/test-live-postgres-idempotency.mjs`
-- ==============================================================================

DO $$
BEGIN
    RAISE NOTICE '=======================================================';
    RAISE NOTICE 'STARTING IDEMPOTENCY MIGRATION TEST WORKFLOW';
    RAISE NOTICE '=======================================================';
END $$;

-- 1. Verify schema prerequisites from migration 20261018_add_checkout_idempotency.sql
DO $$
DECLARE
    v_has_idempotency_key BOOLEAN;
    v_has_request_hash BOOLEAN;
    v_has_unique_index BOOLEAN;
    v_proc_14_args BOOLEAN;
    v_proc_13_args BOOLEAN;
BEGIN
    -- Check columns
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'idempotency_key'
    ) INTO v_has_idempotency_key;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'request_hash'
    ) INTO v_has_request_hash;

    -- Check partial unique index
    SELECT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE schemaname = 'public' AND tablename = 'orders' AND indexname = 'idx_orders_idempotency_key_unique'
    ) INTO v_has_unique_index;

    -- Check function overloads in pg_proc
    SELECT EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'create_order_with_inventory' AND p.pronargs = 14
    ) INTO v_proc_14_args;

    SELECT EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'create_order_with_inventory' AND p.pronargs = 13
    ) INTO v_proc_13_args;

    IF NOT v_has_idempotency_key THEN
        RAISE EXCEPTION 'TEST FAILED: public.orders is missing column idempotency_key';
    END IF;

    IF NOT v_has_request_hash THEN
        RAISE EXCEPTION 'TEST FAILED: public.orders is missing column request_hash';
    END IF;

    IF NOT v_has_unique_index THEN
        RAISE EXCEPTION 'TEST FAILED: idx_orders_idempotency_key_unique partial index is missing';
    END IF;

    IF NOT v_proc_14_args THEN
        RAISE EXCEPTION 'TEST FAILED: 14-argument public.create_order_with_inventory RPC is missing';
    END IF;

    IF v_proc_13_args THEN
        RAISE EXCEPTION 'TEST FAILED: Legacy 13-argument public.create_order_with_inventory was not dropped';
    END IF;

    RAISE NOTICE '✓ [Schema Verification Passed] Columns, unique index, and 14-argument RPC verified.';
END $$;

-- 2. Seed test fixtures inside a test transaction block
DO $$
DECLARE
    v_test_prod_id UUID := '99999999-9999-9999-9999-999999999999';
    v_test_var_id UUID := '88888888-8888-8888-8888-888888888888';
    v_test_order_id UUID := '11111111-2222-3333-4444-555555555555'::UUID;
    v_test_key TEXT := 'test-idempotency-key-001';
    v_res1 JSONB;
    v_res2 JSONB;
    v_res_mismatch JSONB;
    v_test_cat_id UUID;
    v_test_cat_slug VARCHAR(100);
    v_stock_after INT;
    v_coupon_used INT;
    v_order_count INT;
BEGIN
    -- Collision safety checks: verify test fixture IDs and keys do not already exist
    IF EXISTS (SELECT 1 FROM public.products WHERE id = v_test_prod_id OR slug = 'test-honey-idem') THEN
        RAISE EXCEPTION 'COLLISION SAFETY ABORT: Test product ID % or slug test-honey-idem already exists in database. Aborting to prevent overwrite.', v_test_prod_id;
    END IF;

    IF EXISTS (SELECT 1 FROM public.product_variants WHERE id = v_test_var_id OR sku = 'TEST-SKU-01') THEN
        RAISE EXCEPTION 'COLLISION SAFETY ABORT: Test variant ID % or SKU TEST-SKU-01 already exists in database. Aborting to prevent overwrite.', v_test_var_id;
    END IF;

    IF EXISTS (SELECT 1 FROM public.coupons WHERE UPPER(code) = 'TESTSINGLEUSE') THEN
        RAISE EXCEPTION 'COLLISION SAFETY ABORT: Test coupon code TESTSINGLEUSE already exists in database. Aborting to prevent overwrite.';
    END IF;

    IF EXISTS (SELECT 1 FROM public.orders WHERE id = v_test_order_id OR idempotency_key = v_test_key) THEN
        RAISE EXCEPTION 'COLLISION SAFETY ABORT: Test order ID % or idempotency key % already exists in database. Aborting to prevent overwrite.', v_test_order_id, v_test_key;
    END IF;

    -- Safely resolve category fixture ID and slug (handles seeded fixture or pre-existing category)
    SELECT id, slug INTO v_test_cat_id, v_test_cat_slug FROM public.categories WHERE slug = 'honey' LIMIT 1;
    IF v_test_cat_id IS NULL THEN
        SELECT id, slug INTO v_test_cat_id, v_test_cat_slug FROM public.categories WHERE is_active = true LIMIT 1;
    END IF;
    IF v_test_cat_id IS NULL THEN
        RAISE EXCEPTION 'COLLISION / PREREQUISITE ABORT: No active category found in public.categories.';
    END IF;

    -- Insert clean test product (pointing to resolved category and obeying category_slug NOT NULL constraint)
    INSERT INTO public.products (id, category_id, category_slug, title_en, title_bn, slug, is_active)
    VALUES (v_test_prod_id, v_test_cat_id, v_test_cat_slug, 'Test Honey', 'টেস্ট মধু', 'test-honey-idem', true);

    -- Insert clean test variant with 10 stock
    INSERT INTO public.product_variants (id, product_id, sku, display_name, regular_price, sale_price, stock_quantity)
    VALUES (v_test_var_id, v_test_prod_id, 'TEST-SKU-01', '500g', 650, 600, 10);

    -- Insert clean single-use test coupon (usage_limit = 1)
    INSERT INTO public.coupons (code, discount_type, discount_value, minimum_order_value, usage_limit, times_used, is_active)
    VALUES ('TESTSINGLEUSE', 'fixed_amount', 100, 500, 1, 0, true);

    -- -------------------------------------------------------------------------
    -- TEST 1: Initial Order Submission with idempotency key
    -- -------------------------------------------------------------------------
    v_res1 := public.create_order_with_inventory(
        p_order_id => '11111111-2222-3333-4444-555555555555'::UUID,
        p_order_number => 'SS-TEST-IDEM-001',
        p_guest_name => 'Test Customer',
        p_guest_phone => '01711223344',
        p_shipping_address => '{"fullAddress":"House 1, Road 2","thana":"Uttara","district":"Dhaka","zone":"inside_dhaka"}'::JSONB,
        p_subtotal => 1200,
        p_delivery_fee => 70,
        p_discount_amount => 100,
        p_coupon_code => 'TESTSINGLEUSE',
        p_grand_total => 1170,
        p_payment_method => 'cod',
        p_payment_status => 'unpaid',
        p_items => jsonb_build_array(
            jsonb_build_object(
                'product_id', v_test_prod_id,
                'variant_id', v_test_var_id,
                'product_title', 'টেস্ট মধু',
                'variant_name', '500g',
                'unit_price', 600,
                'quantity', 2,
                'line_total', 1200
            )
        ),
        p_idempotency_key => v_test_key
    );

    IF (v_res1->>'success')::BOOLEAN <> true OR (v_res1->>'is_duplicate')::BOOLEAN <> false THEN
        RAISE EXCEPTION 'TEST 1 FAILED: Initial order failed: %', v_res1;
    END IF;

    -- Verify stock decremented: 10 - 2 = 8
    SELECT stock_quantity INTO v_stock_after FROM public.product_variants WHERE id = v_test_var_id;
    IF v_stock_after <> 8 THEN
        RAISE EXCEPTION 'TEST 1 FAILED: Expected stock 8, found %', v_stock_after;
    END IF;

    -- Verify coupon times_used incremented: 0 + 1 = 1 (now exhausted!)
    SELECT times_used INTO v_coupon_used FROM public.coupons WHERE UPPER(code) = 'TESTSINGLEUSE';
    IF v_coupon_used <> 1 THEN
        RAISE EXCEPTION 'TEST 1 FAILED: Expected coupon times_used 1, found %', v_coupon_used;
    END IF;

    RAISE NOTICE '✓ [Test 1 Passed] Initial order created, stock decremented to 8, coupon times_used = 1.';

    -- -------------------------------------------------------------------------
    -- TEST 2: Repeated Retry with Identical Idempotency Key
    -- -------------------------------------------------------------------------
    v_res2 := public.create_order_with_inventory(
        p_order_id => '99999999-0000-0000-0000-000000000000'::UUID, -- New random UUID generated by client retry
        p_order_number => 'SS-TEST-IDEM-002-DIFFERENT',
        p_guest_name => 'Test Customer',
        p_guest_phone => '01711223344',
        p_shipping_address => '{"fullAddress":"House 1, Road 2","thana":"Uttara","district":"Dhaka","zone":"inside_dhaka"}'::JSONB,
        p_subtotal => 1200,
        p_delivery_fee => 70,
        p_discount_amount => 100,
        p_coupon_code => 'TESTSINGLEUSE',
        p_grand_total => 1170,
        p_payment_method => 'cod',
        p_payment_status => 'unpaid',
        p_items => jsonb_build_array(
            jsonb_build_object(
                'product_id', v_test_prod_id,
                'variant_id', v_test_var_id,
                'product_title', 'টেস্ট মধু',
                'variant_name', '500g',
                'unit_price', 600,
                'quantity', 2,
                'line_total', 1200
            )
        ),
        p_idempotency_key => v_test_key
    );

    IF (v_res2->>'success')::BOOLEAN <> true THEN
        RAISE EXCEPTION 'TEST 2 FAILED: Retry should have succeeded but returned: %', v_res2;
    END IF;

    IF (v_res2->>'is_duplicate')::BOOLEAN <> true THEN
        RAISE EXCEPTION 'TEST 2 FAILED: Expected is_duplicate = true, got: %', v_res2;
    END IF;

    IF (v_res2->>'order_number') <> 'SS-TEST-IDEM-001' THEN
        RAISE EXCEPTION 'TEST 2 FAILED: Expected original order number SS-TEST-IDEM-001, got: %', v_res2->>'order_number';
    END IF;

    -- Verify stock was NOT decremented again (still 8)
    SELECT stock_quantity INTO v_stock_after FROM public.product_variants WHERE id = v_test_var_id;
    IF v_stock_after <> 8 THEN
        RAISE EXCEPTION 'TEST 2 FAILED: Stock was decremented twice! Current stock: %', v_stock_after;
    END IF;

    -- Verify coupon was NOT incremented again (still 1)
    SELECT times_used INTO v_coupon_used FROM public.coupons WHERE UPPER(code) = 'TESTSINGLEUSE';
    IF v_coupon_used <> 1 THEN
        RAISE EXCEPTION 'TEST 2 FAILED: Coupon was incremented twice! Current times_used: %', v_coupon_used;
    END IF;

    RAISE NOTICE '✓ [Test 2 Passed] Duplicate retry safely returned original order without decrementing stock or incrementing coupon twice.';

    -- -------------------------------------------------------------------------
    -- TEST 3: Key Reuse with Altered Checkout Intent (Payload Mismatch)
    -- -------------------------------------------------------------------------
    v_res_mismatch := public.create_order_with_inventory(
        p_order_id => '88888888-0000-0000-0000-000000000000'::UUID,
        p_order_number => 'SS-TEST-IDEM-TAMPER',
        p_guest_name => 'Altered Customer Name', -- TAMPERED
        p_guest_phone => '01711223344',
        p_shipping_address => '{"fullAddress":"House 1, Road 2","thana":"Uttara","district":"Dhaka","zone":"inside_dhaka"}'::JSONB,
        p_subtotal => 1200,
        p_delivery_fee => 70,
        p_discount_amount => 100,
        p_coupon_code => 'TESTSINGLEUSE',
        p_grand_total => 1170,
        p_payment_method => 'cod',
        p_payment_status => 'unpaid',
        p_items => jsonb_build_array(
            jsonb_build_object(
                'product_id', v_test_prod_id,
                'variant_id', v_test_var_id,
                'product_title', 'টেস্ট মধু',
                'variant_name', '500g',
                'unit_price', 600,
                'quantity', 2,
                'line_total', 1200
            )
        ),
        p_idempotency_key => v_test_key
    );

    IF (v_res_mismatch->>'success')::BOOLEAN <> false OR (v_res_mismatch->>'message') NOT LIKE '%IDEMPOTENCY_PAYLOAD_MISMATCH%' THEN
        RAISE EXCEPTION 'TEST 3 FAILED: Altered payload should be rejected with IDEMPOTENCY_PAYLOAD_MISMATCH, got: %', v_res_mismatch;
    END IF;

    RAISE NOTICE '✓ [Test 3 Passed] Altered payload correctly rejected with IDEMPOTENCY_PAYLOAD_MISMATCH.';

    -- -------------------------------------------------------------------------
    -- Clean up test records
    -- -------------------------------------------------------------------------
    DELETE FROM public.order_items WHERE order_id = v_test_order_id;
    DELETE FROM public.orders WHERE id = v_test_order_id;
    DELETE FROM public.coupons WHERE code = 'TESTSINGLEUSE';
    DELETE FROM public.product_variants WHERE id = v_test_var_id;
    DELETE FROM public.products WHERE id = v_test_prod_id;

    RAISE NOTICE '=======================================================';
    RAISE NOTICE 'ALL IDEMPOTENCY INTEGRATION TESTS COMPLETED SUCCESSFULLY!';
    RAISE NOTICE '=======================================================';
END $$;
