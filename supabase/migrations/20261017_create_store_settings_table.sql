-- ==============================================================================
-- Migration: Create store_settings table for dynamic delivery charges & rules
-- Created At: 2026-10-17
-- Description:
--   Creates a persistent singleton table `store_settings` to manage:
--     1. inside_dhaka_delivery_fee (default: 70 BDT)
--     2. outside_dhaka_delivery_fee (default: 130 BDT)
--     3. free_delivery_threshold (default: 2000 BDT)
--   Configures RLS policies to allow public read access (for checkout calculation)
--   and strictly restricts write/update access to authorized admins.
-- ==============================================================================

-- 1. Create table with non-negative constraints
CREATE TABLE IF NOT EXISTS public.store_settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    inside_dhaka_delivery_fee NUMERIC(10, 2) NOT NULL DEFAULT 70.00 CHECK (inside_dhaka_delivery_fee >= 0),
    outside_dhaka_delivery_fee NUMERIC(10, 2) NOT NULL DEFAULT 130.00 CHECK (outside_dhaka_delivery_fee >= 0),
    free_delivery_threshold NUMERIC(10, 2) NOT NULL DEFAULT 2000.00 CHECK (free_delivery_threshold >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by TEXT
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- 3. Grant minimal table privileges
-- Public roles (anon & authenticated) only have read permission.
-- Zero public write permissions: INSERT, UPDATE, DELETE are strictly revoked.
GRANT SELECT ON public.store_settings TO anon, authenticated;
GRANT ALL ON public.store_settings TO service_role;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.store_settings FROM anon, authenticated;

-- 4. RLS Policies

-- Public Read: Storefront & checkout can read store delivery settings
DROP POLICY IF EXISTS "Public can view store settings" ON public.store_settings;
CREATE POLICY "Public can view store settings"
    ON public.store_settings
    FOR SELECT
    USING (true);

-- Disallow client-side mutations; allow only service_role (via admin-guarded server actions)
DROP POLICY IF EXISTS "Admins can update store settings" ON public.store_settings;
DROP POLICY IF EXISTS "Admins can insert store settings" ON public.store_settings;
DROP POLICY IF EXISTS "Service role can manage store settings" ON public.store_settings;
CREATE POLICY "Service role can manage store settings"
    ON public.store_settings
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- 5. Seed initial row idempotently with verified defaults
INSERT INTO public.store_settings (
    id,
    inside_dhaka_delivery_fee,
    outside_dhaka_delivery_fee,
    free_delivery_threshold,
    updated_at
)
VALUES (
    'default',
    70.00,
    130.00,
    2000.00,
    now()
)
ON CONFLICT (id) DO UPDATE
SET
    updated_at = now();

COMMENT ON TABLE public.store_settings IS 'Persistent configuration for store-wide delivery charges, free delivery thresholds, and operational settings.';
