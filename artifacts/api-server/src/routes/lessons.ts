import { Router, type IRouter } from "express";
import { GenerateLessonBody } from "@workspace/api-zod";
import { groq, GROQ_MODEL } from "../lib/groq";

const router: IRouter = Router();
const TIMEOUT_MS = 14000;

// ── Fallbacks ────────────────────────────────────────────────────────────────

function buildFallbackLesson(topic: string, subject: string, yearLevel: string, state: string, outcomes: { id: string; description: string }[]) {
  const o = outcomes[0] ?? { id: "AC9-UNKNOWN", description: `Core ${subject} outcome for ${yearLevel}` };
  return {
    resourceType: "Lesson Plan",
    outcomeCode: o.id,
    outcomeDescription: o.description,
    successCriteria: [
      `Identify and explain the key concepts of ${topic}`,
      `Apply knowledge of ${topic} to an Australian context`,
      `Evaluate evidence and form a reasoned conclusion about ${topic}`,
    ],
    objective: `Students investigate ${topic} through inquiry-based learning, developing critical thinking and analytical skills aligned with ${state} ${subject} ${yearLevel} outcomes.`,
    duration: "60 minutes",
    activities: [
      { label: "Hook (5 min)", text: `Present students with a real Australian case study related to ${topic}. Ask: 'What do you already know? What questions does it raise?'` },
      { label: "Explore (20 min)", text: `Students investigate the key concepts of ${topic} using the provided resource. Complete guided note-taking identifying main ideas and Australian examples.` },
      { label: "Analyse (15 min)", text: `In groups, students examine different perspectives on ${topic}. Build a concept map connecting key ideas to outcomes.` },
      { label: "Evaluate (15 min)", text: `Class discussion: students evaluate the significance of ${topic} for Australians today.` },
      { label: "Reflect (5 min)", text: `Exit ticket: one key learning, one Australian connection, one remaining question.` },
    ],
    localExample: {
      title: `${topic} in the Australian Context`,
      body: `Australia has a unique relationship with ${topic} shaped by its history, geography, and diverse communities.`,
    },
    questions: [
      { q: `Define the key concepts of ${topic} in your own words.`, difficulty: "foundation" },
      { q: `Identify two ways ${topic} has shaped Australian society. Give one specific example.`, difficulty: "foundation" },
      { q: `Analyse evidence from today's resource. How does it support our understanding of ${topic}?`, difficulty: "core" },
      { q: `Compare different perspectives on ${topic}. Whose voices might be missing?`, difficulty: "core" },
      { q: `Critically evaluate the significance of ${topic} for contemporary Australia.`, difficulty: "extension" },
    ],
    usedFallback: true,
  };
}

function buildFallbackWorksheet(topic: string, subject: string, yearLevel: string, outcomes: { id: string; description: string }[]) {
  const o = outcomes[0] ?? { id: "AC9-UNKNOWN", description: `Core ${subject} outcome for ${yearLevel}` };
  return {
    resourceType: "Worksheet",
    outcomeCode: o.id,
    outcomeDescription: o.description,
    successCriteria: [
      `Recall and define the key terms related to ${topic}`,
      `Apply understanding of ${topic} to structured questions`,
      `Evaluate and justify a position on ${topic}`,
    ],
    sections: [
      {
        title: "Knowledge and Understanding",
        instructions: "Answer each question using full sentences.",
        questions: [
          { q: `Define the term '${topic}' in your own words.`, lines: 3, marks: 2 },
          { q: `List two key facts about ${topic}.`, lines: 4, marks: 4 },
        ],
      },
      {
        title: "Application",
        instructions: "Use your knowledge to answer the following questions.",
        questions: [
          { q: `Describe how ${topic} is relevant to Australian students today.`, lines: 5, marks: 5 },
          { q: `Give one real-world example of ${topic} from Australia.`, lines: 4, marks: 3 },
        ],
      },
      {
        title: "Analysis and Evaluation",
        instructions: "Think critically and justify your answers with evidence.",
        questions: [
          { q: `Analyse two different perspectives on ${topic}. Which do you find more convincing, and why?`, lines: 8, marks: 8 },
        ],
      },
    ],
    extensionTask: `Research a recent Australian news story related to ${topic}. Write a 150-word response explaining how it connects to what you have learned.`,
    wordBank: [topic, subject, "evidence", "analysis", "perspective", "outcome"],
    usedFallback: true,
  };
}

