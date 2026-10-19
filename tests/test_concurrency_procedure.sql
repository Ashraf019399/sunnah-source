-- ==============================================================================
-- Sunnah Source: Two-Session Concurrency Test Fixture Setup, Runbook & Verification
-- STRICT SAFETY RULE:
--   NEVER EXECUTE THIS SCRIPT ON PRODUCTION SUPABASE (fgfucwholpkizwlvlfrp).
--   ONLY EXECUTE ON A LOCAL TEST POSTGRESQL INSTANCE OR DEDICATED STAGING DB.
--
-- ==============================================================================
-- PREREQUISITES & ENVIRONMENT SAFETY
-- ==============================================================================
-- 1. Database Migrations Required:
--    - supabase/migrations/20261018_add_checkout_idempotency.sql
--    - supabase/migrations/20261019_add_order_lifecycle_management.sql
--    Both migrations MUST be applied to the target database before running this suite.
--
-- 2. DO NOT RERUN 00_base_schema.sql ON AN EXISTING DATABASE:
--    `supabase/test-only/00_base_schema.sql` is strictly designed for initializing
--    a completely BLANK / EMPTY test database. Rerunning it on an existing staging
--    or cloned database will fail on existing types/tables or disrupt active schemas.
--    This concurrency script relies on the existing schema and an active category.
--
-- 3. PERSISTENT CLIENT CONNECTION REQUIREMENT (CRITICAL):
--    Supabase Dashboard SQL Editor executes queries as stateless HTTP POST requests.
--    Each execution runs in an ephemeral backend transaction that commits immediately.
--    Therefore, you CANNOT hold an open transaction across separate clicks or browser
--    tabs in Supabase SQL Editor.
--    True PostgreSQL row-level concurrency testing REQUIRES two genuine, stateful,
--    persistent client connections:
--      Option A (Recommended): Two separate terminal tabs running `psql`.
--      Option B: Two separate SQL console tabs in GUI clients (e.g. TablePlus, DBeaver)
--                with "Manual Commit" / "Auto-Commit: OFF" enabled.
--
-- 4. CONNECTION MODE & CREDENTIAL SECURITY:
--    - Safe Connection Mode: Direct PostgreSQL connection or Session Pooler (port 5432).
--    - NEVER use Transaction Pooler (port 6543): Transaction pooling does not preserve
--      session state across multi-statement manual transactions and will break lock tests.
--    - Credential Safety: Never put database passwords into SQL scripts, shell scripts,
--      screenshots, or chat logs. Use interactive prompts (`psql ... -W`) or private
--      environment variables ($env:PGPASSWORD in PowerShell).
--
-- ==============================================================================
-- STOCK & COUPON ARITHMETIC INVARIANT SPECIFICATION
-- ==============================================================================
-- Variant Initial Stock = 20:
--   Chosen & Enforced Interpretation:
--   The initial `stock_quantity = 20` in `public.product_variants` represents the
--   CURRENTLY AVAILABLE, UNRESERVED warehouse inventory remaining on the shelf AFTER
--   Orders 1, 2, and 3 have already been placed and reserved their items:
--     - Order 1 reserved: 2 units
--     - Order 2 reserved: 1 unit
--     - Order 3 reserved: 3 units
--     - Total reserved across initial fixtures: 6 units
--     - Total warehouse inventory accounted: 20 available + 6 reserved = 26 units.
--
-- Trace of Concurrency Scenarios on Stock:
--   - Starting available stock: 20
--   - Scenario A: Order 1 cancelled -> restores +2 units  (available = 22)
--   - Scenario B: Order 2 cancelled -> restores +1 unit   (available = 23)
--   - Scenario C Session 1: Order 3 cancelled -> restores +3 units (available = 26)
--   - Scenario C Session 2: Order 4 checked out -> deducts -2 units (available = 24)
--   - Final Expected Available Stock: EXACTLY 24
--   - Total warehouse inventory conserved: 24 available + 2 reserved in Order 4 = 26 units.
--
-- Trace of Concurrency Scenarios on Coupon (TESTCONCUR100):
--   - Starting `times_used` = 2 (active fixtures Order 1 and Order 3 both use it)
--   - Scenario A: Order 1 cancelled -> usage decrements by 1 (times_used = 1)
--   - Scenario B: Order 2 cancelled (no coupon) -> unchanged (times_used = 1)
--   - Scenario C Session 1: Order 3 cancelled -> usage decrements by 1 (times_used = 0)
--   - Scenario C Session 2: Order 4 checked out -> usage increments by 1 (times_used = 1)
--   - Final Expected `times_used`: EXACTLY 1
--
-- FIXTURE IDENTIFIERS (Prefix 6666):
--   Product:  99999999-6666-6666-6666-666666666666
--   Variant:  88888888-6666-6666-6666-666666666661 (Base stock: 20)
--   Coupon:   TESTCONCUR100                          (times_used: 2, limit: 5)
--   Order 1:  11111111-6666-6666-6666-666666666661 (pending, unpaid, coupon, qty: 2)
--   Order 2:  11111111-6666-6666-6666-666666666662 (pending, unpaid, no coupon, qty: 1)
--   Order 3:  11111111-6666-6666-6666-666666666663 (confirmed, unpaid, coupon, qty: 3)
--   Order 4:  11111111-6666-6666-6666-666666666664 (created in Scenario C, qty: 2)
-- ==============================================================================


