"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams, useRouter } from "next/navigation";
import { AttachmentSheet } from "./attachment-sheet";

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
  const [conversation, setConversation] = useState<ConversationInfo | null>(
    null
  );
  const [newMessage, setNewMessage] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [showAttachments, setShowAttachments] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
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
        .select(
          "id, body, attachment_url, created_at, sender_id, sender:profiles!messages_sender_id_fkey(full_name)"
        )
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
            .select(
              "id, body, attachment_url, created_at, sender_id, sender:profiles!messages_sender_id_fkey(full_name)"
            )
            .eq("id", payload.new.id)
            .single<Message>();
          if (msg) {
            setMessages((prev) =>
              prev.some((existing) => existing.id === msg.id)
                ? prev
                : [...prev, msg]
            );
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

  const uploadFile = useCallback(
    async (file: File): Promise<string | null> => {
      const ext = file.name.split(".").pop() ?? "bin";
      const path = `messages/${id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

      const { error } = await supabase.storage
        .from("attachments")
        .upload(path, file, { cacheControl: "3600", upsert: false });

      if (error) {
        setSendError(error.message || "Attachment upload failed.");
        return null;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("attachments").getPublicUrl(path);
      return publicUrl;
    },
    [id, supabase]
  );

  async function handleSend(e?: React.FormEvent) {
    e?.preventDefault();
    if ((!newMessage.trim() && pendingFiles.length === 0) || !userId || sending)
      return;

    setSending(true);
    setSendError(null);

    let attachmentUrl: string | null = null;
    if (pendingFiles.length > 0) {
      attachmentUrl = await uploadFile(pendingFiles[0]);
    }

    if (pendingFiles.length > 0 && !attachmentUrl) {
      setSendError("Attachment upload failed. Check your network and try again.");
      setSending(false);
      return;
    }

    const { data: inserted, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: id,
        sender_id: userId,
        body: newMessage.trim() || (attachmentUrl ? "Attachment" : ""),
        attachment_url: attachmentUrl,
      } as never)
      .select(
        "id, body, attachment_url, created_at, sender_id, sender:profiles!messages_sender_id_fkey(full_name)"
      )
      .single<Message>();

    if (error || !inserted) {
      setSendError("Message failed to send. Please try again.");
      setSending(false);
      return;
    }

    setMessages((prev) =>
      prev.some((existing) => existing.id === inserted.id)
        ? prev
        : [...prev, inserted]
    );

    // Trigger push notifications to other participants (fire-and-forget)
    fetch("/api/push/notify-conversation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversationId: id,
        messageBody: inserted.body,
      }),
    }).catch(() => {});

    setNewMessage("");
    setPendingFiles([]);
    setSending(false);
    inputRef.current?.focus();
  }

  const handleFilesSelected = useCallback((files: File[]) => {
    setPendingFiles(files);
    setShowAttachments(false);
  }, []);

  const removePendingFile = useCallback((index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  function formatTime(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function isImageUrl(url: string) {
    return /\.(jpg|jpeg|png|gif|webp|heic|heif)(\?|$)/i.test(url);
  }

  function formatBookingTopic(topic: string) {
    if (!topic.startsWith("Booking ")) return topic;
    return topic.replace(/(\d{4})-(\d{2})-(\d{2})/g, "$1/$2/$3");
  }

  // Group messages by date
  function formatDateHeader(dateStr: string) {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString("en-AU", {
      weekday: "long",
      day: "numeric",
      month: "short",
    });
  }

  let lastDateStr = "";

  return (
    <div
      className="flex flex-col h-[100dvh]"
      style={{
        backgroundColor: "#F2F2F7",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif",
      }}
    >
      {/* iOS 26 style header */}
      <div
        className="relative px-5 pt-3 pb-3 backdrop-blur-2xl"
        style={{
          background: "rgba(242, 242, 247, 0.94)",
          borderBottom: "0.5px solid rgba(0, 0, 0, 0.12)",
        }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard/messages")}
            className="flex items-center gap-1 text-[#007AFF] active:opacity-50 transition-opacity -ml-1"
          >
            <svg
              width="12"
              height="20"
              viewBox="0 0 12 20"
              fill="none"
            >
              <path
                d="M10 2L2 10L10 18"
                stroke="#007AFF"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <div className="flex-1 text-center min-w-0">
            <p className="text-[17px] font-semibold text-[#000000] truncate">
              {conversation?.topic
                ? formatBookingTopic(conversation.topic)
                : "—"}
            </p>
            <p className="text-[12px]" style={{ color: "rgba(60, 60, 67, 0.6)" }}>
              {conversation?.property?.name ?? "General"}
            </p>
          </div>
          <div className="w-8" />
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1" style={{ backgroundColor: "#F2F2F7" }}>
        {messages.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-[15px]" style={{ color: "rgba(60, 60, 67, 0.6)" }}>No messages yet</p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isOwn = msg.sender_id === userId;
            const currentDate = new Date(msg.created_at).toDateString();
            const showDate = currentDate !== lastDateStr;
            lastDateStr = currentDate;

            // Check if next message is from same sender (for grouping)
            const nextMsg = messages[i + 1];
            const isLastInGroup =
              !nextMsg || nextMsg.sender_id !== msg.sender_id;
            const prevMsg = messages[i - 1];
            const isFirstInGroup =
              !prevMsg || prevMsg.sender_id !== msg.sender_id;

            return (
              <div key={msg.id}>
                {showDate && (
                  <div className="text-center py-3">
                    <span className="text-[12px] font-medium rounded-full px-3 py-1" style={{ color: "rgba(60, 60, 67, 0.6)", backgroundColor: "rgba(242, 242, 247, 0.9)", backdropFilter: "blur(20px)" }}>
                      {formatDateHeader(msg.created_at)}
                    </span>
                  </div>
                )}

                <div
                  className={`flex ${isOwn ? "justify-end" : "justify-start"} ${
                    isFirstInGroup && !showDate ? "mt-3" : "mt-0.5"
                  }`}
                >
                  <div
                    className={`max-w-[78%] ${isOwn ? "items-end" : "items-start"} flex flex-col`}
                  >
                    {!isOwn && isFirstInGroup && (
                      <p className="text-[11px] font-medium mb-1 ml-3" style={{ color: "rgba(60, 60, 67, 0.6)" }}>
                        {msg.sender?.full_name ?? "—"}
                      </p>
                    )}

                    {/* Image attachment */}
                    {msg.attachment_url && isImageUrl(msg.attachment_url) && (
                      <a
                        href={msg.attachment_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`block rounded-[20px] overflow-hidden mb-0.5 ${
                          isOwn ? "rounded-br-md" : "rounded-bl-md"
                        }`}
                      >
                        <img
                          src={msg.attachment_url}
                          alt="Attachment"
                          className="max-w-full max-h-64 object-cover"
                        />
                      </a>
                    )}

                    {/* Non-image attachment */}
                    {msg.attachment_url &&
                      !isImageUrl(msg.attachment_url) && (
                        <a
                          href={msg.attachment_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`flex items-center gap-2 px-4 py-2.5 rounded-[18px] mb-0.5 ${
                            isOwn
                              ? "bg-[#007AFF] rounded-br-[6px]"
                              : "bg-[#E5E5EA] rounded-bl-[6px]"
                          }`}
                        >
                          <svg
                            width="18"
                            height="20"
                            viewBox="0 0 18 20"
                            fill="none"
                          >
                            <path
                              d="M11 1H3C2.44772 1 2 1.44772 2 2V18C2 18.5523 2.44772 19 3 19H15C15.5523 19 16 18.5523 16 18V6L11 1Z"
                              stroke={isOwn ? "white" : "#6e6e73"}
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M11 1V6H16"
                              stroke={isOwn ? "white" : "#6e6e73"}
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          <span
                            className={`text-[13px] font-medium ${
                              isOwn ? "text-white" : "text-[#000000]"
                            }`}
                          >
                            View file
                          </span>
                        </a>
                      )}

                    {/* Message bubble */}
                    {msg.body && msg.body !== "Attachment" && (
                      <div
                        className={`relative px-[14px] py-[9px] text-[16px] leading-[21px] ${
                          isOwn
                            ? `bg-[#007AFF] text-white ${
                                 isLastInGroup
                                   ? "rounded-[18px] rounded-br-[5px]"
                                   : "rounded-[18px]"
                               }`
                            : `bg-[#E5E5EA] text-[#000000] ${
                                isLastInGroup
                                  ? "rounded-[18px] rounded-bl-[5px]"
                                  : "rounded-[18px]"
                              }`
                        }`}
                      >
                        {msg.body}
                      </div>
                    )}

                    {isLastInGroup && (
                      <p
                        className={`text-[11px] mt-1 ${
                          isOwn ? "mr-2 text-right" : "ml-2"
                        }`}
                        style={{ color: "rgba(60, 60, 67, 0.6)" }}
                      >
                        {formatTime(msg.created_at)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Pending attachments preview */}
      {pendingFiles.length > 0 && (
        <div className="px-4 py-2 border-t border-[#E5E5EA]/60" style={{ backgroundColor: "rgba(242, 242, 247, 0.94)" }}>
          <div className="flex gap-2 overflow-x-auto">
            {pendingFiles.map((file, i) => (
              <div key={i} className="relative shrink-0">
                {file.type.startsWith("image/") ? (
                  <img
                    src={URL.createObjectURL(file)}
                    alt=""
                    className="w-16 h-16 rounded-2xl object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-[#E9E9EB] flex items-center justify-center">
                    <svg
                      width="20"
                      height="22"
                      viewBox="0 0 18 20"
                      fill="none"
                    >
                      <path
                        d="M11 1H3C2.44772 1 2 1.44772 2 2V18C2 18.5523 2.44772 19 3 19H15C15.5523 19 16 18.5523 16 18V6L11 1Z"
                        stroke="#8e8e93"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                )}
                <button
                  onClick={() => removePendingFile(i)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#FF3B30] flex items-center justify-center"
                >
                  <svg
                    width="8"
                    height="8"
                    viewBox="0 0 8 8"
                    fill="none"
                  >
                    <path
                      d="M1 1L7 7M7 1L1 7"
                      stroke="white"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* iMessage-style compose bar */}
      <div
        className="px-3 py-2 safe-bottom"
        style={{
          background: "rgba(242, 242, 247, 0.94)",
          borderTop: "0.5px solid rgba(0, 0, 0, 0.12)",
          backdropFilter: "blur(20px)",
        }}
      >
        {sendError && (
          <p className="px-2 pb-2 text-xs text-[#FF3B30]">
            {sendError}
          </p>
        )}
        <form
          onSubmit={handleSend}
          className="flex items-end gap-2"
        >
          {/* Attachment button */}
          <button
            type="button"
            onClick={() => setShowAttachments(true)}
            className="flex items-center justify-center w-9 h-9 rounded-full active:bg-[#E9E9EB] transition-colors mb-0.5"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle cx="12" cy="12" r="11" stroke="#007AFF" strokeWidth="1.5" />
              <path
                d="M12 7V17M7 12H17"
                stroke="#007AFF"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>

          {/* Input field */}
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Message"
              className="w-full bg-white border border-[#D1D1D6] rounded-full px-4 py-2 text-[16px] text-[#000000] placeholder-[#8e8e93] focus:outline-none focus:border-[#007AFF] transition-colors"
              style={{ minHeight: 36 }}
            />
          </div>

          {/* Send button */}
          <button
            type="submit"
            disabled={
              (!newMessage.trim() && pendingFiles.length === 0) || sending
            }
            className="flex items-center justify-center w-9 h-9 rounded-full transition-all mb-0.5 disabled:opacity-30"
            style={{ backgroundColor: "#007AFF" }}
          >
            <svg
              width="17"
              height="17"
              viewBox="0 0 17 17"
              fill="none"
            >
              <path
                d="M8.5 14.5V3M8.5 3L3.5 8M8.5 3L13.5 8"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </form>
      </div>

      {/* Attachment sheet */}
      {showAttachments && (
        <AttachmentSheet
          onClose={() => setShowAttachments(false)}
          onFilesSelected={handleFilesSelected}
        />
      )}
    </div>
  );
}
