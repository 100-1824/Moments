/**
 * AuthContext — app-wide authentication and session state.
 *
 * Persists the bearer token in localStorage and rehydrates on mount by
 * calling GET /api/auth/me so the user never has to log in again after a
 * page refresh.
 */

import * as React from "react";
import * as api from "@/src/lib/api";

interface AuthState {
  /** Null while the initial /me check is in flight. */
  isLoading: boolean;
  user: api.ApiUser | null;
  partner: api.ApiUser | null;
  token: string | null;
  /** Count of today's uploads by the current user (0-3). */
  dailyCount: number;
}

interface AuthActions {
  sendOtp: (email: string) => Promise<{ otp?: string }>;
  verifyOtp: (email: string, code: string, name?: string) => Promise<void>;
  register: (name: string, email: string, timezone: string) => Promise<void>;
  connect: (partnerCode: string) => Promise<void>;
  refreshMe: () => Promise<void>;
  logout: () => Promise<void>;
  setDailyCount: (n: number) => void;
  setPartner: (p: api.ApiUser | null) => void;
}

const AuthContext = React.createContext<AuthState & AuthActions>({} as AuthState & AuthActions);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<AuthState>({
    isLoading: true,
    user: null,
    partner: null,
    token: null,
    dailyCount: 0,
  });

  // On mount: if a token exists, validate it and populate user/partner.
  React.useEffect(() => {
    const token = api.getToken();
    if (!token) {
      setState((s) => ({ ...s, isLoading: false }));
      return;
    }

    api
      .me()
      .then(({ user, partner }) => {
        setState((s) => ({ ...s, isLoading: false, user, partner, token }));
      })
      .catch(() => {
        api.clearToken();
        setState((s) => ({ ...s, isLoading: false }));
      });
  }, []);

  const sendOtp = async (email: string) => {
    return await api.sendOtp(email);
  };

  const verifyOtp = async (email: string, code: string, name?: string) => {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    const { user, token } = await api.verifyOtp({ email, code, name, timezone });
    api.setToken(token);
    setState((s) => ({ ...s, user, token, partner: null, dailyCount: 0 }));
  };

  const register = async (name: string, email: string, timezone: string) => {
    const { user, token } = await api.register(name, email, timezone);
    api.setToken(token);
    setState((s) => ({ ...s, user, token, partner: null, dailyCount: 0 }));
  };

  const connect = async (partnerCode: string) => {
    const { user, partner } = await api.connect(partnerCode);
    setState((s) => ({ ...s, user, partner }));
  };

  const refreshMe = async () => {
    const { user, partner } = await api.me();
    setState((s) => ({ ...s, user, partner }));
  };

  const logout = async () => {
    await api.logout();
    setState({ isLoading: false, user: null, partner: null, token: null, dailyCount: 0 });
  };

  const setDailyCount = (dailyCount: number) =>
    setState((s) => ({ ...s, dailyCount }));

  const setPartner = (partner: api.ApiUser | null) =>
    setState((s) => ({ ...s, partner }));

  return (
    <AuthContext.Provider
      value={{ ...state, sendOtp, verifyOtp, register, connect, refreshMe, logout, setDailyCount, setPartner }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState & AuthActions {
  return React.useContext(AuthContext);
}
