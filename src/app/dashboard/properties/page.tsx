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
    <div className="min-h-screen pb-28">
      <div className="px-6 pt-8 pb-4">
        <h1 className="text-[22px] font-bold tracking-tight text-[#000000]">
          Your sites
        </h1>
      </div>

      {!properties?.length ? (
        <div
          className="mx-6 mt-2 rounded-[14px] px-6 py-20 text-center bg-white"
          style={{
            boxShadow: "0 0 0 0.5px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.06)",
          }}
        >
          <p className="text-[15px]" style={{ color: "rgba(60, 60, 67, 0.6)" }}>No sites registered</p>
        </div>
      ) : (
        <div className="px-6 mt-1">
          <div className="rounded-[14px] bg-white overflow-hidden" style={{ boxShadow: "0 0 0 0.5px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.06)" }}>
            {properties.map((property, idx) => {
              return (
                <Link
                  key={property.id}
                  href={`/dashboard/properties/${property.id}`}
                  className="card-press block px-5 py-[14px]"
                  style={{
                    borderBottom:
                      idx === properties.length - 1
                        ? "none"
                        : "0.5px solid rgba(0,0,0,0.08)",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-[17px] font-semibold text-[#000000] leading-snug">
                        {property.name}
                      </p>
                      <p className="text-[15px] mt-0.5" style={{ color: "rgba(60, 60, 67, 0.6)" }}>
                        {property.address}
                      </p>
                    </div>
                    <svg width="8" height="14" viewBox="0 0 8 14" fill="none" className="shrink-0 ml-3">
                      <path d="M1 1L7 7L1 13" stroke="rgba(60,60,67,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
