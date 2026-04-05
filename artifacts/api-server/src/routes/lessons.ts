import { Router, type IRouter } from "express";
import { GenerateLessonPlanBody } from "@workspace/api-zod";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const TIMEOUT_MS = 8000;

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
    logger.warn({ err }, "Cogniti API call failed, using mock fallback");
    return fallback;
  } finally {
    clearTimeout(timeout);
  }
}

router.post("/lessons/generate", async (req, res): Promise<void> => {
  const parsed = GenerateLessonPlanBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const apiKey = process.env.COGNITI_API_KEY;

  const mockPlan = {
    ...MOCK_LESSON_PLAN,
    resourceTitle: parsed.data.resourceTitle,
    yearLevel: parsed.data.yearLevel,
    subject: parsed.data.subject,
    topic: parsed.data.topic,
  };

  if (apiKey) {
    const result = await fetchWithTimeout(
      "https://api.cogniti.com/v1/lesson-plan",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(parsed.data),
      },
      mockPlan
    );
    res.json(result);
  } else {
    req.log.info("No COGNITI_API_KEY set, using mock lesson plan");
    res.json(mockPlan);
  }
});

export default router;
