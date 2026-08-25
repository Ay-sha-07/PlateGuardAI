-- Cloud-synced account data. localStorage is used as the fast device cache,
-- while these tables keep profiles and scan history available across devices.
-- Supabase Auth supplies the user_id used by the RLS policies below.
-- Run this file in the Supabase SQL Editor when setting up a new project.
--
-- Run in Supabase SQL Editor
create table if not exists public.user_profiles (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  "createdAt" bigint not null,
  active boolean default false,
  name text,
  data jsonb not null
);
create table if not exists public.scan_history (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  "profileId" text, "profileName" text, mode text, image text, rating numeric,
  headline text, "productGuess" text, "createdAt" bigint
);
alter table public.user_profiles enable row level security;
alter table public.scan_history enable row level security;
drop policy if exists "own profiles" on public.user_profiles;
drop policy if exists "own history" on public.scan_history;
create policy "own profiles" on public.user_profiles for all using (auth.uid()=user_id) with check (auth.uid()=user_id);
create policy "own history" on public.scan_history for all using (auth.uid()=user_id) with check (auth.uid()=user_id);

-- Stores the complete structured AI response for each scan so the History
-- detail view can reproduce what the AI concluded at scan time.
alter table public.scan_history add column if not exists "aiResult" jsonb;
