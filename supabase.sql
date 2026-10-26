create table if not exists public.daily_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  weight numeric(6,2),
  calories_intake integer,
  calories_burned integer,
  steps integer,
  sleep_hours numeric(4,2),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id,date)
);
create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  type text not null,
  duration_minutes integer,
  calories_burned integer,
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists daily_metrics_user_date_idx on public.daily_metrics(user_id,date);
create index if not exists activities_user_date_idx on public.activities(user_id,date);
alter table public.daily_metrics enable row level security;
alter table public.activities enable row level security;
drop policy if exists "Users can view own daily metrics" on public.daily_metrics;
create policy "Users can view own daily metrics" on public.daily_metrics for select using(auth.uid()=user_id);
drop policy if exists "Users can insert own daily metrics" on public.daily_metrics;
create policy "Users can insert own daily metrics" on public.daily_metrics for insert with check(auth.uid()=user_id);
drop policy if exists "Users can update own daily metrics" on public.daily_metrics;
create policy "Users can update own daily metrics" on public.daily_metrics for update using(auth.uid()=user_id) with check(auth.uid()=user_id);
drop policy if exists "Users can delete own daily metrics" on public.daily_metrics;
create policy "Users can delete own daily metrics" on public.daily_metrics for delete using(auth.uid()=user_id);
drop policy if exists "Users can view own activities" on public.activities;
create policy "Users can view own activities" on public.activities for select using(auth.uid()=user_id);
drop policy if exists "Users can insert own activities" on public.activities;
create policy "Users can insert own activities" on public.activities for insert with check(auth.uid()=user_id);
drop policy if exists "Users can update own activities" on public.activities;
create policy "Users can update own activities" on public.activities for update using(auth.uid()=user_id) with check(auth.uid()=user_id);
drop policy if exists "Users can delete own activities" on public.activities;
create policy "Users can delete own activities" on public.activities for delete using(auth.uid()=user_id);