import React from 'react';
import { Check } from 'lucide-react';

const AssessmentGate = ({ gate, stageIndex, onUpdate }) => {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="mb-3">
        <label className="block text-xs font-semibold text-blue-900 mb-1">
          GATE TITLE
        </label>
        <input
          type="text"
          value={gate.title}
          onChange={(e) => onUpdate(stageIndex, 'title', e.target.value)}
          className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm font-medium bg-white"
        />
      </div>
      <div className="mb-3">
        <label className="block text-xs font-semibold text-blue-900 mb-1">
          DESCRIPTION
        </label>
        <textarea
          rows="2"
          value={gate.description}
          onChange={(e) => onUpdate(stageIndex, 'description', e.target.value)}
          className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm resize-none bg-white"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-blue-900 mb-2">
          CHECKLIST
        </label>
        <div className="space-y-2">
          {gate.checklist.map((item, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <Check className="w-4 h-4 text-green-600" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
export default AssessmentGate;