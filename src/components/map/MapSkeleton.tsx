export default function MapSkeleton() {
  return (
    <div className="w-full h-full bg-bg flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-surface/50 to-bg" />
      <div className="relative flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-accent-green/30 border-t-accent-green animate-spin" />
        <span className="text-sm text-text-muted font-light tracking-wide">Loading Miami...</span>
      </div>
    </div>
  );
}
