# TeachSmart

An AI-powered curriculum resource finder for Australian teachers (Years 7–12). TeachSmart helps teachers discover syllabus-aligned resources, generate differentiated lesson plans, build slide decks, and plan full semesters — all grounded in Australian Curriculum v9 outcomes and real Australian context.

---

## Features

- **Curriculum Search** — Find resources aligned to Australian state syllabuses across Years 7–12 and all key learning areas
- **AI Alignment Scoring** — Every resource is scored against real Australian Curriculum v9 outcomes
- **Lesson Plan Generator** — Complete 60-minute plans with Hook → Explore → Analyse → Evaluate → Reflect structure, differentiated questions (Foundation / Core / Extension), and Australian local context examples
- **Presentation Slideshow** — 12-slide classroom-ready decks generated from any lesson plan, with fullscreen presenter mode and HTML/PDF export
- **Unit Planner** — Capture unit context (lesson position, learning intention, success criteria) so every lesson plan is sequenced within your unit
- **Semester Planner** — AI-generated full-semester overviews with per-week topics, outcomes, activities, and assessment events
- **My Library** — Save resources and lesson plans locally for later retrieval
- **Voice Input** — Speak your topic instead of typing, using the Web Speech API
- **Student Interests** — Personalise resource suggestions by selecting student interest areas
- **Multilingual UI** — 8 interface languages: English, Mandarin, Arabic, Hindi, Vietnamese, Greek, Italian, Punjabi
- **Accessibility** — Font size control and high contrast mode
- **Live Local Feed** — "This Week in Your Area" cards using live BOM weather data and AI-generated location-specific teaching opportunities
- **Demo Scenarios** — 5 instant pre-built responses for reliable demos (no API call required)
- **Graceful Fallback** — If the AI times out, the app returns quality mock data automatically

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v20 or higher
- [pnpm](https://pnpm.io/) — install with `npm install -g pnpm`
- A free [Groq API key](https://console.groq.com) (takes ~30 seconds to create)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/teachsmart.git
cd teachsmart

# Install all dependencies
pnpm install
```

### Environment Variables

Create a `.env` file in the project root (never commit this file):

```
GROQ_API_KEY=your_groq_api_key_here
SESSION_SECRET=any-random-string-here
```

| Variable | Required | Description |
|----------|----------|-------------|
| `GROQ_API_KEY` | Yes | Powers all AI features. Get a free key at [console.groq.com](https://console.groq.com) |
| `SESSION_SECRET` | Yes | Signs session cookies. Any random string works (e.g. `openssl rand -hex 32`) |

> **No API key?** The app still works — it returns built-in mock data for every request. The 5 demo scenarios always work without any API key.

### Running Locally

Start both servers in separate terminals:

```bash
# Terminal 1 — API server (runs on port 8080 by default)
pnpm --filter @workspace/api-server run dev

# Terminal 2 — Frontend
pnpm --filter @workspace/teachsmart run dev
```

Open the URL shown in the frontend terminal (e.g. `http://localhost:5173`).

---

## Demo Scenarios

These 5 combinations return instant pre-built results (~400ms) without calling the AI — ideal for demos and offline use:

| Year | State | Subject | Topic |
|------|-------|---------|-------|
| Year 9 | NSW | Science | `Climate Change` |
| Year 9 | NSW | Mathematics | `Algebra` |
| Year 8 | VIC | English | `Romeo and Juliet` |
| Year 10 | QLD | History | `Rights and Freedoms` |
| Year 7 | NSW | Geography | `Ecosystems` |

---

## Project Structure

```
teachsmart/
├── artifacts/
│   ├── teachsmart/              # React + Vite frontend
│   │   └── src/
│   │       ├── pages/
│   │       │   └── Home.tsx     # Main app (all 9 screens)
│   │       ├── components/
│   │       │   ├── VoiceMic.tsx
│   │       │   ├── Slideshow.tsx
│   │       │   ├── UnitPlanner.tsx
│   │       │   ├── Library.tsx
│   │       │   ├── SemesterPlanner.tsx
│   │       │   └── Settings.tsx
│   │       └── lib/
│   │           ├── translations.ts   # 8-language strings
│   │           └── library.ts        # localStorage CRUD
│   └── api-server/              # Express 5 backend
│       └── src/
│           ├── routes/
│           │   ├── alignment.ts
│           │   ├── resources.ts
│           │   ├── lessons.ts
│           │   ├── slides.ts
│           │   ├── semesterPlan.ts
│           │   └── feed.ts
│           └── lib/
│               ├── groq.ts          # Shared Groq client
│               ├── curriculum.ts    # Curriculum data loader
│               ├── demoScenarios.ts # 5 instant demo responses
│               └── localContext.ts  # Postcode → local context map
├── lib/
│   ├── api-spec/                # OpenAPI 3.1 spec
│   ├── api-client-react/        # Generated React Query hooks
│   └── api-zod/                 # Generated Zod schemas
└── data/                        # Australian Curriculum v9 JSON files
    ├── science.json
    ├── english.json
    ├── mathematics.json
    ├── humanities.json
    ├── arts.json
    ├── hpe.json
    ├── technologies.json
    └── languages.json
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/healthz` | Health check |
| `POST` | `/api/alignment` | Score curriculum alignment for a topic |
| `POST` | `/api/resources` | Find curriculum-aligned Australian resources |
| `POST` | `/api/lesson` | Generate a differentiated lesson plan |
| `POST` | `/api/slides` | Generate a 12-slide presentation deck |
| `POST` | `/api/semester-plan` | Generate a full semester curriculum plan |
| `POST` | `/api/feed` | Get local teaching opportunity cards (BOM weather + AI) |
| `GET` | `/api/resources/recent` | Recent resources for dashboard |
| `GET` | `/api/dashboard/stats` | Dashboard summary statistics |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS |
| Backend | Node.js, Express 5, TypeScript |
| AI | Groq (`llama3-70b-8192`) via Groq SDK |
| Curriculum Data | Australian Curriculum v9 JSON (8 learning areas) |
| API Contract | OpenAPI 3.1, Orval codegen |
| Type Safety | TypeScript, Zod |
| Monorepo | pnpm workspaces |
| Fonts | DM Sans, DM Serif Display (Google Fonts) |

---

## Supported Learning Areas & States

**Learning Areas:** Science, Mathematics, English, Humanities & Social Sciences, The Arts, Health & Physical Education, Technologies, Languages

**States:** NSW, VIC, QLD, WA, SA, TAS, ACT, NT

**Year Levels:** Years 7–12

---

## License

MIT
