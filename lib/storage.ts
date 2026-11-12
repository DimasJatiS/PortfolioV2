/**
 * Web Storage access that never throws.
 *
 * `localStorage` and `sessionStorage` can be missing (SSR), blocked (private mode,
 * strict cookie settings) or full. Preferences are a nicety, so every failure
 * degrades to "no stored value" instead of breaking the page.
 */

type StorageKind = "local" | "session";

function getStorage(kind: StorageKind): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return kind === "local" ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

export function readStorage(key: string, kind: StorageKind = "local"): string | null {
  try {
    return getStorage(kind)?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

/** Returns `true` when the value was persisted. */
export function writeStorage(
  key: string,
  value: string,
  kind: StorageKind = "local",
): boolean {
  try {
    const storage = getStorage(kind);
    if (!storage) return false;
    storage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}
