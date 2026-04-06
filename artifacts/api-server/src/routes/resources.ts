import { Router, type IRouter } from "express";
import { GetResourcesBody, GetRecentResourcesResponse, GetDashboardStatsResponse } from "@workspace/api-zod";
import { groq, GROQ_MODEL } from "../lib/groq";
import { getDemoScenario } from "../lib/demoScenarios";

const router: IRouter = Router();
const TIMEOUT_MS = 10000;

const MOCK_RESOURCES = {
  resources: [
    {
      id: "csiro-climate-1", title: "Australia's Changing Climate", source: "CSIRO", type: "Lesson Plan",
      description: "A comprehensive resource exploring how Australia's climate is changing, with data-driven activities and case studies relevant to Australian students.",
      alignmentScore: 96, safetyRating: "verified", biasFlag: "low",
      localContextTags: ["Australian Data", "CSIRO Research", "Bureau of Meteorology"], outcomeIds: ["AC9S9U05", "AC9S9U06", "AC9S9U07"],
      whyThisResource: "CSIRO's peer-reviewed datasets give students access to the same data used by Australian climate scientists, directly supporting AC9S9U05's requirement to evaluate evidence about Earth's changing systems.",
    },
    {
      id: "abc-climate-2", title: "Climate Science in Your Backyard", source: "ABC Education", type: "Worksheet",
      description: "Interactive activities and video resources that connect climate science to students' local environments across Australia.",
      alignmentScore: 88, safetyRating: "verified", biasFlag: "low",
      localContextTags: ["Local Context", "ABC Education", "Community Science"], outcomeIds: ["AC9S9U05", "AC9S9U07"],
      whyThisResource: "ABC Education contextualises climate change using familiar Australian landscapes and communities, making abstract scientific concepts tangible and personally relevant for Year 9 students.",
    },
    {
      id: "bom-explorer-3", title: "Climate Data Explorer", source: "Bureau of Meteorology", type: "Assessment",
      description: "Interactive data exploration tool using real Bureau of Meteorology climate datasets, ideal for scientific inquiry activities.",
      alignmentScore: 82, safetyRating: "verified", biasFlag: "low",
      localContextTags: ["Official Government Data", "Real-time Data", "Scientific Inquiry"], outcomeIds: ["AC9S9U06", "AC9S9U07"],
      whyThisResource: "Using live BOM data turns this into an authentic scientific inquiry task — students practise the same data analysis skills used by professional meteorologists, satisfying AC9S9U06 and AC9S9U07.",
    },
  ],
  usedFallback: true,
};

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
    res.json(demo.resources);
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
    "outcomeIds": string[] (relevant outcome IDs),
    "whyThisResource": string (1-2 sentences explaining specifically why this resource is ideal for this class)
  }]
}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 2000,
      temperature: 0.7,
    });
    clearTimeout(timeout);
    const text = completion.choices[0]?.message?.content ?? "";
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    res.json({ ...JSON.parse(cleaned), usedFallback: false });
  } catch (err) {
    clearTimeout(timeout);
    req.log.warn({ err }, "AI resources call failed, using fallback");
    res.json(MOCK_RESOURCES);
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
