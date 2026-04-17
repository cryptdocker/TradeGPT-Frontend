import { useCallback, useEffect, useRef, useState } from "react";
import {
  FiArrowRight,
  FiX,
  FiCheckCircle,
  FiXCircle,
  FiCopy,
  FiCheck,
  FiRefreshCw,
  FiAlertTriangle,
} from "react-icons/fi";
import {
  apiFetchPaymentNetworks,
  apiCreateCheckout,
  apiGetPaymentStatus,
  apiCheckPaymentLogs,
  apiCancelPayment,
  type CheckoutInfo,
  type NetworkOption,
  type PaymentNetworkId,
  type PaymentTokenId,
} from "@/lib/api";
import { DEFAULT_PRO_PRICE_USD } from "@/config/app";
import {
  COPY_FEEDBACK_RESET_MS,
  PAYMENT_EXPIRY_WARN_SECONDS,
  PAYMENT_POLL_INITIAL_DELAY_MS,
  PAYMENT_POLL_INTERVAL_MS,
  PAYMENT_SUCCESS_HOLD_MS,
} from "@/config/constants";

type Props = {
  token: string;
  onSuccess: () => void;
  onCancel: () => void;
};

type Phase = "select" | "loading" | "pay" | "confirming" | "confirmed" | "error";

const TOKEN_LABELS: Record<PaymentTokenId, string> = { usdt: "USDT", usdc: "USDC" };

