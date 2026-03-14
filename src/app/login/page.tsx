"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Notification } from "@/components/notification";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen bg-[#F2F2F7] flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm bg-white rounded-[20px] shadow-[0_2px_16px_rgba(0,0,0,0.08)] px-7 py-10">
        <div className="mb-10 text-center">
          <h1 className="text-[34px] font-bold text-black leading-tight">SoftClean</h1>
          <p className="mt-2 text-[15px] font-normal text-[rgba(60,60,67,0.6)]">Welcome back</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-[13px] font-semibold text-black tracking-tight mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[rgba(120,120,128,0.08)] border-none rounded-[12px] px-4 py-3.5 text-[17px] text-black placeholder-[rgba(60,60,67,0.3)] focus:ring-2 focus:ring-[rgba(0,122,255,0.3)] outline-none transition-all"
              placeholder="you@company.com"
              required
              autoComplete="email"
            />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-black tracking-tight mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[rgba(120,120,128,0.08)] border-none rounded-[12px] px-4 py-3.5 text-[17px] text-black placeholder-[rgba(60,60,67,0.3)] focus:ring-2 focus:ring-[rgba(0,122,255,0.3)] outline-none transition-all"
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          <Notification
            message={error ?? ""}
            type="error"
            visible={!!error}
            onDismiss={() => setError(null)}
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#007AFF] text-white font-semibold rounded-full h-[50px] text-[17px] hover:bg-[#0066DD] disabled:opacity-50 transition-colors"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
