type CuratedLink = {
  title: string;
  url: string;
  source: string;
  description: string;
  localContextTags: string[];
  whyThisResource: string;
  trustFlags?: Array<{ type: string; severity: "low" | "medium" | "high"; label: string; note: string }>;
};

type CuratedTopic = {
  id: string;
  subjects: string[];
  years?: string[];
  topicKeywords: string[];
  links: CuratedLink[];
};

const CURATED_TOPICS: CuratedTopic[] = [
  {
    id: "lgbtq-rights",
    subjects: ["history", "civics", "humanities", "english"],
    years: ["year 9", "year 10"],
    topicKeywords: ["lgbtq", "lgbt", "queer", "gay rights", "same-sex marriage", "sexuality rights"],
    links: [
      {
        title: "LGBT+ rights in Australia",
        url: "https://www.abc.net.au/education/lgbt%2B-rights-in-australia/13760994",
        source: "ABC Education",
        description: "ABC Education video and classroom prompts tracing legal and social change for LGBT+ rights in Australia.",
        localContextTags: ["ABC Education", "Australian history", "Civics", "Rights"],
        whyThisResource: "It is classroom-oriented, Australian, and directly explores rights, legislation, and social change in a format teachers can use immediately.",
      },
      {
        title: "Rights and Freedoms",
        url: "https://www.abc.net.au/education/topic-rights-and-freedoms/13810938",
        source: "ABC Education",
        description: "Topic collection from ABC Education with rights and freedoms resources spanning social justice, race, discrimination, and civic change.",
        localContextTags: ["Topic collection", "History", "Rights and freedoms", "Australian context"],
        whyThisResource: "It gives teachers a broader verified collection they can mine for companion classroom materials around rights and freedoms.",
      },
      {
        title: "Years 9–10 History Resources",
        url: "https://www.abc.net.au/education/history-years-9-10/13568060",
        source: "ABC Education",
        description: "ABC Education Year 9–10 history hub with curriculum-aligned materials, including Aboriginal rights, deep time, and civic history resources.",
        localContextTags: ["Year 9-10", "History", "ABC Education", "Curriculum aligned"],
        whyThisResource: "It is a verified entry point for teachers who want multiple history resources aligned to Years 9–10 in the Australian context.",
      },
    ],
  },
  {
    id: "rights-and-freedoms",
    subjects: ["history", "civics", "humanities"],
    years: ["year 9", "year 10"],
    topicKeywords: ["rights and freedoms", "civil rights", "freedom ride", "stolen generations", "aboriginal rights"],
    links: [
      {
        title: "Restricted Rights and Freedoms: Discriminatory laws",
        url: "https://www.abc.net.au/education/restricted-rights-and-freedoms-discriminatory-laws/13922192",
        source: "ABC Education",
        description: "ABC Education classroom media resource on discriminatory laws affecting Aboriginal people and the history of restricted rights and freedoms.",
        localContextTags: ["ABC Education", "Aboriginal rights", "History", "Rights and freedoms"],
        whyThisResource: "It directly targets rights and freedoms content and includes historical context teachers can use in class discussion.",
        trustFlags: [
          { type: "cultural", severity: "medium", label: "Review First Nations context", note: "This resource covers Aboriginal histories and rights. Check local cultural framing and teacher facilitation before classroom use." },
        ],
      },
      {
        title: "A History of Aboriginal Rights in WA",
        url: "https://www.abc.net.au/education/digibooks/a-history-of-aboriginal-rights-in-wa/101750762",
        source: "ABC Education",
        description: "Interactive ABC Education resource following the struggle for Aboriginal rights in Western Australia and the policies that shaped it.",
        localContextTags: ["Interactive", "Aboriginal rights", "History", "Western Australia"],
        whyThisResource: "It is a rich verified source with explicit historical rights content and strong curriculum relevance for rights and freedoms topics.",
        trustFlags: [
          { type: "cultural", severity: "medium", label: "Review First Nations context", note: "This resource covers Aboriginal histories and rights. Check local cultural framing and teacher facilitation before classroom use." },
        ],
      },
      {
        title: "Rights and Freedoms",
        url: "https://www.abc.net.au/education/topic-rights-and-freedoms/13810938",
        source: "ABC Education",
        description: "ABC Education topic hub for rights and freedoms-related materials spanning social justice and historical change.",
        localContextTags: ["Topic collection", "Rights and freedoms", "History", "Civics"],
        whyThisResource: "It broadens teacher choice with a verified collection built around the exact rights and freedoms theme.",
      },
    ],
  },
  {
    id: "climate-change",
    subjects: ["science", "geography"],
    years: ["year 7", "year 8", "year 9", "year 10"],
    topicKeywords: ["climate change", "climate", "greenhouse", "global warming"],
    links: [
      {
        title: "Understanding the causes of climate change",
        url: "https://www.abc.net.au/education/understanding-the-causes-of-climate-change/13792736",
        source: "ABC Education",
        description: "Short classroom-ready ABC Education resource explaining the causes of climate change for Years 7–10.",
        localContextTags: ["Science", "Geography", "Climate", "ABC Education"],
        whyThisResource: "It is concise, curriculum-aligned, and pitched to the exact year bands often used for climate change teaching.",
      },
      {
        title: "Sciencey: Five things you need to know about climate change",
        url: "https://www.abc.net.au/education/sciencey-five-things-you-need-to-know-about-climate-change/13708058",
        source: "ABC Education",
        description: "ABC Education explainer covering core climate science concepts such as carbon dioxide, oceans, and climate history.",
        localContextTags: ["Climate science", "ABC Education", "Years 9-10", "Australian classroom"],
        whyThisResource: "It provides a strong conceptual base with clear explanations suitable for lesson adaptation and class discussion.",
      },
      {
        title: "Climate",
        url: "https://www.abc.net.au/education/topic-climate/13810910",
        source: "ABC Education",
        description: "Topic collection page with multiple climate-related classroom resources for Australian teachers.",
        localContextTags: ["Topic collection", "Climate", "Science", "Geography"],
        whyThisResource: "It offers a verified collection teachers can extend with other climate resources after the core lesson.",
      },
    ],
  },
  {
    id: "romeo-juliet",
    subjects: ["english", "arts"],
    years: ["year 8", "year 9", "year 10"],
    topicKeywords: ["romeo and juliet", "romeo & juliet", "shakespeare"],
    links: [
      {
        title: "Romeo and Juliet: True love's passion",
        url: "https://www.abc.net.au/education/romeo-and-juliet-true-loves-passion/13591252",
        source: "ABC Education",
        description: "ABC Education classroom resource exploring Act 2.2 of Romeo and Juliet with questions and teacher prompts.",
        localContextTags: ["English", "Shakespeare", "ABC Education", "Years 9-10"],
        whyThisResource: "It is directly classroom-ready and focused on textual analysis, imagery, and discussion prompts for secondary English.",
      },
      {
        title: "Romeo and Juliet: The language of true love",
        url: "https://www.abc.net.au/education/romeo-and-juliet-the-language-of-true-love/13591260",
        source: "ABC Education",
        description: "ABC Education analysis resource focused on language, imagery, and character expression in Romeo and Juliet.",
        localContextTags: ["Language analysis", "English", "Bell Shakespeare", "ABC Education"],
        whyThisResource: "It supports close language analysis, which makes it useful for Year 8–10 English lessons and worksheet design.",
      },
      {
        title: "Romeo and Juliet: Galloping towards tragedy",
        url: "https://www.abc.net.au/education/romeo-and-juliet-galloping-towards-tragedy/13661182",
        source: "ABC Education",
        description: "ABC Education resource examining Juliet's soliloquy, dramatic irony, and the movement toward tragedy.",
        localContextTags: ["Tragedy", "English", "Drama", "ABC Education"],
        whyThisResource: "It extends discussion beyond plot into tragedy, character, and dramatic structure for senior middle-school English.",
      },
    ],
  },
  {
    id: "ecosystems",
    subjects: ["geography", "science"],
    years: ["year 7", "year 8"],
    topicKeywords: ["ecosystems", "biomes", "environment", "biodiversity"],
    links: [
      {
        title: "Ecosystems",
        url: "https://www.abc.net.au/education/topic-ecosystems/102208060",
        source: "ABC Education",
        description: "ABC Education ecosystems topic page with curated environmental and biodiversity resources suitable for Years 7–8.",
        localContextTags: ["Ecosystems", "Geography", "Science", "ABC Education"],
        whyThisResource: "It gives teachers a verified ecosystem-themed collection with Australian environmental context and classroom relevance.",
      },
      {
        title: "Years 7–8 Geography Resources",
        url: "https://www.abc.net.au/education/geography-years-7-8/13568036",
        source: "ABC Education",
        description: "Verified Year 7–8 geography hub including environmental, land, and place-based Australian resources.",
        localContextTags: ["Year 7-8", "Geography", "Australian landscapes", "ABC Education"],
        whyThisResource: "It is a reliable entry point for ecosystem and environment teaching in the exact year band targeted by the topic.",
      },
      {
        title: "Geography",
        url: "https://www.abc.net.au/education/subjects-and-topics/geography/",
        source: "ABC Education",
        description: "ABC Education geography subject hub collecting classroom resources across geography topics.",
        localContextTags: ["Subject hub", "Geography", "ABC Education", "Australian curriculum"],
        whyThisResource: "It provides a verified fallback hub for teachers wanting broader geography materials around ecosystems and environment.",
      },
    ],
  },
  {
    id: "algebra",
    subjects: ["mathematics", "maths", "math"],
    years: ["year 8", "year 9", "year 10"],
    topicKeywords: ["algebra", "equations", "expressions", "linear"],
    links: [
      {
        title: "Years 9–10 Maths Resources",
        url: "https://www.abc.net.au/education/maths-years-9-10/13548302",
        source: "ABC Education",
        description: "ABC Education hub for Years 9–10 mathematics resources that can be used to support algebra and numeracy teaching.",
        localContextTags: ["Maths", "Year 9-10", "ABC Education", "Curriculum aligned"],
        whyThisResource: "It is a verified maths hub for the right year band and is a stronger starting point than an unreliable AI-guessed algebra link.",
      },
      {
        title: "Maths",
        url: "https://www.abc.net.au/education/subjects-and-topics/maths/",
        source: "ABC Education",
        description: "ABC Education subject hub for maths resources across multiple year levels and curriculum strands.",
        localContextTags: ["Maths", "Subject hub", "ABC Education", "Australian classroom"],
        whyThisResource: "It gives teachers a verified maths entry point when the topic is algebra but no narrower direct page is confidently available.",
      },
      {
        title: "MathXplosion: Arithmetic",
        url: "https://www.abc.net.au/education/digibooks/mathxplosion-arithmetic/101750318",
        source: "ABC Education",
        description: "Interactive ABC Education maths resource including episodes that use algebraic conventions and mathematical reasoning.",
        localContextTags: ["Maths reasoning", "Interactive", "ABC Education", "Problem solving"],
        whyThisResource: "It is a reliable maths resource with reasoning and algebra-adjacent conventions that can still support lesson adaptation.",
      },
    ],
  },
  {
    id: "physics",
    subjects: ["science", "physics"],
    years: ["year 9", "year 10"],
    topicKeywords: ["physics", "force", "motion", "energy", "waves", "atom", "atoms", "electricity"],
    links: [
      {
        title: "Years 9–10 Science Resources",
        url: "https://www.abc.net.au/education/science-years-9-10/13560416",
        source: "ABC Education",
        description: "ABC Education Year 9–10 science hub with secondary science resources suitable for physics-related classroom teaching.",
        localContextTags: ["Science", "Year 9-10", "ABC Education", "Curriculum aligned"],
        whyThisResource: "It is a verified science hub for the exact year band and gives teachers a reliable starting point for physics-aligned secondary science lessons.",
      },
      {
        title: "Exploring Atoms: Atom structure",
        url: "https://www.abc.net.au/education/exploring-atoms-atom-structure/14099774",
        source: "ABC Education",
        description: "ABC Education interactive resource exploring atom structure and the scientists who investigated it.",
        localContextTags: ["Physics", "Atoms", "Interactive", "ABC Education"],
        whyThisResource: "It is a real interactive science resource that supports core physics concepts such as atomic structure and models.",
      },
      {
        title: "Seeing with Sound: Sound Lab Tour",
        url: "https://www.abc.net.au/education/seeing-with-sound-sound-lab-tour/14099780",
        source: "ABC Education",
        description: "ABC Education interactive resource exploring sound, wave behaviour, and related physics ideas.",
        localContextTags: ["Physics", "Waves", "Sound", "ABC Education"],
        whyThisResource: "It provides a real classroom-usable entry point into wave and sound concepts that commonly sit within middle secondary physics teaching.",
      },
    ],
  },
];

