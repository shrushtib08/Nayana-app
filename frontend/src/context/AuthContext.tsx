import React, { createContext, useContext, useEffect, useState } from "react";
import { GoogleAuth } from "@codetrix-studio/capacitor-google-auth";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "https://nayana-api.onrender.com/api";
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
  isWakingUp: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<NayanaUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isWakingUp, setIsWakingUp] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize Google Auth
    try {
      (GoogleAuth as any).initialize();
    } catch (e) {
      console.error("Google Auth init failed", e);
    }

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

    // Ping server to wake up Render free tier
    pingServer();

    setIsLoading(false);
  }, []);

  async function pingServer() {
    setIsWakingUp(true);
    try {
      // Just a simple HEAD request or a specific ping endpoint if available
      await fetch(`${API_BASE_URL.replace("/api", "")}/`, { method: "HEAD", mode: "no-cors" });
    } catch (e) {
      console.warn("Ping failed, server might still be cold.", e);
    } finally {
      setIsWakingUp(false);
    }
  }

  async function callBackend(endpoint: string, payload: any) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/${endpoint}/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      let data;
      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        throw new Error(data.detail || `Server error (${response.status}). Please try again later.`);
      }
      return data;
    } catch (err) {
      if (err instanceof TypeError && err.message === "Failed to fetch") {
        throw new Error("Connection failed. The server might be waking up or your internet is down. Please wait 30 seconds and try again.");
      }
      throw err;
    }
  }

  function persistSession(token: string, email: string) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify({ email }));
    setUser({ email });
  }

  async function login(email: string, password: string) {
    setError(null);
    if (DEMO_MODE) {
      if (!email.includes("@") || password.length < 4) {
        throw new Error("Please enter a valid email and password.");
      }
      persistSession(`demo-${btoa(email)}`, email);
      return;
    }
    try {
      const data = await callBackend("login", { email, password });
      persistSession(data.token, email);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
      throw err;
    }
  }

  async function loginWithGoogle() {
    setError(null);
    try {
      const googleUser = await GoogleAuth.signIn();
      const data = await callBackend("google", { token: googleUser.authentication.idToken });
      persistSession(data.token, data.email);
    } catch (err) {
      if ((err as any).message === "User cancelled.") return;
      setError(err instanceof Error ? err.message : "Google login failed.");
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
      const data = await callBackend("register", { email, password });
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
    GoogleAuth.signOut().catch(() => {});
  }

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, isLoading, isWakingUp, error, login, loginWithGoogle, signup, logout }}
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
