import { useCallback, useEffect, useRef, useState } from "react";

type Props = {
  disabled: boolean;
  onSend: (text: string) => void;
  /** Controlled draft (e.g. when editing a message). */
  value?: string;
  onChange?: (v: string) => void;
  /** Shown above the input when editing a prior user message. */
  editingHint?: string | null;
  onCancelEdit?: () => void;
};

export function ChatComposer({
  disabled,
  onSend,
  value: controlledValue,
  onChange: controlledOnChange,
  editingHint,
  onCancelEdit,
}: Props) {
  const [internal, setInternal] = useState("");
  const ta = useRef<HTMLTextAreaElement>(null);
  const controlled = controlledValue !== undefined;

  const val = controlled ? controlledValue : internal;
  const setVal = controlled ? controlledOnChange! : setInternal;

  useEffect(() => {
    if (!ta.current) return;
    ta.current.style.height = "auto";
    ta.current.style.height = `${Math.min(ta.current.scrollHeight, 192)}px`;
  }, [val, editingHint]);

  const submit = useCallback(() => {
    const t = val.trim();
    if (!t || disabled) return;
    onSend(t);
    if (!controlled) setInternal("");
    ta.current?.focus();
  }, [val, disabled, onSend, controlled]);

  return (
    <div className="border-t border-th-border bg-th-bg px-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 sm:px-4 sm:pb-6">
      <div className="mx-auto max-w-3xl">
        {editingHint && (
          <div className="mb-2 flex items-center justify-between gap-2 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-600 dark:text-cyan-300">
            <span className="truncate">{editingHint}</span>
            {onCancelEdit && (
              <button
                type="button"
                onClick={onCancelEdit}
                className="shrink-0 rounded px-2 py-1 text-th-text-muted hover:bg-th-surface hover:text-th-text"
              >
                Cancel
              </button>
            )}
          </div>
        )}
        <div className="relative flex items-end gap-2 rounded-3xl border border-th-border bg-th-input px-3 py-2 shadow-[0_8px_24px_rgba(15,23,42,0.08)]">
          <textarea
            ref={ta}
            rows={1}
            value={val}
            disabled={disabled}
            placeholder="Message TradeGPT…"
            className="max-h-48 min-h-[44px] w-full resize-none bg-transparent py-2.5 pl-1 pr-12 text-sm text-th-text placeholder:text-th-text-muted outline-none disabled:opacity-50"
            onChange={(e) => setVal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
              if (e.key === "Escape" && editingHint && onCancelEdit) {
                e.preventDefault();
                onCancelEdit();
              }
            }}
            onInput={(e) => {
              const el = e.target as HTMLTextAreaElement;
              el.style.height = "auto";
              el.style.height = `${Math.min(el.scrollHeight, 192)}px`;
            }}
          />
          <button
            type="button"
            disabled={disabled || !val.trim()}
            onClick={submit}
            className="absolute bottom-2 right-2 flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Send message"
          >
            <SendIcon />
          </button>
        </div>
        <p className="mt-2 text-center text-xs text-th-text-muted">
          TradeGPT can make mistakes. Not financial advice.
        </p>
      </div>
    </div>
  );
}

function SendIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
    </svg>
  );
}
