import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

type Params = { params: Promise<{ token: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { token } = await params;
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("get_rsvp_context", { p_token: token });

  if (error || !data) {
    return NextResponse.json({ error: "קישור האישור אינו תקין." }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request, { params }: Params) {
  const { token } = await params;
  const body = await request.json();
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("submit_rsvp", {
    p_token: token,
    p_status: body.status,
    p_confirmed_pax: Number(body.confirmed_pax ?? 1),
  });

  if (error) {
    return NextResponse.json({ error: "לא הצלחנו לשמור את התשובה." }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
