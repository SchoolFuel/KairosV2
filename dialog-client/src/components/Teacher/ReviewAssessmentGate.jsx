import React from 'react';
import { Check } from 'lucide-react';

const ReviewAssessmentGate = ({ gate }) => {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      {gate.title && (
        <div className="mb-3">
          <label className="block text-xs font-semibold text-blue-900 mb-1">
            GATE TITLE
          </label>
          <div className="w-full px-3 py-2 border border-blue-200 rounded-lg bg-white text-sm font-medium text-blue-900">
            {gate.title}
          </div>
        </div>
      )}
      {gate.description && (
        <div className="mb-3">
          <label className="block text-xs font-semibold text-blue-900 mb-1">
            DESCRIPTION
          </label>
          <div className="w-full px-3 py-2 border border-blue-200 rounded-lg bg-white text-sm text-blue-800 min-h-[3rem] whitespace-pre-wrap">
            {gate.description}
          </div>
        </div>
      )}
      {gate.checklist && gate.checklist.length > 0 && (
        <div>
          <label className="block text-xs font-semibold text-blue-900 mb-2">
            CHECKLIST
          </label>
          <div className="space-y-2">
            {gate.checklist.map((item, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span className="text-gray-700">{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewAssessmentGate;

