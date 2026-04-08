# TeachSmart — Team Pitch & Presentation Guide

> Read this before building the pitch deck or recording the video.

---

## The One-Liner

> **"TeachSmart is the search engine that knows your classroom, your curriculum, and your community."**

It helps Australian teachers find, evaluate, and adapt teaching resources — aligned to their exact curriculum, their local area, and their students.

---

## The Problem (use this to open the pitch)

Teachers spend **5–10 hours every week** searching for teaching resources.

What they find is:
- ❌ **Generic** — not aligned to their specific curriculum outcomes
- ❌ **Unverified** — no way to know if it's trustworthy or biased
- ❌ **Not local** — resources from the US or UK, disconnected from Australian students
- ❌ **Scattered** — across Google, Scootle, NESA, YouTube, TES, ABC Education

**TeachSmart solves all four problems in one dashboard.**

---

## The Demo Scenario (memorise this — tell this story)

**Sarah Jin** is a Year 9 History teacher at a public school in **Parramatta, Western Sydney** (postcode 2150).

She's teaching **"Rights and Freedoms"** next week. Her class is highly multicultural — many students have family connections to communities affected by rights struggles.

She opens TeachSmart:
1. Her profile is already set — Year 9, History, NSW, Parramatta
2. She searches "Rights and Freedoms"
3. In seconds she sees 3 verified resources, each with a **Trust Scorecard**
4. A **Local Lens tip** appears — connecting the 1967 Referendum to Darug Country and Parramatta specifically
5. She clicks "Adapt for class →" and gets a complete 60-minute lesson plan
6. She sees how **CurricuLLM** (89% accurate) found the RIGHT outcome codes vs a generic AI (41% accurate) that returned outdated superseded codes

**This whole flow takes under 60 seconds.**

---

## How It Works — System Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    TEACHER (Sarah Jin)                      │
│              Year 9 · History · NSW · Parramatta 2150        │
└─────────────────────────┬───────────────────────────────────┘
                          │ Searches "Rights and Freedoms"
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                  TeachSmart Frontend                         │
│                  (React · Vite · Tailwind)                   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │           PARALLEL SEARCH PIPELINE                  │    │
│  │                                                      │    │
│  │  Step 1          Step 2              Step 3          │    │
│  │  ┌──────────┐   ┌──────────────┐   ┌─────────────┐ │    │
│  │  │CurricuLLM│   │  Trusted     │   │  Merge &    │ │    │
│  │  │   API    │   │  Sources     │   │  Rank       │ │    │
│  │  │          │   │  Index       │   │             │ │    │
│  │  │89% AC    │   │ AIATSIS      │   │ Local       │ │    │
│  │  │accuracy  │   │ Nat. Museum  │   │ context     │ │    │
│  │  │          │   │ Scootle      │   │ injection   │ │    │
│  │  │          │   │ ABC Education│   │             │ │    │
│  │  └────┬─────┘   └──────┬───────┘   └──────┬──────┘ │    │
│  │       │                │                   │        │    │
│  └───────┼────────────────┼───────────────────┼────────┘    │
│          │                │                   │             │
└──────────┼────────────────┼───────────────────┼─────────────┘
           │                │                   │
           ▼                ▼                   ▼
┌─────────────────────────────────────────────────────────────┐
│                    API SERVER (Express)                      │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  ALIGNMENT   │  │  RESOURCES   │  │   TRUST ENGINE   │  │
│  │  /api/       │  │  /api/       │  │                  │  │
│  │  alignment   │  │  resources   │  │  Tier A: Source  │  │
│  │              │  │              │  │  Tier B: Curricu │  │
│  │  CurricuLLM  │  │  Groq AI     │  │  Tier C: AI Flags│  │
│  │  → Groq      │  │  → Fallback  │  │                  │  │
│  │  (fallback)  │  │              │  │  30+ AU sources  │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  LESSON PLAN │  │  LOCAL FEED  │  │  AI COMPARISON   │  │
│  │  /api/lesson │  │  /api/feed   │  │  /api/compare    │  │
│  │              │  │              │  │                  │  │
│  │  Groq AI     │  │  BOM weather │  │  Shows generic   │  │
│  │  60-min plan │  │  + Groq feed │  │  AI vs           │  │
│  │  activities  │  │  items       │  │  CurricuLLM      │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
           │                │                   │
           ▼                ▼                   ▼
