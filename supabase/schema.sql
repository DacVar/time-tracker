-- ============================================================
-- TimeTracker — Supabase schema
-- Run once in the Supabase SQL editor (safe to re-run).
-- ============================================================

-- ── Tables ──────────────────────────────────────────────────

create table if not exists public.categories (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null    default auth.uid() references auth.users(id) on delete cascade,
  name       text        not null,
  color      text        not null    default '#6366f1',
  created_at timestamptz not null    default now()
);

create table if not exists public.tasks (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null    default auth.uid() references auth.users(id) on delete cascade,
  category_id uuid                    references public.categories(id) on delete set null,
  title       text        not null,
  description text,
  is_active   boolean     not null    default true,
  created_at  timestamptz not null    default now()
);

create table if not exists public.time_entries (
  id               uuid        primary key default gen_random_uuid(),
  user_id          uuid        not null    default auth.uid() references auth.users(id) on delete cascade,
  task_id          uuid        not null    references public.tasks(id) on delete cascade,
  started_at       timestamptz not null    default now(),
  ended_at         timestamptz,
  duration_seconds integer,
  notes            text,
  source           text        not null    default 'timer' check (source in ('timer', 'manual')),
  created_at       timestamptz not null    default now()
);

-- ── Row Level Security ───────────────────────────────────────

alter table public.categories  enable row level security;
alter table public.tasks        enable row level security;
alter table public.time_entries enable row level security;

-- Drop existing policies so this script is idempotent
do $$ declare r record; begin
  for r in
    select policyname, tablename
    from pg_policies
    where schemaname = 'public'
      and tablename in ('categories', 'tasks', 'time_entries')
  loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

-- categories ─────────────────────────────────────────────────
-- USING  → filters rows visible to the user (SELECT, UPDATE, DELETE)
-- WITH CHECK → validates rows the user is allowed to write (INSERT, UPDATE)

create policy "categories_select"
  on public.categories for select
  using (auth.uid() = user_id);

create policy "categories_insert"
  on public.categories for insert
  with check (auth.uid() = user_id);

create policy "categories_update"
  on public.categories for update
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "categories_delete"
  on public.categories for delete
  using (auth.uid() = user_id);

-- tasks ───────────────────────────────────────────────────────

create policy "tasks_select"
  on public.tasks for select
  using (auth.uid() = user_id);

create policy "tasks_insert"
  on public.tasks for insert
  with check (auth.uid() = user_id);

create policy "tasks_update"
  on public.tasks for update
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "tasks_delete"
  on public.tasks for delete
  using (auth.uid() = user_id);

-- time_entries ────────────────────────────────────────────────

create policy "entries_select"
  on public.time_entries for select
  using (auth.uid() = user_id);

create policy "entries_insert"
  on public.time_entries for insert
  with check (auth.uid() = user_id);

create policy "entries_update"
  on public.time_entries for update
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "entries_delete"
  on public.time_entries for delete
  using (auth.uid() = user_id);

-- ── Performance indexes ──────────────────────────────────────

create index if not exists idx_categories_user  on public.categories(user_id);
create index if not exists idx_tasks_user        on public.tasks(user_id);
create index if not exists idx_tasks_category    on public.tasks(category_id);
create index if not exists idx_entries_user      on public.time_entries(user_id);
create index if not exists idx_entries_task      on public.time_entries(task_id);
create index if not exists idx_entries_started   on public.time_entries(started_at desc);
