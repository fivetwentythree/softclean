import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Database } from "@/lib/types/database";
import { DatePicker } from "./date-picker";
import { NotificationStack } from "@/components/notification-stack";
import { StockStepper } from "@/components/stock-stepper";

type Property = Database["public"]["Tables"]["properties"]["Row"];
type BookingRow = Database["public"]["Tables"]["bookings"]["Row"];
type BookingCalendar = Pick<BookingRow, "id" | "check_in_at" | "check_out_at" | "guest_count">;
type TaskNote = Pick<
  Database["public"]["Tables"]["cleaning_tasks"]["Row"],
  "id" | "scheduled_date" | "notes"
>;

type TaskRow = {
  id: string;
  scheduled_date: string;
  status: string;
  notes: string | null;
  cleaner: { full_name: string } | null;
};

type InventoryRow = {
  item_id: string;
  current_quantity: number;
  minimum_threshold: number;
  item: { name: string; category: string; unit: string } | null;
};

type Conversation = {
  id: string;
  topic: string;
  status: string;
  updated_at: string;
  booking_id: string | null;
};

type BookingConversation = Pick<
  Database["public"]["Tables"]["conversations"]["Row"],
  "id" | "topic" | "status" | "updated_at" | "booking_id"
>;

type OrderRow = {
  id: string;
  status: string;
  order_date: string;
  supplier: { full_name: string } | null;
  items: {
    quantity_requested: number;
    quantity_delivered: number | null;
    item: { name: string; unit: string } | null;
  }[];
};

const statusColor: Record<string, string> = {
  unassigned: "#8E8E93",
  assigned: "#FF9500",
  in_progress: "#007AFF",
  completed: "#34C759",
  issue_reported: "#FF3B30",
};

const statusLabel: Record<string, string> = {
  unassigned: "Unassigned",
  assigned: "Assigned",
  in_progress: "In progress",
  completed: "Cleaned",
  issue_reported: "Issue reported",
};

const orderStatusColor: Record<string, string> = {
  pending: "#FF9500",
  dispatched: "#8E8E93",
  delivered: "#34C759",
  disputed: "#FF3B30",
};

const toDateKey = (value: string) => value.split("T")[0];

const formatShortDate = (value: string) =>
  new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

const formatDateRange = (start: string, end: string) =>
  `${formatShortDate(start)} – ${formatShortDate(end)}`;

const formatBookingTopic = (topic: string) => {
  if (!topic.startsWith("Booking ")) return topic;
  return topic.replace(/(\d{4})-(\d{2})-(\d{2})/g, "$1/$2/$3");
};

const glassStyle = {
  borderRadius: 14,
  background: "#FFFFFF",
  boxShadow: "0 0 0 0.5px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.06)",
} as const;

