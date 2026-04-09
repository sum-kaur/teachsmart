import { Router, type IRouter } from "express";
import { callCurriculumAI, reviewCurriculumFaithfulness } from "../lib/curricullm";

const router: IRouter = Router();
const TIMEOUT_MS = 30000;

type SlideResourceContext = {
  title?: string;
  source?: string;
  description?: string;
  url?: string;
  type?: string;
};

// ─── Dynamic fallback ────────────────────────────────────────────────────────
// Build a topic-specific slide deck directly from the lesson plan data so that
// if the Groq API is unavailable (rate-limit, timeout, etc.) users still see
// relevant content for the topic they searched — never unrelated hardcoded content.
function buildDynamicFallback(
  lessonPlan: Record<string, unknown>,
  subject: string,
  yearLevel: string,
  topic: string,
  state: string,
  selectedResource?: SlideResourceContext
) {
  const objective = (lessonPlan.objective as string) || `Students will understand key concepts related to ${topic}.`;
  const duration  = (lessonPlan.duration as string) || "60 minutes";
  const activities = (lessonPlan.activities as Array<{ label: string; text: string }>) || [];
  const localEx = (lessonPlan.localExample as { title: string; body: string }) || { title: `${topic} in ${state}`, body: `Explore how ${topic} is relevant in ${state}.` };
  const questions = (lessonPlan.questions as Array<{ q: string; difficulty: string }>) || [];
  const resourceTitle = selectedResource?.title?.trim() || `${topic} source text`;
  const resourceSource = selectedResource?.source?.trim() || "the selected classroom resource";
  const resourceDescription = selectedResource?.description?.trim() || `This source has been selected to support student understanding of ${topic} in ${yearLevel} ${subject}.`;
  const resourceLabel = selectedResource?.title?.trim()
    ? `"${resourceTitle}" from ${resourceSource}`
    : `the selected classroom resource from ${resourceSource}`;
  const resourceLinkNote = selectedResource?.url ? ` Open the original source here: ${selectedResource.url}.` : "";

  const title = `${topic} — ${yearLevel} ${subject}`;

  const slides = [
    {
      slideNumber: 1, type: "title",
      heading: title,
      subheading: `${yearLevel} ${subject} · ${state} Curriculum · Source: ${resourceSource}`,
      bodyText: "",
      bulletPoints: [],
      keyTerms: [], workedExample: null, table: null, activitySteps: [],
      teacherNote: `Welcome students and introduce the topic: ${topic}. Tell students that today's lesson is anchored in ${resourceLabel}. Briefly explain why this source was selected and ask students what they already know about the topic before displaying the learning objectives.${resourceLinkNote}`,
      backgroundTheme: "teal", emoji: "📚", timeMinutes: 2,
    },
    {
      slideNumber: 2, type: "objective",
      heading: "Learning Intentions & Success Criteria",
      subheading: `By the end of today's lesson you will be able to:`,
      bodyText: objective,
      bulletPoints: [
        `Identify and explain the core concepts of ${topic} using appropriate ${subject.toLowerCase()} vocabulary.`,
        `Apply understanding of ${topic} to analyse real-world examples relevant to ${state} and Australia.`,
        `Evaluate evidence and construct a reasoned response to questions about ${topic}.`,
        `Connect today's learning to broader themes in ${yearLevel} ${subject} curriculum.`,
      ],
      keyTerms: [], workedExample: null, table: null, activitySteps: [],
      teacherNote: `Read each success criterion aloud. Ask students to rate their current confidence (1–5 fingers) before starting. Return to these at the end as the exit reflection.`,
      backgroundTheme: "white", emoji: "🎯", timeMinutes: 3,
    },
    {
      slideNumber: 3, type: "engage",
      heading: `Hook: Why Does ${topic} Matter?`,
      subheading: "Engage — Activate prior knowledge",
      bodyText: `${topic} is one of the most significant areas of study in ${yearLevel} ${subject}. Today's lesson is anchored in ${resourceLabel}, which gives students a concrete Australian source to analyse rather than relying on generic summaries. ${resourceDescription} This helps students connect curriculum ideas to real evidence, authorship, and audience.`,
      bulletPoints: [
        `${topic} connects to Australian Curriculum v9 outcomes for ${yearLevel} ${subject} and is explored today through ${resourceLabel}.`,
        `Using a named source helps students evaluate authorship, purpose, and evidence instead of treating information as context-free facts.`,
        `${resourceSource} provides an Australian reference point that can be compared with classroom discussion, teacher explanation, and additional sources.`,
        `Understanding ${topic} through a real source strengthens critical reading, evidence evaluation, and disciplinary literacy in ${subject}.`,
      ],
      keyTerms: [], workedExample: null, table: null, activitySteps: [],
      teacherNote: `Start with a provocative question: "Where do you see ${topic} in your life or community?" Allow 2 minutes Think-Pair-Share before presenting the lesson objectives. Cold-call 3–4 students to share their partner's response.`,
      backgroundTheme: "dark", emoji: "💡", timeMinutes: 7,
    },
    {
      slideNumber: 4, type: "key_terms",
      heading: "Key Vocabulary for This Topic",
      subheading: "Master these terms before we go further",
      bodyText: `Every discipline has its own precise language. Using subject-specific vocabulary accurately is a mark of deep understanding and is assessed in all ${yearLevel} ${subject} examinations and assignments.`,
      bulletPoints: [],
      keyTerms: [
        { term: topic, definition: `The central concept of today's lesson. Understanding ${topic} requires connecting theory to real-world evidence and Australian examples.` },
        { term: subject, definition: `The discipline through which we study ${topic}. ${subject} provides the frameworks, methods, and vocabulary for understanding this field.` },
        { term: "Evidence", definition: "Information gathered through observation, measurement, or research that supports or refutes a claim. Good evidence is reliable, valid, and from credible sources." },
        { term: "Analysis", definition: "Breaking down complex information into its component parts to understand how they relate to each other and to the whole." },
        { term: "Evaluation", definition: "Making a judgement about the quality, reliability, or significance of evidence, arguments, or ideas using clear criteria." },
        { term: "Australian Curriculum v9", definition: `The national framework that sets learning expectations for ${yearLevel} ${subject} across all states and territories, including ${state}.` },
      ],
      workedExample: null, table: null, activitySteps: [],
      teacherNote: `Have students copy these definitions into their workbooks. Then use 'Definition Bingo' — read a definition aloud and students call out the term. Add subject-specific terms from your own knowledge of ${topic} if needed.`,
      backgroundTheme: "purple", emoji: "📖", timeMinutes: 8,
    },
    {
      slideNumber: 5, type: "theory",
      heading: `What Is ${topic}? — Core Concepts`,
      subheading: `Explain — Foundational knowledge for ${yearLevel} ${subject}`,
      bodyText: activities[0]?.text
        ? activities[0].text
        : `${topic} is a central area of study in ${yearLevel} ${subject}. Understanding the foundational concepts of ${topic} gives students the knowledge base required to analyse evidence, evaluate arguments, and make informed judgements. Mastery of these core ideas underpins performance in ${state} curriculum assessments at the ${yearLevel} level.`,
      bulletPoints: [
        `${topic} is a foundational concept in ${yearLevel} ${subject} that connects theory to real-world evidence and Australian examples.`,
        `Students at the ${yearLevel} level are expected to explain, analyse, and evaluate aspects of ${topic} using subject-specific vocabulary.`,
        `The ${state} curriculum places ${topic} within a broader context of Australian society, environment, and civic understanding.`,
        `Accurate use of ${subject.toLowerCase()} terminology when discussing ${topic} is directly assessed in classroom tasks and external examinations.`,
      ],
      keyTerms: [], workedExample: null, table: null, activitySteps: [],
      teacherNote: `Introduce the core concept using plain language first, then restate it using subject-specific vocabulary. Ask students: "Put this in your own words — what is ${topic}?" Use cold-calling (3–4 students) before accepting a class consensus definition. Students should record their own paraphrased definition in their workbooks.`,
      backgroundTheme: "white" as const, emoji: "🔍", timeMinutes: 6,
    },
    {
      slideNumber: 6, type: "theory",
      heading: `How ${topic} Works — Key Processes and Mechanisms`,
      subheading: `Explain — Causes, mechanisms, and how they interact`,
      bodyText: activities[1]?.text
        ? activities[1].text
        : `Understanding the mechanisms behind ${topic} requires students to examine how different factors interact over time and across contexts. In ${yearLevel} ${subject}, students are expected to move beyond description and explain the processes that drive outcomes related to ${topic}. This slide focuses on the "how" and "why" — the causal reasoning that underpins ${subject.toLowerCase()} analysis.`,
      bulletPoints: [
        `The key processes driving ${topic} involve a sequence of interrelated causes, effects, and feedback mechanisms studied in ${yearLevel} ${subject}.`,
        `Identifying causal relationships within ${topic} allows students to construct evidence-based arguments rather than simple descriptive summaries.`,
        `In ${state} and across Australia, the mechanisms of ${topic} produce real, measurable outcomes documented by government agencies and research organisations.`,
        `Understanding how ${topic} operates prepares students for the analytical writing and extended responses required in ${yearLevel} assessments.`,
      ],
      keyTerms: [], workedExample: null, table: null, activitySteps: [],
      teacherNote: `Draw a simple cause-and-effect diagram on the whiteboard as you explain the mechanism. Ask students to copy the diagram and annotate it with their own labels. Pause at each step and ask: "What happens next, and why?" Check understanding with a cold-call before moving to the evidence slide.`,
      backgroundTheme: "white" as const, emoji: "⚙️", timeMinutes: 6,
    },
    {
      slideNumber: 7, type: "theory",
      heading: `Evidence and Data — What Research Tells Us`,
      subheading: `Explain — Using evidence to support claims about ${topic}`,
      bodyText: activities[2]?.text
        ? activities[2].text
        : `Strong claims about ${topic} in ${yearLevel} ${subject} must be supported by credible, specific evidence. Today's source text is ${resourceLabel}, and students should examine what evidence, examples, terminology, and claims it actually presents. ${resourceDescription} Using named sources with specific statistics, examples, or quotations distinguishes sophisticated analysis from unsupported opinion.`,
      bulletPoints: [
        `Students should identify the strongest evidence inside ${resourceLabel} and explain how that evidence supports the source's key ideas about ${topic}.`,
        `Evaluating the reliability, relevance, and limitations of ${resourceSource} is a core analytical skill assessed in ${yearLevel} ${subject}.`,
        `Students should practise citing specific examples, dated findings, or direct details from the chosen source when making claims about ${topic}.`,
        `Comparing the selected source with at least one additional Australian reference helps students test whether the source's claims are well supported.`,
      ],
      keyTerms: [], workedExample: null, table: null, activitySteps: [],
      teacherNote: `Project ${resourceLabel} and model how to extract evidence from it. Highlight one sentence, image, table, or example from the source and ask: "What claim is being made here? What evidence supports it? What is missing?" Then model a sentence frame such as: "According to ${resourceSource}, ___, which suggests ___." Ask extension students to identify a limitation or unanswered question in the source.${resourceLinkNote}`,
      backgroundTheme: "white" as const, emoji: "📊", timeMinutes: 6,
    },
    {
      slideNumber: 8, type: "theory",
      heading: `Impacts and Consequences of ${topic}`,
      subheading: `Explain — Real-world outcomes across Australian contexts`,
      bodyText: activities[3]?.text
        ? activities[3].text
        : `The study of ${topic} in ${yearLevel} ${subject} is not purely theoretical — it has measurable impacts on individuals, communities, industries, and government policy in Australia. Evaluating these impacts requires students to weigh competing perspectives, consider the interests of different stakeholders, and assess the scale and significance of outcomes using specific Australian examples and data.`,
      bulletPoints: [
        `${topic} has direct, documented consequences for Australian communities, environments, and economic systems that students can investigate using publicly available data.`,
        `Different stakeholders — including government bodies, communities, industries, and individuals — are affected by and respond to ${topic} in distinct ways.`,
        `The impacts of ${topic} in ${state} may differ from national patterns due to geographic, demographic, or policy differences, making local analysis essential.`,
        `Evaluating the significance of these impacts — not just listing them — is the highest-order skill assessed in ${yearLevel} ${subject} extended responses.`,
      ],
      keyTerms: [], workedExample: null, table: null, activitySteps: [],
      teacherNote: `Ask students to brainstorm: "Who is most affected by ${topic} in Australia, and how?" Record responses in two columns on the board: "Who is affected" and "How they are affected." After 2 minutes, introduce a real Australian example and ask students to evaluate its significance using a scale of 1–5 with justification.`,
      backgroundTheme: "white" as const, emoji: "🌏", timeMinutes: 7,
    },
    {
      slideNumber: 9, type: "local_context",
      heading: localEx.title || `${topic} in ${state}`,
      subheading: `Local Context — ${state} Australian example`,
      bodyText: localEx.body || `${state} provides a compelling local context for studying ${topic}. By linking the topic to ${resourceLabel}, students can connect the selected source to lived experience, local evidence, and community relevance.`,
      bulletPoints: [
        `${state} provides specific, relevant examples that bring ${topic} to life for local students.`,
        `Connecting curriculum content to local context improves engagement and long-term retention.`,
        `Understanding local applications of ${topic} prepares students for community involvement and future careers.`,
      ],
      keyTerms: [], workedExample: null, table: null, activitySteps: [],
      teacherNote: `Ask students: "Have you seen this in your local area or heard about it in ${state} news?" Make space for personal connections. Acknowledge that local examples may include sensitive topics that affect students' families or communities.`,
      backgroundTheme: "dark" as const, emoji: "🗺️", timeMinutes: 5,
    },
    {
      slideNumber: 10, type: "activity",
      heading: `Student Activity: Analyse ${resourceTitle}`,
      subheading: "Elaborate — Hands-on investigation",
      bodyText: `You will now apply what you've learned about ${topic} by working closely with ${resourceLabel}. This activity helps consolidate content knowledge while also developing source analysis, evidence selection, and written communication.`,
      bulletPoints: [],
      keyTerms: [], workedExample: null,  table: null,
      activitySteps: [
        `Read or scan ${resourceLabel} and identify three details that seem most important for understanding ${topic}.`,
        `Record one claim, one example, and one piece of evidence from the source using your own words.`,
        `Explain how each detail connects to the lesson objective and to the wider ${yearLevel} ${subject} curriculum.`,
        `Evaluate the source: What does ${resourceSource} explain well, and what perspective or information may be missing?`,
        `Find one additional Australian example, experiment, case study, or data point that supports or challenges the source.`,
        `Write a 3-sentence paragraph explaining how the original source and your extra example together deepen understanding of ${topic}.`,
      ],
      teacherNote: `Allow 12–15 minutes. Keep the selected resource visible on screen or in print. Foundation students can use a retrieval scaffold with columns labelled "claim", "evidence", and "meaning". Extension students should evaluate the source's perspective, compare it to another Australian source, and comment on how authorship shapes the message.${resourceLinkNote}`,
      backgroundTheme: "highlight" as const, emoji: "💻", timeMinutes: 15,
    },
    {
      slideNumber: 11, type: "discussion",
      heading: "Discussion Questions",
      subheading: "Evaluate — Three levels of thinking",
      bodyText: `Use evidence from ${resourceLabel} and today's lesson to support your responses. These questions are designed to push your thinking beyond recall and into analysis and evaluation — the skills most valued in ${yearLevel} ${subject} assessment.`,
      bulletPoints: [
        questions[0] ? `🟢 Foundation: ${questions[0].q}` : `🟢 Foundation: What are two important ideas about ${topic} that ${resourceSource} helps us understand clearly?`,
        questions[1] ? `🟡 Core: ${questions[1].q}` : `🟡 Core: Which part of ${resourceLabel} is most useful for understanding ${topic}, and why? Support your answer with source evidence.`,
        questions[2] ? `🔴 Extension: ${questions[2].q}` : `🔴 Extension: Evaluate the strengths and limitations of ${resourceLabel} as a source for studying ${topic}. What additional perspectives are needed?`,
      ],
      keyTerms: [], workedExample: null, table: null, activitySteps: [],
      teacherNote: `Assign questions by readiness group or allow student choice. After 5 minutes, use fishbowl structure: place 3–4 students in the centre to discuss the extension question while others observe and take notes. Debrief by asking: "What was the strongest piece of evidence you heard?"`,
      backgroundTheme: "white" as const, emoji: "💬", timeMinutes: 8,
    },
    {
      slideNumber: 12, type: "summary",
      heading: "Lesson Summary",
      subheading: "Consolidation — The big ideas from today",
      bodyText: `Today's lesson covered the core concepts, evidence, and applications of ${topic} within ${yearLevel} ${subject}. You used ${resourceLabel} as a concrete anchor for analysis, then connected it to the ${state} curriculum, real Australian examples, and future assessment tasks. Return to your learning intentions and rate your confidence again.`,
      bulletPoints: [
        `${topic} is a significant area of study in ${yearLevel} ${subject} with real-world relevance to ${state} and Australia.`,
        `${resourceLabel} gave us a concrete source to analyse rather than relying on abstract summaries alone.`,
        `Evidence-based reading, comparison, and evaluation are core skills when working with classroom resources on this topic.`,
        `Local Australian examples help students test, extend, or question the claims made in the selected source.`,
        `Today's learning connects to broader themes across ${yearLevel} ${subject} and future assessment tasks.`,
      ],
      keyTerms: [], workedExample: null, table: null, activitySteps: [],
      teacherNote: `Return to the confidence ratings from Slide 2. Ask: "Has your confidence in any learning intention changed? What is the one thing you are most confident about? What is one question you still have?" Collect exit tickets.`,
      backgroundTheme: "teal" as const, emoji: "✅", timeMinutes: 3,
    },
    {
      slideNumber: 13, type: "exit_ticket",
      heading: "Exit Ticket",
      subheading: "Complete before you leave — 4 minutes",
      bodyText: `Your exit ticket has three parts and should take no more than 4 minutes. Write your responses in your workbook or on the card provided. These responses inform your teacher's planning for the next lesson.`,
      bulletPoints: [],
      keyTerms: [], workedExample: null, table: null,
      activitySteps: [
        `RECALL: Name two key concepts or vocabulary terms from today's lesson on ${topic} and write a definition for each.`,
        `EXPLAIN: In two sentences, explain one important idea from ${resourceLabel} and how it connects to a real Australian example.`,
        `REFLECT: Rate your confidence in each learning intention from Slide 2 (1–5). Write one question you still have about ${topic} or about the source.`,
      ],
      teacherNote: `Collect exit tickets at the door. Sort into three piles: confident, developing, needs support. Use these to form targeted groups for the following lesson's opening activity or to plan a brief misconception-busting starter.`,
      backgroundTheme: "teal" as const, emoji: "📝", timeMinutes: 4,
    },
  ];

  return {
    title,
    subject,
    yearLevel,
    topic,
    totalMinutes: parseInt(duration) || 60,
    slides,
    usedFallback: true,
  };
}

