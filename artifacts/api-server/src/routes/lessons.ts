import { Router, type IRouter } from "express";
import { GenerateLessonBody } from "@workspace/api-zod";
import { anthropic } from "@workspace/integrations-anthropic-ai";

const router: IRouter = Router();
const TIMEOUT_MS = 8000;

const MOCK_LESSON = {
  objective: "Students investigate climate change evidence using Australian data, developing scientific inquiry skills aligned with Earth and Space Sciences outcomes.",
  duration: "60 minutes",
  activities: [
    {
      label: "Hook (5 min)",
      text: "Show striking before-and-after images of Australian climate events (Great Barrier Reef bleaching, bushfire satellite images). Ask: 'What story do these images tell?'"
    },
    {
      label: "Explore (20 min)",
      text: "Students explore CSIRO's interactive climate data portal, recording temperature trends for their local region over the past 100 years. Complete the data collection worksheet."
    },
    {
      label: "Analyse (15 min)",
      text: "Groups analyse their data and create graphs showing trends. Compare local data with national averages. Identify patterns and anomalies in the dataset."
    },
    {
      label: "Evaluate (15 min)",
      text: "Class discussion: What evidence supports climate change in Australia? Students evaluate the reliability of different data sources and consider limitations of the data."
    },
    {
      label: "Reflect (5 min)",
      text: "Exit ticket: Students write one piece of evidence they found most convincing and one question they still have about Australian climate science."
    }
  ],
  localExample: {
    title: "The 2019–20 Black Summer Bushfires",
    body: "The 2019-20 Black Summer bushfire season burned approximately 18.6 million hectares across Australia — an area larger than Syria. The fires killed or displaced an estimated 3 billion animals. Scientists have linked the unprecedented scale to long-term climate trends, including increased temperatures and prolonged drought across southeastern Australia."
  },
  questions: [
    { q: "Using the CSIRO data, describe two ways Australia's average temperature has changed over the past 50 years.", difficulty: "foundation" },
    { q: "What is the difference between weather and climate? Give one example of each related to Australia.", difficulty: "foundation" },
    { q: "Explain how the data you collected supports or challenges the claim that Australia is experiencing climate change. Use at least two pieces of evidence.", difficulty: "core" },
    { q: "Compare the climate trends in your local region with the national average. What factors might explain any differences?", difficulty: "core" },
    { q: "Critically evaluate the limitations of using historical temperature records as evidence for climate change. What other data types would strengthen or weaken this argument? How might selection bias affect interpretation?", difficulty: "extension" }
  ],
  usedFallback: true,
};

router.post("/lesson", async (req, res): Promise<void> => {
  const parsed = GenerateLessonBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { subject, yearLevel, topic, state, resource, alignmentResult, classContext } = parsed.data;

  const outcomesText = alignmentResult.outcomes
    .map((o) => `${o.id}: ${o.description}`)
    .join("\n");

  const contextText = classContext && classContext.length > 0
    ? classContext.join(", ")
    : "Mixed Ability";

  const prompt = `You are an expert Australian curriculum designer. Create a complete ${yearLevel} ${subject} lesson plan for ${state} students studying "${topic}", adapted from the resource "${resource.title}" by ${resource.source}.

Curriculum outcomes:
${outcomesText}

Class context: ${contextText}

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

Include 5 activities following the structure: Hook (5 min), Explore (20 min), Analyse (15 min), Evaluate (15 min), Reflect (5 min).
Include 5 questions: 2 foundation, 2 core, 1 extension.`;

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
    req.log.warn({ err }, "Claude lesson plan call failed, using fallback");
    res.json(MOCK_LESSON);
  }
});

export default router;
