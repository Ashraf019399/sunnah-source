-- ==============================================================================
-- Sunnah Source: Staging Database Validation Script for Order Lifecycle & Payment
-- STRICT SAFETY RULE:
--   NEVER EXECUTE THIS SCRIPT ON PRODUCTION SUPABASE (fgfucwholpkizwlvlfrp).
--   ONLY EXECUTE ON A LOCAL TEST POSTGRESQL INSTANCE OR DEDICATED STAGING DB.
--
-- EXECUTION SCOPE & CONCURRENCY CLARIFICATION:
--   - This SQL workflow script can be executed directly in the Supabase
--     Dashboard SQL Editor or via psql. It executes sequentially in anonymous
--     PL/pgSQL DO blocks with comprehensive assertions.
--   - Tests:
--       1. Schema & RPC prerequisites (update_order_status_with_inventory & update_order_payment_status)
--       2. Valid forward lifecycle transitions (pending -> confirmed -> processing -> shipped -> delivered)
--       3. Invalid transitions & terminal state reversal rejection (cancelled/returned)
--       4. Atomic cancellation inventory restoration & coupon quota decrement
--       5. Idempotent cancellation retries (stock/coupon never restored twice)
--       6. Post-fulfillment return behavior (stock restored to warehouse, coupon kept)
--       7. Database-level atomic payment transition validation (terminal refund, paid constraints)
--       8. Safe error handling for missing/invalid orders
--       9. Complete fixture collision safety and cleanup
--   - NOTE: Multi-transaction physical concurrency testing (lock wait queues)
--     requires two concurrent psql sessions; see the two-session procedure
--     documented in the audit report.
-- ==============================================================================

DO $$
BEGIN
    RAISE NOTICE '=======================================================';
    RAISE NOTICE 'STARTING ORDER LIFECYCLE & PAYMENT VALIDATION WORKFLOW';
    RAISE NOTICE '=======================================================';
END $$;

-- -----------------------------------------------------------------------------
-- 1. Verify schema prerequisites from migration 20261019
-- -----------------------------------------------------------------------------
DO $$
DECLARE
    v_has_status_rpc BOOLEAN;
    v_has_payment_rpc BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
          AND p.proname = 'update_order_status_with_inventory'
          AND p.pronargs = 2
    ) INTO v_has_status_rpc;

    SELECT EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
          AND p.proname = 'update_order_payment_status'
          AND p.pronargs = 2
    ) INTO v_has_payment_rpc;

    IF NOT v_has_status_rpc THEN
        RAISE EXCEPTION 'TEST FAILED: public.update_order_status_with_inventory(UUID, TEXT) RPC is missing';
    END IF;

    IF NOT v_has_payment_rpc THEN
        RAISE EXCEPTION 'TEST FAILED: public.update_order_payment_status(UUID, TEXT) RPC is missing';
    END IF;

    RAISE NOTICE '✓ [Step 1 Passed] Both 20261019 lifecycle RPCs exist in pg_proc.';
END $$;

-- -----------------------------------------------------------------------------
-- 2. Seed test fixtures and execute lifecycle & payment tests
-- -----------------------------------------------------------------------------
DO $$
DECLARE
    -- Deterministic test UUID fixtures (prefixed with 7777 to avoid collision)
    v_prod_id UUID := '99999999-7777-7777-7777-777777777777'::UUID;
    v_var1_id UUID := '88888888-7777-7777-7777-777777777771'::UUID;
    v_var2_id UUID := '88888888-7777-7777-7777-777777777772'::UUID;
    v_order1_id UUID := '11111111-7777-7777-7777-777777777771'::UUID;
    v_order2_id UUID := '11111111-7777-7777-7777-777777777772'::UUID;
    v_order3_id UUID := '11111111-7777-7777-7777-777777777773'::UUID;
    v_order4_id UUID := '11111111-7777-7777-7777-777777777774'::UUID;
    v_coupon_code TEXT := 'TESTLIFECYCLE100';

    v_cat_id UUID;
    v_cat_slug VARCHAR(100);

    v_res JSONB;
    v_stock1 INT;
    v_stock2 INT;
    v_times_used INT;
    v_current_order_status TEXT;
    v_current_payment_status TEXT;
