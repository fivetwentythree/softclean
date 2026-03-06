export default function MessagesLoading() {
  return (
    <div className="py-8 space-y-4">
      {/* Header */}
      <div className="px-6">
        <div className="h-6 w-28 rounded bg-[#F7F7F7] animate-pulse" />
      </div>

      {/* Message cards */}
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="mx-6 mb-3 h-24 rounded-xl border border-[#EBEBEB] bg-white p-4 space-y-3"
        >
          <div className="h-4 w-32 rounded bg-[#F7F7F7] animate-pulse" />
          <div className="h-3 w-52 rounded bg-[#F7F7F7] animate-pulse" />
          <div className="h-3 w-40 rounded bg-[#F7F7F7] animate-pulse" />
        </div>
      ))}
    </div>
  );
}
