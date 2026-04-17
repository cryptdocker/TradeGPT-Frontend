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
import {
  STORAGE_KEYS,
  readJson,
  readString,
  removeKey,
  writeJson,
  writeString,
} from "@/config/storage";

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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = readString(STORAGE_KEYS.authToken);
    const u = readJson<AuthUser>(STORAGE_KEYS.authUser);
    const s = readJson<SubscriptionInfo>(STORAGE_KEYS.subscription);
    if (t && u) {
      setToken(t);
      setUser(u);
      if (s) setSubscription(s);
    }
    setLoading(false);
  }, []);

  const persistSub = useCallback((s: SubscriptionInfo) => {
    writeJson(STORAGE_KEYS.subscription, s);
    setSubscription(s);
  }, []);

  const persist = useCallback(
    (t: string, u: AuthUser, s?: SubscriptionInfo) => {
      writeString(STORAGE_KEYS.authToken, t);
      writeJson(STORAGE_KEYS.authUser, u);
      setToken(t);
      setUser(u);
      if (s) persistSub(s);
    },
    [persistSub]
  );

  const refreshSubscription = useCallback(async () => {
    const currentToken = readString(STORAGE_KEYS.authToken);
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
    removeKey(STORAGE_KEYS.authToken);
    removeKey(STORAGE_KEYS.authUser);
    removeKey(STORAGE_KEYS.subscription);
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
