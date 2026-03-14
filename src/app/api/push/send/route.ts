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
  // Verify the request comes from an authorized source
  const authHeader = request.headers.get("authorization");
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    return NextResponse.json(
      { error: "Missing SUPABASE_SERVICE_ROLE_KEY" },
      { status: 500 }
    );
  }

  if (authHeader !== `Bearer ${serviceRoleKey}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId, title, body, url, excludeSenderId } = await request.json();

  let supabase: ReturnType<typeof createAdminClient>;
  try {
    supabase = createAdminClient();
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }

  // Get subscriptions for target user(s)
  let query = supabase
    .from("push_subscriptions")
    .select("id, user_id, endpoint, p256dh, auth");

  if (userId) {
    // Send to specific user
    query = query.eq("user_id", userId);
  }

  const { data: subscriptions, error: subscriptionsError } =
    await query.returns<PushSubscriptionRow[]>();

  if (subscriptionsError) {
    return NextResponse.json(
      { error: subscriptionsError.message },
      { status: 500 }
    );
  }

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

  let wp: typeof webpush;
  try {
    wp = getWebPush();
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }

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
