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
