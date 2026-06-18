-- Migration: add source column to time_entries
-- Run this in the Supabase SQL Editor if you already have the table created
-- without the source column. Safe to run multiple times.

do $$ begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name   = 'time_entries'
      and column_name  = 'source'
  ) then
    alter table public.time_entries
      add column source text not null default 'timer'
        check (source in ('timer', 'manual'));
  end if;
end $$;
