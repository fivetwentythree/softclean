export default function InventoryLoading() {
  return (
    <div className="py-8 space-y-4">
      {/* Header */}
      <div className="px-6">
        <div className="h-6 w-28 rounded bg-[#F7F7F7] animate-pulse" />
      </div>

      {/* Row skeletons */}
      <div className="px-6 space-y-3">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-14 rounded-xl bg-[#F7F7F7] animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}
