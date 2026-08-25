import { LanguageCode } from "../types";

// Maps our internal language codes to BCP-47 tags the Web Speech API expects.
const LOCALE_MAP: Record<LanguageCode, string> = {
  en: "en-IN",
  kn: "kn-IN",
  hi: "hi-IN",
  te: "te-IN",
  ta: "ta-IN",
  ml: "ml-IN",
  mr: "mr-IN",
  bn: "bn-IN",
  es: "es-ES",
  ko: "ko-KR"
};

class SpeechService {
  private utterance: SpeechSynthesisUtterance | null = null;

  get isSupported(): boolean {
    return typeof window !== "undefined" && "speechSynthesis" in window;
  }

  speak(text: string, language: LanguageCode, onEnd?: () => void): void {
    if (!this.isSupported) {
      console.warn("Speech synthesis is not supported in this browser.");
      return;
    }
    this.stop();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = LOCALE_MAP[language] ?? "en-IN";
    utterance.rate = 0.95; // slightly slower for clarity
    utterance.pitch = 1;
    if (onEnd) utterance.onend = onEnd;

    this.utterance = utterance;
    window.speechSynthesis.speak(utterance);
  }

  pause(): void {
    if (this.isSupported) window.speechSynthesis.pause();
  }

  resume(): void {
    if (this.isSupported) window.speechSynthesis.resume();
  }

  stop(): void {
    if (this.isSupported) window.speechSynthesis.cancel();
  }

  get isSpeaking(): boolean {
    return this.isSupported && window.speechSynthesis.speaking;
  }
}

export const speechService = new SpeechService();
