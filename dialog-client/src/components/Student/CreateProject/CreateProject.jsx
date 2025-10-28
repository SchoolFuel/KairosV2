import React, { useState, useCallback, useRef } from 'react';
import { Folder, Loader2, Lock, Save, RotateCcw } from 'lucide-react';
import Toast from './Toast';
import StageTab from './StageTab';
import TaskCard from './TaskCard';
import AssessmentGate from './AssessmentGate';
import ConfirmModal from './ConfirmModal';

const CreateProject = () => {
  const [view, setView] = useState('input'); // 'input', 'loading', 'project'
  const [projectInput, setProjectInput] = useState('');
  const [subject, setSubject] = useState('');
  const [projectData, setProjectData] = useState(null);
  const [originalData, setOriginalData] = useState(null);
  const [currentStage, setCurrentStage] = useState(0);
  const [isEdited, setIsEdited] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [toast, setToast] = useState(null);
  const [showLockModal, setShowLockModal] = useState(false);
  const wsRef = useRef(null);

  const subjects = {
    mathematics: 'Mathematics',
    science: 'Science',
    english: 'English',
    history: 'History',
    art: 'Art',
    technology: 'Technology',
    other: 'Other'
  };

  const loadingSteps = [
    'Connecting to project service...',
    'Analyzing your requirements...',
    'Generating project structure...',
    'Creating stages and tasks...',
    'Adding assessment gates...',
    'Finalizing project details...'
  ];

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
  }, []);

  const closeToast = useCallback(() => {
    setToast(null);
  }, []);

  const generateProject = useCallback(() => {
    if (!projectInput.trim()) {
      showToast('Please describe your project', 'error');
      return;
    }
    if (!subject) {
      showToast('Please select a subject', 'error');
      return;
    }

    setView('loading');
    setLoadingStep(0);
    
    // Animate loading steps
    const stepInterval = setInterval(() => {
      setLoadingStep(prev => {
        if (prev >= 5) {
          clearInterval(stepInterval);
          return prev;
        }
        return prev + 1;
      });
    }, 8000);

    // Start WebSocket connection
    const ws = new WebSocket('wss://s7pmpoc37f.execute-api.us-west-1.amazonaws.com/prod/');
    wsRef.current = ws;

    ws.onopen = () => {
      const message = `${projectInput}, Subject: ${subjects[subject]}`;
      const payload = {
        action: "testing",
        payload: {
          email_id: "mindspark.user1@schoolfuel.org",
          message: message
        }
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
        if (parsedJson.statusCode === 200 && parsedJson?.body?.action_response?.response?.project) {
          const project = parsedJson.body.action_response.response.project;
          setProjectData(project);
          setOriginalData(JSON.parse(JSON.stringify(project)));
          setView('project');
          clearInterval(stepInterval);
          ws.close();
        }
      } catch (err) {
        console.error('Parse error:', err);
        showToast('Error generating project. Please try again.', 'error');
        setView('input');
        clearInterval(stepInterval);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      showToast('Connection error. Please try again.', 'error');
      setView('input');
      clearInterval(stepInterval);
    };
  }, [projectInput, subject, subjects, showToast]);

  const updateStageTitle = useCallback((stageIndex, value) => {
    setProjectData(prev => {
      const updated = { ...prev };
      updated.stages[stageIndex].title = value;
      return updated;
    });
    setIsEdited(true);
  }, []);

  const updateTask = useCallback((stageIndex, taskIndex, field, value) => {
    setProjectData(prev => {
      const updated = { ...prev };
      updated.stages[stageIndex].tasks[taskIndex][field] = value;
      return updated;
    });
    setIsEdited(true);
  }, []);

  const updateGate = useCallback((stageIndex, field, value) => {
    setProjectData(prev => {
      const updated = { ...prev };
      updated.stages[stageIndex].gate[field] = value;
      return updated;
    });
    setIsEdited(true);
  }, []);

  const resetProject = useCallback(() => {
    if (window.confirm('Are you sure you want to reset all changes?')) {
      setProjectData(JSON.parse(JSON.stringify(originalData)));
      setIsEdited(false);
      showToast('Changes reset successfully', 'info');
    }
  }, [originalData, showToast]);

  const saveProject = useCallback(() => {
    console.log('Saving project:', projectData);
    showToast('Project saved successfully!', 'success');
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
          showToast(result.message || 'Project locked and submitted successfully!', 'success');
          setTimeout(() => google.script.host.close(), 2000);
        } else {
          showToast('Error: ' + result.message, 'error');
        }
      })
      .withFailureHandler((error) => {
        showToast('Error locking project: ' + error, 'error');
      })
      .lockProject(projectData);
  }, [projectData, showToast]);
