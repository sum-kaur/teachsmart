import { Router, type IRouter } from "express";
import { GenerateLessonBody } from "@workspace/api-zod";
import { callCurriculumAI, reviewCurriculumFaithfulness } from "../lib/curricullm";

const router: IRouter = Router();
const TIMEOUT_MS = 14000;

// ── Helpers ──────────────────────────────────────────────────────────────────

function isSTEM(subject: string) {
  const s = subject.toLowerCase();
  return s.includes("math") || s.includes("science") || s.includes("physics") || s.includes("chemistry") || s.includes("biology");
}

// ── Fallbacks ────────────────────────────────────────────────────────────────

function buildFallbackLesson(topic: string, subject: string, yearLevel: string, state: string, outcomes: { id: string; description: string }[], resource: ResourceInfo) {
  const o = outcomes[0] ?? { id: "AC9-UNKNOWN", description: `Core ${subject} outcome for ${yearLevel}` };
  const rTitle = resource.title;
  const rSource = resource.source;
  const rDesc = resource.description;
  const stem = isSTEM(subject);

  const successCriteria = stem
    ? [
        `Understand the ${topic} concepts and methods demonstrated in "${rTitle}"`,
        `Apply procedures from the resource to solve ${topic} problems`,
        `Explain reasoning and justify solutions using correct ${subject} notation`,
      ]
    : [
        `Identify and explain key concepts from "${rTitle}" by ${rSource}`,
        `Apply knowledge from the resource to an Australian context`,
        `Evaluate evidence presented in the resource and form a reasoned conclusion`,
      ];

  const activities = stem
    ? [
        { label: "Hook (5 min)", text: `Present a real-world problem related to ${topic}. Ask: 'How would you approach this? What ${subject} concepts might help?' Connect to "${rTitle}" from ${rSource}.`, teacherTip: "Let students attempt the problem informally first before introducing the method.", assessmentIndicator: "Listen for prior knowledge of key concepts and common misconceptions." },
        { label: "Explore (20 min)", text: `Students work through "${rTitle}" from ${rSource}, following the explanations and worked examples. They record key concepts, formulas, and methods in their notebooks. Circulate to check understanding and prompt: 'Why does this step work?'`, teacherTip: "Pause at key points to check understanding before students move on.", assessmentIndicator: "Can students reproduce the method from the resource for a similar example?" },
        { label: "Practice (15 min)", text: `Students apply the methods from "${rTitle}" to a set of practice problems. Start with guided examples, then move to independent problems. Work in pairs to discuss strategies.`, teacherTip: "Provide worked solutions for the first problem so students can self-check.", assessmentIndicator: "Check that students are showing working and using correct notation, not just writing answers." },
        { label: "Apply (15 min)", text: `Challenge: students tackle a real-world application problem that requires the ${topic} concepts from "${rTitle}". They must set up the problem, choose the correct method, and explain their reasoning.`, teacherTip: "Encourage students to draw diagrams or tables to organise their thinking.", assessmentIndicator: "Students should connect the abstract method to the real-world context." },
        { label: "Reflect (5 min)", text: `Exit ticket: students solve one quick problem using the method from "${rTitle}" and write one sentence explaining when you would use this approach.`, teacherTip: "Use these to identify who needs revision before the next lesson.", assessmentIndicator: "Correct method application and ability to articulate when the method is useful." },
      ]
    : [
        { label: "Hook (5 min)", text: `Introduce "${rTitle}" from ${rSource}. Share a key quote or image from the resource and ask: 'What does this tell us about ${topic}? What questions does it raise?' Record student responses on the whiteboard.`, teacherTip: "Use think-pair-share to ensure all students contribute, not just confident speakers.", assessmentIndicator: "Listen for prior knowledge and misconceptions about the specific content in the resource." },
        { label: "Explore (20 min)", text: `Students read/engage with "${rTitle}" from ${rSource}. They complete guided note-taking identifying: (1) the main argument or information presented, (2) specific evidence or examples used, (3) how it connects to ${topic} in Australia. Circulate to check comprehension.`, teacherTip: "Provide a structured template with headings matching the three note-taking areas.", assessmentIndicator: "Check that students can identify the resource's main argument and at least two supporting details." },
        { label: "Analyse (15 min)", text: `In groups of 3-4, students analyse different aspects of "${rTitle}". Each group focuses on: What perspective does ${rSource} present? What evidence supports it? What might be missing? Groups share findings.`, teacherTip: "Assign roles within groups (scribe, presenter, questioner) to keep all students engaged.", assessmentIndicator: "Look for students distinguishing between the resource's claims and its evidence." },
        { label: "Evaluate (15 min)", text: `Whole-class discussion: Using evidence from "${rTitle}", students evaluate how well ${rSource} covers ${topic}. Prompt: 'Does this resource give us a complete picture?'`, teacherTip: "Use sentence starters on the board for students who find verbal participation challenging.", assessmentIndicator: "Students should cite specific details from the resource, not just general opinions." },
        { label: "Reflect (5 min)", text: `Exit ticket: students write (1) one key idea from "${rTitle}" they found most important, (2) one connection to their own Australian experience, (3) one remaining question.`, teacherTip: "Keep a few exit tickets to read aloud (anonymously) at the start of the next lesson.", assessmentIndicator: "Quality of remaining questions indicates depth of engagement with the specific resource." },
      ];

  const questions = stem
    ? [
        { q: `What are the key ${topic} concepts or formulas covered in "${rTitle}"? Define each in your own words.`, difficulty: "foundation" },
        { q: `Using the method from "${rTitle}", solve a similar problem. Show all working.`, difficulty: "foundation" },
        { q: `Explain why the method demonstrated in "${rTitle}" works. What is the reasoning behind each step?`, difficulty: "core" },
        { q: `Apply the ${topic} concepts from "${rTitle}" to a new real-world scenario. Set up and solve the problem.`, difficulty: "core" },
        { q: `Compare two different approaches to solving a ${topic} problem. When would the method from "${rTitle}" be most efficient?`, difficulty: "extension" },
      ]
    : [
        { q: `What is the main idea presented in "${rTitle}" by ${rSource}?`, difficulty: "foundation" },
        { q: `Identify two specific pieces of evidence from the resource about ${topic}.`, difficulty: "foundation" },
        { q: `Analyse the perspective presented in "${rTitle}". What strengths and limitations does it have?`, difficulty: "core" },
        { q: `Compare what you learned from "${rTitle}" with your own knowledge of ${topic} in Australia.`, difficulty: "core" },
        { q: `Critically evaluate whether "${rTitle}" provides a balanced view of ${topic}. Whose voices might be missing?`, difficulty: "extension" },
      ];

  return {
    resourceType: "Lesson Plan",
    outcomeCode: o.id,
    outcomeDescription: o.description,
    successCriteria,
    objective: stem
      ? `Students develop ${topic} skills by working through "${rTitle}" from ${rSource}. ${rDesc} This lesson builds procedural fluency and conceptual understanding aligned with ${state} ${subject} ${yearLevel} outcomes.`
      : `Students investigate ${topic} by engaging with "${rTitle}" from ${rSource}. ${rDesc} This lesson develops critical thinking and analytical skills aligned with ${state} ${subject} ${yearLevel} outcomes.`,
    duration: "60 minutes",
    materials: [
      `"${rTitle}" from ${rSource}${resource.url ? ` (${resource.url})` : ""} — printed copies or digital access`,
      stem ? "Calculators (if applicable)" : "Student notebooks or lined paper",
      "Whiteboard and markers",
      stem ? "Practice problem set (prepared by teacher)" : "Guided note-taking template (optional)",
    ],
    teacherPrep: [
      `Work through "${rTitle}" from ${rSource} and identify ${stem ? "key methods, formulas, and potential misconceptions" : "2-3 key discussion points relevant to " + topic}`,
      stem ? `Prepare a set of practice problems that use the same methods as "${rTitle}"` : `Prepare guiding questions that connect the resource content to ${state} curriculum outcomes`,
      stem ? "Prepare a real-world application problem for the Apply activity" : "Set up group seating arrangements for the Analyse activity",
    ],
    activities,
    localExample: {
      title: stem ? `${topic} in the Australian Context` : `Connecting "${rTitle}" to the Australian Context`,
      body: stem
        ? `${rDesc} Teachers should connect ${topic} to real-world Australian applications — industry, environment, or everyday life in ${state}.`
        : `${rDesc} Teachers should connect the specific content of this ${rSource} resource to local examples from ${state}.`,
    },
    differentiationTips: [
      { level: "Support", suggestion: stem ? `Provide worked examples with step-by-step annotations. Allow calculator use and pair students for practice.` : `Provide a simplified summary of "${rTitle}" with key vocabulary pre-defined. Allow paired work during the Explore phase.` },
      { level: "Core", suggestion: stem ? `Students complete the full problem set independently using methods from "${rTitle}".` : `Students complete the full note-taking and analysis sequence using "${rTitle}" independently.` },
      { level: "Extension", suggestion: stem ? `Students create their own ${topic} problem and solve it using the method from "${rTitle}", then explain it to a peer.` : `Students find a second resource on ${topic} and compare its perspective with "${rTitle}".` },
    ],
    crossCurriculumLinks: stem
      ? [`Numeracy — applying ${topic} procedures and calculations`, `Literacy — interpreting and communicating ${subject} reasoning clearly`]
      : [`Literacy — reading and interpreting "${rTitle}" as an informational text`, "Critical and Creative Thinking — evaluating evidence and forming arguments"],
    questions,
    reflectionPrompt: stem
      ? `What is one real-world situation where you would use the ${topic} skills from "${rTitle}"? Why does this matter?`
      : `After engaging with "${rTitle}" from ${rSource}, what is the most important thing every Australian should understand about ${topic}?`,
    usedFallback: true,
  };
}

