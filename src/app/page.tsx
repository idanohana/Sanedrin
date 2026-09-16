"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CodeEntry } from "@/components/auth/CodeEntry";
import { createClient } from "@/lib/supabase";
import { isSupabaseConfigured } from "@/lib/utils";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data: event } = await supabase
        .from("events")
        .select("id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();
      router.replace(event ? "/dashboard" : "/onboarding");
    });
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-16">
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mb-10 text-sm text-muted-foreground"
      >
        אולם האירועים · תכנון החתונה ברוגע
      </motion.p>
      <CodeEntry />
    </div>
  );
}
