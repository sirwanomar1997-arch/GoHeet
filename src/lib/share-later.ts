/**
 * "Share later" — a deliberately tiny holding area on the device.
 *
 * Three clips, no more. This is not an archive or a memory library: it exists
 * only so a moment captured with bad signal can still be shared once you're
 * back. Everything lives in the browser's own storage, never on our servers.
 */

export const SHARE_LATER_LIMIT = 3;

export type SavedClip = {
  id: string;
  blob: Blob;
  poster: Blob | null;
  kind: "video" | "photo";
  durationMs: number;
  caption: string;
  place: string;
  styleFilter: string | null;
  createdAt: number;
};

const DB_NAME = "reelzy-share-later";
const STORE = "clips";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(STORE, mode);
        const req = run(t.objectStore(STORE));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
        t.oncomplete = () => db.close();
      }),
  );
}

export async function listSavedClips(): Promise<SavedClip[]> {
  if (typeof indexedDB === "undefined") return [];
  try {
    const all = await tx<SavedClip[]>("readonly", (s) => s.getAll() as IDBRequest<SavedClip[]>);
    return all.sort((a, b) => b.createdAt - a.createdAt);
  } catch {
    return [];
  }
}

export async function countSavedClips(): Promise<number> {
  return (await listSavedClips()).length;
}

export async function saveClip(clip: Omit<SavedClip, "id" | "createdAt">): Promise<SavedClip> {
  const existing = await listSavedClips();
  if (existing.length >= SHARE_LATER_LIMIT) {
    throw new Error(`You can hold ${SHARE_LATER_LIMIT} moments at a time. Share or delete one first.`);
  }
  const record: SavedClip = {
    ...clip,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
  };
  await tx("readwrite", (s) => s.put(record));
  return record;
}

export async function deleteClip(id: string): Promise<void> {
  await tx("readwrite", (s) => s.delete(id));
}

export async function getClip(id: string): Promise<SavedClip | null> {
  if (typeof indexedDB === "undefined") return null;
  try {
    const found = await tx<SavedClip | undefined>("readonly", (s) => s.get(id) as IDBRequest<SavedClip | undefined>);
    return found ?? null;
  } catch {
    return null;
  }
}

/** Re-save a held clip after editing — same slot, same id. */
export async function updateClip(
  id: string,
  patch: Partial<Omit<SavedClip, "id" | "createdAt">>,
): Promise<void> {
  const existing = await getClip(id);
  if (!existing) return;
  await tx("readwrite", (s) => s.put({ ...existing, ...patch }));
}