┌─────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                         │
│                                                              │
│  ┌─────────────────┐    ┌──────────────┐    ┌────────────┐  │
│  │  CurricuLLM API │    │  Groq API    │    │    BOM     │  │
│  │  curricullm.com │    │  LLaMA3-70b  │    │  Weather   │  │
│  │                 │    │              │    │  (Free API)│  │
│  │  Curriculum-    │    │  General AI  │    │            │  │
│  │  trained AI     │    │  Free tier   │    │  Live data │  │
│  │  AU Curriculum  │    │              │    │            │  │
│  │  v9 specialist  │    │              │    │            │  │
│  └─────────────────┘    └──────────────┘    └────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## The 5 Key Features — Explained Simply

### Feature 1: Smart Search with Parallel Pipeline
When Sarah searches, TeachSmart runs **3 things at the same time** (not one after another like Google):
- Asks CurricuLLM to find the exact AC v9 curriculum outcome codes
- Searches its database of 30+ trusted Australian sources
- Injects Sarah's local context (Parramatta, Darug Country)

**Why this matters:** Faster results AND more accurate than any single search.

---

### Feature 2: Trust Scorecard (3 Tiers)

Every resource gets a **transparent scorecard** — not just a single opaque number.

```
┌─────────────────────────────────────────────────────────┐
│  TRUST SCORECARD — AIATSIS Resource                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  TIER A — Source Credibility (no AI — fully verifiable) │
│  ┌────────────────────────────────────────────────┐     │
│  │  🏛 Tier 1 — Government/Peak Body Source       │     │
│  │  ✓ HTTPS secure    ✓ Author attributed         │     │
│  │  ✓ Licence: CC BY  ✓ Established: 1964         │     │
│  │                              Score: 95/100     │     │
│  └────────────────────────────────────────────────┘     │
│                                                         │
│  TIER B — Curriculum Alignment (CurricuLLM-powered)     │
│  ┌────────────────────────────────────────────────┐     │
│  │  STRONG alignment  ████████████████░  97%      │     │
│  │  AC9HS9K04  AC9HS9K05  AC9HS9S04               │     │
│  │  "Verified against AC v9 outcomes"             │     │
│  └────────────────────────────────────────────────┘     │
│                                                         │
│  TIER C — AI Flags (for teacher review)                 │
│  ┌────────────────────────────────────────────────┐     │
│  │  ✓ Geographic: Australian content              │     │
│  │  ✓ Cultural: First Nations voices included     │     │
│  │  ✓ Currency: AC v9 format (not outdated v8)    │     │
│  └────────────────────────────────────────────────┘     │
│                                                         │
│  OVERALL SCORE: 78/100                                  │
└─────────────────────────────────────────────────────────┘
```

**Why this matters for the pitch:** No other tool in Australia does this. Most just show a Google-style list with no quality information. We show *why* a resource is trustworthy — and flag when it isn't.

---

### Feature 3: Local Lens (The Key Differentiator)

When a resource is nationally good but not locally relevant, TeachSmart suggests **specific local adaptations**.

```
┌─────────────────────────────────────────────────────────┐
│  📍 LOCAL LENS  ·  Parramatta                           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  "These resources cover national rights history —       │
│  but the story runs through your classroom door.        │
│                                                         │
│  Parramatta is on Darug Country, home of the            │
│  Burramattagal people. The Darug Custodian              │
│  Aboriginal Corporation offers school visits and        │
│  cultural learning programs.                            │
│                                                         │
│  Pair the 1967 Referendum materials with local          │
│  oral histories to make this history personal           │
│  for your students."                                    │
│                                                         │
│  → Local source: Darug Custodian Aboriginal Corporation │
└─────────────────────────────────────────────────────────┘
```

**Why this matters:** No other product does this. Google doesn't know you're in Parramatta. ChatGPT doesn't know about the Burramattagal people or local organisations. TeachSmart does.

