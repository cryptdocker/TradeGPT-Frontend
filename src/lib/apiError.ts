type ApiErrorPayload = {
  error?: unknown;
  message?: unknown;
  details?: unknown;
  code?: unknown;
};

const NETWORK_ISSUE_MESSAGE =
  "Network issue: We couldn't reach the server. Please check your internet connection and try again.";
const SERVICE_ISSUE_MESSAGE =
  "Something went wrong. Please try again in a moment.";
const SUPPORT_CONTACT_MESSAGE =
  "We couldn't complete your request right now. Please contact our support team.";

function asNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function extractRawErrorMessage(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const payload = data as ApiErrorPayload;

  const direct =
    asNonEmptyString(payload.error) ??
    asNonEmptyString(payload.message) ??
    asNonEmptyString(payload.code);
  if (direct) return direct;

  if (Array.isArray(payload.details)) {
    const first = payload.details.map((x) => asNonEmptyString(x)).find(Boolean);
    if (first) return first;
  }
  return asNonEmptyString(payload.details);
}

export function toUserFriendlyErrorMessage(
  rawMessage: string | null | undefined,
  fallback = "Something went wrong. Please try again.",
): string {
  const raw = (rawMessage ?? "").toLowerCase();
  if (!raw) return fallback;

  if (
    raw.includes("jwt") ||
    raw.includes("token") ||
    raw.includes("unauthorized") ||
    raw.includes("not authorized")
  ) {
    return "Your session expired. Please sign in again.";
  }
  if (raw.includes("forbidden")) {
    return "You don't have permission to do that.";
  }
  if (raw.includes("not found") || raw.includes("conversation not found")) {
    return "We couldn't find that item. Please refresh and try again.";
  }
  if (raw.includes("already exists") || raw.includes("duplicate")) {
    return "That already exists. Try a different value.";
  }
  if (
    raw.includes("invalid") ||
    raw.includes("validation") ||
    raw.includes("malformed") ||
    raw.includes("bad request")
  ) {
    return "Some information looks invalid. Please check your input and try again.";
  }
  if (raw.includes("password")) {
    return "Please check your password details and try again.";
  }
  if (raw.includes("too many request") || raw.includes("rate limit")) {
    return "You're doing that too often. Please wait a moment and try again.";
  }

  if (
    raw.includes("api key") ||
    raw.includes("invalid key") ||
    raw.includes("missing key") ||
    raw.includes("provider key") ||
    raw.includes("openai") ||
    raw.includes("anthropic")
  ) {
    return SUPPORT_CONTACT_MESSAGE;
  }

  if (
    raw.includes("timeout") ||
    raw.includes("timed out") ||
    raw.includes("network") ||
    raw.includes("failed to fetch") ||
    raw.includes("econn")
  ) {
    return NETWORK_ISSUE_MESSAGE;
  }
  if (
    raw.includes("server error") ||
    raw.includes("internal") ||
    raw.includes("upstream") ||
    raw.includes("service unavailable") ||
    raw.includes("gateway")
  ) {
    return SERVICE_ISSUE_MESSAGE;
  }

  return fallback;
}

export function getApiErrorMessage(data: unknown, fallback: string): string {
  const raw = extractRawErrorMessage(data);
  return toUserFriendlyErrorMessage(raw, fallback);
}

export function getDisplayErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    return toUserFriendlyErrorMessage(error.message, fallback);
  }
  return fallback;
}
