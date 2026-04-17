import { useCallback, useEffect, useRef, useState } from "react";
import { FiSend, FiEdit3, FiX } from "react-icons/fi";
import { COMPOSER_MAX_HEIGHT_PX } from "@/config/constants";

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
    ta.current.style.height = `${Math.min(ta.current.scrollHeight, COMPOSER_MAX_HEIGHT_PX)}px`;
  }, [val, editingHint]);

  const submit = useCallback(() => {
    const t = val.trim();
    if (!t || disabled) return;
    onSend(t);
    if (!controlled) setInternal("");
    ta.current?.focus();
  }, [val, disabled, onSend, controlled]);

  return (
    <div className="bg-th-bg p-3">
      <div className="mx-auto max-w-3xl">
        {editingHint && (
          <div className="mb-2 flex items-center justify-between gap-2 rounded-lg border border-teal-500/30 bg-teal-500/10 px-3 py-2 text-xs text-teal-700 dark:text-teal-300">
            <span className="inline-flex min-w-0 items-center gap-2">
              <FiEdit3 aria-hidden className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{editingHint}</span>
            </span>
            {onCancelEdit && (
              <button
                type="button"
                onClick={onCancelEdit}
                className="inline-flex shrink-0 items-center gap-1 rounded px-2 py-1 text-th-text-muted hover:bg-th-surface hover:text-th-text"
              >
                <FiX aria-hidden className="h-3.5 w-3.5" />
                Cancel
              </button>
            )}
          </div>
        )}
        <div className="relative flex items-end gap-2 rounded-3xl border border-th-border bg-th-input px-3 py-2 shadow-[0_8px_24px_rgba(13,148,136,0.08)] focus-within:border-teal-500/50 focus-within:ring-2 focus-within:ring-teal-500/20 transition">
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
              el.style.height = `${Math.min(el.scrollHeight, COMPOSER_MAX_HEIGHT_PX)}px`;
            }}
          />
          <button
            type="button"
            disabled={disabled || !val.trim()}
            onClick={submit}
            className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-teal-glow transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
            aria-label="Send message"
          >
            <FiSend aria-hidden className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
