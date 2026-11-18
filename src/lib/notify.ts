type LeadAlert = {
  name: string;
  email: string;
  phone: string | null;
  message: string | null;
  source: string;
  projectName: string | null;
};

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));

/**
 * Emails the owner when a lead comes in. Active once RESEND_API_KEY and
 * LEAD_NOTIFY_EMAIL are set in Vercel; a no-op until then.
 */
export async function notifyNewLead(lead: LeadAlert): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.LEAD_NOTIFY_EMAIL;
  if (!apiKey || !to) return;

  const from = process.env.LEAD_NOTIFY_FROM || 'PreConstructionMiami Leads <onboarding@resend.dev>';
  const rows: [string, string | null][] = [
    ['Name', lead.name],
    ['Email', lead.email],
    ['Phone', lead.phone],
    ['Project', lead.projectName],
    ['Source', lead.source],
    ['Message', lead.message],
  ];
  const html = `
    <h2 style="font-family:sans-serif">New lead on PreConstructionMiami.net</h2>
    <table style="font-family:sans-serif;font-size:14px;border-collapse:collapse">
      ${rows
        .filter(([, v]) => v)
        .map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#666">${k}</td><td style="padding:4px 0">${esc(v as string)}</td></tr>`)
        .join('')}
    </table>
    <p style="font-family:sans-serif;font-size:13px"><a href="https://preconstructionmiami.net/admin/leads">Open in the admin</a></p>`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: to.split(',').map((s) => s.trim()),
      reply_to: lead.email,
      subject: `New lead: ${lead.name}${lead.projectName ? ` — ${lead.projectName}` : ''}`,
      html,
    }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
}

export const emailConfigured = Boolean(process.env.RESEND_API_KEY);

/** Sends one email to a visitor. Returns false (and sends nothing) until RESEND_API_KEY is set. */
export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;
  const from = process.env.ACCOUNT_EMAIL_FROM || process.env.LEAD_NOTIFY_FROM || 'PreConstruction Miami <onboarding@resend.dev>';
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [to], subject, html }),
  });
  if (!res.ok) {
    console.error(`Resend ${res.status}: ${await res.text()}`);
    return false;
  }
  return true;
}

export function linkEmail(name: string, url: string, firstTime: boolean): string {
  const first = esc(name.split(' ')[0] || 'there');
  return `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#111;max-width:480px">
    <p>Hi ${first},</p>
    <p>${firstTime ? 'Confirm your email to finish setting up your PreConstruction Miami account.' : 'Use this link to sign in to your PreConstruction Miami account.'}</p>
    <p><a href="${url}" style="display:inline-block;background:#00E5B4;color:#04121a;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:10px">${firstTime ? 'Confirm my email' : 'Sign in'}</a></p>
    <p style="color:#666;font-size:13px">The link works for ${firstTime ? '7 days' : '30 minutes'}. If you did not ask for it, ignore this email.</p>
  </div>`;
}
