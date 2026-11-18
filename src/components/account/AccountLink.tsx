'use client';

import Link from 'next/link';
import { useAccount } from './AccountProvider';

/** Menu entry: "Sign in" for visitors, "My towers" once signed in. Hidden until accounts are switched on. */
export default function AccountLink({ className }: { className: string }) {
  const { ready, loaded, user, follows, openSignup } = useAccount();
  if (!loaded || !ready) return null;
  if (user) {
    return (
      <Link href="/account" className={className}>
        My towers{follows.size ? ` (${follows.size})` : ''}
      </Link>
    );
  }
  return (
    <button type="button" className={className} onClick={() => openSignup({ source: 'menu' })}>
      Sign in
    </button>
  );
}
