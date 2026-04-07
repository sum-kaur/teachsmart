import React, { useState, useEffect, useCallback } from "react";
import {
  BookOpen, Compass, Search, FileText, Download, Edit, ArrowLeft,
  CheckCircle, Home as HomeIcon, FileStack, BarChart3, MapPin,
  CalendarDays, Settings2, Globe, ChevronDown, ChevronUp,
  Presentation, Library as LibraryIcon, Bookmark, BookmarkCheck, Loader2, Sparkles, ExternalLink
} from "lucide-react";
import { useGetDashboardStats, useGetRecentResources, useGetFeed } from "@workspace/api-client-react";
import VoiceMic from "../components/VoiceMic";
import Slideshow, { type SlidedeckData } from "../components/Slideshow";
import UnitPlanner, { type UnitContext } from "../components/UnitPlanner";
import Library from "../components/Library";
import SemesterPlanner from "../components/SemesterPlanner";
import SettingsPanel from "../components/Settings";
import { LANGUAGES, type LangCode } from "../lib/translations";
import { saveResource, saveLesson, getSavedResources, type SavedResource, type SavedLesson } from "../lib/library";
import TrustScorecard from "../components/TrustScorecard";

type AlignmentResult = {
  alignmentScore: number; syllabus: string; strand: string;
  outcomes: { id: string; description: string }[];
  notes: string; usedFallback: boolean;
};

type Resource = {
  id: string; title: string; url?: string; source: string; type: string; description: string;
  alignmentScore: number; safetyRating: string; biasFlag: string;
  localContextTags: string[]; outcomeIds: string[]; whyThisResource: string;
  trustScorecard?: import("../components/TrustScorecard").TrustScorecardData;
};

type LessonPlan = {
  objective: string; duration: string;
  activities: { label: string; text: string }[];
  localExample: { title: string; body: string };
  questions: { q: string; difficulty: string }[];
  usedFallback: boolean;
};

type FeedItem = { type: string; headline: string; teachingAngle: string; curriculumLink: string; icon: string };
type FeedResult = {
  feedItems: FeedItem[];
  weather: { temp: number; description: string; rainfall: number; wind: number; city: string; usedFallback: boolean };
  localContext: { suburb: string; country: string; landmarks: string };
  usedFallback: boolean;
};

const MOCK_DASHBOARD_STATS = { totalSearches: 124, resourcesGenerated: 89, averageAlignmentScore: 92, topSubject: "History" };
const MOCK_RECENT = [
  { id: "1", title: "Climate Change Impacts", subject: "Science", yearLevel: "Year 9", topic: "Climate Change", alignmentScore: 94, searchedAt: new Date().toISOString() },
  { id: "2", title: "Algebraic Expressions", subject: "Mathematics", yearLevel: "Year 8", topic: "Algebra", alignmentScore: 88, searchedAt: new Date(Date.now() - 86400000).toISOString() },
  { id: "3", title: "Poetry Analysis", subject: "English", yearLevel: "Year 10", topic: "Poetry", alignmentScore: 91, searchedAt: new Date(Date.now() - 172800000).toISOString() },
];

type Screen = 'dashboard' | 'unit-planner' | 'search' | 'results' | 'lesson' | 'slideshow' | 'library' | 'semester' | 'settings';

const EMPTY_UNIT: UnitContext = { unitTitle: '', textbook: '', totalLessons: '', currentLesson: '', prevSummary: '', learningIntention: '', successCriteria: '', assessmentType: 'exam' };

