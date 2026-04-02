const KEY = "cinebuzz_home_return";

/** Snapshot of Home UI so Sign in can return to the same screen (booking, detail, grid). */
export function writeHomeReturnSnapshot(snapshot) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(snapshot));
  } catch {
    /* ignore */
  }
}

export function readHomeReturnSnapshot() {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
