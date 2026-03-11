import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
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
    <div className="bg-white min-h-screen pb-28">
      <div className="px-6 pt-8 pb-4">
        <h1 className="text-[32px] font-bold tracking-tight text-[#1a1a1a]">
          Your sites
        </h1>
      </div>

      {!properties?.length ? (
        <div
          className="mx-6 mt-2 rounded-[22px] px-6 py-20 text-center backdrop-blur-2xl"
          style={{
            background: "rgba(255, 255, 255, 0.55)",
            boxShadow:
              "0 0 0 0.5px rgba(255,255,255,0.6) inset, 0 2px 12px rgba(0,0,0,0.06), 0 0.5px 1px rgba(0,0,0,0.04)",
          }}
        >
          <p className="text-[15px] text-[#8e8e93]">No sites registered</p>
        </div>
      ) : (
        <div className="px-6 mt-1 space-y-3">
          {properties.map((property) => {
            return (
              <Link
                key={property.id}
                href={`/dashboard/properties/${property.id}`}
                className="card-press block rounded-[22px] px-5 py-[18px] backdrop-blur-2xl"
                style={{
                  background: "rgba(255, 255, 255, 0.55)",
                  boxShadow:
                    "0 0 0 0.5px rgba(255,255,255,0.6) inset, 0 2px 12px rgba(0,0,0,0.06), 0 0.5px 1px rgba(0,0,0,0.04)",
                }}
              >
                <div className="flex items-start">
                  <div className="min-w-0 flex-1">
                    <p className="text-[17px] font-semibold text-[#1a1a1a] leading-snug">
                      {property.name}
                    </p>
                    <p className="text-[15px] text-[#6e6e73] mt-0.5">
                      {property.address}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