---

### Feature 4: CurricuLLM vs Generic AI Comparison

This is our secret weapon for the pitch. **Dan Hart (who set this challenge) is CurricuLLM's founder.**

```
┌─────────────────────────────────────────────────────────┐
│  ⚡ WHY CURRICULLM VS GENERIC AI?                       │
├───────────────────────┬─────────────────────────────────┤
│  TeachSmart           │  Generic AI (ChatGPT etc.)      │
│  CurricuLLM-AU        │  No curriculum training          │
│  ✅ 89% accuracy      │  ❌ 41% accuracy                 │
├───────────────────────┼─────────────────────────────────┤
│  AC9HS9K04 ✓          │  ACDSEH105 ⚠ WRONG              │
│  AC9HS9K05 ✓          │  ACDSEH106 ⚠ Superseded 2022    │
│  AC9HS9S04 ✓          │  ACHHS166  ⚠ Wrong subject area │
├───────────────────────┼─────────────────────────────────┤
│  Current AC v9 codes  │  Old AC v8 codes                │
│  Verified curriculum  │  Could not verify               │
└───────────────────────┴─────────────────────────────────┘
```

**The key talking point:** Generic AI gives teachers *wrong curriculum codes* — ones that were replaced in 2022. A teacher using ChatGPT to plan lessons is citing codes that don't exist anymore. CurricuLLM knows the current Australian Curriculum v9.

---

### Feature 5: Living Context Feed

The dashboard shows "This Week in Your Area" — pulled from real-time data.

```
┌─────────────────────────────────────────────────────────┐
│  📍 This Week in Your Area  ·  Parramatta · 22°C        │
├─────────────────────────────────────────────────────────┤
│  🌿  Parramatta River water quality data                 │
│      "Use as a real-world data set for Year 9..."        │
│      Links to: Earth Science → Water Systems            │
├─────────────────────────────────────────────────────────┤
│  🗺  Darug Country and the Parramatta River              │
│      "65,000+ years of First Nations water management"  │
│      Links to: Cross-curriculum → ATSI Histories        │
├─────────────────────────────────────────────────────────┤
│  🌦  This week's weather as a teaching dataset           │
│      "Use BOM data for statistics and probability"       │
│      Links to: Maths → Data Representation              │
└─────────────────────────────────────────────────────────┘
```

Data sources: **Bureau of Meteorology** (live weather), **Groq AI** (contextual teaching suggestions), **local context database** (postcode → Country/suburb/landmarks)

---

## What's Hardcoded vs What's Live AI

This is important to understand for the Q&A. Judges WILL ask.

| What you see | How it works | Needs internet? |
|---|---|---|
| Rights & Freedoms resources | Hardcoded (hand-researched, polished) | No |
| Lesson plan for Rights & Freedoms | Hardcoded (hand-written, 60 min) | No |
| Trust Scorecard | Tier A: database lookup. Tier B+C: from alignment | No for Tier A |
| Curriculum outcome codes | CurricuLLM API (or hardcoded for demo) | Yes (or no for demo) |
| Local Lens tip (Parramatta) | Logic + hardcoded local context data | No |
| "This Week" feed | BOM weather (live) + Groq AI | Yes |
| Any non-demo search | Groq AI generates live | Yes |
| Lesson plan for other topics | Groq AI generates live | Yes |

**How to answer "is this real AI?":**
> "Yes — for any search outside our pre-built demo scenarios, TeachSmart calls CurricuLLM for curriculum alignment and Groq's LLaMA3-70b model to generate resources and lesson plans live. The demo scenarios are pre-computed and hand-polished to ensure a reliable presentation — which is standard practice for any product demo."

---

## The Tech Stack (for pitch deck slide)

```
Frontend          Backend           AI Models          Data
─────────         ────────          ─────────          ────
React 19          Express 5         CurricuLLM-AU      Australian
Vite 7            TypeScript        (89% AC accuracy)  Curriculum v9
Tailwind CSS      Node.js           ↓                  JSON files
                  pnpm mono-        Groq / LLaMA3-70b  
                  repo              (general fallback)  30+ Trusted
                                    ↓                  AU Sources DB
                                    BOM Weather API     
                                    (free, no key)     Local Context
                                                       by postcode
```

