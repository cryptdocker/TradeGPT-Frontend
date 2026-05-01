/**
 * Typed wrapper around window.localStorage.
 *
 * Auth tokens are stored using the SHARED key (`cryptdocker_auth_v1`) which is
 * identical to the main CryptDocker site — signing in on either site
 * automatically authenticates the other (assuming same origin / domain).
 *
 * Non-auth keys are still namespaced with `APP_STORAGE_PREFIX`.
 */
import { APP_STORAGE_PREFIX, SHARED_AUTH_STORAGE_KEY } from "@/config/app";

const withPrefix = (name: string): string => `${APP_STORAGE_PREFIX}${name}`;

export const STORAGE_KEYS = {
  /** Shared auth blob (token + user) — same key as main site */
  sharedAuth: SHARED_AUTH_STORAGE_KEY,
  subscription: withPrefix("subscription"),
  theme: withPrefix("theme"),
} as const;

export type StorageKey = string;

/** Reads a raw string. Returns null on missing keys or storage failures. */
export function readString(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** Writes a raw string. Silently ignores quota / private-mode errors. */
export function writeString(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore quota / private mode */
  }
}

export function removeKey(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

/** Reads and JSON-parses a value. Returns null on missing / malformed data. */
export function readJson<T>(key: string): T | null {
  const raw = readString(key);
  if (raw === null) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/** JSON-stringifies and writes a value. */
export function writeJson<T>(key: string, value: T): void {
  try {
    writeString(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}
