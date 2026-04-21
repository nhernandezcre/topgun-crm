-- Should I Buy This?  initial schema
-- Apply in Supabase SQL editor, or via `supabase db push`.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- users (extends auth.users with product profile)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz not null default now(),
  stripe_customer_id text,
  subscription_status text not null default 'free',    -- free | pro | canceled | past_due
  subscription_interval text,                          -- monthly | annual | null
  subscription_period_end timestamptz,
  streak_days int not null default 0,
  streak_last_day date,
  saved_total_cents bigint not null default 0,
  verdicts_this_month int not null default 0,
  month_anchor date not null default date_trunc('month', now())::date
);

-- ---------------------------------------------------------------------------
-- verdicts: every scan the user runs
-- ---------------------------------------------------------------------------
create table if not exists public.verdicts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  input_kind text not null,                            -- photo | link | screenshot
  input_url text,
  input_image_path text,
  product_name text,
  product_brand text,
  product_category text,
  product_model text,
  listed_price_cents int,
  fair_price_cents int,
  price_trend text,                                    -- rising | flat | falling | unknown
  history jsonb,                                       -- [{ date, price_cents }]
  verdict text,                                        -- BUY | SKIP | WAIT
  confidence int,                                      -- 0..100
  reason text,
  reddit_summary text,
  reddit_sources jsonb,                                -- [{ title, url, subreddit }]
  alternatives jsonb,                                  -- [{ name, price_cents, why, url, affiliate_url }]
  move text,                                           -- the one-sentence action
  bought_anyway boolean default false,
  share_image_path text,
  raw jsonb                                            -- full payload for future use
);

create index if not exists verdicts_user_id_created_at_idx on public.verdicts(user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- wishlist: things we're watching for a price drop
-- ---------------------------------------------------------------------------
create table if not exists public.wishlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  verdict_id uuid not null references public.verdicts(id) on delete cascade,
  created_at timestamptz not null default now(),
  target_price_cents int not null,
  last_seen_price_cents int,
  last_checked_at timestamptz,
  notified_at timestamptz,
  active boolean not null default true
);

create index if not exists wishlist_active_idx on public.wishlist(active) where active;

-- ---------------------------------------------------------------------------
-- push subscriptions (one row per browser)
-- ---------------------------------------------------------------------------
create table if not exists public.push_subs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.verdicts enable row level security;
alter table public.wishlist enable row level security;
alter table public.push_subs enable row level security;

drop policy if exists "profiles self" on public.profiles;
create policy "profiles self" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "verdicts self" on public.verdicts;
create policy "verdicts self" on public.verdicts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "wishlist self" on public.wishlist;
create policy "wishlist self" on public.wishlist
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "push_subs self" on public.push_subs;
create policy "push_subs self" on public.push_subs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- trigger: auto-create profile when auth.users row is inserted
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email)
    on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------------
-- storage bucket for uploaded scan images (private)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
  values ('scans', 'scans', false)
  on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
  values ('shares', 'shares', true)
  on conflict (id) do nothing;

drop policy if exists "scans read self" on storage.objects;
create policy "scans read self" on storage.objects
  for select using (bucket_id = 'scans' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "scans write self" on storage.objects;
create policy "scans write self" on storage.objects
  for insert with check (bucket_id = 'scans' and auth.uid()::text = (storage.foldername(name))[1]);