function buildFallbackDiscussion(topic: string, subject: string, yearLevel: string, outcomes: { id: string; description: string }[]) {
  const o = outcomes[0] ?? { id: "AC9-UNKNOWN", description: `Core ${subject} outcome for ${yearLevel}` };
  return {
    resourceType: "Discussion",
    outcomeCode: o.id,
    outcomeDescription: o.description,
    successCriteria: [
      `Articulate a clear position on ${topic} using evidence`,
      `Respectfully engage with multiple perspectives on ${topic}`,
      `Reflect on how ${topic} connects to Australian society`,
    ],
    discussionPrompt: `To what extent has ${topic} shaped modern Australia, and what challenges remain?`,
    backgroundContext: `${topic} is a significant issue in Australian society, connecting to history, culture, and contemporary debates.`,
    perspectives: [
      { viewpoint: "Supporter", keyArguments: [`${topic} has brought positive change`, "Evidence supports its value", "It connects to Australian values"] },
      { viewpoint: "Critic", keyArguments: [`${topic} has unresolved challenges`, "Not all Australians benefit equally", "Change is still needed"] },
    ],
    sentenceStarters: ["I believe...", "The evidence suggests...", "A counterargument might be...", "From an Australian perspective..."],
    reflectionQuestions: [`What surprised you most about ${topic}?`, `Whose voice is most important in this debate?`, `What would you want changed?`],
    teacherFacilitationNotes: `Ensure all students have a chance to speak. Monitor for respectful disagreement. Connect discussion to the ${subject} outcomes.`,
    usedFallback: true,
  };
}

function buildFallbackAssessment(topic: string, subject: string, yearLevel: string, outcomes: { id: string; description: string }[]) {
  const o = outcomes[0] ?? { id: "AC9-UNKNOWN", description: `Core ${subject} outcome for ${yearLevel}` };
  return {
    resourceType: "Assessment",
    outcomeCode: o.id,
    outcomeDescription: o.description,
    successCriteria: [
      `Demonstrate knowledge of ${topic} concepts and terminology`,
      `Apply understanding to structured tasks at the appropriate level`,
      `Evaluate and synthesise information about ${topic}`,
    ],
    taskType: "Extended Response",
    duration: "60 minutes",
    studentSections: [
      { section: "Section A: Short Answer", instructions: "Answer all questions using full sentences.", questions: [
        { number: 1, q: `Define the term '${topic}' in your own words.`, marks: 2, lines: 4 },
        { number: 2, q: `List two key facts about ${topic} in an Australian context.`, marks: 4, lines: 5 },
      ]},
      { section: "Section B: Structured Response", instructions: "Answer both questions using specific evidence.", questions: [
        { number: 3, q: `Explain how ${topic} has affected Australian society. Use at least one specific example.`, marks: 5, lines: 8 },
        { number: 4, q: `Describe the role of Australian governments in relation to ${topic}. Refer to at least two actions or policies.`, marks: 6, lines: 10 },
      ]},
      { section: "Section C: Extended Response", instructions: "Write a detailed response. Use evidence to support your argument.", questions: [
        { number: 5, q: `To what extent has ${topic} shaped modern Australia? Evaluate the significance of at least two key events or developments and explain their ongoing impact on Australian society.`, marks: 8, lines: 20 },
      ]},
    ],
    markingCriteria: [
      { criterion: "Knowledge and Understanding", excellent: "Demonstrates thorough, accurate knowledge with specific detail", satisfactory: "Shows adequate knowledge with some accuracy", developing: "Shows limited knowledge with some inaccuracy", marks: 8 },
      { criterion: "Analysis and Evaluation", excellent: "Insightful analysis with well-reasoned evaluation", satisfactory: "Some analysis present but reasoning could be stronger", developing: "Limited analysis; mostly descriptive", marks: 8 },
      { criterion: "Use of Evidence", excellent: "Consistently uses specific evidence to support all claims", satisfactory: "Uses evidence at times but not consistently", developing: "Little evidence used; claims mostly unsupported", marks: 6 },
      { criterion: "Communication", excellent: "Clear, fluent, well-structured response throughout", satisfactory: "Generally clear with some structure", developing: "Unclear or poorly structured", marks: 3 },
    ],
    totalMarks: 25,
    teacherMarkingGuide: `Reward students who use specific evidence from Australian contexts. Accept any well-reasoned position as long as it is supported by evidence.`,
    usedFallback: true,
  };
}

// ── Prompt builders ──────────────────────────────────────────────────────────

