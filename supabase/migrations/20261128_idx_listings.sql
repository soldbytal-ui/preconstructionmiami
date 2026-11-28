-- Resale and rental listings from the MLS feed, tied to building profiles.
-- NOT APPLIED. Apply only when Tal says yes and the feed agreement is signed.

alter table buildings add column if not exists "addressAliases" text[] default '{}';   -- other street addresses the same tower is listed under
alter table buildings add column if not exists "zip" text;

create table if not exists idx_listings (
  "key" text primary key,
  "mlsId" text,
  "buildingId" text not null references buildings(id) on delete cascade,
  "bucket" text not null check ("bucket" in ('forSale','forLease','sold','leased')),
  "status" text not null,
  "price" numeric, "closePrice" numeric, "closeDate" date,
  "address" text not null, "unit" text, "city" text, "zip" text,
  "latitude" double precision, "longitude" double precision,
  "beds" numeric, "baths" numeric, "sqft" numeric,
  "buildingName" text, "officeName" text, "agentName" text, "photoUrl" text,
  "daysOnMarket" integer, "modifiedAt" timestamptz,
  "matchedBy" text,
  "syncedAt" timestamptz not null default now()
);
create index if not exists idx_listings_building on idx_listings ("buildingId", "bucket");

-- Listings the feed sent that matched no building: the list to work through when adding building profiles.
create table if not exists idx_unmatched (
  "address" text primary key, "zip" text, "buildingName" text, "listings" integer not null default 1, "lastSeen" timestamptz not null default now()
);

create table if not exists idx_sync_runs (
  "id" bigserial primary key, "startedAt" timestamptz not null default now(), "finishedAt" timestamptz,
  "fetched" integer, "matched" integer, "removed" integer, "error" text
);

alter table idx_listings enable row level security;
alter table idx_unmatched enable row level security;
alter table idx_sync_runs enable row level security;
create policy "public can read listings" on idx_listings for select using (true);
-- idx_unmatched and idx_sync_runs: no public policy; the server key only.
