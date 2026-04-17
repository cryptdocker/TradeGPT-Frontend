import { FiMenu, FiCpu, FiGlobe } from "react-icons/fi";
import type { TradeModeId, TradeModeMeta } from "@/lib/chatApi";
import { ChatModeSelect } from "@/components/chat/ChatModeSelect";

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
              <FiMenu aria-hidden className="h-5 w-5" />
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
          <div
            className="flex min-w-0 items-center gap-1.5 rounded-xl border border-teal-500/30 bg-th-input p-1 pl-2 shadow-sm"
            title="Trading mode selector"
          >
            <FiCpu aria-hidden className="h-4 w-4 shrink-0 text-teal-500 dark:text-teal-300" />
            <ChatModeSelect modes={modes} value={mode} onChange={onModeChange} triggerId="mode-select" />
          </div>
        </div>
      </div>
      {replyMeta && (
        <div className="flex items-center justify-center gap-2 border-t border-th-border/60 px-3 py-1.5 text-center text-[10px] text-th-text-muted sm:px-4 sm:text-[11px]">
          <span className="break-all font-mono text-th-text/80">{replyMeta.model}</span>
          {replyMeta.usedWebSearch && (
            <span className="inline-flex items-center gap-1 rounded bg-teal-500/15 px-1.5 py-0.5 text-teal-600 dark:text-teal-300">
              <FiGlobe aria-hidden className="h-3 w-3" />
              Web search
            </span>
          )}
        </div>
      )}
    </header>
  );
}
