import { API_BASE } from "@/config/env";
import { getApiErrorMessage } from "@/lib/apiError";

export type TradeModeId =
  | "market_analysis"
  | "trade_signals"
  | "strategy"
  | "risk_management"
  | "trader_psychology"
  | "news_sentiment"
  | "education"
  | "safe_binance_trading_bot"
  | "cryptdocker";

export type TradeModeMeta = {
  id: TradeModeId;
  label: string;
  shortLabel: string;
  description: string;
};

export async function fetchModes(): Promise<TradeModeMeta[]> {
  const res = await fetch(`${API_BASE}/api/chat/modes`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(getApiErrorMessage(data, "Unable to load chat modes."));
  return data.modes as TradeModeMeta[];
}

function authHeaders(token: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export async function listConversations(token: string) {
  const res = await fetch(`${API_BASE}/api/chat/conversations`, {
    headers: authHeaders(token),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(getApiErrorMessage(data, "Unable to load your chat history."));
  return data.conversations as {
    id: string;
    title: string;
    mode: TradeModeId;
    updatedAt: string;
    messageCount: number;
  }[];
}

export async function createConversation(token: string, mode: TradeModeId) {
  const res = await fetch(`${API_BASE}/api/chat/conversations`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ mode }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(getApiErrorMessage(data, "Unable to start a new chat right now."));
  return data as { id: string; title: string; mode: TradeModeId };
}

export async function getConversation(token: string, id: string) {
  const res = await fetch(`${API_BASE}/api/chat/conversations/${id}`, {
    headers: authHeaders(token),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(getApiErrorMessage(data, "Unable to open this chat right now."));
  return data as {
    id: string;
    title: string;
    mode: TradeModeId;
    messages: {
      id: string;
      role: string;
      content: string;
      createdAt: string;
      /** Present on user messages when saved (mode at time of send). */
      tradeMode?: TradeModeId;
      suggestedQuestions?: string[];
    }[];
  };
}

/** Plain-text export of every conversation (user + assistant messages). */
export async function buildChatHistoryExportText(token: string): Promise<string> {
  const list = await listConversations(token);
  const modeMetas = await fetchModes();
  const modeLabel = (id: TradeModeId): string =>
    modeMetas.find((x) => x.id === id)?.label ?? id;

  const lines: string[] = [
    "TradeGPT — chat history export",
    `Exported (UTC): ${new Date().toISOString()}`,
    `Conversations: ${list.length}`,
    "",
  ];
  const sorted = [...list].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
  for (const c of sorted) {
    const conv = await getConversation(token, c.id);
    lines.push("=".repeat(72));
    lines.push(`Title: ${conv.title || "Untitled"}`);
    lines.push(`Conversation mode (current): ${modeLabel(conv.mode)}`);
    lines.push(`Conversation ID: ${conv.id}`);
    lines.push("-".repeat(72));
    for (const m of conv.messages) {
      if (m.role !== "user" && m.role !== "assistant") continue;
      const label = m.role === "user" ? "User" : "Assistant";
      const ts = m.createdAt ? new Date(m.createdAt).toISOString() : "";
      const modeMark =
        m.role === "user" && m.tradeMode
          ? ` | asked in mode: ${modeLabel(m.tradeMode)}`
          : "";
      lines.push(`[${label}${modeMark}] ${ts}`);
      lines.push(m.content.replace(/\r\n/g, "\n").trimEnd());
      lines.push("");
    }
    lines.push("");
  }
  return lines.join("\n");
}

export async function patchConversationMode(
  token: string,
  id: string,
  mode: TradeModeId
) {
  const res = await fetch(`${API_BASE}/api/chat/conversations/${id}`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify({ mode }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(getApiErrorMessage(data, "Unable to update chat mode."));
  return data as { id: string; mode: TradeModeId };
}

export async function deleteConversation(token: string, id: string) {
  const res = await fetch(`${API_BASE}/api/chat/conversations/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(getApiErrorMessage(data, "Unable to delete this chat."));
  }
}

export async function deleteAllConversations(token: string): Promise<{
  deletedConversations: number;
  deletedMessages: number;
}> {
  const res = await fetch(`${API_BASE}/api/chat/conversations`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(getApiErrorMessage(data, "Unable to delete your chat history."));
  return {
    deletedConversations: Number(data.deletedConversations ?? 0),
    deletedMessages: Number(data.deletedMessages ?? 0),
  };
}

export async function rollbackFromMessage(
  token: string,
  conversationId: string,
  fromMessageId: string
) {
  const res = await fetch(
    `${API_BASE}/api/chat/conversations/${conversationId}/rollback`,
    {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify({ fromMessageId }),
    }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(getApiErrorMessage(data, "Unable to edit this message."));
  return data as { ok: boolean; removed: number };
}

export type StreamEvent =
  | { type: "delta"; content: string }
  | {
      type: "done";
      title?: string;
      model?: string;
      usedWebSearch?: boolean;
      assistantMessageId?: string;
      suggestedQuestions?: string[];
      followUpStatus?: "ready" | "withdrawn";
      followUpNotice?: string;
      router?: {
        needs_web_search?: boolean;
        complexity?: string;
        reason?: string;
      };
    }
  | { type: "error"; message: string };

export async function streamAssistantReply(
  token: string,
  conversationId: string,
  content: string,
  onEvent: (ev: StreamEvent) => void
): Promise<void> {
  const res = await fetch(
    `${API_BASE}/api/chat/conversations/${conversationId}/messages`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content }),
    }
  );

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(getApiErrorMessage(data, "Unable to send your message right now."));
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";
    for (const block of parts) {
      parseSseBlock(block, onEvent);
    }
  }
  if (buffer.trim()) {
    parseSseBlock(buffer, onEvent);
  }
}

function parseSseBlock(block: string, onEvent: (ev: StreamEvent) => void) {
  const line = block.trim();
  if (!line.startsWith("data:")) return;
  const payload = line.slice(5).trim();
  try {
    const ev = JSON.parse(payload) as StreamEvent;
    onEvent(ev);
  } catch {
    // ignore malformed chunk
  }
}
