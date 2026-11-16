import type { Metadata } from 'next';
import DynamicWorld from '@/components/world/DynamicWorld';

export const metadata: Metadata = {
  title: 'Miami 3D | Every Pre-Construction Tower on a 3D Map',
  description:
    'Fly around Miami in 3D. See every pre-construction and under-construction tower in place among the existing skyline, and check the view from any floor.',
  alternates: { canonical: 'https://preconstructionmiami.net/miami-3d' },
  openGraph: {
    title: 'Miami 3D | PreConstructionMiami.net',
    description: 'Every new tower in place on a 3D map of Miami. Check the view from any floor.',
    url: 'https://preconstructionmiami.net/miami-3d',
    type: 'website',
  },
};

export default function Miami3DPage() {
  return (
    <div className="pt-14">
      <h1 className="sr-only">Miami 3D: pre-construction towers on a 3D map of Miami</h1>
      <div className="relative h-[calc(100vh-56px)] min-h-[520px] w-full">
        <DynamicWorld />
      </div>
    </div>
  );
}
