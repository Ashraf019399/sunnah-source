-- ==============================================================================
-- Migration: Grant SELECT Permissions on Orders & Order Items to service_role
-- Date: 2026-10-20
-- Description:
--   Resolves PostgreSQL error 42501 ("permission denied for table orders")
--   when administrative service-role client queries orders for customer tracking.
-- ==============================================================================

-- 1. Grant table-level SELECT privileges to service_role and postgres
GRANT SELECT ON TABLE public.orders TO postgres, service_role;
GRANT SELECT ON TABLE public.order_items TO postgres, service_role;

-- 2. Ensure RLS policies allow service_role SELECT access
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'orders' AND policyname = 'Service role can select orders'
    ) THEN
        CREATE POLICY "Service role can select orders"
            ON public.orders FOR SELECT TO service_role USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'order_items' AND policyname = 'Service role can select order_items'
    ) THEN
        CREATE POLICY "Service role can select order_items"
            ON public.order_items FOR SELECT TO service_role USING (true);
    END IF;
END $$;

-- 3. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
