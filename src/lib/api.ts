import { API_BASE } from "@/config/env";
import { getApiErrorMessage } from "@/lib/apiError";

export type AuthUser = {
  uuid: string;
  email: string;
  fullName?: string;
  avatar?: string;
};

export type SubscriptionInfo = {
  plan: "free" | "pro";
  label: string;
  trialActive: boolean;
  trialDaysLeft: number;
  trialEndsAt: string;
  accountCreatedAt: string;
};

export async function apiRegister(body: {
  email: string;
  password: string;
  confirmPassword: string;
}): Promise<{ message: string; email: string }> {
  const res = await fetch(`${API_BASE}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(getApiErrorMessage(data, "Unable to create your account."));
  return data;
}

export async function apiVerifyEmail(body: {
  email: string;
  code: string;
}): Promise<{ token: string; user: AuthUser; subscription?: SubscriptionInfo }> {
  const res = await fetch(`${API_BASE}/api/auth/verify-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(getApiErrorMessage(data, "Unable to verify your email."));
  return data;
}

export async function apiResendCode(body: {
  email: string;
}): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/api/auth/resend-code`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(getApiErrorMessage(data, "Unable to resend the verification code."));
  return data;
}

export async function apiLogin(body: {
  email: string;
  password: string;
}): Promise<{ token: string; user: AuthUser; subscription?: SubscriptionInfo }> {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(getApiErrorMessage(data, "Unable to sign you in."));
  return data;
}

export async function apiGoogleLogin(body: {
  idToken: string;
}): Promise<{ token: string; user: AuthUser; subscription?: SubscriptionInfo }> {
  const res = await fetch(`${API_BASE}/api/auth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(getApiErrorMessage(data, "Google sign-in failed."));
  return data;
}

export async function apiGoogleCodeLogin(body: {
  code: string;
}): Promise<{ token: string; user: AuthUser; subscription?: SubscriptionInfo }> {
  const res = await fetch(`${API_BASE}/api/auth/google/code`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(getApiErrorMessage(data, "Google sign-in failed."));
  return data;
}

export async function apiMe(token: string): Promise<{ user: AuthUser; subscription?: SubscriptionInfo }> {
  const res = await fetch(`${API_BASE}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(getApiErrorMessage(data, "Session expired."));
  return data;
}

export async function apiChangePassword(
  token: string,
  body: { currentPassword: string; newPassword: string; confirmPassword: string },
): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/api/auth/change-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(getApiErrorMessage(data, "Unable to change your password."));
  return data;
}

export async function apiGetSubscription(token: string): Promise<SubscriptionInfo> {
  const res = await fetch(`${API_BASE}/api/subscription/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(getApiErrorMessage(data, "Unable to load your subscription details."));
  return data.subscription;
}

export type PaymentNetworkId = "eth" | "bsc" | "tron" | "sol";
export type PaymentTokenId = "usdt" | "usdc";

export type NetworkOption = {
  id: PaymentNetworkId;
  label: string;
  tokens: PaymentTokenId[];
};

export type CheckoutInfo = {
  paymentId: string;
  addressIn: string;
  amount: number;
  network: PaymentNetworkId;
  token: PaymentTokenId;
  networkLabel: string;
  qrCode: string | null;
  expiresAt: string;
  status: string;
};

export type PaymentStatusInfo = {
  paymentId: string;
  status: "pending" | "confirming" | "confirmed" | "expired";
  amount: number;
  network: PaymentNetworkId;
  token: PaymentTokenId;
  addressIn: string;
  expiresAt: string;
  subscription?: SubscriptionInfo;
};

export async function apiFetchPaymentNetworks(): Promise<{ networks: NetworkOption[]; price: number }> {
  const res = await fetch(`${API_BASE}/api/payment/networks`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(getApiErrorMessage(data, "Unable to load payment options."));
  return data;
}

export type CheckoutResult =
  | (CheckoutInfo & { confirmed?: never })
  | { confirmed: true; subscription: SubscriptionInfo };

export async function apiCreateCheckout(
  token: string,
  network: PaymentNetworkId,
  payToken: PaymentTokenId,
): Promise<CheckoutResult> {
  const res = await fetch(`${API_BASE}/api/payment/create-checkout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ network, token: payToken }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(getApiErrorMessage(data, "Unable to start checkout right now."));
  return data;
}

export async function apiGetPaymentStatus(token: string, paymentId: string): Promise<PaymentStatusInfo> {
  const res = await fetch(`${API_BASE}/api/payment/status/${paymentId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(getApiErrorMessage(data, "Unable to check payment status right now."));
  return data;
}

export async function apiCancelPayment(token: string, paymentId: string): Promise<void> {
  await fetch(`${API_BASE}/api/payment/cancel/${paymentId}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function apiCheckPaymentLogs(token: string, paymentId: string): Promise<PaymentStatusInfo> {
  const res = await fetch(`${API_BASE}/api/payment/check-logs/${paymentId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(getApiErrorMessage(data, "Unable to verify payment right now."));
  return data;
}

/* ── Notification preferences ────────────────────────────── */

export type NotificationPrefs = {
  productUpdates: boolean;
  marketing: boolean;
};

export async function apiGetNotificationPrefs(token: string): Promise<NotificationPrefs> {
  const res = await fetch(`${API_BASE}/api/user/notifications`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(getApiErrorMessage(data, "Unable to load notification preferences."));
  return data.notifications;
}

export async function apiUpdateNotificationPrefs(
  token: string,
  prefs: Partial<NotificationPrefs>,
): Promise<NotificationPrefs> {
  const res = await fetch(`${API_BASE}/api/user/notifications`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(prefs),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(getApiErrorMessage(data, "Unable to update notification preferences."));
  return data.notifications;
}
