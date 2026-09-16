"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase";
import { isSupabaseConfigured } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AuthPanel() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();

    if (!isSupabaseConfigured()) {
      toast.error("חסרים פרטי חיבור ל-Supabase בקובץ ‎.env.local");
      return;
    }

    if (!email || password.length < 6) {
      toast.error("נא למלא אימייל וסיסמה בת שישה תווים לפחות.");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        toast.success("נרשמתם בהצלחה. אם נדרש אישור במייל — בדקו את תיבת הדואר.");
        router.replace("/onboarding");
        router.refresh();
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/onboarding");
        return;
      }

      const { data: event } = await supabase
        .from("events")
        .select("id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

      router.replace(event ? "/dashboard" : "/onboarding");
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "משהו השתבש";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: "easeOut" }}
      className="card-premium w-full max-w-md p-8"
    >
      <div className="mb-6 flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-2xl bg-gold/15 text-gold-dark">
          <Heart className="size-5 fill-current" />
        </span>
        <div>
          <p className="text-sm text-gold-dark">ברוכים הבאים לסנדרין</p>
          <h2 className="text-2xl font-semibold">
            {mode === "login" ? "כניסה לחשבון" : "יצירת חשבון חדש"}
          </h2>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <Label htmlFor="email">אימייל</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            dir="ltr"
            className="text-left"
          />
        </div>
        <div>
          <Label htmlFor="password">סיסמה</Label>
          <Input
            id="password"
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="לפחות 6 תווים"
          />
        </div>
        <Button type="submit" variant="gold" className="w-full" disabled={loading}>
          {loading ? "רגע אחד..." : mode === "login" ? "כניסה רגועה" : "הרשמה והתחלה"}
        </Button>
      </form>

      <button
        type="button"
        className="mt-5 w-full text-sm text-muted-foreground hover:text-foreground"
        onClick={() => setMode(mode === "login" ? "signup" : "login")}
      >
        {mode === "login" ? "עוד אין לכם חשבון? הרשמה קצרה" : "כבר יש חשבון? כניסה"}
      </button>
    </motion.div>
  );
}
