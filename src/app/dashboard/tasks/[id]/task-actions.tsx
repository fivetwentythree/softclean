"use client";

import { useTransition } from "react";
import { updateTaskStatus } from "./actions";

type TaskActionsProps = {
  taskId: string;
  currentStatus: string;
  userRole: string;
};

export function TaskActions({ taskId, currentStatus, userRole }: TaskActionsProps) {
  const [isPending, startTransition] = useTransition();

  const isCleaner = userRole === "cleaner";
  const isManager = userRole === "manager";
  const canAct = isCleaner || isManager;

  function handleUpdate(newStatus: string) {
    startTransition(async () => {
      await updateTaskStatus(taskId, newStatus);
    });
  }

  if (currentStatus === "completed") {
    return (
      <div className="px-6">
        <button
          disabled
          className="bg-[#00A699]/10 text-[#00A699] rounded-full font-semibold py-3.5 w-full text-base cursor-default"
        >
          ✓ Task completed
        </button>
      </div>
    );
  }

  if (currentStatus === "unassigned") {
    return (
      <div className="px-6">
        <p className="text-sm text-[#717171] text-center py-3.5">
          Waiting to be assigned
        </p>
      </div>
    );
  }

  if (!canAct) return null;

  return (
    <div className="px-6 space-y-3">
      {currentStatus === "assigned" && (
        <button
          onClick={() => handleUpdate("in_progress")}
          disabled={isPending}
          className="bg-[#FF385C] text-white rounded-full font-semibold py-3.5 w-full text-base disabled:opacity-50 transition-colors"
        >
          {isPending ? "Updating..." : "Start cleaning"}
        </button>
      )}

      {currentStatus === "in_progress" && (
        <>
          <button
            onClick={() => handleUpdate("completed")}
            disabled={isPending}
            className="bg-[#FF385C] text-white rounded-full font-semibold py-3.5 w-full text-base disabled:opacity-50 transition-colors"
          >
            {isPending ? "Updating..." : "Mark complete"}
          </button>
          <button
            onClick={() => handleUpdate("issue_reported")}
            disabled={isPending}
            className="bg-white border-2 border-[#FF385C] text-[#FF385C] rounded-full font-semibold py-3.5 w-full text-base disabled:opacity-50 transition-colors"
          >
            {isPending ? "Updating..." : "Report issue"}
          </button>
        </>
      )}

      {currentStatus === "issue_reported" && (
        <button
          onClick={() => handleUpdate("in_progress")}
          disabled={isPending}
          className="bg-[#FF385C] text-white rounded-full font-semibold py-3.5 w-full text-base disabled:opacity-50 transition-colors"
        >
          {isPending ? "Updating..." : "Resume cleaning"}
        </button>
      )}
    </div>
  );
}
