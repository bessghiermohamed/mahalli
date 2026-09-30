-- ============================================================================
-- Mahalli (محلي) — Initial schema
-- Arabic-first mini-store platform for Algerian small businesses
-- Apply with: supabase db push  (or paste into Supabase SQL Editor)
-- ============================================================================

create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- profiles
-- ----------------------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.profiles is 'Extended profile for authenticated sellers (1:1 with auth.users).';

-- ----------------------------------------------------------------------------
-- stores
-- ----------------------------------------------------------------------------
create table public.stores (
  id                  uuid primary key default gen_random_uuid(),
  owner_id            uuid not null unique references public.profiles (id) on delete cascade,
  name                text not null,
  slug                text not null unique,
  logo_url            text,
  bio                 text,
  whatsapp            text not null,
  instagram           text,
  facebook            text,
  default_delivery_fee numeric(10,2) check (default_delivery_fee is null or default_delivery_fee >= 0),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint stores_slug_shape check (slug ~ '^(?!-)[a-z0-9\u0600-\u06FF]+(-[a-z0-9\u0600-\u06FF]+)*(?<!-)$')
);

comment on column public.stores.default_delivery_fee is 'Fallback fee used when a wilaya has no store-specific override. NULL falls back to the wilaya default.';

-- ----------------------------------------------------------------------------
-- wilayas (all 58 Algerian wilayas, seeded in 0002_seed.sql)
-- ----------------------------------------------------------------------------
create table public.wilayas (
  id                   smallint primary key,
  code                 smallint not null unique check (code between 1 and 58),
  name_ar              text not null,
  name_fr              text not null,
  default_delivery_fee numeric(10,2) not null default 600 check (default_delivery_fee >= 0)
);

-- ----------------------------------------------------------------------------
-- store_delivery_fees — per-wilaya overrides (future: delivery providers)
-- ----------------------------------------------------------------------------
create table public.store_delivery_fees (
  id         uuid primary key default gen_random_uuid(),
  store_id   uuid not null references public.stores (id) on delete cascade,
  wilaya_id  smallint not null references public.wilayas (id) on delete cascade,
  fee        numeric(10,2) not null check (fee >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, wilaya_id)
);

-- ----------------------------------------------------------------------------
-- products
-- ----------------------------------------------------------------------------
create table public.products (
  id          uuid primary key default gen_random_uuid(),
  store_id    uuid not null references public.stores (id) on delete cascade,
  name        text not null,
  slug        text not null,
  description text,
  price       numeric(10,2) not null check (price >= 0),
  stock       smallint check (stock is null or stock >= 0),  -- NULL = untracked stock
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (store_id, slug)
);

