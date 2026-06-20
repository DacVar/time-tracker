-- ============================================================
-- fix_production.sql
-- Run this once in Supabase SQL Editor to repair the schema
-- that may have been created before all migrations were applied.
-- Safe to run multiple times.
-- ============================================================

-- 1. Add source column to time_entries if it doesn't exist yet
alter table public.time_entries
  add column if not exists source text not null default 'timer'
    check (source in ('timer', 'manual'));

-- 2. Ensure user_id columns default to auth.uid() on all tables
alter table public.categories   alter column user_id set default auth.uid();
alter table public.tasks        alter column user_id set default auth.uid();
alter table public.time_entries alter column user_id set default auth.uid();

-- 3. Recreate all RLS policies (drop existing ones first)
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

-- categories
create policy "categories_select" on public.categories
  for select using (auth.uid() = user_id);
create policy "categories_insert" on public.categories
  for insert with check (auth.uid() = user_id);
create policy "categories_update" on public.categories
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "categories_delete" on public.categories
  for delete using (auth.uid() = user_id);

-- tasks
create policy "tasks_select" on public.tasks
  for select using (auth.uid() = user_id);
create policy "tasks_insert" on public.tasks
  for insert with check (auth.uid() = user_id);
create policy "tasks_update" on public.tasks
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "tasks_delete" on public.tasks
  for delete using (auth.uid() = user_id);

-- time_entries
create policy "entries_select" on public.time_entries
  for select using (auth.uid() = user_id);
create policy "entries_insert" on public.time_entries
  for insert with check (auth.uid() = user_id);
create policy "entries_update" on public.time_entries
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "entries_delete" on public.time_entries
  for delete using (auth.uid() = user_id);
