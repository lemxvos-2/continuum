import type { Persister, PersistedClient } from "@tanstack/react-query-persist-client";
import { idbDelete, idbGet, idbPut, STORES } from "./db";
import { version as appVersion } from "@/lib/version";

const KEY = "react-query-cache";

/**
 * Persists the React Query cache in the existing `continuum-offline` IndexedDB
 * (no 5MB localStorage ceiling, survives app/APK restarts).
 */
const PERSIST_THROTTLE_MS = 1000;

export function createIdbPersister(): Persister {
  let pending: PersistedClient | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;
  const flush = async () => {
    timer = null;
    const client = pending;
    pending = null;
    if (!client) return;
    try {
      await idbPut(STORES.METADATA, { key: KEY, value: client });
    } catch {
      /* quota / private mode — cache simply won't persist */
    }
  };
  if (typeof window !== "undefined") {
    window.addEventListener("pagehide", () => { if (pending) void flush(); });
  }
  return {
    // Coalesces bursts of cache updates into one write per second.
    persistClient: async (client: PersistedClient) => {
      pending = client;
      if (!timer) timer = setTimeout(() => void flush(), PERSIST_THROTTLE_MS);
    },
    restoreClient: async () => {
      try {
        const row = await idbGet<{ key: string; value: PersistedClient }>(STORES.METADATA, KEY);
        return row?.value;
      } catch {
        return undefined;
      }
    },
    removeClient: async () => {
      pending = null;
      if (timer) { clearTimeout(timer); timer = null; }
      try {
        await idbDelete(STORES.METADATA, KEY);
      } catch {
        /* ignore */
      }
    },
  };
}

/** Cache buster: a new build never restores an older cache shape. */
export const QUERY_CACHE_BUSTER = `v1-${appVersion}`;

export async function clearPersistedQueryCache() {
  try {
    await idbDelete(STORES.METADATA, KEY);
  } catch {
    /* ignore */
  }
}
