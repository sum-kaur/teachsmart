import React, { useState, useRef, useEffect } from "react";
import { CalendarDays, Loader2, ChevronRight, Pencil, Check, X } from "lucide-react";

type WeekData = {
  weekNumber: number; dateRange: string; topic: string;
  outcomes: string[]; keyActivities: string[]; assessmentEvent: string | null; resources: string[];
};

type SemesterData = { semesterTitle: string; weeks: WeekData[]; usedFallback: boolean };

type Props = {
  subject: string; yearLevel: string; state: string;
  preferredLanguage: string;
  onWeekSelect: (week: WeekData) => void;
};

const YEAR_LEVELS = ['Year 7', 'Year 8', 'Year 9', 'Year 10', 'Year 11', 'Year 12'];
const SUBJECTS = [
  'Biology', 'Business Studies', 'Chemistry', 'Drama', 'Economics', 'English',
  'Geography', 'History', 'Legal Studies', 'Mathematics', 'Mathematics Advanced',
  'Music', 'PDHPE', 'Physics', 'Psychology', 'Science', 'Visual Arts',
];
const STATES = ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'];

const WEEK_TYPE_COLOR: Record<string, string> = {
  exam: 'bg-red-50 border-red-200 hover:border-red-300',
  quiz: 'bg-amber-50 border-amber-200 hover:border-amber-300',
  assignment: 'bg-orange-50 border-orange-200 hover:border-orange-300',
  content: 'bg-emerald-50 border-emerald-200 hover:border-emerald-300',
  revision: 'bg-blue-50 border-blue-200 hover:border-blue-300',
};

const WEEK_BADGE: Record<string, string> = {
  exam: 'bg-red-100 text-red-700',
  quiz: 'bg-amber-100 text-amber-700',
  assignment: 'bg-orange-100 text-orange-700',
};

function useMatchingSubject(propSubject: string): string {
  const norm = propSubject?.trim() || '';
  return SUBJECTS.includes(norm) ? norm : (SUBJECTS.find(s => s.toLowerCase().includes(norm.toLowerCase())) ?? 'History');
}

function useMatchingYearLevel(prop: string): string {
  const norm = prop?.trim() || '';
  return YEAR_LEVELS.includes(norm) ? norm : (YEAR_LEVELS.find(y => y.toLowerCase() === norm.toLowerCase()) ?? 'Year 9');
}

function useMatchingState(prop: string): string {
  const norm = prop?.trim().toUpperCase() || '';
  return STATES.includes(norm) ? norm : (STATES.find(s => s === norm) ?? 'NSW');
}

