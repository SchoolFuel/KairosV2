import React, { useState, useEffect } from 'react';
import { FolderPlus, X, Send, Loader2, ChevronDown } from 'lucide-react';

const ProjectDialog = ({ showDialog, onClose, onSubmit, isLoading }) => {
  const [userInput, setUserInput] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);
  const [subjectError, setSubjectError] = useState(false);

  const subjects = [
    { value: 'mathematics', label: 'Mathematics' },
    { value: 'science', label: 'Science' },
    { value: 'english', label: 'English' },
    { value: 'history', label: 'History' },
    { value: 'art', label: 'Art' },
    { value: 'technology', label: 'Technology' },
    { value: 'other', label: 'Other' }
  ];

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

  const handleSubmit = () => {
    if (!userInput.trim()) return;

    if (!selectedSubject) {
      setSubjectError(true);
      return;
    }

    onSubmit(userInput, selectedSubject);
  };

  const handleClose = () => {
    setUserInput('');
    setSelectedSubject('');
    setShowSubjectDropdown(false);
    setSubjectError(false);
    onClose();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!showDialog) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
      <div className="bg-white rounded-lg w-full max-w-sm mx-2">
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <FolderPlus className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-900">New Project</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="p-4">
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What do you want to build?
            </label>
            <textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="I want to build a... / I'm interested in creating..."
              rows="3"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none resize-none"
            />
          </div>

          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Focussed Subject <span className="text-red-500">*</span>
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
              <strong>Example:</strong> "Website to explain Newton's Laws with animations" or "Quiz to test knowledge about U.S. presidents"
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 p-4 border-t border-gray-200">
          <button
            onClick={handleClose}
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
                <span>Creating...</span>
              </>
            ) : (
              <>
                <Send className="w-3 h-3" />
                <span>Create</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectDialog;