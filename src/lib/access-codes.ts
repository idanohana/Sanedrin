import { CODE_LENGTH } from "@/lib/constants";

export function emailForCode(code: string) {
  return `${code}@guest.sanedrin.codes`;
}

export function passwordForCode(code: string) {
  const pepper = process.env.ADMIN_PASSWORD || "sanedrin";
  return `sdn-${code}-${pepper}`;
}

export function isValidWeddingCode(code: string) {
  return new RegExp(`^\\d{${CODE_LENGTH}}$`).test(code);
}
