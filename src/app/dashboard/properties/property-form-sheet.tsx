"use client";

import { useState, useTransition, useEffect } from "react";
import { createProperty, updateProperty, deleteProperty } from "./actions";
import { useRouter } from "next/navigation";

type PropertyData = {
  id: string;
  name: string;
  address: string;
  access_instructions: string | null;
  status: "active" | "maintenance" | "inactive";
};

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "maintenance", label: "Maintenance" },
  { value: "inactive", label: "Inactive" },
] as const;

/* ─── Add button (properties list header) ─── */

export function AddPropertyButton() {
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
        Add site
      </button>

      {open && <PropertyFormSheet onClose={() => setOpen(false)} />}
    </>
  );
}

/* ─── Edit button (property detail header) ─── */

export function EditPropertyButton({ property }: { property: PropertyData }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-[15px] font-medium text-[#007AFF] active:opacity-60 transition-opacity"
      >
        Edit
      </button>

      {open && (
        <PropertyFormSheet property={property} onClose={() => setOpen(false)} />
      )}
    </>
  );
}

/* ─── Sheet ─── */

function PropertyFormSheet({
  property,
  onClose,
}: {
  property?: PropertyData;
  onClose: () => void;
}) {
  const isEditing = !!property;
  const router = useRouter();

  const [name, setName] = useState(property?.name ?? "");
  const [address, setAddress] = useState(property?.address ?? "");
  const [accessInstructions, setAccessInstructions] = useState(
    property?.access_instructions ?? ""
  );
  const [status, setStatus] = useState<"active" | "maintenance" | "inactive">(
    property?.status ?? "active"
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, startDeleteTransition] = useTransition();

  // Lock body scroll when sheet is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !address.trim()) return;

    startTransition(async () => {
      const formData = {
        name: name.trim(),
        address: address.trim(),
        access_instructions: accessInstructions.trim(),
        status,
      };

      const result = isEditing
        ? await updateProperty(property.id, formData)
        : await createProperty(formData);

      if (result.error) {
        setError(result.error);
      } else {
        onClose();
      }
    });
  }

  function handleDelete() {
    if (!property) return;
    startDeleteTransition(async () => {
      const result = await deleteProperty(property.id);
      if (result.error) {
        setError(result.error);
        setShowDeleteConfirm(false);
      } else {
        onClose();
        router.push("/dashboard/properties");
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
        style={{
          maxHeight: "85dvh",
          display: "flex",
          flexDirection: "column",
          borderRadius: 30,
          marginBottom: 12,
          boxShadow:
            "0 24px 80px rgba(0,0,0,0.12), 0 8px 24px rgba(0,0,0,0.08), 0 0 0 0.5px rgba(0,0,0,0.05)",
          animationTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      >
        <div className="flex items-center justify-between mb-5 shrink-0">
          <h2 className="text-[19px] font-bold text-[#000000]">
            {isEditing ? "Edit site" : "New site"}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-[#F3F3F3] active:bg-[#E5E5E5]"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M1 1L11 11M11 1L1 11"
                stroke="#8e8e93"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto flex-1 pb-10">
          {/* Name */}
          <div>
            <label
              className="text-[13px] font-medium mb-1 block"
              style={{ color: "rgba(60, 60, 67, 0.6)" }}
            >
              Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Beach House"
              className="w-full rounded-xl border border-[#D1D1D6] px-4 py-3 text-[15px] text-[#000000] placeholder:text-[#C7C7CC] outline-none focus:border-[#007AFF] transition-colors"
            />
          </div>

          {/* Address */}
          <div>
            <label
              className="text-[13px] font-medium mb-1 block"
              style={{ color: "rgba(60, 60, 67, 0.6)" }}
            >
              Address
            </label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Main St, City"
              className="w-full rounded-xl border border-[#D1D1D6] px-4 py-3 text-[15px] text-[#000000] placeholder:text-[#C7C7CC] outline-none focus:border-[#007AFF] transition-colors"
            />
          </div>

          {/* Access instructions */}
          <div>
            <label
              className="text-[13px] font-medium mb-1 block"
              style={{ color: "rgba(60, 60, 67, 0.6)" }}
            >
              Access instructions
            </label>
            <textarea
              value={accessInstructions}
              onChange={(e) => setAccessInstructions(e.target.value)}
              placeholder="Key code, lockbox location, etc."
              rows={3}
              className="w-full rounded-xl border border-[#D1D1D6] px-4 py-3 text-[15px] text-[#000000] placeholder:text-[#C7C7CC] outline-none focus:border-[#007AFF] transition-colors resize-none"
            />
          </div>

          {/* Status — iOS segmented control */}
          <div>
            <label
              className="text-[13px] font-medium mb-2 block"
              style={{ color: "rgba(60, 60, 67, 0.6)" }}
            >
              Status
            </label>
            <div
              className="flex rounded-[10px] p-[2px]"
              style={{ backgroundColor: "rgba(120, 120, 128, 0.12)" }}
            >
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStatus(opt.value)}
                  className="flex-1 py-[7px] text-[13px] font-medium rounded-[8px] transition-all"
                  style={{
                    backgroundColor:
                      status === opt.value ? "#FFFFFF" : "transparent",
                    color: status === opt.value ? "#000000" : "rgba(60, 60, 67, 0.6)",
                    boxShadow:
                      status === opt.value
                        ? "0 1px 3px rgba(0,0,0,0.08), 0 0 0 0.5px rgba(0,0,0,0.04)"
                        : "none",
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-[13px] text-[#FF3B30]">{error}</p>}

          {/* Submit */}
          <button
            type="submit"
            disabled={isPending || !name.trim() || !address.trim()}
            className="w-full rounded-xl py-3.5 text-[15px] font-semibold text-white transition-opacity disabled:opacity-40"
            style={{ backgroundColor: "#007AFF" }}
          >
            {isPending
              ? isEditing
                ? "Saving…"
                : "Adding…"
              : isEditing
                ? "Save changes"
                : "Add site"}
          </button>

          {/* Delete (edit mode only) */}
          {isEditing && (
            <>
              {showDeleteConfirm ? (
                <div className="rounded-xl border border-[#FF3B30]/20 bg-[#FF3B30]/5 px-4 py-3.5">
                  <p className="text-[14px] text-[#000000] mb-3">
                    Delete{" "}
                    <span className="font-semibold">{property.name}</span>?
                    This cannot be undone.
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 rounded-xl py-2.5 text-[14px] font-medium text-[#000000] bg-white border border-[#EBEBEB] active:bg-[#F7F7F7] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="flex-1 rounded-xl py-2.5 text-[14px] font-semibold text-white bg-[#FF3B30] active:bg-[#D70015] transition-colors disabled:opacity-50"
                    >
                      {isDeleting ? "Deleting…" : "Delete"}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full py-2 text-[15px] font-medium text-[#FF3B30] active:opacity-60 transition-opacity"
                >
                  Delete site
                </button>
              )}
            </>
          )}
        </form>
      </div>
    </div>
  );
}