-- ----------------------------------------------------------------------------
-- product_images
-- ----------------------------------------------------------------------------
create table public.product_images (
  id           uuid primary key default gen_random_uuid(),
  product_id   uuid not null references public.products (id) on delete cascade,
  storage_path text not null,
  public_url   text not null,
  sort_order   smallint not null default 0,
  created_at   timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- orders (cash-on-delivery)
-- ----------------------------------------------------------------------------
create table public.orders (
  id                uuid primary key default gen_random_uuid(),
  order_number      text not null unique,
  store_id          uuid not null references public.stores (id) on delete cascade,
  customer_name     text not null,
  customer_phone    text not null,
  wilaya_id         smallint not null references public.wilayas (id),
  commune           text not null,
  address           text not null,
  notes             text,
  subtotal          numeric(12,2) not null check (subtotal >= 0),
  delivery_fee      numeric(10,2) not null check (delivery_fee >= 0),
  total             numeric(12,2) not null check (total >= 0),
  status            text not null default 'new'
                    check (status in ('new','confirmed','shipped','delivered','cancelled')),
  client_request_id uuid,  -- idempotency key generated by the checkout client
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- duplicate-order protection: one order per client request id per store
create unique index orders_store_client_request_uidx
  on public.orders (store_id, client_request_id)
  where client_request_id is not null;

-- ----------------------------------------------------------------------------
-- order_items — name/price snapshots so history stays correct after edits
-- ----------------------------------------------------------------------------
create table public.order_items (
  id                    uuid primary key default gen_random_uuid(),
  order_id              uuid not null references public.orders (id) on delete cascade,
  product_id            uuid references public.products (id) on delete set null,
  product_name_snapshot text not null,
  unit_price_snapshot   numeric(10,2) not null check (unit_price_snapshot >= 0),
  quantity              smallint not null check (quantity > 0),
  subtotal              numeric(12,2) not null check (subtotal >= 0)
);

-- ----------------------------------------------------------------------------
-- indexes
-- ----------------------------------------------------------------------------
create index stores_owner_idx              on public.stores (owner_id);
create index products_store_idx            on public.products (store_id);
create index products_store_active_idx     on public.products (store_id, created_at desc) where active = true;
create index product_images_product_idx    on public.product_images (product_id, sort_order);
create index orders_store_created_idx      on public.orders (store_id, created_at desc);
create index orders_store_status_idx       on public.orders (store_id, status);
create index orders_phone_idx              on public.orders (store_id, customer_phone);
create index order_items_order_idx         on public.order_items (order_id);
create index store_delivery_fees_store_idx on public.store_delivery_fees (store_id);

-- ----------------------------------------------------------------------------
-- updated_at triggers
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger profiles_set_updated_at        before update on public.profiles            for each row execute function public.set_updated_at();
create trigger stores_set_updated_at          before update on public.stores              for each row execute function public.set_updated_at();
create trigger products_set_updated_at        before update on public.products            for each row execute function public.set_updated_at();
create trigger store_fees_set_updated_at      before update on public.store_delivery_fees for each row execute function public.set_updated_at();
create trigger orders_set_updated_at          before update on public.orders              for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- auto-create profile on signup
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- ownership helpers (SECURITY DEFINER so policies can check without recursion)
-- ----------------------------------------------------------------------------
create or replace function public.owns_store(p_store_id uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.stores s
    where s.id = p_store_id and s.owner_id = auth.uid()
  );
$$;

create or replace function public.has_any_store()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.stores s where s.owner_id = auth.uid()
  );
$$;

-- ============================================================================
-- ROW LEVEL SECURITY — ownership is enforced at the database level
-- ============================================================================
alter table public.profiles            enable row level security;
alter table public.stores              enable row level security;
alter table public.wilayas             enable row level security;
alter table public.store_delivery_fees enable row level security;
alter table public.products            enable row level security;
alter table public.product_images      enable row level security;
alter table public.orders              enable row level security;
alter table public.order_items         enable row level security;

-- profiles: seller can read/update only their own profile
create policy "profiles_select_own" on public.profiles
  for select using (id = auth.uid());
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- stores: publicly readable (storefront needs name/logo/socials);
-- a seller inserts/updates only their own store (one store per seller in MVP)
create policy "stores_select_public" on public.stores
  for select using (true);
create policy "stores_insert_own" on public.stores
  for insert to authenticated
  with check (owner_id = auth.uid() and not public.has_any_store());
create policy "stores_update_own" on public.stores
  for update to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- wilayas: public read
create policy "wilayas_select_public" on public.wilayas
  for select using (true);

-- store_delivery_fees: public read (checkout fee preview); seller CRUD own
create policy "fees_select_public" on public.store_delivery_fees
  for select using (true);
create policy "fees_insert_own" on public.store_delivery_fees
  for insert to authenticated with check (public.owns_store(store_id));
create policy "fees_update_own" on public.store_delivery_fees
  for update to authenticated
  using (public.owns_store(store_id)) with check (public.owns_store(store_id));
create policy "fees_delete_own" on public.store_delivery_fees
  for delete to authenticated using (public.owns_store(store_id));

-- products: public sees only active products; owner has full CRUD
create policy "products_select_public_active" on public.products
  for select using (active = true);
create policy "products_select_own" on public.products
  for select to authenticated using (public.owns_store(store_id));
create policy "products_insert_own" on public.products
  for insert to authenticated with check (public.owns_store(store_id));
create policy "products_update_own" on public.products
  for update to authenticated
  using (public.owns_store(store_id)) with check (public.owns_store(store_id));
create policy "products_delete_own" on public.products
  for delete to authenticated using (public.owns_store(store_id));

-- product_images: public read only for images of active products; owner CRUD
create policy "images_select_public" on public.product_images
  for select using (
    exists (
      select 1 from public.products p
      where p.id = product_id and p.active = true
    )
  );
create policy "images_select_own" on public.product_images
  for select to authenticated using (
    exists (
      select 1 from public.products p
      where p.id = product_id and public.owns_store(p.store_id)
    )
  );
create policy "images_insert_own" on public.product_images
  for insert to authenticated with check (
    exists (
      select 1 from public.products p
      where p.id = product_id and public.owns_store(p.store_id)
    )
  );
create policy "images_update_own" on public.product_images
  for update to authenticated
  using (
    exists (
      select 1 from public.products p
      where p.id = product_id and public.owns_store(p.store_id)
    )
  )
  with check (
    exists (
      select 1 from public.products p
      where p.id = product_id and public.owns_store(p.store_id)
    )
  );
create policy "images_delete_own" on public.product_images
  for delete to authenticated using (
    exists (
      select 1 from public.products p
      where p.id = product_id and public.owns_store(p.store_id)
    )
  );

-- orders: seller reads/updates only their store's orders.
-- IMPORTANT: there is intentionally NO insert policy — orders can only be
-- created through the security-definer RPC create_order(), which validates
-- products, stock, prices and delivery fees server-side. This prevents
-- anyone from forging totals directly through the Data API.
create policy "orders_select_own" on public.orders
  for select to authenticated using (public.owns_store(store_id));
create policy "orders_update_own" on public.orders
  for update to authenticated
  using (public.owns_store(store_id)) with check (public.owns_store(store_id));

-- order_items: seller reads items of their own orders; inserts happen only
-- inside the create_order RPC (no insert/update/delete policies).
create policy "items_select_own" on public.order_items
  for select to authenticated using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and public.owns_store(o.store_id)
    )
  );

