import React, { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Maximize2, X, Copy, Download, FileText } from "lucide-react";

export type Slide = {
  slideNumber: number;
  type: string;
  heading: string;
  bulletPoints: string[];
  teacherNote: string;
  backgroundTheme: 'teal' | 'white' | 'dark' | 'highlight';
  emoji: string;
};

export type SlidedeckData = {
  title: string;
  slides: Slide[];
  usedFallback: boolean;
};

type Props = {
  data: SlidedeckData;
  onClose: () => void;
  subject?: string; yearLevel?: string; topic?: string;
};

const THEME_CLASSES: Record<string, string> = {
  teal: 'bg-gradient-to-br from-teal-600 to-teal-800 text-white',
  white: 'bg-white text-slate-800',
  dark: 'bg-gradient-to-br from-slate-800 to-slate-900 text-white',
  highlight: 'bg-gradient-to-br from-amber-50 to-orange-50 text-slate-800 border-l-4 border-amber-400',
};

const THEME_BULLET_CLASSES: Record<string, string> = {
  teal: 'text-teal-100',
  white: 'text-slate-600',
  dark: 'text-slate-300',
  highlight: 'text-slate-700',
};

const THEME_NOTE_CLASSES: Record<string, string> = {
  teal: 'bg-teal-900/50 text-teal-100',
  white: 'bg-slate-50 text-slate-600',
  dark: 'bg-slate-700 text-slate-300',
  highlight: 'bg-amber-100 text-amber-800',
};

