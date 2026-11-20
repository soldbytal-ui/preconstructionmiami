// Sends every lead to Zekal, where it lands in the "Preconstruction Miami" tenant.
// No imports: shared with the tests.

export const ZEKAL_TENANT = 'Preconstruction Miami';

export type OutboundLead = {
  name: string;
  email: string;
  phone?: string | null;
  message?: string | null;
  source: string;
  projectId?: string | null;
  projectName?: string | null;
  neighborhoodId?: string | null;
  /** Set when the visitor ticked the email opt-in box. */
  consent?: { email: boolean; at: string; wording: string } | null;
  pageUrl?: string | null;
};

export type ZekalConfig = { url?: string; apiKey?: string; tenant?: string; timeoutMs?: number; fetchImpl?: typeof fetch };

export function zekalConfigFromEnv(env: Record<string, string | undefined> = process.env): ZekalConfig {
  return { url: env.ZEKAL_LEAD_URL, apiKey: env.ZEKAL_API_KEY, tenant: env.ZEKAL_TENANT || ZEKAL_TENANT };
}

export function buildZekalPayload(lead: OutboundLead, tenant = ZEKAL_TENANT) {
  return {
    tenant,
    source: lead.source,
    project_id: lead.projectId || null,
    project_name: lead.projectName || null,
    neighborhood_id: lead.neighborhoodId || null,
    contact: { name: lead.name, email: lead.email.toLowerCase(), phone: lead.phone || null },
    message: lead.message || null,
    consent: lead.consent ? { email_opt_in: lead.consent.email, recorded_at: lead.consent.at, wording: lead.consent.wording } : null,
    page_url: lead.pageUrl || null,
    site: 'preconstructionmiami.net',
    sent_at: new Date().toISOString(),
  };
}

export type ZekalResult = { sent: boolean; status?: number; reason?: string };

async function post(body: unknown, cfg: ZekalConfig): Promise<ZekalResult> {
  if (!cfg.url) return { sent: false, reason: 'not-configured' };
  const f = cfg.fetchImpl || fetch;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), cfg.timeoutMs ?? 6000);
  try {
    const res = await f(cfg.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(cfg.apiKey ? { Authorization: `Bearer ${cfg.apiKey}` } : {}) },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    return res.ok ? { sent: true, status: res.status } : { sent: false, status: res.status, reason: 'rejected' };
  } catch (e: any) {
    return { sent: false, reason: e?.name === 'AbortError' ? 'timeout' : 'network' };
  } finally {
    clearTimeout(timer);
  }
}

/** Post one lead to Zekal's inbound endpoint. Never throws: a Zekal outage must not lose the lead. */
export function postLeadToZekal(lead: OutboundLead, cfg: ZekalConfig = zekalConfigFromEnv()): Promise<ZekalResult> {
  return post(buildZekalPayload(lead, cfg.tenant || ZEKAL_TENANT), cfg);
}

/** Tell Zekal an address has unsubscribed, so no tenant email goes to it again. */
export function postUnsubscribeToZekal(email: string, cfg: ZekalConfig = zekalConfigFromEnv()): Promise<ZekalResult> {
  return post({ tenant: cfg.tenant || ZEKAL_TENANT, type: 'unsubscribe', email: email.toLowerCase(), site: 'preconstructionmiami.net', sent_at: new Date().toISOString() }, cfg);
}

export const COMING_SOON_SOURCE = 'coming-soon';
export const CONSENT_WORDING = 'Email me when sales open for this project, and with related updates from Preconstruction Miami. I can unsubscribe at any time.';

/** A coming-soon sign-up needs a project and a ticked opt-in box. Returns the problem, or null. */
export function comingSoonProblem(data: { source?: string; projectId?: string; consent?: boolean }): string | null {
  if (data.source !== COMING_SOON_SOURCE) return null;
  if (!data.projectId) return 'Missing project.';
  if (data.consent !== true) return 'Please tick the box to agree to be emailed.';
  return null;
}
