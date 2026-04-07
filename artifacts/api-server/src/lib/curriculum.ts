import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { logger } from "./logger";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface ContentDescription {
  id: string;
  description: string;
}

interface Strand {
  name: string;
  contentDescriptions: ContentDescription[];
}

interface YearLevel {
  year: string;
  strands: Strand[];
}

interface CurriculumData {
  learningArea: string;
  version: string;
  yearLevels: YearLevel[];
}

// dist/index.mjs lives at artifacts/api-server/dist/
// data/ lives at teachsmart/data/ — 3 levels up
const DATA_DIR = join(__dirname, "../../../data");

const CURRICULUM_FILES: Record<string, string> = {
  science: "science.json",
  english: "english.json",
  mathematics: "mathematics.json",
  maths: "mathematics.json",
  math: "mathematics.json",
  "humanities and social sciences": "humanities.json",
  humanities: "humanities.json",
  history: "humanities.json",
  geography: "humanities.json",
  "the arts": "arts.json",
  arts: "arts.json",
  "visual arts": "arts.json",
  music: "arts.json",
  drama: "arts.json",
  "health and physical education": "hpe.json",
  hpe: "hpe.json",
  "physical education": "hpe.json",
  health: "hpe.json",
  technologies: "technologies.json",
  technology: "technologies.json",
  "digital technologies": "technologies.json",
  languages: "languages.json",
};

let curriculumCache: Record<string, CurriculumData> = {};

function loadCurriculumData(): void {
  const files = [...new Set(Object.values(CURRICULUM_FILES))];
  for (const filename of files) {
    try {
      const content = readFileSync(join(DATA_DIR, filename), "utf-8");
      const data: CurriculumData = JSON.parse(content);
      curriculumCache[filename] = data;
      logger.info({ filename, learningArea: data.learningArea }, "Loaded curriculum data");
    } catch (err) {
      logger.warn({ filename, err }, "Failed to load curriculum data file");
    }
  }
}

loadCurriculumData();

export function getOutcomesForSubjectAndYear(
  subject: string,
  yearLevel: string
): { strand: string; outcomes: ContentDescription[] } | null {
  const normalised = subject.toLowerCase().trim();
  const filename = CURRICULUM_FILES[normalised];
  if (!filename) {
    logger.warn({ subject }, "No curriculum file found for subject");
    return null;
  }

  const data = curriculumCache[filename];
  if (!data) return null;

  const yearData = data.yearLevels.find(
    (yl) =>
      yl.year.toLowerCase() === yearLevel.toLowerCase() ||
      yl.year.toLowerCase().replace("year ", "") === yearLevel.toLowerCase().replace("year ", "")
  );

  if (!yearData) {
    logger.warn({ subject, yearLevel }, "No data found for year level");
    return null;
  }

  const allOutcomes: ContentDescription[] = [];
  const strandNames: string[] = [];

  for (const strand of yearData.strands) {
    strandNames.push(strand.name);
    allOutcomes.push(...strand.contentDescriptions);
  }

  return {
    strand: strandNames.join(", "),
    outcomes: allOutcomes,
  };
}
