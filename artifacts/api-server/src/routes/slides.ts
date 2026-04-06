import { Router, type IRouter } from "express";
import { groq, GROQ_MODEL } from "../lib/groq";

const router: IRouter = Router();
const TIMEOUT_MS = 20000;

const MOCK_SLIDES = {
  title: "Climate Change & Australian Ecosystems",
  slides: [
    { slideNumber: 1, type: "title", heading: "Climate Change & Australian Ecosystems", bulletPoints: ["Year 9 Science · NSW Curriculum", "Earth and Space Sciences · AC9S9U05–07"], teacherNote: "Welcome students and introduce today's lesson objectives.", backgroundTheme: "teal", emoji: "🌏" },
    { slideNumber: 2, type: "objective", heading: "Learning Intentions & Success Criteria", bulletPoints: ["Investigate evidence for climate change using Australian data", "Evaluate the impact of greenhouse gases on Australian environments", "Analyse BOM and CSIRO datasets to identify trends"], teacherNote: "Display and discuss success criteria. Ask students: 'What does success look like today?'", backgroundTheme: "white", emoji: "🎯" },
    { slideNumber: 3, type: "content", heading: "Hook: Two Images, One Story", bulletPoints: ["Great Barrier Reef: 1999 vs 2024", "14% of reef bleached in 2016 — 91% in 2022", "Question: What story does this data tell?"], teacherNote: "Use split-screen display. Allow 2 minutes for think-pair-share before taking responses.", backgroundTheme: "white", emoji: "🌊" },
    { slideNumber: 4, type: "content", heading: "What Is the Greenhouse Effect?", bulletPoints: ["Solar energy enters Earth's atmosphere", "Greenhouse gases (CO₂, CH₄, N₂O) trap heat", "Human activities increase concentration", "Result: rising global and Australian temperatures"], teacherNote: "Use the blanket analogy: greenhouse gases act like a thicker blanket around Earth.", backgroundTheme: "white", emoji: "☀️" },
    { slideNumber: 5, type: "content", heading: "Australia's Temperature Record", bulletPoints: ["Average temperature has risen 1.47°C since 1910 (BOM)", "9 of 10 hottest years have occurred since 2005", "Rainfall patterns shifting across southern Australia", "Extreme weather events intensifying"], teacherNote: "Bring up the BOM interactive graph and show the trend in real time if internet is available.", backgroundTheme: "white", emoji: "📈" },
    { slideNumber: 6, type: "content", heading: "Evidence: Multiple Lines of Proof", bulletPoints: ["Temperature records (100+ years, BOM stations)", "Ice core data showing CO₂ levels over 800,000 years", "Sea level rise: 25cm since 1880", "Satellite data: shrinking ice sheets, coral bleaching"], teacherNote: "Emphasise the concept of convergent evidence — multiple independent data sources pointing to the same conclusion.", backgroundTheme: "white", emoji: "🔬" },
    { slideNumber: 7, type: "content", heading: "Impacts on Australian Ecosystems", bulletPoints: ["Great Barrier Reef: mass bleaching events (2016, 2017, 2020, 2022)", "Murray-Darling Basin: reduced flows, fish die-offs", "Alpine ecosystems: snow line retreating upward", "Shifting rainfall: drying south, wetting north"], teacherNote: "Students should be building their own notes at this point. Circulate and check understanding.", backgroundTheme: "white", emoji: "🦘" },
    { slideNumber: 8, type: "content", heading: "Human Activity: Cause & Effect", bulletPoints: ["Fossil fuels account for 75% of global GHG emissions", "Australia = 15th highest per-capita emitter", "Land clearing: major source of Australian emissions", "Transition to renewables: solar and wind capacity tripling"], teacherNote: "This is a good moment to address the 'what can we do?' question students often ask.", backgroundTheme: "white", emoji: "🏭" },
    { slideNumber: 9, type: "local_context", heading: "NSW Local Context: The Black Summer", bulletPoints: ["2019–20: 18.6 million hectares burned across Australia", "Area larger than Syria — or the entire state of Syria", "Linked to record temperatures and prolonged drought", "CSIRO: climate change made conditions 30% more likely"], teacherNote: "Many students will have personal connections to the fires. Create space for this. Acknowledge that this is a challenging but important topic.", backgroundTheme: "dark", emoji: "🔥" },
    { slideNumber: 10, type: "activity", heading: "Your Turn: Data Investigation", bulletPoints: ["Open CSIRO Climate Data Portal (link on Classroom)", "Select your local NSW weather station", "Record temperature data for: 1920, 1950, 1980, 2000, 2020", "Calculate: rate of change per decade", "Create a line graph of your findings"], teacherNote: "Allow 15 minutes. Circulate to support data recording. Foundation students can use pre-filled data tables.", backgroundTheme: "highlight", emoji: "💻" },
    { slideNumber: 11, type: "discussion", heading: "Discussion Questions", bulletPoints: ["Foundation: Name two pieces of evidence that support climate change in Australia.", "Core: Explain how your local data compares to the national trend. What factors explain the difference?", "Extension: Evaluate the limitations of temperature records as evidence. What other data types would strengthen the argument?"], teacherNote: "Use fishbowl structure or think-pair-share. Encourage students to use evidence in their responses, not just opinion.", backgroundTheme: "white", emoji: "💬" },
    { slideNumber: 12, type: "summary", heading: "Summary & Exit Ticket", bulletPoints: ["Climate change is supported by multiple independent lines of evidence", "Australia is warming faster than the global average", "Australian ecosystems are already being affected", "Human activity is the primary driver of observed changes"], teacherNote: "Exit ticket: 'Write one piece of evidence you found most convincing and one question you still have.' Collect before students leave.", backgroundTheme: "teal", emoji: "✅" },
  ],
  usedFallback: true,
};

