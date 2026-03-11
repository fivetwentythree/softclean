export default function PropertyDetailLoading() {
  return (
    <div className="bg-white min-h-screen pb-8">
      <div className="px-6 pt-4 pb-6">
        <div className="h-4 w-12 rounded bg-[#F7F7F7] animate-pulse mb-4" />
        <div className="h-7 w-48 rounded bg-[#F7F7F7] animate-pulse" />
        <div className="h-4 w-64 rounded bg-[#F7F7F7] animate-pulse mt-2" />
      </div>
      {[...Array(3)].map((_, s) => (
        <div key={s} className="mt-2">
          <div className="px-6 pt-4 pb-2">
            <div className="h-5 w-28 rounded bg-[#F7F7F7] animate-pulse" />
          </div>
          {[...Array(2)].map((_, i) => (
            <div
              key={i}
              className="mx-6 mb-3 h-20 rounded-[22px] bg-[#F7F7F7]/50 animate-pulse"
            />
          ))}
        </div>
      ))}
    </div>
  );
}
