-- 구출 내역: 상품 삭제돼도 예약(닉네임·꽃이름·픽업번호) 유지

alter table public.reservations
  add column if not exists product_title text;

-- product 삭제 시 예약 행은 남기고 product_id만 null
do $$
declare
  fk_name text;
begin
  select conname into fk_name
  from pg_constraint
  where conrelid = 'public.reservations'::regclass
    and contype = 'f'
    and pg_get_constraintdef(oid) ilike '%product_id%';

  if fk_name is not null then
    execute format('alter table public.reservations drop constraint %I', fk_name);
  end if;
end $$;

alter table public.reservations
  alter column product_id drop not null;

alter table public.reservations
  add constraint reservations_product_id_fkey
  foreign key (product_id) references public.products (id) on delete set null;
