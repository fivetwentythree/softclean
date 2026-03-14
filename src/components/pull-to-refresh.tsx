"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

const THRESHOLD = 80;

export function PullToRefresh({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const pulling = useRef(false);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (window.scrollY === 0 && !refreshing) {
      startY.current = e.touches[0].clientY;
      pulling.current = true;
    }
  }, [refreshing]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!pulling.current) return;
    const delta = Math.max(0, e.touches[0].clientY - startY.current);
    // Dampen the pull (feels rubbery like iOS)
    setPullDistance(Math.min(delta * 0.5, 120));
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!pulling.current) return;
    pulling.current = false;

    if (pullDistance >= THRESHOLD) {
      setRefreshing(true);
      router.refresh();
      // Give the server components time to re-render
      setTimeout(() => {
        setRefreshing(false);
        setPullDistance(0);
      }, 800);
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, router]);

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Pull indicator */}
      <div
        className="flex items-center justify-center overflow-hidden transition-[height] duration-150"
        style={{ height: refreshing ? 48 : pullDistance > 10 ? pullDistance : 0 }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          className={refreshing ? "ptr-spinner" : ""}
          style={{
            opacity: refreshing ? 1 : Math.min(pullDistance / THRESHOLD, 1),
            transform: refreshing
              ? undefined
              : `rotate(${(pullDistance / THRESHOLD) * 360}deg)`,
          }}
        >
          <circle
            cx="10"
            cy="10"
            r="8"
            stroke="rgba(60, 60, 67, 0.3)"
            strokeWidth="2.5"
            fill="none"
            strokeDasharray="32 18"
            strokeLinecap="round"
          />
        </svg>
      </div>
      {children}
    </div>
  );
}
