"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface AttachmentSheetProps {
  onClose: () => void;
  onFilesSelected: (files: File[]) => void;
}

export function AttachmentSheet({ onClose, onFilesSelected }: AttachmentSheetProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragY, setDragY] = useState(0);
  const startYRef = useRef(0);
  const velocityRef = useRef(0);
  const sheetRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const SHEET_HEIGHT = 380;
  const DISMISS_THRESHOLD = 80;

  const close = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      startYRef.current = e.touches[0].clientY;
      velocityRef.current = 0;
      setIsDragging(true);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      const deltaY = e.touches[0].clientY - startYRef.current;
      velocityRef.current = e.touches[0].clientY - startYRef.current;
      setDragY(Math.max(0, deltaY));
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
      if (dragY > DISMISS_THRESHOLD || velocityRef.current > 15) {
        close();
      } else {
        setDragY(0);
      }
    };

    const sheet = sheetRef.current;
    if (sheet) {
      sheet.addEventListener("touchstart", handleTouchStart, { passive: true });
      sheet.addEventListener("touchmove", handleTouchMove, { passive: true });
      sheet.addEventListener("touchend", handleTouchEnd);
    }

    return () => {
      if (sheet) {
        sheet.removeEventListener("touchstart", handleTouchStart);
        sheet.removeEventListener("touchmove", handleTouchMove);
        sheet.removeEventListener("touchend", handleTouchEnd);
      }
    };
  }, [close, dragY, isDragging]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [close]);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onFilesSelected(files);
      close();
    }
    e.target.value = "";
  };

  const handleDocSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onFilesSelected(files);
      close();
    }
    e.target.value = "";
  };

  const handleCameraSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onFilesSelected(files);
      close();
    }
    e.target.value = "";
  };

  const backdropOpacity = Math.min(0.5, (dragY / DISMISS_THRESHOLD) * 0.5);
  const sheetTranslate = isDragging ? dragY : 0;
  const sheetScale = 1 - sheetTranslate * 0.0003;
  const sheetBorderRadius = Math.max(0, 28 - sheetTranslate * 0.08);

  return (
    <>
      <div
        className="fixed inset-0 z-40"
        style={{
          background: `rgba(0, 0, 0, ${backdropOpacity})`,
          opacity: dragY > 0 ? 1 : 0,
          transition: isDragging ? "none" : "opacity 0.25s ease",
        }}
        onClick={close}
      />

      <div
        ref={sheetRef}
        className="fixed left-0 right-0 z-50"
        style={{
          bottom: 0,
          height: SHEET_HEIGHT,
          transform: `translateY(${sheetTranslate}px) scale(${sheetScale})`,
          borderTopLeftRadius: sheetBorderRadius,
          borderTopRightRadius: sheetBorderRadius,
          transition: isDragging ? "none" : "transform 0.35s cubic-bezier(0.32, 0.72, 0, 1), border-radius 0.25s ease",
        }}
      >
        <div
          className="h-full flex flex-col"
          style={{
            background: "rgba(249, 249, 251, 0.96)",
            backdropFilter: "blur(50px) saturate(2)",
            WebkitBackdropFilter: "blur(50px) saturate(2)",
            boxShadow: "0 -8px 32px rgba(0, 0, 0, 0.12)",
          }}
        >
          <div className="flex flex-col items-center pt-4 pb-3 px-4">
            <div 
              className="w-36 h-[5px] rounded-full"
              style={{ background: "rgba(142, 142, 147, 0.4)" }}
            />
            <p className="text-[15px] font-semibold text-[#1a1a1a] mt-4">
              Add Attachment
            </p>
          </div>

          <div className="flex-1 px-5 py-2 overflow-y-auto">
            <div className="rounded-[26px] overflow-hidden border border-black/5 bg-white/90 backdrop-blur-2xl shadow-[0_12px_28px_rgba(0,0,0,0.08)]">
              <label
                htmlFor="attachment-photos"
                className="w-full px-4 py-[14px] flex items-center gap-4 active:opacity-70 transition-opacity"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ background: "#0A84FF" }}
                >
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <rect x="3" y="3" width="16" height="16" rx="3" stroke="white" strokeWidth="1.5" />
                    <circle cx="7.5" cy="7.5" r="1.4" fill="white" />
                    <path d="M3 16L7 12L10 15L13 11L19 17" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="text-left flex-1">
                  <p className="text-[17px] font-medium text-[#111827]">Photos</p>
                </div>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M6 4L10 8L6 12" stroke="#C7C7CC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </label>

              <div className="h-px bg-black/5" />

              <label
                htmlFor="attachment-docs"
                className="w-full px-4 py-[14px] flex items-center gap-4 active:opacity-70 transition-opacity"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ background: "#34C759" }}
                >
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <path d="M13 3H7C6.44772 3 6 3.44772 6 4V18C6 18.5523 6.44772 19 7 19H15C15.5523 19 16 18.5523 16 18V7L13 3Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M13 3V7H16" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M9 11H13M9 14H12" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="text-left flex-1">
                  <p className="text-[17px] font-medium text-[#111827]">Document</p>
                </div>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M6 4L10 8L6 12" stroke="#C7C7CC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </label>

              <div className="h-px bg-black/5" />

              <label
                htmlFor="attachment-camera"
                className="w-full px-4 py-[14px] flex items-center gap-4 active:opacity-70 transition-opacity"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ background: "#FF9500" }}
                >
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <circle cx="11" cy="11" r="7" stroke="white" strokeWidth="1.5" />
                    <circle cx="11" cy="11" r="2.6" fill="white" />
                    <path d="M11 4V6M11 16V18M4 11H6M16 11H18" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
                  </svg>
                </div>
                <div className="text-left flex-1">
                  <p className="text-[17px] font-medium text-[#111827]">Camera</p>
                </div>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M6 4L10 8L6 12" stroke="#C7C7CC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </label>
            </div>
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handlePhotoSelect}
        id="attachment-photos"
        className="absolute opacity-0 w-0 h-0 pointer-events-none"
      />

      <input
        ref={docInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.rtf"
        onChange={handleDocSelect}
        id="attachment-docs"
        className="absolute opacity-0 w-0 h-0 pointer-events-none"
      />

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleCameraSelect}
        id="attachment-camera"
        className="absolute opacity-0 w-0 h-0 pointer-events-none"
      />
    </>
  );
}
