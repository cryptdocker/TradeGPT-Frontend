import { useCallback, useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { GOOGLE_CLIENT_ID } from "@/config/env";

let loadPromise: Promise<void> | null = null;
function loadGoogleIdentityScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if ((window as any).google?.accounts?.oauth2) return Promise.resolve();
  if (loadPromise) return loadPromise;
  loadPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://accounts.google.com/gsi/client"]',
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Failed to load Google script")), { once: true });
      return;
    }
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load Google script"));
    document.head.appendChild(s);
  });
  return loadPromise;
}

type Props = {
  label?: string;
  disabled?: boolean;
  onCode: (code: string) => Promise<void> | void;
  onError?: (message: string) => void;
};

export function GoogleSSOButton({ label = "Continue with Google", disabled, onCode, onError }: Props) {
  const [loading, setLoading] = useState(false);

  const handleClick = useCallback(async () => {
    if (disabled || loading) return;
    if (!GOOGLE_CLIENT_ID) {
      onError?.("Google Client ID is not configured.");
      return;
    }
    setLoading(true);
    try {
      await loadGoogleIdentityScript();
      const oauth2 = (window as any).google?.accounts?.oauth2;
      if (!oauth2?.initCodeClient) throw new Error("Google OAuth is not available.");
      const client = oauth2.initCodeClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: "openid email profile",
        ux_mode: "popup",
        callback: async (resp: any) => {
          try {
            if (!resp.code) throw new Error(resp.error || "Google did not return a code.");
            await onCode(resp.code);
          } catch (e) {
            onError?.(e instanceof Error ? e.message : "Google sign-in failed.");
          } finally {
            setLoading(false);
          }
        },
        error_callback: () => {
          onError?.("Google sign-in popup was closed.");
          setLoading(false);
        },
      });
      client.requestCode();
    } catch (e) {
      onError?.(e instanceof Error ? e.message : "Google sign-in failed.");
      setLoading(false);
    }
  }, [disabled, loading, onCode, onError]);

  return (
    <button
      type="button"
      disabled={disabled || loading}
      onClick={handleClick}
      className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-th-border bg-th-input px-4 py-2 text-sm font-semibold text-th-text transition-colors hover:bg-th-input/80 disabled:opacity-50"
    >
      <FcGoogle className="h-5 w-5" aria-hidden />
      <span>{loading ? "Opening Google…" : label}</span>
    </button>
  );
}
