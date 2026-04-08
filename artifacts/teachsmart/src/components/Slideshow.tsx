import React, { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Maximize2, X, Copy, Download, FileText, Clock, BookOpen } from "lucide-react";

export type KeyTerm = { term: string; definition: string };
export type WorkedExample = { problem: string; steps: string[]; answer: string };
export type SlideTable = { headers: string[]; rows: string[][] };

export type Slide = {
  slideNumber: number;
  type: string;
  heading: string;
  subheading?: string;
  bodyText?: string;
  bulletPoints: string[];
  keyTerms?: KeyTerm[];
  workedExample?: WorkedExample | null;
  table?: SlideTable | null;
  activitySteps?: string[];
  teacherNote: string;
  backgroundTheme: "teal" | "white" | "dark" | "highlight" | "purple";
  emoji: string;
  timeMinutes?: number;
};

export type SlidedeckData = {
  title: string;
  subject?: string;
  yearLevel?: string;
  topic?: string;
  totalMinutes?: number;
  slides: Slide[];
  usedFallback: boolean;
};

type Props = {
  data: SlidedeckData;
  onClose: () => void;
  subject?: string;
  yearLevel?: string;
  topic?: string;
};

const THEME_BG: Record<string, string> = {
  teal: "bg-gradient-to-br from-teal-600 to-teal-800",
  white: "bg-white",
  dark: "bg-gradient-to-br from-slate-800 to-slate-900",
  highlight: "bg-gradient-to-br from-amber-50 to-orange-50",
  purple: "bg-gradient-to-br from-violet-700 to-violet-900",
};
const THEME_TEXT: Record<string, string> = {
  teal: "text-white",
  white: "text-slate-800",
  dark: "text-white",
  highlight: "text-slate-800",
  purple: "text-white",
};
const THEME_BODY: Record<string, string> = {
  teal: "text-teal-100",
  white: "text-slate-600",
  dark: "text-slate-300",
  highlight: "text-slate-700",
  purple: "text-violet-100",
};
const THEME_SUB: Record<string, string> = {
  teal: "text-teal-200",
  white: "text-teal-600",
  dark: "text-slate-400",
  highlight: "text-amber-700",
  purple: "text-violet-200",
};
const THEME_BULLET_DOT: Record<string, string> = {
  teal: "bg-teal-300",
  white: "bg-teal-500",
  dark: "bg-slate-400",
  highlight: "bg-amber-500",
  purple: "bg-violet-300",
};
const THEME_NOTE_BG: Record<string, string> = {
  teal: "bg-teal-900/50 border-teal-500/40 text-teal-100",
  white: "bg-slate-50 border-slate-200 text-slate-600",
  dark: "bg-slate-700/60 border-slate-600 text-slate-300",
  highlight: "bg-amber-100 border-amber-300 text-amber-800",
  purple: "bg-violet-900/50 border-violet-500/40 text-violet-100",
};
const THEME_TABLE_HEAD: Record<string, string> = {
  teal: "bg-teal-900/40 text-teal-100",
  white: "bg-slate-100 text-slate-700",
  dark: "bg-slate-700 text-slate-200",
  highlight: "bg-amber-200 text-amber-900",
  purple: "bg-violet-900/40 text-violet-100",
};
const THEME_TABLE_ROW: Record<string, string> = {
  teal: "border-teal-700/30 text-teal-50",
  white: "border-slate-200 text-slate-700",
  dark: "border-slate-700 text-slate-300",
  highlight: "border-amber-200 text-slate-700",
  purple: "border-violet-700/30 text-violet-100",
};
const TYPE_LABELS: Record<string, string> = {
  title: "Title",
  objective: "Objectives",
  engage: "Engage",
  key_terms: "Key Terms",
  theory: "Theory",
  local_context: "Local Context",
  worked_example: "Worked Example",
  activity: "Activity",
  discussion: "Discussion",
  summary: "Summary",
  exit_ticket: "Exit Ticket",
  assessment: "Assessment",
  content: "Content",
};

