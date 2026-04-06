# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## TeachSmart App

TeachSmart is a curriculum-aligned resource finder for Australian teachers (Years 7–12).

### Architecture

- **Frontend**: React + Vite at `artifacts/teachsmart/` served at `/`
- **Backend**: Express 5 at `artifacts/api-server/` served at `/api`
- **API spec**: `lib/api-spec/openapi.yaml`
- **AI**: Anthropic Claude (`claude-sonnet-4-6`) via Replit AI Integrations (no user API key needed)
- **Curriculum data**: 8 Australian Curriculum v9 JSON files in `data/` (workspace root)

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/healthz` | GET | Health check |
| `/api/alignment` | POST | Score curriculum alignment using Claude + local JSON data. Accepts optional `unitContext` and `preferredLanguage`. 10s timeout. |
| `/api/resources` | POST | Find trusted Australian teaching resources via Claude. Accepts optional `studentInterests`, `unitContext`, `preferredLanguage`. 10s timeout. |
| `/api/lesson` | POST | Generate complete differentiated lesson plan via Claude. Accepts optional `unitContext`, `preferredLanguage`. 10s timeout. |
| `/api/slides` | POST | Generate 12-slide presentation deck from lesson plan via Claude. Accepts `lessonPlan`, `unitContext`, `alignmentResult`, `subject`, `yearLevel`, `topic`, `state`. 20s timeout. |
| `/api/semester-plan` | POST | Generate full semester plan via Claude. Accepts `subject`, `yearLevel`, `state`, `term`, `startDate`, `totalWeeks`, `weekTopics[]`, `preferredLanguage`. 20s timeout. |
| `/api/resources/recent` | GET | Recent resources for dashboard |
| `/api/dashboard/stats` | GET | Dashboard summary statistics |
| `/api/feed` | POST | Live weather + local teaching opportunities |

### Demo Scenarios (Instant Responses)

5 hardcoded demo scenarios in `artifacts/api-server/src/lib/demoScenarios.ts` that return pre-built data (~400ms simulated delay) without calling Claude:

| Year | State | Subject | Topic |
|------|-------|---------|-------|
| Year 9 | NSW | Science | Climate Change |
| Year 9 | NSW | Mathematics | Algebra |
| Year 8 | VIC | English | Romeo and Juliet |
| Year 10 | QLD | History | Rights and Freedoms |
| Year 7 | NSW | Geography | Ecosystems |

Match logic: case-insensitive substring match on topic keywords, year level, state, and subject.

### Features

- **Dashboard**: Stats cards, 3 quick action cards (Unit Planner, Generate Resource, Semester Planner), local feed, recent resources
- **Unit Planner** (`unit-planner` screen): Captures unit title, textbook, total/current lesson, learning intention, success criteria, assessment type. When set, passes this context to all Claude calls so lesson plans are positioned within the unit sequence.
- **Search Form**: Year Level/State/Subject/Topic/Postcode. Voice input (Web Speech API) on topic field. Student Interests (collapsible chips). Class context chips.
- **Results**: Alignment bar, resource cards with "Why this resource?" teal callout, "Save" bookmark button per resource.
- **Lesson Plan**: Activities timeline, local context, differentiated questions, teacher notes. "Generate Slides →" button + "Save to Library" button.
- **Slideshow** (`slideshow` screen): 12-slide interactive presenter. Keyboard navigation (← →), fullscreen mode (F), toggle notes (T). HTML export + print-to-PDF buttons.
- **My Library** (`library` screen): localStorage-based. Two tabs: Saved Resources and Lesson Plans. Delete individual items or clear all.
- **Semester Planner** (`semester` screen): Configure term, start date, weeks, optional per-week topics/assessments. AI generates full plan. Click any week to search resources for that week.
- **Settings** (`settings` screen): 8 UI languages (EN, ZH, AR, HI, VI, EL, IT, PA). Font size (small/medium/large). High contrast toggle.
- **Multilingual**: Sidebar language flags. `preferredLanguage` passed to Claude for content generation in selected language.

### Component Files

```
artifacts/teachsmart/src/
  pages/
    Home.tsx — main orchestrator (state, routing, screen rendering)
  components/
    VoiceMic.tsx — Web Speech API mic button
    Slideshow.tsx — interactive presenter + HTML/PDF export
    UnitPlanner.tsx — unit context capture form
    Library.tsx — localStorage resource + lesson library
    SemesterPlanner.tsx — AI semester overview + week grid
    Settings.tsx — language, font size, high contrast
  lib/
    translations.ts — 8-language T object + useTranslation hook
    library.ts — localStorage CRUD (saveResource, saveLesson, delete, clearAll)
```

### AI Integration

- Uses `@workspace/integrations-anthropic-ai` (Replit-provisioned Anthropic client)
- max_tokens: 600 (alignment), 2000 (resources), 4000 (lessons), 8192 (slides, semester-plan)
- All Claude endpoints check demo scenarios first, then fall back to mock data on failure
- Timeout: 10s (alignment/resources/lessons), 20s (slides/semester-plan)
- New endpoints (slides, semester-plan) not in OpenAPI spec — called with direct `fetch()` from frontend

### Curriculum Data

8 Australian Curriculum v9 JSON data files at `data/*.json`:
- `science.json`, `english.json`, `mathematics.json`, `humanities.json`
- `arts.json`, `hpe.json`, `technologies.json`, `languages.json`

Each file contains content descriptions organized by year level and strand (Years 7–12).

### Living Context Feed

- **Postcode input**: In search form, default `2150` (Parramatta, NSW)
- **Local context database**: `artifacts/api-server/src/lib/localContext.ts`
- **BOM weather**: Live, no API key, 5s timeout with mock fallback
- **Claude feed cards**: 3 location-specific teaching opportunity cards
- **Feed auto-loads** on dashboard mount, refreshes on postcode/state change

### Design System

- Primary: teal `#0d9488`
- Sidebar: dark `#0f172a`
- Fonts: DM Serif Display (headings), DM Sans (body)
- Tailwind CSS with custom sidebar/primary tokens
