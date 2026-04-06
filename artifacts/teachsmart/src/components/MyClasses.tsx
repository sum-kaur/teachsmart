import React, { useState } from "react";
import { Users, Plus, Trash2, BookOpen, Clock, Users2, ArrowLeft, Zap, FileText, Compass } from "lucide-react";

type Resource = {
  id: string;
  name: string;
  type: "Lesson Plan" | "Worksheet" | "Assessment" | "Discussion";
  lastEdited: string;
  status: "Verified" | "Draft";
};

type Class = {
  id: string;
  name: string;
  classCode: string;
  subject: string;
  yearLevel: string;
  state: string;
  studentCount: number;
  resourceCount: number;
  tags: string[];
  createdAt: string;
  resources: Resource[];
};

type Props = {
  onSelectClass?: (classData: Class) => void;
  onGenerateResource?: (classData: Class) => void;
};

export default function MyClasses({ onSelectClass, onGenerateResource }: Props) {
  const [classes, setClasses] = useState<Class[]>([
    {
      id: "1",
      name: "Year 9 Science A",
      classCode: "9S",
      subject: "Science",
      yearLevel: "Year 9",
      state: "NSW",
      studentCount: 28,
      resourceCount: 3,
      tags: ["Mixed Ability", "EAL/ID"],
      createdAt: new Date().toISOString(),
      resources: [
        { id: "r1", name: "Climate Change Impacts", type: "Lesson Plan", lastEdited: "27/10/2022", status: "Verified" },
        { id: "r2", name: "Ecosystems & Biodiversity", type: "Worksheet", lastEdited: "22/10/2022", status: "Verified" },
        { id: "r3", name: "Energy Transfer Quiz", type: "Assessment", lastEdited: "18/10/2022", status: "Draft" },
      ],
    },
    {
      id: "2",
      name: "Year 10 Biology",
      classCode: "10B",
      subject: "Science",
      yearLevel: "Year 10",
      state: "NSW",
      studentCount: 32,
      resourceCount: 5,
      tags: ["Advanced"],
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      resources: [
        { id: "r4", name: "Cell Structure Review", type: "Worksheet", lastEdited: "20/10/2022", status: "Verified" },
        { id: "r5", name: "Genetics Case Study", type: "Lesson Plan", lastEdited: "18/10/2022", status: "Verified" },
        { id: "r6", name: "Biology Exam Practice", type: "Assessment", lastEdited: "16/10/2022", status: "Draft" },
        { id: "r7", name: "Lab Safety Quiz", type: "Discussion", lastEdited: "14/10/2022", status: "Verified" },
        { id: "r8", name: "Ecosystems Poster Task", type: "Worksheet", lastEdited: "12/10/2022", status: "Verified" },
      ],
    },
    {
      id: "3",
      name: "Year 9 Mathematics",
      classCode: "9M",
      subject: "Mathematics",
      yearLevel: "Year 9",
      state: "NSW",
      studentCount: 26,
      resourceCount: 4,
      tags: ["Mixed Ability"],
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      resources: [
        { id: "r9", name: "Algebraic Expressions", type: "Lesson Plan", lastEdited: "24/10/2022", status: "Verified" },
        { id: "r10", name: "Number Patterns Practice", type: "Worksheet", lastEdited: "21/10/2022", status: "Verified" },
        { id: "r11", name: "Statistics Quiz", type: "Assessment", lastEdited: "19/10/2022", status: "Draft" },
        { id: "r12", name: "Maths Problem Solving", type: "Discussion", lastEdited: "17/10/2022", status: "Verified" },
      ],
    },
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [newClass, setNewClass] = useState({ name: "", subject: "Science", yearLevel: "Year 9", studentCount: 0 });

  const handleAddClass = () => {
    if (!newClass.name.trim()) return;
    const classCode = newClass.name.split(' ')[0].charAt(0) + newClass.name.split(' ')[newClass.name.split(' ').length - 1].charAt(0);
    const classData: Class = {
      id: Date.now().toString(),
      name: newClass.name,
      classCode: classCode.toUpperCase(),
      subject: newClass.subject,
      yearLevel: newClass.yearLevel,
      state: "NSW",
      studentCount: newClass.studentCount,
      resourceCount: 0,
      tags: [],
      createdAt: new Date().toISOString(),
      resources: [],
    };
    setClasses([...classes, classData]);
    setNewClass({ name: "", subject: "Science", yearLevel: "Year 9", studentCount: 0 });
    setShowAddForm(false);
  };

  const handleDeleteClass = (id: string) => {
    setClasses(classes.filter(c => c.id !== id));
  };

  const formatDate = (iso: string) => {
    const date = new Date(iso);
    return date.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="flex-1 ml-60 flex flex-col min-h-screen bg-slate-50">
      <div className="bg-white px-8 py-5 border-b border-border">
        <div className="font-serif text-[22px] text-foreground tracking-tight">My Classes</div>
        <div className="text-[13px] text-muted-foreground mt-0.5">Manage your classes and student groups</div>
      </div>

      <div className="p-8 flex-1">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="text-[13px] font-semibold text-slate-600 uppercase tracking-wider">
              {selectedClass ? selectedClass.name : `${classes.length} Active Classes`}
            </div>
            {!selectedClass && (
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer hover:bg-teal-700 transition-colors border-none shadow-sm"
                aria-label="Add new class"
              >
                <Plus className="w-4 h-4" /> New Class
              </button>
            )}
          </div>

          {showAddForm && (
            <div className="bg-white rounded-xl border border-border p-6 mb-6 shadow-sm">
              <div className="text-sm font-semibold text-foreground mb-4">Create New Class</div>
              <div className="grid grid-cols-4 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-medium text-slate-600">Class Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Year 9 Science A"
                    className="px-3.5 py-2.5 border border-border rounded-lg text-sm bg-white outline-none focus:border-primary transition-colors"
                    value={newClass.name}
                    onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-medium text-slate-600">Subject</label>
                  <select
                    className="px-3.5 py-2.5 border border-border rounded-lg text-sm bg-white outline-none focus:border-primary transition-colors appearance-none cursor-pointer"
                    value={newClass.subject}
                    onChange={(e) => setNewClass({ ...newClass, subject: e.target.value })}
                  >
                    {['Science', 'Mathematics', 'English', 'History', 'Geography', 'Health and Physical Education', 'Technologies', 'The Arts'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-medium text-slate-600">Year Level</label>
                  <select
                    className="px-3.5 py-2.5 border border-border rounded-lg text-sm bg-white outline-none focus:border-primary transition-colors appearance-none cursor-pointer"
                    value={newClass.yearLevel}
                    onChange={(e) => setNewClass({ ...newClass, yearLevel: e.target.value })}
                  >
                    {['Year 7', 'Year 8', 'Year 9', 'Year 10', 'Year 11', 'Year 12'].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-medium text-slate-600">Number of Students</label>
                  <input
                    type="number"
                    placeholder="e.g. 28"
                    min="0"
                    className="px-3.5 py-2.5 border border-border rounded-lg text-sm bg-white outline-none focus:border-primary transition-colors"
                    value={newClass.studentCount}
                    onChange={(e) => setNewClass({ ...newClass, studentCount: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-4 pt-4 border-t border-border">
                <button
                  onClick={handleAddClass}
                  className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer hover:bg-teal-700 transition-colors border-none"
                >
                  <Plus className="w-4 h-4" /> Create Class
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="flex items-center gap-2 bg-white text-slate-600 px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer hover:border-primary border border-border transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="grid gap-4">
            {selectedClass ? (
              // Class Detail View
              <div>
                <button
                  onClick={() => setSelectedClass(null)}
                  className="flex items-center gap-1.5 text-[13px] font-medium text-slate-500 hover:text-primary mb-4 bg-transparent border-none cursor-pointer transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to all classes
                </button>

                <div className="bg-white rounded-xl border border-border p-6 mb-6 shadow-sm">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center text-xl font-bold text-slate-600">
                        {selectedClass.classCode}
                      </div>
                      <div>
                        <div className="text-xl font-bold text-foreground mb-1">{selectedClass.name}</div>
                        <div className="flex items-center gap-3 text-[13px] text-slate-600 mb-2">
                          <span className="flex items-center gap-1">
                            <Users2 className="w-4 h-4" /> {selectedClass.studentCount} students
                          </span>
                          <span>{selectedClass.state}</span>
                        </div>
                        <div className="flex gap-2">
                          {selectedClass.tags.map((tag) => (
                            <span key={tag} className="bg-amber-100 text-amber-800 text-[11px] font-semibold px-2.5 py-1 rounded-full">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => onGenerateResource?.(selectedClass)}
                      className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-lg text-sm font-semibold cursor-pointer hover:bg-teal-700 transition-colors border-none shadow-sm">
                      <Compass className="w-4 h-4" /> Generate Resource
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
                    <div>
                      <div className="text-sm font-semibold text-foreground">Resources for this class</div>
                    </div>
                    <span className="text-[12px] text-slate-500">{selectedClass.resources.length} total</span>
                  </div>

                  {selectedClass.resources.length === 0 ? (
                    <div className="text-center py-8">
                      <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <div className="text-sm text-slate-500">No resources yet. Generate your first resource!</div>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border text-[12px] font-semibold text-slate-600 uppercase tracking-wider">
                            <th className="text-left py-3 px-0">Name</th>
                            <th className="text-left py-3 px-0">Type</th>
                            <th className="text-left py-3 px-0">Last Edited</th>
                            <th className="text-left py-3 px-0">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedClass.resources.map((resource) => (
                            <tr key={resource.id} className="border-b border-border hover:bg-slate-50 transition-colors">
                              <td className="py-3.5 px-0">
                                <div className="flex items-center gap-2">
                                  <FileText className="w-4 h-4 text-slate-400" />
                                  <span className="text-sm font-medium text-slate-700">{resource.name}</span>
                                </div>
                              </td>
                              <td className="py-3.5 px-0 text-sm text-slate-600">{resource.type}</td>
                              <td className="py-3.5 px-0 text-sm text-slate-600">{resource.lastEdited}</td>
                              <td className="py-3.5 px-0">
                                <span
                                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                                    resource.status === "Verified"
                                      ? "bg-green-100 text-green-700"
                                      : "bg-slate-100 text-slate-600"
                                  }`}
                                >
                                  {resource.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            ) : classes.length === 0 ? (
              // Empty State
              <div className="bg-white rounded-xl border border-border p-12 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-slate-400" />
                </div>
                <div className="text-sm font-semibold text-slate-600 mb-1">No classes yet</div>
                <div className="text-sm text-slate-500 mb-4">Create your first class to get started</div>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer hover:bg-teal-700 transition-colors border-none"
                >
                  <Plus className="w-4 h-4" /> Create Class
                </button>
              </div>
            ) : (
              // Classes List
              classes.map((classData) => (
                <div
                  key={classData.id}
                  onClick={() => setSelectedClass(classData)}
                  className="bg-white rounded-xl border border-border p-5 hover:border-primary hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="text-base font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">{classData.name}</div>
                      <div className="text-[13px] text-slate-500 mb-3">
                        {classData.subject} · {classData.yearLevel}
                      </div>
                      <div className="flex gap-4">
                        <div className="flex items-center gap-1.5 text-[12px] text-slate-600">
                          <Users2 className="w-4 h-4 text-slate-400" />
                          <span>{classData.studentCount} students</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[12px] text-slate-600">
                          <BookOpen className="w-4 h-4 text-slate-400" />
                          <span>{classData.resources.length} resources</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[12px] text-slate-600">
                          <Clock className="w-4 h-4 text-slate-400" />
                          <span>Created {formatDate(classData.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClass(classData.id);
                      }}
                      className="ml-4 p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors bg-transparent border-none cursor-pointer"
                      aria-label="Delete class"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