---

## Key Numbers for the Pitch

| Stat | Value | Source |
|---|---|---|
| Teachers' weekly search time | 5–10 hours | Education research |
| CurricuLLM accuracy on AC benchmarks | **89%** | CurricuLLM benchmark data |
| Generic AI (GPT, Gemini, Claude) accuracy | **41%** | CurricuLLM benchmark data |
| Trusted Australian sources in our database | **30+** | Our trustedSources.ts |
| Australian Curriculum v9 outcomes loaded | All 8 learning areas | Our curriculum JSON files |
| Postcodes with rich local context | 5 (expandable) | Our localContext.ts |
| Demo works without internet | **Yes** | Hardcoded demo scenarios |

---

## What Makes Us Different from Every Competitor

| Competitor | What they do | What we do better |
|---|---|---|
| Google | Generic web search | We know Australian curriculum outcomes |
| ChatGPT / Gemini | General AI | We use CurricuLLM (89% vs 41% on AC) |
| Scootle | Resource database | We add Trust Scorecard + Local Lens |
| NESA website | Curriculum info | We search AND adapt AND lesson-plan |
| TES / Teachers Pay Teachers | Resource marketplace | Australian-only, free, curriculum-verified |

**The one thing no competitor does:** Local Lens — automatically connecting national resources to the specific First Nations Country, landmarks, and community organisations near a teacher's school.

---

## Suggested Pitch Structure (2-3 min video / presentation)

1. **The Problem** (20 sec) — "Sarah spends 7 hours a week searching for resources that might not even be curriculum-aligned"
2. **The Demo** (90 sec) — Show the search → Trust Scorecard → Local Lens tip → Adapt for class
3. **The Differentiators** (30 sec) — CurricuLLM comparison, Local Lens, Trust Scorecard
4. **The Vision** (20 sec) — "Every Australian teacher, every school, every postcode — curriculum-aligned, locally grounded, trustworthy resources in seconds"

---

## Q&A Prep — Likely Judge Questions

**Q: Why CurricuLLM and not just ChatGPT?**
> ChatGPT scores 41% on Australian Curriculum benchmarks and regularly returns outcome codes that were superseded when AC v9 replaced v8 in 2022. CurricuLLM scores 89% — it was specifically trained on Australian Curriculum data. For teachers, getting the wrong outcome code isn't just an annoyance — it could affect student assessment and reporting.

**Q: How do you get the local context data?**
> We built a postcode database combining Aboriginal Country/Nation information, local landmarks, and community organisations. For Parramatta, this includes the Darug Custodian Aboriginal Corporation, the Burramattagal people's connection to the Parramatta River, and Parramatta Park. This is the data that powers the Local Lens feature — no other product does this.

**Q: Is this scalable beyond the demo?**
> Yes. The demo scenarios are hand-polished for reliability. For any other search, TeachSmart calls CurricuLLM and Groq live. Adding new postcodes means adding a JSON entry. Adding new trusted sources means adding to our database. The architecture scales.

**Q: Who would use this?**
> Every Australian teacher in every school. The immediate target is NSW public school teachers because that's where the curriculum alignment pain is most acute — NESA requires specific outcome codes in planning documents. But the system supports all 8 Australian states and territories.

---

## Files to Know About

| File | What it is |
|---|---|
| `artifacts/teachsmart/src/pages/Home.tsx` | The entire frontend — one file |
| `artifacts/api-server/src/lib/demoScenarios.ts` | All 6 demo scenarios — hand-written content |
| `artifacts/api-server/src/lib/trustedSources.ts` | 30+ Australian trusted sources database |
| `artifacts/api-server/src/lib/localContext.ts` | Postcode → local context data |
| `artifacts/api-server/src/routes/alignment.ts` | CurricuLLM integration |
| `artifacts/api-server/src/routes/compare.ts` | Generic AI vs CurricuLLM comparison |
| `HOW-IT-WORKS.md` | Deep technical breakdown |
| `.env` | API keys (never share or commit) |
