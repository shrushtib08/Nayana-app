import { AnalysisResult, Category } from "../types";

// Sample structured responses used by Demo Mode so Nayana can be presented
// live (hackathon, judges, offline venues) without a configured AI key.
// Each entry mirrors exactly what the real AIService would return.

function baseFields(overrides: Partial<AnalysisResult>): AnalysisResult {
  return {
    id: crypto.randomUUID(),
    category: "other",
    title: "",
    summary: "",
    simpleExplanation: "",
    instructions: [],
    warnings: [],
    importantDates: [],
    money: [],
    risks: [],
    highlights: [],
    confidence: 0.9,
    confidenceLevel: "high",
    sourceInformation: [],
    disclaimer: "",
    language: "en",
    createdAt: new Date().toISOString(),
    ...overrides
  };
}

export const DEMO_SAMPLES: Record<string, AnalysisResult> = {
  medicine: baseFields({
    category: "medicine",
    title: "Paracetamol 500 mg",
    summary: "A pain and fever relief tablet. Take as printed on the strip.",
    simpleExplanation:
      "This is Paracetamol, a common medicine for fever and mild pain. The package says: take 1 tablet after food, up to 3 times a day.",
    instructions: [
      "Take 1 tablet after eating food.",
      "Do not take more than 3 tablets in one day.",
      "Drink a full glass of water with the tablet."
    ],
    warnings: [
      "Do not exceed the printed dosage.",
      "Stop and see a doctor if fever continues after 3 days.",
      "Keep away from children."
    ],
    importantDates: [{ label: "Expiry date (printed on strip)", date: "MAR 2027" }],
    money: [],
    risks: [
      {
        level: "caution",
        label: "Dosage limit",
        explanation: "The package clearly limits this to 3 tablets per day. Taking more is not shown as safe here."
      }
    ],
    highlights: [
      { x: 0.1, y: 0.15, width: 0.5, height: 0.12, type: "warning", label: "Dosage", explanation: "1 tablet after food, up to 3 times a day." },
      { x: 0.1, y: 0.7, width: 0.4, height: 0.1, type: "deadline", label: "Expiry", explanation: "Expires MAR 2027 — check before use after this date." }
    ],
    confidence: 0.94,
    confidenceLevel: "high",
    sourceInformation: ["Text printed on medicine strip, captured by camera."],
    disclaimer:
      "This app explains information visible on the medicine package. It does not replace a doctor or pharmacist. Please verify important medical decisions with a qualified healthcare professional.",
    language: "en"
  }),

  government: baseFields({
    category: "government",
    title: "Electricity Bill — Payment Notice",
    summary: "Your electricity bill for this month is due soon. Late payment adds a fee.",
    simpleExplanation:
      "This is your monthly electricity bill. You owe ₹850. It must be paid by August 25th. If you pay late, a ₹50 late fee is added.",
    instructions: [
      "Pay ₹850 before August 25th.",
      "You can pay online, at the office, or at an approved bill payment center.",
      "Keep the receipt after payment."
    ],
    warnings: ["A late fee of ₹50 applies if you pay after August 25th."],
    importantDates: [{ label: "Payment due date", date: "August 25" }],
    money: [
      { label: "Amount due", amount: "₹850", dueDate: "August 25" },
      { label: "Late fee if overdue", amount: "₹50" }
    ],
    risks: [
      { level: "important", label: "Payment deadline", explanation: "Missing August 25th adds a late fee and may affect your connection." }
    ],
    highlights: [
      { x: 0.55, y: 0.2, width: 0.35, height: 0.1, type: "payment", label: "Amount due", explanation: "₹850 is owed for this billing cycle." },
      { x: 0.55, y: 0.35, width: 0.35, height: 0.1, type: "deadline", label: "Due date", explanation: "Must be paid by August 25th." }
    ],
    confidence: 0.91,
    confidenceLevel: "high",
    sourceInformation: ["Text extracted from the printed notice via OCR."],
    disclaimer: "This is a simplified explanation of an official notice, not legal or financial advice.",
    language: "en"
  }),

  legal: baseFields({
    category: "legal",
    title: "Rental Agreement",
    summary: "An agreement to rent a house. It lists rent, deposit, and notice period.",
    simpleExplanation:
      "This is a rental agreement between you and the landlord. Rent is ₹12,000 per month, due on the 5th. A security deposit of ₹24,000 is required. Either side must give 30 days' notice before ending the agreement.",
    instructions: [
      "Pay rent by the 5th of every month.",
      "Pay the ₹24,000 deposit before moving in.",
      "Give 30 days' written notice if you plan to move out.",
      "Sign and date the last page."
    ],
    warnings: [
      "The agreement renews automatically each year unless you cancel in writing.",
      "Late rent payment may add a penalty — the exact amount is not clearly printed."
    ],
    importantDates: [
      { label: "Monthly rent due", date: "5th of each month" },
      { label: "Notice period before moving out", date: "30 days" }
    ],
    money: [
      { label: "Monthly rent", amount: "₹12,000" },
      { label: "Security deposit", amount: "₹24,000" }
    ],
    risks: [
      { level: "important", label: "Automatic renewal", explanation: "This clause may require attention: the agreement renews itself unless you cancel in writing." },
      { level: "caution", label: "Late fee unclear", explanation: "A late payment penalty is mentioned but the amount is not clearly printed. Consider asking a qualified legal professional if you are unsure." },
      { level: "normal", label: "Standard deposit", explanation: "A refundable security deposit is a normal part of most rental agreements." }
    ],
    highlights: [
      { x: 0.1, y: 0.25, width: 0.4, height: 0.08, type: "payment", label: "Rent", explanation: "₹12,000 per month, due on the 5th." },
      { x: 0.1, y: 0.4, width: 0.4, height: 0.08, type: "deadline", label: "Notice period", explanation: "30 days' notice required to end the agreement." },
      { x: 0.55, y: 0.75, width: 0.3, height: 0.1, type: "signature", label: "Signature", explanation: "Both parties must sign and date this page." }
    ],
    confidence: 0.83,
    confidenceLevel: "medium",
    sourceInformation: ["Clauses extracted from the scanned agreement text."],
    disclaimer: "This is a simplified explanation, not legal advice. Consider asking a qualified legal professional if you are unsure.",
    language: "en"
  }),

  transport: baseFields({
    category: "transport",
    title: "City Bus Route 401",
    summary: "This bus stop sign shows Route 401 going toward Majestic Bus Station.",
    simpleExplanation:
      "This is a bus stop sign for Route 401. It travels toward Majestic Bus Station. Buses run about every 15 minutes from 6 AM to 10 PM.",
    instructions: [
      "Wait at this stop for a bus marked 401.",
      "The bus goes toward Majestic Bus Station.",
      "Buses come roughly every 15 minutes."
    ],
    warnings: [],
    importantDates: [],
    money: [],
    risks: [],
    highlights: [
      { x: 0.2, y: 0.2, width: 0.3, height: 0.15, type: "warning", label: "Route number", explanation: "Route 401 — confirm this number on the approaching bus." }
    ],
    confidence: 0.88,
    confidenceLevel: "high",
    sourceInformation: ["Sign text read from the photographed board."],
    disclaimer: "Bus schedules can change. Please confirm timing with the driver or conductor if unsure.",
    language: "en"
  }),

  education: baseFields({
    category: "education",
    title: "Textbook Page — The Water Cycle",
    summary: "A science textbook page explaining how water moves between the sky and the earth.",
    simpleExplanation:
      "This page explains the water cycle: water evaporates from oceans and rivers into the sky, forms clouds, falls back down as rain, and flows back to rivers and oceans. This cycle repeats continuously.",
    instructions: [
      "Read the diagram from left to right: evaporation, condensation, precipitation, collection.",
      "Try explaining each step in your own words."
    ],
    warnings: [],
    importantDates: [],
    money: [],
    risks: [],
    highlights: [
      { x: 0.15, y: 0.3, width: 0.3, height: 0.15, type: "warning", label: "Key term", explanation: "Evaporation: water turns into vapor and rises." }
    ],
    confidence: 0.9,
    confidenceLevel: "high",
    sourceInformation: ["Text and diagram labels extracted from the textbook page."],
    disclaimer: "This is a simplified explanation for learning support.",
    language: "en"
  })
};

export function getDemoSample(category: Category): AnalysisResult {
  const sample = DEMO_SAMPLES[category] ?? DEMO_SAMPLES.other;
  return { ...sample, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
}

export const DEMO_SCENARIOS: { key: Category; label: string; icon: string }[] = [
  { key: "medicine", label: "Medicine Package", icon: "💊" },
  { key: "government", label: "Government Notice", icon: "📄" },
  { key: "legal", label: "Rental Agreement", icon: "📜" },
  { key: "transport", label: "Bus Sign", icon: "🚌" },
  { key: "education", label: "Textbook Page", icon: "📚" }
];
