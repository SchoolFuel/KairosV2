import React from "react";
import { X, Calendar, User, Users, BookOpen } from "lucide-react";

export default function StandardsRoadmapDialog() {
  const closeDialog = () => {
    if (google && google.script && google.script.host) {
      google.script.host.close();
    }
  };

  const [activeTab, setActiveTab] = React.useState("overview");

  return (
    <div className="h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white shadow-sm">
        <div className="px-6 py-4 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs uppercase tracking-wide text-slate-400">
              Standards view  My Roadmap
            </div>
            <div className="text-sm text-slate-500">
              Jake L.  Science  09/0110/15
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-slate-500 mt-1">
              <div className="flex items-center gap-1">
                <span className="font-semibold text-slate-700">Student</span>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 flex items-center gap-1">
                  <User className="w-3 h-3" />
                  Jake L.
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-semibold text-slate-700">Group</span>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  AZ Water Project Team
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-semibold text-slate-700">Subject</span>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 flex items-center gap-1">
                  <BookOpen className="w-3 h-3" />
                  Science  HS.E1
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-semibold text-slate-700">Dates</span>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  09/01  10/15
                </span>
              </div>
            </div>

            <div className="mt-4 flex border-b border-slate-200 text-sm">
              <button
                type="button"
                onClick={() => setActiveTab("overview")}
                className={`px-4 py-2 border-b-2 font-semibold transition-colors ${
                  activeTab === "overview"
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                Overview by standards
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("evidence")}
                className={`px-4 py-2 border-b-2 font-semibold transition-colors ${
                  activeTab === "evidence"
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                Student evidence detail
              </button>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="text-xs text-slate-400 mt-1">Custom dialog</div>
            <button
              type="button"
              onClick={closeDialog}
              className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {activeTab === "overview" ? (
          <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)] gap-4">
            {/* Left column: completion + table */}
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="text-sm font-semibold text-slate-800">
                    Standards completion
                  </div>
                  <div className="text-xs text-slate-500">
                    Percentages by standard for current filters
                  </div>
                </div>
                <div className="text-xs text-slate-500">
                  Students in view: <span className="font-semibold text-slate-800">1</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4 text-xs">
                <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-600">Standards with activity</span>
                    <span className="font-semibold text-slate-800">18 / 24</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
                    <div className="h-full w-3/4 rounded-full bg-fuchsia-500" />
                  </div>
                </div>
                <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-600">Fully mastered</span>
                    <span className="font-semibold text-slate-800">11 (46%)</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
                    <div className="h-full w-1/2 rounded-full bg-emerald-500" />
                  </div>
                </div>
                <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-600">In progress</span>
                    <span className="font-semibold text-slate-800">7 (29%)</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
                    <div className="h-full w-1/3 rounded-full bg-violet-500" />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs mb-3">
                <div>
                  Avg mastery: <span className="font-semibold text-slate-900">68%</span>
                </div>
                <div className="flex items-center gap-1 text-emerald-600 text-[11px] bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Live from curated.student_academic_history
                </div>
              </div>

              <div className="border-t border-slate-200 pt-3 mt-3 text-xs">
                <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)_minmax(0,0.6fr)_minmax(0,0.8fr)] gap-3 mb-2 text-slate-500 font-medium">
                  <div>Standard</div>
                  <div>Mastery</div>
                  <div>Tasks</div>
                  <div>Last evidence</div>
                </div>

                {[
                  {
                    code: "HS.E1U1.13",
                    title: "Climate models & uncertainty",
                    mastery: "82% avg",
                    masteryColor: "bg-fuchsia-100 text-fuchsia-700",
                    tasks: "5 tasks",
                    lastEvidence: "10/10",
                  },
                  {
                    code: "HS.E2U1.15",
                    title: "Human impact on water systems",
                    mastery: "61% avg",
                    masteryColor: "bg-amber-100 text-amber-700",
                    tasks: "4 tasks",
                    lastEvidence: "10/07",
                  },
                  {
                    code: "HS.E1U3.10",
                    title: "Data analysis & argumentation",
                    mastery: "40% avg",
                    masteryColor: "bg-rose-100 text-rose-700",
                    tasks: "2 tasks",
                    lastEvidence: "09/28",
                  },
                ].map((row) => (
                  <div
                    key={row.code}
                    className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)_minmax(0,0.6fr)_minmax(0,0.8fr)] gap-3 py-2 border-t border-slate-100 text-xs"
                  >
                    <div>
                      <div className="font-semibold text-slate-900 text-[13px]">
                        {row.code}
                      </div>
                      <div className="text-slate-600 text-[12px] mb-1">
                        {row.title}
                      </div>
                      <button className="text-[11px] text-indigo-600 hover:text-indigo-700 font-medium">
                        Open detail in dialog
                      </button>
                    </div>
                    <div className="flex items-center">
                      <span
                        className={`inline-flex px-2 py-1 rounded-full text-[11px] font-semibold ${row.masteryColor}`}
                      >
                        {row.mastery}
                      </span>
                    </div>
                    <div className="flex items-center text-sky-700 font-medium">
                      {row.tasks}
                    </div>
                    <div className="flex items-center text-slate-700">
                      {row.lastEvidence}
                    </div>
                  </div>
                ))}
              </div>
              </div>
            </div>

            {/* Right column: no-activity standards */}
            <div className="space-y-3">
              <div className="bg-rose-50 border border-rose-200 rounded-xl shadow-sm p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="text-sm font-semibold text-rose-800">
                    Standards with no activity
                  </div>
                  <div className="text-xs text-rose-700">
                    Use this list to plan upcoming lessons and tasks.
                  </div>
                </div>
                <div className="text-xs font-semibold text-rose-800 bg-rose-100 px-2 py-1 rounded-full">
                  6 standards
                </div>
              </div>

              <div className="grid grid-cols-[minmax(0,1.1fr)_minmax(0,1.3fr)] gap-3 mt-3 text-xs">
                <div className="space-y-2">
                  {[
                    "HS.E1U1.12",
                    "HS.E2U3.16",
                    "HS.E1U2.11",
                  ].map((code) => (
                    <div
                      key={code}
                      className="bg-rose-100 rounded-lg px-3 py-2 border border-rose-200 text-rose-800 text-[12px] font-medium"
                    >
                      {code}
                    </div>
                  ))}
                </div>

                <div className="bg-white rounded-lg border border-rose-200 p-3 text-xs text-rose-900 space-y-2">
                  <div className="font-semibold">
                    HS.E1U1.12  Energy transfer in Earth systems
                  </div>
                  <div className="text-[12px] leading-snug">
                    Suggestion: Add a short formative checkpoint using AZ Water
                    Project data (heat, evaporation, and groundwater recharge).
                    Tag as "Entry ticket" and align to HS.E1U1.12.
                  </div>
                  <div className="text-[11px] text-rose-700">
                    Students impacted: Jake L., Lilly M. (10), Russell P. (10)
                  </div>
                </div>
              </div>

              <div className="mt-3 text-[11px] text-rose-700 flex justify-between">
                <span>Sorted by roadmap priority & gaps.</span>
                <span>Screen 3: planning view</span>
              </div>
            </div>

            <div className="flex justify-end gap-4 text-xs text-sky-700">
              <button className="hover:underline">Export to sheet</button>
              <button className="hover:underline">Send to family report</button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-full max-w-3xl bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mt-1">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="text-sm font-semibold text-slate-900">
                    Evidence by student
                  </div>
                  <div className="text-xs text-slate-500 mb-2">
                    Click a standard to drill into tasks, scores & comments.
                  </div>
                  <div className="text-[11px] text-slate-500 max-w-xl leading-snug">
                    This screen represents a deeper drill-down (screen 3) while still using the
                    same custom dialog. Teachers can move between overview and evidence without
                    closing the window.
                  </div>
                </div>
                <div className="text-xs text-slate-600 text-right">
                  <div className="uppercase tracking-wide text-slate-400 mb-1">
                    Standard
                  </div>
                  <div className="font-semibold text-slate-900">HS.E1U1.13</div>
                </div>
              </div>

              <div className="mt-3 border-t border-slate-200 pt-3 text-xs">
                <div className="grid grid-cols-[minmax(0,2.2fr)_minmax(0,0.8fr)_minmax(0,1.2fr)_minmax(0,0.8fr)] gap-4 mb-2 text-slate-500 font-medium">
                  <div>Task</div>
                  <div>Score</div>
                  <div>Evidence</div>
                  <div>Date</div>
                </div>

                {[
                  {
                    task: "Claim–Evidence–Reasoning write-up",
                    scoreLabel: "3 / 4",
                    evidence: "Google Doc rubric",
                    date: "10/10",
                  },
                  {
                    task: "Data visualization draft",
                    scoreLabel: "2 / 4",
                    evidence: "Chart in Slides",
                    date: "10/07",
                  },
                  {
                    task: "Exit ticket – model uncertainty",
                    scoreLabel: "✓",
                    evidence: "Form response",
                    date: "10/02",
                  },
                ].map((row, idx) => (
                  <div
                    key={row.task}
                    className={`grid grid-cols-[minmax(0,2.2fr)_minmax(0,0.8fr)_minmax(0,1.2fr)_minmax(0,0.8fr)] gap-4 py-3 text-xs ${
                      idx === 0 ? "border-t border-slate-100" : "border-t border-slate-100"
                    }`}
                  >
                    <div className="text-slate-800 text-[13px] leading-snug">
                      {row.task}
                    </div>
                    <div className="flex items-center">
                      {row.scoreLabel === "✓" ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-fuchsia-100 text-fuchsia-600 text-sm font-semibold">
                          ✓
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-1 rounded-full bg-fuchsia-100 text-fuchsia-700 text-[11px] font-semibold">
                          {row.scoreLabel}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center text-slate-700">
                      {row.evidence}
                    </div>
                    <div className="flex items-center text-slate-700">
                      {row.date}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-slate-200 bg-white px-6 py-2 text-[11px] text-slate-500 flex justify-between items-center">
        <div>Press Esc or "Close" to return to full document view.</div>
        <button
          type="button"
          onClick={closeDialog}
          className="px-3 py-1.5 rounded-full border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          Close
        </button>
      </div>
    </div>
  );
}
