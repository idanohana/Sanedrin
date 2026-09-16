import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase-admin";
import { emailForCode, passwordForCode } from "@/lib/access-codes";
import { generateWeddingCode } from "@/lib/generate-code";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "נדרשת כניסת מנהל." }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: tableRows, error: tableError } = await admin
    .from("access_codes")
    .select("id, code, auth_user_id, created_at")
    .order("created_at", { ascending: false });

  let codes = tableRows ?? [];

  if (tableError) {
    const { data: usersData } = await admin.auth.admin.listUsers({ perPage: 1000 });
    codes = (usersData?.users ?? [])
      .filter((user) => user.user_metadata?.role === "couple" && user.user_metadata?.wedding_code)
      .map((user) => ({
        id: user.id,
        code: String(user.user_metadata.wedding_code),
        auth_user_id: user.id,
        created_at: user.created_at,
      }));
  }

  const userIds = codes.map((row) => row.auth_user_id).filter(Boolean) as string[];
  const { data: events } = userIds.length
    ? await admin.from("events").select("id, user_id, groom_name, bride_name, event_date").in("user_id", userIds)
    : { data: [] };

  const eventByUser = new Map((events ?? []).map((event) => [event.user_id, event]));

  return NextResponse.json({
    codes: codes.map((row) => ({
      ...row,
      event: eventByUser.get(row.auth_user_id) ?? null,
    })),
  });
}

export async function POST() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "נדרשת כניסת מנהל." }, { status: 401 });
  }

  const admin = createAdminClient();
  let code = generateWeddingCode();
  let userId = "";

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const { data, error } = await admin.auth.admin.createUser({
      email: emailForCode(code),
      password: passwordForCode(code),
      email_confirm: true,
      user_metadata: {
        role: "couple",
        wedding_code: code,
      },
    });

    if (!error && data.user) {
      userId = data.user.id;
      break;
    }

    code = generateWeddingCode();
  }

  if (!userId) {
    return NextResponse.json({ error: "לא הצלחנו ליצור קוד חדש. נסו שוב." }, { status: 500 });
  }

  const { error: insertError } = await admin.from("access_codes").insert({
    code,
    auth_user_id: userId,
  });

  if (insertError) {
    console.warn("access_codes insert skipped:", insertError.message);
  }

  return NextResponse.json({ code, auth_user_id: userId });
}

export async function DELETE(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "נדרשת כניסת מנהל." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const authUserId = String(body.auth_user_id ?? "").trim();
  const code = String(body.code ?? "").trim();

  if (!authUserId && !code) {
    return NextResponse.json({ error: "לא נבחר קוד למחיקה." }, { status: 400 });
  }

  const admin = createAdminClient();
  let userId = authUserId;

  if (!userId && code) {
    const { data } = await admin
      .from("access_codes")
      .select("auth_user_id")
      .eq("code", code)
      .maybeSingle();
    userId = data?.auth_user_id ?? "";

    if (!userId) {
      const { data: usersData } = await admin.auth.admin.listUsers({ perPage: 1000 });
      userId =
        usersData?.users.find((user) => String(user.user_metadata?.wedding_code) === code)?.id ??
        "";
    }
  }

  if (code) {
    await admin.from("access_codes").delete().eq("code", code);
  }
  if (userId) {
    await admin.from("access_codes").delete().eq("auth_user_id", userId);
    const { error } = await admin.auth.admin.deleteUser(userId);
    if (error) {
      return NextResponse.json({ error: "מחיקת הקוד נכשלה." }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
