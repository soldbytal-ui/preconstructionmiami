'use client';

import { usePathname } from 'next/navigation';

/** Public site chrome (menu, footer, chat) is hidden inside the admin area. */
export default function PublicOnly({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname?.startsWith('/admin')) return null;
  return <>{children}</>;
}
