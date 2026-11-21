-- NOT YET APPLIED. Run only after Tal says go: this changes the production database.
-- Additive only. Two new optional columns on projects, and one new table.

alter table public.projects add column if not exists "folioNumber" text;      -- county property folio, e.g. 01-3137-031-0020
alter table public.projects add column if not exists "applicantEntity" text;  -- the legal entity named on applications

create table if not exists public.stage_suggestions (
  id text primary key,
  key text not null unique,                 -- project + agenda link + item + stage: one suggestion per finding
  "projectId" text not null references public.projects(id) on delete cascade,
  "proposedStage" text not null,
  "sourceUrl" text not null check ("sourceUrl" ~* '^https?://[^ ]+\.[^ ]+'),
  "sourceLabel" text not null,
  "itemNumber" text,
  "meetingDate" date not null,
  body text not null,
  source text not null,
  "matchStrength" text not null check ("matchStrength" in ('folio','address','applicant','name')),
  "matchDetail" text not null,
  "itemTitle" text not null,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  "createdAt" timestamptz not null default now(),
  "decidedAt" timestamptz,
  "decidedBy" text
);
create index if not exists stage_suggestions_status on public.stage_suggestions (status, "createdAt" desc);
alter table public.stage_suggestions enable row level security;
-- No policies: suggestions are never public. Only the server reads or writes them.
