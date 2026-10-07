-- Enable PostGIS for spatial distance queries
create extension if not exists postgis;

-- ─── service_zones ───────────────────────────────────────────────────────────
create table public.service_zones (
  id          uuid primary key default gen_random_uuid(),
  city_name   text not null,
  center_lat  double precision not null,
  center_lng  double precision not null,
  radius_km   double precision not null,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

alter table public.service_zones enable row level security;
create policy "Public read service_zones" on public.service_zones for select using (true);
create policy "Admin manage zones" on public.service_zones for all using (auth.role() = 'authenticated');

-- ─── products ────────────────────────────────────────────────────────────────
create table public.products (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  category    text not null default 'Essentials',  -- 'Essentials' | 'Bakery' | 'Pizza & Snacks'
  description text,
  price       numeric(10,2) not null check (price >= 0),
  unit        text not null,
  image_url   text,
  is_in_stock boolean not null default true,
  created_at  timestamptz not null default now()
);

alter table public.products enable row level security;
create policy "Public read products" on public.products for select using (true);
create policy "Admin manage products" on public.products for all using (auth.role() = 'authenticated');

-- ─── orders ──────────────────────────────────────────────────────────────────
create table public.orders (
  id                  uuid primary key default gen_random_uuid(),
  order_number        serial unique,
  customer_name       text not null,
  phone_number        text not null,
  address_notes       text not null,
  delivery_lat        double precision not null,
  delivery_lng        double precision not null,
  total_amount        numeric(10,2) not null check (total_amount >= 0),
  payment_status      text not null default 'pending' check (payment_status in ('pending','paid','failed')),
  razorpay_order_id   text,
  razorpay_payment_id text,
  order_status        text not null default 'placed' check (order_status in ('placed','preparing','out_for_delivery','delivered')),
  created_at          timestamptz not null default now()
);

alter table public.orders enable row level security;
create policy "Public insert orders" on public.orders for insert with check (true);
create policy "Public read orders" on public.orders for select using (true);
create policy "Admin manage orders" on public.orders for all using (auth.role() = 'authenticated');

-- ─── order_items ─────────────────────────────────────────────────────────────
create table public.order_items (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.orders(id) on delete cascade,
  product_id  uuid not null references public.products(id),
  quantity    int not null check (quantity > 0),
  unit_price  numeric(10,2) not null
);

alter table public.order_items enable row level security;
create policy "Public insert order_items" on public.order_items for insert with check (true);
create policy "Public read order_items" on public.order_items for select using (true);
create policy "Admin manage order_items" on public.order_items for all using (auth.role() = 'authenticated');

-- ─── check_delivery_zone (PostGIS) ───────────────────────────────────────────
create or replace function public.check_delivery_zone(
  user_lat double precision,
  user_lng double precision
)
returns table(zone_id uuid, city_name text)
language sql
stable
security definer
as $$
  select id, city_name
  from public.service_zones
  where is_active = true
    and ST_DistanceSphere(
          ST_MakePoint(center_lng, center_lat),
          ST_MakePoint(user_lng, user_lat)
        ) / 1000.0 <= radius_km
  limit 1;
$$;

-- ─── seed data ───────────────────────────────────────────────────────────────
insert into public.service_zones (city_name, center_lat, center_lng, radius_km)
values ('Tiptur', 13.2575, 76.4800, 4.0);

insert into public.products (name, category, description, price, unit, is_in_stock) values
  ('Nandini Full Cream Milk', 'Essentials', 'Karnataka Co-op fresh milk',        28.00, '500 ml',    true),
  ('Farm Eggs',               'Essentials', 'Fresh local farm eggs',              72.00, 'Pack of 6', true),
  ('Fresh Curd',              'Essentials', 'Thick homemade-style curd',          25.00, '500 ml',    true),
  ('White Bread',             'Bakery',     'Soft sliced white bread',            40.00, 'Loaf',      true),
  ('Brown Bread',             'Bakery',     'Whole wheat brown bread',            45.00, 'Loaf',      true),
  ('Butter',                  'Essentials', 'Salted butter',                      55.00, '100 g',     true),
  ('Margherita Pizza',        'Pizza & Snacks', 'Fresh tomato, mozzarella',      119.00, '7-inch',    true),
  ('Veg Loaded Pizza',        'Pizza & Snacks', 'Capsicum, onion, corn, cheese', 139.00, '7-inch',    true);