function buildFallbackWorksheet(topic: string, subject: string, yearLevel: string, outcomes: { id: string; description: string }[], resource: ResourceInfo) {
  const o = outcomes[0] ?? { id: "AC9-UNKNOWN", description: `Core ${subject} outcome for ${yearLevel}` };
  const rTitle = resource.title;
  const rSource = resource.source;
  const stem = isSTEM(subject);

  if (stem) {
    return {
      resourceType: "Worksheet",
      outcomeCode: o.id,
      outcomeDescription: o.description,
      successCriteria: [
        `Recall and apply key ${topic} concepts from "${rTitle}"`,
        `Solve structured problems using methods from the resource`,
        `Explain reasoning and show full working`,
      ],
      sections: [
        {
          title: "Key Concepts",
          instructions: `Using "${rTitle}" from ${rSource}, answer each question.`,
          questions: [
            { q: `Define the key ${topic} terms or concepts covered in "${rTitle}". Give an example for each.`, lines: 4, marks: 3 },
            { q: `Write out the key formula(s) or method(s) from the resource and explain what each variable or step means.`, lines: 4, marks: 3 },
          ],
        },
        {
          title: "Skills and Application",
          instructions: "Apply the methods from the resource. Show all working.",
          questions: [
            { q: `Using the method from "${rTitle}", solve a problem similar to the examples in the resource. Show each step.`, lines: 6, marks: 4 },
            { q: `A real-world scenario involves ${topic}. Set up the problem using the approach from "${rTitle}" and solve it.`, lines: 6, marks: 5 },
          ],
        },
        {
          title: "Reasoning and Extension",
          instructions: "Explain your thinking and justify your approach.",
          questions: [
            { q: `A student solved a ${topic} problem but made an error. Identify the mistake and explain the correct approach using the method from "${rTitle}".`, lines: 8, marks: 7 },
          ],
        },
      ],
      extensionTask: `Create your own ${topic} problem that requires the method from "${rTitle}" to solve. Write the problem, provide the worked solution, and explain why this method is the best approach.`,
      wordBank: [topic, subject, "formula", "method", "solution", "proof"],
      usedFallback: true,
    };
  }

  return {
    resourceType: "Worksheet",
    outcomeCode: o.id,
    outcomeDescription: o.description,
    successCriteria: [
      `Recall and define key terms from "${rTitle}" by ${rSource}`,
      `Apply understanding from the resource to structured questions about ${topic}`,
      `Evaluate and justify a position using evidence from the resource`,
    ],
    sections: [
      {
        title: "Knowledge and Understanding",
        instructions: `Using "${rTitle}" from ${rSource}, answer each question in full sentences.`,
        questions: [
          { q: `What is the main topic or argument presented in "${rTitle}" by ${rSource}?`, lines: 3, marks: 2 },
          { q: `List two key facts or pieces of evidence from the resource about ${topic}.`, lines: 4, marks: 4 },
        ],
      },
      {
        title: "Application",
        instructions: `Use your reading of "${rTitle}" to answer the following questions.`,
        questions: [
          { q: `How does the information in "${rTitle}" connect to ${topic} for Australian students today?`, lines: 5, marks: 5 },
          { q: `Give one real-world Australian example that supports or extends what you read in the resource.`, lines: 4, marks: 3 },
        ],
      },
      {
        title: "Analysis and Evaluation",
        instructions: `Think critically about "${rTitle}" and justify your answers with evidence from the resource.`,
        questions: [
          { q: `Analyse the perspective presented in "${rTitle}" by ${rSource}. Does the resource present a balanced view of ${topic}? Explain your reasoning with at least two specific references to the resource.`, lines: 8, marks: 8 },
        ],
      },
    ],
    extensionTask: `Find a second source on ${topic} and write a 150-word comparison explaining how it agrees or disagrees with the perspective presented in "${rTitle}" by ${rSource}.`,
    wordBank: [topic, subject, rSource, "evidence", "analysis", "perspective"],
    usedFallback: true,
  };
}

