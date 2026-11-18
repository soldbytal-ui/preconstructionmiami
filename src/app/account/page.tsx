import type { Metadata } from 'next';
import { Suspense } from 'react';
import AccountDashboard from '@/components/account/AccountDashboard';

export const metadata: Metadata = {
  title: 'My account',
  robots: { index: false, follow: false },
};

export default function AccountPage() {
  return (
    <div className="pt-24 pb-24">
      <div className="container-main">
        <Suspense fallback={<p className="text-text-muted">Loading your account…</p>}>
          <AccountDashboard />
        </Suspense>
      </div>
    </div>
  );
}
