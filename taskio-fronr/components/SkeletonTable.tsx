export default function SkeletonTable() {
  return (
    <div className="w-full bg-card border border-border rounded-3xl p-6 animate-pulse space-y-4">
      {/* Table header skeleton */}
      <div className="flex gap-4 border-b border-border pb-4">
        <div className="h-4 bg-accent rounded w-1/3" />
        <div className="h-4 bg-accent rounded w-1/3" />
        <div className="h-4 bg-accent rounded w-1/4 ml-auto" />
      </div>
      {/* Table rows skeleton */}
      {[1, 2, 3, 4, 5].map((row) => (
        <div key={row} className="flex gap-4 items-center py-3 border-b border-border/50 last:border-none">
          <div className="h-5 bg-accent rounded w-1/4" />
          <div className="h-5 bg-accent rounded w-1/4" />
          <div className="h-6 bg-accent rounded w-1/6 ml-auto" />
        </div>
      ))}
    </div>
  );
}