-- ==============================================================================
-- SECTION 1: SEED ISOLATED CONCURRENCY TEST FIXTURES
-- Run this block once before executing Session 1 & Session 2 tests.
-- (Can be executed in Supabase SQL Editor, psql, or any client)
-- ==============================================================================
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


-- ==============================================================================
-- SECTION 1.5: INTERACTIVE TWO-SESSION CONCURRENCY TEST RUNBOOK
-- ==============================================================================
-- INSTRUCTIONS FOR TESTER:
-- Open two persistent PostgreSQL client windows (e.g. Terminal 1 and Terminal 2 running psql).
-- Execute the statements in the exact order indicated below.
--
-- ------------------------------------------------------------------------------
-- SCENARIO A: Concurrent Duplicate Cancellation (Order 1)
-- Target: Order 1 (11111111-6666-6666-6666-666666666661, pending, qty: 2)
-- ------------------------------------------------------------------------------
--
-- Step A1: In Session 1, begin transaction and cancel Order 1 (DO NOT COMMIT YET):
--   BEGIN;
--   SELECT public.update_order_status_with_inventory(
--       '11111111-6666-6666-6666-666666666661'::UUID,
--       'cancelled'
--   );
--   -- Session 1 acquires row locks on orders, coupons, and product_variants.
--
-- Step A2: In Session 2, attempt simultaneous cancellation on the SAME order:
--   BEGIN;
--   SELECT public.update_order_status_with_inventory(
--       '11111111-6666-6666-6666-666666666661'::UUID,
--       'cancelled'
--   );
--   -- OBSERVE: Session 2 BLOCKS immediately, waiting for Session 1's lock on Order 1!
--
-- Step A3: In Session 1, commit transaction:
--   COMMIT;
--   -- Expected Result in Session 1:
--   -- {"success": true, "previous_status": "pending", "new_status": "cancelled", "stock_restored": true, "coupon_restored": true}
--
-- Step A4: In Session 2, observe immediate unblock and commit:
--   -- Session 2 unblocks as soon as Session 1 commits.
--   -- Expected Result in Session 2:
--   -- {"success": true, "is_noop": true, "old_status": "cancelled", "new_status": "cancelled", "stock_restored": false, "coupon_restored": false, "message": "অর্ডার ইতিমধ্যে এই স্ট্যাটাসে রয়েছে।"}
--   COMMIT;
--
-- Invariant Check A: Stock restored exactly ONCE (+2 -> stock 22). Coupon decremented ONCE (2 -> 1).
--
-- ------------------------------------------------------------------------------
-- SCENARIO B: Concurrent Cancellation vs Payment Status Update (Order 2)
-- Target: Order 2 (11111111-6666-6666-6666-666666666662, pending, unpaid, qty: 1)
-- ------------------------------------------------------------------------------
--
-- Step B1: In Session 1, begin transaction and cancel Order 2 (DO NOT COMMIT YET):
--   BEGIN;
--   SELECT public.update_order_status_with_inventory(
--       '11111111-6666-6666-6666-666666666662'::UUID,
--       'cancelled'
--   );
--   -- Session 1 holds row lock on Order 2.
--
-- Step B2: In Session 2, attempt to simultaneously mark Order 2 as 'paid':
--   BEGIN;
--   SELECT public.update_order_payment_status(
--       '11111111-6666-6666-6666-666666666662'::UUID,
--       'paid'
--   );
--   -- OBSERVE: Session 2 BLOCKS immediately waiting on Session 1's lock on Order 2!
--
-- Step B3: In Session 1, commit transaction:
--   COMMIT;
--   -- Expected Result in Session 1:
--   -- {"success": true, "previous_status": "pending", "new_status": "cancelled", "stock_restored": true, "coupon_restored": false}
--
-- Step B4: In Session 2, observe immediate unblock and result:
--   -- Session 2 unblocks upon Session 1 commit.
--   -- update_order_payment_status re-reads order_status, detects it is now 'cancelled',
--   -- and rejects marking as paid:
--   -- {"success": false, "message": "বাতিলকৃত বা ফেরতকৃত অর্ডারের পেমেন্ট পেইড হিসেবে চিহ্নিত করা যাবে না।"}
--   COMMIT;
--
-- Invariant Check B: Order 2 is cancelled, payment_status remains 'unpaid'. Stock restored +1 (stock 23).
--
-- ------------------------------------------------------------------------------
-- SCENARIO C: Concurrent Cancellation vs Checkout (Shared Variant & Shared Coupon)
-- Targets:
--   Order 3 (11111111-6666-6666-6666-666666666663, confirmed, coupon: TESTCONCUR100, qty: 3)
--   Order 4 (11111111-6666-6666-6666-666666666664, new checkout, coupon: TESTCONCUR100, qty: 2)
-- ------------------------------------------------------------------------------
--
-- Step C1: In Session 1, begin transaction and cancel Order 3 (DO NOT COMMIT YET):
--   BEGIN;
--   SELECT public.update_order_status_with_inventory(
--       '11111111-6666-6666-6666-666666666663'::UUID,
--       'cancelled'
--   );
--   -- Session 1 holds locks: Level 1 (Order 3) -> Level 2 (Coupon) -> Level 3 (Variant).
--
-- Step C2: In Session 2, simultaneously attempt checkout of Order 4 using same coupon & variant:
--   BEGIN;
--   SELECT public.create_order_with_inventory(
--       p_order_id => '11111111-6666-6666-6666-666666666664'::UUID,
--       p_order_number => 'SS-CONCUR-004',
--       p_guest_name => 'Customer D',
--       p_guest_phone => '01744444444',
--       p_shipping_address => '{"fullAddress":"Dhaka","district":"Dhaka","zone":"inside_dhaka"}'::JSONB,
--       p_subtotal => 1000,
--       p_delivery_fee => 70,
--       p_discount_amount => 100,
--       p_coupon_code => 'TESTCONCUR100',
--       p_grand_total => 970,
--       p_payment_method => 'cod',
--       p_payment_status => 'unpaid',
--       p_items => jsonb_build_array(
--           jsonb_build_object(
--               'product_id', '99999999-6666-6666-6666-666666666666'::UUID,
--               'variant_id', '88888888-6666-6666-6666-666666666661'::UUID,
--               'product_title', 'Concurrency Test Product',
--               'variant_name', '500g',
--               'unit_price', 500,
--               'quantity', 2,
--               'line_total', 1000
--           )
--       ),
--       p_idempotency_key => 'test_concur_idem_key_004'
--   );
--   -- OBSERVE: Session 2 BLOCKS on Coupon lock. Because both RPCs strictly acquire
--   -- Level 2 (coupons) BEFORE Level 3 (variants), deadlock (40P01) is IMPOSSIBLE.
--
-- Step C3: In Session 1, commit transaction:
--   COMMIT;
--   -- Order 3 cancellation completes: restores +3 stock (stock 26), decrements coupon (times_used 0).
--
-- Step C4: In Session 2, observe immediate unblock and commit:
--   -- Session 2 unblocks immediately, verifies coupon quota (0 < 5), verifies stock (26 >= 2),
--   -- decrements stock by 2 (stock 24), increments coupon by 1 (times_used 1), creates Order 4.
--   -- Expected Result in Session 2: {"success": true, "is_duplicate": false, "order_id": ...}
--   COMMIT;
--
-- Invariant Check C: Final stock is exactly 24. Final coupon times_used is exactly 1.
-- ==============================================================================


