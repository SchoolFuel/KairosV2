import React, { useState } from 'react';
import { Plus, X, ChevronRight, Trash2 } from 'lucide-react';

const StandardsSelector = ({ onStandardsChange, initialStandards = [] }) => {
    const [selectedStandards, setSelectedStandards] = useState(initialStandards);
    const [isLoading, setIsLoading] = useState(false);
    const [isExpanded, setIsExpanded] = useState(true);

    const openStandardsDialog = () => {
      setIsLoading(true);
      google.script.run
        .withSuccessHandler(() => {
          google.script.run
            .withSuccessHandler(() => {
              setIsLoading(false);
              pollForResults();
            })
            .withFailureHandler((err) => {
              console.error(err);
              setIsLoading(false);
            })
            .showStandardsDialogAndReturn();
        })
        .withFailureHandler((err) => {
          console.error(err);
          setIsLoading(false);
        })
        .clearSelectedStandards(); 
    };

    const pollForResults = () => {
      let attempts = 0;
      const maxAttempts = 60;
      const checkForResults = () => {
        google.script.run
          .withSuccessHandler((status) => {
            if (status === 'closed') {
              setIsLoading(false);
              return;
            }
            if (status === 'selected') {
              setIsLoading(true);
              google.script.run
                .withSuccessHandler((data) => {
                  setSelectedStandards(data || []);
                  if (onStandardsChange) onStandardsChange(data || []);
                  setIsLoading(false);
                })
                .getSelectedStandards();
              return;
            }
            
            if (attempts < maxAttempts) {
              attempts++;
              setTimeout(checkForResults, 1000);
            } else {
              setIsLoading(false);
            }
          })
          .withFailureHandler((err) => {
            console.error(err);
            setIsLoading(false);
          })
          .getDialogStatus();
      };
      
      setTimeout(checkForResults, 1000);
    };

    const removeStandard = (codeToRemove) => {
        const updated = selectedStandards.filter(s => s.code !== codeToRemove);
        setSelectedStandards(updated);
        if (onStandardsChange) {
          onStandardsChange(updated);
        }
    };

  return (
    <div className="w-full max-w-[300px] p-3">
      <style>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-down {
          animation: slideDown 0.25s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fadeIn 0.2s ease-out;
        }
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 3px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>

      {/* Enhanced Add Button */}
      <button
        onClick={openStandardsDialog}
        disabled={isLoading}
        className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-all duration-150 text-sm font-semibold shadow-sm hover:shadow disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2.5"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Loading...</span>
          </>
        ) : (
          <>
            <Plus size={16} strokeWidth={2.5} />
            <span>Add Standards</span>
          </>
        )}
      </button>

      {/* Selected Standards Section */}
      {selectedStandards.length > 0 && (
        <div className="mt-4 animate-slide-down">
          {/* Collapsible Header */}
          <div className="flex items-center justify-between p-2.5 bg-slate-100 rounded-lg mb-3">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors"
            >
              <ChevronRight 
                size={14} 
                strokeWidth={3}
                className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
              />
              <span>{selectedStandards.length} Standard{selectedStandards.length !== 1 ? 's' : ''}</span>
            </button>
            <button
              onClick={() => {
                setSelectedStandards([]);
                if (onStandardsChange) onStandardsChange([]);
              }}
              className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-red-600 font-medium transition-colors px-2 py-1 hover:bg-red-50 rounded"
              title="Clear all standards"
            >
              <Trash2 size={12} />
              <span>Clear All</span>
            </button>
          </div>
          
          {/* Standards List */}
          {isExpanded && (
            <div className="space-y-2.5 max-h-[480px] overflow-y-auto scrollbar-thin">
              {selectedStandards.map((standard, index) => (
                <div
                  key={standard.code}
                  className="group relative p-3 bg-white border border-slate-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all duration-150 animate-fade-in"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  {/* Left Accent */}
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-l-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  
                  <div className="flex gap-2">
                    <div className="flex-1 min-w-0">
                      {/* Code */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded">
                          {standard.code}
                        </span>
                      </div>

                      {/* Badges */}
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        <span className="inline-flex items-center px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-medium rounded border border-emerald-200">
                          {standard.grade_level}
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 bg-purple-50 text-purple-700 text-xs font-medium rounded border border-purple-200">
                          {standard.subject_area}
                        </span>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                        {standard.description}
                      </p>
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => removeStandard(standard.code)}
                      className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-all duration-150"
                      title="Remove this standard"
                    >
                      <X size={14} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StandardsSelector;