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
    <div className="bg-white min-h-screen">
      {(["active", "pending", "done"] as const).map((group) => {
        const items = grouped[group];
        if (!items.length) return null;
        return (
          <div key={group}>
            <div className="px-6 py-4">
              <span className="text-[16px] font-bold text-[#222222]">
                {groupLabel[group]} · <span className="text-[#717171] font-normal">{items.length}</span>
              </span>
            </div>
            {items.map((task) => {
              const color = statusColor[task.status] ?? "#B0B0B0";
              return (
                <Link
                  key={task.id}
                  href={`/dashboard/tasks/${task.id}`}
                  className="card-press block rounded-xl border border-[#EBEBEB] mx-6 mb-3 px-5 py-4"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-bold text-[#222222] truncate">
                          {task.property?.name ?? "—"}
                        </p>
                        <span className="text-xs text-[#717171] shrink-0">
                          {task.scheduled_date}
                        </span>
                      </div>
                      <p className="text-xs text-[#717171] mt-1 truncate">
                        {task.property?.address}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span
                          className="text-xs px-2.5 py-0.5 rounded-full"
                          style={{
                            backgroundColor: `${color}1A`,
                            color: color,
                          }}
                        >
                          {statusLabel[task.status] ?? task.status.replace("_", " ")}
                        </span>
                        {task.cleaner && (
                          <span className="text-xs text-[#717171]">
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
        );
      })}

      {!tasks?.length && (
        <div className="px-4 py-16 text-center">
          <p className="text-sm text-[#717171]">No tasks</p>
        </div>
      )}
    </div>
  );
}
