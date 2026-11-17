/** Night-city placeholder shown until the live map has drawn its first frame. */
export default function MapSkeleton({ fading = false }: { fading?: boolean }) {
  return (
    <div
      aria-hidden
      className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none transition-opacity duration-700"
      style={{
        opacity: fading ? 0 : 1,
        background:
          'radial-gradient(60% 45% at 62% 58%, rgba(0,229,180,0.16), transparent 70%),' +
          'radial-gradient(40% 35% at 78% 40%, rgba(59,130,246,0.18), transparent 70%),' +
          'radial-gradient(50% 40% at 40% 75%, rgba(255,170,90,0.08), transparent 70%),' +
          'linear-gradient(180deg, #070B14 0%, #0B1220 55%, #0A0F1A 100%)',
      }}
    >
      <div className="absolute inset-x-0 bottom-10 flex justify-center">
        <span className="text-xs text-text-muted font-light tracking-[0.2em] uppercase animate-pulse">Loading the skyline</span>
      </div>
    </div>
  );
}
