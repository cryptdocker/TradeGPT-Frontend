/**
 * Typed accessor for Vite environment variables.
 *
 * Every `import.meta.env.*` read in the app should go through this module so
 * we have one place to validate, normalise and document runtime configuration.
 */

function readEnv(name: keyof ImportMetaEnv): string {
  const raw = import.meta.env[name];
  return typeof raw === "string" ? raw.trim() : "";
}

/**
 * Base URL for the TradeGPT backend (no trailing slash).
 * Empty string means "same origin", which is the intended dev fallback.
 */
export const API_BASE: string = readEnv("VITE_API_URL").replace(/\/+$/, "");

/** True while running under `vite` dev server. */
export const IS_DEV: boolean = import.meta.env.DEV;

/** True while running a production build. */
export const IS_PROD: boolean = import.meta.env.PROD;
