export type DomainTier = 1 | 2 | 3 | 4;

export interface TierAScore {
  domainTier: DomainTier;
  domainLabel: string;
  domainDescription: string;
  isHttps: boolean;
  hasAuthorAttribution: boolean;
  hasLicence: boolean;
  licenceType: string;
  established: string;
  score: number; // 0-100
}

interface SourceEntry {
  tier: DomainTier;
  label: string;
  description: string;
  https: boolean;
  hasAuthor: boolean;
  hasLicence: boolean;
  licenceType: string;
  established: string;
}

const TRUSTED_SOURCES: Record<string, SourceEntry> = {
  // Tier 1 — Government & Peak Research Bodies
  "CSIRO": {
    tier: 1, label: "Government Research", description: "Australia's national science agency — peer-reviewed, government-funded",
    https: true, hasAuthor: true, hasLicence: true, licenceType: "Crown Copyright / CC BY", established: "Est. 1916",
  },
  "Bureau of Meteorology": {
    tier: 1, label: "Government Agency", description: "Australian Government Bureau of Meteorology — official climate and weather data",
    https: true, hasAuthor: true, hasLicence: true, licenceType: "Crown Copyright", established: "Est. 1906",
  },
  "ACARA": {
    tier: 1, label: "Curriculum Authority", description: "Australian Curriculum, Assessment and Reporting Authority — official AC v9 publisher",
    https: true, hasAuthor: true, hasLicence: true, licenceType: "CC BY 4.0", established: "Est. 2009",
  },
  "NESA": {
    tier: 1, label: "State Curriculum Authority", description: "NSW Education Standards Authority — official NSW syllabus publisher",
    https: true, hasAuthor: true, hasLicence: true, licenceType: "Crown Copyright", established: "Est. 2017",
  },
  "Australian Bureau of Statistics": {
    tier: 1, label: "Government Statistics", description: "Australia's official data agency — authoritative demographic and census data",
    https: true, hasAuthor: true, hasLicence: true, licenceType: "CC BY 4.0", established: "Est. 1905",
  },
  "Department of Education": {
    tier: 1, label: "Government Education", description: "Federal or state education department — official curriculum materials",
    https: true, hasAuthor: true, hasLicence: true, licenceType: "Crown Copyright", established: "Est. 1901",
  },
  "Australian Institute of Aboriginal and Torres Strait Islander Studies": {
    tier: 1, label: "Government Research", description: "AIATSIS — peak body for First Nations research and cultural materials",
    https: true, hasAuthor: true, hasLicence: true, licenceType: "CC BY-NC", established: "Est. 1964",
  },
  "Geoscience Australia": {
    tier: 1, label: "Government Science", description: "Australian Government geoscience agency — authoritative Earth science data",
    https: true, hasAuthor: true, hasLicence: true, licenceType: "CC BY 4.0", established: "Est. 1946",
  },

  // Tier 1 — Universities
  "University of Sydney": {
    tier: 1, label: "University Research", description: "Go8 research university — peer-reviewed educational resources",
    https: true, hasAuthor: true, hasLicence: true, licenceType: "CC BY / Academic Use", established: "Est. 1850",
  },
  "University of Melbourne": {
    tier: 1, label: "University Research", description: "Go8 research university — peer-reviewed educational resources",
    https: true, hasAuthor: true, hasLicence: true, licenceType: "CC BY / Academic Use", established: "Est. 1853",
  },
  "Australian National University": {
    tier: 1, label: "University Research", description: "Australia's national university — research-grade educational content",
    https: true, hasAuthor: true, hasLicence: true, licenceType: "CC BY / Academic Use", established: "Est. 1946",
  },

  // Tier 2 — Trusted Education Platforms
  "ABC Education": {
    tier: 2, label: "Public Broadcaster", description: "Australian Broadcasting Corporation education arm — curated, editorially reviewed",
    https: true, hasAuthor: true, hasLicence: true, licenceType: "ABC Terms of Use", established: "Est. 1932",
  },
  "Scootle": {
    tier: 2, label: "National Education Platform", description: "Australia's national digital learning resources platform — ACARA endorsed",
    https: true, hasAuthor: true, hasLicence: true, licenceType: "Various (CC / restricted)", established: "Est. 2009",
  },
  "Khan Academy": {
    tier: 2, label: "Non-profit Education", description: "Non-profit educational platform — peer-reviewed, free for all learners",
    https: true, hasAuthor: true, hasLicence: true, licenceType: "CC BY-NC-SA", established: "Est. 2008",
  },
  "National Library of Australia": {
    tier: 2, label: "National Library", description: "Trove and NLA collections — primary sources and verified Australian heritage content",
    https: true, hasAuthor: true, hasLicence: true, licenceType: "Various (CC / public domain)", established: "Est. 1901",
  },
  "Australian Museum": {
    tier: 2, label: "Cultural Institution", description: "Australia's oldest museum — expert-curated natural history and cultural content",
    https: true, hasAuthor: true, hasLicence: true, licenceType: "CC BY", established: "Est. 1827",
  },
  "Museum Victoria": {
    tier: 2, label: "Cultural Institution", description: "State-funded museum network — expert-curated science and cultural content",
    https: true, hasAuthor: true, hasLicence: true, licenceType: "CC BY", established: "Est. 1854",
  },
  "State Library of NSW": {
    tier: 2, label: "State Library", description: "NSW State Library — primary sources and verified Australian content",
    https: true, hasAuthor: true, hasLicence: true, licenceType: "Various (CC / public domain)", established: "Est. 1826",
  },
  "TED-Ed": {
    tier: 2, label: "Education Platform", description: "TED's education platform — expert-presented, editorially reviewed lessons",
    https: true, hasAuthor: true, hasLicence: true, licenceType: "CC BY-NC-ND", established: "Est. 2012",
  },
  "National Geographic Education": {
    tier: 2, label: "Education Publisher", description: "National Geographic Society — expert geography and science resources",
    https: true, hasAuthor: true, hasLicence: true, licenceType: "NG Terms of Use", established: "Est. 1888",
  },
  "Cambridge University Press": {
    tier: 2, label: "Academic Publisher", description: "Cambridge University Press — peer-reviewed academic publisher",
    https: true, hasAuthor: true, hasLicence: true, licenceType: "Publisher Copyright", established: "Est. 1534",
  },
  "Oxford University Press": {
    tier: 2, label: "Academic Publisher", description: "Oxford University Press — peer-reviewed academic publisher",
    https: true, hasAuthor: true, hasLicence: true, licenceType: "Publisher Copyright", established: "Est. 1586",
  },
  "Pearson Australia": {
    tier: 2, label: "Education Publisher", description: "Major Australian education publisher — curriculum-aligned textbooks",
    https: true, hasAuthor: true, hasLicence: true, licenceType: "Publisher Copyright", established: "Est. 1844",
  },

  // Tier 3 — Established Media
  "ABC News": {
    tier: 3, label: "Public Broadcaster", description: "Australian Broadcasting Corporation news — editorially reviewed, public service journalism",
    https: true, hasAuthor: true, hasLicence: false, licenceType: "ABC Terms of Use", established: "Est. 1932",
  },
  "The Guardian Australia": {
    tier: 3, label: "Quality Journalism", description: "The Guardian — independent quality journalism with editorial standards",
    https: true, hasAuthor: true, hasLicence: false, licenceType: "Guardian Terms of Use", established: "Est. 1821",
  },
  "Sydney Morning Herald": {
    tier: 3, label: "Quality Journalism", description: "Sydney Morning Herald — established Australian newspaper with editorial standards",
    https: true, hasAuthor: true, hasLicence: false, licenceType: "SMH Terms of Use", established: "Est. 1831",
  },
};

