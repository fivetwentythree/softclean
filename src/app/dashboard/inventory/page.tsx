import { createClient } from "@/lib/supabase/server";

type InventoryRow = {
  property_id: string;
  item_id: string;
  current_quantity: number;
  minimum_threshold: number;
  property: { name: string } | null;
  item: { name: string; category: string; unit: string } | null;
};

export default async function InventoryPage() {
  const supabase = await createClient();

  const { data: inventory } = await supabase
    .from("property_inventory")
    .select(`
      *,
      property:properties(name),
      item:inventory_items(name, category, unit)
    `)
    .order("current_quantity", { ascending: true })
    .returns<InventoryRow[]>();

  const critical = inventory?.filter((i) => i.current_quantity <= i.minimum_threshold) ?? [];
  const ok = inventory?.filter((i) => i.current_quantity > i.minimum_threshold) ?? [];

  return (
    <div className="bg-white min-h-screen">
      {critical.length > 0 && (
        <>
          <div className="px-6 pt-6 pb-2">
            <span className="text-sm font-bold text-[#FF385C]">
              Critical · {critical.length}
            </span>
          </div>
          {critical.map((inv) => (
            <div
              key={`${inv.property_id}-${inv.item_id}`}
              className="mx-6 mb-3 rounded-xl border-l-4 border-[#FF385C] bg-[#FFF0F0] px-5 py-4 flex items-center justify-between"
            >
              <div>
                <p className="text-sm font-bold text-[#222]">{inv.item?.name}</p>
                <p className="text-xs text-[#717171] mt-0.5">
                  {inv.property?.name} · {inv.item?.category}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-[#FF385C]">
                  {inv.current_quantity}
                </p>
                <p className="text-xs text-[#717171]">
                  min {inv.minimum_threshold} {inv.item?.unit}
                </p>
              </div>
            </div>
          ))}
        </>
      )}

      {ok.length > 0 && (
        <>
          <div className="px-6 pt-6 pb-2">
            <span className="text-sm font-medium text-[#717171]">
              In stock · {ok.length}
            </span>
          </div>
          {ok.map((inv) => (
            <div
              key={`${inv.property_id}-${inv.item_id}`}
              className="mx-6 mb-3 rounded-xl border border-[#EBEBEB] px-5 py-4 flex items-center justify-between"
            >
              <div>
                <p className="text-sm font-medium text-[#222]">{inv.item?.name}</p>
                <p className="text-xs text-[#717171] mt-0.5">
                  {inv.property?.name}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-[#222]">
                  {inv.current_quantity} {inv.item?.unit}
                </p>
              </div>
            </div>
          ))}
        </>
      )}

      {!inventory?.length && (
        <div className="px-6 py-16 text-center">
          <p className="text-sm text-[#717171]">No inventory tracked</p>
        </div>
      )}
    </div>
  );
}
