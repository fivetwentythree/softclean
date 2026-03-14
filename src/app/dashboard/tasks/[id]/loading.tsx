export default function TaskDetailLoading() {
  return (
    <div className="min-h-screen px-5 py-6 space-y-5">
      <div className="h-4 w-28 rounded bg-[#F7F7F7] animate-pulse" />
      <div>
        <div className="h-8 w-48 rounded bg-[#F7F7F7] animate-pulse" />
        <div className="h-4 w-64 rounded bg-[#F7F7F7] animate-pulse mt-2" />
      </div>
      <div className="rounded-[14px] bg-white p-5 space-y-3" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
        <div className="h-6 w-24 rounded-full bg-[#F7F7F7] animate-pulse" />
        <div className="h-4 w-44 rounded bg-[#F7F7F7] animate-pulse" />
        <div className="h-4 w-36 rounded bg-[#F7F7F7] animate-pulse" />
      </div>
      <div className="rounded-[14px] bg-white p-5 space-y-2" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
        <div className="h-3 w-32 rounded bg-[#F7F7F7] animate-pulse" />
        <div className="h-4 w-full rounded bg-[#F7F7F7] animate-pulse" />
        <div className="h-4 w-3/4 rounded bg-[#F7F7F7] animate-pulse" />
      </div>
      <div className="h-12 rounded-full bg-[#F7F7F7] animate-pulse" />
    </div>
  );
}