// ─── Hardcoded demo-only fallback (only used if lessonPlan itself is absent) ──
const STATIC_DEMO = {
  title: "Climate Change & Australian Ecosystems",
  subject: "Science",
  yearLevel: "Year 9",
  topic: "Climate Change",
  totalMinutes: 60,
  slides: [
    {
      slideNumber: 1,
      type: "title",
      heading: "Climate Change & Australian Ecosystems",
      subheading: "Year 9 Science · Earth and Space Sciences · AC9S9U05–07",
      bodyText: "",
      bulletPoints: [],
      keyTerms: [],
      workedExample: null,
      table: null,
      activitySteps: [],
      teacherNote: "Welcome students. Display the slide and allow 30 seconds of silence for students to read the title and subheading. Ask: 'Based only on the title, what do you already know about this topic? What do you think you will learn today?' Take 2–3 responses before moving on.",
      backgroundTheme: "teal",
      emoji: "🌏",
      timeMinutes: 2
    },
    {
      slideNumber: 2,
      type: "objective",
      heading: "Learning Intentions & Success Criteria",
      subheading: "By the end of today's lesson, you will be able to:",
      bodyText: "Today's lesson aligns with Australian Curriculum v9 strand Earth and Space Sciences. We will work through evidence, causes, and local impacts of climate change using real Australian data from the Bureau of Meteorology (BOM) and CSIRO.",
      bulletPoints: [
        "Describe and explain the evidence for climate change using Australian temperature and rainfall records from BOM.",
        "Analyse the role of greenhouse gases — specifically CO₂, CH₄ and N₂O — in the enhanced greenhouse effect.",
        "Evaluate how climate change is affecting at least two Australian ecosystems with specific, data-backed examples.",
        "Construct an evidence-based argument using multiple independent scientific data sources."
      ],
      keyTerms: [],
      workedExample: null,
      table: null,
      activitySteps: [],
      teacherNote: "Read each success criterion aloud with the class. Ask students to rate their current confidence (1–5) on mini-whiteboards or in their workbooks. Return to these ratings at the end of the lesson as part of the exit ticket reflection. Emphasise that today's evidence comes from real Australian scientific organisations — not just textbooks.",
      backgroundTheme: "white",
      emoji: "🎯",
      timeMinutes: 3
    },
    {
      slideNumber: 3,
      type: "engage",
      heading: "Hook: The Great Barrier Reef — 25 Years Apart",
      subheading: "Engage — What do you notice? What do you wonder?",
      bodyText: "In 1999, aerial surveys showed approximately 1% of the Great Barrier Reef had experienced bleaching. In 2022, AIMS (Australian Institute of Marine Science) surveys recorded the most widespread bleaching event in recorded history — affecting 91% of surveyed reefs in a single season. Bleaching occurs when water temperatures rise above the coral's thermal tolerance for even a few weeks.",
      bulletPoints: [
        "1999: Less than 1% of surveyed reefs showed bleaching — a relatively healthy system.",
        "2016: First mass bleaching — 50% of shallow-water corals in northern sections died within months.",
        "2022: 91% of reefs surveyed showed bleaching — the most severe event on record.",
        "The reef contributes $6.4 billion annually to Australia's economy and supports 64,000 jobs."
      ],
      keyTerms: [],
      workedExample: null,
      table: null,
      activitySteps: [],
      teacherNote: "Display a split-screen image of the reef if available (AIMS or Reef Authority provide open-access images). Use 'Think-Pair-Share' — 60 seconds thinking, 60 seconds discussing with a partner, then take 3–4 class responses. Guide students toward the question: what external force could cause such rapid change across such a large area?",
      backgroundTheme: "dark",
      emoji: "🌊",
      timeMinutes: 7
    },
    {
      slideNumber: 4,
      type: "key_terms",
      heading: "Key Scientific Vocabulary",
      subheading: "Learn these terms — you will use them throughout today's lesson",
      bodyText: "Understanding climate science requires precise vocabulary. These terms appear in BOM reports, CSIRO publications, and your HSC examinations. Make sure you can use each term accurately in a sentence.",
      bulletPoints: [],
      keyTerms: [
        { term: "Greenhouse Effect", definition: "The natural process where certain atmospheric gases (CO₂, H₂O, CH₄) absorb outgoing infrared radiation from Earth's surface, warming the planet. Without it, Earth's average temperature would be –18°C." },
        { term: "Enhanced Greenhouse Effect", definition: "The intensification of the natural greenhouse effect caused by human additions of greenhouse gases — primarily from burning fossil fuels — causing global average temperatures to rise above natural levels." },
        { term: "Climate vs Weather", definition: "Weather is day-to-day atmospheric conditions (temperature, rainfall) at a specific location. Climate is the long-term average of weather patterns over 30+ years across a region." },
        { term: "Coral Bleaching", definition: "A stress response in corals where rising water temperature causes the coral to expel its symbiotic algae (zooxanthellae), turning white. Without algae, corals can starve and die within weeks." },
        { term: "Feedback Loop", definition: "A process where the effect of a change amplifies (positive feedback) or reduces (negative feedback) the original cause. Melting Arctic ice is a positive feedback — less white ice means more heat absorption." },
        { term: "Anthropogenic", definition: "Originating from human activity. Anthropogenic climate change refers specifically to the component of climate change driven by human actions, primarily the burning of fossil fuels since industrialisation (~1850)." }
      ],
      workedExample: null,
      table: null,
      activitySteps: [],
      teacherNote: "Have students copy these definitions into their workbooks before moving on. Then test using 'Definition Bingo' — read the definition aloud and students must call out the term. Alternatively, use the Frayer Model for two terms of your choice: definition, characteristics, example, non-example.",
      backgroundTheme: "purple",
      emoji: "📖",
      timeMinutes: 8
    },
    {
      slideNumber: 5,
      type: "theory",
      heading: "The Greenhouse Effect: How It Works",
      subheading: "Explain — The scientific mechanism",
      bodyText: "The Sun emits high-energy shortwave radiation that passes easily through the atmosphere and warms Earth's surface. Earth then re-emits this energy as lower-energy longwave (infrared) radiation. Greenhouse gases — primarily CO₂, CH₄, N₂O, and water vapour — absorb this outgoing infrared radiation and re-emit it in all directions, including back toward Earth's surface. This is the natural greenhouse effect, responsible for making Earth habitable at an average of 15°C. Human activity since 1850 has added significant quantities of additional greenhouse gases, intensifying this effect and pushing global temperatures above their natural range.",
      bulletPoints: [
        "Shortwave solar radiation (visible light) passes through greenhouse gases without being absorbed.",
        "Earth's surface absorbs solar energy and re-emits it as longwave infrared (heat) radiation.",
        "CO₂, CH₄, N₂O and H₂O molecules absorb outgoing infrared radiation and re-radiate it in all directions.",
        "Human emissions since 1850 have increased atmospheric CO₂ from 280 ppm to over 420 ppm — a 50% increase."
      ],
      keyTerms: [],
      workedExample: null,
      table: null,
      activitySteps: [],
      teacherNote: "Use the 'blanket analogy' to make this concrete: Earth is wrapped in a thicker and thicker blanket of gases. More blanket = more heat retained. Ask: 'If the blanket analogy is correct, what would happen if we kept adding more blanket?' Draw the radiation pathways on the whiteboard as you speak through the mechanism. Check understanding with a quick cold-call: 'Name one greenhouse gas. Why is CO₂ particularly significant?'",
      backgroundTheme: "white",
      emoji: "☀️",
      timeMinutes: 7
    },
    {
      slideNumber: 6,
      type: "theory",
      heading: "Australia's Temperature Record: The Evidence",
      subheading: "Explain — Reading real scientific data",
      bodyText: "The Bureau of Meteorology (BOM) has maintained continuous temperature records across Australia since 1910 using a network of over 700 weather stations. Analysis of this 100-year dataset provides unambiguous evidence of a warming trend. Australia's mean annual temperature has increased by 1.47°C since 1910 — slightly above the global average of 1.1°C. Crucially, this warming is not uniform across time: the rate has accelerated since 1950, and nine of Australia's ten hottest years on record have all occurred since 2005.",
      bulletPoints: [
        "Australia has warmed by 1.47°C since 1910 — based on over 700 BOM weather stations and 100+ years of continuous data.",
        "The rate of warming has accelerated: the period 2001–2023 is warming twice as fast as 1910–2000.",
        "9 of Australia's 10 hottest years have all occurred since 2005 — the statistical probability of this being random is less than 0.001%.",
        "Rainfall patterns are also shifting: southern Australia has experienced a 15–20% reduction in winter rainfall since the 1970s."
      ],
      keyTerms: [],
      workedExample: null,
      table: null,
      activitySteps: [],
      teacherNote: "If internet is available, open the BOM interactive temperature graph (bom.gov.au/climate/change) on the projector and show students the actual data in real time. Ask them to identify the trend line and describe it in their own words. Emphasise that the data comes from 700 independent measurement stations — this is not a single reading or a model prediction, it is observed physical measurement.",
      backgroundTheme: "white",
      emoji: "📈",
      timeMinutes: 6
    },
    {
      slideNumber: 7,
      type: "theory",
      heading: "Multiple Lines of Evidence",
      subheading: "Explain — Why scientists are confident",
      bodyText: "Scientific confidence in climate change comes not from a single data source but from multiple independent lines of evidence that all point to the same conclusion. This 'convergent evidence' principle is fundamental to the scientific method — when independent methods using different techniques and data produce the same result, confidence in that result is very high. The evidence for anthropogenic climate change comes from at least six independent sources, each using completely different measurement techniques.",
      bulletPoints: [],
      keyTerms: [],
      workedExample: null,
      table: {
        headers: ["Evidence Type", "Method", "What It Shows", "Timeframe"],
        rows: [
          ["Temperature Records", "BOM weather stations (700+)", "1.47°C warming since 1910", "100+ years"],
          ["Ice Core Data", "Antarctic drilling (Law Dome, Vostok)", "CO₂ levels highest in 800,000 years", "800,000 years"],
          ["Sea Level Rise", "Tide gauges + satellites", "+25 cm since 1880, accelerating", "140+ years"],
          ["Ocean Heat Content", "Argo float network (3,900 buoys)", "Oceans absorbing 93% of excess heat", "50 years"],
          ["Satellite Data", "NASA/CSIRO orbital measurements", "Ice sheets shrinking, coral bleaching", "40 years"],
          ["Atmospheric CO₂", "Mauna Loa + Cape Grim (Tasmania)", "280 ppm (1850) → 422 ppm (2024)", "170+ years"]
        ]
      },
      activitySteps: [],
      teacherNote: "Walk through each row of the table, pausing to ask: 'Why is it significant that these measurements use completely different techniques?' Emphasise that Cape Grim in Tasmania has been monitoring atmospheric CO₂ since 1976 and is one of the world's most important baseline stations — this is Australian science contributing to global understanding. Students should copy the table into their workbooks.",
      backgroundTheme: "white",
      emoji: "🔬",
      timeMinutes: 6
    },
    {
      slideNumber: 8,
      type: "theory",
      heading: "Impacts on Australian Ecosystems",
      subheading: "Elaborate — From global data to local consequences",
      bodyText: "Australia's unique biodiversity makes it particularly vulnerable to climate change. With 84% of its mammal species found nowhere else on Earth, species that cannot adapt or migrate quickly enough face local or global extinction. Climate change acts as a 'threat multiplier' — it doesn't replace existing threats like habitat loss, but it amplifies them, making already-stressed ecosystems less resilient. The following impacts are not predictions — they are observed, documented changes measured by AIMS, CSIRO, and the Murray-Darling Basin Authority.",
      bulletPoints: [
        "Great Barrier Reef: Mass bleaching events in 2016, 2017, 2020, 2022 and 2024 — five in nine years, compared to zero before 1998.",
        "Murray-Darling Basin: River flows have decreased by 40% since the 1990s, causing the 2019 Menindee fish kill (approximately 1 million fish dead in 72 hours).",
        "Alpine Ecosystems: Australia's snowfields have contracted by 30% since 1954 — the habitat of the mountain pygmy possum is critically threatened.",
        "Bushfire Season: CSIRO modelling shows climate change made the 2019–20 Black Summer conditions at least 30% more likely and 30% more intense."
      ],
      keyTerms: [],
      workedExample: null,
      table: null,
      activitySteps: [],
      teacherNote: "For each example, ask students: 'What ecosystem service does this provide? Who depends on it?' This connects the science to economics, culture, and First Nations relationships with Country. The Menindee fish kill is particularly effective for engagement — many students will remember seeing it in news coverage. Be sensitive to students who may have personal connections to the Black Summer fires.",
      backgroundTheme: "white",
      emoji: "🦘",
      timeMinutes: 7
    },
    {
      slideNumber: 9,
      type: "local_context",
      heading: "NSW Local Context: Black Summer 2019–20",
      subheading: "This happened here — and the science explains why",
      bodyText: "The 2019–20 Black Summer bushfires were the most devastating fire season in Australia's recorded history. From September 2019 to February 2020, approximately 18.6 million hectares burned across Australia — an area larger than the entire country of Syria, and more than three times the area burned in California's worst wildfire year on record. NSW experienced catastrophic fire conditions across regions that had never previously been classified as high fire-risk. The fires released an estimated 900 million tonnes of CO₂ — roughly double Australia's total annual emissions.",
      bulletPoints: [
        "18.6 million hectares burned nationally — 5.4 million hectares in NSW alone across 150+ fires.",
        "34 people died directly; over 400 additional deaths from smoke inhalation across eastern Australia.",
        "An estimated 3 billion animals were killed or displaced — including 143 million mammals, 180 million birds.",
        "CSIRO and Bureau analysis: climate change made the atmospheric conditions 30% more likely and extended the danger season by 4–6 weeks."
      ],
      keyTerms: [],
      workedExample: null,
      table: null,
      activitySteps: [],
      teacherNote: "Many students will have personal connections to these fires — family members who were affected, evacuations, smoke events. Create psychological safety by acknowledging: 'Some of you may have personal memories of this time. That's exactly why this science matters — it connects to real lives.' Avoid 'doom-framing' — follow the science with action-oriented discussion.",
      backgroundTheme: "dark",
      emoji: "🔥",
      timeMinutes: 5
    },
    {
      slideNumber: 10,
      type: "worked_example",
      heading: "Worked Example: Interpreting a Climate Graph",
      subheading: "Extend — Applying scientific skills to real BOM data",
      bodyText: "A critical skill in Year 9 Science is reading and interpreting scientific graphs. Climate scientists use temperature anomaly graphs — rather than absolute temperature — to show how current temperatures compare to a historical baseline (usually the 1961–1990 average). A positive anomaly means warmer than average; negative means cooler. This type of graph is used by BOM, NASA, and CSIRO in all official climate reporting.",
      bulletPoints: [],
      keyTerms: [],
      workedExample: {
        problem: "The BOM graph shows Australia's annual mean temperature anomaly from 1910 to 2023 (baseline: 1961–1990 average = 0°C). In 1910, the anomaly was −0.5°C. In 2019, the anomaly was +1.52°C. In 2023, the anomaly was +0.9°C. Answer the following questions.",
        steps: [
          "Step 1 — Calculate total change: The change from 1910 to 2019 = 1.52 − (−0.5) = +2.02°C above the 1910 baseline.",
          "Step 2 — Calculate rate of change: Time period = 2019 − 1910 = 109 years. Rate = 2.02°C ÷ 109 years = 0.0185°C per year, or approximately 0.19°C per decade.",
          "Step 3 — Interpret the 2023 anomaly: +0.9°C means 2023 was 0.9°C warmer than the 1961–1990 average — still significantly above baseline despite being cooler than 2019.",
          "Step 4 — Identify the trend: Despite year-to-year variation (2023 cooler than 2019), the long-term trend line continues upward. Individual years vary due to La Niña/El Niño cycles.",
          "Step 5 — Draw a conclusion: The data shows a consistent warming trend over 113 years, with acceleration after 1980. This is consistent with increased atmospheric CO₂ concentrations over the same period."
        ],
        answer: "Australia has warmed approximately 2°C since 1910. The rate of warming is approximately 0.19°C per decade and has been accelerating since the 1980s, consistent with increased global greenhouse gas emissions."
      },
      table: null,
      activitySteps: [],
      teacherNote: "Model each step on the whiteboard while students follow along in their workbooks. After Step 4, pause and ask: 'Why might 2023 be cooler than 2019 even though the long-term trend is upward?' (La Niña year). This is a crucial distinction between short-term variation and long-term trend — a common misconception. Have students complete a similar calculation for their local BOM station using the data portal.",
      backgroundTheme: "highlight",
      emoji: "📊",
      timeMinutes: 8
    },
    {
      slideNumber: 11,
      type: "activity",
      heading: "Student Investigation: Your Local Climate Data",
      subheading: "Elaborate — Hands-on data analysis",
      bodyText: "You will now use the Bureau of Meteorology's Climate Data Online portal to investigate temperature trends at your local weather station. This is the same data source used by professional climate scientists. Your task is to collect temperature data, calculate a rate of change, and evaluate whether your local trends are consistent with the national pattern.",
      bulletPoints: [],
      keyTerms: [],
      workedExample: null,
      table: null,
      activitySteps: [
        "Go to bom.gov.au → Climate → Climate Data Online → Monthly temperature data",
        "Search for your nearest NSW weather station (e.g. Sydney Observatory Hill, Parramatta, Newcastle Airport)",
        "Record the mean annual temperature for: 1930, 1950, 1970, 1990, 2010, and 2020",
        "Plot these six data points on the graph grid provided in your workbook (x-axis: year, y-axis: temperature in °C)",
        "Draw a line of best fit through your plotted points",
        "Calculate the rate of temperature change: (2020 temp − 1930 temp) ÷ 90 years = °C per year",
        "Write a 3-sentence conclusion: What trend does your data show? How does it compare to the national average? What are two limitations of your data?"
      ],
      teacherNote: "Allow 15 minutes for this activity. Circulate to support data recording — the BOM website can be slightly confusing to navigate at first. Foundation/support students: provide a pre-filled data table and pre-drawn graph axes. Extension students: ask them to find a second weather station and compare urban vs rural temperature trends (urban heat island effect). Ensure every student completes at least the data collection before moving to the discussion slide.",
      backgroundTheme: "highlight",
      emoji: "💻",
      timeMinutes: 15
    },
    {
      slideNumber: 12,
      type: "discussion",
      heading: "Discussion: Evidence, Response & Responsibility",
      subheading: "Evaluate — Higher-order thinking across ability levels",
      bodyText: "Science does not exist in isolation from society. Climate change is not just a scientific question — it raises questions about responsibility, policy, economics, and ethics. The following questions are designed to push your thinking beyond recall and into analysis and evaluation. Use evidence from today's lesson to support your responses.",
      bulletPoints: [
        "🟢 Foundation: Describe two pieces of scientific evidence that support the conclusion that Earth's climate is warming. Use specific data in your answer.",
        "🟡 Core: Your local BOM data shows a warming trend of 0.18°C per decade. The global average is 0.19°C per decade. Explain what this comparison tells you about climate change, and identify one factor that might cause local data to differ from the global average.",
        "🔴 Extension: Evaluate the claim: 'Because climate records only go back to 1910 in Australia, we cannot be certain that current warming is unusual compared to pre-industrial conditions.' In your response, refer to at least two alternative evidence types that extend the record beyond 1910."
      ],
      keyTerms: [],
      workedExample: null,
      table: null,
      activitySteps: [],
      teacherNote: "Use 'fishbowl' structure: 4 students in the centre discuss the extension question while others observe and take notes. Alternatively, assign questions by ability group and share out answers. Encourage students to use the vocabulary from Slide 4 in their responses. For the extension question, guide students toward ice core data and tree ring analysis as pre-1910 evidence sources.",
      backgroundTheme: "white",
      emoji: "💬",
      timeMinutes: 8
    },
    {
      slideNumber: 13,
      type: "summary",
      heading: "Lesson Summary: The Big Ideas",
      subheading: "Consolidation — What have we established today?",
      bodyText: "Today's lesson covered the mechanism, evidence, and impacts of climate change with a focus on Australia. You have used real data from BOM, CSIRO, and AIMS to build an evidence-based understanding — the same data used by working scientists and policymakers. These ideas connect directly to your HSC assessments and to the world you will inherit and shape.",
      bulletPoints: [
        "The enhanced greenhouse effect is caused by human additions of CO₂, CH₄, and N₂O — primarily from burning fossil fuels since 1850.",
        "Scientific confidence in climate change comes from six independent lines of evidence using completely different measurement techniques.",
        "Australia has warmed by 1.47°C since 1910 — faster than the global average — with nine of the ten hottest years occurring after 2005.",
        "Australian ecosystems (Great Barrier Reef, Murray-Darling Basin, alpine regions) are already experiencing measurable, documented impacts.",
        "Climate change 'threat multiplies' existing pressures — it does not replace them but makes stressed systems significantly less resilient."
      ],
      keyTerms: [],
      workedExample: null,
      table: null,
      activitySteps: [],
      teacherNote: "Return to the confidence ratings students gave at the start of the lesson (Slide 2). Ask: 'Has your confidence in any of these learning intentions changed? What is one thing you now understand that you didn't at the start?' Collect the exit ticket (below) before students leave.",
      backgroundTheme: "teal",
      emoji: "✅",
      timeMinutes: 3
    },
    {
      slideNumber: 14,
      type: "exit_ticket",
      heading: "Exit Ticket",
      subheading: "Complete before you leave — this is your proof of learning today",
      bodyText: "Your exit ticket has three parts. It should take no more than 4 minutes to complete. Write your responses in your workbook or on the card provided by your teacher. These responses help your teacher understand where the class is at and plan the next lesson.",
      bulletPoints: [],
      keyTerms: [],
      workedExample: null,
      table: null,
      activitySteps: [
        "RECALL: Name two greenhouse gases AND state one human activity that produces each.",
        "EXPLAIN: In two sentences, explain why Australia's temperature data from 700 BOM weather stations is considered strong evidence for climate change.",
        "REFLECT: Write one question you still have about climate change after today's lesson — or one idea that surprised you."
      ],
      teacherNote: "Collect exit tickets at the door as students leave. Sort into three piles: confident (both parts answered correctly), developing (one part answered correctly), needs support (significant misconceptions or blank). Use this to form targeted groups for the following lesson's 5-minute starter activity. Common misconception to watch for: students confusing weather with climate in Part 2.",
      backgroundTheme: "teal",
      emoji: "📝",
      timeMinutes: 4
    }
  ],
  usedFallback: true,
};

