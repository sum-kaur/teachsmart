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

### Features

- **Dashboard**: Recent resources, stats, CTA cards
- **Input Form**: Year Level, State, Subject, Topic, Resource Type, Class Context
- **Results**: Alignment score bar, filter panel, resource cards with trust badges and "Why this?" callouts
- **Lesson Plan**: Activities timeline, NSW local context callout, differentiated questions, teacher notes

### External APIs

- **CurriculLM API**: Curriculum alignment and resource search — set `CURRICULLM_API_KEY` env var
- **Cogniti API**: Lesson plan generation — set `COGNITI_API_KEY` env var
- All API calls fall back to hardcoded mock data if the API fails or times out (8 second timeout)

### Mock Data Fallback

- Alignment: 92% NSW Stage 5 Science, Earth and Space Sciences, outcomes SC5-12ES SC5-13ES SC5-WS1
- 3 resources: CSIRO "Australia's Changing Climate" (96%), ABC Education "Climate Science in Your Backyard" (88%), BOM "Climate Data Explorer" (82%)
- Lesson plan with 5 activities, NSW Black Summer bushfire local context, 5 differentiated questions
