import { createContext, useContext, useEffect, useState } from "react";
import { getStoredToken, getStoredUser, apiLogout } from "@/lib/api";

interface AuthContextType {
  user: any;
  token: string | null;
  loading: boolean;
  login: (user: any, token: string) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null, token: null, loading: true,
  login: () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user,    setUser]    = useState<any>(null);
  const [token,   setToken]   = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = getStoredToken();
    const u = getStoredUser();
    if (t && u) { setToken(t); setUser(u); }
    setLoading(false);
  }, []);

  const login = (user: any, token: string) => {
    setUser(user);
    setToken(token);
  };

  const logout = async () => {
    try { await apiLogout(); } catch {}
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}