-- ResoPOS v2 : schéma Supabase multi-restaurants avec droits par rôle
-- À coller dans SQL Editor > Run, sur un projet neuf.
create table restaurants(
  id uuid primary key default gen_random_uuid(),
  name text not null,
  data jsonb not null default '{}',   -- devise, taxe, équipe de service
  seq bigint not null default 0,      -- compteur des numéros de commande
  created_at timestamptz default now());
create table members(
  restaurant_id uuid references restaurants on delete cascade,
  user_id uuid references auth.users on delete cascade,
  role text not null check (role in ('patron','caisse','cuisine')),
  email text,
  primary key(restaurant_id,user_id));
create table restaurant_codes(
  restaurant_id uuid primary key references restaurants on delete cascade,
  caisse text unique not null, cuisine text unique not null);
create table menu_items(
  restaurant_id uuid references restaurants on delete cascade,
  id text, data jsonb not null,
  primary key(restaurant_id,id));
create table stock(
  restaurant_id uuid, item_id text, qty int not null check (qty>=0),
  primary key(restaurant_id,item_id),
  foreign key(restaurant_id,item_id) references menu_items(restaurant_id,id) on delete cascade);
create table orders(
  restaurant_id uuid references restaurants on delete cascade,
  num bigint, data jsonb not null, updated_at timestamptz default now(),
  primary key(restaurant_id,num));

create function my_role(r uuid) returns text language sql stable security definer set search_path=public as
$$ select role from members where restaurant_id=r and user_id=auth.uid() $$;

alter table restaurants enable row level security;
alter table members enable row level security;
alter table restaurant_codes enable row level security;
alter table menu_items enable row level security;
alter table stock enable row level security;
alter table orders enable row level security;

-- Lecture : tout membre. Écriture : selon le rôle.
create policy r_sel on restaurants for select using (my_role(id) is not null);
create policy r_upd on restaurants for update using (my_role(id)='patron');
create policy m_sel on members for select using (user_id=auth.uid() or my_role(restaurant_id)='patron');
create policy m_upd on members for update using (my_role(restaurant_id)='patron');
create policy m_del on members for delete using (my_role(restaurant_id)='patron');
create policy c_sel on restaurant_codes for select using (my_role(restaurant_id)='patron');
create policy mi_sel on menu_items for select using (my_role(restaurant_id) is not null);
create policy mi_ins on menu_items for insert with check (my_role(restaurant_id)='patron');
create policy mi_upd on menu_items for update using (my_role(restaurant_id)='patron');
create policy mi_del on menu_items for delete using (my_role(restaurant_id)='patron');
create policy s_sel on stock for select using (my_role(restaurant_id) is not null);
create policy s_ins on stock for insert with check (my_role(restaurant_id)='patron');
create policy s_upd on stock for update using (my_role(restaurant_id)='patron');
create policy s_del on stock for delete using (my_role(restaurant_id)='patron');
create policy o_sel on orders for select using (my_role(restaurant_id) is not null);
create policy o_ins on orders for insert with check (my_role(restaurant_id) in ('patron','caisse'));
create policy o_upd on orders for update using (my_role(restaurant_id) is not null);
create policy o_del on orders for delete using (my_role(restaurant_id)='patron' or (my_role(restaurant_id)='caisse' and data->>'st'<>'payee'));

-- Garde-fou sur les commandes : la cuisine ne change que le statut ; une commande payée n'est modifiable que par le patron.
create function orders_guard() returns trigger language plpgsql set search_path=public as $$
declare ro text := coalesce(my_role(old.restaurant_id),'');
begin
  if new.restaurant_id<>old.restaurant_id or new.num<>old.num then raise exception 'interdit'; end if;
  if ro='cuisine' and (new.data - 'st') <> (old.data - 'st') then raise exception 'la cuisine ne peut changer que le statut'; end if;
  if ro<>'patron' and old.data->>'st'='payee' then raise exception 'commande payée verrouillée'; end if;
  return new;
end $$;
create trigger orders_guard before update on orders for each row execute function orders_guard();

create function create_restaurant(p_name text,p_data jsonb,p_menu jsonb) returns uuid language plpgsql security definer set search_path=public as $$
declare rid uuid;
begin
  if auth.uid() is null then raise exception 'connexion requise'; end if;
  insert into restaurants(name,data) values(p_name,p_data) returning id into rid;
  insert into members(restaurant_id,user_id,role,email) values(rid,auth.uid(),'patron',auth.jwt()->>'email');
  insert into restaurant_codes values(rid,substr(md5(random()::text||rid::text),1,8),substr(md5(random()::text||clock_timestamp()::text),1,8));
  insert into menu_items select rid, e->>'id', e from jsonb_array_elements(p_menu) e;
  return rid;
end $$;

create function join_restaurant(p_code text) returns uuid language plpgsql security definer set search_path=public as $$
declare c restaurant_codes;
begin
  if auth.uid() is null then raise exception 'connexion requise'; end if;
  select * into c from restaurant_codes where caisse=p_code or cuisine=p_code;
  if not found then raise exception 'code invalide'; end if;
  insert into members(restaurant_id,user_id,role,email) values(c.restaurant_id,auth.uid(),case when c.caisse=p_code then 'caisse' else 'cuisine' end,auth.jwt()->>'email') on conflict do nothing;
  return c.restaurant_id;
end $$;

create function next_num(r uuid) returns bigint language plpgsql security definer set search_path=public as $$
declare n bigint;
begin
  if coalesce(my_role(r),'') not in ('patron','caisse') then raise exception 'interdit'; end if;
  update restaurants set seq=seq+1 where id=r returning seq into n;
  return n;
end $$;

-- Le stock vendu se décrémente de façon atomique (caisse autorisée, sans droit d'édition du stock).
create function adjust_stock(r uuid,item text,delta int) returns void language plpgsql security definer set search_path=public as $$
begin
  if coalesce(my_role(r),'') not in ('patron','caisse') then raise exception 'interdit'; end if;
  update stock set qty=greatest(0,qty+delta) where restaurant_id=r and item_id=item;
end $$;

revoke all on function create_restaurant(text,jsonb,jsonb), join_restaurant(text), next_num(uuid), adjust_stock(uuid,text,int), my_role(uuid) from public, anon;
grant execute on function create_restaurant(text,jsonb,jsonb), join_restaurant(text), next_num(uuid), adjust_stock(uuid,text,int), my_role(uuid) to authenticated;

-- Photos des plats : lecture publique, écriture réservée au patron de chaque restaurant (dossier = id du restaurant)
insert into storage.buckets(id,name,public) values('menu-photos','menu-photos',true) on conflict do nothing;
create policy ph_read on storage.objects for select using (bucket_id='menu-photos');
create policy ph_ins on storage.objects for insert to authenticated with check (bucket_id='menu-photos' and my_role(((storage.foldername(name))[1])::uuid)='patron');
create policy ph_upd on storage.objects for update to authenticated using (bucket_id='menu-photos' and my_role(((storage.foldername(name))[1])::uuid)='patron');
create policy ph_del on storage.objects for delete to authenticated using (bucket_id='menu-photos' and my_role(((storage.foldername(name))[1])::uuid)='patron');

alter publication supabase_realtime add table orders, restaurants, menu_items, stock;
