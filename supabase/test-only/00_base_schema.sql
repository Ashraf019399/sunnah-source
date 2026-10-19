-- ==============================================================================
-- Sunnah Source: Test Environment Base Schema
-- File: supabase/test-only/00_base_schema.sql
--
-- PURPOSE:
--   Establishes the prerequisite core production schema (custom enum types,
--   core tables, constraints, foreign keys, indexes, triggers, RLS, and grants)
--   on an empty PostgreSQL / Supabase test database (e.g., sunnah-source-test).
--
-- VERIFIED PRODUCTION SCHEMA SPECIFICATIONS:
--   1. `categories`: includes `id`, nullable `parent_id` (self-referencing with
--      ON DELETE SET NULL), `name_en`, `name_bn`, unique `slug`, `tagline_bn`,
--      `description_bn`, `sourcing_origin_bn`, `purity_promise_bn`, `image_url`,
--      `display_order`, `is_active`, `meta_title VARCHAR(255)`, `meta_description TEXT`,
--      and `created_at`. Strictly omits `updated_at` (no repository evidence).
--      Fixtures use ON CONFLICT (slug) DO NOTHING.
--   2. `products`: `category_id` is NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT.
--      `category_slug` is VARCHAR(100) NOT NULL.
--      Includes `title_en`, `title_bn`, unique `slug`, optional badge, origin,
--      descriptions, storage_info, lab_report_url, nullable `ingredients TEXT[]`,
--      rating_average, review_count, flags (`is_active`, `is_featured`, `is_combo`),
--      metadata, and timestamps. Strictly omits `base_price` and `images`.
--   3. `product_variants`: `product_id` REFERENCES public.products(id) ON DELETE CASCADE.
--      Includes `sku`, `display_name`, `weight_value`, `weight_unit`, `regular_price`,
--      nullable `sale_price` and `cost_price`, `stock_quantity`, `low_stock_threshold`,
--      `is_default`, and `created_at`. Strictly omits `is_active` and `updated_at`.
--   4. `orders`: includes `user_id` (UUID NULL), guest_name, guest_phone, JSON shipping_address,
--      financials, coupon_code, payment_method/status, order_status,
--      `courier_partner VARCHAR(100)`, `courier_tracking_code VARCHAR(100)`,
--      `admin_notes TEXT`, `customer_notes TEXT`, and timestamps.
--      Conditional FK to public.users(id) ON DELETE SET NULL if public.users exists;
--      does NOT invent an unverified public.users schema.
--   5. `order_items`: `order_id` REFERENCES orders(id) ON DELETE CASCADE.
--      `product_id` and `variant_id` are NOT NULL with ON DELETE RESTRICT.
--      `variant_name` is NOT NULL.
--   6. Production Enum types:
--      - `discount_type`: 'percentage', 'fixed_amount', 'free_shipping'
--      - `payment_method`: 'cod', 'bkash', 'nagad', 'sslcommerz', 'bank_transfer'
--      - `payment_status`: 'unpaid', 'paid', 'refunded'
--      - `order_status`: 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'
--   7. Preserves migration boundary: does NOT create `coupons` or `store_settings`
--      (created by 20261017 migrations), and does NOT add `idempotency_key` or `request_hash`
--      (added by 20261018 migration).
--
-- EXECUTION ORDER ON A FRESH TEST DATABASE:
--   Step 1: supabase/test-only/00_base_schema.sql (THIS FILE)
--   Step 2: supabase/migrations/20261017_create_coupons_table.sql
--   Step 3: supabase/migrations/20261017_create_store_settings_table.sql
--   Step 4: supabase/migrations/20261018_add_checkout_idempotency.sql
--   Step 5: supabase/migrations/20261019_add_order_lifecycle_management.sql
--   Step 6: tests/test_idempotency_workflow.sql (Validation test suite)
--   Step 7: tests/test_order_lifecycle_workflow.sql (Order lifecycle & payment test suite)
--   Step 8: tests/test_concurrency_procedure.sql (Interactive two-session concurrency test suite)
-- ==============================================================================

-- 0. Required Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. Custom Enum Types
-- ==============================================================================

-- Discount type enum: Required by migration 20261017_create_coupons_table.sql
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t
        JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE n.nspname = 'public' AND t.typname = 'discount_type'
    ) THEN
        CREATE TYPE public.discount_type AS ENUM (
            'percentage',
            'fixed_amount',
            'free_shipping'
        );
    END IF;
END $$;

-- Payment method enum: Supported checkout gateways in Production
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t
        JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE n.nspname = 'public' AND t.typname = 'payment_method'
    ) THEN
        CREATE TYPE public.payment_method AS ENUM (
            'cod',
            'bkash',
            'nagad',
            'sslcommerz',
            'bank_transfer'
        );
    END IF;
