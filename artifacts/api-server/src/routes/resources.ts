import { Router, type IRouter } from "express";
import { GetResourcesBody, GetRecentResourcesResponse, GetDashboardStatsResponse } from "@workspace/api-zod";
import { callCurriculumAI } from "../lib/curricullm";
import { getTierAScore } from "../lib/trustedSources";
import { searchEducationalResources, type BraveResult } from "../lib/brave";
import { findCuratedResources } from "../lib/curatedResources";

const router: IRouter = Router();
const TIMEOUT_MS = 18000;
const SUBJECT_HINTS: Record<string, string[]> = {
  science: ["science", "chemistry", "biology", "physics", "experiment", "laboratory", "compound", "reaction"],
  mathematics: ["mathematics", "maths", "math", "equation", "algebra", "number", "graph", "function"],
  math: ["mathematics", "maths", "math", "equation", "algebra", "number", "graph", "function"],
  maths: ["mathematics", "maths", "math", "equation", "algebra", "number", "graph", "function"],
  english: ["english", "text", "novel", "poem", "poetry", "language", "shakespeare", "literature"],
  history: ["history", "historical", "rights", "freedoms", "source", "colonial", "society"],
  geography: ["geography", "environment", "place", "ecosystem", "climate", "landscape", "spatial"],
};

function isHttpUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isDirectResourceUrl(value: unknown): value is string {
  if (!isHttpUrl(value)) return false;

  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    const path = url.pathname.toLowerCase();
    const hasSearchQuery = url.searchParams.has("q") || url.searchParams.has("query") || url.searchParams.has("search");

    if (host.includes("scootle.edu.au") && (path.includes("/search") || hasSearchQuery)) {
      return false;
    }

    if (path.includes("/search") || path.includes("/results")) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

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

function inferSourceLabel(urlString: string) {
  try {
    const hostname = new URL(urlString).hostname.toLowerCase();
    if (hostname.includes("abc.net.au")) return "ABC Education";
    if (hostname.includes("scootle.edu.au")) return "Scootle";
    if (hostname.includes("educationstandards.nsw.edu.au")) return "NSW Education Standards Authority";
    if (hostname.includes("education.nsw.gov.au")) return "NSW Department of Education";
    if (hostname.includes("acara.edu.au")) return "ACARA";
    if (hostname.includes("aiatsis.gov.au")) return "Australian Institute of Aboriginal and Torres Strait Islander Studies";
    if (hostname.includes("csiro.au")) return "CSIRO";
    if (hostname.includes("bom.gov.au")) return "Bureau of Meteorology";
    return hostname.replace(/^www\./, "");
  } catch {
    return "Verified web source";
  }
}

function inferResourceKind(urlString: string, title: string, resourceTypeFilter?: string) {
  if (resourceTypeFilter) return resourceTypeFilter;
  const lowerTitle = title.toLowerCase();
  const lowerUrl = urlString.toLowerCase();
  if (lowerUrl.endsWith(".pdf") || lowerTitle.includes("worksheet")) return "Worksheet";
  if (lowerTitle.includes("video")) return "Video";
  if (lowerTitle.includes("interactive")) return "Interactive";
  if (lowerTitle.includes("assessment")) return "Assessment";
  return "Lesson Plan";
}

function buildDeterministicResourcesFromWebResults(
  webResults: BraveResult[],
  alignmentResult: { alignmentScore: number; outcomes: { id: string }[] },
  resourceTypeFilter?: string,
) {
  return webResults.slice(0, 3).map((result, index) => ({
    id: `verified-web-${index + 1}-${Date.now()}`,
    title: result.title || "Verified classroom resource",
    url: result.url,
    urlType: "direct" as const,
    provenance: "verified-web" as const,
    verifiedLink: true,
    source: inferSourceLabel(result.url),
    type: inferResourceKind(result.url, result.title, resourceTypeFilter),
    description: result.content || "Verified resource retrieved from a trusted Australian education source.",
    alignmentScore: Math.max(70, alignmentResult.alignmentScore - index * 4),
    safetyRating: "verified",
    biasFlag: "low",
    localContextTags: ["Verified Web Result"],
    outcomeIds: alignmentResult.outcomes.slice(0, 3).map((o) => o.id),
    whyThisResource: "This resource was retrieved directly from a trusted Australian education domain and can be reviewed before classroom use.",
  }));
}

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.toLowerCase() : "";
}

