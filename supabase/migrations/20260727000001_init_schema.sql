-- Lucro Real — schema inicial
-- profiles, catálogo de consumo (INMETRO), carro do motorista, corridas.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- updated_at helper
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles (1:1 com auth.users)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  must_change_password boolean not null default true,
  -- sessão única: cada login grava um novo session_token aqui, sobrescrevendo
  -- o anterior. Middleware compara o cookie do request com este valor.
  active_session_id uuid,
  fuel_type text not null default 'gasolina' check (fuel_type in ('gasolina', 'etanol', 'diesel')),
  fuel_price numeric(10,3) not null default 0 check (fuel_price >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

create policy "profiles: usuário vê o próprio perfil"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles: usuário edita o próprio perfil"
  on public.profiles for update
  using (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- catálogo de consumo médio por modelo (referência pública, somente leitura
-- para o cliente). Baseado em faixas de ano pois o consumo INMETRO varia
-- por ano/motorização.
-- ---------------------------------------------------------------------------
create table public.car_models_catalog (
  id uuid primary key default gen_random_uuid(),
  brand text not null,
  model text not null,
  year_from int not null,
  year_to int not null,
  fuel_type text not null default 'gasolina' check (fuel_type in ('gasolina', 'etanol', 'diesel')),
  consumption_combined_kml numeric(5,2) not null check (consumption_combined_kml > 0),
  source text not null default 'INMETRO - PBEV (estimativa)',
  created_at timestamptz not null default now()
);

create index car_models_catalog_brand_model_idx on public.car_models_catalog (brand, model);

alter table public.car_models_catalog enable row level security;

create policy "car_models_catalog: leitura pública"
  on public.car_models_catalog for select
  using (true);

-- ---------------------------------------------------------------------------
-- carro do motorista
-- ---------------------------------------------------------------------------
create table public.user_cars (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  catalog_id uuid references public.car_models_catalog(id),
  brand text not null,
  model text not null,
  year int not null,
  -- sugerido pelo catálogo, mas editável manualmente pelo motorista
  consumption_kml numeric(5,2) not null check (consumption_kml > 0),
  -- custo de manutenção estimado por km; valor médio de mercado, editável
  maintenance_cost_per_km numeric(6,4) not null default 0.15 check (maintenance_cost_per_km >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index user_cars_user_id_idx on public.user_cars (user_id);

create trigger user_cars_set_updated_at
  before update on public.user_cars
  for each row execute function public.set_updated_at();

alter table public.user_cars enable row level security;

create policy "user_cars: usuário vê os próprios carros"
  on public.user_cars for select
  using (auth.uid() = user_id);

create policy "user_cars: usuário insere os próprios carros"
  on public.user_cars for insert
  with check (auth.uid() = user_id);

create policy "user_cars: usuário edita os próprios carros"
  on public.user_cars for update
  using (auth.uid() = user_id);

create policy "user_cars: usuário remove os próprios carros"
  on public.user_cars for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- corridas
-- valores de combustível/consumo são "congelados" no momento do registro,
-- para que edições futuras no preço não alterem o histórico já calculado.
-- ---------------------------------------------------------------------------
create table public.rides (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  car_id uuid not null references public.user_cars(id) on delete restrict,
  value_received numeric(10,2) not null check (value_received >= 0),
  km_driven numeric(8,2) not null check (km_driven > 0),
  fuel_price_snapshot numeric(10,3) not null,
  consumption_kml_snapshot numeric(5,2) not null,
  maintenance_cost_per_km_snapshot numeric(6,4) not null,
  fuel_cost numeric(10,2) not null,
  maintenance_cost numeric(10,2) not null,
  net_profit numeric(10,2) not null,
  created_at timestamptz not null default now()
);

create index rides_user_id_created_at_idx on public.rides (user_id, created_at desc);

alter table public.rides enable row level security;

create policy "rides: usuário vê as próprias corridas"
  on public.rides for select
  using (auth.uid() = user_id);

create policy "rides: usuário insere as próprias corridas"
  on public.rides for insert
  with check (auth.uid() = user_id);

create policy "rides: usuário edita as próprias corridas"
  on public.rides for update
  using (auth.uid() = user_id);

create policy "rides: usuário remove as próprias corridas"
  on public.rides for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- cria profile automaticamente quando um usuário é criado no auth.users
-- (usado tanto pelo webhook da Kiwify quanto por qualquer criação futura)
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
