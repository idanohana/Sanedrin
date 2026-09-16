import type { GuestSide, TableShape } from "@/lib/types";

export const APP_NAME = "סנדרין";
export const CODE_LENGTH = 6;

export const GUEST_SIDES: GuestSide[] = ["חתן", "כלה", "משותף"];

export const SUGGESTED_GROUPS = [
  "משפחה קרובה",
  "משפחה מצומצמת",
  "חבר'ה מהצבא",
  "חברים",
  "עבודה",
  "כללי",
];

export const HALL_WIDTH = 1400;
export const HALL_HEIGHT = 900;

export type DefaultTableSeed = {
  table_number: number;
  capacity: number;
  shape: TableShape;
  pos_x: number;
  pos_y: number;
};

export const DEFAULT_HALL_TABLES: DefaultTableSeed[] = [
  { table_number: 1, capacity: 10, shape: "round", pos_x: 180, pos_y: 210 },
  { table_number: 2, capacity: 10, shape: "round", pos_x: 360, pos_y: 170 },
  { table_number: 3, capacity: 10, shape: "round", pos_x: 1040, pos_y: 170 },
  { table_number: 4, capacity: 10, shape: "round", pos_x: 1220, pos_y: 210 },
  { table_number: 5, capacity: 10, shape: "round", pos_x: 160, pos_y: 420 },
  { table_number: 6, capacity: 10, shape: "round", pos_x: 340, pos_y: 390 },
  { table_number: 7, capacity: 10, shape: "round", pos_x: 1060, pos_y: 390 },
  { table_number: 8, capacity: 10, shape: "round", pos_x: 1240, pos_y: 420 },
  { table_number: 9, capacity: 10, shape: "round", pos_x: 220, pos_y: 640 },
  { table_number: 10, capacity: 10, shape: "round", pos_x: 420, pos_y: 700 },
  { table_number: 11, capacity: 10, shape: "round", pos_x: 980, pos_y: 700 },
  { table_number: 12, capacity: 10, shape: "round", pos_x: 1180, pos_y: 640 },
  { table_number: 13, capacity: 12, shape: "rectangular", pos_x: 160, pos_y: 820 },
  { table_number: 14, capacity: 12, shape: "rectangular", pos_x: 430, pos_y: 820 },
  { table_number: 15, capacity: 12, shape: "rectangular", pos_x: 970, pos_y: 820 },
  { table_number: 16, capacity: 12, shape: "rectangular", pos_x: 1240, pos_y: 820 },
];

export const RSVP_STATUS_LABELS = {
  מגיע: "אישרו הגעה",
  "לא מגיע": "לא מגיעים",
  "טרם ענה": "ממתינים לתשובה",
} as const;
