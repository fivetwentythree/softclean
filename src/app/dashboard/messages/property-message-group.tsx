"use client";

import Link from "next/link";

type ConversationSummary = {
  id: string;
  topic: string;
  status: string;
  updatedAt: string;
  lastMessageBody: string | null;
  lastMessageSender: string | null;
  lastMessageTime: string | null;
};

type Props = {
  propertyName: string;
  conversations: ConversationSummary[];
};

import { formatBookingTopic } from "@/lib/format-topic";

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return new Date(dateStr).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
  });
}

export function PropertyMessageGroup({
  propertyName,
  conversations,
}: Props) {
  return (
    <div className="px-6 pb-6">
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-[13px] font-semibold tracking-wide uppercase" style={{ color: "rgba(60, 60, 67, 0.6)" }}>
            {propertyName}
          </p>
          <p className="text-[12px]" style={{ color: "rgba(60, 60, 67, 0.3)" }}>
            {conversations.length} thread{conversations.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <div className="rounded-[14px] bg-white overflow-hidden" style={{ boxShadow: "0 0 0 0.5px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.06)" }}>
        {conversations.map((convo, idx) => (
          <Link
            key={convo.id}
            href={`/dashboard/messages/${convo.id}`}
            className="card-press block px-4 py-3.5"
            style={{
              borderBottom:
                idx === conversations.length - 1
                  ? "none"
                  : "0.5px solid rgba(0,0,0,0.08)",
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-semibold text-[#000000] truncate">
                  {formatBookingTopic(convo.topic)}
                </p>
                {convo.lastMessageBody && (
                  <p className="text-[13px] mt-1 ml-[15px] line-clamp-2 leading-snug" style={{ color: "rgba(60, 60, 67, 0.6)" }}>
                    {convo.lastMessageSender && (
                      <span className="font-medium" style={{ color: "rgba(60, 60, 67, 0.6)" }}>
                        {convo.lastMessageSender}:{" "}
                      </span>
                    )}
                    {convo.lastMessageBody}
                  </p>
                )}
              </div>
              <span className="text-[12px] shrink-0 mt-0.5" style={{ color: "rgba(60, 60, 67, 0.3)" }}>
                {convo.lastMessageTime ? timeAgo(convo.lastMessageTime) : ""}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
