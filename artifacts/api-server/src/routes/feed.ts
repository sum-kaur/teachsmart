import { Router, type IRouter } from "express";
import { GetFeedBody } from "@workspace/api-zod";
import { groq, GROQ_MODEL } from "../lib/groq";
import { LOCAL_CONTEXT, STATE_FALLBACK, BOM_URLS, MOCK_WEATHER } from "../lib/localContext";

const router: IRouter = Router();
const BOM_TIMEOUT_MS = 5000;
const AI_TIMEOUT_MS = 8000;

interface WeatherObs {
  temp: number;
  description: string;
  rainfall: number;
  wind: number;
  city: string;
  usedFallback: boolean;
}

async function fetchBomWeather(city: string): Promise<WeatherObs> {
  const url = BOM_URLS[city];
  if (!url) throw new Error(`No BOM URL for city: ${city}`);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), BOM_TIMEOUT_MS);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) throw new Error(`BOM HTTP ${response.status}`);
    const json = await response.json() as any;
    const obs = json?.observations?.data?.[0];
    if (!obs) throw new Error("No BOM observation data");

    return {
      temp: obs.air_temp ?? obs.apparent_t ?? 20,
      description: obs.weather ?? obs.vis_km ?? "Clear",
      rainfall: obs.rain_trace === "-" ? 0 : (parseFloat(obs.rain_trace) || 0),
      wind: obs.wind_spd_kmh ?? 0,
      city,
      usedFallback: false,
    };
  } catch (err) {
    clearTimeout(timeout);
    const mock = MOCK_WEATHER[city] ?? { temp: 20, description: "Fine", rainfall: 0, wind: 10 };
    return { ...mock, city, usedFallback: true };
  }
}

const MOCK_FEED_ITEMS = [
  {
    type: "environment",
    headline: "Local waterways and water cycle",
    teachingAngle: "Use your local river or estuary as a real-world example to explore the water cycle, catchment management and the impact of urbanisation on water quality.",
    curriculumLink: "Earth and Space Sciences – Water in the environment",
    icon: "🌿",
  },
  {
    type: "local_history",
    headline: "First Nations connection to Country",
    teachingAngle: "Explore how Aboriginal and Torres Strait Islander peoples have managed and related to this landscape for over 65,000 years, connecting to curriculum content on sustainability and environmental management.",
    curriculumLink: "Cross-curriculum – Aboriginal and Torres Strait Islander Histories and Cultures",
    icon: "🗺",
  },
  {
    type: "weather",
    headline: "This week's weather as a data set",
    teachingAngle: "Use current local weather data as a primary source for graphing, statistical analysis and discussion of climate patterns versus daily weather variability.",
    curriculumLink: "Statistics and Probability – Data representation",
    icon: "🌦",
  },
];

router.post("/feed", async (req, res): Promise<void> => {
  const parsed = GetFeedBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { postcode, state, subject, yearLevel } = parsed.data;

  const localContext = LOCAL_CONTEXT[postcode] ?? {
    ...(STATE_FALLBACK[state] ?? STATE_FALLBACK["NSW"]),
    postcode,
  };

  const bomCity = localContext.bomCity ?? "sydney";

  const [weather] = await Promise.all([
    fetchBomWeather(bomCity),
  ]);

  const prompt = `You are a creative Australian curriculum teacher assistant.

Local context for this teacher:
- Location: ${postcode}, ${state} (${localContext.suburb})
- Aboriginal Country: ${localContext.country}
- Nearby landmarks: ${localContext.landmarks}
- Local context: ${localContext.context}
- Subject: ${subject}, ${yearLevel}
- Current weather: ${weather.temp}°C, ${weather.description}, rainfall ${weather.rainfall}mm, wind ${weather.wind}km/h

Generate 3 teaching opportunity cards for "This Week in Your Area". 
Each card should connect something real and current about this location 
to a curriculum teaching opportunity for this teacher's subject and year level.
Make them specific to this location — use real place names, country names, and landmarks.

Return ONLY valid JSON, no markdown:
{
  "feedItems": [
    {
      "type": "weather" | "local_history" | "environment" | "community",
      "headline": string (max 10 words),
      "teachingAngle": string (1-2 sentences connecting this to curriculum),
      "curriculumLink": string (which strand or topic this connects to),
      "icon": "🌦" | "🗺" | "🌿" | "🏘"
    }
  ]
}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

  let feedItems = MOCK_FEED_ITEMS;
  let usedFallback = false;

  try {
    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 2000,
      temperature: 0.7,
    });
    clearTimeout(timeout);

    const text = completion.choices[0]?.message?.content ?? "";
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsedJson = JSON.parse(cleaned);
    feedItems = parsedJson.feedItems ?? MOCK_FEED_ITEMS;
  } catch (err) {
    clearTimeout(timeout);
    req.log.warn({ err }, "AI feed call failed, using fallback");
    usedFallback = true;
  }

  res.json({
    feedItems,
    weather,
    localContext: {
      suburb: localContext.suburb,
      country: localContext.country,
      landmarks: localContext.landmarks,
    },
    usedFallback,
  });
});

export default router;
