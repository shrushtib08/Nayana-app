import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { aiService } from "../services/aiService";
import { historyService } from "../services/historyService";
import { useAppContext } from "../context/AppContext";

const STEPS = [
  "Looking at your photo…",
  "Reading the text…",
  "Understanding the content…",
  "Simplifying the explanation…"
];

export default function Processing() {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useAppContext();
  const image = (location.state as { image?: string })?.image;
  const [stepIndex, setStepIndex] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!image) {
      navigate("/camera");
      return;
    }

    const interval = setInterval(() => {
      setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
    }, 700);

    aiService
      .analyzeImage(image, language)
      .then((result) => {
        const saved = historyService.add(result);
        navigate(`/result/${saved.id}`, { replace: true });
      })
      .catch((err) => {
        console.error(err);
        setErrorMsg("Something went wrong while understanding this image. Please try again.");
      })
      .finally(() => clearInterval(interval));

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [image]);

  if (errorMsg) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-paper dark:bg-night-bg px-6 text-center">
        <p className="text-5xl mb-4" aria-hidden="true">😕</p>
        <p className="text-lg font-semibold text-ink dark:text-paper mb-6">{errorMsg}</p>
        <button
          onClick={() => navigate("/camera")}
          className="bg-marigold text-ink font-bold px-8 py-3 rounded-button shadow-soft"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-paper dark:bg-night-bg px-6 text-center">
      <div className="relative w-32 h-32 mb-8">
        <span className="absolute inset-0 rounded-full bg-marigold/30 animate-pulseRing" />
        <span className="relative w-32 h-32 rounded-full bg-ink dark:bg-marigold flex items-center justify-center">
          <span className="text-5xl" aria-hidden="true">👁️</span>
        </span>
      </div>
      <p className="text-xl font-bold text-ink dark:text-paper mb-2" role="status" aria-live="polite">
        {STEPS[stepIndex]}
      </p>
      <p className="text-sm text-charcoal/60 dark:text-paper/60">This usually takes a few seconds.</p>
    </div>
  );
}
