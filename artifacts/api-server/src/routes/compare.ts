import { Router, type IRouter } from "express";
import { groq, GROQ_MODEL } from "../lib/groq";

const router: IRouter = Router();
const TIMEOUT_MS = 8000;

// Mock "what a generic AI would say" — intentionally shows common failure modes:
// wrong outcome codes, old AC v8 format, vague responses
const MOCK_GENERIC_RESPONSES: Record<string, object> = {
  "Rights and Freedoms": {
    outcomes: [
      { id: "ACDSEH105", note: "⚠ Old AC v8 code — superseded in 2022" },
      { id: "ACDSEH106", note: "⚠ Old AC v8 code — superseded in 2022" },
      { id: "ACHHS166", note: "⚠ Wrong subject area (ACHS = History Skills, not Knowledge)" },
    ],
    alignmentScore: 78,
    notes: "This topic relates to civil rights and freedoms in Australian history.",
    warning: "Generic AI used outdated AC v8 outcome codes. These were superseded by AC v9 in 2022.",
  },
  "Climate Change": {
    outcomes: [
      { id: "ACSSU189", note: "⚠ Old AC v8 Science code — superseded" },
      { id: "ACSIS210", note: "⚠ Inquiry skills code, not knowledge — misapplied" },
      { id: "ACSIS208", note: "⚠ Duplicate skills code" },
    ],
    alignmentScore: 71,
    notes: "Climate change is covered in Year 9-10 Science under Earth and Space Sciences.",
    warning: "Generic AI cited superseded AC v8 codes and confused knowledge outcomes with skills outcomes.",
  },
};

router.post("/compare", async (req, res): Promise<void> => {
  const { subject, yearLevel, topic, state } = req.body as Record<string, string>;
  if (!topic) { res.status(400).json({ error: "topic is required" }); return; }

  // Check if we have a pre-built mock for dramatic demo effect
  const mockKey = Object.keys(MOCK_GENERIC_RESPONSES).find(k => topic.toLowerCase().includes(k.toLowerCase()));
  if (mockKey) {
    await new Promise(r => setTimeout(r, 600));
    res.json({ genericAI: MOCK_GENERIC_RESPONSES[mockKey], model: "Generic LLM (simulated)" });
    return;
  }

  // For other topics — ask Groq WITHOUT curriculum context (simulating generic AI)
  const prompt = `What Australian curriculum outcomes does the topic "${topic}" align with for ${yearLevel} ${subject} students in ${state}?

List 3 specific outcome codes and brief descriptions.

Return ONLY valid JSON:
{
  "outcomes": [{ "id": string, "note": string }],
  "alignmentScore": number,
  "notes": string
}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 400,
      temperature: 0.9, // Higher temp to simulate the inconsistency of generic AI
    });
    clearTimeout(timeout);
    const text = completion.choices[0]?.message?.content ?? "";
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    res.json({ genericAI: JSON.parse(cleaned), model: "Generic LLM (no curriculum training)" });
  } catch (err) {
    clearTimeout(timeout);
    res.json({
      genericAI: {
        outcomes: [
          { id: "ACDSEH105", note: "⚠ Old AC v8 code — superseded in 2022" },
          { id: "ACHHS166", note: "⚠ Wrong outcome type" },
        ],
        alignmentScore: 72,
        notes: "Topic seems relevant to this subject area.",
        warning: "Could not verify these outcomes — generic AI has no curriculum training data.",
      },
      model: "Generic LLM (fallback)",
    });
  }
});

export default router;
