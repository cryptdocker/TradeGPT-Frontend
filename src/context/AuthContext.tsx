import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  apiGetSubscription,
  apiLogin,
  apiRegister,
  apiResendCode,
  apiVerifyEmail,
  type AuthUser,
  type SubscriptionInfo,
} from "@/lib/api";

const STORAGE_KEY = "tradegpt_token";
const STORAGE_USER = "tradegpt_user";
const STORAGE_SUB = "tradegpt_subscription";

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  subscription: SubscriptionInfo | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    confirmPassword: string
  ) => Promise<string>;
  verifyEmail: (email: string, code: string) => Promise<void>;
  resendCode: (email: string) => Promise<void>;
  refreshSubscription: () => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_USER);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

function readStoredSub(): SubscriptionInfo | null {
  try {
    const raw = localStorage.getItem(STORAGE_SUB);
    if (!raw) return null;
    return JSON.parse(raw) as SubscriptionInfo;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = localStorage.getItem(STORAGE_KEY);
    const u = readStoredUser();
    const s = readStoredSub();
    if (t && u) {
      setToken(t);
      setUser(u);
      if (s) setSubscription(s);
    }
    setLoading(false);
  }, []);

  const persistSub = useCallback((s: SubscriptionInfo) => {
    localStorage.setItem(STORAGE_SUB, JSON.stringify(s));
    setSubscription(s);
  }, []);

  const persist = useCallback(
    (t: string, u: AuthUser, s?: SubscriptionInfo) => {
      localStorage.setItem(STORAGE_KEY, t);
      localStorage.setItem(STORAGE_USER, JSON.stringify(u));
      setToken(t);
      setUser(u);
      if (s) persistSub(s);
    },
    [persistSub]
  );

  const refreshSubscription = useCallback(async () => {
    const currentToken = localStorage.getItem(STORAGE_KEY);
    if (!currentToken) return;
    try {
      const sub = await apiGetSubscription(currentToken);
      persistSub(sub);
    } catch {
      // silently ignore — stale cache is acceptable
    }
  }, [persistSub]);

  useEffect(() => {
    if (token) refreshSubscription();
  }, [token, refreshSubscription]);

  const login = useCallback(
    async (email: string, password: string) => {
      const { token: t, user: u, subscription: s } = await apiLogin({ email, password });
      persist(t, u, s ?? undefined);
      if (!s) {
        try {
          const sub = await apiGetSubscription(t);
          persistSub(sub);
        } catch { /* ignore */ }
      }
    },
    [persist, persistSub]
  );

  const register = useCallback(
    async (
      email: string,
      password: string,
      confirmPassword: string
    ): Promise<string> => {
      const { email: confirmedEmail } = await apiRegister({
        email,
        password,
        confirmPassword,
      });
      return confirmedEmail;
    },
    []
  );

  const verifyEmail = useCallback(
    async (email: string, code: string) => {
      const { token: t, user: u, subscription: s } = await apiVerifyEmail({ email, code });
      persist(t, u, s ?? undefined);
    },
    [persist]
  );

  const resendCode = useCallback(async (email: string) => {
    await apiResendCode({ email });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_USER);
    localStorage.removeItem(STORAGE_SUB);
    setToken(null);
    setUser(null);
    setSubscription(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      subscription,
      isAuthenticated: Boolean(token && user),
      loading,
      login,
      register,
      verifyEmail,
      resendCode,
      refreshSubscription,
      logout,
    }),
    [user, token, subscription, loading, login, register, verifyEmail, resendCode, refreshSubscription, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