// Tier scoring weights
const SCORE_WEIGHTS = {
  tier1: 40, tier2: 28, tier3: 16, tier4: 5,
  https: 15,
  author: 20,
  licence: 15,
  established: 10,
};

export function getTierAScore(sourceName: string): TierAScore {
  // Try exact match first, then partial match
  let entry = TRUSTED_SOURCES[sourceName];

  if (!entry) {
    const lower = sourceName.toLowerCase();
    const key = Object.keys(TRUSTED_SOURCES).find(k => lower.includes(k.toLowerCase()) || k.toLowerCase().includes(lower));
    if (key) entry = TRUSTED_SOURCES[key];
  }

  if (!entry) {
    // Unknown source — Tier 4
    return {
      domainTier: 4, domainLabel: "Unverified Source",
      domainDescription: "Source not in trusted registry — verify independently",
      isHttps: false, hasAuthorAttribution: false, hasLicence: false,
      licenceType: "Unknown", established: "Unknown",
      score: computeScore(4, false, false, false),
    };
  }

  return {
    domainTier: entry.tier,
    domainLabel: entry.label,
    domainDescription: entry.description,
    isHttps: entry.https,
    hasAuthorAttribution: entry.hasAuthor,
    hasLicence: entry.hasLicence,
    licenceType: entry.licenceType,
    established: entry.established,
    score: computeScore(entry.tier, entry.https, entry.hasAuthor, entry.hasLicence),
  };
}

function computeScore(tier: DomainTier, https: boolean, author: boolean, licence: boolean): number {
  const tierPoints = tier === 1 ? SCORE_WEIGHTS.tier1 : tier === 2 ? SCORE_WEIGHTS.tier2 : tier === 3 ? SCORE_WEIGHTS.tier3 : SCORE_WEIGHTS.tier4;
  return Math.min(100,
    tierPoints +
    (https ? SCORE_WEIGHTS.https : 0) +
    (author ? SCORE_WEIGHTS.author : 0) +
    (licence ? SCORE_WEIGHTS.licence : 0) +
    SCORE_WEIGHTS.established
  );
}
