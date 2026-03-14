import { createClient } from "@/lib/supabase/server";
import { PropertyStockGroup } from "./property-stock-group";
import { AddItemButton } from "./add-item-modal";
import type { Database } from "@/lib/types/database";

type InventoryRow = {
  property_id: string;
  item_id: string;
  current_quantity: number;
  minimum_threshold: number;
  property: { name: string } | null;
  item: { name: string; category: string; unit: string } | null;
};

type Property = Database["public"]["Tables"]["properties"]["Row"];

export default async function InventoryPage() {
  const supabase = await createClient();

  const [{ data: inventory }, { data: allProperties }] = await Promise.all([
    supabase
      .from("property_inventory")
      .select(`
        *,
        property:properties(name),
        item:inventory_items(name, category, unit)
      `)
      .order("current_quantity", { ascending: true })
      .returns<InventoryRow[]>(),
    supabase
      .from("properties")
      .select("id, name")
      .order("name")
      .returns<Pick<Property, "id" | "name">[]>(),
  ]);

  const propertyList = (allProperties ?? []).map((p) => ({
    id: p.id,
    name: p.name,
  }));

  const grouped = new Map<
    string,
    { propertyName: string; items: InventoryRow[] }
  >();

  for (const inv of inventory ?? []) {
    const key = inv.property_id;
    if (!grouped.has(key)) {
      grouped.set(key, {
        propertyName: inv.property?.name ?? "Unknown",
        items: [],
      });
    }
    grouped.get(key)!.items.push(inv);
  }

  const properties = Array.from(grouped.entries());

  return (
    <div className="min-h-screen pb-28">
      <div className="px-6 pt-8 pb-4 flex items-center justify-between">
        <h1 className="text-[22px] font-bold tracking-tight text-[#000000]">
          Stock
        </h1>
        <AddItemButton properties={propertyList} />
      </div>

      {!inventory?.length ? (
        <div className="px-6 py-16 text-center">
          <p className="text-[15px]" style={{ color: "rgba(60, 60, 67, 0.6)" }}>No inventory tracked</p>
        </div>
      ) : (
        <div className="space-y-2">
          {properties.map(([propertyId, { propertyName, items }]) => {
            const critical = items.filter(
              (i) => i.current_quantity <= i.minimum_threshold
            );

            return (
              <PropertyStockGroup
                key={propertyId}
                propertyName={propertyName}
                criticalCount={critical.length}
                items={items.map((inv) => ({
                  propertyId: inv.property_id,
                  itemId: inv.item_id,
                  itemName: inv.item?.name ?? "Unknown",
                  category: inv.item?.category ?? "",
                  unit: inv.item?.unit ?? "units",
                  quantity: inv.current_quantity,
                  threshold: inv.minimum_threshold,
                }))}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
