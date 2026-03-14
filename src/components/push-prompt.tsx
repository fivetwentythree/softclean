"use client";

import { useEffect, useState, useCallback } from "react";
import { isPushSupported, subscribeToPush, isSubscribed } from "@/lib/push";

export function PushPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (!isPushSupported()) return;

    // Don't show if already subscribed or if user dismissed recently
    const dismissed = sessionStorage.getItem("push-prompt-dismissed");
    if (dismissed) return;

    async function check() {
      const subscribed = await isSubscribed();
      const permission = Notification.permission;

      // Show prompt only if not subscribed and permission not explicitly denied
      if (!subscribed && permission !== "denied") {
        // Delay to not interrupt initial page load
        setTimeout(() => setShowPrompt(true), 2000);
      }
    }
    check();
  }, []);

  const handleEnable = useCallback(async () => {
    await subscribeToPush();
    setShowPrompt(false);
  }, []);

  const handleDismiss = useCallback(() => {
    setShowPrompt(false);
    sessionStorage.setItem("push-prompt-dismissed", "1");
  }, []);

  if (!showPrompt) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 flex justify-center pointer-events-none"
      style={{ paddingTop: "max(env(safe-area-inset-top), 12px)" }}
    >
      <div
        className="pointer-events-auto mx-4 w-full max-w-[420px] p-4"
        style={{
          borderRadius: 22,
          background: "rgba(255, 255, 255, 0.88)",
          backdropFilter: "blur(40px) saturate(1.8)",
          WebkitBackdropFilter: "blur(40px) saturate(1.8)",
          border: "1px solid rgba(255, 255, 255, 0.6)",
          boxShadow:
            "0 8px 32px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)",
        }}
      >
        <div className="flex items-start gap-3">
          <span
            className="shrink-0 flex items-center justify-center text-white text-sm"
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              backgroundColor: "#FF385C",
            }}
          >
            🔔
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-semibold text-[#000000] leading-tight">
              Enable notifications
            </p>
            <p
              className="text-[13px] mt-0.5 leading-snug"
              style={{ color: "rgba(60, 60, 67, 0.6)" }}
            >
              Get notified about new messages, task assignments, and important updates.
            </p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleEnable}
                className="px-4 py-1.5 rounded-full text-[13px] font-semibold text-white"
                style={{ backgroundColor: "#007AFF" }}
              >
                Enable
              </button>
              <button
                onClick={handleDismiss}
                className="px-4 py-1.5 rounded-full text-[13px] font-medium"
                style={{ color: "rgba(60, 60, 67, 0.6)" }}
              >
                Not now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
