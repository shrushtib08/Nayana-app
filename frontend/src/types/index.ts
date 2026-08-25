// Core domain types shared across the Nayana frontend.
// These mirror the structured JSON contract returned by the Django backend's
// AIService (see backend/apps/ai/services.py -> AnalysisResult).

export type Category =
  | "medicine"
  | "government"
  | "legal"
  | "transport"
  | "education"
  | "food"
  | "other";

export type RiskLevel = "important" | "caution" | "normal";

export type ConfidenceLevel = "high" | "medium" | "low";

export type LanguageCode = "en" | "kn" | "hi" | "te" | "ta" | "ml" | "mr" | "bn" | "es" | "ko";

export interface LanguageOption {
  code: LanguageCode;
  label: string;
  nativeLabel: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: "en", label: "English", nativeLabel: "English" },
  { code: "kn", label: "Kannada", nativeLabel: "ಕನ್ನಡ" },
  { code: "hi", label: "Hindi", nativeLabel: "हिन्दी" },
  { code: "te", label: "Telugu", nativeLabel: "తెలుగు" },
  { code: "ta", label: "Tamil", nativeLabel: "தமிழ்" },
  { code: "ml", label: "Malayalam", nativeLabel: "മലയാളം" },
  { code: "mr", label: "Marathi", nativeLabel: "मराठी" },
  { code: "bn", label: "Bengali", nativeLabel: "বাংলা" },
  { code: "es", label: "Spanish", nativeLabel: "Español" },
  { code: "ko", label: "Korean", nativeLabel: "한국어" }
];

export interface RiskItem {
  level: RiskLevel;
  label: string;
  explanation: string;
}

export interface MoneyItem {
  label: string;
  amount: string;
  dueDate?: string;
}

export interface DateItem {
  label: string;
  date: string;
}

export interface HighlightRegion {
  // Normalized 0-1 coordinates so overlays scale with the displayed image.
  x: number;
  y: number;
  width: number;
  height: number;
  type: "deadline" | "payment" | "signature" | "personal_info" | "warning";
  label: string;
  explanation: string;
}

export interface AnalysisResult {
  id: string;
  category: Category;
  title: string;
  summary: string;
  simpleExplanation: string;
  instructions: string[];
  warnings: string[];
  importantDates: DateItem[];
  money: MoneyItem[];
  risks: RiskItem[];
  highlights: HighlightRegion[];
  confidence: number; // 0-1
  confidenceLevel: ConfidenceLevel;
  sourceInformation: string[];
  disclaimer: string;
  language: LanguageCode;
  createdAt: string;
  imageDataUrl?: string;
  isDemo?: boolean;
}

export interface ScanHistoryItem {
  id: string;
  category: Category;
  title: string;
  summary: string;
  language: LanguageCode;
  createdAt: string;
  thumbnailDataUrl?: string;
  result: AnalysisResult;
}

export interface DocumentQuestion {
  question: string;
  answer: string;
  foundInDocument: boolean;
}

export type AccessibilityMode = "standard" | "elderly" | "visually_impaired";
export type ThemeMode = "light" | "dark" | "high_contrast";
