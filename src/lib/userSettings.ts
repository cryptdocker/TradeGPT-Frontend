import type { Theme } from "@/context/ThemeContext";
import { STORAGE_KEYS, readString, writeString } from "@/config/storage";

export function getTheme(): Theme {
  return readString(STORAGE_KEYS.theme) === "light" ? "light" : "dark";
}

export function setTheme(value: Theme): void {
  writeString(STORAGE_KEYS.theme, value);
}
