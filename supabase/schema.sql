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


-- Bijlagen bij onderhoudsregels (migratie "bijlagen")
create table public.attachments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  history_id uuid not null references public.history(id) on delete cascade,
  name text not null,
  path text not null,
  size bigint,
  mime text,
  created_at timestamptz not null default now()
);
create index attachments_history_idx on public.attachments(history_id);
create index attachments_user_idx on public.attachments(user_id);
alter table public.attachments enable row level security;
create policy "eigen regels" on public.attachments for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('bijlagen','bijlagen',false, 10485760,
  array['application/pdf','image/jpeg','image/png','image/webp','image/heic','text/plain',
        'application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'])
on conflict (id) do nothing;
create policy "bijlagen eigen map lezen" on storage.objects for select to authenticated
  using (bucket_id='bijlagen' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "bijlagen eigen map uploaden" on storage.objects for insert to authenticated
  with check (bucket_id='bijlagen' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "bijlagen eigen map verwijderen" on storage.objects for delete to authenticated
  using (bucket_id='bijlagen' and (storage.foldername(name))[1] = (select auth.uid())::text);
