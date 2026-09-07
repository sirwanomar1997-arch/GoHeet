import { useSyncExternalStore, useCallback } from "react";

const KEY = "goheet-demo-mode";

function getSnapshot(): boolean {
  try {
    return typeof window !== "undefined" && window.localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

function getServerSnapshot(): boolean {
  return false;
}

const listeners = new Set<() => void>();

function subscribe(callback: () => void) {
  listeners.add(callback);
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", onStorage);
  };
}

function onStorage(e: StorageEvent) {
  if (e.key === KEY || e.key === null) {
    listeners.forEach((cb) => cb());
  }
}

/** Toggle demo mode on/off. Returns the new state. */
export function setDemoMode(enabled: boolean): boolean {
  try {
    if (enabled) {
      window.localStorage.setItem(KEY, "1");
    } else {
      window.localStorage.removeItem(KEY);
    }
    listeners.forEach((cb) => cb());
  } catch {
    /* ignore */
  }
  return enabled;
}

/** Returns true when screenshot/demo mode is active. */
export function useDemoMode(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Check demo mode without subscribing. Useful for route loaders. */
export function isDemoMode(): boolean {
  return getSnapshot();
}

/** React to demo-mode changes — returns a function to toggle. */
export function useToggleDemoMode() {
  const toggle = useCallback(() => {
    setDemoMode(!getSnapshot());
  }, []);
  return toggle;
}
