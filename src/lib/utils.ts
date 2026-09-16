import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export function formatIsraeliPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  }
  return value;
}

export function isValidIsraeliPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  return /^0(5\d)\d{7}$/.test(digits);
}

export function guestSeatCount(guest: {
  rsvp_status: string;
  invited_pax: number;
  confirmed_pax: number;
}) {
  if (guest.rsvp_status === "לא מגיע") return 0;
  if (guest.rsvp_status === "מגיע") {
    return Math.max(guest.confirmed_pax, 1);
  }
  return Math.max(guest.invited_pax, 1);
}

export function getRsvpUrl(token: string) {
  const origin =
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof window !== "undefined" ? window.location.origin : "");
  return `${origin}/rsvp/${token}`;
}
