import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  FiMenu,
  FiPlus,
  FiTrash2,
  FiSettings,
  FiX,
  FiLogOut,
  FiStar,
} from "react-icons/fi";
import type { SubscriptionInfo } from "@/lib/api";
import {
  backdropFadeTransition,
  drawerTransition,
  popoverExitTransition,
  popoverTransition,
  sidebarContentTransition,
  sidebarWidthTransition,
} from "@/config/motion";

type Conv = { id: string; title: string; mode: string };

const SIDEBAR_RAIL_PX = 56;
const SIDEBAR_EXPANDED_PX = 260;

/** Header / collapsed-rail icon buttons (same look in both states). */
const sidebarHeaderIconBtnClass =
  "flex rounded-full bg-transparent p-3 text-teal-700 transition-colors hover:bg-teal-300/20 dark:text-teal-300 dark:hover:bg-teal-500/20";

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
  const reduceMotion = useReducedMotion();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  /** True while collapsed-rail account menu exit animation runs (keeps z-index/overflow until done). */
  const [collapsedRailMenuExiting, setCollapsedRailMenuExiting] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const userMenuCollapsedRef = useRef<HTMLDivElement>(null);
  const prevDesktopCollapsedRef = useRef(collapsed);
  const prevUserMenuOpenRef = useRef(userMenuOpen);

  const widthSpring = sidebarWidthTransition(reduceMotion);
  const contentCrossfade = sidebarContentTransition(reduceMotion);
  const drawerSpring = drawerTransition(reduceMotion);

  useEffect(() => {
    if (!userMenuOpen) return;
    const close = () => setUserMenuOpen(false);
    const insideAnchors = (n: Node) =>
      Boolean(
        userMenuRef.current?.contains(n) || userMenuCollapsedRef.current?.contains(n),
      );
    const onPointerDown = (e: PointerEvent) => {
      if (!insideAnchors(e.target as Node)) close();
    };
    const onKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [userMenuOpen]);

  useEffect(() => {
    if (isMobileLayout) return;
    if (prevDesktopCollapsedRef.current !== collapsed) {
      setUserMenuOpen(false);
      setCollapsedRailMenuExiting(false);
      prevDesktopCollapsedRef.current = collapsed;
    }
  }, [collapsed, isMobileLayout]);

  useLayoutEffect(() => {
    if (isMobileLayout || !collapsed) {
      setCollapsedRailMenuExiting(false);
    } else if (userMenuOpen) {
      setCollapsedRailMenuExiting(false);
    } else if (prevUserMenuOpenRef.current) {
      setCollapsedRailMenuExiting(true);
    }
    prevUserMenuOpenRef.current = userMenuOpen;
  }, [userMenuOpen, collapsed, isMobileLayout]);

  const closeOrToggle = () => {
    if (isMobileLayout && onCloseMobile) onCloseMobile();
    else onToggleCollapse();
  };

  const accountMenuInExpandedFooter = isMobileLayout || !collapsed;

  const expandedBody = (
    <>
      <div className="flex items-center justify-between gap-1 p-2">
        <button
          type="button"
          onClick={closeOrToggle}
          className={sidebarHeaderIconBtnClass}
          title={isMobileLayout ? "Close menu" : "Close sidebar"}
          aria-label={isMobileLayout ? "Close menu" : "Close sidebar"}
        >
          {isMobileLayout ? (
            <FiX aria-hidden className="h-5 w-5" />
          ) : (
            <FiMenu aria-hidden className="h-5 w-5" />
          )}
        </button>
        <button
          type="button"
          onClick={onNewChat}
          title="New chat"
          aria-label="New chat"
          className={sidebarHeaderIconBtnClass}
        >
          <FiPlus aria-hidden className="h-4 w-4" />
        </button>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto p-2">
        <ul className="space-y-0.5">
          {conversations.map((c) => (
            <li key={c.id} className="group relative">
              <button
                type="button"
                onClick={() => onSelect(c.id)}
                className={`w-full truncate rounded-lg px-3 py-2.5 pr-11 text-left text-sm transition-colors ${
                  c.id === activeId
                    ? "bg-teal-500/15 text-th-text shadow-sm ring-1 ring-teal-500/30 dark:bg-teal-400/15 dark:ring-teal-400/25"
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
                className="absolute right-1 top-1/2 z-10 flex -translate-y-1/2 rounded-md p-2 text-th-text-muted opacity-100 hover:bg-th-input hover:text-red-500 md:pointer-events-none md:opacity-0 md:group-hover:pointer-events-auto md:group-hover:opacity-100 md:group-focus-within:pointer-events-auto md:group-focus-within:opacity-100"
                title="Delete chat"
                aria-label="Delete chat"
              >
                <FiTrash2 aria-hidden className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-th-border p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <div ref={userMenuRef} className="relative">
          <button
            type="button"
            onClick={() => setUserMenuOpen((o) => !o)}
            aria-expanded={userMenuOpen}
            aria-haspopup="menu"
            className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-th-input data-[state=open]:bg-th-input"
            data-state={userMenuOpen ? "open" : "closed"}
            title="Account menu"
            aria-label="Account menu"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 text-sm font-semibold text-white shadow-sm">
              {userEmail.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-th-text">{userEmail}</p>
              <p className="truncate text-[11px] text-th-text-muted">
                {planLabel(subscription)}
              </p>
            </div>
          </button>
          <AnimatePresence>
            {userMenuOpen && accountMenuInExpandedFooter && (
              <AccountMenuPanel
                key="account-menu-footer"
                className="absolute bottom-full left-0 right-0 mb-1"
                reduceMotion={reduceMotion}
                onOpenSettings={() => {
                  setUserMenuOpen(false);
                  onOpenSettings();
                }}
                onUpgrade={() => {
                  setUserMenuOpen(false);
                  onUpgrade();
                }}
                onLogout={() => {
                  setUserMenuOpen(false);
                  onLogout();
                }}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );

  if (!isMobileLayout) {
    return (
      <motion.aside
        initial={false}
        animate={{
          width: collapsed ? SIDEBAR_RAIL_PX : SIDEBAR_EXPANDED_PX,
        }}
        transition={widthSpring}
        className={`relative flex h-full shrink-0 flex-col border-r border-th-border/90 bg-th-sidebar/95 backdrop-blur-sm will-change-[width] motion-reduce:will-change-auto ${
          userMenuOpen || collapsedRailMenuExiting ? "overflow-visible" : "overflow-hidden"
        } ${
          /* Keep lift until exit animation finishes, or main paints over the fading menu */
          collapsed && (userMenuOpen || collapsedRailMenuExiting) ? "z-[70]" : "z-0"
        }`}
      >
        <div className="relative min-h-0 flex-1">
          <motion.div
            aria-hidden={!collapsed}
            className="absolute inset-0 flex min-h-0 flex-col items-center p-2"
            initial={false}
            animate={{
              opacity: collapsed ? 1 : 0,
              scale: collapsed ? 1 : 0.93,
              x: collapsed ? 0 : -6,
            }}
            transition={contentCrossfade}
            style={{ pointerEvents: collapsed ? "auto" : "none" }}
          >
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={onToggleCollapse}
                className={sidebarHeaderIconBtnClass}
                title="Open sidebar"
                aria-label="Open sidebar"
              >
                <FiMenu aria-hidden className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={onNewChat}
                className={sidebarHeaderIconBtnClass}
                title="New chat"
                aria-label="New chat"
              >
                <FiPlus aria-hidden className="h-4 w-4" />
              </button>
            </div>
            <div
              ref={userMenuCollapsedRef}
              className="mt-auto flex w-full flex-col items-center pb-[max(0.25rem,env(safe-area-inset-bottom))] pt-2"
            >
              <div className="relative flex w-full justify-center">
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((o) => !o)}
                  aria-expanded={userMenuOpen}
                  aria-haspopup="menu"
                  title="Account menu"
                  aria-label="Account menu"
                  data-state={userMenuOpen ? "open" : "closed"}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 text-sm font-semibold text-white shadow-sm ring-2 ring-transparent transition-[box-shadow,transform] hover:ring-teal-400/40 data-[state=open]:ring-teal-400/50"
                >
                  {userEmail.charAt(0).toUpperCase()}
                </button>
                <AnimatePresence
                  onExitComplete={() => {
                    setCollapsedRailMenuExiting(false);
                  }}
                >
                  {userMenuOpen && collapsed && (
                    <AccountMenuPanel
                      key="account-menu-rail"
                      className="absolute bottom-full left-0 z-[1] mb-1 min-w-[12rem] w-[min(240px,calc(100vw-env(safe-area-inset-left)-0.75rem))]"
                      reduceMotion={reduceMotion}
                      onOpenSettings={() => {
                        setUserMenuOpen(false);
                        onOpenSettings();
                      }}
                      onUpgrade={() => {
                        setUserMenuOpen(false);
                        onUpgrade();
                      }}
                      onLogout={() => {
                        setUserMenuOpen(false);
                        onLogout();
                      }}
                    />
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="absolute inset-0 flex min-h-0 w-[260px] flex-col"
            initial={false}
            animate={{
              opacity: collapsed ? 0 : 1,
              scale: collapsed ? 0.96 : 1,
              x: collapsed ? -10 : 0,
            }}
            transition={contentCrossfade}
            style={{ pointerEvents: collapsed ? "none" : "auto" }}
            aria-hidden={collapsed}
          >
            {expandedBody}
          </motion.div>
        </div>
      </motion.aside>
    );
  }

  return (
    <>
      <AnimatePresence>
        {mobileOpen && onCloseMobile && (
          <motion.button
            key="drawer-backdrop"
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={backdropFadeTransition(reduceMotion)}
            className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-[1px] motion-reduce:backdrop-blur-none"
            aria-label="Close menu"
            onClick={onCloseMobile}
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{ x: mobileOpen ? 0 : "-100%" }}
        transition={drawerSpring}
        style={{ pointerEvents: mobileOpen ? "auto" : "none" }}
        aria-hidden={!mobileOpen}
        className="fixed inset-y-0 left-0 z-50 flex h-[100dvh] w-[min(288px,88vw)] flex-col border-r border-th-border/90 bg-th-sidebar/95 pl-[env(safe-area-inset-left)] shadow-2xl backdrop-blur-md will-change-transform motion-reduce:will-change-auto"
      >
        {expandedBody}
      </motion.aside>
    </>
  );
}

type AccountMenuPanelProps = {
  className?: string;
  reduceMotion: boolean | null;
  onOpenSettings: () => void;
  onUpgrade: () => void;
  onLogout: () => void;
};

function AccountMenuPanel({
  className = "",
  reduceMotion,
  onOpenSettings,
  onUpgrade,
  onLogout,
}: AccountMenuPanelProps) {
  const instant = Boolean(reduceMotion);
  return (
    <motion.div
      role="menu"
      initial={instant ? false : { opacity: 0, y: 10, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={
        instant
          ? { opacity: 0, transition: popoverExitTransition(true) }
          : { opacity: 0, y: 6, scale: 0.96, transition: popoverExitTransition(false) }
      }
      transition={popoverTransition(reduceMotion)}
      className={`origin-bottom overflow-hidden rounded-lg border border-th-border bg-th-surface py-1 shadow-lg ring-1 ring-black/5 dark:ring-white/10 ${className}`}
    >
      <button
        type="button"
        role="menuitem"
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-th-text hover:bg-th-input"
        onClick={onOpenSettings}
      >
        <FiSettings aria-hidden className="h-4 w-4 shrink-0 text-th-text-muted" />
        Settings
      </button>
      <button
        type="button"
        role="menuitem"
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-th-text hover:bg-th-input"
        onClick={onUpgrade}
      >
        <FiStar aria-hidden className="h-4 w-4 shrink-0 text-teal-600 dark:text-teal-400" />
        Upgrade Plan
      </button>
      <button
        type="button"
        role="menuitem"
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-red-600 hover:bg-th-input dark:text-red-400"
        onClick={onLogout}
      >
        <FiLogOut aria-hidden className="h-4 w-4 shrink-0 opacity-80" />
        Log Out
      </button>
    </motion.div>
  );
}

function planLabel(subscription: SubscriptionInfo | null): string {
  if (!subscription) return "Free Plan";
  if (subscription.plan === "pro") return "Pro Plan";
  if (subscription.trialActive) {
    const days = subscription.trialDaysLeft;
    return `Free Trial — ${days} day${days === 1 ? "" : "s"} left`;
  }
  return "Free Plan";
}
