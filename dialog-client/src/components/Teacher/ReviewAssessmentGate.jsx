import React from 'react';
import { Check } from 'lucide-react';

const ReviewAssessmentGate = ({ gate, isEditable, isFrozen, onUpdate }) => {
  const isDisabled = isFrozen || !isEditable;
  
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="mb-3">
        <label className="block text-xs font-semibold text-blue-900 mb-1">
          GATE TITLE
        </label>
        {isEditable && !isFrozen ? (
          <input
            type="text"
            value={gate.title || ''}
            onChange={(e) => onUpdate && onUpdate('title', e.target.value)}
            className="w-full px-3 py-2 border border-blue-300 rounded-lg bg-white text-sm font-medium text-blue-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
            disabled={isDisabled}
          />
        ) : (
          gate.title && (
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
            value={gate.description || ''}
            onChange={(e) => onUpdate && onUpdate('description', e.target.value)}
            className="w-full px-3 py-2 border border-blue-300 rounded-lg bg-white text-sm text-blue-800 min-h-[3rem] whitespace-pre-wrap focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-y"
            disabled={isDisabled}
          />
        ) : (
          gate.description && (
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
          <div className="space-y-2">
            {(gate.checklist || []).map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                <input
                  type="text"
                  value={item}
                  onChange={(e) => onUpdate && onUpdate('checklist', index, e.target.value)}
                  className="flex-1 px-3 py-2 border border-blue-300 rounded-lg bg-white text-sm text-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  disabled={isDisabled}
                />
              </div>
            ))}
          </div>
        ) : (
          gate.checklist && gate.checklist.length > 0 && (
            <div className="space-y-2">
              {gate.checklist.map((item, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700">{item}</span>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default ReviewAssessmentGate;

