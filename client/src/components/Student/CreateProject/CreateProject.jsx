import React, { useState, useEffect, useRef, useReducer, useCallback } from 'react';
import { FolderPlus, ChevronDown, RefreshCw, CheckCircle2, Circle, Loader2 } from 'lucide-react';

import ProjectDialog from './ProjectDialog';
import ProjectControls from './ProjectControls';
import LockConfirmationDialog from './LockConfirmationDialog';
import useProjectEditor from '../../../hooks/useProjectEditor';
import ProjectViewer from './ProjectViewer';

// Streaming state management with useReducer
const initialStreamingState = {
  isStreaming: false,
  streamedResponse: '',
  isComplete: false,
  hasResponse: false,
  error: null
};

const streamingReducer = (state, action) => {
  switch (action.type) {
    case 'START_STREAMING':
      return {
        ...initialStreamingState,
        isStreaming: true
      };
    case 'APPEND_CONTENT':
      return {
        ...state,
        streamedResponse: state.streamedResponse + action.payload,
        hasResponse: true
      };
    case 'COMPLETE_STREAMING':
      return {
        ...state,
        isStreaming: false,
        isComplete: true
      };
    case 'SET_ERROR':
      return {
        ...state,
        isStreaming: false,
        error: action.payload,
        isComplete: true
      };
    case 'RESET':
      return initialStreamingState;
    default:
      return state;
  }
};

