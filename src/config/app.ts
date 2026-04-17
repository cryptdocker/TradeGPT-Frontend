/**
 * Branding and top-level app metadata.
 *
 * Values in this file are stable across builds and reflect the product itself,
 * not its environment (env.ts) or runtime tuning (constants.ts).
 */

export const APP_NAME = "TradeGPT";
export const APP_VENDOR = "CryptDocker";

/** Prefix applied to every localStorage key written by the client. */
export const APP_STORAGE_PREFIX = "tradegpt_";

/** Default Pro plan monthly price (USD). Overridden by the server when known. */
export const DEFAULT_PRO_PRICE_USD = 14.99;

/** Length of the free trial window, in days. */
export const FREE_TRIAL_DAYS = 7;