-- ============================================================================
-- create_order — atomic, server-authoritative COD checkout
-- Validates the store, every product (active + belongs to the store + stock),
-- computes subtotal/fee/total from the DATABASE (never from client input),
-- generates a unique order number, inserts order + snapshot items and
-- decrements stock — all inside a single transaction.
-- ============================================================================
create or replace function public.create_order(
  p_store_slug        text,
  p_items             jsonb,          -- [{"product_id": uuid, "quantity": int}, ...]
  p_customer_name     text,
  p_customer_phone    text,           -- normalized E.164 (213XXXXXXXXX) from the API layer
  p_wilaya_code       smallint,
  p_commune           text,
  p_address           text,
  p_notes             text default null,
  p_client_request_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_store        public.stores;
  v_wilaya       public.wilayas;
  v_order_id     uuid;
  v_order_number text;
  v_subtotal     numeric(12,2) := 0;
  v_delivery_fee numeric(10,2);
  v_total        numeric(12,2);
  v_qty          smallint;
  v_client       uuid := p_client_request_id;
  v_existing     public.orders;
  v_attempt      int := 0;
  v_item_count   int;
begin
  -- basic server-side sanity (the API layer validates more strictly with Zod)
  if p_customer_name is null or length(trim(p_customer_name)) < 2 then
    raise exception 'INVALID_CUSTOMER';
  end if;
  if p_customer_phone is null or p_customer_phone !~ '^213[1-9]\d{7,8}$' then
    raise exception 'INVALID_PHONE';
  end if;
  if p_commune is null or length(trim(p_commune)) < 2 then
    raise exception 'INVALID_COMMUNE';
  end if;
  if p_address is null or length(trim(p_address)) < 5 then
    raise exception 'INVALID_ADDRESS';
  end if;
  if v_client is null then
    v_client := gen_random_uuid();
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise exception 'EMPTY_CART';
  end if;
  v_item_count := jsonb_array_length(p_items);
  if v_item_count = 0 then
    raise exception 'EMPTY_CART';
  end if;
  if v_item_count > 50 then
    raise exception 'TOO_MANY_ITEMS';
  end if;

  select * into v_store from public.stores where slug = p_store_slug;
  if not found then
    raise exception 'STORE_NOT_FOUND';
  end if;

  select * into v_wilaya from public.wilayas where code = p_wilaya_code;
  if not found then
    raise exception 'WILAYA_NOT_FOUND';
  end if;

  -- idempotency: same client request id → return the already-created order
  select * into v_existing
  from public.orders
  where store_id = v_store.id and client_request_id = v_client;
  if found then
    return jsonb_build_object('duplicate', true, 'order', public.order_public_json(v_existing.id));
  end if;

  -- aggregate quantities per product, then lock the rows in a stable order
  create temp table tmp_items on commit drop as
    select (e ->> 'product_id')::uuid as product_id,
           sum((e ->> 'quantity')::int)::smallint as quantity
    from jsonb_array_elements(p_items) e
    where (e ->> 'product_id') is not null
    group by 1;

  if exists (select 1 from tmp_items where quantity < 1 or quantity > 99) then
    raise exception 'INVALID_QUANTITY';
  end if;

  create temp table tmp_products on commit drop as
    select p.*
    from public.products p
    join tmp_items t on t.product_id = p.id
    where p.store_id = v_store.id
    order by p.id
    for update;

  -- every cart line must match an active product of THIS store
  if (select count(*) from tmp_items t
      where not exists (select 1 from tmp_products tp where tp.id = t.product_id)) > 0 then
    raise exception 'INVALID_PRODUCTS';
  end if;

  for v_product in
    select * from tmp_products
  loop
    select quantity into v_qty from tmp_items where product_id = v_product.id;
    if v_product.active is not true then
      raise exception 'PRODUCT_INACTIVE:%', v_product.name;
    end if;
    if v_product.price is null or v_product.price < 0 then
      raise exception 'INVALID_PRICE';
    end if;
    if v_product.stock is not null and v_product.stock < v_qty then
      raise exception 'OUT_OF_STOCK:%', v_product.name;
    end if;
    v_subtotal := v_subtotal + (v_product.price * v_qty);
  end loop;

  -- delivery fee precedence: store override for the wilaya → store default → wilaya default
  v_delivery_fee := coalesce(
    (select f.fee from public.store_delivery_fees f
     where f.store_id = v_store.id and f.wilaya_id = v_wilaya.id),
    v_store.default_delivery_fee,
    v_wilaya.default_delivery_fee,
    0
  );

  v_total := v_subtotal + v_delivery_fee;

  -- unique order number with retry on collision
  loop
    v_attempt := v_attempt + 1;
    v_order_number := 'MH-'
      || to_char(now() at time zone 'Africa/Algiers', 'YYMMDD')
      || '-'
      || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 5));
    begin
      insert into public.orders (
        order_number, store_id, customer_name, customer_phone, wilaya_id,
        commune, address, notes, subtotal, delivery_fee, total, status, client_request_id
      ) values (
        v_order_number, v_store.id, trim(p_customer_name), p_customer_phone,
        v_wilaya.id, trim(p_commune), trim(p_address),
        nullif(trim(coalesce(p_notes, '')), ''),
        v_subtotal, v_delivery_fee, v_total, 'new', v_client
      ) returning id into v_order_id;
      exit;
    exception when unique_violation then
      if v_attempt >= 5 then
        raise exception 'ORDER_NUMBER_COLLISION';
      end if;
      select * into v_existing
      from public.orders
      where store_id = v_store.id and client_request_id = v_client;
      if found then
        return jsonb_build_object('duplicate', true, 'order', public.order_public_json(v_existing.id));
      end if;
    end;
  end loop;

  -- snapshot items (name/price frozen at purchase time)
  insert into public.order_items (order_id, product_id, product_name_snapshot, unit_price_snapshot, quantity, subtotal)
  select v_order_id, p.id, p.name, p.price, t.quantity, (p.price * t.quantity)
  from tmp_products p
  join tmp_items t on t.product_id = p.id;

  -- decrement tracked stock
  update public.products p
  set stock = p.stock - t.quantity
  from tmp_items t
  where t.product_id = p.id and p.stock is not null;

  return jsonb_build_object('duplicate', false, 'order', public.order_public_json(v_order_id));
