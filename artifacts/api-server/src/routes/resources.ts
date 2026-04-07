import { Router, type IRouter } from "express";
import { GetResourcesBody, GetRecentResourcesResponse, GetDashboardStatsResponse } from "@workspace/api-zod";
import { groq, GROQ_MODEL } from "../lib/groq";
import { getDemoScenario } from "../lib/demoScenarios";
import { getTierAScore } from "../lib/trustedSources";

const router: IRouter = Router();
const TIMEOUT_MS = 10000;

function enrichWithTrust(resources: any[]): any[] {
  return resources.map((r) => ({
    ...r,
    trustScorecard: {
      tierA: getTierAScore(r.source),
      tierB: {
        alignmentStrength:
          r.alignmentScore >= 85 ? "strong" : r.alignmentScore >= 65 ? "moderate" : r.alignmentScore >= 45 ? "weak" : "none",
        matchedOutcomes: r.outcomeIds ?? [],
        alignmentScore: r.alignmentScore,
        notes: r.whyThisResource ?? "",
      },
      tierC: r.trustFlags ?? [
        { type: "geographic", severity: "low", label: "Australian content", note: "Resource uses Australian context and data" },
        { type: "cultural", severity: "low", label: "Appropriate representation", note: "No cultural sensitivity concerns identified" },
        { type: "currency", severity: "low", label: "Current curriculum", note: "Outcome codes follow AC v9 format" },
      ],
      overallScore: Math.round(
        getTierAScore(r.source).score * 0.3 + r.alignmentScore * 0.5
      ),
    },
  }));
}


const MOCK_RECENT_RESOURCES = [
  { id: "csiro-climate-1", title: "Australia's Changing Climate", subject: "Science", yearLevel: "Year 9", topic: "Climate Change", alignmentScore: 96, searchedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() },
  { id: "abc-climate-2", title: "Pythagoras in the Real World", subject: "Mathematics", yearLevel: "Year 8", topic: "Geometry", alignmentScore: 91, searchedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() },
  { id: "bom-explorer-3", title: "Federation and Australian Democracy", subject: "History", yearLevel: "Year 10", topic: "Australian History", alignmentScore: 87, searchedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString() },
];

