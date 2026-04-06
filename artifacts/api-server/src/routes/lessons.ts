import { Router, type IRouter } from "express";
import { GenerateLessonBody } from "@workspace/api-zod";
import { groq, GROQ_MODEL } from "../lib/groq";
import { getDemoScenario } from "../lib/demoScenarios";

const router: IRouter = Router();
const TIMEOUT_MS = 10000;

const MOCK_LESSON = {
  objective: "Students investigate climate change evidence using Australian data, developing scientific inquiry skills aligned with Earth and Space Sciences outcomes.",
  duration: "60 minutes",
  activities: [
    { label: "Hook (5 min)", text: "Show striking before-and-after images of Australian climate events (Great Barrier Reef bleaching, bushfire satellite images). Ask: 'What story do these images tell?'" },
    { label: "Explore (20 min)", text: "Students explore CSIRO's interactive climate data portal, recording temperature trends for their local region over the past 100 years. Complete the data collection worksheet." },
    { label: "Analyse (15 min)", text: "Groups analyse their data and create graphs showing trends. Compare local data with national averages. Identify patterns and anomalies in the dataset." },
    { label: "Evaluate (15 min)", text: "Class discussion: What evidence supports climate change in Australia? Students evaluate the reliability of different data sources and consider limitations of the data." },
    { label: "Reflect (5 min)", text: "Exit ticket: Students write one piece of evidence they found most convincing and one question they still have about Australian climate science." },
  ],
  localExample: {
    title: "The 2019–20 Black Summer Bushfires",
    body: "The 2019-20 Black Summer bushfire season burned approximately 18.6 million hectares across Australia. Scientists have linked the unprecedented scale to long-term climate trends, including increased temperatures and prolonged drought across southeastern Australia.",
  },
  questions: [
    { q: "Using the CSIRO data, describe two ways Australia's average temperature has changed over the past 50 years.", difficulty: "foundation" },
    { q: "What is the difference between weather and climate? Give one example of each related to Australia.", difficulty: "foundation" },
    { q: "Explain how the data you collected supports or challenges the claim that Australia is experiencing climate change. Use at least two pieces of evidence.", difficulty: "core" },
    { q: "Compare the climate trends in your local region with the national average. What factors might explain any differences?", difficulty: "core" },
    { q: "Critically evaluate the limitations of using historical temperature records as evidence for climate change. What other data types would strengthen or weaken this argument?", difficulty: "extension" },
  ],
  usedFallback: true,
};

router.post("/lesson", async (req, res): Promise<void> => {
  const parsed = GenerateLessonBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const { subject, yearLevel, topic, state, resource, alignmentResult, classContext } = parsed.data;
  const unitContext = (req.body as Record<string, unknown>).unitContext as Record<string, string> | undefined;
  const preferredLanguage = (req.body as Record<string, unknown>).preferredLanguage as string | undefined;

  const demo = getDemoScenario({ yearLevel, state, subject, topic });
  if (demo) {
    await new Promise(r => setTimeout(r, 600));
    res.json(demo.lesson);
    return;
  }

  const outcomesText = alignmentResult.outcomes.map((o) => `${o.id}: ${o.description}`).join("\n");
  const contextText = classContext && classContext.length > 0 ? classContext.join(", ") : "Mixed Ability";

  const unitNote = unitContext?.unitTitle
    ? `\nUnit: "${unitContext.unitTitle}" — This is Lesson ${unitContext.currentLesson || "?"} of ${unitContext.totalLessons || "?"}. Previous lesson: ${unitContext.prevSummary || "not specified"}. Today's learning intention: ${unitContext.learningIntention || "not specified"}. Success criteria: ${unitContext.successCriteria || "not specified"}. Assessment type at end of unit: ${unitContext.assessmentType || "exam"}. Ensure today's lesson explicitly builds on the previous lesson and positions students for the upcoming ${unitContext.assessmentType || "assessment"}.`
    : "";
  const langNote = preferredLanguage && preferredLanguage !== "en-AU"
    ? `\nGenerate all lesson content, questions, and activities in language code: ${preferredLanguage}.`
    : "";

  const prompt = `You are an expert Australian curriculum designer. Create a complete ${yearLevel} ${subject} lesson plan for ${state} students studying "${topic}", adapted from the resource "${resource.title}" by ${resource.source}.

Curriculum outcomes:
${outcomesText}

Class context: ${contextText}
${unitNote}${langNote}

Always include a localExample field with a specific real Australian example relevant to ${state} students.

Return ONLY valid JSON, no markdown:
{
  "objective": string (1-2 sentences describing what students will achieve),
  "duration": string (e.g. "60 minutes"),
  "activities": [
    { "label": string (e.g. "Hook (5 min)"), "text": string (detailed activity description) }
  ],
  "localExample": { "title": string, "body": string (2-3 sentences about a real Australian example) },
  "questions": [
    { "q": string, "difficulty": "foundation" or "core" or "extension" }
  ]
}

Include 5 activities: Hook (5 min), Explore (20 min), Analyse (15 min), Evaluate (15 min), Reflect (5 min).
Include 5 questions: 2 foundation, 2 core, 1 extension.`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 4000,
      temperature: 0.7,
    });
    clearTimeout(timeout);
    const text = completion.choices[0]?.message?.content ?? "";
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    res.json({ ...JSON.parse(cleaned), usedFallback: false });
  } catch (err) {
    clearTimeout(timeout);
    req.log.warn({ err }, "AI lesson plan call failed, using fallback");
    res.json(MOCK_LESSON);
  }
});

export default router;
