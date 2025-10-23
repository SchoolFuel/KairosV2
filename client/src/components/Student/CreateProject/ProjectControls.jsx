import React from 'react';
import { Eye, EyeOff, RotateCcw, Lock, Unlock } from 'lucide-react';

const ProjectControls = ({ 
  view, 
  onViewToggle, 
  isLocked, 
  isEdited, 
  onLockProject, 
  onResetChanges,
  hasProject,
  projectData 
}) => {
  if (!hasProject) return null;

  return (
    <div className="mb-3 flex gap-2">
      <button
        onClick={onViewToggle}
        className="flex-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors flex items-center justify-center gap-1"
      >
        {view === 'text' ? <Eye size={10} /> : <EyeOff size={10} />}
        {view === 'text' ? 'Structure' : 'Text'}
      </button>
      
      {view === 'structured' && projectData && (
        <>
          {!isLocked && isEdited && (
            <button
              onClick={onResetChanges}
              className="px-2 py-1 text-xs bg-yellow-100 hover:bg-yellow-200 rounded transition-colors"
              title="Reset Changes"
            >
              <RotateCcw size={12} />
            </button>
          )}
          <button
            onClick={onLockProject}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              isLocked 
                ? 'bg-red-100 hover:bg-red-200 text-red-700' 
                : 'bg-green-100 hover:bg-green-200 text-green-700'
            }`}
            title={isLocked ? 'Project Locked' : 'Lock & Submit'}
          >
            {isLocked ? <Unlock size={12} /> : <Lock size={12} />}
          </button>
        </>
      )}
    </div>
  );
};

export default ProjectControls;