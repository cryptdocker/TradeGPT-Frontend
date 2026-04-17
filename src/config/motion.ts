/**
 * Shared framer-motion transition presets.
 *
 * Every animated surface in the app should draw from this module so motion
 * feels consistent across screens and so reduced-motion fallbacks stay in
 * one place. Each factory takes the current `useReducedMotion()` result and
 * returns a ready-to-spread `Transition`.
 */
import type { Transition } from "framer-motion";

type ReduceMotion = boolean | null | undefined;

/* ── Easing curves ────────────────────────────────────────── */

/** CSS `ease` analogue — balanced in/out for utility fades. */
const EASE_STANDARD = [0.25, 0.1, 0.25, 1] as const;

/** Soft ease-out used for entrances (backdrops, drawers settling in). */
const EASE_OUT_SOFT = [0.22, 1, 0.36, 1] as const;

/** Sharper ease-in used for exits (panels leaving the screen). */
const EASE_IN_SHARP = [0.4, 0, 1, 1] as const;

/* ── Reduced-motion durations ─────────────────────────────── */

/** Duration used for instant-looking reduced-motion fades. */
const REDUCED_FADE_SEC = 0.1;

/** Duration used for reduced-motion structural transitions. */
const REDUCED_FAST_SEC = 0.12;

/* ── Sidebar ──────────────────────────────────────────────── */

/** Sidebar rail ↔ expanded width animation. */
export function sidebarWidthTransition(reduceMotion: ReduceMotion): Transition {
  return reduceMotion
    ? { duration: 0.18, ease: EASE_STANDARD }
    : { type: "spring", stiffness: 420, damping: 38, mass: 0.78 };
}

/** Crossfade between collapsed / expanded sidebar contents. */
export function sidebarContentTransition(reduceMotion: ReduceMotion): Transition {
  return reduceMotion
    ? { duration: REDUCED_FAST_SEC, ease: EASE_STANDARD }
    : { type: "spring", stiffness: 480, damping: 42, mass: 0.65 };
}

/** Mobile drawer slide-in / slide-out. */
export function drawerTransition(reduceMotion: ReduceMotion): Transition {
  return reduceMotion
    ? { duration: 0.22, ease: EASE_STANDARD }
    : { type: "spring", stiffness: 380, damping: 34, mass: 0.72 };
}

/* ── Modal & backdrop ─────────────────────────────────────── */

/** Fade for modal / drawer backdrops (enter). */
export function backdropFadeTransition(reduceMotion: ReduceMotion): Transition {
  return reduceMotion
    ? { duration: REDUCED_FADE_SEC }
    : { duration: 0.22, ease: EASE_OUT_SOFT };
}

/** Modal panel entry (used as `transition` on the panel itself). */
export function modalPanelTransition(reduceMotion: ReduceMotion): Transition {
  return reduceMotion
    ? { duration: REDUCED_FAST_SEC, ease: EASE_STANDARD }
    : { type: "spring", stiffness: 400, damping: 34, mass: 0.78 };
}

/**
 * Modal panel exit transition.
 * Spread into the inner `transition` field of an `exit` variant, e.g.:
 *
 *   exit={{ opacity: 0, y: 16, scale: 0.97, transition: modalPanelExitTransition(rm) }}
 */
export function modalPanelExitTransition(reduceMotion: ReduceMotion): Transition {
  return reduceMotion
    ? { duration: REDUCED_FADE_SEC }
    : { duration: 0.18, ease: EASE_IN_SHARP };
}

/* ── Popover & dropdown ───────────────────────────────────── */

/** Compact popover / dropdown entry (account menu, mode select). */
export function popoverTransition(reduceMotion: ReduceMotion): Transition {
  return reduceMotion
    ? { duration: REDUCED_FAST_SEC, ease: EASE_STANDARD }
    : { type: "spring", stiffness: 520, damping: 32, mass: 0.68 };
}

/** Compact popover / dropdown exit. Spread into an `exit` variant's `transition`. */
export function popoverExitTransition(reduceMotion: ReduceMotion): Transition {
  return reduceMotion
    ? { duration: REDUCED_FADE_SEC }
    : { duration: 0.16, ease: EASE_IN_SHARP };
}
