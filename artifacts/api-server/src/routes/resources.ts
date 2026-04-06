import { Router, type IRouter } from "express";
import { GetResourcesBody, GetRecentResourcesResponse, GetDashboardStatsResponse } from "@workspace/api-zod";
import { anthropic } from "@workspace/integrations-anthropic-ai";

const router: IRouter = Router();
const TIMEOUT_MS = 8000;

const MOCK_RESOURCES = {
  resources: [
    {
      id: "csiro-climate-1",
      title: "Australia's Changing Climate",
      source: "CSIRO",
      type: "Lesson Plan",
      description: "A comprehensive resource exploring how Australia's climate is changing, with data-driven activities and case studies relevant to Australian students.",
      alignmentScore: 96,
      safetyRating: "verified",
      biasFlag: "low",
      localContextTags: ["Australian Data", "CSIRO Research", "Bureau of Meteorology"],
      outcomeIds: ["AC9S9U05", "AC9S9U06", "AC9S9U07"],
    },
    {
      id: "abc-climate-2",
      title: "Climate Science in Your Backyard",
      source: "ABC Education",
      type: "Worksheet",
      description: "Interactive activities and video resources that connect climate science to students' local environments across Australia.",
      alignmentScore: 88,
      safetyRating: "verified",
      biasFlag: "low",
      localContextTags: ["Local Context", "ABC Education", "Community Science"],
      outcomeIds: ["AC9S9U05", "AC9S9U07"],
    },
    {
      id: "bom-explorer-3",
      title: "Climate Data Explorer",
      source: "Bureau of Meteorology",
      type: "Assessment",
      description: "Interactive data exploration tool using real Bureau of Meteorology climate datasets, ideal for scientific inquiry activities.",
      alignmentScore: 82,
      safetyRating: "verified",
      biasFlag: "low",
      localContextTags: ["Official Government Data", "Real-time Data", "Scientific Inquiry"],
      outcomeIds: ["AC9S9U06", "AC9S9U07"],
    },
  ],
  usedFallback: true,
};

const MOCK_RECENT_RESOURCES = [
  {
    id: "csiro-climate-1",
    title: "Australia's Changing Climate",
    subject: "Science",
    yearLevel: "Year 9",
    topic: "Climate Change",
    alignmentScore: 96,
    searchedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: "abc-climate-2",
    title: "Pythagoras in the Real World",
    subject: "Mathematics",
    yearLevel: "Year 8",
    topic: "Geometry",
    alignmentScore: 91,
    searchedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: "bom-explorer-3",
    title: "Federation and Australian Democracy",
    subject: "History",
    yearLevel: "Year 10",
    topic: "Australian History",
    alignmentScore: 87,
    searchedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
];

router.post("/resources", async (req, res): Promise<void> => {
  const parsed = GetResourcesBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { subject, yearLevel, topic, state, alignmentResult } = parsed.data;

  const outcomesText = alignmentResult.outcomes
    .map((o) => `${o.id}: ${o.description}`)
    .join("\n");

  const prompt = `You are an Australian curriculum resource expert. Find 3 real, existing, publicly accessible Australian educational resources for ${yearLevel} ${subject} students studying "${topic}" in ${state}.

Relevant curriculum outcomes:
${outcomesText}

Only suggest resources from trusted Australian sources like CSIRO, ABC Education, Bureau of Meteorology, Khan Academy Australia, Scootle, state education departments, or universities. These must be real, existing resources.

Return ONLY valid JSON, no markdown:
{
  "resources": [{
    "id": string (slug of title),
    "title": string,
    "source": string,
    "type": string (one of: Lesson Plan, Worksheet, Assessment, Interactive, Video),
    "description": string (2-3 sentences),
    "alignmentScore": number between 70-100,
    "safetyRating": "verified" or "unverified",
    "biasFlag": "low" or "flagged",
    "localContextTags": string[] (2-4 Australian context tags),
    "outcomeIds": string[] (relevant outcome IDs from above)
  }]
}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8192,
      messages: [{ role: "user", content: prompt }],
    });

    clearTimeout(timeout);

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const result = JSON.parse(cleaned);

    res.json({ ...result, usedFallback: false });
  } catch (err) {
    clearTimeout(timeout);
    req.log.warn({ err }, "Claude resources call failed, using fallback");
    res.json(MOCK_RESOURCES);
  }
});

router.get("/resources/recent", async (_req, res): Promise<void> => {
  const data = GetRecentResourcesResponse.parse(MOCK_RECENT_RESOURCES);
  res.json(data);
});

router.get("/dashboard/stats", async (_req, res): Promise<void> => {
  const data = GetDashboardStatsResponse.parse({
    totalSearches: 47,
    resourcesGenerated: 23,
    averageAlignmentScore: 89,
    topSubject: "Science",
  });
  res.json(data);
});

export default router;