function normalize(text: string) {
  return text.toLowerCase().trim();
}

export function findCuratedResources(
  subject: string,
  yearLevel: string,
  topic: string,
  resourceTypeFilter?: string,
) {
  const normalizedSubject = normalize(subject);
  const normalizedYear = normalize(yearLevel);
  const normalizedTopic = normalize(topic);

  const matched = CURATED_TOPICS.filter((entry) => {
    const subjectMatch = entry.subjects.some((s) => normalizedSubject.includes(s));
    const yearMatch = !entry.years || entry.years.some((y) => normalizedYear.includes(y));
    const topicMatch = entry.topicKeywords.some((keyword) => normalizedTopic.includes(keyword));
    return subjectMatch && yearMatch && topicMatch;
  });

  if (matched.length === 0) return [];

  return matched.flatMap((entry) =>
    entry.links.map((link, index) => ({
      id: `curated-${entry.id}-${index + 1}`,
      title: link.title,
      url: link.url,
      urlType: "direct" as const,
      source: link.source,
      type: resourceTypeFilter || "Article",
      description: link.description,
      alignmentScore: 91 - index * 3,
      safetyRating: "verified",
      biasFlag: "low",
      localContextTags: [...link.localContextTags, "Curated Registry"],
      outcomeIds: [],
      whyThisResource: link.whyThisResource,
      trustFlags: link.trustFlags,
      provenance: "curated" as const,
      verifiedLink: true,
    })),
  ).slice(0, 3);
}
