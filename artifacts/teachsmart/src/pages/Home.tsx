import React, { useState } from "react";
import { 
  BookOpen, Compass, Search, FileText, Download, Edit, ArrowLeft, 
  CheckCircle, Settings, Home as HomeIcon, FileStack, BarChart3
} from "lucide-react";
import { 
  useGetDashboardStats, 
  useGetRecentResources, 
  useGetAlignment,
  useGetResources,
  useGenerateLesson
} from "@workspace/api-client-react";

type AlignmentResult = {
  alignmentScore: number;
  syllabus: string;
  strand: string;
  outcomes: { id: string; description: string }[];
  notes: string;
  usedFallback: boolean;
};

type Resource = {
  id: string;
  title: string;
  source: string;
  type: string;
  description: string;
  alignmentScore: number;
  safetyRating: string;
  biasFlag: string;
  localContextTags: string[];
  outcomeIds: string[];
};

type LessonPlan = {
  objective: string;
  duration: string;
  activities: { label: string; text: string }[];
  localExample: { title: string; body: string };
  questions: { q: string; difficulty: string }[];
  usedFallback: boolean;
};

const MOCK_DASHBOARD_STATS = {
  totalSearches: 124,
  resourcesGenerated: 89,
  averageAlignmentScore: 92,
  topSubject: "Science"
};

const MOCK_RECENT_RESOURCES = [
  { id: "1", title: "Climate Change Impacts", subject: "Science", yearLevel: "Year 9", topic: "Climate Change", alignmentScore: 94, searchedAt: new Date().toISOString() },
  { id: "2", title: "Algebraic Expressions", subject: "Mathematics", yearLevel: "Year 8", topic: "Algebra", alignmentScore: 88, searchedAt: new Date(Date.now() - 86400000).toISOString() },
  { id: "3", title: "Poetry Analysis", subject: "English", yearLevel: "Year 10", topic: "Poetry", alignmentScore: 91, searchedAt: new Date(Date.now() - 172800000).toISOString() }
];

type Screen = 'dashboard' | 'search' | 'results' | 'lesson';

