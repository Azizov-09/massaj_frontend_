import { generateId } from "@/utils";
// A lost response must not turn a retry or page reload into a new payment.
// Payloads and clinical details are not stored in the browser.
const memory = new Map<string, string>();
function storageKey(scope: string, signature: string) {
  let hash = 2166136261;
  for (const char of signature) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return `crm-pending:${scope}:${(hash >>> 0).toString(16)}`;
}
export function pendingOperation(scope: string, signature: string): string {
  const key = storageKey(scope, signature);
  try {
    const previous = sessionStorage.getItem(key);
    if (previous) return previous;
  } catch {
    /* In-memory fallback for restricted browser storage. */
  }
  const value = memory.get(key) || generateId();
  memory.set(key, value);
  try {
    sessionStorage.setItem(key, value);
  } catch {
    /* Retry still works in this page. */
  }
  return value;
}
export function finishOperation(scope: string, signature: string) {
  const key = storageKey(scope, signature);
  memory.delete(key);
  try {
    sessionStorage.removeItem(key);
  } catch {
    /* No persisted entry. */
  }
}
