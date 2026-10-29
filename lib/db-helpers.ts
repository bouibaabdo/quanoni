import { randomUUID } from "crypto";

export function createId() {
  return randomUUID().replace(/-/g, "").slice(0, 24);
}
