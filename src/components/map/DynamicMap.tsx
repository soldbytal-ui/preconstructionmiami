'use client';

import dynamic from 'next/dynamic';
import MapSkeleton from './MapSkeleton';

const MiamiMap = dynamic(() => import('./MiamiMap'), {
  ssr: false,
  loading: () => <MapSkeleton />,
});

export default MiamiMap;
