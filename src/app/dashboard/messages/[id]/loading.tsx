export default function ConversationLoading() {
  return (
    <div className="flex flex-col h-[100dvh]" style={{ backgroundColor: "#F2F2F7" }}>
      <div className="px-5 pt-3 pb-3" style={{ background: "rgba(242, 242, 247, 0.94)", borderBottom: "0.5px solid rgba(0, 0, 0, 0.12)" }}>
        <div className="flex items-center gap-3">
          <div className="h-5 w-16 rounded bg-[#E5E5EA] animate-pulse" />
          <div className="h-5 w-32 rounded bg-[#E5E5EA] animate-pulse" />
        </div>
      </div>
      <div className="flex-1 px-4 py-4 space-y-4">
        <div className="flex justify-start">
          <div className="h-10 w-48 rounded-[18px] bg-[#E5E5EA] animate-pulse" />
        </div>
        <div className="flex justify-end">
          <div className="h-10 w-40 rounded-[18px] bg-[#D4E4FA] animate-pulse" />
        </div>
        <div className="flex justify-start">
          <div className="h-10 w-56 rounded-[18px] bg-[#E5E5EA] animate-pulse" />
        </div>
        <div className="flex justify-end">
          <div className="h-10 w-36 rounded-[18px] bg-[#D4E4FA] animate-pulse" />
        </div>
      </div>
      <div className="px-3 py-2" style={{ background: "rgba(242, 242, 247, 0.94)", borderTop: "0.5px solid rgba(0, 0, 0, 0.12)" }}>
        <div className="h-9 rounded-full bg-[#E5E5EA] animate-pulse" />
      </div>
    </div>
  );
}
