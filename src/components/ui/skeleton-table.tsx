interface SkeletonTableProps {
  rows?: number;
  cols?: number;
}

export function SkeletonTable({ rows = 6, cols = 4 }: SkeletonTableProps) {
  return (
    <div className="rounded-xl border border-border/60 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex gap-4 bg-muted/40 border-b border-border/60 px-4 py-3">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="h-3 rounded-full bg-muted animate-pulse" style={{ width: `${60 + (i % 3) * 20}px` }} />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, ri) => (
        <div
          key={ri}
          className="flex items-center gap-4 px-4 py-3 border-b border-border/40 last:border-0"
          style={{ animationDelay: `${ri * 60}ms` }}
        >
          {Array.from({ length: cols }).map((_, ci) => (
            <div
              key={ci}
              className="h-3.5 rounded-full bg-muted animate-pulse"
              style={{ width: `${ci === 0 ? 180 : 80 + (ci % 4) * 30}px`, opacity: 1 - ri * 0.1 }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
