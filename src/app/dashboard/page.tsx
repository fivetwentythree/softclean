import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { NotificationStack } from "@/components/notification-stack";
import { PullToRefresh } from "@/components/pull-to-refresh";

type TaskRow = {
  id: string;
  scheduled_date: string;
  status: string;
  notes: string | null;
  started_at: string | null;
  property: { name: string; address: string } | null;
};

const statusColor: Record<string, string> = {
  unassigned: "#8E8E93",
  assigned: "#FF9500",
  in_progress: "#34C759",
  completed: "#C7C7CC",
  issue_reported: "#FF3B30",
};

const daysUntilLabel = (dateStr: string) => {
  const today = new Date();
  const base = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const target = new Date(dateStr + "T00:00:00");
  const diff = Math.max(0, Math.round((target.getTime() - base.getTime()) / (1000 * 60 * 60 * 24)));
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return `in ${diff} days`;
};

const formatShortDate = (dateStr: string) =>
  new Date(dateStr + "T00:00:00").toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const today = new Date().toISOString().split("T")[0];

  const [{ data: nextTask }, { count: todayCount }, { data: upcoming }, { data: criticalStock }] =
    await Promise.all([
      supabase
        .from("cleaning_tasks")
        .select("id, scheduled_date, status, notes, started_at, property:properties(name, address)")
        .in("status", ["assigned", "in_progress", "unassigned"])
        .lte("scheduled_date", today)
        .order("scheduled_date", { ascending: true })
        .limit(1)
        .returns<TaskRow[]>(),
      supabase
        .from("cleaning_tasks")
        .select("*", { count: "exact", head: true })
        .eq("scheduled_date", today),
      supabase
        .from("cleaning_tasks")
        .select("id, scheduled_date, status, notes, started_at, property:properties(name, address)")
        .in("status", ["assigned", "in_progress", "unassigned"])
        .order("scheduled_date", { ascending: true })
        .limit(5)
        .returns<TaskRow[]>(),
      supabase
        .from("property_inventory")
        .select("current_quantity, minimum_threshold, property:properties(name), item:inventory_items(name)")
        .returns<{ current_quantity: number; minimum_threshold: number; property: { name: string } | null; item: { name: string } | null }[]>(),
    ]);

  const lowStock = criticalStock?.filter((s) => s.current_quantity <= s.minimum_threshold) ?? [];

  const active = nextTask?.[0];

  return (
    <PullToRefresh>
    <div style={{ background: "transparent", minHeight: "100vh" }}>
      {/* Low stock alerts */}
      {lowStock.length > 0 && (
        <div style={{ paddingTop: 16 }}>
          <NotificationStack
            header={
              <span style={{ fontSize: 15, fontWeight: 700, color: "#FF3B30" }}>
                Low stock · {lowStock.length}
              </span>
            }
          >
            {lowStock.map((s, i) => (
              <div
                key={i}
                style={{
                  marginLeft: 24,
                  marginRight: 24,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "14px 18px",
                  borderRadius: 22,
                  background: "rgba(255, 255, 255, 0.82)",
                  backdropFilter: "blur(40px) saturate(1.8)",
                  WebkitBackdropFilter: "blur(40px) saturate(1.8)",
                  border: "1px solid rgba(255, 255, 255, 0.6)",
                  boxShadow:
                    "0 8px 32px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.6)",
                }}
              >
                <span
                  style={{
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#FFFFFF",
                    width: 28,
                    height: 28,
                    borderRadius: 9,
                    backgroundColor: "#FF3B30",
                  }}
                >
                  !
                </span>
                <span style={{ fontSize: 14, fontWeight: 500, color: "#1C1C1E" }}>
                  {s.item?.name} at {s.property?.name} — {s.current_quantity} left
                </span>
              </div>
            ))}
          </NotificationStack>
        </div>
      )}

      {/* Next up */}
      <div style={{ padding: "32px 24px 16px" }}>
        <h2 style={{ fontSize: 34, fontWeight: 700, color: "#1C1C1E", letterSpacing: 0.37, lineHeight: 1.1 }}>
          Next up
        </h2>
        <p style={{ fontSize: 15, color: "rgba(60, 60, 67, 0.6)", marginTop: 4 }}>
          {todayCount ?? 0} tasks today
        </p>
      </div>

      {active ? (
        <Link
          href={`/dashboard/tasks/${active.id}`}
          className="card-press"
          style={{
            display: "block",
            margin: "0 24px 24px",
            background: "#FFFFFF",
            borderRadius: 16,
            padding: 20,
            boxShadow: "0 2px 16px rgba(0, 0, 0, 0.08)",
            textDecoration: "none",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <span
              style={{
                marginTop: 8,
                flexShrink: 0,
                display: "block",
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: statusColor[active.status] ?? "#8E8E93",
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 17, fontWeight: 600, color: "#1C1C1E" }}>
                {active.property?.name ?? "Unassigned"}
              </p>
              <p style={{ fontSize: 14, color: "rgba(60, 60, 67, 0.6)", marginTop: 2 }}>
                {active.property?.address}
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12 }}>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    padding: "4px 10px",
                    borderRadius: 100,
                    backgroundColor: `${statusColor[active.status] ?? "#8E8E93"}1A`,
                    color: statusColor[active.status] ?? "#8E8E93",
                    textTransform: "capitalize",
                  }}
                >
                  {active.status.replace("_", " ")}
                </span>
                <span style={{ fontSize: 13, color: "rgba(60, 60, 67, 0.6)" }}>
                  {active.scheduled_date}
                </span>
              </div>
              {active.notes && (
                <p style={{ fontSize: 14, color: "rgba(60, 60, 67, 0.6)", marginTop: 12, lineHeight: 1.5 }}>
                  {active.notes}
                </p>
              )}
            </div>
          </div>
        </Link>
      ) : (
        <div
          style={{
            margin: "0 24px 24px",
            borderRadius: 16,
            background: "#FFFFFF",
            boxShadow: "0 2px 16px rgba(0, 0, 0, 0.08)",
            padding: "40px 20px",
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: 15, color: "rgba(60, 60, 67, 0.3)" }}>No pending tasks</p>
        </div>
      )}

      {/* Coming up */}
      {upcoming && upcoming.length > 0 && (
        <div style={{ padding: "8px 24px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <h3 style={{ fontSize: 22, fontWeight: 700, color: "#1C1C1E" }}>Coming up</h3>
            <Link
              href="/dashboard/tasks"
              style={{ fontSize: 15, fontWeight: 600, color: "#007AFF", textDecoration: "none" }}
            >
              All tasks
            </Link>
          </div>
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: 14,
              boxShadow: "0 2px 16px rgba(0, 0, 0, 0.08)",
              overflow: "hidden",
            }}
          >
            {upcoming.map((task, index) => (
              <Link
                key={task.id}
                href={`/dashboard/tasks/${task.id}`}
                className="card-press"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "14px 16px",
                  textDecoration: "none",
                  borderBottom:
                    index < upcoming.length - 1
                      ? "0.5px solid rgba(60, 60, 67, 0.12)"
                      : "none",
                }}
              >
                <span
                  style={{
                    flexShrink: 0,
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: statusColor[task.status] ?? "#8E8E93",
                  }}
                />
                <p style={{ flex: 1, fontSize: 15, fontWeight: 500, color: "#1C1C1E", margin: 0 }}>
                  {task.property?.name}
                </p>
                <span style={{ fontSize: 13, color: "rgba(60, 60, 67, 0.6)" }}>
                  {formatShortDate(task.scheduled_date)}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#007AFF",
                    backgroundColor: "rgba(0, 122, 255, 0.1)",
                    borderRadius: 100,
                    padding: "3px 10px",
                  }}
                >
                  {daysUntilLabel(task.scheduled_date)}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
    </PullToRefresh>
  );
}
