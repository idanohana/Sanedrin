import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { emailForCode, isValidWeddingCode, passwordForCode } from "@/lib/access-codes";

const attempts = new Map<string, { count: number; resetAt: number }>();

function clientKey(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

function rateLimited(key: string) {
  const now = Date.now();
  const current = attempts.get(key);
  if (!current || current.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + 10 * 60 * 1000 });
    return false;
  }
  current.count += 1;
  return current.count > 8;
}

export async function POST(request: Request) {
  const key = clientKey(request);
  if (rateLimited(key)) {
    return NextResponse.json(
      { error: "יותר מדי ניסיונות. נסו שוב בעוד כמה דקות." },
      { status: 429 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const code = String(body.code ?? "").trim();

  if (!isValidWeddingCode(code)) {
    return NextResponse.json({ error: "קוד החתונה אינו תקין." }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: emailForCode(code),
    password: passwordForCode(code),
  });

  if (error) {
    return NextResponse.json(
      { error: "הקוד לא נמצא. בדקו מול צוות סנדרין." },
      { status: 401 },
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "הכניסה נכשלה. נסו שוב." }, { status: 401 });
  }

  const { data: event } = await supabase
    .from("events")
    .select("id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  return NextResponse.json({ ok: true, hasEvent: Boolean(event) });
}
