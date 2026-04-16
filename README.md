# TeachSmart

> **The search engine that knows your classroom, your curriculum, and your community.**

TeachSmart is an AI-powered curriculum resource finder for Australian teachers (Years 7–12). It helps teachers discover syllabus-aligned resources, generate differentiated lesson plans, build slide decks, and plan full semesters — all grounded in the **Australian Curriculum v9** and local community context.

Built for the **Cambridge EduX Hackathon 2026 (Oceania Edition)** — Challenge 4, sponsored by Cambridge University Press & Assessment.

---

## Why TeachSmart?

Teachers spend **5–10 hours per week** searching for teaching resources online. What they find tends to be:

- **Generic** — not aligned to their specific state syllabus
- **Unverified** — no trust or quality signals
- **Non-local** — disconnected from students' community, Country, and culture
- **Scattered** — fragmented across Google, Scootle, NESA, YouTube, TES, and dozens of other sites

TeachSmart compresses that work into a single curriculum-aware search with transparent trust signals and a local lens.

---

## Features

### Search & Discovery
- **Curriculum Search** — filter by Year level (7–12), State (NSW / VIC / QLD / WA / SA / TAS / ACT / NT), and Learning Area
- **AI Alignment Scoring** — every resource is scored against real **Australian Curriculum v9** outcomes
- **Voice Input** — speak your topic instead of typing (Web Speech API)
- **Student Interests** — personalise suggestions by selected interest areas

### Lesson & Unit Planning
- **Lesson Plan Generator** — complete 60-minute plans with a **Hook → Explore → Analyse → Evaluate → Reflect** structure, differentiated questions (Foundation / Core / Extension), and Australian local-context examples
- **Unit Planner** — capture unit context (lesson position, learning intention, success criteria) so every lesson plan is sequenced within your unit
- **Semester Planner** — AI-generated full-semester overviews with per-week topics, outcomes, activities, and assessment events
- **Presentation Slideshow** — 12-slide classroom-ready decks from any lesson plan, with fullscreen presenter mode and HTML/PDF export

### Trust & Local Context
- **Trust Scorecard** — every resource is evaluated across three tiers:
  - **Tier A — Source Authority** (deterministic): domain authority, HTTPS, author info, licence, established history
  - **Tier B — Curriculum Alignment** (CurricuLLM): strength, AC v9 outcome codes, alignment score
  - **Tier C — AI Risk Flags**: geographic, cultural, and currency concerns, graded low/medium/high
- **Local Lens** — connects resources to First Nations Country, local organisations, and landmarks by postcode
- **Live Local Feed** — "This Week in Your Area" cards powered by live BOM weather data and AI-generated location-specific teaching opportunities

### Teacher Experience
- **My Library** — save resources and lesson plans locally for later retrieval
- **Multilingual UI** — 8 interface languages: English, Mandarin, Arabic, Hindi, Vietnamese, Greek, Italian, Punjabi
- **Accessibility** — font-size control and high-contrast mode
- **Graceful Fallback** — if an AI call times out, the app returns quality mock data so the demo never breaks

---

## How the AI Pipeline Works

Each request flows through a tiered pipeline so the app stays fast, accurate, and resilient:

```
Browser (React + Vite)
      │ HTTP POST /api/...
      ▼
Express API (port 8080)
      │
      ├─ 1. Demo scenario match?      → return hardcoded JSON (instant, no AI)
      ├─ 2. CurricuLLM-AU (curriculum-trained)
      │     89% accuracy on AC benchmarks vs ~41% for generic models
      ├─ 3. Groq (openai/gpt-oss-120b / LLaMA3-70b) general fallback
      └─ 4. Static fallback           → always works, no keys needed
```

- **CurricuLLM** powers curriculum alignment (outcome code extraction and scoring).
- **Groq** powers resource discovery, lesson plans, feed items, and the "generic AI" comparison panel.
- **Bureau of Meteorology** provides live weather for the local-feed widget (no key required).

See [HOW-IT-WORKS.md](HOW-IT-WORKS.md) for the full route-by-route breakdown.

---

## Tech Stack

