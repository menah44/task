export default function SkeletonTable() {
  return (
    <div className="bg-white rounded-2xl p-6 border animate-pulse">
      {[1, 2, 3, 4].map((row) => (
        <div key={row} className="h-8 bg-gray-200 rounded mb-3" />
      ))}
    </div>
  );
}
