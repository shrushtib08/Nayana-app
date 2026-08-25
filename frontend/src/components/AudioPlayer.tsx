import React, { useState } from "react";
import { LanguageCode } from "../types";
import { speechService } from "../services/speechService";

interface AudioPlayerProps {
  text: string;
  language: LanguageCode;
  large?: boolean;
}

export default function AudioPlayer({ text, language, large = false }: AudioPlayerProps) {
  const [status, setStatus] = useState<"idle" | "playing" | "paused">("idle");

  const handlePlay = () => {
    if (status === "paused") {
      speechService.resume();
      setStatus("playing");
      return;
    }
    speechService.speak(text, language, () => setStatus("idle"));
    setStatus("playing");
  };

  const handlePause = () => {
    speechService.pause();
    setStatus("paused");
  };

  const handleStop = () => {
    speechService.stop();
    setStatus("idle");
  };

  const handleRepeat = () => {
    speechService.stop();
    speechService.speak(text, language, () => setStatus("idle"));
    setStatus("playing");
  };

  if (!speechService.isSupported) {
    return (
      <p className="text-sm text-charcoal/60 dark:text-paper/60">
        Audio playback is not supported in this browser.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {status !== "playing" ? (
        <button
          onClick={handlePlay}
          aria-label="Listen to explanation"
          className={`flex items-center gap-2 bg-teal text-white rounded-button font-bold shadow-soft active:scale-95 transition-transform ${
            large ? "px-8 py-4 text-xl" : "px-5 py-3"
          }`}
        >
          🔊 Listen
        </button>
      ) : (
        <button
          onClick={handlePause}
          aria-label="Pause audio"
          className={`flex items-center gap-2 bg-teal/80 text-white rounded-button font-bold shadow-soft active:scale-95 transition-transform ${
            large ? "px-8 py-4 text-xl" : "px-5 py-3"
          }`}
        >
          ⏸ Pause
        </button>
      )}
      <button
        onClick={handleStop}
        aria-label="Stop audio"
        className="flex items-center gap-2 bg-charcoal/10 dark:bg-paper/10 rounded-button px-4 py-3 font-semibold"
      >
        ⏹ Stop
      </button>
      <button
        onClick={handleRepeat}
        aria-label="Repeat audio"
        className="flex items-center gap-2 bg-charcoal/10 dark:bg-paper/10 rounded-button px-4 py-3 font-semibold"
      >
        🔁 Repeat
      </button>
    </div>
  );
}
