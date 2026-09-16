"use client";

import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import type { GuestRecord, TableRecord } from "@/lib/types";
import { HALL_HEIGHT, HALL_WIDTH } from "@/lib/constants";
import { guestSeatCount } from "@/lib/utils";

function toScene(x: number, y: number): [number, number, number] {
  const nx = (x / HALL_WIDTH - 0.5) * 22;
  const nz = (y / HALL_HEIGHT - 0.5) * 14;
  return [nx, 0.35, nz];
}

function HallMesh() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[24, 16]} />
        <meshStandardMaterial color="#efe4d2" />
      </mesh>
      <mesh position={[0, 0.02, -5.8]}>
        <boxGeometry args={[8, 0.3, 2]} />
        <meshStandardMaterial color="#d9c4a0" />
      </mesh>
      <mesh position={[0, 0.03, 0.2]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[3.2, 48]} />
        <meshStandardMaterial color="#e8d5b5" transparent opacity={0.85} />
      </mesh>
      <group position={[-8.4, 0, -5.4]}>
        <mesh position={[-0.9, 1.1, -0.7]}>
          <cylinderGeometry args={[0.06, 0.06, 2.2]} />
          <meshStandardMaterial color="#c4a574" />
        </mesh>
        <mesh position={[0.9, 1.1, -0.7]}>
          <cylinderGeometry args={[0.06, 0.06, 2.2]} />
          <meshStandardMaterial color="#c4a574" />
        </mesh>
        <mesh position={[-0.9, 1.1, 0.7]}>
          <cylinderGeometry args={[0.06, 0.06, 2.2]} />
          <meshStandardMaterial color="#c4a574" />
        </mesh>
        <mesh position={[0.9, 1.1, 0.7]}>
          <cylinderGeometry args={[0.06, 0.06, 2.2]} />
          <meshStandardMaterial color="#c4a574" />
        </mesh>
        <mesh position={[0, 2.2, 0]}>
          <boxGeometry args={[2.1, 0.08, 1.7]} />
          <meshStandardMaterial color="#f7f1e6" />
        </mesh>
      </group>
    </group>
  );
}

function TableMesh({
  table,
  occupied,
  selected,
  onSelect,
}: {
  table: TableRecord;
  occupied: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const [x, y, z] = toScene(table.pos_x, table.pos_y);
  const over = occupied > table.capacity;
  const color = over ? "#b87676" : selected ? "#f3e3c0" : "#f4efe6";
  const rim = over ? "#9a4f4f" : "#c4a574";

  return (
    <group
      position={[x, y, z]}
      onClick={(event) => {
        event.stopPropagation();
        onSelect();
      }}
      onPointerOver={() => {
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        document.body.style.cursor = "auto";
      }}
    >
      {table.shape === "round" ? (
        <>
          <mesh castShadow>
            <cylinderGeometry args={[0.72, 0.72, 0.18, 32]} />
            <meshStandardMaterial color={color} />
          </mesh>
          <mesh position={[0, 0.1, 0]}>
            <torusGeometry args={[0.72, 0.035, 12, 40]} />
            <meshStandardMaterial color={rim} />
          </mesh>
        </>
      ) : (
        <mesh castShadow>
          <boxGeometry args={[1.7, 0.18, 0.85]} />
          <meshStandardMaterial color={color} />
        </mesh>
      )}
    </group>
  );
}

export function Hall3D({
  tables,
  guests,
  selectedTableId,
  onSelectTable,
}: {
  tables: TableRecord[];
  guests: GuestRecord[];
  selectedTableId: string | null;
  onSelectTable: (tableId: string) => void;
}) {
  return (
    <div className="h-[420px] overflow-hidden rounded-2xl border border-border bg-[#1f1b16] md:h-[640px]">
      <Canvas shadows camera={{ position: [10, 11, 12], fov: 42 }}>
        <color attach="background" args={["#2a241d"]} />
        <ambientLight intensity={0.7} />
        <directionalLight
          position={[8, 14, 6]}
          intensity={1.15}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <HallMesh />
        {tables.map((table) => {
          const occupied = guests
            .filter((guest) => guest.table_id === table.id)
            .reduce((sum, guest) => sum + guestSeatCount(guest), 0);
          return (
            <TableMesh
              key={table.id}
              table={table}
              occupied={occupied}
              selected={selectedTableId === table.id}
              onSelect={() => onSelectTable(table.id)}
            />
          );
        })}
        <OrbitControls enableDamping makeDefault />
      </Canvas>
    </div>
  );
}