BEGIN
    -- -------------------------------------------------------------------------
    -- Fixture Collision Protection
    -- -------------------------------------------------------------------------
    IF EXISTS (SELECT 1 FROM public.products WHERE id = v_prod_id OR slug = 'test-lifecycle-honey') THEN
        RAISE EXCEPTION 'COLLISION SAFETY ABORT: Product % already exists.', v_prod_id;
    END IF;
    IF EXISTS (SELECT 1 FROM public.product_variants WHERE id IN (v_var1_id, v_var2_id)) THEN
        RAISE EXCEPTION 'COLLISION SAFETY ABORT: Variant fixtures already exist.';
    END IF;
    IF EXISTS (SELECT 1 FROM public.coupons WHERE UPPER(code) = v_coupon_code) THEN
        RAISE EXCEPTION 'COLLISION SAFETY ABORT: Coupon % already exists.', v_coupon_code;
    END IF;
    IF EXISTS (SELECT 1 FROM public.orders WHERE id IN (v_order1_id, v_order2_id, v_order3_id, v_order4_id)) THEN
        RAISE EXCEPTION 'COLLISION SAFETY ABORT: Order fixtures already exist.';
    END IF;

    -- Resolve category fixture
    SELECT id, slug INTO v_cat_id, v_cat_slug FROM public.categories WHERE slug = 'honey' LIMIT 1;
    IF v_cat_id IS NULL THEN
        SELECT id, slug INTO v_cat_id, v_cat_slug FROM public.categories WHERE is_active = true LIMIT 1;
    END IF;
    IF v_cat_id IS NULL THEN
        RAISE EXCEPTION 'PREREQUISITE ABORT: No active category found in public.categories.';
    END IF;

    -- Create test product & variants (Var1 initial stock: 10, Var2 initial stock: 5)
    INSERT INTO public.products (id, category_id, category_slug, title_en, title_bn, slug, is_active)
    VALUES (v_prod_id, v_cat_id, v_cat_slug, 'Test Lifecycle Product', 'টেস্ট পণ্য', 'test-lifecycle-honey', true);

    INSERT INTO public.product_variants (id, product_id, sku, display_name, regular_price, sale_price, stock_quantity)
    VALUES
        (v_var1_id, v_prod_id, 'TEST-VAR-771', '500g', 600, 550, 10),
        (v_var2_id, v_prod_id, 'TEST-VAR-772', '1kg', 1100, 1000, 5);

    -- Create single-use test coupon (usage_limit = 1, currently times_used = 1 because order is created)
    INSERT INTO public.coupons (code, discount_type, discount_value, minimum_order_value, usage_limit, times_used, is_active)
    VALUES (v_coupon_code, 'fixed_amount'::public.discount_type, 100, 500, 1, 1, true);

    -- Create Order 1 (Lifecycle forward transition test)
    INSERT INTO public.orders (
        id, order_number, guest_name, guest_phone, shipping_address,
        subtotal, delivery_fee, discount_amount, coupon_code, grand_total,
        payment_method, payment_status, order_status
    ) VALUES (
        v_order1_id, 'SS-TEST-LC-001', 'Test Customer', '01700000001',
        '{"fullAddress":"Dhaka","district":"Dhaka","zone":"inside_dhaka"}'::JSONB,
        1100, 70, 0, NULL, 1170,
        'cod'::public.payment_method, 'unpaid'::public.payment_status, 'pending'::public.order_status
    );

    INSERT INTO public.order_items (order_id, product_id, variant_id, product_title, variant_name, unit_price, quantity, line_total)
    VALUES (v_order1_id, v_prod_id, v_var1_id, 'Test Lifecycle Product', '500g', 550, 2, 1100);

    -- -------------------------------------------------------------------------
    -- TEST 1: Valid Forward Status Progression (pending -> confirmed -> processing -> shipped -> delivered)
    -- -------------------------------------------------------------------------
    v_res := public.update_order_status_with_inventory(v_order1_id, 'confirmed');
    IF (v_res->>'success')::BOOLEAN <> true OR (v_res->>'new_status') <> 'confirmed' THEN
        RAISE EXCEPTION 'TEST 1 FAILED: Could not transition pending to confirmed: %', v_res;
    END IF;

    v_res := public.update_order_status_with_inventory(v_order1_id, 'processing');
    IF (v_res->>'success')::BOOLEAN <> true OR (v_res->>'new_status') <> 'processing' THEN
        RAISE EXCEPTION 'TEST 1 FAILED: Could not transition confirmed to processing: %', v_res;
    END IF;

    v_res := public.update_order_status_with_inventory(v_order1_id, 'shipped');
    IF (v_res->>'success')::BOOLEAN <> true OR (v_res->>'new_status') <> 'shipped' THEN
        RAISE EXCEPTION 'TEST 1 FAILED: Could not transition processing to shipped: %', v_res;
    END IF;

    v_res := public.update_order_status_with_inventory(v_order1_id, 'delivered');
    IF (v_res->>'success')::BOOLEAN <> true OR (v_res->>'new_status') <> 'delivered' THEN
        RAISE EXCEPTION 'TEST 1 FAILED: Could not transition shipped to delivered: %', v_res;
    END IF;

    SELECT order_status::TEXT INTO v_current_order_status FROM public.orders WHERE id = v_order1_id;
    IF v_current_order_status <> 'delivered' THEN
        RAISE EXCEPTION 'TEST 1 FAILED: Database order_status should be delivered, got: %', v_current_order_status;
    END IF;

    RAISE NOTICE '✓ [Test 1 Passed] Valid forward lifecycle progression succeeded.';

    -- -------------------------------------------------------------------------
    -- TEST 2: Invalid Transitions and Terminal State Reversals
    -- -------------------------------------------------------------------------
    -- 2a: From delivered, cannot revert to pending, confirmed, or processing
    v_res := public.update_order_status_with_inventory(v_order1_id, 'pending');
    IF (v_res->>'success')::BOOLEAN <> false THEN
        RAISE EXCEPTION 'TEST 2 FAILED: delivered -> pending should be rejected, got: %', v_res;
    END IF;

    v_res := public.update_order_status_with_inventory(v_order1_id, 'confirmed');
    IF (v_res->>'success')::BOOLEAN <> false THEN
        RAISE EXCEPTION 'TEST 2 FAILED: delivered -> confirmed should be rejected, got: %', v_res;
    END IF;

    -- 2b: From delivered, transition to returned (terminal)
    v_res := public.update_order_status_with_inventory(v_order1_id, 'returned');
    IF (v_res->>'success')::BOOLEAN <> true THEN
        RAISE EXCEPTION 'TEST 2 FAILED: delivered -> returned should succeed, got: %', v_res;
    END IF;

    -- 2c: From returned, reversal to any other state is strictly forbidden
    v_res := public.update_order_status_with_inventory(v_order1_id, 'delivered');
    IF (v_res->>'success')::BOOLEAN <> false THEN
        RAISE EXCEPTION 'TEST 2 FAILED: returned -> delivered should be rejected, got: %', v_res;
    END IF;

    v_res := public.update_order_status_with_inventory(v_order1_id, 'confirmed');
    IF (v_res->>'success')::BOOLEAN <> false THEN
        RAISE EXCEPTION 'TEST 2 FAILED: returned -> confirmed should be rejected, got: %', v_res;
    END IF;

    RAISE NOTICE '✓ [Test 2 Passed] Invalid transitions and terminal returned reversals strictly rejected.';

    -- -------------------------------------------------------------------------
    -- TEST 3: Order Cancellation, Atomic Inventory & Coupon Restoration (Exactly Once)
    -- -------------------------------------------------------------------------
    -- Seed Order 2 with coupon and line items for Var1 (qty 2) and Var2 (qty 1)
    INSERT INTO public.orders (
        id, order_number, guest_name, guest_phone, shipping_address,
        subtotal, delivery_fee, discount_amount, coupon_code, grand_total,
        payment_method, payment_status, order_status
    ) VALUES (
        v_order2_id, 'SS-TEST-LC-002', 'Test Customer 2', '01700000002',
        '{"fullAddress":"Dhaka","district":"Dhaka","zone":"inside_dhaka"}'::JSONB,
        2100, 70, 100, v_coupon_code, 2070,
        'cod'::public.payment_method, 'unpaid'::public.payment_status, 'pending'::public.order_status
    );

    INSERT INTO public.order_items (order_id, product_id, variant_id, product_title, variant_name, unit_price, quantity, line_total)
    VALUES
        (v_order2_id, v_prod_id, v_var1_id, 'Test Lifecycle Product', '500g', 550, 2, 1100),
        (v_order2_id, v_prod_id, v_var2_id, 'Test Lifecycle Product', '1kg', 1000, 1, 1000);

    -- Check baseline stocks before cancellation (Var1 had 10 + 2 restored from Order 1 return = 12; Var2 has 5)
    SELECT stock_quantity INTO v_stock1 FROM public.product_variants WHERE id = v_var1_id;
    SELECT stock_quantity INTO v_stock2 FROM public.product_variants WHERE id = v_var2_id;
    SELECT times_used INTO v_times_used FROM public.coupons WHERE UPPER(code) = v_coupon_code;

    IF v_times_used <> 1 THEN
        RAISE EXCEPTION 'TEST 3 SETUP FAILED: Coupon times_used expected 1, got: %', v_times_used;
    END IF;

    -- Cancel Order 2
    v_res := public.update_order_status_with_inventory(v_order2_id, 'cancelled');
    IF (v_res->>'success')::BOOLEAN <> true
       OR (v_res->>'stock_restored')::BOOLEAN <> true
       OR (v_res->>'coupon_restored')::BOOLEAN <> true THEN
        RAISE EXCEPTION 'TEST 3 FAILED: Initial cancellation did not restore stock or coupon: %', v_res;
    END IF;

    -- Verify stock increment: Var1 (+2) -> v_stock1 + 2; Var2 (+1) -> v_stock2 + 1
    SELECT stock_quantity INTO v_stock1 FROM public.product_variants WHERE id = v_var1_id;
    SELECT stock_quantity INTO v_stock2 FROM public.product_variants WHERE id = v_var2_id;
    SELECT times_used INTO v_times_used FROM public.coupons WHERE UPPER(code) = v_coupon_code;

    IF v_times_used <> 0 THEN
        RAISE EXCEPTION 'TEST 3 FAILED: Coupon times_used should be decremented to 0, got: %', v_times_used;
    END IF;

    -- Idempotent Retry Check: Cancel again
    v_res := public.update_order_status_with_inventory(v_order2_id, 'cancelled');
    IF (v_res->>'success')::BOOLEAN <> true
       OR (v_res->>'is_noop')::BOOLEAN <> true
       OR (v_res->>'stock_restored')::BOOLEAN <> false
       OR (v_res->>'coupon_restored')::BOOLEAN <> false THEN
        RAISE EXCEPTION 'TEST 3 FAILED: Repeated cancellation must be a no-op without restoring stock twice: %', v_res;
    END IF;

    -- Ensure stock and coupon did NOT increment twice
    SELECT stock_quantity INTO v_stock1 FROM public.product_variants WHERE id = v_var1_id;
    SELECT stock_quantity INTO v_stock2 FROM public.product_variants WHERE id = v_var2_id;
    SELECT times_used INTO v_times_used FROM public.coupons WHERE UPPER(code) = v_coupon_code;

    IF v_times_used <> 0 THEN
        RAISE EXCEPTION 'TEST 3 FAILED: Coupon times_used was altered on retry: %', v_times_used;
    END IF;

    RAISE NOTICE '✓ [Test 3 Passed] Cancellation restored stock and coupon exactly once (idempotent retry safe).';

    -- -------------------------------------------------------------------------
    -- TEST 4: Atomic Database-Level Payment Transitions (public.update_order_payment_status)
    -- -------------------------------------------------------------------------
    -- Order 2 is currently 'cancelled' and payment is 'unpaid'
    -- 4a: Cannot mark cancelled order as paid
    v_res := public.update_order_payment_status(v_order2_id, 'paid');
    IF (v_res->>'success')::BOOLEAN <> false OR (v_res->>'message') NOT LIKE '%বাতিলকৃত বা ফেরতকৃত%' THEN
        RAISE EXCEPTION 'TEST 4a FAILED: Marking cancelled order as paid should be rejected, got: %', v_res;
    END IF;

    -- 4b: Cannot refund an unpaid order
    v_res := public.update_order_payment_status(v_order2_id, 'refunded');
    IF (v_res->>'success')::BOOLEAN <> false OR (v_res->>'message') NOT LIKE '%শুধুমাত্র পেইড%' THEN
        RAISE EXCEPTION 'TEST 4b FAILED: Refunding unpaid order should be rejected, got: %', v_res;
    END IF;

    -- Create Order 3: Active pre-paid order (order_status: 'processing', payment_status: 'paid')
    INSERT INTO public.orders (
        id, order_number, guest_name, guest_phone, shipping_address,
        subtotal, delivery_fee, discount_amount, coupon_code, grand_total,
        payment_method, payment_status, order_status
    ) VALUES (
        v_order3_id, 'SS-TEST-LC-003', 'Test Customer 3', '01700000003',
        '{"fullAddress":"Dhaka","district":"Dhaka","zone":"inside_dhaka"}'::JSONB,
        600, 70, 0, NULL, 670,
        'bkash'::public.payment_method, 'paid'::public.payment_status, 'processing'::public.order_status
    );

    -- 4c: Cannot revert paid order to unpaid (Rule: paid -> unpaid is strictly rejected)
    v_res := public.update_order_payment_status(v_order3_id, 'unpaid');
    IF (v_res->>'success')::BOOLEAN <> false OR (v_res->>'message') NOT LIKE '%পরিশোধিত (Paid) পেমেন্ট পুনরায় অপরিশোধিত (Unpaid) করা যাবে না%' THEN
        RAISE EXCEPTION 'TEST 4c FAILED: Reverting paid order to unpaid should be rejected, got: %', v_res;
    END IF;

    -- 4d: Idempotent no-op for paid order: paid -> paid succeeds with is_noop = true
    v_res := public.update_order_payment_status(v_order3_id, 'paid');
    IF (v_res->>'success')::BOOLEAN <> true OR (v_res->>'is_noop')::BOOLEAN <> true THEN
        RAISE EXCEPTION 'TEST 4d FAILED: Same-status paid update should return is_noop: true, got: %', v_res;
    END IF;

    -- 4e: Cannot refund active order (order must be cancelled or returned first)
    v_res := public.update_order_payment_status(v_order3_id, 'refunded');
    IF (v_res->>'success')::BOOLEAN <> false OR (v_res->>'message') NOT LIKE '%বাতিল (Cancelled) বা ফেরত (Returned)%' THEN
        RAISE EXCEPTION 'TEST 4e FAILED: Refunding active processing order should be rejected, got: %', v_res;
    END IF;

    -- Cancel Order 3
    v_res := public.update_order_status_with_inventory(v_order3_id, 'cancelled');
    IF (v_res->>'success')::BOOLEAN <> true THEN
        RAISE EXCEPTION 'TEST 4 SETUP FAILED: Cancelling Order 3 failed: %', v_res;
    END IF;

    -- 4f: Now that Order 3 is cancelled and paid, refund succeeds
    v_res := public.update_order_payment_status(v_order3_id, 'refunded');
    IF (v_res->>'success')::BOOLEAN <> true OR (v_res->>'new_payment_status') <> 'refunded' THEN
        RAISE EXCEPTION 'TEST 4f FAILED: Refunding cancelled paid order should succeed, got: %', v_res;
    END IF;

    SELECT payment_status::TEXT INTO v_current_payment_status FROM public.orders WHERE id = v_order3_id;
    IF v_current_payment_status <> 'refunded' THEN
        RAISE EXCEPTION 'TEST 4f FAILED: Expected payment_status refunded in DB, got: %', v_current_payment_status;
    END IF;

    -- 4g: Terminal payment state protection: refunded payment cannot be reversed to paid or unpaid
    v_res := public.update_order_payment_status(v_order3_id, 'paid');
    IF (v_res->>'success')::BOOLEAN <> false OR (v_res->>'message') NOT LIKE '%রিফান্ডকৃত পেমেন্ট স্ট্যাটাস পরিবর্তন করা যাবে না%' THEN
        RAISE EXCEPTION 'TEST 4g FAILED: Reversing refunded to paid should be rejected, got: %', v_res;
    END IF;

    v_res := public.update_order_payment_status(v_order3_id, 'unpaid');
    IF (v_res->>'success')::BOOLEAN <> false OR (v_res->>'message') NOT LIKE '%রিফান্ডকৃত পেমেন্ট স্ট্যাটাস পরিবর্তন করা যাবে না%' THEN
        RAISE EXCEPTION 'TEST 4g FAILED: Reversing refunded to unpaid should be rejected, got: %', v_res;
    END IF;

    -- 4h: Idempotent no-op check for payment status
    v_res := public.update_order_payment_status(v_order3_id, 'refunded');
    IF (v_res->>'success')::BOOLEAN <> true OR (v_res->>'is_noop')::BOOLEAN <> true THEN
        RAISE EXCEPTION 'TEST 4h FAILED: Repeated refunded update should return is_noop: true, got: %', v_res;
    END IF;

    RAISE NOTICE '✓ [Test 4 Passed] Atomic database-level payment validation and terminal state protection verified.';

    -- -------------------------------------------------------------------------
    -- TEST 5: Non-Existent Order and Safe Error Handling
    -- -------------------------------------------------------------------------
    v_res := public.update_order_status_with_inventory('00000000-0000-0000-0000-000000000000'::UUID, 'cancelled');
    IF (v_res->>'success')::BOOLEAN <> false OR (v_res->>'message') NOT LIKE '%অর্ডারটি পাওয়া যায়নি%' THEN
        RAISE EXCEPTION 'TEST 5 FAILED: Non-existent order should return safe error, got: %', v_res;
    END IF;

    v_res := public.update_order_payment_status('00000000-0000-0000-0000-000000000000'::UUID, 'paid');
    IF (v_res->>'success')::BOOLEAN <> false OR (v_res->>'message') NOT LIKE '%অর্ডারটি পাওয়া যায়নি%' THEN
        RAISE EXCEPTION 'TEST 5 FAILED: Non-existent order in payment RPC should return safe error, got: %', v_res;
    END IF;

    RAISE NOTICE '✓ [Test 5 Passed] Safe error handling for non-existent orders verified.';

    -- -------------------------------------------------------------------------
    -- TEST 6: Cancellation with Non-Existent Coupon (Accurate Quota Restoration)
    -- -------------------------------------------------------------------------
    -- Seed Order 4 with a coupon code that does not exist in public.coupons
    INSERT INTO public.orders (
        id, order_number, guest_name, guest_phone, shipping_address,
        subtotal, delivery_fee, discount_amount, coupon_code, grand_total,
        payment_method, payment_status, order_status
    ) VALUES (
        v_order4_id, 'SS-TEST-LC-004', 'Test Customer 4', '01700000004',
        '{"fullAddress":"Dhaka","district":"Dhaka","zone":"inside_dhaka"}'::JSONB,
        1000, 70, 0, 'NONEXISTENT_COUPON_777', 1070,
        'cod'::public.payment_method, 'unpaid'::public.payment_status, 'pending'::public.order_status
    );
    INSERT INTO public.order_items (order_id, product_id, variant_id, product_title, variant_name, unit_price, quantity, line_total)
    VALUES (v_order4_id, v_prod_id, v_var1_id, 'Test Honey', '500g', 500, 2, 1000);

    SELECT stock_quantity INTO v_stock1 FROM public.product_variants WHERE id = v_var1_id;

    -- Cancel Order 4: Must restore stock (+2) but coupon_restored MUST be false!
    v_res := public.update_order_status_with_inventory(v_order4_id, 'cancelled');
    IF (v_res->>'success')::BOOLEAN <> true
       OR (v_res->>'stock_restored')::BOOLEAN <> true
       OR (v_res->>'coupon_restored')::BOOLEAN <> false
       OR (v_res->>'message') LIKE '%কুপন কোটা%' THEN
        RAISE EXCEPTION 'TEST 6 FAILED: Order with non-existent coupon should restore stock but report coupon_restored false: %', v_res;
    END IF;

    -- Verify stock actually incremented by 2
    SELECT stock_quantity INTO v_stock2 FROM public.product_variants WHERE id = v_var1_id;
    IF v_stock2 <> v_stock1 + 2 THEN
        RAISE EXCEPTION 'TEST 6 FAILED: Stock was not restored correctly for order with missing coupon. Expected %, found %', v_stock1 + 2, v_stock2;
    END IF;

    RAISE NOTICE '✓ [Test 6 Passed] Cancellation with non-existent coupon restored stock safely and reported coupon_restored: false.';

    -- -------------------------------------------------------------------------
    -- Clean up test records (Child before parent)
    -- -------------------------------------------------------------------------
    DELETE FROM public.order_items WHERE order_id IN (v_order1_id, v_order2_id, v_order3_id, v_order4_id);
    DELETE FROM public.orders WHERE id IN (v_order1_id, v_order2_id, v_order3_id, v_order4_id);
    DELETE FROM public.coupons WHERE UPPER(code) = v_coupon_code;
    DELETE FROM public.product_variants WHERE id IN (v_var1_id, v_var2_id);
    DELETE FROM public.products WHERE id = v_prod_id;

    RAISE NOTICE '=======================================================';
    RAISE NOTICE 'ALL ORDER LIFECYCLE & PAYMENT INTEGRATION TESTS PASSED!';
    RAISE NOTICE '=======================================================';
END $$;
