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
  apiGoogleCodeLogin,
  apiLogin,
  apiMe,
  apiRegister,
  apiResendCode,
  apiVerifyEmail,
  type AuthUser,
  type SubscriptionInfo,
} from "@/lib/api";
import {
  STORAGE_KEYS,
  readJson,
  removeKey,
  writeJson,
} from "@/config/storage";
import {
  getCrossDomainAuth,
  setCrossDomainAuth,
  clearCrossDomainAuth,
  type CrossDomainAuthPayload,
} from "@/config/crossDomainAuth";

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  subscription: SubscriptionInfo | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogleCode: (code: string) => Promise<void>;
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

/**
 * Load auth from localStorage first; if not found, check cross-domain cookie.
 * This allows SSO between cryptdocker.com and trade.cryptdocker.com.
 */
function loadInitialAuth(): CrossDomainAuthPayload | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.sharedAuth);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<CrossDomainAuthPayload>;
      if (parsed?.token && parsed?.user?.email) {
        return parsed as CrossDomainAuthPayload;
      }
    }
  } catch { /* ignore */ }

  return getCrossDomainAuth();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initial = loadInitialAuth();
    const s = readJson<SubscriptionInfo>(STORAGE_KEYS.subscription);

    if (initial) {
      setToken(initial.token);
      setUser(initial.user);
      if (s) setSubscription(s);

      writeJson(STORAGE_KEYS.sharedAuth, initial);
      setCrossDomainAuth(initial);

      apiMe(initial.token)
        .then(({ user: freshUser, subscription: freshSub }) => {
          setUser(freshUser);
          const payload = { user: freshUser, token: initial.token };
          writeJson(STORAGE_KEYS.sharedAuth, payload);
          setCrossDomainAuth(payload);
          if (freshSub) {
            writeJson(STORAGE_KEYS.subscription, freshSub);
            setSubscription(freshSub);
          }
        })
        .catch(() => {
          setToken(null);
          setUser(null);
          removeKey(STORAGE_KEYS.sharedAuth);
          clearCrossDomainAuth();
        });
    }
    setLoading(false);
  }, []);

  const persistSub = useCallback((s: SubscriptionInfo) => {
    writeJson(STORAGE_KEYS.subscription, s);
    setSubscription(s);
  }, []);

  const persist = useCallback(
    (t: string, u: AuthUser, s?: SubscriptionInfo) => {
      const payload = { user: u, token: t };
      writeJson(STORAGE_KEYS.sharedAuth, payload);
      setCrossDomainAuth(payload);
      setToken(t);
      setUser(u);
      if (s) persistSub(s);
    },
    [persistSub]
  );

  const refreshSubscription = useCallback(async () => {
    const initial = loadInitialAuth();
    if (!initial?.token) return;
    try {
      const sub = await apiGetSubscription(initial.token);
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

  const loginWithGoogleCode = useCallback(
    async (code: string) => {
      const { token: t, user: u, subscription: s } = await apiGoogleCodeLogin({ code });
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
    removeKey(STORAGE_KEYS.sharedAuth);
    removeKey(STORAGE_KEYS.subscription);
    clearCrossDomainAuth();
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
      loginWithGoogleCode,
      register,
      verifyEmail,
      resendCode,
      refreshSubscription,
      logout,
    }),
    [user, token, subscription, loading, login, loginWithGoogleCode, register, verifyEmail, resendCode, refreshSubscription, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
