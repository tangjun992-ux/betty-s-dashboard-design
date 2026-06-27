/** Card skeleton grid used while recent generations load. */
export function SkeletonLoader({ count = 6, aspect = "aspect-[3/4]" }: { count?: number; aspect?: string }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className={`${aspect} rounded-xl bg-surface-2 animate-pulse`} />
          <div className="h-3 w-3/4 rounded bg-surface-2 animate-pulse" />
          <div className="h-2.5 w-1/2 rounded bg-surface-2/70 animate-pulse" />
        </div>
      ))}
    </div>
  );
}
