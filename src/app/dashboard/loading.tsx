export default function DashboardLoading() {
  return (
    <div className="px-6 py-8 space-y-6">
      {/* "Next up" heading */}
      <div>
        <div className="h-7 w-32 rounded bg-[#F7F7F7] animate-pulse" />
        <div className="h-4 w-24 rounded bg-[#F7F7F7] animate-pulse mt-2" />
      </div>

      {/* Active task card */}
      <div className="h-40 rounded-2xl bg-[#F7F7F7] animate-pulse shadow" />

      {/* "Coming up" heading */}
      <div className="h-6 w-28 rounded bg-[#F7F7F7] animate-pulse" />

      {/* Queue rows */}
      <div className="space-y-3">
        <div className="h-14 rounded-xl bg-[#F7F7F7] animate-pulse" />
        <div className="h-14 rounded-xl bg-[#F7F7F7] animate-pulse" />
        <div className="h-14 rounded-xl bg-[#F7F7F7] animate-pulse" />
      </div>
    </div>
  );
}
