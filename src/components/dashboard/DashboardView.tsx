"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { HeartHandshake, MessageCircle, Sparkles, Users } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase";
import { getCurrentEvent } from "@/lib/events";
import type { EventRecord, GuestRecord } from "@/lib/types";
import { guestSeatCount } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function DashboardView() {
  const [event, setEvent] = useState<EventRecord | null>(null);
  const [guests, setGuests] = useState<GuestRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const current = await getCurrentEvent();
      setEvent(current);
      if (!current) {
        setLoading(false);
        return;
      }
      const supabase = createClient();
      const { data, error } = await supabase
        .from("guests")
        .select("*")
        .eq("event_id", current.id)
        .order("created_at", { ascending: true });
      if (error) toast.error("לא הצלחנו לטעון את רשימת המוזמנים.");
      setGuests((data as GuestRecord[]) ?? []);
      setLoading(false);
    }
    load();
  }, []);

  const stats = useMemo(() => {
    const invited = guests.reduce((sum, guest) => sum + guest.invited_pax, 0);
    const coming = guests
      .filter((guest) => guest.rsvp_status === "מגיע")
      .reduce((sum, guest) => sum + guestSeatCount(guest), 0);
    const declined = guests.filter((guest) => guest.rsvp_status === "לא מגיע").length;
    const pending = guests.filter((guest) => guest.rsvp_status === "טרם ענה").length;
    return { invited, coming, declined, pending, total: guests.length };
  }, [guests]);

  if (loading) {
    return <p className="text-muted-foreground">טוענים את האירוע ברוגע...</p>;
  }

  if (!event) return null;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-gold-dark">האירוע שלכם בסנדרין</p>
        <h1 className="mt-1 text-3xl font-semibold md:text-4xl">
          {event.groom_name} ו{event.bride_name}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {format(new Date(event.event_date), "EEEE, d בMMMM yyyy", { locale: he })}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="סה״כ מוזמנים"
          value={stats.invited}
          hint={`${stats.total} רשומות ברשימה`}
          icon={<Users className="size-5" />}
        />
        <StatCard
          title="אישרו הגעה"
          value={stats.coming}
          hint="מקומות מאושרים"
          tone="success"
          icon={<HeartHandshake className="size-5" />}
        />
        <StatCard
          title="לא מגיעים"
          value={stats.declined}
          hint="רשומות שסימנו לא מגיע"
          tone="danger"
          icon={<MessageCircle className="size-5" />}
        />
        <StatCard
          title="ממתינים לתשובה"
          value={stats.pending}
          hint="עדיין לא ענו ל-SMS"
          tone="waiting"
          icon={<Sparkles className="size-5" />}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-semibold">רשימת המוזמנים</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              הוספת שמות, קבוצות, שליחת SMS ומעקב אחרי אישורי הגעה — הכול בפאנל המוזמנים.
            </p>
          </div>
          <Button asChild variant="gold" className="mt-6 w-fit">
            <Link href="/guests">לניהול המוזמנים</Link>
          </Button>
        </Card>
        <Card className="flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-semibold">מפת ההושבה</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              סידור שולחנות באולם סנדרין בתצוגת 2D רגועה, עם מעבר לתצוגת 3D של האולם.
            </p>
          </div>
          <Button asChild variant="outline" className="mt-6 w-fit">
            <Link href="/seating">למפת ההושבה</Link>
          </Button>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  hint,
  icon,
  tone = "gold",
}: {
  title: string;
  value: number;
  hint: string;
  icon: ReactNode;
  tone?: "gold" | "success" | "danger" | "waiting";
}) {
  const tones = {
    gold: "text-gold-dark bg-gold/12",
    success: "text-success bg-[#e7f0e4]",
    danger: "text-danger bg-[#f6e6e6]",
    waiting: "text-gold-dark bg-gold-light/50",
  };

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-2 text-3xl font-semibold">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
        </div>
        <span className={`rounded-xl p-2.5 ${tones[tone]}`}>{icon}</span>
      </div>
    </Card>
  );
}