export default async function PropertyDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const { id } = await params;
  const { date } = await searchParams;
  const filterDate = date || null;
  const supabase = await createClient();

  const { data: property } = await supabase
    .from("properties")
    .select("*")
    .eq("id", id)
    .single<Property>();

  if (!property) notFound();

  // Build queries — when a date is selected, filter tasks and orders to that date
  const tasksQuery = supabase
    .from("cleaning_tasks")
    .select("id, scheduled_date, status, notes, cleaner:profiles!cleaning_tasks_cleaner_id_fkey(full_name)")
    .eq("property_id", id)
    .order("scheduled_date", { ascending: false })
    .limit(10);

  if (filterDate) {
    tasksQuery.eq("scheduled_date", filterDate);
  }

  const ordersQuery = supabase
    .from("supply_orders")
    .select(`
      id, status, order_date,
      supplier:profiles!supply_orders_supplier_id_fkey(full_name),
      items:order_line_items(quantity_requested, quantity_delivered, item:inventory_items(name, unit))
    `)
    .eq("property_id", id)
    .order("order_date", { ascending: false })
    .limit(10);

  if (filterDate) {
    ordersQuery.gte("order_date", `${filterDate}T00:00:00`)
      .lte("order_date", `${filterDate}T23:59:59`);
  }

  const conversationsQuery = supabase
    .from("conversations")
    .select("id, topic, status, updated_at, booking_id")
    .eq("property_id", id)
    .order("updated_at", { ascending: false })
    .limit(10);

  const [
    { data: tasks },
    { data: inventory },
    { data: conversations },
    { data: orders },
    { data: bookings },
    { data: taskNotes },
  ] = await Promise.all([
    tasksQuery.returns<TaskRow[]>(),
    supabase
      .from("property_inventory")
      .select("item_id, current_quantity, minimum_threshold, item:inventory_items(name, category, unit)")
      .eq("property_id", id)
      .order("current_quantity", { ascending: true })
      .returns<InventoryRow[]>(),
    conversationsQuery.returns<Conversation[]>(),
    ordersQuery.returns<OrderRow[]>(),
    supabase
      .from("bookings")
      .select("id, check_in_at, check_out_at, guest_count")
      .eq("property_id", id)
      .order("check_in_at", { ascending: true })
      .returns<BookingCalendar[]>(),
    supabase
      .from("cleaning_tasks")
      .select("id, scheduled_date, notes")
      .eq("property_id", id)
      .not("notes", "is", null)
      .order("scheduled_date", { ascending: true })
      .returns<TaskNote[]>(),
  ]);

  const bookingMatches =
    filterDate && bookings?.length
      ? bookings.filter((booking) => {
          const startKey = toDateKey(booking.check_in_at);
          const endKey = toDateKey(booking.check_out_at);
          return startKey <= filterDate && endKey >= filterDate;
        })
      : [];

  const bookingIds = bookingMatches.map((booking) => booking.id);
  const { data: bookingConversations } = bookingIds.length
    ? await supabase
        .from("conversations")
        .select("id, topic, status, updated_at, booking_id")
        .in("booking_id", bookingIds)
        .returns<BookingConversation[]>()
    : { data: [] as BookingConversation[] };

  const bookingMap = new Map(bookingMatches.map((booking) => [booking.id, booking]));
  const messagesForView = filterDate ? bookingConversations ?? [] : conversations ?? [];

  return (
    <div className="min-h-screen pb-8">
      {/* Header */}
      <div className="px-6 pt-4 pb-6">
        <Link
          href="/dashboard/properties"
          className="text-[15px] text-[#007AFF] transition-colors mb-3 inline-flex items-center gap-1"
        >
          <svg width="8" height="14" viewBox="0 0 8 14" fill="none" className="shrink-0">
            <path d="M7 1L1 7L7 13" stroke="#007AFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Sites
        </Link>
        <div className="flex items-start justify-between gap-3 mt-2">
          <div>
            <h1 className="text-[22px] font-bold text-[#000000]">{property.name}</h1>
            <p className="text-[15px] mt-1" style={{ color: "rgba(60, 60, 67, 0.6)" }}>{property.address}</p>
          </div>
        </div>
        {property.access_instructions && (
          <p className="text-[15px] mt-3 leading-relaxed" style={{ color: "rgba(60, 60, 67, 0.6)" }}>
            {property.access_instructions}
          </p>
        )}
      </div>

      {/* Date filter */}
      <DatePicker
        value={filterDate}
        bookings={bookings ?? []}
      />
      {filterDate && (
        <div className="px-6 pt-3 pb-1">
          <p className="text-[13px]" style={{ color: "rgba(60, 60, 67, 0.6)" }}>
            Showing activity for{" "}
            <span className="font-medium text-[#000000]">
              {new Date(filterDate + "T00:00:00").toLocaleDateString(undefined, {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </span>
          </p>
        </div>
      )}

      {/* Cleaning schedule */}
      <NotificationStack
        header={
          <span className="text-[13px] font-semibold tracking-wide uppercase" style={{ color: "rgba(60, 60, 67, 0.6)" }}>
            Cleaning <span className="font-normal">· {tasks?.length ?? 0}</span>
          </span>
        }
      >
        {tasks?.length ? (
          tasks.map((task) => {
            const color = statusColor[task.status] ?? "#B0B0B0";
            return (
              <Link
                key={task.id}
                href={`/dashboard/tasks/${task.id}`}
                className="card-press block mx-6 mb-3 px-5 py-4"
                style={glassStyle}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className="text-xs font-medium px-2.5 py-0.5 rounded-full"
                        style={{ backgroundColor: `${color}1A`, color }}
                      >
                        {statusLabel[task.status] ?? task.status}
                      </span>
                      <span className="text-xs shrink-0" style={{ color: "rgba(60, 60, 67, 0.6)" }}>
                        {task.scheduled_date}
                      </span>
                    </div>
                    {task.cleaner && (
                      <p className="text-xs mt-1.5" style={{ color: "rgba(60, 60, 67, 0.6)" }}>
                        {task.cleaner.full_name}
                      </p>
                    )}
                    {task.notes && (
                      <p className="text-xs mt-1 truncate" style={{ color: "rgba(60, 60, 67, 0.6)" }}>
                        {task.notes}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            );
          })
        ) : [
          <Empty key="empty">No cleaning tasks</Empty>
        ]}
      </NotificationStack>

      {/* Inventory / Stock */}
      <NotificationStack
        header={
          <span className="text-[13px] font-semibold tracking-wide uppercase" style={{ color: "rgba(60, 60, 67, 0.6)" }}>
            Stock <span className="font-normal">· {inventory?.length ?? 0}</span>
          </span>
        }
      >
        {inventory?.length ? (
          inventory.map((inv) => (
            <StockCard
              key={inv.item_id}
              propertyId={id}
              inv={inv}
              critical={inv.current_quantity <= inv.minimum_threshold}
            />
          ))
        ) : [
          <Empty key="empty">No inventory tracked</Empty>
        ]}
      </NotificationStack>

      {/* Messages */}
      <NotificationStack
        header={
          <span className="text-[13px] font-semibold tracking-wide uppercase" style={{ color: "rgba(60, 60, 67, 0.6)" }}>
            Messages{" "}
            <span className="font-normal">
              · {messagesForView.length}
            </span>
          </span>
        }
      >
        {messagesForView.length ? (
          messagesForView.map((convo) => {
            const booking = convo.booking_id ? bookingMap.get(convo.booking_id) : null;
            const rangeLabel = booking
              ? formatDateRange(booking.check_in_at, booking.check_out_at)
              : null;
            const guestLabel =
              booking && booking.guest_count > 0
                ? `${booking.guest_count} guests`
                : null;

            return (
              <Link
                key={convo.id}
                href={`/dashboard/messages/${convo.id}`}
                className="card-press block mx-6 mb-3 px-5 py-4"
                style={glassStyle}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-bold text-[#000000] truncate">
                    {formatBookingTopic(convo.topic)}
                  </p>
                </div>
                <p className="text-xs mt-1" style={{ color: "rgba(60, 60, 67, 0.6)" }}>
                  {rangeLabel
                    ? `${rangeLabel}${guestLabel ? ` · ${guestLabel}` : ""}`
                    : new Date(convo.updated_at).toLocaleDateString()}
                </p>
              </Link>
            );
          })
        ) : [
          <Empty key="empty">
            {filterDate ? "No conversations for this booking" : "No conversations"}
          </Empty>
        ]}
      </NotificationStack>

      {/* Orders */}
      <NotificationStack
        header={
          <span className="text-[13px] font-semibold tracking-wide uppercase" style={{ color: "rgba(60, 60, 67, 0.6)" }}>
            Orders <span className="font-normal">· {orders?.length ?? 0}</span>
          </span>
        }
      >
        {orders?.length ? (
          orders.map((order) => {
            const color = orderStatusColor[order.status] ?? "#8E8E93";
            return (
              <div
                key={order.id}
                className="mx-6 mb-3 px-5 py-4"
                style={glassStyle}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-[#000000]">
                      {new Date(order.order_date).toLocaleDateString()}
                    </p>
                    {order.supplier && (
                      <p className="text-xs mt-0.5" style={{ color: "rgba(60, 60, 67, 0.6)" }}>
                        {order.supplier.full_name}
                      </p>
                    )}
                  </div>
                  <span
                    className="text-xs font-medium px-3 py-1 rounded-full"
                    style={{ color, backgroundColor: `${color}1A` }}
                  >
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </div>
                {order.items?.length > 0 && (
                  <div className="mt-3 pt-3 space-y-1.5" style={{ borderTop: "0.5px solid rgba(0,0,0,0.08)" }}>
                    {order.items.map((line, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-[#000000]">{line.item?.name}</span>
                        <span style={{ color: "rgba(60, 60, 67, 0.6)" }}>
                          {line.quantity_requested} {line.item?.unit}
                          {line.quantity_delivered != null &&
                            line.quantity_delivered > 0 && (
                              <span className="text-[#34C759] ml-2">
                                ✓ {line.quantity_delivered}
                              </span>
                            )}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        ) : [
          <Empty key="empty">No orders</Empty>
        ]}
      </NotificationStack>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-6 mb-3 py-10 text-center" style={glassStyle}>
      <p className="text-[15px]" style={{ color: "rgba(60, 60, 67, 0.6)" }}>{children}</p>
    </div>
  );
}

function StockCard({
  propertyId,
  inv,
  critical,
}: {
  propertyId: string;
  inv: {
    item_id: string;
    current_quantity: number;
    minimum_threshold: number;
    item: { name: string; category: string; unit: string } | null;
  };
  critical?: boolean;
}) {
  const accent = critical ? "#FF3B30" : "#34C759";
  return (
    <div
      className="mx-6 mb-3 flex items-center justify-between px-5 py-4"
      style={glassStyle}
    >
      <div className="flex items-center gap-3">
        <span
          className="shrink-0 self-stretch rounded-full"
          style={{ width: 3, backgroundColor: accent }}
        />
        <div>
          <p className="text-sm font-bold text-[#000000]">{inv.item?.name}</p>
          <p className="text-xs mt-0.5" style={{ color: "rgba(60, 60, 67, 0.6)" }}>{inv.item?.category}</p>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1.5">
        <StockStepper
          propertyId={propertyId}
          itemId={inv.item_id}
          quantity={inv.current_quantity}
          unit={inv.item?.unit ?? "units"}
        />
        <p className="text-xs" style={{ color: "rgba(60, 60, 67, 0.6)" }}>
          min {inv.minimum_threshold} {inv.item?.unit}
        </p>
      </div>
    </div>
  );
}
