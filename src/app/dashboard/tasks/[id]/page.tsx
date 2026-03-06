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
  unassigned: "#B0B0B0",
  assigned: "#FFB400",
  in_progress: "#00A699",
  completed: "#DDDDDD",
  issue_reported: "#FF385C",
};

const statusLabel: Record<string, string> = {
  unassigned: "Unassigned",
  assigned: "Assigned",
  in_progress: "In progress",
  completed: "Completed",
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single<{ role: string }>();

  const { data: task } = await supabase
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
    .single<Task>();

  if (!task) notFound();

  const color = statusColor[task.status] ?? "#B0B0B0";
  const userRole = profile?.role ?? "cleaner";

  return (
    <div className="bg-white min-h-screen px-6 py-6 space-y-6">
      {/* Back link */}
      <Link
        href="/dashboard/tasks"
        className="text-sm text-[#717171] hover:text-[#222222] transition-colors"
      >
        ← Back to tasks
      </Link>

      {/* Property header */}
      <div>
        <h1 className="text-2xl font-bold text-[#222222]">
          {task.property?.name ?? "—"}
        </h1>
        {task.property?.address && (
          <p className="text-sm text-[#717171] mt-1">{task.property.address}</p>
        )}
      </div>

      {/* Status card */}
      <div
        className="rounded-2xl p-5 space-y-3"
        style={{ boxShadow: "0 3px 10px rgba(0,0,0,0.1)" }}
      >
        <div className="flex items-center justify-between">
          <span
            className="text-xs font-semibold px-3 py-1 rounded-full"
            style={{
              backgroundColor: `${color}1A`,
              color: color,
            }}
          >
            {statusLabel[task.status] ?? task.status.replace("_", " ")}
          </span>
          {task.estimated_duration_minutes && (
            <span className="text-xs text-[#717171]">
              ~{task.estimated_duration_minutes} min
            </span>
          )}
        </div>

        <div className="space-y-1">
          <p className="text-sm text-[#222222]">
            <span className="text-[#717171]">Scheduled:</span>{" "}
            {formatDate(task.scheduled_date)}
          </p>
          {task.started_at && (
            <p className="text-sm text-[#222222]">
              <span className="text-[#717171]">Started at:</span>{" "}
              {formatDateTime(task.started_at)}
            </p>
          )}
          {task.completed_at && (
            <p className="text-sm text-[#222222]">
              <span className="text-[#717171]">Completed at:</span>{" "}
              {formatDateTime(task.completed_at)}
            </p>
          )}
        </div>
      </div>

      {/* Access instructions */}
      {task.property?.access_instructions && (
        <div className="rounded-xl bg-[#F7F7F7] p-5">
          <p className="text-xs font-semibold text-[#717171] uppercase tracking-wide mb-2">
            Access instructions
          </p>
          <p className="text-sm text-[#222222] leading-relaxed">
            {task.property.access_instructions}
          </p>
        </div>
      )}

      {/* Notes */}
      {task.notes && (
        <div className="rounded-xl bg-[#F7F7F7] p-5">
          <p className="text-xs font-semibold text-[#717171] uppercase tracking-wide mb-2">
            Notes
          </p>
          <p className="text-sm text-[#222222] leading-relaxed">{task.notes}</p>
        </div>
      )}

      {/* Cleaner info */}
      {task.cleaner && (
        <div className="rounded-xl bg-[#F7F7F7] p-5">
          <p className="text-xs font-semibold text-[#717171] uppercase tracking-wide mb-2">
            Cleaner
          </p>
          <p className="text-sm text-[#222222]">{task.cleaner.full_name}</p>
          {task.cleaner.phone && (
            <p className="text-sm text-[#717171] mt-1">{task.cleaner.phone}</p>
          )}
        </div>
      )}

      {/* Booking info */}
      {task.booking && (
        <div className="rounded-xl bg-[#F7F7F7] p-5">
          <p className="text-xs font-semibold text-[#717171] uppercase tracking-wide mb-2">
            Booking
          </p>
          <div className="space-y-1">
            <p className="text-sm text-[#222222]">
              <span className="text-[#717171]">Check-in:</span>{" "}
              {formatDateTime(task.booking.check_in_at)}
            </p>
            <p className="text-sm text-[#222222]">
              <span className="text-[#717171]">Check-out:</span>{" "}
              {formatDateTime(task.booking.check_out_at)}
            </p>
            <p className="text-sm text-[#222222]">
              <span className="text-[#717171]">Guests:</span>{" "}
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
