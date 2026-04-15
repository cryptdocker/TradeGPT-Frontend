import { useCallback, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { TradeModeId, TradeModeMeta } from "@/lib/chatApi";
import type { Components } from "react-markdown";
import { pickStarterSuggestions } from "@/lib/suggestedQuestions";
import { isMongoObjectId } from "@/lib/mongoId";

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
  "prose-a:text-cyan-600 prose-a:no-underline hover:prose-a:underline dark:prose-a:text-cyan-400",
  "prose-strong:text-th-text",
  "prose-code:rounded prose-code:bg-th-code prose-code:px-1.5 prose-code:py-0.5 prose-code:text-cyan-700 prose-code:before:content-none prose-code:after:content-none dark:prose-code:text-cyan-300",
  "prose-pre:rounded-lg prose-pre:bg-th-code prose-pre:p-4",
  "prose-ol:my-2 prose-ul:my-2 prose-li:my-0.5",
  "prose-table:text-sm prose-th:border prose-th:border-th-border prose-th:bg-th-surface prose-th:px-3 prose-th:py-1.5 prose-td:border prose-td:border-th-border prose-td:px-3 prose-td:py-1.5",
  "prose-blockquote:border-cyan-500 prose-blockquote:text-th-text-muted",
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
          className="max-w-full rounded-xl border border-th-border-muted bg-th-input px-3 py-2 text-left text-xs text-th-text transition-colors hover:bg-th-input-hover md:text-sm"
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
        className="rounded p-1.5 text-th-text-muted hover:bg-th-surface hover:text-th-text"
        title="Copy"
        aria-label="Copy message"
      >
        <CopyIcon />
      </button>
      {copied && <span className="text-[10px] text-cyan-500">Copied</span>}
      {role === "user" && onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className="rounded p-1.5 text-th-text-muted hover:bg-th-surface hover:text-th-text"
          title="Edit message"
          aria-label="Edit message"
        >
          <EditIcon />
        </button>
      )}
    </div>
  );
}

function modeMarkMeta(modeId: TradeModeId, options: TradeModeMeta[]) {
  return options.find((x) => x.id === modeId);
}

function isOlderThanOneMinute(isoDate?: string): boolean {
  if (!isoDate) return false;
  const ms = Date.parse(isoDate);
  if (Number.isNaN(ms)) return false;
  return Date.now() - ms >= 60_000;
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
      window.setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), 2000);
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
                          className="max-w-full truncate rounded-lg border border-cyan-500/35 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-medium text-cyan-600 dark:text-cyan-300 sm:text-[11px]"
                          title={modeMarkMeta(m.askedMode, modeOptions)?.label ?? m.askedMode}
                        >
                          {modeMarkMeta(m.askedMode, modeOptions)?.shortLabel ?? m.askedMode}
                        </span>
                      </div>
                    )}
                    <div className="rounded-2xl border border-th-border/70 bg-th-surface px-4 py-3 text-th-text shadow-sm">
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
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-cyan-600 text-[10px] font-bold text-white sm:h-8 sm:w-8 sm:text-xs">
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
                            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
                              {followUpStatusByMessageId[m.id]?.notice ??
                                "Suggested questions were automatically withdrawn."}
                            </div>
                          ) : isOlderThanOneMinute(m.createdAt) ? (
                            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
                              Suggested questions were automatically withdrawn after 1 minute because generation did not complete.
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-xs text-th-text-muted">
                              <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-th-border-muted border-t-cyan-500" />
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
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-cyan-600 text-[10px] font-bold text-white sm:h-8 sm:w-8 sm:text-xs">
                AI
              </div>
              <div className="min-w-0 flex-1 text-th-text">
                <div className={PROSE_CLS}>
                  <ReactMarkdown remarkPlugins={MARKDOWN_PLUGINS} components={MARKDOWN_COMPONENTS}>
                    {streamingContent}
                  </ReactMarkdown>
                </div>
                <span className="inline-block h-4 w-1 animate-pulse bg-th-text" aria-hidden />
                <div className="mt-1">
                  <button
                    type="button"
                    onClick={() => handleCopy("stream", streamingContent)}
                    className="rounded p-1.5 text-th-text-muted hover:bg-th-surface hover:text-th-text"
                    title="Copy"
                    aria-label="Copy streaming reply"
                  >
                    <CopyIcon />
                  </button>
                  {copiedKey === "stream" && (
                    <span className="ml-1 text-[10px] text-cyan-500">Copied</span>
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

function CopyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}
