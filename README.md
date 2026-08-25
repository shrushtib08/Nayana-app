# Nayana — Visual Knowledge & Bureaucracy Decoder

> நயனா / ನಯನ — "the eye." Point your camera at anything. Nayana explains it in
> simple language, and speaks it aloud.

## 1. Problem Statement

Millions of people struggle to navigate daily life because of low literacy,
age, visual impairment, or simply because official language — medicine
labels, government notices, rental agreements, bills — is written to be
precise, not understood. A missed clause or a misread dosage has real
consequences.

## 2. Solution

Nayana lets someone point a phone camera at almost anything — a medicine
strip, a government form, a bus sign, a textbook page — and get back:

1. A plain-language explanation
2. That explanation read aloud, in their own language
3. Clear, color-coded warnings about deadlines, payments, and risky clauses
4. A conversational "ask this document" interface for follow-up questions

It is built audio-first and accessibility-first: every screen works for
someone who cannot read the words on it.

## 3. Features

- 📷 One-tap camera capture with flash, front/back switch, and file upload fallback
- 🧠 Swappable vision-AI abstraction (`AIService`) — Anthropic, OpenAI, or Demo Mode
- 🔤 Swappable OCR abstraction (`OCRService`) — Google Vision, Tesseract, or Demo Mode
- 🌐 Swappable translation abstraction (`TranslationService`) — meaning-first, not word-for-word
- 💊 Medicine Mode with a hard rule: **never invents a dosage**
- 📜 Bureaucracy Decoder: turns legal/official language into plain sentences
- 🚦 Document risk detection: 🔴 Important / 🟠 Be Careful / 🟢 Normal
- 🖼️ Tappable highlight overlays on the original scanned image
- 🔊 Audio-first UI: Listen / Pause / Stop / Repeat on every result
- ❓ "Ask This Document" conversational Q&A grounded in the scanned text
- 📜 Scan history with search, delete, and replay
- ♿ Easy Mode (elderly), Visually Impaired Mode, dark mode, high-contrast mode
- 🔐 Login required — every screen except the landing page sits behind auth (`ProtectedRoute`)
- 📱 Android APK build via Capacitor, using the native camera on-device
- 📴 PWA app-shell caching for low-connectivity areas
- 🧪 Demo Mode with 5 realistic sample scans for offline hackathon demos

## 4. Architecture

```mermaid
flowchart TD
    A[📷 Camera Capture] --> B[Image Preprocessing]
    B --> C[OCRService: extract text]
    C --> D[AIService: classify + understand]
    D --> E[Risk & Important-Info Extraction]
    E --> F[Simplification]
    F --> G[TranslationService]
    G --> H[Structured JSON Response]
    H --> I[🔊 Text-to-Speech - Web Speech API]
    H --> J[Result Screen]

    subgraph Backend [Django REST API]
      C
      D
      E
      F
      G
    end

    subgraph Frontend [React PWA]
      A
      B
      I
      J
    end
```

### Tech stack

| Layer | Technology |
|---|---|
| Frontend | React, TypeScript, Vite, Tailwind CSS, PWA |
| Backend | Python, Django, Django REST Framework |
| Database | PostgreSQL (SQLite fallback for local dev) |
| Auth | JWT via `djangorestframework-simplejwt` |
| AI | Pluggable: Anthropic Claude / OpenAI / Demo |
| OCR | Pluggable: Google Vision / Tesseract / Demo |
| Translation | Pluggable: Google Translate / AI rephrase / Demo |
| Speech | Web Speech API (client-side, works offline) |

### Backend app structure

```
backend/
  nayana/            # settings, urls, wsgi/asgi
  apps/
    users/            # auth, profile, language & accessibility preferences
    scanner/           # Scan model, history, analyze/ask-document/feedback views
    ai/                 # AIService + OCRService abstractions, prompts, validators
    translation/        # TranslationService abstraction, /translate/ and /speech/
```

> Note on the original 7-app suggestion (`users`, `scanner`, `documents`, `ai`,
> `translation`, `history`, `accessibility`): `documents` and `history` are
> both modeled as the `Scan` model inside `scanner` (a document *is* a scan,
> and history is just a filtered list of scans), and `accessibility`
> preferences live as fields on the `User` model inside `users`. This avoids
> splitting one small table across three near-empty Django apps.

## 5. Installation

### Prerequisites
- Node.js 18+
- Python 3.11+
- PostgreSQL 14+ (optional — SQLite works for local dev/demo)

### Clone & configure environment

```bash
cp .env.example .env
# Edit .env: set SECRET_KEY, and optionally AI_PROVIDER / API keys.
# Leave AI_PROVIDER=demo to run without any external API key.
```

### Backend setup

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

python manage.py migrate
python manage.py createsuperuser   # optional, for /admin/