-- ==============================================================================
-- SECTION 2: POST-CONCURRENCY TEST VERIFICATION
-- Run this block after executing all 3 two-session scenarios to verify exact state.
-- (Can be executed in Supabase SQL Editor, psql, or any client)
-- ==============================================================================
DO $$
DECLARE
    v_var_id  UUID := '88888888-6666-6666-6666-666666666661'::UUID;
    v_ord1_id UUID := '11111111-6666-6666-6666-666666666661'::UUID;
    v_ord2_id UUID := '11111111-6666-6666-6666-666666666662'::UUID;
    v_ord3_id UUID := '11111111-6666-6666-6666-666666666663'::UUID;
    v_ord4_id UUID := '11111111-6666-6666-6666-666666666664'::UUID;
    v_coupon_code TEXT := 'TESTCONCUR100';

    v_stock INT;
    v_times_used INT;
    v_ord1_status TEXT;
    v_ord1_payment TEXT;
    v_ord2_status TEXT;
    v_ord2_payment TEXT;
    v_ord3_status TEXT;
    v_ord3_payment TEXT;
    v_ord4_status TEXT;
    v_ord4_payment TEXT;
BEGIN
    RAISE NOTICE '=======================================================';
    RAISE NOTICE 'VERIFYING POST-CONCURRENCY DATABASE INTEGRITY';
    RAISE NOTICE '=======================================================';

    -- 1. Check Order 1: Cancelled, Unpaid
    SELECT order_status::TEXT, payment_status::TEXT INTO v_ord1_status, v_ord1_payment FROM public.orders WHERE id = v_ord1_id;
    IF v_ord1_status <> 'cancelled' OR v_ord1_payment <> 'unpaid' THEN
        RAISE EXCEPTION 'VERIFICATION FAILED on Order 1: Expected cancelled/unpaid, got: % / %', v_ord1_status, v_ord1_payment;
    END IF;

    -- 2. Check Order 2: Cancelled, Unpaid (concurrent payment attempt was rejected)
    SELECT order_status::TEXT, payment_status::TEXT INTO v_ord2_status, v_ord2_payment FROM public.orders WHERE id = v_ord2_id;
    IF v_ord2_status <> 'cancelled' OR v_ord2_payment <> 'unpaid' THEN
        RAISE EXCEPTION 'VERIFICATION FAILED on Order 2: Expected cancelled/unpaid, got: % / %', v_ord2_status, v_ord2_payment;
    END IF;

    -- 3. Check Order 3: Cancelled, Unpaid
    SELECT order_status::TEXT, payment_status::TEXT INTO v_ord3_status, v_ord3_payment FROM public.orders WHERE id = v_ord3_id;
    IF v_ord3_status <> 'cancelled' OR v_ord3_payment <> 'unpaid' THEN
        RAISE EXCEPTION 'VERIFICATION FAILED on Order 3: Expected cancelled/unpaid, got: % / %', v_ord3_status, v_ord3_payment;
    END IF;

    -- 4. Check Order 4: Pending, Unpaid (Created by concurrent checkout)
    SELECT order_status::TEXT, payment_status::TEXT INTO v_ord4_status, v_ord4_payment FROM public.orders WHERE id = v_ord4_id;
    IF v_ord4_status <> 'pending' OR v_ord4_payment <> 'unpaid' THEN
        RAISE EXCEPTION 'VERIFICATION FAILED on Order 4: Expected pending/unpaid, got: % / %', v_ord4_status, v_ord4_payment;
    END IF;

    -- 5. Check Variant Stock Arithmetic:
    -- Starting available stock: 20
    -- Order 1 cancelled: +2  (Stock: 22)
    -- Order 2 cancelled: +1  (Stock: 23)
    -- Order 3 cancelled: +3  (Stock: 26)
    -- Order 4 checkout:  -2  (Stock: 24)
    -- Final expected available stock: exactly 24
    SELECT stock_quantity INTO v_stock FROM public.product_variants WHERE id = v_var_id;
    IF v_stock <> 24 THEN
        RAISE EXCEPTION 'VERIFICATION FAILED: Expected variant stock = 24, got: % (Stock was over- or under-restored!)', v_stock;
    END IF;

    -- 6. Check Coupon times_used Arithmetic:
    -- Starting times_used: 2
    -- Order 1 cancelled: -1  (times_used: 1)
    -- Order 3 cancelled: -1  (times_used: 0)
    -- Order 4 checkout:  +1  (times_used: 1)
    -- Final expected times_used: exactly 1
    SELECT times_used INTO v_times_used FROM public.coupons WHERE UPPER(code) = v_coupon_code;
    IF v_times_used <> 1 THEN
        RAISE EXCEPTION 'VERIFICATION FAILED: Expected coupon times_used = 1, got: %', v_times_used;
    END IF;

    RAISE NOTICE '✓ All concurrency verification assertions passed cleanly!';
    RAISE NOTICE '  Variant stock: % (exactly 24)', v_stock;
    RAISE NOTICE '  Coupon times_used: % (exactly 1)', v_times_used;
    RAISE NOTICE '  Orders 1, 2, 3: cancelled';
    RAISE NOTICE '  Order 4: pending';
