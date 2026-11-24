'use client';

import dynamic from 'next/dynamic';
import { loadBuildings } from '@/components/map/mapShared';

// Ask for the towers straight away, while the map code is still downloading, so the two arrive together
if (typeof window !== 'undefined') loadBuildings();

const MiamiWorld = dynamic(() => import('./MiamiWorld'), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center bg-[#e9eef2] text-[#5b6770] text-sm">Building the city…</div>
  ),
});

export default MiamiWorld;
