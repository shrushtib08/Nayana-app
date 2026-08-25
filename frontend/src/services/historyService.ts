import { AnalysisResult, ScanHistoryItem } from "../types";

const STORAGE_KEY = "nayana_history_v1";

/**
 * Client-side history store. When the backend is connected, this mirrors
 * GET/POST/DELETE calls to /api/history/; for demo mode and offline use it
 * persists to localStorage so "Recent Scans" and full History still work
 * without a server.
 */
class HistoryService {
  getAll(): ScanHistoryItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const items = JSON.parse(raw) as ScanHistoryItem[];
      return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (err) {
      console.error("Failed to read history:", err);
      return [];
    }
  }

  add(result: AnalysisResult): ScanHistoryItem {
    const item: ScanHistoryItem = {
      id: result.id,
      category: result.category,
      title: result.title,
      summary: result.summary,
      language: result.language,
      createdAt: result.createdAt,
      thumbnailDataUrl: result.imageDataUrl,
      result
    };
    const all = this.getAll();
    all.unshift(item);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all.slice(0, 100)));
    return item;
  }

  getById(id: string): ScanHistoryItem | undefined {
    return this.getAll().find((item) => item.id === id);
  }

  remove(id: string): void {
    const all = this.getAll().filter((item) => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  }

  clear(): void {
    localStorage.removeItem(STORAGE_KEY);
  }

  search(query: string): ScanHistoryItem[] {
    const lower = query.toLowerCase();
    return this.getAll().filter(
      (item) => item.title.toLowerCase().includes(lower) || item.summary.toLowerCase().includes(lower)
    );
  }
}

export const historyService = new HistoryService();
