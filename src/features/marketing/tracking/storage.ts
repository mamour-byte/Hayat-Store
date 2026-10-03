/**
 * Client-side identity for marketing tracking.
 *
 * `anonymousId` is a durable, first-party identifier (localStorage) that lets us
 * stitch a visitor's visits together before they ever log in.
 * `sessionKey` is a 30-minute rolling window (sessionStorage) used to group
 * events into a single visit.
 *
 * Both values are required by the API to be 8-128 chars long, which a UUID v4
 * satisfies. We rely on the native `crypto.randomUUID` instead of the `uuid`
 * package to keep the bundle dependency-free.
 */

const ANONYMOUS_ID_KEY = 'hs_anonymous_id';
const SESSION_KEY_STORAGE = 'hs_session_key';
const SESSION_TS_KEY = 'hs_session_ts';
const SESSION_STARTED_KEY = 'hs_session_started';

/** 30 minutes of inactivity end the session, mirroring the API's own timeout. */
export const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

const generateId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback for very old browsers / insecure contexts.
  return `hs-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 14)}`;
};

const readStorage = (storage: Storage | undefined, key: string): string | null => {
  try {
    return storage?.getItem(key) ?? null;
  } catch {
    return null;
  }
};

const writeStorage = (storage: Storage | undefined, key: string, value: string): void => {
  try {
    storage?.setItem(key, value);
  } catch {
    // Private mode / quota exceeded: tracking degrades, nothing else breaks.
  }
};

/** Durable visitor id. Stable across tabs and reloads. */
export const getAnonymousId = (): string => {
  const existing = readStorage(getLocalStorage(), ANONYMOUS_ID_KEY);
  if (existing && existing.length >= 8) return existing;

  const id = generateId();
  writeStorage(getLocalStorage(), ANONYMOUS_ID_KEY, id);
  return id;
};

/**
 * Visit id with a sliding 30-minute window. Returns a new key (and persists it)
 * as soon as the previous window has expired.
 */
export const getSessionKey = (): string => {
  const storage = getSessionStorage();
  const now = Date.now();

  const key = readStorage(storage, SESSION_KEY_STORAGE);
  const lastSeenAt = Number(readStorage(storage, SESSION_TS_KEY) ?? 0);

  if (key && key.length >= 8 && now - lastSeenAt <= SESSION_TIMEOUT_MS) {
    writeStorage(storage, SESSION_TS_KEY, String(now));
    return key;
  }

  const nextKey = generateId();
  writeStorage(storage, SESSION_KEY_STORAGE, nextKey);
  writeStorage(storage, SESSION_TS_KEY, String(now));
  return nextKey;
};

/** True when the current session window has lapsed and a new session is needed. */
export const isSessionExpired = (): boolean => {
  const lastSeenAt = Number(readStorage(getSessionStorage(), SESSION_TS_KEY) ?? 0);
  return !lastSeenAt || Date.now() - lastSeenAt > SESSION_TIMEOUT_MS;
};

/**
 * Whether `POST /tracking/session/start` already succeeded for this session key.
 *
 * The activity timestamp alone cannot answer that: any event helper calling
 * `getSessionKey` keeps the window alive, so a genuine first visit would look
 * like an ongoing one and never be announced to the API. Only the provider
 * writes this flag, which makes it order-independent.
 */
export const isSessionStarted = (): boolean =>
  readStorage(getSessionStorage(), SESSION_STARTED_KEY) === '1';

export const markSessionStarted = (): void => {
  writeStorage(getSessionStorage(), SESSION_STARTED_KEY, '1');
};

/** Wipes the visit id so the next call to `getSessionKey` opens a new session. */
export const resetSessionKey = (): void => {
  const storage = getSessionStorage();
  try {
    storage?.removeItem(SESSION_KEY_STORAGE);
    storage?.removeItem(SESSION_TS_KEY);
    storage?.removeItem(SESSION_STARTED_KEY);
  } catch {
    // ignore
  }
};

function getLocalStorage(): Storage | undefined {
  try {
    return typeof window !== 'undefined' ? window.localStorage : undefined;
  } catch {
    return undefined;
  }
}

function getSessionStorage(): Storage | undefined {
  try {
    return typeof window !== 'undefined' ? window.sessionStorage : undefined;
  } catch {
    return undefined;
  }
}