export function PaymentCheckout({ token, onSuccess, onCancel }: Props) {
  const [phase, setPhase] = useState<Phase>("select");
  const [networks, setNetworks] = useState<NetworkOption[]>([]);
  const [price, setPrice] = useState(DEFAULT_PRO_PRICE_USD);
  const [selectedNetwork, setSelectedNetwork] = useState<PaymentNetworkId>("eth");
  const [selectedToken, setSelectedToken] = useState<PaymentTokenId>("usdt");
  const [checkout, setCheckout] = useState<CheckoutInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval>>();
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await apiFetchPaymentNetworks();
        if (cancelled) return;
        setNetworks(data.networks);
        setPrice(data.price);
        if (data.networks.length) {
          setSelectedNetwork(data.networks[0].id);
          setSelectedToken(data.networks[0].tokens[0]);
        }
      } catch {
        setError("Failed to load payment options");
        setPhase("error");
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const activeNet = networks.find((n) => n.id === selectedNetwork);

  const startCheckout = useCallback(async () => {
    setPhase("loading");
    setError(null);
    try {
      const data = await apiCreateCheckout(token, selectedNetwork, selectedToken);
      if ("confirmed" in data && data.confirmed) {
        setPhase("confirmed");
        setTimeout(onSuccess, PAYMENT_SUCCESS_HOLD_MS);
        return;
      }
      setCheckout(data);
      setPhase(data.status === "confirming" ? "confirming" : "pay");
      setSecondsLeft(Math.max(0, Math.floor((new Date(data.expiresAt).getTime() - Date.now()) / 1000)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start checkout");
      setPhase("error");
    }
  }, [token, selectedNetwork, selectedToken, onSuccess]);

  useEffect(() => {
    if (phase !== "pay" && phase !== "confirming") return;
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) { clearInterval(timerRef.current); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase]);

  useEffect(() => {
    if (!checkout || (phase !== "pay" && phase !== "confirming")) return;
    let stopped = false;

    const poll = async () => {
      if (stopped) return;
      try {
        const logsResult = await apiCheckPaymentLogs(token, checkout.paymentId);
        if (stopped) return;
        if (logsResult.status === "confirmed") {
          setPhase("confirmed");
          clearInterval(pollRef.current);
          setTimeout(onSuccess, PAYMENT_SUCCESS_HOLD_MS);
          return;
        }
        if (logsResult.status === "confirming") { setPhase("confirming"); return; }

        const statusResult = await apiGetPaymentStatus(token, checkout.paymentId);
        if (stopped) return;
        if (statusResult.status === "confirmed") {
          setPhase("confirmed"); clearInterval(pollRef.current); setTimeout(onSuccess, PAYMENT_SUCCESS_HOLD_MS);
        } else if (statusResult.status === "confirming") {
          setPhase("confirming");
        } else if (statusResult.status === "expired") {
          setPhase("error"); setError("Payment session expired. Please try again."); clearInterval(pollRef.current);
        }
      } catch { /* retry next interval */ }
    };

    pollRef.current = setInterval(poll, PAYMENT_POLL_INTERVAL_MS);
    const initial = setTimeout(poll, PAYMENT_POLL_INITIAL_DELAY_MS);
    return () => { stopped = true; clearInterval(pollRef.current); clearTimeout(initial); };
  }, [checkout, phase, token, onSuccess]);

  const copyAddress = useCallback(async () => {
    if (!checkout) return;
    try {
      await navigator.clipboard.writeText(checkout.addressIn);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = checkout.addressIn;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), COPY_FEEDBACK_RESET_MS);
  }, [checkout]);

  const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  /* ── loading ─────────────────────────────────────────────── */
  if (phase === "loading") {
    return (
      <div className="flex flex-col items-center gap-4 py-10">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-th-border-muted border-t-teal-500" />
        <p className="text-sm text-th-text-muted">Creating payment address…</p>
      </div>
    );
  }

  /* ── error ───────────────────────────────────────────────── */
  if (phase === "error") {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/15 text-red-500">
          <FiXCircle aria-hidden className="h-6 w-6" />
        </div>
        <p className="text-sm text-red-500">{error}</p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setPhase("select")}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-teal-600 to-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-teal-glow hover:from-teal-500 hover:to-emerald-500"
          >
            <FiRefreshCw aria-hidden className="h-4 w-4" />
            Try again
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-2 rounded-lg border border-th-border px-4 py-2 text-sm text-th-text-muted hover:bg-th-surface"
          >
            <FiX aria-hidden className="h-4 w-4" />
            Cancel
          </button>
        </div>
      </div>
    );
  }

  /* ── confirmed ───────────────────────────────────────────── */
  if (phase === "confirmed") {
    return (
      <div className="flex flex-col items-center gap-4 py-10">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 shadow-teal-glow">
          <FiCheckCircle aria-hidden className="h-8 w-8 text-white" />
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-th-text">Payment confirmed!</p>
          <p className="mt-1 text-sm text-th-text-muted">Your Pro plan is now active.</p>
        </div>
      </div>
    );
  }

  /* ── select network / token ──────────────────────────────── */
  if (phase === "select") {
    return (
      <div className="flex flex-col gap-5">
        <h3 className="text-base font-semibold text-th-text">Choose payment method</h3>

        {/* Network */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-th-text-muted">Network</label>
          <div className="grid grid-cols-2 gap-2">
            {networks.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => {
                  setSelectedNetwork(n.id);
                  if (!n.tokens.includes(selectedToken)) setSelectedToken(n.tokens[0]);
                }}
                className={`rounded-lg border px-3 py-2.5 text-left text-sm transition-colors ${
                  selectedNetwork === n.id
                    ? "border-teal-500 bg-teal-500/10 text-th-text"
                    : "border-th-border text-th-text-muted hover:border-teal-500/50 hover:text-th-text"
                }`}
              >
                {n.label}
              </button>
            ))}
          </div>
        </div>

        {/* Token */}
        {activeNet && (
          <div>
            <label className="mb-1.5 block text-xs font-medium text-th-text-muted">Token</label>
            <div className="flex gap-2">
              {activeNet.tokens.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSelectedToken(t)}
                  className={`flex-1 rounded-lg border px-3 py-2.5 text-center text-sm font-medium transition-colors ${
                    selectedToken === t
                      ? "border-teal-500 bg-teal-500/10 text-th-text"
                      : "border-th-border text-th-text-muted hover:border-teal-500/50 hover:text-th-text"
                  }`}
                >
                  {TOKEN_LABELS[t]}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="rounded-xl border border-th-border bg-th-sidebar p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-th-text-muted">You pay</span>
            <span className="text-sm font-semibold text-th-text">{price} {TOKEN_LABELS[selectedToken]}</span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-xs text-th-text-muted">Network</span>
            <span className="text-sm text-th-text">{activeNet?.label}</span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-xs text-th-text-muted">Plan</span>
            <span className="text-sm text-teal-600 dark:text-teal-300">Pro — monthly</span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={startCheckout}
            disabled={!networks.length}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600 px-4 py-2.5 text-sm font-semibold text-white shadow-teal-glow transition-colors hover:from-teal-500 hover:via-emerald-500 hover:to-cyan-500 disabled:opacity-50"
          >
            <FiArrowRight aria-hidden className="h-4 w-4" />
            Continue to payment
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-2 rounded-lg border border-th-border px-4 py-2.5 text-sm text-th-text-muted hover:bg-th-surface"
          >
            <FiX aria-hidden className="h-4 w-4" />
            Cancel
          </button>
        </div>
      </div>
    );
  }

  /* ── pay / confirming ────────────────────────────────────── */
  const tokenLabel = TOKEN_LABELS[checkout?.token ?? selectedToken];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-th-text">
          {phase === "confirming" ? "Payment detected" : `Send ${tokenLabel} to upgrade`}
        </h3>
        {secondsLeft > 0 && (
          <span
            className={`text-xs font-mono ${
              secondsLeft < PAYMENT_EXPIRY_WARN_SECONDS ? "text-amber-500" : "text-th-text-muted"
            }`}
          >
            {fmt(secondsLeft)}
          </span>
        )}
      </div>

      {phase === "confirming" && (
        <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/30 px-3 py-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-amber-500/30 border-t-amber-500" />
          <span className="text-xs text-amber-700 dark:text-amber-300">Transaction detected — waiting for blockchain confirmation…</span>
        </div>
      )}

      <div className="rounded-xl border border-th-border bg-th-sidebar p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-th-text-muted">Amount</span>
          <span className="text-sm font-semibold text-th-text">{checkout?.amount} {tokenLabel}</span>
        </div>
        <div className="mt-1 flex items-center justify-between">
          <span className="text-xs text-th-text-muted">Network</span>
          <span className="text-sm text-th-text">{checkout?.networkLabel}</span>
        </div>
      </div>

      {checkout?.qrCode && (
        <div className="flex justify-center">
          <div className="rounded-xl bg-white p-3 ring-2 ring-teal-500/30">
            <img src={`data:image/png;base64,${checkout.qrCode}`} alt="Payment QR" width={220} height={220} className="block" />
          </div>
        </div>
      )}

      <div>
        <label className="block text-xs text-th-text-muted">Send exactly {checkout?.amount} {tokenLabel} to:</label>
        <div className="mt-1.5 flex items-center gap-2 rounded-lg border border-th-border bg-th-sidebar px-3 py-2.5">
          <code className="min-w-0 flex-1 break-all text-xs text-th-text">{checkout?.addressIn}</code>
          <button
            type="button"
            onClick={copyAddress}
            className="inline-flex shrink-0 items-center gap-1 rounded-md bg-th-surface px-2.5 py-1.5 text-xs font-semibold text-th-text hover:bg-teal-500/15 hover:text-teal-700 dark:hover:text-teal-300 transition-colors"
            aria-label={copied ? "Address copied" : "Copy address"}
          >
            {copied ? (
              <>
                <FiCheck aria-hidden className="h-3.5 w-3.5 text-teal-500" />
                Copied!
              </>
            ) : (
              <>
                <FiCopy aria-hidden className="h-3.5 w-3.5" />
                Copy
              </>
            )}
          </button>
        </div>
      </div>

      <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 border border-amber-500/30 px-3 py-2">
        <FiAlertTriangle aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
        <p className="text-xs text-amber-700 dark:text-amber-200">
          Send only {tokenLabel} ({checkout?.networkLabel}) to this address. Sending other tokens or insufficient amounts will result in loss of funds.
        </p>
      </div>

      <button
        type="button"
        onClick={async () => {
          if (checkout) {
            try { await apiCancelPayment(token, checkout.paymentId); } catch { /* best-effort */ }
          }
          onCancel();
        }}
        className="inline-flex items-center justify-center gap-2 self-center rounded-lg border border-th-border px-5 py-2 text-sm text-th-text-muted hover:bg-th-surface transition-colors"
      >
        <FiX aria-hidden className="h-4 w-4" />
        Cancel
      </button>
    </div>
  );
}