END $$;

-- Payment status enum: Lifecycle status of order payment
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t
        JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE n.nspname = 'public' AND t.typname = 'payment_status'
    ) THEN
        CREATE TYPE public.payment_status AS ENUM (
            'unpaid',
            'paid',
            'refunded'
        );
    END IF;
END $$;

-- Order status enum: Order fulfillment lifecycle
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t
        JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE n.nspname = 'public' AND t.typname = 'order_status'
    ) THEN
        CREATE TYPE public.order_status AS ENUM (
            'pending',
            'confirmed',
            'processing',
            'shipped',
            'delivered',
            'cancelled',
            'returned'
        );
    END IF;
END $$;

-- ==============================================================================
-- 2. Core Tables
-- ==============================================================================

-- 2.1 Categories Table & Initial Catalog Fixtures
-- Verified schema: includes parent_id self-reference, SEO meta fields, and created_at.
-- Strictly omits updated_at (no repository evidence).
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID NULL REFERENCES public.categories(id) ON DELETE SET NULL,
    name_en TEXT NOT NULL,
    name_bn TEXT NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    tagline_bn TEXT NULL,
    description_bn TEXT NULL,
    sourcing_origin_bn TEXT NULL,
    purity_promise_bn TEXT NULL,
    image_url TEXT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    meta_title VARCHAR(255) NULL,
    meta_description TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON public.categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_display_order ON public.categories(display_order);

-- Seed core categories fixtures safely using DO NOTHING to never alter pre-existing categories
INSERT INTO public.categories (id, slug, name_en, name_bn, tagline_bn, description_bn, display_order, is_active)
VALUES
    (
        '11111111-0000-0000-0000-000000000001'::UUID,
        'honey',
        'Raw Honey',
        'প্রাকৃতিক চাকের মধু',
        'সুন্দরবন ও প্রত্যন্ত অঞ্চলের ১০০% অপরিশোধিত কাঁচা মধু',
        'আমাদের মধু কোনো প্রকার কৃত্রিম উত্তাপ বা প্রক্রিয়াজাতকরণ ছাড়াই সংগৃহীত।',
        1,
        true
    ),
    (
        '11111111-0000-0000-0000-000000000002'::UUID,
        'ghee-oil',
        'Ghee & Cold-Pressed Oils',
        'গাওয়া ঘি ও কোল্ড-প্রেসড তেল',
        'প্রথাগত কাঠের ঘানি ও বিলোনা পদ্ধতিতে তৈরি আসল তেল ও ঘি',
        'দেশি গরুর দুধের মাখন থেকে তৈরি সুবাসিত বিলোনা ঘি।',
        2,
        true
    ),
    (
        '11111111-0000-0000-0000-000000000003'::UUID,
        'dates',
        'Premium Dates',
        'প্রিমিয়াম খেজুর',
        'মদিনা মনোয়ারা ও মধ্যপ্রাচ্যের বাগান থেকে বাছাইকৃত তাজা খেজুর',
        'মদিনার বিখ্যাত আজওয়া, মেদজুল ও আম্বার খেজুর।',
        3,
        true
    )
ON CONFLICT (slug) DO NOTHING;

-- 2.2 Products Table
-- Production schema: category_id NOT NULL with ON DELETE RESTRICT; category_slug NOT NULL.
-- Includes detailed descriptions, storage, lab_report, ingredients, metadata, and timestamps.
-- Strictly omits base_price and images.
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
    category_slug VARCHAR(100) NOT NULL,
    title_en TEXT NOT NULL,
    title_bn TEXT NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    badge VARCHAR(100) NULL,
    origin_source TEXT NULL,
    short_description_en TEXT NULL,
    short_description_bn TEXT NULL,
    full_description_en TEXT NULL,
    full_description_bn TEXT NULL,
    storage_info TEXT NULL,
    lab_report_url TEXT NULL,
    ingredients TEXT[] NULL,
    rating_average NUMERIC(3, 2) NOT NULL DEFAULT 5.00 CHECK (rating_average >= 0 AND rating_average <= 5.00),
    review_count INTEGER NOT NULL DEFAULT 0 CHECK (review_count >= 0),
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    is_combo BOOLEAN NOT NULL DEFAULT false,
    meta_title VARCHAR(255) NULL,
    meta_description TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_category_slug ON public.products(category_slug);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(is_active);

