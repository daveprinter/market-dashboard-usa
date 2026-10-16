create type public.app_role as enum ('admin','manager','staff','tax_officer');
create type public.biz_category as enum ('marketplace','event_space','online','tax_refund','tickets');
create type public.record_source as enum ('manual','import','api');
create type public.pay_status as enum ('pending','paid','failed','refunded');
create type public.done_status as enum ('open','in_progress','completed','cancelled');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique(user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id=_user_id and role=_role) $$;

create or replace function public.has_any_role(_user_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id=_user_id) $$;

create policy "own roles visible" on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "admins manage roles" on public.user_roles for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- first signup becomes admin, others staff
create or replace function public.assign_initial_role()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.user_roles where role='admin') then
    insert into public.user_roles(user_id, role) values (new.id,'admin');
  else
    insert into public.user_roles(user_id, role) values (new.id,'staff');
  end if;
  return new;
end; $$;
create trigger on_auth_user_created_role after insert on auth.users
for each row execute function public.assign_initial_role();

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  ref text not null default ('TX-' || upper(substr(md5(random()::text),1,8))),
  category biz_category not null,
  state_code char(2) not null,
  platform text not null,
  description text not null default '',
  tx_date date not null default current_date,
  gross numeric(12,2) not null default 0 check (gross >= 0),
  expenses numeric(12,2) not null default 0 check (expenses >= 0),
  commission numeric(12,2) not null default 0 check (commission >= 0),
  refunds numeric(12,2) not null default 0 check (refunds >= 0),
  net numeric(12,2) generated always as (gross - expenses - commission - refunds) stored,
  payment_status pay_status not null default 'pending',
  completion_status done_status not null default 'open',
  source record_source not null default 'manual',
  is_demo boolean not null default false,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.transactions(tx_date);
create index on public.transactions(category);
grant select, insert, update, delete on public.transactions to authenticated;
grant all on public.transactions to service_role;
alter table public.transactions enable row level security;

create or replace function public.can_see_category(_cat biz_category)
returns boolean language sql stable security definer set search_path = public as $$
  select case when _cat = 'tax_refund'
    then public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'tax_officer')
    else public.has_any_role(auth.uid()) end
$$;

create policy "read permitted" on public.transactions for select to authenticated using (public.can_see_category(category));
create policy "insert permitted" on public.transactions for insert to authenticated with check (public.can_see_category(category) and created_by = auth.uid());
create policy "update permitted" on public.transactions for update to authenticated using (public.can_see_category(category)) with check (public.can_see_category(category));
create policy "admins/managers delete" on public.transactions for delete to authenticated using (public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'manager'));

create table public.audit_log (
  id bigserial primary key,
  tx_id uuid,
  category biz_category,
  action text not null,
  actor uuid,
  details jsonb,
  created_at timestamptz not null default now()
);
grant select on public.audit_log to authenticated;
grant all on public.audit_log to service_role;
alter table public.audit_log enable row level security;
create policy "admins read audit" on public.audit_log for select to authenticated
  using (public.has_role(auth.uid(),'admin') or (public.has_role(auth.uid(),'manager') and category <> 'tax_refund'));

create or replace function public.log_tx_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'DELETE' then
    insert into public.audit_log(tx_id, category, action, actor, details) values (old.id, old.category, 'deleted', auth.uid(), jsonb_build_object('ref', old.ref, 'gross', old.gross));
    return old;
  elsif tg_op = 'UPDATE' then
    new.updated_at = now();
    insert into public.audit_log(tx_id, category, action, actor, details) values (new.id, new.category, 'updated', auth.uid(),
      jsonb_build_object('ref', new.ref, 'gross', jsonb_build_array(old.gross,new.gross), 'payment', jsonb_build_array(old.payment_status,new.payment_status), 'completion', jsonb_build_array(old.completion_status,new.completion_status)));
    return new;
  else
    insert into public.audit_log(tx_id, category, action, actor, details) values (new.id, new.category, 'created', auth.uid(), jsonb_build_object('ref', new.ref, 'source', new.source));
    return new;
  end if;
end; $$;
create trigger tx_audit_ins after insert on public.transactions for each row execute function public.log_tx_change();
create trigger tx_audit_upd before update on public.transactions for each row execute function public.log_tx_change();
create trigger tx_audit_del after delete on public.transactions for each row execute function public.log_tx_change();

-- Demo data (clearly flagged is_demo = true)
alter table public.transactions disable trigger tx_audit_ins;
insert into public.transactions (category, state_code, platform, description, tx_date, gross, expenses, commission, refunds, payment_status, completion_status, source, is_demo)
select
  c.cat,
  (array['CA','TX','FL','NY','GA','IL','AZ','NC','WA','NV'])[1 + (i*7 % 10)],
  case c.cat
    when 'marketplace' then 'Facebook Marketplace'
    when 'event_space' then (array['Peerspace','Giggster','Direct booking'])[1 + i % 3]
    when 'online' then (array['Shopify','Etsy','Fiverr'])[1 + i % 3]
    when 'tax_refund' then 'In-house filing'
    else (array['Ticketmaster','StubHub','SeatGeek'])[1 + i % 3] end,
  'Demo record ' || i,
  current_date - ((i * 37 + c.n * 11) % 330),
  round((c.base * (0.5 + ((i * 13 + c.n) % 100) / 100.0))::numeric, 2),
  round((c.base * 0.18 * (0.5 + ((i * 7) % 50) / 100.0))::numeric, 2),
  round((c.base * c.comm)::numeric, 2),
  case when i % 11 = 0 then round((c.base * 0.2)::numeric, 2) else 0 end,
  (case when i % 9 = 0 then 'pending' when i % 11 = 0 then 'refunded' else 'paid' end)::pay_status,
  (case when i % 7 = 0 then 'in_progress' when i % 13 = 0 then 'open' else 'completed' end)::done_status,
  (case when i % 4 = 0 then 'import' else 'manual' end)::record_source,
  true
from generate_series(1, 48) i
cross join (values
  ('marketplace'::biz_category, 1, 240.0, 0.0),
  ('event_space'::biz_category, 2, 1400.0, 0.12),
  ('online'::biz_category, 3, 180.0, 0.08),
  ('tax_refund'::biz_category, 4, 350.0, 0.0),
  ('tickets'::biz_category, 5, 420.0, 0.10)
) as c(cat, n, base, comm);
alter table public.transactions enable trigger tx_audit_ins;