import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import BottomNav from "../components/BottomNav";
import CategoryIcon from "../components/CategoryIcon";
import { historyService } from "../services/historyService";
import { ScanHistoryItem } from "../types";

export default function History() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<ScanHistoryItem[]>(historyService.getAll());

  function refresh() {
    setItems(query ? historyService.search(query) : historyService.getAll());
  }

  function handleSearch(value: string) {
    setQuery(value);
    setItems(value ? historyService.search(value) : historyService.getAll());
  }

  function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    historyService.remove(id);
    refresh();
  }

  return (
    <div className="min-h-screen bg-paper dark:bg-night-bg pb-24">
      <Header title="History" />
      <main className="max-w-2xl mx-auto px-5">
        <input
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search your scans"
          aria-label="Search history"
          className="w-full bg-white dark:bg-night-card border-2 border-ink/10 dark:border-paper/20 rounded-button px-4 py-3 mb-6"
        />

        {items.length === 0 ? (
          <div className="bg-white dark:bg-night-card rounded-card p-8 text-center shadow-soft">
            <p className="text-4xl mb-3" aria-hidden="true">📭</p>
            <p className="text-charcoal/60 dark:text-paper/60">
              {query ? "No scans match your search." : "No scans yet. Try scanning something!"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => navigate(`/result/${item.id}`)}
                className="w-full flex items-center gap-3 bg-white dark:bg-night-card rounded-card p-4 shadow-soft text-left"
              >
                <CategoryIcon category={item.category} showLabel={false} size="lg" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-ink dark:text-paper truncate">{item.title}</p>
                  <p className="text-sm text-charcoal/60 dark:text-paper/60 truncate">{item.summary}</p>
                  <p className="text-xs text-charcoal/40 dark:text-paper/40 mt-1">
                    {new Date(item.createdAt).toLocaleDateString()} · {item.language.toUpperCase()}
                  </p>
                </div>
                <button
                  onClick={(e) => handleDelete(item.id, e)}
                  aria-label={`Delete scan: ${item.title}`}
                  className="text-charcoal/40 dark:text-paper/40 hover:text-signal-red text-xl px-2"
                >
                  🗑️
                </button>
              </button>
            ))}
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
