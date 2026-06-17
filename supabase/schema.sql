-- MCP Workflow — Supabase schema
-- Run this in your Supabase SQL editor (Dashboard → SQL Editor → New query)
-- https://supabase.com/dashboard/project/<your-project>/sql/new

-- ─── Extensions ──────────────────────────────────────────────────────────────
create extension if not exists "pgcrypto";

-- ─── Agents ──────────────────────────────────────────────────────────────────
create table if not exists public.agents (
  id          text        primary key,
  name        text        not null,
  emoji       text        not null default '🤖',
  caps        text[]      not null default '{}',
  status      text        not null default 'active'
                          check (status in ('active','idle','warn','offline')),
  version     text        not null default '1.0.0',
  model       text        not null default 'claude-sonnet-4-6',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ─── Workflows ───────────────────────────────────────────────────────────────
create table if not exists public.workflows (
  id          text        primary key,
  name        text        not null,
  mode        text        not null default 'dag'
                          check (mode in ('dag','sequential','parallel')),
  nodes       jsonb       not null default '[]',
  edges       jsonb       not null default '[]',
  schedule    jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ─── Run logs ─────────────────────────────────────────────────────────────────
create table if not exists public.run_logs (
  id           uuid        primary key default gen_random_uuid(),
  workflow_id  text        not null references public.workflows(id) on delete cascade,
  events       jsonb       not null default '[]',
  status       text        not null default 'running'
                           check (status in ('running','done','error')),
  started_at   timestamptz not null default now(),
  finished_at  timestamptz
);

-- ─── Updated_at triggers ─────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger agents_updated_at
  before update on public.agents
  for each row execute procedure public.set_updated_at();

create trigger workflows_updated_at
  before update on public.workflows
  for each row execute procedure public.set_updated_at();

-- ─── Row-level security ───────────────────────────────────────────────────────
-- Enable RLS (add auth policies once you add user accounts)
alter table public.agents    enable row level security;
alter table public.workflows enable row level security;
alter table public.run_logs  enable row level security;

-- Prototype: allow all authenticated and anon reads/writes
-- REPLACE with proper user-scoped policies before going to production
create policy "allow_all_agents"    on public.agents    for all using (true) with check (true);
create policy "allow_all_workflows" on public.workflows for all using (true) with check (true);
create policy "allow_all_run_logs"  on public.run_logs  for all using (true) with check (true);

-- ─── Seed data ────────────────────────────────────────────────────────────────
insert into public.agents (id, name, emoji, caps, status, version, model) values
  ('orchestrator-v1',  'Orchestrator', '🎛️', array['orchestrate'],              'active', '1.0.0', 'claude-sonnet-4-6'),
  ('search-agent-v1',  'Search',       '🔍', array['web_search','url_fetch'],   'active', '1.0.0', 'gpt-4o'),
  ('code-agent-v1',    'Code',         '💻', array['run_code','write_code'],    'active', '1.0.0', 'claude-opus-4-6'),
  ('summary-agent-v1', 'Summary',      '📝', array['summarize','extract'],      'active', '1.0.0', 'gemini-2.0-flash'),
  ('memory-agent-v1',  'Memory',       '🧠', array['store','retrieve'],         'idle',   '1.0.0', 'claude-sonnet-4-6'),
  ('file-agent-v1',    'File I/O',     '📁', array['read_file','write_file'],  'warn',   '1.0.0', 'gpt-4o-mini')
on conflict (id) do nothing;
