export default function SkeletonTable() {
  return (
    <div className="w-full bg-[#161b22] border border-[#30363d] rounded-3xl p-6 animate-pulse space-y-4">
      {/* Table header skeleton */}
      <div className="flex gap-4 border-b border-[#30363d] pb-4">
        <div className="h-4 bg-[#30363d] rounded w-1/3" />
        <div className="h-4 bg-[#30363d] rounded w-1/3" />
        <div className="h-4 bg-[#30363d] rounded w-1/4 ml-auto" />
      </div>
      {/* Table rows skeleton */}
      {[1, 2, 3, 4, 5].map((row) => (
        <div key={row} className="flex gap-4 items-center py-3 border-b border-[#30363d]/50 last:border-none">
          <div className="h-5 bg-[#30363d] rounded w-1/4" />
          <div className="h-5 bg-[#30363d] rounded w-1/4" />
          <div className="h-6 bg-[#30363d] rounded w-1/6 ml-auto" />
        </div>
      ))}
    </div>
  );
}
