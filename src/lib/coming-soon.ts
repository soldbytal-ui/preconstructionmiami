// The "Get notified when sales open" sign-up. Leads stay in this site's own admin. No imports: shared with tests.

export const COMING_SOON_SOURCE = 'coming-soon';
export const CONSENT_WORDING = 'Email me when sales open for this project, and with related updates from Preconstruction Miami. I can unsubscribe at any time.';

/** A coming-soon sign-up needs a project and a ticked opt-in box. Returns the problem, or null. */
export function comingSoonProblem(data: { source?: string; projectId?: string; consent?: boolean }): string | null {
  if (data.source !== COMING_SOON_SOURCE) return null;
  if (!data.projectId) return 'Missing project.';
  if (data.consent !== true) return 'Please tick the box to agree to be emailed.';
  return null;
}

/** The note stored with the lead, so the admin shows exactly what the visitor agreed to and when. */
export function consentNote(at: Date = new Date()): string {
  return `[Opted in to email on ${at.toISOString().slice(0, 10)}: "${CONSENT_WORDING}"]`;
}
