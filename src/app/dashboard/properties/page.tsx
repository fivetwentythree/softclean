import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/types/database";

type Property = Database["public"]["Tables"]["properties"]["Row"];

export default async function PropertiesPage() {
  const supabase = await createClient();

  const { data: properties } = await supabase
    .from("properties")
    .select("*")
    .order("name")
    .returns<Property[]>();

  return (
    <div className="bg-white min-h-screen">
      <div className="px-6 py-4">
        <span className="text-[20px] font-bold text-[#222222]">
          Sites{" "}
          <span className="text-[#717171] font-normal">
            {properties?.length ?? 0}
          </span>
        </span>
      </div>

      {!properties?.length ? (
        <div className="mx-6 mb-3 rounded-xl border border-[#EBEBEB] px-5 py-16 text-center">
          <p className="text-sm text-[#717171]">No sites registered</p>
        </div>
      ) : (
        properties.map((property) => {
          const isActive = property.status === "active";
          const statusColor = isActive ? "#00A699" : "#FFB400";
          const statusBg = isActive
            ? "rgba(0, 166, 153, 0.1)"
            : "rgba(255, 180, 0, 0.1)";

          return (
            <div
              key={property.id}
              className="card-press mx-6 mb-3 rounded-xl border border-[#EBEBEB] px-5 py-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-[#222222]">{property.name}</p>
                  <p className="text-sm text-[#717171] mt-1">
                    {property.address}
                  </p>
                </div>
                <span
                  className="text-xs font-medium rounded-full px-3 py-1"
                  style={{ color: statusColor, backgroundColor: statusBg }}
                >
                  {isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
