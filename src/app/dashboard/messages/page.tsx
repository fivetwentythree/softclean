import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { PropertyMessageGroup } from "./property-message-group";

type Conversation = {
  id: string;
  topic: string;
  status: string;
  property_id: string | null;
  updated_at: string;
  property: { name: string } | null;
};

type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

type SenderProfile = {
  id: string;
  full_name: string;
};

export default async function MessagesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: convos } = await supabase
    .from("conversations")
    .select(
      "id, topic, status, property_id, updated_at, property:properties(name)"
    )
    .order("updated_at", { ascending: false })
    .returns<Conversation[]>();

  const conversations = convos ?? [];

  // Fetch latest message for each conversation
  const convoIds = conversations.map((c) => c.id);

  const { data: latestMessages } = convoIds.length
    ? await supabase
        .from("messages")
        .select("id, conversation_id, sender_id, body, created_at")
        .in("conversation_id", convoIds)
        .order("created_at", { ascending: false })
        .returns<Message[]>()
    : { data: [] as Message[] };

  // Build a map: conversation_id -> latest message
  const latestMessageMap = new Map<string, Message>();
  for (const msg of latestMessages ?? []) {
    if (!latestMessageMap.has(msg.conversation_id)) {
      latestMessageMap.set(msg.conversation_id, msg);
    }
  }

  // Fetch sender profiles for the latest messages
  const senderIds = [
    ...new Set(
      Array.from(latestMessageMap.values()).map((m) => m.sender_id)
    ),
  ];

  const { data: profiles } = senderIds.length
    ? await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", senderIds)
        .returns<SenderProfile[]>()
    : { data: [] as SenderProfile[] };

  const profileMap = new Map(
    (profiles ?? []).map((p) => [p.id, p.full_name])
  );

  // Group by property, keeping only the latest conversation per property
  const propertyMap = new Map<
    string,
    {
      propertyName: string;
      conversations: {
        id: string;
        topic: string;
        status: string;
        updatedAt: string;
        lastMessageBody: string | null;
        lastMessageSender: string | null;
        lastMessageTime: string | null;
      }[];
    }
  >();

  // Sort conversations by updated_at descending
  const sorted = [...conversations].sort(
    (a, b) =>
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );

  for (const convo of sorted) {
    const key = convo.property_id ?? "__general__";
    const propName = convo.property?.name ?? "General";

    if (!propertyMap.has(key)) {
      propertyMap.set(key, { propertyName: propName, conversations: [] });
    }

    const latestMsg = latestMessageMap.get(convo.id);

    propertyMap.get(key)!.conversations.push({
      id: convo.id,
      topic: convo.topic,
      status: convo.status,
      updatedAt: convo.updated_at,
      lastMessageBody: latestMsg?.body ?? null,
      lastMessageSender: latestMsg
        ? (profileMap.get(latestMsg.sender_id) ?? "Unknown")
        : null,
      lastMessageTime: latestMsg?.created_at ?? null,
    });
  }

  const propertyGroups = Array.from(propertyMap.entries());

  return (
    <div className="min-h-screen pb-28">
      <div className="px-6 pt-8 pb-4">
        <h1 className="text-[22px] font-bold tracking-tight text-[#000000]">
          Messages
        </h1>
      </div>

      {!conversations.length ? (
        <div className="px-6 py-16 text-center">
          <p className="text-[15px]" style={{ color: "rgba(60, 60, 67, 0.6)" }}>No threads</p>
        </div>
      ) : (
        <div className="space-y-6">
          {propertyGroups.map(
            ([propertyId, { propertyName, conversations }]) => (
              <PropertyMessageGroup
                key={propertyId}
                propertyName={propertyName}
                conversations={conversations}
              />
            )
          )}
        </div>
      )}
    </div>
  );
}
