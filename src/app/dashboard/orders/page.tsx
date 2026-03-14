import { createClient } from "@/lib/supabase/server";

type OrderRow = {
  id: string;
  property: { name: string } | null;
  supplier: { full_name: string } | null;
  status: string;
  order_date: string;
  items: {
    quantity_requested: number;
    quantity_delivered: number | null;
    item: { name: string; unit: string } | null;
  }[];
};

const statusColor: Record<string, string> = {
  pending: "#FF9500",
  dispatched: "#8E8E93",
  delivered: "#34C759",
  disputed: "#FF3B30",
};

export default async function OrdersPage() {
  const supabase = await createClient();

  const { data: orders } = await supabase
    .from("supply_orders")
    .select(`
      *,
      property:properties(name),
      supplier:profiles!supply_orders_supplier_id_fkey(full_name),
      items:order_line_items(
        quantity_requested,
        quantity_delivered,
        item:inventory_items(name, unit)
      )
    `)
    .order("order_date", { ascending: false })
    .limit(50)
    .returns<OrderRow[]>();

  return (
    <div className="min-h-screen pb-28">
      <div className="px-6 pt-8 pb-4">
        <h1 className="text-[22px] font-bold text-[#000000]">
          Orders{" "}
          <span className="font-normal" style={{ color: "rgba(60, 60, 67, 0.6)" }}>{orders?.length ?? 0}</span>
        </h1>
      </div>

      {!orders?.length ? (
        <div className="flex items-center justify-center py-20">
          <p className="text-[15px]" style={{ color: "rgba(60, 60, 67, 0.6)" }}>No orders</p>
        </div>
      ) : (
        orders.map((order) => {
          const color = statusColor[order.status] ?? "#8E8E93";
          return (
            <div
              key={order.id}
              className="mx-6 mb-3 rounded-[14px] px-5 py-4 bg-white"
              style={{ boxShadow: "0 0 0 0.5px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.06)" }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-[#000000]">
                    {order.property?.name}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "rgba(60, 60, 67, 0.6)" }}>
                    {new Date(order.order_date).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className="text-xs font-medium px-3 py-1 rounded-full"
                  style={{
                    color,
                    backgroundColor: `${color}1A`,
                  }}
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
      )}
    </div>
  );
}
