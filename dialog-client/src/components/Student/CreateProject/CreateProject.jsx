import React, { useState, useCallback, useRef, useEffect } from "react";
import { Folder, Loader2, Lock, Save, RotateCcw, Clock, AlertCircle, RefreshCw, User } from "lucide-react";
import Toast from "./Toast";
import StageTab from "./StageTab";
import TaskCard from "./TaskCard";
import AssessmentGate from "./AssessmentGate";
import ConfirmModal from "./ConfirmModal";
import TeacherSelector from "./TeacherSelector";

const CreateProject = () => {
  const [view, setView] = useState("input");
  const [projectInput, setProjectInput] = useState("");
  const [subject, setSubject] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [projectData, setProjectData] = useState(null);
  const [originalData, setOriginalData] = useState(null);
  const [currentStage, setCurrentStage] = useState(0);
  const [isEdited, setIsEdited] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [toast, setToast] = useState(null);
  const [showLockModal, setShowLockModal] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);
  
  const wsRef = useRef(null);
  const stepIntervalRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const timeoutTimerRef = useRef(null);
  const startTimeRef = useRef(null);

  const TIMEOUT_THRESHOLD = 65;
  const WARNING_THRESHOLD = 45;
  const MAX_RETRIES = 2;

  const subjects = {
    mathematics: "Mathematics",
    science: "Science",
    english: "English",
    history: "History",
    art: "Art",
    technology: "Technology",
    other: "Other",
  };

  const loadingSteps = [
    "Connecting to project service...",
    "Analyzing your requirements...",
    "Generating project structure...",
    "Creating stages and tasks...",
    "Adding assessment gates...",
    "Finalizing project details...",
  ];

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
  }, []);

  const closeToast = useCallback(() => {
    setToast(null);
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const cleanup = useCallback(() => {
    if (stepIntervalRef.current) {
      clearInterval(stepIntervalRef.current);
      stepIntervalRef.current = null;
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (timeoutTimerRef.current) {
      clearTimeout(timeoutTimerRef.current);
      timeoutTimerRef.current = null;
    }
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setElapsedTime(0);
    setShowTimeoutWarning(false);
  }, []);

  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now();
    setElapsedTime(0);
    setShowTimeoutWarning(false);
    
    timerIntervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setElapsedTime(elapsed);
      
      if (elapsed >= WARNING_THRESHOLD && elapsed < TIMEOUT_THRESHOLD) {
        setShowTimeoutWarning(true);
      }
    }, 1000);
  }, []);

  const handleTimeout = useCallback(() => {
    cleanup();
    
    if (retryCount < MAX_RETRIES) {
      showToast(
        `Request timeout. Retrying automatically... (${retryCount + 1}/${MAX_RETRIES})`,
        "warning"
      );
      setRetryCount(prev => prev + 1);
      setTimeout(() => generateProject(true), 2000);
    } else {
      showToast(
        "Request is taking too long. Please try again or contact support.",
        "error"
      );
      setView("input");
      setRetryCount(0);
    }
  }, [retryCount]);

  const generateProject = useCallback((isRetry = false) => {
    if (!projectInput.trim()) {
      showToast("Please describe your project", "error");
      return;
    }
    if (!subject) {
      showToast("Please select a subject", "error");
      return;
    }
    if (!selectedTeacher) {
      showToast("Please select a teacher to assign this project", "error");
      return;
    }

    if (!isRetry) {
      setRetryCount(0);
    }

    setView("loading");
    setLoadingStep(0);

    startTimer();

    stepIntervalRef.current = setInterval(() => {
      setLoadingStep((prev) => {
        if (prev >= 5) {
          return prev;
        }
        return prev + 1;
      });
    }, 10000);

    timeoutTimerRef.current = setTimeout(() => {
      handleTimeout();
    }, TIMEOUT_THRESHOLD * 1000);

    const ws = new WebSocket(
      "wss://s7pmpoc37f.execute-api.us-west-1.amazonaws.com/prod/"
    );
    wsRef.current = ws;

    ws.onopen = () => {
      const message = `${projectInput}, Subject: ${subjects[subject]}`;
      const payload = {
        action: "createproject",
        payload: {
          email_id: "mindspark.user1@schoolfuel.org",
          message: message,
          assigned_teacher: selectedTeacher,
        },
      };
      ws.send(JSON.stringify(payload));
    };

    let firstMessage = true;
    ws.onmessage = (event) => {
      if (firstMessage) {
        firstMessage = false;
        return;
      }

      const response = event.data.trim();

      try {
        const parsedJson = JSON.parse(response);
        if (
          parsedJson.statusCode === 200 &&
          parsedJson?.body?.action_response?.response?.project
        ) {
          const project = parsedJson.body.action_response.response.project;
          // Add teacher info to project data
          project.assigned_teacher = selectedTeacher;
          setProjectData(project);
          setOriginalData(JSON.parse(JSON.stringify(project)));
          setView("project");
          cleanup();
          setRetryCount(0);
          showToast("Project created successfully!", "success");
        }
      } catch (err) {
        console.error("Parse error:", err);
        showToast("Error generating project. Please try again.", "error");
        setView("input");
        cleanup();
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      cleanup();
      
      if (retryCount < MAX_RETRIES) {
        showToast(`Connection error. Retrying... (${retryCount + 1}/${MAX_RETRIES})`, "warning");
        setRetryCount(prev => prev + 1);
        setTimeout(() => generateProject(true), 2000);
      } else {
        showToast("Connection error. Please try again.", "error");
        setView("input");
        setRetryCount(0);
      }
    };

    ws.onclose = (event) => {
      if (!event.wasClean && view === "loading") {
        console.log("WebSocket closed unexpectedly");
      }
    };
  }, [projectInput, subject, selectedTeacher, subjects, showToast, startTimer, cleanup, handleTimeout, retryCount, view]);

  const manualRetry = useCallback(() => {
    setRetryCount(0);
    generateProject(false);
  }, [generateProject]);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  const updateStageTitle = useCallback((stageIndex, value) => {
    setProjectData((prev) => {
      const updated = { ...prev };
      updated.stages[stageIndex].title = value;
      return updated;
    });
    setIsEdited(true);
  }, []);

  const updateTask = useCallback((stageIndex, taskIndex, field, value) => {
    setProjectData((prev) => {
      const updated = { ...prev };
      updated.stages[stageIndex].tasks[taskIndex][field] = value;
      return updated;
    });
    setIsEdited(true);
  }, []);

  const updateGate = useCallback((stageIndex, field, value) => {
    setProjectData((prev) => {
      const updated = { ...prev };
      updated.stages[stageIndex].gate[field] = value;
      return updated;
    });
    setIsEdited(true);
  }, []);

  const resetProject = useCallback(() => {
    if (window.confirm("Are you sure you want to reset all changes?")) {
      setProjectData(JSON.parse(JSON.stringify(originalData)));
      setIsEdited(false);
      showToast("Changes reset successfully", "info");
    }
  }, [originalData, showToast]);

  const saveProject = useCallback(() => {
    console.log("Saving project:", projectData);
    showToast("Project saved successfully!", "success");
    setIsEdited(false);
  }, [projectData, showToast]);

  const lockProject = useCallback(() => {
    setShowLockModal(true);
  }, []);

  const confirmLockProject = useCallback(() => {
    setShowLockModal(false);

    google.script.run
      .withSuccessHandler((result) => {
        if (result.success) {
          showToast(
            result.message || "Project locked and submitted successfully!",
            "success"
          );
          setTimeout(() => google.script.host.close(), 2000);
        } else {
          showToast("Error: " + result.message, "error");
        }
      })
      .withFailureHandler((error) => {
        showToast("Error locking project: " + error, "error");
      })
      .lockProject(projectData);
  }, [projectData, showToast]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={closeToast} />
      )}
      
      <ConfirmModal
        isOpen={showLockModal}
        onConfirm={confirmLockProject}
        onCancel={() => setShowLockModal(false)}
        title="Lock & Submit Project"
        message="Are you sure you want to lock and submit this project? You won't be able to make further edits after this action."
      />

      <div className="w-full mx-auto">
        {/* Input Form View */}
        {view === "input" && (
          <div className="bg-white rounded-xl shadow-2xl w-full mx-auto animate-slide-in">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <Folder className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Create New Project
                  </h2>
                  <p className="text-sm text-gray-500">
                    Design your learning experience
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              {/* Project Description */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  What do you want to build?{" "}
                  <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={projectInput}
                  onChange={(e) => setProjectInput(e.target.value)}
                  placeholder="I want to build a... / I'm interested in creating..."
                  rows="4"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none text-sm"
                />
                <p className="mt-2 text-xs text-gray-500">
                  💡 Be specific about your learning goals, target audience, and
                  desired outcomes
                </p>
              </div>

              {/* Subject Selection */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Subject Focus <span className="text-red-500">*</span>
                </label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm"
                >
                  <option value="">Select Subject</option>
                  {Object.entries(subjects).map(([key, value]) => (
                    <option key={key} value={key}>
                      {value}
                    </option>
                  ))}
                </select>
              </div>

              {/* Teacher Selection */}
              <div className="mb-6">
                <TeacherSelector
                  selectedTeacher={selectedTeacher}
                  onSelectTeacher={setSelectedTeacher}
                />
              </div>

              {/* Example Card */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex gap-3">
                  <div className="text-2xl">💡</div>
                  <div>
                    <h4 className="text-sm font-semibold text-blue-900 mb-1">
                      Example Projects
                    </h4>
                    <ul className="text-xs text-blue-800 space-y-1">
                      <li>
                        - "How can Arizona reduce agricultural water use by 25% by 2040 while protecting tribal rights and sustaining the Colorado River ecosystem?"
                      </li>
                      <li>
                        - "Research project on climate change impact in local
                        communities"
                      </li>
                      <li>
                        - "How do TikTok, YouTube, and "fake news" shape political identity and trust in democracy among youth, and what solutions could strengthen media literacy?"
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={() => generateProject(false)}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!projectInput.trim() || !subject || !selectedTeacher}
              >
                Generate Project
              </button>
            </div>
          </div>
        )}

        {/* Loading View */}
        {view === "loading" && (
          <div className="bg-white rounded-xl shadow-2xl w-full mx-auto animate-slide-in">
            <div className="p-4 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-t-xl">
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  <span className="font-semibold">Elapsed Time:</span>
                  <span className="text-xl font-bold font-mono">
                    {formatTime(elapsedTime)}
                  </span>
                </div>
                {retryCount > 0 && (
                  <span className="text-sm bg-white/20 px-3 py-1 rounded-full">
                    Retry {retryCount}/{MAX_RETRIES}
                  </span>
                )}
              </div>
            </div>

            {showTimeoutWarning && (
              <div className="bg-yellow-50 border-b border-yellow-200 p-3 animate-fade-in">
                <div className="flex items-center gap-2 text-yellow-800">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm">
                    Taking longer than usual... Please wait, we'll retry automatically if needed.
                  </p>
                </div>
              </div>
            )}

            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Creating Your Project
                  </h2>
                  <p className="text-sm text-gray-500">
                    This may take up to a minute...
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                {loadingSteps.map((step, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-3 transition-colors ${
                      index <= loadingStep ? "text-green-600" : "text-gray-400"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-semibold ${
                        index <= loadingStep
                          ? "border-green-500 bg-green-500 text-white"
                          : "border-gray-300"
                      }`}
                    >
                      {index + 1}
                    </div>
                    <span className="text-sm">{step}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full transition-all duration-1000"
                  style={{
                    width: `${
                      ((loadingStep + 1) / loadingSteps.length) * 100
                    }%`,
                  }}
                />
              </div>

              {showTimeoutWarning && (
                <div className="mt-6 text-center">
                  <button
                    onClick={manualRetry}
                    className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-semibold flex items-center gap-2 mx-auto"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Retry Now
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Project View */}
        {view === "project" && projectData && (
          <div className="bg-white rounded-xl shadow-2xl animate-slide-in">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {projectData.project_title}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {projectData.description}
                  </p>
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
                      {projectData.subject_domain}
                    </span>
                    {projectData.assigned_teacher && (
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full flex items-center gap-1">
                        <User className="w-3 h-3" />
                        Assigned to: {projectData.assigned_teacher.name}
                      </span>
                    )}
                    {isEdited && (
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full">
                        Modified
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="border-b border-gray-200 bg-gray-50 px-6">
              <div className="flex gap-1">
                {projectData.stages.map((_, index) => (
                  <StageTab
                    key={index}
                    index={index}
                    isActive={currentStage === index}
                    onClick={() => setCurrentStage(index)}
                  />
                ))}
              </div>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto">
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-2">
                    STAGE TITLE
                  </label>
                  <input
                    type="text"
                    value={projectData.stages[currentStage].title}
                    onChange={(e) =>
                      updateStageTitle(currentStage, e.target.value)
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none font-semibold text-lg"
                  />
                </div>

                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">
                    Tasks
                  </h3>
                  <div className="space-y-4">
                    {projectData.stages[currentStage].tasks.map(
                      (task, taskIndex) => (
                        <TaskCard
                          key={taskIndex}
                          task={task}
                          stageIndex={currentStage}
                          taskIndex={taskIndex}
                          onUpdate={updateTask}
                        />
                      )
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">
                    Assessment Gate
                  </h3>
                  <AssessmentGate
                    gate={projectData.stages[currentStage].gate}
                    stageIndex={currentStage}
                    onUpdate={updateGate}
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 p-6 bg-gray-50 flex justify-between items-center">
              <button
                onClick={resetProject}
                className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Reset Changes
              </button>
              <div className="flex gap-3">
                <button
                  onClick={saveProject}
                  className="px-6 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save Project
                </button>
                <button
                  onClick={lockProject}
                  className="px-6 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold flex items-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  Lock & Submit
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-in {
          animation: slideIn 0.3s ease-out;
        }
        @keyframes fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        .animate-fade-in {
            animation: fade-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default CreateProject;