function buildFallbackDiscussion(topic: string, subject: string, yearLevel: string, outcomes: { id: string; description: string }[], resource: ResourceInfo) {
  const o = outcomes[0] ?? { id: "AC9-UNKNOWN", description: `Core ${subject} outcome for ${yearLevel}` };
  const rTitle = resource.title;
  const rSource = resource.source;
  const rDesc = resource.description;
  return {
    resourceType: "Discussion",
    outcomeCode: o.id,
    outcomeDescription: o.description,
    successCriteria: [
      `Articulate a clear position on ${topic} using evidence from "${rTitle}"`,
      `Respectfully engage with perspectives raised in the ${rSource} resource`,
      `Reflect on how the resource content connects to Australian society`,
    ],
    discussionPrompt: `Based on "${rTitle}" from ${rSource}: To what extent does this resource capture the full picture of ${topic} in Australia, and what perspectives might be missing?`,
    backgroundContext: `${rDesc} This resource from ${rSource} provides one perspective on ${topic} that students should critically examine.`,
    perspectives: [
      { viewpoint: `The ${rSource} perspective`, keyArguments: [`The resource presents ${topic} as described in "${rTitle}"`, `${rSource} is a trusted Australian source on this content`, "The evidence presented supports this view"] },
      { viewpoint: "Alternative perspective", keyArguments: [`Other sources may present ${topic} differently`, "Not all stakeholders are represented in a single resource", "Additional Australian voices and experiences should be considered"] },
    ],
    sentenceStarters: ["According to the resource...", "The evidence in the resource suggests...", "A different perspective might be...", "From an Australian perspective...", "I agree/disagree with the resource because...", "What the resource doesn't address is..."],
    reflectionQuestions: [`What was the most compelling point in "${rTitle}"?`, `Whose voice is most important in this debate and was it represented in the resource?`, "What would you want to investigate further?"],
    teacherFacilitationNotes: `Ground the discussion in the specific content of "${rTitle}" from ${rSource}. Ensure students reference the resource rather than making unsupported claims. Connect to ${subject} outcomes.`,
    usedFallback: true,
  };
}

