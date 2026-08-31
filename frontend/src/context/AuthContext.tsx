import React, { createContext, useContext, useEffect, useState } from "react";
import { GoogleAuth } from "@codetrix-studio/capacitor-google-auth";
// @ts-ignore
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, GoogleAuthProvider, signInWithCredential, signInWithPopup } from "firebase/auth";
import { auth, isFirebaseConfigured } from "../services/firebase";
import { Capacitor } from "@capacitor/core";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "https://nayana-api.onrender.com/api";

export interface NayanaUser {
  email: string;
  uid: string;
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
  logout: () => Promise<void>;
  getAuthHeader: () => Promise<{ Authorization: string } | {}>;
  isConfigured: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<NayanaUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isWakingUp, setIsWakingUp] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setIsLoading(false);
      return;
    }

    // Initialize Google Auth for Capacitor
    if (Capacitor.isNativePlatform()) {
      try {
        (GoogleAuth as any).initialize();
      } catch (e) {
        console.error("Google Auth init failed", e);
      }
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: any) => {
      if (firebaseUser) {
        setUser({
          email: firebaseUser.email || "",
          uid: firebaseUser.uid
        });
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    // Ping server to wake up Render free tier
    pingServer();

    return () => unsubscribe();
  }, []);

  async function pingServer() {
    setIsWakingUp(true);
    try {
      await fetch(`${API_BASE_URL.replace("/api", "")}/`, { method: "HEAD", mode: "no-cors" });
    } catch (e) {
      console.warn("Ping failed, server might still be cold.", e);
    } finally {
      setIsWakingUp(false);
    }
  }

  async function getAuthHeader() {
    if (!isFirebaseConfigured) {
      // Return a demo token so the app still works even without Firebase keys
      return { Authorization: `Bearer nayana_demo_token` };
    }
    const currentUser = auth.currentUser;
    if (currentUser) {
      const token = await currentUser.getIdToken();
      return { Authorization: `Bearer ${token}` };
    }
    return {};
  }

  async function login(email: string, password: string) {
    setError(null);
    if (!isFirebaseConfigured) {
      // Automatic Login for Demo Purposes if Firebase is missing
      persistSession("nayana_demo_token", email);
      return;
    }
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setError(err.message || "Login failed.");
      throw err;
    }
  }

  async function loginWithGoogle() {
    setError(null);
    if (!isFirebaseConfigured) {
      throw new Error("Firebase is not configured. Please add your Firebase keys to the .env file.");
    }
    try {
      if (Capacitor.isNativePlatform()) {
        const googleUser = await GoogleAuth.signIn();
        const credential = GoogleAuthProvider.credential(googleUser.authentication.idToken);
        await signInWithCredential(auth, credential);
      } else {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
      }
    } catch (err: any) {
      if (err.message === "User cancelled.") return;
      setError(err.message || "Google login failed.");
      throw err;
    }
  }

  async function signup(email: string, password: string) {
    setError(null);
    if (!isFirebaseConfigured) {
      throw new Error("Firebase is not configured. Please add your Firebase keys to the .env file.");
    }
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setError(err.message || "Signup failed.");
      throw err;
    }
  }

  async function logout() {
    try {
      if (isFirebaseConfigured) {
        await signOut(auth);
      }
      if (Capacitor.isNativePlatform()) {
        await GoogleAuth.signOut().catch(() => {});
      }
      setUser(null);
    } catch (err) {
      console.error("Logout failed", err);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        isWakingUp,
        error,
        login,
        loginWithGoogle,
        signup,
        logout,
        getAuthHeader,
        isConfigured: isFirebaseConfigured
      }}
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
