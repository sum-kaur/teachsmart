const RESOURCES_KEY = 'teachsmart_library';
const LESSONS_KEY = 'teachsmart_lessons';

export type SavedResource = {
  id: string; title: string; source: string; type: string; description: string;
  alignmentScore: number; safetyRating: string; biasFlag: string;
  localContextTags: string[]; outcomeIds: string[]; whyThisResource: string;
  subject: string; yearLevel: string; topic: string; savedAt: string;
};

export type SavedLesson = {
  id: string; title: string; subject: string; yearLevel: string; topic: string;
  objective: string; duration: string;
  activities: { label: string; text: string }[];
  localExample: { title: string; body: string };
  questions: { q: string; difficulty: string }[];
  savedAt: string;
};

function load<T>(key: string): T[] {
  try { return JSON.parse(localStorage.getItem(key) || '[]') as T[]; } catch { return []; }
}
function save<T>(key: string, items: T[]) {
  localStorage.setItem(key, JSON.stringify(items));
}

export function getSavedResources(): SavedResource[] { return load<SavedResource>(RESOURCES_KEY); }
export function getSavedLessons(): SavedLesson[] { return load<SavedLesson>(LESSONS_KEY); }

export function saveResource(resource: Omit<SavedResource, 'savedAt'>): void {
  const items = getSavedResources();
  if (items.find(r => r.id === resource.id)) return;
  save(RESOURCES_KEY, [{ ...resource, savedAt: new Date().toISOString() }, ...items]);
}

export function saveLesson(lesson: Omit<SavedLesson, 'id' | 'savedAt'>): void {
  const items = getSavedLessons();
  save(LESSONS_KEY, [{ ...lesson, id: `lesson-${Date.now()}`, savedAt: new Date().toISOString() }, ...items]);
}

export function deleteResource(id: string): void {
  save(RESOURCES_KEY, getSavedResources().filter(r => r.id !== id));
}

export function deleteLesson(id: string): void {
  save(LESSONS_KEY, getSavedLessons().filter(l => l.id !== id));
}

export function clearAll(): void {
  localStorage.removeItem(RESOURCES_KEY);
  localStorage.removeItem(LESSONS_KEY);
}
