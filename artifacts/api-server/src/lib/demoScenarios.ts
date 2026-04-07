export type DemoScenario = {
  key: string;
  alignment: {
    alignmentScore: number;
    syllabus: string;
    strand: string;
    outcomes: { id: string; description: string }[];
    notes: string;
    usedFallback: boolean;
  };
  resources: {
    resources: {
      id: string; title: string; url?: string; source: string; type: string;
      description: string; alignmentScore: number; safetyRating: string;
      biasFlag: string; localContextTags: string[]; outcomeIds: string[];
      whyThisResource: string;
    }[];
    usedFallback: boolean;
  };
  lesson: {
    objective: string; duration: string;
    activities: { label: string; text: string }[];
    localExample: { title: string; body: string };
    questions: { q: string; difficulty: string }[];
    usedFallback: boolean;
  };
};

const DEMO_SCENARIOS: DemoScenario[] = [
  {
    key: "year9-nsw-science-climate",
    alignment: {
      alignmentScore: 96, syllabus: "NSW Science Year 9",
      strand: "Earth and Space Sciences",
      outcomes: [
        { id: "AC9S9U05", description: "Investigate and explain the evidence for climate change including the role of greenhouse gases, and evaluate the potential impacts on Australian and global environments." },
        { id: "AC9S9U06", description: "Describe how human activities affect the distribution and availability of natural resources including water, minerals and fossil fuels in Australia." },
        { id: "AC9S9U07", description: "Analyse data and information about Australia's changing climate and explain the role of human activity in driving observed changes." },
      ],
      notes: "Climate Change is a flagship topic for Stage 5 Earth and Space Sciences. Direct curriculum match across three core outcomes.",
      usedFallback: false,
    },
    resources: {
      resources: [
        {
          id: "csiro-climate-evidence", title: "Australia's Changing Climate — Evidence and Projections",
          url: "https://www.csiro.au/en/research/environmental-impacts/climate-change/climate-change-qa",
          source: "CSIRO", type: "Lesson Plan", alignmentScore: 96,
          safetyRating: "verified", biasFlag: "low",
          description: "Comprehensive CSIRO resource using real datasets to investigate temperature records, sea-level rise, and extreme weather events across Australia over 100 years.",
          localContextTags: ["CSIRO Data", "Bureau of Meteorology", "Australian Regions"],
          outcomeIds: ["AC9S9U05", "AC9S9U07"],
          whyThisResource: "CSIRO's peer-reviewed datasets give students access to the same data used by Australian climate scientists, directly supporting AC9S9U05's requirement to evaluate evidence about Earth's changing systems.",
        },
        {
          id: "abc-climate-backyard", title: "Climate Science in Your Backyard",
          url: "https://education.abc.net.au/home#!/media/2585870/climate-science",
          source: "ABC Education", type: "Interactive", alignmentScore: 89,
          safetyRating: "verified", biasFlag: "low",
          description: "Video series and interactive activities connecting local weather observations to broader climate patterns across different Australian ecosystems — from the Barrier Reef to the Murray-Darling Basin.",
          localContextTags: ["ABC Education", "Local Context", "Great Barrier Reef"],
          outcomeIds: ["AC9S9U05", "AC9S9U06"],
          whyThisResource: "ABC Education contextualises climate change using familiar Australian landscapes, making abstract greenhouse gas concepts tangible and personally relevant for Year 9 NSW students.",
        },
        {
          id: "bom-climate-explorer", title: "Climate Data Explorer",
          url: "http://www.bom.gov.au/climate/data/",
          source: "Bureau of Meteorology", type: "Assessment", alignmentScore: 83,
          safetyRating: "verified", biasFlag: "low",
          description: "Interactive data portal with 100+ years of BOM weather station records. Students conduct genuine scientific inquiry using the same tools as professional meteorologists.",
          localContextTags: ["Official Government Data", "Real-time Data", "Scientific Inquiry"],
          outcomeIds: ["AC9S9U06", "AC9S9U07"],
          whyThisResource: "Using live BOM data turns assessment into authentic scientific inquiry — students practise real data analysis skills while satisfying AC9S9U06 and AC9S9U07 simultaneously.",
        },
      ],
      usedFallback: false,
    },
    lesson: {
      objective: "Students investigate and evaluate evidence for climate change in Australia using CSIRO and BOM data, developing scientific inquiry skills aligned with Earth and Space Sciences outcomes AC9S9U05, AC9S9U06, and AC9S9U07.",
      duration: "60 minutes",
      activities: [
        { label: "Hook (5 min)", text: "Display before-and-after satellite images of the Great Barrier Reef bleaching events (2016–2024). Ask: 'What story does this data tell, and what might happen by 2050?'" },
        { label: "Explore (20 min)", text: "Students navigate CSIRO's interactive climate data portal and record temperature trend data for their local NSW region across 1920–2024. Complete the guided data collection worksheet, noting the rate of change per decade." },
        { label: "Analyse (15 min)", text: "Groups create graphs from their collected data and compare local NSW temperature trends against the national average. Identify the 'hockey stick' inflection point and discuss possible causes (natural variability vs. human activity)." },
        { label: "Evaluate (15 min)", text: "Class discussion: What constitutes strong scientific evidence? Students evaluate the reliability of BOM temperature records, CSIRO modelling, and satellite data. Debate: could this data be misinterpreted, and how?" },
        { label: "Reflect (5 min)", text: "Exit ticket: Students record one piece of evidence they found most convincing, one limitation of the data, and one question they still have about the Australian climate system." },
      ],
      localExample: {
        title: "The 2019–20 Black Summer Bushfires — A Climate Data Case Study",
        body: "The 2019–20 Black Summer season burned 18.6 million hectares across southeastern Australia — an area larger than Syria — and killed or displaced an estimated 3 billion animals. Long-term BOM temperature records show the preceding decade was the hottest and driest on record. Scientists at CSIRO have directly linked the fire conditions to decades of rising temperatures and reduced winter rainfall — making this a powerful, locally resonant case study for AC9S9U05.",
      },
      questions: [
        { q: "Using the CSIRO data, describe two ways Australia's average temperature has changed since 1950.", difficulty: "foundation" },
        { q: "What is the difference between weather and climate? Give an Australian example of each.", difficulty: "foundation" },
        { q: "Explain how the BOM data you collected supports or challenges the claim that Australia is experiencing human-caused climate change. Use two pieces of evidence.", difficulty: "core" },
        { q: "Compare the temperature trends in NSW with the national average. What geographic or human factors might explain any differences?", difficulty: "core" },
        { q: "Critically evaluate the limitations of using historical temperature records as the primary evidence for climate change. What additional data types would strengthen the argument, and how might confirmation bias affect a researcher's interpretation?", difficulty: "extension" },
      ],
      usedFallback: false,
    },
  },
  {
    key: "year9-nsw-maths-algebra",
    alignment: {
      alignmentScore: 94, syllabus: "NSW Mathematics Year 9",
      strand: "Algebra",
      outcomes: [
        { id: "AC9M9A01", description: "Apply the exponent laws to numerical expressions with integer exponents and extend to variables." },
        { id: "AC9M9A02", description: "Expand, factorise and simplify algebraic expressions including binomial products and perfect squares." },
        { id: "AC9M9A03", description: "Find the gradient of a straight line and solve problems involving linear equations and inequalities." },
      ],
      notes: "Algebra is the core strand for Year 9 Mathematics and directly maps to three foundational NSW outcomes.",
      usedFallback: false,
    },
    resources: {
      resources: [
        {
          id: "khan-algebra-nsw", title: "Algebraic Reasoning — NSW Curriculum Aligned",
          url: "https://www.khanacademy.org/math/algebra",
          source: "Khan Academy", type: "Interactive", alignmentScore: 92,
          safetyRating: "verified", biasFlag: "low",
          description: "Adaptive practice problems for Year 9 algebra covering linear equations, factorisation, and algebraic fractions, with immediate feedback and hints linked to NSW curriculum outcomes.",
          localContextTags: ["Adaptive Learning", "Immediate Feedback", "NSW Curriculum"],
          outcomeIds: ["AC9M9A01", "AC9M9A02"],
          whyThisResource: "Khan Academy's adaptive algorithm targets exactly where each student is struggling, making it ideal for addressing the wide ability range typical of NSW Year 9 classes while aligning to AC9M9A01 and AC9M9A02.",
        },
        {
          id: "amsi-algebra-tasks", title: "Algebraic Thinking Problem Tasks",
          url: "https://calculate.org.au/2019/09/13/algebraic-thinking/",
          source: "AMSI — Australian Mathematical Sciences Institute", type: "Worksheet", alignmentScore: 88,
          safetyRating: "verified", biasFlag: "low",
          description: "Rich problem-solving tasks from AMSI that connect algebraic thinking to real-world Australian contexts, including financial planning and sports statistics.",
          localContextTags: ["Australian Context", "Problem Solving", "Real-world Maths"],
          outcomeIds: ["AC9M9A02", "AC9M9A03"],
          whyThisResource: "AMSI tasks embed Australian real-world contexts (AFL statistics, farm financial planning) into algebra practice, satisfying AC9M9A03's requirement for students to solve problems involving linear equations.",
        },
        {
          id: "desmos-linear", title: "Desmos — Graphing Linear Relationships",
          url: "https://teacher.desmos.com/activitybuilder/custom/5d99b7e7aa12e4494f3e028c",
          source: "Desmos Education", type: "Interactive", alignmentScore: 85,
          safetyRating: "verified", biasFlag: "low",
          description: "Free interactive graphing tool for exploring linear and quadratic relationships visually, with structured activity builder lessons aligned to Stage 5 outcomes.",
          localContextTags: ["Visual Learning", "Free Resource", "Graphing Technology"],
          outcomeIds: ["AC9M9A03"],
          whyThisResource: "Desmos makes the gradient-intercept form immediately visible and interactive — students can manipulate parameters and see the graph update in real time, building the conceptual understanding required by AC9M9A03.",
        },
      ],
      usedFallback: false,
    },
    lesson: {
      objective: "Students develop fluency in expanding and factorising algebraic expressions, connecting algebraic manipulation to real-world problem solving in Australian contexts, addressing AC9M9A01–AC9M9A03.",
      duration: "60 minutes",
      activities: [
        { label: "Hook (5 min)", text: "Present this puzzle: 'A Sydney builder prices rectangular room tiles. The area is x² + 5x + 6. Can you find two simpler dimensions that multiply to give this area?' Students guess, then reveal factorisation." },
        { label: "Explore (20 min)", text: "Students work through the AMSI problem tasks using the FOIL method and completing-the-square approach. Focus on expanding perfect squares and difference-of-two-squares expressions with increasing complexity." },
        { label: "Analyse (15 min)", text: "Pairs use Desmos to graph linear equations arising from the AMSI tasks. Students adjust gradient and y-intercept sliders and record observations about how changing each parameter affects the graph." },
        { label: "Evaluate (15 min)", text: "Error-analysis activity: students are given five worked algebra problems containing common misconceptions (sign errors, distribution errors). They must identify and correct each error, explaining why the original step was wrong." },
        { label: "Reflect (5 min)", text: "Exit ticket: 'Expand (x + 3)(x − 4) and explain in one sentence how this connects to the area model from today's hook.'" },
      ],
      localExample: {
        title: "Algebra in Australian Architecture and Engineering",
        body: "The Sydney Harbour Bridge's parabolic arch shape can be modelled by the quadratic expression y = −0.0015x² + 134, where x is the horizontal distance from centre. Australian engineers use algebraic expressions exactly like the ones students practise in Year 9 to calculate load distribution, material quantities, and structural integrity — making today's factorisation skills directly relevant to careers in Australian construction and engineering.",
      },
      questions: [
        { q: "Expand (x + 4)(x − 3) using the FOIL method and verify your answer by substituting x = 2.", difficulty: "foundation" },
        { q: "Factorise x² − 9 and x² + 6x + 9. What pattern do you notice in each case?", difficulty: "foundation" },
        { q: "A rectangular garden has area x² + 7x + 12. Write an expression for the possible dimensions, then find the actual dimensions if the perimeter is 26 metres.", difficulty: "core" },
        { q: "Solve the equation x² + 5x + 6 = 0 using two different methods and explain which is more efficient for this type of problem.", difficulty: "core" },
        { q: "Prove that the difference of two squares (a² − b²) always equals (a + b)(a − b). Then explain how this identity could be used to mentally calculate 97 × 103 without a calculator.", difficulty: "extension" },
      ],
      usedFallback: false,
    },
  },
  {
    key: "year8-vic-english-romeo",
    alignment: {
      alignmentScore: 91, syllabus: "VIC English Year 8",
      strand: "Literature — Responding to and Interpreting Texts",
      outcomes: [
        { id: "AC9E8LA04", description: "Analyse and evaluate how text structures, language features and conventions are used by authors to achieve their purposes." },
        { id: "AC9E8LY01", description: "Reflect on and evaluate the aesthetic qualities of literary texts and consider how the author's choices shape meaning." },
        { id: "AC9E8LY02", description: "Compare how different texts represent similar ideas, themes and issues, and consider the influence of context on these representations." },
      ],
      notes: "Romeo and Juliet is a canonical text for Year 8 Literature that aligns directly to Victorian Curriculum outcomes around close reading and textual analysis.",
      usedFallback: false,
    },
    resources: {
      resources: [
        {
          id: "shakespeare-globe", title: "Shakespeare's Globe — Romeo and Juliet Teaching Resources",
          url: "https://www.shakespearesglobe.com/learn/digital-resources/",
          source: "Shakespeare's Globe Theatre (UK)", type: "Lesson Plan", alignmentScore: 89,
          safetyRating: "verified", biasFlag: "low",
          description: "Performance-based teaching resources from Shakespeare's own theatre, including scene analysis activities, character mapping, and language investigation tasks that treat the text as a script written to be performed.",
          localContextTags: ["Performance-based Learning", "Original Globe Theatre", "Close Reading"],
          outcomeIds: ["AC9E8LA04", "AC9E8LY01"],
          whyThisResource: "Treating Romeo and Juliet as a performance text (not just a novel) engages Year 8 students viscerally and directly builds the textual analysis skills required by AC9E8LA04 and AC9E8LY01.",
        },
        {
          id: "scootle-shakespeare", title: "Shakespeare for Australian Students — Digital Text Pack",
          url: "https://www.scootle.edu.au/ec/search?q=romeo+and+juliet&v=text",
          source: "Scootle — Education Services Australia", type: "Interactive", alignmentScore: 85,
          safetyRating: "verified", biasFlag: "low",
          description: "Australian Curriculum-aligned digital resources including annotated text, video performances, and guided close-reading activities contextualised for Australian students.",
          localContextTags: ["Scootle", "Australian Curriculum Aligned", "Digital Text"],
          outcomeIds: ["AC9E8LA04", "AC9E8LY02"],
          whyThisResource: "Scootle's annotated digital text removes language barriers for Year 8 VIC students who struggle with Early Modern English, allowing analytical focus on the thematic and structural elements required by AC9E8LY02.",
        },
        {
          id: "no-fear-shakespeare", title: "No Fear Shakespeare — Romeo and Juliet",
          url: "https://www.sparknotes.com/shakespeare/romeoandjuliet/full-text/",
          source: "SparkNotes (reviewed for bias)", type: "Worksheet", alignmentScore: 78,
          safetyRating: "verified", biasFlag: "low",
          description: "Side-by-side modern English translation for comprehension scaffolding, used alongside the original text to support diverse learners while maintaining engagement with Shakespeare's language.",
          localContextTags: ["Differentiation", "EAL/D Support", "Scaffolding"],
          outcomeIds: ["AC9E8LY01"],
          whyThisResource: "For the 25–30% of Australian classrooms with EAL/D students, the side-by-side translation scaffolds comprehension without removing the analytical challenge — students can engage with themes and structure even if archaic language creates a barrier.",
        },
      ],
      usedFallback: false,
    },
    lesson: {
      objective: "Students analyse Shakespeare's dramatic techniques in Romeo and Juliet, evaluating how language, structure, and staging choices create meaning and emotional impact, addressing AC9E8LA04 and AC9E8LY01.",
      duration: "60 minutes",
      activities: [
        { label: "Hook (5 min)", text: "Play the balcony scene from a modern adaptation (Baz Luhrmann's 1996 film, set 30 seconds into the scene). Ask: 'Shakespeare wrote this in 1597. Why do film directors keep adapting it 400+ years later?'" },
        { label: "Explore (20 min)", text: "Students read Act 2, Scene 2 (the balcony scene) aloud in pairs, swapping roles. Using the Scootle annotated text, they identify and highlight: metaphors, oxymorons, light/dark imagery, and iambic pentameter. Record findings in the analysis grid." },
        { label: "Analyse (15 min)", text: "Groups compare a specific technique (assigned: metaphor, oxymoron, or imagery) across three different scenes. They build a mini-argument: 'Shakespeare uses [technique] to show [meaning] by [example], which creates [effect] on the audience.'" },
        { label: "Evaluate (15 min)", text: "Whole-class gallery walk of group analyses. Students peer-review: Is the textual evidence specific? Does the explanation of effect go beyond plot summary? Groups refine their analyses based on feedback." },
        { label: "Reflect (5 min)", text: "Exit ticket: 'Choose ONE language technique from today. Write two sentences explaining how it creates meaning — and why Shakespeare might have chosen it at that specific moment in the play.'" },
      ],
      localExample: {
        title: "Romeo and Juliet in Contemporary Australian Theatre",
        body: "The Melbourne Theatre Company and Sydney Theatre Company regularly produce contemporary adaptations of Romeo and Juliet, often setting it in modern Australia to explore themes of family honour, gang culture, and forbidden love in new cultural contexts. Bell Shakespeare, Australia's national touring Shakespeare company, has a dedicated education program that visits Victorian schools with year-level performances — bringing the play to life for exactly the Year 8 students studying it for the first time.",
      },
      questions: [
        { q: "Identify two examples of light or dark imagery in the balcony scene. What emotions do they create?", difficulty: "foundation" },
        { q: "What is an oxymoron? Find one in Act 1 Scene 1 where Romeo describes love. Why does Shakespeare use this technique here?", difficulty: "foundation" },
        { q: "Shakespeare gives Romeo and Juliet different speaking styles. Analyse how the language of one character's speech reveals their personality and emotional state at a key moment.", difficulty: "core" },
        { q: "Compare how Shakespeare uses iambic pentameter in the balcony scene versus the scenes involving the Nurse. What does this contrast suggest about each character's social status and emotional control?", difficulty: "core" },
        { q: "Evaluate whether Romeo and Juliet is fundamentally a love story or a tragedy about social conflict. Use evidence from the language choices of at least three different characters to construct and defend your argument.", difficulty: "extension" },
      ],
      usedFallback: false,
    },
  },
  {
    key: "year9-nsw-history-rights",
    alignment: {
      alignmentScore: 95, syllabus: "NSW History Year 9",
      strand: "Rights and Freedoms (1945–present)",
      outcomes: [
        { id: "AC9HS9K04", description: "Explain the significance of the Universal Declaration of Human Rights (1948) and its influence on the rights movements in Australia and internationally." },
        { id: "AC9HS9K05", description: "Analyse the causes and effects of significant rights and freedoms movements, including the Aboriginal and Torres Strait Islander rights movement in Australia." },
        { id: "AC9HS9S04", description: "Evaluate the perspectives of individuals and groups involved in rights movements and assess the effectiveness of strategies used to achieve change." },
      ],
      notes: "Rights and Freedoms is a mandatory depth study for NSW Year 9 History. Highly relevant to Western Sydney students through the 1965 Freedom Ride and the 1967 Referendum — both deeply connected to communities near Parramatta.",
      usedFallback: false,
    },
    resources: {
      resources: [
        {
          id: "aiatsis-rights-nsw", title: "Road to Reconciliation — 1967 Referendum and the NSW Freedom Rides",
          url: "https://aiatsis.gov.au/explore/1967-referendum",
          source: "AIATSIS — Australian Institute of Aboriginal and Torres Strait Islander Studies", type: "Lesson Plan", alignmentScore: 97,
          safetyRating: "verified", biasFlag: "low",
          description: "Primary source collection examining the 1967 Referendum, the 1965 NSW Freedom Rides led by Charles Perkins, and the ongoing struggle for Aboriginal and Torres Strait Islander rights. Includes oral history recordings from Darug and Wiradjuri Elders and archival photographs from the Parramatta and Western Sydney region.",
          localContextTags: ["AIATSIS", "1967 Referendum", "NSW Freedom Rides", "Darug Country", "Primary Sources"],
          outcomeIds: ["AC9HS9K04", "AC9HS9K05"],
          whyThisResource: "The AIATSIS collection centres First Nations voices from Western Sydney — including Darug Elders whose Country encompasses Parramatta. The 1965 Freedom Ride departed from Sydney University and passed through Western NSW, making this history directly local for your students.",
        },
        {
          id: "national-museum-rights-nsw", title: "Defining Moments — Rights and Freedoms Digital Classroom",
          url: "https://www.nma.gov.au/defining-moments",
          source: "National Museum of Australia", type: "Interactive", alignmentScore: 90,
          safetyRating: "verified", biasFlag: "low",
          description: "Interactive digital exhibition covering the 1967 Referendum, the Mabo decision, the Stolen Generations, and the National Apology — with primary sources, student inquiry tasks, and connections to the NSW Stage 5 History syllabus.",
          localContextTags: ["National Museum", "Defining Moments", "1967 Referendum", "Stolen Generations"],
          outcomeIds: ["AC9HS9K04", "AC9HS9S04"],
          whyThisResource: "The 'Defining Moments' framework directly supports AC9HS9S04's requirement to evaluate the significance of historical events. The Stolen Generations content connects powerfully to Western Sydney communities, many of whom were directly affected by policies administered through Parramatta institutions.",
        },
        {
          id: "amnesty-udhr-nsw", title: "Human Rights Education Resources — UDHR and Australian Context",
          url: "https://www.amnesty.org.au/human-rights-education/",
          source: "Amnesty International Australia", type: "Assessment", alignmentScore: 85,
          safetyRating: "verified", biasFlag: "low",
          description: "Case-study resources connecting the 1948 Universal Declaration of Human Rights to contemporary Australian contexts — including Indigenous land rights, asylum seeker policy, and LGBTIQ+ equality. Includes structured essay scaffold for HSC-style extended response.",
          localContextTags: ["UDHR 1948", "Contemporary Issues", "Australian Human Rights", "Essay Scaffold"],
          outcomeIds: ["AC9HS9K04", "AC9HS9S04"],
          whyThisResource: "Amnesty's UDHR resources bridge Year 9 historical study to today's debates — essential for AC9HS9K04's focus on the UDHR's lasting influence. The essay scaffold supports the extended response assessment typical of NSW Year 9 History.",
        },
      ],
      usedFallback: false,
    },
    lesson: {
      objective: "Students analyse the origins and significance of the rights and freedoms movement in Australia, examining the role of the 1967 Referendum and NSW Freedom Rides in achieving social change, addressing AC9HS9K04, AC9HS9K05, and AC9HS9S04.",
      duration: "60 minutes",
      activities: [
        { label: "Hook (5 min)", text: "Show two photographs side-by-side: the 1965 Freedom Ride bus departing Sydney University, and the 1967 Referendum campaign poster 'Vote Yes for Aborigines'. Ask: 'What connection do you see? Why did Australian students in 1965 get on a bus to drive through rural NSW?'" },
        { label: "Explore (20 min)", text: "Students use the AIATSIS primary source collection to investigate the 1967 Referendum and the NSW Freedom Rides. In groups, they analyse three sources: a campaign poster, an oral history recording from a Darug Elder in Western Sydney, and a newspaper report from the Parramatta region. They record: Who created this source? What perspective does it represent? What does it leave out?" },
        { label: "Analyse (15 min)", text: "Groups build a comparison table: American Civil Rights Movement (1955–65) vs. Australian Rights Movements (1960s). Categories: key events, key leaders, strategies used (protests, legal challenges, campaigns), obstacles faced, outcomes achieved. Identify specific ways the US movement inspired Australian activists including Charles Perkins and the students who joined him." },
        { label: "Evaluate (15 min)", text: "Fishbowl discussion: 'Were the strategies used by rights activists in the 1960s effective? What evidence supports your view?' Students must reference specific historical evidence. Connect to Parramatta: the Parramatta Girls Home and other institutions in your local area were directly involved in Stolen Generations policies — how does this make this history personal for your community?" },
        { label: "Reflect (5 min)", text: "Exit ticket: 'Which strategy (legal challenge, peaceful protest, media campaign, political pressure) do you think was most effective in advancing Aboriginal rights in NSW? Justify with one specific historical example from today's sources.'" },
      ],
      localExample: {
        title: "Darug Country, Parramatta, and the Fight for Rights",
        body: "Parramatta — on Darug Country, the land of the Burramattagal people — was one of the first places where colonisation's impact on Aboriginal rights was felt most acutely. The Parramatta Native Institution (1814) was one of Australia's earliest assimilation programs, separating Aboriginal children from their families in policies that preceded the Stolen Generations era by over a century. The Darug Custodian Aboriginal Corporation, based near Parramatta today, continues the work of Cultural preservation and rights advocacy that connects directly to the 1967 Referendum your students are studying. Walking distance from your school, this history is not just national — it is local.",
      },
      questions: [
        { q: "What was the 1967 Referendum about? Describe two specific changes it made to the Australian Constitution.", difficulty: "foundation" },
        { q: "Who was Charles Perkins and what was the significance of the 1965 Freedom Ride? Where did it start and which NSW communities did it visit?", difficulty: "foundation" },
        { q: "Explain how the Universal Declaration of Human Rights (1948) influenced the Aboriginal rights movement in Australia during the 1960s. Use two pieces of evidence.", difficulty: "core" },
        { q: "Analyse the source: [Darug Elder oral history excerpt from AIATSIS]. What perspective does this source provide? What are its strengths and limitations for a historian investigating the 1967 Referendum?", difficulty: "core" },
        { q: "Evaluate the following claim: 'The 1967 Referendum was the most significant moment in Australian rights history.' To what extent do you agree? Consider other events — the Mabo decision (1992), the National Apology (2008), and the current campaign for a First Nations Voice — in your response.", difficulty: "extension" },
      ],
      usedFallback: false,
    },
  },
  {
    key: "year10-qld-history-rights",
    alignment: {
      alignmentScore: 93, syllabus: "QLD History Year 10",
      strand: "Rights and Freedoms (1945–present)",
      outcomes: [
        { id: "AC9HH10K01", description: "Explain the significance of the Universal Declaration of Human Rights and its impact on global and Australian human rights movements." },
        { id: "AC9HH10K02", description: "Analyse the origins and significance of the civil rights movement in the United States and its influence on Australian rights movements." },
        { id: "AC9HH10S04", description: "Evaluate the perspectives of different groups involved in rights movements and assess the effectiveness of their strategies." },
      ],
      notes: "Rights and Freedoms is a mandatory depth study for Year 10 History and connects directly to the 1967 Australian Referendum and the civil rights era.",
      usedFallback: false,
    },
    resources: {
      resources: [
        {
          id: "aiatsis-rights", title: "Road to Reconciliation — 1967 Referendum and Beyond",
          source: "AIATSIS — Australian Institute of Aboriginal and Torres Strait Islander Studies", type: "Lesson Plan", alignmentScore: 95,
          safetyRating: "verified", biasFlag: "low",
          description: "Primary source collection and teacher resource examining the 1967 Referendum, the Freedom Rides, and the ongoing struggle for Aboriginal and Torres Strait Islander rights in Australia, with oral history recordings and archival photographs.",
          localContextTags: ["AIATSIS", "1967 Referendum", "Aboriginal Rights", "Primary Sources"],
          outcomeIds: ["AC9HH10K01", "AC9HH10K02"],
          whyThisResource: "The AIATSIS collection provides authentic First Nations voices and perspectives that transform the rights narrative from abstract history to lived experience — directly addressing AC9HH10K01's focus on the UDHR's impact on Australian movements.",
        },
        {
          id: "national-museum-rights", title: "Defining Moments — Rights and Freedoms Digital Classroom",
          source: "National Museum of Australia", type: "Interactive", alignmentScore: 88,
          safetyRating: "verified", biasFlag: "low",
          description: "Interactive digital exhibition covering key Australian rights milestones: the 1967 Referendum, equal pay for women, the Mabo decision, and the Apology to the Stolen Generation, with primary sources and student activities.",
          localContextTags: ["National Museum", "Defining Moments", "Australian Democracy"],
          outcomeIds: ["AC9HH10K01", "AC9HH10S04"],
          whyThisResource: "The National Museum's 'Defining Moments' framework helps QLD Year 10 students evaluate the relative historical significance of different rights milestones — a core skill for AC9HH10S04's assessment requirement.",
        },
        {
          id: "amnesty-education", title: "Human Rights Education Resources — Australian Focus",
          source: "Amnesty International Australia", type: "Assessment", alignmentScore: 82,
          safetyRating: "verified", biasFlag: "low",
          description: "Case-study based human rights resources connecting the Universal Declaration of Human Rights to contemporary Australian contexts, including asylum seeker policy, Indigenous land rights, and LGBTIQ+ equality.",
          localContextTags: ["Contemporary Issues", "UDHR", "Australian Policy"],
          outcomeIds: ["AC9HH10K01", "AC9HH10S04"],
          whyThisResource: "Amnesty's contemporary cases show QLD students that rights struggles are not just historical — connecting 1948's UDHR directly to issues debated in today's Australian parliament and satisfying AC9HH10S04's evaluation requirement.",
        },
      ],
      usedFallback: false,
    },
    lesson: {
      objective: "Students analyse the origins and significance of the rights and freedoms movement in Australia and the United States, evaluating the strategies used by different groups to achieve social change, addressing AC9HH10K01, AC9HH10K02, and AC9HH10S04.",
      duration: "60 minutes",
      activities: [
        { label: "Hook (5 min)", text: "Show two photographs side-by-side: Martin Luther King Jr. at the Washington Monument (1963) and Charles Perkins on the Freedom Ride bus in NSW (1965). Ask: 'What connections do you see? What was happening in Australia at the same time as the American civil rights movement?'" },
        { label: "Explore (20 min)", text: "Students use the AIATSIS primary source collection to investigate the 1967 Referendum. Working in groups, they analyse three different sources: a campaign poster, an oral history recording from an Aboriginal elder, and a newspaper editorial. They record: Who created this source? What perspective does it represent? What does it leave out?" },
        { label: "Analyse (15 min)", text: "Groups build a comparison table: American Civil Rights Movement vs. Australian Rights Movement (1960s). Categories: key events, key leaders, strategies used (marches, legal challenges, campaigns), obstacles faced, outcomes achieved. Identify the influence the US movement had on Australian activists." },
        { label: "Evaluate (15 min)", text: "Fishbowl discussion: 'Were the strategies used by rights activists in the 1960s effective? What evidence supports your view?' Four students discuss in the centre; others take observation notes and rotate in. Students must reference specific historical evidence to participate." },
        { label: "Reflect (5 min)", text: "Exit ticket: 'Which strategy (legal challenge, peaceful protest, media campaign, political pressure) do you think was most effective in advancing rights in Australia? Justify with one specific historical example.'" },
      ],
      localExample: {
        title: "The 1965 Freedom Ride — Australia's Civil Rights Moment",
        body: "In February 1965, Charles Perkins and a group of University of Sydney students boarded a bus and travelled through rural NSW, exposing racial segregation in country towns like Moree and Walgett — where Aboriginal Australians were barred from swimming pools, cinemas, and hotels. The Freedom Ride was directly inspired by the 1961 American Freedom Rides and generated national media coverage that shocked Australians and built momentum for the 1967 Referendum. This is one of QLD History's most powerful case studies connecting global civil rights movements to Australian social change.",
      },
      questions: [
        { q: "What was the 1967 Referendum about? Describe two changes it made to the Australian Constitution.", difficulty: "foundation" },
        { q: "List three strategies used by rights activists in Australia during the 1960s. Give one example of each.", difficulty: "foundation" },
        { q: "Explain how the American civil rights movement influenced the Aboriginal rights movement in Australia during the 1960s. Use evidence from two historical sources.", difficulty: "core" },
        { q: "Analyse the source: [Charles Perkins oral history excerpt from AIATSIS]. What perspective does this source offer? What are its limitations for a historian?", difficulty: "core" },
        { q: "Evaluate the following claim: 'The 1967 Referendum was the most significant moment in Australian rights history.' To what extent do you agree? Consider other events (Mabo decision, Wave Hill Walk-off, the Apology) in your response.", difficulty: "extension" },
      ],
      usedFallback: false,
    },
  },
  {
    key: "year7-nsw-geography-ecosystems",
    alignment: {
      alignmentScore: 90, syllabus: "NSW Geography Year 7",
      strand: "Biomes and Food Security",
      outcomes: [
        { id: "AC9HG7K04", description: "Explain the characteristics of biomes and the factors that influence the distribution of biomes across the world." },
        { id: "AC9HG7K05", description: "Describe the ways in which people use and depend on different biomes, and assess the impacts of human activity on biome health." },
        { id: "AC9HG7S04", description: "Represent geographical data and information using maps, graphs, and spatial technologies." },
      ],
      notes: "Ecosystems and Biomes is the foundational content for Year 7 Geography. NSW students study both Australian and global biomes with strong local context opportunities.",
      usedFallback: false,
    },
    resources: {
      resources: [
        {
          id: "aga-ecosystems", title: "Australian Biomes — A Geographic Investigation",
          source: "Australian Geography Teachers Association", type: "Lesson Plan", alignmentScore: 93,
          safetyRating: "verified", biasFlag: "low",
          description: "Comprehensive resource investigating Australia's unique biomes — tropical rainforest, desert, temperate grassland, and coastal wetlands — using real field data, maps, and satellite imagery.",
          localContextTags: ["Australian Biomes", "AGTA Resource", "Spatial Mapping"],
          outcomeIds: ["AC9HG7K04", "AC9HG7S04"],
          whyThisResource: "AGTA resources are specifically written for Australian Geography teachers and map directly to AC9HG7K04's biome distribution outcomes using authentic Australian spatial data and satellite imagery.",
        },
        {
          id: "questacon-ecosystems", title: "Ecosystem Connections — Interactive Food Web Simulator",
          source: "Questacon — National Science and Technology Centre", type: "Interactive", alignmentScore: 85,
          safetyRating: "verified", biasFlag: "low",
          description: "Web-based food web simulator featuring Australian ecosystems (Great Barrier Reef, Daintree Rainforest, Murray-Darling Basin) where students test the impact of removing species or introducing human pressures.",
          localContextTags: ["Great Barrier Reef", "Food Webs", "Questacon", "Interactive"],
          outcomeIds: ["AC9HG7K05"],
          whyThisResource: "The food web simulator makes the impact of human activity on Australian ecosystems visible and interactive, allowing Year 7 students to directly test the concepts in AC9HG7K05 through guided inquiry.",
        },
        {
          id: "wwf-australia-biomes", title: "Living Planet Report — Australian Ecosystems",
          source: "WWF Australia", type: "Assessment", alignmentScore: 80,
          safetyRating: "verified", biasFlag: "low",
          description: "Data-rich report on biodiversity trends in Australian ecosystems, including habitat loss statistics, threatened species maps, and human impact case studies suitable for Year 7 data analysis tasks.",
          localContextTags: ["WWF Data", "Biodiversity", "Conservation", "Australian Species"],
          outcomeIds: ["AC9HG7K05", "AC9HG7S04"],
          whyThisResource: "WWF's real biodiversity data gives Year 7 students authentic numbers to graph and analyse (AC9HG7S04) while exploring human-ecosystem relationships (AC9HG7K05) — turning an assessment task into genuine environmental inquiry.",
        },
      ],
      usedFallback: false,
    },
    lesson: {
      objective: "Students investigate the characteristics and distribution of Australian biomes, analyse the factors that shape them, and evaluate the impact of human activity on ecosystem health, addressing AC9HG7K04, AC9HG7K05, and AC9HG7S04.",
      duration: "60 minutes",
      activities: [
        { label: "Hook (5 min)", text: "Show a split-screen Google Earth flyover: the Daintree Rainforest, the Nullarbor Plain, and the Great Barrier Reef. Ask: 'These are all in Australia — how can one country contain such different environments? What factors create this diversity?'" },
        { label: "Explore (20 min)", text: "Using the AGTA mapping resources, students plot Australia's six major biomes on a blank continent map. For each biome, they record: average temperature range, annual rainfall, dominant vegetation, and one iconic Australian species. Teams are assigned one biome to investigate in depth." },
        { label: "Analyse (15 min)", text: "Groups use the Questacon food web simulator to investigate their assigned biome. They test: What happens if a top predator is removed? What happens if a key plant species disappears due to drought? Record results in a cause-and-effect diagram." },
        { label: "Evaluate (15 min)", text: "Using WWF data, students identify the three most threatened Australian ecosystems and evaluate which human pressures (land clearing, invasive species, climate change, pollution) are most damaging. Create a ranked list with evidence from the WWF report data." },
        { label: "Reflect (5 min)", text: "Exit ticket: 'Choose one Australian biome. Name one human threat and one conservation strategy currently being used to protect it. How effective do you think this strategy is?'" },
      ],
      localExample: {
        title: "The Murray-Darling Basin — Australia's Food Bowl Under Pressure",
        body: "The Murray-Darling Basin covers 14% of Australia and produces 40% of the country's agricultural output, yet it is one of the most stressed ecosystems on the continent. Over 30,000 native fish died in a mass die-off in the Darling River in 2019, caused by a combination of algal blooms, low water flows, and rising temperatures. The Murray-Darling Basin Plan — a complex negotiation between NSW, VIC, QLD, SA, and the ACT — attempts to balance agricultural water use with environmental flows. This is a perfect case study for Year 7 students examining how humans depend on and impact Australian ecosystems.",
      },
      questions: [
        { q: "Name three Australian biomes and describe one key feature of each (climate, vegetation, or animal life).", difficulty: "foundation" },
        { q: "What is a food web? Using your biome, identify a producer, a primary consumer, and a secondary consumer.", difficulty: "foundation" },
        { q: "Explain two ways human activity threatens the health of one Australian ecosystem. Use data or evidence from the WWF report.", difficulty: "core" },
        { q: "Compare the temperate grassland biome with the tropical rainforest biome. What factors (rainfall, temperature, soil) explain the differences in plant and animal life?", difficulty: "core" },
        { q: "Evaluate whether economic development or environmental conservation should take priority in managing the Murray-Darling Basin. Use evidence from multiple perspectives (farmers, environmental scientists, Indigenous communities, government) to construct a reasoned argument.", difficulty: "extension" },
      ],
      usedFallback: false,
    },
  },
];

