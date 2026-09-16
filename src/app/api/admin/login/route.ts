import { NextResponse } from "next/server";
import { ADMIN_COOKIE, adminCookieValue, getAdminPassword } from "@/lib/admin-auth";

export async function POST(request: Request) {
  const password = getAdminPassword();
  if (!password) {
    return NextResponse.json({ error: "חסרה סיסמת מנהל בשרת." }, { status: 500 });
  }

  const body = await request.json().catch(() => ({}));
  if (String(body.password ?? "") !== password) {
    return NextResponse.json({ error: "סיסמת המנהל אינה נכונה." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, adminCookieValue(password), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(ADMIN_COOKIE);
  return response;
}
