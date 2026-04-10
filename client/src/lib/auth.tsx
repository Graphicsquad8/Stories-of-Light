import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { apiRequest } from "./queryClient";

interface AuthUser {
  id: string;
  username: string;
  email?: string | null;
  name?: string | null;
  role: string;
  permissions?: string[];
  avatarUrl?: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAdmin: boolean;
  isModerator: boolean;
  isStaff: boolean;
  permissions: string[];
  hasPermission: (section: string) => boolean;
  login: (login: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    fetchUser().finally(() => setIsLoading(false));
  }, [fetchUser]);

  const login = useCallback(async (login: string, password: string) => {
    const res = await apiRequest("POST", "/api/auth/login", { email: login, password });
    const data = await res.json();
    setUser(data);
  }, []);

  const signup = useCallback(async (email: string, password: string, name?: string) => {
    const res = await apiRequest("POST", "/api/auth/signup", { email, password, name });
    const data = await res.json();
    setUser(data);
  }, []);

  const logout = useCallback(async () => {
    await apiRequest("POST", "/api/auth/logout");
    setUser(null);
  }, []);

  const isAdmin = user?.role === "admin" || user?.role === "owner";
  const isModerator = user?.role === "moderator" || user?.role === "editor";
  const isStaff = isAdmin || isModerator;
  const permissions: string[] = user?.permissions || [];

  const hasPermission = useCallback((section: string): boolean => {
    if (isAdmin) return true;
    return permissions.includes(section);
  }, [isAdmin, permissions]);

  return (
    <AuthContext.Provider value={{
      user, isLoading, isAdmin, isModerator, isStaff, permissions, hasPermission,
      login, signup, logout, refreshUser: fetchUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
