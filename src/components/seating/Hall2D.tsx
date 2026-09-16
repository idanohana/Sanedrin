"use client";

import { useMemo, useRef, useState, type DragEvent, type PointerEvent as ReactPointerEvent } from "react";
import { HallCanvas } from "@/components/seating/HallCanvas";
import { HALL_HEIGHT, HALL_WIDTH } from "@/lib/constants";
import type { GuestRecord, TableRecord } from "@/lib/types";
import { cn, guestSeatCount } from "@/lib/utils";

type Props = {
  tables: TableRecord[];
  guests: GuestRecord[];
  selectedTableId: string | null;
  onSelectTable: (tableId: string) => void;
  onAssign: (guestId: string, tableId: string | null) => void;
  onMoveTable: (tableId: string, x: number, y: number) => void;
  onAssignGroup: (groupTag: string, tableId: string) => void;
};

export function Hall2D({
  tables,
  guests,
  selectedTableId,
  onSelectTable,
  onAssign,
  onMoveTable,
  onAssignGroup,
}: Props) {
  const [draggingTable, setDraggingTable] = useState<string | null>(null);
  const skipClickRef = useRef(false);
  const occupancy = useMemo(() => {
    const map = new Map<string, { seats: number; names: string[] }>();
    for (const table of tables) {
      const seated = guests.filter((guest) => guest.table_id === table.id);
      map.set(table.id, {
        seats: seated.reduce((sum, guest) => sum + guestSeatCount(guest), 0),
        names: seated.map((guest) => guest.full_name),
      });
    }
    return map;
  }, [tables, guests]);

  function onDrop(event: DragEvent<HTMLButtonElement>, tableId: string) {
    event.preventDefault();
    const guestId = event.dataTransfer.getData("guest-id");
    const groupTag = event.dataTransfer.getData("group-tag");
    if (guestId) onAssign(guestId, tableId);
    if (groupTag) onAssignGroup(groupTag, tableId);
  }

  function startTableDrag(event: ReactPointerEvent<HTMLButtonElement>, table: TableRecord) {
    if (event.pointerType === "touch") return;

    setDraggingTable(table.id);
    const origin = event.currentTarget.parentElement?.getBoundingClientRect();
    const startX = event.clientX;
    const startY = event.clientY;
    const initialX = table.pos_x;
    const initialY = table.pos_y;
    let moved = false;

    function move(moveEvent: PointerEvent) {
      if (!origin) return;
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      if (Math.abs(dx) + Math.abs(dy) > 8) {
        moved = true;
        skipClickRef.current = true;
      }
      const scale = origin.width / HALL_WIDTH;
      const nextX = Math.min(
        HALL_WIDTH - 40,
        Math.max(40, initialX + dx / scale),
      );
      const nextY = Math.min(
        HALL_HEIGHT - 40,
        Math.max(40, initialY + dy / scale),
      );
      if (moved) onMoveTable(table.id, nextX, nextY);
    }

    function up() {
      setDraggingTable(null);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    }

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  return (
    <div className="max-h-[min(70vh,640px)] overflow-auto rounded-2xl border border-border bg-[#f4eee4] touch-pan-x touch-pan-y">
      <div
        className="relative"
        style={{ width: HALL_WIDTH, height: HALL_HEIGHT, minWidth: HALL_WIDTH }}
      >
        <HallCanvas className="absolute inset-0" />
        {tables.map((table) => {
          const info = occupancy.get(table.id);
          const over = (info?.seats ?? 0) > table.capacity;
          const round = table.shape === "round";
          return (
            <button
              key={table.id}
              type="button"
              onPointerDown={(event) => startTableDrag(event, table)}
              onClick={() => {
                if (skipClickRef.current) {
                  skipClickRef.current = false;
                  return;
                }
                onSelectTable(table.id);
              }}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => onDrop(event, table.id)}
              className={cn(
                "absolute flex -translate-x-1/2 -translate-y-1/2 cursor-pointer flex-col items-center justify-center border text-center shadow-sm select-none touch-manipulation",
                round ? "h-32 w-32 rounded-full sm:h-28 sm:w-28" : "h-24 w-44 rounded-2xl sm:h-20 sm:w-40",
                over
                  ? "border-danger bg-[#f8eaea] text-danger"
                  : selectedTableId === table.id
                    ? "border-gold bg-gold/15 text-foreground ring-2 ring-gold/40"
                    : "border-gold/50 bg-white/90 text-foreground",
                draggingTable === table.id && "cursor-grabbing shadow-lg",
              )}
              style={{ left: table.pos_x, top: table.pos_y }}
            >
              <span className="text-xs text-muted-foreground">שולחן</span>
              <span className="text-lg font-semibold">{table.table_number}</span>
              <span className="text-[11px]">
                {info?.seats ?? 0}/{table.capacity}
              </span>
              <span className="mt-0.5 text-[10px] font-medium text-gold-dark">
                {info?.names.length ? "מי יושב כאן" : "פנוי"}
              </span>
              {over && <span className="text-[10px] font-medium">חריגה ממקומות</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
