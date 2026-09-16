"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { BoxSelect, UsersRound } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { getCurrentEvent } from "@/lib/events";
import type { EventRecord, GuestRecord, TableRecord } from "@/lib/types";
import { guestSeatCount } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Hall2D } from "@/components/seating/Hall2D";
import { MobileSeatingList } from "@/components/seating/MobileSeatingList";
import { TableGuestsDialog } from "@/components/seating/TableGuestsDialog";

const Hall3D = dynamic(
  () => import("@/components/seating/Hall3D").then((mod) => mod.Hall3D),
  { ssr: false, loading: () => <p className="p-8 text-muted-foreground">טוענים את האולם בתלת־ממד...</p> },
);

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const update = () => setIsDesktop(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return isDesktop;
}

export function SeatingBoard() {
  const isDesktop = useIsDesktop();
  const [event, setEvent] = useState<EventRecord | null>(null);
  const [tables, setTables] = useState<TableRecord[]>([]);
  const [guests, setGuests] = useState<GuestRecord[]>([]);
  const [mode, setMode] = useState<"2d" | "3d">("2d");
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);

  async function load() {
    const current = await getCurrentEvent();
    setEvent(current);
    if (!current) return;
    const supabase = createClient();
    const [{ data: tableRows }, { data: guestRows }] = await Promise.all([
      supabase.from("tables").select("*").eq("event_id", current.id).order("table_number"),
      supabase.from("guests").select("*").eq("event_id", current.id).order("full_name"),
    ]);
    setTables((tableRows as TableRecord[]) ?? []);
    setGuests((guestRows as GuestRecord[]) ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  const tableById = useMemo(
    () => new Map(tables.map((table) => [table.id, table])),
    [tables],
  );

  const groups = useMemo(() => {
    const map = new Map<string, GuestRecord[]>();
    for (const guest of guests) {
      const key = guest.group_tag || "כללי";
      map.set(key, [...(map.get(key) ?? []), guest]);
    }
    return Array.from(map.entries());
  }, [guests]);

  const seatingByTable = useMemo(() => {
    return tables.map((table) => {
      const seated = guests.filter((guest) => guest.table_id === table.id);
      return {
        table,
        seated,
        seats: seated.reduce((sum, guest) => sum + guestSeatCount(guest), 0),
      };
    });
  }, [tables, guests]);

  const unseated = guests.filter((guest) => !guest.table_id && guest.rsvp_status !== "לא מגיע");
  const selected = seatingByTable.find((row) => row.table.id === selectedTableId);

  async function persistGuest(guestId: string, tableId: string | null) {
    const supabase = createClient();
    const { error } = await supabase.from("guests").update({ table_id: tableId }).eq("id", guestId);
    if (error) {
      toast.error("עדכון ההושבה נכשל.");
      return;
    }
    setGuests((current) =>
      current.map((guest) => (guest.id === guestId ? { ...guest, table_id: tableId } : guest)),
    );
  }

  async function persistTable(tableId: string, x: number, y: number) {
    setTables((current) =>
      current.map((table) =>
        table.id === tableId ? { ...table, pos_x: x, pos_y: y } : table,
      ),
    );
    const supabase = createClient();
    await supabase.from("tables").update({ pos_x: x, pos_y: y }).eq("id", tableId);
  }

  async function assignGroup(groupTag: string, tableId: string) {
    const members = guests.filter((guest) => guest.group_tag === groupTag);
    const table = tables.find((item) => item.id === tableId);
    if (!table) return;
    const used = guests
      .filter((guest) => guest.table_id === tableId)
      .reduce((sum, guest) => sum + guestSeatCount(guest), 0);
    const incoming = members.reduce((sum, guest) => sum + guestSeatCount(guest), 0);
    if (used + incoming > table.capacity) {
      toast.error(`בקבוצה ${groupTag} אין מספיק מקומות בשולחן ${table.table_number}.`);
    }
    await Promise.all(members.map((guest) => persistGuest(guest.id, tableId)));
    toast.success(`הקבוצה "${groupTag}" הועברה לשולחן ${table.table_number}.`);
  }

  if (isDesktop === null) {
    return null;
  }

  if (!isDesktop) {
    return (
      <div className="space-y-5">
        <div>
          <p className="text-sm text-gold-dark">אולם סנדרין</p>
          <h1 className="mt-1 text-3xl font-semibold">הושבה לפי שולחנות</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            טבלה פשוטה של מי יושב בכל שולחן.
            {event ? ` האירוע של ${event.groom_name} ו${event.bride_name}.` : ""}
          </p>
        </div>
        <MobileSeatingList rows={seatingByTable} unseated={unseated} onAssign={persistGuest} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm text-gold-dark">אולם סנדרין</p>
          <h1 className="mt-1 text-3xl font-semibold">מפת הושבה אינטראקטיבית</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            גררו מוזמן אל השולחן, או לחצו על שולחן כדי לראות מי יושב בו.
            {event ? ` האירוע של ${event.groom_name} ו${event.bride_name}.` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant={mode === "2d" ? "gold" : "outline"} onClick={() => setMode("2d")}>
            <BoxSelect className="size-4" />
            תצוגת 2D
          </Button>
          <Button variant={mode === "3d" ? "gold" : "outline"} onClick={() => setMode("3d")}>
            תצוגת 3D
          </Button>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[280px_1fr]">
        <aside className="card-premium space-y-4 p-4">
          <div>
            <h2 className="font-semibold">מוזמנים להושבה</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              גררו שם אל השולחן, או גררו קבוצה שלמה.
            </p>
          </div>
          <div className="space-y-4">
            {groups.map(([group, members]) => (
              <div key={group}>
                <div
                  draggable
                  onDragStart={(event) => event.dataTransfer.setData("group-tag", group)}
                  className="mb-2 flex cursor-grab items-center justify-between rounded-xl bg-muted px-3 py-2"
                >
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <UsersRound className="size-4 text-gold-dark" />
                    {group}
                  </span>
                  <Badge variant="gold">{members.length}</Badge>
                </div>
                <div className="space-y-2">
                  {members.map((guest) => {
                    const table = guest.table_id ? tableById.get(guest.table_id) : null;
                    return (
                      <div
                        key={guest.id}
                        draggable
                        onDragStart={(event) => event.dataTransfer.setData("guest-id", guest.id)}
                        className="rounded-xl border border-border bg-white px-3 py-2 text-sm"
                      >
                        <p className="font-medium">{guest.full_name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {guest.side} · {guestSeatCount(guest)} מקומות
                          {table ? ` · שולחן ${table.table_number}` : " · טרם שובץ"}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            {unseated.length === 0 && guests.length > 0 && (
              <p className="text-sm text-muted-foreground">כל המוזמנים כבר שובצו לשולחנות.</p>
            )}
          </div>
        </aside>

        <div>
          {mode === "2d" ? (
            <Hall2D
              tables={tables}
              guests={guests}
              selectedTableId={selectedTableId}
              onSelectTable={setSelectedTableId}
              onAssign={persistGuest}
              onMoveTable={persistTable}
              onAssignGroup={assignGroup}
            />
          ) : (
            <Hall3D
              tables={tables}
              guests={guests}
              selectedTableId={selectedTableId}
              onSelectTable={setSelectedTableId}
            />
          )}
        </div>
      </div>

      <TableGuestsDialog
        open={Boolean(selectedTableId)}
        table={selected?.table ?? null}
        seated={selected?.seated ?? []}
        onOpenChange={(open) => {
          if (!open) setSelectedTableId(null);
        }}
        onRemove={(guestId) => persistGuest(guestId, null)}
      />
    </div>
  );
}