router.post("/slides", async (req, res): Promise<void> => {
  const body = req.body as {
    lessonPlan?: Record<string, unknown>;
    unitContext?: Record<string, string>;
    alignmentResult?: Record<string, unknown>;
    selectedResource?: SlideResourceContext;
    subject?: string; yearLevel?: string; topic?: string; state?: string;
  };

  const { lessonPlan, unitContext, alignmentResult, selectedResource, subject, yearLevel, topic, state } = body;

  if (!lessonPlan) {
    res.status(400).json({ error: "lessonPlan is required" });
    return;
  }

  const lessonJson = JSON.stringify(lessonPlan, null, 2);
  const unitNote = unitContext?.unitTitle
    ? `Unit: "${unitContext.unitTitle}" — Lesson ${unitContext.currentLesson || "?"} of ${unitContext.totalLessons || "?"}. Learning intention: ${unitContext.learningIntention || "not specified"}.`
    : "";
  const resourceNote = selectedResource?.title
    ? `PRIMARY CLASSROOM RESOURCE:
- Title: ${selectedResource.title}
- Source: ${selectedResource.source || "Unknown source"}
- Type: ${selectedResource.type || "Resource"}
- Description: ${selectedResource.description || "No description provided"}
- URL: ${selectedResource.url || "No direct link provided"}
`
    : "";

  const prompt = `You are an expert Australian secondary school educator creating a polished, classroom-ready slide deck on "${topic}" for ${yearLevel} ${subject} students in ${state}.

LESSON CONTEXT:
- Year Level: ${yearLevel}
- Subject: ${subject}
- Topic: "${topic}"
- State: ${state}
- Curriculum alignment: ${JSON.stringify(alignmentResult || {})}
${unitNote}
${resourceNote}

SOURCE LESSON PLAN (use as context only — do NOT copy its pedagogical stage labels into slide headings):
${lessonJson}

═══════════════════════════════════════════════
CRITICAL RULES — MUST follow every single one:
═══════════════════════════════════════════════

RULE 1 — UNIQUE CONTENT PER SLIDE
Each slide must cover a DISTINCT sub-concept or aspect of "${topic}". No sentence, bullet point, statistic, or example may be repeated across more than one slide. If you find yourself writing the same idea twice, stop and choose a different angle for that slide.

RULE 2 — TOPIC-SPECIFIC HEADINGS ONLY
Slide headings must describe WHAT THE SLIDE TEACHES about ${topic}. NEVER use pedagogical stage labels as headings. These are BANNED as headings: "Hook", "Explore", "Analyse", "Evaluate", "Reflect", "Elaborate", "Engage", "Explain", "Elicit", "Extend", "Activity", "Discussion", "Summary", "Objective". Use content headings instead. GOOD: "The Causes of World War I — Militarism and Alliance Systems". BAD: "Hook: Why Does This Matter?".

RULE 3 — EACH THEORY SLIDE COVERS A DIFFERENT ANGLE
The 4 theory slides (slides 5–8) must each focus on a genuinely different dimension of "${topic}":
  - Slide 5: Definition and foundational concepts — what is ${topic}? What are the core ideas?
  - Slide 6: Mechanisms, causes or processes — how does it work? Why does it happen?
  - Slide 7: Evidence, data and research — what do Australian sources (BOM, CSIRO, ABS, ACARA, AIHW, named research bodies) say?
  - Slide 8: Impacts, consequences and stakeholder perspectives — who is affected and how?

RULE 4 — COMPLETE SENTENCES ONLY
bulletPoints must be complete sentences of 15–25 words each. NEVER write fragment phrases like "Rising temperatures" or "Evidence shows impact". Write full explanatory sentences with specific data.

RULE 5 — REAL AUSTRALIAN SOURCES
All statistics, examples, and data must come from REAL Australian organisations: BOM, CSIRO, AIMS, ABS, AIHW, ACARA, state curriculum authorities, or named Australian universities or government agencies. Never invent statistics.

RULE 6 — TEACHER NOTES ARE PRACTICAL INSTRUCTIONS
teacherNote (minimum 60 words each): specific classroom strategies (Think-Pair-Share, cold calling, fishbowl, whiteboard activities), timing guidance, and differentiation for foundation/extension students. Must be directly usable instructions, not generic commentary.

RULE 7 — WORKED EXAMPLE IS FULLY SOLVED
workedExample must show a complete worked solution with 5 explicit numbered steps showing all working — not a summary or outline.

RULE 8 — ACTIVITY STEPS ARE STUDENT-ACTIONABLE
activitySteps must be numbered, concrete, and specific enough that a student can follow each step independently without clarification.

RULE 9 — USE THE SELECTED RESOURCE AS THE ANCHOR TEXT
If a primary classroom resource is provided, the slide deck must be clearly anchored in that source. Refer to its title, source, evidence, examples, and likely classroom use throughout the deck. Do not write generic slides that could apply to any resource. If the provided description is limited, stay faithful to the metadata we have and do not invent direct quotations or inaccessible details.

SLIDE SCHEMA — return this exact structure for every slide:
{
  "slideNumber": number,
  "type": "title" | "objective" | "engage" | "key_terms" | "theory" | "local_context" | "worked_example" | "activity" | "discussion" | "summary" | "exit_ticket",
  "heading": string,
  "subheading": string,
  "bodyText": string,
  "bulletPoints": string[],
  "keyTerms": [{"term": string, "definition": string}],
  "workedExample": {"problem": string, "steps": string[], "answer": string} | null,
  "table": {"headers": string[], "rows": string[][]} | null,
  "activitySteps": string[],
  "teacherNote": string,
  "backgroundTheme": "teal" | "white" | "dark" | "highlight" | "purple",
  "emoji": string,
  "timeMinutes": number
}

REQUIRED SLIDE STRUCTURE — exactly 14 slides:
1. TITLE (teal) — Topic title with curriculum strand and year level in subheading. bodyText: empty string "". timeMinutes: 2
2. OBJECTIVE (white) — 4 learning intention bullet points (complete sentences), bodyText explains curriculum context for this topic. timeMinutes: 3
3. ENGAGE (dark) — A striking Australian statistic, case study, or recent event that hooks students into ${topic}. Full bodyText (4–5 sentences) giving the context behind the hook. 4 bullet points with specific data. timeMinutes: 7
4. KEY_TERMS (purple) — 5–7 topic-specific vocabulary terms with precise, age-appropriate definitions in keyTerms array. bodyText explains why mastering this vocabulary matters for ${yearLevel} assessment. timeMinutes: 8
5. THEORY — What Is "${topic}"? (white) — Definition and foundational concepts. Full bodyText (4–5 sentences). 4 complete-sentence bullet points covering distinct foundational ideas. timeMinutes: 6
6. THEORY — Mechanisms and Causes (white) — How ${topic} works: processes, causes, contributing factors. Full bodyText. Use a table (headers + rows) OR 4 bullet points — choose whichever is clearer for this content. timeMinutes: 6
7. THEORY — Evidence and Data (white) — What Australian research shows. Full bodyText citing real sources. 4 bullet points each with a specific statistic or named finding from a real Australian body. timeMinutes: 6
8. THEORY — Impacts and Consequences (white) — Who is affected by ${topic} in Australia and how. Full bodyText. 4 bullet points covering different stakeholder groups or impact types. timeMinutes: 7
9. LOCAL_CONTEXT (dark) — A specific ${state} example or case study directly related to ${topic}. Full bodyText with named local details (organisations, places, data). 3 bullet points with local specifics. timeMinutes: 5
10. WORKED_EXAMPLE (highlight) — A fully worked problem, analysis task, or source interpretation relevant to ${topic} at ${yearLevel} level. bodyText explains the skill being practised. workedExample object with problem, 5 explicit solution steps, and a final answer. timeMinutes: 8
11. ACTIVITY (highlight) — 6–8 numbered student task steps for an investigation or analysis activity about ${topic}. bodyText explains the purpose and learning outcome. timeMinutes: 15
12. DISCUSSION (white) — 3 tiered discussion questions as bullet points: 🟢 Foundation (recall/describe), 🟡 Core (explain/analyse), 🔴 Extension (evaluate/judge). bodyText frames why these questions develop ${yearLevel} ${subject} skills. timeMinutes: 8
13. SUMMARY (teal) — 5 complete-sentence bullet points summarising the 5 most important ideas from today's lesson. bodyText connects learning to future assessment and broader study. timeMinutes: 3
14. EXIT_TICKET (teal) — 3 numbered exit tasks: RECALL (name/define), EXPLAIN (connect to evidence), REFLECT (confidence rating + remaining question). bodyText sets expectations for the exit activity. timeMinutes: 4

Return ONLY valid JSON — no markdown fences, no code blocks, no commentary:
{
  "title": string,
  "subject": string,
  "yearLevel": string,
  "topic": string,
  "totalMinutes": number,
  "slides": [ ...exactly 14 slides... ]
}`;

  // Retry up to 2 times on rate-limit (429) errors with exponential back-off
  const MAX_RETRIES = 2;
  let lastErr: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      const delayMs = attempt * 2000; // 2 s, then 4 s
      req.log.info(`Slides: retry attempt ${attempt} after ${delayMs}ms`);
      await new Promise(r => setTimeout(r, delayMs));
    }
    try {
      const groqCall = callCurriculumAI({
        prompt,
        maxTokens: 8000,
        temperature: 0.45,
      });
      const timedOut = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Groq timeout")), TIMEOUT_MS)
      );
      const completion = await Promise.race([groqCall, timedOut]);
      const cleaned = completion.text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const reviewed = await reviewCurriculumFaithfulness({
        promptContext: `Slide deck generation for ${yearLevel} ${subject} in ${state} on "${topic}".
Curriculum alignment: ${JSON.stringify(alignmentResult || {})}
Selected resource: ${selectedResource?.title || "none"} from ${selectedResource?.source || "none"}
Lesson plan context:
${lessonJson}`,
        draftJson: cleaned,
        maxTokens: 8000,
      });
      const reviewedCleaned = reviewed.text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(reviewedCleaned);
      res.json({ ...parsed, usedFallback: false, aiProvider: completion.provider, curriculumReviewedBy: reviewed.provider });
      return;
    } catch (err: unknown) {
      lastErr = err;
      // Only retry on rate-limit errors
      const isRateLimit = err && typeof err === "object" && "status" in err && (err as { status: number }).status === 429;
      if (!isRateLimit || attempt === MAX_RETRIES) break;
      req.log.warn({ err }, `Slides: rate limited (429), will retry (attempt ${attempt + 1}/${MAX_RETRIES})`);
    }
  }

  // All retries exhausted — build a dynamic topic-specific fallback from the lesson plan data
  req.log.warn({ err: lastErr }, "Slides: AI call failed after retries, using dynamic topic fallback");
  res.json(buildDynamicFallback(
    lessonPlan,
    subject   ?? "General",
    yearLevel ?? "Secondary",
    topic     ?? "This Topic",
    state     ?? "Australia",
    selectedResource
  ));
});

export default router;