type MatchKey = { yearLevel: string; state: string; subject: string; topic: string };

const TOPIC_KEYWORDS: Record<string, string[]> = {
  "year9-nsw-science-climate": ["climate change", "climate", "greenhouse", "global warming"],
  "year9-nsw-maths-algebra": ["algebra", "algebraic", "equations", "factori"],
  "year8-vic-english-romeo": ["romeo", "juliet", "shakespeare"],
  "year9-nsw-history-rights": ["rights and freedoms", "rights", "freedoms", "civil rights", "referendum", "darug"],
  "year10-qld-history-rights": ["rights and freedoms", "rights", "freedoms", "civil rights", "referendum"],
  "year7-nsw-geography-ecosystems": ["ecosystem", "biome", "food web", "biodiversity"],
};

const YEAR_MAP: Record<string, string[]> = {
  "year9-nsw-science-climate": ["year 9", "year9"],
  "year9-nsw-maths-algebra": ["year 9", "year9"],
  "year8-vic-english-romeo": ["year 8", "year8"],
  "year9-nsw-history-rights": ["year 9", "year9", "year 10", "year10"],
  "year10-qld-history-rights": ["year 10", "year10"],
  "year7-nsw-geography-ecosystems": ["year 7", "year7"],
};

const STATE_MAP: Record<string, string[]> = {
  "year9-nsw-science-climate": ["nsw"],
  "year9-nsw-maths-algebra": ["nsw"],
  "year8-vic-english-romeo": ["vic"],
  "year9-nsw-history-rights": ["nsw"],
  "year10-qld-history-rights": ["qld"],
  "year7-nsw-geography-ecosystems": ["nsw"],
};

