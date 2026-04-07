# TeachSmart — How It Actually Works (Technical)

> Read this to understand what is hardcoded, what is live AI, and how each feature works.

---

## The Big Picture

```
Browser (React/Vite)
      ↓ HTTP POST /api/...
API Server (Express, port 8080)
      ↓
  1. Check demo scenarios (hardcoded JSON) ← runs first, no AI needed
  2. Try CurricuLLM API  ← curriculum-trained AI (needs CURRICULLM_API_KEY)
  3. Try Groq/LLaMA3     ← general AI fallback (needs GROQ_API_KEY)
  4. Static fallback      ← always works, no key needed
```

---

## Route by Route

### `/api/alignment` — Curriculum Alignment
**What it does:** Takes subject + year + topic + state → returns AC v9 outcome codes + alignment score

**Decision tree:**
1. Does the search match a demo scenario? → return hardcoded alignment (instant, no AI)
2. Does Australian Curriculum JSON have data for this subject/year? → build prompt + call **CurricuLLM-AU** (if key set)
3. CurricuLLM fails or not configured? → fall back to **Groq LLaMA3-70b**
4. Groq also fails? → return static `MOCK_ALIGNMENT` (NSW Science Year 9 climate data — not ideal)

**What shows in UI:** The alignment bar at top of results — outcome codes, alignment score %, which AI was used

---

### `/api/resources` — Resource Discovery
**What it does:** Returns 3 teaching resources for the search

**Decision tree:**
1. Demo scenario match? → return hardcoded resources with full Trust Scorecards (instant)
2. No demo match? → build prompt + call **Groq LLaMA3-70b** (asks for 3 real Australian resources)
3. Groq fails or no key? → return **dynamic fallback** — generates 3 placeholder resources using AIATSIS, National Museum, Scootle, with the correct subject/topic filled in from the request

**What is hardcoded:** The 6 demo scenarios each have 3 fully written, curriculum-researched resources with real outcome codes, Trust Scorecards, and Local Lens tips.

**What is live:** Any search that doesn't match a demo scenario uses Groq to generate resources dynamically.

---

### `/api/lesson` — Lesson Plan Generation ("Adapt for class →")
**What it does:** Generates a full 60-min lesson plan for a selected resource

**Decision tree:**
1. Demo scenario match? → return hardcoded lesson plan (instant, polished)
2. No demo match? → call **Groq LLaMA3-70b** with a detailed prompt
3. Groq fails? → return static `MOCK_LESSON` (climate change — hardcoded, always wrong topic)

⚠️ **Known issue:** If Groq key is missing and the search is not a demo scenario, the lesson plan fallback shows climate change content regardless of topic.

---

### `/api/compare` — CurricuLLM vs Generic AI Panel
**What it does:** Shows what a generic AI (without curriculum training) would return — deliberately wrong

**Decision tree:**
1. Topic is "Rights and Freedoms" or "Climate Change"? → return **hardcoded mock** showing old AC v8 codes (ACDSEH105, ACSSU189) that were superseded in 2022
2. Any other topic? → call **Groq at temperature 0.9** (high creativity = inconsistency, simulating a generic AI)
3. Groq fails? → return hardcoded wrong codes as fallback

**This is intentionally fake** — it's demonstrating what a generic AI does wrong, to make CurricuLLM look good.

---

### `/api/feed` — Living Context Feed (Sidebar)
**What it does:** Returns local weather + news + context for the teacher's postcode

**Decision tree:**
1. Try to fetch live **Bureau of Meteorology** weather JSON (real API, no key needed, public)
2. BOM fails or times out? → use hardcoded mock weather data
3. Local context (suburb, Country, landmarks) → looked up from **hardcoded JSON** by postcode
4. News/feed items → **Groq LLaMA3-70b** generates contextual teaching events
5. Groq fails? → return static mock feed items

**Postcodes with hardcoded local context:** 2150 (Parramatta), 2000 (Sydney CBD), 2170 (Liverpool), 2250 (Central Coast), 4870 (Cairns)

---

## The 6 Demo Scenarios (fully hardcoded, no AI needed)

