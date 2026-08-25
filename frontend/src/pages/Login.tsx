import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

type Mode = "login" | "signup";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, signup } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const redirectTo = (location.state as { from?: string })?.from || "/home";

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
