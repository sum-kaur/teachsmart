import React, { useState } from "react";
import { ChevronDown, ChevronUp, Shield, BookOpen, Flag, CheckCircle, AlertTriangle, XCircle, Info } from "lucide-react";

export interface TrustFlag {
  type: string;
  severity: "low" | "medium" | "high";
  label: string;
  note: string;
}

export interface TierA {
  domainTier: 1 | 2 | 3 | 4;
  domainLabel: string;
  domainDescription: string;
  isHttps: boolean;
  hasAuthorAttribution: boolean;
  hasLicence: boolean;
  licenceType: string;
  established: string;
  score: number;
}

export interface TierB {
  alignmentStrength: "strong" | "moderate" | "weak" | "none";
  matchedOutcomes: string[];
  alignmentScore: number;
  notes: string;
}

export interface TrustScorecardData {
  tierA: TierA;
  tierB: TierB;
  tierC: TrustFlag[];
  overallScore: number;
}

interface Props {
  scorecard: TrustScorecardData;
  resourceTitle: string;
}

const TIER_COLORS: Record<number, { bg: string; text: string; border: string; label: string }> = {
  1: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", label: "Tier 1 — Government / Peak Research" },
  2: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", label: "Tier 2 — Trusted Education Platform" },
  3: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", label: "Tier 3 — Established Media" },
  4: { bg: "bg-slate-50", text: "text-slate-600", border: "border-slate-200", label: "Tier 4 — Unverified Source" },
};

const STRENGTH_CONFIG = {
  strong:   { color: "text-emerald-600", bg: "bg-emerald-100", bar: "bg-emerald-500", label: "Strong" },
  moderate: { color: "text-blue-600",    bg: "bg-blue-100",    bar: "bg-blue-500",    label: "Moderate" },
  weak:     { color: "text-amber-600",   bg: "bg-amber-100",   bar: "bg-amber-400",   label: "Weak" },
  none:     { color: "text-slate-400",   bg: "bg-slate-100",   bar: "bg-slate-300",   label: "No match" },
};

const SEVERITY_CONFIG = {
  low:    { icon: CheckCircle,    color: "text-emerald-600", bg: "bg-emerald-50",  border: "border-emerald-100" },
  medium: { icon: AlertTriangle,  color: "text-amber-500",   bg: "bg-amber-50",    border: "border-amber-100" },
  high:   { icon: XCircle,        color: "text-red-500",     bg: "bg-red-50",      border: "border-red-100" },
};

