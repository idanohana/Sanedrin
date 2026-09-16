"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Heart, LayoutDashboard, LogOut, Sparkles, Users } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { getCurrentEvent } from "@/lib/events";
import type { EventRecord } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { he } from "date-fns/locale";

const NAV = [
  { href: "/dashboard", label: "דשבורד", icon: LayoutDashboard },
  { href: "/guests", label: "מוזמנים", icon: Users },
  { href: "/seating", label: "הושבה", icon: Sparkles },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [event, setEvent] = useState<EventRecord | null>(null);

  useEffect(() => {
    getCurrentEvent().then((current) => {
      if (!current && pathname !== "/onboarding") {
        router.replace("/onboarding");
        return;
      }
      setEvent(current);
    });
  }, [pathname, router]);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/");
  }

  return (
    <div className="min-h-screen">
      <header className="glass-effect sticky top-0 z-40 border-b border-gold/15">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-8">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-gold/15 text-gold-dark">
              <Heart className="size-4 fill-current" />
            </span>
            <div>
              <p className="text-sm font-semibold leading-none">סנדרין</p>
              <p className="mt-1 text-[11px] text-muted-foreground">אולם אירועים</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 rounded-2xl bg-white/50 p-1 md:flex">
            {NAV.map((item) => {
              const Icon = item.icon;
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-4 py-2 text-sm transition-colors",
                    active
                      ? "bg-white text-gold-dark shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            {event && (
              <div className="hidden text-left sm:block">
                <p className="text-sm font-medium">
                  {event.groom_name} ו{event.bride_name}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {format(new Date(event.event_date), "d בMMMM yyyy", { locale: he })}
                </p>
              </div>
            )}
            <Button variant="ghost" size="icon" onClick={signOut} title="יציאה">
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:hidden">
          {NAV.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-xl px-3 py-1.5 text-sm",
                  active ? "bg-white text-gold-dark shadow-sm" : "text-muted-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 md:px-8">{children}</main>
    </div>
  );
}
