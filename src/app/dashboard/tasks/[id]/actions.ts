"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Database } from "@/lib/types/database";

type TaskUpdate = Database["public"]["Tables"]["cleaning_tasks"]["Update"];

export async function updateTaskStatus(
  taskId: string,
  newStatus: string
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  const updates: TaskUpdate = {
    status: newStatus as TaskUpdate["status"],
  };

  if (newStatus === "in_progress") {
    updates.started_at = new Date().toISOString();
  }
  if (newStatus === "completed") {
    updates.completed_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("cleaning_tasks")
    .update(updates as never)
    .eq("id", taskId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/tasks/[id]");
  revalidatePath("/dashboard");

  return { error: null };
}
