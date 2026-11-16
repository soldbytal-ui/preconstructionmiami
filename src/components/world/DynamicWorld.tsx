'use client';

import dynamic from 'next/dynamic';

const MiamiWorld = dynamic(() => import('./MiamiWorld'), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center bg-[#e9eef2] text-[#5b6770] text-sm">Building the city…</div>
  ),
});

export default MiamiWorld;