python manage.py runserver          # http://localhost:8000
```

### Frontend setup

```bash
cd frontend
npm install
npm run dev                          # http://localhost:5173
```

### Or with Docker Compose

```bash
docker compose up --build
```

## 6. Environment variables

See `.env.example` at the repo root for the full list. Key ones:

| Variable | Purpose |
|---|---|
| `AI_PROVIDER` | `demo` \| `anthropic` \| `openai` |
| `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` | Vision AI credentials |
| `OCR_PROVIDER` | `demo` \| `google_vision` \| `tesseract` |
| `TRANSLATION_PROVIDER` | `demo` \| `google_translate` \| `ai` |
| `DATABASE_URL` | Postgres connection string (omit for SQLite) |
| `VITE_DEMO_MODE` | `true` to force the frontend to use local demo data |

## 7. Database setup

By default, if `DATABASE_URL` is unset, Django uses SQLite at
`backend/db.sqlite3` — zero setup required. To use Postgres:

```bash
createdb nayana
# set DATABASE_URL=postgres://user:pass@localhost:5432/nayana in .env
python manage.py migrate
```

## 8. AI configuration

`apps/ai/services.py` exposes a single `AIService` class used everywhere in
the backend. To go live:

1. Set `AI_PROVIDER=anthropic` (or `openai`) in `.env`
2. Set the matching API key
3. Restart the backend

If the live provider errors at request time (bad key, timeout, rate limit),
`AIService` automatically falls back to a demo response rather than crashing
the request — the person sees a usable, honestly-labeled result instead of
an error page.

## 9. Accuracy — getting real, correct answers

Demo Mode (the default) exists purely to demo the *interface* — it cycles
through 5 canned sample answers and does not actually read your photo. The
Result screen now shows an explicit "⚠️ Demo Mode result" banner whenever
this is happening, so it's never mistaken for a real analysis.

To get accurate answers for real photos:

1. **Configure a real AI provider.** Set `AI_PROVIDER=anthropic` (or
   `openai`) and the matching API key in `.env`, then restart the backend.
   No AI system — including this one — can accurately read a document
   without a real vision model behind it.
2. **Configure a real OCR provider** (`OCR_PROVIDER=google_vision` or
   `tesseract`) for documents with dense or small text (contracts, forms).
   The vision model alone can read most images, but dedicated OCR
   meaningfully improves accuracy on small, dense, or low-contrast text.
3. **Image quality matters.** The camera screen now runs a lightweight
   on-device sharpness/brightness check right after you capture a photo
   (`frontend/src/pages/Camera.tsx` → `assessImageQuality`) and warns you to
   retake if the photo is too dark, overexposed, or blurry — the single
   biggest cause of inaccurate scans in practice.
4. **`temperature=0`** is set on both the Anthropic and OpenAI providers so
   responses stay grounded and consistent rather than creative.
5. Every response still goes through `apps/ai/validators.py`, which strips
   invented dosages, fabricated dates, and claims of legal invalidity before
   anything reaches the user — see Section 14, Safety Limitations.

No system can guarantee 100% accuracy on every possible photo — glare,
handwriting, damaged documents, and unsupported languages will still
occasionally produce a low-confidence or incomplete answer. When that
happens the app is designed to say so explicitly (`confidenceLevel: "low"`)
rather than presenting a guess as fact.

## 10. Demo mode

Two independent demo layers exist so the product can be shown without any
backend running at all:

- **Frontend demo mode** (`VITE_DEMO_MODE=true`, the default): the camera
  capture flow runs entirely client-side against
  `frontend/src/services/demoData.ts`, which contains 5 realistic structured
  responses (medicine, government notice, rental agreement, bus sign,
  textbook page).
- **Backend demo mode** (`AI_PROVIDER=demo`, `OCR_PROVIDER=demo`): the real
  `/api/analyze/` pipeline runs end-to-end (upload → OCR → AI → DB → response)
  but returns a placeholder structured response instead of calling a paid API,
  useful for testing the full stack without spending API credits.

## 11. API documentation

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/register/` | Create an account |
| POST | `/api/auth/login/` | Log in, receive JWT |
| GET/PUT | `/api/auth/profile/` (alias: `/api/profile/`) | View/update language & accessibility prefs |
| POST | `/api/auth/forgot-password/` | Request a password reset |
| POST | `/api/analyze/` | Upload an image, get a structured explanation |
| POST | `/api/translate/` | Translate text or a saved scan's explanation |
| POST | `/api/speech/` | Resolve a locale tag for client-side TTS |
| GET | `/api/history/` | List past scans (`?search=`) |
| GET | `/api/history/:id/` | Retrieve one scan |
| DELETE | `/api/history/:id/` | Delete one scan |
| POST | `/api/ask-document/` | Ask a question about a scanned document |
| POST | `/api/feedback/` | Submit feedback on a result |

All structured analysis responses follow this shape:

```json
{
  "category": "medicine",
  "title": "Paracetamol 500 mg",
  "summary": "...",
  "simpleExplanation": "...",
  "instructions": ["..."],
  "warnings": ["..."],
  "importantDates": [{ "label": "Expiry", "date": "MAR 2027" }],
  "money": [],
  "risks": [{ "level": "caution", "label": "...", "explanation": "..." }],
  "confidence": 0.94,
  "confidenceLevel": "high",
  "sourceInformation": ["..."],
  "disclaimer": "..."
}
```

