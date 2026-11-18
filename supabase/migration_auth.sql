-- 손님/상인 로그인 + 예약 닉네임 (기존 프로젝트에 추가 실행)

create table if not exists public.sellers (
  id uuid primary key default gen_random_uuid(),
  shop_name text not null unique,
  location text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists sellers_shop_name_idx on public.sellers (shop_name);

alter table public.reservations
  add column if not exists buyer_nickname text;

create index if not exists reservations_buyer_idx
  on public.reservations (buyer_nickname, reserved_at desc);

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

-- 예약 RPC: 닉네임 포함
create or replace function public.reserve_product(
  p_product_id uuid,
  p_buyer_nickname text default null
)
returns table (
  reservation_id uuid,
  pickup_code text,
  remaining_slots integer
)
language plpgsql
security definer
as $$
declare
  v_remaining integer;
  v_code text;
  v_id uuid;
begin
  select products.remaining_slots into v_remaining
  from public.products
  where products.id = p_product_id
  for update;

  if v_remaining is null then
    raise exception 'PRODUCT_NOT_FOUND';
  end if;

  if v_remaining <= 0 then
    raise exception 'SOLD_OUT';
  end if;

  v_code := lpad((floor(random() * 9000) + 1000)::int::text, 4, '0');

  update public.products
  set remaining_slots = remaining_slots - 1
  where id = p_product_id
  returning products.remaining_slots into v_remaining;

  insert into public.reservations (product_id, pickup_code, status, buyer_nickname)
  values (p_product_id, v_code, 'reserved', nullif(trim(p_buyer_nickname), ''))
  returning id into v_id;

  reservation_id := v_id;
  pickup_code := v_code;
  remaining_slots := v_remaining;
  return next;
end;
$$;

grant execute on function public.reserve_product(uuid, text) to anon, authenticated, service_role;
