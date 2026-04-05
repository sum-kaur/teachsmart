import { Router, type IRouter } from "express";
import {
  SearchResourcesBody,
  GetRecentResourcesResponse,
  GetDashboardStatsResponse,
} from "@workspace/api-zod";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const TIMEOUT_MS = 8000;

const MOCK_ALIGNMENT = {
  score: 92,
  syllabus: "NSW Stage 5 Science",
  strand: "Earth and Space Sciences",
  outcomeCodes: ["SC5-12ES", "SC5-13ES", "SC5-WS1"],
};

const MOCK_RESOURCES = [
  {
    id: "csiro-climate-1",
    title: "Australia's Changing Climate",
    source: "CSIRO",
    type: "Lesson Plan",
    alignmentScore: 96,
    description:
      "A comprehensive resource exploring how Australia's climate is changing, with data-driven activities and case studies relevant to Australian students.",
    whyThis:
      "This resource directly addresses Stage 5 Earth and Space Sciences outcomes with Australian-specific climate data and is produced by Australia's national science agency, ensuring accuracy and curriculum alignment.",
    localContextTags: ["Australian Data", "CSIRO Research", "Bureau of Meteorology"],
    trustBadges: ["Verified", "Bias Checked"],
    url: "https://www.csiro.au/en/education",
  },
  {
    id: "abc-climate-2",
    title: "Climate Science in Your Backyard",
    source: "ABC Education",
    type: "Worksheet",
    alignmentScore: 88,
    description:
      "Interactive activities and video resources that connect climate science to students' local environments across Australia.",
    whyThis:
      "ABC Education resources are curriculum-aligned and teacher-approved, with a strong emphasis on local Australian contexts and real-world data collection activities.",
    localContextTags: ["Local Context", "ABC Education", "Community Science"],
    trustBadges: ["Verified", "Curriculum Aligned"],
    url: "https://education.abc.net.au",
  },
  {
    id: "bom-explorer-3",
    title: "Climate Data Explorer",
    source: "Bureau of Meteorology",
    type: "Assessment",
    alignmentScore: 82,
    description:
      "Interactive data exploration tool using real Bureau of Meteorology climate datasets, ideal for scientific inquiry activities.",
    whyThis:
      "Provides authentic Australian climate data from the authoritative source, supporting scientific literacy and data analysis skills aligned with the NSW Science syllabus.",
    localContextTags: ["Official Government Data", "Real-time Data", "Scientific Inquiry"],
    trustBadges: ["Government Source", "Bias Checked"],
    url: "https://www.bom.gov.au/climate",
  },
];

const MOCK_RECENT_RESOURCES = [
  {
    id: "csiro-climate-1",
    title: "Australia's Changing Climate",
    subject: "Science",
    yearLevel: "Year 9",
    topic: "Climate Change",
    alignmentScore: 96,
    searchedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: "abc-climate-2",
    title: "Pythagoras in the Real World",
    subject: "Mathematics",
    yearLevel: "Year 8",
    topic: "Geometry",
    alignmentScore: 91,
    searchedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: "bom-explorer-3",
    title: "Federation and Australian Democracy",
    subject: "History",
    yearLevel: "Year 10",
    topic: "Australian History",
    alignmentScore: 87,
    searchedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
];

const MOCK_LESSON_PLAN = {
  resourceTitle: "Australia's Changing Climate",
  yearLevel: "Year 9",
  subject: "Science",
  topic: "Climate Change",
  duration: 60,
  overview:
    "Students investigate Australia's changing climate using CSIRO data, developing scientific inquiry skills and understanding of Earth and Space Sciences outcomes.",
  activities: [
    {
      name: "Hook",
      duration: 5,
      description:
        "Show striking before-and-after images of Australian climate events (Great Barrier Reef bleaching, bushfire satellite images). Ask: 'What story do these images tell?'",
    },
    {
      name: "Explore",
      duration: 20,
      description:
        "Students explore CSIRO's interactive climate data portal, recording temperature trends for their local region over the past 100 years. Complete the data collection worksheet.",
    },
    {
      name: "Analyse",
      duration: 15,
      description:
        "Groups analyse their data and create graphs showing trends. Compare local data with national averages. Identify patterns and anomalies in the dataset.",
    },
    {
      name: "Evaluate",
      duration: 15,
      description:
        "Class discussion: What evidence supports climate change in Australia? Students evaluate the reliability of different data sources and consider limitations of the data.",
    },
    {
      name: "Reflect",
      duration: 5,
      description:
        "Exit ticket: Students write one piece of evidence they found most convincing and one question they still have about Australian climate science.",
    },
  ],
  localContextCallout:
    "The 2019-20 Black Summer bushfire season burned approximately 18.6 million hectares across Australia — an area larger than the entire country of Syria. The fires killed or displaced an estimated 3 billion animals and resulted in 34 direct human deaths. Scientists have linked the unprecedented scale of this disaster to long-term climate trends, including increased temperatures and prolonged drought conditions across southeastern Australia. This makes our local climate data particularly compelling evidence for students to analyse.",
  questions: [
    {
      level: "Foundation",
      question:
        "Using the CSIRO data, describe two ways Australia's average temperature has changed over the past 50 years.",
    },
    {
      level: "Foundation",
      question:
        "What is the difference between weather and climate? Give one example of each related to Australia.",
    },
    {
      level: "Core",
      question:
        "Explain how the data you collected supports or challenges the claim that Australia is experiencing climate change. Use at least two pieces of evidence in your response.",
    },
    {
      level: "Core",
      question:
        "Compare the climate trends in your local region with the national average. What factors might explain any differences you observe?",
    },
    {
      level: "Extension",
      question:
        "Critically evaluate the limitations of using historical temperature records as evidence for climate change. What other types of data would strengthen or weaken this argument? How might selection bias affect our interpretation of this data?",
    },
  ],
  teacherNotes:
    "This lesson works best with devices for each student or pair. Pre-load the CSIRO Climate Data Portal on classroom devices. Consider pairing EAL/D students with supportive partners for the data analysis section. The hook images can be powerful — be sensitive to students who may have been directly affected by bushfires. Extension students could be directed to the BOM Climate Data Explorer for more complex datasets.",
};

async function fetchWithTimeout<T>(
  url: string,
  options: RequestInit,
  fallback: T
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    return (await response.json()) as T;
  } catch (err) {
    logger.warn({ err }, "API call failed, using mock fallback");
    return fallback;
  } finally {
    clearTimeout(timeout);
  }
}

router.post("/resources/search", async (req, res): Promise<void> => {
  const parsed = SearchResourcesBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const apiKey = process.env.CURRICULLM_API_KEY;

  let result = {
    alignment: MOCK_ALIGNMENT,
    resources: MOCK_RESOURCES,
  };

  if (apiKey) {
    result = await fetchWithTimeout(
      "https://api.curricullm.com/v1/search",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(parsed.data),
      },
      result
    );
  } else {
    req.log.info("No CURRICULLM_API_KEY set, using mock data");
  }

  res.json(result);
});

router.get("/resources/recent", async (_req, res): Promise<void> => {
  const data = GetRecentResourcesResponse.parse(MOCK_RECENT_RESOURCES);
  res.json(data);
});

router.get("/dashboard/stats", async (_req, res): Promise<void> => {
  const data = GetDashboardStatsResponse.parse({
    totalSearches: 47,
    resourcesGenerated: 23,
    averageAlignmentScore: 89,
    topSubject: "Science",
  });
  res.json(data);
});

export default router;