function buildFallbackAssessment(topic: string, subject: string, yearLevel: string, outcomes: { id: string; description: string }[], resource: ResourceInfo) {
  const o = outcomes[0] ?? { id: "AC9-UNKNOWN", description: `Core ${subject} outcome for ${yearLevel}` };
  const rTitle = resource.title;
  const rSource = resource.source;

  if (isSTEM(subject)) {
    return {
      resourceType: "Assessment",
      outcomeCode: o.id,
      outcomeDescription: o.description,
      successCriteria: [
        `Demonstrate understanding of key ${topic} concepts covered in "${rTitle}"`,
        `Apply ${topic} methods and procedures to solve problems`,
        `Communicate mathematical/scientific reasoning clearly with correct notation`,
      ],
      taskType: "Problem-Solving Task",
      duration: "60 minutes",
      studentSections: [
        { section: "Section A: Skills and Procedures", instructions: `Apply the concepts from "${rTitle}" (${rSource}) to solve these problems. Show all working.`, questions: [
          { number: 1, q: `Define the key terms and concepts related to ${topic} that are covered in "${rTitle}". Give an example for each.`, marks: 3, lines: 5 },
          { number: 2, q: `Using the methods demonstrated in "${rTitle}", solve the following: Explain each step of your working and identify the ${topic} concept applied at each stage.`, marks: 4, lines: 6 },
        ]},
        { section: "Section B: Application", instructions: `Apply your understanding of ${topic} to these problems. Show full working and reasoning.`, questions: [
          { number: 3, q: `A real-world scenario involves ${topic}. Using the approach from "${rTitle}" by ${rSource}, set up the problem, show your method, and solve it. Clearly state any assumptions.`, marks: 5, lines: 8 },
          { number: 4, q: `Explain how the ${topic} concepts from "${rTitle}" connect to a real-world Australian context. Provide a worked example demonstrating the application.`, marks: 5, lines: 8 },
        ]},
        { section: "Section C: Analysis and Reasoning", instructions: `Show extended reasoning and justify your approach.`, questions: [
          { number: 5, q: `A student claims they can solve a ${topic} problem using a different method than the one shown in "${rTitle}". Evaluate both approaches: Which is more efficient? Which is more generalisable? Justify your answer with worked examples.`, marks: 8, lines: 14 },
        ]},
      ],
      markingCriteria: [
        { criterion: "Knowledge of Concepts", excellent: `Demonstrates thorough understanding of ${topic} concepts with correct definitions and examples`, satisfactory: "Shows adequate understanding with mostly correct use of terminology", developing: "Shows limited understanding; key concepts incorrect or missing", marks: 7 },
        { criterion: "Problem-Solving and Working", excellent: "Correct method selection, logical steps, accurate calculations throughout", satisfactory: "Appropriate method chosen but some errors in working or calculation", developing: "Incorrect method or significant errors; incomplete working shown", marks: 8 },
        { criterion: "Application and Reasoning", excellent: "Applies concepts to real-world contexts with clear, justified reasoning", satisfactory: "Some application shown but reasoning could be more detailed", developing: "Limited application; reasoning unclear or absent", marks: 7 },
        { criterion: "Communication and Notation", excellent: "Clear mathematical/scientific notation, well-structured responses", satisfactory: "Generally clear with some notation errors", developing: "Poor notation; difficult to follow working", marks: 3 },
      ],
      totalMarks: 25,
      teacherMarkingGuide: `Award method marks even if the final answer is incorrect. Look for correct application of ${topic} concepts from "${rTitle}". Accept alternative valid methods.`,
      usedFallback: true,
    };
  }

  // Humanities / other subjects — source analysis style
  return {
    resourceType: "Assessment",
    outcomeCode: o.id,
    outcomeDescription: o.description,
    successCriteria: [
      `Demonstrate understanding of the content presented in "${rTitle}" by ${rSource}`,
      `Apply knowledge from the resource to structured tasks`,
      `Evaluate and synthesise information from the resource about ${topic}`,
    ],
    taskType: "Source Analysis",
    duration: "60 minutes",
    studentSections: [
      { section: "Section A: Short Answer", instructions: `Using "${rTitle}" from ${rSource}, answer all questions in full sentences.`, questions: [
        { number: 1, q: `What is the main argument or information presented in "${rTitle}" by ${rSource}?`, marks: 2, lines: 4 },
        { number: 2, q: `Identify two key facts or pieces of evidence about ${topic} from the resource.`, marks: 4, lines: 5 },
      ]},
      { section: "Section B: Structured Response", instructions: `Answer both questions using specific evidence from "${rTitle}".`, questions: [
        { number: 3, q: `Explain how the information in "${rTitle}" helps us understand ${topic} in the Australian context. Use at least one specific example from the resource.`, marks: 5, lines: 8 },
        { number: 4, q: `Analyse the perspective presented by ${rSource}. What strengths and limitations does this resource have for understanding ${topic}?`, marks: 6, lines: 10 },
      ]},
      { section: "Section C: Extended Response", instructions: "Write a detailed response using evidence from the resource and your own knowledge.", questions: [
        { number: 5, q: `Using "${rTitle}" from ${rSource} as your primary source, evaluate the significance of ${topic} in modern Australia. How effectively does the resource present this topic? What additional perspectives or evidence would strengthen our understanding?`, marks: 8, lines: 20 },
      ]},
    ],
    markingCriteria: [
      { criterion: "Knowledge and Understanding", excellent: "Demonstrates thorough understanding of the resource with accurate, specific references", satisfactory: "Shows adequate understanding with some references to the resource", developing: "Shows limited understanding; few references to actual resource content", marks: 8 },
      { criterion: "Analysis and Evaluation", excellent: "Insightful analysis of the resource's perspective with well-reasoned evaluation", satisfactory: "Some analysis of the resource present but reasoning could be stronger", developing: "Limited analysis; mostly descriptive without critical engagement", marks: 8 },
      { criterion: "Use of Evidence", excellent: "Consistently cites specific details from the resource to support all claims", satisfactory: "Uses resource evidence at times but not consistently", developing: "Little evidence from the resource; claims mostly unsupported", marks: 6 },
      { criterion: "Communication", excellent: "Clear, fluent, well-structured response throughout", satisfactory: "Generally clear with some structure", developing: "Unclear or poorly structured", marks: 3 },
    ],
    totalMarks: 25,
    teacherMarkingGuide: `Reward students who cite specific content from "${rTitle}" by ${rSource}. Look for references to actual evidence, examples, or arguments from the resource rather than generic statements about ${topic}.`,
    usedFallback: true,
  };
}

