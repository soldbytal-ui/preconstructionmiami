import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fnyrtptmcazhmoztmuay.supabase.co';

// The anon key is public by design (it ships in the browser bundle). What it is
// allowed to do is controlled by row-level security in the database.
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZueXJ0cHRtY2F6aG1venRtdWF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3NjE3MDEsImV4cCI6MjA5MDMzNzcwMX0.g-xX5_3KjesxPDcs390w2c7J35PKN0niRzaTFRcHRiI';

/** Public, read-only client for listings, neighborhoods, developers and blog. */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Server-only client for leads, agents and CRM activity.
 * Uses SUPABASE_SERVICE_ROLE_KEY when it is set (required once row-level
 * security is switched on for those tables). Never import this in a client
 * component.
 */
export const hasServiceRole = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

export const supabaseAdmin = createClient(
  SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);
