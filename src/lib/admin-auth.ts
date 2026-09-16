import { cookies } from "next/headers";

export const ADMIN_COOKIE = "sanedrin_admin";

export function getAdminPassword() {
  return process.env.ADMIN_PASSWORD || "";
}

export async function isAdminAuthenticated() {
  const cookieStore = await cookies();
  const value = cookieStore.get(ADMIN_COOKIE)?.value;
  const password = getAdminPassword();
  return Boolean(password) && value === adminCookieValue(password);
}

export function adminCookieValue(password: string) {
  return Buffer.from(`sanedrin:${password}`).toString("base64");
}
