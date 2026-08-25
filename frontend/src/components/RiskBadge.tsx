import React from "react";
import { RiskItem } from "../types";

const RISK_STYLES: Record<RiskItem["level"], { bg: string; icon: string; label: string }> = {
  important: { bg: "bg-signal-red/10 border-signal-red text-signal-red", icon: "🔴", label: "Important" },
  caution: { bg: "bg-signal-amber/10 border-signal-amber text-signal-amber", icon: "🟠", label: "Be Careful" },
  normal: { bg: "bg-signal-green/10 border-signal-green text-signal-green", icon: "🟢", label: "Normal" }
};

export default function RiskBadge({ risk }: { risk: RiskItem }) {
  const style = RISK_STYLES[risk.level];
  return (
    <div className={`border-l-4 rounded-xl p-4 ${style.bg}`}>
      <div className="flex items-center gap-2 font-bold mb-1">
        <span aria-hidden="true">{style.icon}</span>
        <span>{style.label}: {risk.label}</span>
      </div>
      <p className="text-charcoal dark:text-paper text-sm leading-relaxed">{risk.explanation}</p>
    </div>
  );
}
