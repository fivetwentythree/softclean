"use client";

import { useEffect, useState, useCallback } from "react";

type NotificationProps = {
  message: string;
  type?: "success" | "error" | "info";
  visible: boolean;
  onDismiss?: () => void;
  duration?: number;
};

export function Notification({
  message,
  type = "info",
  visible,
  onDismiss,
  duration = 3500,
}: NotificationProps) {
  const [show, setShow] = useState(false);

  const dismiss = useCallback(() => {
    setShow(false);
    setTimeout(() => onDismiss?.(), 350);
  }, [onDismiss]);

  useEffect(() => {
    if (visible) {
      requestAnimationFrame(() => setShow(true));
      if (duration > 0) {
        const timer = setTimeout(dismiss, duration);
        return () => clearTimeout(timer);
      }
    } else {
      setShow(false);
    }
  }, [visible, duration, dismiss]);

  if (!visible) return null;

  const icon =
    type === "success" ? "✓" : type === "error" ? "!" : "i";

  const accentColor =
    type === "success"
      ? "#00A699"
      : type === "error"
        ? "#FF385C"
        : "#222222";

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 flex justify-center pointer-events-none"
      style={{ paddingTop: "max(env(safe-area-inset-top), 12px)" }}
    >
      <div
        className="pointer-events-auto mx-4 w-full max-w-[420px] flex items-center gap-3 px-5 py-4 cursor-pointer"
        onClick={dismiss}
        style={{
          borderRadius: 22,
          background: "rgba(255, 255, 255, 0.82)",
          backdropFilter: "blur(40px) saturate(1.8)",
          WebkitBackdropFilter: "blur(40px) saturate(1.8)",
          border: "1px solid rgba(255, 255, 255, 0.6)",
          boxShadow:
            "0 8px 32px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.6)",
          transform: show ? "translateY(0)" : "translateY(-100%)",
          opacity: show ? 1 : 0,
          transition: "transform 0.4s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.3s ease",
        }}
      >
        <span
          className="shrink-0 flex items-center justify-center text-xs font-bold text-white"
          style={{
            width: 28,
            height: 28,
            borderRadius: 9,
            backgroundColor: accentColor,
          }}
        >
          {icon}
        </span>
        <p className="flex-1 text-sm font-medium text-[#222222] leading-snug">
          {message}
        </p>
      </div>
    </div>
  );
}

// Hook for easy usage
export function useNotification() {
  const [state, setState] = useState<{
    visible: boolean;
    message: string;
    type: "success" | "error" | "info";
  }>({ visible: false, message: "", type: "info" });

  const notify = useCallback(
    (message: string, type: "success" | "error" | "info" = "info") => {
      setState({ visible: true, message, type });
    },
    [],
  );

  const dismiss = useCallback(() => {
    setState((prev) => ({ ...prev, visible: false }));
  }, []);

  return { ...state, notify, dismiss };
}
