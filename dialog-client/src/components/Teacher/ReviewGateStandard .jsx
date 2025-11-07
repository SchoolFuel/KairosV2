import React, { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';

const ReviewGateStandard = ({ gate, isEditable, isFrozen, onUpdate }) => {
  const isDisabled = isFrozen || !isEditable;
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  // Normalize checklist: convert old string format to new object format, always return exactly 4 items
  const normalizeChecklist = (checklist) => {
    const defaultItems = Array(4).fill(null).map(() => ({
      text: '',
      learningStandards: [],
    }));

    if (!checklist || !Array.isArray(checklist)) return defaultItems;
    
    // Map existing items
    const mapped = checklist.map((item, index) => {
      // If it's already an object with the new structure, return it
      if (typeof item === 'object' && item !== null) {
        return {
          text: item.text || item.description || '',
          learningStandards: item.learningStandards || item.standards || [],
        };
      }
      // If it's a string (old format), convert to new format
      return {
        text: typeof item === 'string' ? item : '',
        learningStandards: [],
      };
    });

    // Ensure we have exactly 4 items
    for (let i = 0; i < 4; i++) {
      if (mapped[i]) {
        defaultItems[i] = mapped[i];
      }
    }

    return defaultItems;
  };

  const [checklistItems, setChecklistItems] = useState(() => {
    return normalizeChecklist(gate?.checklist);
  });

  // Update local state when gate prop changes
  useEffect(() => {
    const normalized = normalizeChecklist(gate?.checklist);
    setChecklistItems(normalized);
    // Ensure active tab is valid (0-3)
    if (activeTabIndex >= 4) {
      setActiveTabIndex(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gate?.checklist]);

  // Update checklist item description
  const updateChecklistText = (index, value) => {
    if (isDisabled) return;

    const updated = [...checklistItems];
    updated[index] = {
      ...updated[index],
      text: value,
    };

    setChecklistItems(updated);

    // Notify parent component
    if (onUpdate) {
      onUpdate('checklist', null, updated);
    }
  };

  // Add new learning standard to a checklist item
  const addLearningStandard = (checklistIndex) => {
    if (isDisabled) return;

    const updated = [...checklistItems];
    if (!updated[checklistIndex].learningStandards) {
      updated[checklistIndex].learningStandards = [];
    }

    updated[checklistIndex].learningStandards.push({
      lsCode: '',
      lsDescription: '',
      percentage: 0,
    });

    setChecklistItems(updated);

    // Notify parent component
    if (onUpdate) {
      onUpdate('checklist', null, updated);
    }
  };

  // Update learning standard field
  const updateLearningStandard = (checklistIndex, lsIndex, field, value) => {
    if (isDisabled) return;

    const updated = [...checklistItems];
    const ls = updated[checklistIndex].learningStandards[lsIndex];

    // Validate percentage
    if (field === 'percentage') {
      const numValue = parseFloat(value) || 0;
      ls.percentage = Math.min(100, Math.max(0, numValue));
    } else {
      ls[field] = value;
    }

    setChecklistItems(updated);

    // Notify parent component
    if (onUpdate) {
      onUpdate('checklist', null, updated);
    }
  };

  // Remove learning standard
  const removeLearningStandard = (checklistIndex, lsIndex) => {
    if (isDisabled) return;

    const updated = [...checklistItems];
    updated[checklistIndex].learningStandards = updated[checklistIndex].learningStandards.filter(
      (_, i) => i !== lsIndex
    );

    setChecklistItems(updated);

    // Notify parent component
    if (onUpdate) {
      onUpdate('checklist', null, updated);
    }
  };


  const currentItem = checklistItems[activeTabIndex] || { text: '', learningStandards: [] };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="mb-3">
        <label className="block text-xs font-semibold text-blue-900 mb-1">
          GATE TITLE
        </label>
        {isEditable && !isFrozen ? (
          <input
            type="text"
            value={gate?.title || ''}
            onChange={(e) => onUpdate && onUpdate('title', null, e.target.value)}
            className="w-full px-3 py-2 border border-blue-300 rounded-lg bg-white text-sm font-medium text-blue-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
            disabled={isDisabled}
          />
        ) : (
          gate?.title && (
            <div className="w-full px-3 py-2 border border-blue-200 rounded-lg bg-white text-sm font-medium text-blue-900">
              {gate.title}
            </div>
          )
        )}
      </div>

      <div className="mb-3">
        <label className="block text-xs font-semibold text-blue-900 mb-1">
          DESCRIPTION
        </label>
        {isEditable && !isFrozen ? (
          <textarea
            value={gate?.description || ''}
            onChange={(e) => onUpdate && onUpdate('description', null, e.target.value)}
            className="w-full px-3 py-2 border border-blue-300 rounded-lg bg-white text-sm text-blue-800 min-h-[3rem] whitespace-pre-wrap focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-y"
            disabled={isDisabled}
          />
        ) : (
          gate?.description && (
            <div className="w-full px-3 py-2 border border-blue-200 rounded-lg bg-white text-sm text-blue-800 min-h-[3rem] whitespace-pre-wrap">
              {gate.description}
            </div>
          )
        )}
      </div>

      <div>
        <label className="block text-xs font-semibold text-blue-900 mb-2">
          CHECKLIST
        </label>

        {isEditable && !isFrozen ? (
          <div>
            {/* Tabs */}
            <div className="flex gap-1 mb-3 border-b border-blue-300 overflow-x-auto">
              {checklistItems.map((item, index) => (
                <button
                  key={index}
                  onClick={() => setActiveTabIndex(index)}
                  className={`px-3 py-2 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
                    activeTabIndex === index
                      ? 'border-blue-600 text-blue-900 bg-blue-100'
                      : 'border-transparent text-blue-700 hover:text-blue-900 hover:bg-blue-50'
                  }`}
                  disabled={isDisabled}
                >
                  Checklist {index + 1}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {currentItem && (
              <div className="space-y-4 bg-white rounded-lg p-4 border border-blue-200">
                {/* Checklist Description */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Checklist Description
                  </label>
                  <input
                    type="text"
                    value={currentItem.text || ''}
                    onChange={(e) => updateChecklistText(activeTabIndex, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    disabled={isDisabled}
                    placeholder="Enter checklist description"
                  />
                </div>

                {/* Learning Standards Section */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-semibold text-gray-700">
                      Learning Standards
                    </label>
                    <button
                      onClick={() => addLearningStandard(activeTabIndex)}
                      className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors"
                      disabled={isDisabled}
                    >
                      <Plus size={12} />
                      Add
                    </button>
                  </div>

                  {/* Learning Standards List */}
                  <div className="space-y-3">
                    {(currentItem.learningStandards || []).map((ls, lsIndex) => (
                      <div
                        key={lsIndex}
                        className="p-3 border border-gray-200 rounded-lg bg-gray-50 space-y-2"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-gray-600">
                            Learning Standard {lsIndex + 1}
                          </span>
                          <button
                            onClick={() => removeLearningStandard(activeTabIndex, lsIndex)}
                            className="text-red-600 hover:text-red-800"
                            disabled={isDisabled}
                          >
                            <X size={14} />
                          </button>
                        </div>

                        {/* LS Code */}
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            LS Code
                          </label>
                          <input
                            type="text"
                            value={ls.lsCode || ''}
                            onChange={(e) =>
                              updateLearningStandard(activeTabIndex, lsIndex, 'lsCode', e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                            disabled={isDisabled}
                            placeholder="e.g., LS-1, CCSS.ELA-LITERACY.RL.4.1"
                          />
                        </div>

                        {/* LS Description */}
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            LS Description
                          </label>
                          <textarea
                            value={ls.lsDescription || ''}
                            onChange={(e) =>
                              updateLearningStandard(activeTabIndex, lsIndex, 'lsDescription', e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-700 min-h-[2.5rem] focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-y"
                            disabled={isDisabled}
                            placeholder="Enter learning standard description"
                          />
                        </div>

                        {/* Percentage */}
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Percent (≤ 100)
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              value={ls.percentage || 0}
                              onChange={(e) =>
                                updateLearningStandard(activeTabIndex, lsIndex, 'percentage', e.target.value)
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                              disabled={isDisabled}
                              placeholder="0-100"
                            />
                            <span className="text-sm text-gray-500">%</span>
                          </div>
                        </div>
                      </div>
                    ))}

                    {(!currentItem.learningStandards || currentItem.learningStandards.length === 0) && (
                      <div className="text-center py-4 text-sm text-gray-500">
                        No learning standards added yet. Click "Add" to add one.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          // Read-only view
          <div>
            <div className="flex gap-1 mb-3 border-b border-blue-300">
              {checklistItems.map((item, index) => (
                <button
                  key={index}
                  onClick={() => setActiveTabIndex(index)}
                  className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                    activeTabIndex === index
                      ? 'border-blue-600 text-blue-900 bg-blue-50'
                      : 'border-transparent text-blue-700 hover:text-blue-900 hover:bg-blue-50'
                  }`}
                >
                  Checklist {index + 1}
                </button>
              ))}
            </div>
            {currentItem && (
              <div className="space-y-4 bg-white rounded-lg p-4 border border-blue-200 text-sm">
                <div>
                  <span className="font-semibold text-gray-700">Checklist Description: </span>
                  <span className="text-gray-600">{currentItem.text || '—'}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700 mb-2 block">Learning Standards: </span>
                  {currentItem.learningStandards && currentItem.learningStandards.length > 0 ? (
                    <div className="space-y-2 mt-2">
                      {currentItem.learningStandards.map((ls, lsIndex) => (
                        <div key={lsIndex} className="p-2 border border-gray-200 rounded bg-gray-50">
                          <div className="text-xs font-medium text-gray-600 mb-1">
                            Learning Standard {lsIndex + 1}
                          </div>
                          <div className="text-xs text-gray-700">
                            <div>LS Code: {ls.lsCode || '—'}</div>
                            <div>LS Description: {ls.lsDescription || '—'}</div>
                            <div>Percent: {ls.percentage || 0}%</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-gray-500">No learning standards</span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewGateStandard;