export default function Slideshow({ data, onClose, subject, yearLevel, topic }: Props) {
  const [current, setCurrent] = useState(0);
  const [showNotes, setShowNotes] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);

  const total = data.slides.length;
  const slide = data.slides[current];

  const prev = useCallback(() => setCurrent(c => Math.max(0, c - 1)), []);
  const next = useCallback(() => setCurrent(c => Math.min(total - 1, c + 1)), [total]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next();
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') prev();
      if (e.key === 't' || e.key === 'T') setShowNotes(n => !n);
      if (e.key === 'f' || e.key === 'F') setIsFullscreen(f => !f);
      if (e.key === 'Escape') { if (isFullscreen) setIsFullscreen(false); else onClose(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [next, prev, isFullscreen, onClose]);

  const copyText = () => {
    const text = data.slides.map(s => `SLIDE ${s.slideNumber}: ${s.heading}\n${s.bulletPoints.map(b => `• ${b}`).join('\n')}`).join('\n\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const exportHTML = () => {
    const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${data.title}</title><style>
*{box-sizing:border-box;margin:0;padding:0;font-family:'DM Sans',Arial,sans-serif}
body{background:#0f172a;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:20px}
.slide{width:100%;max-width:900px;background:white;border-radius:16px;padding:60px;min-height:500px;display:none;flex-direction:column;gap:24px}
.slide.active{display:flex}.slide.teal{background:linear-gradient(135deg,#0d9488,#0f766e);color:white}
.slide.dark{background:linear-gradient(135deg,#1e293b,#0f172a);color:white}.slide.highlight{background:linear-gradient(135deg,#fffbeb,#fef3c7);border-left:6px solid #f59e0b}
h1{font-size:2.5rem;font-weight:700}.h2{font-size:1.8rem;font-weight:700}ul{padding-left:24px}li{margin:8px 0;font-size:1.1rem}
.emoji{font-size:3rem;margin-bottom:8px}.counter{text-align:center;color:#94a3b8;font-size:0.9rem;margin-top:16px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.2)}
.controls{display:flex;gap:12px;justify-content:center;margin-top:24px}
button{padding:10px 24px;border:none;border-radius:8px;cursor:pointer;font-size:0.9rem;font-weight:600;background:#0d9488;color:white}
button:hover{background:#0f766e}
</style></head><body>
${data.slides.map((s, i) => `<div class="slide ${s.backgroundTheme}${i === 0 ? ' active' : ''}" id="slide${i+1}">
<div class="emoji">${s.emoji}</div><div class="h2">${s.heading}</div>
<ul>${s.bulletPoints.map(b => `<li>${b}</li>`).join('')}</ul>
<div class="counter">${s.slideNumber} / ${total}</div></div>`).join('\n')}
<div class="controls"><button onclick="go(-1)">← Prev</button><button onclick="go(1)">Next →</button></div>
<script>let c=0;function go(d){const ss=document.querySelectorAll('.slide');ss[c].classList.remove('active');c=Math.max(0,Math.min(ss.length-1,c+d));ss[c].classList.add('active');}
document.addEventListener('keydown',e=>{if(e.key==='ArrowRight')go(1);if(e.key==='ArrowLeft')go(-1);});</script></body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${data.title.replace(/\s+/g, '_')}.html`;
    a.click(); URL.revokeObjectURL(url);
  };

  const printPDF = () => window.print();

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-[200] bg-slate-900 flex flex-col" style={{ printColorAdjust: 'exact' }}>
        <div className="flex items-center justify-between px-6 py-3 bg-slate-800 text-white">
          <span className="text-sm font-medium opacity-70">{current + 1} / {total}</span>
          <span className="font-semibold">{data.title}</span>
          <button onClick={() => setIsFullscreen(false)} className="bg-transparent border-none text-white cursor-pointer opacity-70 hover:opacity-100" aria-label="Exit fullscreen"><X className="w-5 h-5" /></button>
        </div>
        <div className={`flex-1 flex flex-col items-center justify-center p-16 ${THEME_CLASSES[slide.backgroundTheme]}`}>
          <div className="text-6xl mb-6">{slide.emoji}</div>
          <h2 className="text-4xl font-bold text-center mb-8 leading-tight">{slide.heading}</h2>
          <ul className="space-y-4 max-w-3xl w-full">
            {slide.bulletPoints.map((bp, i) => (
              <li key={i} className={`flex items-start gap-3 text-xl ${THEME_BULLET_CLASSES[slide.backgroundTheme]}`}>
                <span className="mt-1 shrink-0 text-sm opacity-60">•</span> {bp}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex justify-center gap-4 py-4 bg-slate-800">
          <button onClick={prev} disabled={current === 0} className="text-white bg-slate-700 hover:bg-slate-600 disabled:opacity-30 border-none px-6 py-2 rounded-lg cursor-pointer" aria-label="Previous slide"><ChevronLeft className="w-5 h-5" /></button>
          <button onClick={next} disabled={current === total - 1} className="text-white bg-slate-700 hover:bg-slate-600 disabled:opacity-30 border-none px-6 py-2 rounded-lg cursor-pointer" aria-label="Next slide"><ChevronRight className="w-5 h-5" /></button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 ml-60 flex flex-col min-h-screen bg-slate-900">
      <div className="bg-slate-800 px-8 py-4 flex items-center justify-between border-b border-slate-700">
        <div>
          <div className="font-serif text-[20px] text-white tracking-tight">{data.title}</div>
          <div className="text-[12px] text-slate-400 mt-0.5">{yearLevel} {subject} · {topic}</div>
        </div>
        <div className="flex gap-2">
          <button onClick={copyText} className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-600 text-white border-none px-3 py-2 rounded-lg text-[12px] font-medium cursor-pointer transition-colors" aria-label="Copy slide text">
            <Copy className="w-3.5 h-3.5" /> {copied ? 'Copied!' : 'Copy text'}
          </button>
          <button onClick={exportHTML} className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-600 text-white border-none px-3 py-2 rounded-lg text-[12px] font-medium cursor-pointer transition-colors" aria-label="Export as HTML">
            <Download className="w-3.5 h-3.5" /> Export HTML
          </button>
          <button onClick={printPDF} className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-600 text-white border-none px-3 py-2 rounded-lg text-[12px] font-medium cursor-pointer transition-colors" aria-label="Export as PDF">
            <FileText className="w-3.5 h-3.5" /> Export PDF
          </button>
          <button onClick={() => setIsFullscreen(true)} className="flex items-center gap-1.5 bg-primary hover:bg-teal-700 text-white border-none px-3 py-2 rounded-lg text-[12px] font-medium cursor-pointer transition-colors" aria-label="Enter fullscreen presentation">
            <Maximize2 className="w-3.5 h-3.5" /> Present
          </button>
          <button onClick={onClose} className="bg-slate-700 hover:bg-slate-600 text-white border-none px-3 py-2 rounded-lg text-[12px] font-medium cursor-pointer transition-colors" aria-label="Close slideshow">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-8 gap-6">
        <div className={`w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ${THEME_CLASSES[slide.backgroundTheme]}`} style={{ minHeight: 420 }}>
          <div className="p-12 flex flex-col gap-6 h-full">
            <div className="flex items-start gap-4">
              <span className="text-4xl">{slide.emoji}</span>
              <h2 className="text-3xl font-bold leading-tight flex-1">{slide.heading}</h2>
            </div>
            <ul className="space-y-3 flex-1">
              {slide.bulletPoints.map((bp, i) => (
                <li key={i} className={`flex items-start gap-3 text-[17px] leading-relaxed ${THEME_BULLET_CLASSES[slide.backgroundTheme]}`}>
                  <span className="mt-1.5 text-[8px] opacity-50 shrink-0">●</span> {bp}
                </li>
              ))}
            </ul>
            <div className="text-right text-[13px] opacity-40 font-medium">{slide.slideNumber} / {total}</div>
          </div>
        </div>

        {showNotes && slide.teacherNote && (
          <div className={`w-full max-w-4xl rounded-xl px-5 py-3 text-[13px] leading-relaxed ${THEME_NOTE_CLASSES[slide.backgroundTheme] || 'bg-slate-100 text-slate-600'}`}>
            <span className="font-bold text-[11px] uppercase tracking-wider opacity-60 mr-2">Teacher note:</span>
            {slide.teacherNote}
          </div>
        )}

        <div className="flex items-center gap-4">
          <button onClick={prev} disabled={current === 0} className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-30 text-white border-none px-5 py-2.5 rounded-xl cursor-pointer transition-colors text-[14px] font-medium" aria-label="Previous slide">
            <ChevronLeft className="w-4 h-4" /> Prev
          </button>

          <div className="flex gap-1.5">
            {data.slides.map((_, i) => (
              <button key={i} onClick={() => setCurrent(i)} aria-label={`Go to slide ${i + 1}`}
                className={`w-2.5 h-2.5 rounded-full border-none cursor-pointer transition-all ${i === current ? 'bg-teal-400 scale-125' : 'bg-slate-600 hover:bg-slate-500'}`} />
            ))}
          </div>

          <button onClick={next} disabled={current === total - 1} className="flex items-center gap-1.5 bg-primary hover:bg-teal-700 disabled:opacity-30 text-white border-none px-5 py-2.5 rounded-xl cursor-pointer transition-colors text-[14px] font-medium" aria-label="Next slide">
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="text-[11px] text-slate-500 flex gap-4">
          <span>← → Navigate</span>
          <span>T — Toggle notes</span>
          <span>F — Fullscreen</span>
          <span>ESC — Close</span>
        </div>
      </div>
    </div>
  );
}
