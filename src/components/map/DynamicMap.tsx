'use client';

import dynamic from 'next/dynamic';
import MapSkeleton from './MapSkeleton';
import { loadBuildings } from './mapShared';

// Start both downloads the moment this file runs in the browser, rather than
// waiting for the page to finish hydrating and the map code to arrive first.
const mapModule = typeof window !== 'undefined' ? import('./MiamiMap') : null;
if (typeof window !== 'undefined') loadBuildings();

const MiamiMap = dynamic(() => mapModule || import('./MiamiMap'), {
  ssr: false,
  loading: () => <MapSkeleton />,
});

export default MiamiMap;
