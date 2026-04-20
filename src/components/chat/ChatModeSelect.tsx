import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { FiChevronDown } from "react-icons/fi";
import type { TradeModeId, TradeModeMeta } from "@/lib/chatApi";
import { popoverTransition } from "@/config/motion";

function isFeaturedMode(id: TradeModeId) {
  return id === "safe_binance_trading_bot" || id === "cryptdocker";
}

function isComingSoonMode(id: TradeModeId) {
  return id === "safe_binance_trading_bot";
}

function modeDisplayLabel(m: TradeModeMeta) {
  return isFeaturedMode(m.id) ? `★ ${m.label}` : m.label;
}

type Props = {
  modes: TradeModeMeta[];
  value: TradeModeId;
  onChange: (m: TradeModeId) => void;
  /** For `htmlFor` on an external label (e.g. sr-only). */
  triggerId?: string;
};

export function ChatModeSelect({ modes, value, onChange, triggerId = "mode-select" }: Props) {
  const reduceMotion = useReducedMotion();
  const genId = useId();
  const listboxId = `chat-mode-options-${genId}`;
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const instant = Boolean(reduceMotion);

  const orderedModes = useMemo(() => {
    const next = [...modes];
    const safeIdx = next.findIndex((m) => m.id === "safe_binance_trading_bot");
    const cryptIdx = next.findIndex((m) => m.id === "cryptdocker");

    // Keep backend order for everything else; only swap these two entries.
    if (safeIdx >= 0 && cryptIdx >= 0) {
      [next[safeIdx], next[cryptIdx]] = [next[cryptIdx], next[safeIdx]];
    }
    return next;
  }, [modes]);

  const valueIndex = Math.max(0, orderedModes.findIndex((m) => m.id === value));

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (containerRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    const onKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open || !listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(`[data-index="${highlightIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [open, highlightIndex]);

  const clampIndex = (i: number) => Math.max(0, Math.min(orderedModes.length - 1, i));

  const selectIndex = (i: number) => {
    const m = orderedModes[clampIndex(i)];
    if (!m) return;
    if (isComingSoonMode(m.id)) return;
    onChange(m.id);
    setOpen(false);
  };

  const openWithHighlight = (index: number) => {
    setHighlightIndex(clampIndex(index));
    setOpen(true);
  };

  const onTriggerKeyDown = (e: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (orderedModes.length === 0) return;

    if (!open) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        openWithHighlight(Math.min(orderedModes.length - 1, valueIndex + 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        openWithHighlight(Math.max(0, valueIndex - 1));
        return;
      }
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openWithHighlight(valueIndex);
        return;
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((i) => clampIndex(i + 1));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((i) => clampIndex(i - 1));
      return;
    }
    if (e.key === "Home") {
      e.preventDefault();
      setHighlightIndex(0);
      return;
    }
    if (e.key === "End") {
      e.preventDefault();
      setHighlightIndex(orderedModes.length - 1);
      return;
    }
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      selectIndex(highlightIndex);
    }
  };

  const current = orderedModes[valueIndex];
  const triggerLabel = current ? modeDisplayLabel(current) : "Trading mode";
  const activeOption = orderedModes[highlightIndex];
  const activeOptionId = activeOption ? `${listboxId}-opt-${activeOption.id}` : undefined;

  return (
    <div ref={containerRef} className="relative min-w-0">
      <button
        id={triggerId}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-activedescendant={open && activeOptionId ? activeOptionId : undefined}
        onClick={() => {
          if (open) setOpen(false);
          else openWithHighlight(valueIndex);
        }}
        onKeyDown={onTriggerKeyDown}
        className="flex max-w-[min(11rem,42vw)] min-h-[44px] w-full cursor-pointer items-center justify-between gap-1 rounded-lg border-0 bg-th-input px-1 py-2 text-left text-xs text-th-text outline-none ring-teal-500/50 focus-visible:ring-2 sm:max-w-[200px] sm:min-h-0 sm:px-2 sm:py-1.5 md:max-w-xs md:text-sm"
      >
        <span className="min-w-0 flex-1 truncate">{triggerLabel}</span>
        <FiChevronDown
          aria-hidden
          className={`h-4 w-4 shrink-0 text-th-text-muted transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && orderedModes.length > 0 && (
        <motion.ul
          key={listboxId}
          ref={listRef}
          id={listboxId}
          role="listbox"
          initial={instant ? false : { opacity: 0, y: -8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={popoverTransition(reduceMotion)}
          className="absolute right-0 top-full z-50 mt-1 max-h-[min(18rem,55vh)] w-[min(18rem,calc(100vw-2rem))] origin-top overflow-auto rounded-xl border border-th-border bg-th-surface py-1 shadow-lg ring-1 ring-black/5 dark:ring-white/10"
        >
          {orderedModes.map((m, i) => {
            const selected = m.id === value;
            const highlighted = i === highlightIndex;
            const featured = isFeaturedMode(m.id);
            const disabled = isComingSoonMode(m.id);
            return (
              <li key={m.id} role="presentation" className="group relative px-1">
                <button
                  type="button"
                  id={`${listboxId}-opt-${m.id}`}
                  role="option"
                  data-index={i}
                  aria-selected={selected}
                  aria-disabled={disabled}
                  tabIndex={-1}
                  className={`flex w-full rounded-lg px-2.5 py-2 text-left text-xs sm:text-sm ${
                    featured ? "font-semibold" : "font-normal"
                  } ${
                    highlighted
                      ? "bg-teal-500/15 text-th-text"
                      : "text-th-text hover:bg-th-input"
                  } ${selected && !highlighted ? "text-teal-700 dark:text-teal-300" : ""} ${
                    disabled ? "cursor-not-allowed opacity-60" : ""
                  }`}
                  title={disabled ? "This product is coming soon." : undefined}
                  onMouseEnter={() => setHighlightIndex(i)}
                  onClick={() => selectIndex(i)}
                >
                  <span className="truncate">{modeDisplayLabel(m)}</span>
                </button>
                {disabled && (
                  <div className="pointer-events-none absolute left-2 right-2 top-full z-10 mt-1 hidden rounded-md border border-th-border bg-th-surface px-2 py-1 text-[11px] text-th-text-muted shadow-md group-hover:block group-focus-within:block">
                    This product is coming soon.
                  </div>
                )}
              </li>
            );
          })}
        </motion.ul>
      )}
    </div>
  );
}
