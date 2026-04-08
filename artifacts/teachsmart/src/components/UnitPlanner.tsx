import React from "react";
import VoiceMic from "./VoiceMic";
import { ArrowRight, BookOpen } from "lucide-react";

export type UnitContext = {
  unitTitle: string; textbook: string; totalLessons: string; currentLesson: string;
  prevSummary: string; learningIntention: string; successCriteria: string; assessmentType: string;
};

type Props = {
  unitContext: UnitContext;
  onUpdate: (ctx: UnitContext) => void;
  onContinue: () => void;
  onSkip: () => void;
  voiceLang: string;
};

const ASSESSMENT_TYPES = ['exam', 'project', 'portfolio', 'presentation', 'assignment'];

export default function UnitPlanner({ unitContext, onUpdate, onContinue, onSkip, voiceLang }: Props) {
  const set = (field: keyof UnitContext) => (val: string) => onUpdate({ ...unitContext, [field]: val });

  const inputClass = "w-full border border-border rounded-xl px-4 py-3 text-[14px] text-foreground bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors";
  const labelClass = "block text-[12px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5";

  return (
    <div className="flex-1 lg:ml-60 flex flex-col min-h-screen bg-slate-50">
      <div className="bg-white px-4 sm:px-6 lg:px-8 py-5 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="font-serif text-[22px] text-foreground tracking-tight">Unit Planner</div>
          <div className="text-[13px] text-muted-foreground mt-0.5">Tell us about your teaching sequence — optional but makes every output better</div>
        </div>
        <button onClick={onSkip} className="text-[13px] text-muted-foreground hover:text-foreground border border-border px-4 py-2 rounded-xl cursor-pointer bg-white hover:bg-slate-50 transition-colors" aria-label="Skip unit planner">
          Skip →
        </button>
      </div>

      <div className="p-4 sm:p-6 lg:p-8 flex-1">
        <div className="max-w-3xl mx-auto">
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 mb-7 flex items-start gap-3">
            <BookOpen className="w-5 h-5 text-primary mt-0.5 shrink-0" />
            <div>
              <div className="text-[13px] font-semibold text-primary mb-0.5">Why fill this in?</div>
              <div className="text-[13px] text-slate-600 leading-relaxed">When you provide unit context, every lesson plan Claude generates will say <em>"Lesson 7 of 18 — building on your previous lesson about X, today's plan focuses on Y"</em> — genuinely positioned within your teaching sequence, not a generic standalone plan.</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-border p-5 sm:p-7 mb-5">
            <div className="text-[15px] font-bold text-foreground mb-5">Unit Overview</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="col-span-2">
                <label className={labelClass}>Unit title *</label>
                <div className="flex gap-2">
                  <input value={unitContext.unitTitle} onChange={e => set('unitTitle')(e.target.value)} placeholder="e.g. Earth and Space Sciences — Climate Change" className={inputClass} aria-label="Unit title" />
                  <VoiceMic onTranscript={set('unitTitle')} voiceLang={voiceLang} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Textbook (optional)</label>
                <div className="flex gap-2">
                  <input value={unitContext.textbook} onChange={e => set('textbook')(e.target.value)} placeholder="e.g. Pearson Science 9, 4th ed." className={inputClass} aria-label="Textbook name" />
                  <VoiceMic onTranscript={set('textbook')} voiceLang={voiceLang} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Assessment type at end of unit</label>
                <select value={unitContext.assessmentType} onChange={e => set('assessmentType')(e.target.value)} className={inputClass} aria-label="Assessment type">
                  {ASSESSMENT_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Total lessons in unit</label>
                <input type="number" min="1" max="60" value={unitContext.totalLessons} onChange={e => set('totalLessons')(e.target.value)} placeholder="e.g. 18" className={inputClass} aria-label="Total lessons" />
              </div>
              <div>
                <label className={labelClass}>Current lesson number</label>
                <input type="number" min="1" max="60" value={unitContext.currentLesson} onChange={e => set('currentLesson')(e.target.value)} placeholder="e.g. 7" className={inputClass} aria-label="Current lesson number" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-border p-7 mb-7">
            <div className="text-[15px] font-bold text-foreground mb-5">Today's Lesson Context</div>
            <div className="flex flex-col gap-5">
              <div>
                <label className={labelClass}>Previous lesson summary</label>
                <div className="flex gap-2">
                  <textarea value={unitContext.prevSummary} onChange={e => set('prevSummary')(e.target.value)} placeholder="What did students learn in the last lesson? e.g. 'Introduced the greenhouse effect and the carbon cycle using the BOM data portal.'" className={`${inputClass} resize-none`} rows={2} aria-label="Previous lesson summary" />
                  <VoiceMic onTranscript={set('prevSummary')} voiceLang={voiceLang} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Today's learning intention *</label>
                <div className="flex gap-2">
                  <textarea value={unitContext.learningIntention} onChange={e => set('learningIntention')(e.target.value)} placeholder="e.g. 'Students will analyse BOM temperature data to evaluate the evidence for climate change in Australia.'" className={`${inputClass} resize-none`} rows={2} aria-label="Learning intention" />
                  <VoiceMic onTranscript={set('learningIntention')} voiceLang={voiceLang} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Success criteria</label>
                <div className="flex gap-2">
                  <textarea value={unitContext.successCriteria} onChange={e => set('successCriteria')(e.target.value)} placeholder="e.g. 'I can describe 3 pieces of evidence for climate change using Australian data.'" className={`${inputClass} resize-none`} rows={2} aria-label="Success criteria" />
                  <VoiceMic onTranscript={set('successCriteria')} voiceLang={voiceLang} />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={onContinue}
              disabled={!unitContext.unitTitle && !unitContext.learningIntention}
              className="flex items-center gap-2.5 bg-primary text-white border-none px-7 py-3 rounded-xl text-[15px] font-bold cursor-pointer hover:bg-teal-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Continue to search"
            >
              Continue to Search <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
