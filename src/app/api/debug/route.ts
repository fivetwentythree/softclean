import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  const { data: profiles, error: profilesErr } = await supabase
    .from("profiles")
    .select("*")
    .returns<Record<string, unknown>[]>();

  const { data: conversations, error: convosErr } = await supabase
    .from("conversations")
    .select("*")
    .returns<Record<string, unknown>[]>();

  const { data: participants, error: participantsErr } = await supabase
    .from("conversation_participants")
    .select("*")
    .returns<Record<string, unknown>[]>();

  const { data: messages, error: msgsErr } = await supabase
    .from("messages")
    .select("*")
    .returns<Record<string, unknown>[]>();

  return NextResponse.json({
    auth: { user: user?.id ?? null, email: user?.email ?? null, error: authError?.message },
    profiles: { data: profiles, error: profilesErr?.message },
    conversations: { data: conversations, error: convosErr?.message },
    participants: { data: participants, error: participantsErr?.message },
    messages: { data: messages, error: msgsErr?.message },
  }, { status: 200 });
}