| Layer              | Technology                                                          |
| ------------------ | ------------------------------------------------------------------- |
| Frontend           | React 19, Vite 7, TypeScript, Tailwind CSS                          |
| Backend            | Node.js, Express 5, TypeScript                                      |
| AI — Curriculum    | [CurricuLLM-AU](https://curricullm.com) (`baseURL: api.curricullm.com/v1`) |
| AI — General       | [Groq](https://groq.com) (`openai/gpt-oss-120b`, `llama3-70b-8192`) |
| Weather            | Bureau of Meteorology public JSON                                   |
| Curriculum Data    | Australian Curriculum v9 JSON (8 learning areas)                    |
| API Contract       | OpenAPI 3.1, generated React Query hooks (Orval) + Zod schemas      |
| Type Safety        | TypeScript strict mode, Zod                                         |
| Monorepo           | pnpm workspaces                                                     |
| Fonts              | DM Sans, DM Serif Display                                           |
| Deployment         | Railway (`railway.toml`, `nixpacks.toml`)                           |

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) **v20+**
- [pnpm](https://pnpm.io/) — install with `npm install -g pnpm`
- A free [Groq API key](https://console.groq.com) (~30 seconds to create)
- *(Optional)* A [CurricuLLM](https://curricullm.com) API key for the highest-accuracy curriculum alignment. Without it, the app falls back to Groq + demo scenarios.

### 1. Clone and install

```bash
git clone https://github.com/sum-kaur/teachsmart.git
cd teachsmart
pnpm install
```

> `preinstall` blocks `npm`/`yarn` — you must use **pnpm**.

### 2. Configure environment

```bash
cp .env.example .env        # macOS / Linux
copy .env.example .env      # Windows
```

Edit `.env`:

```env
GROQ_API_KEY=your_groq_api_key_here
CURRICULLM_API_KEY=your_curricullm_key_here   # optional
SESSION_SECRET=any-random-string-here
PORT=8080
```

| Variable | Required | Description |
|---|---|---|
| `GROQ_API_KEY` | Yes | Powers resource discovery, lesson plans, feed items |
| `CURRICULLM_API_KEY` | No | Enables curriculum-trained AI alignment (falls back to Groq if absent) |
| `SESSION_SECRET` | Yes | Any random string. Generate one: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `PORT` | Yes | Must be `8080` — the API server port |

### 3. Run locally

```bash
pnpm run dev
```

This starts both services concurrently:
- **Frontend** → http://localhost:5173
- **API**      → http://localhost:8080

---

## Available Scripts

| Script                  | Description                                                            |
| ----------------------- | ---------------------------------------------------------------------- |
| `pnpm run dev`          | Start API (port 8080) + frontend (port 5173) together.                 |
| `pnpm run build`        | Typecheck everything, then build all workspaces.                       |
| `pnpm run typecheck`    | Run the full workspace typecheck.                                      |
| `pnpm run typecheck:libs` | Typecheck shared libraries only.                                     |

---

## Project Structure

```
teachsmart/
├── artifacts/
│   ├── teachsmart/                # React + Vite frontend (port 5173)
│   │   └── src/
│   │       ├── pages/Home.tsx     # Main app (all 9 screens)
│   │       ├── components/
│   │       │   ├── VoiceMic.tsx
│   │       │   ├── Slideshow.tsx
│   │       │   ├── UnitPlanner.tsx
│   │       │   ├── Library.tsx
│   │       │   ├── SemesterPlanner.tsx
│   │       │   ├── TrustScorecard.tsx
│   │       │   └── Settings.tsx
│   │       └── lib/
│   │           ├── translations.ts   # 8-language strings
│   │           └── library.ts        # localStorage CRUD
│   └── api-server/                # Express 5 backend (port 8080)
│       └── src/
│           ├── routes/
│           │   ├── alignment.ts       # /api/alignment
│           │   ├── resources.ts       # /api/resources
│           │   ├── lessons.ts         # /api/lesson
│           │   ├── slides.ts          # /api/slides
│           │   ├── semesterPlan.ts    # /api/semester-plan
│           │   ├── compare.ts         # /api/compare
│           │   ├── feed.ts            # /api/feed
│           │   ├── share.ts
│           │   └── health.ts
│           └── lib/
│               ├── curricullm.ts      # CurricuLLM API client
│               ├── groq.ts            # Groq client
│               ├── curriculum.ts      # AC v9 JSON loader
│               ├── demoScenarios.ts   # Hardcoded demo responses
│               ├── trustedSources.ts  # 30+ AU trusted-source DB
│               ├── localContext.ts    # Postcode → local data
│               ├── curatedResources.ts
│               ├── brave.ts           # Brave Search integration
│               ├── tavily.ts          # Tavily Search integration
│               └── logger.ts
├── lib/
│   ├── api-spec/                  # OpenAPI 3.1 spec
│   ├── api-client-react/          # Generated React Query hooks
│   └── api-zod/                   # Generated Zod schemas
├── data/                          # Australian Curriculum v9 JSON
│   ├── science.json
│   ├── english.json
│   ├── mathematics.json
│   ├── humanities.json
│   ├── arts.json
│   ├── hpe.json
│   ├── technologies.json
│   └── languages.json
├── scripts/                       # Utility and codegen scripts
├── HOW-IT-WORKS.md                # Deep technical breakdown
├── HOW-TO-RUN.md                  # Full run instructions
├── TEAM-PITCH-GUIDE.md            # Pitch deck + diagrams
├── CLAUDE.md                      # Context for Claude Code
├── railway.toml / nixpacks.toml   # Deployment config
├── pnpm-workspace.yaml
└── tsconfig.base.json / tsconfig.json
```

---

## API Endpoints

| Method | Endpoint                   | Description                                                     |
| ------ | -------------------------- | --------------------------------------------------------------- |
| `GET`  | `/api/healthz`             | Health check                                                    |
| `POST` | `/api/alignment`           | Score curriculum alignment (CurricuLLM → Groq → static)         |
| `POST` | `/api/resources`           | Find curriculum-aligned Australian resources                    |
| `POST` | `/api/lesson`              | Generate a differentiated 60-min lesson plan                    |
| `POST` | `/api/slides`              | Generate a 12-slide presentation deck                           |
| `POST` | `/api/semester-plan`       | Generate a full semester curriculum plan                        |
| `POST` | `/api/compare`             | "CurricuLLM vs Generic AI" comparison panel                     |
| `POST` | `/api/feed`                | Local teaching-opportunity cards (BOM weather + Groq)           |
| `GET`  | `/api/resources/recent`    | Recent resources for dashboard                                  |
| `GET`  | `/api/dashboard/stats`     | Dashboard summary statistics                                    |

---

## Demo Scenarios

TeachSmart ships with six fully hardcoded demo scenarios that require no API keys and respond instantly. They're used for hackathon presentations and offline demos:

| Trigger                                                  | Key                              |
| -------------------------------------------------------- | -------------------------------- |
| Year 9, NSW, Science, Climate Change                     | `year9-nsw-science-climate`      |
| Year 9, NSW, Mathematics, Algebra                        | `year9-nsw-maths-algebra`        |
| Year 8, VIC, English, Romeo and Juliet                   | `year8-vic-english-romeo`        |
| **Year 9–10, NSW, History, Rights and Freedoms** (main)  | `year9-nsw-history-rights`       |
| Year 10, QLD, History, Rights and Freedoms               | `year10-qld-history-rights`      |
| Year 7, NSW, Geography, Ecosystems                       | `year7-nsw-geography-ecosystems` |

Postcodes with hardcoded local context: **2150** (Parramatta, Darug Country), **2000** (Sydney CBD), **2170** (Liverpool), **2250** (Central Coast), **4870** (Cairns).

---

## Supported Learning Areas, States & Years

- **Learning Areas:** Science · Mathematics · English · Humanities & Social Sciences · The Arts · Health & Physical Education · Technologies · Languages
- **States:** NSW · VIC · QLD · WA · SA · TAS · ACT · NT
- **Year Levels:** 7 – 12

---

## Deployment

The repo includes configuration for **Railway** (`railway.toml`, `nixpacks.toml`). For production:

1. Push the repo to Railway and set the environment variables listed above.
2. Ensure the build command runs `pnpm run build` and the start command runs the API server.
3. Configure the frontend build output as a static site served alongside the API, or split them as separate Railway services.

---

## Further Reading

- [HOW-TO-RUN.md](HOW-TO-RUN.md) — step-by-step run guide
- [HOW-IT-WORKS.md](HOW-IT-WORKS.md) — technical deep-dive per route
- [TEAM-PITCH-GUIDE.md](TEAM-PITCH-GUIDE.md) — hackathon pitch deck + diagrams
- [CLAUDE.md](CLAUDE.md) — context file for Claude Code

---

## License

[MIT](LICENSE)
