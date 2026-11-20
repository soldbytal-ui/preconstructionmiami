import type { Metadata } from 'next';
import UnsubscribeButton from './UnsubscribeButton';

export const metadata: Metadata = { title: 'Unsubscribe', robots: { index: false, follow: false } };

export default async function Unsubscribe({ searchParams }: { searchParams: Promise<{ e?: string; t?: string }> }) {
  const { e, t } = await searchParams;
  return (
    <div className="container-main py-24 max-w-xl">
      <h1 className="text-4xl tracking-[-0.04em] text-text-primary">Unsubscribe</h1>
      {e && t ? <UnsubscribeButton e={e} t={t} /> : <p className="mt-4 text-text-muted">This link is incomplete. Use the unsubscribe link at the bottom of any email from us, or write to us from the contact page and we will remove you.</p>}
    </div>
  );
}