const SUBJECT_MAP: Record<string, string[]> = {
  "year9-nsw-science-climate": ["science"],
  "year9-nsw-maths-algebra": ["mathematics", "maths", "math"],
  "year8-vic-english-romeo": ["english"],
  "year9-nsw-history-rights": ["history", "humanities", "hsie"],
  "year10-qld-history-rights": ["history", "humanities"],
  "year7-nsw-geography-ecosystems": ["geography", "humanities"],
};

export function getDemoScenario({ yearLevel, state, subject, topic }: MatchKey): DemoScenario | null {
  const yl = yearLevel.toLowerCase();
  const st = state.toLowerCase();
  const sub = subject.toLowerCase();
  const top = topic.toLowerCase();

  for (const scenario of DEMO_SCENARIOS) {
    const key = scenario.key;
    const yearMatch = YEAR_MAP[key]?.some(y => yl.includes(y));
    const stateMatch = STATE_MAP[key]?.some(s => st.includes(s));
    const subjectMatch = SUBJECT_MAP[key]?.some(s => sub.includes(s));
    const topicMatch = TOPIC_KEYWORDS[key]?.some(kw => top.includes(kw));
    if (yearMatch && stateMatch && subjectMatch && topicMatch) {
      return scenario;
    }
  }
  return null;
}
