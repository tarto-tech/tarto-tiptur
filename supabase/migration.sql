-- Enable extensions
create extension if not exists cube;
create extension if not exists earthdistance;

-- ─── service_zones ───────────────────────────────────────────────────────────
create table public.service_zones (
  id            uuid primary key default gen_random_uuid(),
  city_name     text not null,
  center_lat    double precision not null,
  center_lng    double precision not null,
  radius_km     double precision not null,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

alter table public.service_zones enable row level security;
create policy "Public read service_zones" on public.service_zones
  for select using (true);

-- ─── products ────────────────────────────────────────────────────────────────
create table public.products (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  price       numeric(10,2) not null check (price >= 0),
  unit        text not null,
  image_url   text,
  in_stock    boolean not null default true,
  created_at  timestamptz not null default now()
);

alter table public.products enable row level security;
create policy "Public read products" on public.products
  for select using (true);

-- ─── orders ──────────────────────────────────────────────────────────────────
create type order_status as enum (
  'new', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'
);

create table public.orders (
  id                    uuid primary key default gen_random_uuid(),
  customer_name         text not null,
  customer_phone        text not null,
  delivery_lat          double precision not null,
  delivery_lng          double precision not null,
  delivery_address_text text not null,
  service_zone_id       uuid not null references public.service_zones(id),
  items                 jsonb not null,
  total_amount          numeric(10,2) not null check (total_amount >= 0),
  status                order_status not null default 'new',
  created_at            timestamptz not null default now()
);

alter table public.orders enable row level security;
-- Anyone can insert an order (customer placing order)
create policy "Public insert orders" on public.orders
  for insert with check (true);
-- Anyone can read their own order by id (used on confirmation page)
create policy "Public read orders by id" on public.orders
  for select using (true);

-- ─── is_within_service_zone ──────────────────────────────────────────────────
create or replace function public.is_within_service_zone(
  lat double precision,
  lng double precision
)
returns uuid
language sql
stable
security definer
as $$
  select id
  from public.service_zones
  where is_active = true
    and (earth_distance(
          ll_to_earth(center_lat, center_lng),
          ll_to_earth(lat, lng)
        ) / 1000.0) <= radius_km
  limit 1;
$$;

-- ─── seed data ───────────────────────────────────────────────────────────────
insert into public.service_zones (city_name, center_lat, center_lng, radius_km)
values ('Tiptur', 13.2563, 76.4762, 8.0);

insert into public.products (name, description, price, unit, in_stock) values
  ('Farm Eggs',    'Fresh local farm eggs',          72.00,  'dozen',  true),
  ('Full Cream Milk', 'Fresh full cream milk',        28.00,  'litre',  true),
  ('White Bread',  'Soft sliced white bread loaf',   40.00,  'loaf',   true),
  ('Brown Bread',  'Whole wheat brown bread loaf',   45.00,  'loaf',   true),
  ('Butter',       'Salted butter',                  55.00,  '100g',   true),
  ('Curd',         'Fresh homemade-style curd',      25.00,  '500ml',  true);

-- ─── Admin RLS policies ──────────────────────────────────────────────────────
-- Run these in the Supabase SQL editor AFTER creating your admin user.
-- Replace the email below with your actual admin email if you want to restrict
-- by email; or leave as `auth.role() = 'authenticated'` since only you will
-- have an account in this project.

-- orders: admin can update status
create policy "Admin update orders" on public.orders
  for update using (auth.role() = 'authenticated');

-- products: admin can insert, update, delete
create policy "Admin insert products" on public.products
  for insert with check (auth.role() = 'authenticated');

create policy "Admin update products" on public.products
  for update using (auth.role() = 'authenticated');

create policy "Admin delete products" on public.products
  for delete using (auth.role() = 'authenticated');

-- service_zones: admin can insert, update, delete
create policy "Admin insert zones" on public.service_zones
  for insert with check (auth.role() = 'authenticated');

create policy "Admin update zones" on public.service_zones
  for update using (auth.role() = 'authenticated');

create policy "Admin delete zones" on public.service_zones
  for delete using (auth.role() = 'authenticated');
