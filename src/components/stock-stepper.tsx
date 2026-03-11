"use client";

import { useState, useTransition, useRef } from "react";
import { updateStock } from "@/app/dashboard/inventory/actions";

type StockStepperProps = {
  propertyId: string;
  itemId: string;
  quantity: number;
  unit: string;
};

export function StockStepper({
  propertyId,
  itemId,
  quantity,
  unit,
}: StockStepperProps) {
  const [value, setValue] = useState(quantity);
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function commit(newValue: number) {
    const clamped = Math.max(0, Math.round(newValue));
    setValue(clamped);
    setEditing(false);
    startTransition(async () => {
      await updateStock(propertyId, itemId, clamped);
    });
  }

  function handleStep(delta: number) {
    commit(value + delta);
  }

  function handleInputBlur() {
    commit(value);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      inputRef.current?.blur();
    }
  }

  return (
    <div
      className="inline-flex items-center"
      style={{
        borderRadius: 12,
        background: "rgba(120, 120, 128, 0.08)",
        height: 36,
      }}
    >
      {/* Minus button */}
      <button
        onClick={() => handleStep(-1)}
        disabled={isPending || value <= 0}
        className="flex items-center justify-center disabled:opacity-30 transition-opacity"
        style={{
          width: 36,
          height: 36,
          borderRadius: "12px 0 0 12px",
        }}
      >
        <svg width="16" height="2" viewBox="0 0 16 2" fill="none">
          <rect width="16" height="2" rx="1" fill="#007AFF" />
        </svg>
      </button>

      {/* Divider */}
      <div
        style={{
          width: 1,
          height: 18,
          background: "rgba(120, 120, 128, 0.15)",
        }}
      />

      {/* Value */}
      {editing ? (
        <input
          ref={inputRef}
          type="number"
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          autoFocus
          className="text-center text-sm font-semibold text-[#222222] bg-transparent border-none outline-none focus:ring-0 p-0"
          style={{ width: 48, height: 36 }}
        />
      ) : (
        <button
          onClick={() => setEditing(true)}
          className="flex items-center justify-center"
          style={{ width: 48, height: 36 }}
        >
          <span
            className="text-sm font-semibold transition-opacity"
            style={{
              color: "#222222",
              opacity: isPending ? 0.5 : 1,
            }}
          >
            {value}
          </span>
        </button>
      )}

      {/* Divider */}
      <div
        style={{
          width: 1,
          height: 18,
          background: "rgba(120, 120, 128, 0.15)",
        }}
      />

      {/* Plus button */}
      <button
        onClick={() => handleStep(1)}
        disabled={isPending}
        className="flex items-center justify-center disabled:opacity-30 transition-opacity"
        style={{
          width: 36,
          height: 36,
          borderRadius: "0 12px 12px 0",
        }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <rect x="0" y="7" width="16" height="2" rx="1" fill="#007AFF" />
          <rect x="7" y="0" width="2" height="16" rx="1" fill="#007AFF" />
        </svg>
      </button>
    </div>
  );
}
