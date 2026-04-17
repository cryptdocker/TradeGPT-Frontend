import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { FiRefreshCw } from "react-icons/fi";
import { useAuth } from "@/context/AuthContext";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatMessageList, type UiMessage } from "@/components/chat/ChatMessageList";
import { ChatComposer } from "@/components/chat/ChatComposer";
import {
  createConversation,
  deleteConversation,
  fetchModes,
  getConversation,
  listConversations,
  patchConversationMode,
  rollbackFromMessage,
  streamAssistantReply,
  type TradeModeId,
  type TradeModeMeta,
} from "@/lib/chatApi";
import { isMongoObjectId } from "@/lib/mongoId";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { SettingsView, isValidSettingsSection, type SettingsSectionId } from "@/pages/SettingsPage";
import {
  backdropFadeTransition,
  modalPanelExitTransition,
  modalPanelTransition,
} from "@/config/motion";

async function copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  }
}

export function TradeGPTDashboard() {
  const reduceMotion = useReducedMotion();
  const { token, user, logout, subscription } = useAuth();
  const navigate = useNavigate();
  const { conversationId: urlConversationId } = useParams<{ conversationId?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const settingsModalOpen = searchParams.has("settings");
  const settingsSection = useMemo((): SettingsSectionId => {
    const raw = searchParams.get("settings") ?? "";
    if (!raw) return "general";
    return isValidSettingsSection(raw) ? raw : "general";
  }, [searchParams]);

  const openSettings = useCallback(
    (id: SettingsSectionId = "general") => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set("settings", id);
          return next;
        },
        { replace: false },
      );
    },
    [setSearchParams],
  );

  const closeSettings = useCallback(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("settings");
        return next;
      },
      { replace: true },
    );
  }, [setSearchParams]);

  const setSettingsSection = useCallback(
    (id: SettingsSectionId) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set("settings", id);
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );
  const [modes, setModes] = useState<TradeModeMeta[]>([]);
  const [conversations, setConversations] = useState<
    { id: string; title: string; mode: TradeModeId; messageCount?: number }[]
  >([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [title, setTitle] = useState("New chat");
  const [mode, setMode] = useState<TradeModeId>("market_analysis");
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [composerText, setComposerText] = useState("");
  const [editingFromMessageId, setEditingFromMessageId] = useState<string | null>(null);
  const [streaming, setStreaming] = useState("");
  const [sending, setSending] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const mdUp = useMediaQuery("(min-width: 768px)");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [bootstrapped, setBootstrapped] = useState(false);
  const [replyMeta, setReplyMeta] = useState<{
    model: string;
    usedWebSearch: boolean;
  } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const streamAccum = useRef("");
  const newChatInFlight = useRef(false);
  const [followUpByMessageId, setFollowUpByMessageId] = useState<
    Record<string, string[]>
  >({});
  const [followUpStatusByMessageId, setFollowUpStatusByMessageId] = useState<
    Record<string, { status: "ready" | "withdrawn"; notice?: string }>
  >({});

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streaming, scrollToBottom]);

  const loadConversation = useCallback(
    async (id: string, skipUrlUpdate = false) => {
      if (!token) return;
      const data = await getConversation(token, id);
      setActiveId(id);
      if (!skipUrlUpdate) navigate(`/chat/${id}`, { replace: true });
      setTitle(data.title);
      setMode(data.mode);
      setMessages(
        data.messages
          .filter((m) => m.role === "user" || m.role === "assistant")
          .map((m) => ({
            id: m.id,
            role: m.role as "user" | "assistant",
            content: m.content,
            createdAt: m.createdAt,
            ...(m.role === "user" && m.tradeMode ? { askedMode: m.tradeMode } : {}),
          }))
      );

      const serverFollowUps: Record<string, string[]> = {};
      for (const m of data.messages) {
        if (m.suggestedQuestions?.length) {
          serverFollowUps[m.id] = m.suggestedQuestions;
        }
      }
      setFollowUpByMessageId((prev) => ({ ...prev, ...serverFollowUps }));
      setFollowUpStatusByMessageId({});

      setEditingFromMessageId(null);
      setComposerText("");
      setReplyMeta(null);
    },
    [token, navigate]
  );

  const refreshList = useCallback(async () => {
    if (!token) return [];
    const list = await listConversations(token);
    setConversations(list);
    return list;
  }, [token]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!token) return;
      try {
        setLoadError(null);
        const m = await fetchModes();
        if (cancelled) return;
        setModes(m);
        const list = await refreshList();
        if (cancelled) return;

        const targetId = urlConversationId && list?.find((c) => c.id === urlConversationId)
          ? urlConversationId
          : null;

        if (targetId) {
          await loadConversation(targetId, true);
        } else if (!list?.length) {
          const created = await createConversation(token, "market_analysis");
          setConversations([
            { id: created.id, title: created.title, mode: created.mode, messageCount: 0 },
          ]);
          await loadConversation(created.id);
        } else {
          await loadConversation(list[0].id);
        }
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : "Failed to load");
        }
      } finally {
        if (!cancelled) setBootstrapped(true);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleNewChat = useCallback(async () => {
    if (!token || newChatInFlight.current) return;
    if (messages.length === 0 && !streaming && !sending) {
      setComposerText("");
      setEditingFromMessageId(null);
      return;
    }

    newChatInFlight.current = true;
    try {
      setLoadError(null);
      setFollowUpByMessageId({});
      setFollowUpStatusByMessageId({});
      const list = await listConversations(token);
      const emptyIds = list.filter((c) => c.messageCount === 0).map((c) => c.id);
      for (const id of emptyIds) {
        await deleteConversation(token, id);
      }
      const created = await createConversation(token, mode);
      await refreshList();
      await loadConversation(created.id);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Failed to create chat");
      try {
        await refreshList();
      } catch {
        // ignore list refresh after error
      }
    } finally {
      newChatInFlight.current = false;
    }
  }, [token, mode, messages.length, streaming, sending, refreshList, loadConversation]);

  const handleSelect = useCallback(
    async (id: string) => {
      if (id === activeId) return;
      try {
        setLoadError(null);
        setStreaming("");
        setFollowUpByMessageId({});
        setFollowUpStatusByMessageId({});
        await loadConversation(id);
      } catch (e) {
        setLoadError(e instanceof Error ? e.message : "Failed to open chat");
      }
    },
    [activeId, loadConversation]
  );

  const handleSelectWithMobileClose = useCallback(
    async (id: string) => {
      await handleSelect(id);
      if (!mdUp) setMobileDrawerOpen(false);
    },
    [handleSelect, mdUp]
  );

  const handleNewChatWithMobileClose = useCallback(async () => {
    await handleNewChat();
    if (!mdUp) setMobileDrawerOpen(false);
  }, [handleNewChat, mdUp]);

  useEffect(() => {
    if (mdUp) setMobileDrawerOpen(false);
  }, [mdUp]);

  useEffect(() => {
    if (!mobileDrawerOpen || mdUp) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileDrawerOpen, mdUp]);

  useEffect(() => {
    if (!mobileDrawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileDrawerOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileDrawerOpen]);

  const handleDelete = useCallback(
    async (id: string) => {
      if (!token) return;
      try {
        await deleteConversation(token, id);
        const list = await refreshList();
        if (activeId === id) {
          setFollowUpByMessageId({});
          setFollowUpStatusByMessageId({});
          if (list.length) await loadConversation(list[0].id);
          else {
            const created = await createConversation(token, mode);
            await refreshList();
            await loadConversation(created.id);
          }
        }
      } catch (e) {
        setLoadError(e instanceof Error ? e.message : "Failed to delete");
      }
    },
    [token, activeId, refreshList, loadConversation, mode]
  );

  const handleModeChange = useCallback(
    async (next: TradeModeId) => {
      setMode(next);
      if (!token || !activeId) return;
      try {
        await patchConversationMode(token, activeId, next);
        setConversations((prev) =>
          prev.map((c) => (c.id === activeId ? { ...c, mode: next } : c))
        );
      } catch (e) {
        setLoadError(e instanceof Error ? e.message : "Failed to update mode");
      }
    },
    [token, activeId]
  );

  const handleSend = useCallback(
    async (text: string) => {
      if (!token || !activeId) return;
      const trimmed = text.trim();
      if (!trimmed) return;

      const editId = editingFromMessageId;
      setEditingFromMessageId(null);
      setComposerText("");

      setLoadError(null);
      setSending(true);
      streamAccum.current = "";
      setStreaming("");

      try {
        if (editId && isMongoObjectId(editId)) {
          await rollbackFromMessage(token, activeId, editId);
          setFollowUpByMessageId({});
          await loadConversation(activeId);
        }

        const optimisticUser: UiMessage = {
          id: `local-${Date.now()}`,
          role: "user",
          content: trimmed,
          askedMode: mode,
        };
        setMessages((prev) => [...prev, optimisticUser]);

        await streamAssistantReply(token, activeId, trimmed, (ev) => {
          if (ev.type === "delta") {
            streamAccum.current += ev.content;
            setStreaming(streamAccum.current);
          }
          if (ev.type === "done") {
            if (ev.title) {
              setTitle(ev.title);
              setConversations((prev) =>
                prev.map((c) => (c.id === activeId ? { ...c, title: ev.title ?? c.title } : c))
              );
            }
            if (ev.model) {
              setReplyMeta({
                model: ev.model,
                usedWebSearch: Boolean(ev.usedWebSearch),
              });
            }
            if (ev.assistantMessageId && ev.suggestedQuestions?.length) {
              setFollowUpByMessageId((prev) => ({
                ...prev,
                [ev.assistantMessageId!]: ev.suggestedQuestions!,
              }));
              setFollowUpStatusByMessageId((prev) => ({
                ...prev,
                [ev.assistantMessageId!]: { status: "ready" },
              }));
            } else if (
              ev.assistantMessageId &&
              ev.followUpStatus === "withdrawn"
            ) {
              setFollowUpStatusByMessageId((prev) => ({
                ...prev,
                [ev.assistantMessageId!]: {
                  status: "withdrawn",
                  notice:
                    ev.followUpNotice ??
                    "Suggested questions were automatically withdrawn.",
                },
              }));
            }
          }
          if (ev.type === "error") {
            setLoadError(ev.message);
          }
        });

        await loadConversation(activeId);
        setStreaming("");
      } catch (e) {
        setLoadError(e instanceof Error ? e.message : "Send failed");
        setStreaming("");
        if (token && activeId) {
          try {
            await loadConversation(activeId);
          } catch {
            // ignore resync errors
          }
        }
      } finally {
        setSending(false);
      }
    },
    [token, activeId, editingFromMessageId, loadConversation, mode]
  );

  const handleEditUserMessage = useCallback((messageId: string, content: string) => {
    if (!isMongoObjectId(messageId)) return;
    setEditingFromMessageId(messageId);
    setComposerText(content);
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingFromMessageId(null);
    setComposerText("");
  }, []);

  const showFollowUpSuggestions = messages.length > 0 && !sending && !streaming;

  if (!token || !user) {
    return null;
  }

  if (!bootstrapped) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-th-bg text-th-text">
        <p className="text-sm text-th-text-muted">Loading TradeGPT…</p>
      </div>
    );
  }

  if (modes.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-th-bg px-4 text-center text-th-text">
        <p className="text-sm text-red-500">{loadError ?? "Could not load TradeGPT."}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-teal-600 to-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-teal-glow hover:from-teal-500 hover:to-emerald-500"
        >
          <FiRefreshCw aria-hidden className="h-4 w-4" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <>
    <div className="flex h-[100dvh] w-full overflow-hidden bg-th-bg text-th-text">
      <ChatSidebar
        conversations={conversations}
        activeId={activeId}
        onNewChat={handleNewChatWithMobileClose}
        onSelect={handleSelectWithMobileClose}
        onDelete={handleDelete}
        userEmail={user.email}
        subscription={subscription}
        onLogout={logout}
        onOpenSettings={() => openSettings("general")}
        onUpgrade={() => openSettings("subscription")}
        collapsed={mdUp ? sidebarCollapsed : false}
        onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
        isMobileLayout={!mdUp}
        mobileOpen={mobileDrawerOpen}
        onCloseMobile={() => setMobileDrawerOpen(false)}
      />

      <div className="relative z-0 flex min-w-0 flex-1 flex-col pr-[env(safe-area-inset-right)]">
        {modes.length > 0 && (
          <ChatHeader
            modes={modes}
            mode={mode}
            onModeChange={handleModeChange}
            title={title}
            replyMeta={replyMeta}
            onOpenMenu={mdUp ? undefined : () => setMobileDrawerOpen(true)}
          />
        )}

        {loadError && (
          <div className="shrink-0 border-b border-red-500/30 bg-red-500/10 px-4 py-2 text-center text-xs text-red-500">
            {loadError}
          </div>
        )}

        <ChatMessageList
          messages={messages}
          streamingContent={streaming}
          mode={mode}
          modeOptions={modes}
          conversationId={activeId ?? ""}
          onPickSuggestion={(q) => void handleSend(q)}
          onCopy={copyToClipboard}
          onEditUserMessage={handleEditUserMessage}
          showFollowUpSuggestions={showFollowUpSuggestions}
          followUpByMessageId={followUpByMessageId}
          followUpStatusByMessageId={followUpStatusByMessageId}
        />
        <div ref={bottomRef} className="h-px shrink-0" aria-hidden />

        <ChatComposer
          disabled={sending || !activeId}
          onSend={handleSend}
          value={composerText}
          onChange={setComposerText}
          editingHint={
            editingFromMessageId
              ? "Editing a previous message — send to replace it and all replies after it"
              : null
          }
          onCancelEdit={editingFromMessageId ? cancelEdit : undefined}
        />
      </div>

    </div>

    <AnimatePresence>
      {settingsModalOpen && (
        <>
          <motion.button
            key="settings-backdrop"
            type="button"
            aria-label="Close settings"
            className="fixed inset-0 z-[89] cursor-pointer border-0 bg-slate-950/55 p-0 backdrop-blur-[2px] motion-reduce:backdrop-blur-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={backdropFadeTransition(reduceMotion)}
            onClick={closeSettings}
          />
          <div className="pointer-events-none fixed inset-0 z-[90] flex items-center justify-center p-3 sm:p-5">
            <motion.div
              key="settings-panel"
              role="dialog"
              aria-modal="true"
              aria-labelledby="settings-modal-title"
              className="pointer-events-auto relative flex h-[min(880px,90dvh)] min-h-0 w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-th-border bg-th-bg shadow-2xl"
              initial={reduceMotion ? false : { opacity: 0, y: 28, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={
                reduceMotion
                  ? { opacity: 0, transition: modalPanelExitTransition(true) }
                  : {
                      opacity: 0,
                      y: 16,
                      scale: 0.97,
                      transition: modalPanelExitTransition(false),
                    }
              }
              transition={modalPanelTransition(reduceMotion)}
            >
              <SettingsView
                variant="modal"
                section={settingsSection}
                onSectionChange={setSettingsSection}
                onClose={closeSettings}
              />
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
    </>
  );
}