## 12. Accessibility features

- **Easy Mode**: large text, two-button home screen, minimal navigation
- **Visually Impaired Mode**: large touch targets, voice guidance copy, screen-reader labels on every interactive element
- **High Contrast theme**: pure black/white palette with thick borders
- Keyboard focus is always visible (`:focus-visible` outline)
- `prefers-reduced-motion` is respected app-wide
- Every result can be read aloud, in 10 languages: Kannada, English, Telugu, Tamil, Malayalam, Marathi, Hindi, Bengali, Spanish, and Korean

## 13. Privacy considerations

- Login is required to reach any scanning screen (`frontend/src/components/ProtectedRoute.tsx`
  redirects unauthenticated visitors to `/login`); only the marketing landing page is public
- Every scan can be deleted individually from History
- Admins can see scan metadata (category, confidence, timestamps) but the
  Django admin list view deliberately omits OCR text / analysis content from
  the browsable table
- File uploads are size-limited (`MAX_UPLOAD_SIZE_MB`)
- All secrets are environment variables — nothing is hard-coded

## 14. Safety limitations

Nayana is explicitly designed **not** to:

- Diagnose diseases or prescribe medicine
- Invent a dosage, frequency, or timing not printed on a package
- Claim legal certainty about a contract clause
- Fabricate a deadline, date, or financial figure not present in the document

Every medicine result carries a doctor/pharmacist disclaimer. Every
legal/government result carries a "not legal advice" disclaimer. When the AI
is uncertain, the app says so rather than guessing — see
`apps/ai/prompts.py` and `apps/ai/validators.py` for exactly how this is
enforced.

## 15. Future improvements

- Real-time on-device OCR for fully offline scanning
- Higher-quality regional-language TTS voices (beyond the browser's built-in voices)
- Multi-page document scanning (e.g. a full rental agreement, not one photo)
- Family/caregiver shared accounts for supervised use
- Push notifications for extracted deadlines (e.g. bill due dates)
- Expand beyond the initial 10 languages, and add more regional English/Indic dialect variants

## 16. Building the Android APK

The frontend is wired up with [Capacitor](https://capacitorjs.com/), which
wraps the React app in a native Android WebView shell and exposes native
device APIs (camera, gallery) through `@capacitor/camera`. `frontend/src/pages/Camera.tsx`
already detects native vs. browser at runtime and uses the native camera
sheet on Android instead of the web `getUserMedia` API.

**Building an actual `.apk` requires the Android SDK, a JDK, and Gradle on
your own machine** — none of that can run inside this chat, so these are the
exact commands to run locally once you've downloaded the project.

### One-time setup
1. Install [Android Studio](https://developer.android.com/studio) (this gives you the Android SDK, platform tools, and a JDK).
2. `cd frontend && npm install`

### Generate the native Android project
```bash
npm run build              # builds the web app into frontend/dist
npx cap add android        # generates the frontend/android/ native project (one-time)
npx cap sync android       # copies the web build + plugins into it
```

### Add required permissions
Open `frontend/android/app/src/main/AndroidManifest.xml` and make sure these
are present (Capacitor's camera plugin adds most of this automatically, but
double-check after `cap add android`):
```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.INTERNET" />
<uses-feature android:name="android.hardware.camera" android:required="false" />
```

### Build the APK
**Option A — command line (fastest, gives you a debug APK):**
```bash
cd frontend/android
./gradlew assembleDebug
# Output: frontend/android/app/build/outputs/apk/debug/app-debug.apk
```
Install it on a connected device/emulator with:
```bash
adb install app/build/outputs/apk/debug/app-debug.apk
```

**Option B — Android Studio (needed for a signed release build):**
```bash
npx cap open android
```
Then in Android Studio: `Build → Generate Signed Bundle / APK → APK`, create
or select a keystore, and build the release variant. A release APK is
required if you plan to distribute the app outside of direct sideloading.

### Pointing the app at your backend
By default the built app calls whatever `VITE_API_BASE_URL` was set to at
build time (see `.env`). On a real device, `http://localhost:8000` refers to
the phone itself, not your computer — set `VITE_API_BASE_URL` to your
computer's LAN IP (e.g. `http://192.168.1.50:8000/api`) or your deployed
backend's public URL before running `npm run build`.

## 17. Test accounts

Login is required before you can scan anything — the app has no guest mode.

- No seeded accounts ship with the project. Use the in-app **Sign Up** screen
  (any email + an 8+ character password) to create one.
- With `VITE_DEMO_MODE=true` (the frontend default), signup/login is handled
  entirely client-side — no backend call is made, so you can try the full
  app flow with zero setup. Set `VITE_DEMO_MODE=false` to require the real
  Django `/api/auth/login/` check instead.
- For `/admin/` access, run `python manage.py createsuperuser` in `backend/`.
