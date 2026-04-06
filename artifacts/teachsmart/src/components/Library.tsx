import React, { useState, useEffect } from "react";
import { BookOpen, FileText, Trash2, RefreshCw, AlertTriangle } from "lucide-react";
import { getSavedResources, getSavedLessons, deleteResource, deleteLesson, clearAll, type SavedResource, type SavedLesson } from "../lib/library";

type Props = {
  onLoadResource: (r: SavedResource) => void;
  onLoadLesson: (l: SavedLesson) => void;
};

export default function Library({ onLoadResource, onLoadLesson }: Props) {
  const [activeTab, setActiveTab] = useState<'resources' | 'lessons'>('resources');
  const [resources, setResources] = useState<SavedResource[]>([]);
  const [lessons, setLessons] = useState<SavedLesson[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);

  const refresh = () => {
    setResources(getSavedResources());
    setLessons(getSavedLessons());
  };

  useEffect(() => { refresh(); }, []);

  const handleDeleteResource = (id: string) => { deleteResource(id); refresh(); };
  const handleDeleteLesson = (id: string) => { deleteLesson(id); refresh(); };
  const handleClearAll = () => { clearAll(); refresh(); setShowConfirm(false); };

  const tabClass = (tab: 'resources' | 'lessons') =>
    `px-5 py-2.5 text-[13px] font-semibold rounded-xl border-none cursor-pointer transition-colors ${activeTab === tab ? 'bg-primary text-white' : 'bg-white text-slate-500 hover:text-primary border border-border'}`;

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="flex-1 ml-60 flex flex-col min-h-screen bg-slate-50">
      <div className="bg-white px-8 py-5 border-b border-border">
        <div className="font-serif text-[22px] text-foreground tracking-tight">My Library</div>
        <div className="text-[13px] text-muted-foreground mt-0.5">Your saved resources and lesson plans</div>
      </div>

      <div className="p-8 flex-1">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex gap-2">
              <button className={tabClass('resources')} onClick={() => setActiveTab('resources')} aria-label="Saved resources tab">
                <span className="flex items-center gap-2"><BookOpen className="w-3.5 h-3.5" /> Saved Resources ({resources.length})</span>
              </button>
              <button className={tabClass('lessons')} onClick={() => setActiveTab('lessons')} aria-label="Lesson plans tab">
                <span className="flex items-center gap-2"><FileText className="w-3.5 h-3.5" /> Lesson Plans ({lessons.length})</span>
              </button>
            </div>
            <button onClick={() => setShowConfirm(true)} className="flex items-center gap-2 text-[12px] text-slate-500 hover:text-red-500 bg-transparent border-none cursor-pointer transition-colors" aria-label="Clear all library items">
              <Trash2 className="w-3.5 h-3.5" /> Clear Library
            </button>
          </div>

          {showConfirm && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-5 mb-5 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
              <div className="flex-1">
                <div className="text-[14px] font-bold text-red-700 mb-1">Clear entire library?</div>
                <div className="text-[13px] text-red-600 mb-3">This will permanently delete all {resources.length + lessons.length} saved items. This action cannot be undone.</div>
                <div className="flex gap-2">
                  <button onClick={handleClearAll} className="bg-red-500 text-white border-none px-4 py-2 rounded-lg text-[13px] font-semibold cursor-pointer hover:bg-red-600" aria-label="Confirm clear all">Yes, clear all</button>
                  <button onClick={() => setShowConfirm(false)} className="bg-white text-slate-600 border border-border px-4 py-2 rounded-lg text-[13px] font-semibold cursor-pointer hover:bg-slate-50" aria-label="Cancel">Cancel</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'resources' && (
            <>
              {resources.length === 0 ? (
                <div className="bg-white rounded-2xl border border-border p-12 text-center">
                  <BookOpen className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                  <div className="text-[15px] font-semibold text-slate-400 mb-1">No saved resources yet</div>
                  <div className="text-[13px] text-slate-400">Click "Save Resource" on any resource card to add it here.</div>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {resources.map(r => (
                    <div key={r.id} className="bg-white rounded-2xl border border-border shadow-sm p-5 flex items-center justify-between gap-4 hover:border-teal-200 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{r.type}</span>
                          <span className="text-[11px] bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full font-semibold">{r.alignmentScore}%</span>
                        </div>
                        <div className="text-[15px] font-bold text-foreground truncate">{r.title}</div>
                        <div className="text-[12px] text-slate-400">{r.source} · {r.yearLevel} {r.subject} · Saved {formatDate(r.savedAt)}</div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button onClick={() => onLoadResource(r)} className="bg-primary text-white border-none px-4 py-2 rounded-lg text-[12px] font-semibold cursor-pointer hover:bg-teal-700 transition-colors" aria-label={`Load ${r.title}`}>Load</button>
                        <button onClick={() => handleDeleteResource(r.id)} className="bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-500 border-none px-3 py-2 rounded-lg cursor-pointer transition-colors" aria-label={`Delete ${r.title}`}><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'lessons' && (
            <>
              {lessons.length === 0 ? (
                <div className="bg-white rounded-2xl border border-border p-12 text-center">
                  <FileText className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                  <div className="text-[15px] font-semibold text-slate-400 mb-1">No saved lesson plans yet</div>
                  <div className="text-[13px] text-slate-400">Click "Save to Library" on any generated lesson plan to keep it here.</div>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {lessons.map(l => (
                    <div key={l.id} className="bg-white rounded-2xl border border-border shadow-sm p-5 flex items-center justify-between gap-4 hover:border-teal-200 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="text-[15px] font-bold text-foreground truncate">{l.title || l.topic}</div>
                        <div className="text-[12px] text-slate-400">{l.yearLevel} {l.subject} · {l.duration} · Saved {formatDate(l.savedAt)}</div>
                        <div className="text-[13px] text-slate-500 mt-1 leading-relaxed line-clamp-2">{l.objective}</div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button onClick={() => onLoadLesson(l)} className="bg-primary text-white border-none px-4 py-2 rounded-lg text-[12px] font-semibold cursor-pointer hover:bg-teal-700 transition-colors" aria-label={`Load ${l.title || l.topic} lesson`}>Load</button>
                        <button onClick={() => handleDeleteLesson(l.id)} className="bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-500 border-none px-3 py-2 rounded-lg cursor-pointer transition-colors" aria-label={`Delete ${l.title || l.topic} lesson`}><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
