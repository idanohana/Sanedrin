import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

const SMS_ENDPOINT = "https://api.sms4free.co.il/ApiSMS/v2/SendSMS";

type Body = {
  guestIds?: string[];
};

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "נדרשת התחברות." }, { status: 401 });
  }

  const body = (await request.json()) as Body;
  const guestIds = body.guestIds ?? [];
  if (!guestIds.length) {
    return NextResponse.json({ error: "לא נבחרו מוזמנים." }, { status: 400 });
  }

  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!event) {
    return NextResponse.json({ error: "לא נמצא אירוע פעיל." }, { status: 404 });
  }

  const { data: guests, error } = await supabase
    .from("guests")
    .select("id, full_name, phone_number, rsvp_token")
    .eq("event_id", event.id)
    .in("id", guestIds);

  if (error || !guests?.length) {
    return NextResponse.json({ error: "לא נמצאו מוזמנים לשליחה." }, { status: 404 });
  }

  const key = process.env.SMS4FREE_KEY;
  const smsUser = process.env.SMS4FREE_USER;
  const pass = process.env.SMS4FREE_PASS;
  const sender = process.env.SMS4FREE_SENDER ?? "Sanedrin";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  if (!key || !smsUser || !pass) {
    return NextResponse.json(
      { error: "חסרים פרטי SMS4FREE בשרת. הוסיפו אותם לקובץ ‎.env.local." },
      { status: 500 },
    );
  }

  const results = [];
  for (const guest of guests) {
    const link = `${appUrl}/rsvp/${guest.rsvp_token}`;
    const msg = `שלום ${guest.full_name}, מוזמנים לחתונה של ${event.groom_name} ו${event.bride_name} באולם סנדרין. נשמח לאישור הגעה: ${link}`;

    const response = await fetch(SMS_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key,
        user: smsUser,
        pass,
        sender,
        recipient: guest.phone_number.replace(/-/g, ""),
        msg,
      }),
    });

    const payload = await response.json().catch(() => ({}));
    results.push({
      guestId: guest.id,
      ok: response.ok && Number(payload.status) > 0,
      status: payload.status,
      message: payload.message,
    });
  }

  const sent = results.filter((item) => item.ok).length;
  return NextResponse.json({
    sent,
    total: results.length,
    message: sent
      ? `נשלחו ${sent} הודעות SMS בהצלחה.`
      : "השליחה הושלמה, אך אף הודעה לא אושרה על ידי SMS4FREE.",
    results,
  });
}
