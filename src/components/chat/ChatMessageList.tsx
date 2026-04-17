import { useCallback, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FiCopy, FiEdit2, FiCheck, FiAlertTriangle } from "react-icons/fi";
import type { TradeModeId, TradeModeMeta } from "@/lib/chatApi";
import type { Components } from "react-markdown";
import { pickStarterSuggestions } from "@/lib/suggestedQuestions";
import { isMongoObjectId } from "@/lib/mongoId";
import { COPY_FEEDBACK_RESET_MS, FOLLOWUP_STALE_MS } from "@/config/constants";

const MARKDOWN_PLUGINS = [remarkGfm];

const MARKDOWN_COMPONENTS: Components = {
  table: ({ children, ...props }) => (
    <div className="my-2 max-w-full overflow-x-auto rounded-lg border border-th-border">
      <table {...props} className="w-full min-w-[16rem] border-collapse text-sm">
        {children}
      </table>
    </div>
  ),
};

const PROSE_CLS = [
  "prose prose-sm max-w-none leading-relaxed dark:prose-invert",
  "prose-headings:text-th-text",
  "prose-p:my-2",
  "prose-a:text-teal-600 prose-a:no-underline hover:prose-a:underline dark:prose-a:text-teal-400",
  "prose-strong:text-th-text",
  "prose-code:rounded prose-code:bg-th-code prose-code:px-1.5 prose-code:py-0.5 prose-code:text-teal-700 prose-code:before:content-none prose-code:after:content-none dark:prose-code:text-teal-300",
  "prose-pre:rounded-lg prose-pre:bg-th-code prose-pre:p-4",
  "prose-ol:my-2 prose-ul:my-2 prose-li:my-0.5",
  "prose-table:text-sm prose-th:border prose-th:border-th-border prose-th:bg-th-surface prose-th:px-3 prose-th:py-1.5 prose-td:border prose-td:border-th-border prose-td:px-3 prose-td:py-1.5",
  "prose-blockquote:border-teal-500 prose-blockquote:text-th-text-muted",
  "prose-hr:border-th-border",
].join(" ");

export type UiMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
  /** Mode selected when this user message was sent (from server or optimistic UI). */
  askedMode?: TradeModeId;
};

type Props = {
  messages: UiMessage[];
  streamingContent: string;
  mode: TradeModeId;
  /** Labels for mode marks on user bubbles and chips. */
  modeOptions: TradeModeMeta[];
  /** Used to vary empty-state starters per conversation. */
  conversationId: string;
  onPickSuggestion: (text: string) => void;
  onCopy: (text: string) => Promise<void>;
  onEditUserMessage: (messageId: string, content: string) => void;
  showFollowUpSuggestions: boolean;
  /** LLM-generated follow-ups keyed by assistant message id. */
  followUpByMessageId: Record<string, string[]>;
  followUpStatusByMessageId: Record<
    string,
    { status: "ready" | "withdrawn"; notice?: string }
  >;
};

function SuggestionChips({
  items,
  keySeed,
  onPick,
}: {
  items: string[];
  /** Avoid duplicate React keys if the same text appears twice in a pool. */
  keySeed?: string;
  onPick: (t: string) => void;
}) {
  return (
    <div className="flex flex-wrap justify-center gap-2 px-0.5">
      {items.map((q, i) => (
        <button
          key={keySeed ? `${keySeed}:${i}:${q}` : `${i}:${q}`}
          type="button"
          onClick={() => onPick(q)}
          className="max-w-full rounded-xl border border-th-border-muted bg-th-input px-3 py-2 text-left text-xs text-th-text transition-colors hover:border-teal-500/40 hover:bg-th-input-hover hover:text-teal-700 dark:hover:text-teal-300 md:text-sm"
        >
          {q}
        </button>
      ))}
    </div>
  );
}