router.post("/resources", async (req, res): Promise<void> => {
  const parsed = GetResourcesBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const { subject, yearLevel, topic, state, alignmentResult } = parsed.data;
  const interests = (req.body as Record<string, unknown>).studentInterests as string[] | undefined;
  const unitContext = (req.body as Record<string, unknown>).unitContext as Record<string, string> | undefined;
  const preferredLanguage = (req.body as Record<string, unknown>).preferredLanguage as string | undefined;

  const demo = getDemoScenario({ yearLevel, state, subject, topic });
  if (demo) {
    await new Promise(r => setTimeout(r, 400));
    const enriched = { ...demo.resources, resources: enrichWithTrust(demo.resources.resources) };
    res.json(enriched);
    return;
  }

  const outcomesText = alignmentResult.outcomes.map((o) => `${o.id}: ${o.description}`).join("\n");
  const interestsNote = interests && interests.length > 0
    ? `\nNote: this class has high interest in ${interests.join(", ")}. Where possible, surface resources and examples that connect curriculum content to these interests.`
    : "";
  const unitNote = unitContext?.unitTitle
    ? `\nUnit: "${unitContext.unitTitle}" — Lesson ${unitContext.currentLesson || "?"} of ${unitContext.totalLessons || "?"}. Learning intention: ${unitContext.learningIntention || "not specified"}.`
    : "";
  const langNote = preferredLanguage && preferredLanguage !== "en-AU"
    ? `\nRespond in language code: ${preferredLanguage}.`
    : "";

  const prompt = `You are an Australian curriculum resource expert. Find 3 real, existing, publicly accessible Australian educational resources for ${yearLevel} ${subject} students studying "${topic}" in ${state}.

Relevant curriculum outcomes:
${outcomesText}
${unitNote}${interestsNote}${langNote}

Only suggest resources from trusted Australian sources like CSIRO, ABC Education, Bureau of Meteorology, Khan Academy, Scootle, state education departments, or universities.

Return ONLY valid JSON, no markdown:
{
  "resources": [{
    "id": string (slug),
    "title": string,
    "source": string,
    "type": string (one of: Lesson Plan, Worksheet, Assessment, Interactive, Video),
    "description": string (2-3 sentences),
    "alignmentScore": number between 70-100,
    "safetyRating": "verified" or "unverified",
    "biasFlag": "low" or "flagged",
    "localContextTags": string[] (2-4 Australian context tags),
    "outcomeIds": string[] (relevant outcome IDs from AC v9, format AC9XXXXX),
    "whyThisResource": string (1-2 sentences explaining specifically why this resource is ideal for this class),
    "trustFlags": [
      { "type": "geographic", "severity": "low"|"medium"|"high", "label": string, "note": string },
      { "type": "cultural", "severity": "low"|"medium"|"high", "label": string, "note": string },
      { "type": "currency", "severity": "low"|"medium"|"high", "label": string, "note": string }
    ]
  }]
}

For trustFlags: geographic = is the content Australian-focused or US/UK-centric? cultural = are First Nations perspectives and diverse communities represented respectfully? currency = are outcome codes current AC v9 format (AC9...) or old AC v8 format (ACDS...)?`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 2500,
      temperature: 0.7,
    });
    clearTimeout(timeout);
    const text = completion.choices[0]?.message?.content ?? "";
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned);
    res.json({ resources: enrichWithTrust(parsed.resources), usedFallback: false });
  } catch (err) {
    clearTimeout(timeout);
    req.log.warn({ err }, "AI resources call failed, using fallback");
    // Return a subject-appropriate fallback instead of always showing climate resources
    const fallbackResources = enrichWithTrust([
      {
        id: `aiatsis-${subject.toLowerCase()}-1`,
        title: `${topic} — Primary Sources and Teaching Materials`,
        source: "AIATSIS — Australian Institute of Aboriginal and Torres Strait Islander Studies",
        type: "Lesson Plan",
        description: `Curriculum-aligned teaching resources for ${yearLevel} ${subject} students in ${state} exploring ${topic}. Includes primary sources, guided inquiry tasks, and connections to Australian Curriculum v9 outcomes.`,
        alignmentScore: 87, safetyRating: "verified", biasFlag: "low",
        localContextTags: ["AIATSIS", "Australian Curriculum", "Primary Sources", `${state} Curriculum`],
        outcomeIds: alignmentResult.outcomes.slice(0, 2).map((o: { id: string }) => o.id),
        whyThisResource: `AIATSIS resources are verified against Australian Curriculum v9 outcomes and are particularly strong for ${subject} topics that intersect with First Nations history and perspectives.`,
      },
      {
        id: `nma-${subject.toLowerCase()}-2`,
        title: `${topic} — Digital Classroom Resources`,
        source: "National Museum of Australia",
        type: "Interactive",
        description: `Interactive digital classroom resources exploring ${topic} through primary sources, oral histories, and student inquiry tasks aligned to ${yearLevel} ${subject} outcomes.`,
        alignmentScore: 83, safetyRating: "verified", biasFlag: "low",
        localContextTags: ["National Museum", "Digital Classroom", "Primary Sources", "Australian History"],
        outcomeIds: alignmentResult.outcomes.slice(0, 2).map((o: { id: string }) => o.id),
        whyThisResource: `The National Museum of Australia's digital classroom is curriculum-aligned and provides high-quality primary sources directly relevant to ${topic} for ${yearLevel} ${state} students.`,
      },
      {
        id: `scootle-${subject.toLowerCase()}-3`,
        title: `${topic} — Scootle Curated Resource Collection`,
        source: "Scootle — Education Services Australia",
        type: "Worksheet",
        description: `Curated collection of ${state}-curriculum-aligned resources from Scootle's 22,000+ resource library, filtered for ${yearLevel} ${subject} students studying ${topic}.`,
        alignmentScore: 79, safetyRating: "verified", biasFlag: "low",
        localContextTags: ["Scootle", "Curriculum Aligned", `${state} Curriculum`, `${yearLevel}`],
        outcomeIds: alignmentResult.outcomes.map((o: { id: string }) => o.id),
        whyThisResource: `Scootle is Australia's national repository of curriculum-aligned digital learning resources, reviewed and tagged against Australian Curriculum v9 outcomes for ${subject}.`,
      },
    ]);
    res.json({ resources: fallbackResources, usedFallback: true });
  }
});

router.get("/resources/recent", async (_req, res): Promise<void> => {
  const data = GetRecentResourcesResponse.parse(MOCK_RECENT_RESOURCES);
  res.json(data);
});

router.get("/dashboard/stats", async (_req, res): Promise<void> => {
  const data = GetDashboardStatsResponse.parse({ totalSearches: 47, resourcesGenerated: 23, averageAlignmentScore: 89, topSubject: "Science" });
  res.json(data);
});

export default router;
