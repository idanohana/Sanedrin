"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarHeart, Phone, Heart } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase";
import { DEFAULT_HALL_TABLES } from "@/lib/constants";
import { isValidIsraeliPhone } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const STEPS = [
  { id: 1, title: "מי מתחתן?", icon: Heart },
  { id: 2, title: "יצירת קשר", icon: Phone },
];

const slide = {
  initial: { opacity: 0, x: 28 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -28 },
};

export function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [groomName, setGroomName] = useState("");
  const [brideName, setBrideName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [groomPhone, setGroomPhone] = useState("");
  const [bridePhone, setBridePhone] = useState("");

  const errors = useMemo(() => {
    const list: string[] = [];
    if (step === 1) {
      if (!groomName.trim()) list.push("נא למלא את שם החתן.");
      if (!brideName.trim()) list.push("נא למלא את שם הכלה.");
      if (!eventDate) list.push("נא לבחור את תאריך החתונה.");
    }
    if (step === 2) {
      if (groomPhone && !isValidIsraeliPhone(groomPhone)) {
        list.push("מספר הטלפון של החתן אינו תקין.");
      }
      if (bridePhone && !isValidIsraeliPhone(bridePhone)) {
        list.push("מספר הטלפון של הכלה אינו תקין.");
      }
    }
    return list;
  }, [step, groomName, brideName, eventDate, groomPhone, bridePhone]);

  async function finish() {
    if (errors.length) {
      toast.error(errors[0]);
      return;
    }

    setSaving(true);
    const supabase = createClient();

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("יש להתחבר לפני שמירת האירוע.");

      const { data: event, error: eventError } = await supabase
        .from("events")
        .insert({
          user_id: user.id,
          groom_name: groomName.trim(),
          bride_name: brideName.trim(),
          event_date: eventDate,
          groom_phone: groomPhone.trim() || null,
          bride_phone: bridePhone.trim() || null,
        })
        .select("*")
        .single();

      if (eventError || !event) throw eventError ?? new Error("שמירת האירוע נכשלה.");

      const { error: tablesError } = await supabase.from("tables").insert(
        DEFAULT_HALL_TABLES.map((table) => ({
          event_id: event.id,
          ...table,
        })),
      );
      if (tablesError) throw tablesError;

      toast.success("האירוע נשמר. אפשר להוסיף מוזמנים בפאנל הניהול.");
      router.replace("/dashboard");
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "שמירת האירוע נכשלה.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  function next() {
    if (errors.length) {
      toast.error(errors[0]);
      return;
    }
    if (step === 1) {
      setStep(2);
      return;
    }
    finish();
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8 text-center">
        <p className="mb-2 text-sm text-gold-dark">תהליך היכרות רגוע</p>
        <h1 className="text-3xl font-semibold md:text-4xl">נתחיל יחד, בקצב שלכם</h1>
      </div>

      <div className="mb-8 flex items-center justify-center gap-2">
        {STEPS.map((item, index) => {
          const Icon = item.icon;
          const active = step === item.id;
          const done = step > item.id;
          return (
            <div key={item.id} className="flex items-center gap-2">
              <div
                className={`flex items-center gap-2 rounded-2xl px-3 py-2 text-sm ${
                  active || done ? "bg-gold/15 text-gold-dark" : "bg-white/60 text-muted-foreground"
                }`}
              >
                <Icon className="size-4" />
                <span className="hidden sm:inline">{item.title}</span>
                <span className="sm:hidden">{item.id}</span>
              </div>
              {index < STEPS.length - 1 && (
                <div className={`h-px w-6 sm:w-10 ${done ? "bg-gold" : "bg-border"}`} />
              )}
            </div>
          );
        })}
      </div>

      <div className="card-premium overflow-hidden p-6 md:p-8">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step-1" {...slide} transition={{ duration: 0.35 }}>
              <div className="mb-6 flex items-start gap-3">
                <CalendarHeart className="mt-1 size-5 text-gold-dark" />
                <div>
                  <h2 className="text-2xl font-semibold">מי מתחתן?</h2>
                  <p className="mt-2 max-w-xl leading-7 text-muted-foreground">
                    מזל טוב! בואו נתחיל לתכנן את האירוע שלכם בסנדרין ברוגע ובקלות.
                  </p>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="groom">שם החתן</Label>
                  <Input
                    id="groom"
                    value={groomName}
                    onChange={(e) => setGroomName(e.target.value)}
                    placeholder="למשל: יונתן"
                  />
                </div>
                <div>
                  <Label htmlFor="bride">שם הכלה</Label>
                  <Input
                    id="bride"
                    value={brideName}
                    onChange={(e) => setBrideName(e.target.value)}
                    placeholder="למשל: נועה"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="date">תאריך החתונה</Label>
                  <Input
                    id="date"
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step-2" {...slide} transition={{ duration: 0.35 }}>
              <h2 className="text-2xl font-semibold">יצירת קשר ותיאום</h2>
              <p className="mt-2 mb-6 max-w-xl leading-7 text-muted-foreground">
                המספרים האלה ישמשו לעדכונים ותיאום מול האולם. את רשימת המוזמנים
                תוכלו להוסיף אחר כך בפאנל הניהול של החתונה.
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="groom-phone">טלפון החתן</Label>
                  <Input
                    id="groom-phone"
                    inputMode="tel"
                    value={groomPhone}
                    onChange={(e) => setGroomPhone(e.target.value)}
                    placeholder="050-0000000"
                    dir="ltr"
                    className="text-left"
                  />
                </div>
                <div>
                  <Label htmlFor="bride-phone">טלפון הכלה</Label>
                  <Input
                    id="bride-phone"
                    inputMode="tel"
                    value={bridePhone}
                    onChange={(e) => setBridePhone(e.target.value)}
                    placeholder="050-0000000"
                    dir="ltr"
                    className="text-left"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-8 flex items-center justify-between">
          <Button variant="ghost" disabled={step === 1 || saving} onClick={() => setStep(1)}>
            חזרה
          </Button>
          {step < 2 ? (
            <Button variant="gold" onClick={next}>
              המשך ברוגע
            </Button>
          ) : (
            <Button variant="gold" onClick={finish} disabled={saving}>
              {saving ? "שומרים את האירוע..." : "סיום ושמירה"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