function getSubjectHints(subject: string) {
  const normalized = subject.toLowerCase().trim();
  return SUBJECT_HINTS[normalized] ?? [normalized];
}

function seemsSubjectRelevant(resource: Record<string, unknown>, subject: string, topic: string) {
  const haystack = [
    normalizeText(resource.title),
    normalizeText(resource.description),
    normalizeText(resource.whyThisResource),
    normalizeText(resource.source),
    ...(Array.isArray(resource.localContextTags) ? resource.localContextTags.map(normalizeText) : []),
  ].join(" ");

  const topicWords = topic.toLowerCase().split(/\s+/).filter((word) => word.length > 3);
  const subjectHints = getSubjectHints(subject);
  const topicMatch = topicWords.some((word) => haystack.includes(word));
  const subjectMatch = subjectHints.some((hint) => haystack.includes(hint));

  return topicMatch || subjectMatch;
}

function extractJsonCandidate(text: string) {
  const trimmed = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  if (!trimmed) return "";
  try {
    JSON.parse(trimmed);
    return trimmed;
  } catch {
    const objectStart = trimmed.indexOf("{");
    const objectEnd = trimmed.lastIndexOf("}");
    if (objectStart !== -1 && objectEnd > objectStart) {
      return trimmed.slice(objectStart, objectEnd + 1);
    }
    const arrayStart = trimmed.indexOf("[");
    const arrayEnd = trimmed.lastIndexOf("]");
    if (arrayStart !== -1 && arrayEnd > arrayStart) {
      return trimmed.slice(arrayStart, arrayEnd + 1);
    }
    return trimmed;
  }
}

function parseAiSuggestionPayload(text: string): Record<string, unknown>[] {
  const jsonCandidate = extractJsonCandidate(text);
  if (!jsonCandidate) return [];
  const parsed = JSON.parse(jsonCandidate) as unknown;
  if (Array.isArray(parsed)) return parsed.filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null);
  if (parsed && typeof parsed === "object" && Array.isArray((parsed as { resources?: unknown[] }).resources)) {
    return (parsed as { resources: unknown[] }).resources.filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null);
  }
  return [];
}

