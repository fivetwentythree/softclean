import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

type TaskRow = {
  id: string;
  scheduled_date: string;
  status: string;
  notes: string | null;
  property: { name: string; address: string } | null;
  cleaner: { full_name: string } | null;
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

const groupLabel: Record<string, string> = {
  active: "Current",
  pending: "Pending",
  done: "Done",
};

export default async function TasksPage() {
  const supabase = await createClient();

  const { data: tasks } = await supabase
    .from("cleaning_tasks")
    .select(`
      *,
      property:properties(name, address),
      cleaner:profiles!cleaning_tasks_cleaner_id_fkey(full_name)
    `)
    .order("scheduled_date", { ascending: true })
    .limit(50)
    .returns<TaskRow[]>();

  const grouped = {
    active: tasks?.filter((t) => ["in_progress", "assigned", "issue_reported"].includes(t.status)) ?? [],
    pending: tasks?.filter((t) => t.status === "unassigned") ?? [],
    done: tasks?.filter((t) => t.status === "completed") ?? [],
  };

  return (
    <div className="min-h-screen">
      {(["active", "pending", "done"] as const).map((group) => {
        const items = grouped[group];
        if (!items.length) return null;
        return (
          <div key={group} className="mb-6">
            <div className="px-5 py-2">
              <span className="text-[20px] font-bold" style={{ color: "rgba(60, 60, 67, 0.6)" }}>
                {groupLabel[group]} · <span className="font-normal">{items.length}</span>
              </span>
            </div>
            <div className="mx-5 bg-white rounded-[14px] overflow-hidden">
              {items.map((task, i) => {
                const color = statusColor[task.status] ?? "#8E8E93";
                return (
                  <Link
                    key={task.id}
                    href={`/dashboard/tasks/${task.id}`}
                    className="card-press block px-4 py-3.5"
                    style={i > 0 ? { borderTop: "0.5px solid rgba(60, 60, 67, 0.12)" } : undefined}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-bold text-[#000000] truncate">
                            {task.property?.name ?? "—"}
                          </p>
                          <span className="text-xs shrink-0" style={{ color: "rgba(60, 60, 67, 0.6)" }}>
                            {task.scheduled_date}
                          </span>
                        </div>
                        <p className="text-xs mt-1 truncate" style={{ color: "rgba(60, 60, 67, 0.6)" }}>
                          {task.property?.address}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span
                            className="text-[12px] px-2.5 py-0.5 rounded-full font-medium"
                            style={{
                              backgroundColor: `${color}1A`,
                              color: color,
                            }}
                          >
                            {statusLabel[task.status] ?? task.status.replace("_", " ")}
                          </span>
                          {task.cleaner && (
                            <span className="text-[12px]" style={{ color: "rgba(60, 60, 67, 0.6)" }}>
                              {task.cleaner.full_name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}

      {!tasks?.length && (
        <div className="px-4 py-16 text-center">
          <p className="text-sm" style={{ color: "rgba(60, 60, 67, 0.6)" }}>No tasks</p>
        </div>
      )}
    </div>
  );
}
