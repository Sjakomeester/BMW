-- X3M Onderhoud: tabellen en beveiliging.
-- Plak dit hele bestand in Supabase > SQL Editor en klik op Run.

create table if not exists public.km_entries (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  km         integer not null check (km >= 0),
  date       date not null,
  tread      numeric(3,1),
  note       text,
  created_at timestamptz not null default now()
);

create table if not exists public.history (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name       text not null,
  date       date not null,
  km         integer check (km >= 0),
  approx     boolean not null default false,
  item       text,
  created_at timestamptz not null default now(),
  unique (user_id, item)          -- een onderhoudspunt heeft maximaal één 'gedaan'-regel; lege item-waarden mogen vaker voorkomen
);

create table if not exists public.done (
  user_id   uuid not null default auth.uid() references auth.users(id) on delete cascade,
  item      text not null,
  km        integer not null check (km >= 0),
  date      date not null,
  next_date date,
  primary key (user_id, item)
);

create table if not exists public.prices (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  key     text not null,
  value   numeric not null check (value >= 0),
  primary key (user_id, key)
);

create index if not exists km_entries_user_date on public.km_entries (user_id, date desc);
create index if not exists history_user_date    on public.history (user_id, date desc);

-- Beveiliging: iedereen ziet en wijzigt alleen zijn eigen regels.
alter table public.km_entries enable row level security;
alter table public.history    enable row level security;
alter table public.done       enable row level security;
alter table public.prices     enable row level security;

drop policy if exists "eigen regels" on public.km_entries;
drop policy if exists "eigen regels" on public.history;
drop policy if exists "eigen regels" on public.done;
drop policy if exists "eigen regels" on public.prices;

create policy "eigen regels" on public.km_entries for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "eigen regels" on public.history    for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "eigen regels" on public.done       for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "eigen regels" on public.prices     for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
