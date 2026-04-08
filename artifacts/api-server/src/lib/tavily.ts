import { tavily } from "@tavily/core";

const TAVILY_KEY = process.env.TAVILY_API_KEY;

// Only create the client if a real key is present.
// When running locally without the key the app falls back to Groq-only mode.
const client = TAVILY_KEY ? tavily({ apiKey: TAVILY_KEY }) : null;

export const TAVILY_AVAILABLE = !!client;

export const TRUSTED_AU_DOMAINS = [
  "csiro.au",
  "bom.gov.au",
  "education.gov.au",
  "abc.net.au",
  "scootle.edu.au",
  "australiancurriculum.edu.au",
  "nma.gov.au",
  "aiatsis.gov.au",
  "abs.gov.au",
  "nesa.nsw.edu.au",
  "vcaa.vic.edu.au",
  "qcaa.qld.edu.au",
  "sace.sa.edu.au",
  "school.edu.au",
  "det.wa.edu.au",
  "acara.edu.au",
  "geoscience.gov.au",
  "ansto.gov.au",
  "ala.org.au",
  "natlib.gov.au",
  "awe.gov.au",
  "museumsvictoria.com.au",
  "sydneylivingmuseums.com.au",
  "history.sa.gov.au",
];

export interface TavilyResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

export async function searchEducationalResources(
  query: string,
  maxResults = 5
): Promise<TavilyResult[]> {
  if (!client) {
    // No API key — silently skip, caller will use Groq-only path
    return [];
  }

  const response = await client.search(query, {
    maxResults,
    includeDomains: TRUSTED_AU_DOMAINS,
    includeAnswer: false,
    searchDepth: "basic",
  });

  return (response.results ?? []).map((r) => ({
    title: r.title ?? "",
    url: r.url ?? "",
    content: r.content ?? "",
    score: r.score ?? 0,
  }));
}
