import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";

function getWebPush() {
  webpush.setVapidDetails(
    "mailto:" + process.env.VAPID_EMAIL!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );
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
  // Verify the request comes from an authorized source
  const authHeader = request.headers.get("authorization");
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey || authHeader !== `Bearer ${serviceRoleKey}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId, title, body, url, excludeSenderId } = await request.json();

  const supabase = await createClient();

  // Get subscriptions for target user(s)
  let query = supabase
    .from("push_subscriptions")
    .select("id, user_id, endpoint, p256dh, auth");

  if (userId) {
    // Send to specific user
    query = query.eq("user_id", userId);
  }

  const { data: subscriptions } = await query.returns<PushSubscriptionRow[]>();

  if (!subscriptions?.length) {
    return NextResponse.json({ sent: 0 });
  }

  // Filter out the sender's subscriptions if excludeSenderId is set
  const targets = excludeSenderId
    ? subscriptions.filter((s) => s.user_id !== excludeSenderId)
    : subscriptions;

  const payload = JSON.stringify({
    title: title || "SoftClean",
    body: body || "",
    url: url || "/dashboard",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-192x192.png",
  });

  const wp = getWebPush();

  const results = await Promise.allSettled(
    targets.map(async (sub) => {
      try {
        await wp.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload
        );
      } catch (err: unknown) {
        // Remove expired/invalid subscriptions (410 Gone or 404)
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 410 || statusCode === 404) {
          await supabase
            .from("push_subscriptions")
            .delete()
            .eq("id", sub.id);
        }
        throw err;
      }
    })
  );

  const sent = results.filter((r) => r.status === "fulfilled").length;
  return NextResponse.json({ sent, total: targets.length });
}
