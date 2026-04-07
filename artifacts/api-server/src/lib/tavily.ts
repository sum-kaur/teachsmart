import { tavily } from "@tavily/core";

const client = tavily({ apiKey: process.env.TAVILY_API_KEY ?? "" });

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
