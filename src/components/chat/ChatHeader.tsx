import type { TradeModeId, TradeModeMeta } from "@/lib/chatApi";

type Props = {
  modes: TradeModeMeta[];
  mode: TradeModeId;
  onModeChange: (m: TradeModeId) => void;
  title: string;
  /** Last completion routing hint (model + whether web search was used). */
  replyMeta?: { model: string; usedWebSearch: boolean } | null;
  /** Shown as a leading control on small viewports (e.g. open chat drawer). */
  onOpenMenu?: () => void;
};

function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
    </svg>
  );
}

export function ChatHeader({ modes, mode, onModeChange, title, replyMeta, onOpenMenu }: Props) {
  return (
    <header className="sticky top-0 z-10 shrink-0 border-b border-th-border/80 bg-th-bg/90 backdrop-blur-md pt-[env(safe-area-inset-top)]">
      <div className="flex min-h-14 w-full items-center justify-between gap-2 px-3 sm:px-4">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {onOpenMenu && (
            <button
              type="button"
              onClick={onOpenMenu}
              className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-lg p-2.5 text-th-text hover:bg-th-surface md:hidden"
              aria-label="Open menu"
            >
              <MenuIcon />
            </button>
          )}
          <h1 className="min-w-0 flex-1 truncate text-sm font-semibold text-th-text md:max-w-md">
            {title}
          </h1>
        </div>
        <div className="ml-2 flex shrink-0 items-center justify-end">
          <label htmlFor="mode-select" className="sr-only">
            Trading mode
          </label>
          <div className="rounded-xl border border-th-border bg-th-input p-1 shadow-sm" title="Trading mode selector">
            <select
              id="mode-select"
              value={mode}
              onChange={(e) => onModeChange(e.target.value as TradeModeId)}
              className="max-w-[min(11rem,42vw)] min-h-[44px] w-full cursor-pointer rounded-lg border-0 bg-th-input px-2 py-2 text-xs text-th-text outline-none focus:ring-2 focus:ring-cyan-500/50 sm:max-w-[200px] sm:min-h-0 sm:px-3 sm:py-1.5 md:max-w-xs md:text-sm"
            >
              {modes.map((m) => {
                const featured =
                  m.id === "safe_binance_trading_bot" || m.id === "cryptdocker";
                return (
                  <option
                    key={m.id}
                    value={m.id}
                    className={
                      featured
                        ? "bg-slate-900 font-semibold text-slate-100"
                        : "bg-th-input text-th-text"
                    }
                  >
                    {featured ? `★ ${m.label}` : m.label}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </div>
      {replyMeta && (
        <div className="border-t border-th-border/60 px-3 py-1.5 text-center text-[10px] text-th-text-muted sm:px-4 sm:text-[11px]">
          <span className="break-all font-mono text-th-text/80">{replyMeta.model}</span>
          {replyMeta.usedWebSearch && (
            <span className="ml-2 inline-block rounded bg-cyan-500/15 px-1.5 py-0.5 text-cyan-500">
              Web search
            </span>
          )}
        </div>
      )}
    </header>
  );
}
