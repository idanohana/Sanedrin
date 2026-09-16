import { randomInt } from "crypto";
import { CODE_LENGTH } from "@/lib/constants";

export function generateWeddingCode() {
  return String(randomInt(0, 1_000_000)).padStart(CODE_LENGTH, "0");
}
