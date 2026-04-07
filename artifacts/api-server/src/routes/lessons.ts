import { Router, type IRouter } from "express";
import { GenerateLessonBody } from "@workspace/api-zod";
import { groq, GROQ_MODEL } from "../lib/groq";
import { getDemoScenario } from "../lib/demoScenarios";

const router: IRouter = Router();
const TIMEOUT_MS = 10000;

function buildFallbackLesson(topic: string, subject: string, yearLevel: string, state: string, outcomes: { id: string; description: string }[]) {
  const outcomeIds = outcomes.slice(0, 3).map(o => o.id).join(", ");
  return {
    objective: `Students investigate ${topic} through inquiry-based learning, developing critical thinking and analytical skills aligned with ${state} ${subject} ${yearLevel} outcomes (${outcomeIds}).`,
    duration: "60 minutes",
    activities: [
      { label: "Hook (5 min)", text: `Present students with a real Australian case study or news story related to ${topic}. Ask: 'What do you already know about this? What questions does it raise?'` },
      { label: "Explore (20 min)", text: `Students investigate the key concepts of ${topic} using the provided resource. Complete a guided note-taking worksheet identifying main ideas, key evidence, and Australian examples.` },
      { label: "Analyse (15 min)", text: `In groups, students examine different perspectives on ${topic}. Build a concept map connecting key ideas to the ${state} curriculum outcomes. Discuss: 'What evidence is strongest? What is missing?'` },
      { label: "Evaluate (15 min)", text: `Class discussion: Students evaluate the significance of ${topic} for Australian students today. Each group presents one key finding and one remaining question to the class.` },
      { label: "Reflect (5 min)", text: `Exit ticket: Students write one key thing they learned about ${topic}, one connection to Australian society, and one question they still have.` },
    ],
    localExample: {
      title: `${topic} in the Australian Context`,
      body: `Australia has a unique relationship with ${topic} shaped by its history, geography, and diverse communities. ${state} students have direct connections to this topic through local institutions, communities, and current events that make this curriculum content personally relevant and meaningful.`,
    },
    questions: [
      { q: `Define the key concepts related to ${topic} in your own words.`, difficulty: "foundation" },
      { q: `Identify two ways ${topic} has shaped Australian society or history. Give one specific example of each.`, difficulty: "foundation" },
      { q: `Analyse the evidence from today's resource. How does it support our understanding of ${topic}? Use at least two pieces of evidence in your answer.`, difficulty: "core" },
      { q: `Compare different perspectives on ${topic}. Whose voices are represented in this resource, and whose might be missing? How does this affect our understanding?`, difficulty: "core" },
      { q: `Critically evaluate the significance of ${topic} for contemporary Australia. To what extent have the issues raised been resolved, and what challenges remain?`, difficulty: "extension" },
    ],
    usedFallback: true,
  };
}

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
    res.json(buildFallbackLesson(topic, subject, yearLevel, state, alignmentResult.outcomes));
  }
});

export default router;
