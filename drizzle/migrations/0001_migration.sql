create or replace function public.list_team()
returns table(user_id uuid, email text, roles app_role[], created_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.has_role(auth.uid(),'admin') then raise exception 'forbidden'; end if;
  return query select u.id, u.email::text, coalesce(array_agg(r.role) filter (where r.role is not null), '{}'), u.created_at
    from auth.users u left join public.user_roles r on r.user_id = u.id group by u.id order by u.created_at;
end; $$;
revoke all on function public.list_team() from public, anon;
grant execute on function public.list_team() to authenticated;