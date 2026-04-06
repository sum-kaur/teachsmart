import React, { useState } from "react";
import { CalendarDays, Loader2, ChevronRight } from "lucide-react";

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

const WEEK_TYPE_COLOR: Record<string, string> = {
  exam: 'bg-red-50 border-red-200 hover:border-red-300',
  quiz: 'bg-amber-50 border-amber-200 hover:border-amber-300',
  assignment: 'bg-orange-50 border-orange-200 hover:border-orange-300',
  content: 'bg-green-50 border-green-200 hover:border-green-300',
  revision: 'bg-blue-50 border-blue-200 hover:border-blue-300',
};

const WEEK_BADGE: Record<string, string> = {
  exam: 'bg-red-100 text-red-700',
  quiz: 'bg-amber-100 text-amber-700',
  assignment: 'bg-orange-100 text-orange-700',
};

export default function SemesterPlanner({ subject, yearLevel, state, preferredLanguage, onWeekSelect }: Props) {
  const [term, setTerm] = useState('Term 1');
  const [startDate, setStartDate] = useState('');
  const [totalWeeks, setTotalWeeks] = useState(10);
  const [semesterData, setSemesterData] = useState<SemesterData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [weekTopics, setWeekTopics] = useState<{ weekNumber: number; topic: string; assessmentEvent: string }[]>(
    Array.from({ length: 10 }, (_, i) => ({ weekNumber: i + 1, topic: '', assessmentEvent: '' }))
  );

  const handleWeeksChange = (n: number) => {
    setTotalWeeks(n);
    setWeekTopics(Array.from({ length: n }, (_, i) => weekTopics[i] || { weekNumber: i + 1, topic: '', assessmentEvent: '' }));
  };

  const generate = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/semester-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, yearLevel, state, term, startDate, totalWeeks, weekTopics: weekTopics.filter(w => w.topic), preferredLanguage }),
      });
      const data = await res.json() as SemesterData;
      setSemesterData(data);
    } catch {
      setSemesterData({
        semesterTitle: `${yearLevel} ${subject} — ${term}`,
        weeks: Array.from({ length: totalWeeks }, (_, i) => ({
          weekNumber: i + 1, dateRange: `Week ${i + 1}`, topic: `Topic ${i + 1}`,
          outcomes: [], keyActivities: ['Content delivery', 'Class activities', 'Review'],
          assessmentEvent: i === totalWeeks - 1 ? 'exam' : null, resources: [],
        })),
        usedFallback: true,
      });
    } finally { setIsGenerating(false); }
  };

  const getWeekColor = (week: WeekData) => {
    if (!week.assessmentEvent) return WEEK_TYPE_COLOR.content;
    return WEEK_TYPE_COLOR[week.assessmentEvent] || WEEK_TYPE_COLOR.content;
  };

  return (
    <div className="flex-1 ml-60 flex flex-col min-h-screen bg-slate-50">
      <div className="bg-white px-8 py-5 border-b border-border">
        <div className="font-serif text-[22px] text-foreground tracking-tight">Semester Planner</div>
        <div className="text-[13px] text-muted-foreground mt-0.5">Build a full semester overview with AI — then click any week to search resources</div>
      </div>

      <div className="p-8 flex-1">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm border border-border p-6 mb-6">
            <div className="text-[15px] font-bold text-foreground mb-5">Semester Setup</div>
            <div className="grid grid-cols-4 gap-4 mb-5">
              <div>
                <label className="block text-[12px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">School term</label>
                <select value={term} onChange={e => setTerm(e.target.value)} className="w-full border border-border rounded-xl px-3 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" aria-label="School term">
                  {['Term 1', 'Term 2', 'Term 3', 'Term 4'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Start date</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full border border-border rounded-xl px-3 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" aria-label="Start date" />
              </div>
              <div>
                <label className="block text-[12px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Total weeks</label>
                <input type="number" min="4" max="20" value={totalWeeks} onChange={e => handleWeeksChange(Number(e.target.value))} className="w-full border border-border rounded-xl px-3 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" aria-label="Total weeks" />
              </div>
              <div className="flex items-end">
                <div className="flex gap-1.5 text-[11px] text-slate-400 flex-wrap">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400 inline-block"></span> Content</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block"></span> Quiz</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block"></span> Exam</span>
                </div>
              </div>
            </div>

            <div className="mb-5">
              <div className="text-[13px] font-semibold text-foreground mb-3">Pre-fill week topics (optional)</div>
              <div className="grid grid-cols-2 gap-3">
                {weekTopics.slice(0, Math.min(totalWeeks, 10)).map((wt, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <span className="text-[12px] text-slate-400 font-medium w-12 shrink-0">Wk {i + 1}</span>
                    <input value={wt.topic} onChange={e => setWeekTopics(prev => prev.map((w, j) => j === i ? { ...w, topic: e.target.value } : w))}
                      placeholder="Topic (optional)" className="flex-1 border border-border rounded-lg px-3 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" aria-label={`Week ${i+1} topic`} />
                    <select value={wt.assessmentEvent} onChange={e => setWeekTopics(prev => prev.map((w, j) => j === i ? { ...w, assessmentEvent: e.target.value } : w))}
                      className="border border-border rounded-lg px-2 py-1.5 text-[12px] focus:outline-none focus:border-primary bg-white" aria-label={`Week ${i+1} assessment`}>
                      <option value="">None</option>
                      <option value="quiz">Quiz</option>
                      <option value="assignment">Assignment</option>
                      <option value="exam">Exam</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={generate} disabled={isGenerating} className="flex items-center gap-2.5 bg-primary text-white border-none px-6 py-3 rounded-xl text-[14px] font-bold cursor-pointer hover:bg-teal-700 transition-colors shadow-sm disabled:opacity-60" aria-label="Generate semester plan">
              {isGenerating ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating Semester Plan...</> : <><CalendarDays className="w-4 h-4" /> Generate Semester Plan with AI</>}
            </button>
          </div>

          {semesterData && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="font-serif text-xl text-foreground">{semesterData.semesterTitle}</div>
                {semesterData.usedFallback && <span className="text-[11px] text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full font-medium">Using template data</span>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                {semesterData.weeks.map(week => (
                  <div
                    key={week.weekNumber}
                    onClick={() => onWeekSelect(week)}
                    className={`rounded-2xl border-2 p-4 cursor-pointer transition-all hover:shadow-md group ${getWeekColor(week)}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Week {week.weekNumber} · {week.dateRange}</div>
                        <div className="text-[15px] font-bold text-foreground mt-0.5 leading-snug">{week.topic}</div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        {week.assessmentEvent && (
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${WEEK_BADGE[week.assessmentEvent] || 'bg-slate-100 text-slate-600'}`}>
                            {week.assessmentEvent}
                          </span>
                        )}
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-primary transition-colors" />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {week.outcomes.slice(0, 3).map(o => (
                        <span key={o} className="text-[10px] bg-white/70 text-teal-700 border border-teal-100 px-1.5 py-0.5 rounded font-semibold">{o}</span>
                      ))}
                    </div>
                    <div className="text-[12px] text-slate-500 mt-2">{week.keyActivities.slice(0, 2).join(' · ')}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
