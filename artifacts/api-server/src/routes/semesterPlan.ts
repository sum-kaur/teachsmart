import { Router, type IRouter } from "express";
import { groq, GROQ_MODEL } from "../lib/groq";

const router: IRouter = Router();
const TIMEOUT_MS = 20000;

const MOCK_SEMESTER = {
  semesterTitle: "Year 9 Science — Term 2 2025",
  weeks: [
    { weekNumber: 1, dateRange: "Week 1", topic: "Introduction to Earth Systems", outcomes: ["AC9S9U05"], keyActivities: ["Diagnostic assessment", "Earth systems overview", "BOM data exploration"], assessmentEvent: null, resources: ["CSIRO Education", "BOM Interactive"] },
    { weekNumber: 2, dateRange: "Week 2", topic: "Atmosphere and Greenhouse Gases", outcomes: ["AC9S9U05", "AC9S9U07"], keyActivities: ["Greenhouse effect experiment", "CO₂ data analysis", "Modelling activity"], assessmentEvent: null, resources: ["ABC Education Climate Series", "CSIRO Data Portal"] },
    { weekNumber: 3, dateRange: "Week 3", topic: "Evidence for Climate Change", outcomes: ["AC9S9U05", "AC9S9U07"], keyActivities: ["Ice core data activity", "Temperature record analysis", "Source evaluation"], assessmentEvent: "quiz", resources: ["BOM 100-year temperature records", "Antarctic Division"] },
    { weekNumber: 4, dateRange: "Week 4", topic: "Australian Impacts — Oceans & Reef", outcomes: ["AC9S9U05"], keyActivities: ["Great Barrier Reef case study", "Sea level data", "Video analysis"], assessmentEvent: null, resources: ["GBRMPA Education", "CSIRO Oceans"] },
    { weekNumber: 5, dateRange: "Week 5", topic: "Australian Impacts — Fire & Drought", outcomes: ["AC9S9U06", "AC9S9U07"], keyActivities: ["Black Summer case study", "Murray-Darling data", "Local impact investigation"], assessmentEvent: null, resources: ["AFDRS", "Murray-Darling Basin Authority"] },
    { weekNumber: 6, dateRange: "Week 6", topic: "Human Activity & Resource Use", outcomes: ["AC9S9U06"], keyActivities: ["Carbon footprint calculation", "Resource audit", "Debate preparation"], assessmentEvent: null, resources: ["WWF Footprint Calculator", "DCCEEW"] },
    { weekNumber: 7, dateRange: "Week 7", topic: "Mitigation Strategies & Renewables", outcomes: ["AC9S9U06", "AC9S9U07"], keyActivities: ["Renewable energy audit", "Policy research task", "Expert speaker (if available)"], assessmentEvent: null, resources: ["Clean Energy Council", "AEMO Data Dashboard"] },
    { weekNumber: 8, dateRange: "Week 8", topic: "Revision & Examination Preparation", outcomes: ["AC9S9U05", "AC9S9U06", "AC9S9U07"], keyActivities: ["Concept mapping", "Past paper practice", "Peer teaching"], assessmentEvent: "exam", resources: ["Previous examination papers", "Study notes"] },
  ],
  usedFallback: true,
};

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
    res.json(MOCK_SEMESTER);
  }
});

export default router;
