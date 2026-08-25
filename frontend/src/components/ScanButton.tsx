import React from "react";
import { useNavigate } from "react-router-dom";

interface ScanButtonProps {
  size?: "large" | "medium";
  label?: string;
}

/**
 * The Nayana signature element: an iris/aperture button that echoes the
 * app's namesake (Nayana = "eye"). Used as the single primary action across
 * the Home, Landing, and Easy Mode screens.
 */
export default function ScanButton({ size = "large", label = "SCAN & UNDERSTAND" }: ScanButtonProps) {
  const navigate = useNavigate();
  const dimension = size === "large" ? "w-40 h-40" : "w-24 h-24";

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        onClick={() => navigate("/camera")}
        aria-label="Scan and understand: opens the camera"
        className="relative flex items-center justify-center focus-visible:outline-marigold"
      >
        <span
          className={`absolute inset-0 rounded-full bg-marigold/40 animate-pulseRing ${dimension}`}
          aria-hidden="true"
        />
        <span
          className={`relative ${dimension} rounded-full bg-ink dark:bg-marigold flex items-center justify-center shadow-lift transition-transform active:scale-95`}
        >
          <svg
            width={size === "large" ? 56 : 36}
            height={size === "large" ? 56 : 36}
            viewBox="0 0 64 64"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M8 32C14 20 23 14 32 14C41 14 50 20 56 32C50 44 41 50 32 50C23 50 14 44 8 32Z"
              fill="#FAF7F0"
            />
            <circle cx="32" cy="32" r="10" fill="#F4A623" />
            <circle cx="32" cy="32" r="4" fill="#1B2A4A" />
          </svg>
        </span>
      </button>
      {label && (
        <span className="text-lg font-bold tracking-wide text-ink dark:text-paper text-center">
          {label}
        </span>
      )}
    </div>
  );
}
