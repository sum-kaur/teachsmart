import { Router, type IRouter } from "express";
import { groq, GROQ_MODEL } from "../lib/groq";

const router: IRouter = Router();
const TIMEOUT_MS = 20000;

function yearNumber(yearLevel: string) {
  const match = yearLevel.match(/\d+/);
  return match ? Number(match[0]) : 9;
}

function buildFallbackSemester(
  subject: string,
  yearLevel: string,
  state: string,
  term: string | undefined,
  totalWeeks: number,
  weekTopics?: { weekNumber: number; topic?: string; outcomes?: string; assessmentEvent?: string }[],
) {
  const yr = yearNumber(yearLevel);
  const topicPool = [
    `Foundations of ${subject}`,
    `${subject} concepts and vocabulary`,
    `${state} case studies in ${subject}`,
    `Analysing evidence in ${subject}`,
    `Applied ${subject} investigation`,
    `${subject} skills and methods`,
    `Comparing perspectives in ${subject}`,
    `${subject} revision and consolidation`,
  ];

  const overrides = new Map((weekTopics ?? []).map((week) => [week.weekNumber, week]));
  const weeks = Array.from({ length: totalWeeks }, (_, index) => {
    const weekNumber = index + 1;
    const override = overrides.get(weekNumber);
    const defaultAssessmentEvent =
      weekNumber === Math.max(2, Math.ceil(totalWeeks / 2)) ? "quiz" :
      weekNumber === totalWeeks ? "exam" :
      null;
    const assessmentEvent = override?.assessmentEvent || defaultAssessmentEvent;
    const topic = override?.topic?.trim() || `${topicPool[index % topicPool.length]} — Week ${weekNumber}`;
    const outcomes = override?.outcomes
      ? override.outcomes.split(",").map((value) => value.trim()).filter(Boolean)
      : [`AC9${subject.slice(0, 2).toUpperCase()}${Math.max(yr, 7)}-${String(weekNumber).padStart(2, "0")}`];

    return {
      weekNumber,
      dateRange: `Week ${weekNumber}`,
      topic,
      outcomes,
      keyActivities: [
        `Explicit teaching of ${topic.toLowerCase()} concepts`,
        `Guided class activity linked to ${yearLevel} ${subject}`,
        `${assessmentEvent ? "Assessment preparation and review" : "Independent practice and reflection"}`,
      ],
      assessmentEvent,
      resources: [
        `${state} curriculum support materials`,
        `Teacher-selected ${subject} source`,
        `Australian classroom example or case study`,
      ],
    };
  });

  return {
    semesterTitle: `${yearLevel} ${subject} — ${term || "Semester plan"} · ${state}`,
    weeks,
    usedFallback: true,
  };
}

router.post("/semester-plan", async (req, res): Promise<void> => {
  const body = req.body as {
    subject?: string; yearLevel?: string; state?: string;
    term?: string; startDate?: string; endDate?: string; totalWeeks?: number;
    weekTopics?: { weekNumber: number; topic?: string; outcomes?: string; assessmentEvent?: string }[];
    preferredLanguage?: string;
  };

  const { subject, yearLevel, state, term, startDate, totalWeeks = 8, weekTopics, preferredLanguage } = body;

  if (!subject || !yearLevel || !state) {
    res.status(400).json({ error: "subject, yearLevel, and state are required" });
    return;
  }

  const weekOverrides = weekTopics && weekTopics.length > 0
    ? `\nTeacher-specified topics:\n${weekTopics.filter(w => w.topic).map(w => `Week ${w.weekNumber}: ${w.topic}${w.assessmentEvent ? ` [${w.assessmentEvent}]` : ""}`).join("\n")}`
    : "";

  const langNote = preferredLanguage && preferredLanguage !== "en-AU"
    ? `\nRespond in language code: ${preferredLanguage}.`
    : "";

  const prompt = `Create a detailed ${totalWeeks}-week semester plan for ${yearLevel} ${subject} in ${state} covering the Australian Curriculum v9 outcomes.
${term ? `Term: ${term}` : ""}${startDate ? `\nStart date: ${startDate}` : ""}
${weekOverrides}${langNote}

Return ONLY valid JSON, no markdown:
{
  "semesterTitle": string,
  "weeks": [
    {
      "weekNumber": number,
      "dateRange": string,
      "topic": string,
      "outcomes": string[],
      "keyActivities": string[],
      "assessmentEvent": string | null,
      "resources": string[]
    }
  ]
}

Generate exactly ${totalWeeks} weeks. Mix content delivery (green), revision (amber), and assessment (red) weeks appropriately. Each week should have 3-4 keyActivities and 2-3 resources from trusted Australian sources.`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 6000,
      temperature: 0.7,
    });
    clearTimeout(timeout);
    const text = completion.choices[0]?.message?.content ?? "";
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    res.json({ ...JSON.parse(cleaned), usedFallback: false });
  } catch (err) {
    clearTimeout(timeout);
    req.log.warn({ err }, "AI semester plan call failed, using fallback");
    res.json(buildFallbackSemester(subject, yearLevel, state, term, totalWeeks, weekTopics));
  }
});

export default router;
