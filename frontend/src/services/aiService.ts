import { AnalysisResult, Category, DocumentQuestion, LanguageCode } from "../types";
import { getDemoSample } from "./demoData";
import { auth } from "./firebase";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "https://nayana-api.onrender.com/api";
const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === "true";

/**
 * Frontend-facing AI service. Talks to the Django backend's /api/analyze/
 * endpoint, which itself wraps the swappable AIService abstraction
 * (backend/apps/ai/services.py). Falls back to local demo data when
 * VITE_DEMO_MODE=true or when the backend is unreachable, so the app
 * always remains demonstrable.
 */
class FrontendAIService {
  private async getHeaders() {
    const headers: any = { "Content-Type": "application/json" };
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
  }

  async analyzeImage(imageDataUrl: string, language: LanguageCode): Promise<AnalysisResult> {
    if (DEMO_MODE) {
      return this.simulateNetworkDelay(this.classifyDemoImage(imageDataUrl, language));
    }

    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${API_BASE_URL}/analyze/`, {
        method: "POST",
        headers,
        body: JSON.stringify({ image: imageDataUrl, language })
      });

      if (!response.ok) {
        throw new Error(`Analysis failed with status ${response.status}`);
      }

      const data = await response.json();
      return { ...data, imageDataUrl: data.imageDataUrl ?? imageDataUrl } as AnalysisResult;
    } catch (err) {
      console.error("AI analysis failed, falling back to demo sample:", err);
      // Never leave the user stuck — degrade gracefully to a demo result
      // while being transparent that this is a fallback (see Result page banner).
      return this.classifyDemoImage(imageDataUrl, language);
    }
  }

  async askDocument(resultId: string, question: string): Promise<DocumentQuestion> {
    if (DEMO_MODE) {
      return this.simulateNetworkDelay(this.simulateAnswer(question));
    }

    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${API_BASE_URL}/ask-document/`, {
        method: "POST",
        headers,
        body: JSON.stringify({ scan_id: resultId, question })
      });
      if (!response.ok) throw new Error("ask-document failed");
      return (await response.json()) as DocumentQuestion;
    } catch (err) {
      console.error("Ask-document failed, using fallback:", err);
      return this.simulateAnswer(question);
    }
  }

  private classifyDemoImage(_imageDataUrl: string, language: LanguageCode): AnalysisResult {
    // In demo mode we cannot truly classify an arbitrary photo without a
    // live model, so we cycle through representative categories. The real
    // backend performs true classification via AIService.classify_image().
    const categories: Category[] = ["medicine", "government", "legal", "transport", "education"];
    const category = categories[Math.floor(Math.random() * categories.length)];
    const sample = getDemoSample(category);
    // isDemo is surfaced on the Result screen as an honest banner: Demo Mode
    // cycles through sample answers and does NOT actually read your photo.
    // Configure a real AI_PROVIDER on the backend (see README) for accurate,
    // photo-grounded answers.
    return { ...sample, language, imageDataUrl: _imageDataUrl, isDemo: true };
  }

  private simulateAnswer(question: string): DocumentQuestion {
    const lower = question.toLowerCase();
    if (lower.includes("sign")) {
      return { question, answer: "Yes, the document has a signature section. Look near the bottom of the last page.", foundInDocument: true };
    }
    if (lower.includes("pay") || lower.includes("money") || lower.includes("cost")) {
      return { question, answer: "The document mentions a payment amount and a due date. Check the 'Money' section above for the exact figures.", foundInDocument: true };
    }
    if (lower.includes("cancel")) {
      return { question, answer: "The document mentions a notice period before cancellation is allowed. See the 'Important Dates' section for details.", foundInDocument: true };
    }
    return {
      question,
      answer: "I could not find a clear answer to that in this document. Please check the original text or ask a professional if it's important.",
      foundInDocument: false
    };
  }

  private simulateNetworkDelay<T>(value: T): Promise<T> {
    return new Promise((resolve) => setTimeout(() => resolve(value), 900));
  }
}

export const aiService = new FrontendAIService();
