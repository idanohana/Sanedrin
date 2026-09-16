"use client";

import { Users } from "lucide-react";
import type { GuestRecord, TableRecord } from "@/lib/types";
import { guestSeatCount } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type TableRow = {
  table: TableRecord;
  seated: GuestRecord[];
  seats: number;
};

type Props = {
  rows: TableRow[];
  unseated: GuestRecord[];
  onAssign: (guestId: string, tableId: string | null) => void;
};

export function MobileSeatingList({ rows, unseated, onAssign }: Props) {
  return (
    <div className="space-y-4">
      {unseated.length > 0 && (
        <section className="card-premium space-y-3 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold">עדיין לא שובצו</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">בחרו שולחן ליד השם</p>
            </div>
            <Badge variant="gold">{unseated.length}</Badge>
          </div>
          <ul className="space-y-2">
            {unseated.map((guest) => (
              <li
                key={guest.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-white px-3 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{guest.full_name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {guest.side} · {guest.group_tag} · {guestSeatCount(guest)} מקומות
                  </p>
                </div>
                <label className="sr-only" htmlFor={`assign-${guest.id}`}>
                  שיבוץ ל{guest.full_name}
                </label>
                <select
                  id={`assign-${guest.id}`}
                  className="h-10 max-w-[8.5rem] shrink-0 rounded-xl border border-border bg-muted px-2 text-sm"
                  defaultValue=""
                  onChange={(event) => {
                    const tableId = event.target.value;
                    if (!tableId) return;
                    onAssign(guest.id, tableId);
                    event.target.value = "";
                  }}
                >
                  <option value="" disabled>
                    שולחן
                  </option>
                  {rows.map(({ table, seats }) => (
                    <option key={table.id} value={table.id}>
                      {table.table_number} ({seats}/{table.capacity})
                    </option>
                  ))}
                </select>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="overflow-hidden rounded-2xl border border-border bg-white">
        <div className="grid grid-cols-[4.5rem_1fr_4.2rem] gap-2 border-b border-border bg-muted/70 px-4 py-3 text-xs text-muted-foreground">
          <span>שולחן</span>
          <span>מי יושב</span>
          <span className="text-left">מקומות</span>
        </div>
        {rows.map(({ table, seated, seats }) => {
          const over = seats > table.capacity;
          return (
            <article
              key={table.id}
              className="grid grid-cols-[4.5rem_1fr_4.2rem] gap-2 border-b border-border px-4 py-3.5 last:border-0"
            >
              <div className="flex items-start">
                <span className="flex size-10 items-center justify-center rounded-full border border-gold/40 bg-gold/10 text-sm font-semibold text-gold-dark">
                  {table.table_number}
                </span>
              </div>
              <div className="min-w-0 space-y-2">
                {seated.length === 0 ? (
                  <p className="pt-2 text-sm text-muted-foreground">פנוי</p>
                ) : (
                  seated.map((guest) => (
                    <div key={guest.id} className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{guest.full_name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {guest.group_tag} · {guestSeatCount(guest)}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 shrink-0 px-2 text-danger hover:bg-[#f6e6e6] hover:text-danger"
                        onClick={() => onAssign(guest.id, null)}
                      >
                        הסרה
                      </Button>
                    </div>
                  ))
                )}
              </div>
              <p className={`pt-2 text-left text-xs ${over ? "font-medium text-danger" : "text-muted-foreground"}`}>
                {seats}/{table.capacity}
              </p>
            </article>
          );
        })}
      </section>

      {rows.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border px-4 py-10 text-center text-muted-foreground">
          <Users className="mx-auto mb-3 size-8 text-gold/70" />
          עדיין אין שולחנות באירוע
        </div>
      )}
    </div>
  );
}
