"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { Heart, Minus, Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";
import type { RsvpContext, RsvpStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const petals = [
  { top: "8%", right: "12%", delay: "0s", size: 18 },
  { top: "18%", left: "10%", delay: "1.2s", size: 14 },
  { top: "72%", right: "8%", delay: "0.6s", size: 16 },
  { top: "64%", left: "14%", delay: "2s", size: 12 },
  { top: "40%", right: "6%", delay: "1.6s", size: 10 },
  { top: "86%", left: "42%", delay: "0.3s", size: 13 },
];

export function RsvpPage({ token }: { token: string }) {
  const [data, setData] = useState<RsvpContext | null>(null);
  const [status, setStatus] = useState<RsvpStatus>("מגיע");
  const [pax, setPax] = useState(1);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const response = await fetch(`/api/rsvp/${token}`);
      if (!response.ok) {
        setMissing(true);
        setLoading(false);
        return;
      }
      const payload = (await response.json()) as RsvpContext;
      setData(payload);
      setStatus(payload.guest.rsvp_status === "לא מגיע" ? "לא מגיע" : "מגיע");
      setPax(payload.guest.confirmed_pax || payload.guest.invited_pax || 1);
      setLoading(false);
    }
    load();
  }, [token]);

  async function submit() {
    setSaving(true);
    const response = await fetch(`/api/rsvp/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, confirmed_pax: pax }),
    });
    setSaving(false);
    if (!response.ok) {
      toast.error("לא הצלחנו לשמור את התשובה. נסו שוב בעדינות.");
      return;
    }
    setDone(true);
  }

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden px-4 py-16">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_420px_at_50%_-10%,rgba(196,165,116,0.28),transparent_60%),radial-gradient(700px_380px_at_80%_110%,rgba(232,213,181,0.4),transparent_55%)]" />
      {petals.map((petal, index) => (
        <Heart
          key={index}
          className="rsvp-float pointer-events-none absolute text-gold/40"
          style={{
            top: petal.top,
            right: petal.right,
            left: petal.left,
            width: petal.size,
            height: petal.size,
            animationDelay: petal.delay,
          }}
          fill="currentColor"
        />
      ))}

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative z-10 text-center"
          >
            <Heart className="rsvp-heart mx-auto size-8 text-gold-dark" fill="currentColor" />
            <p className="mt-4 text-muted-foreground">פותחים את ההזמנה...</p>
          </motion.div>
        ) : missing || !data ? (
          <motion.div
            key="missing"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative z-10 max-w-md rounded-[2rem] border border-gold/20 bg-white/80 p-10 text-center shadow-[0_30px_80px_rgba(58,52,44,0.08)] backdrop-blur-md"
          >
            <h1 className="font-invitation text-3xl">הקישור אינו תקין</h1>
            <p className="mt-3 leading-7 text-muted-foreground">
              ייתכן שההזמנה אינה פעילה יותר. אפשר לפנות לזוג לעדכון.
            </p>
          </motion.div>
        ) : done ? (
          <ThankYou data={data} status={status} />
        ) : (
          <InvitationCard
            data={data}
            status={status}
            pax={pax}
            saving={saving}
            onStatus={setStatus}
            onPax={setPax}
            onSubmit={submit}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function InvitationCard({
  data,
  status,
  pax,
  saving,
  onStatus,
  onPax,
  onSubmit,
}: {
  data: RsvpContext;
  status: RsvpStatus;
  pax: number;
  saving: boolean;
  onStatus: (status: RsvpStatus) => void;
  onPax: (pax: number) => void;
  onSubmit: () => void;
}) {
  const maxPax = Math.max(data.guest.invited_pax, 8);
  const dateLabel = format(new Date(data.event.event_date), "EEEE, d בMMMM yyyy", {
    locale: he,
  });

  return (
    <motion.article
      key="invite"
      initial={{ opacity: 0, y: 28, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="relative z-10 w-full max-w-xl overflow-hidden rounded-[2.2rem] border border-gold/25 bg-white/82 px-6 py-10 text-center shadow-[0_40px_90px_rgba(58,52,44,0.12)] backdrop-blur-xl md:px-12 md:py-14"
    >
      <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-l from-transparent via-gold to-transparent" />
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="flex items-center justify-center gap-2 text-xs tracking-[0.35em] text-gold-dark"
      >
        <Sparkles className="size-3.5" />
        סנדרין
        <Sparkles className="size-3.5" />
      </motion.p>

      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.28 }}
        className="mt-5 text-sm text-muted-foreground"
      >
        מוזמנים לחגוג איתנו
      </motion.p>

      <motion.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.7 }}
        className="font-invitation mt-3 text-4xl leading-tight md:text-5xl"
      >
        {data.event.groom_name}
        <span className="mx-3 inline-flex align-middle text-gold-dark">
          <Heart className="rsvp-heart size-6 fill-current md:size-7" />
        </span>
        {data.event.bride_name}
      </motion.h1>

      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.7, duration: 0.6 }}
        className="mx-auto mt-6 h-px w-40 origin-center bg-gradient-to-l from-transparent via-gold to-transparent"
      />

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.85 }}
        className="mt-5 text-sm text-muted-foreground"
      >
        {dateLabel}
        <br />
        אולם האירועים סנדרין
      </motion.p>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="mx-auto mt-8 max-w-md text-lg leading-8"
      >
        שלום {data.guest.full_name},
        <br />
        האם נחגוג יחד את הערב הזה?
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.15 }}
        className="mt-8 grid grid-cols-2 gap-3"
      >
        <button
          type="button"
          onClick={() => onStatus("מגיע")}
          className={cn(
            "rounded-2xl border px-4 py-4 text-sm font-medium transition-all",
            status === "מגיע"
              ? "border-gold bg-gold text-white shadow-[0_12px_30px_rgba(166,139,91,0.32)]"
              : "border-border bg-white/70 text-foreground hover:border-gold/50",
          )}
        >
          נגיע בשמחה
        </button>
        <button
          type="button"
          onClick={() => onStatus("לא מגיע")}
          className={cn(
            "rounded-2xl border px-4 py-4 text-sm font-medium transition-all",
            status === "לא מגיע"
              ? "border-danger bg-danger text-white"
              : "border-border bg-white/70 text-foreground hover:border-gold/50",
          )}
        >
          לצערנו לא נוכל
        </button>
      </motion.div>

      <AnimatePresence>
        {status === "מגיע" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <p className="mt-7 text-sm text-muted-foreground">כמה תגיעו בפועל?</p>
            <div className="mt-3 flex items-center justify-center gap-4">
              <button
                type="button"
                className="flex size-11 items-center justify-center rounded-full border border-border bg-white"
                onClick={() => onPax(Math.max(1, pax - 1))}
              >
                <Minus className="size-4" />
              </button>
              <span className="font-invitation min-w-10 text-3xl">{pax}</span>
              <button
                type="button"
                className="flex size-11 items-center justify-center rounded-full border border-border bg-white"
                onClick={() => onPax(Math.min(maxPax, pax + 1))}
              >
                <Plus className="size-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.3 }}
        type="button"
        disabled={saving}
        onClick={onSubmit}
        className="mt-9 w-full rounded-2xl bg-gradient-to-l from-gold to-gold-dark py-4 text-base text-white shadow-[0_16px_40px_rgba(166,139,91,0.35)] transition hover:opacity-95 disabled:opacity-60"
      >
        {saving ? "שומרים באהבה..." : "שליחת אישור מכל הלב"}
      </motion.button>
    </motion.article>
  );
}

function ThankYou({ data, status }: { data: RsvpContext; status: RsvpStatus }) {
  return (
    <motion.div
      key="thanks"
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
      className="relative z-10 w-full max-w-lg rounded-[2.2rem] border border-gold/25 bg-white/85 px-8 py-14 text-center shadow-[0_40px_90px_rgba(58,52,44,0.12)] backdrop-blur-xl"
    >
      <motion.div
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 180, damping: 12 }}
      >
        <Heart className="rsvp-heart mx-auto size-12 text-gold-dark" fill="currentColor" />
      </motion.div>
      <h1 className="font-invitation mt-6 text-4xl">תודה מכל הלב</h1>
      <p className="mt-4 text-lg leading-8 text-muted-foreground">
        {status === "מגיע"
          ? `איזה שמחה, ${data.guest.full_name}. נתראה בחתונה של ${data.event.groom_name} ו${data.event.bride_name} באולם סנדרין.`
          : `${data.guest.full_name}, קיבלנו את התשובה באהבה. נתראה בשמחות הבאות.`}
      </p>
    </motion.div>
  );
}
