"""
Validates and repairs the JSON returned by an AI provider before it reaches
the rest of the app. AI responses are never trusted blindly: missing keys
are filled with safe defaults, unknown categories are coerced to "other",
and malformed shapes are normalized rather than allowed to crash a view.
"""

from __future__ import annotations

VALID_CATEGORIES = {"medicine", "government", "legal", "transport", "education", "food", "other"}
VALID_RISK_LEVELS = {"important", "caution", "normal"}

DEFAULT_DISCLAIMERS = {
    "medicine": (
        "This app explains information visible on the medicine/package. It does not replace a "
        "doctor or pharmacist. Please verify important medical decisions with a qualified "
        "healthcare professional."
    ),
    "legal": "This is a simplified explanation, not legal advice. Consider asking a qualified legal professional if you are unsure.",
    "government": "This is a simplified explanation, not legal advice. Consider asking a qualified legal professional if you are unsure.",
}


def _as_str(value, default="") -> str:
    return value if isinstance(value, str) else default


def _as_list(value) -> list:
    return value if isinstance(value, list) else []


def validate_and_repair_analysis(raw: dict) -> dict:
    """Returns a dict guaranteed to have every key the frontend expects, with safe types."""
    if not isinstance(raw, dict):
        raw = {}

    category = raw.get("category")
    if category not in VALID_CATEGORIES:
        category = "other"

    important_dates = [
        {"label": _as_str(d.get("label")), "date": _as_str(d.get("date"))}
        for d in _as_list(raw.get("important_dates"))
        if isinstance(d, dict)
    ]

    money = [
        {
            "label": _as_str(m.get("label")),
            "amount": _as_str(m.get("amount")),
            "due_date": m.get("due_date") if isinstance(m.get("due_date"), str) else None,
        }
        for m in _as_list(raw.get("money"))
        if isinstance(m, dict)
    ]

    risks = []
    for r in _as_list(raw.get("risks")):
        if not isinstance(r, dict):
            continue
        level = r.get("level") if r.get("level") in VALID_RISK_LEVELS else "normal"
        risks.append(
            {
                "level": level,
                "label": _as_str(r.get("label")),
                # Guard against the model asserting legal invalidity outright.
                "explanation": _as_str(r.get("explanation")).replace(
                    "is illegal", "may require attention"
                ).replace("is invalid", "may require attention"),
            }
        )

    confidence = raw.get("confidence", 0.5)
    try:
        confidence = max(0.0, min(1.0, float(confidence)))
    except (TypeError, ValueError):
        confidence = 0.5

    disclaimer = _as_str(raw.get("disclaimer"))
    if not disclaimer:
        disclaimer = DEFAULT_DISCLAIMERS.get(category, "")

    return {
        "category": category,
        "title": _as_str(raw.get("title"), "Untitled Scan"),
        "summary": _as_str(raw.get("summary")),
        "simple_explanation": _as_str(
            raw.get("simple_explanation"),
            "I couldn't reliably read this information. Please try scanning again with better lighting.",
        ),
        "instructions": [_as_str(i) for i in _as_list(raw.get("instructions"))],
        "warnings": [_as_str(w) for w in _as_list(raw.get("warnings"))],
        "important_dates": important_dates,
        "money": money,
        "risks": risks,
        "highlights": _as_list(raw.get("highlights")),
        "confidence": confidence,
        "source_information": [_as_str(s) for s in _as_list(raw.get("source_information"))],
        "disclaimer": disclaimer,
    }
