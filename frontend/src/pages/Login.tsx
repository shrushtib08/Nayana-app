import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === "true";

type Mode = "login" | "signup";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginWithGoogle, signup, isConfigured } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const redirectTo = (location.state as { from?: string })?.from || "/home";

  if (!isConfigured && !DEMO_MODE) {
    return (
      <div className="min-h-screen bg-paper dark:bg-night-bg flex flex-col items-center justify-center px-6">
        <div className="bg-marigold/10 border-2 border-marigold p-8 rounded-2xl max-w-sm text-center shadow-xl">
          <div className="w-16 h-16 bg-marigold rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-ink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-ink mb-2">Firebase Required</h1>
          <p className="text-ink/70 mb-6">
            To allow any email to sign in securely, you must add your <b>Firebase API Keys</b> to the Render dashboard.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-marigold text-ink font-bold py-3 rounded-xl shadow-soft active:scale-95 transition-all"
          >
            Check again
          </button>
        </div>
      </div>
    );
  }

  async function handleGoogleLogin() {
    setError(null);
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google login failed.");
    } finally {
      setGoogleLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await signup(email, password);
      }
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-paper dark:bg-night-bg flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-6">
          <svg width="56" height="56" viewBox="0 0 64 64" aria-hidden="true">
            <rect width="64" height="64" rx="16" fill="#1B2A4A" />
            <path d="M8 32C14 20 23 14 32 14C41 14 50 20 56 32C50 44 41 50 32 50C23 50 14 44 8 32Z" fill="#FAF7F0" />
            <circle cx="32" cy="32" r="10" fill="#F4A623" />
            <circle cx="32" cy="32" r="4" fill="#1B2A4A" />
          </svg>
        </div>

        <h1 className="font-display text-3xl font-semibold text-ink dark:text-paper text-center mb-2">
          {mode === "login" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="text-center text-charcoal/60 dark:text-paper/60 mb-8">
          {mode === "login"
            ? "Log in to scan and understand anything."
            : "Sign up to start scanning and saving your history."}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="email" className="block font-semibold text-ink dark:text-paper mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border-2 border-ink/10 dark:border-paper/20 bg-white dark:bg-night-card rounded-button px-4 py-3 focus-visible:outline-marigold"
            />
          </div>
          <div>
            <label htmlFor="password" className="block font-semibold text-ink dark:text-paper mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={mode === "signup" ? 8 : 4}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border-2 border-ink/10 dark:border-paper/20 bg-white dark:bg-night-card rounded-button px-4 py-3 focus-visible:outline-marigold"
            />
          </div>

          {error && (
            <p className="text-signal-red text-sm bg-signal-red/10 rounded-xl p-3" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-marigold hover:bg-marigold-dark text-ink font-bold py-4 rounded-button shadow-soft disabled:opacity-60 active:scale-95 transition-transform"
          >
            {loading ? "Please wait…" : mode === "login" ? "Log In" : "Sign Up"}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-ink/10 dark:border-paper/10"></span>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-paper dark:bg-night-bg text-charcoal/60 dark:text-paper/60">Or continue with</span>
          </div>
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={googleLoading || loading}
          className="w-full bg-white dark:bg-night-card border-2 border-ink/10 dark:border-paper/20 hover:bg-paper/50 text-ink dark:text-paper font-semibold py-4 rounded-button shadow-soft flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-60"
        >
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          {googleLoading ? "Signing in..." : "Google"}
        </button>

        <button
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            setError(null);
          }}
          className="w-full text-center text-teal font-semibold mt-4"
        >
          {mode === "login" ? "Need an account? Sign up" : "Already have an account? Log in"}
        </button>
      </div>
    </div>
  );
}
