import { STATUS_LABELS } from '@/lib/utils';

// Stage is shown as a dot beside the label, never by text colour alone
const DOT: Record<string, string> = {
  PRE_LAUNCH: '#D99A22',
  PRE_CONSTRUCTION: '#D99A22',
  UNDER_CONSTRUCTION: '#E8563F',
  NEAR_COMPLETION: '#1E7A72',
  COMPLETED: '#8A9098',
};

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-surface px-2.5 py-1 text-xs font-semibold text-text-primary">
      <span className="h-2 w-2 rounded-full" style={{ background: DOT[status] || DOT.COMPLETED }} aria-hidden />
      {STATUS_LABELS[status] || status}
    </span>
  );
}
