import React, { useState, useEffect, useCallback } from "react";
import {
  BookOpen, Compass, Search, FileText, Download, Edit, ArrowLeft,
  CheckCircle, Home as HomeIcon, FileStack, BarChart3, MapPin,
  CalendarDays, Settings2, Globe, ChevronDown, ChevronUp,
  Presentation, Library as LibraryIcon, Bookmark, BookmarkCheck, Loader2, Sparkles, ExternalLink,
  Plus, X, Users
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

type OutcomeHeader = {
  outcomeCode: string;
  outcomeDescription: string;
  successCriteria: string[];
  usedFallback?: boolean;
};

type LessonPlan = OutcomeHeader & {
  resourceType: 'Lesson Plan';
  objective: string; duration: string;
  activities: { label: string; text: string }[];
  localExample: { title: string; body: string };
  questions: { q: string; difficulty: string }[];
};

type WorksheetOutput = OutcomeHeader & {
  resourceType: 'Worksheet';
  sections: { title: string; instructions: string; questions: { q: string; lines: number; marks: number }[] }[];
  extensionTask: string;
  wordBank: string[];
};

type DiscussionOutput = OutcomeHeader & {
  resourceType: 'Discussion';
  discussionPrompt: string;
  backgroundContext: string;
  perspectives: { viewpoint: string; keyArguments: string[] }[];
  sentenceStarters: string[];
  reflectionQuestions: string[];
  teacherFacilitationNotes: string;
};

type AssessmentOutput = OutcomeHeader & {
  resourceType: 'Assessment';
  taskDescription: string; taskType: string; duration: string;
  markingCriteria: { criterion: string; excellent: string; satisfactory: string; developing: string; marks: number }[];
  totalMarks: number;
  teacherMarkingGuide: string;
};

type GeneratedOutput = LessonPlan | WorksheetOutput | DiscussionOutput | AssessmentOutput;

type FeedItem = { type: string; headline: string; teachingAngle: string; curriculumLink: string; icon: string };
type FeedResult = {
  feedItems: FeedItem[];
  weather: { temp: number; description: string; rainfall: number; wind: number; city: string; usedFallback: boolean };
  localContext: { suburb: string; country: string; landmarks: string };
  usedFallback: boolean;
};

type MyClass = { id: string; code: string; name: string; yearLevel: string; subject: string; state: string };

const MOCK_DASHBOARD_STATS = { totalSearches: 124, resourcesGenerated: 89, averageAlignmentScore: 92, topSubject: "History" };
const MOCK_RECENT = [
  { id: "1", title: "Climate Change Impacts", subject: "Science", yearLevel: "Year 9", topic: "Climate Change", alignmentScore: 94, searchedAt: new Date().toISOString() },
  { id: "2", title: "Algebraic Expressions", subject: "Mathematics", yearLevel: "Year 8", topic: "Algebra", alignmentScore: 88, searchedAt: new Date(Date.now() - 86400000).toISOString() },
  { id: "3", title: "Poetry Analysis", subject: "English", yearLevel: "Year 10", topic: "Poetry", alignmentScore: 91, searchedAt: new Date(Date.now() - 172800000).toISOString() },
];

type Screen = 'dashboard' | 'unit-planner' | 'classes' | 'search' | 'results' | 'lesson' | 'slideshow' | 'library' | 'semester' | 'settings';

const EMPTY_UNIT: UnitContext = { unitTitle: '', textbook: '', totalLessons: '', currentLesson: '', prevSummary: '', learningIntention: '', successCriteria: '', assessmentType: 'exam' };

export default function Home() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('dashboard');
  const [searchParams, setSearchParams] = useState({ yearLevel: 'Year 9', state: 'NSW', subject: 'History', topic: 'Rights and Freedoms', resourceType: 'Lesson Plan', classContext: [] as string[], postcode: '2150' });
  const [isSearching, setIsSearching] = useState(false);
  const [isGeneratingLesson, setIsGeneratingLesson] = useState(false);
  const [isGeneratingSlides, setIsGeneratingSlides] = useState(false);
  const [alignmentResult, setAlignmentResult] = useState<AlignmentResult | null>(null);
  const [searchStep, setSearchStep] = useState<string | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [lessonPlan, setLessonPlan] = useState<GeneratedOutput | null>(null);
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
  const [myClasses, setMyClasses] = useState<MyClass[]>(() => {
    try { return JSON.parse(localStorage.getItem('teachsmart_classes') ?? '[]') as MyClass[]; } catch { return []; }
  });
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [expandedFeedIdx, setExpandedFeedIdx] = useState<Set<number>>(new Set());
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showAddClassForm, setShowAddClassForm] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassYearLevel, setNewClassYearLevel] = useState('Year 9');
  const [newClassSubject, setNewClassSubject] = useState('History');

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

  useEffect(() => {
    localStorage.setItem('teachsmart_classes', JSON.stringify(myClasses));
  }, [myClasses]);

  const handleAddClass = () => {
    if (!newClassName.trim()) return;
    const raw = newClassName.trim();
    const code = raw.replace(/[^0-9a-zA-Z]/g, '').slice(0, 3).toUpperCase() || raw.slice(0, 3).toUpperCase();
    const cls: MyClass = { id: Date.now().toString(), code, name: raw, yearLevel: newClassYearLevel, subject: newClassSubject, state: searchParams.state };
    setMyClasses(prev => [...prev, cls]);
    setNewClassName('');
    setShowAddClassForm(false);
  };

  const handleSelectClass = (cls: MyClass) => {
    setSelectedClassId(prev => prev === cls.id ? null : cls.id);
    if (selectedClassId !== cls.id) {
      setSearchParams(prev => ({ ...prev, yearLevel: cls.yearLevel, subject: cls.subject, state: cls.state }));
    }
  };

  const handleRemoveClass = (id: string) => {
    setMyClasses(prev => prev.filter(c => c.id !== id));
    if (selectedClassId === id) setSelectedClassId(null);
  };

  const toggleFeedItem = (idx: number) => {
    setExpandedFeedIdx(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  };

  const handleSearch = async () => {
    if (!searchParams.topic) return;
    setIsSearching(true);
    setSearchStep(null);
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

      // Step 2: Trusted sources + resources
      setSearchStep('sources');
      const resourcesResult = await apiFetch('/resources', {
        subject: searchParams.subject, yearLevel: searchParams.yearLevel,
        topic: searchParams.topic, state: searchParams.state,
        alignmentResult: alignment, unitContext, preferredLanguage,
        studentInterests,
      });

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
      const output: GeneratedOutput = await apiFetch('/lesson', {
        subject: searchParams.subject, yearLevel: searchParams.yearLevel,
        topic: searchParams.topic, state: searchParams.state,
        resource, alignmentResult, classContext: searchParams.classContext,
        unitContext, preferredLanguage, resourceType: searchParams.resourceType,
      });
      setLessonPlan(output);
      setTeacherNotes(`Ensure students have the background knowledge needed for ${searchParams.topic} before beginning. Check for prior understanding using a brief entry task.`);
    } catch {
      const o = alignmentResult.outcomes[0] ?? { id: "AC9-UNKNOWN", description: `Core ${searchParams.subject} outcome` };
      setLessonPlan({
        resourceType: 'Lesson Plan',
        outcomeCode: o.id,
        outcomeDescription: o.description,
        successCriteria: [
          `Identify and explain the key concepts of ${searchParams.topic}`,
          `Apply knowledge to an Australian context`,
          `Evaluate evidence and form a reasoned conclusion`,
        ],
        objective: `Students explore ${searchParams.topic} using Australian curriculum-aligned resources.`,
        duration: "60 minutes",
        activities: [
          { label: "Hook (5 min)", text: `Engage students with a thought-provoking question about ${searchParams.topic}.` },
          { label: "Explore (20 min)", text: "Students investigate core concepts through guided inquiry." },
          { label: "Analyse (15 min)", text: "Groups discuss findings, connecting concepts to Australian contexts." },
          { label: "Evaluate (15 min)", text: "Class discussion evaluates evidence and forms conclusions." },
          { label: "Reflect (5 min)", text: "Exit ticket: one key learning and one remaining question." },
        ],
        localExample: { title: "Australian Context", body: `Connect ${searchParams.topic} to examples relevant to ${searchParams.state} students.` },
        questions: [
          { q: `Define the key concepts of ${searchParams.topic}.`, difficulty: "foundation" },
          { q: `Explain two ways ${searchParams.topic} is relevant to Australians.`, difficulty: "foundation" },
          { q: `Analyse the evidence and explain how it supports understanding of ${searchParams.topic}.`, difficulty: "core" },
          { q: `Compare different perspectives on ${searchParams.topic}.`, difficulty: "core" },
          { q: `Critically evaluate the significance of ${searchParams.topic} for contemporary Australia.`, difficulty: "extension" },
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
    const title = `${searchParams.topic} — ${searchParams.yearLevel} ${searchParams.subject}`;
    const base = { title, subject: searchParams.subject, yearLevel: searchParams.yearLevel, topic: searchParams.topic };
    if (lessonPlan.resourceType === 'Lesson Plan') {
      saveLesson({ ...base, objective: lessonPlan.objective, duration: lessonPlan.duration, activities: lessonPlan.activities, localExample: lessonPlan.localExample, questions: lessonPlan.questions });
    } else {
      saveLesson({ ...base, objective: `${lessonPlan.resourceType}: ${lessonPlan.outcomeDescription}`, duration: '', activities: [], localExample: { title: '', body: '' }, questions: [] });
    }
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

      <button onClick={() => setCurrentScreen('classes')} className={`flex items-center gap-3 px-6 py-2.5 text-sm font-medium cursor-pointer transition-colors border-l-4 border-none w-full text-left ${currentScreen === 'classes' ? 'text-primary border-primary bg-primary/10' : 'text-slate-400 border-transparent hover:text-white hover:bg-white/5'}`} data-testid="nav-my-classes">
        <Users className="w-4 h-4" /> My Classes
        {myClasses.length > 0 && <span className="ml-auto bg-primary/20 text-primary text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0">{myClasses.length}</span>}
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

      <div className="mt-auto px-5 pt-5 border-t border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-sm font-semibold text-white shrink-0">SJ</div>
          <div className="min-w-0">
            <div className="text-[13px] font-medium text-slate-200 truncate">Sarah Chen</div>
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
          <CheckCircle className="w-3 h-3" /> {searchParams.state} Aligned
        </div>
        <div className="flex items-center gap-1.5 bg-blue-100 text-blue-700 text-[11px] font-semibold px-2.5 py-1 rounded-full">
          <Edit className="w-3 h-3" /> Bias Checked
        </div>
        <div className="relative">
          <button onClick={() => setShowLangMenu(v => !v)} className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] font-semibold px-2.5 py-1.5 rounded-full cursor-pointer border-none transition-colors" aria-label="Switch language">
            <Globe className="w-3.5 h-3.5" />
            <span>{LANGUAGES.find(l => l.code === uiLanguage)?.flag}</span>
          </button>
          {showLangMenu && (
            <div className="absolute right-0 top-8 bg-white border border-border rounded-xl shadow-lg py-1 min-w-[170px] z-50">
              {LANGUAGES.map(lang => (
                <button key={lang.code} onClick={() => { setUiLanguage(lang.code); setShowLangMenu(false); }} className={`flex items-center gap-2.5 w-full text-left px-3.5 py-2 text-[13px] font-medium cursor-pointer border-none transition-colors ${uiLanguage === lang.code ? 'bg-teal-50 text-primary' : 'bg-transparent text-foreground hover:bg-slate-50'}`}>
                  <span className="text-base">{lang.flag}</span> {lang.label}
                  {uiLanguage === lang.code && <CheckCircle className="w-3.5 h-3.5 text-primary ml-auto" />}
                </button>
              ))}
            </div>
          )}
        </div>
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

  const renderDashboard = () => {
    const selectedClass = myClasses.find(c => c.id === selectedClassId);
    return (
      <div className="flex-1 ml-60 flex flex-col min-h-screen bg-slate-50" onClick={() => showLangMenu && setShowLangMenu(false)}>
        {renderTopbar("Dashboard", "")}
        <div className="p-8 flex-1 max-w-4xl w-full">

          {/* ── Hero search ─────────────────────────────────────── */}
          <div className="mb-8">
            <p className="text-[13px] text-slate-400 mb-1">Good morning, Sarah</p>
            <h1 className="font-serif text-[28px] text-foreground font-semibold mb-5 leading-snug">What are you teaching today?</h1>
            <div className="bg-white rounded-xl border border-border shadow-sm flex items-center gap-0 overflow-hidden focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
              <Search className="w-4.5 h-4.5 text-slate-400 ml-4 shrink-0" />
              <input
                type="text"
                value={searchParams.topic}
                onChange={e => setSearchParams(prev => ({...prev, topic: e.target.value}))}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="e.g. Year 9 Climate Change, Year 8 Shakespeare, Year 10 Algebra..."
                className="flex-1 px-3 py-3.5 text-[14px] text-foreground placeholder:text-slate-400 outline-none border-none bg-transparent"
                aria-label="Search topic"
                data-testid="dashboard-search-input"
              />
              <VoiceMic onTranscript={t => setSearchParams(prev => ({...prev, topic: t}))} voiceLang={voiceLang} className="mr-1" />
              <button
                onClick={handleSearch}
                disabled={isSearching || !searchParams.topic.trim()}
                className="m-1.5 bg-primary text-white px-5 py-2.5 rounded-lg text-[13px] font-semibold cursor-pointer border-none hover:bg-teal-700 transition-colors disabled:opacity-50 shrink-0"
                data-testid="dashboard-search-btn"
              >
                {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
              </button>
            </div>
            {selectedClass && (
              <div className="mt-2.5 flex items-center gap-2">
                <span className="bg-teal-50 border border-teal-200 text-teal-700 text-[12px] font-semibold px-3 py-1 rounded-full flex items-center gap-1.5">
                  <Users className="w-3 h-3" /> For {selectedClass.name} · {selectedClass.yearLevel} {selectedClass.subject}
                  <button onClick={() => setSelectedClassId(null)} className="ml-1 text-teal-400 hover:text-teal-700 bg-transparent border-none cursor-pointer p-0"><X className="w-3 h-3" /></button>
                </span>
              </div>
            )}
          </div>

          {/* ── CTA shortcuts ────────────────────────────────────── */}
          <div className="grid grid-cols-3 gap-3 mb-7">
            {[
              { icon: <BookOpen className="w-4 h-4" />, label: "Unit Planner", desc: "Plan a full teaching sequence", screen: 'unit-planner' as Screen, color: "text-purple-600 bg-purple-50" },
              { icon: <Compass className="w-4 h-4" />, label: "New Resource", desc: "Find curriculum-aligned materials", screen: 'search' as Screen, color: "text-primary bg-teal-50" },
              { icon: <CalendarDays className="w-4 h-4" />, label: "Semester Plan", desc: "Map your whole term with AI", screen: 'semester' as Screen, color: "text-amber-600 bg-amber-50" },
            ].map(card => (
              <div key={card.label} onClick={() => setCurrentScreen(card.screen)} className="bg-white rounded-xl border border-border px-4 py-3.5 cursor-pointer hover:border-primary hover:shadow-sm transition-all flex items-center gap-3 group" data-testid={`card-${card.label.replace(/\s+/g, '-').toLowerCase()}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${card.color} group-hover:scale-110 transition-transform`}>{card.icon}</div>
                <div>
                  <div className="text-[13px] font-bold text-foreground">{card.label}</div>
                  <div className="text-[11px] text-slate-400 leading-snug mt-0.5">{card.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* ── My Classes chips ─────────────────────────────────── */}
          <div className="mb-7">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5">My Classes</div>
            <div className="flex items-center gap-2 flex-wrap">
              {myClasses.map(cls => (
                <div key={cls.id} className={`flex items-center gap-1.5 rounded-full text-[12px] font-semibold px-3 py-1.5 cursor-pointer border transition-all group ${selectedClassId === cls.id ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-slate-700 border-border hover:border-primary hover:text-primary'}`} onClick={() => handleSelectClass(cls)} data-testid={`class-chip-${cls.code}`}>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${selectedClassId === cls.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>{cls.code}</span>
                  {cls.name}
                  <button onClick={e => { e.stopPropagation(); handleRemoveClass(cls.id); }} className={`ml-0.5 border-none bg-transparent cursor-pointer p-0 opacity-0 group-hover:opacity-100 transition-opacity ${selectedClassId === cls.id ? 'text-white/70 hover:text-white' : 'text-slate-400 hover:text-slate-700'}`} aria-label={`Remove ${cls.name}`}><X className="w-3 h-3" /></button>
                </div>
              ))}
              {showAddClassForm ? (
                <div className="bg-white border border-primary rounded-xl p-3 flex flex-col gap-2 shadow-sm w-60">
                  <input autoFocus value={newClassName} onChange={e => setNewClassName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddClass()} placeholder="Class name (e.g. 9S History)" className="text-[12px] border border-border rounded-md px-2.5 py-1.5 outline-none focus:border-primary" />
                  <div className="flex gap-1.5">
                    <select value={newClassYearLevel} onChange={e => setNewClassYearLevel(e.target.value)} className="flex-1 text-[11px] border border-border rounded-md px-1.5 py-1 outline-none focus:border-primary bg-white">
                      {['Year 7','Year 8','Year 9','Year 10','Year 11','Year 12'].map(y => <option key={y}>{y}</option>)}
                    </select>
                    <select value={newClassSubject} onChange={e => setNewClassSubject(e.target.value)} className="flex-1 text-[11px] border border-border rounded-md px-1.5 py-1 outline-none focus:border-primary bg-white">
                      {['History','English','Mathematics','Science','Geography','Economics','Business','Legal Studies','Drama','Visual Arts','Music','PDHPE'].map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={handleAddClass} className="flex-1 bg-primary text-white text-[11px] font-semibold py-1.5 rounded-md border-none cursor-pointer hover:bg-teal-700">Add</button>
                    <button onClick={() => { setShowAddClassForm(false); setNewClassName(''); }} className="flex-1 bg-slate-100 text-slate-600 text-[11px] font-semibold py-1.5 rounded-md border-none cursor-pointer hover:bg-slate-200">Cancel</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowAddClassForm(true)} className="flex items-center gap-1 bg-white border border-dashed border-slate-300 hover:border-primary text-slate-400 hover:text-primary rounded-full text-[12px] font-semibold px-3 py-1.5 cursor-pointer transition-colors border-none" data-testid="btn-add-class">
                  <Plus className="w-3.5 h-3.5" /> Add class
                </button>
              )}
            </div>
          </div>

          {/* ── This Week feed ───────────────────────────────────── */}
          <div className="mb-7">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-3.5 h-3.5 text-primary" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">This Week in Your Area</span>
              {feedResult && <span className="text-[11px] text-muted-foreground ml-auto">📍 {feedResult.localContext.suburb} · {feedResult.weather.temp}°C</span>}
              {isFeedLoading && <span className="text-[11px] text-muted-foreground animate-pulse ml-auto">📍 Detecting...</span>}
            </div>
            {isFeedLoading && (
              <div className="grid grid-cols-3 gap-3">{[0,1,2].map(i => <div key={i} className="bg-white rounded-xl border border-border p-4 animate-pulse"><div className="h-3.5 bg-slate-100 rounded w-2/3 mb-2"></div><div className="h-2.5 bg-slate-100 rounded w-full mb-1.5"></div><div className="h-2.5 bg-slate-100 rounded w-4/5"></div></div>)}</div>
            )}
            {!isFeedLoading && feedResult && (
              <div className="grid grid-cols-3 gap-3">
                {feedResult.feedItems.map((item, i) => {
                  const typeColorMap: Record<string, string> = { weather: "bg-sky-50 text-sky-700", local_history: "bg-amber-50 text-amber-700", environment: "bg-green-50 text-green-700", community: "bg-purple-50 text-purple-700" };
                  const isExpanded = expandedFeedIdx.has(i);
                  return (
                    <div key={i} className="bg-white rounded-xl border border-border hover:border-slate-300 transition-all cursor-pointer" onClick={() => toggleFeedItem(i)} data-testid={`feed-card-${i}`}>
                      <div className="p-4">
                        <div className="flex items-start gap-2 mb-2">
                          <span className="text-xl mt-0.5">{item.icon}</span>
                          <div className="flex-1 min-w-0">
                            <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full mb-1.5 inline-block ${typeColorMap[item.type] ?? "bg-slate-50 text-slate-600"}`}>{item.type.replace("_", " ")}</span>
                            <div className="text-[13px] font-bold text-foreground leading-snug">{item.headline}</div>
                          </div>
                          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 mt-1 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </div>
                        <div className="text-[11px] font-semibold text-primary bg-teal-50 px-2 py-0.5 rounded-full w-fit">{item.curriculumLink}</div>
                      </div>
                      {isExpanded && (
                        <div className="px-4 pb-4 border-t border-border pt-3">
                          <div className="text-[12px] text-slate-600 leading-relaxed">{item.teachingAngle}</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            {!isFeedLoading && !feedResult && (
              <div className="grid grid-cols-3 gap-3 opacity-40">{['🌦','🗺','🌿'].map((icon, i) => <div key={i} className="bg-white rounded-xl border border-border p-4 text-center text-slate-400 text-[12px]"><div className="text-xl mb-1.5">{icon}</div>Local teaching opportunities</div>)}</div>
            )}
          </div>

          {/* ── Recent Resources ─────────────────────────────────── */}
          <div className="bg-white rounded-xl border border-border overflow-hidden">
            <div className="px-5 py-3.5 border-b border-border text-[12px] font-bold uppercase tracking-wider text-slate-400">Recent Resources</div>
            <div className="divide-y divide-border">
              {(recentResources || []).map((resource, i) => (
                <div key={resource.id} className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] px-5 py-3 items-center text-[13px] hover:bg-slate-50 transition-colors" data-testid={`recent-resource-${i}`}>
                  <div className="font-medium text-foreground truncate">{resource.title}</div>
                  <div className="text-slate-400">{resource.subject}</div>
                  <div className="text-slate-400">{resource.yearLevel}</div>
                  <div className="text-slate-400">{resource.alignmentScore}% match</div>
                  <span className="bg-green-100 text-green-700 text-[10px] font-semibold px-2 py-0.5 rounded-full">Verified</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

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
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors no-underline ${(resource as Record<string,unknown>).urlType === 'search' ? 'bg-teal-50 text-teal-700 hover:bg-teal-100' : 'bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700'}`}
                      aria-label={`Open ${resource.title} in new tab`}
                      title={(resource as Record<string,unknown>).urlType === 'search' ? 'Opens a Scootle search for this topic' : 'Opens the resource directly'}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      {(resource as Record<string,unknown>).urlType === 'search' ? 'Search on Scootle' : 'Open resource'}
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

  const renderOutputHeader = (output: GeneratedOutput) => (
    <div className="bg-gradient-to-r from-teal-700 to-teal-600 rounded-xl p-6 mb-5 shadow-sm text-white">
      <div className="flex items-center gap-2.5 mb-2">
        <span className="bg-white/20 text-white text-[12px] font-bold px-3 py-1 rounded-full tracking-wide">{output.outcomeCode}</span>
        {output.usedFallback && <span className="bg-amber-400/30 text-amber-100 text-[11px] font-semibold px-2.5 py-1 rounded-full">Estimated</span>}
      </div>
      <p className="text-[14px] text-teal-100 leading-relaxed mb-4">{output.outcomeDescription}</p>
      <div className="border-t border-white/20 pt-4">
        <div className="text-[12px] font-bold text-white/70 uppercase tracking-wider mb-2.5">By the end of this {output.resourceType.toLowerCase()}, students will be able to:</div>
        <ul className="flex flex-col gap-1.5">
          {(output.successCriteria ?? []).map((sc, i) => (
            <li key={i} className="flex items-start gap-2 text-[13px] text-white leading-relaxed">
              <CheckCircle className="w-3.5 h-3.5 text-teal-200 mt-0.5 shrink-0" />
              {sc.replace(/^Students will be able to /i, '')}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

  const renderOutputActions = () => (
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
          {lessonSaved ? <><BookmarkCheck className="w-4 h-4" /> Saved</> : <><Bookmark className="w-4 h-4" /> Save</>}
        </button>
        <button
          onClick={handleGenerateSlides}
          disabled={isGeneratingSlides}
          className="flex items-center gap-1.5 bg-primary text-white border-none px-4 py-2 rounded-lg text-[13px] font-semibold cursor-pointer hover:bg-teal-700 transition-colors shadow-sm disabled:opacity-60"
          aria-label="Generate slide deck"
        >
          {isGeneratingSlides ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</> : <><Presentation className="w-4 h-4" /> Slides →</>}
        </button>
        <button className="bg-primary text-white border-none px-4 py-2 rounded-md text-[13px] font-semibold hover:bg-teal-700 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm" onClick={() => window.print()}>
          <Download className="w-4 h-4" /> PDF
        </button>
      </div>
    </div>
  );

  const renderLessonPlanContent = (plan: LessonPlan) => {
    const getDifficultyColor = (d: string) => d === 'foundation' ? 'bg-green-100 text-green-700' : d === 'core' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700';
    const getDifficultyLabel = (d: string) => d === 'foundation' ? 'Foundation' : d === 'core' ? 'Core' : 'Extension';
    return (
      <>
        <div className="bg-white rounded-xl shadow-sm border border-border p-7 mb-5">
          <div className="flex items-center gap-3 mb-5 pb-5 border-b border-border">
            <span className="bg-slate-100 text-slate-700 text-[13px] font-semibold px-3.5 py-1.5 rounded-full">{plan.duration}</span>
            <span className="bg-slate-100 text-slate-700 text-[13px] font-semibold px-3.5 py-1.5 rounded-full">{searchParams.classContext.length > 0 ? searchParams.classContext.join(', ') : 'Standard Class'}</span>
          </div>
          <div className="text-[15px] text-slate-700 leading-relaxed mb-6">{plan.objective}</div>
          <div className="flex flex-col gap-3.5">
            {plan.activities.map((activity, i) => (
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
          <div className="text-[14px] font-bold text-blue-700 mb-2 flex items-center gap-2"><Compass className="w-4 h-4" /> Local Australian Context: {plan.localExample.title}</div>
          <div className="text-[14px] text-slate-700 leading-relaxed">{plan.localExample.body}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-border p-7 mb-5">
          <div className="font-serif text-[20px] text-foreground mb-4">Differentiated Questions</div>
          <div className="flex flex-col gap-3">
            {plan.questions.map((q, i) => (
              <div key={i} className="p-3.5 border border-border rounded-lg flex items-start gap-3">
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0 mt-0.5 ${getDifficultyColor(q.difficulty)}`}>{getDifficultyLabel(q.difficulty)}</span>
                <div className="text-[14px] text-slate-700 leading-relaxed pt-0.5">{q.q}</div>
              </div>
            ))}
          </div>
        </div>
      </>
    );
  };

  const renderWorksheetContent = (ws: WorksheetOutput) => (
    <>
      {ws.wordBank && ws.wordBank.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-5">
          <div className="text-[13px] font-bold text-amber-700 mb-2.5">Word Bank</div>
          <div className="flex flex-wrap gap-2">
            {ws.wordBank.map((w, i) => <span key={i} className="bg-white border border-amber-200 text-amber-800 text-[12px] font-medium px-2.5 py-1 rounded-lg">{w}</span>)}
          </div>
        </div>
      )}
      {ws.sections.map((section, si) => {
        const totalSectionMarks = section.questions.reduce((s, q) => s + (q.marks ?? 0), 0);
        return (
          <div key={si} className="bg-white rounded-xl shadow-sm border border-border p-7 mb-5">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
              <div className="font-serif text-[18px] text-foreground">{section.title}</div>
              <span className="bg-slate-100 text-slate-600 text-[12px] font-semibold px-3 py-1 rounded-full">{totalSectionMarks} marks</span>
            </div>
            <p className="text-[13px] text-slate-500 italic mb-5">{section.instructions}</p>
            <div className="flex flex-col gap-6">
              {section.questions.map((q, qi) => (
                <div key={qi} className="border-b border-border pb-5 last:border-0 last:pb-0">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="text-[14px] text-slate-800 leading-relaxed font-medium">{qi + 1}. {q.q}</div>
                    <span className="text-[11px] font-bold text-slate-400 shrink-0 mt-0.5">{q.marks} mark{q.marks !== 1 ? 's' : ''}</span>
                  </div>
                  {Array.from({ length: q.lines ?? 3 }).map((_, li) => (
                    <div key={li} className="border-b border-dashed border-slate-200 h-7 mb-0.5"></div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        );
      })}
      {ws.extensionTask && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-5 mb-5">
          <div className="text-[13px] font-bold text-purple-700 mb-2 flex items-center gap-2"><Sparkles className="w-4 h-4" /> Extension Task</div>
          <div className="text-[14px] text-slate-700 leading-relaxed">{ws.extensionTask}</div>
        </div>
      )}
    </>
  );

  const renderDiscussionContent = (disc: DiscussionOutput) => (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-border p-7 mb-5">
        <div className="font-serif text-[20px] text-foreground mb-3">Discussion Question</div>
        <div className="text-[16px] text-slate-800 font-medium leading-relaxed bg-slate-50 border border-border rounded-lg p-4 mb-4">"{disc.discussionPrompt}"</div>
        <div className="text-[14px] text-slate-600 leading-relaxed">{disc.backgroundContext}</div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-border p-7 mb-5">
        <div className="font-serif text-[20px] text-foreground mb-4">Perspectives to Explore</div>
        <div className="flex flex-col gap-4">
          {disc.perspectives.map((p, i) => (
            <div key={i} className="border border-border rounded-lg p-4">
              <div className="text-[14px] font-bold text-foreground mb-2.5">{p.viewpoint}</div>
              <ul className="flex flex-col gap-1.5">
                {p.keyArguments.map((arg, j) => (
                  <li key={j} className="flex items-start gap-2 text-[13px] text-slate-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0"></div>
                    {arg}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-5">
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-5">
          <div className="text-[13px] font-bold text-teal-700 mb-3">Sentence Starters</div>
          <ul className="flex flex-col gap-2">
            {disc.sentenceStarters.map((s, i) => (
              <li key={i} className="text-[13px] text-slate-700 italic border-b border-teal-100 pb-1.5 last:border-0 last:pb-0">{s}</li>
            ))}
          </ul>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
          <div className="text-[13px] font-bold text-blue-700 mb-3">Reflection Questions</div>
          <ul className="flex flex-col gap-2.5">
            {disc.reflectionQuestions.map((q, i) => (
              <li key={i} className="flex items-start gap-2 text-[13px] text-slate-700">
                <span className="text-blue-400 font-bold shrink-0">{i + 1}.</span>{q}
              </li>
            ))}
          </ul>
        </div>
      </div>
      {disc.teacherFacilitationNotes && (
        <div className="bg-slate-800 rounded-xl p-5 mb-5 text-white">
          <div className="text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-2">Teacher Facilitation Notes</div>
          <div className="text-[14px] text-slate-200 leading-relaxed">{disc.teacherFacilitationNotes}</div>
        </div>
      )}
    </>
  );

  const renderAssessmentContent = (assess: AssessmentOutput) => (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-border p-7 mb-5">
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border">
          <span className="bg-slate-100 text-slate-700 text-[13px] font-semibold px-3.5 py-1.5 rounded-full">{assess.taskType}</span>
          <span className="bg-slate-100 text-slate-700 text-[13px] font-semibold px-3.5 py-1.5 rounded-full">{assess.duration}</span>
          <span className="bg-teal-50 text-teal-700 text-[13px] font-semibold px-3.5 py-1.5 rounded-full">{assess.totalMarks} marks total</span>
        </div>
        <div className="font-serif text-[16px] text-foreground mb-2">Task Instructions</div>
        <div className="text-[14px] text-slate-700 leading-relaxed">{assess.taskDescription}</div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-border p-7 mb-5">
        <div className="font-serif text-[20px] text-foreground mb-4">Marking Criteria</div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2.5 pr-4 text-slate-500 font-semibold w-36">Criterion</th>
                <th className="text-left py-2.5 pr-4 text-green-700 font-semibold">Excellent (A)</th>
                <th className="text-left py-2.5 pr-4 text-blue-700 font-semibold">Satisfactory (C)</th>
                <th className="text-left py-2.5 pr-4 text-orange-700 font-semibold">Developing (D/E)</th>
                <th className="text-right py-2.5 text-slate-500 font-semibold">Marks</th>
              </tr>
            </thead>
            <tbody>
              {assess.markingCriteria.map((c, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  <td className="py-3 pr-4 font-semibold text-foreground align-top">{c.criterion}</td>
                  <td className="py-3 pr-4 text-slate-600 leading-relaxed align-top">{c.excellent}</td>
                  <td className="py-3 pr-4 text-slate-600 leading-relaxed align-top">{c.satisfactory}</td>
                  <td className="py-3 pr-4 text-slate-600 leading-relaxed align-top">{c.developing}</td>
                  <td className="py-3 text-right font-bold text-foreground align-top">{c.marks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {assess.teacherMarkingGuide && (
        <div className="bg-slate-800 rounded-xl p-5 mb-5 text-white">
          <div className="text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-2">Marking Guide</div>
          <div className="text-[14px] text-slate-200 leading-relaxed">{assess.teacherMarkingGuide}</div>
        </div>
      )}
    </>
  );

  const renderLessonPlan = () => {
    if (isGeneratingLesson) {
      const typeLabel = searchParams.resourceType;
      return (
        <div className="flex-1 ml-60 flex flex-col min-h-screen bg-slate-50">
          {renderTopbar(`Generating ${typeLabel}`, "AI is writing your content...")}
          <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] gap-5">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-primary rounded-full animate-spin"></div>
            <div className="text-[15px] text-muted-foreground">Designing your {typeLabel.toLowerCase()}...</div>
            <div className="flex flex-col gap-2 mt-2">
              <div className="flex items-center gap-2.5 text-[13px] text-primary"><CheckCircle className="w-4 h-4" /> Matching curriculum outcomes</div>
              <div className="flex items-center gap-2.5 text-[13px] text-primary"><CheckCircle className="w-4 h-4" /> Sourcing local Australian examples</div>
              <div className="flex items-center gap-2.5 text-[13px] text-slate-500"><FileText className="w-4 h-4" /> Writing {typeLabel.toLowerCase()} content...</div>
            </div>
          </div>
        </div>
      );
    }

    if (!lessonPlan) return null;
    const resource = selectedResource;
    const topbarLabel = lessonPlan.resourceType === 'Lesson Plan' ? 'Lesson Plan Editor' : lessonPlan.resourceType === 'Worksheet' ? 'Worksheet' : lessonPlan.resourceType === 'Discussion' ? 'Discussion Guide' : 'Assessment Task';

    return (
      <div className="flex-1 ml-60 flex flex-col min-h-screen bg-slate-50">
        {renderTopbar(topbarLabel, `${searchParams.yearLevel} ${searchParams.subject} · ${resource?.source ?? ''}`)}
        <div className="p-8 flex-1">
          <div className="max-w-3xl mx-auto">
            {renderOutputActions()}
            {renderOutputHeader(lessonPlan)}

            {lessonPlan.resourceType === 'Lesson Plan' && renderLessonPlanContent(lessonPlan)}
            {lessonPlan.resourceType === 'Worksheet' && renderWorksheetContent(lessonPlan)}
            {lessonPlan.resourceType === 'Discussion' && renderDiscussionContent(lessonPlan)}
            {lessonPlan.resourceType === 'Assessment' && renderAssessmentContent(lessonPlan)}

            <div className="bg-white rounded-xl shadow-sm border border-border p-7 mb-8">
              <div className="font-serif text-[20px] text-foreground mb-3">Teacher Notes</div>
              <textarea className="w-full min-h-[100px] border border-border rounded-lg p-3.5 text-[14px] text-slate-700 resize-y outline-none focus:border-primary transition-colors leading-relaxed" value={teacherNotes} onChange={(e) => setTeacherNotes(e.target.value)} data-testid="textarea-teacher-notes" aria-label="Teacher notes" />
            </div>

            {lessonPlan.resourceType === 'Lesson Plan' && (
              <div className="flex justify-center">
                <button onClick={handleGenerateSlides} disabled={isGeneratingSlides} className="flex items-center gap-2.5 bg-gradient-to-r from-teal-600 to-teal-700 text-white border-none px-8 py-3.5 rounded-xl text-[15px] font-bold cursor-pointer hover:from-teal-700 hover:to-teal-800 transition-all shadow-md disabled:opacity-60" aria-label="Generate full slide deck">
                  {isGeneratingSlides ? <><Loader2 className="w-5 h-5 animate-spin" /> Generating Slide Deck...</> : <><Presentation className="w-5 h-5" /> Generate Slide Deck for this Lesson</>}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderMyClasses = () => (
    <div className="flex-1 ml-60 flex flex-col min-h-screen bg-slate-50">
      {renderTopbar("My Classes", "")}
      <div className="p-8 max-w-3xl w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-serif text-[24px] text-foreground font-semibold">My Classes</h2>
            <p className="text-[13px] text-slate-500 mt-0.5">Add and manage your classes. Select a class to pre-fill search filters.</p>
          </div>
          <button
            onClick={() => setShowAddClassForm(true)}
            className="flex items-center gap-2 bg-primary text-white border-none px-4 py-2.5 rounded-xl text-[13px] font-semibold cursor-pointer hover:bg-teal-700 transition-colors shadow-sm"
            data-testid="btn-add-class-page"
          >
            <Plus className="w-4 h-4" /> Add class
          </button>
        </div>

        {showAddClassForm && (
          <div className="bg-white border border-primary rounded-2xl p-5 mb-5 shadow-sm">
            <div className="text-[13px] font-bold text-foreground mb-3">New Class</div>
            <div className="flex flex-col gap-3">
              <input
                autoFocus
                value={newClassName}
                onChange={e => setNewClassName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddClass()}
                placeholder="Class name (e.g. 9S History, 10A Science)"
                className="text-[13px] border border-border rounded-xl px-3 py-2.5 outline-none focus:border-primary w-full"
              />
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-1 block">Year Level</label>
                  <select value={newClassYearLevel} onChange={e => setNewClassYearLevel(e.target.value)} className="w-full text-[13px] border border-border rounded-xl px-3 py-2 outline-none focus:border-primary bg-white">
                    {['Year 7','Year 8','Year 9','Year 10','Year 11','Year 12'].map(y => <option key={y}>{y}</option>)}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-1 block">Subject</label>
                  <select value={newClassSubject} onChange={e => setNewClassSubject(e.target.value)} className="w-full text-[13px] border border-border rounded-xl px-3 py-2 outline-none focus:border-primary bg-white">
                    {['History','English','Mathematics','Science','Geography','Economics','Business','Legal Studies','Drama','Visual Arts','Music','PDHPE'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={handleAddClass} className="bg-primary text-white text-[13px] font-semibold px-5 py-2 rounded-xl border-none cursor-pointer hover:bg-teal-700">Save class</button>
                <button onClick={() => { setShowAddClassForm(false); setNewClassName(''); }} className="bg-slate-100 text-slate-600 text-[13px] font-semibold px-5 py-2 rounded-xl border-none cursor-pointer hover:bg-slate-200">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {myClasses.length === 0 && !showAddClassForm && (
          <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <div className="text-[15px] font-semibold text-slate-500 mb-1">No classes yet</div>
            <div className="text-[13px] text-slate-400 mb-4">Add your classes to quickly pre-fill year level and subject when searching for resources.</div>
            <button onClick={() => setShowAddClassForm(true)} className="bg-primary text-white border-none px-5 py-2.5 rounded-xl text-[13px] font-semibold cursor-pointer hover:bg-teal-700">
              Add your first class
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3">
          {myClasses.map(cls => (
            <div key={cls.id} className={`bg-white rounded-2xl border p-5 flex items-center gap-5 transition-all ${selectedClassId === cls.id ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-slate-300'}`}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-[15px] font-bold shrink-0 ${selectedClassId === cls.id ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
                {cls.code}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[15px] font-bold text-foreground">{cls.name}</div>
                <div className="text-[12px] text-slate-500 mt-0.5">{cls.yearLevel} · {cls.subject} · {cls.state}</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => { handleSelectClass(cls); setCurrentScreen('dashboard'); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold border-none cursor-pointer transition-colors ${selectedClassId === cls.id ? 'bg-teal-600 text-white hover:bg-teal-700' : 'bg-teal-50 text-teal-700 hover:bg-teal-100'}`}
                  aria-label={`Search resources for ${cls.name}`}
                >
                  <Compass className="w-3.5 h-3.5" />
                  {selectedClassId === cls.id ? 'Selected' : 'Use for search'}
                </button>
                <button
                  onClick={() => handleRemoveClass(cls.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold bg-red-50 text-red-600 hover:bg-red-100 border-none cursor-pointer transition-colors"
                  aria-label={`Remove ${cls.name}`}
                >
                  <X className="w-3.5 h-3.5" /> Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      {renderSidebar()}
      {currentScreen === 'dashboard' && renderDashboard()}
      {currentScreen === 'classes' && renderMyClasses()}
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
            setLessonPlan({ resourceType: 'Lesson Plan', outcomeCode: '', outcomeDescription: l.topic, successCriteria: [], objective: l.objective, duration: l.duration, activities: l.activities, localExample: l.localExample, questions: l.questions, usedFallback: false });
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