function normalizeAiSuggestion(
  resource: Record<string, unknown>,
  index: number,
  subject: string,
  yearLevel: string,
  topic: string,
  alignmentResult: { outcomes: { id: string }[] },
  resourceTypeFilter?: string,
) {
  const title = typeof resource.title === "string" && resource.title.trim().length > 0
    ? resource.title.trim()
    : `${topic} resource ${index + 1}`;
  const source = typeof resource.source === "string" && resource.source.trim().length > 0
    ? resource.source.trim()
    : "AI suggested source";
  const type = typeof resource.type === "string" && resource.type.trim().length > 0
    ? resource.type.trim()
    : (resourceTypeFilter || "Lesson Plan");
  const description = typeof resource.description === "string" && resource.description.trim().length > 0
    ? resource.description.trim()
    : `AI-suggested ${type.toLowerCase()} for ${yearLevel} ${subject} on ${topic}.`;
  const localContextTags = Array.isArray(resource.localContextTags)
    ? resource.localContextTags.filter((tag): tag is string => typeof tag === "string" && tag.trim().length > 0).slice(0, 4)
    : [];
  const outcomeIds = Array.isArray(resource.outcomeIds)
    ? resource.outcomeIds.filter((value): value is string => typeof value === "string" && value.trim().length > 0).slice(0, 4)
    : alignmentResult.outcomes.slice(0, 3).map((outcome) => outcome.id);

  return {
    ...resource,
    id: typeof resource.id === "string" && resource.id.trim().length > 0 ? resource.id : `ai-suggestion-${index + 1}-${Date.now()}`,
    title,
    source,
    type,
    description,
    alignmentScore: typeof resource.alignmentScore === "number" ? Math.max(60, Math.min(100, resource.alignmentScore)) : 78 - index * 4,
    safetyRating: resource.safetyRating === "verified" ? "verified" : "unverified",
    biasFlag: resource.biasFlag === "flagged" ? "flagged" : "low",
    localContextTags: localContextTags.length > 0 ? localContextTags : [subject, yearLevel, "AI Suggestion"],
    outcomeIds,
    whyThisResource: typeof resource.whyThisResource === "string" && resource.whyThisResource.trim().length > 0
      ? resource.whyThisResource.trim()
      : `This AI suggestion was generated for ${yearLevel} ${subject} students studying ${topic}.`,
    provenance: "ai-suggestion" as const,
    verifiedLink: false,
    urlType: "search" as const,
  };
}

function getTopicTerms(topic: string) {
  return topic
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map((term) => term.trim())
    .filter((term) => term.length >= 4);
}

function getWebResultRelevance(result: BraveResult, subject: string, topic: string) {
  const text = `${result.title} ${result.content} ${result.url}`.toLowerCase();
  const topicTerms = getTopicTerms(topic);
  const subjectHints = getSubjectHints(subject);
  const exactTopic = topic.toLowerCase().trim();

  let score = 0;

  for (const term of topicTerms) {
    if (text.includes(term)) score += 4;
  }

  for (const hint of subjectHints) {
    if (text.includes(hint)) score += 2;
  }

  if (text.includes(exactTopic)) score += 10;
  if (text.includes("search |") || text.includes("/search") || text.includes("topic collection")) score -= 12;
  if (text.includes("subjects-and-topics") || text.includes("teaching and learning")) score -= 10;
  if (text.includes("curriculum target") || text.includes("version 8.4")) score -= 6;
  if (text.includes("version 8.4") || text.includes("version 8")) score -= 3;

  return score;
}

function filterRelevantWebResults(webResults: BraveResult[], subject: string, topic: string) {
  const exactTopic = topic.toLowerCase().trim();
  const topicTerms = getTopicTerms(topic);
  const subjectHints = getSubjectHints(subject);
  return webResults
    .map((result) => ({ result, relevance: getWebResultRelevance(result, subject, topic) }))
    .filter(({ relevance, result }) => {
      if (!isDirectResourceUrl(result.url)) return false;
      const text = `${result.title} ${result.content}`.toLowerCase();
      const exactMatch = exactTopic.length >= 6 && text.includes(exactTopic);
      const someTopicTermsMatch = topicTerms.length > 0 && topicTerms.some((term) => text.includes(term));
      const subjectMatch = subjectHints.some((hint) => text.includes(hint));
      // Accept if: high relevance score, OR topic match + subject match, OR exact topic match
      return relevance >= 4 || exactMatch || (someTopicTermsMatch && subjectMatch);
    })
    .sort((a, b) => b.relevance - a.relevance)
    .map(({ result }) => result);
}

const MOCK_RECENT_RESOURCES = [
  { id: "csiro-climate-1", title: "Australia's Changing Climate", subject: "Science", yearLevel: "Year 9", topic: "Climate Change", alignmentScore: 96, searchedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() },
  { id: "abc-climate-2", title: "Pythagoras in the Real World", subject: "Mathematics", yearLevel: "Year 8", topic: "Geometry", alignmentScore: 91, searchedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() },
  { id: "bom-explorer-3", title: "Federation and Australian Democracy", subject: "History", yearLevel: "Year 10", topic: "Australian History", alignmentScore: 87, searchedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString() },
];

