import { useEffect, useId, useState } from "react";
import { useAuth } from "@/context/AuthContext";

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
      setError(err instanceof Error ? err.message : "Sign in failed");
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
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-md" aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-full max-w-md rounded-2xl border border-th-border bg-th-surface p-6 shadow-2xl shadow-slate-950/20 backdrop-blur-sm"
      >
        <h2 id={titleId} className="text-xl font-bold tracking-tight text-th-text">
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
              className="w-full rounded-lg border border-th-border bg-th-input px-3 py-2 text-sm text-th-text outline-none transition placeholder:text-th-text-muted focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
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
              className="w-full rounded-lg border border-th-border bg-th-input px-3 py-2 text-sm text-th-text outline-none transition focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          {error && (
            <p
              className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-500"
              role="alert"
            >
              {error}
            </p>
          )}

          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="order-2 rounded-lg px-4 py-2 text-sm font-semibold text-th-text-muted hover:bg-th-input sm:order-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="order-1 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-slate-900/20 transition-colors hover:bg-slate-800 disabled:opacity-50 sm:order-2"
            >
              {submitting ? "Signing in…" : "Sign in"}
            </button>
          </div>
        </form>

        <p className="mt-4 text-center text-sm text-th-text-muted">
          No account?{" "}
          <button
            type="button"
            className="font-semibold text-cyan-600 hover:text-cyan-500 hover:underline"
            onClick={() => {
              onClose();
              onOpenSignUp();
            }}
          >
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
}
