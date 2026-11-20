import { useSyncExternalStore } from "react";
import { resetAllCaches } from "@/lib/query-client";

/** Active workspace id, or null for the unified "All" view. Persisted per device. */
const KEY = "continuum:workspace";
const listeners = new Set<() => void>();

export const FREE_WORKSPACE_TOTAL_LIMIT = 2;

let current: string | null = (() => {
  try {
    return localStorage.getItem(KEY) || null;
  } catch {
    return null;
  }
})();

export function getActiveWorkspace(): string | null {
  return current;
}

export function setActiveWorkspace(id: string | null) {
  if (id === current) return;
  current = id;
  try {
    if (id) localStorage.setItem(KEY, id);
    else localStorage.removeItem(KEY);
  } catch { /* ignore */ }
  listeners.forEach((l) => l());
  // Drop every cached response (memory + IndexedDB) so nothing from the
  // previous workspace renders, then force a full reload so every screen
  // refetches with the new workspace. A reload works identically on the web,
  // the installed PWA and the Capacitor shell. The cache reset is awaited
  // best-effort with a cap so a slow IndexedDB never blocks the reload.
  if (typeof window === "undefined") {
    void resetAllCaches();
    return;
  }
  const reload = () => window.location.reload();
  void Promise.race([
    resetAllCaches(),
    new Promise((resolve) => setTimeout(resolve, 800)),
  ]).then(reload, reload);
}

export function useActiveWorkspace(): string | null {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => current,
  );
}

export const WORKSPACE_COLORS = [
  "#F59E0B",
  "#22C55E",
  "#3B82F6",
  "#EC4899",
  "#A855F7",
  "#F97316",
  "#06B6D4",
  "#EF4444",
  "#84CC16",
  "#6366F1",
  "#14B8A6",
  "#9CA3AF",
];
