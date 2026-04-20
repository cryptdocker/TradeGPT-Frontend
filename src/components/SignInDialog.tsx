import { useEffect, useId, useState } from "react";
import { FiLogIn, FiUserPlus, FiX, FiAlertCircle } from "react-icons/fi";
import { useAuth } from "@/context/AuthContext";
import { getDisplayErrorMessage } from "@/lib/apiError";
import { InlineSupportErrorText } from "@/components/common/InlineSupportErrorText";

type Props = {
  open: boolean;
  onClose: () => void;
  onOpenSignUp: () => void;
};

export function SignInDialog({ open, onClose, onOpenSignUp }: Props) {
  const { login } = useAuth();
  const titleId = useId();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setEmail("");
      setPassword("");
      setError(null);
    }
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      onClose();
    } catch (err) {
      setError(getDisplayErrorMessage(err, "Sign in failed"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-md" aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-full max-w-md rounded-2xl border border-th-border bg-th-surface p-6 shadow-2xl shadow-teal-900/20 backdrop-blur-sm"
      >
        <h2 id={titleId} className="flex items-center gap-2 text-xl font-bold tracking-tight text-th-text">
          <FiLogIn aria-hidden className="h-5 w-5 text-teal-500" />
          Sign in
        </h2>
        <p className="mt-1 text-sm text-th-text-muted">Welcome back to TradeGPT.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="si-email" className="mb-1 block text-xs font-semibold text-th-text-muted">
              Email
            </label>
            <input
              id="si-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-th-border bg-th-input px-3 py-2 text-sm text-th-text outline-none transition placeholder:text-th-text-muted focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
            />
          </div>
          <div>
            <label htmlFor="si-password" className="mb-1 block text-xs font-semibold text-th-text-muted">
              Password
            </label>
            <input
              id="si-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-th-border bg-th-input px-3 py-2 text-sm text-th-text outline-none transition focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
            />
          </div>

          {error && (
            <p
              className="flex items-start gap-2 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-500"
              role="alert"
            >
              <FiAlertCircle aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                <InlineSupportErrorText message={error} />
              </span>
            </p>
          )}

          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="order-2 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-th-text-muted hover:bg-th-input sm:order-1"
            >
              <FiX aria-hidden className="h-4 w-4" />
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="order-1 inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-teal-600 to-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-teal-900/30 transition-colors hover:from-teal-500 hover:to-emerald-500 disabled:opacity-50 sm:order-2"
            >
              <FiLogIn aria-hidden className="h-4 w-4" />
              {submitting ? "Signing in…" : "Sign in"}
            </button>
          </div>
        </form>

        <p className="mt-4 text-center text-sm text-th-text-muted">
          No account?{" "}
          <button
            type="button"
            className="inline-flex items-center gap-1 font-semibold text-teal-600 hover:text-teal-500 hover:underline dark:text-teal-400"
            onClick={() => {
              onClose();
              onOpenSignUp();
            }}
          >
            <FiUserPlus aria-hidden className="h-3.5 w-3.5" />
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
}