// ── Prompt builders ──────────────────────────────────────────────────────────

type ResourceInfo = {
  title: string;
  source: string;
  description: string;
  url?: string;
  whyThisResource: string;
  localContextTags: string[];
  outcomeIds: string[];
  type: string;
};

function buildResourceBlock(resource: ResourceInfo) {
  const parts = [
    `Title: "${resource.title}"`,
    `Source: ${resource.source}`,
    `Type: ${resource.type}`,
    `Description: ${resource.description}`,
    `Why this resource: ${resource.whyThisResource}`,
  ];
  if (resource.url) parts.push(`URL: ${resource.url}`);
  if (resource.localContextTags.length > 0) parts.push(`Context tags: ${resource.localContextTags.join(", ")}`);
  if (resource.outcomeIds.length > 0) parts.push(`Matched outcome codes: ${resource.outcomeIds.join(", ")}`);
  return parts.join("\n");
}

const GROUNDING_RULE = `
CRITICAL GROUNDING RULES:
- Every activity, question, and example MUST directly reference or build on the content described in the resource above.
- Do NOT invent topics, examples, or facts that are not related to what the resource covers.
- The resource description tells you what the resource contains — use that as the basis for all lesson content.
- If the resource is about a specific event, person, law, or concept, the lesson must focus on that specific content.
- Reference the resource by name in activities (e.g. "Using the [resource title] from [source], students will...").
- Materials list must include this specific resource as the primary material.`;

