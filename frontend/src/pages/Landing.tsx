import React from "react";
import { useNavigate } from "react-router-dom";

const HOW_IT_WORKS = [
  { icon: "📷", title: "Point your camera", body: "Aim your phone at a document, medicine label, sign, or object." },
  { icon: "🧠", title: "Nayana reads it", body: "OCR and AI extract and understand what's written or shown." },
  { icon: "🔊", title: "Hear it explained", body: "A simple explanation is spoken aloud in your chosen language." }
];

const BUILT_FOR = [
  { icon: "👵", label: "Elderly users" },
  { icon: "👁️", label: "Low vision & blind users" },
  { icon: "📖", label: "Low-literacy readers" },
  { icon: "🌾", label: "First-time smartphone users" }
];

const FEATURE_SECTIONS = [
  { icon: "💊", title: "Medicine, made clear", body: "Understand dosage, timing, and warnings printed on the package — never invented, only what's actually there." },
  { icon: "📜", title: "Bureaucracy, decoded", body: "Turn dense government forms and contracts into plain-language summaries: what it means, what to do, what happens if you don't." },
  { icon: "🌐", title: "Your language", body: "Kannada, Hindi, Telugu, Tamil, Malayalam, and English — explained in meaning, not word-for-word translation." },
  { icon: "🦻", title: "Built for accessibility", body: "Large text, high contrast, screen-reader support, and voice guidance throughout." },
  { icon: "🔒", title: "Private by design", body: "Your documents stay yours. Delete any scan from your history at any time." },
  { icon: "⚠️", title: "Safety first", body: "Nayana never invents a dosage, a deadline, or a legal fact. Uncertain answers say so." }
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-paper dark:bg-night-bg">
      {/* Hero */}
      <section className="relative overflow-hidden px-6 pt-16 pb-20 text-center">
        <div className="max-w-xl mx-auto">
          <div className="flex justify-center mb-6">
            <svg width="72" height="72" viewBox="0 0 64 64" aria-hidden="true" className="animate-fadeUp">
              <rect width="64" height="64" rx="16" fill="#1B2A4A" />
              <path d="M8 32C14 20 23 14 32 14C41 14 50 20 56 32C50 44 41 50 32 50C23 50 14 44 8 32Z" fill="#FAF7F0" />
              <circle cx="32" cy="32" r="10" fill="#F4A623" />
              <circle cx="32" cy="32" r="4" fill="#1B2A4A" />
            </svg>
          </div>
          <h1 className="font-display font-semibold text-4xl sm:text-5xl text-ink dark:text-paper leading-tight animate-fadeUp">
            Understand Anything.
            <br />
            Hear Everything.
          </h1>
          <p className="mt-5 text-lg text-charcoal/80 dark:text-paper/80 leading-relaxed animate-fadeUp">
            Point your camera at a document, medicine label, sign, or everyday object.
            Nayana explains it in simple language — and speaks it aloud.
          </p>
          <button
            onClick={() => navigate("/home")}
            className="mt-8 bg-marigold hover:bg-marigold-dark text-ink font-bold text-lg px-10 py-4 rounded-button shadow-lift active:scale-95 transition-transform"
          >
            Try Nayana
          </button>
          <p className="mt-3 text-sm text-charcoal/60 dark:text-paper/60">No account needed to try a scan.</p>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-16 bg-white dark:bg-night-card">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-display text-2xl font-semibold text-center text-ink dark:text-paper mb-10">
            How it works
          </h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={i} className="text-center p-6 rounded-card bg-paper dark:bg-night-bg shadow-soft">
                <div className="text-4xl mb-3" aria-hidden="true">{step.icon}</div>
                <h3 className="font-bold text-ink dark:text-paper mb-2">{step.title}</h3>
                <p className="text-sm text-charcoal/70 dark:text-paper/70 leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Built for everyone */}
      <section className="px-6 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display text-2xl font-semibold text-ink dark:text-paper mb-10">
            Built for everyone
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {BUILT_FOR.map((item, i) => (
              <div key={i} className="p-5 rounded-card bg-teal-light dark:bg-night-card">
                <div className="text-3xl mb-2" aria-hidden="true">{item.icon}</div>
                <p className="font-semibold text-ink dark:text-paper text-sm">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature sections */}
      <section className="px-6 py-16 bg-white dark:bg-night-card">
        <div className="max-w-4xl mx-auto grid sm:grid-cols-2 gap-6">
          {FEATURE_SECTIONS.map((f, i) => (
            <div key={i} className="p-6 rounded-card bg-paper dark:bg-night-bg shadow-soft">
              <div className="text-3xl mb-3" aria-hidden="true">{f.icon}</div>
              <h3 className="font-bold text-ink dark:text-paper mb-2">{f.title}</h3>
              <p className="text-sm text-charcoal/70 dark:text-paper/70 leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 py-20 text-center">
        <h2 className="font-display text-3xl font-semibold text-ink dark:text-paper mb-4">
          Ready to try it?
        </h2>
        <button
          onClick={() => navigate("/home")}
          className="bg-ink dark:bg-marigold text-paper dark:text-ink font-bold text-lg px-10 py-4 rounded-button shadow-lift active:scale-95 transition-transform"
        >
          Open Nayana
        </button>
      </section>

      <footer className="px-6 py-8 text-center text-xs text-charcoal/50 dark:text-paper/50">
        Nayana explains information visible in what you scan. It does not replace a doctor, pharmacist, or legal professional.
      </footer>
    </div>
  );
}