end $$;

-- helper: public JSON view of an order (no store internals, no client_request_id)
create or replace function public.order_public_json(p_order_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'order_number', o.order_number,
    'customer_name', o.customer_name,
    'customer_phone', o.customer_phone,
    'commune', o.commune,
    'address', o.address,
    'notes', o.notes,
    'subtotal', o.subtotal,
    'delivery_fee', o.delivery_fee,
    'total', o.total,
    'status', o.status,
    'created_at', o.created_at,
    'wilaya', (select jsonb_build_object('code', w.code, 'name_ar', w.name_ar, 'name_fr', w.name_fr) from public.wilayas w where w.id = o.wilaya_id),
    'items', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'name', i.product_name_snapshot,
        'unit_price', i.unit_price_snapshot,
        'quantity', i.quantity,
        'subtotal', i.subtotal
      )), '[]'::jsonb)
      from public.order_items i where i.order_id = o.id
    )
  )
  from public.orders o
  where o.id = p_order_id;
$$;

grant execute on function public.create_order(text, jsonb, text, text, smallint, text, text, text, uuid) to anon, authenticated;
grant execute on function public.order_public_json(uuid) to anon, authenticated;

-- ============================================================================
-- get_store_stats — dashboard analytics (caller must own the store)
-- Revenue never counts cancelled orders.
-- ============================================================================
create or replace function public.get_store_stats(p_store_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner  uuid;
  v_result jsonb;
  v_month  timestamptz := (date_trunc('month', now() at time zone 'Africa/Algiers')) at time zone 'Africa/Algiers';
begin
  select owner_id into v_owner from public.stores where id = p_store_id;
  if v_owner is null or v_owner <> auth.uid() then
    raise exception 'FORBIDDEN';
  end if;

  select jsonb_build_object(
    'total_orders', (select count(*) from public.orders where store_id = p_store_id),
    'month_orders', (select count(*) from public.orders where store_id = p_store_id and created_at >= v_month),
    'revenue', (select coalesce(sum(total), 0) from public.orders where store_id = p_store_id and status <> 'cancelled'),
    'month_revenue', (select coalesce(sum(total), 0) from public.orders where store_id = p_store_id and status <> 'cancelled' and created_at >= v_month),
    'delivered', (select count(*) from public.orders where store_id = p_store_id and status = 'delivered'),
    'cancelled', (select count(*) from public.orders where store_id = p_store_id and status = 'cancelled'),
    'new_orders', (select count(*) from public.orders where store_id = p_store_id and status = 'new'),
    'top_products', (
      select coalesce(jsonb_agg(jsonb_build_object('name', t.name, 'qty', t.qty, 'revenue', t.rev) order by t.qty desc), '[]'::jsonb)
      from (
        select i.product_name_snapshot as name,
               sum(i.quantity)         as qty,
               sum(i.subtotal)         as rev
        from public.order_items i
        join public.orders o on o.id = i.order_id
        where o.store_id = p_store_id and o.status <> 'cancelled'
        group by 1
        order by 2 desc
        limit 5
      ) t
    )
  )
  into v_result;

  return v_result;
end $$;

grant execute on function public.get_store_stats(uuid) to authenticated;

-- ============================================================================
-- STORAGE — buckets + ownership policies
-- Layout inside each bucket: <auth.uid()>/<random>.<ext>
-- ============================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('store-logos',    'store-logos',    true, 2097152, array['image/png','image/jpeg','image/webp','image/svg+xml']),
  ('product-images', 'product-images', true, 5242880, array['image/png','image/jpeg','image/webp']),
  ('avatars',        'avatars',        true, 2097152, array['image/png','image/jpeg','image/webp'])
on conflict (id) do nothing;

create policy "assets_public_read" on storage.objects
  for select using (bucket_id in ('store-logos','product-images','avatars'));

create policy "assets_owner_insert" on storage.objects
  for insert to authenticated with check (
    bucket_id in ('store-logos','product-images','avatars')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "assets_owner_update" on storage.objects
  for update to authenticated using (
    bucket_id in ('store-logos','product-images','avatars')
    and (storage.foldername(name))[1] = auth.uid()::text
  ) with check (
    bucket_id in ('store-logos','product-images','avatars')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "assets_owner_delete" on storage.objects
  for delete to authenticated using (
    bucket_id in ('store-logos','product-images','avatars')
    and (storage.foldername(name))[1] = auth.uid()::text
  );
