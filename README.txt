# AI Voice News Assistant — Implementation Plan

A voice-first, personalized AI news assistant for a hackathon demo. Users speak a query, the app fetches relevant news, summarizes it with GPT based on the user's role (Student / Investor / Founder), and reads the summary aloud.

## Architecture

```
React (Vite) — Voice I/O + UI
        ↓
Flask API (Python)
        ↓
NewsAPI  +  OpenAI GPT
        ↓
Return Summary → Browser TTS
```

---

## Proposed Changes

### Backend (`/backend`)

#### [NEW] [requirements.txt](file:///Users/nag/Desktop/hackthon%20pj/backend/requirements.txt)
- `flask`, `flask-cors`, `requests`, `openai`, `python-dotenv`

#### [NEW] [.env](file:///Users/nag/Desktop/hackthon%20pj/backend/.env)
- `NEWSAPI_KEY` and `OPENAI_API_KEY` placeholders (user must fill in)

#### [NEW] [app.py](file:///Users/nag/Desktop/hackthon%20pj/backend/app.py)
- Flask app with a single POST endpoint: `POST /get-news`
- **Request body:** `{ "query": "...", "role": "student|investor|founder" }`
- **Logic:**
  1. Call NewsAPI `/v2/everything` with the query → get top 5 article titles + descriptions
  2. Build a GPT prompt that includes the raw articles + the user's role, asking for a role-tailored summary
  3. Call OpenAI Chat Completions (GPT-3.5-turbo or GPT-4o-mini) to generate the summary
  4. Return `{ "summary": "...", "articles": [...] }`
- **Fallback:** If NewsAPI or OpenAI fails, return a hardcoded backup response so the demo never breaks
- CORS enabled for local React dev server

---

### Frontend (`/frontend` — Vite + React)

#### [NEW] Vite React project (scaffolded via `npx create-vite`)
Standard Vite React scaffold in `/frontend`.

#### [NEW] [src/App.jsx](file:///Users/nag/Desktop/hackthon%20pj/frontend/src/App.jsx)
- Main layout: header, role selector, mic button, response panel
- State management for query, role, response, loading, listening

#### [NEW] [src/App.css](file:///Users/nag/Desktop/hackthon%20pj/frontend/src/App.css)
- Premium dark theme with glassmorphism cards
- Gradient background, smooth animations
- Pulsing mic button with active state glow

#### [NEW] [src/components/MicButton.jsx](file:///Users/nag/Desktop/hackthon%20pj/frontend/src/components/MicButton.jsx)
- Large glowing microphone button
- Uses Web Speech API (`webkitSpeechRecognition`)
- Falls back to text input if speech not supported
- Pulse animation while listening

#### [NEW] [src/components/RoleSelector.jsx](file:///Users/nag/Desktop/hackthon%20pj/frontend/src/components/RoleSelector.jsx)
- Styled segmented control: 🎓 Student · 💼 Investor · 🚀 Founder
- Updates role state in parent

#### [NEW] [src/components/ResponsePanel.jsx](file:///Users/nag/Desktop/hackthon%20pj/frontend/src/components/ResponsePanel.jsx)
- Displays AI summary with typewriter animation
- Shows source article links
- Speaker button to trigger TTS playback
- Loading skeleton while waiting

#### [NEW] [src/components/TextFallback.jsx](file:///Users/nag/Desktop/hackthon%20pj/frontend/src/components/TextFallback.jsx)
- Text input + submit button as fallback when voice is unavailable

#### [NEW] [src/utils/speech.js](file:///Users/nag/Desktop/hackthon%20pj/frontend/src/utils/speech.js)
- `startListening(onResult, onError)` — wraps Web Speech API
- `speakText(text)` — wraps browser `SpeechSynthesis` TTS
- `stopSpeaking()` — cancels TTS

#### [NEW] [src/utils/api.js](file:///Users/nag/Desktop/hackthon%20pj/frontend/src/utils/api.js)
- `fetchNewsSummary(query, role)` → POST to Flask `/get-news`

---

## Key Design Decisions

| Decision | Rationale |
|---|---|
| Flask (not FastAPI) | Simpler setup, user requested Flask |
| Vite + React | Fast HMR, modern tooling |
| Web Speech API | No extra dependencies, works in Chrome |
| Browser TTS | Zero-cost, instant, no API needed |
| Hardcoded fallbacks | Demo must never break |
| Dark glassmorphism UI | Premium feel for hackathon judges |

> [!IMPORTANT]
> **API Keys Required:** You must provide your own `NEWSAPI_KEY` (from [newsapi.org](https://newsapi.org)) and `OPENAI_API_KEY` in `backend/.env` for the app to work.

---

## Verification Plan

### Automated (Browser)
1. Start Flask backend: `cd backend && python app.py`
2. Start Vite frontend: `cd frontend && npm run dev`
3. Open the app in the browser and verify:
   - Role selector switches between Student / Investor / Founder
   - Typing a query in the text fallback and submitting returns a summary
   - Mic button activates (Chrome only)
   - TTS reads the summary aloud
   - Loading animation displays while waiting
   - Switching roles for the same query produces a different summary

### Manual (Demo Flow)
1. Click mic → say "latest startup funding news"
2. See AI summary appear with typewriter effect
3. Hear TTS read the summary
4. Switch role from Student to Investor → ask same question
5. Verify the summary changes to investor-focused language