function ScoreRing({ score, size = 56 }: { score: number; size?: number }) {
  const radius = (size - 8) / 2;
  const circ = 2 * Math.PI * radius;
  const fill = (score / 100) * circ;
  const color = score >= 80 ? "#10b981" : score >= 60 ? "#3b82f6" : score >= 40 ? "#f59e0b" : "#ef4444";
  return (
    <svg width={size} height={size} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e2e8f0" strokeWidth="4" />
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth="4"
        strokeDasharray={`${fill} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central"
        fontSize={size < 50 ? "10" : "13"} fontWeight="700" fill={color}>{score}</text>
    </svg>
  );
}

export default function TrustScorecard({ scorecard, resourceTitle }: Props) {
  const [expanded, setExpanded] = useState(false);
  const { tierA, tierB, tierC, overallScore } = scorecard;
  const tierColors = TIER_COLORS[tierA.domainTier];
  const strengthCfg = STRENGTH_CONFIG[tierB.alignmentStrength];
  const highFlags = tierC.filter(f => f.severity === "high").length;
  const medFlags = tierC.filter(f => f.severity === "medium").length;

  return (
    <div className="border border-border rounded-xl overflow-hidden mt-3">
      {/* Summary bar — always visible */}
      <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 border-b border-border">
        <ScoreRing score={overallScore} size={48} />

        <div className="flex-1 flex items-center gap-2 flex-wrap">
          {/* Tier A badge */}
          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${tierColors.bg} ${tierColors.text} ${tierColors.border}`}>
            {tierColors.label}
          </span>

          {/* Tier B badge */}
          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${strengthCfg.bg} ${strengthCfg.color}`}>
            Curriculum: {strengthCfg.label}
          </span>

          {/* Tier C summary */}
          {highFlags > 0 && (
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-red-50 text-red-600 border border-red-100">
              {highFlags} flag{highFlags > 1 ? "s" : ""} for review
            </span>
          )}
          {highFlags === 0 && medFlags > 0 && (
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-100">
              {medFlags} advisory note{medFlags > 1 ? "s" : ""}
            </span>
          )}
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 text-[12px] font-semibold text-primary bg-primary/5 hover:bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20 transition-colors cursor-pointer shrink-0"
        >
          {expanded ? <><ChevronUp className="w-3.5 h-3.5" /> Hide Report</> : <><Shield className="w-3.5 h-3.5" /> View Trust Report</>}
        </button>
      </div>

      {/* Full 3-tier report — expandable */}
      {expanded && (
        <div className="divide-y divide-border bg-white">

          {/* ── TIER A ── */}
          <div className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[11px] font-black">A</div>
              <div className="text-[13px] font-bold text-foreground">Source Intelligence</div>
              <div className="ml-auto flex items-center gap-1.5">
                <ScoreRing score={tierA.score} size={36} />
                <span className="text-[11px] text-muted-foreground">/ 100</span>
              </div>
            </div>
            <div className="text-[11px] text-muted-foreground mb-3 italic">
              Deterministic signals — no AI involved. These are verifiable facts.
            </div>

            <div className={`rounded-lg border px-4 py-3 mb-3 ${tierColors.bg} ${tierColors.border}`}>
              <div className={`text-[12px] font-bold ${tierColors.text} mb-0.5`}>{tierColors.label}</div>
              <div className={`text-[12px] ${tierColors.text} opacity-80`}>{tierA.domainDescription}</div>
              <div className={`text-[11px] ${tierColors.text} opacity-60 mt-1`}>{tierA.established}</div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { label: "HTTPS / Secure", value: tierA.isHttps },
                { label: "Author attributed", value: tierA.hasAuthorAttribution },
                { label: "Licence stated", value: tierA.hasLicence },
                { label: "Licence type", value: true, text: tierA.licenceType },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2 text-[12px]">
                  {item.value
                    ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    : <XCircle className="w-3.5 h-3.5 text-slate-300 shrink-0" />}
                  <span className="text-slate-600">{item.label}</span>
                  {item.text && <span className="text-slate-400 text-[11px] ml-auto">{item.text}</span>}
                </div>
              ))}
            </div>

            <div className="mt-3 text-[11px] text-slate-400 flex items-center gap-1">
              <Info className="w-3 h-3" />
              Score formula: Domain tier (40pts) + HTTPS (15pts) + Author (20pts) + Licence (15pts) + Established (10pts)
            </div>
          </div>

          {/* ── TIER B ── */}
          <div className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[11px] font-black">B</div>
              <div className="text-[13px] font-bold text-foreground">Curriculum Alignment</div>
              <div className="ml-auto flex items-center gap-1.5">
                <ScoreRing score={tierB.alignmentScore} size={36} />
                <span className="text-[11px] text-muted-foreground">/ 100</span>
              </div>
            </div>
            <div className="text-[11px] text-muted-foreground mb-3 italic">
              Powered by CurricuLLM-AU — 89% benchmark accuracy on Australian Curriculum v9.
            </div>

            <div className="flex items-center gap-3 mb-3">
              <div className="text-[12px] font-semibold text-slate-600 shrink-0">Alignment strength</div>
              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${strengthCfg.bar}`} style={{ width: `${tierB.alignmentScore}%` }} />
              </div>
              <span className={`text-[12px] font-bold ${strengthCfg.color} shrink-0`}>{strengthCfg.label}</span>
            </div>

            <div className="mb-3">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Matched AC v9 Outcomes</div>
              <div className="flex flex-wrap gap-1.5">
                {tierB.matchedOutcomes.length > 0
                  ? tierB.matchedOutcomes.map(id => (
                    <span key={id} className="bg-teal-50 text-teal-800 text-[11px] font-bold px-2.5 py-1 rounded border border-teal-100">{id}</span>
                  ))
                  : <span className="text-[12px] text-slate-400">No specific outcomes matched</span>}
              </div>
            </div>

            {tierB.notes && (
              <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-[12px] text-blue-800 leading-relaxed">
                <BookOpen className="w-3.5 h-3.5 inline mr-1.5 opacity-60" />
                {tierB.notes}
              </div>
            )}

            <div className="mt-3 text-[11px] text-slate-400 flex items-center gap-1">
              <Info className="w-3 h-3" />
              CurricuLLM scores 89% on curriculum benchmarks vs 41% for generic AI models
            </div>
          </div>

          {/* ── TIER C ── */}
          <div className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-[11px] font-black">C</div>
              <div className="text-[13px] font-bold text-foreground">Quality Flags</div>
              <span className="ml-auto text-[11px] text-muted-foreground">AI-assisted — for teacher review</span>
            </div>
            <div className="text-[11px] text-muted-foreground mb-3 italic">
              These are flags for your professional judgement — not verdicts. You decide.
            </div>

            <div className="flex flex-col gap-2">
              {tierC.map((flag, i) => {
                const cfg = SEVERITY_CONFIG[flag.severity];
                const IconComp = cfg.icon;
                return (
                  <div key={i} className={`flex items-start gap-2.5 rounded-lg border px-3 py-2.5 ${cfg.bg} ${cfg.border}`}>
                    <IconComp className={`w-4 h-4 mt-0.5 shrink-0 ${cfg.color}`} />
                    <div>
                      <div className={`text-[12px] font-bold ${cfg.color}`}>{flag.label}</div>
                      <div className="text-[12px] text-slate-600 mt-0.5">{flag.note}</div>
                    </div>
                    <span className={`ml-auto text-[10px] font-semibold uppercase tracking-wider ${cfg.color} shrink-0 mt-0.5`}>
                      {flag.severity}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-3 text-[11px] text-slate-400 flex items-center gap-1">
              <Flag className="w-3 h-3" />
              Flags are advisory only — teacher professional judgement takes precedence
            </div>
          </div>

          {/* ── OVERALL FORMULA ── */}
          <div className="px-5 py-4 bg-slate-50 flex items-center justify-between">
            <div className="text-[12px] text-slate-500">
              <span className="font-semibold text-foreground">Overall score formula: </span>
              (Source {tierA.score} × 30%) + (Curriculum {tierB.alignmentScore} × 50%) + (Flag penalty {highFlags > 0 ? highFlags * 5 : 0}%)
              {" = "}<span className="font-bold text-foreground">{overallScore}/100</span>
            </div>
            <div className="flex items-center gap-2">
              <ScoreRing score={overallScore} size={44} />
              <div className="text-[11px] text-muted-foreground text-right">
                Overall<br />Confidence
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
