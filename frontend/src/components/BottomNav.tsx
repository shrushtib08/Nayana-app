import React from "react";
import { NavLink } from "react-router-dom";

const NAV_ITEMS = [
  { to: "/home", icon: "🏠", label: "Home" },
  { to: "/camera", icon: "📷", label: "Scan" },
  { to: "/history", icon: "📜", label: "History" },
  { to: "/settings", icon: "⚙️", label: "Settings" }
];

export default function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-night-card/95 backdrop-blur border-t border-ink/10 dark:border-paper/10 z-40"
      aria-label="Primary navigation"
    >
      <div className="max-w-2xl mx-auto flex justify-around py-2">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-4 py-2 rounded-xl min-w-[64px] ${
                isActive ? "text-marigold-dark dark:text-marigold font-bold" : "text-charcoal/70 dark:text-paper/70"
              }`
            }
          >
            <span className="text-2xl" aria-hidden="true">
              {item.icon}
            </span>
            <span className="text-xs">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
