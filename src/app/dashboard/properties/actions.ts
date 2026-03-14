"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createProperty(formData: {
  name: string;
  address: string;
  access_instructions: string;
  status: "active" | "maintenance" | "inactive";
}): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single<{ role: string }>();

  if (profile?.role !== "manager") return { error: "Only managers can add properties" };

  const { error } = await supabase.from("properties").insert({
    name: formData.name,
    address: formData.address,
    access_instructions: formData.access_instructions || null,
    status: formData.status,
  } as never);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/properties");
  revalidatePath("/dashboard");

  return { error: null };
}

export async function updateProperty(
  id: string,
  formData: {
    name: string;
    address: string;
    access_instructions: string;
    status: "active" | "maintenance" | "inactive";
  }
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single<{ role: string }>();

  if (profile?.role !== "manager") return { error: "Only managers can edit properties" };

  const { error } = await supabase
    .from("properties")
    .update({
      name: formData.name,
      address: formData.address,
      access_instructions: formData.access_instructions || null,
      status: formData.status,
    } as never)
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/properties");
  revalidatePath(`/dashboard/properties/${id}`);
  revalidatePath("/dashboard");

  return { error: null };
}

export async function deleteProperty(
  id: string
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single<{ role: string }>();

  if (profile?.role !== "manager") return { error: "Only managers can delete properties" };

  const { error } = await supabase
    .from("properties")
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/properties");
  revalidatePath("/dashboard");

  return { error: null };
}
