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
  pending: "#FFB400",
  dispatched: "#717171",
  delivered: "#00A699",
  disputed: "#FF385C",
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
    <div className="bg-white min-h-screen">
      <div className="px-6 py-4">
        <span className="text-[20px] font-bold text-[#222222]">
          Orders{" "}
          <span className="text-[#717171] font-normal">{orders?.length ?? 0}</span>
        </span>
      </div>

      {!orders?.length ? (
        <div className="flex items-center justify-center py-20">
          <p className="text-sm text-[#717171]">No orders</p>
        </div>
      ) : (
        orders.map((order) => {
          const color = statusColor[order.status] ?? "#717171";
          return (
            <div
              key={order.id}
              className="mx-6 mb-3 rounded-xl border border-[#EBEBEB] px-5 py-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-[#222222]">
                    {order.property?.name}
                  </p>
                  <p className="text-xs text-[#717171] mt-0.5">
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
                <div className="mt-3 pt-3 border-t border-[#EBEBEB] space-y-1.5">
                  {order.items.map((line, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-[#222222]">{line.item?.name}</span>
                      <span className="text-[#717171]">
                        {line.quantity_requested} {line.item?.unit}
                        {line.quantity_delivered != null &&
                          line.quantity_delivered > 0 && (
                            <span className="text-[#00A699] ml-2">
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