router.post("/slides", async (req, res): Promise<void> => {
  const body = req.body as {
    lessonPlan?: Record<string, unknown>;
    unitContext?: Record<string, string>;
    alignmentResult?: Record<string, unknown>;
    subject?: string; yearLevel?: string; topic?: string; state?: string;
  };

  const { lessonPlan, unitContext, alignmentResult, subject, yearLevel, topic, state } = body;

  if (!lessonPlan) {
    res.status(400).json({ error: "lessonPlan is required" });
    return;
  }

  const lessonJson = JSON.stringify(lessonPlan, null, 2);
  const unitNote = unitContext?.unitTitle
    ? `Unit: "${unitContext.unitTitle}" — Lesson ${unitContext.currentLesson || "?"} of ${unitContext.totalLessons || "?"}. Learning intention: ${unitContext.learningIntention || "not specified"}. Success criteria: ${unitContext.successCriteria || "not specified"}.`
    : "";

  const prompt = `Convert this lesson plan into a complete slide deck for classroom presentation.

Context: ${yearLevel} ${subject} · ${topic} · ${state}${unitNote ? `\n${unitNote}` : ""}
Alignment: ${JSON.stringify(alignmentResult || {})}

Lesson plan:
${lessonJson}

Return ONLY valid JSON, no markdown:
{
  "title": string,
  "slides": [
    {
      "slideNumber": number,
      "type": "title" | "objective" | "content" | "activity" | "discussion" | "local_context" | "assessment" | "summary",
      "heading": string,
      "bulletPoints": string[],
      "teacherNote": string,
      "backgroundTheme": "teal" | "white" | "dark" | "highlight",
      "emoji": string
    }
  ]
}

Generate exactly 12 slides:
Slide 1: Title slide with lesson title, year level, date
Slide 2: Learning intentions and success criteria
Slide 3: Hook/engagement activity
Slides 4-8: Core content (one concept per slide, max 4 bullet points each)
Slide 9: Local Australian context (state-specific example)
Slide 10: Student activity instructions
Slide 11: Discussion questions (Foundation, Core, Extension)
Slide 12: Summary and exit ticket

Make bulletPoints short and classroom-readable (max 10 words each). TeacherNote should be practical teaching tips.`;

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
    req.log.warn({ err }, "AI slides call failed, using fallback");
    res.json(MOCK_SLIDES);
  }
});

export default router;
