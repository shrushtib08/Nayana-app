import React from "react";
import { Category } from "../types";

const ICONS: Record<Category, string> = {
  medicine: "💊",
  government: "📄",
  legal: "📜",
  transport: "🚌",
  education: "📚",
  food: "🍱",
  other: "⚠️"
};

const LABELS: Record<Category, string> = {
  medicine: "Medicine",
  government: "Government",
  legal: "Legal Document",
  transport: "Transport",
  education: "Textbook",
  food: "Food Package",
  other: "Object"
};

export default function CategoryIcon({
  category,
  showLabel = true,
  size = "md"
}: {
  category: Category;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClass = size === "lg" ? "text-5xl" : size === "sm" ? "text-xl" : "text-3xl";
  return (
    <div className="flex items-center gap-2">
      <span className={sizeClass} role="img" aria-label={LABELS[category]}>
        {ICONS[category]}
      </span>
      {showLabel && <span className="font-bold text-ink dark:text-paper">{LABELS[category]}</span>}
    </div>
  );
}

export { ICONS as CATEGORY_ICONS, LABELS as CATEGORY_LABELS };