function SlideContent({ slide, fullscreen = false }: { slide: Slide; fullscreen?: boolean }) {
  const th = slide.backgroundTheme as keyof typeof THEME_BG;
  const headingSize = fullscreen ? "text-4xl" : "text-2xl";
  const subSize = fullscreen ? "text-lg" : "text-[13px]";
  const bodySize = fullscreen ? "text-xl" : "text-[15px]";
  const bulletSize = fullscreen ? "text-xl" : "text-[14px]";
  const termHeadSize = fullscreen ? "text-xl" : "text-[13px]";
  const termBodySize = fullscreen ? "text-base" : "text-[12px]";
  const stepSize = fullscreen ? "text-lg" : "text-[13px]";

  return (
    <div className="flex flex-col gap-4 h-full overflow-y-auto">
      {slide.subheading && (
        <p className={`${subSize} font-semibold uppercase tracking-wider ${THEME_SUB[th]}`}>{slide.subheading}</p>
      )}

      <h2 className={`${headingSize} font-bold leading-tight ${THEME_TEXT[th]}`}>{slide.heading}</h2>

      {slide.bodyText && (
        <p className={`${bodySize} leading-relaxed ${THEME_BODY[th]}`}>{slide.bodyText}</p>
      )}

      {slide.bulletPoints && slide.bulletPoints.length > 0 && (
        <ul className="space-y-2">
          {slide.bulletPoints.map((bp, i) => (
            <li key={i} className={`flex items-start gap-2.5 ${bulletSize} leading-snug ${THEME_BODY[th]}`}>
              <span className={`mt-2 w-1.5 h-1.5 rounded-full shrink-0 ${THEME_BULLET_DOT[th]}`} />
              <span>{bp}</span>
            </li>
          ))}
        </ul>
      )}

      {slide.keyTerms && slide.keyTerms.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
          {slide.keyTerms.map((kt, i) => (
            <div key={i} className="bg-white/10 rounded-xl p-3 border border-white/20">
              <div className={`${termHeadSize} font-bold mb-1 ${THEME_TEXT[th]}`}>{kt.term}</div>
              <div className={`${termBodySize} leading-relaxed ${THEME_BODY[th]}`}>{kt.definition}</div>
            </div>
          ))}
        </div>
      )}

      {slide.table && (
        <div className="overflow-x-auto rounded-xl mt-1">
          <table className="w-full text-left border-collapse text-[12px]">
            <thead>
              <tr>
                {slide.table.headers.map((h, i) => (
                  <th key={i} className={`px-3 py-2 font-semibold text-[11px] uppercase tracking-wide ${THEME_TABLE_HEAD[th]}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {slide.table.rows.map((row, ri) => (
                <tr key={ri} className={`border-t ${THEME_TABLE_ROW[th]}`}>
                  {row.map((cell, ci) => (
                    <td key={ci} className="px-3 py-2 leading-snug">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {slide.workedExample && (
        <div className="mt-1 space-y-2">
          <div className={`rounded-xl p-3 bg-white/10 border border-white/20 ${bodySize} ${THEME_BODY[th]}`}>
            <span className={`text-[11px] font-bold uppercase tracking-wider mr-2 ${THEME_SUB[th]}`}>Problem:</span>
            {slide.workedExample.problem}
          </div>
          <div className="space-y-1.5">
            {slide.workedExample.steps.map((step, i) => (
              <div key={i} className={`flex items-start gap-2 ${stepSize} ${THEME_BODY[th]}`}>
                <span className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${THEME_BULLET_DOT[th]} text-white`}>{i + 1}</span>
                <span className="leading-relaxed">{step}</span>
              </div>
            ))}
          </div>
          <div className={`rounded-xl p-3 bg-white/15 border border-white/25 ${stepSize} font-semibold ${THEME_TEXT[th]}`}>
            <span className={`text-[11px] font-bold uppercase tracking-wider mr-2 ${THEME_SUB[th]}`}>Answer:</span>
            {slide.workedExample.answer}
          </div>
        </div>
      )}

      {slide.activitySteps && slide.activitySteps.length > 0 && (
        <ol className="space-y-2 mt-1">
          {slide.activitySteps.map((step, i) => (
            <li key={i} className={`flex items-start gap-3 ${stepSize} leading-snug ${THEME_BODY[th]}`}>
              <span className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5 ${THEME_BULLET_DOT[th]} text-white`}>{i + 1}</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function generateHTMLExport(data: SlidedeckData): string {
  const themeCSS: Record<string, string> = {
    teal: "background:linear-gradient(135deg,#0d9488,#0f766e);color:white",
    white: "background:#ffffff;color:#1e293b",
    dark: "background:linear-gradient(135deg,#1e293b,#0f172a);color:white",
    highlight: "background:linear-gradient(135deg,#fffbeb,#fef3c7);color:#1e293b",
    purple: "background:linear-gradient(135deg,#7c3aed,#5b21b6);color:white",
  };
  const bodyColor: Record<string, string> = {
    teal: "#99f6e4", white: "#475569", dark: "#94a3b8", highlight: "#92400e", purple: "#ddd6fe",
  };

  const slideHTMLs = data.slides.map((s, i) => {
    const style = themeCSS[s.backgroundTheme] || themeCSS.white;
    const bc = bodyColor[s.backgroundTheme] || "#475569";
    const bulletDot = s.backgroundTheme === "white" ? "#0d9488" : "rgba(255,255,255,0.7)";

    let innerContent = "";

    if (s.subheading) innerContent += `<p style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;opacity:0.7;margin-bottom:6px">${s.subheading}</p>`;
    innerContent += `<h2 style="font-size:1.6rem;font-weight:800;line-height:1.2;margin-bottom:12px">${s.heading}</h2>`;
    if (s.bodyText) innerContent += `<p style="font-size:0.9rem;line-height:1.6;color:${bc};margin-bottom:12px">${s.bodyText}</p>`;
    if (s.bulletPoints?.length) {
      innerContent += `<ul style="margin:0;padding:0;list-style:none">`;
      s.bulletPoints.forEach(bp => { innerContent += `<li style="display:flex;gap:8px;align-items:flex-start;margin-bottom:6px;font-size:0.88rem;line-height:1.4;color:${bc}"><span style="margin-top:6px;width:6px;height:6px;border-radius:50%;background:${bulletDot};flex-shrink:0"></span>${bp}</li>`; });
      innerContent += `</ul>`;
    }
    if (s.keyTerms?.length) {
      innerContent += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px">`;
      s.keyTerms.forEach(kt => {
        innerContent += `<div style="background:rgba(255,255,255,0.12);border-radius:10px;padding:10px;border:1px solid rgba(255,255,255,0.2)"><div style="font-weight:700;font-size:0.85rem;margin-bottom:4px">${kt.term}</div><div style="font-size:0.75rem;line-height:1.5;color:${bc}">${kt.definition}</div></div>`;
      });
      innerContent += `</div>`;
    }
    if (s.table) {
      innerContent += `<table style="width:100%;border-collapse:collapse;font-size:0.78rem;margin-top:8px"><thead><tr>`;
      s.table.headers.forEach(h => { innerContent += `<th style="padding:6px 10px;text-align:left;background:rgba(0,0,0,0.2);font-size:0.7rem;text-transform:uppercase;letter-spacing:0.05em">${h}</th>`; });
      innerContent += `</tr></thead><tbody>`;
      s.table.rows.forEach(row => {
        innerContent += `<tr style="border-top:1px solid rgba(255,255,255,0.1)">`;
        row.forEach(cell => { innerContent += `<td style="padding:6px 10px;color:${bc}">${cell}</td>`; });
        innerContent += `</tr>`;
      });
      innerContent += `</tbody></table>`;
    }
    if (s.workedExample) {
      innerContent += `<div style="margin-top:8px;font-size:0.82rem"><div style="background:rgba(255,255,255,0.12);border-radius:8px;padding:10px;margin-bottom:6px;color:${bc}"><strong>Problem:</strong> ${s.workedExample.problem}</div>`;
      s.workedExample.steps.forEach((step, si) => { innerContent += `<div style="display:flex;gap:8px;margin-bottom:4px;color:${bc}"><span style="width:18px;height:18px;border-radius:50%;background:${bulletDot};color:${s.backgroundTheme === "white" ? "white" : "#1e293b"};font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0">${si + 1}</span>${step}</div>`; });
      innerContent += `<div style="background:rgba(255,255,255,0.18);border-radius:8px;padding:10px;margin-top:6px"><strong>Answer:</strong> ${s.workedExample.answer}</div></div>`;
    }
    if (s.activitySteps?.length) {
      innerContent += `<ol style="margin:8px 0 0;padding:0;list-style:none">`;
      s.activitySteps.forEach((step, si) => { innerContent += `<li style="display:flex;gap:8px;align-items:flex-start;margin-bottom:6px;font-size:0.85rem;color:${bc}"><span style="width:18px;height:18px;border-radius:50%;background:${bulletDot};color:${s.backgroundTheme === "white" ? "white" : "#1e293b"};font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0">${si + 1}</span>${step}</li>`; });
      innerContent += `</ol>`;
    }
    if (s.teacherNote) {
      innerContent += `<div style="margin-top:12px;padding:10px 12px;background:rgba(0,0,0,0.2);border-radius:8px;font-size:0.78rem;color:${bc};border-left:3px solid ${bulletDot}"><strong style="font-size:0.68rem;text-transform:uppercase;letter-spacing:0.08em;opacity:0.7">Teacher Note: </strong>${s.teacherNote}</div>`;
    }

    return `<div class="slide ${i === 0 ? 'active' : ''}" id="slide${i + 1}" style="${style}">${innerContent}<div style="text-align:right;font-size:0.75rem;opacity:0.4;margin-top:auto;padding-top:12px">${s.slideNumber} / ${data.slides.length}</div></div>`;
  }).join("\n");

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${data.title}</title>
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Segoe UI',system-ui,Arial,sans-serif;background:#0f172a;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;padding:20px;gap:16px}.slide{width:100%;max-width:920px;border-radius:18px;padding:48px 52px;min-height:520px;display:none;flex-direction:column;gap:0;box-shadow:0 25px 60px rgba(0,0,0,0.5)}.slide.active{display:flex}.controls{display:flex;gap:12px;align-items:center}.controls button{padding:10px 22px;border:none;border-radius:8px;cursor:pointer;font-size:0.88rem;font-weight:600;background:#0d9488;color:white;transition:background 0.2s}.controls button:hover{background:#0f766e}.controls button:disabled{opacity:0.3;cursor:default}.counter{color:#64748b;font-size:0.85rem;min-width:60px;text-align:center}.progress{display:flex;gap:6px}.pip{width:8px;height:8px;border-radius:50%;background:#334155;cursor:pointer;transition:all 0.2s}.pip.active{background:#14b8a6;transform:scale(1.3)}.header{color:#94a3b8;font-size:0.82rem;text-align:center}</style>
</head><body>
<div class="header">${data.title} · ${data.yearLevel || ""} ${data.subject || ""}</div>
${slideHTMLs}
<div class="controls">
  <button onclick="go(-1)" id="prevBtn" disabled>← Prev</button>
  <div class="progress" id="progress">${data.slides.map((_, i) => `<div class="pip${i === 0 ? ' active' : ''}" onclick="goTo(${i})"></div>`).join("")}</div>
  <button onclick="go(1)" id="nextBtn">Next →</button>
</div>
<div class="counter" id="counter">1 / ${data.slides.length}</div>
<script>
let c=0;const total=${data.slides.length};
function goTo(n){const ss=document.querySelectorAll('.slide');const pp=document.querySelectorAll('.pip');ss[c].classList.remove('active');pp[c].classList.remove('active');c=Math.max(0,Math.min(total-1,n));ss[c].classList.add('active');pp[c].classList.add('active');document.getElementById('counter').textContent=(c+1)+' / '+total;document.getElementById('prevBtn').disabled=c===0;document.getElementById('nextBtn').disabled=c===total-1;}
function go(d){goTo(c+d);}
document.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowDown')go(1);if(e.key==='ArrowLeft'||e.key==='ArrowUp')go(-1);});
</script></body></html>`;
}

export default function Slideshow({ data, onClose, subject, yearLevel, topic }: Props) {
  const [current, setCurrent] = useState(0);
  const [showNotes, setShowNotes] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);

  const total = data.slides.length;
  const slide = data.slides[current];
  const th = slide.backgroundTheme as keyof typeof THEME_BG;

  const prev = useCallback(() => setCurrent(c => Math.max(0, c - 1)), []);
  const next = useCallback(() => setCurrent(c => Math.min(total - 1, c + 1)), [total]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") next();
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") prev();
      if (e.key === "t" || e.key === "T") setShowNotes(n => !n);
      if (e.key === "f" || e.key === "F") setIsFullscreen(f => !f);
      if (e.key === "Escape") { if (isFullscreen) setIsFullscreen(false); else onClose(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [next, prev, isFullscreen, onClose]);

  const copyText = () => {
    const text = data.slides.map(s => {
      let out = `SLIDE ${s.slideNumber}: ${s.heading}\n`;
      if (s.bodyText) out += `\n${s.bodyText}\n`;
      if (s.bulletPoints?.length) out += "\n" + s.bulletPoints.map(b => `• ${b}`).join("\n");
      if (s.keyTerms?.length) out += "\n\nKey Terms:\n" + s.keyTerms.map(kt => `${kt.term}: ${kt.definition}`).join("\n");
      if (s.activitySteps?.length) out += "\n\nActivity Steps:\n" + s.activitySteps.map((st, i) => `${i + 1}. ${st}`).join("\n");
      if (s.teacherNote) out += `\n\nTeacher Note: ${s.teacherNote}`;
      return out;
    }).join("\n\n---\n\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const exportHTML = () => {
    const html = generateHTMLExport(data);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${data.title.replace(/\s+/g, "_")}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const printPDF = () => window.print();

  const typeLabel = TYPE_LABELS[slide.type] || slide.type;

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-[200] bg-slate-900 flex flex-col">
        <div className="flex items-center justify-between px-6 py-3 bg-slate-800 text-white shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-bold uppercase tracking-widest bg-slate-700 px-2 py-0.5 rounded text-slate-300">{typeLabel}</span>
            <span className="text-sm opacity-60">{current + 1} / {total}</span>
          </div>
          <span className="font-semibold text-sm">{data.title}</span>
          <button onClick={() => setIsFullscreen(false)} className="bg-transparent border-none text-white cursor-pointer opacity-60 hover:opacity-100" aria-label="Exit fullscreen"><X className="w-5 h-5" /></button>
        </div>
        <div className={`flex-1 p-12 overflow-y-auto ${THEME_BG[th]} ${THEME_TEXT[th]}`}>
          <SlideContent slide={slide} fullscreen />
        </div>
        {showNotes && slide.teacherNote && (
          <div className={`shrink-0 px-8 py-3 text-[13px] leading-relaxed border-t ${THEME_NOTE_BG[th]}`}>
            <span className="font-bold text-[10px] uppercase tracking-widest mr-2 opacity-60">Teacher Note:</span>
            {slide.teacherNote}
          </div>
        )}
        <div className="flex justify-center gap-4 py-3 bg-slate-800 shrink-0">
          <button onClick={prev} disabled={current === 0} className="text-white bg-slate-700 hover:bg-slate-600 disabled:opacity-30 border-none px-6 py-2 rounded-lg cursor-pointer" aria-label="Previous slide"><ChevronLeft className="w-5 h-5" /></button>
          <button onClick={next} disabled={current === total - 1} className="text-white bg-primary hover:bg-teal-700 disabled:opacity-30 border-none px-6 py-2 rounded-lg cursor-pointer" aria-label="Next slide"><ChevronRight className="w-5 h-5" /></button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 lg:ml-60 flex flex-col min-h-screen bg-slate-900">
      <div className="bg-slate-800 px-6 py-3 flex items-center justify-between border-b border-slate-700 shrink-0">
        <div>
          <div className="font-serif text-[18px] text-white tracking-tight leading-tight">{data.title}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">{data.yearLevel || yearLevel} {data.subject || subject} · {data.topic || topic} · {total} slides</div>
        </div>
        <div className="flex gap-1.5">
          <button onClick={() => setShowNotes(n => !n)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium border-none cursor-pointer transition-colors ${showNotes ? "bg-teal-700 text-white" : "bg-slate-700 text-slate-300 hover:bg-slate-600"}`} aria-label="Toggle teacher notes">
            <BookOpen className="w-3 h-3" /> Notes
          </button>
          <button onClick={copyText} className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-600 text-white border-none px-3 py-1.5 rounded-lg text-[11px] font-medium cursor-pointer transition-colors" aria-label="Copy all slide text">
            <Copy className="w-3 h-3" /> {copied ? "Copied!" : "Copy"}
          </button>
          <button onClick={exportHTML} className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-600 text-white border-none px-3 py-1.5 rounded-lg text-[11px] font-medium cursor-pointer transition-colors" aria-label="Export as interactive HTML">
            <Download className="w-3 h-3" /> Export
          </button>
          <button onClick={printPDF} className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-600 text-white border-none px-3 py-1.5 rounded-lg text-[11px] font-medium cursor-pointer transition-colors" aria-label="Print or save as PDF">
            <FileText className="w-3 h-3" /> PDF
          </button>
          <button onClick={() => setIsFullscreen(true)} className="flex items-center gap-1.5 bg-primary hover:bg-teal-700 text-white border-none px-3 py-1.5 rounded-lg text-[11px] font-medium cursor-pointer transition-colors" aria-label="Present fullscreen">
            <Maximize2 className="w-3 h-3" /> Present
          </button>
          <button onClick={onClose} className="bg-slate-700 hover:bg-slate-600 text-white border-none px-2.5 py-1.5 rounded-lg text-[11px] font-medium cursor-pointer transition-colors" aria-label="Close slideshow">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex gap-0 overflow-hidden">
        <div className="w-44 shrink-0 bg-slate-800 overflow-y-auto border-r border-slate-700">
          {data.slides.map((s, i) => {
            const sth = s.backgroundTheme as keyof typeof THEME_BG;
            return (
              <button key={i} onClick={() => setCurrent(i)} className={`w-full text-left px-3 py-2.5 border-b border-slate-700/50 cursor-pointer transition-colors ${i === current ? "bg-slate-600" : "bg-transparent hover:bg-slate-700/50"}`}>
                <div className={`w-full aspect-video rounded-md mb-1.5 flex items-center justify-center text-lg ${THEME_BG[sth]}`}>
                  {s.emoji}
                </div>
                <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">{TYPE_LABELS[s.type] || s.type}</div>
                <div className="text-[10px] text-slate-300 leading-tight line-clamp-2">{s.heading}</div>
                {s.timeMinutes && (
                  <div className="flex items-center gap-1 mt-1">
                    <Clock className="w-2 h-2 text-slate-500" />
                    <span className="text-[9px] text-slate-500">{s.timeMinutes} min</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex-1 flex flex-col items-center justify-start p-4 sm:p-6 gap-4 overflow-y-auto">
          <div className="w-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest bg-slate-700 text-slate-300 px-2 py-0.5 rounded">{typeLabel}</span>
              {slide.timeMinutes && (
                <span className="flex items-center gap-1 text-[10px] text-slate-400">
                  <Clock className="w-3 h-3" /> {slide.timeMinutes} min
                </span>
              )}
            </div>
            <span className="text-[11px] text-slate-400">{current + 1} of {total}</span>
          </div>

          <div className={`w-full rounded-2xl shadow-2xl overflow-hidden ${THEME_BG[th]} ${THEME_TEXT[th]}`} style={{ minHeight: 380 }}>
            <div className="p-4 sm:p-6 lg:p-8 flex flex-col gap-4" style={{ minHeight: 380 }}>
              <SlideContent slide={slide} />
            </div>
          </div>

          {showNotes && slide.teacherNote && (
            <div className={`w-full rounded-xl px-4 py-3 text-[12px] leading-relaxed border ${THEME_NOTE_BG[th]}`}>
              <span className="font-bold text-[10px] uppercase tracking-widest mr-2 opacity-60">Teacher Note:</span>
              {slide.teacherNote}
            </div>
          )}

          <div className="flex items-center gap-4">
            <button onClick={prev} disabled={current === 0} className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-30 text-white border-none px-5 py-2 rounded-xl cursor-pointer transition-colors text-[13px] font-medium" aria-label="Previous slide">
              <ChevronLeft className="w-4 h-4" /> Prev
            </button>
            <div className="flex gap-1">
              {data.slides.map((_, i) => (
                <button key={i} onClick={() => setCurrent(i)} aria-label={`Go to slide ${i + 1}`}
                  className={`w-2 h-2 rounded-full border-none cursor-pointer transition-all ${i === current ? "bg-teal-400 scale-125" : "bg-slate-600 hover:bg-slate-500"}`} />
              ))}
            </div>
            <button onClick={next} disabled={current === total - 1} className="flex items-center gap-1.5 bg-primary hover:bg-teal-700 disabled:opacity-30 text-white border-none px-5 py-2 rounded-xl cursor-pointer transition-colors text-[13px] font-medium" aria-label="Next slide">
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="text-[10px] text-slate-500 flex gap-4">
            <span>← → Navigate</span><span>T — Notes</span><span>F — Fullscreen</span><span>ESC — Close</span>
          </div>
        </div>
      </div>
    </div>
  );
}