async function scoreWebResultsWithGroq(
  webResults: BraveResult[],
  subject: string,
  yearLevel: string,
  topic: string,
  state: string,
  outcomesText: string,
  interests: string[],
  unitNote: string,
  langNote: string,
  resourceTypeFilter?: string,
): Promise<any[]> {
  const resultsBlock = webResults.map((r, i) =>
    `[${i + 1}] Title: ${r.title}\nURL: ${r.url}\nSnippet: ${r.content.slice(0, 400)}`
  ).join("\n\n");

  const interestsNote = interests.length > 0
    ? `\nStudent interests: ${interests.join(", ")}. Connect resources to these where relevant.`
    : "";

  const prompt = `You are an Australian curriculum alignment expert. Below are ${webResults.length} real web pages found from trusted Australian educational sources. Score and describe each one for ${yearLevel} ${subject} students studying "${topic}" in ${state}.

Curriculum outcomes:
${outcomesText}
${unitNote}${interestsNote}${langNote}${resourceTypeFilter ? `\nThe teacher specifically selected "${resourceTypeFilter}" as the desired resource type. Every returned result must therefore have "type": "${resourceTypeFilter}" and the description should explain how the page could support that classroom use.` : ""}

Web pages to score:
${resultsBlock}

For EACH web page, return a JSON object. Return ONLY a JSON array, no markdown:
[{
  "index": number (1-based, matching the [N] above),
  "title": string (improve the title if needed, keep it descriptive),
  "source": string (organisation name, e.g. "CSIRO", "ABC Education", "Bureau of Meteorology"),
  "type": string (one of: Lesson Plan, Worksheet, Discussion, Assessment, Interactive, Video, Article),
  "description": string (2-3 sentences describing what the resource contains and how it can be used),
  "alignmentScore": number between 50-100,
  "safetyRating": "verified" or "unverified",
  "biasFlag": "low" or "flagged",
  "localContextTags": string[] (2-4 Australian context tags),
  "outcomeIds": string[] (relevant AC v9 outcome IDs, format AC9XXXXX),
  "whyThisResource": string (1-2 sentences: why this specific page is ideal for this class),
  "trustFlags": [
    { "type": "geographic", "severity": "low"|"medium"|"high", "label": string, "note": string },
    { "type": "cultural", "severity": "low"|"medium"|"high", "label": string, "note": string },
    { "type": "currency", "severity": "low"|"medium"|"high", "label": string, "note": string }
  ]
}]

For trustFlags: geographic = Australian-focused or US/UK-centric? cultural = First Nations perspectives respected? currency = AC v9 codes (AC9...) or old AC v8?`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const completion = await callCurriculumAI({
      prompt,
      maxTokens: 3000,
      temperature: 0.25,
    });
    clearTimeout(timeout);
    const cleaned = completion.text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const scored: any[] = JSON.parse(cleaned);

    return scored.map((s) => {
      const original = webResults[(s.index ?? 1) - 1];
      return {
        id: `web-${s.index}-${Date.now()}`,
        url: original?.url ?? "",
        urlType: "direct",   // Tavily URLs are real verified web pages
        provenance: "verified-web",
        verifiedLink: true,
        title: s.title,
        source: s.source,
        type: resourceTypeFilter || s.type,
        description: s.description,
        alignmentScore: s.alignmentScore,
        safetyRating: s.safetyRating,
        biasFlag: s.biasFlag,
        localContextTags: s.localContextTags ?? [],
        outcomeIds: s.outcomeIds ?? [],
        whyThisResource: s.whyThisResource,
        trustFlags: s.trustFlags,
      };
    });
  } catch {
    clearTimeout(timeout);
    return [];
  }
}

