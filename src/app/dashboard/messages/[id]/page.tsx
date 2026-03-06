"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams, useRouter } from "next/navigation";

type Message = {
  id: string;
  body: string;
  attachment_url: string | null;
  created_at: string;
  sender_id: string;
  sender: { full_name: string } | null;
};

type ConversationInfo = {
  id: string;
  topic: string;
  status: string;
  property: { name: string } | null;
};

export default function ConversationPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<ConversationInfo | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data: convo } = await supabase
        .from("conversations")
        .select("id, topic, status, property:properties(name)")
        .eq("id", id)
        .single<ConversationInfo>();
      setConversation(convo);

      const { data: msgs } = await supabase
        .from("messages")
        .select("id, body, attachment_url, created_at, sender_id, sender:profiles!messages_sender_id_fkey(full_name)")
        .eq("conversation_id", id)
        .order("created_at", { ascending: true })
        .returns<Message[]>();
      setMessages(msgs ?? []);
    }
    load();
  }, [id, supabase]);

  useEffect(() => {
    const channel = supabase
      .channel(`messages:${id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${id}`,
        },
        async (payload) => {
          const { data: msg } = await supabase
            .from("messages")
            .select("id, body, attachment_url, created_at, sender_id, sender:profiles!messages_sender_id_fkey(full_name)")
            .eq("id", payload.new.id)
            .single<Message>();
          if (msg) {
            setMessages((prev) => [...prev, msg]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, supabase]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !userId || sending) return;

    setSending(true);
    await supabase.from("messages").insert({
      conversation_id: id,
      sender_id: userId,
      body: newMessage.trim(),
    } as never);
    setNewMessage("");
    setSending(false);
  }

  function formatTime(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] bg-white">
      {/* Thread header */}
      <div className="px-6 py-4 border-b border-[#EBEBEB]">
        <button
          onClick={() => router.push("/dashboard/messages")}
          className="text-sm text-[#717171] hover:text-[#222222] transition-colors mb-2 flex items-center"
        >
          ← Back
        </button>
        <p className="text-sm font-bold text-[#222222] truncate">{conversation?.topic ?? "—"}</p>
        <p className="text-xs text-[#717171]">
          {conversation?.property?.name ?? "General"}
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-[#717171]">No messages yet</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.sender_id === userId;
            return (
              <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] ${isOwn ? "text-right" : ""}`}>
                  {!isOwn && (
                    <p className="text-xs text-[#717171] mb-1">
                      {msg.sender?.full_name ?? "—"}
                    </p>
                  )}
                  <div
                    className={`px-4 py-3 text-sm leading-relaxed ${
                      isOwn
                        ? "bg-[#FF385C] text-white rounded-2xl rounded-br-sm"
                        : "bg-[#F7F7F7] text-[#222222] rounded-2xl rounded-bl-sm"
                    }`}
                  >
                    {msg.body}
                  </div>
                  {msg.attachment_url && (
                    <a
                      href={msg.attachment_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#717171] underline mt-1 inline-block"
                    >
                      Attachment →
                    </a>
                  )}
                  <p className="text-xs text-[#B0B0B0] mt-1">{formatTime(msg.created_at)}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Compose */}
      <form
        onSubmit={handleSend}
        className="flex gap-2 px-6 py-3 border-t border-[#EBEBEB] bg-white"
      >
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Message..."
          className="flex-1 bg-[#F7F7F7] border-none rounded-full px-5 py-3 text-sm text-[#222222] placeholder-[#B0B0B0] focus:outline-none focus:ring-0"
        />
        <button
          type="submit"
          disabled={!newMessage.trim() || sending}
          className="bg-[#FF385C] text-white font-semibold rounded-full px-6 py-3 text-sm disabled:opacity-30 transition-colors"
        >
          Send
        </button>
      </form>
    </div>
  );
}
