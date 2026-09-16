"use client";

import { Users, X } from "lucide-react";
import type { GuestRecord, TableRecord } from "@/lib/types";
import { guestSeatCount } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Props = {
  open: boolean;
  table: TableRecord | null;
  seated: GuestRecord[];
  onOpenChange: (open: boolean) => void;
  onRemove: (guestId: string) => void;
};

export function TableGuestsDialog({ open, table, seated, onOpenChange, onRemove }: Props) {
  const seats = seated.reduce((sum, guest) => sum + guestSeatCount(guest), 0);
  const over = table ? seats > table.capacity : false;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="top-auto bottom-0 left-0 w-full max-h-[85vh] translate-x-0 translate-y-0 overflow-y-auto rounded-t-[1.8rem] rounded-b-none border-gold/25 bg-[#fbf7f0] p-5 pb-8 sm:top-1/2 sm:bottom-auto sm:left-1/2 sm:w-[min(92vw,28rem)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl sm:pb-6">
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-border sm:hidden" />
        <DialogHeader className="items-center text-center">
          <div className="mx-auto mb-3 flex size-[4.5rem] items-center justify-center rounded-full border-2 border-gold bg-gold/15 shadow-sm">
            <span className="text-2xl font-semibold text-gold-dark">{table?.table_number ?? ""}</span>
          </div>
          <DialogTitle className="flex flex-col items-center gap-2 text-2xl sm:flex-row sm:justify-center">
            <span>שולחן {table?.table_number ?? ""}</span>
            {table && (
              <Badge variant={over ? "danger" : "gold"}>
                {seats}/{table.capacity} מקומות
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            {seated.length
              ? "כל מי שיושב בשולחן הזה. אפשר להסיר בלחיצה."
              : "השולחן פנוי. גררו לכאן מוזמנים מהרשימה."}
          </DialogDescription>
        </DialogHeader>

        {seated.length === 0 ? (
          <div className="mt-2 rounded-2xl border border-dashed border-gold/30 bg-white/70 px-4 py-10 text-center text-muted-foreground">
            <Users className="mx-auto mb-3 size-8 text-gold/70" />
            עדיין אין יושבים בשולחן הזה
          </div>
        ) : (
          <ul className="mt-2 space-y-2">
            {seated.map((guest) => (
              <li
                key={guest.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-white px-4 py-3.5 shadow-sm"
              >
                <div className="min-w-0">
                  <p className="truncate text-base font-medium">{guest.full_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {guest.side} · {guest.group_tag} · {guestSeatCount(guest)} מקומות
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="shrink-0 text-danger hover:bg-[#f6e6e6] hover:text-danger"
                  onClick={() => onRemove(guest.id)}
                >
                  <X className="size-4" />
                  הסרה
                </Button>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
