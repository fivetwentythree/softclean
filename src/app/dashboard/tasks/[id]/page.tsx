import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { TaskActions } from "./task-actions";

type Task = {
  id: string;
  scheduled_date: string;
  status: string;
  notes: string | null;
  started_at: string | null;
  completed_at: string | null;
  estimated_duration_minutes: number | null;
  property: { name: string; address: string; access_instructions: string | null } | null;
  cleaner: { full_name: string; phone: string | null } | null;
  booking: { check_in_at: string; check_out_at: string; guest_count: number } | null;
};

const statusColor: Record<string, string> = {
  unassigned: "#8E8E93",
  assigned: "#FF9500",
  in_progress: "#34C759",
  completed: "#C7C7CC",
  issue_reported: "#FF3B30",
};

const statusLabel: Record<string, string> = {
  unassigned: "Unassigned",
  assigned: "Assigned",
  in_progress: "In progress",
  completed: "Cleaned",
  issue_reported: "Issue reported",
};

function formatDateTime(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const [{ data: profile }, { data: task }] = await Promise.all([
    supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single<{ role: string }>(),
    supabase
      .from("cleaning_tasks")
      .select(
        `
        id, scheduled_date, status, notes, started_at, completed_at, estimated_duration_minutes,
        property:properties(name, address, access_instructions),
        cleaner:profiles!cleaning_tasks_cleaner_id_fkey(full_name, phone),
        booking:bookings(check_in_at, check_out_at, guest_count)
      `
      )
      .eq("id", id)
      .single<Task>(),
  ]);

  if (!task) notFound();

  const color = statusColor[task.status] ?? "#8E8E93";
  const userRole = profile?.role ?? "cleaner";

  return (
    <div className="min-h-screen px-5 py-6 space-y-5">
      {/* Back link */}
      <Link
        href="/dashboard/tasks"
        className="text-sm text-[#007AFF] hover:text-[#0056B3] transition-colors"
      >
        ← Back to tasks
      </Link>

      {/* Property header */}
      <div>
        <h1 className="text-[28px] font-bold text-[#000000] leading-tight">
          {task.property?.name ?? "—"}
        </h1>
        {task.property?.address && (
          <p className="text-sm mt-1" style={{ color: "rgba(60, 60, 67, 0.6)" }}>{task.property.address}</p>
        )}
      </div>

      {/* Status card */}
      <div
        className="rounded-[14px] bg-white p-5 space-y-3"
        style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)" }}
      >
        <div className="flex items-center justify-between">
          <span
            className="text-[12px] font-semibold px-3 py-1 rounded-full"
            style={{
              backgroundColor: `${color}1A`,
              color: color,
            }}
          >
            {statusLabel[task.status] ?? task.status.replace("_", " ")}
          </span>
          {task.estimated_duration_minutes && (
            <span className="text-xs" style={{ color: "rgba(60, 60, 67, 0.6)" }}>
              ~{task.estimated_duration_minutes} min
            </span>
          )}
        </div>

        <div className="space-y-1">
          <p className="text-sm text-[#000000]">
            <span style={{ color: "rgba(60, 60, 67, 0.6)" }}>Scheduled:</span>{" "}
            {formatDate(task.scheduled_date)}
          </p>
          {task.started_at && (
            <p className="text-sm text-[#000000]">
              <span style={{ color: "rgba(60, 60, 67, 0.6)" }}>Started at:</span>{" "}
              {formatDateTime(task.started_at)}
            </p>
          )}
          {task.completed_at && (
            <p className="text-sm text-[#000000]">
              <span style={{ color: "rgba(60, 60, 67, 0.6)" }}>Cleaned at:</span>{" "}
              {formatDateTime(task.completed_at)}
            </p>
          )}
        </div>
      </div>

      {/* Access instructions */}
      {task.property?.access_instructions && (
        <div className="rounded-[14px] bg-white p-5">
          <p className="text-[13px] font-semibold uppercase tracking-wide mb-2" style={{ color: "rgba(60, 60, 67, 0.6)" }}>
            Access instructions
          </p>
          <p className="text-sm text-[#000000] leading-relaxed">
            {task.property.access_instructions}
          </p>
        </div>
      )}

      {/* Notes */}
      {task.notes && (
        <div className="rounded-[14px] bg-white p-5">
          <p className="text-[13px] font-semibold uppercase tracking-wide mb-2" style={{ color: "rgba(60, 60, 67, 0.6)" }}>
            Notes
          </p>
          <p className="text-sm text-[#000000] leading-relaxed">{task.notes}</p>
        </div>
      )}

      {/* Cleaner info */}
      {task.cleaner && (
        <div className="rounded-[14px] bg-white p-5">
          <p className="text-[13px] font-semibold uppercase tracking-wide mb-2" style={{ color: "rgba(60, 60, 67, 0.6)" }}>
            Cleaner
          </p>
          <p className="text-sm text-[#000000]">{task.cleaner.full_name}</p>
          {task.cleaner.phone && (
            <p className="text-sm mt-1" style={{ color: "rgba(60, 60, 67, 0.6)" }}>{task.cleaner.phone}</p>
          )}
        </div>
      )}

      {/* Booking info */}
      {task.booking && (
        <div className="rounded-[14px] bg-white p-5">
          <p className="text-[13px] font-semibold uppercase tracking-wide mb-2" style={{ color: "rgba(60, 60, 67, 0.6)" }}>
            Booking
          </p>
          <div className="space-y-1">
            <p className="text-sm text-[#000000]">
              <span style={{ color: "rgba(60, 60, 67, 0.6)" }}>Check-in:</span>{" "}
              {formatDateTime(task.booking.check_in_at)}
            </p>
            <p className="text-sm text-[#000000]">
              <span style={{ color: "rgba(60, 60, 67, 0.6)" }}>Check-out:</span>{" "}
              {formatDateTime(task.booking.check_out_at)}
            </p>
            <p className="text-sm text-[#000000]">
              <span style={{ color: "rgba(60, 60, 67, 0.6)" }}>Guests:</span>{" "}
              {task.booking.guest_count}
            </p>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <TaskActions
        taskId={task.id}
        currentStatus={task.status}
        userRole={userRole}
      />
    </div>
  );
}
