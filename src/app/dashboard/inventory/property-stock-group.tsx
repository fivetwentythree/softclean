"use client";

import { useState } from "react";
import { StockStepper } from "@/components/stock-stepper";
import { SwipeToDeleteRow } from "./swipe-to-delete-row";

type StockItem = {
  propertyId: string;
  itemId: string;
  itemName: string;
  category: string;
  unit: string;
  quantity: number;
  threshold: number;
};

type Props = {
  propertyName: string;
  criticalCount: number;
  items: StockItem[];
};

export function PropertyStockGroup({
  propertyName,
  criticalCount,
  items,
}: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div>
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-6 py-3 active:bg-[#E5E5EA] transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-[15px] font-semibold text-[#000000]">
            {propertyName}
          </span>
          <span className="text-[13px]" style={{ color: "rgba(60, 60, 67, 0.6)" }}>
            {items.length} item{items.length !== 1 ? "s" : ""}
          </span>
          {criticalCount > 0 && (
            <span className="text-[11px] font-semibold text-[#FF3B30] bg-[#FF3B30]/10 rounded-full px-2 py-0.5">
              {criticalCount} low
            </span>
          )}
        </div>
        <svg
          width="13"
          height="13"
          viewBox="0 0 13 13"
          fill="none"
          className="shrink-0"
          style={{
            transform: expanded ? "rotate(0deg)" : "rotate(-90deg)",
            transition: "transform 0.2s ease",
          }}
        >
          <path
            d="M3.25 5L6.5 8.25L9.75 5"
            stroke="#8e8e93"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {expanded && (
        <div className="px-6 pb-2 space-y-2.5">
          {items.map((inv) => {
            const isCritical = inv.quantity <= inv.threshold;
            const barColor = isCritical ? "#FF3B30" : "#34C759";

            return (
              <SwipeToDeleteRow
                key={`${inv.propertyId}-${inv.itemId}`}
                propertyId={inv.propertyId}
                itemId={inv.itemId}
                itemName={inv.itemName}
              >
                <div className="flex items-center justify-between rounded-[14px] px-4 py-3.5 bg-white" style={{ boxShadow: "0 0 0 0.5px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.06)" }}>
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="shrink-0 self-stretch rounded-full"
                      style={{ width: 3, backgroundColor: barColor }}
                    />
                    <div className="min-w-0">
                      <p className="text-[15px] font-medium text-[#000000] truncate">
                        {inv.itemName}
                      </p>
                      {isCritical && (
                        <p className="text-[12px] mt-0.5" style={{ color: "rgba(60, 60, 67, 0.6)" }}>
                          min {inv.threshold} {inv.unit}
                        </p>
                      )}
                    </div>
                  </div>
                  <StockStepper
                    propertyId={inv.propertyId}
                    itemId={inv.itemId}
                    quantity={inv.quantity}
                    unit={inv.unit}
                  />
                </div>
              </SwipeToDeleteRow>
            );
          })}
        </div>
      )}
    </div>
  );
}
