import { STATUS_LABELS } from '@/lib/utils';

// Stage is shown as a dot beside the label, never by text colour alone
const DOT: Record<string, string> = {
  PRE_LAUNCH: '#D99A22',
  PRE_CONSTRUCTION: '#D99A22',
  UNDER_CONSTRUCTION: '#E8563F',
  NEAR_COMPLETION: '#1E7A72',
  COMPLETED: '#8A9098',
};

// A sold-out project keeps its build stage in the data, but the badge says what a buyer needs to know first
export default function StatusBadge({ status, soldOut }: { status: string; soldOut?: boolean | null }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-surface px-2.5 py-1 text-xs font-semibold text-text-primary">
      <span className="h-2 w-2 rounded-full" style={{ background: soldOut ? '#111B33' : DOT[status] || DOT.COMPLETED }} aria-hidden />
      {soldOut ? 'Sold out' : STATUS_LABELS[status] || status}
    </span>
  );
}
