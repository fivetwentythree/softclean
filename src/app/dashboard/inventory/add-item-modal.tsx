"use client";

import { useState, useTransition } from "react";
import { addInventoryItem } from "./actions";

type Property = { id: string; name: string };

const CATEGORIES = [
  { value: "consumable", label: "Consumable" },
  { value: "linen", label: "Linen" },
  { value: "maintenance", label: "Maintenance" },
  { value: "amenity", label: "Amenity" },
] as const;

export function AddItemButton({ properties }: { properties: Property[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-[15px] font-medium text-[#007AFF] active:opacity-60 transition-opacity"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <rect x="1" y="8" width="16" height="2" rx="1" fill="#007AFF" />
          <rect x="8" y="1" width="2" height="16" rx="1" fill="#007AFF" />
        </svg>
        Add item
      </button>

      {open && (
        <AddItemModal
          properties={properties}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function AddItemModal({
  properties,
  onClose,
}: {
  properties: Property[];
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<
    "consumable" | "linen" | "maintenance" | "amenity"
  >("consumable");
  const [unit, setUnit] = useState("units");
  const [quantity, setQuantity] = useState("");
  const [threshold, setThreshold] = useState("2");
  const [selectedProperties, setSelectedProperties] = useState<string[]>(
    properties.map((p) => p.id)
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function toggleProperty(id: string) {
    setSelectedProperties((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    if (selectedProperties.length === 0) {
      setError("Select at least one property");
      return;
    }

    startTransition(async () => {
      const result = await addInventoryItem({
        name: name.trim(),
        category,
        unit,
        initialQuantity: quantity === "" ? 0 : Number(quantity),
        minimumThreshold: threshold === "" ? 0 : Number(threshold),
        propertyIds: selectedProperties,
      });
      if (result.error) {
        setError(result.error);
      } else {
        onClose();
      }
    });
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        className="relative w-[calc(100%-24px)] max-w-lg bg-white px-7 pt-6 animate-in slide-in-from-bottom-12 duration-500"
        style={{ maxHeight: "85dvh", display: "flex", flexDirection: "column", borderRadius: 30, marginBottom: 12, boxShadow: "0 24px 80px rgba(0,0,0,0.12), 0 8px 24px rgba(0,0,0,0.08), 0 0 0 0.5px rgba(0,0,0,0.05)", animationTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)" }}
      >
        <div className="flex items-center justify-between mb-5 shrink-0">
          <h2 className="text-[19px] font-bold text-[#000000]">
            Add stock item
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-[#F3F3F3] active:bg-[#E5E5E5]"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M1 1L11 11M11 1L1 11" stroke="#8e8e93" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto flex-1 pb-10">
          <div>
            <label className="text-[13px] font-medium mb-1 block" style={{ color: "rgba(60, 60, 67, 0.6)" }}>
              Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Detergent"
              className="w-full rounded-xl border border-[#D1D1D6] px-4 py-3 text-[15px] text-[#000000] placeholder:text-[#C7C7CC] outline-none focus:border-[#007AFF] transition-colors"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-[13px] font-medium text-[#8e8e93] mb-1 block">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as typeof category)}
                className="w-full rounded-xl border border-[#EBEBEB] px-4 py-3 text-[15px] text-[#1a1a1a] bg-white outline-none focus:border-[#007AFF] transition-colors"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-28">
              <label className="text-[13px] font-medium text-[#8e8e93] mb-1 block">
                Unit
              </label>
              <input
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="units"
                className="w-full rounded-xl border border-[#EBEBEB] px-4 py-3 text-[15px] text-[#1a1a1a] placeholder:text-[#B0B0B0] outline-none focus:border-[#007AFF] transition-colors"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-[13px] font-medium text-[#8e8e93] mb-1 block">
                Initial qty
              </label>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0"
                className="w-full rounded-xl border border-[#EBEBEB] px-4 py-3 text-[15px] text-[#1a1a1a] placeholder:text-[#C7C7CC] outline-none focus:border-[#007AFF] transition-colors"
              />
            </div>
            <div className="flex-1">
              <label className="text-[13px] font-medium text-[#8e8e93] mb-1 block">
                Min threshold
              </label>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                placeholder="0"
                className="w-full rounded-xl border border-[#EBEBEB] px-4 py-3 text-[15px] text-[#1a1a1a] placeholder:text-[#C7C7CC] outline-none focus:border-[#007AFF] transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="text-[13px] font-medium text-[#8e8e93] mb-2 block">
              Add to properties
            </label>
            <div className="space-y-2">
              {properties.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => toggleProperty(p.id)}
                  className="w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors"
                  style={{
                    borderColor: selectedProperties.includes(p.id)
                      ? "#007AFF"
                      : "#EBEBEB",
                    backgroundColor: selectedProperties.includes(p.id)
                      ? "rgba(0, 122, 255, 0.05)"
                      : "white",
                  }}
                >
                  <span
                    className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: selectedProperties.includes(p.id)
                        ? "#007AFF"
                        : "transparent",
                      border: selectedProperties.includes(p.id)
                        ? "none"
                        : "1.5px solid #D1D1D6",
                    }}
                  >
                    {selectedProperties.includes(p.id) && (
                      <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                        <path d="M1 5L4.5 8.5L11 1.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                  <span className="text-[15px] text-[#1a1a1a]">{p.name}</span>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-[13px] text-[#FF3B30]">{error}</p>
          )}

          <button
            type="submit"
            disabled={isPending || !name.trim()}
            className="w-full rounded-xl py-3.5 text-[15px] font-semibold text-white transition-opacity disabled:opacity-40"
            style={{ backgroundColor: "#007AFF" }}
          >
            {isPending ? "Adding…" : "Add to stock"}
          </button>
        </form>
      </div>
    </div>
  );
}
