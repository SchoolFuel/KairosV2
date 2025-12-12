import React, { useState } from "react";
import { ClipboardList, ChevronDown } from "lucide-react";
import "./Teacher.css";
import MySpark from "../Shared/MySpark";
import { useMySparkGate } from "../Shared/MySparkGate";
import ProjectQueueCard from "./ProjectQueue/ProjectQueue";

export default function TeacherDashboard({ email }) {
  const [isProjectQueueExpanded, setIsProjectQueueExpanded] = useState(false);
  const [phase, setPhase] = useState('verifying'); // 'verifying' | 'myspark' | 'home'
  const { mySparkStats } = useMySparkGate(setPhase);

  if (phase === 'verifying') {
  return (
      <div className="w-full flex items-center justify-center py-16">
        <div className="flex items-center gap-3 text-gray-700">
          <svg className="animate-spin h-5 w-5 text-orange-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg>
          <span>Verifying your credentials…</span>
        </div>
    </div>
  );
}

  const handleHideMySpark = () => {
    try {
      // Store today's date in localStorage to hide My Spark for today
      const today = new Date().toISOString().split('T')[0];
      localStorage.setItem('mySparkHideDate', today);
    } catch (e) {
      // Ignore errors
    }
  };

  if (phase === 'myspark') {
    return <MySpark userName={email || 'Teacher'} stats={mySparkStats} onContinue={() => setPhase('home')} onHideToday={handleHideMySpark} />;
  }

  // Function to open Teacher Project Queue dialog
  const openProjectQueueDialog = () => {
    google.script.run.openTeacherProjectQueue();
  };

  return (
    <div className="td-wrapper">
      <div className="td-header-section">
        <h1 className="td-heading">Project Workflow</h1>
      </div>

      <div
        className="w-full max-w-[300px] font-sans"
        style={{ marginTop: "24px" }}
      >
        {/* Project Queue Card */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm w-full overflow-hidden transition-all duration-200 mb-3">
          {/* Toggle Button */}
          <div
            onClick={() => setIsProjectQueueExpanded(!isProjectQueueExpanded)}
            className="w-full p-3 cursor-pointer transition-colors duration-200 hover:bg-gray-50"
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <ClipboardList className="w-5 h-5 text-gray-600" />
                  <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-blue-500"></div>
                </div>
                <div>
                  <div className="font-medium text-gray-900">Project Queue</div>
                  <div className="text-sm text-gray-500">
                    Review student projects
            </div>
                </div>
              </div>
              <ChevronDown
                className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                  isProjectQueueExpanded ? "rotate-180" : ""
                }`}
              />
            </div>
              </div>

          {/* Expandable Content */}
          {isProjectQueueExpanded && (
            <div className="border-t border-gray-100">
              <div className="p-3">
                <div className="mb-3">
                  <button
                    onClick={openProjectQueueDialog}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors hover:bg-blue-700"
                  >
                    <ClipboardList className="w-4 h-4" />
                    <span>Open Project Queue</span>
                  </button>
                </div>

                {/* Tips */}
                <div className="mt-3 bg-gray-50 border border-gray-200 p-2 rounded-lg">
                  <h5 className="text-xs font-medium text-gray-900 mb-1">
                    💡 Review Tips:
                  </h5>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>• Check project stages and tasks</li>
                    <li>• Review assessment gates</li>
                    <li>• Provide feedback on submissions</li>
                    <li>• Approve or request revisions</li>
                  </ul>
                </div>
              </div>
              </div>
          )}
        </div>
      </div>

      {/* New components from incoming branch */}
      <ProjectQueueCard />
      
      {/* IgniteHelp Button */}
      <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
        <button
          className="td-queue-btn"
          onClick={() => {
            try {
              google.script.run.openIgniteHelp();
            } catch (e) {}
          }}
          title="Get sparked! Access help and resources"
          style={{
            background: "linear-gradient(to right, #f97316, #fb923c)",
            color: "white",
            border: "none",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          <span style={{ fontSize: "18px" }}>⚡</span>
          IgniteHelp
        </button>
      </div>
    </div>
  );
}