export default function Home() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('dashboard');
  const [searchParams, setSearchParams] = useState({
    yearLevel: 'Year 9',
    state: 'NSW',
    subject: 'Science',
    topic: '',
    resourceType: 'Lesson Plan',
    classContext: [] as string[]
  });
  
  const [isSearching, setIsSearching] = useState(false);
  const [isGeneratingLesson, setIsGeneratingLesson] = useState(false);
  const [alignmentResult, setAlignmentResult] = useState<AlignmentResult | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [lessonPlan, setLessonPlan] = useState<LessonPlan | null>(null);
  const [teacherNotes, setTeacherNotes] = useState('');
  
  const { data: dashboardStats = MOCK_DASHBOARD_STATS } = useGetDashboardStats();
  const { data: recentResources = MOCK_RECENT_RESOURCES } = useGetRecentResources();
  
  const alignmentMutation = useGetAlignment();
  const resourcesMutation = useGetResources();
  const lessonMutation = useGenerateLesson();

  const handleSearch = async () => {
    if (!searchParams.topic) return;
    
    setIsSearching(true);
    setCurrentScreen('search');
    
    try {
      const alignment = await alignmentMutation.mutateAsync({
        data: {
          subject: searchParams.subject,
          yearLevel: searchParams.yearLevel,
          topic: searchParams.topic,
          state: searchParams.state,
        }
      });

      setAlignmentResult(alignment);

      const resourcesResult = await resourcesMutation.mutateAsync({
        data: {
          subject: searchParams.subject,
          yearLevel: searchParams.yearLevel,
          topic: searchParams.topic,
          state: searchParams.state,
          alignmentResult: alignment,
        }
      });

      setResources(resourcesResult.resources);
    } catch {
      setAlignmentResult({
        alignmentScore: 88,
        syllabus: `${searchParams.state} ${searchParams.subject} ${searchParams.yearLevel}`,
        strand: "Core Strand",
        outcomes: [{ id: "AC9-FALLBACK", description: `Core ${searchParams.subject} outcome for ${searchParams.yearLevel} students studying ${searchParams.topic}.` }],
        notes: "Fallback alignment data used.",
        usedFallback: true,
      });
      setResources([]);
    } finally {
      setIsSearching(false);
      setCurrentScreen('results');
    }
  };

  const handleAdaptResource = async (resource: Resource) => {
    if (!alignmentResult) return;

    setSelectedResource(resource);
    setIsGeneratingLesson(true);
    setCurrentScreen('lesson');

    try {
      const lesson = await lessonMutation.mutateAsync({
        data: {
          subject: searchParams.subject,
          yearLevel: searchParams.yearLevel,
          topic: searchParams.topic,
          state: searchParams.state,
          resource,
          alignmentResult,
          classContext: searchParams.classContext,
        }
      });

      setLessonPlan(lesson);
      setTeacherNotes(`Ensure students understand the key concepts of ${searchParams.topic} before the data analysis activities.`);
    } catch {
      setLessonPlan({
        objective: `Students explore ${searchParams.topic} using Australian curriculum-aligned resources, developing critical thinking and analytical skills.`,
        duration: "60 minutes",
        activities: [
          { label: "Hook (5 min)", text: `Engage students with a thought-provoking question or image related to ${searchParams.topic}.` },
          { label: "Explore (20 min)", text: "Students investigate the core concepts through guided inquiry activities using provided resources." },
          { label: "Analyse (15 min)", text: "Groups discuss and analyse findings, connecting concepts to Australian contexts." },
          { label: "Evaluate (15 min)", text: "Class evaluates evidence and forms reasoned conclusions about the topic." },
          { label: "Reflect (5 min)", text: "Exit ticket: Students record one key learning and one remaining question." },
        ],
        localExample: {
          title: "Australian Context",
          body: `Connect ${searchParams.topic} to local examples relevant to ${searchParams.state} students, drawing on real Australian case studies and data.`,
        },
        questions: [
          { q: `Define the key concepts of ${searchParams.topic} in your own words.`, difficulty: "foundation" },
          { q: `Explain two ways ${searchParams.topic} is relevant to Australian students.`, difficulty: "foundation" },
          { q: `Analyse the evidence and explain how it supports or challenges our understanding of ${searchParams.topic}.`, difficulty: "core" },
          { q: `Compare different perspectives on ${searchParams.topic} and evaluate which is best supported by evidence.`, difficulty: "core" },
          { q: `Critically evaluate the limitations of current approaches to ${searchParams.topic} and propose evidence-based alternatives.`, difficulty: "extension" },
        ],
        usedFallback: true,
      });
      setTeacherNotes(`Ensure students understand the key concepts of ${searchParams.topic} before starting.`);
    } finally {
      setIsGeneratingLesson(false);
    }
  };

  const renderSidebar = () => (
    <nav className="w-60 bg-sidebar text-sidebar-foreground flex flex-col py-7 fixed top-0 left-0 bottom-0 z-50">
      <div className="px-6 pb-8 mb-5 flex items-center gap-3 border-b border-white/10">
        <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center text-lg">
          <BookOpen className="w-5 h-5 text-white" />
        </div>
        <span className="font-serif text-white text-xl tracking-tight">TeachSmart</span>
      </div>
      
      <button 
        onClick={() => setCurrentScreen('dashboard')}
        className={`flex items-center gap-3 px-6 py-3 text-sm font-medium cursor-pointer transition-colors border-l-4 ${currentScreen === 'dashboard' ? 'text-primary border-primary bg-primary/10' : 'text-slate-400 border-transparent hover:text-white hover:bg-white/5'}`}
        data-testid="nav-dashboard"
      >
        <HomeIcon className="w-4 h-4" /> Dashboard
      </button>
      
      <button 
        onClick={() => setCurrentScreen('search')}
        className={`flex items-center gap-3 px-6 py-3 text-sm font-medium cursor-pointer transition-colors border-l-4 ${['search', 'results', 'lesson'].includes(currentScreen) ? 'text-primary border-primary bg-primary/10' : 'text-slate-400 border-transparent hover:text-white hover:bg-white/5'}`}
        data-testid="nav-new-resource"
      >
        <Compass className="w-4 h-4" /> New Resource
      </button>
      
      <button className="flex items-center gap-3 px-6 py-3 text-sm font-medium text-slate-400 border-l-4 border-transparent hover:text-white hover:bg-white/5 cursor-pointer transition-colors">
        <FileStack className="w-4 h-4" /> My Library
      </button>
      
      <button className="flex items-center gap-3 px-6 py-3 text-sm font-medium text-slate-400 border-l-4 border-transparent hover:text-white hover:bg-white/5 cursor-pointer transition-colors">
        <BarChart3 className="w-4 h-4" /> Insights
      </button>
      
      <button className="flex items-center gap-3 px-6 py-3 text-sm font-medium text-slate-400 border-l-4 border-transparent hover:text-white hover:bg-white/5 cursor-pointer transition-colors">
        <Settings className="w-4 h-4" /> Settings
      </button>
      
      <div className="mt-auto px-6 pt-5 border-t border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center text-sm font-semibold text-white">
            SJ
          </div>
          <div>
            <div className="text-[13px] font-medium text-slate-300">Sarah Johnson</div>
            <div className="text-[11px] text-slate-500">Science · Year 9-10</div>
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
      <div className="flex gap-2">
        <div className="flex items-center gap-1.5 bg-green-100 text-green-700 text-[11px] font-semibold px-2.5 py-1 rounded-full">
          <CheckCircle className="w-3 h-3" /> {searchParams.state} Aligned
        </div>
        <div className="flex items-center gap-1.5 bg-blue-100 text-blue-700 text-[11px] font-semibold px-2.5 py-1 rounded-full">
          <Edit className="w-3 h-3" /> Bias Checked
        </div>
      </div>
    </div>
  );

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

        <div className="grid grid-cols-2 gap-4 mb-7">
          <div 
            onClick={() => setCurrentScreen('search')}
            className="bg-white rounded-xl shadow-sm border border-border p-7 cursor-pointer hover:border-primary hover:shadow-md transition-all hover:-translate-y-0.5 group"
            data-testid="card-generate-resource"
          >
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Compass className="w-6 h-6" />
            </div>
            <div className="text-base font-bold text-foreground mb-1.5">Generate Resource</div>
            <div className="text-sm text-muted-foreground leading-relaxed">Search for curriculum-aligned materials, lesson plans, and worksheets tailored to your students.</div>
          </div>
          
          <div 
            className="bg-white rounded-xl shadow-sm border border-border p-7 cursor-pointer hover:border-primary hover:shadow-md transition-all hover:-translate-y-0.5 group"
            data-testid="card-adapt-file"
          >
            <div className="w-12 h-12 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <FileText className="w-6 h-6" />
            </div>
            <div className="text-base font-bold text-foreground mb-1.5">Adapt Existing File</div>
            <div className="text-sm text-muted-foreground leading-relaxed">Upload a PDF or Word document to align it with curriculum standards or differentiate for your class.</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border text-sm font-semibold text-foreground">Recent Resources</div>
          <div className="divide-y divide-border">
            {recentResources.map((resource, i) => (
              <div key={resource.id} className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] px-6 py-3.5 items-center text-sm hover:bg-slate-50 transition-colors" data-testid={`recent-resource-${i}`}>
                <div className="font-medium text-foreground">{resource.title}</div>
                <div className="text-muted-foreground">{resource.subject}</div>
                <div className="text-muted-foreground">{resource.yearLevel}</div>
                <div className="text-muted-foreground">{resource.alignmentScore}% Match</div>
                <div className="flex gap-2">
                  <span className="bg-green-100 text-green-700 text-[11px] font-semibold px-2.5 py-1 rounded-full">Verified</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderInputForm = () => {
    if (isSearching) {
      return (
        <div className="flex-1 ml-60 flex flex-col min-h-screen bg-slate-50">
          {renderTopbar("Searching Resources", "Finding curriculum-aligned content...")}
          <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] gap-5">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-primary rounded-full animate-spin"></div>
            <div className="text-[15px] text-muted-foreground">Scanning syllabus databases...</div>
            <div className="flex flex-col gap-2 mt-2">
              <div className="flex items-center gap-2.5 text-[13px] text-primary">
                <CheckCircle className="w-4 h-4" /> Analysing topic alignment
              </div>
              <div className="flex items-center gap-2.5 text-[13px] text-primary">
                <CheckCircle className="w-4 h-4" /> Checking for local context
              </div>
              <div className="flex items-center gap-2.5 text-[13px] text-slate-500">
                <Search className="w-4 h-4" /> Filtering appropriate resources...
              </div>
            </div>
          </div>
        </div>
      );
    }

    const toggleClassContext = (ctx: string) => {
      setSearchParams(prev => ({
        ...prev,
        classContext: prev.classContext.includes(ctx) 
          ? prev.classContext.filter(c => c !== ctx)
          : [...prev.classContext, ctx]
      }));
    };

    return (
      <div className="flex-1 ml-60 flex flex-col min-h-screen bg-slate-50">
        {renderTopbar("New Resource", "Define your requirements")}
        
        <div className="p-8 flex-1">
          <div className="bg-white rounded-xl shadow-sm border border-border p-10 max-w-4xl mx-auto">
            <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-4">Curriculum Target</div>
            
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-slate-600">Year Level</label>
                <select 
                  className="px-3.5 py-2.5 border border-border rounded-lg text-sm bg-white outline-none focus:border-primary transition-colors appearance-none cursor-pointer"
                  value={searchParams.yearLevel}
                  onChange={(e) => setSearchParams({...searchParams, yearLevel: e.target.value})}
                  data-testid="select-year-level"
                >
                  {['Year 7', 'Year 8', 'Year 9', 'Year 10', 'Year 11', 'Year 12'].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-slate-600">State</label>
                <select 
                  className="px-3.5 py-2.5 border border-border rounded-lg text-sm bg-white outline-none focus:border-primary transition-colors appearance-none cursor-pointer"
                  value={searchParams.state}
                  onChange={(e) => setSearchParams({...searchParams, state: e.target.value})}
                  data-testid="select-state"
                >
                  {['NSW', 'QLD', 'VIC', 'WA', 'SA', 'TAS', 'ACT', 'NT'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-slate-600">Subject</label>
                <select 
                  className="px-3.5 py-2.5 border border-border rounded-lg text-sm bg-white outline-none focus:border-primary transition-colors appearance-none cursor-pointer"
                  value={searchParams.subject}
                  onChange={(e) => setSearchParams({...searchParams, subject: e.target.value})}
                  data-testid="select-subject"
                >
                  {['Science', 'Mathematics', 'English', 'History', 'Geography', 'Health and Physical Education', 'Technologies', 'The Arts'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            
            <div className="flex flex-col gap-1.5 mb-6">
              <label className="text-[13px] font-medium text-slate-600">Topic or Specific Outcome</label>
              <input 
                type="text" 
                className="px-3.5 py-2.5 border border-border rounded-lg text-sm bg-white outline-none focus:border-primary transition-colors"
                placeholder="e.g. Climate change impacts, Algebraic fractions, Natural selection..."
                value={searchParams.topic}
                onChange={(e) => setSearchParams({...searchParams, topic: e.target.value})}
                data-testid="input-topic"
              />
            </div>

            <hr className="border-t border-border my-7" />
            
            <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-4">Resource Details</div>
            
            <div className="grid grid-cols-4 gap-3 mb-6">
              {[
                { icon: "📄", label: "Lesson Plan" },
                { icon: "📋", label: "Worksheet" },
                { icon: "💬", label: "Discussion" },
                { icon: "✏️", label: "Assessment" }
              ].map(type => (
                <div 
                  key={type.label}
                  className={`border rounded-lg p-4 text-center cursor-pointer transition-colors ${searchParams.resourceType === type.label ? 'border-primary bg-teal-50' : 'border-border bg-white hover:border-primary'}`}
                  onClick={() => setSearchParams({...searchParams, resourceType: type.label})}
                  data-testid={`resource-type-${type.label.replace(/\s+/g, '-').toLowerCase()}`}
                >
                  <div className="text-2xl mb-2">{type.icon}</div>
                  <div className={`text-xs font-semibold ${searchParams.resourceType === type.label ? 'text-teal-800' : 'text-slate-600'}`}>{type.label}</div>
                </div>
              ))}
            </div>

            <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-4">Class Context (Optional)</div>
            <div className="flex flex-wrap gap-2 mb-8">
              {['Mixed Ability', 'EAL/D', 'High Achievers', 'Learning Support', 'Inquiry-Based'].map(ctx => (
                <div 
                  key={ctx}
                  className={`px-3.5 py-1.5 rounded-full border text-[13px] font-medium cursor-pointer transition-colors select-none
                    ${searchParams.classContext.includes(ctx) ? 'border-primary bg-teal-50 text-teal-800' : 'border-border bg-white text-slate-600 hover:border-primary hover:text-primary'}`}
                  onClick={() => toggleClassContext(ctx)}
                  data-testid={`chip-${ctx.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`}
                >
                  {ctx}
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setCurrentScreen('dashboard')}
                className="bg-white text-slate-600 border border-border px-5 py-2.5 rounded-lg text-sm font-medium hover:border-primary hover:text-primary transition-colors flex items-center gap-2 cursor-pointer"
                data-testid="btn-cancel"
              >
                Cancel
              </button>
              <button 
                onClick={handleSearch}
                disabled={!searchParams.topic}
                className="bg-primary text-white border-none px-7 py-2.5 rounded-lg text-[15px] font-semibold hover:bg-teal-700 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-[1px] shadow-sm hover:shadow"
                data-testid="btn-search"
              >
                <Search className="w-4 h-4" /> Find Resources
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderResults = () => {
    const alignment = alignmentResult;
    
    return (
      <div className="flex-1 ml-60 flex flex-col min-h-screen bg-slate-50">
        {renderTopbar(`Results for "${searchParams.topic}"`, `${searchParams.yearLevel} ${searchParams.subject} · ${searchParams.state}`)}
        
        <div className="p-8 flex-1">
          <div className="flex items-center justify-between mb-5">
            <button 
              onClick={() => setCurrentScreen('search')}
              className="text-[13px] font-medium text-slate-500 hover:text-primary flex items-center gap-1.5 bg-transparent border-none cursor-pointer"
              data-testid="btn-back-to-search"
            >
              <ArrowLeft className="w-4 h-4" /> Back to search
            </button>
            <div className="font-serif text-2xl text-foreground">Discovered Resources</div>
            <div className="w-24"></div>
          </div>

          <div className="grid grid-cols-[260px_1fr] gap-6 max-w-6xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm border border-border p-6 h-fit sticky top-[100px]">
              <div className="text-sm font-semibold text-foreground mb-4">Refine Results</div>
              
              <div className="mb-5">
                <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Quality</div>
                <label className="flex items-center justify-between py-1.5 text-[13px] text-slate-600 cursor-pointer">
                  Verified Only
                  <div className="w-8 h-[18px] bg-primary rounded-full relative before:content-[''] before:absolute before:w-3.5 before:h-3.5 before:bg-white before:rounded-full before:top-[2px] before:left-[2px] before:transition-transform before:translate-x-[14px]"></div>
                </label>
                <label className="flex items-center justify-between py-1.5 text-[13px] text-slate-600 cursor-pointer">
                  Bias Checked
                  <div className="w-8 h-[18px] bg-slate-200 rounded-full relative before:content-[''] before:absolute before:w-3.5 before:h-3.5 before:bg-white before:rounded-full before:top-[2px] before:left-[2px]"></div>
                </label>
                <label className="flex items-center justify-between py-1.5 text-[13px] text-slate-600 cursor-pointer">
                  High Alignment ({'>'}85%)
                  <div className="w-8 h-[18px] bg-primary rounded-full relative before:content-[''] before:absolute before:w-3.5 before:h-3.5 before:bg-white before:rounded-full before:top-[2px] before:left-[2px] before:transition-transform before:translate-x-[14px]"></div>
                </label>
              </div>
              
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Access</div>
                <label className="flex items-center justify-between py-1.5 text-[13px] text-slate-600 cursor-pointer">
                  Free Resources
                  <div className="w-8 h-[18px] bg-slate-200 rounded-full relative before:content-[''] before:absolute before:w-3.5 before:h-3.5 before:bg-white before:rounded-full before:top-[2px] before:left-[2px]"></div>
                </label>
              </div>
            </div>

            <div className="flex flex-col gap-5">
              {alignment && (
                <div className="bg-white rounded-xl shadow-sm border border-border p-5 flex items-center justify-between gap-5">
                  <div className="flex-1">
                    <div className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">Curriculum Alignment</div>
                    <div className="text-[15px] font-semibold text-foreground">{alignment.syllabus}</div>
                    <div className="text-[13px] text-slate-500">{alignment.strand}</div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {alignment.outcomes.slice(0, 4).map(outcome => (
                        <span key={outcome.id} className="bg-teal-50 text-teal-800 text-[11px] font-semibold px-2 py-0.5 rounded">{outcome.id}</span>
                      ))}
                    </div>
                    {alignment.notes && (
                      <div className="text-[13px] text-slate-500 mt-2 leading-relaxed italic">{alignment.notes}</div>
                    )}
                    {alignment.usedFallback && (
                      <div className="text-[11px] text-amber-600 mt-1 font-medium">Using estimated alignment data</div>
                    )}
                  </div>
                  <div className="text-center px-4">
                    <div className="font-serif text-5xl text-primary leading-none">{alignment.alignmentScore}%</div>
                    <div className="text-[11px] font-medium text-slate-500 mt-1">Overall Match</div>
                  </div>
                </div>
              )}

              {resources.length === 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-border p-8 text-center">
                  <div className="text-slate-400 text-[15px]">No resources found. Try a different topic or subject.</div>
                </div>
              )}

              <div className="flex flex-col gap-4">
                {resources.map((resource, i) => (
                  <div key={resource.id} className="bg-white rounded-xl shadow-sm border border-transparent hover:border-teal-300 hover:shadow-md transition-all overflow-hidden" data-testid={`resource-card-${i}`}>
                    <div className="p-5 pb-0">
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {resource.safetyRating === 'verified' && (
                          <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-[11px] font-semibold px-2.5 py-1 rounded-full">
                            <CheckCircle className="w-3 h-3" /> Verified
                          </span>
                        )}
                        {resource.biasFlag === 'low' && (
                          <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-[11px] font-semibold px-2.5 py-1 rounded-full">
                            <Edit className="w-3 h-3" /> Bias Checked
                          </span>
                        )}
                      </div>
                      
                      <div className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 mb-1">{resource.type}</div>
                      <div className="text-[17px] font-semibold text-foreground mb-0.5">{resource.title}</div>
                      <div className="text-[13px] text-slate-500">{resource.source}</div>
                      
                      <div className="text-[14px] text-slate-600 leading-relaxed mt-3 mb-3">
                        {resource.description}
                      </div>
                    </div>

                    <div className="px-6 pb-3 flex flex-wrap gap-1.5">
                      {resource.localContextTags.map(tag => (
                        <span key={tag} className="text-[12px] text-blue-700 bg-blue-50 px-2.5 py-1 rounded font-medium">{tag}</span>
                      ))}
                    </div>

                    <div className="p-3.5 px-6 border-t border-border flex items-center justify-between bg-slate-50/50">
                      <div className="text-[13px] text-slate-500">Alignment: <strong className="text-primary">{resource.alignmentScore}%</strong></div>
                      <button 
                        onClick={() => handleAdaptResource(resource)}
                        className="bg-primary text-white border-none px-4 py-2 rounded-md text-[14px] font-semibold hover:bg-teal-700 transition-all cursor-pointer"
                        data-testid={`btn-adapt-${i}`}
                      >
                        Adapt for {searchParams.yearLevel}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderLessonPlan = () => {
    if (isGeneratingLesson || !lessonPlan) {
      return (
        <div className="flex-1 ml-60 flex flex-col min-h-screen bg-slate-50">
          {renderTopbar("Generating Lesson Plan", "Building your differentiated lesson...")}
          <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] gap-5">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-primary rounded-full animate-spin"></div>
            <div className="text-[15px] text-muted-foreground">Generating your lesson plan...</div>
            <div className="flex flex-col gap-2 mt-2">
              <div className="flex items-center gap-2.5 text-[13px] text-primary">
                <CheckCircle className="w-4 h-4" /> Matching curriculum outcomes
              </div>
              <div className="flex items-center gap-2.5 text-[13px] text-primary">
                <CheckCircle className="w-4 h-4" /> Sourcing local Australian examples
              </div>
              <div className="flex items-center gap-2.5 text-[13px] text-slate-500">
                <FileText className="w-4 h-4" /> Writing differentiated questions...
              </div>
            </div>
          </div>
        </div>
      );
    }

    const resource = selectedResource;

    const getDifficultyColor = (difficulty: string) => {
      if (difficulty === 'foundation') return 'bg-green-100 text-green-700';
      if (difficulty === 'core') return 'bg-blue-100 text-blue-700';
      return 'bg-purple-100 text-purple-700';
    };

    const getDifficultyLabel = (difficulty: string) => {
      if (difficulty === 'foundation') return 'Foundation';
      if (difficulty === 'core') return 'Core';
      return 'Extension';
    };

    return (
      <div className="flex-1 ml-60 flex flex-col min-h-screen bg-slate-50">
        {renderTopbar("Lesson Plan Editor", "Review and customise your generated plan")}
        
        <div className="p-8 flex-1">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-5">
              <button 
                onClick={() => setCurrentScreen('results')}
                className="text-[13px] font-medium text-slate-500 hover:text-primary flex items-center gap-1.5 bg-transparent border-none cursor-pointer"
                data-testid="btn-back-to-results"
              >
                <ArrowLeft className="w-4 h-4" /> Back to results
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-border p-6 mb-5 flex items-center justify-between">
              <div>
                <div className="text-lg font-bold text-foreground">{resource?.title ?? searchParams.topic}</div>
                <div className="text-[13px] text-slate-500 mt-1">{resource?.source} · {searchParams.yearLevel} {searchParams.subject}</div>
                <div className="flex gap-1.5 mt-2.5 flex-wrap">
                  {alignmentResult?.outcomes.slice(0, 3).map(o => (
                    <span key={o.id} className="bg-teal-50 text-teal-800 text-[11px] font-semibold px-2 py-0.5 rounded">{o.id}</span>
                  ))}
                </div>
              </div>
              <div className="flex gap-2.5">
                <button className="bg-white text-slate-600 border border-border px-4 py-2 rounded-md text-sm font-medium hover:border-primary hover:text-primary transition-colors flex items-center gap-2 cursor-pointer">
                  <FileText className="w-4 h-4" /> Google Classroom
                </button>
                <button className="bg-primary text-white border-none px-4 py-2 rounded-md text-sm font-medium hover:bg-teal-700 transition-colors flex items-center gap-2 cursor-pointer shadow-sm">
                  <Download className="w-4 h-4" /> Export PDF
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-border p-7 mb-5">
              <div className="flex items-center gap-4 mb-5 pb-5 border-b border-border">
                <span className="bg-slate-100 text-slate-700 text-[13px] font-semibold px-3.5 py-1.5 rounded-full">{lessonPlan.duration}</span>
                <span className="bg-slate-100 text-slate-700 text-[13px] font-semibold px-3.5 py-1.5 rounded-full">
                  {searchParams.classContext.length > 0 ? searchParams.classContext.join(', ') : 'Standard Class'}
                </span>
                {lessonPlan.usedFallback && (
                  <span className="bg-amber-100 text-amber-700 text-[11px] font-semibold px-3 py-1 rounded-full">Estimated plan</span>
                )}
              </div>
              
              <div className="text-[15px] text-slate-700 leading-relaxed mb-6">
                {lessonPlan.objective}
              </div>

              <div className="flex flex-col gap-3.5">
                {lessonPlan.activities.map((activity, i) => (
                  <div key={i} className="flex gap-3.5 items-start">
                    <div className="w-2 h-2 rounded-full bg-primary mt-[7px] shrink-0"></div>
                    <div>
                      <div className="text-[14px] font-semibold text-foreground mb-0.5">
                        {activity.label}
                      </div>
                      <div className="text-[14px] text-slate-600 leading-relaxed">
                        {activity.text}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-5 shadow-sm">
              <div className="text-[14px] font-bold text-blue-700 mb-2 flex items-center gap-2">
                <Compass className="w-4 h-4" /> Local Australian Context: {lessonPlan.localExample.title}
              </div>
              <div className="text-[14px] text-slate-700 leading-relaxed">
                {lessonPlan.localExample.body}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-border p-7 mb-5">
              <div className="font-serif text-[20px] text-foreground mb-4">Differentiated Questions</div>
              <div className="flex flex-col gap-3">
                {lessonPlan.questions.map((q, i) => (
                  <div key={i} className="p-3.5 border border-border rounded-lg flex items-start gap-3">
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0 mt-0.5 ${getDifficultyColor(q.difficulty)}`}>
                      {getDifficultyLabel(q.difficulty)}
                    </span>
                    <div className="text-[14px] text-slate-700 leading-relaxed pt-0.5">
                      {q.q}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-border p-7 mb-8">
              <div className="font-serif text-[20px] text-foreground mb-3">Teacher Notes</div>
              <textarea 
                className="w-full min-h-[100px] border border-border rounded-lg p-3.5 text-[14px] text-slate-700 resize-y outline-none focus:border-primary transition-colors leading-relaxed"
                value={teacherNotes}
                onChange={(e) => setTeacherNotes(e.target.value)}
                data-testid="textarea-teacher-notes"
              />
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
      {currentScreen === 'search' && renderInputForm()}
      {currentScreen === 'results' && renderResults()}
      {currentScreen === 'lesson' && renderLessonPlan()}
    </div>
  );
}
