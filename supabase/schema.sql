-- 꽃줍 (KkotJup) Supabase schema
-- Supabase Dashboard → SQL Editor 에서 전체 실행하세요.

-- Extensions
create extension if not exists "pgcrypto";

-- Products (떨이 상품)
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text,
  flowers jsonb not null default '[]'::jsonb,
  price integer not null check (price >= 0),
  retail_estimate integer not null check (retail_estimate >= 0),
  discount_rate integer not null default 0,
  color_keywords text[] not null default '{}',
  bloom_state text not null default '만개',
  freshness_tag text not null default '',
  care_tips text[] not null default '{}',
  quantity integer not null default 1 check (quantity >= 0),
  remaining_slots integer not null default 1 check (remaining_slots >= 0),
  image_url text not null default '',
  stall_code text not null,
  stall_zone text not null,
  seller_name text not null,
  pickup_code text,
  created_at timestamptz not null default now(),
  closes_at timestamptz not null
);

create index if not exists products_remaining_idx
  on public.products (remaining_slots, closes_at);

create index if not exists products_created_idx
  on public.products (created_at desc);

-- Sellers (가게)
create table if not exists public.sellers (
  id uuid primary key default gen_random_uuid(),
  shop_name text not null unique,
  location text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists sellers_shop_name_idx on public.sellers (shop_name);

-- Reservations (픽업 예약) — 상품 매진 삭제 후에도 내역 유지
create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products (id) on delete set null,
  product_title text,
  pickup_code text not null,
  buyer_nickname text,
  status text not null default 'reserved'
    check (status in ('reserved', 'confirmed', 'cancelled')),
  reserved_at timestamptz not null default now(),
  confirmed_at timestamptz
);

create index if not exists reservations_product_idx
  on public.reservations (product_id, pickup_code);

-- 원자적 예약: 수량 감소 + 4자리 코드 발급 (+ 손님 닉네임)
drop function if exists public.reserve_product(uuid, text);
drop function if exists public.reserve_product(uuid);

create or replace function public.reserve_product(
  p_product_id uuid,
  p_buyer_nickname text default null
)
returns table (
  reservation_id uuid,
  out_pickup_code text,
  out_remaining integer
)
language plpgsql
security definer
as $$
declare
  v_remaining integer;
  v_code text;
  v_id uuid;
begin
  select p.remaining_slots, p.pickup_code
  into v_remaining, v_code
  from public.products as p
  where p.id = p_product_id
  for update;

  if v_remaining is null then
    raise exception 'PRODUCT_NOT_FOUND';
  end if;

  if v_remaining <= 0 then
    raise exception 'SOLD_OUT';
  end if;

  if v_code is null or v_code = '' then
    v_code := lpad((floor(random() * 9000) + 1000)::int::text, 4, '0');
    update public.products as p
    set pickup_code = v_code
    where p.id = p_product_id;
  end if;

  update public.products as p
  set remaining_slots = p.remaining_slots - 1
  where p.id = p_product_id
  returning p.remaining_slots into v_remaining;

  insert into public.reservations (product_id, pickup_code, status, buyer_nickname)
  values (p_product_id, v_code, 'reserved', nullif(trim(p_buyer_nickname), ''))
  returning id into v_id;

  -- remaining 0이어도 상품 행 유지 (피드에서만 숨김, 상인 내역 조회용)

  reservation_id := v_id;
  out_pickup_code := v_code;
  out_remaining := v_remaining;
  return next;
end;
$$;

-- 픽업 확인
create or replace function public.confirm_pickup(p_product_id uuid, p_code text)
returns table (ok boolean, message text)
language plpgsql
security definer
as $$
declare
  v_id uuid;
begin
  if not exists (select 1 from public.products where id = p_product_id) then
    return query select false, '상품을 찾을 수 없습니다.'::text;
    return;
  end if;

  select r.id into v_id
  from public.reservations r
  where r.product_id = p_product_id
    and r.pickup_code = p_code
    and r.status = 'reserved'
  limit 1;

  if v_id is null then
    return query select false, '예약 번호가 올바르지 않습니다.'::text;
    return;
  end if;

  update public.reservations
  set status = 'confirmed', confirmed_at = now()
  where id = v_id;

  return query select true, '픽업 확인 완료. 꽃을 건네주세요!'::text;
end;
$$;

-- RLS
alter table public.products enable row level security;
alter table public.reservations enable row level security;
alter table public.sellers enable row level security;

drop policy if exists "Public read sellers" on public.sellers;
create policy "Public read sellers"
  on public.sellers for select using (true);

drop policy if exists "Anon insert sellers" on public.sellers;
create policy "Anon insert sellers"
  on public.sellers for insert with check (true);

drop policy if exists "Anon update sellers" on public.sellers;
create policy "Anon update sellers"
  on public.sellers for update using (true);

-- 공개 읽기: 남은 수량 > 0 상품
drop policy if exists "Public read available products" on public.products;
create policy "Public read available products"
  on public.products for select
  using (true);

-- 서비스 롤/익명 insert는 API에서 service role 사용 권장.
-- 데모용: anon도 insert/update 허용 (해커톤용 — 운영 전 강화 필요)
drop policy if exists "Anon insert products" on public.products;
create policy "Anon insert products"
  on public.products for insert
  with check (true);

drop policy if exists "Anon update products" on public.products;
create policy "Anon update products"
  on public.products for update
  using (true);

drop policy if exists "Anon delete products" on public.products;
create policy "Anon delete products"
  on public.products for delete
  using (true);

drop policy if exists "Public read reservations" on public.reservations;
create policy "Public read reservations"
  on public.reservations for select
  using (true);

drop policy if exists "Anon insert reservations" on public.reservations;
create policy "Anon insert reservations"
  on public.reservations for insert
  with check (true);

drop policy if exists "Anon update reservations" on public.reservations;
create policy "Anon update reservations"
  on public.reservations for update
  using (true);

-- Storage bucket (상품 사진)
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "Public read product images" on storage.objects;
create policy "Public read product images"
  on storage.objects for select
  using (bucket_id = 'product-images');

drop policy if exists "Anon upload product images" on storage.objects;
create policy "Anon upload product images"
  on storage.objects for insert
  with check (bucket_id = 'product-images');

drop policy if exists "Anon update product images" on storage.objects;
create policy "Anon update product images"
  on storage.objects for update
  using (bucket_id = 'product-images');

-- RPC 실행 권한
grant execute on function public.reserve_product(uuid, text) to anon, authenticated, service_role;
grant execute on function public.confirm_pickup(uuid, text) to anon, authenticated, service_role;
