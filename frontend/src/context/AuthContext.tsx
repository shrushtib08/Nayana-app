import React, { createContext, useContext, useEffect, useState } from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api";
const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === "true";

const TOKEN_KEY = "nayana_auth_token";
const USER_KEY = "nayana_auth_user";

export interface NayanaUser {
  email: string;
}

interface AuthContextValue {
  user: NayanaUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<NayanaUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    const storedUser = localStorage.getItem(USER_KEY);
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  async function callBackend(endpoint: string, email: string, password: string) {
    const response = await fetch(`${API_BASE_URL}/auth/${endpoint}/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.detail || "Something went wrong. Please check your details and try again.");
    }
    return data;
  }

  function persistSession(token: string, email: string) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify({ email }));
    setUser({ email });
  }

  async function login(email: string, password: string) {
    setError(null);
    if (DEMO_MODE) {
      // No backend required to try the app: validate shape locally and
      // start a session. Swap VITE_DEMO_MODE=false to require the real
      // backend's /api/auth/login/ check instead.
      if (!email.includes("@") || password.length < 4) {
        throw new Error("Please enter a valid email and password.");
      }
      persistSession(`demo-${btoa(email)}`, email);
      return;
    }
    try {
      const data = await callBackend("login", email, password);
      persistSession(data.token, email);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
      throw err;
    }
  }

  async function signup(email: string, password: string) {
    setError(null);
    if (DEMO_MODE) {
      if (!email.includes("@") || password.length < 8) {
        throw new Error("Password must be at least 8 characters.");
      }
      persistSession(`demo-${btoa(email)}`, email);
      return;
    }
    try {
      const data = await callBackend("register", email, password);
      persistSession(data.token, email);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed.");
      throw err;
    }
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, isLoading, error, login, signup, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
