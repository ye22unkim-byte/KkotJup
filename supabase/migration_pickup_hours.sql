-- 상품별 공유 픽업 번호 + 예약 시 동일 번호 사용
-- Supabase SQL Editor에서 이 파일 전체를 실행하세요.

alter table public.products
  add column if not exists pickup_code text;

update public.products
set pickup_code = lpad((floor(random() * 9000) + 1000)::int::text, 4, '0')
where pickup_code is null or pickup_code = '';

-- OUT 컬럼명을 바꿔 products.remaining_slots 와 충돌하지 않게 함
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

grant execute on function public.reserve_product(uuid, text) to anon, authenticated, service_role;

-- 매진(remaining 0) 상품 행 삭제 허용
drop policy if exists "Anon delete products" on public.products;
create policy "Anon delete products"
  on public.products for delete
  using (true);
