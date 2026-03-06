import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="max-w-sm w-full text-center space-y-6">
        <span className="text-5xl">🔍</span>
        <h1 className="text-xl font-bold text-[#222222]">Page not found</h1>
        <p className="text-sm text-[#717171]">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link
          href="/dashboard"
          className="inline-block rounded-full bg-[#FF385C] text-white font-semibold px-6 py-3 text-sm"
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
