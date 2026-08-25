import React from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import BottomNav from "../components/BottomNav";
import LanguageSelector from "../components/LanguageSelector";
import { useAppContext } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { AccessibilityMode, ThemeMode } from "../types";

const ACCESSIBILITY_OPTIONS: { value: AccessibilityMode; label: string; desc: string }[] = [
  { value: "standard", label: "Standard", desc: "The regular Nayana experience." },
  { value: "elderly", label: "Easy Mode", desc: "Very large text and buttons, minimal menus." },
  { value: "visually_impaired", label: "Visually Impaired Mode", desc: "Large touch targets, voice guidance, screen-reader friendly." }
];

const THEME_OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: "light", label: "☀️ Light" },
  { value: "dark", label: "🌙 Dark" },
  { value: "high_contrast", label: "◐ High Contrast" }
];

export default function Settings() {
  const { language, setLanguage, theme, setTheme, accessibilityMode, setAccessibilityMode } = useAppContext();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-paper dark:bg-night-bg pb-24">
      <Header title="Settings" />
      <main className="max-w-2xl mx-auto px-5 space-y-8">
        <section className="flex items-center justify-between bg-white dark:bg-night-card rounded-card p-4 shadow-soft">
          <div>
            <p className="text-xs text-charcoal/60 dark:text-paper/60">Logged in as</p>
            <p className="font-bold text-ink dark:text-paper">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-signal-red font-semibold text-sm px-4 py-2 rounded-button border-2 border-signal-red/30"
          >
            Log Out
          </button>
        </section>

        <section>
          <h2 className="font-bold text-ink dark:text-paper mb-3">🌐 Language</h2>
          <LanguageSelector value={language} onChange={setLanguage} compact />
        </section>

        <section>
          <h2 className="font-bold text-ink dark:text-paper mb-3">Appearance</h2>
          <div className="grid grid-cols-3 gap-3">
            {THEME_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTheme(opt.value)}
                aria-pressed={theme === opt.value}
                className={`py-4 rounded-card font-semibold text-sm shadow-soft ${
                  theme === opt.value ? "bg-ink text-paper" : "bg-white dark:bg-night-card text-ink dark:text-paper"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-bold text-ink dark:text-paper mb-3">Accessibility Mode</h2>
          <div className="space-y-3">
            {ACCESSIBILITY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setAccessibilityMode(opt.value)}
                aria-pressed={accessibilityMode === opt.value}
                className={`w-full text-left p-4 rounded-card shadow-soft ${
                  accessibilityMode === opt.value
                    ? "bg-teal text-white"
                    : "bg-white dark:bg-night-card text-ink dark:text-paper"
                }`}
              >
                <p className="font-bold">{opt.label}</p>
                <p className="text-sm opacity-80">{opt.desc}</p>
              </button>
            ))}
          </div>
        </section>

        <section className="border-t border-ink/10 dark:border-paper/10 pt-6">
          <h2 className="font-bold text-ink dark:text-paper mb-2">Privacy</h2>
          <p className="text-sm text-charcoal/70 dark:text-paper/70 leading-relaxed">
            Your documents are private and can be deleted from your history at any time. Scans are only used
            to generate your explanation and are never shared publicly.
          </p>
        </section>
      </main>
      <BottomNav />
    </div>
  );
}
