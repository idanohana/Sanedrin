"use client";

import { FormEvent, useEffect, useState } from "react";
import { Copy, Heart, LogOut, Plus, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

type AdminCode = {
  id: string;
  code: string;
  auth_user_id: string;
  created_at: string;
  event: {
    id: string;
    groom_name: string;
    bride_name: string;
    event_date: string;
  } | null;
};

export function AdminPanel() {
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [codes, setCodes] = useState<AdminCode[]>([]);
  const [freshCode, setFreshCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function loadCodes() {
    const response = await fetch("/api/admin/codes");
    if (response.status === 401) {
      setAuthed(false);
      setReady(true);
      return;
    }
    const payload = await response.json();
    setCodes(payload.codes ?? []);
    setAuthed(true);
    setReady(true);
  }

  useEffect(() => {
    loadCodes();
  }, []);

  async function login(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "הכניסה נכשלה.");
      setPassword("");
      await loadCodes();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "הכניסה נכשלה.");
    } finally {
      setLoading(false);
    }
  }

  async function createCode() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/codes", { method: "POST" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "יצירת הקוד נכשלה.");
      setFreshCode(payload.code);
      toast.success("נוצר קוד חתונה חדש.");
      await loadCodes();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "יצירת הקוד נכשלה.");
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    await fetch("/api/admin/login", { method: "DELETE" });
    setAuthed(false);
    setCodes([]);
    setFreshCode(null);
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    toast.success("הקוד הועתק.");
  }

  async function deleteCode(item: AdminCode) {
    const couple = item.event
      ? `של ${item.event.groom_name} ו${item.event.bride_name}`
      : "";
    const confirmed = window.confirm(
      `למחוק את קוד החתונה ${item.code}${couple ? ` ${couple}` : ""}? הפעולה לא ניתנת לביטול.`,
    );
    if (!confirmed) return;

    setDeletingId(item.id);
    try {
      const response = await fetch("/api/admin/codes", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auth_user_id: item.auth_user_id,
          code: item.code,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "מחיקת הקוד נכשלה.");
      toast.success("הקוד נמחק.");
      if (freshCode === item.code) setFreshCode(null);
      await loadCodes();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "מחיקת הקוד נכשלה.");
    } finally {
      setDeletingId(null);
    }
  }

  if (!ready) {
    return <p className="text-muted-foreground">טוענים את עמוד המנהל...</p>;
  }

  if (!authed) {
    return (
      <form onSubmit={login} className="card-premium mx-auto w-full max-w-md p-8">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-gold/15 text-gold-dark">
            <Heart className="size-5 fill-current" />
          </span>
          <div>
            <p className="text-sm text-gold-dark">צוות סנדרין</p>
            <h1 className="text-2xl font-semibold">כניסת מנהל</h1>
          </div>
        </div>
        <Label htmlFor="admin-password">סיסמת צוות</Label>
        <Input
          id="admin-password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="סיסמת המנהל"
        />
        <Button type="submit" variant="gold" className="mt-5 w-full" disabled={loading}>
          {loading ? "בודקים..." : "כניסה"}
        </Button>
      </form>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm text-gold-dark">עמוד מנהל</p>
          <h1 className="mt-1 text-3xl font-semibold">קודי חתונה</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
            יצרו קוד בן 6 ספרות ומסרו אותו לזוג. בכניסה לאתר הם יזינו את הקוד
            וימשיכו לתהליך ההיכרות.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="gold" onClick={createCode} disabled={loading}>
            <Plus className="size-4" />
            יצירת קוד חדש
          </Button>
          <Button variant="ghost" onClick={logout}>
            <LogOut className="size-4" />
            יציאה
          </Button>
        </div>
      </div>

      {freshCode && (
        <div className="card-premium overflow-hidden p-8 text-center">
          <p className="flex items-center justify-center gap-2 text-sm text-gold-dark">
            <Sparkles className="size-4" />
            קוד חדש מוכן למסירה
          </p>
          <div dir="ltr" className="mt-6 flex justify-center gap-3 sm:gap-4">
            {freshCode.split("").map((digit, index) => (
              <span
                key={`${digit}-${index}`}
                className="flex h-20 w-12 items-end justify-center border-b-[3px] border-gold pb-2 text-5xl font-medium sm:h-24 sm:w-14"
              >
                {digit}
              </span>
            ))}
          </div>
          <Button variant="outline" className="mt-8" onClick={() => copyCode(freshCode)}>
            <Copy className="size-4" />
            העתקת הקוד
          </Button>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-border bg-white/80">
        <div className="hidden grid-cols-[140px_1fr_110px_110px_72px] gap-3 border-b border-border bg-muted/70 px-4 py-3 text-xs text-muted-foreground md:grid">
          <span>קוד</span>
          <span>זוג</span>
          <span>סטטוס</span>
          <span>נוצר</span>
          <span>פעולות</span>
        </div>
        {codes.length === 0 && (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">
            עדיין אין קודים. יצרו את הראשון עבור הזוג הבא.
          </p>
        )}
        {codes.map((item) => (
          <div
            key={item.id}
            className="grid items-center gap-2 border-b border-border px-4 py-4 last:border-0 md:grid-cols-[140px_1fr_110px_110px_72px]"
          >
            <button
              type="button"
              dir="ltr"
              className="justify-self-start font-mono text-lg tracking-[0.18em]"
              onClick={() => copyCode(item.code)}
            >
              {item.code}
            </button>
            <p className="text-sm">
              {item.event
                ? `${item.event.groom_name} ו${item.event.bride_name}`
                : "ממתין שהזוג ייכנס וימלא פרטים"}
            </p>
            <div>
              {item.event ? (
                <Badge variant="success">פעיל</Badge>
              ) : (
                <Badge variant="gold">ממתין</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {new Date(item.created_at).toLocaleDateString("he-IL")}
            </p>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="justify-self-start text-muted-foreground hover:text-danger"
              disabled={deletingId === item.id || loading}
              onClick={() => deleteCode(item)}
              title="מחיקת קוד"
            >
              <Trash2 className="size-4" />
              <span className="sr-only">מחיקת קוד {item.code}</span>
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