function buildLessonPrompt(topic: string, subject: string, yearLevel: string, state: string, outcomesText: string, contextText: string, unitNote: string, langNote: string, resource: ResourceInfo) {
  return `You are an expert Australian curriculum designer. Create a complete, highly detailed ${yearLevel} ${subject} lesson plan for ${state} students studying "${topic}".

THE RESOURCE THIS LESSON IS BASED ON:
${buildResourceBlock(resource)}

Curriculum outcomes:
${outcomesText}

Class context: ${contextText}
${unitNote}${langNote}
${GROUNDING_RULE}

Return ONLY valid JSON, no markdown:
{
  "resourceType": "Lesson Plan",
  "outcomeCode": string (first outcome code, e.g. "AC9S9U05"),
  "outcomeDescription": string (full description of that outcome),
  "successCriteria": string[] (exactly 3 items starting with "Students will be able to..."),
  "objective": string (2-3 sentences, specific and measurable, referencing what the resource covers),
  "duration": "60 minutes",
  "materials": string[] (3-5 items — MUST include "${resource.title}" from ${resource.source} as the first item),
  "teacherPrep": string[] (3-4 preparation steps — first step must be reviewing the specific resource),
  "activities": [
    {
      "label": string (e.g. "Hook (5 min)"),
      "text": string (detailed 2-4 sentences — must reference the resource content specifically),
      "teacherTip": string (practical classroom management or pedagogical tip for this activity),
      "assessmentIndicator": string (what to look for to check understanding)
    }
  ],
  "localExample": {
    "title": string (specific Australian place, event, or context drawn from or connected to the resource),
    "body": string (3-4 sentences connecting the resource content to a real, specific Australian example)
  },
  "differentiationTips": [
    { "level": "Support", "suggestion": string (specific strategy for struggling learners) },
    { "level": "Core", "suggestion": string (strategy for on-level learners) },
    { "level": "Extension", "suggestion": string (challenge for advanced learners) }
  ],
  "crossCurriculumLinks": string[] (2-3 links to other subject areas),
  "questions": [
    { "q": string (must be answerable using the resource content), "difficulty": "foundation" | "core" | "extension" }
  ],
  "reflectionPrompt": string (a thought-provoking question connected to the resource's content)
}

Include 5 activities: Hook (5 min), Explore (20 min), Analyse (15 min), Evaluate (15 min), Reflect (5 min).
Include 5 questions: 2 foundation, 2 core, 1 extension.
Make activities detailed — describe what the teacher says/does and what students do.
The Explore activity MUST have students directly engaging with "${resource.title}" (reading, watching, analysing, or interacting with it).
Questions must be answerable based on the resource content described above.`;
}

