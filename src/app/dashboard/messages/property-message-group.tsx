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

const formatBookingTopic = (topic: string) => {
  if (!topic.startsWith("Booking ")) return topic;
  return topic.replace(
    /(\d{4})-(\d{2})-(\d{2})/g,
    "$1/$2/$3"
  );
};

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
          <p className="text-[13px] font-semibold text-[#8e8e93] tracking-wide uppercase">
            {propertyName}
          </p>
          <p className="text-[12px] text-[#AEAEB2]">
            {conversations.length} thread{conversations.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <div className="rounded-[18px] border border-[#EBEBEB] bg-white overflow-hidden">
        {conversations.map((convo, idx) => (
          <Link
            key={convo.id}
            href={`/dashboard/messages/${convo.id}`}
            className="card-press block px-4 py-3.5"
            style={{
              borderBottom:
                idx === conversations.length - 1
                  ? "none"
                  : "0.5px solid rgba(0,0,0,0.06)",
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-semibold text-[#1a1a1a] truncate">
                  {formatBookingTopic(convo.topic)}
                </p>
                {convo.lastMessageBody && (
                  <p className="text-[13px] text-[#8e8e93] mt-1 ml-[15px] line-clamp-2 leading-snug">
                    {convo.lastMessageSender && (
                      <span className="text-[#6e6e73] font-medium">
                        {convo.lastMessageSender}:{" "}
                      </span>
                    )}
                    {convo.lastMessageBody}
                  </p>
                )}
              </div>
              <span className="text-[12px] text-[#8e8e93] shrink-0 mt-0.5">
                {convo.lastMessageTime ? timeAgo(convo.lastMessageTime) : ""}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
