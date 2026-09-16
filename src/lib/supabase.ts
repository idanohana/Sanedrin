import { createBrowserClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder";

/** לקוח דפדפן סטנדרטי של Supabase */
export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey);

/** לקוח דפדפן עם ניהול סשן ב-cookies — לשימוש בקומפוננטות לקוח */
export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