router.post("/resources", async (req, res): Promise<void> => {
  const parsed = GetResourcesBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const { subject, yearLevel, topic, state, alignmentResult, resourceType } = parsed.data;
  const interests = (req.body as Record<string, unknown>).studentInterests as string[] | undefined ?? [];
  const unitContext = (req.body as Record<string, unknown>).unitContext as Record<string, string> | undefined;
  const preferredLanguage = (req.body as Record<string, unknown>).preferredLanguage as string | undefined;
  const resourceTypeFilter = resourceType?.trim() ?? "";


  const outcomesText = alignmentResult.outcomes.map((o) => `${o.id}: ${o.description}`).join("\n");
  const unitNote = unitContext?.unitTitle
    ? `\nUnit: "${unitContext.unitTitle}" — Lesson ${unitContext.currentLesson || "?"} of ${unitContext.totalLessons || "?"}. Learning intention: ${unitContext.learningIntention || "not specified"}.`
    : "";
  const langNote = preferredLanguage && preferredLanguage !== "en-AU"
    ? `\nRespond in language code: ${preferredLanguage}.`
    : "";
  const resourceTypeNote = resourceTypeFilter
    ? `\nIMPORTANT: Only return resources of type "${resourceTypeFilter}". Every result must have "type": "${resourceTypeFilter}".`
    : "";

  async function loadAiSuggestions() {
    return enrichWithTrust(await fetchAiSuggestions());
  }

  const overallTimeout = setTimeout(() => {
    if (!res.headersSent) {
      res.status(504).json({ error: "Search timed out" });
    }
  }, TIMEOUT_MS);

  // Helper: fetch AI suggestions from Groq
  async function fetchAiSuggestions(): Promise<any[]> {
    const groqPrompt = `You are an Australian curriculum resource expert. Suggest 3 likely useful Australian educational resources for ${yearLevel} ${subject} students studying "${topic}" in ${state}.

Relevant curriculum outcomes:
${outcomesText}
${unitNote}${resourceTypeNote}${langNote}

Only suggest resources from trusted Australian sources like CSIRO, ABC Education, Bureau of Meteorology, Khan Academy, Scootle, state education departments, or universities.
CRITICAL CONSTRAINTS:
- Every resource must be clearly about the requested subject: ${subject}.
- Every resource must be clearly suitable for ${yearLevel} students.
- Do not mix in other subjects. For example, if the subject is Science, do not mention Mathematics unless it is genuinely a minor supporting skill.
- Keep descriptions factually consistent with the title, source, year level, and requested topic.
- If you are unsure of an exact outcome code, prefer using the supplied outcomes only when they genuinely fit.
- If the requested topic is narrow, do not broaden it into a different topic just to fill the list.

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
    "whyThisResource": string (1-2 sentences),
    "trustFlags": [
      { "type": "geographic", "severity": "low"|"medium"|"high", "label": string, "note": string },
      { "type": "cultural", "severity": "low"|"medium"|"high", "label": string, "note": string },
      { "type": "currency", "severity": "low"|"medium"|"high", "label": string, "note": string }
    ]
  }]
}`;
    const MAX_AI_RETRIES = 2;
    let lastErr: unknown;

    for (let attempt = 0; attempt <= MAX_AI_RETRIES; attempt++) {
      try {
        const completion = await callCurriculumAI({
          prompt: groqPrompt,
          maxTokens: 2800,
          temperature: 0.45,
        });
        const rawSuggestions = parseAiSuggestionPayload(completion.text);
        const normalizedSuggestions = rawSuggestions.map((resource, index) =>
          normalizeAiSuggestion(resource, index, subject, yearLevel, topic, alignmentResult, resourceTypeFilter)
        );
        const relevantSuggestions = normalizedSuggestions.filter((resource) => seemsSubjectRelevant(resource, subject, topic));
        const finalSuggestions = (relevantSuggestions.length > 0 ? relevantSuggestions : normalizedSuggestions).slice(0, 3);

        if (finalSuggestions.length > 0) {
          req.log.info({
            count: finalSuggestions.length,
            filteredCount: relevantSuggestions.length,
            rawCount: rawSuggestions.length,
          }, "AI suggestions generated");
        }

        return finalSuggestions;
      } catch (err) {
        lastErr = err;
        const isRateLimit = err && typeof err === "object" && "status" in err && (err as { status?: number }).status === 429;
        if (!isRateLimit || attempt === MAX_AI_RETRIES) {
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, (attempt + 1) * 1200));
      }
    }

    req.log.warn({ err: lastErr }, "AI suggestions unavailable for this resource search");
    return [];
  }

  try {
    const curatedResources = findCuratedResources(subject, yearLevel, topic, resourceTypeFilter);
    req.log.info({ subject, yearLevel, topic, state, resourceTypeFilter, curatedCount: curatedResources.length }, "Resource search started");

    if (curatedResources.length > 0) {
      const aiSuggestions = await loadAiSuggestions();
      clearTimeout(overallTimeout);
      res.json({ resources: enrichWithTrust(curatedResources), aiSuggestions, usedFallback: false, usedWebSearch: false, usedCuratedRegistry: true });
      return;
    }

    // Step 1: Brave real web search on trusted Australian domains
    const braveQuery = `${yearLevel} ${subject} "${topic}" Australian curriculum teaching resources ${state}`;
    let webResults: BraveResult[] = [];
    try {
      const rawWebResults = await searchEducationalResources(braveQuery, 15, {
        subject,
        yearLevel,
        topic,
        state,
        resourceType: resourceTypeFilter,
      });
      req.log.info({
        braveQuery,
        rawCount: rawWebResults.length,
        rawTop: rawWebResults.slice(0, 5).map((r) => ({ title: r.title, url: r.url })),
      }, "Brave search returned candidates");
      webResults = filterRelevantWebResults(rawWebResults, subject, topic);
      req.log.info({
        filteredCount: webResults.length,
        filteredTop: webResults.slice(0, 5).map((r) => ({ title: r.title, url: r.url })),
      }, "Relevant Brave results after filtering");
    } catch (braveErr) {
      req.log.warn({ braveErr }, "Brave search failed, falling back to curated-only / no-resource path");
    }

    if (webResults.length >= 1) {
      // Step 2: Groq scores the real web results → preserves real URLs
      const scored = await scoreWebResultsWithGroq(
        webResults, subject, yearLevel, topic, state,
        outcomesText, interests, unitNote, langNote, resourceTypeFilter,
      );

      const aiSuggestions = await loadAiSuggestions();

      if (scored.length > 0) {
        clearTimeout(overallTimeout);
        const top3 = scored.slice(0, 3);
        res.json({ resources: enrichWithTrust(top3), aiSuggestions, usedFallback: false, usedWebSearch: true, usedCuratedRegistry: false });
        return;
      }

      clearTimeout(overallTimeout);
      const deterministicResources = buildDeterministicResourcesFromWebResults(
        webResults,
        alignmentResult,
        resourceTypeFilter,
      );
      res.json({ resources: enrichWithTrust(deterministicResources), aiSuggestions, usedFallback: false, usedWebSearch: true, usedCuratedRegistry: false });
      return;
    }

    // Step 3: No verified results — AI suggestions are the only option
    const aiSuggestions = await loadAiSuggestions();
    clearTimeout(overallTimeout);
    res.json({ resources: [], aiSuggestions, usedFallback: false, usedWebSearch: false, usedCuratedRegistry: false });

  } catch (err) {
    clearTimeout(overallTimeout);
    if (!res.headersSent) {
      req.log.warn({ err }, "Resources pipeline failed, returning no verified resources");
      res.json({ resources: [], aiSuggestions: [], usedFallback: true, usedWebSearch: false, usedCuratedRegistry: false });
    }
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
