import Link from 'next/link';
import { STAGES, type StageRecord, stageIndex, formatDay, sourceHost, daysSince, RECHECK_DAYS } from '@/lib/approval';

const GUIDE = '/guides/miami-approval-stages';

/**
 * Where the project is in its public approval process. A stage only appears with the public
 * record it was read from and the date it was confirmed; without a record it says so.
 */
export default function ApprovalStage({ record, compact = false }: { record: StageRecord | null; compact?: boolean }) {
  if (!record) {
    return (
      <div className={compact ? 'rounded-xl bg-[#f4f6f8] p-3' : 'rounded-xl border border-border bg-surface p-4'}>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-[#9aa3ab] px-2.5 py-1 text-xs font-semibold text-[#4a515b]">
            <span className="h-2 w-2 rounded-full border border-[#9aa3ab]" aria-hidden />
            Stage not confirmed
          </span>
          {!compact && <Link href={GUIDE} className="text-xs underline text-text-muted hover:text-text-primary">What the approval stages mean</Link>}
        </div>
        {!compact && <p className="mt-2 text-sm text-text-muted">We have not yet matched this project to a public approval record, so we are not showing a stage for it.</p>}
      </div>
    );
  }
  const at = stageIndex(record.stage);
  const stale = record.stage !== 'completed' && daysSince(record.confirmedOn) > RECHECK_DAYS;
  return (
    <div className={compact ? 'rounded-xl bg-[#f4f6f8] p-3' : 'rounded-xl border border-border bg-surface p-4'}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#111B33] px-2.5 py-1 text-xs font-semibold text-white">
          <span className="h-2 w-2 rounded-full bg-[#E8563F]" aria-hidden />
          {STAGES[at].label}
        </span>
        <span className={`text-xs ${compact ? 'text-[#5b6770]' : 'text-text-muted'}`}>Approval stage {at + 1} of {STAGES.length}</span>
      </div>
      <ol className="mt-3 flex gap-1" aria-label={`Approval progress: ${STAGES[at].label}, stage ${at + 1} of ${STAGES.length}`}>
        {STAGES.map((s, i) => (
          <li key={s.key} title={s.label} className={`h-2 flex-1 rounded-full ${i < at ? 'bg-[#111B33]' : i === at ? 'bg-[#E8563F]' : 'bg-[#D9DEE5]'}`}>
            <span className="sr-only">{s.label}{i === at ? ' (current)' : i < at ? ' (passed)' : ''}</span>
          </li>
        ))}
      </ol>
      {!compact && (
        <div className="mt-1.5 hidden justify-between text-[11px] text-text-muted sm:flex">
          <span>Proposed</span><span>Approved</span><span>Completed</span>
        </div>
      )}
      {!compact && <p className="mt-3 text-sm text-text-primary">{STAGES[at].hint}.{record.note ? ` ${record.note}` : ''}</p>}
      <p className={`mt-2 text-xs ${compact ? 'text-[#5b6770]' : 'text-text-muted'}`}>
        Confirmed {formatDay(record.confirmedOn)} from{' '}
        <a href={record.sourceUrl} target="_blank" rel="noopener noreferrer nofollow" className="font-medium underline text-[#111B33]">
          {record.sourceLabel || sourceHost(record.sourceUrl)}
        </a>
        {stale ? '. This may have moved on since; check the record for the latest.' : '.'}
      </p>
      {!compact && <p className="mt-2 text-xs"><Link href={GUIDE} className="underline text-text-muted hover:text-text-primary">What the approval stages mean</Link></p>}
    </div>
  );
}
