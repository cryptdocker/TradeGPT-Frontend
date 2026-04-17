/**
 * Typed wrapper around window.localStorage.
 *
 * All keys the client persists live in `STORAGE_KEYS` so a grep for one place
 * reveals everything we keep on the device, and every key is namespaced by
 * `APP_STORAGE_PREFIX` to avoid collisions with other apps on the same origin.
 */
import { APP_STORAGE_PREFIX } from "@/config/app";

const withPrefix = (name: string): string => `${APP_STORAGE_PREFIX}${name}`;

export const STORAGE_KEYS = {
  authToken: withPrefix("token"),
  authUser: withPrefix("user"),
  subscription: withPrefix("subscription"),
  theme: withPrefix("theme"),
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

/** Reads a raw string. Returns null on missing keys or storage failures. */
export function readString(key: StorageKey): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** Writes a raw string. Silently ignores quota / private-mode errors. */
export function writeString(key: StorageKey, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore quota / private mode */
  }
}

export function removeKey(key: StorageKey): void {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

/** Reads and JSON-parses a value. Returns null on missing / malformed data. */
export function readJson<T>(key: StorageKey): T | null {
  const raw = readString(key);
  if (raw === null) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/** JSON-stringifies and writes a value. */
export function writeJson<T>(key: StorageKey, value: T): void {
  try {
    writeString(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}
