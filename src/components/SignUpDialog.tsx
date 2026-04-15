import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { evaluatePasswordStrength, meetsMinimumPassword } from "@/lib/passwordStrength";
import { PasswordStrengthIndicator } from "@/components/PasswordStrengthIndicator";

type Props = {
  open: boolean;
  onClose: () => void;
  onOpenSignIn: () => void;
};

type Step = "credentials" | "verify";

export function SignUpDialog({ open, onClose, onOpenSignIn }: Props) {
  const { register, verifyEmail, resendCode } = useAuth();
  const titleId = useId();

  const [step, setStep] = useState<Step>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [resendCooldown, setResendCooldown] = useState(0);

  const strength = evaluatePasswordStrength(password);

  useEffect(() => {
    if (!open) {
      setStep("credentials");
      setEmail("");
      setPassword("");
      setConfirm("");
      setDigits(["", "", "", "", "", ""]);
      setError(null);
      setResendCooldown(0);
    }
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  useEffect(() => {
    if (step === "verify") {
      inputRefs.current[0]?.focus();
    }
  }, [step]);

  const handleDigitChange = useCallback(
    (index: number, value: string) => {
      if (!/^\d?$/.test(value)) return;
      const next = [...digits];
      next[index] = value;
      setDigits(next);
      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    },
    [digits]
  );

  const handleDigitKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace" && !digits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    },
    [digits]
  );

  const handleDigitPaste = useCallback(
    (e: React.ClipboardEvent) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
      if (!pasted) return;
      const next = [...digits];
      for (let i = 0; i < 6; i++) {
        next[i] = pasted[i] ?? "";
      }
      setDigits(next);
      const focusIdx = Math.min(pasted.length, 5);
      inputRefs.current[focusIdx]?.focus();
    },
    [digits]
  );

  if (!open) return null;

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    if (!meetsMinimumPassword(password)) {
      setError("Choose a stronger password (see checklist below)");
      return;
    }
    setSubmitting(true);
    try {
      await register(email.trim(), password, confirm);
      setResendCooldown(60);
      setStep("verify");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign up failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const code = digits.join("");
    if (code.length !== 6) {
      setError("Please enter the full 6-digit code");
      return;
    }
    setSubmitting(true);
    try {
      await verifyEmail(email.trim(), code);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResend() {
    setError(null);
    try {
      await resendCode(email.trim());
      setResendCooldown(60);
      setDigits(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend code");
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
        {step === "credentials" ? (
          <>
            <h2 id={titleId} className="text-xl font-bold tracking-tight text-th-text">
              Create account
            </h2>
            <p className="mt-1 text-sm text-th-text-muted">Join TradeGPT with a secure password.</p>

            <form onSubmit={handleCredentials} className="mt-6 space-y-4">
              <div>
                <label htmlFor="su-email" className="mb-1 block text-xs font-semibold text-th-text-muted">
                  Email
                </label>
                <input
                  id="su-email"
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
                <label htmlFor="su-password" className="mb-1 block text-xs font-semibold text-th-text-muted">
                  Password
                </label>
                <input
                  id="su-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-th-border bg-th-input px-3 py-2 text-sm text-th-text outline-none transition focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                />
                {password.length > 0 && (
                  <PasswordStrengthIndicator strength={strength} className="mt-3" />
                )}
              </div>
              <div>
                <label htmlFor="su-confirm" className="mb-1 block text-xs font-semibold text-th-text-muted">
                  Confirm password
                </label>
                <input
                  id="su-confirm"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full rounded-lg border border-th-border bg-th-input px-3 py-2 text-sm text-th-text outline-none transition focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                />
                {confirm.length > 0 && password !== confirm && (
                  <p className="mt-1 text-xs font-medium text-red-500">Passwords do not match</p>
                )}
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
                  {submitting ? "Sending code…" : "Continue"}
                </button>
              </div>
            </form>

            <p className="mt-4 text-center text-sm text-th-text-muted">
              Already have an account?{" "}
              <button
                type="button"
                className="font-semibold text-cyan-600 hover:text-cyan-500 hover:underline"
                onClick={() => {
                  onClose();
                  onOpenSignIn();
                }}
              >
                Sign in
              </button>
            </p>
          </>
        ) : (
          <>
            <h2 id={titleId} className="text-xl font-bold tracking-tight text-th-text">
              Verify your email
            </h2>
            <p className="mt-1 text-sm text-th-text-muted">
              We sent a 6-digit code to{" "}
              <span className="font-medium text-th-text">{email}</span>
            </p>

            <form onSubmit={handleVerify} className="mt-6 space-y-5">
              <div className="flex justify-center gap-2.5" onPaste={handleDigitPaste}>
                {digits.map((d, i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      inputRefs.current[i] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={(e) => handleDigitChange(i, e.target.value)}
                    onKeyDown={(e) => handleDigitKeyDown(i, e)}
                    className="h-12 w-11 rounded-lg border border-th-border bg-th-input text-center text-lg font-bold text-th-text outline-none transition focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                    aria-label={`Digit ${i + 1}`}
                  />
                ))}
              </div>

              <p className="text-center text-xs text-th-text-muted">
                Didn&apos;t receive it?{" "}
                <button
                  type="button"
                  disabled={resendCooldown > 0}
                  onClick={handleResend}
                  className="font-semibold text-cyan-600 hover:underline disabled:cursor-not-allowed disabled:text-th-text-muted disabled:no-underline"
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
                </button>
              </p>

              {error && (
                <p
                  className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-500"
                  role="alert"
                >
                  {error}
                </p>
              )}

              <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setStep("credentials");
                    setDigits(["", "", "", "", "", ""]);
                    setError(null);
                  }}
                  className="order-2 rounded-lg px-4 py-2 text-sm font-semibold text-th-text-muted hover:bg-th-input sm:order-1"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={submitting || digits.join("").length !== 6}
                  className="order-1 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-slate-900/20 transition-colors hover:bg-slate-800 disabled:opacity-50 sm:order-2"
                >
                  {submitting ? "Verifying…" : "Verify & Sign up"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
