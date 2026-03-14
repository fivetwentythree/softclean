import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";

type PushSubscriptionRow = {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

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

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }

  const body = await request.json().catch(() => ({}));
  const title = typeof body.title === "string" ? body.title : "SoftClean Test";
  const message =
    typeof body.body === "string"
      ? body.body
      : "This is a test push notification.";
  const url = typeof body.url === "string" ? body.url : "/dashboard";

  const { data: subscriptions, error: subscriptionsError } = await admin
    .from("push_subscriptions")
    .select("id, user_id, endpoint, p256dh, auth")
    .eq("user_id", user.id)
    .returns<PushSubscriptionRow[]>();

  if (subscriptionsError) {
    return NextResponse.json(
      { error: subscriptionsError.message },
      { status: 500 }
    );
  }

  if (!subscriptions?.length) {
    return NextResponse.json({ sent: 0, total: 0, reason: "no_subscriptions" });
  }

  let wp: typeof webpush;
  try {
    wp = getWebPush();
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }

  const payload = JSON.stringify({
    title,
    body: message,
    url,
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-192x192.png",
    tag: "softclean-test",
  });

  let cleaned = 0;
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
        return { ok: true };
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 410 || statusCode === 404) {
          await admin.from("push_subscriptions").delete().eq("id", sub.id);
          cleaned += 1;
        }
        return {
          ok: false,
          endpoint: sub.endpoint,
          statusCode: statusCode ?? null,
          message:
            err instanceof Error ? err.message : "Unknown push error.",
        };
      }
    })
  );

  const sent = results.filter(
    (r) => r.status === "fulfilled" && r.value.ok
  ).length;
  const failures = results
    .filter((r) => r.status === "fulfilled" && !r.value.ok)
    .map((r) => (r as PromiseFulfilledResult<{
      ok: false;
      endpoint: string;
      statusCode: number | null;
      message: string;
    }>).value);

  return NextResponse.json({
    sent,
    total: subscriptions.length,
    cleaned,
    failures,
  });
}
