import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "../components/Header";
import CategoryIcon from "../components/CategoryIcon";
import AudioPlayer from "../components/AudioPlayer";
import RiskBadge from "../components/RiskBadge";
import LanguageSelector from "../components/LanguageSelector";
import { historyService } from "../services/historyService";
import { aiService } from "../services/aiService";
import { AnalysisResult, DocumentQuestion, LanguageCode } from "../types";

const CONFIDENCE_LABEL: Record<AnalysisResult["confidenceLevel"], string> = {
  high: "High confidence",
  medium: "Medium confidence",
  low: "Low confidence — please double-check"
};

export default function Result() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [activeHighlight, setActiveHighlight] = useState<number | null>(null);
  const [question, setQuestion] = useState("");
  const [qaHistory, setQaHistory] = useState<DocumentQuestion[]>([]);
  const [asking, setAsking] = useState(false);

  useEffect(() => {
    if (!id) return;
    const item = historyService.getById(id);
    if (item) setResult(item.result);
  }, [id]);

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper dark:bg-night-bg">
        <p className="text-charcoal/60 dark:text-paper/60">Scan not found.</p>
      </div>
    );
  }

  async function handleAsk() {
    if (!question.trim() || !result) return;
    setAsking(true);
    try {
      const answer = await aiService.askDocument(result.id, question);
      setQaHistory((prev) => [...prev, answer]);
      setQuestion("");
    } finally {
      setAsking(false);
    }
  }

  function handleLanguageChange(lang: LanguageCode) {
    if (!result) return;
    // In a full implementation this triggers POST /api/translate/ to
    // re-render simple_explanation/instructions/etc in the new language.
    // Demo mode just tags the result so the UI reflects the selection.
    setResult({ ...result, language: lang });
  }

  const fullSpokenText = [
    result.simpleExplanation,
    result.warnings.length ? `Important: ${result.warnings.join(". ")}` : "",
    result.instructions.length ? `What to do: ${result.instructions.join(". ")}` : ""
  ]
    .filter(Boolean)
    .join(". ");

  return (
    <div className="min-h-screen bg-paper dark:bg-night-bg pb-16">
      <Header />
      <main className="max-w-2xl mx-auto px-5">
        {result.isDemo && (
          <div className="mb-4 bg-signal-amber/15 border-l-4 border-signal-amber rounded-xl p-4 text-sm text-charcoal dark:text-paper">
            <p className="font-bold mb-1">⚠️ Demo Mode result</p>
            <p>
              No live AI provider is configured, so this is a sample answer and does not reflect what's
              actually in your photo. Set <code className="font-mono">AI_PROVIDER</code> and an API key in
              the backend's <code className="font-mono">.env</code> to get real, accurate answers.
            </p>
          </div>
        )}

        {/* Top: category + title */}
        <div className="flex items-center gap-3 mb-2">
          <CategoryIcon category={result.category} showLabel={false} size="lg" />
          <div>
            <p className="text-sm font-semibold text-charcoal/60 dark:text-paper/60 uppercase tracking-wide">
              {result.category}
            </p>
            <h1 className="font-display text-2xl font-semibold text-ink dark:text-paper">{result.title}</h1>
          </div>
        </div>

        <p className="text-xs font-semibold text-teal mb-6">{CONFIDENCE_LABEL[result.confidenceLevel]}</p>

        {/* Image with highlight overlay */}
        {result.imageDataUrl && (
          <div className="relative rounded-card overflow-hidden shadow-soft mb-6">
            <img src={result.imageDataUrl} alt="Scanned document" className="w-full object-cover max-h-72" />
            {result.highlights.map((h, i) => (
              <button
                key={i}
                onClick={() => setActiveHighlight(activeHighlight === i ? null : i)}
                aria-label={`${h.label}: ${h.explanation}`}
                style={{
                  left: `${h.x * 100}%`,
                  top: `${h.y * 100}%`,
                  width: `${h.width * 100}%`,
                  height: `${h.height * 100}%`
                }}
                className={`absolute border-2 rounded-md ${
                  h.type === "deadline"
                    ? "border-signal-red"
                    : h.type === "payment"
                    ? "border-signal-amber"
                    : h.type === "signature"
                    ? "border-marigold"
                    : "border-teal"
                } bg-white/10`}
              />
            ))}
          </div>
        )}
        {activeHighlight !== null && result.highlights[activeHighlight] && (
          <div className="mb-6 bg-white dark:bg-night-card rounded-card p-4 shadow-soft animate-fadeUp">
            <p className="font-bold text-ink dark:text-paper">{result.highlights[activeHighlight].label}</p>
            <p className="text-sm text-charcoal/70 dark:text-paper/70">{result.highlights[activeHighlight].explanation}</p>
          </div>
        )}

        {/* Simple explanation */}
        <section className="mb-6">
          <h2 className="font-bold text-ink dark:text-paper mb-2">Simple Explanation</h2>
          <p className="text-lg leading-relaxed text-charcoal dark:text-paper bg-white dark:bg-night-card rounded-card p-5 shadow-soft">
            {result.simpleExplanation}
          </p>
        </section>

        {/* Listen */}
        <section className="mb-8">
          <AudioPlayer text={fullSpokenText} language={result.language} large />
        </section>

        {/* Warnings */}
        {result.warnings.length > 0 && (
          <section className="mb-6">
            <h2 className="font-bold text-ink dark:text-paper mb-2">⚠️ Important</h2>
            <ul className="space-y-2">
              {result.warnings.map((w, i) => (
                <li key={i} className="bg-signal-red/10 border-l-4 border-signal-red rounded-xl p-4 text-sm text-charcoal dark:text-paper">
                  {w}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Instructions */}
        {result.instructions.length > 0 && (
          <section className="mb-6">
            <h2 className="font-bold text-ink dark:text-paper mb-2">📋 What You Need To Do</h2>
            <ol className="space-y-2">
              {result.instructions.map((step, i) => (
                <li key={i} className="flex gap-3 bg-white dark:bg-night-card rounded-card p-4 shadow-soft">
                  <span className="font-bold text-marigold-dark">{i + 1}</span>
                  <span className="text-charcoal dark:text-paper text-sm">{step}</span>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* Important dates */}
        {result.importantDates.length > 0 && (
          <section className="mb-6">
            <h2 className="font-bold text-ink dark:text-paper mb-2">📅 Important Dates</h2>
            <div className="space-y-2">
              {result.importantDates.map((d, i) => (
                <div key={i} className="flex justify-between bg-white dark:bg-night-card rounded-card p-4 shadow-soft text-sm">
                  <span className="text-charcoal/70 dark:text-paper/70">{d.label}</span>
                  <span className="font-bold text-ink dark:text-paper">{d.date}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Money */}
        {result.money.length > 0 && (
          <section className="mb-6">
            <h2 className="font-bold text-ink dark:text-paper mb-2">💰 Money</h2>
            <div className="space-y-2">
              {result.money.map((m, i) => (
                <div key={i} className="flex justify-between bg-white dark:bg-night-card rounded-card p-4 shadow-soft text-sm">
                  <span className="text-charcoal/70 dark:text-paper/70">
                    {m.label}
                    {m.dueDate ? ` (by ${m.dueDate})` : ""}
                  </span>
                  <span className="font-bold text-ink dark:text-paper">{m.amount}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Risks */}
        {result.risks.length > 0 && (
          <section className="mb-6">
            <h2 className="font-bold text-ink dark:text-paper mb-2">Things To Be Careful About</h2>
            <div className="space-y-3">
              {result.risks.map((r, i) => (
                <RiskBadge key={i} risk={r} />
              ))}
            </div>
          </section>
        )}

        {/* Ask this document */}
        <section className="mb-6">
          <h2 className="font-bold text-ink dark:text-paper mb-2">❓ Ask This Document</h2>
          <div className="bg-white dark:bg-night-card rounded-card p-4 shadow-soft space-y-3">
            {qaHistory.map((qa, i) => (
              <div key={i} className="space-y-1">
                <p className="text-sm font-semibold text-ink dark:text-paper">You: {qa.question}</p>
                <p className="text-sm text-charcoal/80 dark:text-paper/80">
                  Nayana: {qa.answer}
                  {!qa.foundInDocument && (
                    <span className="block text-xs text-signal-amber mt-1">
                      This wasn't clearly found in the document.
                    </span>
                  )}
                </p>
              </div>
            ))}
            <div className="flex gap-2">
              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAsk()}
                placeholder="e.g. Do I need to sign this?"
                aria-label="Ask a question about this document"
                className="flex-1 border-2 border-ink/10 dark:border-paper/20 bg-paper dark:bg-night-bg rounded-button px-4 py-3 text-sm"
              />
              <button
                onClick={handleAsk}
                disabled={asking}
                className="bg-teal text-white font-bold px-5 rounded-button disabled:opacity-50"
              >
                {asking ? "…" : "Ask"}
              </button>
            </div>
          </div>
        </section>

        {/* Language */}
        <section className="mb-8">
          <LanguageSelector value={result.language} onChange={handleLanguageChange} />
        </section>

        {/* Disclaimer */}
        <p className="text-xs text-charcoal/50 dark:text-paper/50 mb-8 border-t border-ink/10 dark:border-paper/10 pt-4">
          {result.disclaimer}
        </p>

        <button
          onClick={() => navigate("/camera")}
          className="w-full bg-marigold text-ink font-bold py-4 rounded-button shadow-lift mb-6"
        >
          📷 Scan Again
        </button>
      </main>
    </div>
  );
}
