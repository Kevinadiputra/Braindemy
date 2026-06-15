-- schema.sql
-- Run this in the Supabase SQL Editor to set up your tables, triggers, and RLS policies.

-- 1. Create Profiles Table (extends auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  avatar_url text,
  role text check (role in ('SD', 'Mahasiswa')),
  current_roadmap jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create Progress Table
create table if not exists public.progress (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  lesson_id text not null,
  status text not null check (status in ('locked', 'active', 'completed')),
  completed_at timestamp with time zone,
  unique (user_id, lesson_id)
);

-- 3. Create Achievements Table
create table if not exists public.achievements (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  achievement_id text not null,
  earned_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (user_id, achievement_id)
);

-- 4. Create XP Table
create table if not exists public.xp (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null unique,
  total_xp integer default 0 not null,
  current_level integer default 1 not null,
  streak integer default 1 not null,
  last_active_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.progress enable row level security;
alter table public.achievements enable row level security;
alter table public.xp enable row level security;

-- RLS Policies: Profiles
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile" 
  on public.profiles for select 
  using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" 
  on public.profiles for update 
  using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile" 
  on public.profiles for insert 
  with check (auth.uid() = id);

-- RLS Policies: Progress
drop policy if exists "Users can view own progress" on public.progress;
create policy "Users can view own progress" 
  on public.progress for select 
  using (auth.uid() = user_id);

drop policy if exists "Users can update own progress" on public.progress;
create policy "Users can update own progress" 
  on public.progress for update 
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own progress" on public.progress;
create policy "Users can insert own progress" 
  on public.progress for insert 
  with check (auth.uid() = user_id);

-- RLS Policies: Achievements
drop policy if exists "Users can view own achievements" on public.achievements;
create policy "Users can view own achievements" 
  on public.achievements for select 
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own achievements" on public.achievements;
create policy "Users can insert own achievements" 
  on public.achievements for insert 
  with check (auth.uid() = user_id);

-- RLS Policies: XP
drop policy if exists "Users can view own xp" on public.xp;
create policy "Users can view own xp" 
  on public.xp for select 
  using (auth.uid() = user_id);

drop policy if exists "Users can update own xp" on public.xp;
create policy "Users can update own xp" 
  on public.xp for update 
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own xp" on public.xp;
create policy "Users can insert own xp" 
  on public.xp for insert 
  with check (auth.uid() = user_id);

-- 5. Trigger to automatically handle profile & xp creation on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  -- Insert profile if not exists (handling Google/email signups)
  insert into public.profiles (id, email, full_name, avatar_url, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', 'User'),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture'),
    new.raw_user_meta_data->>'role'
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url);
  
  -- Insert starting XP
  insert into public.xp (user_id, total_xp, current_level, streak)
  values (new.id, 0, 1, 1)
  on conflict (user_id) do nothing;
  
  return new;
end;
$$ language plpgsql security definer;

-- Recreate trigger cleanly
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
