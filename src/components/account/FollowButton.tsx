'use client';

import { useAccount } from './AccountProvider';

export default function FollowButton({
  projectId,
  projectName,
  source = 'listing',
  className = '',
}: {
  projectId: string;
  projectName: string;
  source?: string;
  className?: string;
}) {
  const { ready, follows, toggleFollow } = useAccount();
  if (!ready) return null;
  const on = follows.has(projectId);
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={() => toggleFollow(projectId, projectName, source)}
      className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
        on ? 'border-accent-green/40 bg-accent-green/10 text-accent-green' : 'border-border bg-surface2 text-text-primary hover:border-accent-green/40'
      } ${className}`}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill={on ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 4h14v17l-7-4.5L5 21V4z" />
      </svg>
      {on ? 'Following' : 'Follow this tower'}
    </button>
  );
}
