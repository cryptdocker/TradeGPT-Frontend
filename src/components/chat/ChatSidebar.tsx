import type { SubscriptionInfo } from "@/lib/api";

type Conv = { id: string; title: string; mode: string };

type Props = {
  conversations: Conv[];
  activeId: string | null;
  onNewChat: () => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  userEmail: string;
  subscription: SubscriptionInfo | null;
  onLogout: () => void;
  onOpenSettings: () => void;
  onUpgrade: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  /** Narrow / mobile: drawer over the chat; does not consume horizontal flex space. */
  isMobileLayout?: boolean;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
};

export function ChatSidebar({
  conversations,
  activeId,
  onNewChat,
  onSelect,
  onDelete,
  userEmail,
  subscription,
  onLogout,
  onOpenSettings,
  onUpgrade,
  collapsed,
  onToggleCollapse,
  isMobileLayout = false,
  mobileOpen = false,
  onCloseMobile,
}: Props) {
  const closeOrToggle = () => {
    if (isMobileLayout && onCloseMobile) onCloseMobile();
    else onToggleCollapse();
  };

  const mobileAsideBase =
    "fixed inset-y-0 left-0 z-50 flex h-[100dvh] w-[min(288px,88vw)] flex-col border-r border-th-border/90 bg-th-sidebar/95 shadow-2xl backdrop-blur-md transition-transform duration-300 ease-out motion-reduce:transition-none pl-[env(safe-area-inset-left)]";
  const mobileAsideOpen = "translate-x-0";
  const mobileAsideClosed = "-translate-x-full pointer-events-none";

  if (collapsed && !isMobileLayout) {
    return (
      <aside className="flex w-14 shrink-0 flex-col border-r border-th-border bg-th-sidebar">
        <div className="flex flex-col items-center gap-2 p-2">
          <button
            type="button"
            onClick={onToggleCollapse}
            className="min-h-[44px] min-w-[44px] rounded-lg p-2 text-th-text hover:bg-th-surface"
            title="Open sidebar"
            aria-label="Open sidebar"
          >
            <MenuIcon />
          </button>
          <button
            type="button"
            onClick={onNewChat}
            className="min-h-[44px] min-w-[44px] rounded-lg p-2 text-th-text hover:bg-th-surface"
            title="New chat"
            aria-label="New chat"
          >
            <PlusIcon />
          </button>
          <button
            type="button"
            onClick={onOpenSettings}
            className="min-h-[44px] min-w-[44px] rounded-lg p-2 text-th-text hover:bg-th-surface"
            title="Settings"
            aria-label="Settings"
          >
            <GearIcon />
          </button>
        </div>
      </aside>
    );
  }

  const expandedAside = (
    <aside
      className={
        isMobileLayout
          ? `${mobileAsideBase} ${mobileOpen ? mobileAsideOpen : mobileAsideClosed}`
          : "flex w-[260px] shrink-0 flex-col border-r border-th-border/90 bg-th-sidebar/95 backdrop-blur-sm"
      }
      aria-hidden={isMobileLayout ? !mobileOpen : undefined}
    >
      <div className="flex items-center gap-1 p-2">
        <button
          type="button"
          onClick={closeOrToggle}
          className="min-h-[44px] min-w-[44px] shrink-0 rounded-lg p-2 text-th-text hover:bg-th-surface"
          title={isMobileLayout ? "Close menu" : "Close sidebar"}
          aria-label={isMobileLayout ? "Close menu" : "Close sidebar"}
        >
          <MenuIcon />
        </button>
        <button
          type="button"
          onClick={onNewChat}
          className="flex min-h-[44px] flex-1 items-center gap-2 rounded-xl border border-th-border bg-th-input px-3 py-2 text-sm font-medium text-th-text transition-colors hover:bg-th-input-hover"
        >
          <PlusIcon />
          New chat
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 pb-2">
        <ul className="space-y-0.5">
          {conversations.map((c) => (
            <li key={c.id} className="group relative">
              <button
                type="button"
                onClick={() => onSelect(c.id)}
                className={`w-full truncate rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                  c.id === activeId
                    ? "bg-th-surface text-th-text shadow-sm"
                    : "text-th-text/90 hover:bg-th-input"
                }`}
              >
                {c.title || "New chat"}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(c.id);
                }}
                className="absolute right-1 top-1/2 flex -translate-y-1/2 rounded-md p-2 text-th-text-muted opacity-100 hover:bg-th-input hover:text-th-text md:opacity-0 md:group-hover:opacity-100"
                title="Delete chat"
                aria-label="Delete chat"
              >
                <TrashIcon />
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-th-border p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {subscription && (
          <div className="mb-1 px-2">
            <PlanBadge subscription={subscription} />
          </div>
        )}
        {subscription && subscription.plan !== "pro" && (
          <button
            type="button"
            onClick={onUpgrade}
            className="mb-1 flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-slate-800"
          >
            <StarIcon />
            Upgrade to Pro
          </button>
        )}
        <div className="flex items-center gap-2 rounded-lg px-2 py-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-600 text-xs font-semibold text-white">
            {userEmail.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-th-text">{userEmail}</p>
            <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-1">
              <button
                type="button"
                onClick={onOpenSettings}
                className="text-xs text-th-text-muted hover:text-th-text"
              >
                Settings
              </button>
              <button
                type="button"
                onClick={onLogout}
                className="text-xs text-th-text-muted hover:text-th-text"
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );

  if (!isMobileLayout) {
    return expandedAside;
  }

  return (
    <>
      {mobileOpen && onCloseMobile && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-[1px] motion-reduce:backdrop-blur-none"
          aria-label="Close menu"
          onClick={onCloseMobile}
        />
      )}
      {expandedAside}
    </>
  );
}

function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 6h18M8 6V4h8v2M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" strokeLinecap="round" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path
        d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PlanBadge({ subscription }: { subscription: SubscriptionInfo }) {
  const isPro = subscription.plan === "pro";
  const isTrial = subscription.trialActive;

  if (isPro) {
    return (
      <div className="flex items-center gap-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1.5">
        <StarIcon />
        <span className="text-xs font-semibold text-cyan-500">Pro Plan</span>
      </div>
    );
  }

  if (isTrial) {
    const days = subscription.trialDaysLeft;
    const urgent = days <= 2;
    return (
      <div
        className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 ${
          urgent
            ? "bg-amber-500/10 border border-amber-500/30"
            : "bg-cyan-500/10 border border-cyan-500/30"
        }`}
      >
        <ClockIcon className={urgent ? "text-amber-500" : "text-cyan-500"} />
        <span className={`text-xs font-medium ${urgent ? "text-amber-500" : "text-cyan-500"}`}>
          Free Trial — {days} day{days === 1 ? "" : "s"} left
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 rounded-lg bg-th-surface border border-th-border px-2.5 py-1.5">
      <span className="text-xs font-medium text-th-text-muted">Free Plan</span>
    </div>
  );
}

function StarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-cyan-500">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" strokeLinecap="round" />
    </svg>
  );
}
