# TeachSmart — CLAUDE.md

> This file provides context for Claude Code. Read this before starting any task.

## What is this project?

**TeachSmart** is a hackathon project for the Cambridge EduX Hackathon 2026 (Oceania Edition, Sydney). Competing in **Challenge 4**, sponsored by **Cambridge University Press & Assessment**, focused on helping teachers discover, evaluate, and adapt educational resources for Australian classrooms.

**One-liner:** "The search engine that knows your classroom, your curriculum, and your community."

**Demo Day:** April 9, 2026 at UTS Sydney.

**Team:** 5 people, software engineering and data science backgrounds (masters students).

---

## The Problem We're Solving

Teachers spend 5–10 hours per week searching for teaching resources online. What they find is:
- Generic (not aligned to their specific curriculum)
- Unverified (no trust or quality signals)
- Not localised (disconnected from students' local context and community)
- Scattered across fragmented platforms (Google, Scootle, NESA, YouTube, TES, etc.)

---

## Actual Tech Stack (what is built and running)

### Framework
- **React 19 + Vite 7** frontend with **TypeScript**
- **Express 5** API server with TypeScript
- **Tailwind CSS** for all styling
- **pnpm monorepo** with workspaces

### Monorepo Structure
```
teachsmart/
├── artifacts/
│   ├── api-server/          ← Express backend (port 8080)
│   │   └── src/
│   │       ├── index.ts     ← Entry point, loads .env
│   │       ├── app.ts       ← Express app setup
│   │       ├── lib/
│   │       │   ├── curricullm.ts      ← CurricuLLM API client
│   │       │   ├── groq.ts            ← Groq/LLaMA3 client
│   │       │   ├── curriculum.ts      ← Loads AC v9 JSON files
│   │       │   ├── demoScenarios.ts   ← 6 hardcoded demo scenarios
│   │       │   ├── trustedSources.ts  ← 30+ AU trusted sources DB
│   │       │   └── localContext.ts    ← Postcode → local data
│   │       └── routes/
│   │           ├── alignment.ts   ← /api/alignment (CurricuLLM)
│   │           ├── resources.ts   ← /api/resources
│   │           ├── lessons.ts     ← /api/lesson
│   │           ├── compare.ts     ← /api/compare (AI comparison)
│   │           ├── feed.ts        ← /api/feed (BOM + Groq)
│   │           └── index.ts       ← Route aggregator
│   └── teachsmart/              ← React frontend (port 5173)
│       └── src/
│           ├── pages/Home.tsx   ← Entire frontend (single file)
│           └── components/
│               └── TrustScorecard.tsx ← 3-tier trust report
├── data/                        ← Australian Curriculum v9 JSON
├── lib/                         ← Shared Zod schemas
├── .env                         ← API keys (git-ignored)
├── HOW-IT-WORKS.md              ← Deep technical breakdown
├── HOW-TO-RUN.md                ← How to run locally
└── TEAM-PITCH-GUIDE.md         ← Pitch deck + diagrams for team
```

### External APIs
- **CurricuLLM API** — `baseURL: https://api.curricullm.com/v1`, model: `CurricuLLM-AU`. 89% accuracy on AC benchmarks vs 41% for generic AI. Used for curriculum alignment only.
- **Groq API** — `llama3-70b-8192`. Used for resource generation, lesson plans, feed items, generic AI comparison.
- **BOM Weather API** — Free, no key needed. Live weather by city.

### Environment Variables (.env — git-ignored, never commit)
```
GROQ_API_KEY=your_groq_key_here
CURRICULLM_API_KEY=your_curricullm_key_here
PORT=8080
```

---

## How to Run

```bash
# In cmd.exe (not PowerShell) — starts both frontend and backend
npx pnpm run dev
```

Then open http://localhost:5173

See HOW-TO-RUN.md for full details.

---

## CurricuLLM API Integration

```typescript
import OpenAI from "openai";
const curricullm = new OpenAI({
  apiKey: process.env.CURRICULLM_API_KEY,
  baseURL: "https://api.curricullm.com/v1",
});
// model: "CurricuLLM-AU"
```

Key fact: CurricuLLM scores 89% on curriculum knowledge benchmarks. GPT/Gemini/Claude score below 41%.

---

## Demo Scenario (primary — use this for all testing)

**Persona:** Sarah Jin, Year 9 History teacher, Parramatta (postcode 2150), Western Sydney.

**Search:** Year 9 · NSW · History · "Rights and Freedoms"

This hits the `year9-nsw-history-rights` demo scenario — instant, hardcoded, no API keys needed.

**What the demo shows:**
1. Parallel search pipeline animation (CurricuLLM → Trusted Sources → Merging)
2. 3 resources: AIATSIS, National Museum of Australia, Amnesty International
3. Trust Scorecard on each resource (Tier A + B + C)
4. First Nations banner — "Teaching on Darug Country · Parramatta"
5. Local Lens tip — connecting 1967 Referendum to Burramattagal people and Darug Custodian Aboriginal Corporation
6. CurricuLLM vs Generic AI comparison — open by default, shows wrong AC v8 codes from generic AI
7. "Adapt for class →" → 60-min lesson plan with Parramatta-specific local example

---

## The 6 Demo Scenarios (hardcoded, no API key needed)

| Key | Triggers on |
|---|---|
| `year9-nsw-science-climate` | Year 9, NSW, Science, Climate Change |
| `year9-nsw-maths-algebra` | Year 9, NSW, Mathematics, Algebra |
| `year8-vic-english-romeo` | Year 8, VIC, English, Romeo and Juliet |
| `year9-nsw-history-rights` | Year 9–10, NSW, History, Rights and Freedoms ← **main demo** |
| `year10-qld-history-rights` | Year 10, QLD, History, Rights and Freedoms |
| `year7-nsw-geography-ecosystems` | Year 7, NSW, Geography, Ecosystems |

---

## Trust Scorecard — 3 Tiers

Every resource gets a scorecard from `enrichWithTrust()` in `resources.ts`:

- **Tier A** — Deterministic. Looks up `source` in `trustedSources.ts`. Scores: tier(40) + https(15) + author(20) + licence(15) + established(10)
- **Tier B** — Curriculum alignment. From CurricuLLM/demo: strength (strong/moderate/weak/none), AC v9 outcome codes, alignment score
- **Tier C** — AI flags. Geographic, cultural, currency — severity low/medium/high
- **Overall** = `(Tier A score × 0.3) + (alignment score × 0.5)`

---

## Key Differentiators

1. **Not a chatbot** — Teachers search and grab, not chat
2. **CurricuLLM** — 89% vs 41% accuracy, used as curriculum brain
3. **Local Lens** — Connects resources to First Nations Country, local orgs, landmarks by postcode
4. **Trust Scorecard** — Multi-dimensional, transparent (not a single opaque number)
5. **Living Context Feed** — Real-time BOM weather + Groq-generated teaching opportunities

---

## Coding Conventions

- TypeScript strict mode throughout
- Tailwind CSS for all styling — no custom CSS files
- All API keys in `.env`, accessed via `process.env`
- Demo scenarios checked first in every route before calling AI
- Dynamic fallbacks — never return hardcoded wrong-topic content
- `enrichWithTrust()` applied to all resource responses

---

## Important Notes

- **Challenge setter Dan Hart is CurricuLLM's founder** — show sophisticated use of his API
- **Judges include:** Danny Liu (Uni of Sydney), Xiwei Xu (CSIRO), Jinan Zou (AIML), Cambridge team
- **All 3 deliverables required:** Working prototype, pitch deck, 2-3 min video
- **9 other teams** competing on same challenge — differentiation matters
- **The demo postcode is 2150 (Parramatta)** — rich Darug Country data included
- **App name is TeachSmart** — not LocalLens (old name, ignore any references to it)
- See TEAM-PITCH-GUIDE.md for pitch deck content, diagrams, and Q&A prep
