"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

// Matches Prisma Role Enum to avoid importing full @prisma/client in a client component
export type Role = "USER" | "ADMIN";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  emailVerified: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  refreshSession: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  refreshSession: async () => {},
  logout: async () => {},
});

export function AuthProviders({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSession = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/auth/session");
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data?.isAuthenticated) {
          setUser(data.data.user);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (e) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/v1/auth/logout", { method: "POST" });
    } catch (e) {}
    setUser(null);
    window.location.href = "/";
  };

  useEffect(() => {
    refreshSession();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        refreshSession,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProviders");
  }
  return context;
}

/**
 * useSession acts as a drop-in replacement for next-auth's useSession
 * where possible, to minimize refactoring across the app.
 */
export function useSession() {
  const { user, isAuthenticated, isLoading } = useAuth();
  
  // Maps to next-auth's return signature for easier migration
  return {
    data: user ? { user } : null,
    status: isLoading ? "loading" : isAuthenticated ? "authenticated" : "unauthenticated",
  };
}
