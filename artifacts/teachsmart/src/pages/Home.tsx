import React, { useState, useEffect, useCallback, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import LZString from "lz-string";
import {
  BookOpen, Compass, Search, FileText, Download, Edit, ArrowLeft,
  CheckCircle, Home as HomeIcon, FileStack, BarChart3, MapPin,
  CalendarDays, Settings2, Globe, ChevronDown, ChevronUp,
  Presentation, Library as LibraryIcon, Bookmark, BookmarkCheck, Loader2, Sparkles, ExternalLink,
  AlertTriangle, ShieldAlert, Info,
  Plus, X, Users
} from "lucide-react";
import { useGetDashboardStats, useGetRecentResources, useGetFeed } from "@workspace/api-client-react";
import VoiceMic from "../components/VoiceMic";
import Slideshow, { type SlidedeckData } from "../components/Slideshow";
import UnitPlanner, { type UnitContext } from "../components/UnitPlanner";
import Library from "../components/Library";
import SemesterPlanner from "../components/SemesterPlanner";
import SettingsPanel from "../components/Settings";
import { LANGUAGES, type LangCode, useTranslation } from "../lib/translations";
import { saveResource, saveLesson, getSavedResources, type SavedResource, type SavedLesson } from "../lib/library";
import TrustScorecard from "../components/TrustScorecard";

type AlignmentResult = {
  alignmentScore: number; syllabus: string; strand: string;
  outcomes: { id: string; description: string }[];
  notes: string; usedFallback: boolean;
};

type Resource = {
  id: string; title: string; url?: string; urlType?: 'direct' | 'search'; source: string; type: string; description: string;
  alignmentScore: number; safetyRating: string; biasFlag: string;
  localContextTags: string[]; outcomeIds: string[]; whyThisResource: string;
  provenance?: 'curated' | 'verified-web' | 'ai-suggestion';
  verifiedLink?: boolean;
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
  materials?: string[];
  teacherPrep?: string[];
  activities: { label: string; text: string; teacherTip?: string; assessmentIndicator?: string }[];
  localExample: { title: string; body: string };
  differentiationTips?: { level: string; suggestion: string }[];
  crossCurriculumLinks?: string[];
  questions: { q: string; difficulty: string }[];
  reflectionPrompt?: string;
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
  taskType: string; duration: string;
  studentSections: { section: string; instructions: string; questions: { number: number; q: string; marks: number; lines: number }[] }[];
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

type ReviewBanner = {
  key: string;
  title: string;
  body: string;
  tone: "amber" | "red" | "blue";
  icon: "risk" | "cultural" | "info";
};

type SharePayload = {
  rType: GeneratedOutput['resourceType'];
  oc: string;
  od: string;
  sc: string[];
  of?: boolean;
  o?: string;
  d?: string;
  a?: { label: string; text: string }[];
  lx?: { title: string; body: string };
  q?: { q: string; difficulty: string }[];
  sec?: { title: string; instructions: string; questions: { q: string; lines: number; marks: number }[] }[];
  et?: string;
  wb?: string[];
  dp?: string;
  bc?: string;
  p?: { viewpoint: string; keyArguments: string[] }[];
  ss?: string[];
  rq?: string[];
  tn?: string;
  tt?: string;
  tm?: number;
  st?: { section: string; instructions: string; questions: { number: number; q: string; marks: number; lines: number }[] }[];
  mc?: { criterion: string; excellent: string; satisfactory: string; developing: string; marks: number }[];
  tg?: string;
};

const MOCK_DASHBOARD_STATS = { totalSearches: 124, resourcesGenerated: 89, averageAlignmentScore: 92, topSubject: "History" };
const MOCK_RECENT = [
  { id: "1", title: "Climate Change Impacts", subject: "Science", yearLevel: "Year 9", topic: "Climate Change", alignmentScore: 94, searchedAt: new Date().toISOString() },
  { id: "2", title: "Algebraic Expressions", subject: "Mathematics", yearLevel: "Year 8", topic: "Algebra", alignmentScore: 88, searchedAt: new Date(Date.now() - 86400000).toISOString() },
  { id: "3", title: "Poetry Analysis", subject: "English", yearLevel: "Year 10", topic: "Poetry", alignmentScore: 91, searchedAt: new Date(Date.now() - 172800000).toISOString() },
];

type Screen = 'dashboard' | 'unit-planner' | 'classes' | 'search' | 'results' | 'lesson' | 'slideshow' | 'library' | 'semester' | 'settings';

const EMPTY_UNIT: UnitContext = { unitTitle: '', textbook: '', totalLessons: '', currentLesson: '', prevSummary: '', learningIntention: '', successCriteria: '', assessmentType: 'exam' };
const FIRST_NATIONS_PATTERN = /\b(first nations|aboriginal|torres strait|indigenous|country|custodian|darug|burramattagal|palawa|yolngu|noongar|kaurna|wiradjuri)\b/i;

const base64UrlEncode = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');

const base64UrlDecode = (value: string) => {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
};

const encodeSharePayload = (payload: SharePayload) => base64UrlEncode(LZString.compressToUint8Array(JSON.stringify(payload)));

const decodeSharePayload = (encoded: string) => {
  const json = LZString.decompressFromUint8Array(base64UrlDecode(encoded));
  return json ? JSON.parse(json) as SharePayload : null;
};

const toGeneratedOutput = (payload: SharePayload): GeneratedOutput => {
  const base = {
    resourceType: payload.rType,
    outcomeCode: payload.oc,
    outcomeDescription: payload.od,
    successCriteria: payload.sc,
    usedFallback: payload.of ?? false,
  };

  if (payload.rType === 'Lesson Plan') {
    return {
      ...base,
      resourceType: 'Lesson Plan',
      objective: payload.o ?? '',
      duration: payload.d ?? '60 minutes',
      activities: payload.a ?? [],
      localExample: payload.lx ?? { title: '', body: '' },
      questions: payload.q ?? [],
    };
  }

  if (payload.rType === 'Worksheet') {
    return {
      ...base,
      resourceType: 'Worksheet',
      sections: payload.sec ?? [],
      extensionTask: payload.et ?? '',
      wordBank: payload.wb ?? [],
    };
  }

  if (payload.rType === 'Discussion') {
    return {
      ...base,
      resourceType: 'Discussion',
      discussionPrompt: payload.dp ?? '',
      backgroundContext: payload.bc ?? '',
      perspectives: payload.p ?? [],
      sentenceStarters: payload.ss ?? [],
      reflectionQuestions: payload.rq ?? [],
      teacherFacilitationNotes: payload.tn ?? '',
    };
  }

  return {
    ...base,
    resourceType: 'Assessment',
    taskType: payload.tt ?? '',
    duration: payload.d ?? '60 minutes',
    studentSections: payload.st ?? [],
    markingCriteria: payload.mc ?? [],
    totalMarks: payload.tm ?? 0,
    teacherMarkingGuide: payload.tg ?? '',
  };
};

const getApiBases = () => {
  const explicitBase = import.meta.env.VITE_API_URL;
  if (explicitBase) return [explicitBase];

  const bases = [''];
  if (typeof window !== 'undefined') {
    const { hostname, port, protocol } = window.location;
    if ((hostname === 'localhost' || hostname === '127.0.0.1') && port !== '8080') {
      bases.push(`${protocol}//${hostname}:8080`);
    }
  }
  return Array.from(new Set(bases));
};

const fetchJsonFromApi = async (path: string, init?: RequestInit) => {
  let lastError: unknown;
  for (const base of getApiBases()) {
    try {
      const response = await fetch(`${base}/api${path}`, init);
      if (!response.ok) {
        throw new Error(`API error ${response.status}`);
      }
      return response.json();
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error('API request failed');
};

const hasFirstNationsContent = (...parts: Array<string | string[] | undefined>) =>
  parts.some((part) => {
    const text = Array.isArray(part) ? part.join(" ") : part;
    return typeof text === "string" && FIRST_NATIONS_PATTERN.test(text);
  });

const getBannerStyles = (tone: ReviewBanner["tone"]) =>
  tone === "red"
    ? "border-red-200 bg-red-50 text-red-900"
    : tone === "amber"
      ? "border-amber-200 bg-amber-50 text-amber-900"
      : "border-blue-200 bg-blue-50 text-blue-900";

const getBannerIcon = (icon: ReviewBanner["icon"]) =>
  icon === "cultural" ? ShieldAlert : icon === "risk" ? AlertTriangle : Info;

export default function Home() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('dashboard');
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showQR, setShowQR] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [isCreatingShareLink, setIsCreatingShareLink] = useState(false);
  const [shareLinkError, setShareLinkError] = useState<string | null>(null);
  const [showFallbackShare, setShowFallbackShare] = useState(false);

  useEffect(() => {
    const onOnline = () => setIsOffline(false);
    const onOffline = () => setIsOffline(true);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => { window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline); };
  }, []);

  // Browser back/forward support via hash (avoids conflict with wouter's pushState wrapper)
  const navigate = useCallback((screen: Screen) => {
    window.location.hash = screen;
    setCurrentScreen(screen);
  }, []);

  useEffect(() => {
    // Handle QR share links: short server-backed /s/:id or #s/<id>, compact #s=..., and legacy #share?data=...
    const hash = window.location.hash;
    const pathMatch = window.location.pathname.match(/\/s\/([A-Z0-9]+)$/i);
    const sharePathId = pathMatch?.[1] ?? null;
    const shareId = hash.startsWith('#s/') ? hash.slice(3) : null;
    const compactData = hash.startsWith('#s=') ? hash.slice(3) : null;
    const legacyData = hash.startsWith('#share?')
      ? new URLSearchParams(hash.slice('#share?'.length)).get('data')
      : null;
    const sharedData = compactData ?? legacyData;
    const resolvedShareId = sharePathId ?? shareId;
    if (resolvedShareId) {
      fetchJsonFromApi(`/share/${encodeURIComponent(resolvedShareId)}`)
        .then((response) => response as { payload?: SharePayload })
        .then((result) => {
          if (!result.payload) throw new Error('Missing share payload');
          setLessonPlan(toGeneratedOutput(result.payload));
          setCurrentScreen('lesson');
          window.history.replaceState(null, '', '/#lesson');
        })
        .catch(() => {
          window.history.replaceState(null, '', '/#dashboard');
          setCurrentScreen('dashboard');
        });
      return;
    }
    if (sharedData) {
      if (compactData) {
        try {
          const payload = decodeSharePayload(sharedData);
          if (!payload) throw new Error('Invalid compact share payload');
          const plan = toGeneratedOutput(payload);
          setLessonPlan(plan);
          setCurrentScreen('lesson');
          window.history.replaceState(null, '', '#lesson');
          return;
        } catch { /* invalid share link — fall through to dashboard */ }
      } else {
        try {
          const payload = JSON.parse(LZString.decompressFromEncodedURIComponent(sharedData) ?? '{}');
          const plan: GeneratedOutput = {
            resourceType: payload.rType,
            outcomeCode: payload.outcomeCode,
            outcomeDescription: payload.outcomeDescription,
            successCriteria: payload.successCriteria,
            usedFallback: false,
            ...payload,
          } as GeneratedOutput;
          setLessonPlan(plan);
          setCurrentScreen('lesson');
          window.history.replaceState(null, '', '#lesson');
          return;
        } catch { /* invalid share link — fall through to dashboard */ }
      }
    }
    window.history.replaceState(null, '', '#dashboard');
    const onHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#share?')) return; // handled above on load
      const screen = (hash.slice(1) || 'dashboard') as Screen;
      setCurrentScreen(screen as Screen);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);
  const [searchParams, setSearchParams] = useState({ yearLevel: 'Year 9', state: 'NSW', subject: 'History', topic: 'Rights and Freedoms', resourceType: 'Lesson Plan', classContext: [] as string[], postcode: '2150' });
  const [isSearching, setIsSearching] = useState(false);
  const [isGeneratingLesson, setIsGeneratingLesson] = useState(false);
  const [isGeneratingSlides, setIsGeneratingSlides] = useState(false);
  const [alignmentResult, setAlignmentResult] = useState<AlignmentResult | null>(null);
  const [searchStep, setSearchStep] = useState<string | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<Resource[]>([]);
  const [showAiSuggestions, setShowAiSuggestions] = useState(false);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [lessonPlan, setLessonPlan] = useState<GeneratedOutput | null>(null);
  const [teacherNotes, setTeacherNotes] = useState('');
  const [feedResult, setFeedResult] = useState<FeedResult | null>(null);
  const [isFeedLoading, setIsFeedLoading] = useState(false);
  const [unitContext, setUnitContext] = useState<UnitContext>(EMPTY_UNIT);
  const [uiLanguage, setUiLanguage] = useState<LangCode>(() => {
    const saved = localStorage.getItem('teachsmart_language') as LangCode | null;
    return saved && LANGUAGES.some(l => l.code === saved) ? saved : 'en';
  });
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
  const t = useTranslation(uiLanguage);

  const getResourceReviewBanners = useCallback((resource: Resource): ReviewBanner[] => {
    const banners: ReviewBanner[] = [];
    const scorecard = resource.trustScorecard;
    const culturalFlag = scorecard?.tierC.find(flag => flag.type === 'cultural' && flag.severity !== 'low');
    const hasSensitiveContent = hasFirstNationsContent(
      searchParams.topic,
      resource.title,
      resource.description,
      resource.whyThisResource,
      resource.localContextTags,
    );

    if (culturalFlag || hasSensitiveContent) {
      banners.push({
        key: 'cultural-review',
        title: 'Cultural review recommended',
        body: culturalFlag?.note ?? 'This resource may include First Nations content or local cultural context. Teachers should verify community appropriateness, terminology, and whether local voices or Elders should be consulted before classroom use.',
        tone: culturalFlag?.severity === 'high' ? 'red' : 'amber',
        icon: 'cultural',
      });
    }

    if (resource.alignmentScore < 70 || scorecard?.tierB.alignmentStrength === 'weak' || scorecard?.tierB.alignmentStrength === 'none') {
      banners.push({
        key: 'alignment-review',
        title: 'Low-confidence curriculum match',
        body: 'This resource may only partially match the selected curriculum outcomes. Check outcome codes, year-level suitability, and assessment fit before adapting it for class.',
        tone: resource.alignmentScore < 55 ? 'red' : 'amber',
        icon: 'risk',
      });
    }

    if (scorecard?.tierA.domainTier === 4) {
      banners.push({
        key: 'source-review',
        title: 'Independent source verification needed',
        body: 'This source is not yet in the trusted registry. Confirm authorship, publication date, and classroom suitability before sharing it with students.',
        tone: 'amber',
        icon: 'risk',
      });
    }

    return banners;
  }, [searchParams.topic]);

  const getOutputReviewBanners = useCallback((output: GeneratedOutput): ReviewBanner[] => {
    const banners: ReviewBanner[] = [];
    const selectedBanners = selectedResource ? getResourceReviewBanners(selectedResource) : [];

    if (output.usedFallback) {
      banners.push({
        key: 'fallback-output',
        title: 'Estimated AI draft',
        body: 'This output was created using fallback content because live AI or curriculum services were unavailable. Review facts, outcome alignment, and examples carefully before using it in class.',
        tone: 'amber',
        icon: 'risk',
      });
    }

    if (alignmentResult?.usedFallback || (alignmentResult?.alignmentScore ?? 100) < 70) {
      banners.push({
        key: 'alignment-check',
        title: 'Double-check curriculum alignment',
        body: alignmentResult?.usedFallback
          ? 'Curriculum alignment was estimated rather than fully verified. Check outcome codes and syllabus language before export or sharing.'
          : 'The selected topic has a weaker curriculum match than usual. Confirm year-level fit and success criteria before classroom use.',
        tone: alignmentResult?.usedFallback ? 'red' : 'amber',
        icon: 'risk',
      });
    }

    if (
      hasFirstNationsContent(
        searchParams.topic,
        output.outcomeDescription,
        output.successCriteria,
        selectedResource?.title,
        selectedResource?.description,
      ) || selectedBanners.some(b => b.key === 'cultural-review')
    ) {
      banners.push({
        key: 'cultural-safety',
        title: 'Local cultural safety check',
        body: 'This output touches First Nations histories, cultures, or Country. Review local terminology, representation, and whether community-approved sources or local consultation are needed.',
        tone: 'amber',
        icon: 'cultural',
      });
    }

    return banners;
  }, [alignmentResult, getResourceReviewBanners, searchParams.topic, selectedResource]);

  const renderReviewBanner = (banner: ReviewBanner) => {
    const Icon = getBannerIcon(banner.icon);
    return (
      <div key={banner.key} className={`rounded-xl border px-4 py-3 ${getBannerStyles(banner.tone)}`}>
        <div className="flex items-start gap-3">
          <Icon className="w-4 h-4 mt-0.5 shrink-0" />
          <div>
            <div className="text-[13px] font-bold">{banner.title}</div>
            <div className="text-[13px] leading-relaxed opacity-90 mt-0.5">{banner.body}</div>
          </div>
        </div>
      </div>
    );
  };

  const renderResourceProvenance = (resource: Resource) => {
    if (resource.provenance === 'curated') {
      return <span className="bg-emerald-100 text-emerald-700 text-[11px] font-semibold px-2 py-0.5 rounded-full">Curated verified link</span>;
    }
    if (resource.provenance === 'verified-web') {
      return <span className="bg-sky-100 text-sky-700 text-[11px] font-semibold px-2 py-0.5 rounded-full">Verified web result</span>;
    }
    return <span className="bg-amber-100 text-amber-700 text-[11px] font-semibold px-2 py-0.5 rounded-full">AI suggestion only</span>;
  };

  useEffect(() => {
    localStorage.setItem('teachsmart_language', uiLanguage);
  }, [uiLanguage]);

  const handleShareToClassroom = (url?: string, title?: string) => {
    const shareUrl = url ?? window.location.href;
    const shareTitle = title ?? 'TeachSmart Resource';
    const classroomUrl = `https://classroom.google.com/share?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareTitle)}`;
    window.open(classroomUrl, '_blank', 'noopener,noreferrer');
  };

  const { data: dashboardStats = MOCK_DASHBOARD_STATS } = useGetDashboardStats();
  const { data: recentResourcesRaw } = useGetRecentResources();
  const recentResources = Array.isArray(recentResourcesRaw) ? recentResourcesRaw : MOCK_RECENT;
  const feedMutation = useGetFeed();

  const apiFetch = useCallback(async (path: string, body: Record<string, unknown>) => {
    return fetchJsonFromApi(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(12000),
    });
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
    setShowAiSuggestions(false);
    setAiSuggestions([]);
    navigate('search');

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
        studentInterests, resourceType: searchParams.resourceType,
      });

      setSearchStep('merging');
      await new Promise(r => setTimeout(r, 300)); // brief pause to show "Merging results"
      const result = resourcesResult as { resources: Resource[]; aiSuggestions?: Resource[] };
      setResources(result.resources ?? []);
      setAiSuggestions(result.aiSuggestions ?? []);
      setShowAiSuggestions(false);
    } catch {
      setAlignmentResult({
        alignmentScore: 88, syllabus: `${searchParams.state} ${searchParams.subject} ${searchParams.yearLevel}`,
        strand: "Core Strand",
        outcomes: [{ id: "AC9-FALLBACK", description: `Core ${searchParams.subject} outcome for ${searchParams.yearLevel} students studying ${searchParams.topic}.` }],
        notes: "Fallback alignment data.", usedFallback: true,
      });
      setResources([]);
      setAiSuggestions([]);
      setShowAiSuggestions(false);
    } finally {
      setIsSearching(false);
      setSearchStep(null);
      navigate('results');
    }
  };

  const handleAdaptResource = async (resource: Resource) => {
    if (!alignmentResult) return;
    setSelectedResource(resource);
    setIsGeneratingLesson(true);
    navigate('lesson');
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
      try {
        const outcomes = alignmentResult?.outcomes ?? [];
        const o = outcomes[0] ?? { id: "AC9-UNKNOWN", description: `Core ${searchParams.subject} outcome` };
        const t = searchParams.topic || 'this topic';
        const rType = searchParams.resourceType;
        const rTitle = resource.title;
        const rSource = resource.source;
        const rDesc = resource.description;
        const common = {
          outcomeCode: o.id,
          outcomeDescription: o.description,
          successCriteria: [
            `Identify and explain key concepts from "${rTitle}" by ${rSource}`,
            `Apply knowledge from the resource to an Australian context`,
            `Evaluate evidence from the resource and form a reasoned conclusion`,
          ],
          usedFallback: true as const,
        };
        if (rType === 'Worksheet') {
          setLessonPlan({
            ...common,
            resourceType: 'Worksheet' as const,
            sections: [
              { title: 'Knowledge and Understanding', instructions: `Using "${rTitle}" from ${rSource}, answer each question in full sentences.`, questions: [
                { q: `What is the main topic or argument presented in "${rTitle}" by ${rSource}?`, lines: 3, marks: 2 },
                { q: `List two key facts or pieces of evidence from the resource about ${t}.`, lines: 4, marks: 4 },
              ]},
              { title: 'Application', instructions: `Use your reading of "${rTitle}" to answer the following.`, questions: [
                { q: `How does the information in "${rTitle}" connect to ${t} for Australian students today?`, lines: 5, marks: 5 },
                { q: `Give one real-world Australian example that supports or extends what you read in the resource.`, lines: 4, marks: 3 },
              ]},
              { title: 'Analysis and Evaluation', instructions: `Think critically about "${rTitle}" and justify your answers with evidence from the resource.`, questions: [
                { q: `Analyse the perspective presented in "${rTitle}" by ${rSource}. Does the resource present a balanced view of ${t}? Explain with at least two references to the resource.`, lines: 8, marks: 8 },
              ]},
            ],
            extensionTask: `Find a second source on ${t} and write a 150-word comparison explaining how it agrees or disagrees with "${rTitle}" by ${rSource}.`,
            wordBank: [t, searchParams.subject, rSource, 'evidence', 'analysis', 'perspective'],
          });
        } else if (rType === 'Discussion') {
          setLessonPlan({
            ...common,
            resourceType: 'Discussion' as const,
            discussionPrompt: `Based on "${rTitle}" from ${rSource}: To what extent does this resource capture the full picture of ${t} in Australia?`,
            backgroundContext: `${rDesc} This resource from ${rSource} provides one perspective on ${t} that students should critically examine.`,
            perspectives: [
              { viewpoint: `The ${rSource} perspective`, keyArguments: [`The resource presents ${t} as described in "${rTitle}"`, `${rSource} is a trusted Australian source`, 'The evidence presented supports this view'] },
              { viewpoint: 'Alternative perspective', keyArguments: [`Other sources may present ${t} differently`, 'Not all stakeholders are represented in a single resource', 'Additional voices should be considered'] },
            ],
            sentenceStarters: ['According to the resource...', 'The evidence in the resource suggests...', 'A different perspective might be...', 'From an Australian perspective...', 'I agree/disagree with the resource because...', 'What the resource doesn\'t address is...'],
            reflectionQuestions: [`What was the most compelling point in "${rTitle}"?`, 'Whose voice is most important in this debate and was it represented?', 'What would you want to investigate further?'],
            teacherFacilitationNotes: `Ground the discussion in the specific content of "${rTitle}" from ${rSource}. Ensure students reference the resource rather than making unsupported claims.`,
          });
        } else if (rType === 'Assessment') {
          const isStem = /math|science|physics|chemistry|biology/i.test(searchParams.subject);
          if (isStem) {
            setLessonPlan({
              ...common,
              successCriteria: [
                `Demonstrate understanding of key ${t} concepts from "${rTitle}"`,
                `Apply ${t} methods and procedures to solve problems`,
                `Communicate reasoning clearly with correct notation`,
              ],
              resourceType: 'Assessment' as const,
              taskType: 'Problem-Solving Task',
              duration: '60 minutes',
              totalMarks: 25,
              studentSections: [
                { section: 'Section A: Skills and Procedures', instructions: `Apply the concepts from "${rTitle}" (${rSource}). Show all working.`, questions: [
                  { number: 1, q: `Define the key ${t} terms or concepts covered in "${rTitle}". Give an example for each.`, marks: 3, lines: 5 },
                  { number: 2, q: `Using the method from "${rTitle}", solve a similar problem. Show each step of your working.`, marks: 4, lines: 6 },
                ]},
                { section: 'Section B: Application', instructions: `Apply your understanding of ${t}. Show full working and reasoning.`, questions: [
                  { number: 3, q: `A real-world scenario involves ${t}. Using the approach from "${rTitle}" by ${rSource}, set up the problem, show your method, and solve it.`, marks: 5, lines: 8 },
                  { number: 4, q: `Explain how the ${t} concepts from "${rTitle}" connect to a real-world Australian context. Provide a worked example.`, marks: 5, lines: 8 },
                ]},
                { section: 'Section C: Analysis and Reasoning', instructions: 'Show extended reasoning and justify your approach.', questions: [
                  { number: 5, q: `Compare two different approaches to solving a ${t} problem. When would the method from "${rTitle}" be most efficient? Justify with worked examples.`, marks: 8, lines: 14 },
                ]},
              ],
              markingCriteria: [
                { criterion: 'Knowledge of Concepts', excellent: `Thorough understanding of ${t} concepts with correct definitions and examples`, satisfactory: 'Adequate understanding with mostly correct terminology', developing: 'Limited understanding; key concepts incorrect or missing', marks: 7 },
                { criterion: 'Problem-Solving', excellent: 'Correct method, logical steps, accurate calculations throughout', satisfactory: 'Appropriate method but some errors in working', developing: 'Incorrect method or significant errors; incomplete working', marks: 8 },
                { criterion: 'Application and Reasoning', excellent: 'Clear application to real-world contexts with justified reasoning', satisfactory: 'Some application but reasoning could be more detailed', developing: 'Limited application; reasoning unclear', marks: 7 },
                { criterion: 'Communication and Notation', excellent: 'Clear notation, well-structured responses', satisfactory: 'Generally clear with some notation errors', developing: 'Poor notation; difficult to follow working', marks: 3 },
              ],
              teacherMarkingGuide: `Award method marks even if the final answer is incorrect. Look for correct application of ${t} concepts from "${rTitle}". Accept alternative valid methods.`,
            });
          } else {
            setLessonPlan({
              ...common,
              resourceType: 'Assessment' as const,
              taskType: 'Source Analysis',
              duration: '60 minutes',
              totalMarks: 25,
              studentSections: [
                { section: 'Section A: Short Answer', instructions: `Using "${rTitle}" from ${rSource}, answer all questions in full sentences.`, questions: [
                  { number: 1, q: `What is the main argument or information presented in "${rTitle}" by ${rSource}?`, marks: 2, lines: 4 },
                  { number: 2, q: `Identify two key facts or pieces of evidence about ${t} from the resource.`, marks: 4, lines: 5 },
                ]},
                { section: 'Section B: Structured Response', instructions: `Answer both questions using specific evidence from "${rTitle}".`, questions: [
                  { number: 3, q: `Explain how the information in "${rTitle}" helps us understand ${t} in the Australian context. Use at least one specific example from the resource.`, marks: 5, lines: 8 },
                  { number: 4, q: `Analyse the perspective presented by ${rSource}. What strengths and limitations does this resource have for understanding ${t}?`, marks: 6, lines: 10 },
                ]},
                { section: 'Section C: Extended Response', instructions: 'Write a detailed response using evidence from the resource and your own knowledge.', questions: [
                  { number: 5, q: `Using "${rTitle}" from ${rSource} as your primary source, evaluate the significance of ${t} in modern Australia. How effectively does the resource present this topic?`, marks: 8, lines: 20 },
                ]},
              ],
              markingCriteria: [
                { criterion: 'Knowledge and Understanding', excellent: 'Thorough understanding of the resource with accurate, specific references', satisfactory: 'Adequate understanding with some references', developing: 'Limited understanding; few references to resource content', marks: 8 },
                { criterion: 'Analysis and Evaluation', excellent: "Insightful analysis of the resource's perspective", satisfactory: 'Some analysis present but could be stronger', developing: 'Limited analysis; mostly descriptive', marks: 8 },
                { criterion: 'Use of Evidence', excellent: 'Consistently cites specific details from the resource', satisfactory: 'Uses resource evidence at times', developing: 'Little evidence from the resource', marks: 6 },
                { criterion: 'Communication', excellent: 'Clear, fluent, well-structured throughout', satisfactory: 'Generally clear with some structure', developing: 'Unclear or poorly structured', marks: 3 },
              ],
              teacherMarkingGuide: `Reward students who cite specific content from "${rTitle}" by ${rSource}.`,
            });
          }
        } else {
          const isStem = /math|science|physics|chemistry|biology/i.test(searchParams.subject);
          setLessonPlan({
            ...common,
            successCriteria: isStem
              ? [`Understand ${t} concepts from "${rTitle}"`, `Apply methods from the resource to solve problems`, `Explain reasoning with correct notation`]
              : common.successCriteria,
            resourceType: 'Lesson Plan' as const,
            objective: isStem
              ? `Students develop ${t} skills by working through "${rTitle}" from ${rSource}. ${rDesc}`
              : `Students explore ${t} by engaging with "${rTitle}" from ${rSource}. ${rDesc}`,
            duration: '60 minutes',
            materials: [
              `"${rTitle}" from ${rSource}${resource.url ? ` (${resource.url})` : ''} — printed or digital`,
              isStem ? 'Calculators (if applicable)' : 'Student notebooks or lined paper',
              'Whiteboard and markers',
            ],
            activities: isStem ? [
              { label: 'Hook (5 min)', text: `Present a real-world problem related to ${t}. Ask: 'How would you approach this?' Connect to "${rTitle}" from ${rSource}.`, teacherTip: 'Let students attempt informally first.' },
              { label: 'Explore (20 min)', text: `Students work through "${rTitle}" from ${rSource}, following explanations and worked examples. Record key concepts, formulas, and methods.`, teacherTip: 'Pause at key points to check understanding.' },
              { label: 'Practice (15 min)', text: `Students apply the methods from "${rTitle}" to practice problems. Start guided, then independent. Pair work to discuss strategies.`, teacherTip: 'Provide worked solutions for the first problem for self-checking.' },
              { label: 'Apply (15 min)', text: `Challenge: students tackle a real-world application that requires ${t} concepts from "${rTitle}". Set up, choose method, solve, and explain reasoning.`, teacherTip: 'Encourage diagrams or tables to organise thinking.' },
              { label: 'Reflect (5 min)', text: `Exit ticket: solve one quick problem using the method from "${rTitle}" and write when you would use this approach.`, teacherTip: 'Use to identify who needs revision.' },
            ] : [
              { label: 'Hook (5 min)', text: `Introduce "${rTitle}" from ${rSource}. Share a key point and ask: 'What does this tell us about ${t}?'`, teacherTip: 'Use think-pair-share for broad participation.' },
              { label: 'Explore (20 min)', text: `Students read/engage with "${rTitle}" and complete guided note-taking on the main ideas and evidence.`, teacherTip: 'Provide a structured template for scaffolding.' },
              { label: 'Analyse (15 min)', text: `In groups, analyse aspects of "${rTitle}": What perspective does ${rSource} present? What evidence supports it?`, teacherTip: 'Assign roles (scribe, presenter, questioner).' },
              { label: 'Evaluate (15 min)', text: `Whole-class discussion: Using evidence from "${rTitle}", evaluate how well ${rSource} covers ${t}.`, teacherTip: 'Use sentence starters for verbal support.' },
              { label: 'Reflect (5 min)', text: `Exit ticket: one key idea from "${rTitle}", one Australian connection, one remaining question.`, teacherTip: 'Read a few anonymously next lesson.' },
            ],
            localExample: { title: isStem ? `${t} in the Australian Context` : `Connecting "${rTitle}" to Local Context`, body: `${rDesc} Teachers should connect this to ${isStem ? 'real-world Australian applications' : 'local examples'} from ${searchParams.state || 'Australia'}.` },
            questions: isStem ? [
              { q: `What are the key ${t} concepts or formulas in "${rTitle}"? Define each.`, difficulty: 'foundation' },
              { q: `Using the method from "${rTitle}", solve a similar problem. Show all working.`, difficulty: 'foundation' },
              { q: `Explain why the method in "${rTitle}" works. What is the reasoning behind each step?`, difficulty: 'core' },
              { q: `Apply the ${t} concepts from "${rTitle}" to a new real-world scenario.`, difficulty: 'core' },
              { q: `Compare two approaches to a ${t} problem. When is the method from "${rTitle}" most efficient?`, difficulty: 'extension' },
            ] : [
              { q: `What is the main idea presented in "${rTitle}" by ${rSource}?`, difficulty: 'foundation' },
              { q: `Identify two specific pieces of evidence from the resource about ${t}.`, difficulty: 'foundation' },
              { q: `Analyse the perspective in "${rTitle}". What strengths and limitations does it have?`, difficulty: 'core' },
              { q: `Compare what you learned from "${rTitle}" with your own knowledge of ${t}.`, difficulty: 'core' },
              { q: `Critically evaluate whether "${rTitle}" provides a balanced view of ${t}.`, difficulty: 'extension' },
            ],
            reflectionPrompt: isStem
              ? `What real-world situation would use the ${t} skills from "${rTitle}"?`
              : `After engaging with "${rTitle}", what is the most important thing to understand about ${t}?`,
          });
        }
        setTeacherNotes(`Review "${rTitle}" from ${rSource} before the lesson. Identify 2-3 key discussion points that connect to ${t}.`);
      } catch {
        // If even the fallback fails, keep lessonPlan null — renderLessonPlan will show a retry prompt
      }
    } finally { setIsGeneratingLesson(false); }
  };

  const handleGenerateSlides = async () => {
    if (!lessonPlan) return;
    setIsGeneratingSlides(true);
    try {
      const data: SlidedeckData = await apiFetch('/slides', {
        lessonPlan, unitContext, alignmentResult,
        selectedResource: selectedResource ? {
          title: selectedResource.title,
          source: selectedResource.source,
          description: selectedResource.description,
          url: selectedResource.url,
          type: selectedResource.type,
        } : undefined,
        subject: searchParams.subject, yearLevel: searchParams.yearLevel,
        topic: searchParams.topic, state: searchParams.state,
      });
      setSlidedeckData(data);
      navigate('slideshow');
    } catch {
      const t = searchParams.topic;
      const sy = searchParams.yearLevel;
      const ss = searchParams.subject;
      const sst = searchParams.state;
      const resourceTitle = selectedResource?.title || `${t} classroom source`;
      const resourceSource = selectedResource?.source || 'the selected classroom resource';
      const resourceDescription = selectedResource?.description || `This lesson uses ${resourceTitle} as the anchor resource for studying ${t}.`;
      const resourceLabel = selectedResource?.title ? `"${resourceTitle}" from ${resourceSource}` : `${resourceTitle} from ${resourceSource}`;
      const obj = lessonPlan && 'objective' in lessonPlan ? (lessonPlan as Record<string,unknown>).objective as string : `Students will understand the key concepts of ${t}.`;
      const acts: Array<{label:string;text:string}> = lessonPlan && 'activities' in lessonPlan ? (lessonPlan as Record<string,unknown>).activities as Array<{label:string;text:string}> : [];
      const qs: Array<{q:string;difficulty:string}> = lessonPlan && 'questions' in lessonPlan ? (lessonPlan as Record<string,unknown>).questions as Array<{q:string;difficulty:string}> : [];
      const sc: string[] = lessonPlan?.successCriteria ?? [`Explain the key concepts of ${t}`, `Apply knowledge of ${t} to Australian contexts`, `Evaluate evidence and form a reasoned conclusion about ${t}`];
      setSlidedeckData({
        title: `${t} — ${sy} ${ss}`,
        subject: ss, yearLevel: sy, topic: t, totalMinutes: 60,
        slides: [
          { slideNumber: 1, type: 'title', heading: `${t} — ${sy} ${ss}`, subheading: `${sy} ${ss} · ${sst} Curriculum · Source: ${resourceSource}`, bodyText: '', bulletPoints: [], keyTerms: [], workedExample: null, table: null, activitySteps: [], teacherNote: `Welcome students and introduce the topic: ${t}. Explain that today's slides are anchored in ${resourceLabel}, then ask what they already know before revealing today's learning intentions.`, backgroundTheme: 'teal', emoji: '📚', timeMinutes: 2 },
          { slideNumber: 2, type: 'objective', heading: 'Learning Intentions & Success Criteria', subheading: 'By the end of today\'s lesson you will be able to:', bodyText: obj || `Students investigate ${t} using curriculum-aligned Australian resources.`, bulletPoints: sc, keyTerms: [], workedExample: null, table: null, activitySteps: [], teacherNote: `Read each learning intention aloud. Ask students to rate their current confidence (1–5 fingers) before starting. Return to these at the end as an exit reflection.`, backgroundTheme: 'white', emoji: '🎯', timeMinutes: 3 },
          { slideNumber: 3, type: 'engage', heading: `Why Does ${t} Matter?`, subheading: 'Engage — Activate prior knowledge', bodyText: `${t} is one of the most significant areas of study in ${sy} ${ss}. Today's lesson uses ${resourceLabel} as the anchor text, giving students a concrete Australian source to question, interpret, and evaluate. ${resourceDescription}`, bulletPoints: [`${t} connects to Australian Curriculum v9 outcomes for ${sy} ${ss}.`, `${resourceSource} gives students a named source to analyse rather than a generic summary of the topic.`, `Today's lesson uses the source alongside Australian examples to ground the theory in practice.`, `Understanding ${t} through a real resource develops critical thinking, evidence evaluation, and analytical literacy.`], keyTerms: [], workedExample: null, table: null, activitySteps: [], teacherNote: `Display ${resourceLabel} and ask students what they can infer about its purpose, audience, and perspective before reading any details. Then use Think-Pair-Share to connect the source to prior knowledge about ${t}.`, backgroundTheme: 'dark', emoji: '💡', timeMinutes: 7 },
          { slideNumber: 4, type: 'theory', heading: `What Is ${t}? — Core Concepts`, subheading: `Explain — Foundational knowledge for ${sy} ${ss}`, bodyText: acts[0]?.text || `${t} is a central area of study in ${sy} ${ss}. Understanding the foundational concepts gives students the knowledge base to analyse evidence, evaluate arguments, and make informed judgements.`, bulletPoints: [`${t} is a foundational concept in ${sy} ${ss} connecting theory to real-world Australian examples.`, `Students at the ${sy} level explain, analyse, and evaluate aspects of ${t} using subject-specific vocabulary.`, `The ${sst} curriculum places ${t} in the broader context of Australian society, environment, and civic understanding.`, `Accurate use of ${ss.toLowerCase()} terminology when discussing ${t} is directly assessed in classroom tasks and examinations.`], keyTerms: [], workedExample: null, table: null, activitySteps: [], teacherNote: `Introduce the core concept in plain language, then restate using subject-specific vocabulary. Ask: "Put this in your own words." Students record their paraphrased definition in their workbooks.`, backgroundTheme: 'white', emoji: '🔍', timeMinutes: 6 },
          { slideNumber: 5, type: 'theory', heading: `How ${t} Works — Processes and Mechanisms`, subheading: 'Explain — Causes, mechanisms, and how they interact', bodyText: acts[1]?.text || `Understanding the mechanisms behind ${t} requires examining how different factors interact over time. In ${sy} ${ss}, students are expected to move beyond description and explain the processes that drive outcomes related to ${t}.`, bulletPoints: [`The key processes driving ${t} involve interrelated causes, effects, and feedback mechanisms.`, `Identifying causal relationships within ${t} allows students to construct evidence-based arguments.`, `In ${sst} and across Australia, the mechanisms of ${t} produce measurable outcomes documented by government agencies and research organisations.`, `Understanding how ${t} operates prepares students for the analytical writing required in ${sy} assessments.`], keyTerms: [], workedExample: null, table: null, activitySteps: [], teacherNote: `Draw a cause-and-effect diagram on the whiteboard. Students copy and annotate it with their own labels. Ask: "What happens next, and why?" before moving on.`, backgroundTheme: 'white', emoji: '⚙️', timeMinutes: 6 },
          { slideNumber: 6, type: 'theory', heading: `Evidence About ${t} — What Research Tells Us`, subheading: 'Explain — Using evidence to support claims', bodyText: acts[2]?.text || `Strong claims about ${t} in ${sy} ${ss} must be supported by credible, specific evidence. Today's starting point is ${resourceLabel}, which students should read as a source with identifiable authorship, examples, and limitations rather than as neutral truth.`, bulletPoints: [`Students should identify the strongest evidence or examples presented in ${resourceLabel}.`, `Evaluating the reliability and relevance of ${resourceSource} is a core analytical skill in ${sy} ${ss} assessments.`, `Students should cite specific details from the source when making claims about ${t}.`, `Comparing the resource with an additional Australian source helps test whether its claims are well supported.`], keyTerms: [], workedExample: null, table: null, activitySteps: [], teacherNote: `Project ${resourceLabel} and model how to extract one claim, one piece of evidence, and one limitation from the source. Then ask students to annotate the text or screenshot in pairs.`, backgroundTheme: 'white', emoji: '📊', timeMinutes: 6 },
          { slideNumber: 7, type: 'theory', heading: `Impacts and Consequences of ${t}`, subheading: 'Explain — Real-world outcomes across Australian contexts', bodyText: acts[3]?.text || `The study of ${t} in ${sy} ${ss} has measurable impacts on individuals, communities, industries, and policy in Australia. Evaluating these impacts requires weighing competing perspectives and considering different stakeholders.`, bulletPoints: [`${t} has direct, documented consequences for Australian communities, environments, and economic systems.`, `Different stakeholders — including government, communities, and individuals — are affected by ${t} in distinct ways.`, `The impacts of ${t} in ${sst} may differ from national patterns due to geographic or policy differences.`, `Evaluating significance — not just listing impacts — is the highest-order skill in ${sy} ${ss} extended responses.`], keyTerms: [], workedExample: null, table: null, activitySteps: [], teacherNote: `Ask: "Who is most affected by ${t} in Australia, and how?" Record responses in two columns: "Who is affected" and "How they are affected." Introduce a real Australian example.`, backgroundTheme: 'white', emoji: '🌏', timeMinutes: 7 },
          { slideNumber: 8, type: 'activity', heading: `Student Activity: Analyse ${resourceTitle}`, subheading: 'Elaborate — Hands-on investigation', bodyText: `Apply what you've learned about ${t} by working directly with ${resourceLabel}. This activity consolidates your understanding and develops skills in analysis, evidence evaluation, and written communication.`, bulletPoints: [], keyTerms: [], workedExample: null, table: null, activitySteps: [`Read or scan ${resourceLabel} and identify three important ideas about ${t}.`, `Record one claim, one example, and one piece of evidence from the source.`, `Explain how those details connect to the lesson objective and the wider ${sy} ${ss} curriculum.`, `Find one additional Australian example that supports or challenges the source.`, `Write a 3-sentence summary explaining what the resource helps you understand about ${t}.`, `Share with a partner and compare whether you identified the same strengths and limitations.`], teacherNote: `Allow 12–15 minutes. Keep the selected resource visible on screen or in print. Foundation students can use a scaffold with "claim", "evidence", and "meaning" columns. Extension students should compare the resource to another source and comment on perspective.`, backgroundTheme: 'highlight', emoji: '💻', timeMinutes: 15 },
          { slideNumber: 9, type: 'discussion', heading: 'Discussion Questions', subheading: 'Evaluate — Three levels of thinking', bodyText: `Use evidence from ${resourceLabel} and today's lesson to support your responses. These questions push your thinking into analysis and evaluation — the skills most valued in ${sy} ${ss} assessment.`, bulletPoints: [qs[0] ? `🟢 Foundation: ${qs[0].q}` : `🟢 Foundation: What are two important ideas about ${t} that ${resourceSource} helps us understand clearly?`, qs[1] ? `🟡 Core: ${qs[1].q}` : `🟡 Core: Which part of ${resourceLabel} is most useful for understanding ${t}, and why?`, qs[2] ? `🔴 Extension: ${qs[2].q}` : `🔴 Extension: Evaluate the strengths and limitations of ${resourceLabel} as a source for studying ${t}.`], keyTerms: [], workedExample: null, table: null, activitySteps: [], teacherNote: `Assign questions by readiness group or allow student choice. After 5 minutes, use fishbowl structure. Debrief by asking which source details were most convincing and which gaps remain.`, backgroundTheme: 'white', emoji: '💬', timeMinutes: 8 },
          { slideNumber: 10, type: 'summary', heading: 'Lesson Summary', subheading: 'Consolidation — The big ideas from today', bodyText: `Today's lesson covered the core concepts, evidence, and applications of ${t} in ${sy} ${ss}. You used ${resourceLabel} as a concrete anchor for analysis, then connected it to the ${sst} curriculum, real Australian examples, and future assessment tasks.`, bulletPoints: [`${t} is significant in ${sy} ${ss} with real-world relevance to ${sst} and Australia.`, `${resourceLabel} gave us a concrete source to analyse rather than a generic overview.`, `Evidence-based analysis and evaluation are the core skills assessed in this topic.`, `Local Australian examples help test, extend, or question the claims made in the source.`], keyTerms: [], workedExample: null, table: null, activitySteps: [], teacherNote: `Return to the confidence ratings from Slide 2. Ask what this resource explained well and what students would still like to investigate with another source.`, backgroundTheme: 'teal', emoji: '✅', timeMinutes: 5 },
        ],
        usedFallback: true,
      });
      navigate('slideshow');
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

      <button onClick={() => navigate('dashboard')} className={`flex items-center gap-3 px-6 py-2.5 text-sm font-medium cursor-pointer transition-colors border-l-4 border-none w-full text-left ${currentScreen === 'dashboard' ? 'text-primary border-primary bg-primary/10' : 'text-slate-400 border-transparent hover:text-white hover:bg-white/5'}`} data-testid="nav-dashboard">
        <HomeIcon className="w-4 h-4" /> {t('dashboard')}
      </button>

      <button onClick={() => navigate('classes')} className={`flex items-center gap-3 px-6 py-2.5 text-sm font-medium cursor-pointer transition-colors border-l-4 border-none w-full text-left ${currentScreen === 'classes' ? 'text-primary border-primary bg-primary/10' : 'text-slate-400 border-transparent hover:text-white hover:bg-white/5'}`} data-testid="nav-my-classes">
        <Users className="w-4 h-4" /> {t('myClasses')}
        {myClasses.length > 0 && <span className="ml-auto bg-primary/20 text-primary text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0">{myClasses.length}</span>}
      </button>

      <button onClick={() => navigate('search')} className={`flex items-center gap-3 px-6 py-2.5 text-sm font-medium cursor-pointer transition-colors border-l-4 border-none w-full text-left ${['search', 'results', 'lesson'].includes(currentScreen) ? 'text-primary border-primary bg-primary/10' : 'text-slate-400 border-transparent hover:text-white hover:bg-white/5'}`} data-testid="nav-new-resource">
        <Compass className="w-4 h-4" /> {t('newResource')}
      </button>

      <button onClick={() => navigate('library')} className={`flex items-center gap-3 px-6 py-2.5 text-sm font-medium cursor-pointer transition-colors border-l-4 border-none w-full text-left ${currentScreen === 'library' ? 'text-primary border-primary bg-primary/10' : 'text-slate-400 border-transparent hover:text-white hover:bg-white/5'}`} data-testid="nav-library">
        <FileStack className="w-4 h-4" /> {t('myLibrary')}
      </button>

      <button onClick={() => navigate('semester')} className={`flex items-center gap-3 px-6 py-2.5 text-sm font-medium cursor-pointer transition-colors border-l-4 border-none w-full text-left ${currentScreen === 'semester' ? 'text-primary border-primary bg-primary/10' : 'text-slate-400 border-transparent hover:text-white hover:bg-white/5'}`} data-testid="nav-semester">
        <CalendarDays className="w-4 h-4" /> {t('semesterPlan')}
      </button>

      <button onClick={() => navigate('settings')} className={`flex items-center gap-3 px-6 py-2.5 text-sm font-medium cursor-pointer transition-colors border-l-4 border-none w-full text-left ${currentScreen === 'settings' ? 'text-primary border-primary bg-primary/10' : 'text-slate-400 border-transparent hover:text-white hover:bg-white/5'}`} data-testid="nav-settings">
        <Settings2 className="w-4 h-4" /> {t('settings')}
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

  const renderTopbar = (title: string, subtitle: string, classroomUrl?: string, classroomTitle?: string) => (
    <div className="bg-white px-8 py-4 flex items-center justify-between border-b border-border sticky top-0 z-40">
      <div>
        <div className="font-serif text-[22px] text-foreground tracking-tight">{title}</div>
        {subtitle && <div className="text-[13px] text-muted-foreground mt-0.5">{subtitle}</div>}
      </div>
      <div className="flex gap-2 items-center">
        {/* Google Classroom button — only when a share URL is available */}
        {classroomUrl && (
          <button
            onClick={() => handleShareToClassroom(classroomUrl, classroomTitle ?? title)}
            className="flex items-center gap-1.5 bg-[#1a73e8] hover:bg-[#1557b0] text-white text-[11px] font-semibold px-3 py-1.5 rounded-full cursor-pointer border-none transition-colors shadow-sm"
            title={t('googleClassroom')}
            aria-label={t('googleClassroom')}
          >
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-white" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 3h18a1 1 0 011 1v16a1 1 0 01-1 1H3a1 1 0 01-1-1V4a1 1 0 011-1zm9 7a2 2 0 100 4 2 2 0 000-4zm-4 6c0-1.333 2.667-2 4-2s4 .667 4 2v1H8v-1z"/>
            </svg>
            {t('classroom')}
          </button>
        )}

        {/* Language switcher */}
        <div className="relative">
          <button onClick={() => setShowLangMenu(v => !v)} className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] font-semibold px-2.5 py-1.5 rounded-full cursor-pointer border-none transition-colors" aria-label="Switch language">
            <Globe className="w-3.5 h-3.5" />
            <span>{LANGUAGES.find(l => l.code === uiLanguage)?.flag}</span>
            <span className="hidden sm:inline">{LANGUAGES.find(l => l.code === uiLanguage)?.label.split(' ')[0]}</span>
          </button>
          {showLangMenu && (
            <div className="absolute right-0 top-9 bg-white border border-border rounded-xl shadow-lg py-1 min-w-[180px] z-50">
              {LANGUAGES.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => { setUiLanguage(lang.code); setShowLangMenu(false); }}
                  className={`flex items-center gap-2.5 w-full text-left px-3.5 py-2.5 text-[13px] font-medium cursor-pointer border-none transition-colors ${uiLanguage === lang.code ? 'bg-teal-50 text-primary' : 'bg-transparent text-foreground hover:bg-slate-50'}`}
                >
                  <span className="text-base">{lang.flag}</span>
                  <span className="flex-1">{lang.label}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{lang.voiceCode}</span>
                  {uiLanguage === lang.code && <CheckCircle className="w-3.5 h-3.5 text-primary ml-1" />}
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
            <p className="text-[13px] text-slate-400 mb-1">{t('goodMorning')}, Sarah</p>
            <h1 className="font-serif text-[28px] text-foreground font-semibold mb-5 leading-snug">{t('whatAreYouTeaching')}</h1>
            <div className="bg-white rounded-xl border border-border shadow-sm flex items-center gap-0 overflow-hidden focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
              <Search className="w-4.5 h-4.5 text-slate-400 ml-4 shrink-0" />
              <input
                type="text"
                value={searchParams.topic}
                onChange={e => setSearchParams(prev => ({...prev, topic: e.target.value}))}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder={t('searchPlaceholder')}
                className="flex-1 px-3 py-3.5 text-[14px] text-foreground placeholder:text-slate-400 outline-none border-none bg-transparent"
                aria-label="Search topic"
                data-testid="dashboard-search-input"
              />
              <VoiceMic onTranscript={transcript => setSearchParams(prev => ({...prev, topic: transcript}))} voiceLang={voiceLang} className="mr-1" />
              <button
                onClick={handleSearch}
                disabled={isSearching || !searchParams.topic.trim()}
                className="m-1.5 bg-primary text-white px-5 py-2.5 rounded-lg text-[13px] font-semibold cursor-pointer border-none hover:bg-teal-700 transition-colors disabled:opacity-50 shrink-0"
                data-testid="dashboard-search-btn"
              >
                {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : t('search')}
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
              <div key={card.label} onClick={() => navigate(card.screen)} className="bg-white rounded-xl border border-border px-4 py-3.5 cursor-pointer hover:border-primary hover:shadow-sm transition-all flex items-center gap-3 group" data-testid={`card-${card.label.replace(/\s+/g, '-').toLowerCase()}`}>
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
              <div className="text-[17px] font-semibold text-foreground mb-1">Finding the best resources for your class...</div>
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
                <button onClick={() => navigate('unit-planner')} className="text-[12px] text-primary hover:underline bg-transparent border-none cursor-pointer">Edit</button>
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
              <button onClick={() => navigate('dashboard')} className="bg-white text-slate-600 border border-border px-5 py-2.5 rounded-lg text-sm font-medium hover:border-primary hover:text-primary transition-colors flex items-center gap-2 cursor-pointer" data-testid="btn-cancel">Cancel</button>
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
      {renderTopbar("Results", `Found ${(showAiSuggestions && resources.length === 0 ? aiSuggestions.length : resources.length)} resource${(showAiSuggestions && resources.length === 0 ? aiSuggestions.length : resources.length) !== 1 ? 's' : ''} for ${searchParams.topic}${showAiSuggestions && resources.length === 0 ? ' (AI-generated)' : ''}`)}
      <div className="p-8 flex-1">
        {renderFirstNationsBanner()}
        {renderLocalLensTip()}
        {renderAlignmentBar()}
        <div className="flex flex-col gap-4">
          {resources.length === 0 && aiSuggestions.length === 0 && (
            <div className="bg-white rounded-xl border border-border p-12 text-center">
              <div className="text-slate-300 text-4xl mb-3">📚</div>
              <div className="text-[15px] font-semibold text-slate-400 mb-1">No resources found</div>
              <div className="text-[13px] text-slate-400 mb-4">Try another topic, or use a curated demo topic while search coverage is limited.</div>
              <button onClick={() => navigate('search')} className="bg-primary text-white border-none px-5 py-2.5 rounded-lg text-sm font-semibold cursor-pointer hover:bg-teal-700">Back to search</button>
            </div>
          )}
          {resources.map((resource) => (
            <div key={resource.id} className="bg-white rounded-xl shadow-sm border border-border p-6 flex flex-col gap-4 hover:border-teal-200 hover:shadow-md transition-all" data-testid={`resource-card-${resource.id}`}>
              {getResourceReviewBanners(resource).length > 0 && (
                <div className="flex flex-col gap-2">
                  {getResourceReviewBanners(resource).map(renderReviewBanner)}
                </div>
              )}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{resource.type}</span>
                    <span className="bg-teal-50 text-teal-800 text-[11px] font-semibold px-2 py-0.5 rounded">{resource.alignmentScore}% match</span>
                    {renderResourceProvenance(resource)}
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
                  {resource.url && resource.urlType !== 'search' && resource.verifiedLink !== false && (
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors no-underline bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700"
                      aria-label={`Open ${resource.title} in new tab`}
                      title="Open the original resource in a new tab"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Open resource
                    </a>
                  )}
                  {!resource.url && (
                    <div className="px-3 py-2 rounded-lg text-[12px] font-medium bg-amber-50 text-amber-800 border border-amber-200 max-w-[180px] text-center">
                      No verified direct link available
                    </div>
                  )}
                  <button
                    onClick={() => handleSaveResource(resource)}
                    disabled={savedResourceIds.has(resource.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold border-none cursor-pointer transition-colors ${savedResourceIds.has(resource.id) ? 'bg-teal-100 text-teal-700 cursor-default' : 'bg-slate-100 text-slate-600 hover:bg-teal-50 hover:text-teal-700'}`}
                    aria-label={savedResourceIds.has(resource.id) ? "Resource saved" : "Save resource"}
                  >
                    {savedResourceIds.has(resource.id) ? <><BookmarkCheck className="w-3.5 h-3.5" /> Saved</> : <><Bookmark className="w-3.5 h-3.5" /> Save</>}
                  </button>
                  <button
                    onClick={() => handleShareToClassroom(resource.urlType !== 'search' && resource.verifiedLink !== false ? resource.url : undefined, resource.title)}
                    className="flex items-center gap-1.5 bg-[#1a73e8] hover:bg-[#1557b0] text-white border-none px-3 py-1.5 rounded-lg text-[12px] font-semibold cursor-pointer transition-colors whitespace-nowrap"
                    title={t('googleClassroom')}
                    aria-label={`Share ${resource.title} to Google Classroom`}
                  >
                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-white" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 3h18a1 1 0 011 1v16a1 1 0 01-1 1H3a1 1 0 01-1-1V4a1 1 0 011-1zm9 7a2 2 0 100 4 2 2 0 000-4zm-4 6c0-1.333 2.667-2 4-2s4 .667 4 2v1H8v-1z"/>
                    </svg>
                    {t('classroom')}
                  </button>
                  <button onClick={() => handleAdaptResource(resource)} className="bg-primary text-white border-none px-4 py-2 rounded-lg text-[13px] font-semibold cursor-pointer hover:bg-teal-700 transition-colors shadow-sm whitespace-nowrap" data-testid={`btn-adapt-${resource.id}`} aria-label={`Adapt ${resource.title}`}>
                    {t('adaptFor')} →
                  </button>
                </div>
              </div>
              {resource.trustScorecard && (
                <TrustScorecard scorecard={resource.trustScorecard} resourceTitle={resource.title} />
              )}
            </div>
          ))}

          {/* AI-Generated Suggestions section — always shown below verified results */}
          {(resources.length > 0 || aiSuggestions.length > 0) && (
            <div className="mt-2">
              {aiSuggestions.length > 0 && !showAiSuggestions ? (
                <button
                  onClick={() => setShowAiSuggestions(true)}
                  className="w-full bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-200 rounded-xl p-4 flex items-center justify-between cursor-pointer hover:border-violet-300 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-violet-100 rounded-lg p-2 group-hover:bg-violet-200 transition-colors"><Sparkles className="w-4 h-4 text-violet-600" /></div>
                    <div className="text-left">
                      <div className="text-[14px] font-semibold text-violet-800">Also show AI-Generated Suggestions</div>
                      <div className="text-[12px] text-violet-500">{aiSuggestions.length} additional resource{aiSuggestions.length !== 1 ? 's' : ''} suggested by AI — may not have verified links</div>
                    </div>
                  </div>
                  <ChevronDown className="w-5 h-5 text-violet-400 group-hover:text-violet-600 transition-colors" />
                </button>
              ) : aiSuggestions.length > 0 ? (
                <>
                  <div className="bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-200 rounded-xl p-4 flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-violet-100 rounded-lg p-2"><Sparkles className="w-4 h-4 text-violet-600" /></div>
                      <div>
                        <div className="text-[14px] font-semibold text-violet-800">AI-Generated Suggestions</div>
                        <div className="text-[12px] text-violet-600">These resources are suggested by AI and may not have verified links. Review before classroom use.</div>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowAiSuggestions(false)}
                      className="text-violet-400 hover:text-violet-600 bg-transparent border-none cursor-pointer p-1 flex items-center gap-1"
                    >
                      <ChevronUp className="w-4 h-4" /> <span className="text-[12px] font-medium">Hide</span>
                    </button>
                  </div>
                  <div className="flex flex-col gap-4">
                    {aiSuggestions.map((resource) => (
                      <div key={resource.id} className="bg-white rounded-xl shadow-sm border border-violet-200 p-6 flex flex-col gap-4 hover:border-violet-300 hover:shadow-md transition-all" data-testid={`ai-resource-card-${resource.id}`}>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{resource.type}</span>
                              <span className="bg-teal-50 text-teal-800 text-[11px] font-semibold px-2 py-0.5 rounded">{resource.alignmentScore}% match</span>
                              <span className="bg-violet-100 text-violet-700 text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1"><Sparkles className="w-3 h-3" /> AI Suggested</span>
                              {resource.safetyRating === 'unverified' && <span className="bg-amber-100 text-amber-700 text-[11px] font-semibold px-2 py-0.5 rounded-full">Unverified</span>}
                            </div>
                            <div className="text-[17px] font-bold text-foreground mb-0.5">{resource.title}</div>
                            <div className="text-[13px] text-slate-400 font-medium mb-2">{resource.source}</div>
                            <div className="text-[14px] text-slate-600 leading-relaxed mb-3">{resource.description}</div>
                            {resource.whyThisResource && (
                              <div className="bg-violet-50 border border-violet-100 rounded-xl px-4 py-3 text-[13px] text-violet-800 leading-relaxed">
                                <span className="font-bold">Why this resource? </span>{resource.whyThisResource}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col gap-2 shrink-0">
                            <button onClick={() => handleAdaptResource(resource)} className="bg-violet-600 text-white border-none px-4 py-2 rounded-lg text-[13px] font-semibold cursor-pointer hover:bg-violet-700 transition-colors shadow-sm whitespace-nowrap">
                              {t('adaptFor')} →
                            </button>
                          </div>
                        </div>
                        {resource.trustScorecard && (
                          <TrustScorecard scorecard={resource.trustScorecard} resourceTitle={resource.title} />
                        )}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="w-full bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-200 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-violet-100 rounded-lg p-2"><Sparkles className="w-4 h-4 text-violet-600" /></div>
                    <div className="text-left">
                      <div className="text-[14px] font-semibold text-violet-800">AI-Generated Suggestions</div>
                      <div className="text-[12px] text-violet-600">No AI suggestions were returned for this search. Verified web resources are still shown above.</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        {(resources.length > 0 || aiSuggestions.length > 0) && (
          <div className="mt-5 flex justify-start">
            <button onClick={() => navigate('search')} className="text-[13px] font-medium text-slate-500 hover:text-primary flex items-center gap-1.5 bg-transparent border-none cursor-pointer">
              <ArrowLeft className="w-4 h-4" /> Back to search
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderOutputHeader = (output: GeneratedOutput) => (
    <div className="flex flex-col gap-3 mb-5">
      {getOutputReviewBanners(output).map(renderReviewBanner)}
      <div className="bg-gradient-to-r from-teal-700 to-teal-600 rounded-xl p-6 shadow-sm text-white">
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
    </div>
  );

  const buildShareUrl = () => {
    if (!lessonPlan) return '';
    const payload: SharePayload = {
      rType: lessonPlan.resourceType,
      oc: lessonPlan.outcomeCode,
      od: lessonPlan.outcomeDescription,
      sc: lessonPlan.successCriteria,
      ...(lessonPlan.usedFallback ? { of: true } : {}),
      ...(lessonPlan.resourceType === 'Lesson Plan' && {
        o: (lessonPlan as LessonPlan).objective,
        d: (lessonPlan as LessonPlan).duration,
        a: (lessonPlan as LessonPlan).activities,
        lx: (lessonPlan as LessonPlan).localExample,
        q: (lessonPlan as LessonPlan).questions,
      }),
      ...(lessonPlan.resourceType === 'Worksheet' && {
        sec: (lessonPlan as WorksheetOutput).sections,
        et: (lessonPlan as WorksheetOutput).extensionTask,
        wb: (lessonPlan as WorksheetOutput).wordBank,
      }),
      ...(lessonPlan.resourceType === 'Discussion' && {
        dp: (lessonPlan as DiscussionOutput).discussionPrompt,
        bc: (lessonPlan as DiscussionOutput).backgroundContext,
        p: (lessonPlan as DiscussionOutput).perspectives,
        ss: (lessonPlan as DiscussionOutput).sentenceStarters,
        rq: (lessonPlan as DiscussionOutput).reflectionQuestions,
        tn: (lessonPlan as DiscussionOutput).teacherFacilitationNotes,
      }),
      ...(lessonPlan.resourceType === 'Assessment' && {
        tt: (lessonPlan as AssessmentOutput).taskType,
        d: (lessonPlan as AssessmentOutput).duration,
        tm: (lessonPlan as AssessmentOutput).totalMarks,
        st: (lessonPlan as AssessmentOutput).studentSections,
        mc: (lessonPlan as AssessmentOutput).markingCriteria,
        tg: (lessonPlan as AssessmentOutput).teacherMarkingGuide,
      }),
    };
    return `${window.location.origin}/#s=${encodeSharePayload(payload)}`;
  };

  const createShortShareUrl = useCallback(async () => {
    if (!lessonPlan) return '';

    const payload: SharePayload = {
      rType: lessonPlan.resourceType,
      oc: lessonPlan.outcomeCode,
      od: lessonPlan.outcomeDescription,
      sc: lessonPlan.successCriteria,
      ...(lessonPlan.usedFallback ? { of: true } : {}),
      ...(lessonPlan.resourceType === 'Lesson Plan' && {
        o: (lessonPlan as LessonPlan).objective,
        d: (lessonPlan as LessonPlan).duration,
        a: (lessonPlan as LessonPlan).activities,
        lx: (lessonPlan as LessonPlan).localExample,
        q: (lessonPlan as LessonPlan).questions,
      }),
      ...(lessonPlan.resourceType === 'Worksheet' && {
        sec: (lessonPlan as WorksheetOutput).sections,
        et: (lessonPlan as WorksheetOutput).extensionTask,
        wb: (lessonPlan as WorksheetOutput).wordBank,
      }),
      ...(lessonPlan.resourceType === 'Discussion' && {
        dp: (lessonPlan as DiscussionOutput).discussionPrompt,
        bc: (lessonPlan as DiscussionOutput).backgroundContext,
        p: (lessonPlan as DiscussionOutput).perspectives,
        ss: (lessonPlan as DiscussionOutput).sentenceStarters,
        rq: (lessonPlan as DiscussionOutput).reflectionQuestions,
        tn: (lessonPlan as DiscussionOutput).teacherFacilitationNotes,
      }),
      ...(lessonPlan.resourceType === 'Assessment' && {
        tt: (lessonPlan as AssessmentOutput).taskType,
        d: (lessonPlan as AssessmentOutput).duration,
        tm: (lessonPlan as AssessmentOutput).totalMarks,
        st: (lessonPlan as AssessmentOutput).studentSections,
        mc: (lessonPlan as AssessmentOutput).markingCriteria,
        tg: (lessonPlan as AssessmentOutput).teacherMarkingGuide,
      }),
    };

    const result = await fetchJsonFromApi('/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payload }),
      signal: AbortSignal.timeout(8000),
    });
    const parsed = result as { id?: string };
    if (!parsed.id) throw new Error('Share creation returned no id');
    return `${window.location.origin}/s/${parsed.id}`;
  }, [lessonPlan]);

  useEffect(() => {
    if (!showQR) {
      setShareUrl('');
      setIsCreatingShareLink(false);
      setShareLinkError(null);
      setShowFallbackShare(false);
      return;
    }

    setShareUrl('');
    setShareLinkError(null);
    setShowFallbackShare(false);
    setIsCreatingShareLink(true);

    createShortShareUrl()
      .then((url) => {
        if (url) setShareUrl(url);
      })
      .catch(() => {
        setShareLinkError('Short share link could not be created. Make sure the API server has been restarted.');
      })
      .finally(() => {
        setIsCreatingShareLink(false);
      });
  }, [showQR, createShortShareUrl]);

  const renderQRModal = () => {
    if (!showQR) return null;
    const fallbackUrl = buildShareUrl();
    const url = shareUrl || (showFallbackShare ? fallbackUrl : '');
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowQR(false)}>
        <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-sm w-full mx-4 flex flex-col items-center gap-5" onClick={e => e.stopPropagation()}>
          <div className="text-[18px] font-serif font-semibold text-foreground">Share via QR Code</div>
          <p className="text-[13px] text-slate-500 text-center">Colleague scans this with their phone to instantly load this {lessonPlan?.resourceType?.toLowerCase()}.</p>
          <div className="p-3 border-2 border-border rounded-xl">
            {url ? (
              <QRCodeSVG
                value={url}
                size={256}
                includeMargin
                level="L"
                bgColor="#FFFFFF"
                fgColor="#111827"
              />
            ) : (
              <div className="w-[256px] h-[256px] flex flex-col items-center justify-center text-center px-4">
                <Loader2 className="w-7 h-7 animate-spin text-slate-400 mb-3" />
                <div className="text-[12px] text-slate-500">
                  {isCreatingShareLink ? 'Creating short share link...' : 'Waiting for share link...'}
                </div>
              </div>
            )}
          </div>
          {shareLinkError && (
            <div className="w-full rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-800 text-center">
              {shareLinkError}
            </div>
          )}
          <div className="w-full">
            <div className="text-[11px] text-slate-400 mb-1 text-center">Or copy the link</div>
            <div className="flex gap-2">
              <input readOnly value={url} className="flex-1 text-[11px] border border-border rounded-lg px-3 py-2 text-slate-600 bg-slate-50 outline-none" />
              <button
                onClick={() => { if (url) navigator.clipboard.writeText(url); }}
                disabled={!url}
                className="bg-primary text-white text-[12px] font-semibold px-3 py-2 rounded-lg border-none cursor-pointer hover:bg-teal-700 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Copy
              </button>
            </div>
          </div>
          {shareLinkError && !showFallbackShare && (
            <button
              onClick={() => {
                setShowFallbackShare(true);
                setShareUrl(fallbackUrl);
              }}
              className="text-[12px] text-slate-500 hover:text-primary bg-transparent border-none cursor-pointer"
            >
              Use longer offline fallback link
            </button>
          )}
          <button onClick={() => setShowQR(false)} className="text-[13px] text-slate-400 hover:text-slate-600 bg-transparent border-none cursor-pointer">Close</button>
        </div>
      </div>
    );
  };

  const renderOutputActions = () => {
    const lessonTitle = `${searchParams.topic} — ${searchParams.yearLevel} ${searchParams.subject}`;
    const resource = selectedResource;
    return (
      <div className="flex items-center justify-between mb-5">
        <button onClick={() => navigate('results')} className="text-[13px] font-medium text-slate-500 hover:text-primary flex items-center gap-1.5 bg-transparent border-none cursor-pointer" data-testid="btn-back-to-results">
          <ArrowLeft className="w-4 h-4" /> {t('backToResults')}
        </button>
        <div className="flex gap-2">
          {resource?.url && resource.urlType !== 'search' && resource.verifiedLink !== false && (
            <a
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-semibold border transition-colors no-underline bg-white text-slate-600 border-border hover:border-primary hover:text-primary"
              title="Open the original resource in a new tab"
            >
              <ExternalLink className="w-4 h-4" />
              Open resource
            </a>
          )}
          {!resource?.url && (
            <div className="flex items-center px-4 py-2 rounded-lg text-[13px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
              No verified direct link
            </div>
          )}
          <button
            onClick={handleSaveLesson}
            disabled={lessonSaved}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-semibold border cursor-pointer transition-colors ${lessonSaved ? 'bg-teal-50 text-teal-700 border-teal-200 cursor-default' : 'bg-white text-slate-600 border-border hover:border-primary hover:text-primary'}`}
            aria-label={lessonSaved ? "Lesson saved" : "Save lesson to library"}
          >
            {lessonSaved ? <><BookmarkCheck className="w-4 h-4" /> {t('saved')}</> : <><Bookmark className="w-4 h-4" /> {t('save')}</>}
          </button>
          <button
            onClick={() => setShowQR(true)}
            className="flex items-center gap-1.5 bg-white text-slate-600 border border-border px-4 py-2 rounded-lg text-[13px] font-semibold hover:border-primary hover:text-primary transition-colors cursor-pointer"
            title="Share via QR Code"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
              <rect x="5" y="5" width="3" height="3"/><rect x="16" y="5" width="3" height="3"/><rect x="5" y="16" width="3" height="3"/>
              <path d="M14 14h3v3h-3zM17 17h3v3h-3zM14 20h3"/>
            </svg>
            Share QR
          </button>
          <button
            onClick={handleGenerateSlides}
            disabled={isGeneratingSlides}
            className="flex items-center gap-1.5 bg-primary text-white border-none px-4 py-2 rounded-lg text-[13px] font-semibold cursor-pointer hover:bg-teal-700 transition-colors shadow-sm disabled:opacity-60"
            aria-label="Generate slide deck"
          >
            {isGeneratingSlides ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('generating')}</> : <><Presentation className="w-4 h-4" /> {t('slides')} →</>}
          </button>
          <button className="bg-white text-slate-600 border border-border px-4 py-2 rounded-lg text-[13px] font-semibold hover:border-primary hover:text-primary transition-colors flex items-center gap-1.5 cursor-pointer" onClick={() => window.print()}>
            <Download className="w-4 h-4" /> {t('pdf')}
          </button>
          <button
            onClick={() => handleShareToClassroom(undefined, lessonTitle)}
            className="flex items-center gap-1.5 bg-[#1a73e8] hover:bg-[#1557b0] text-white text-[13px] font-semibold px-4 py-2 rounded-lg cursor-pointer border-none transition-colors shadow-sm"
            title={t('googleClassroom')}
            aria-label={t('googleClassroom')}
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 3h18a1 1 0 011 1v16a1 1 0 01-1 1H3a1 1 0 01-1-1V4a1 1 0 011-1zm9 7a2 2 0 100 4 2 2 0 000-4zm-4 6c0-1.333 2.667-2 4-2s4 .667 4 2v1H8v-1z"/>
            </svg>
            {t('classroom')}
          </button>
        </div>
      </div>
    );
  };

  const renderLessonPlanContent = (plan: LessonPlan) => {
    const getDifficultyColor = (d: string) => d === 'foundation' ? 'bg-green-100 text-green-700' : d === 'core' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700';
    const getDifficultyLabel = (d: string) => d === 'foundation' ? 'Foundation' : d === 'core' ? 'Core' : 'Extension';
    const activityColors = ['bg-teal-500', 'bg-blue-500', 'bg-indigo-500', 'bg-violet-500', 'bg-slate-500'];
    const parseMinutes = (label: string) => { const m = label.match(/(\d+)\s*min/i); return m ? parseInt(m[1], 10) : 0; };
    const totalMinutes = plan.activities.reduce((s, a) => s + parseMinutes(a.label), 0) || 60;

    return (
      <>
        {/* Overview card */}
        <div className="bg-white rounded-xl shadow-sm border border-border p-7 mb-5">
          <div className="flex items-center gap-3 mb-5 pb-5 border-b border-border flex-wrap">
            <span className="bg-slate-100 text-slate-700 text-[13px] font-semibold px-3.5 py-1.5 rounded-full">{plan.duration}</span>
            <span className="bg-slate-100 text-slate-700 text-[13px] font-semibold px-3.5 py-1.5 rounded-full">{searchParams.classContext.length > 0 ? searchParams.classContext.join(', ') : 'Standard Class'}</span>
            <span className="bg-teal-50 text-teal-700 text-[13px] font-semibold px-3.5 py-1.5 rounded-full">{searchParams.yearLevel} {searchParams.subject}</span>
            <span className="bg-blue-50 text-blue-700 text-[13px] font-semibold px-3.5 py-1.5 rounded-full">{searchParams.state}</span>
          </div>
          <div className="font-serif text-[18px] text-foreground mb-2">Learning Objective</div>
          <div className="text-[15px] text-slate-700 leading-relaxed mb-0">{plan.objective}</div>
        </div>

        {/* Materials & Preparation */}
        {((plan.materials && plan.materials.length > 0) || (plan.teacherPrep && plan.teacherPrep.length > 0)) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            {plan.materials && plan.materials.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                <div className="text-[13px] font-bold text-amber-700 mb-3 flex items-center gap-2">
                  <FileStack className="w-4 h-4" /> Materials Needed
                </div>
                <ul className="flex flex-col gap-1.5">
                  {plan.materials.map((m, i) => (
                    <li key={i} className="flex items-start gap-2 text-[13px] text-slate-700">
                      <CheckCircle className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" /> {m}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {plan.teacherPrep && plan.teacherPrep.length > 0 && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                <div className="text-[13px] font-bold text-slate-700 mb-3 flex items-center gap-2">
                  <Settings2 className="w-4 h-4" /> Teacher Preparation
                </div>
                <ul className="flex flex-col gap-1.5">
                  {plan.teacherPrep.map((p, i) => (
                    <li key={i} className="flex items-start gap-2 text-[13px] text-slate-700">
                      <span className="text-slate-400 font-bold shrink-0">{i + 1}.</span> {p}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Timing bar */}
        <div className="bg-white rounded-xl shadow-sm border border-border p-5 mb-5">
          <div className="text-[12px] font-bold text-slate-500 uppercase tracking-wider mb-3">Lesson Timeline</div>
          <div className="flex rounded-lg overflow-hidden h-3 mb-2">
            {plan.activities.map((a, i) => {
              const mins = parseMinutes(a.label);
              return <div key={i} className={`${activityColors[i % activityColors.length]} transition-all`} style={{ width: `${(mins / totalMinutes) * 100}%` }} title={a.label} />;
            })}
          </div>
          <div className="flex justify-between text-[11px] text-slate-400">
            <span>0 min</span>
            <span>{totalMinutes} min</span>
          </div>
        </div>

        {/* Activities */}
        <div className="bg-white rounded-xl shadow-sm border border-border p-7 mb-5">
          <div className="font-serif text-[20px] text-foreground mb-5">Lesson Activities</div>
          <div className="flex flex-col gap-0">
            {plan.activities.map((activity, i) => {
              const mins = parseMinutes(activity.label);
              return (
                <div key={i} className="relative pl-10 pb-6 last:pb-0">
                  {/* Timeline connector */}
                  {i < plan.activities.length - 1 && <div className="absolute left-[15px] top-8 bottom-0 w-0.5 bg-slate-200" />}
                  {/* Timeline dot */}
                  <div className={`absolute left-1.5 top-1 w-6 h-6 rounded-full ${activityColors[i % activityColors.length]} flex items-center justify-center`}>
                    <span className="text-white text-[10px] font-bold">{i + 1}</span>
                  </div>
                  {/* Content */}
                  <div className="border border-border rounded-lg p-4 hover:border-primary/30 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-[15px] font-semibold text-foreground">{activity.label}</div>
                      {mins > 0 && <span className="text-[11px] font-medium text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">{mins} min</span>}
                    </div>
                    <div className="text-[14px] text-slate-600 leading-relaxed">{activity.text}</div>
                    {activity.teacherTip && (
                      <div className="mt-3 bg-teal-50 border border-teal-200 rounded-lg p-3 flex items-start gap-2">
                        <Info className="w-3.5 h-3.5 text-teal-600 mt-0.5 shrink-0" />
                        <div className="text-[12px] text-teal-700 leading-relaxed"><span className="font-bold">Teacher Tip:</span> {activity.teacherTip}</div>
                      </div>
                    )}
                    {activity.assessmentIndicator && (
                      <div className="mt-2 flex items-center gap-1.5">
                        <BarChart3 className="w-3 h-3 text-indigo-400" />
                        <span className="text-[11px] text-indigo-500 font-medium">{activity.assessmentIndicator}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Local context */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-5 shadow-sm">
          <div className="text-[14px] font-bold text-blue-700 mb-2 flex items-center gap-2"><Compass className="w-4 h-4" /> Local Australian Context: {plan.localExample.title}</div>
          <div className="text-[14px] text-slate-700 leading-relaxed">{plan.localExample.body}</div>
        </div>

        {/* Differentiation & Cross-curriculum row */}
        {((plan.differentiationTips && plan.differentiationTips.length > 0) || (plan.crossCurriculumLinks && plan.crossCurriculumLinks.length > 0)) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            {plan.differentiationTips && plan.differentiationTips.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-border p-5">
                <div className="text-[13px] font-bold text-foreground mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4 text-violet-500" /> Differentiation Strategies
                </div>
                <div className="flex flex-col gap-2.5">
                  {plan.differentiationTips.map((tip, i) => {
                    const levelColor = tip.level.toLowerCase().includes('extend') || tip.level.toLowerCase().includes('high')
                      ? 'bg-purple-100 text-purple-700'
                      : tip.level.toLowerCase().includes('support') || tip.level.toLowerCase().includes('low')
                      ? 'bg-green-100 text-green-700'
                      : 'bg-blue-100 text-blue-700';
                    return (
                      <div key={i} className="flex items-start gap-2.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 mt-0.5 ${levelColor}`}>{tip.level}</span>
                        <span className="text-[13px] text-slate-600 leading-relaxed">{tip.suggestion}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {plan.crossCurriculumLinks && plan.crossCurriculumLinks.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-border p-5">
                <div className="text-[13px] font-bold text-foreground mb-3 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-500" /> Cross-Curriculum Links
                </div>
                <div className="flex flex-wrap gap-2">
                  {plan.crossCurriculumLinks.map((link, i) => (
                    <span key={i} className="bg-blue-50 text-blue-700 text-[12px] font-medium px-3 py-1.5 rounded-lg border border-blue-100">{link}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Questions */}
        <div className="bg-white rounded-xl shadow-sm border border-border p-7 mb-5">
          <div className="font-serif text-[20px] text-foreground mb-1">Differentiated Questions</div>
          <div className="text-[12px] text-slate-400 mb-4">Tiered questions to support all learners in your classroom</div>
          <div className="flex flex-col gap-3">
            {plan.questions.map((q, i) => (
              <div key={i} className="p-3.5 border border-border rounded-lg flex items-start gap-3 hover:border-primary/30 transition-colors">
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0 mt-0.5 ${getDifficultyColor(q.difficulty)}`}>{getDifficultyLabel(q.difficulty)}</span>
                <div className="text-[14px] text-slate-700 leading-relaxed pt-0.5">{q.q}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Reflection */}
        {plan.reflectionPrompt && (
          <div className="bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-200 rounded-xl p-5 mb-5">
            <div className="text-[13px] font-bold text-violet-700 mb-2 flex items-center gap-2"><Sparkles className="w-4 h-4" /> End-of-Lesson Reflection</div>
            <div className="text-[14px] text-slate-700 leading-relaxed italic">"{plan.reflectionPrompt}"</div>
          </div>
        )}
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
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-border p-7 mb-5">
        <div className="flex items-center gap-3 mb-3">
          <span className="bg-slate-100 text-slate-700 text-[13px] font-semibold px-3.5 py-1.5 rounded-full">{assess.taskType}</span>
          <span className="bg-slate-100 text-slate-700 text-[13px] font-semibold px-3.5 py-1.5 rounded-full">{assess.duration}</span>
          <span className="bg-teal-50 text-teal-700 text-[13px] font-semibold px-3.5 py-1.5 rounded-full">{assess.totalMarks} marks total</span>
        </div>
        <div className="text-[13px] text-slate-500">Complete all sections. Write your answers in the spaces provided.</div>
      </div>

      {/* Student Question Paper */}
      {assess.studentSections?.map((sec, si) => (
        <div key={si} className="bg-white rounded-xl shadow-sm border border-border p-7 mb-5">
          <div className="flex items-center justify-between mb-3 pb-3 border-b border-border">
            <div className="font-serif text-[17px] font-semibold text-foreground">{sec.section}</div>
            <div className="text-[13px] text-slate-500">{sec.questions.reduce((s, q) => s + q.marks, 0)} marks</div>
          </div>
          <div className="text-[13px] text-slate-600 italic mb-5">{sec.instructions}</div>
          <div className="flex flex-col gap-6">
            {sec.questions.map((q, qi) => (
              <div key={qi}>
                <div className="flex items-start gap-3 mb-2">
                  <span className="text-[13px] font-bold text-foreground min-w-[22px]">{q.number}.</span>
                  <div className="flex-1">
                    <span className="text-[14px] text-foreground leading-relaxed">{q.q}</span>
                    <span className="ml-2 text-[12px] text-slate-400">({q.marks} {q.marks === 1 ? 'mark' : 'marks'})</span>
                  </div>
                </div>
                <div className="ml-7 flex flex-col gap-1 mt-2">
                  {Array.from({ length: q.lines ?? 4 }).map((_, li) => (
                    <div key={li} className="border-b border-slate-200 h-6 w-full" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Marking Criteria */}
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

      {/* Teacher Marking Guide */}
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

    if (!lessonPlan) {
      return (
        <div className="flex-1 ml-60 flex flex-col min-h-screen bg-slate-50">
          {renderTopbar("Lesson Plan", "")}
          <div className="flex-1 flex flex-col items-center justify-center gap-5 min-h-[60vh]">
            <div className="text-4xl">⚠️</div>
            <div className="text-[17px] font-semibold text-foreground">Couldn't load the lesson plan</div>
            <div className="text-[13px] text-slate-500 max-w-sm text-center">The AI service may be temporarily unavailable. You can go back and try again, or return to your search results.</div>
            <div className="flex gap-3 mt-2">
              <button
                onClick={() => navigate('results')}
                className="bg-primary text-white border-none px-5 py-2.5 rounded-xl text-[13px] font-semibold cursor-pointer hover:bg-teal-700"
              >
                ← Back to results
              </button>
              <button
                onClick={() => navigate('dashboard')}
                className="bg-slate-100 text-slate-600 border-none px-5 py-2.5 rounded-xl text-[13px] font-semibold cursor-pointer hover:bg-slate-200"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }
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
                  onClick={() => { handleSelectClass(cls); navigate('dashboard'); }}
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
      {renderQRModal()}
      {isOffline && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white text-[13px] font-medium text-center py-2 px-4">
          You are offline — showing cached content. New searches will resume when connected.
        </div>
      )}
      {renderSidebar()}
      {currentScreen === 'dashboard' && renderDashboard()}
      {currentScreen === 'classes' && renderMyClasses()}
      {currentScreen === 'unit-planner' && (
        <UnitPlanner
          unitContext={unitContext}
          onUpdate={setUnitContext}
          onContinue={() => navigate('search')}
          onSkip={() => navigate('search')}
          voiceLang={voiceLang}
        />
      )}
      {currentScreen === 'search' && renderInputForm()}
      {currentScreen === 'results' && renderResults()}
      {currentScreen === 'lesson' && renderLessonPlan()}
      {currentScreen === 'slideshow' && slidedeckData && (
        <Slideshow
          data={slidedeckData}
          onClose={() => navigate('lesson')}
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
            navigate('results');
          }}
          onLoadLesson={(l: SavedLesson) => {
            setLessonPlan({ resourceType: 'Lesson Plan', outcomeCode: '', outcomeDescription: l.topic, successCriteria: [], objective: l.objective, duration: l.duration, activities: l.activities, localExample: l.localExample, questions: l.questions, usedFallback: false });
            setTeacherNotes('Loaded from library.');
            setSearchParams(prev => ({ ...prev, subject: l.subject, yearLevel: l.yearLevel, topic: l.topic }));
            navigate('lesson');
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
            navigate('search');
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
