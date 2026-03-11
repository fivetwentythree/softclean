"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateStock(
  propertyId: string,
  itemId: string,
  newQuantity: number
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const quantity = Math.max(0, Math.round(newQuantity));

  const { error } = await supabase
    .from("property_inventory")
    .update({
      current_quantity: quantity,
      last_restocked_at: quantity > 0 ? new Date().toISOString() : undefined,
    } as never)
    .eq("property_id", propertyId)
    .eq("item_id", itemId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/inventory");
  revalidatePath("/dashboard/properties");
  revalidatePath("/dashboard");

  return { error: null };
}

export async function addInventoryItem(formData: {
  name: string;
  category: "consumable" | "linen" | "maintenance" | "amenity";
  unit: string;
  initialQuantity: number;
  minimumThreshold: number;
  propertyIds: string[];
}): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: item, error: itemError } = await supabase
    .from("inventory_items")
    .insert({
      name: formData.name,
      category: formData.category,
      unit: formData.unit,
    } as never)
    .select("id")
    .single<{ id: string }>();

  if (itemError || !item) return { error: itemError?.message ?? "Failed to create item" };

  const rows = formData.propertyIds.map((propertyId) => ({
    property_id: propertyId,
    item_id: item.id,
    current_quantity: formData.initialQuantity,
    minimum_threshold: formData.minimumThreshold,
  }));

  const { error: linkError } = await supabase
    .from("property_inventory")
    .insert(rows as never);

  if (linkError) return { error: linkError.message };

  revalidatePath("/dashboard/inventory");
  revalidatePath("/dashboard/properties");
  revalidatePath("/dashboard");

  return { error: null };
}

export async function deleteInventoryItem(
  propertyId: string,
  itemId: string
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("property_inventory")
    .delete()
    .eq("property_id", propertyId)
    .eq("item_id", itemId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/inventory");
  revalidatePath("/dashboard/properties");
  revalidatePath("/dashboard");

  return { error: null };
}