export default function SemesterPlanner({ subject, yearLevel, state, preferredLanguage, onWeekSelect }: Props) {
  const [term, setTerm] = useState('Term 1');
  const [localYearLevel, setLocalYearLevel] = useState(() => useMatchingYearLevel(yearLevel));
  const [localSubject, setLocalSubject] = useState(() => useMatchingSubject(subject));
  const [localState, setLocalState] = useState(() => useMatchingState(state));
  const [semesterData, setSemesterData] = useState<SemesterData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingWeek, setEditingWeek] = useState<number | null>(null);
  const [editingTopic, setEditingTopic] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingWeek !== null) editInputRef.current?.focus();
  }, [editingWeek]);

  useEffect(() => {
    setLocalYearLevel(useMatchingYearLevel(yearLevel));
  }, [yearLevel]);

  useEffect(() => {
    setLocalSubject(useMatchingSubject(subject));
  }, [subject]);

  useEffect(() => {
    setLocalState(useMatchingState(state));
  }, [state]);

  const generate = async () => {
    setIsGenerating(true);
    setSemesterData(null);
    setEditingWeek(null);
    try {
      const res = await fetch('/api/semester-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: localSubject,
          yearLevel: localYearLevel,
          state: localState,
          term,
          totalWeeks: 10,
          weekTopics: [],
          preferredLanguage,
        }),
      });
      const data = await res.json() as SemesterData;
      setSemesterData(data);
    } catch {
      setSemesterData({
        semesterTitle: `${localYearLevel} ${localSubject} — ${term}`,
        weeks: Array.from({ length: 10 }, (_, i) => ({
          weekNumber: i + 1,
          dateRange: `Week ${i + 1}`,
          topic: `Unit ${i + 1}: To be planned`,
          outcomes: [],
          keyActivities: ['Content delivery', 'Structured activities', 'Review and consolidation'],
          assessmentEvent: i === 9 ? 'exam' : i === 4 ? 'quiz' : null,
          resources: [],
        })),
        usedFallback: true,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const startEdit = (e: React.MouseEvent, week: WeekData) => {
    e.stopPropagation();
    setEditingWeek(week.weekNumber);
    setEditingTopic(week.topic);
  };

  const saveEdit = () => {
    if (!semesterData || editingWeek === null) return;
    setSemesterData({
      ...semesterData,
      weeks: semesterData.weeks.map(w =>
        w.weekNumber === editingWeek ? { ...w, topic: editingTopic.trim() || w.topic } : w
      ),
    });
    setEditingWeek(null);
  };

  const cancelEdit = () => {
    setEditingWeek(null);
    setEditingTopic('');
  };

  const getWeekColor = (week: WeekData) => {
    if (!week.assessmentEvent) return WEEK_TYPE_COLOR.content;
    return WEEK_TYPE_COLOR[week.assessmentEvent] || WEEK_TYPE_COLOR.content;
  };

  const selectClass = "w-full border border-border rounded-xl px-3 py-2.5 text-[14px] bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary";
  const labelClass = "block text-[12px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5";

  return (
    <div className="flex-1 lg:ml-60 flex flex-col min-h-screen bg-slate-50">
      <div className="bg-white px-4 sm:px-6 lg:px-8 py-5 border-b border-border">
        <div className="font-serif text-[22px] text-foreground tracking-tight">Semester Planner</div>
        <div className="text-[13px] text-muted-foreground mt-0.5">
          AI generates your full 10-week plan instantly — then click any week topic to edit it inline
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8 flex-1">
        <div className="max-w-5xl mx-auto">

          {/* ── Setup form ── */}
          <div className="bg-white rounded-2xl shadow-sm border border-border p-4 sm:p-6 mb-6">
            <div className="text-[15px] font-bold text-foreground mb-5">Plan details</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
              <div>
                <label className={labelClass}>School term</label>
                <select value={term} onChange={e => setTerm(e.target.value)} className={selectClass} aria-label="School term">
                  {['Term 1', 'Term 2', 'Term 3', 'Term 4'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Year level</label>
                <select value={localYearLevel} onChange={e => setLocalYearLevel(e.target.value)} className={selectClass} aria-label="Year level">
                  {YEAR_LEVELS.map(y => <option key={y}>{y}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Subject</label>
                <select value={localSubject} onChange={e => setLocalSubject(e.target.value)} className={selectClass} aria-label="Subject">
                  {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>State</label>
                <select value={localState} onChange={e => setLocalState(e.target.value)} className={selectClass} aria-label="State">
                  {STATES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <button
              onClick={generate}
              disabled={isGenerating}
              className="flex items-center gap-2.5 bg-primary text-white border-none px-6 py-3 rounded-xl text-[14px] font-bold cursor-pointer hover:bg-teal-700 transition-colors shadow-sm disabled:opacity-60"
              aria-label="Generate semester plan"
            >
              {isGenerating
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating 10-week plan…</>
                : <><CalendarDays className="w-4 h-4" /> Generate Semester Plan</>}
            </button>
          </div>

          {/* ── Generating spinner ── */}
          {isGenerating && (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin mb-3 text-primary" />
              <div className="text-[14px] font-medium text-slate-500">Building your {localYearLevel} {localSubject} — {term} plan…</div>
              <div className="text-[12px] text-slate-400 mt-1">This takes about 15 seconds</div>
            </div>
          )}

          {/* ── Results grid ── */}
          {!isGenerating && semesterData && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="font-serif text-xl text-foreground">{semesterData.semesterTitle}</div>
                  <div className="text-[12px] text-slate-400 mt-0.5">Click any week topic to edit it · Click the card to search resources</div>
                </div>
                <div className="flex items-center gap-3">
                  {semesterData.usedFallback && (
                    <span className="text-[11px] text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full font-medium">Using template data</span>
                  )}
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> Content</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Quiz</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" /> Exam</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {semesterData.weeks.map(week => {
                  const isEditing = editingWeek === week.weekNumber;
                  return (
                    <div
                      key={week.weekNumber}
                      onClick={() => !isEditing && onWeekSelect(week)}
                      className={`rounded-2xl border-2 p-4 transition-all hover:shadow-md group ${getWeekColor(week)} ${isEditing ? 'cursor-default' : 'cursor-pointer'}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0 pr-2">
                          <div className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                            Week {week.weekNumber} · {week.dateRange}
                          </div>

                          {/* Inline topic editor */}
                          {isEditing ? (
                            <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                              <input
                                ref={editInputRef}
                                value={editingTopic}
                                onChange={e => setEditingTopic(e.target.value)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') saveEdit();
                                  if (e.key === 'Escape') cancelEdit();
                                }}
                                className="flex-1 border border-primary rounded-lg px-2 py-1 text-[14px] font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white min-w-0"
                              />
                              <button
                                onClick={saveEdit}
                                className="p-1 rounded-lg bg-primary text-white hover:bg-teal-700 transition-colors shrink-0"
                                title="Save"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="p-1 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors shrink-0"
                                title="Cancel"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-start gap-1.5 group/topic">
                              <div className="text-[15px] font-bold text-foreground leading-snug flex-1">{week.topic}</div>
                              <button
                                onClick={e => startEdit(e, week)}
                                className="opacity-0 group-hover/topic:opacity-100 transition-opacity p-1 rounded hover:bg-white/60 text-slate-400 hover:text-primary shrink-0 mt-0.5"
                                title="Edit topic"
                              >
                                <Pencil className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          {week.assessmentEvent && (
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${WEEK_BADGE[week.assessmentEvent] || 'bg-slate-100 text-slate-600'}`}>
                              {week.assessmentEvent}
                            </span>
                          )}
                          {!isEditing && (
                            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-primary transition-colors" />
                          )}
                        </div>
                      </div>

                      {/* Outcomes */}
                      {week.outcomes.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {week.outcomes.slice(0, 3).map(o => (
                            <span key={o} className="text-[10px] bg-white/70 text-teal-700 border border-teal-100 px-1.5 py-0.5 rounded font-semibold">{o}</span>
                          ))}
                        </div>
                      )}

                      {/* Activities preview */}
                      {!isEditing && week.keyActivities.length > 0 && (
                        <div className="text-[12px] text-slate-500">{week.keyActivities.slice(0, 2).join(' · ')}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