function buildWorksheetPrompt(topic: string, subject: string, yearLevel: string, state: string, outcomesText: string, contextText: string, langNote: string, resource: ResourceInfo) {
  return `You are an expert Australian curriculum designer. Create a student worksheet for ${yearLevel} ${subject} students in ${state} studying "${topic}".

THE RESOURCE THIS WORKSHEET IS BASED ON:
${buildResourceBlock(resource)}

Curriculum outcomes:
${outcomesText}

Class context: ${contextText}
${langNote}
${GROUNDING_RULE}

Return ONLY valid JSON, no markdown:
{
  "resourceType": "Worksheet",
  "outcomeCode": string (first outcome code),
  "outcomeDescription": string (full description),
  "successCriteria": string[] (exactly 3, starting with "Students will be able to..."),
  "sections": [
    {
      "title": "Knowledge and Understanding",
      "instructions": string (must reference the resource, e.g. "Using the ${resource.source} resource, answer..."),
      "questions": [{ "q": string (answerable from the resource), "lines": number (2-8), "marks": number (1-5) }]
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
  "extensionTask": string (one paragraph challenge task building on the resource content),
  "wordBank": string[] (6-10 key terms from the resource and topic)
}

All questions MUST be answerable using "${resource.title}" from ${resource.source}. Do not ask about content not covered by this resource. Total marks: 20-25.`;
}

function buildDiscussionPrompt(topic: string, subject: string, yearLevel: string, state: string, outcomesText: string, contextText: string, langNote: string, resource: ResourceInfo) {
  return `You are an expert Australian curriculum designer. Create a discussion guide for ${yearLevel} ${subject} students in ${state} studying "${topic}".

THE RESOURCE THIS DISCUSSION IS BASED ON:
${buildResourceBlock(resource)}

Curriculum outcomes:
${outcomesText}

Class context: ${contextText}
${langNote}
${GROUNDING_RULE}

Return ONLY valid JSON, no markdown:
{
  "resourceType": "Discussion",
  "outcomeCode": string (first outcome code),
  "outcomeDescription": string (full description),
  "successCriteria": string[] (exactly 3, starting with "Students will be able to..."),
  "discussionPrompt": string (one compelling question drawn directly from the resource's content),
  "backgroundContext": string (2-3 sentences summarising what the resource covers to prepare students),
  "perspectives": [
    { "viewpoint": string (label for this perspective), "keyArguments": string[] (3 bullet points grounded in the resource) }
  ],
  "sentenceStarters": string[] (6-8 sentence starters for different discussion moves),
  "reflectionQuestions": string[] (3-4 questions connected to the resource content),
  "teacherFacilitationNotes": string (2-3 sentences — reference the resource by name)
}

The discussion prompt MUST arise from the content of "${resource.title}". Include 3-4 perspectives representing genuine views raised by or connected to the resource. Do not introduce unrelated topics.`;
}

