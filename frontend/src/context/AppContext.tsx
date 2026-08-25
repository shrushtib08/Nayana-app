import React, { createContext, useContext, useEffect, useState } from "react";
import { AccessibilityMode, LanguageCode, ThemeMode } from "../types";

interface AppContextValue {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  accessibilityMode: AccessibilityMode;
  setAccessibilityMode: (mode: AccessibilityMode) => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

const STORAGE_KEYS = {
  language: "nayana_language",
  theme: "nayana_theme",
  accessibility: "nayana_accessibility_mode"
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>(
    (localStorage.getItem(STORAGE_KEYS.language) as LanguageCode) || "en"
  );
  const [theme, setThemeState] = useState<ThemeMode>(
    (localStorage.getItem(STORAGE_KEYS.theme) as ThemeMode) || "light"
  );
  const [accessibilityMode, setAccessibilityModeState] = useState<AccessibilityMode>(
    (localStorage.getItem(STORAGE_KEYS.accessibility) as AccessibilityMode) || "standard"
  );

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("dark", "high-contrast");
    if (theme === "dark") root.classList.add("dark");
    if (theme === "high_contrast") root.classList.add("high-contrast");
  }, [theme]);

  useEffect(() => {
    document.documentElement.classList.toggle("easy-mode", accessibilityMode === "elderly");
  }, [accessibilityMode]);

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEYS.language, lang);
  };

  const setTheme = (t: ThemeMode) => {
    setThemeState(t);
    localStorage.setItem(STORAGE_KEYS.theme, t);
  };

  const setAccessibilityMode = (mode: AccessibilityMode) => {
    setAccessibilityModeState(mode);
    localStorage.setItem(STORAGE_KEYS.accessibility, mode);
  };

  return (
    <AppContext.Provider
      value={{ language, setLanguage, theme, setTheme, accessibilityMode, setAccessibilityMode }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used within AppProvider");
  return ctx;
}
