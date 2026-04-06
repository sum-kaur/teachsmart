import { Router, type IRouter } from "express";
import { GetAlignmentBody } from "@workspace/api-zod";
import { anthropic } from "@workspace/integrations-anthropic-ai";
import { getOutcomesForSubjectAndYear } from "../lib/curriculum";

const router: IRouter = Router();
const TIMEOUT_MS = 8000;

const MOCK_ALIGNMENT = {
  alignmentScore: 92,
  syllabus: "NSW Stage 5 Science",
  strand: "Earth and Space Sciences",
  outcomes: [
    { id: "AC9S9U05", description: "Investigate and explain the evidence for climate change including the role of greenhouse gases, and evaluate the potential impacts on Australian and global environments." },
    { id: "AC9S9U06", description: "Describe how human activities affect the distribution and availability of natural resources including water, minerals and fossil fuels in Australia." },
    { id: "AC9S9U07", description: "Analyse data and information about Australia's changing climate and explain the role of human activity in driving observed changes." },
  ],
  notes: "The topic aligns strongly with Earth and Space Sciences outcomes for Stage 5, particularly around climate systems and environmental change.",
  usedFallback: true,
};

router.post("/alignment", async (req, res): Promise<void> => {
  const parsed = GetAlignmentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { subject, yearLevel, topic, state } = parsed.data;

  const curriculumData = getOutcomesForSubjectAndYear(subject, yearLevel);

  if (!curriculumData || curriculumData.outcomes.length === 0) {
    req.log.warn({ subject, yearLevel }, "No curriculum data found, using fallback");
    res.json(MOCK_ALIGNMENT);
    return;
  }

  const outcomesText = curriculumData.outcomes
    .map((o) => `${o.id}: ${o.description}`)
    .join("\n");

  const prompt = `You are an Australian curriculum expert. Given these real Australian Curriculum v9 outcomes for ${yearLevel} ${subject}:

${outcomesText}

Score how well the topic "${topic}" aligns with these outcomes for students in ${state}. Return ONLY valid JSON in this exact shape, no markdown:
{
  "alignmentScore": number between 0-100,
  "syllabus": "${state} ${subject} ${yearLevel}",
  "strand": string,
  "outcomes": [{ "id": string, "description": string }],
  "notes": string
}

Only include the most relevant 3-5 outcomes in the outcomes array. The strand should be the most relevant strand name.`;

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
    req.log.warn({ err }, "Claude alignment call failed, using fallback");
    res.json(MOCK_ALIGNMENT);
  }
});

export default router;