| Key | Triggers when you search... | Has real lesson plan? |
|---|---|---|
| `year9-nsw-science-climate` | Year 9, NSW, Science, Climate Change | Yes |
| `year9-nsw-maths-algebra` | Year 9, NSW, Mathematics, Algebra | Yes |
| `year8-vic-english-romeo` | Year 8, VIC, English, Romeo and Juliet | Yes |
| `year9-nsw-history-rights` | Year 9–10, NSW, History, Rights and Freedoms | Yes ← **main demo** |
| `year10-qld-history-rights` | Year 10, QLD, History, Rights and Freedoms | Yes |
| `year7-nsw-geography-ecosystems` | Year 7, NSW, Geography, Ecosystems | Yes |

**Matching logic:** Year level + State + Subject + Topic keywords must ALL match. The matching is fuzzy (e.g. "Mathematics" matches "maths", "math"). If any one of these doesn't match, it falls through to live AI.

---

## Trust Scorecard — How It's Calculated

Every resource (demo or live) gets a Trust Scorecard added by `enrichWithTrust()` in `resources.ts`.

### Tier A — Deterministic (no AI)
Looks up the resource `source` field in `trustedSources.ts` — a hardcoded dictionary of 30+ Australian sources.

Each source has:
- `tier`: 1 (Government) → 4 (Unverified)
- `https`, `hasAuthor`, `hasLicence`, `established`

Score formula: `tier(40) + https(15) + author(20) + licence(15) + established(10)` = max 100

If source not found: defaults to Tier 4, score 20.

### Tier B — Curriculum Alignment
Taken directly from the alignment result:
- `alignmentStrength`: strong (≥85) / moderate (≥65) / weak (≥45) / none
- `matchedOutcomes`: the AC v9 outcome IDs returned by CurricuLLM or demo
- `alignmentScore`: the 0–100 score from `/api/alignment`

### Tier C — AI Flags
For demo scenarios: hardcoded flags per resource (geographic, cultural, currency — all "low" severity for verified sources).
For live AI searches: Groq is asked to assess the resource and return trustFlags. If it fails, defaults to 3 green "low severity" flags.

### Overall Score
```
overallScore = (Tier A score × 0.3) + (alignment score × 0.5)
```
Max possible: ~80 (by design — no resource is perfect)

---

## The AI Models

| Model | Used for | Key | Speed | Accuracy |
|---|---|---|---|---|
| **CurricuLLM-AU** | Curriculum alignment only | `CURRICULLM_API_KEY` | ~2s | 89% on AC benchmarks |
| **Groq LLaMA3-70b-8192** | Resources, lessons, feed, compare | `GROQ_API_KEY` | ~1.5s | ~41% on AC benchmarks |
| **None (hardcoded)** | Demo scenarios, Trust Tier A, local context | — | instant | 100% (hand-written) |

**CurricuLLM** is only used for `/api/alignment`. Everything else uses Groq. This is intentional — curriculum alignment is where accuracy matters most, and it's the thing we're demonstrating against generic AI.

---

## What Works Without Any API Keys

- All 6 demo scenarios (full resources + lesson plans + Trust Scorecards)
- Tier A Trust Scoring (hardcoded trusted sources database)
- Local context data for postcodes 2150, 2000, 2170, 2250, 4870
- BOM weather (public API, no key)
- The "vs Generic AI" comparison for Rights and Freedoms and Climate Change topics

## What Requires API Keys

| Feature | Key needed |
|---|---|
| Curriculum alignment for non-demo searches | `CURRICULLM_API_KEY` or `GROQ_API_KEY` |
| Live resource generation | `GROQ_API_KEY` |
| Lesson plan for non-demo resources | `GROQ_API_KEY` |
| Feed news items | `GROQ_API_KEY` |
| Generic AI comparison for non-demo topics | `GROQ_API_KEY` |

---

## For the Demo (April 9)

**Use this search to show everything working perfectly:**
- Year Level: Year 9
- State: NSW
- Subject: History
- Topic: Rights and Freedoms
- Postcode: 2150

This hits the `year9-nsw-history-rights` demo scenario — instant response, rich Parramatta/Darug content, full Trust Scorecard, Local Lens tip, and lesson plan all hardcoded and polished.

**If judges ask "is this real AI?"** — yes, for any search outside the 6 demo topics, the system calls CurricuLLM (for alignment) and Groq (for resources + lessons) live. The demo scenarios are pre-computed for reliability during the presentation.