-- 2.3 Product Variants Table
-- Production schema: includes cost_price and created_at.
-- Holds atomic stock_quantity, locked FOR UPDATE during checkout RPC.
-- Strictly omits is_active and updated_at.
CREATE TABLE IF NOT EXISTS public.product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    sku VARCHAR(100) NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    weight_value NUMERIC(10, 2) NULL,
    weight_unit VARCHAR(20) NULL,
    regular_price NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (regular_price >= 0),
    sale_price NUMERIC(10, 2) NULL CHECK (sale_price IS NULL OR sale_price >= 0),
    cost_price NUMERIC(10, 2) NULL CHECK (cost_price IS NULL OR cost_price >= 0),
    stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    low_stock_threshold INTEGER NOT NULL DEFAULT 5 CHECK (low_stock_threshold >= 0),
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_stock ON public.product_variants(stock_quantity);
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON public.product_variants(sku);

-- 2.4 Orders Table
-- Header table for customer guest/user orders.
-- Uses verified courier_partner and courier_tracking_code columns.
-- Note: idempotency_key and request_hash are intentionally omitted here
-- and added via migration 20261018_add_checkout_idempotency.sql.
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(50) NOT NULL UNIQUE,
    user_id UUID NULL,
    guest_name TEXT NOT NULL,
    guest_phone VARCHAR(20) NOT NULL,
    shipping_address JSONB NOT NULL,
    subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
    delivery_fee NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (delivery_fee >= 0),
    discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
    coupon_code VARCHAR(50) NULL,
    grand_total NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (grand_total >= 0),
    payment_method public.payment_method NOT NULL DEFAULT 'cod',
    payment_status public.payment_status NOT NULL DEFAULT 'unpaid',
    order_status public.order_status NOT NULL DEFAULT 'pending',
    courier_partner VARCHAR(100) NULL,
    courier_tracking_code VARCHAR(100) NULL,
    admin_notes TEXT NULL,
    customer_notes TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Production dependency note: orders.user_id references public.users(id) ON DELETE SET NULL.
-- In an empty test project without public.users, the constraint is attached conditionally
-- to avoid inventing an unverified public.users schema.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'users'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE table_schema = 'public' AND table_name = 'orders' AND constraint_name = 'fk_orders_public_users'
        ) THEN
            ALTER TABLE public.orders
                ADD CONSTRAINT fk_orders_public_users FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;
        END IF;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_guest_phone ON public.orders(guest_phone);
CREATE INDEX IF NOT EXISTS idx_orders_order_status ON public.orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);

-- 2.5 Order Items Table
-- Verified schema: product_id and variant_id are NOT NULL with ON DELETE RESTRICT.
-- variant_name is NOT NULL.
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE RESTRICT,
    product_title TEXT NOT NULL,
    variant_name TEXT NOT NULL,
    unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    line_total NUMERIC(10, 2) NOT NULL CHECK (line_total >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_variant_id ON public.order_items(variant_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);

-- ==============================================================================
-- 3. Timestamp Update Triggers
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_base_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_products_updated_at ON public.products;
CREATE TRIGGER trg_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_base_updated_at();

DROP TRIGGER IF EXISTS trg_orders_updated_at ON public.orders;
CREATE TRIGGER trg_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_base_updated_at();

-- ==============================================================================
-- 4. Row Level Security (RLS) & Role Privileges
-- ==============================================================================

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Grant complete privileges to postgres superuser and Supabase service_role
GRANT ALL ON TABLE public.categories TO postgres, service_role;
GRANT ALL ON TABLE public.products TO postgres, service_role;
GRANT ALL ON TABLE public.product_variants TO postgres, service_role;
GRANT ALL ON TABLE public.orders TO postgres, service_role;
GRANT ALL ON TABLE public.order_items TO postgres, service_role;

-- Allow public read access to catalog categories, products, and variants
GRANT SELECT ON TABLE public.categories TO anon, authenticated;
GRANT SELECT ON TABLE public.products TO anon, authenticated;
GRANT SELECT ON TABLE public.product_variants TO anon, authenticated;

-- Strictly prevent public mutations on catalog
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public.categories FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public.products FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public.product_variants FROM anon, authenticated;

-- Revoke direct public access to orders and order_items (created via SECURITY DEFINER RPC only)
REVOKE ALL ON TABLE public.orders FROM anon, authenticated;
REVOKE ALL ON TABLE public.order_items FROM anon, authenticated;

-- Policies for categories, products, and product_variants
DROP POLICY IF EXISTS "Public can view active categories" ON public.categories;
CREATE POLICY "Public can view active categories"
    ON public.categories
    FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Public can view active products" ON public.products;
CREATE POLICY "Public can view active products"
    ON public.products
    FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Public can view active product variants" ON public.product_variants;
CREATE POLICY "Public can view active product variants"
    ON public.product_variants
    FOR SELECT
    USING (true);

-- Policies for orders and order_items (service_role managed)
DROP POLICY IF EXISTS "Service role has full access to orders" ON public.orders;
CREATE POLICY "Service role has full access to orders"
    ON public.orders
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Service role has full access to order_items" ON public.order_items;
CREATE POLICY "Service role has full access to order_items"
    ON public.order_items
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