function MessageToolbar({
  role,
  copied,
  onCopy,
  onEdit,
}: {
  role: "user" | "assistant";
  copied: boolean;
  onCopy: () => void;
  onEdit?: () => void;
}) {
  return (
    <div className="mt-1 flex items-center gap-1 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100">
      <button
        type="button"
        onClick={onCopy}
        className="inline-flex items-center gap-1 rounded p-1.5 text-th-text-muted hover:bg-th-surface hover:text-teal-600 dark:hover:text-teal-300"
        title="Copy"
        aria-label="Copy message"
      >
        {copied ? <FiCheck aria-hidden className="h-4 w-4 text-teal-500" /> : <FiCopy aria-hidden className="h-4 w-4" />}
      </button>
      {copied && <span className="text-[10px] text-teal-600 dark:text-teal-300">Copied</span>}
      {role === "user" && onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className="rounded p-1.5 text-th-text-muted hover:bg-th-surface hover:text-teal-600 dark:hover:text-teal-300"
          title="Edit message"
          aria-label="Edit message"
        >
          <FiEdit2 aria-hidden className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

function modeMarkMeta(modeId: TradeModeId, options: TradeModeMeta[]) {
  return options.find((x) => x.id === modeId);
}

function isFollowUpStale(isoDate?: string): boolean {
  if (!isoDate) return false;
  const ms = Date.parse(isoDate);
  if (Number.isNaN(ms)) return false;
  return Date.now() - ms >= FOLLOWUP_STALE_MS;
}

export function ChatMessageList({
  messages,
  streamingContent,
  mode,
  modeOptions,
  conversationId,
  onPickSuggestion,
  onCopy,
  onEditUserMessage,
  showFollowUpSuggestions,
  followUpByMessageId,
  followUpStatusByMessageId,
}: Props) {
  const showEmpty = messages.length === 0 && !streamingContent;
  const starters = pickStarterSuggestions(mode, conversationId);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = useCallback(
    async (key: string, text: string) => {
      await onCopy(text);
      setCopiedKey(key);
      window.setTimeout(
        () => setCopiedKey((k) => (k === key ? null : k)),
        COPY_FEEDBACK_RESET_MS,
      );
    },
    [onCopy]
  );

  const lastIsAssistant =
    messages.length > 0 && messages[messages.length - 1].role === "assistant";

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      {showEmpty && (
        <div className="flex flex-1 flex-col items-center justify-center px-3 pb-8 pt-8 sm:px-4 sm:pt-12">
          <div className="w-full max-w-2xl text-center">
            <h2 className="text-2xl font-semibold text-th-text sm:text-3xl md:text-4xl">TradeGPT</h2>
            <p className="mt-3 text-sm text-th-text-muted sm:text-base">
              Pick a mode above, then choose a starter or type your own question.
            </p>
            <div className="mt-8">
              <SuggestionChips
                items={starters}
                keySeed={`empty-${conversationId}-${mode}`}
                onPick={onPickSuggestion}
              />
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto w-full max-w-3xl flex-1 px-3 py-4 sm:px-4 sm:py-6">
        <ul className="space-y-6">
          {messages.map((m, i) => (
            <li key={m.id} className="group">
              {m.role === "user" ? (
                <div className="flex justify-end">
                  <div className="max-w-[min(85%,20rem)] sm:max-w-[85%]">
                    {m.askedMode && (
                      <div className="mb-1 flex justify-end">
                        <span
                          className="max-w-full truncate rounded-lg border border-teal-500/35 bg-teal-500/10 px-2 py-0.5 text-[10px] font-medium text-teal-700 dark:text-teal-300 sm:text-[11px]"
                          title={modeMarkMeta(m.askedMode, modeOptions)?.label ?? m.askedMode}
                        >
                          {modeMarkMeta(m.askedMode, modeOptions)?.shortLabel ?? m.askedMode}
                        </span>
                      </div>
                    )}
                    <div className="rounded-2xl border border-teal-500/20 bg-gradient-to-br from-teal-500/10 via-th-surface to-emerald-500/5 px-4 py-3 text-th-text shadow-sm">
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">{m.content}</p>
                    </div>
                    <div className="flex justify-end">
                      <MessageToolbar
                        role="user"
                        copied={copiedKey === m.id}
                        onCopy={() => handleCopy(m.id, m.content)}
                        onEdit={
                          isMongoObjectId(m.id)
                            ? () => onEditUserMessage(m.id, m.content)
                            : undefined
                        }
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2 sm:gap-4">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-teal-500 to-emerald-600 text-[10px] font-bold text-white shadow-sm sm:h-8 sm:w-8 sm:text-xs">
                    AI
                  </div>
                  <div className="min-w-0 flex-1 text-th-text">
                    <div className={PROSE_CLS}>
                      <ReactMarkdown remarkPlugins={MARKDOWN_PLUGINS} components={MARKDOWN_COMPONENTS}>
                        {m.content}
                      </ReactMarkdown>
                    </div>
                    <MessageToolbar
                      role="assistant"
                      copied={copiedKey === m.id}
                      onCopy={() => handleCopy(m.id, m.content)}
                    />
                    {showFollowUpSuggestions &&
                      lastIsAssistant &&
                      i === messages.length - 1 &&
                      !streamingContent && (
                        <div className="mt-4 border-t border-th-border pt-4">
                          {followUpByMessageId[m.id]?.length ? (
                            <>
                              <p className="mb-2 text-xs font-medium text-th-text-muted">
                                Suggested next questions
                              </p>
                              <SuggestionChips
                                items={followUpByMessageId[m.id]!}
                                keySeed={`follow-${m.id}-${mode}`}
                                onPick={onPickSuggestion}
                              />
                            </>
                          ) : followUpStatusByMessageId[m.id]?.status === "withdrawn" ? (
                            <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
                              <FiAlertTriangle aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                              <span>
                                {followUpStatusByMessageId[m.id]?.notice ??
                                  "Suggested questions were automatically withdrawn."}
                              </span>
                            </div>
                          ) : isFollowUpStale(m.createdAt) ? (
                            <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
                              <FiAlertTriangle aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                              <span>
                                Suggested questions were automatically withdrawn after 1 minute because generation did not complete.
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-xs text-th-text-muted">
                              <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-th-border-muted border-t-teal-500" />
                              Generating suggestions…
                            </div>
                          )}
                        </div>
                      )}
                  </div>
                </div>
              )}
            </li>
          ))}
          {streamingContent && (
            <li className="group flex gap-2 sm:gap-4">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-teal-500 to-emerald-600 text-[10px] font-bold text-white shadow-sm sm:h-8 sm:w-8 sm:text-xs">
                AI
              </div>
              <div className="min-w-0 flex-1 text-th-text">
                <div className={PROSE_CLS}>
                  <ReactMarkdown remarkPlugins={MARKDOWN_PLUGINS} components={MARKDOWN_COMPONENTS}>
                    {streamingContent}
                  </ReactMarkdown>
                </div>
                <span className="inline-block h-4 w-1 animate-pulse bg-teal-500" aria-hidden />
                <div className="mt-1">
                  <button
                    type="button"
                    onClick={() => handleCopy("stream", streamingContent)}
                    className="inline-flex items-center gap-1 rounded p-1.5 text-th-text-muted hover:bg-th-surface hover:text-teal-600 dark:hover:text-teal-300"
                    title="Copy"
                    aria-label="Copy streaming reply"
                  >
                    {copiedKey === "stream" ? (
                      <FiCheck aria-hidden className="h-4 w-4 text-teal-500" />
                    ) : (
                      <FiCopy aria-hidden className="h-4 w-4" />
                    )}
                  </button>
                  {copiedKey === "stream" && (
                    <span className="ml-1 text-[10px] text-teal-600 dark:text-teal-300">Copied</span>
                  )}
                </div>
              </div>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
