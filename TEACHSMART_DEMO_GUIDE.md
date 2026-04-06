# TeachSmart — Demo & Testing Guide

## What Is TeachSmart?

TeachSmart is an AI-powered curriculum resource finder for Australian teachers (Years 7–12). It uses Anthropic Claude + Australian Curriculum v9 data to generate curriculum-aligned resources, lesson plans, slide decks, and semester overviews — all with real Australian context baked in.

---

## Getting the App Running Locally

### Prerequisites

- Node.js 20+
- pnpm (`npm install -g pnpm`)
- An Anthropic API key (or use Replit, which provisions one automatically)

### Setup Steps

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd <repo-name>

# 2. Install all dependencies
pnpm install

# 3. Set required environment variables
# Create a .env file in the root (or set in your shell):
# SESSION_SECRET=any-random-string-here
# ANTHROPIC_API_KEY=sk-ant-xxxx   (if running outside Replit)

# 4. Start the API server (terminal 1)
pnpm --filter @workspace/api-server run dev

# 5. Start the frontend (terminal 2)
pnpm --filter @workspace/teachsmart run dev

# 6. Open the app
# Frontend: http://localhost:<port shown in terminal>
# API:      http://localhost:8080
```

> **On Replit**: Both servers start automatically. The Anthropic API key is provisioned by the platform — no setup needed.

---

## Architecture Overview

| Layer | Technology | Location |
|-------|-----------|----------|
| Frontend | React + Vite + Tailwind CSS | `artifacts/teachsmart/` |
| Backend | Express 5 + TypeScript | `artifacts/api-server/` |
| AI | Anthropic Claude (`claude-sonnet-4-6`) | via Replit AI Integrations |
| Curriculum Data | Australian Curriculum v9 JSON | `data/*.json` |
| Storage | Browser `localStorage` (no server DB for user data) | — |

---

## Feature Walkthrough & How to Demo Each One

### 1. Dashboard

**What it shows:** Stats summary, 3 quick-action cards, a live local teaching feed ("This Week in Your Area"), and recent resources.

**How to demo:**
- Open the app — the dashboard loads automatically
- Point out the four stats cards (searches, resources, alignment score, top subject)
- The "This Week in Your Area" section loads live BOM weather data and generates teaching opportunities relevant to the postcode

---

### 2. Unit Planner

**What it does:** Lets the teacher tell Claude exactly where they are in a unit — lesson 7 of 18, what was covered last lesson, today's learning intention — so every generated lesson plan is genuinely sequenced, not a generic standalone.

**How to demo:**
1. Click **Unit Planner** in the sidebar
2. Fill in:
   - Unit title: `Earth and Space Sciences — Climate Change`
   - Total lessons: `18`
   - Current lesson: `7`
   - Previous lesson summary: `Introduced the greenhouse effect and the carbon cycle`
   - Learning intention: `Students will analyse BOM temperature data to evaluate evidence for climate change`
3. Click **Continue to Search**
4. Notice the green "Unit Context Active" banner on the search form — all subsequent lesson plans will reference this unit context

---

### 3. Search + Instant Demo Scenarios

**What it does:** Searches for curriculum-aligned Australian resources. For 5 specific combinations, returns pre-built high-quality results instantly (no Claude call, ~400ms) for reliable demos.

**The 5 instant demo scenarios:**

| Year | State | Subject | Topic to type |
|------|-------|---------|--------------|
| Year 9 | NSW | Science | `Climate Change` |
| Year 9 | NSW | Mathematics | `Algebra` |
| Year 8 | VIC | English | `Romeo and Juliet` |
| Year 10 | QLD | History | `Rights and Freedoms` |
| Year 7 | NSW | Geography | `Ecosystems` |

**How to demo (recommended flow):**
1. Click **New Resource** in the sidebar
2. Select: Year 9 / NSW / Science
3. Type topic: `Climate Change`
4. Click **Find Resources**
5. Results appear in ~1 second with 96% alignment score, 3 verified Australian resources, and "Why this resource?" explanations

**Voice input:** Click the microphone icon next to the Topic field and speak the topic — it transcribes in real time.

**Student Interests:** Click "Student Interests (personalise resources)" to expand chips (Sport, Gaming, Technology, etc.). Selecting interests tells Claude to connect curriculum content to things students actually care about.

---

### 4. Results Page

**What to point out:**
- The alignment bar at the top showing the curriculum alignment percentage and strand
- Each resource card shows: source, type, alignment score, "✓ Verified" and "Bias: low" badges
- The teal **"Why this resource?"** callout explains specifically how each resource connects to the curriculum outcomes for this class
- **Save button** — bookmarks any resource to My Library (localStorage)

---

### 5. Lesson Plan Generator

**What it does:** Generates a complete 60-minute differentiated lesson plan adapted from the chosen resource, with an Australian local context example and three tiers of questions.

**How to demo:**
1. From the results page, click **Adapt for class →** on any resource
2. Wait 1–3 seconds (demo scenarios respond instantly)
3. Point out:
   - **Objective** — single clear learning goal
   - **5-stage activities** — Hook → Explore → Analyse → Evaluate → Reflect, with specific timing
   - **Local Australian Context** — a real Australian case study (e.g. Black Summer bushfires, 1967 Referendum)
   - **Differentiated Questions** — Foundation / Core / Extension tiers
   - **Teacher Notes** — editable textarea
   - **Generate Slides →** button at the top right and bottom
   - **Save to Library** button

---

### 6. Presentation Slideshow

**What it does:** Takes the generated lesson plan and creates a 12-slide classroom-ready presentation.

**How to demo:**
1. From the Lesson Plan screen, click **Generate Slides →**
2. Wait 5–15 seconds (Claude generates 12 slides)
3. Navigate slides with the on-screen arrows or keyboard ← →
4. Press **F** (or click Present) for fullscreen
5. Point out the **Teacher Note** bar beneath each slide
6. Click **Export HTML** — downloads a self-contained single-file HTML slideshow (no internet required in the classroom)
7. Click **Export PDF** — opens print dialog for PDF

**Keyboard shortcuts in slideshow:**
| Key | Action |
|-----|--------|
| ← / → | Previous / Next slide |
| F | Fullscreen mode |
| T | Toggle teacher notes |
| Esc | Exit fullscreen / Close |

---

### 7. My Library

**What it does:** Saves resources and lesson plans to the browser's local storage for later retrieval.

**How to demo:**
1. Click **My Library** in the sidebar
2. Show the "Saved Resources" tab — any resources you bookmarked appear here
3. Show the "Lesson Plans" tab — any saved lesson plans appear here
4. Click **Load** on any item to instantly load it back into the results or lesson view

---

### 8. Semester Planner

**What it does:** AI generates a full semester curriculum overview — every week mapped to topics, curriculum outcomes, key activities, and assessment events.

**How to demo:**
1. Click **Semester Plan** in the sidebar
2. Set: Term 2, 10 weeks, Year 9, Science, NSW
3. Optionally pre-fill a few week topics (Week 8: "Exam")
4. Click **Generate Semester Plan with AI**
5. Wait 10–20 seconds — the grid appears colour-coded:
   - 🟢 Green = content weeks
   - 🟡 Amber = quiz weeks
   - 🔴 Red = exam weeks
6. Click any week card → it pre-fills the search form with that week's topic and navigates to New Resource

---

### 9. Multilingual Interface

**What it does:** Switches the interface language and the voice input language for teachers whose first language is not English.

**Supported languages:** English (AU), Mandarin, Arabic, Hindi, Vietnamese, Greek, Italian, Punjabi

**How to demo:**
1. At the bottom of the sidebar, click any flag icon
2. The interface labels switch language immediately
3. Or go to **Settings** → select a language — the voice mic will now transcribe in that language
4. All Claude-generated content (lesson plans, resources) is also generated in the selected language

---

### 10. Settings

**How to demo:**
1. Click **Settings** in the sidebar
2. Show language selection (8 flags with voice codes)
3. Change font size (Small / Medium / Large) — the whole app reflows
4. Toggle **High Contrast** — increases text contrast for accessibility

---

## Running Through the Best Demo Flow (10 minutes)

This sequence shows the most impressive path through the app:

1. **Open app** → point out the dashboard stats and local feed loading
2. **Click Unit Planner** → fill in unit title, lesson 7 of 18, learning intention
3. **Click Continue to Search** → show Unit Context Active banner
4. **Select** Year 9 / NSW / Science / topic: `Climate Change` → click **Find Resources**
5. **Results appear** in ~1 second — show alignment bar (96%), three verified resources, "Why this resource?" callouts
6. **Save** the first resource → show the bookmark changes to "Saved"
7. **Click Adapt for class →** on the CSIRO resource
8. **Lesson plan loads** — walk through Hook, Explore, Analyse, Evaluate, Reflect, Australian context, differentiated questions
9. **Click Generate Slides →** — wait 10s, navigate through the deck in fullscreen (press F)
10. **Export HTML** — show the downloaded standalone file
11. **Sidebar → My Library** — show the saved resource from step 6
12. **Sidebar → Semester Plan** → generate 10-week plan → click Week 5 → shows pre-filled search
13. **Sidebar → Settings** → click Mandarin flag → show interface in Chinese

---

## What's Hardcoded vs. What's Dynamic

| Feature | Dynamic? |
|---------|----------|
| Alignment scores + outcomes | ✅ Claude AI |
| Resource recommendations | ✅ Claude AI |
| Lesson plans | ✅ Claude AI |
| Slide decks | ✅ Claude AI |
| Semester plans | ✅ Claude AI |
| "This Week in Your Area" feed | ✅ Live BOM + Claude |
| 5 demo scenarios | ⚡ Pre-written (instant, reliable for demos) |
| Dashboard stats (47, 89%) | 🔒 Hardcoded placeholder |
| Recent resources on dashboard | 🔒 Hardcoded placeholder |
| My Library | 💾 Browser localStorage only |

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| App shows blank page | Check both server terminals are running; hard-refresh browser |
| "Using template data" badge appears | Claude API timed out (10s) — the app fell back to mock data gracefully; retry |
| Slides generation is slow | Normal — Claude generates 12 slides with 8192 tokens, allow up to 20s |
| Voice mic doesn't appear | Browser doesn't support Web Speech API — only works in Chrome/Edge |
| Library is empty after refresh | Library persists in localStorage — works in the same browser; clears if localStorage is cleared |
| Port conflict on start | Run `fuser -k 8080/tcp` to free the API port |
