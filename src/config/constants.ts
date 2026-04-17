/**
 * Cross-cutting numeric constants (timings, sizes, limits).
 *
 * Prefer descriptive names over raw literals at call sites — this file is the
 * single place to reason about how long a toast sticks, how often we poll a
 * payment, or how large a composer can grow.
 */

/* ── Auth & verification ──────────────────────────────────── */

/** Digits in the email-verification code. */
export const EMAIL_VERIFICATION_CODE_LENGTH = 6;

/** Cooldown between "resend code" presses, in seconds. */
export const VERIFICATION_RESEND_COOLDOWN_SECONDS = 60;

/* ── Payment checkout ─────────────────────────────────────── */

/** How often we poll payment status while awaiting confirmation. */
export const PAYMENT_POLL_INTERVAL_MS = 10_000;

/** Delay before the first poll after the checkout is created. */
export const PAYMENT_POLL_INITIAL_DELAY_MS = 5_000;

/** Hold the "payment confirmed" screen this long before bubbling success up. */
export const PAYMENT_SUCCESS_HOLD_MS = 2_000;

/** Switch the countdown to a warning colour once fewer seconds remain. */
export const PAYMENT_EXPIRY_WARN_SECONDS = 300;

/* ── UI feedback ──────────────────────────────────────────── */

/** How long a "Copied" acknowledgement stays visible. */
export const COPY_FEEDBACK_RESET_MS = 2_000;

/* ── Chat composer ────────────────────────────────────────── */

/** Maximum auto-grown height of the message textarea, in pixels. */
export const COMPOSER_MAX_HEIGHT_PX = 192;

/* ── Chat follow-up suggestions ───────────────────────────── */

/**
 * If follow-up suggestions haven't arrived within this window after the
 * assistant message, the UI treats them as stale/withdrawn.
 */
export const FOLLOWUP_STALE_MS = 60_000;
