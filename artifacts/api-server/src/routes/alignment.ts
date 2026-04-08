import { Router, type IRouter } from "express";
import { GetAlignmentBody } from "@workspace/api-zod";
import { groq, GROQ_MODEL } from "../lib/groq";
import { curricullm, CURRICULLM_MODEL } from "../lib/curricullm";
import { getOutcomesForSubjectAndYear } from "../lib/curriculum";

const router: IRouter = Router();
const TIMEOUT_MS = 10000;

function buildFallbackAlignment(subject: string, yearLevel: string, state: string, topic: string) {
  return {
    alignmentScore: 75,
    syllabus: `${state} ${subject} ${yearLevel}`,
    strand: `${subject} — Core Strand`,
    outcomes: [
      { id: `AC9-${subject.substring(0,2).toUpperCase()}${yearLevel.replace(/\D/g,'')}-01`, description: `Apply knowledge and skills related to ${topic} in the context of ${state} ${subject} ${yearLevel}.` },
      { id: `AC9-${subject.substring(0,2).toUpperCase()}${yearLevel.replace(/\D/g,'')}-02`, description: `Analyse and evaluate information about ${topic} using evidence-based reasoning and Australian curriculum approaches.` },
    ],
    notes: `Alignment estimate for ${topic} in ${state} ${subject} ${yearLevel}. Live AI unavailable — outcome codes are approximate.`,
    usedFallback: true,
    aiProvider: "fallback",
  };
}

async function callWithFallback(prompt: string, maxTokens: number, signal: AbortSignal) {
  // Try CurricuLLM first — 89% curriculum accuracy vs 41% for generic models
  if (process.env.CURRICULLM_API_KEY) {
    try {
      const completion = await curricullm.chat.completions.create({
        model: CURRICULLM_MODEL,
        messages: [{ role: "user", content: prompt }],
        max_tokens: maxTokens,
        temperature: 0.3, // Lower temp for curriculum — we want accuracy, not creativity
      });
      const text = completion.choices[0]?.message?.content ?? "";
      return { text, provider: "CurricuLLM-AU" };
    } catch (err) {
      // CurricuLLM failed (no credits / rate limit) — fall through to Groq
    }
  }

  // Groq fallback
  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [{ role: "user", content: prompt }],
    max_tokens: maxTokens,
    temperature: 0.7,
  });
  const text = completion.choices[0]?.message?.content ?? "";
  return { text, provider: "Groq/LLaMA3" };
}

router.post("/alignment", async (req, res): Promise<void> => {
  const parsed = GetAlignmentBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const { subject, yearLevel, topic, state } = parsed.data;
  const unitContext = (req.body as Record<string, unknown>).unitContext as Record<string, string> | undefined;
  const preferredLanguage = (req.body as Record<string, unknown>).preferredLanguage as string | undefined;

  const curriculumData = getOutcomesForSubjectAndYear(subject, yearLevel);
  if (!curriculumData || curriculumData.outcomes.length === 0) {
    req.log.warn({ subject, yearLevel }, "No curriculum data found, using fallback");
    res.json(buildFallbackAlignment(subject, yearLevel, state, topic));
    return;
  }

  const outcomesText = curriculumData.outcomes.map((o) => `${o.id}: ${o.description}`).join("\n");
  const unitNote = unitContext?.unitTitle
    ? `\nUnit context: "${unitContext.unitTitle}" — Lesson ${unitContext.currentLesson || "?"} of ${unitContext.totalLessons || "?"}. Learning intention: ${unitContext.learningIntention || "not specified"}.`
    : "";
  const langNote = preferredLanguage && preferredLanguage !== "en-AU"
    ? `\nRespond in the language code: ${preferredLanguage}.`
    : "";

  const prompt = `You are an Australian curriculum expert with deep knowledge of Australian Curriculum v9. Given these real AC v9 outcomes for ${yearLevel} ${subject}:

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
    const { text, provider } = await callWithFallback(prompt, 600, controller.signal);
    clearTimeout(timeout);
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    res.json({ ...JSON.parse(cleaned), usedFallback: false, aiProvider: provider });
  } catch (err) {
    clearTimeout(timeout);
    req.log.warn({ err }, "All AI alignment calls failed, using fallback");
    res.json(buildFallbackAlignment(subject, yearLevel, state, topic));
  }
});

export default router;
