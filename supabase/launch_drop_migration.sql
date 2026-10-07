-- ─── Migration: Launch Drop ──────────────────────────────────────────────────
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/aznyqrhjdvbhqsmdfnpt/sql/new

-- 1. Add new columns to products
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS original_price NUMERIC(10,2) NULL,
  ADD COLUMN IF NOT EXISTS is_drop_offer  BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Add is_drop_item flag to order_items (for counting paid drop orders)
ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS is_drop_item BOOLEAN NOT NULL DEFAULT FALSE;

-- 3. RPC: count paid drop orders (used by stock ticker + API guard)
CREATE OR REPLACE FUNCTION public.get_drop_order_count()
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COUNT(DISTINCT oi.order_id)::INTEGER
  FROM public.order_items oi
  JOIN public.orders o ON o.id = oi.order_id
  WHERE oi.is_drop_item = TRUE
    AND o.payment_status = 'paid';
$$;

-- 4. Enable Realtime on orders table (run once)
-- Go to Supabase Dashboard → Database → Replication → enable orders table
-- OR run:
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

-- 5. Seed / upsert products
-- Clear old seed products first (optional — comment out if you want to keep existing)
-- DELETE FROM public.products WHERE name IN ('Farm Eggs','Full Cream Milk','White Bread','Brown Bread','Butter','Curd');

-- Hero drop item
INSERT INTO public.products (name, category, description, price, original_price, unit, is_in_stock, is_drop_offer)
VALUES (
  'Veg Cheese Pizza',
  'Pizza',
  'Freshly baked 7-inch Veg Cheese Pizza delivered straight to your door in Tiptur.',
  129, 199, '7-inch', TRUE, TRUE
)
ON CONFLICT DO NOTHING;

-- Standard menu
INSERT INTO public.products (name, category, description, price, unit, is_in_stock, is_drop_offer)
VALUES
  ('Classic Veg Burger',      'Burgers',    'Crispy veg patty with fresh veggies & sauces',  89, '1 pc',    TRUE, FALSE),
  ('Cheese Grilled Sandwich', 'Sandwiches', 'Golden grilled sandwich loaded with cheese',     79, '2 slices',TRUE, FALSE),
  ('Peri-Peri French Fries',  'Snacks',     'Crispy fries tossed in peri-peri seasoning',     69, 'Regular', TRUE, FALSE),
  ('Chilled Cold Drink',      'Beverages',  'Chilled refreshing cold drink',                  40, '250 ml',  TRUE, FALSE)
ON CONFLICT DO NOTHING;

-- 6. Admin RLS for new columns (already covered by existing admin policies)
-- No changes needed — existing "Admin update products" policy covers new columns.
