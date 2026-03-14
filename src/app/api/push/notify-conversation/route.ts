import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

function getWebPush() {
  const email = process.env.VAPID_EMAIL;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;

  if (!email || !publicKey || !privateKey) {
    throw new Error("Missing VAPID configuration.");
  }

  webpush.setVapidDetails(`mailto:${email}`, publicKey, privateKey);
  return webpush;
}

type PushSubscriptionRow = {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }

  const { conversationId, messageBody } = await request.json();

  if (!conversationId) {
    return NextResponse.json({ error: "Missing conversationId" }, { status: 400 });
  }

  // Get conversation details
  const { data: convo } = await supabase
    .from("conversations")
    .select("id, topic, property_id")
    .eq("id", conversationId)
    .single<{ id: string; topic: string; property_id: string | null }>();

  if (!convo) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  // Get sender's profile
  const { data: senderProfile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single<{ full_name: string }>();

  // Get all participants + cleaners with access to this property
  const { data: participants } = await supabase
    .from("conversation_participants")
    .select("user_id")
    .eq("conversation_id", conversationId)
    .returns<{ user_id: string }[]>();

  // Also get cleaners who have tasks for this property (they have RLS access)
  const { data: cleanerTasks } = convo.property_id
    ? await supabase
        .from("cleaning_tasks")
        .select("cleaner_id")
        .eq("property_id", convo.property_id)
        .not("cleaner_id", "is", null)
        .returns<{ cleaner_id: string }[]>()
    : { data: [] as { cleaner_id: string }[] };

  // Collect all unique recipient user IDs (excluding sender)
  const recipientIds = new Set<string>();
  participants?.forEach((p) => {
    if (p.user_id !== user.id) recipientIds.add(p.user_id);
  });
  cleanerTasks?.forEach((t) => {
    if (t.cleaner_id && t.cleaner_id !== user.id) recipientIds.add(t.cleaner_id);
  });

  // Also notify managers (they have full access)
  const { data: managers } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "manager")
    .returns<{ id: string }[]>();

  managers?.forEach((m) => {
    if (m.id !== user.id) recipientIds.add(m.id);
  });

  if (recipientIds.size === 0) {
    return NextResponse.json({ sent: 0 });
  }

  // Get push subscriptions for all recipients
  const { data: subscriptions, error: subscriptionsError } = await admin
    .from("push_subscriptions")
    .select("id, user_id, endpoint, p256dh, auth")
    .in("user_id", [...recipientIds])
    .returns<PushSubscriptionRow[]>();

  if (subscriptionsError) {
    return NextResponse.json({ error: subscriptionsError.message }, { status: 500 });
  }

  if (!subscriptions?.length) {
    return NextResponse.json({ sent: 0 });
  }

  const senderName = senderProfile?.full_name ?? "Someone";
  const truncatedBody =
    messageBody && messageBody.length > 100
      ? messageBody.slice(0, 100) + "…"
      : messageBody || "Sent an attachment";

  const payload = JSON.stringify({
    title: senderName,
    body: truncatedBody,
    url: `/dashboard/messages/${conversationId}`,
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-192x192.png",
    tag: `msg-${conversationId}`,
  });

  let wp: typeof webpush;
  try {
    wp = getWebPush();
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }

  const results = await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await wp.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload
        );
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 410 || statusCode === 404) {
          await admin
            .from("push_subscriptions")
            .delete()
            .eq("id", sub.id);
        }
        throw err;
      }
    })
  );

  const sent = results.filter((r) => r.status === "fulfilled").length;
  return NextResponse.json({ sent });
}
