// City of Miami meeting portal (miamifl.iqm2.com): reads the public calendar and the public
// "web outline" of each relevant meeting. Parsing only; fetching is done by the caller through
// the polite fetcher. No imports beyond types: shared with tests.
//
// Checked 21 Nov 2026: robots.txt allows all agents and asks for Crawl-delay: 60. No terms-of-use
// page restricting automated reading was found on the portal. Pages carry a noindex tag, which
// is about search engines listing them; we link to them and do not republish them.
import type { AgendaItem } from './agenda-match';

export const MIAMI_HOST = 'https://miamifl.iqm2.com';
export const MIAMI_CALENDAR = `${MIAMI_HOST}/Citizens/Calendar.aspx`;
export const MIAMI_CRAWL_DELAY_MS = 60_000;

const BOARDS = ['Planning, Zoning and Appeals Board', 'Urban Development Review Board', 'City Commission'];
const strip = (h: string) => h.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&rsquo;|&lsquo;/g, "'").replace(/&ldquo;|&rdquo;/g, '"').replace(/\s+/g, ' ').trim();
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const iso = (y: number, m: number, d: number) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

export type MeetingRef = { id: string; url: string; board: string; date: string };

/** Meetings of the boards that hear development items, from the calendar page. */
export function parseMiamiCalendar(html: string): MeetingRef[] {
  const out = new Map<string, MeetingRef>();
  const parts = html.split(/(?=<a[^>]+Detail_Meeting\.aspx\?ID=\d+)/i);
  for (const part of parts) {
    const id = part.match(/Detail_Meeting\.aspx\?ID=(\d+)/i)?.[1];
    if (!id || out.has(id)) continue;
    const text = strip(part.slice(0, 1500));
    const board = BOARDS.find((b) => text.toLowerCase().includes(b.toLowerCase()));
    const m = text.match(/\b([A-Z][a-z]{2})[a-z]* (\d{1,2}), (\d{4})\b/);
    const mi = m ? MONTHS.indexOf(m[1].toLowerCase()) : -1;
    if (!board || !m || mi < 0) continue;
    out.set(id, { id, url: `${MIAMI_HOST}/Citizens/Detail_Meeting.aspx?ID=${id}`, board, date: iso(Number(m[3]), mi + 1, Number(m[2])) });
  }
  return [...out.values()];
}

/** The agenda items on one meeting's public outline page. Each links to its own public file page. */
export function parseMiamiMeeting(html: string, ref: Pick<MeetingRef, 'id' | 'board' | 'date'>): AgendaItem[] {
  // The page title confirms the board and date: "2026/01/07 06:30 PM Planning, Zoning and Appeals Board Regular Meeting - Web Outline"
  const title = strip(html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || '');
  const t = title.match(/^(\d{4})\/(\d{2})\/(\d{2})\b/);
  const date = t ? `${t[1]}-${t[2]}-${t[3]}` : ref.date;
  const board = BOARDS.find((b) => title.toLowerCase().includes(b.toLowerCase())) || ref.board;
  const items: AgendaItem[] = [];
  const seen = new Set<string>();
  const re = /<a[^>]+href="([^"]*Detail_LegiFile\.aspx\?[^"]*?[?&;]ID=(\d+)[^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
  for (let m; (m = re.exec(html)); ) {
    const fileId = m[2]; const text = strip(m[3]);
    if (seen.has(fileId) || text.length < 25) continue; // short anchors are file-number links, not titles
    seen.add(fileId);
    items.push({
      source: 'City of Miami', body: board, meetingDate: date, itemNumber: String(items.length + 1),
      title: text.slice(0, 240), text, result: null,
      url: `${MIAMI_HOST}/Citizens/Detail_LegiFile.aspx?MeetingID=${ref.id}&ID=${fileId}`,
    });
  }
  return items;
}

/** Which meetings to read on this run: near the present, not read in the last week, soonest first. */
export function pickMeetings(refs: MeetingRef[], lastRead: Record<string, string>, max: number, today = new Date()): MeetingRef[] {
  const day = 86_400_000; const now = today.getTime();
  return refs
    .filter((r) => { const d = Date.parse(r.date); return d > now - 14 * day && d < now + 45 * day; })
    .filter((r) => !lastRead[r.url] || now - Date.parse(lastRead[r.url]) > 7 * day)
    .sort((a, b) => Math.abs(Date.parse(a.date) - now) - Math.abs(Date.parse(b.date) - now))
    .slice(0, max);
}
