export default function SkeletonCard() {
  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-3xl p-6 sm:p-8 animate-pulse w-full max-w-3xl space-y-6">
      <div className="h-6 bg-[#30363d] rounded w-1/4 mb-4" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-2">
          <div className="h-4 bg-[#30363d] rounded w-1/3" />
          <div className="h-10 bg-[#30363d] rounded w-full" />
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-[#30363d] rounded w-1/3" />
          <div className="h-10 bg-[#30363d] rounded w-full" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-[#30363d] rounded w-1/4" />
        <div className="h-10 bg-[#30363d] rounded w-full" />
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-[#30363d] rounded w-1/4" />
        <div className="h-10 bg-[#30363d] rounded w-full" />
      </div>
      <div className="h-10 bg-[#30363d] rounded w-1/5 ml-auto" />
    </div>
  );
}