export default function CreateProject() {
  // Main UI state
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [showLockDialog, setShowLockDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Project state (keeping original structure)
  const [projectOutput, setProjectOutput] = useState('');
  const [projectData, setProjectData] = useState(null);
  const [originalData, setOriginalData] = useState(null);
  const [hasProject, setHasProject] = useState(false);
  const [isEdited, setIsEdited] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [hasLockedOnce, setHasLockedOnce] = useState(false);
  const [view, setView] = useState('text'); // 'text' or 'structured'

  // Streaming state
  const [streamingState, streamingDispatch] = useReducer(streamingReducer, initialStreamingState);
  const [wsConnection, setWsConnection] = useState(null);
  const [generationStep, setGenerationStep] = useState(0); // Progress indicator
  const [lastRequest, setLastRequest] = useState(null); // Store for retry
  const maxRetries = 3;

  // Custom hook for project editing functionality
  const projectEditor = useProjectEditor();

  // Generation steps for progress indicator
  const generationSteps = [
    'Connecting to Create Project service...',
    'Processing your request...',
    'Generating project structure...',
    'Creating stages and tasks...',
    'Adding assessment gates...',
    'Finalizing project details...'
  ];

  // Auto-advance generation steps during streaming
  useEffect(() => {
    let stepInterval;
    if (streamingState.isStreaming && !streamingState.error) {
      stepInterval = setInterval(() => {
        setGenerationStep(prev => {
          if (prev < generationSteps.length - 1) {
            return prev + 1;
          }
          return prev;
        });
      }, 10000); // Change step every 10 seconds
    } else {
      setGenerationStep(0);
    }

    return () => {
      if (stepInterval) clearInterval(stepInterval);
    };
  }, [streamingState.isStreaming, streamingState.error]);

  // Check if data has been edited
  useEffect(() => {
    if (originalData && projectData) {
      const hasChanges = JSON.stringify(projectData) !== JSON.stringify(originalData);
      setIsEdited(hasChanges);
    }
  }, [projectData, originalData]);

  // Cleanup WebSocket
  useEffect(() => {
    return () => {
      if (wsConnection?.readyState === WebSocket.OPEN) {
        wsConnection.close();
      }
    };
  }, [wsConnection]);

  const subjects = [
    { value: 'mathematics', label: 'Mathematics' },
    { value: 'science', label: 'Science' },
    { value: 'english', label: 'English' },
    { value: 'history', label: 'History' },
    { value: 'art', label: 'Art' },
    { value: 'technology', label: 'Technology' },
    { value: 'other', label: 'Other' }
  ];

  // WebSocket connection with retry logic
  const connectWebSocket = useCallback((message, retryCount = 0) => {
    if (retryCount >= maxRetries) {
      streamingDispatch({ type: 'SET_ERROR', payload: 'Failed to connect after multiple attempts' });
      setIsLoading(false);
      return;
    }

    const ws = new WebSocket('wss://s7pmpoc37f.execute-api.us-west-1.amazonaws.com/prod/');
    setWsConnection(ws);

    const connectionTimeout = setTimeout(() => {
      if (ws.readyState === WebSocket.CONNECTING) {
        ws.close();
        if (retryCount < maxRetries - 1) {
          console.log(`Connection timeout, retrying... (${retryCount + 1}/${maxRetries})`);
          setTimeout(() => connectWebSocket(message, retryCount + 1), 1000);
        } else {
          streamingDispatch({ type: 'SET_ERROR', payload: 'Connection timeout' });
          setIsLoading(false);
        }
      }
    }, 30000); // 30 second timeout for project generation

    ws.onopen = () => {
      console.log('WebSocket connected');
      clearTimeout(connectionTimeout);

      const requestPayload = {
        action: "testing",
        payload: {
          email_id: "mindspark.user1@schoolfuel.org",
          message: message
        }
      };

      ws.send(JSON.stringify(requestPayload));
    };
    let first_time = true
    ws.onmessage = (event) => {

      const response = event.data.trim();
      if (first_time){
        first_time = false;
        return
      }
      console.log('📨 Received WebSocket response:', response.substring(0, 200) + '...');

      try {
        const parsedJson = JSON.parse(response);
        console.log('✅ Successfully parsed JSON response');
        console.log('📊 Project structure:', {
          code: parsedJson.statusCode,
          title: parsedJson?.body?.action_response?.response?.project?.project_title,
          stages: parsedJson?.body?.action_response?.response?.project?.stages?.length,
          totalTasks: parsedJson?.body?.action_response?.response?.project?.stages?.reduce((sum, stage) => sum + (stage.tasks?.length || 0), 0)
        });

        if (parsedJson.statusCode === 200 && parsedJson?.body?.action_response?.response?.project) {
          // Use the same structure as REST API response
          const projectInfo = parsedJson.body.action_response.response.project;
          setProjectData(projectInfo);
          setOriginalData(JSON.parse(JSON.stringify(projectInfo)));
          setHasProject(true);
          setView('structured');
          
          // Set project output for compatibility with existing components
          const textOutput = `Subject: ${projectInfo.subject_domain}\nGenerated project: ${projectInfo.project_title}\n\nProject includes ${projectInfo.stages?.length || 0} stages with structured tasks and gates.`;
          setProjectOutput(textOutput);

          streamingDispatch({ type: 'COMPLETE_STREAMING' });
          setIsLoading(false);
          ws.close();
        } else {
          console.warn('Unexpected response format:', parsedJson);
          streamingDispatch({ type: 'SET_ERROR', payload: 'Invalid response format received' });
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Failed to parse JSON response:', err);
        streamingDispatch({ type: 'SET_ERROR', payload: 'Invalid JSON response received' });
        setIsLoading(false);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      clearTimeout(connectionTimeout);
      
      if (retryCount < maxRetries - 1) {
        console.log(`Connection error, retrying... (${retryCount + 1}/${maxRetries})`);
        setTimeout(() => connectWebSocket(message, retryCount + 1), 1000);
      } else {
        streamingDispatch({ type: 'SET_ERROR', payload: 'Connection error occurred' });
        setIsLoading(false);
      }
    };

    ws.onclose = (event) => {
      console.log('WebSocket closed:', event.code, event.reason);
      clearTimeout(connectionTimeout);
      setWsConnection(null);

      if (event.code !== 1000 && streamingState.isStreaming && retryCount < maxRetries - 1) {
        console.log(`Connection closed unexpectedly, retrying... (${retryCount + 1}/${maxRetries})`);
        setTimeout(() => connectWebSocket(message, retryCount + 1), 1000);
      } else if (event.code !== 1000 && streamingState.isStreaming) {
        streamingDispatch({ type: 'SET_ERROR', payload: 'Connection lost' });
        setIsLoading(false);
      }
    };
  }, [streamingState.isStreaming, maxRetries, generationSteps.length]);

  // WebSocket submission handler
  const handleProjectSubmit = async (userInput, selectedSubject) => {
    setIsLoading(true);
    setProjectOutput('');
    setShowDialog(false);

    // Store request for retry functionality
    setLastRequest({ userInput, selectedSubject });

    // Reset states
    streamingDispatch({ type: 'START_STREAMING' });
    setHasProject(false);
    setProjectData(null);
    setOriginalData(null);
    setIsEdited(false);
    setView('text');
    setGenerationStep(0);
    
    const subjectLabel = subjects.find(s => s.value === selectedSubject)?.label;
    const message = `${userInput}, Subject: ${subjectLabel}`;
    
    connectWebSocket(message);
  };

  const handleRetry = () => {
    if (lastRequest) {
      handleProjectSubmit(lastRequest.userInput, lastRequest.selectedSubject);
    }
  };

  const handleClear = () => {
    setProjectOutput('');
    setHasProject(false);
    setProjectData(null);
    setOriginalData(null);
    setIsEdited(false);
    setIsLocked(false);
    setHasLockedOnce(false);
    setView('text');
    streamingDispatch({ type: 'RESET' });
    setGenerationStep(0);
    setLastRequest(null);
    
    if (wsConnection?.readyState === WebSocket.OPEN) {
      wsConnection.close();
    }
  };

  const handleLockProject = () => {
    if (hasLockedOnce) return;
    setShowLockDialog(true);
  };

  const confirmLockProject = (result) => {
    if (result && result.success) {
      setIsLocked(true);
      setHasLockedOnce(true);
      setShowLockDialog(false);
      console.log('✅ Project locked and submitted:', result);
    } else {
      console.log('❌ Project lock failed:', result);
    }
  };

  const resetChanges = () => {
    if (originalData) {
      setProjectData(JSON.parse(JSON.stringify(originalData)));
    }
  };

  const handleViewToggle = () => {
    setView(view === 'text' ? 'structured' : 'text');
  };

  // Status display helpers
  const getStatusClass = () => {
    if (isLocked) return 'text-red-600';
    if (isEdited) return 'text-orange-600';
    if (hasProject) return 'text-green-600';
    if (streamingState.isStreaming) return 'text-yellow-600';
    if (streamingState.error) return 'text-red-600';
    if (isLoading) return 'text-yellow-600';
    return 'text-gray-600';
  };

  const getStatusDot = () => {
    if (isLocked) return 'bg-red-500';
    if (isEdited) return 'bg-orange-500';
    if (hasProject) return 'bg-green-500';
    if (streamingState.isStreaming) return 'bg-yellow-500';
    if (streamingState.error) return 'bg-red-500';
    if (isLoading) return 'bg-yellow-500';
    return 'bg-gray-400';
  };

  const getStatusText = () => {
    if (isLocked) return 'Locked for review';
    if (isEdited) return 'Modified project';
    if (hasProject) return 'Project ready';
    if (streamingState.isStreaming) return 'Generating project...';
    if (streamingState.error) return 'Connection error';
    if (isLoading) return 'Starting generation...';
    return 'Create amazing projects';
  };

  return (
    <div className="w-full max-w-[300px] font-sans">
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm w-full overflow-hidden transition-all duration-200">
        {/* Toggle Button */}
        <div 
          onClick={() => setIsExpanded(!isExpanded)} 
          className="w-full p-3 cursor-pointer transition-colors duration-200 hover:bg-gray-50"
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="relative">
                <FolderPlus className={`w-5 h-5 ${getStatusClass()}`} />
                <div className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${getStatusDot()}`}></div>
              </div>
              <div>
                <div className="font-medium text-gray-900">Create Project</div>
                <div className="text-sm text-gray-500">
                  {getStatusText()}
                </div>
              </div>
            </div>
            <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
          </div>
        </div>

        {/* Expandable Content */}
        {isExpanded && (
          <div className="border-t border-gray-100">
            <div className="p-3">
              <div className="mb-3">
                <button
                  onClick={() => setShowDialog(true)}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium transition-colors hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  <FolderPlus className="w-4 h-4" />
                  <span>Generate Project</span>
                </button>
              </div>

              {/* Project Controls - Reusing existing component */}
              <ProjectControls
                view={view}
                onViewToggle={handleViewToggle}
                isLocked={isLocked}
                isEdited={isEdited}
                onLockProject={handleLockProject}
                onResetChanges={resetChanges}
                hasProject={hasProject}
                projectData={projectData}
              />

              {/* Project Generation Progress Display */}
              {streamingState.isStreaming && !streamingState.error && (
                <div className="mt-3 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-100 to-purple-100 p-2 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                    <h4 className="text-sm font-medium text-blue-900">Creating Your Project</h4>
                  </div>

                  <div className="p-4">
                    {/* Progress Steps */}
                    <div className="space-y-3">
                      {generationSteps.map((step, index) => {
                        const isActive = index === generationStep;
                        const isCompleted = index < generationStep;
                        
                        return (
                          <div key={index} className={`flex items-center gap-3 transition-all duration-500 ${
                            isActive ? 'text-blue-700' : isCompleted ? 'text-green-600' : 'text-gray-400'
                          }`}>
                            {isCompleted ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            ) : isActive ? (
                              <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                            ) : (
                              <Circle className="w-4 h-4" />
                            )}
                            <span className={`text-xs transition-all duration-500 ${
                              isActive ? 'font-medium' : ''
                            }`}>
                              {step}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-4 bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${((generationStep + 1) / generationSteps.length) * 100}%` }}
                      ></div>
                    </div>

                    <p className="text-xs text-gray-600 mt-2 text-center">
                      Generating your custom project... this may take up to a minute.
                    </p>
                  </div>
                </div>
              )}

              {/* Streaming Error Display with Retry */}
              {streamingState.error && (
                <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-sm font-medium text-red-800">Connection Error</span>
                  </div>
                  <p className="text-xs text-red-700 mb-2">{streamingState.error}</p>
                  <button
                    onClick={handleRetry}
                    className="flex items-center gap-1 px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Retry
                  </button>
                </div>
              )}

              {/* Project Output - Reusing existing ProjectViewer component */}
              {projectOutput && (
                <ProjectViewer
                  projectOutput={projectOutput}
                  projectData={projectData}
                  view={view}
                  isEdited={isEdited}
                  isLocked={isLocked}
                  projectEditor={projectEditor}
                  setProjectData={setProjectData}
                  formatProjectForCopy={projectEditor.formatProjectForCopy}
                />
              )}

              {/* Tips */}
              {!projectOutput && !isLoading && !streamingState.hasResponse && !streamingState.error && (
                <div className="mt-3 bg-gray-50 border border-gray-200 p-2 rounded-lg">
                  <h5 className="text-xs font-medium text-gray-900 mb-1">💡 Tips for Better Projects:</h5>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>• Describe your learning objectives clearly</li>
                    <li>• Mention target skill level or grade</li>
                    <li>• Include preferred duration or scope</li>
                    <li>• Specify any required tools or resources</li>
                  </ul>
                </div>
              )}

              {/* Clear Button */}
              {(projectOutput || streamingState.hasResponse || streamingState.error) && (
                <div className="mt-3">
                  <button
                    onClick={handleClear}
                    className="px-3 py-1 text-xs bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Dialogs - Reusing existing components */}
      <ProjectDialog
        showDialog={showDialog}
        onClose={() => setShowDialog(false)}
        onSubmit={handleProjectSubmit}
        isLoading={isLoading}
      />

      <LockConfirmationDialog
        showDialog={showLockDialog}
        onConfirm={confirmLockProject}
        onCancel={() => setShowLockDialog(false)}
        projectData={projectData}
      />
    </div>
  );
}