function buildLessonPrompt(topic: string, subject: string, yearLevel: string, state: string, outcomesText: string, contextText: string, unitNote: string, langNote: string, resourceTitle: string, resourceSource: string) {
  return `You are an expert Australian curriculum designer. Create a complete ${yearLevel} ${subject} lesson plan for ${state} students studying "${topic}", adapted from "${resourceTitle}" by ${resourceSource}.

Curriculum outcomes:
${outcomesText}

Class context: ${contextText}
${unitNote}${langNote}

Return ONLY valid JSON, no markdown:
{
  "resourceType": "Lesson Plan",
  "outcomeCode": string (first outcome code, e.g. "AC9S9U05"),
  "outcomeDescription": string (full description of that outcome),
  "successCriteria": string[] (exactly 3 items starting with "Students will be able to..."),
  "objective": string,
  "duration": "60 minutes",
  "activities": [
    { "label": string (e.g. "Hook (5 min)"), "text": string }
  ],
  "localExample": { "title": string, "body": string (real Australian example, 2-3 sentences) },
  "questions": [
    { "q": string, "difficulty": "foundation" | "core" | "extension" }
  ]
}

Include 5 activities: Hook (5 min), Explore (20 min), Analyse (15 min), Evaluate (15 min), Reflect (5 min).
Include 5 questions: 2 foundation, 2 core, 1 extension.`;
}

function buildWorksheetPrompt(topic: string, subject: string, yearLevel: string, state: string, outcomesText: string, contextText: string, langNote: string, resourceTitle: string) {
  return `You are an expert Australian curriculum designer. Create a student worksheet for ${yearLevel} ${subject} students in ${state} studying "${topic}", based on "${resourceTitle}".

Curriculum outcomes:
${outcomesText}

Class context: ${contextText}
${langNote}

Return ONLY valid JSON, no markdown:
{
  "resourceType": "Worksheet",
  "outcomeCode": string (first outcome code),
  "outcomeDescription": string (full description),
  "successCriteria": string[] (exactly 3, starting with "Students will be able to..."),
  "sections": [
    {
      "title": "Knowledge and Understanding",
      "instructions": string,
      "questions": [{ "q": string, "lines": number (2-8), "marks": number (1-5) }]
    },
    {
      "title": "Application",
      "instructions": string,
      "questions": [{ "q": string, "lines": number, "marks": number }]
    },
    {
      "title": "Analysis and Evaluation",
      "instructions": string,
      "questions": [{ "q": string, "lines": number, "marks": number }]
    }
  ],
  "extensionTask": string (one paragraph challenge task),
  "wordBank": string[] (6-10 key terms students may use)
}

Make questions specifically about "${topic}" in an Australian context. Total marks across all sections should be 20-25.`;
}

function buildDiscussionPrompt(topic: string, subject: string, yearLevel: string, state: string, outcomesText: string, contextText: string, langNote: string, resourceTitle: string) {
  return `You are an expert Australian curriculum designer. Create a discussion guide for ${yearLevel} ${subject} students in ${state} studying "${topic}", based on "${resourceTitle}".

Curriculum outcomes:
${outcomesText}

Class context: ${contextText}
${langNote}

Return ONLY valid JSON, no markdown:
{
  "resourceType": "Discussion",
  "outcomeCode": string (first outcome code),
  "outcomeDescription": string (full description),
  "successCriteria": string[] (exactly 3, starting with "Students will be able to..."),
  "discussionPrompt": string (one compelling question that drives the whole discussion),
  "backgroundContext": string (2-3 sentences giving students the context they need),
  "perspectives": [
    { "viewpoint": string (label for this perspective), "keyArguments": string[] (3 bullet points) }
  ],
  "sentenceStarters": string[] (6-8 sentence starters for different discussion moves),
  "reflectionQuestions": string[] (3-4 questions for after the discussion),
  "teacherFacilitationNotes": string (2-3 sentences of practical tips for the teacher)
}

Include 3-4 perspectives representing a genuine range of views on "${topic}" in the Australian context. Sentence starters should model both agreeing and respectfully disagreeing.`;
}