/*
  const lockProject = useCallback(() => {
    if (window.confirm('Are you sure you want to lock and submit this project? You won\'t be able to make further edits.')) {
      // Uncomment for production
      // google.script.run
      //   .withSuccessHandler((result) => {
      //     if (result.success) {
      //       showToast(result.message || 'Project locked and submitted successfully!', 'success');
      //       setTimeout(() => google.script.host.close(), 2000);
      //     } else {
      //       showToast('Error: ' + result.message, 'error');
      //     }
      //   })
      //   .withFailureHandler((error) => {
      //     showToast('Error locking project: ' + error, 'error');
      //   })
      //   .lockProject(projectData);
      
      // Demo version
      showToast('Project locked and submitted successfully!', 'success');
      setTimeout(() => {
        console.log('Would close dialog here');
      }, 2000);
    }
  }, [projectData, showToast]); */

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Toast Notifications */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}
        {/* Lock Confirmation Modal */}
        <ConfirmModal
        isOpen={showLockModal}
        onConfirm={confirmLockProject}
        onCancel={() => setShowLockModal(false)}
        title="Lock & Submit Project"
        message="Are you sure you want to lock and submit this project? You won't be able to make further edits after this action."
        />

      <div className="w-full mx-auto">
        {/* Input Form View */}
        {view === 'input' && (
          <div className="bg-white rounded-xl shadow-2xl w-full mx-auto animate-slide-in">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <Folder className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Create New Project</h2>
                  <p className="text-sm text-gray-500">Design your learning experience</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              {/* Project Description */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  What do you want to build? <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={projectInput}
                  onChange={(e) => setProjectInput(e.target.value)}
                  placeholder="I want to build a... / I'm interested in creating..."
                  rows="4"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none text-sm"
                />
                <p className="mt-2 text-xs text-gray-500">
                  💡 Be specific about your learning goals, target audience, and desired outcomes
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
                    <option key={key} value={key}>{value}</option>
                  ))}
                </select>
              </div>

              {/* Example Card */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex gap-3">
                  <div className="text-2xl">💡</div>
                  <div>
                    <h4 className="text-sm font-semibold text-blue-900 mb-1">Example Projects</h4>
                    <ul className="text-xs text-blue-800 space-y-1">
                      <li>• "Interactive website explaining Newton's Laws with animations"</li>
                      <li>• "Research project on climate change impact in local communities"</li>
                      <li>• "Quiz game to test knowledge about U.S. presidents"</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={generateProject}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
              >
                Generate Project
              </button>
            </div>
          </div>
        )}

        {/* Loading View */}
        {view === 'loading' && (
          <div className="bg-white rounded-xl shadow-2xl w-full mx-auto animate-slide-in">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Creating Your Project</h2>
                  <p className="text-sm text-gray-500">This may take up to a minute...</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                {loadingSteps.map((step, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-3 transition-colors ${
                      index <= loadingStep ? 'text-green-600' : 'text-gray-400'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-semibold ${
                        index <= loadingStep
                          ? 'border-green-500 bg-green-500 text-white'
                          : 'border-gray-300'
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
                  style={{ width: `${((loadingStep + 1) / loadingSteps.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Project View */}
        {view === 'project' && projectData && (
          <div className="bg-white rounded-xl shadow-2xl animate-slide-in">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {projectData.project_title}
                  </h2>
                  <p className="text-sm text-gray-600">{projectData.description}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
                      {projectData.subject_domain}
                    </span>
                    {isEdited && (
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full">
                        Modified
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Stages Navigation */}
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

            {/* Stage Content */}
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              <div className="space-y-6">
                {/* Stage Title */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-2">
                    STAGE TITLE
                  </label>
                  <input
                    type="text"
                    value={projectData.stages[currentStage].title}
                    onChange={(e) => updateStageTitle(currentStage, e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none font-semibold text-lg"
                  />
                </div>

                {/* Tasks */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Tasks</h3>
                  <div className="space-y-4">
                    {projectData.stages[currentStage].tasks.map((task, taskIndex) => (
                      <TaskCard
                        key={taskIndex}
                        task={task}
                        stageIndex={currentStage}
                        taskIndex={taskIndex}
                        onUpdate={updateTask}
                      />
                    ))}
                  </div>
                </div>

                {/* Assessment Gate */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Assessment Gate</h3>
                  <AssessmentGate
                    gate={projectData.stages[currentStage].gate}
                    stageIndex={currentStage}
                    onUpdate={updateGate}
                  />
                </div>
              </div>
            </div>

            {/* Footer Actions */}
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