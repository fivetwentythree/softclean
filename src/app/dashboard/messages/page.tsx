import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

type Conversation = {
  id: string;
  topic: string;
  status: string;
  property_id: string | null;
  updated_at: string;
  property: { name: string } | null;
};

export default async function MessagesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: conversations } = await supabase
    .from("conversation_participants")
    .select(`
      conversation:conversations(
        id, topic, status, property_id, updated_at,
        property:properties(name)
      )
    `)
    .eq("user_id", user!.id)
    .order("joined_at", { ascending: false })
    .returns<{ conversation: Conversation | null }[]>();

  const convos = conversations
    ?.map((c) => c.conversation)
    .filter((c): c is Conversation => c !== null) ?? [];

  return (
    <div className="bg-white min-h-screen">
      <div className="px-6 py-4">
        <h1 className="text-[20px] font-bold text-[#222222]">
          Messages <span className="font-normal text-[#717171]">· {convos.length}</span>
        </h1>
      </div>

      {!convos.length ? (
        <div className="flex items-center justify-center py-16">
          <p className="text-sm text-[#717171]">No active threads</p>
        </div>
      ) : (
        convos.map((convo) => (
          <Link
            key={convo.id}
            href={`/dashboard/messages/${convo.id}`}
            className="block mx-6 mb-3 px-5 py-4 rounded-xl border border-[#EBEBEB] card-press transition-colors"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-bold text-[#222222] truncate">{convo.topic}</p>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full shrink-0 ${
                  convo.status === "open"
                    ? "bg-[#00A699]/10 text-[#00A699]"
                    : "bg-[#F7F7F7] text-[#717171]"
                }`}
              >
                {convo.status === "open" ? "Open" : "Closed"}
              </span>
            </div>
            <p className="text-xs text-[#717171] mt-1">
              {convo.property?.name ?? "General"}
            </p>
          </Link>
        ))
      )}
    </div>
  );
}
