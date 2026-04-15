import type { Theme } from "@/context/ThemeContext";

const THEME_KEY = "tradegpt_theme";

export function getTheme(): Theme {
  try {
    const v = localStorage.getItem(THEME_KEY);
    if (v === "light") return "light";
    return "dark";
  } catch {
    return "dark";
  }
}

export function setTheme(value: Theme): void {
  try {
    localStorage.setItem(THEME_KEY, value);
  } catch {
    // ignore quota / private mode
  }
}
