import React from "react";
import { Link } from "react-router-dom";

export default function Header({ title }: { title?: string }) {
  return (
    <header className="flex items-center justify-between px-5 py-4 max-w-2xl mx-auto w-full">
      <Link to="/home" className="flex items-center gap-2" aria-label="Nayana home">
        <svg width="32" height="32" viewBox="0 0 64 64" aria-hidden="true">
          <rect width="64" height="64" rx="16" fill="#1B2A4A" />
          <path d="M8 32C14 20 23 14 32 14C41 14 50 20 56 32C50 44 41 50 32 50C23 50 14 44 8 32Z" fill="#FAF7F0" />
          <circle cx="32" cy="32" r="10" fill="#F4A623" />
          <circle cx="32" cy="32" r="4" fill="#1B2A4A" />
        </svg>
        <span className="font-display font-semibold text-xl text-ink dark:text-paper">
          {title ?? "Nayana"}
        </span>
      </Link>
      <Link
        to="/settings"
        aria-label="Settings"
        className="w-11 h-11 flex items-center justify-center rounded-full bg-ink/5 dark:bg-paper/10 text-xl"
      >
        ⚙️
      </Link>
    </header>
  );
}
