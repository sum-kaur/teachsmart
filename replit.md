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

TeachSmart is a curriculum-aligned resource finder for Australian teachers (Years 7-12).

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
| `/api/alignment` | POST | Score curriculum alignment using Claude + local JSON data |
| `/api/resources` | POST | Find trusted Australian teaching resources via Claude |
| `/api/lesson` | POST | Generate a complete differentiated lesson plan via Claude |
| `/api/resources/recent` | GET | Recent resources for dashboard |
| `/api/dashboard/stats` | GET | Dashboard summary statistics |

### Features

- **Dashboard**: Stats cards (total searches, resources generated, avg alignment score, top subject), quick action cards, recent resources table
- **Input Form**: Year Level (7-12), State (all AU states/territories), Subject, Topic, Resource Type, Class Context (Mixed Ability, EAL/D, High Achievers etc.)
- **Results**: Real curriculum alignment panel with AC9 outcome codes, resource cards with trust badges, local context tags, alignment scores
- **Lesson Plan**: Activities timeline (Hook/Explore/Analyse/Evaluate/Reflect), Australian local context callout, differentiated questions (Foundation/Core/Extension), teacher notes textarea

### AI Integration

- Uses `@workspace/integrations-anthropic-ai` (Replit-provisioned Anthropic client)
- All 3 Claude-backed endpoints (`/alignment`, `/resources`, `/lesson`) have mock data fallback on failure
- Timeout: 8 seconds per API call; falls back to mock data on timeout

### Curriculum Data

8 Australian Curriculum v9 JSON data files at `data/*.json`:
- `science.json`, `english.json`, `mathematics.json`, `humanities.json`
- `arts.json`, `hpe.json`, `technologies.json`, `languages.json`

Each file contains content descriptions organized by year level and strand (Years 7-12).

### Mock Data Fallback

All Claude endpoints fall back gracefully to hardcoded mock data if:
- Claude API is unavailable or times out (8s)
- No curriculum data found for the requested subject/year

The fallback includes Science/Climate Change example data with realistic alignment scores and resources.
