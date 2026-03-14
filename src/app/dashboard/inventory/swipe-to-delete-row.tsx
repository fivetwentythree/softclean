"use client";

import { useRef, useState, useTransition, useCallback } from "react";
import { deleteInventoryItem } from "./actions";

type Props = {
  propertyId: string;
  itemId: string;
  itemName: string;
  children: React.ReactNode;
};

const DELETE_THRESHOLD = 80;
const SNAP_OPEN = 80;

export function SwipeToDeleteRow({
  propertyId,
  itemId,
  itemName,
  children,
}: Props) {
  const [offsetX, setOffsetX] = useState(0);
  const [swiped, setSwiped] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [removed, setRemoved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const startX = useRef(0);
  const startOffset = useRef(0);
  const dragging = useRef(false);
  const rowRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (confirming || removed) return;
      startX.current = e.touches[0].clientX;
      startOffset.current = swiped ? -SNAP_OPEN : 0;
      dragging.current = true;
    },
    [swiped, confirming, removed]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!dragging.current) return;
      const dx = e.touches[0].clientX - startX.current;
      const next = Math.min(0, startOffset.current + dx);
      setOffsetX(next);
    },
    []
  );

  const handleTouchEnd = useCallback(() => {
    if (!dragging.current) return;
    dragging.current = false;

    if (offsetX < -DELETE_THRESHOLD) {
      setOffsetX(-SNAP_OPEN);
      setSwiped(true);
    } else {
      setOffsetX(0);
      setSwiped(false);
    }
  }, [offsetX]);

  const handleDelete = useCallback(() => {
    setConfirming(true);
  }, []);

  const confirmDelete = useCallback(() => {
    setRemoved(true);
    startTransition(async () => {
      await deleteInventoryItem(propertyId, itemId);
    });
  }, [propertyId, itemId]);

  const cancelDelete = useCallback(() => {
    setConfirming(false);
    setOffsetX(0);
    setSwiped(false);
  }, []);

  const resetSwipe = useCallback(() => {
    setOffsetX(0);
    setSwiped(false);
  }, []);

  if (removed) {
    return (
      <div
        className="overflow-hidden transition-all duration-300 ease-out"
        style={{ maxHeight: 0, opacity: 0, marginBottom: 0 }}
      />
    );
  }

  if (confirming) {
    return (
      <div className="rounded-[18px] border border-[#FF3B30]/20 bg-[#FF3B30]/5 px-4 py-3.5">
        <p className="text-[14px] text-[#1a1a1a] mb-3">
          Remove <span className="font-semibold">{itemName}</span> from this
          property?
        </p>
        <div className="flex gap-2">
          <button
            onClick={cancelDelete}
            className="flex-1 rounded-xl py-2.5 text-[14px] font-medium text-[#1a1a1a] bg-white border border-[#EBEBEB] active:bg-[#F7F7F7] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={confirmDelete}
            disabled={isPending}
            className="flex-1 rounded-xl py-2.5 text-[14px] font-semibold text-white bg-[#FF3B30] active:bg-[#D70015] transition-colors disabled:opacity-50"
          >
            {isPending ? "Removing…" : "Delete"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-[18px]">
      {/* Delete action behind */}
      <div
        className="absolute inset-y-0 right-0 flex items-center justify-end rounded-[18px] overflow-hidden"
        style={{ width: SNAP_OPEN + 8 }}
      >
        <button
          onClick={handleDelete}
          className="h-full flex items-center justify-center bg-[#FF3B30] active:bg-[#D70015] transition-colors"
          style={{
            width: SNAP_OPEN,
            borderRadius: "0 18px 18px 0",
          }}
        >
          <svg
            width="20"
            height="22"
            viewBox="0 0 20 22"
            fill="none"
          >
            <path
              d="M1 5H19M7 5V3C7 2.44772 7.44772 2 8 2H12C12.5523 2 13 2.44772 13 3V5M15 5V19C15 19.5523 14.5523 20 14 20H6C5.44772 20 5 19.5523 5 19V5H15Z"
              stroke="white"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path d="M8 9V16M12 9V16" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Foreground card */}
      <div
        ref={rowRef}
        className="relative"
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: dragging.current ? "none" : "transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={swiped ? resetSwipe : undefined}
      >
        {children}
      </div>
    </div>
  );
}
