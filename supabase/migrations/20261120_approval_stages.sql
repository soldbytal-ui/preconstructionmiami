-- NOT YET APPLIED. Run only after Tal says go: this changes the production database.
-- Adds the approval-stage record for each project and the email suppression list.
-- Additive only: no existing table or row is changed.

create table if not exists public.project_stage_records (
  id uuid primary key default gen_random_uuid(),
  "projectId" text not null references public.projects(id) on delete cascade,
  stage text not null check (stage in ('proposed','pre_application','under_review','hearing_scheduled','approved','permitted','under_construction','completed')),
  -- A stage cannot exist without the public record it came from.
  "sourceUrl" text not null check ("sourceUrl" ~* '^https?://[^ ]+\.[^ ]+'),
  "sourceLabel" text,
  "confirmedOn" date not null check ("confirmedOn" <= current_date + 1),
  note text,
  "createdBy" text,
  "createdAt" timestamptz not null default now()
);
create index if not exists project_stage_records_project on public.project_stage_records ("projectId", "confirmedOn" desc);

alter table public.project_stage_records enable row level security;
create policy "Stage records are public" on public.project_stage_records for select using (true);
-- No insert/update/delete policy: only the server (service role) writes.

create table if not exists public.email_suppressions (
  email text primary key,
  reason text not null default 'unsubscribe',
  "createdAt" timestamptz not null default now()
);
alter table public.email_suppressions enable row level security;
-- No policies: readable and writable by the server only.
