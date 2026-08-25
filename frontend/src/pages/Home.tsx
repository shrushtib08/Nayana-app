import React from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import BottomNav from "../components/BottomNav";
import ScanButton from "../components/ScanButton";
import CategoryIcon from "../components/CategoryIcon";
import { historyService } from "../services/historyService";
import { Category } from "../types";
import { useAppContext } from "../context/AppContext";

const QUICK_ACTIONS: { category: Category; label: string; icon: string }[] = [
  { category: "medicine", label: "Medicine", icon: "💊" },
  { category: "government", label: "Document", icon: "📄" },
  { category: "transport", label: "Transport", icon: "🚌" },
  { category: "education", label: "Textbook", icon: "📚" },
  { category: "food", label: "Food", icon: "🍱" },
  { category: "other", label: "Warning", icon: "⚠️" }
];

export default function Home() {
  const navigate = useNavigate();
  const { accessibilityMode } = useAppContext();
  const recent = historyService.getAll().slice(0, 3);

  // Easy Mode (Elderly Mode): reduce the screen to the two essential actions.
  if (accessibilityMode === "elderly") {
    return (
      <div className="min-h-screen bg-paper dark:bg-night-bg pb-24 flex flex-col">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center gap-10 px-6">
          <ScanButton size="large" label="📷 SCAN SOMETHING" />
          <button
            onClick={() => navigate("/history")}
            className="w-full max-w-xs bg-ink dark:bg-night-card text-paper font-bold text-2xl py-6 rounded-card shadow-soft active:scale-95 transition-transform"
          >
            📜 HISTORY
          </button>
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper dark:bg-night-bg pb-24">
      <Header />
      <main className="max-w-2xl mx-auto px-6">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-semibold text-ink dark:text-paper">Hello 👋</h1>
          <p className="text-charcoal/70 dark:text-paper/70 mt-1">What would you like to understand?</p>
        </div>

        <div className="flex justify-center mb-10">
          <ScanButton size="large" />
        </div>

        <section aria-label="Quick actions" className="mb-10">
          <h2 className="font-bold text-ink dark:text-paper mb-3">Quick Actions</h2>
          <div className="grid grid-cols-3 gap-3">
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action.category}
                onClick={() => navigate("/camera", { state: { hint: action.category } })}
                className="flex flex-col items-center gap-2 bg-white dark:bg-night-card rounded-card p-4 shadow-soft active:scale-95 transition-transform"
              >
                <span className="text-3xl" aria-hidden="true">{action.icon}</span>
                <span className="text-sm font-semibold text-ink dark:text-paper">{action.label}</span>
              </button>
            ))}
          </div>
        </section>

        <section aria-label="Recent scans">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-ink dark:text-paper">Recent Scans</h2>
            <button onClick={() => navigate("/history")} className="text-sm font-semibold text-teal">
              See all
            </button>
          </div>
          {recent.length === 0 ? (
            <div className="bg-white dark:bg-night-card rounded-card p-6 text-center shadow-soft">
              <p className="text-charcoal/60 dark:text-paper/60">
                Nothing scanned yet. Tap the button above to try your first scan.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recent.map((item) => (
                <button
                  key={item.id}
                  onClick={() => navigate(`/result/${item.id}`)}
                  className="w-full flex items-center gap-3 bg-white dark:bg-night-card rounded-card p-4 shadow-soft text-left active:scale-95 transition-transform"
                >
                  <CategoryIcon category={item.category} showLabel={false} size="lg" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-ink dark:text-paper truncate">{item.title}</p>
                    <p className="text-sm text-charcoal/60 dark:text-paper/60 truncate">{item.summary}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      </main>
      <BottomNav />
    </div>
  );
}