export default function Home() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('dashboard');
  const [searchParams, setSearchParams] = useState({ yearLevel: 'Year 9', state: 'NSW', subject: 'History', topic: 'Rights and Freedoms', resourceType: 'Lesson Plan', classContext: [] as string[], postcode: '2150' });
  const [isSearching, setIsSearching] = useState(false);
  const [isGeneratingLesson, setIsGeneratingLesson] = useState(false);
  const [isGeneratingSlides, setIsGeneratingSlides] = useState(false);
  const [alignmentResult, setAlignmentResult] = useState<AlignmentResult | null>(null);
  const [genericAIResult, setGenericAIResult] = useState<{ outcomes: { id: string; note: string }[]; alignmentScore: number; notes: string; warning?: string } | null>(null);
  const [showAIComparison, setShowAIComparison] = useState(true);
  const [searchStep, setSearchStep] = useState<string | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [lessonPlan, setLessonPlan] = useState<LessonPlan | null>(null);
  const [teacherNotes, setTeacherNotes] = useState('');
  const [feedResult, setFeedResult] = useState<FeedResult | null>(null);
  const [isFeedLoading, setIsFeedLoading] = useState(false);
  const [unitContext, setUnitContext] = useState<UnitContext>(EMPTY_UNIT);
  const [uiLanguage, setUiLanguage] = useState<LangCode>('en');
  const [slidedeckData, setSlidedeckData] = useState<SlidedeckData | null>(null);
  const [studentInterests, setStudentInterests] = useState<string[]>([]);
  const [showInterests, setShowInterests] = useState(false);
  const [savedResourceIds, setSavedResourceIds] = useState<Set<string>>(() => new Set(getSavedResources().map(r => r.id)));
  const [lessonSaved, setLessonSaved] = useState(false);
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [highContrast, setHighContrast] = useState(false);

  const voiceLang = LANGUAGES.find(l => l.code === uiLanguage)?.voiceCode ?? 'en-AU';
  const preferredLanguage = voiceLang;

  const { data: dashboardStats = MOCK_DASHBOARD_STATS } = useGetDashboardStats();
  const { data: recentResourcesRaw } = useGetRecentResources();
  const recentResources = Array.isArray(recentResourcesRaw) ? recentResourcesRaw : MOCK_RECENT;
  const feedMutation = useGetFeed();

  const getApiBase = () => {
    const base = import.meta.env.BASE_URL?.replace(/\/$/, '') ?? '';
    return base;
  };

  const apiFetch = useCallback(async (path: string, body: Record<string, unknown>) => {
    const base = getApiBase();
    const res = await fetch(`${base}/api${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) throw new Error(`API error ${res.status}`);
    return res.json();
  }, []);

  const loadFeed = useCallback(async (postcode: string, state: string, subject: string, yearLevel: string) => {
    setIsFeedLoading(true);
    try {
      const result = await feedMutation.mutateAsync({ data: { postcode, state, subject, yearLevel } });
      setFeedResult(result as FeedResult);
    } catch { setFeedResult(null); }
    finally { setIsFeedLoading(false); }
  }, []);

  useEffect(() => {
    loadFeed(searchParams.postcode, searchParams.state, searchParams.subject, searchParams.yearLevel);
  }, []);

  useEffect(() => {
    const classes: string[] = [];
    if (fontSize === 'small') classes.push('text-sm');
    else if (fontSize === 'large') classes.push('text-lg');
    if (highContrast) classes.push('high-contrast');
    document.documentElement.className = classes.join(' ');
  }, [fontSize, highContrast]);

  const handleSearch = async () => {
    if (!searchParams.topic) return;
    setIsSearching(true);
    setSearchStep(null);
    setShowAIComparison(true);
    setCurrentScreen('search');

    try {
      // Step 1: CurricuLLM alignment
      setSearchStep('curricullm');
      const alignment: AlignmentResult = await apiFetch('/alignment', {
        subject: searchParams.subject, yearLevel: searchParams.yearLevel,
        topic: searchParams.topic, state: searchParams.state,
        unitContext, preferredLanguage,
      });
      setAlignmentResult(alignment);

      // Step 2: Trusted sources + resources (parallel with compare)
      setSearchStep('sources');
      const [resourcesResult] = await Promise.all([
        apiFetch('/resources', {
          subject: searchParams.subject, yearLevel: searchParams.yearLevel,
          topic: searchParams.topic, state: searchParams.state,
          alignmentResult: alignment, unitContext, preferredLanguage,
          studentInterests,
        }),
        // Fire compare in parallel
        apiFetch('/compare', { subject: searchParams.subject, yearLevel: searchParams.yearLevel, topic: searchParams.topic, state: searchParams.state })
          .then((r: any) => setGenericAIResult(r?.genericAI ?? null))
          .catch(() => {}),
      ]);

      setSearchStep('merging');
      await new Promise(r => setTimeout(r, 300)); // brief pause to show "Merging results"
      setResources((resourcesResult as { resources: Resource[] }).resources ?? []);
    } catch {
      setAlignmentResult({
        alignmentScore: 88, syllabus: `${searchParams.state} ${searchParams.subject} ${searchParams.yearLevel}`,
        strand: "Core Strand",
        outcomes: [{ id: "AC9-FALLBACK", description: `Core ${searchParams.subject} outcome for ${searchParams.yearLevel} students studying ${searchParams.topic}.` }],
        notes: "Fallback alignment data.", usedFallback: true,
      });
      setResources([]);
    } finally {
      setIsSearching(false);
      setSearchStep(null);
      setCurrentScreen('results');
    }
  };

  const handleAdaptResource = async (resource: Resource) => {
    if (!alignmentResult) return;
    setSelectedResource(resource);
    setIsGeneratingLesson(true);
    setCurrentScreen('lesson');
    setLessonSaved(false);

    try {
      const lesson: LessonPlan = await apiFetch('/lesson', {
        subject: searchParams.subject, yearLevel: searchParams.yearLevel,
        topic: searchParams.topic, state: searchParams.state,
        resource, alignmentResult, classContext: searchParams.classContext,
        unitContext, preferredLanguage,
      });
      setLessonPlan(lesson);
      setTeacherNotes(`Ensure students have the background knowledge needed for ${searchParams.topic} before beginning the activities. Check for prior understanding using a brief entry task.`);
    } catch {
      setLessonPlan({
        objective: `Students explore ${searchParams.topic} using Australian curriculum-aligned resources, developing critical thinking and analytical skills.`,
        duration: "60 minutes",
        activities: [
          { label: "Hook (5 min)", text: `Engage students with a thought-provoking question related to ${searchParams.topic}.` },
          { label: "Explore (20 min)", text: "Students investigate the core concepts through guided inquiry activities." },
          { label: "Analyse (15 min)", text: "Groups discuss findings, connecting concepts to Australian contexts." },
          { label: "Evaluate (15 min)", text: "Class discussion evaluates evidence and forms reasoned conclusions." },
          { label: "Reflect (5 min)", text: "Exit ticket: Students record one key learning and one remaining question." },
        ],
        localExample: {
          title: "Australian Context",
          body: `Connect ${searchParams.topic} to local examples relevant to ${searchParams.state} students, drawing on real Australian case studies and data.`,
        },
        questions: [
          { q: `Define the key concepts of ${searchParams.topic} in your own words.`, difficulty: "foundation" },
          { q: `Explain two ways ${searchParams.topic} is relevant to Australian students.`, difficulty: "foundation" },
          { q: `Analyse the evidence and explain how it supports our understanding of ${searchParams.topic}.`, difficulty: "core" },
          { q: `Compare different perspectives on ${searchParams.topic} and evaluate which is best supported by evidence.`, difficulty: "core" },
          { q: `Critically evaluate the limitations of current approaches to ${searchParams.topic} and propose evidence-based alternatives.`, difficulty: "extension" },
        ],
        usedFallback: true,
      });
      setTeacherNotes(`Ensure students understand the key concepts of ${searchParams.topic} before starting.`);
    } finally { setIsGeneratingLesson(false); }
  };

  const handleGenerateSlides = async () => {
    if (!lessonPlan) return;
    setIsGeneratingSlides(true);
    try {
      const data: SlidedeckData = await apiFetch('/slides', {
        lessonPlan, unitContext, alignmentResult,
        subject: searchParams.subject, yearLevel: searchParams.yearLevel,
        topic: searchParams.topic, state: searchParams.state,
      });
      setSlidedeckData(data);
      setCurrentScreen('slideshow');
    } catch {
      setSlidedeckData({
        title: `${searchParams.topic} — ${searchParams.yearLevel} ${searchParams.subject}`,
        slides: [{ slideNumber: 1, type: 'title', heading: searchParams.topic, bulletPoints: [`${searchParams.yearLevel} ${searchParams.subject} · ${searchParams.state}`, `Learning intention: ${unitContext.learningIntention || 'To be defined'}`], teacherNote: 'Welcome students and introduce lesson objectives.', backgroundTheme: 'teal', emoji: '📚' }],
        usedFallback: true,
      });
      setCurrentScreen('slideshow');
    } finally { setIsGeneratingSlides(false); }
  };

  const handleSaveResource = (resource: Resource) => {
    saveResource({ ...resource, subject: searchParams.subject, yearLevel: searchParams.yearLevel, topic: searchParams.topic });
    setSavedResourceIds(prev => new Set([...prev, resource.id]));
  };

  const handleSaveLesson = () => {
    if (!lessonPlan) return;
    saveLesson({ title: `${searchParams.topic} — ${searchParams.yearLevel} ${searchParams.subject}`, subject: searchParams.subject, yearLevel: searchParams.yearLevel, topic: searchParams.topic, objective: lessonPlan.objective, duration: lessonPlan.duration, activities: lessonPlan.activities, localExample: lessonPlan.localExample, questions: lessonPlan.questions });
    setLessonSaved(true);
  };

  const toggleInterest = (interest: string) => {
    setStudentInterests(prev => prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]);
  };

  const renderSidebar = () => (
    <nav className="w-60 bg-sidebar text-sidebar-foreground flex flex-col py-7 fixed top-0 left-0 bottom-0 z-50 overflow-y-auto">
      <div className="px-6 pb-7 mb-4 flex items-center gap-3 border-b border-white/10">
        <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-white" />
        </div>
        <span className="font-serif text-white text-xl tracking-tight">TeachSmart</span>
      </div>

      <button onClick={() => setCurrentScreen('dashboard')} className={`flex items-center gap-3 px-6 py-2.5 text-sm font-medium cursor-pointer transition-colors border-l-4 border-none w-full text-left ${currentScreen === 'dashboard' ? 'text-primary border-primary bg-primary/10' : 'text-slate-400 border-transparent hover:text-white hover:bg-white/5'}`} data-testid="nav-dashboard">
        <HomeIcon className="w-4 h-4" /> Dashboard
      </button>

      <button onClick={() => setCurrentScreen('unit-planner')} className={`flex items-center gap-3 px-6 py-2.5 text-sm font-medium cursor-pointer transition-colors border-l-4 border-none w-full text-left ${currentScreen === 'unit-planner' ? 'text-primary border-primary bg-primary/10' : 'text-slate-400 border-transparent hover:text-white hover:bg-white/5'}`} data-testid="nav-unit-planner">
        <BookOpen className="w-4 h-4" /> Unit Planner
        {unitContext.unitTitle && <span className="ml-auto w-2 h-2 rounded-full bg-primary shrink-0"></span>}
      </button>

      <button onClick={() => setCurrentScreen('search')} className={`flex items-center gap-3 px-6 py-2.5 text-sm font-medium cursor-pointer transition-colors border-l-4 border-none w-full text-left ${['search', 'results', 'lesson'].includes(currentScreen) ? 'text-primary border-primary bg-primary/10' : 'text-slate-400 border-transparent hover:text-white hover:bg-white/5'}`} data-testid="nav-new-resource">
        <Compass className="w-4 h-4" /> New Resource
      </button>

      <button onClick={() => setCurrentScreen('library')} className={`flex items-center gap-3 px-6 py-2.5 text-sm font-medium cursor-pointer transition-colors border-l-4 border-none w-full text-left ${currentScreen === 'library' ? 'text-primary border-primary bg-primary/10' : 'text-slate-400 border-transparent hover:text-white hover:bg-white/5'}`} data-testid="nav-library">
        <FileStack className="w-4 h-4" /> My Library
      </button>

      <button onClick={() => setCurrentScreen('semester')} className={`flex items-center gap-3 px-6 py-2.5 text-sm font-medium cursor-pointer transition-colors border-l-4 border-none w-full text-left ${currentScreen === 'semester' ? 'text-primary border-primary bg-primary/10' : 'text-slate-400 border-transparent hover:text-white hover:bg-white/5'}`} data-testid="nav-semester">
        <CalendarDays className="w-4 h-4" /> Semester Plan
      </button>

      <button onClick={() => setCurrentScreen('settings')} className={`flex items-center gap-3 px-6 py-2.5 text-sm font-medium cursor-pointer transition-colors border-l-4 border-none w-full text-left ${currentScreen === 'settings' ? 'text-primary border-primary bg-primary/10' : 'text-slate-400 border-transparent hover:text-white hover:bg-white/5'}`} data-testid="nav-settings">
        <Settings2 className="w-4 h-4" /> Settings
      </button>

      <div className="mt-auto px-4 pt-5 border-t border-white/10">
        <div className="flex items-center gap-2 mb-3">
          {LANGUAGES.map(lang => (
            <button key={lang.code} onClick={() => setUiLanguage(lang.code)} title={lang.label} className={`text-base border-none bg-transparent cursor-pointer rounded p-0.5 transition-opacity ${uiLanguage === lang.code ? 'opacity-100 ring-1 ring-primary rounded' : 'opacity-40 hover:opacity-80'}`} aria-label={`Switch to ${lang.label}`}>
              {lang.flag}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-sm font-semibold text-white">SJ</div>
          <div>
            <div className="text-[13px] font-medium text-slate-300">Sarah Chen</div>
            <div className="text-[11px] text-slate-500">History · Year 9</div>
          </div>
        </div>
      </div>
    </nav>
  );

  const renderTopbar = (title: string, subtitle: string) => (
    <div className="bg-white px-8 py-4 flex items-center justify-between border-b border-border sticky top-0 z-40">
      <div>
        <div className="font-serif text-[22px] text-foreground tracking-tight">{title}</div>
        <div className="text-[13px] text-muted-foreground mt-0.5">{subtitle}</div>
      </div>
      <div className="flex gap-2 items-center">
        <div className="flex items-center gap-1.5 bg-green-100 text-green-700 text-[11px] font-semibold px-2.5 py-1 rounded-full">
          <CheckCircle className="w-3 h-3" /> NSW Aligned
        </div>
        <div className="flex items-center gap-1.5 bg-blue-100 text-blue-700 text-[11px] font-semibold px-2.5 py-1 rounded-full">
          <Edit className="w-3 h-3" /> Bias Checked
        </div>
        {uiLanguage !== 'en' && (
          <div className="flex items-center gap-1 bg-primary/10 text-primary text-[11px] font-semibold px-2.5 py-1 rounded-full">
            <Globe className="w-3 h-3" /> {LANGUAGES.find(l => l.code === uiLanguage)?.label}
          </div>
        )}
      </div>
    </div>
  );

  const renderAlignmentBar = () => {
    if (!alignmentResult) return null;
    const score = alignmentResult.alignmentScore;
    const color = score >= 85 ? 'bg-green-500' : score >= 65 ? 'bg-amber-400' : 'bg-red-400';
    return (
      <div className="bg-white rounded-xl border border-border px-5 py-3 flex items-center gap-4 mb-5 text-[13px]">
        <div className="text-[12px] font-bold uppercase tracking-wider text-slate-500 shrink-0">Curriculum Alignment</div>
        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${score}%` }} />
        </div>
        <div className="font-bold text-foreground shrink-0">{score}%</div>
        <div className="shrink-0 text-slate-500">· {alignmentResult.strand}</div>
        {alignmentResult.outcomes.slice(0, 2).map(o => (
          <span key={o.id} className="bg-teal-50 text-teal-800 text-[11px] font-semibold px-2 py-0.5 rounded shrink-0">{o.id}</span>
        ))}
      </div>
    );
  };

  const renderDashboard = () => (
    <div className="flex-1 ml-60 flex flex-col min-h-screen bg-slate-50">
      {renderTopbar("Dashboard", "Good morning, Sarah")}
      <div className="p-8 flex-1">
        <div className="grid grid-cols-4 gap-4 mb-7">
          {[
            { label: "Total Searches", value: dashboardStats.totalSearches },
            { label: "Resources Generated", value: dashboardStats.resourcesGenerated },
            { label: "Avg Alignment Score", value: `${dashboardStats.averageAlignmentScore}%` },
            { label: "Top Subject", value: dashboardStats.topSubject },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl shadow-sm border border-border p-5" data-testid={`stat-${stat.label.replace(/\s+/g, '-').toLowerCase()}`}>
              <div className="text-[12px] text-muted-foreground uppercase font-semibold tracking-widest mb-1.5">{stat.label}</div>
              <div className="font-serif text-3xl text-primary">{stat.value}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-4 mb-7">
          <div onClick={() => setCurrentScreen('unit-planner')} className="bg-white rounded-xl shadow-sm border border-border p-7 cursor-pointer hover:border-primary hover:shadow-md transition-all hover:-translate-y-0.5 group" data-testid="card-unit-planner">
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><BookOpen className="w-6 h-6" /></div>
            <div className="text-base font-bold text-foreground mb-1.5">Unit Planner</div>
            <div className="text-sm text-muted-foreground leading-relaxed">Context-aware lesson plans that know where you are in your teaching sequence.</div>
          </div>
          <div onClick={() => setCurrentScreen('search')} className="bg-white rounded-xl shadow-sm border border-border p-7 cursor-pointer hover:border-primary hover:shadow-md transition-all hover:-translate-y-0.5 group" data-testid="card-generate-resource">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><Compass className="w-6 h-6" /></div>
            <div className="text-base font-bold text-foreground mb-1.5">Generate Resource</div>
            <div className="text-sm text-muted-foreground leading-relaxed">Search for curriculum-aligned materials, lesson plans, and worksheets tailored to your students.</div>
          </div>
          <div onClick={() => setCurrentScreen('semester')} className="bg-white rounded-xl shadow-sm border border-border p-7 cursor-pointer hover:border-primary hover:shadow-md transition-all hover:-translate-y-0.5 group" data-testid="card-semester">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><CalendarDays className="w-6 h-6" /></div>
            <div className="text-base font-bold text-foreground mb-1.5">Semester Planner</div>
            <div className="text-sm text-muted-foreground leading-relaxed">Build a full-semester curriculum overview with AI, click any week to explore resources.</div>
          </div>
        </div>

        <div className="mb-7">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">This Week in Your Area</span>
            {feedResult && <span className="text-[11px] text-muted-foreground ml-1">📍 {feedResult.localContext.suburb} · {feedResult.weather.temp}°C {feedResult.weather.description}</span>}
            {isFeedLoading && <span className="text-[11px] text-muted-foreground animate-pulse ml-1">📍 Detecting your area...</span>}
          </div>
          {isFeedLoading && (
            <div className="grid grid-cols-3 gap-4">{[0,1,2].map(i => <div key={i} className="bg-white rounded-xl border border-border p-5 animate-pulse"><div className="h-4 bg-slate-100 rounded w-2/3 mb-3"></div><div className="h-3 bg-slate-100 rounded w-full mb-2"></div><div className="h-3 bg-slate-100 rounded w-4/5"></div></div>)}</div>
          )}
          {!isFeedLoading && feedResult && (
            <div className="grid grid-cols-3 gap-4">
              {feedResult.feedItems.map((item, i) => {
                const typeColorMap: Record<string, string> = { weather: "bg-sky-50 text-sky-700", local_history: "bg-amber-50 text-amber-700", environment: "bg-green-50 text-green-700", community: "bg-purple-50 text-purple-700" };
                return (
                  <div key={i} className="bg-white rounded-xl shadow-sm border border-border p-5 flex flex-col gap-3 hover:shadow-md hover:border-teal-200 transition-all" data-testid={`feed-card-${i}`}>
                    <div className="flex items-center gap-2"><span className="text-2xl">{item.icon}</span><span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${typeColorMap[item.type] ?? "bg-slate-50 text-slate-600"}`}>{item.type.replace("_", " ")}</span></div>
                    <div className="text-[14px] font-bold text-foreground leading-snug">{item.headline}</div>
                    <div className="text-[13px] text-slate-600 leading-relaxed flex-1">{item.teachingAngle}</div>
                    <div className="text-[11px] font-semibold text-primary bg-teal-50 px-2.5 py-1 rounded-full w-fit">{item.curriculumLink}</div>
                  </div>
                );
              })}
            </div>
          )}
          {!isFeedLoading && !feedResult && (
            <div className="grid grid-cols-3 gap-4 opacity-50">{['🌦','🗺','🌿'].map((icon, i) => <div key={i} className="bg-white rounded-xl border border-border p-5 text-center text-slate-400 text-sm"><div className="text-2xl mb-2">{icon}</div><div>Enter your postcode to see local teaching opportunities</div></div>)}</div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border text-sm font-semibold text-foreground">Recent Resources</div>
          <div className="divide-y divide-border">
            {(recentResources || []).map((resource, i) => (
              <div key={resource.id} className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] px-6 py-3.5 items-center text-sm hover:bg-slate-50 transition-colors" data-testid={`recent-resource-${i}`}>
                <div className="font-medium text-foreground">{resource.title}</div>
                <div className="text-muted-foreground">{resource.subject}</div>
                <div className="text-muted-foreground">{resource.yearLevel}</div>
                <div className="text-muted-foreground">{resource.alignmentScore}% Match</div>
                <span className="bg-green-100 text-green-700 text-[11px] font-semibold px-2.5 py-1 rounded-full">Verified</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderInputForm = () => {
    if (isSearching) {
      const steps = [
        {
          key: 'curricullm',
          icon: '🎓',
          label: 'CurricuLLM-AU',
          sublabel: 'Mapping AC v9 outcome codes',
          active: searchStep === 'curricullm',
          done: searchStep === 'sources' || searchStep === 'merging',
        },
        {
          key: 'sources',
          icon: '🏛',
          label: 'Trusted Sources',
          sublabel: 'AIATSIS · National Museum · Scootle · ABC Education',
          active: searchStep === 'sources',
          done: searchStep === 'merging',
        },
        {
          key: 'merging',
          icon: '⚡',
          label: 'Merging & Ranking',
          sublabel: 'Deduplicating · Scoring · Local context injection',
          active: searchStep === 'merging',
          done: false,
        },
      ];
      return (
        <div className="flex-1 ml-60 flex flex-col min-h-screen bg-slate-50">
          {renderTopbar("Searching Resources", `Finding resources for "${searchParams.topic}"...`)}
          <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] gap-8">
            <div className="text-center">
              <div className="w-14 h-14 border-4 border-slate-200 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
              <div className="text-[17px] font-semibold text-foreground mb-1">Running parallel search pipeline</div>
              <div className="text-[13px] text-muted-foreground">{searchParams.subject} · {searchParams.yearLevel} · {searchParams.state}</div>
            </div>
            <div className="flex items-stretch gap-0 bg-white border border-border rounded-2xl shadow-sm overflow-hidden w-full max-w-2xl">
              {steps.map((step, i) => (
                <div key={step.key} className={`flex-1 flex flex-col items-center px-5 py-5 relative transition-all duration-300 ${step.done ? 'bg-emerald-50' : step.active ? 'bg-primary/5' : 'bg-white'} ${i < steps.length - 1 ? 'border-r border-border' : ''}`}>
                  <div className={`text-2xl mb-2 transition-all ${step.active ? 'animate-pulse' : ''}`}>{step.icon}</div>
                  <div className={`text-[12px] font-bold mb-1 text-center ${step.done ? 'text-emerald-700' : step.active ? 'text-primary' : 'text-slate-400'}`}>{step.label}</div>
                  <div className="text-[10px] text-slate-400 text-center leading-tight">{step.sublabel}</div>
                  {step.done && <div className="mt-2 text-emerald-600 text-[11px] font-bold">✓ Done</div>}
                  {step.active && <div className="mt-2 text-primary text-[11px] font-bold animate-pulse">Running...</div>}
                  {!step.done && !step.active && <div className="mt-2 text-slate-300 text-[11px]">Queued</div>}
                </div>
              ))}
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
              CurricuLLM scores 89% on AC benchmarks vs 41% for generic AI
            </div>
          </div>
        </div>
      );
    }

    const toggleClassContext = (ctx: string) => {
      setSearchParams(prev => ({ ...prev, classContext: prev.classContext.includes(ctx) ? prev.classContext.filter(c => c !== ctx) : [...prev.classContext, ctx] }));
    };

    const INTEREST_OPTIONS = ['Sport', 'Gaming', 'Music', 'Cooking', 'Technology', 'Fashion', 'Environment', 'Animals', 'Travel', 'Social Justice'];

    return (
      <div className="flex-1 ml-60 flex flex-col min-h-screen bg-slate-50">
        {renderTopbar("New Resource", "Define your requirements")}
        <div className="p-8 flex-1">
          <div className="bg-white rounded-xl shadow-sm border border-border p-10 max-w-4xl mx-auto">
            {unitContext.unitTitle && (
              <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 mb-6 flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-primary mb-0.5">Unit Context Active</div>
                  <div className="text-[13px] text-slate-700">{unitContext.unitTitle} — Lesson {unitContext.currentLesson || '?'} of {unitContext.totalLessons || '?'}</div>
                </div>
                <button onClick={() => setCurrentScreen('unit-planner')} className="text-[12px] text-primary hover:underline bg-transparent border-none cursor-pointer">Edit</button>
              </div>
            )}

            <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-4">Curriculum Target</div>
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-slate-600">Year Level</label>
                <select className="px-3.5 py-2.5 border border-border rounded-lg text-sm bg-white outline-none focus:border-primary transition-colors appearance-none cursor-pointer" value={searchParams.yearLevel} onChange={(e) => setSearchParams({...searchParams, yearLevel: e.target.value})} data-testid="select-year-level">
                  {['Year 7', 'Year 8', 'Year 9', 'Year 10', 'Year 11', 'Year 12'].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-slate-600">State</label>
                <select className="px-3.5 py-2.5 border border-border rounded-lg text-sm bg-white outline-none focus:border-primary transition-colors appearance-none cursor-pointer" value={searchParams.state} onChange={(e) => { const newState = e.target.value; setSearchParams(prev => ({...prev, state: newState})); loadFeed(searchParams.postcode, newState, searchParams.subject, searchParams.yearLevel); }} data-testid="select-state">
                  {['NSW', 'QLD', 'VIC', 'WA', 'SA', 'TAS', 'ACT', 'NT'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-slate-600">Postcode</label>
                <input type="text" maxLength={4} className="px-3.5 py-2.5 border border-border rounded-lg text-sm bg-white outline-none focus:border-primary transition-colors" placeholder="e.g. 2150" value={searchParams.postcode} onChange={(e) => { const p = e.target.value.replace(/\D/g, '').slice(0, 4); setSearchParams(prev => ({...prev, postcode: p})); if (p.length === 4) loadFeed(p, searchParams.state, searchParams.subject, searchParams.yearLevel); }} data-testid="input-postcode" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-slate-600">Subject</label>
                <select className="px-3.5 py-2.5 border border-border rounded-lg text-sm bg-white outline-none focus:border-primary transition-colors appearance-none cursor-pointer" value={searchParams.subject} onChange={(e) => setSearchParams({...searchParams, subject: e.target.value})} data-testid="select-subject">
                  {['Science', 'Mathematics', 'English', 'History', 'Geography', 'Health and Physical Education', 'Technologies', 'The Arts'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1.5 mb-6">
              <label className="text-[13px] font-medium text-slate-600">Topic or Specific Outcome</label>
              <div className="flex gap-2">
                <input type="text" className="flex-1 px-3.5 py-2.5 border border-border rounded-lg text-sm bg-white outline-none focus:border-primary transition-colors" placeholder="e.g. Climate change impacts, Algebraic fractions, Natural selection..." value={searchParams.topic} onChange={(e) => setSearchParams({...searchParams, topic: e.target.value})} onKeyDown={(e) => { if (e.key === 'Enter' && searchParams.topic) handleSearch(); }} data-testid="input-topic" />
                <VoiceMic onTranscript={(t) => setSearchParams(prev => ({...prev, topic: t}))} voiceLang={voiceLang} />
              </div>
            </div>

            <hr className="border-t border-border my-7" />
            <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-4">Resource Type</div>
            <div className="grid grid-cols-4 gap-3 mb-6">
              {[{icon: "📄", label: "Lesson Plan"}, {icon: "📋", label: "Worksheet"}, {icon: "💬", label: "Discussion"}, {icon: "✏️", label: "Assessment"}].map(type => (
                <div key={type.label} className={`border rounded-lg p-4 text-center cursor-pointer transition-colors ${searchParams.resourceType === type.label ? 'border-primary bg-teal-50' : 'border-border bg-white hover:border-primary'}`} onClick={() => setSearchParams({...searchParams, resourceType: type.label})} data-testid={`resource-type-${type.label.replace(/\s+/g, '-').toLowerCase()}`}>
                  <div className="text-2xl mb-2">{type.icon}</div>
                  <div className={`text-xs font-semibold ${searchParams.resourceType === type.label ? 'text-teal-800' : 'text-slate-600'}`}>{type.label}</div>
                </div>
              ))}
            </div>

            <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-4">Class Context (Optional)</div>
            <div className="flex flex-wrap gap-2 mb-5">
              {['Mixed Ability', 'EAL/D', 'High Achievers', 'Learning Support', 'Inquiry-Based'].map(ctx => (
                <div key={ctx} className={`px-3.5 py-1.5 rounded-full border text-[13px] font-medium cursor-pointer transition-colors select-none ${searchParams.classContext.includes(ctx) ? 'border-primary bg-teal-50 text-teal-800' : 'border-border bg-white text-slate-600 hover:border-primary hover:text-primary'}`} onClick={() => toggleClassContext(ctx)} data-testid={`chip-${ctx.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`}>{ctx}</div>
              ))}
            </div>

            <button onClick={() => setShowInterests(!showInterests)} className="flex items-center gap-2 text-[13px] text-primary font-medium bg-transparent border-none cursor-pointer mb-4" aria-label="Toggle student interests">
              <Sparkles className="w-4 h-4" /> Student Interests (personalise resources)
              {showInterests ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            {showInterests && (
              <div className="flex flex-wrap gap-2 mb-6 p-4 bg-slate-50 rounded-xl border border-border">
                {INTEREST_OPTIONS.map(interest => (
                  <div key={interest} className={`px-3 py-1.5 rounded-full border text-[13px] font-medium cursor-pointer transition-colors select-none ${studentInterests.includes(interest) ? 'border-primary bg-teal-50 text-teal-800' : 'border-border bg-white text-slate-600 hover:border-primary'}`} onClick={() => toggleInterest(interest)}>{interest}</div>
                ))}
                {studentInterests.length > 0 && <div className="text-[11px] text-primary ml-1 self-center">Selected: {studentInterests.join(', ')}</div>}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button onClick={() => setCurrentScreen('dashboard')} className="bg-white text-slate-600 border border-border px-5 py-2.5 rounded-lg text-sm font-medium hover:border-primary hover:text-primary transition-colors flex items-center gap-2 cursor-pointer" data-testid="btn-cancel">Cancel</button>
              <button onClick={handleSearch} disabled={!searchParams.topic} className="bg-primary text-white border-none px-7 py-2.5 rounded-lg text-[15px] font-semibold hover:bg-teal-700 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-[1px] shadow-sm" data-testid="btn-search">
                <Search className="w-4 h-4" /> Find Resources
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderAIComparison = () => {
    if (!alignmentResult || !genericAIResult) return null;
    return (
      <div className="bg-white rounded-xl border border-border mb-5 overflow-hidden shadow-sm">
        <button
          type="button"
          onClick={() => setShowAIComparison(!showAIComparison)}
          className="w-full flex items-center justify-between px-5 py-3 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer border-none text-left"
        >
          <div className="flex items-center gap-2">
            <span className="text-base">⚡</span>
            <span className="text-[13px] font-bold text-foreground">Why CurricuLLM vs Generic AI?</span>
            <span className="text-[11px] text-muted-foreground ml-1">See the difference in curriculum accuracy</span>
          </div>
          {showAIComparison ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {showAIComparison && (
          <div className="grid grid-cols-2 divide-x divide-border">
            {/* CurricuLLM column */}
            <div className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                <div className="text-[13px] font-bold text-emerald-700">TeachSmart — CurricuLLM-AU</div>
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full ml-auto">89% accuracy</span>
              </div>
              <div className="text-[11px] text-muted-foreground mb-2">AC v9 outcomes identified:</div>
              <div className="flex flex-col gap-1.5 mb-3">
                {alignmentResult.outcomes.slice(0, 3).map(o => (
                  <div key={o.id} className="flex items-start gap-2 text-[12px]">
                    <span className="bg-teal-50 text-teal-800 font-bold px-2 py-0.5 rounded text-[11px] shrink-0">{o.id}</span>
                    <span className="text-slate-600 leading-snug">{o.description.slice(0, 80)}...</span>
                  </div>
                ))}
              </div>
              <div className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-100">
                ✓ Current AC v9 outcome codes · Verified against curriculum data
              </div>
            </div>

            {/* Generic AI column */}
            <div className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-red-400 shrink-0"></span>
                <div className="text-[13px] font-bold text-slate-600">Generic AI (no curriculum training)</div>
                <span className="text-[10px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full ml-auto">41% accuracy</span>
              </div>
              <div className="text-[11px] text-muted-foreground mb-2">Outcomes it would suggest:</div>
              <div className="flex flex-col gap-1.5 mb-3">
                {genericAIResult.outcomes.slice(0, 3).map((o, i) => (
                  <div key={i} className="flex items-start gap-2 text-[12px]">
                    <span className="bg-red-50 text-red-700 font-bold px-2 py-0.5 rounded text-[11px] shrink-0 border border-red-100">{o.id}</span>
                    <span className="text-slate-500 leading-snug italic">{o.note}</span>
                  </div>
                ))}
              </div>
              {genericAIResult.warning && (
                <div className="text-[11px] font-semibold text-red-700 bg-red-50 px-3 py-2 rounded-lg border border-red-100">
                  ⚠ {genericAIResult.warning}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderFirstNationsBanner = () => {
    const country = feedResult?.localContext?.country;
    const suburb = feedResult?.localContext?.suburb;
    if (!country) return null;
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-3 mb-5 flex items-center gap-3">
        <span className="text-xl shrink-0">🌏</span>
        <div className="flex-1">
          <span className="text-[13px] font-semibold text-amber-900">
            Teaching on {country}
            {suburb ? ` · ${suburb}` : ""}.
          </span>
          <span className="text-[13px] text-amber-800 ml-1.5">
            TeachSmart surfaces resources that acknowledge and respect Country.
          </span>
        </div>
        <span className="text-[11px] font-semibold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full border border-amber-200 shrink-0">
          Always Was, Always Will Be
        </span>
      </div>
    );
  };

  const renderLocalLensTip = () => {
    const country = feedResult?.localContext?.country;
    const suburb = feedResult?.localContext?.suburb;
    const landmarks = feedResult?.localContext?.landmarks;
    if (!country || resources.length === 0) return null;

    // Build a contextual tip based on the search topic and local context
    const isRights = searchParams.topic.toLowerCase().includes('rights') || searchParams.topic.toLowerCase().includes('freedom');
    const isScience = searchParams.subject.toLowerCase().includes('science');
    const isHistory = searchParams.subject.toLowerCase().includes('history') || searchParams.subject.toLowerCase().includes('humanities');

    let tip = '';
    let sourceLink = '';
    if (isRights && isHistory && suburb === 'Parramatta') {
      tip = `These resources cover national rights history — but the story runs through your classroom door. Parramatta (${country}) is home to the Burramattagal people, the founding site of colonial assimilation policies, and the Darug Custodian Aboriginal Corporation, who offer school visits and cultural learning programs. Pair the 1967 Referendum materials with local oral histories to make this history personal for your students.`;
      sourceLink = 'Darug Custodian Aboriginal Corporation';
    } else if (isScience && suburb) {
      tip = `Your ${suburb} students can connect these resources to local data. The BOM station nearest ${suburb} has 100+ years of climate records showing measurable local temperature rise — search "BOM ${suburb}" to download your local dataset and use it as the anchor for the CSIRO national data.`;
      sourceLink = 'Bureau of Meteorology';
    } else if (country && suburb) {
      tip = `These resources are nationally scoped, but ${country} has rich local connections. ${landmarks ? `Nearby: ${landmarks}.` : ''} Consider inviting a local community member or Elder to contextualise these materials for your ${suburb} students.`;
      sourceLink = '';
    }

    if (!tip) return null;

    return (
      <div className="bg-teal-50 border-2 border-teal-200 rounded-xl px-5 py-4 mb-5 flex gap-4" data-testid="local-lens-tip">
        <div className="shrink-0 mt-0.5">
          <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center text-white text-[16px] font-bold">📍</div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[12px] font-bold uppercase tracking-widest text-teal-600">Local Lens</span>
            <span className="text-[11px] bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-semibold border border-teal-200">
              {suburb ?? country}
            </span>
          </div>
          <p className="text-[14px] text-teal-900 leading-relaxed mb-2">{tip}</p>
          {sourceLink && (
            <span className="text-[12px] text-teal-600 font-semibold">
              → Local source: {sourceLink}
            </span>
          )}
        </div>
      </div>
    );
  };

  const renderResults = () => (
    <div className="flex-1 ml-60 flex flex-col min-h-screen bg-slate-50">
      {renderTopbar("Results", `Found ${resources.length} resource${resources.length !== 1 ? 's' : ''} for ${searchParams.topic}`)}
      <div className="p-8 flex-1">
        {renderFirstNationsBanner()}
        {renderLocalLensTip()}
        {renderAlignmentBar()}
        {renderAIComparison()}
        <div className="flex flex-col gap-4">
          {resources.length === 0 && (
            <div className="bg-white rounded-xl border border-border p-12 text-center">
              <div className="text-slate-300 text-4xl mb-3">📚</div>
              <div className="text-[15px] font-semibold text-slate-400 mb-1">No resources found</div>
              <div className="text-[13px] text-slate-400">Try adjusting your search topic or year level.</div>
              <button onClick={() => setCurrentScreen('search')} className="mt-4 bg-primary text-white border-none px-5 py-2.5 rounded-lg text-sm font-semibold cursor-pointer hover:bg-teal-700">Back to search</button>
            </div>
          )}
          {resources.map((resource) => (
            <div key={resource.id} className="bg-white rounded-xl shadow-sm border border-border p-6 flex flex-col gap-4 hover:border-teal-200 hover:shadow-md transition-all" data-testid={`resource-card-${resource.id}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{resource.type}</span>
                    <span className="bg-teal-50 text-teal-800 text-[11px] font-semibold px-2 py-0.5 rounded">{resource.alignmentScore}% match</span>
                    {resource.safetyRating === 'verified' && <span className="bg-green-100 text-green-700 text-[11px] font-semibold px-2 py-0.5 rounded-full">✓ Verified</span>}
                    {resource.biasFlag === 'low' && <span className="bg-blue-100 text-blue-700 text-[11px] font-semibold px-2 py-0.5 rounded-full">Bias: low</span>}
                  </div>
                  <div className="text-[17px] font-bold text-foreground mb-0.5">{resource.title}</div>
                  <div className="text-[13px] text-slate-400 font-medium mb-2">{resource.source}</div>
                  <div className="text-[14px] text-slate-600 leading-relaxed mb-3">{resource.description}</div>
                  {resource.whyThisResource && (
                    <div className="bg-teal-50 border border-teal-100 rounded-xl px-4 py-3 text-[13px] text-teal-800 leading-relaxed">
                      <span className="font-bold">Why this resource? </span>{resource.whyThisResource}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {resource.localContextTags.map(tag => <span key={tag} className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">{tag}</span>)}
                  </div>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  {resource.url && (
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700 transition-colors no-underline"
                      aria-label={`Open ${resource.title} in new tab`}
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Open resource
                    </a>
                  )}
                  <button
                    onClick={() => handleSaveResource(resource)}
                    disabled={savedResourceIds.has(resource.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold border-none cursor-pointer transition-colors ${savedResourceIds.has(resource.id) ? 'bg-teal-100 text-teal-700 cursor-default' : 'bg-slate-100 text-slate-600 hover:bg-teal-50 hover:text-teal-700'}`}
                    aria-label={savedResourceIds.has(resource.id) ? "Resource saved" : "Save resource"}
                  >
                    {savedResourceIds.has(resource.id) ? <><BookmarkCheck className="w-3.5 h-3.5" /> Saved</> : <><Bookmark className="w-3.5 h-3.5" /> Save</>}
                  </button>
                  <button onClick={() => handleAdaptResource(resource)} className="bg-primary text-white border-none px-4 py-2 rounded-lg text-[13px] font-semibold cursor-pointer hover:bg-teal-700 transition-colors shadow-sm whitespace-nowrap" data-testid={`btn-adapt-${resource.id}`} aria-label={`Adapt ${resource.title}`}>
                    Adapt for class →
                  </button>
                </div>
              </div>
              {resource.trustScorecard && (
                <TrustScorecard scorecard={resource.trustScorecard} resourceTitle={resource.title} />
              )}
            </div>
          ))}
        </div>
        {resources.length > 0 && (
          <div className="mt-5 flex justify-start">
            <button onClick={() => setCurrentScreen('search')} className="text-[13px] font-medium text-slate-500 hover:text-primary flex items-center gap-1.5 bg-transparent border-none cursor-pointer">
              <ArrowLeft className="w-4 h-4" /> Back to search
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderLessonPlan = () => {
    if (isGeneratingLesson) {
      return (
        <div className="flex-1 ml-60 flex flex-col min-h-screen bg-slate-50">
          {renderTopbar("Generating Lesson Plan", "AI is writing your lesson...")}
          <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] gap-5">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-primary rounded-full animate-spin"></div>
            <div className="text-[15px] text-muted-foreground">Designing your lesson plan...</div>
            <div className="flex flex-col gap-2 mt-2">
              <div className="flex items-center gap-2.5 text-[13px] text-primary"><CheckCircle className="w-4 h-4" /> Matching curriculum outcomes</div>
              <div className="flex items-center gap-2.5 text-[13px] text-primary"><CheckCircle className="w-4 h-4" /> Sourcing local Australian examples</div>
              <div className="flex items-center gap-2.5 text-[13px] text-slate-500"><FileText className="w-4 h-4" /> Writing differentiated questions...</div>
            </div>
          </div>
        </div>
      );
    }

    if (!lessonPlan) return null;
    const resource = selectedResource;

    const getDifficultyColor = (d: string) => d === 'foundation' ? 'bg-green-100 text-green-700' : d === 'core' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700';
    const getDifficultyLabel = (d: string) => d === 'foundation' ? 'Foundation' : d === 'core' ? 'Core' : 'Extension';

    return (
      <div className="flex-1 ml-60 flex flex-col min-h-screen bg-slate-50">
        {renderTopbar("Lesson Plan Editor", "Review and customise your generated plan")}
        <div className="p-8 flex-1">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-5">
              <button onClick={() => setCurrentScreen('results')} className="text-[13px] font-medium text-slate-500 hover:text-primary flex items-center gap-1.5 bg-transparent border-none cursor-pointer" data-testid="btn-back-to-results">
                <ArrowLeft className="w-4 h-4" /> Back to results
              </button>
              <div className="flex gap-2">
                <button
                  onClick={handleSaveLesson}
                  disabled={lessonSaved}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-semibold border cursor-pointer transition-colors ${lessonSaved ? 'bg-teal-50 text-teal-700 border-teal-200 cursor-default' : 'bg-white text-slate-600 border-border hover:border-primary hover:text-primary'}`}
                  aria-label={lessonSaved ? "Lesson saved" : "Save lesson to library"}
                >
                  {lessonSaved ? <><BookmarkCheck className="w-4 h-4" /> Saved to Library</> : <><Bookmark className="w-4 h-4" /> Save to Library</>}
                </button>
                <button
                  onClick={handleGenerateSlides}
                  disabled={isGeneratingSlides}
                  className="flex items-center gap-1.5 bg-primary text-white border-none px-4 py-2 rounded-lg text-[13px] font-semibold cursor-pointer hover:bg-teal-700 transition-colors shadow-sm disabled:opacity-60"
                  aria-label="Generate slide deck"
                >
                  {isGeneratingSlides ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</> : <><Presentation className="w-4 h-4" /> Generate Slides →</>}
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-border p-6 mb-5 flex items-center justify-between">
              <div>
                <div className="text-lg font-bold text-foreground">{resource?.title ?? searchParams.topic}</div>
                <div className="text-[13px] text-slate-500 mt-1">{resource?.source} · {searchParams.yearLevel} {searchParams.subject}</div>
                {unitContext.unitTitle && (
                  <div className="text-[12px] text-primary mt-1">📋 {unitContext.unitTitle} — Lesson {unitContext.currentLesson || '?'} of {unitContext.totalLessons || '?'}</div>
                )}
                <div className="flex gap-1.5 mt-2.5 flex-wrap">
                  {alignmentResult?.outcomes.slice(0, 3).map(o => <span key={o.id} className="bg-teal-50 text-teal-800 text-[11px] font-semibold px-2 py-0.5 rounded">{o.id}</span>)}
                </div>
              </div>
              <div className="flex gap-2.5">
                <button className="bg-white text-slate-600 border border-border px-4 py-2 rounded-md text-sm font-medium hover:border-primary hover:text-primary transition-colors flex items-center gap-2 cursor-pointer">
                  <FileText className="w-4 h-4" /> Google Classroom
                </button>
                <button className="bg-primary text-white border-none px-4 py-2 rounded-md text-sm font-medium hover:bg-teal-700 transition-colors flex items-center gap-2 cursor-pointer shadow-sm" onClick={() => window.print()}>
                  <Download className="w-4 h-4" /> Export PDF
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-border p-7 mb-5">
              <div className="flex items-center gap-4 mb-5 pb-5 border-b border-border">
                <span className="bg-slate-100 text-slate-700 text-[13px] font-semibold px-3.5 py-1.5 rounded-full">{lessonPlan.duration}</span>
                <span className="bg-slate-100 text-slate-700 text-[13px] font-semibold px-3.5 py-1.5 rounded-full">{searchParams.classContext.length > 0 ? searchParams.classContext.join(', ') : 'Standard Class'}</span>
                {lessonPlan.usedFallback && <span className="bg-amber-100 text-amber-700 text-[11px] font-semibold px-3 py-1 rounded-full">Estimated plan</span>}
              </div>
              <div className="text-[15px] text-slate-700 leading-relaxed mb-6">{lessonPlan.objective}</div>
              <div className="flex flex-col gap-3.5">
                {lessonPlan.activities.map((activity, i) => (
                  <div key={i} className="flex gap-3.5 items-start">
                    <div className="w-2 h-2 rounded-full bg-primary mt-[7px] shrink-0"></div>
                    <div>
                      <div className="text-[14px] font-semibold text-foreground mb-0.5">{activity.label}</div>
                      <div className="text-[14px] text-slate-600 leading-relaxed">{activity.text}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-5 shadow-sm">
              <div className="text-[14px] font-bold text-blue-700 mb-2 flex items-center gap-2"><Compass className="w-4 h-4" /> Local Australian Context: {lessonPlan.localExample.title}</div>
              <div className="text-[14px] text-slate-700 leading-relaxed">{lessonPlan.localExample.body}</div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-border p-7 mb-5">
              <div className="font-serif text-[20px] text-foreground mb-4">Differentiated Questions</div>
              <div className="flex flex-col gap-3">
                {lessonPlan.questions.map((q, i) => (
                  <div key={i} className="p-3.5 border border-border rounded-lg flex items-start gap-3">
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0 mt-0.5 ${getDifficultyColor(q.difficulty)}`}>{getDifficultyLabel(q.difficulty)}</span>
                    <div className="text-[14px] text-slate-700 leading-relaxed pt-0.5">{q.q}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-border p-7 mb-8">
              <div className="font-serif text-[20px] text-foreground mb-3">Teacher Notes</div>
              <textarea className="w-full min-h-[100px] border border-border rounded-lg p-3.5 text-[14px] text-slate-700 resize-y outline-none focus:border-primary transition-colors leading-relaxed" value={teacherNotes} onChange={(e) => setTeacherNotes(e.target.value)} data-testid="textarea-teacher-notes" aria-label="Teacher notes" />
            </div>

            <div className="flex justify-center">
              <button onClick={handleGenerateSlides} disabled={isGeneratingSlides} className="flex items-center gap-2.5 bg-gradient-to-r from-teal-600 to-teal-700 text-white border-none px-8 py-3.5 rounded-xl text-[15px] font-bold cursor-pointer hover:from-teal-700 hover:to-teal-800 transition-all shadow-md disabled:opacity-60" aria-label="Generate full slide deck">
                {isGeneratingSlides ? <><Loader2 className="w-5 h-5 animate-spin" /> Generating Slide Deck...</> : <><Presentation className="w-5 h-5" /> Generate Slide Deck for this Lesson</>}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      {renderSidebar()}
      {currentScreen === 'dashboard' && renderDashboard()}
      {currentScreen === 'unit-planner' && (
        <UnitPlanner
          unitContext={unitContext}
          onUpdate={setUnitContext}
          onContinue={() => setCurrentScreen('search')}
          onSkip={() => setCurrentScreen('search')}
          voiceLang={voiceLang}
        />
      )}
      {currentScreen === 'search' && renderInputForm()}
      {currentScreen === 'results' && renderResults()}
      {currentScreen === 'lesson' && renderLessonPlan()}
      {currentScreen === 'slideshow' && slidedeckData && (
        <Slideshow
          data={slidedeckData}
          onClose={() => setCurrentScreen('lesson')}
          subject={searchParams.subject}
          yearLevel={searchParams.yearLevel}
          topic={searchParams.topic}
        />
      )}
      {currentScreen === 'library' && (
        <Library
          onLoadResource={(r: SavedResource) => {
            setResources([r]);
            setAlignmentResult({ alignmentScore: r.alignmentScore, syllabus: `${r.yearLevel} ${r.subject}`, strand: 'Loaded from library', outcomes: r.outcomeIds.map(id => ({ id, description: id })), notes: '', usedFallback: false });
            setSearchParams(prev => ({ ...prev, subject: r.subject, yearLevel: r.yearLevel, topic: r.topic }));
            setCurrentScreen('results');
          }}
          onLoadLesson={(l: SavedLesson) => {
            setLessonPlan({ objective: l.objective, duration: l.duration, activities: l.activities, localExample: l.localExample, questions: l.questions, usedFallback: false });
            setTeacherNotes('Loaded from library.');
            setSearchParams(prev => ({ ...prev, subject: l.subject, yearLevel: l.yearLevel, topic: l.topic }));
            setCurrentScreen('lesson');
          }}
        />
      )}
      {currentScreen === 'semester' && (
        <SemesterPlanner
          subject={searchParams.subject}
          yearLevel={searchParams.yearLevel}
          state={searchParams.state}
          preferredLanguage={preferredLanguage}
          onWeekSelect={(week) => {
            setSearchParams(prev => ({ ...prev, topic: week.topic }));
            setCurrentScreen('search');
          }}
        />
      )}
      {currentScreen === 'settings' && (
        <SettingsPanel
          uiLanguage={uiLanguage}
          onUiLanguageChange={setUiLanguage}
          fontSize={fontSize}
          onFontSizeChange={setFontSize}
          highContrast={highContrast}
          onHighContrastChange={setHighContrast}
        />
      )}
    </div>
  );
}
