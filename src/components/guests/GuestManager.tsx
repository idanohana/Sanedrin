"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { ExternalLink, Link2, MessageSquare, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase";
import { getCurrentEvent } from "@/lib/events";
import { GUEST_SIDES, SUGGESTED_GROUPS } from "@/lib/constants";
import type { EventRecord, GuestRecord, GuestSide, RsvpStatus } from "@/lib/types";
import { getRsvpUrl, isValidIsraeliPhone } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const emptyForm = {
  full_name: "",
  phone_number: "",
  side: "משותף" as GuestSide,
  group_tag: "כללי",
  invited_pax: 1,
};

export function GuestManager() {
  const [event, setEvent] = useState<EventRecord | null>(null);
  const [guests, setGuests] = useState<GuestRecord[]>([]);
  const [query, setQuery] = useState("");
  const [sideFilter, setSideFilter] = useState<string>("הכול");
  const [statusFilter, setStatusFilter] = useState<string>("הכול");
  const [form, setForm] = useState(emptyForm);
  const [sending, setSending] = useState(false);

  async function load() {
    const current = await getCurrentEvent();
    setEvent(current);
    if (!current) return;
    const supabase = createClient();
    const { data, error } = await supabase
      .from("guests")
      .select("*")
      .eq("event_id", current.id)
      .order("created_at", { ascending: true });
    if (error) toast.error("טעינת המוזמנים נכשלה.");
    setGuests((data as GuestRecord[]) ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    return guests.filter((guest) => {
      const matchesQuery =
        !query ||
        guest.full_name.includes(query) ||
        guest.phone_number.includes(query) ||
        guest.group_tag.includes(query);
      const matchesSide = sideFilter === "הכול" || guest.side === sideFilter;
      const matchesStatus = statusFilter === "הכול" || guest.rsvp_status === statusFilter;
      return matchesQuery && matchesSide && matchesStatus;
    });
  }, [guests, query, sideFilter, statusFilter]);

  async function addGuest(submitEvent: FormEvent) {
    submitEvent.preventDefault();
    if (!event) return;
    if (!form.full_name.trim() || !form.phone_number.trim()) {
      toast.error("נא למלא שם וטלפון.");
      return;
    }
    if (!isValidIsraeliPhone(form.phone_number)) {
      toast.error("מספר הטלפון אינו תקין.");
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.from("guests").insert({
      event_id: event.id,
      full_name: form.full_name.trim(),
      phone_number: form.phone_number.trim(),
      side: form.side,
      group_tag: form.group_tag.trim() || "כללי",
      invited_pax: Math.max(1, form.invited_pax),
    });
    if (error) {
      toast.error("הוספת המוזמן נכשלה.");
      return;
    }
    toast.success("המוזמן נוסף לרשימה.");
    setForm(emptyForm);
    load();
  }

  async function removeGuest(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("guests").delete().eq("id", id);
    if (error) {
      toast.error("לא הצלחנו למחוק את המוזמן.");
      return;
    }
    setGuests((current) => current.filter((guest) => guest.id !== id));
  }

  async function sendSms(guestIds: string[]) {
    if (!guestIds.length) {
      toast.error("אין מוזמנים לשליחה.");
      return;
    }
    setSending(true);
    try {
      const response = await fetch("/api/sms/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestIds }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "שליחת ההודעות נכשלה.");
      toast.success(payload.message ?? "ההודעות נשלחו.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "שליחת ההודעות נכשלה.");
    } finally {
      setSending(false);
    }
  }

  function rsvpLink(guest: GuestRecord) {
    return getRsvpUrl(guest.rsvp_token);
  }

  async function copyRsvpLink(guest: GuestRecord) {
    if (!guest.rsvp_token) {
      toast.error("עדיין אין קישור למוזמן הזה.");
      return;
    }
    await navigator.clipboard.writeText(rsvpLink(guest));
    toast.success(`קישור ההזמנה של ${guest.full_name} הועתק.`);
  }

  function statusBadge(status: RsvpStatus) {
    if (status === "מגיע") return <Badge variant="success">מגיע</Badge>;
    if (status === "לא מגיע") return <Badge variant="danger">לא מגיע</Badge>;
    return <Badge variant="gold">טרם ענה</Badge>;
  }

  const pendingIds = guests
    .filter((guest) => guest.rsvp_status === "טרם ענה")
    .map((guest) => guest.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm text-gold-dark">מעקב בזמן אמת</p>
          <h1 className="mt-1 text-3xl font-semibold">ניהול מוזמנים ואישורי הגעה</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" disabled={sending} onClick={() => sendSms(pendingIds)}>
            <MessageSquare className="size-4" />
            שליחת SMS לממתינים
          </Button>
        </div>
      </div>

      <form
        onSubmit={addGuest}
        className="card-premium grid items-end gap-3 p-3 md:grid-cols-[1.2fr_1fr_0.8fr_1fr_0.55fr_auto]"
      >
        <div>
          <Label>שם מלא</Label>
          <Input
            value={form.full_name}
            onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
            placeholder="שם המוזמן"
          />
        </div>
        <div>
          <Label>טלפון</Label>
          <Input
            dir="ltr"
            className="text-left"
            value={form.phone_number}
            onChange={(e) => setForm((f) => ({ ...f, phone_number: e.target.value }))}
            placeholder="050-0000000"
          />
        </div>
        <div>
          <Label>צד</Label>
          <Select
            value={form.side}
            onValueChange={(value) => setForm((f) => ({ ...f, side: value as GuestSide }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {GUEST_SIDES.map((side) => (
                <SelectItem key={side} value={side}>
                  {side}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>קבוצה</Label>
          <Input
            list="guest-groups"
            value={form.group_tag}
            onChange={(e) => setForm((f) => ({ ...f, group_tag: e.target.value }))}
            placeholder="חברים"
          />
          <datalist id="guest-groups">
            {SUGGESTED_GROUPS.map((group) => (
              <option key={group} value={group} />
            ))}
          </datalist>
        </div>
        <div>
          <Label>כמות</Label>
          <Input
            type="number"
            min={1}
            value={form.invited_pax}
            onChange={(e) =>
              setForm((f) => ({ ...f, invited_pax: Number(e.target.value) || 1 }))
            }
          />
        </div>
        <Button type="submit" variant="gold" size="icon" className="mb-0.5 size-11 rounded-full">
          <Plus className="size-4" />
          <span className="sr-only">הוספת מוזמן</span>
        </Button>
      </form>

      <div className="card-premium grid gap-3 p-4 md:grid-cols-4">
        <div className="relative md:col-span-2">
          <Search className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pr-10"
            placeholder="חיפוש לפי שם, טלפון או קבוצה"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Select value={sideFilter} onValueChange={setSideFilter}>
          <SelectTrigger>
            <SelectValue placeholder="צד" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="הכול">כל הצדדים</SelectItem>
            {GUEST_SIDES.map((side) => (
              <SelectItem key={side} value={side}>
                {side}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger>
            <SelectValue placeholder="סטטוס" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="הכול">כל הסטטוסים</SelectItem>
            <SelectItem value="מגיע">מגיע</SelectItem>
            <SelectItem value="לא מגיע">לא מגיע</SelectItem>
            <SelectItem value="טרם ענה">טרם ענה</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-white/80">
        <div className="hidden grid-cols-12 gap-3 border-b border-border bg-muted/70 px-4 py-3 text-xs text-muted-foreground md:grid">
          <span className="col-span-2">שם</span>
          <span className="col-span-2">טלפון</span>
          <span>צד</span>
          <span className="col-span-2">קבוצה</span>
          <span>מוזמנים</span>
          <span>סטטוס</span>
          <span className="col-span-3 text-left">פעולות</span>
        </div>
        {filtered.length === 0 && (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">
            אין מוזמנים להצגה כרגע. אפשר להוסיף את הראשונים בעדינות.
          </p>
        )}
        {filtered.map((guest) => (
          <div
            key={guest.id}
            className="grid gap-2 border-b border-border px-4 py-3 last:border-0 md:grid-cols-12 md:items-center"
          >
            <div className="md:col-span-2">
              <p className="font-medium">{guest.full_name}</p>
              <p className="text-xs text-muted-foreground md:hidden">{guest.phone_number}</p>
            </div>
            <p className="hidden text-sm md:col-span-2 md:block" dir="ltr">
              {guest.phone_number}
            </p>
            <p className="text-sm">{guest.side}</p>
            <p className="text-sm md:col-span-2">{guest.group_tag}</p>
            <p className="text-sm">
              {guest.rsvp_status === "מגיע" ? guest.confirmed_pax : guest.invited_pax}
            </p>
            <div>{statusBadge(guest.rsvp_status)}</div>
            <div className="flex flex-wrap gap-2 md:col-span-3 md:justify-end">
              <Button size="sm" variant="outline" asChild>
                <a href={rsvpLink(guest)} target="_blank" rel="noreferrer">
                  <ExternalLink className="size-3.5" />
                  הזמנה
                </a>
              </Button>
              <Button
                size="icon"
                variant="ghost"
                title="העתקת קישור לאישור הגעה"
                onClick={() => copyRsvpLink(guest)}
              >
                <Link2 className="size-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={sending}
                onClick={() => sendSms([guest.id])}
              >
                SMS
              </Button>
              <Button size="icon" variant="ghost" onClick={() => removeGuest(guest.id)}>
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
