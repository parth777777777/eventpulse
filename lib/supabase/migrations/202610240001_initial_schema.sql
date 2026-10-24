
-- EventPulse: initial database schema
-- Requires Supabase Auth and PostGIS.

create extension if not exists postgis with schema extensions;

-- 1. User profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role text not null default 'user'
    check (role in ('user', 'organizer', 'moderator')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Organizers
create table if not exists public.organizers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete restrict,
  name text not null check (length(trim(name)) between 1 and 200),
  description text,
  verification_status text not null default 'unverified'
    check (verification_status in ('unverified', 'pending', 'verified', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists organizers_owner_id_idx
  on public.organizers(owner_id);

-- 3. Events
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid references public.organizers(id) on delete set null,

  title text not null check (length(trim(title)) between 1 and 300),
  description text,
  category text not null,
  starts_at timestamptz not null,
  ends_at timestamptz,
  timezone text not null default 'Asia/Kolkata',

  status text not null default 'draft'
    check (status in ('draft', 'published', 'cancelled', 'completed')),
  format text not null default 'in_person'
    check (format in ('in_person', 'online', 'hybrid')),

  venue_name text,
  address text,
  city text,
  country text default 'India',

  latitude double precision,
  longitude double precision,
  location extensions.geography(Point, 4326),
  location_resolution_status text not null default 'unresolved'
    check (location_resolution_status in ('resolved', 'unresolved', 'not_applicable')),

  registration_url text,
  registration_deadline timestamptz,
  registration_status text not null default 'open'
    check (registration_status in ('open', 'closed', 'waitlist', 'unknown')),
  fee_amount numeric(12, 2) check (fee_amount is null or fee_amount >= 0),
  currency text not null default 'INR',

  eligibility text,
  prizes jsonb,
  faqs jsonb not null default '[]'::jsonb,
  contact jsonb,

  source_attribution text,
  verification_status text not null default 'unverified'
    check (verification_status in ('unverified', 'pending', 'verified', 'rejected')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint events_valid_coordinates check (
    (latitude is null or latitude between -90 and 90)
    and
    (longitude is null or longitude between -180 and 180)
  ),
  constraint events_coordinates_pair check (
    (latitude is null) = (longitude is null)
  ),
  constraint events_valid_end_time check (
    ends_at is null or ends_at >= starts_at
  ),
  constraint events_physical_location check (
    format = 'online' or latitude is not null or location is null
  )
);

create index if not exists events_status_start_idx
  on public.events(status, starts_at);

create index if not exists events_city_idx
  on public.events(city);

create index if not exists events_location_gist_idx
  on public.events using gist(location);

create index if not exists events_category_idx
  on public.events(category);

-- Keep the geographic point synchronized with validated coordinates.
create or replace function public.sync_event_location()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.latitude is null or new.longitude is null
     or new.format = 'online' then
    new.location := null;
    if new.format = 'online' then
      new.location_resolution_status := 'not_applicable';
    end if;
  else
    new.location := extensions.st_setsrid(
      extensions.st_makepoint(new.longitude, new.latitude),
      4326
    )::extensions.geography;
    new.location_resolution_status := 'resolved';
  end if;

  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists events_sync_location on public.events;

create trigger events_sync_location
before insert or update of latitude, longitude, format
on public.events
for each row execute function public.sync_event_location();

-- 4. Source provenance for imported or externally submitted events
create table if not exists public.event_sources (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  source_type text not null
    check (source_type in ('organizer', 'web', 'partner', 'admin')),
  external_id text,
  source_url text,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  unique (source_type, external_id)
);

create index if not exists event_sources_event_id_idx
  on public.event_sources(event_id);

-- 5. User bookmarks
create table if not exists public.bookmarks (
  user_id uuid not null references auth.users(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, event_id)
);

create index if not exists bookmarks_event_id_idx
  on public.bookmarks(event_id);

-- 6. Automatically create a profile when a user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'display_name', '')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- 7. Row-level security
alter table public.profiles enable row level security;
alter table public.organizers enable row level security;
alter table public.events enable row level security;
alter table public.event_sources enable row level security;
alter table public.bookmarks enable row level security;

-- Profiles: users can read and update their own profile.
create policy "Users read own profile"
on public.profiles for select to authenticated
using ((select auth.uid()) = id);

create policy "Users update own profile"
on public.profiles for update to authenticated
using ((select auth.uid()) = id)
with check (
  (select auth.uid()) = id
  and role in ('user', 'organizer')
);

-- Organizers: published event details can reference organizer names.
create policy "Public read organizers"
on public.organizers for select to anon, authenticated
using (
  exists (
    select 1 from public.events e
    where e.organizer_id = organizers.id
      and e.status = 'published'
  )
  or owner_id = (select auth.uid())
);

create policy "Users create own organizer"
on public.organizers for insert to authenticated
with check (owner_id = (select auth.uid()));

create policy "Owners update organizer"
on public.organizers for update to authenticated
using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));

-- Events: anyone can read published events; owners can read their own drafts.
create policy "Public read published events"
on public.events for select to anon, authenticated
using (
  status = 'published'
  or exists (
    select 1 from public.organizers o
    where o.id = events.organizer_id
      and o.owner_id = (select auth.uid())
  )
);

create policy "Organizer creates own events"
on public.events for insert to authenticated
with check (
  status = 'draft'
  and exists (
    select 1 from public.organizers o
    where o.id = organizer_id
      and o.owner_id = (select auth.uid())
  )
);

create policy "Organizer updates own events"
on public.events for update to authenticated
using (
  exists (
    select 1 from public.organizers o
    where o.id = events.organizer_id
      and o.owner_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.organizers o
    where o.id = events.organizer_id
      and o.owner_id = (select auth.uid())
  )
);

-- Sources: publicly readable only when attached to a published event.
create policy "Public read published event sources"
on public.event_sources for select to anon, authenticated
using (
  exists (
    select 1 from public.events e
    where e.id = event_sources.event_id
      and e.status = 'published'
  )
);

-- Bookmarks: each user manages only their own.
create policy "Users read own bookmarks"
on public.bookmarks for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Users create own bookmarks"
on public.bookmarks for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users delete own bookmarks"
on public.bookmarks for delete to authenticated
using ((select auth.uid()) = user_id);

-- Note: RLS controls row access, not every column-level privilege.
-- Keep publishing and privileged source writes behind validated server-side
-- operations; never expose the Supabase service-role key in browser code.
