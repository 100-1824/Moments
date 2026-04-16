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
  /** Slots filled today by the current user. */
  dailySlots: string[];
}

interface AuthActions {
  sendOtp: (email: string) => Promise<{ otp?: string }>;
  sendAdminOtp: (email: string) => Promise<{ otp?: string }>;
  verifyOtp: (email: string, code: string, name?: string) => Promise<void>;
  verifyAdminOtp: (email: string, code: string) => Promise<void>;
  register: (name: string, email: string, timezone: string) => Promise<void>;
  connect: (partnerCode: string) => Promise<void>;
  refreshMe: () => Promise<void>;
  logout: () => Promise<void>;
  setDailySlots: (slots: string[]) => void;
  setPartner: (p: api.ApiUser | null) => void;
}

const AuthContext = React.createContext<AuthState & AuthActions>({} as AuthState & AuthActions);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<AuthState>({
    isLoading: true,
    user: null,
    partner: null,
    token: null,
    dailySlots: [],
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

  const sendAdminOtp = async (email: string) => {
    return await api.sendOtp(email, true);
  };

  const verifyOtp = async (email: string, code: string, name?: string) => {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    const { user, token } = await api.verifyOtp({ email, code, name, timezone });
    api.setToken(token);
    // Optimistic state so the UI can proceed immediately
    setState((s) => ({ ...s, user, token, partner: null, dailySlots: [] }));
    // Then force a full server sync to pick up any existing couple_id / partner
    try {
      const { user: freshUser, partner: freshPartner } = await api.me();
      setState((s) => ({ ...s, user: freshUser, partner: freshPartner }));
    } catch {
      // Non-fatal: optimistic state still lets the app render
    }
  };

  const verifyAdminOtp = async (email: string, code: string) => {
    const { user, token } = await api.verifyAdminOtp(email, code);
    api.setToken(token);
    setState((s) => ({ ...s, user, token, partner: null, dailySlots: [] }));
  };

  const register = async (name: string, email: string, timezone: string) => {
    const { user, token } = await api.register(name, email, timezone);
    api.setToken(token);
    setState((s) => ({ ...s, user, token, partner: null, dailySlots: [] }));
  };

  const connect = async (partnerCode: string) => {
    const { user, partner } = await api.connect(partnerCode);
    setState((s) => ({ ...s, user, partner }));
    // Force a full server sync after connecting to ensure couple_id is populated
    try {
      const { user: freshUser, partner: freshPartner } = await api.me();
      setState((s) => ({ ...s, user: freshUser, partner: freshPartner }));
    } catch {
      // Non-fatal: optimistic pair state is already set
    }
  };

  const refreshMe = async () => {
    const { user, partner } = await api.me();
    // Fetch today's moments to populate dailySlots
    const { moments } = await api.fetchTodayMoments();
    const myFilledSlots = moments
      .filter((m) => m.user_id === user.id)
      .map((m) => m.slot);

    setState((s) => ({ ...s, user, partner, dailySlots: myFilledSlots }));
  };

  const logout = async () => {
    await api.logout();
    setState({ isLoading: false, user: null, partner: null, token: null, dailySlots: [] });
  };

  const setDailySlots = (dailySlots: string[]) =>
    setState((s) => ({ ...s, dailySlots }));

  const setPartner = (partner: api.ApiUser | null) =>
    setState((s) => ({ ...s, partner }));

  return (
    <AuthContext.Provider
      value={{ ...state, sendOtp, sendAdminOtp, verifyOtp, verifyAdminOtp, register, connect, refreshMe, logout, setDailySlots, setPartner }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState & AuthActions {
  return React.useContext(AuthContext);
}
