"use client";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex items-center justify-center px-6 py-24">
      <div className="max-w-sm w-full text-center space-y-6">
        <span className="text-5xl">⚠️</span>
        <h1 className="text-xl font-bold text-[#222222]">
          Something went wrong
        </h1>
        <p className="text-sm text-[#717171]">{error.message}</p>
        <button
          onClick={reset}
          className="rounded-full bg-[#FF385C] text-white font-semibold px-6 py-3 text-sm"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
