"use client";

import { useState, useRef, useEffect, useCallback } from "react";

type NotificationStackProps = {
  children: React.ReactNode[];
  header?: React.ReactNode;
};

export function NotificationStack({ children, header }: NotificationStackProps) {
  const [expanded, setExpanded] = useState(false);
  const frontRef = useRef<HTMLDivElement>(null);
  const [frontHeight, setFrontHeight] = useState(0);
  const count = children.length;

  useEffect(() => {
    if (frontRef.current) {
      setFrontHeight(frontRef.current.offsetHeight);
    }
  }, [children]);

  const toggle = useCallback(() => {
    if (count > 1) setExpanded((prev) => !prev);
  }, [count]);

  const headerEl = header ? (
    <div
      role="button"
      tabIndex={0}
      onClick={toggle}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") toggle(); }}
      className="w-full text-left px-6 pt-4 pb-2 flex items-center gap-2 cursor-pointer select-none"
    >
      {header}
      {count > 1 && (
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          className="shrink-0"
          style={{
            transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.25s ease",
          }}
        >
          <path d="M3 4.5L6 7.5L9 4.5" stroke="rgba(60,60,67,0.6)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  ) : null;

  if (count === 0) return headerEl;

  // Expanded or single item — show all cards
  if (count === 1 || expanded) {
    return (
      <div>
        {headerEl}
        <div className="space-y-3">{children}</div>
      </div>
    );
  }

  // Collapsed — show front card with peeking slivers behind it
  const maxPeek = Math.min(count - 1, 2);
  const peekPerCard = 6;
  const totalPeek = maxPeek * peekPerCard;

  return (
    <div>
      {headerEl}
      <div
        className="relative"
        style={{ height: frontHeight ? frontHeight + totalPeek : "auto" }}
      >
        {/* Peeking slivers — click these to expand */}
        {Array.from({ length: maxPeek }, (_, i) => {
          const layer = i + 1;
          const bg = layer === 1 ? "#E5E5EA" : "#D1D1D6";
          return (
            <div
              key={layer}
              role="button"
              tabIndex={-1}
              onClick={toggle}
              className="absolute left-6 right-6 cursor-pointer"
              style={{
                top: layer * peekPerCard,
                height: frontHeight || 68,
                borderRadius: 14,
                background: bg,
                zIndex: maxPeek - i,
              }}
            />
          );
        })}

        {/* Front card — interactive content works normally */}
        <div ref={frontRef} className="relative" style={{ zIndex: maxPeek + 1 }}>
          {children[0]}
        </div>
      </div>
    </div>
  );
}
