import React, { useState, useRef, useEffect } from 'react';
import { FolderPlus, ChevronDown, Send, Lightbulb, Loader2, X, ChevronRight } from 'lucide-react';

export default function SidebarAIChat() {
  // Main UI state
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form state
  const [userInput, setUserInput] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);
  const [subjectError, setSubjectError] = useState(false);
  
  // Streaming state
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedResponse, setStreamedResponse] = useState('');
  const [wsConnection, setWsConnection] = useState(null);
  const [isComplete, setIsComplete] = useState(false);
  const [hasResponse, setHasResponse] = useState(false);

  const responseRef = useRef(null);

  const subjects = [
    { value: 'mathematics', label: 'Mathematics' },
    { value: 'science', label: 'Science' },
    { value: 'english', label: 'English' },
    { value: 'history', label: 'History' },
    { value: 'art', label: 'Art' },
    { value: 'technology', label: 'Technology' },
    { value: 'other', label: 'Other' }
  ];

  // Auto-scroll to bottom when new content arrives
  useEffect(() => {
    if (responseRef.current && isStreaming) {
      responseRef.current.scrollTop = responseRef.current.scrollHeight;
    }
  }, [streamedResponse, isStreaming]);

  // Click outside handler for dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showSubjectDropdown && !event.target.closest('.relative')) {
        setShowSubjectDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSubjectDropdown]);

  // Cleanup WebSocket on unmount
  useEffect(() => {
    return () => {
      if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
        wsConnection.close();
      }
    };
  }, [wsConnection]);

  const toggleExpanded = () => setIsExpanded(!isExpanded);

  const openDialog = () => setShowDialog(true);
  
  const closeDialog = () => {
    setShowDialog(false);
    setUserInput('');
    setSelectedSubject('');
    setShowSubjectDropdown(false);
    setSubjectError(false);
  };

  const handleSubmit = async () => {
    if (!userInput.trim()) return;

    if (!selectedSubject) {
      setSubjectError(true);
      return;
    }

    setIsLoading(true);
    setIsStreaming(true);
    setStreamedResponse('');
    setShowDialog(false);
    setSubjectError(false);
    setIsComplete(false);

    try {
      const userEmail = "mindspark.user1@schoolfuel.org"; // Replace with actual user email
      const subjectLabel = subjects.find(s => s.value === selectedSubject)?.label;
      const message = `${userInput}, Subject: ${subjectLabel}`;

      // WebSocket connection
      const ws = new WebSocket('wss://s7pmpoc37f.execute-api.us-west-1.amazonaws.com/prod/'); // Replace with your WebSocket URL
      setWsConnection(ws);

      // Connection timeout
      const connectionTimeout = setTimeout(() => {
        if (ws.readyState === WebSocket.CONNECTING) {
          ws.close();
          setIsStreaming(false);
          setIsLoading(false);
          setStreamedResponse('Connection timeout. Please try again.');
          setHasResponse(true);
          setIsComplete(true);
        }
      }, 10000);

      ws.onopen = () => {
        console.log('WebSocket connected');
        clearTimeout(connectionTimeout);
        
        const requestPayload = {
          action: "testing",
          payload: {
            email_id: userEmail,
            message: message
          }
        };
        
        ws.send(JSON.stringify(requestPayload));
      };

      ws.onmessage = (event) => {
        const chunk = event.data;
        
        // Check for end marker
        if (chunk.includes('__END__')) {
          const finalChunk = chunk.replace('__END__', '');
          if (finalChunk.trim()) {
            setStreamedResponse(prev => prev + finalChunk);
          }
          
          setIsStreaming(false);
          setIsLoading(false);
          setIsComplete(true);
          setHasResponse(true);
          ws.close();
          return;
        }
        
        // Append chunk to response
        setStreamedResponse(prev => prev + chunk);
        setHasResponse(true);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        clearTimeout(connectionTimeout);
        setIsStreaming(false);
        setIsLoading(false);
        setStreamedResponse('Connection error occurred. Please check your connection and try again.');
        setHasResponse(true);
        setIsComplete(true);
      };

      ws.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        clearTimeout(connectionTimeout);
        setWsConnection(null);
        
        if (event.code !== 1000 && isStreaming) {
          setStreamedResponse(prev => prev + '\n\n[Connection lost]');
          setIsStreaming(false);
          setIsLoading(false);
          setIsComplete(true);
        }
      };

    } catch (error) {
      console.error('Error setting up WebSocket:', error);
      setStreamedResponse('Failed to establish connection. Please try again later.');
      setHasResponse(true);
      setIsLoading(false);
      setIsStreaming(false);
      setIsComplete(true);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleClear = () => {
    setUserInput('');
    setStreamedResponse('');
    setHasResponse(false);
    setIsComplete(false);
    if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
      wsConnection.close();
    }
  };

  // Status display helpers - matching CreateProject logic
  const getStatusClass = () => {
    if (isStreaming) return 'text-yellow-600';
    if (hasResponse) return 'text-green-600';
    if (isLoading) return 'text-yellow-600';
    return 'text-gray-600';
  };

  const getStatusDot = () => {
    if (isStreaming) return 'bg-yellow-500';
    if (hasResponse) return 'bg-green-500';
    if (isLoading) return 'bg-yellow-500';
    return 'bg-gray-400';
  };

  const getStatusText = () => {
    if (isStreaming) return 'Generating response...';
    if (hasResponse) return 'Response ready';
    if (isLoading) return 'Connecting...';
    return 'Generate AI response';
  };

  return (
    <div className="w-full max-w-[300px] font-sans">
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm w-full overflow-hidden transition-all duration-200">
        {/* Toggle Button - Matching CreateProject Header */}
        <div 
          onClick={toggleExpanded} 
          className="w-full p-3 cursor-pointer transition-colors duration-200 hover:bg-gray-50"
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="relative">
                <FolderPlus className={`w-5 h-5 ${getStatusClass()}`} />
                <div className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${getStatusDot()}`}></div>
              </div>
              <div>
                <div className="font-medium text-gray-900">AI Generator</div>
                <div className="text-sm text-gray-500">
                  {getStatusText()}
                </div>
              </div>
            </div>
            <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
          </div>
        </div>

        {/* Expandable Content - Matching CreateProject Structure */}
        {isExpanded && (
          <div className="border-t border-gray-100">
            <div className="p-3">
              <div className="mb-3">
                <button
                  onClick={openDialog}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium transition-colors hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  <FolderPlus className="w-4 h-4" />
                  <span>Generate Response</span>
                </button>
              </div>

              {/* Response Output - Matching CreateProject ProjectViewer style */}
              {hasResponse && (
                <div className="mt-3 border border-purple-200 rounded-lg overflow-hidden">
                  <div className="bg-purple-50 p-2 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-purple-600" />
                    <h4 className="text-sm font-medium text-purple-900">AI Response</h4>
                    {isStreaming && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded flex items-center gap-1">
                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                        Streaming...
                      </span>
                    )}
                    {isComplete && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        Complete
                      </span>
                    )}
                  </div>

                  {/* Response Content */}
                  <div className="p-3 max-h-80 overflow-y-auto">
                    <div 
                      ref={responseRef}
                      className="text-xs text-purple-800 whitespace-pre-line leading-relaxed"
                    >
                      {streamedResponse}
                      {isStreaming && (
                        <span className="inline-block w-2 h-4 bg-purple-600 animate-pulse ml-1 align-middle"></span>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-purple-200 p-2">
                    <button 
                      onClick={() => navigator.clipboard.writeText(streamedResponse)}
                      className="text-xs text-purple-600 hover:bg-purple-100 transition-colors px-1 py-0.5 rounded"
                    >
                      📋 Copy response
                    </button>
                  </div>
                </div>
              )}

              {/* Tips - Matching CreateProject Tips */}
              {!hasResponse && !isLoading && (
                <div className="mt-3 bg-gray-50 border border-gray-200 p-2 rounded-lg">
                  <h5 className="text-xs font-medium text-gray-900 mb-1">💡 Tips:</h5>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>• Be specific about what you want</li>
                    <li>• Mention your skill level</li>
                    <li>• Include preferred tech</li>
                  </ul>
                </div>
              )}

              {/* Clear Button - Matching CreateProject Clear */}
              {hasResponse && (
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

      {/* Dialog Modal - Matching CreateProject Dialog Style */}
      {showDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
          <div className="bg-white rounded-lg w-full max-w-sm mx-2">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-purple-600" />
                <h2 className="text-lg font-semibold text-gray-900">AI Generator</h2>
              </div>
              <button
                onClick={closeDialog}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="p-4">
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What do you want to create?
                </label>
                <textarea
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Describe your idea in detail..."
                  rows="3"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none resize-none"
                />
              </div>

              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject Focus <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowSubjectDropdown(!showSubjectDropdown)}
                    className={`w-full px-3 py-2 text-sm text-left border rounded-lg bg-white hover:bg-gray-50 focus:ring-2 focus:ring-purple-500 outline-none flex items-center justify-between ${
                      subjectError 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 focus:border-purple-500'
                    }`}
                  >
                    <span className={selectedSubject ? 'text-gray-900' : 'text-gray-500'}>
                      {selectedSubject ? subjects.find(s => s.value === selectedSubject)?.label : 'Select Subject'}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showSubjectDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {subjectError && (
                    <p className="mt-1 text-xs text-red-600">Please select a subject</p>
                  )}
                  
                  {showSubjectDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      <div className="py-1">
                        {subjects.map((subject) => (
                          <button
                            key={subject.value}
                            type="button"
                            onClick={() => {
                              setSelectedSubject(subject.value);
                              setShowSubjectDropdown(false);
                              setSubjectError(false);
                            }}
                            className={`w-full px-3 py-2 text-sm text-left hover:bg-gray-100 transition-colors ${
                              selectedSubject === subject.value ? 'bg-purple-50 text-purple-700' : 'text-gray-700'
                            }`}
                          >
                            {subject.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 p-2 rounded-lg">
                <p className="text-xs text-blue-800">
                  <strong>Example:</strong> "Create a lesson plan about photosynthesis with interactive activities" or "Design a math quiz for algebra basics"
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 p-4 border-t border-gray-200">
              <button
                onClick={closeDialog}
                className="px-3 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!userInput.trim() || isLoading}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-purple-600 text-white rounded-lg font-medium transition-colors hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3 h-3" />
                    <span>Generate</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}