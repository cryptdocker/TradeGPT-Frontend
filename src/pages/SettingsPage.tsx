import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useTheme, type Theme } from "@/context/ThemeContext";
import { PaymentCheckout } from "@/components/PaymentCheckout";
import {
  apiChangePassword,
  apiGetNotificationPrefs,
  apiUpdateNotificationPrefs,
  type NotificationPrefs,
} from "@/lib/api";
import { buildChatHistoryExportText, deleteAllConversations } from "@/lib/chatApi";
import { evaluatePasswordStrength, meetsMinimumPassword } from "@/lib/passwordStrength";

type SectionId = "general" | "subscription" | "notifications" | "data" | "account";

const SECTIONS: { id: SectionId; label: string }[] = [
  { id: "general", label: "General" },
  { id: "subscription", label: "Subscription" },
  { id: "notifications", label: "Notifications" },
  { id: "data", label: "Data controls" },
  { id: "account", label: "Account" },
];

const VALID_SECTIONS = new Set<string>(SECTIONS.map((s) => s.id));

function Toggle({
  checked,
  onChange,
  disabled,
  id,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  id: string;
}) {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ${
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
      } ${checked ? "bg-cyan-600" : "bg-th-border-muted"}`}
    >
      <span
        className={`pointer-events-none absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-md ring-0 transition-transform duration-200 ${
          checked ? "translate-x-[1.25rem]" : "translate-x-0"
        }`}
      />
    </button>
  );
}

function SettingsRow({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-th-border py-5 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-th-text">{title}</p>
        {description && <p className="mt-1 text-sm text-th-text-muted">{description}</p>}
      </div>
      <div className="flex shrink-0 items-center justify-start sm:justify-end">{children}</div>
    </div>
  );
}

const THEME_OPTIONS: { value: Theme; label: string }[] = [
  { value: "dark", label: "Dark" },
  { value: "light", label: "Light" },
];

export function SettingsPage() {
  const { section: urlSection } = useParams<{ section?: string }>();
  const navigate = useNavigate();
  const { user, token, subscription, refreshSubscription, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const section: SectionId = urlSection && VALID_SECTIONS.has(urlSection) ? (urlSection as SectionId) : "general";
  const [showCheckout, setShowCheckout] = useState(false);

  const [notifPrefs, setNotifPrefs] = useState<NotificationPrefs | null>(null);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifError, setNotifError] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const notifFetched = useRef(false);

  useEffect(() => {
    if (section !== "notifications" || !token || notifFetched.current) return;
    notifFetched.current = true;
    setNotifLoading(true);
    apiGetNotificationPrefs(token)
      .then(setNotifPrefs)
      .catch((e) => setNotifError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setNotifLoading(false));
  }, [section, token]);

  const handleNotifChange = useCallback(
    async (field: keyof NotificationPrefs, value: boolean) => {
      if (!token) return;
      setNotifPrefs((prev) => (prev ? { ...prev, [field]: value } : prev));
      try {
        const updated = await apiUpdateNotificationPrefs(token, { [field]: value });
        setNotifPrefs(updated);
        setNotifError(null);
      } catch (e) {
        setNotifPrefs((prev) => (prev ? { ...prev, [field]: !value } : prev));
        setNotifError(e instanceof Error ? e.message : "Failed to update");
      }
    },
    [token],
  );

  const goBack = useCallback(() => navigate("/chat"), [navigate]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (deleteConfirmOpen || passwordModalOpen) return;
      if (e.key === "Escape") goBack();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goBack, deleteConfirmOpen, passwordModalOpen]);

  const handleLogout = useCallback(() => {
    logout();
    navigate("/auth");
  }, [logout, navigate]);

  const [exportLoading, setExportLoading] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleExportChats = useCallback(async () => {
    if (!token) return;
    setExportError(null);
    setExportLoading(true);
    try {
      const text = await buildChatHistoryExportText(token);
      const stamp = new Date().toISOString().slice(0, 10);
      const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tradegpt-chat-export-${stamp}.txt`;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setExportError(e instanceof Error ? e.message : "Export failed");
    } finally {
      setExportLoading(false);
    }
  }, [token]);

  const handleDeleteAllChats = useCallback(async () => {
    if (!token) return;
    setDeleteError(null);
    setDeleteSuccess(null);
    setDeleteLoading(true);
    try {
      const result = await deleteAllConversations(token);
      setDeleteSuccess(
        `Deleted ${result.deletedConversations} conversation${result.deletedConversations === 1 ? "" : "s"}.`,
      );
      setDeleteConfirmOpen(false);
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeleteLoading(false);
    }
  }, [token]);

  const passwordStrength = evaluatePasswordStrength(newPassword);
  const canSubmitPassword =
    currentPassword.length > 0 &&
    newPassword.length > 0 &&
    confirmPassword.length > 0 &&
    newPassword === confirmPassword &&
    meetsMinimumPassword(newPassword);

  const resetPasswordState = useCallback(() => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordError(null);
  }, []);

  const openPasswordModal = useCallback(() => {
    setPasswordSuccess(null);
    resetPasswordState();
    setPasswordModalOpen(true);
  }, [resetPasswordState]);

  const closePasswordModal = useCallback(() => {
    if (passwordSubmitting) return;
    setPasswordModalOpen(false);
    resetPasswordState();
  }, [passwordSubmitting, resetPasswordState]);

  const handleChangePassword = useCallback(async () => {
    if (!token || !canSubmitPassword) return;
    setPasswordError(null);
    setPasswordSubmitting(true);
    try {
      const result = await apiChangePassword(token, {
        currentPassword,
        newPassword,
        confirmPassword,
      });
      setPasswordSuccess(result.message || "Password changed successfully");
      setPasswordModalOpen(false);
      resetPasswordState();
    } catch (e) {
      setPasswordError(e instanceof Error ? e.message : "Failed to change password");
    } finally {
      setPasswordSubmitting(false);
    }
  }, [token, canSubmitPassword, currentPassword, newPassword, confirmPassword, resetPasswordState]);

  const userEmail = user?.email ?? "";

  return (
    <div className="flex h-[100dvh] w-full flex-col bg-th-bg text-th-text">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-th-border px-3 md:px-4">
        <button
          type="button"
          onClick={goBack}
          className="rounded-lg p-2 text-th-text hover:bg-th-surface"
          aria-label="Back to chat"
        >
          <BackIcon />
        </button>
        <h1 className="text-lg font-semibold">Settings</h1>
      </header>

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <nav
          className="flex shrink-0 gap-0.5 overflow-x-auto border-b border-th-border px-2 py-2 md:w-56 md:flex-col md:border-b-0 md:border-r md:px-2 md:py-4"
          aria-label="Settings sections"
        >
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => navigate(`/settings/${s.id}`, { replace: true })}
              className={`whitespace-nowrap rounded-lg px-3 py-2.5 text-left text-sm transition-colors md:w-full ${
                section === s.id
                  ? "bg-th-surface text-th-text"
                  : "text-th-text-muted hover:bg-th-surface/60 hover:text-th-text"
              }`}
            >
              {s.label}
            </button>
          ))}
        </nav>

        <main className="min-h-0 flex-1 overflow-y-auto px-4 py-6 md:px-10 md:py-8">
          <div className="mx-auto max-w-2xl">
            {section === "general" && (
              <>
                <h2 className="text-2xl font-semibold text-th-text">General</h2>
                <p className="mt-1 text-sm text-th-text-muted">
                  Manage how TradeGPT looks and feels on this device.
                </p>
                <div className="mt-6">
                  <SettingsRow
                    title="Theme"
                    description="Choose how TradeGPT appears. More themes may be added later."
                  >
                    <div className="flex flex-wrap gap-2">
                      {THEME_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setTheme(opt.value)}
                          className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                            theme === opt.value
                              ? "border-cyan-600 bg-cyan-500/10 text-th-text"
                              : "border-th-border text-th-text-muted hover:border-th-text-muted hover:text-th-text"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </SettingsRow>
                  <SettingsRow
                    title="Language"
                    description="TradeGPT will use this language when possible."
                  >
                    <span className="text-sm text-th-text-muted">English (US)</span>
                  </SettingsRow>
                </div>
              </>
            )}

            {section === "subscription" && (
              <>
                <h2 className="text-2xl font-semibold text-th-text">Subscription</h2>
                <p className="mt-1 text-sm text-th-text-muted">
                  Manage your plan and billing.
                </p>
                <div className="mt-6">
                  {subscription ? (
                    <>
                        <div className="rounded-xl border border-th-border bg-th-surface p-5 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-full ${
                              subscription.plan === "pro"
                                ? "bg-gradient-to-br from-cyan-500 to-sky-600"
                                : subscription.trialActive
                                  ? "bg-gradient-to-br from-cyan-500 to-teal-600"
                                  : "bg-th-border-muted"
                            }`}
                          >
                            {subscription.plan === "pro" ? (
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-white">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                              </svg>
                            ) : (
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M12 6v6l4 2" strokeLinecap="round" />
                              </svg>
                            )}
                          </div>
                          <div>
                            <p className="text-base font-semibold text-th-text">
                              {subscription.plan === "pro"
                                ? "Pro Plan"
                                : subscription.trialActive
                                  ? "Free Trial"
                                  : "Free Plan"}
                            </p>
                            <p className="text-sm text-th-text-muted">{subscription.label}</p>
                          </div>
                        </div>

                        {subscription.trialActive && (
                          <div className="mt-4">
                            <div className="flex items-center justify-between text-xs text-th-text-muted">
                              <span>Trial progress</span>
                              <span>{subscription.trialDaysLeft} day{subscription.trialDaysLeft === 1 ? "" : "s"} remaining</span>
                            </div>
                            <div className="mt-1.5 h-2 w-full rounded-full bg-th-border-muted">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  subscription.trialDaysLeft <= 2
                                    ? "bg-gradient-to-r from-amber-500 to-orange-500"
                                    : "bg-gradient-to-r from-cyan-500 to-teal-500"
                                }`}
                                style={{ width: `${Math.max(5, ((7 - subscription.trialDaysLeft) / 7) * 100)}%` }}
                              />
                            </div>
                            <p className="mt-2 text-xs text-th-text-muted">
                              Trial ends on {new Date(subscription.trialEndsAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                            </p>
                          </div>
                        )}

                        {!subscription.trialActive && subscription.plan === "free" && (
                          <p className="mt-3 text-xs text-th-text-muted">
                            Your free trial has ended. Upgrade to Pro for unlimited access.
                          </p>
                        )}
                      </div>

                      {subscription.plan !== "pro" && !showCheckout && (
                        <div className="mt-6 rounded-xl border border-cyan-500/25 bg-cyan-500/5 p-5">
                          <div className="flex items-baseline justify-between">
                            <h3 className="text-base font-semibold text-th-text">Upgrade to Pro</h3>
                            <p className="text-lg font-bold text-cyan-500">
                              14.99 <span className="text-xs font-normal text-th-text-muted">USD/mo</span>
                            </p>
                          </div>
                          <p className="mt-1 text-sm text-th-text-muted">
                            Get unlimited access to all trading modes, priority responses, and advanced features.
                          </p>
                          <ul className="mt-3 space-y-1.5 text-sm text-th-text">
                            <li className="flex items-center gap-2">
                              <CheckIcon />
                              Unlimited conversations
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckIcon />
                              All 7 trading modes
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckIcon />
                              Priority response speed
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckIcon />
                              Advanced market analysis
                            </li>
                          </ul>
                          <button
                            type="button"
                            onClick={() => setShowCheckout(true)}
                            className="mt-4 w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-800"
                          >
                            Upgrade — 14.99 USDT / USDC
                          </button>
                          <p className="mt-2 text-center text-xs text-th-text-muted">
                            Pay with USDT or USDC on ETH, BSC, Tron, or Solana
                          </p>
                        </div>
                      )}

                      {subscription.plan !== "pro" && showCheckout && token && (
                        <div className="mt-6 rounded-xl border border-cyan-500/25 bg-cyan-500/5 p-5">
                          <PaymentCheckout
                            token={token}
                            onSuccess={() => {
                              setShowCheckout(false);
                              refreshSubscription();
                            }}
                            onCancel={() => setShowCheckout(false)}
                          />
                        </div>
                      )}

                      <SettingsRow
                        title="Account created"
                        description="The date your TradeGPT account was created."
                      >
                        <span className="text-sm text-th-text-muted">
                          {new Date(subscription.accountCreatedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                        </span>
                      </SettingsRow>
                    </>
                  ) : (
                    <p className="text-sm text-th-text-muted">Loading subscription info…</p>
                  )}
                </div>
              </>
            )}

            {section === "notifications" && (
              <>
                <h2 className="text-2xl font-semibold text-th-text">Notifications</h2>
                <p className="mt-1 text-sm text-th-text-muted">
                  Choose what we notify you about by email.
                </p>
                <div className="mt-6">
                  {notifLoading && !notifPrefs && (
                    <p className="text-sm text-th-text-muted">Loading preferences…</p>
                  )}
                  {notifError && (
                    <p className="mb-4 rounded-lg border border-red-900/50 bg-red-950/30 px-3 py-2 text-sm text-red-300">
                      {notifError}
                    </p>
                  )}
                  <SettingsRow
                    title="Product updates and tips"
                    description="Occasional emails about new features and trading tips."
                  >
                    <Toggle
                      id="notif-product"
                      checked={notifPrefs?.productUpdates ?? false}
                      onChange={(v) => handleNotifChange("productUpdates", v)}
                      disabled={!notifPrefs}
                    />
                  </SettingsRow>
                  <SettingsRow
                    title="Marketing"
                    description="News and offers from TradeGPT."
                  >
                    <Toggle
                      id="notif-marketing"
                      checked={notifPrefs?.marketing ?? false}
                      onChange={(v) => handleNotifChange("marketing", v)}
                      disabled={!notifPrefs}
                    />
                  </SettingsRow>
                </div>
              </>
            )}

            {section === "data" && (
              <>
                <h2 className="text-2xl font-semibold text-th-text">Data controls</h2>
                <p className="mt-1 text-sm text-th-text-muted">
                  Export or remove your data from this device and account.
                </p>
                <div className="mt-6">
                  {exportError && (
                    <p className="mb-4 rounded-lg border border-red-900/50 bg-red-950/30 px-3 py-2 text-sm text-red-300">
                      {exportError}
                    </p>
                  )}
                  {deleteError && (
                    <p className="mb-4 rounded-lg border border-red-900/50 bg-red-950/30 px-3 py-2 text-sm text-red-300">
                      {deleteError}
                    </p>
                  )}
                  {deleteSuccess && (
                    <p className="mb-4 rounded-lg border border-emerald-900/50 bg-emerald-950/30 px-3 py-2 text-sm text-emerald-300">
                      {deleteSuccess}
                    </p>
                  )}
                  <SettingsRow
                    title="Export data"
                    description="Download all conversations as a plain text file (UTF-8)."
                  >
                    <button
                      type="button"
                      disabled={!token || exportLoading}
                      onClick={() => void handleExportChats()}
                      className="rounded-lg border border-th-border px-4 py-2 text-sm text-th-text transition-colors hover:bg-th-surface disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {exportLoading ? "Exporting…" : "Export"}
                    </button>
                  </SettingsRow>
                  <SettingsRow
                    title="Delete all conversations"
                    description="Permanently delete every chat. This cannot be undone."
                  >
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmOpen(true)}
                      disabled={!token || deleteLoading}
                      className="rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-2 text-sm text-red-200/80 transition-colors hover:bg-red-900/30 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200/80"
                    >
                      {deleteLoading ? "Deleting…" : "Delete all"}
                    </button>
                  </SettingsRow>
                  <p className="pt-4 text-xs text-th-text-muted">
                    Deleting all conversations removes every chat and message from your account.
                  </p>
                </div>
              </>
            )}

            {section === "account" && (
              <>
                <h2 className="text-2xl font-semibold text-th-text">Account</h2>
                <p className="mt-1 text-sm text-th-text-muted">
                  Manage your sign-in and session.
                </p>
                <div className="mt-6">
                  {passwordSuccess && (
                    <p className="mb-4 rounded-lg border border-emerald-900/50 bg-emerald-950/30 px-3 py-2 text-sm text-emerald-300">
                      {passwordSuccess}
                    </p>
                  )}
                  <SettingsRow title="Email" description="The address you use to sign in.">
                    <span className="max-w-[220px] truncate text-sm text-th-text" title={userEmail}>
                      {userEmail}
                    </span>
                  </SettingsRow>
                  <SettingsRow
                    title="Password"
                    description="Change your password from account security when available."
                  >
                    <button
                      type="button"
                      onClick={openPasswordModal}
                      className="rounded-lg border border-th-border px-4 py-2 text-sm text-th-text hover:bg-th-surface"
                    >
                      Change
                    </button>
                  </SettingsRow>
                  <SettingsRow
                    title="Log out"
                    description="Sign out on this browser. You can sign back in anytime."
                  >
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="rounded-lg border border-th-border px-4 py-2 text-sm text-th-text hover:bg-th-surface"
                    >
                      Log out
                    </button>
                  </SettingsRow>
                </div>
              </>
            )}
          </div>
        </main>
      </div>

      {deleteConfirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !deleteLoading) setDeleteConfirmOpen(false);
          }}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" aria-hidden />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-all-title"
            className="relative w-full max-w-md rounded-2xl border border-red-900/50 bg-th-surface p-6 shadow-2xl"
          >
            <div className="mb-4 flex items-start gap-3">
              <div className="mt-0.5 rounded-full bg-red-950/40 p-2 text-red-300">
                <WarningIcon />
              </div>
              <div>
                <h3 id="delete-all-title" className="text-lg font-semibold text-th-text">
                  Delete all conversations?
                </h3>
                <p className="mt-1 text-sm text-th-text-muted">
                  This action is permanent and cannot be undone. All chats and messages will be removed.
                </p>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={deleteLoading}
                onClick={() => setDeleteConfirmOpen(false)}
                className="rounded-lg border border-th-border px-4 py-2 text-sm text-th-text hover:bg-th-input disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteLoading}
                onClick={() => void handleDeleteAllChats()}
                className="rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-2 text-sm font-medium text-red-200 transition-colors hover:bg-red-900/30 disabled:opacity-50"
              >
                {deleteLoading ? "Deleting…" : "Yes, delete all"}
              </button>
            </div>
          </div>
        </div>
      )}

      {passwordModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !passwordSubmitting) closePasswordModal();
          }}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" aria-hidden />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="change-password-title"
            className="relative w-full max-w-md rounded-2xl border border-th-border bg-th-surface p-6 shadow-2xl"
          >
            <div className="mb-4 flex items-start gap-3">
              <div className="mt-0.5 rounded-full bg-th-input p-2 text-th-text">
                <LockIcon />
              </div>
              <div>
                <h3 id="change-password-title" className="text-lg font-semibold text-th-text">
                  Change password
                </h3>
                <p className="mt-1 text-sm text-th-text-muted">
                  Use a strong password with upper/lower case letters, numbers, and symbols.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-th-text-muted">Current password</span>
                <input
                  type="password"
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full rounded-lg border border-th-border bg-th-input px-3 py-2 text-sm text-th-text outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-th-text-muted">New password</span>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-lg border border-th-border bg-th-input px-3 py-2 text-sm text-th-text outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-th-text-muted">Confirm new password</span>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-lg border border-th-border bg-th-input px-3 py-2 text-sm text-th-text outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                />
              </label>
              {newPassword.length > 0 && (
                <p className="text-xs text-th-text-muted">
                  Strength:{" "}
                  <span
                    className={
                      passwordStrength.level === "weak"
                        ? "text-red-400"
                        : passwordStrength.level === "medium"
                          ? "text-amber-400"
                          : "text-teal-400"
                    }
                  >
                    {passwordStrength.level}
                  </span>
                </p>
              )}
              {confirmPassword.length > 0 && newPassword !== confirmPassword && (
                <p className="text-xs text-red-300">New passwords do not match.</p>
              )}
              {passwordError && (
                <p className="rounded-lg border border-red-900/50 bg-red-950/30 px-3 py-2 text-sm text-red-300">
                  {passwordError}
                </p>
              )}
            </div>

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={passwordSubmitting}
                onClick={closePasswordModal}
                className="rounded-lg border border-th-border px-4 py-2 text-sm text-th-text hover:bg-th-input disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={passwordSubmitting || !canSubmitPassword}
                onClick={() => void handleChangePassword()}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {passwordSubmitting ? "Saving…" : "Update password"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BackIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-violet-400">
      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 9v4" strokeLinecap="round" />
      <path d="M12 17h.01" strokeLinecap="round" />
      <path
        d="M10.29 3.86 1.82 18a2 2 0 0 0 1.72 3h16.92a2 2 0 0 0 1.72-3L13.71 3.86a2 2 0 0 0-3.42 0z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="11" width="18" height="10" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