function buildAssessmentPrompt(topic: string, subject: string, yearLevel: string, state: string, outcomesText: string, contextText: string, langNote: string, resource: ResourceInfo) {
  return `You are an expert Australian curriculum designer. Create a complete, ready-to-use formal assessment for ${yearLevel} ${subject} students in ${state} studying "${topic}".

THE RESOURCE THIS ASSESSMENT IS BASED ON:
${buildResourceBlock(resource)}

Curriculum outcomes:
${outcomesText}

Class context: ${contextText}
${langNote}
${GROUNDING_RULE}

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
      "instructions": string (must reference the resource as source material),
      "questions": [
        { "number": number, "q": string (specific to the resource content), "marks": number, "lines": number (answer lines, 3-10) }
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
  "teacherMarkingGuide": string (2-3 sentences — reference specific content from the resource that students should cite)
}

Requirements:
- Include 3 sections: Section A (2-3 short answer, 2-4 marks each), Section B (1-2 structured, 4-6 marks each), Section C (1 extended response, 8-10 marks)
- All questions must be answerable using "${resource.title}" from ${resource.source}
- Students should be able to reference specific content from the resource in their answers
- Every question must name or clearly point to a claim, example, perspective, data point, quotation, image, experiment, event, or concept that is actually described in the resource metadata above
- Do NOT write generic school assessment questions that could fit any topic or any source
- Do NOT ask students to use prior knowledge unless the question explicitly starts from the source and then extends it
- If the resource description is broad, keep questions tightly tied to the described content instead of inventing finer details
- Total marks must match totalMarks
- Include exactly 4 marking criteria`;
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

  const resourceInfo: ResourceInfo = {
    title: resource.title,
    source: resource.source,
    description: resource.description,
    url: ((req.body as Record<string, unknown>).resource as Record<string, string> | undefined)?.url,
    whyThisResource: resource.whyThisResource,
    localContextTags: resource.localContextTags,
    outcomeIds: resource.outcomeIds,
    type: resource.type,
  };

  let prompt: string;
  switch (resourceType) {
    case "Worksheet":
      prompt = buildWorksheetPrompt(topic, subject, yearLevel, state, outcomesText, contextText, langNote, resourceInfo);
      break;
    case "Discussion":
      prompt = buildDiscussionPrompt(topic, subject, yearLevel, state, outcomesText, contextText, langNote, resourceInfo);
      break;
    case "Assessment":
      prompt = buildAssessmentPrompt(topic, subject, yearLevel, state, outcomesText, contextText, langNote, resourceInfo);
      break;
    default:
      prompt = buildLessonPrompt(topic, subject, yearLevel, state, outcomesText, contextText, unitNote, langNote, resourceInfo);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const generation = await callCurriculumAI({
      prompt,
      maxTokens: 6000,
      temperature: 0.55,
    });
    clearTimeout(timeout);
    const cleaned = generation.text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const reviewed = await reviewCurriculumFaithfulness({
      promptContext: `Lesson generation for ${yearLevel} ${subject} in ${state} on "${topic}".
Resource type: ${resourceType}
Curriculum outcomes:
${outcomesText}
Resource:
- Title: ${resourceInfo.title}
- Source: ${resourceInfo.source}
- Description: ${resourceInfo.description}`,
      draftJson: cleaned,
      maxTokens: 6000,
    });
    const reviewedCleaned = reviewed.text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    // Always force-inject resourceType so the frontend discriminated union works
    // even if Groq omits or misnames the field in its response.
    res.json({ ...JSON.parse(reviewedCleaned), resourceType, usedFallback: false, aiProvider: generation.provider, curriculumReviewedBy: reviewed.provider });
  } catch (err) {
    clearTimeout(timeout);
    req.log.warn({ err }, "AI lesson call failed, using fallback");
    switch (resourceType) {
      case "Worksheet":
        res.json(buildFallbackWorksheet(topic, subject, yearLevel, alignmentResult.outcomes, resourceInfo));
        break;
      case "Discussion":
        res.json(buildFallbackDiscussion(topic, subject, yearLevel, alignmentResult.outcomes, resourceInfo));
        break;
      case "Assessment":
        res.json(buildFallbackAssessment(topic, subject, yearLevel, alignmentResult.outcomes, resourceInfo));
        break;
      default:
        res.json(buildFallbackLesson(topic, subject, yearLevel, state, alignmentResult.outcomes, resourceInfo));
    }
  }
});

export default router;
