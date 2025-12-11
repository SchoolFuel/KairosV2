import React, { useState } from "react";
import { Map, ChevronDown, Calendar, User, Users, BookOpen } from "lucide-react";

export default function MyRoadmap() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [mode, setMode] = useState("Student");
  const [student, setStudent] = useState("");
  const [group, setGroup] = useState("All");
  const [subject, setSubject] = useState("Science – HS.E1");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [snapshotRange, setSnapshotRange] = useState("Last 6 weeks");
  const [scope, setScope] = useState("Standards map only");

  const handleReset = () => {
    setMode("Student");
    setStudent("");
    setGroup("All");
    setSubject("Science – HS.E1");
    setStartDate("");
    setEndDate("");
    setSnapshotRange("Last 6 weeks");
    setScope("Standards map only");
  };

  const handleViewStandards = () => {
    if (google && google.script && google.script.run) {
      google.script.run.openTeacherRoadmapStandards();
    }
  };

  return (
    <div className="w-full max-w-[300px] font-sans" style={{ marginTop: "24px" }}>
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm w-full overflow-hidden transition-all duration-200 mb-3">
        <div
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full p-3 cursor-pointer transition-colors duration-200 hover:bg-gray-50"
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Map className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <div className="font-medium text-gray-900">My Roadmap - Teacher</div>
                <div className="text-sm text-gray-500">Filters for standards view</div>
              </div>
            </div>
            <ChevronDown
              className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                isExpanded ? "rotate-180" : ""
              }`}
            />
          </div>
        </div>

        {isExpanded && (
          <div className="border-t border-gray-100">
            <div className="p-3 space-y-3">
              <div className="text-xs font-semibold text-gray-700 tracking-wide">
                Filters
              </div>

              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] text-gray-500">
                  Choose student, group, subject & dates
                </span>
                <span className="text-[11px] text-gray-400">Sidebar</span>
              </div>

              <div className="flex bg-gray-100 rounded-full p-0.5 text-xs font-medium w-full">
                <button
                  type="button"
                  onClick={() => setMode("Student")}
                  className={`flex-1 flex items-center justify-center gap-1 px-2 py-1 rounded-full transition-colors ${
                    mode === "Student"
                      ? "bg-pink-100 text-pink-700"
                      : "text-gray-600"
                  }`}
                >
                  <User className="w-3 h-3" />
                  <span>Student</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMode("Group")}
                  className={`flex-1 flex items-center justify-center gap-1 px-2 py-1 rounded-full transition-colors ${
                    mode === "Group"
                      ? "bg-pink-100 text-pink-700"
                      : "text-gray-600"
                  }`}
                >
                  <Users className="w-3 h-3" />
                  <span>Group</span>
                </button>
              </div>

              <div className="space-y-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-gray-700">
                    Student
                  </label>
                  <select
                    value={student}
                    onChange={(e) => setStudent(e.target.value)}
                    disabled={mode !== "Student"}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg bg-white disabled:bg-gray-50 disabled:text-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-400"
                  >
                    <option value="">Select...</option>
                    <option value="Student A">Student A</option>
                    <option value="Student B">Student B</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-gray-700">
                    Group
                  </label>
                  <select
                    value={group}
                    onChange={(e) => setGroup(e.target.value)}
                    disabled={mode !== "Group"}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg bg-white disabled:bg-gray-50 disabled:text-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-400"
                  >
                    <option value="All">All</option>
                    <option value="Group 1">Group 1</option>
                    <option value="Group 2">Group 2</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-gray-700 flex items-center gap-1">
                    <BookOpen className="w-3 h-3 text-gray-500" />
                    <span>Subject</span>
                  </label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-pink-400"
                  >
                    <option value="Science  HS.E1">Science  HS.E1</option>
                    <option value="Science – HS.E2">Science  HS.E2</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-gray-700">
                      Start date
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-2 py-1.5 pr-7 text-xs border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-pink-400"
                      />
                      <Calendar className="w-3.5 h-3.5 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-gray-700">
                      End date
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full px-2 py-1.5 pr-7 text-xs border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-pink-400"
                      />
                      <Calendar className="w-3.5 h-3.5 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-[11px] font-medium text-gray-700">Snapshot:</div>
                  <div className="flex flex-wrap gap-1">
                    {[
                      "Last 6 weeks",
                      "Last term",
                      "This year",
                    ].map((range) => (
                      <button
                        key={range}
                        type="button"
                        onClick={() => setSnapshotRange(range)}
                        className={`px-2 py-0.5 rounded-full border text-[11px] transition-colors ${
                          snapshotRange === range
                            ? "bg-pink-100 border-pink-300 text-pink-700"
                            : "bg-gray-100 border-gray-200 text-gray-700"
                        }`}
                      >
                        {range}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-[11px] font-medium text-gray-700">Scope:</div>
                  <div className="flex flex-wrap gap-1">
                    {[
                      "Standards map only",
                      "Standards + tasks",
                    ].map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setScope(option)}
                        className={`px-2 py-0.5 rounded-full border text-[11px] transition-colors ${
                          scope === option
                            ? "bg-gray-900 border-gray-900 text-white"
                            : "bg-gray-100 border-gray-200 text-gray-700"
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-3 py-1.5 rounded-full border border-gray-300 bg-gray-50 text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={handleViewStandards}
                  className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-pink-600 text-xs font-semibold text-white shadow-sm hover:bg-pink-700 transition-colors"
                >
                  <span>View standards</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
