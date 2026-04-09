'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function CRMTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Read crm_lid cookie
    const leadId = document.cookie
      .split('; ')
      .find(row => row.startsWith('crm_lid='))
      ?.split('=')[1];

    if (!leadId) return; // Not a known lead, do nothing

    // Send pageview to CRM — fire and forget
    fetch('https://preconstruction-crm.vercel.app/api/crm/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        leadId,
        page: pathname,
        title: document.title,
        url: window.location.href,
        referrer: document.referrer,
      }),
    }).catch(() => {}); // Never block the page
  }, [pathname]); // Fires on every page navigation

  return null; // No UI
}
