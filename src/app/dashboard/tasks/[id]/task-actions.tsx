"use client";

import { useTransition } from "react";
import { updateTaskStatus } from "./actions";
import { Notification, useNotification } from "@/components/notification";

type TaskActionsProps = {
  taskId: string;
  currentStatus: string;
  userRole: string;
};

export function TaskActions({ taskId, currentStatus, userRole }: TaskActionsProps) {
  const [isPending, startTransition] = useTransition();
  const notification = useNotification();

  const isCleaner = userRole === "cleaner";
  const isManager = userRole === "manager";
  const canAct = isCleaner || isManager;

  const statusLabels: Record<string, string> = {
    in_progress: "Cleaning started",
    completed: "Cleaned",
    issue_reported: "Issue reported",
  };

  function handleUpdate(newStatus: string) {
    startTransition(async () => {
      await updateTaskStatus(taskId, newStatus);
      const label = statusLabels[newStatus] ?? "Status updated";
      const type = newStatus === "completed" ? "success" : newStatus === "issue_reported" ? "error" : "info";
      notification.notify(label, type);
    });
  }

  if (currentStatus === "completed") {
    return (
      <div className="px-6">
        <button
          disabled
          className="bg-[#34C759]/10 text-[#34C759] rounded-full font-semibold py-3.5 w-full text-base cursor-default"
        >
          ✓ Cleaned
        </button>
      </div>
    );
  }

  if (currentStatus === "unassigned") {
    return (
      <div className="px-6">
        <p className="text-sm text-center py-3.5" style={{ color: "rgba(60, 60, 67, 0.6)" }}>
          Waiting to be assigned
        </p>
      </div>
    );
  }

  if (!canAct) return null;

  return (
    <div className="px-6 space-y-3">
      <Notification
        message={notification.message}
        type={notification.type}
        visible={notification.visible}
        onDismiss={notification.dismiss}
      />
      {currentStatus === "assigned" && (
        <button
          onClick={() => handleUpdate("in_progress")}
          disabled={isPending}
          className="bg-[#007AFF] text-white rounded-full font-semibold py-3.5 w-full text-base disabled:opacity-50 transition-colors"
        >
          {isPending ? "Updating..." : "Start cleaning"}
        </button>
      )}

      {currentStatus === "in_progress" && (
        <>
          <button
            onClick={() => handleUpdate("completed")}
            disabled={isPending}
            className="bg-[#007AFF] text-white rounded-full font-semibold py-3.5 w-full text-base disabled:opacity-50 transition-colors"
          >
            {isPending ? "Updating..." : "Mark cleaned"}
          </button>
          <button
            onClick={() => handleUpdate("issue_reported")}
            disabled={isPending}
            className="bg-white border-2 border-[#FF3B30] text-[#FF3B30] rounded-full font-semibold py-3.5 w-full text-base disabled:opacity-50 transition-colors"
          >
            {isPending ? "Updating..." : "Report issue"}
          </button>
        </>
      )}

      {currentStatus === "issue_reported" && (
        <button
          onClick={() => handleUpdate("in_progress")}
          disabled={isPending}
          className="bg-[#007AFF] text-white rounded-full font-semibold py-3.5 w-full text-base disabled:opacity-50 transition-colors"
        >
          {isPending ? "Updating..." : "Resume cleaning"}
        </button>
      )}
    </div>
  );
}
