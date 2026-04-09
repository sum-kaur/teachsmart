const BRAVE_SEARCH_URL = "https://api.search.brave.com/res/v1/web/search";

function getBraveSearchKey() {
  return process.env.BRAVE_SEARCH_API_KEY;
}

export function isBraveSearchAvailable() {
  return !!getBraveSearchKey();
}

export const TRUSTED_AU_DOMAINS = [
  "csiro.au",
  "bom.gov.au",
  "education.gov.au",
  "educationstandards.nsw.edu.au",
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
  // Additional trusted education domains
  "education.nsw.gov.au",
  "education.vic.gov.au",
  "education.qld.gov.au",
  "education.sa.gov.au",
  "education.wa.gov.au",
  "education.tas.gov.au",
  "education.nt.gov.au",
  "education.act.gov.au",
  "humanrights.gov.au",
  "naa.gov.au",
  "awm.gov.au",
  "slnsw.gov.au",
  "sl.nsw.gov.au",
  "trove.nla.gov.au",
  "nla.gov.au",
  "nga.gov.au",
  "environment.gov.au",
  "agriculture.gov.au",
  "health.gov.au",
  "pmc.gov.au",
  "reconciliation.org.au",
  "amnesty.org.au",
  "coolaustralia.org",
  "inquisitive.com",
  "twinkl.com.au",
  "khanacademy.org",
  "teachstarter.com",
  "studyladder.com.au",
  "skwirk.com",
  "readwritethink.org",
  "sciencearchive.org.au",
  "anu.edu.au",
  "sydney.edu.au",
  "unimelb.edu.au",
  "monash.edu",
  "unsw.edu.au",
  "uq.edu.au",
  "adelaide.edu.au",
  "uwa.edu.au",
  "uts.edu.au",
  "qut.edu.au",
];

export interface BraveResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

function isTrustedDomain(urlString: string) {
  try {
    const hostname = new URL(urlString).hostname.toLowerCase();
    return TRUSTED_AU_DOMAINS.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));
  } catch {
    return false;
  }
}

function buildQueryVariants(query: string) {
  return [query];
}

function buildFocusedQueryVariants(
  subject: string,
  yearLevel: string,
  topic: string,
  state: string,
  resourceType?: string,
) {
  const normalizedSubject = subject.toLowerCase();
  const normalizedState = state.toLowerCase();
  const stageHint = yearLevel.toLowerCase() === "year 11" || yearLevel.toLowerCase() === "year 12" ? "stage 6" : "";
  const seniorHint = yearLevel.toLowerCase() === "year 11" || yearLevel.toLowerCase() === "year 12" ? "senior secondary" : "";
  const wantsLessonPlanLikePage = !resourceType || resourceType.toLowerCase() === "lesson plan";

  const variants = [
    `${topic} ${yearLevel} ${subject} ${state} teaching resource`,
    `${topic} ${subject} ${yearLevel} Australian curriculum`,
    `${topic} ${subject} Australia classroom resource`,
    `${topic} ${subject} ${stageHint}`.trim(),
    `${topic} ${subject} ${seniorHint}`.trim(),
  ];

  if (wantsLessonPlanLikePage) {
    variants.push(`${topic} ${subject} ${yearLevel} lesson plan Australia`);
  }

  if (normalizedState === "nsw") {
    variants.push(`${topic} site:educationstandards.nsw.edu.au ${subject} ${stageHint}`.trim());
  }

  if (normalizedSubject.includes("science")) {
    variants.push(`${topic} chemistry Australia classroom resource`);
    variants.push(`${topic} site:abc.net.au/education science`);
  }

  return Array.from(new Set(variants.filter(Boolean)));
}

export async function searchEducationalResources(
  query: string,
  maxResults = 6,
  options?: {
    subject?: string;
    yearLevel?: string;
    topic?: string;
    state?: string;
    resourceType?: string;
  },
): Promise<BraveResult[]> {
  const braveSearchKey = getBraveSearchKey();
  if (!braveSearchKey) return [];

  const deduped = new Map<string, BraveResult>();
  const variants = options?.subject && options?.yearLevel && options?.topic && options?.state
    ? buildFocusedQueryVariants(options.subject, options.yearLevel, options.topic, options.state, options.resourceType)
    : buildQueryVariants(query);

  for (const variant of variants) {
    const url = new URL(BRAVE_SEARCH_URL);
    url.searchParams.set("q", variant);
    url.searchParams.set("count", String(maxResults));
    url.searchParams.set("search_lang", "en");
    url.searchParams.set("country", "AU");
    url.searchParams.set("safesearch", "moderate");
    url.searchParams.set("spellcheck", "true");
    url.searchParams.set("text_decorations", "false");
    url.searchParams.set("result_filter", "web");

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "X-Subscription-Token": braveSearchKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Brave search HTTP ${response.status}`);
    }

    const data = await response.json() as {
      web?: {
        results?: Array<{
          title?: string;
          url?: string;
          description?: string;
          extra_snippets?: string[];
        }>;
      };
    };

    for (const result of data.web?.results ?? []) {
      const urlValue = result.url ?? "";
      if (!urlValue || deduped.has(urlValue)) continue;

      const trusted = isTrustedDomain(urlValue);
      deduped.set(urlValue, {
        title: result.title ?? "",
        url: urlValue,
        content: [result.description ?? "", ...(result.extra_snippets ?? [])].join(" ").trim(),
        score: trusted ? 2 : 1,
      });
    }

    if (deduped.size >= maxResults) break;
  }

  return Array.from(deduped.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);
}
