# TeachSmart

A curriculum-aligned resource finder for Australian teachers (Years 7–12). TeachSmart helps teachers quickly discover high-quality, syllabus-matched teaching resources and generate differentiated lesson plans tailored to their classroom context.

![TeachSmart Dashboard](https://img.shields.io/badge/TeachSmart-Curriculum%20Resource%20Finder-0d9488?style=for-the-badge)

---

## Features

- **Curriculum Search** — Find resources aligned to Australian state syllabuses (NSW, VIC, QLD, WA, SA, TAS, ACT, NT) across Years 7–12
- **Alignment Scoring** — Every resource is scored for curriculum alignment with specific syllabus outcomes displayed (e.g. SC5-12ES)
- **Trust Badges** — Resources are labelled as Verified, Bias Checked, or Curriculum Aligned
- **Class Context** — Filter and tailor results for Mixed Ability, EAL/D, High Achievers, Learning Support, or Inquiry-Based classes
- **Lesson Plan Generator** — Generate complete lesson plans with activities timeline, differentiated questions (Foundation / Core / Extension), and NSW local context callouts
- **Recent Resources** — Dashboard tracks your search history
- **Mock Data Fallback** — The app works fully without API keys using built-in mock data

---

## Screens

### 1. Dashboard
Overview of recent resources and quick access to search or adapt files.

### 2. Search Form
Select Year Level, State, Subject, and Topic. Choose a resource type (Lesson Plan, Worksheet, Discussion, Assessment) and toggle class context chips for your students.

### 3. Results
Browse curriculum-aligned resources with alignment scores, trust badges, "Why this?" explanations, and Australian local context tags. Click **Adapt for Year 9** to generate a lesson plan.

### 4. Lesson Plan
A complete, structured lesson plan including:
- Activities timeline (Hook, Explore, Analyse, Evaluate, Reflect)
- NSW local context callout
- Differentiated questions by difficulty level
- Editable teacher notes
- Export to PDF and Google Classroom buttons

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- [pnpm](https://pnpm.io/) v8 or higher

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/teachsmart.git
cd teachsmart

# Install dependencies
pnpm install
```

### Running Locally

Start the API server and frontend in separate terminals:

```bash
# Terminal 1 — API server
pnpm --filter @workspace/api-server run dev

# Terminal 2 — Frontend
pnpm --filter @workspace/teachsmart run dev
```

The app will be available at `http://localhost:<PORT>`.

---

## Environment Variables

The app works without any API keys — it uses built-in mock data as a fallback. To connect live external APIs, set the following environment variables:

| Variable | Description |
|---|---|
| `CURRICULLM_API_KEY` | API key for the CurriculLM curriculum alignment service |
| `COGNITI_API_KEY` | API key for the Cogniti lesson plan generation service |

If an API key is not set or the API times out (8-second timeout), the app automatically falls back to mock data so teachers always get a result.

### Setting Environment Variables

Create a `.env` file in the project root (do not commit this file):

```
CURRICULLM_API_KEY=your_curricullm_key_here
COGNITI_API_KEY=your_cogniti_key_here
```

---

## Mock Data

When no API keys are configured, TeachSmart uses the following built-in example:

**Topic:** Climate Change — Year 9 NSW Science

**Alignment:** 92% — NSW Stage 5 Science, Earth and Space Sciences
- Outcomes: SC5-12ES, SC5-13ES, SC5-WS1

**Resources:**
| Resource | Source | Alignment |
|---|---|---|
| Australia's Changing Climate | CSIRO | 96% |
| Climate Science in Your Backyard | ABC Education | 88% |
| Climate Data Explorer | Bureau of Meteorology | 82% |

**Lesson Plan:** 5 activities (Hook 5min → Explore 20min → Analyse 15min → Evaluate 15min → Reflect 5min), with NSW Black Summer bushfire local context and 5 differentiated questions.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, Tailwind CSS, shadcn/ui |
| Backend | Node.js, Express 5 |
| API Contract | OpenAPI 3.1, Orval codegen |
| Type Safety | TypeScript, Zod |
| Fonts | DM Sans, DM Serif Display |

---

## Project Structure

```
teachsmart/
├── artifacts/
│   ├── teachsmart/         # React + Vite frontend
│   │   └── src/
│   │       └── pages/      # App screens (Home.tsx)
│   └── api-server/         # Express API backend
│       └── src/
│           └── routes/     # API route handlers
├── lib/
│   ├── api-spec/           # OpenAPI spec (openapi.yaml)
│   ├── api-client-react/   # Generated React Query hooks
│   └── api-zod/            # Generated Zod validation schemas
└── README.md
```

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/resources/search` | Search for curriculum-aligned resources |
| `GET` | `/api/resources/recent` | Get recently searched resources |
| `POST` | `/api/lessons/generate` | Generate a lesson plan for a resource |
| `GET` | `/api/dashboard/stats` | Get dashboard summary statistics |
| `GET` | `/api/healthz` | Health check |

---

## Supported Subjects

Science, Mathematics, English, History, Geography, Biology, Chemistry, Physics, Economics, Business Studies, Visual Arts, Music, PDHPE, Technology, Languages

## Supported States

NSW, VIC, QLD, WA, SA, TAS, ACT, NT

---

## License

MIT
