import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

type TaskRow = {
  id: string;
  scheduled_date: string;
  status: string;
  notes: string | null;
  started_at: string | null;
  property: { name: string; address: string } | null;
};

const statusColor: Record<string, string> = {
  unassigned: "#B0B0B0",
  assigned: "#FFB400",
  in_progress: "#00A699",
  completed: "#DDDDDD",
  issue_reported: "#FF385C",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const today = new Date().toISOString().split("T")[0];

  // Get the most urgent/next task
  const { data: nextTask } = await supabase
    .from("cleaning_tasks")
    .select("id, scheduled_date, status, notes, started_at, property:properties(name, address)")
    .in("status", ["assigned", "in_progress", "unassigned"])
    .lte("scheduled_date", today)
    .order("scheduled_date", { ascending: true })
    .limit(1)
    .returns<TaskRow[]>();

  // Get today's task count
  const { count: todayCount } = await supabase
    .from("cleaning_tasks")
    .select("*", { count: "exact", head: true })
    .eq("scheduled_date", today);

  // Get upcoming tasks
  const { data: upcoming } = await supabase
    .from("cleaning_tasks")
    .select("id, scheduled_date, status, notes, started_at, property:properties(name, address)")
    .in("status", ["assigned", "in_progress", "unassigned"])
    .order("scheduled_date", { ascending: true })
    .limit(5)
    .returns<TaskRow[]>();

  // Get critical inventory
  const { data: criticalStock } = await supabase
    .from("property_inventory")
    .select("current_quantity, minimum_threshold, property:properties(name), item:inventory_items(name)")
    .returns<{ current_quantity: number; minimum_threshold: number; property: { name: string } | null; item: { name: string } | null }[]>();

  const lowStock = criticalStock?.filter((s) => s.current_quantity <= s.minimum_threshold) ?? [];

  const active = nextTask?.[0];

  return (
    <div className="bg-white min-h-screen">
      {/* Low stock alerts */}
      {lowStock.length > 0 && (
        <div className="px-6 pt-4 space-y-2">
          {lowStock.map((s, i) => (
            <div
              key={i}
              className="bg-[#FFF0F0] rounded-xl border-l-4 border-[#FF385C] px-4 py-3"
            >
              <span className="text-sm text-[#FF385C]">
                ⚠ {s.item?.name} at {s.property?.name} — {s.current_quantity} left
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Next up */}
      <div className="px-6 pt-8 pb-4">
        <h2 className="text-2xl font-bold text-[#222222]">Next up</h2>
        <p className="text-sm text-[#717171] mt-1">{todayCount ?? 0} tasks today</p>
      </div>

      {active ? (
        <Link
          href={`/dashboard/tasks/${active.id}`}
          className="card-press block mx-6 mb-6 bg-white rounded-2xl p-5"
          style={{ boxShadow: "0 3px 10px rgba(0,0,0,0.1)" }}
        >
          <div className="flex items-start gap-3">
            <span
              className="mt-1.5 shrink-0 block w-2 h-2 rounded-full"
              style={{ backgroundColor: statusColor[active.status] ?? "#B0B0B0" }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-lg font-bold text-[#222222]">
                {active.property?.name ?? "Unassigned"}
              </p>
              <p className="text-sm text-[#717171] mt-0.5">{active.property?.address}</p>
              <div className="flex items-center gap-3 mt-3">
                <span
                  className="text-xs font-medium px-2.5 py-1 rounded-full"
                  style={{
                    backgroundColor: `${statusColor[active.status] ?? "#B0B0B0"}1A`,
                    color: statusColor[active.status] ?? "#B0B0B0",
                  }}
                >
                  {active.status.replace("_", " ")}
                </span>
                <span className="text-xs text-[#717171]">{active.scheduled_date}</span>
              </div>
              {active.notes && (
                <p className="text-sm text-[#717171] mt-3 leading-relaxed">{active.notes}</p>
              )}
            </div>
          </div>
        </Link>
      ) : (
        <div className="mx-6 mb-6 rounded-2xl border border-[#EBEBEB] px-5 py-10 text-center">
          <p className="text-sm text-[#717171]">No pending tasks</p>
        </div>
      )}

      {/* Coming up */}
      {upcoming && upcoming.length > 0 && (
        <div className="px-6 pt-2 pb-6">
          <h3 className="text-lg font-bold text-[#222222] mb-3">Coming up</h3>
          <div className="space-y-1">
            {upcoming.map((task) => (
              <Link
                key={task.id}
                href={`/dashboard/tasks/${task.id}`}
                className="card-press flex items-center gap-3 rounded-xl px-4 py-3.5 border-b border-[#EBEBEB] active:bg-[#F7F7F7] transition-colors"
              >
                <span
                  className="shrink-0 block w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: statusColor[task.status] ?? "#B0B0B0" }}
                />
                <p className="flex-1 text-sm font-medium text-[#222222]">{task.property?.name}</p>
                <span className="text-xs text-[#717171]">{task.scheduled_date}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