function buildAssessmentPrompt(topic: string, subject: string, yearLevel: string, state: string, outcomesText: string, contextText: string, langNote: string, resourceTitle: string) {
  return `You are an expert Australian curriculum designer. Create a complete, ready-to-use formal assessment for ${yearLevel} ${subject} students in ${state} studying "${topic}", based on "${resourceTitle}".

Curriculum outcomes:
${outcomesText}

Class context: ${contextText}
${langNote}

Return ONLY valid JSON, no markdown:
{
  "resourceType": "Assessment",
  "outcomeCode": string (first outcome code),
  "outcomeDescription": string (full description),
  "successCriteria": string[] (exactly 3, starting with "Students will be able to..."),
  "taskType": string (e.g. "Source Analysis", "Extended Response", "Data Investigation"),
  "duration": string (e.g. "80 minutes"),
  "totalMarks": number (20-30),
  "studentSections": [
    {
      "section": string (e.g. "Section A: Short Answer"),
      "instructions": string (1-2 sentences for students),
      "questions": [
        { "number": number, "q": string (full question text, specific to ${topic}), "marks": number, "lines": number (answer lines, 3-10) }
      ]
    }
  ],
  "markingCriteria": [
    {
      "criterion": string,
      "excellent": string (A-level descriptor),
      "satisfactory": string (C-level descriptor),
      "developing": string (D/E-level descriptor),
      "marks": number
    }
  ],
  "teacherMarkingGuide": string (2-3 sentences of marking guidance)
}

Requirements:
- Include 3 sections: Section A (2-3 short answer questions, 2-4 marks each), Section B (1-2 structured questions, 4-6 marks each), Section C (1 extended response, 8-10 marks)
- All questions must be specific to "${topic}" in an Australian context
- Total marks across all questions must match totalMarks
- Include exactly 4 marking criteria linked directly to the outcomes`;
}

// ── Route ────────────────────────────────────────────────────────────────────

router.post("/lesson", async (req, res): Promise<void> => {
  const parsed = GenerateLessonBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const { subject, yearLevel, topic, state, resource, alignmentResult, classContext } = parsed.data;
  const unitContext = (req.body as Record<string, unknown>).unitContext as Record<string, string> | undefined;
  const preferredLanguage = (req.body as Record<string, unknown>).preferredLanguage as string | undefined;
  const resourceType = ((req.body as Record<string, unknown>).resourceType as string | undefined) ?? "Lesson Plan";

  const outcomesText = alignmentResult.outcomes.map((o) => `${o.id}: ${o.description}`).join("\n");
  const contextText = classContext && classContext.length > 0 ? classContext.join(", ") : "Mixed Ability";

  const unitNote = unitContext?.unitTitle
    ? `\nUnit: "${unitContext.unitTitle}" — Lesson ${unitContext.currentLesson || "?"} of ${unitContext.totalLessons || "?"}. Previous: ${unitContext.prevSummary || "not specified"}. Intention: ${unitContext.learningIntention || "not specified"}. Success criteria: ${unitContext.successCriteria || "not specified"}.`
    : "";
  const langNote = preferredLanguage && preferredLanguage !== "en-AU"
    ? `\nGenerate all content in language code: ${preferredLanguage}.`
    : "";

  let prompt: string;
  switch (resourceType) {
    case "Worksheet":
      prompt = buildWorksheetPrompt(topic, subject, yearLevel, state, outcomesText, contextText, langNote, resource.title);
      break;
    case "Discussion":
      prompt = buildDiscussionPrompt(topic, subject, yearLevel, state, outcomesText, contextText, langNote, resource.title);
      break;
    case "Assessment":
      prompt = buildAssessmentPrompt(topic, subject, yearLevel, state, outcomesText, contextText, langNote, resource.title);
      break;
    default:
      prompt = buildLessonPrompt(topic, subject, yearLevel, state, outcomesText, contextText, unitNote, langNote, resource.title, resource.source);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 4500,
      temperature: 0.7,
    });
    clearTimeout(timeout);
    const text = completion.choices[0]?.message?.content ?? "";
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    // Always force-inject resourceType so the frontend discriminated union works
    // even if Groq omits or misnames the field in its response.
    res.json({ ...JSON.parse(cleaned), resourceType, usedFallback: false });
  } catch (err) {
    clearTimeout(timeout);
    req.log.warn({ err }, "AI lesson call failed, using fallback");
    switch (resourceType) {
      case "Worksheet":
        res.json(buildFallbackWorksheet(topic, subject, yearLevel, alignmentResult.outcomes));
        break;
      case "Discussion":
        res.json(buildFallbackDiscussion(topic, subject, yearLevel, alignmentResult.outcomes));
        break;
      case "Assessment":
        res.json(buildFallbackAssessment(topic, subject, yearLevel, alignmentResult.outcomes));
        break;
      default:
        res.json(buildFallbackLesson(topic, subject, yearLevel, state, alignmentResult.outcomes));
    }
  }
});

export default router;
