import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseMiamiCalendar, parseMiamiMeeting, pickMeetings } from '../src/lib/agenda-miami';
import { matchItem } from '../src/lib/agenda-match';

// Pages shaped like the City of Miami meeting portal, with fictional meetings, people and addresses.
const calendar = `
<div class="Row"><div class="RowLink"><a href="Detail_Meeting.aspx?ID=9001" title="x">Dec 2, 2026 9:00 AM</a></div><div>Code Enforcement (Special Magistrate) - Regular Meeting</div></div>
<div class="Row"><div class="RowLink"><a href="Detail_Meeting.aspx?ID=9002">Dec 16, 2026 2:00 PM</a></div><div>Urban Development Review Board - Regular Meeting</div><a href="FileOpen.aspx?Type=14&ID=1&Inline=True">Agenda</a></div>
<div class="Row"><div class="RowLink"><a href="Detail_Meeting.aspx?ID=9003">Dec 16, 2026 6:30 PM</a></div><div>Planning, Zoning and Appeals Board - Regular Meeting</div></div>
<div class="Row"><div class="RowLink"><a href="Detail_Meeting.aspx?ID=9004">Mar 11, 2027 9:00 AM</a></div><div>City Commission - Regular Meeting</div></div>`;

const meeting = `<html><head><title>
	2026/12/16 06:30 PM Planning, Zoning and Appeals Board Regular Meeting - Web Outline - Example, FL
</title></head><body><table>
<tr><td>1.</td><td><a href="Detail_LegiFile.aspx?Frame=&amp;MeetingID=9003&amp;MediaPosition=&amp;ID=70001&amp;CssClass=">70001</a></td>
<td><a href="Detail_LegiFile.aspx?Frame=&amp;MeetingID=9003&amp;MediaPosition=&amp;ID=70001&amp;CssClass=">PZAB-R-26-900 : A RESOLUTION OF THE PLANNING, ZONING AND APPEALS BOARD APPROVING THE ELECTION OF A CHAIRPERSON.</a></td></tr>
<tr><td>2.</td><td><a href="Detail_LegiFile.aspx?Frame=&amp;MeetingID=9003&amp;MediaPosition=&amp;ID=70002&amp;CssClass=">PZAB-R-26-901 : A RESOLUTION GRANTING AN EXCEPTION FOR A MIXED-USE TOWER FOR THE PROPERTY LOCATED AT APPROXIMATELY 45 SOUTHWEST SAMPLE STREET, EXAMPLE, FLORIDA; MAKING FINDINGS.</a></td></tr>
</table></body></html>`;

test('the calendar yields only the boards that hear development items', () => {
  const refs = parseMiamiCalendar(calendar);
  assert.deepEqual(refs.map((r) => [r.id, r.board, r.date]), [
    ['9002', 'Urban Development Review Board', '2026-12-16'],
    ['9003', 'Planning, Zoning and Appeals Board', '2026-12-16'],
    ['9004', 'City Commission', '2027-03-11'],
  ]);
});

test('a meeting page yields its items, each with its own public link', () => {
  const items = parseMiamiMeeting(meeting, { id: '9003', board: 'x', date: '2000-01-01' });
  assert.equal(items.length, 2);
  assert.deepEqual([items[1].body, items[1].meetingDate, items[1].itemNumber], ['Planning, Zoning and Appeals Board', '2026-12-16', '2']);
  assert.equal(items[1].url, 'https://miamifl.iqm2.com/Citizens/Detail_LegiFile.aspx?MeetingID=9003&ID=70002');
});

test('an item written the City way matches a project by its street address', () => {
  const items = parseMiamiMeeting(meeting, { id: '9003', board: 'x', date: '2000-01-01' });
  const projects = [{ id: 'demo-meridian', name: 'Meridian Brickell (example)', address: '45 SW Sample St, Example, FL' }];
  assert.equal(matchItem(items[0], projects), null);
  assert.deepEqual([matchItem(items[1], projects)?.strength], ['address']);
});

test('only nearby meetings not read this week are picked, at most N per run', () => {
  const refs = parseMiamiCalendar(calendar);
  const today = new Date('2026-11-21T12:00:00Z');
  assert.deepEqual(pickMeetings(refs, {}, 5, today).map((r) => r.id), ['9002', '9003']); // March is too far off
  assert.deepEqual(pickMeetings(refs, { [refs[0].url]: '2026-11-20T00:00:00Z' }, 5, today).map((r) => r.id), ['9003']);
  assert.equal(pickMeetings(refs, {}, 1, today).length, 1);
});