END $$;


-- ==============================================================================
-- SECTION 3: CLEANUP / TEARDOWN CONCURRENCY TEST FIXTURES
-- Run this block after testing to leave the staging database completely clean.
-- (Can be executed in Supabase SQL Editor, psql, or any client)
-- ==============================================================================
DO $$
DECLARE
    v_prod_id UUID := '99999999-6666-6666-6666-666666666666'::UUID;
    v_var_id  UUID := '88888888-6666-6666-6666-666666666661'::UUID;
    v_ord_ids UUID[] := ARRAY[
        '11111111-6666-6666-6666-666666666661'::UUID,
        '11111111-6666-6666-6666-666666666662'::UUID,
        '11111111-6666-6666-6666-666666666663'::UUID,
        '11111111-6666-6666-6666-666666666664'::UUID
    ];
    v_coupon_code TEXT := 'TESTCONCUR100';
BEGIN
    RAISE NOTICE '=======================================================';
    RAISE NOTICE 'CLEANING UP CONCURRENCY TEST FIXTURES';
    RAISE NOTICE '=======================================================';

    -- Child before parent deletion
    DELETE FROM public.order_items WHERE order_id = ANY(v_ord_ids);
    DELETE FROM public.orders WHERE id = ANY(v_ord_ids) OR order_number IN ('SS-CONCUR-001', 'SS-CONCUR-002', 'SS-CONCUR-003', 'SS-CONCUR-004');
    DELETE FROM public.coupons WHERE UPPER(code) = v_coupon_code;
    DELETE FROM public.product_variants WHERE id = v_var_id;
    DELETE FROM public.products WHERE id = v_prod_id;

    RAISE NOTICE '✓ Concurrency test fixtures successfully cleaned up.';
END $$;
