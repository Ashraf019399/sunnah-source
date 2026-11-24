-- ==============================================================================
-- Migration: Add Client IP, Rate Limiting & Meta CAPI Tracking Columns
-- Date: 2026-11-24
-- Description:
--   1. Adds `client_ip VARCHAR(64)` to `public.orders` for 24-hour IP rate limiting.
--   2. Adds `fraud_flags JSONB DEFAULT '{}'::jsonb` to track spam scores or bot signals.
--   3. Adds `facebook_pixel_fired BOOLEAN DEFAULT false` for Meta Conversions API (CAPI)
--      deduplication after phone confirmation.
--   4. Creates composite indexes for fast 24-hour window queries on phone and IP.
-- ==============================================================================

-- 1. Add columns to public.orders if not exists
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS client_ip VARCHAR(64);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS fraud_flags JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS facebook_pixel_fired BOOLEAN DEFAULT false;

-- 2. Fast composite indexes for 24-hour rate limit checks
CREATE INDEX IF NOT EXISTS idx_orders_phone_created_at
    ON public.orders (guest_phone, created_at DESC)
    WHERE order_status != 'cancelled';

CREATE INDEX IF NOT EXISTS idx_orders_ip_created_at
    ON public.orders (client_ip, created_at DESC)
    WHERE client_ip IS NOT NULL AND order_status != 'cancelled';
