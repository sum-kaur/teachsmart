import { Router, type IRouter } from "express";
import { GetAlignmentBody } from "@workspace/api-zod";
import { groq, GROQ_MODEL } from "../lib/groq";
import { getOutcomesForSubjectAndYear } from "../lib/curriculum";
import { getDemoScenario } from "../lib/demoScenarios";

const router: IRouter = Router();
const TIMEOUT_MS = 10000;

const MOCK_ALIGNMENT = {
  alignmentScore: 92, syllabus: "NSW Stage 5 Science", strand: "Earth and Space Sciences",
  outcomes: [
    { id: "AC9S9U05", description: "Investigate and explain the evidence for climate change including the role of greenhouse gases." },
    { id: "AC9S9U06", description: "Describe how human activities affect the distribution and availability of natural resources in Australia." },
    { id: "AC9S9U07", description: "Analyse data about Australia's changing climate and explain the role of human activity." },
  ],
  notes: "Strong match with Earth and Space Sciences outcomes for Stage 5.",
  usedFallback: true,
};

router.post("/alignment", async (req, res): Promise<void> => {
  const parsed = GetAlignmentBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const { subject, yearLevel, topic, state } = parsed.data;
  const unitContext = (req.body as Record<string, unknown>).unitContext as Record<string, string> | undefined;
  const preferredLanguage = (req.body as Record<string, unknown>).preferredLanguage as string | undefined;

  const demo = getDemoScenario({ yearLevel, state, subject, topic });
  if (demo) {
    await new Promise(r => setTimeout(r, 400));
    res.json(demo.alignment);
    return;
  }

  const curriculumData = getOutcomesForSubjectAndYear(subject, yearLevel);
  if (!curriculumData || curriculumData.outcomes.length === 0) {
    req.log.warn({ subject, yearLevel }, "No curriculum data found, using fallback");
    res.json(MOCK_ALIGNMENT);
    return;
  }

  const outcomesText = curriculumData.outcomes.map((o) => `${o.id}: ${o.description}`).join("\n");
  const unitNote = unitContext?.unitTitle
    ? `\nUnit context: "${unitContext.unitTitle}" — Lesson ${unitContext.currentLesson || "?"} of ${unitContext.totalLessons || "?"}. Learning intention: ${unitContext.learningIntention || "not specified"}.`
    : "";
  const langNote = preferredLanguage && preferredLanguage !== "en-AU"
    ? `\nRespond in the language code: ${preferredLanguage}.`
    : "";

  const prompt = `You are an Australian curriculum expert. Given these real Australian Curriculum v9 outcomes for ${yearLevel} ${subject}:

${outcomesText}

Score how well the topic "${topic}" aligns with these outcomes for students in ${state}.${unitNote}${langNote}

Return ONLY valid JSON, no markdown:
{
  "alignmentScore": number between 0-100,
  "syllabus": "${state} ${subject} ${yearLevel}",
  "strand": string,
  "outcomes": [{ "id": string, "description": string }],
  "notes": string
}

Only include the most relevant 3-5 outcomes. The strand should be the most relevant strand name.`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 600,
      temperature: 0.7,
    });
    clearTimeout(timeout);
    const text = completion.choices[0]?.message?.content ?? "";
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    res.json({ ...JSON.parse(cleaned), usedFallback: false });
  } catch (err) {
    clearTimeout(timeout);
    req.log.warn({ err }, "AI alignment call failed, using fallback");
    res.json(MOCK_ALIGNMENT);
  }
});

export default router;
