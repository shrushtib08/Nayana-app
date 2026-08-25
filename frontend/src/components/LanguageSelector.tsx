import React from "react";
import { LanguageCode, SUPPORTED_LANGUAGES } from "../types";

interface Props {
  value: LanguageCode;
  onChange: (lang: LanguageCode) => void;
  compact?: boolean;
}

export default function LanguageSelector({ value, onChange, compact = false }: Props) {
  return (
    <div className={compact ? "" : "space-y-2"}>
      {!compact && (
        <label htmlFor="language-select" className="font-bold text-ink dark:text-paper">
          🌐 Language
        </label>
      )}
      <select
        id="language-select"
        value={value}
        onChange={(e) => onChange(e.target.value as LanguageCode)}
        className="w-full bg-white dark:bg-night-card border-2 border-ink/10 dark:border-paper/20 rounded-button px-4 py-3 font-semibold text-ink dark:text-paper focus-visible:outline-marigold"
      >
        {SUPPORTED_LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.nativeLabel} ({lang.label})
          </option>
        ))}
      </select>
    </div>
  );
}
