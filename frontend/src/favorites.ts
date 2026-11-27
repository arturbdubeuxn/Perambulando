export const favoritesStorageKey = 'perambulando.exploreFavorites';
const listeners = new Set<() => void>();
let sessionKeys: string[] = [];
let storageFailed = false;

function validKeys(value: unknown): string[] {
  return Array.isArray(value) ? [...new Set(value.filter((key): key is string => typeof key === 'string' && /^(host|programming):[1-9]\d*$/.test(key)))] : [];
}

export function getFavoriteKeys(): string[] {
  try {
    const storage = (globalThis as { localStorage?: { getItem: (key: string) => string | null } }).localStorage;
    if (storage && !storageFailed) {
      sessionKeys = validKeys(JSON.parse(storage.getItem(favoritesStorageKey) ?? '[]'));
    }
  } catch {
    // Preserve the current session if browser storage is unavailable.
  }
  return [...sessionKeys];
}

export function storeFavoriteKeys(keys: string[]): boolean {
  sessionKeys = validKeys(keys);
  let persisted = false;
  try {
    const storage = (globalThis as { localStorage?: { setItem: (key: string, value: string) => void } }).localStorage;
    if (storage) {
      storage.setItem(favoritesStorageKey, JSON.stringify(sessionKeys));
      persisted = true;
      storageFailed = false;
    } else {
      storageFailed = true;
    }
  } catch {
    storageFailed = true;
    // All screens still share the favorites during this session.
  }
  listeners.forEach((listener) => listener());
  return persisted;
}

export function setLocalFavorite(key: string, active: boolean) {
  const current = getFavoriteKeys();
  const keys = active ? [...new Set([...current, key])] : current.filter((item) => item !== key);
  const persisted = storeFavoriteKeys(keys);
  return { keys, persisted };
}

export function subscribeToFavorites(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === favoritesStorageKey || event.key === null) {
      storageFailed = false;
      listener();
    }
  };
  globalThis.addEventListener?.('storage', onStorage);
  return () => { listeners.delete(listener); globalThis.removeEventListener?.('storage', onStorage); };
}
