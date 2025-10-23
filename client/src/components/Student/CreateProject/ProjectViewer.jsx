import React from 'react';
import { Lightbulb, ChevronDown, ChevronRight, Check } from 'lucide-react';
import InlineEditableField from './InlineEditableField';

const ProjectViewer = ({ 
  projectOutput, 
  projectData, 
  view, 
  isEdited, 
  isLocked, 
  projectEditor,
  setProjectData,
  formatProjectForCopy 
}) => {
  const {
    expandedStages,
    toggleStageExpansion,
    updateTaskField,
    updateStageTitle,
    updateGateField
  } = projectEditor;

  return (
    <div className="mt-3 border border-purple-200 rounded-lg overflow-hidden">
      <div className="bg-purple-50 p-2 flex items-center gap-2">
        <Lightbulb className="w-4 h-4 text-purple-600" />
        <h4 className="text-sm font-medium text-purple-900">Your Project</h4>
        {isEdited && (
          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
            Modified
          </span>
        )}
        {isLocked && (
          <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
            Locked
          </span>
        )}
      </div>

      {/* Project Content */}
      <div className="p-3 max-h-80 overflow-y-auto">
        {view === 'text' ? (
          <div className="text-xs text-purple-800 whitespace-pre-line leading-relaxed">
            {projectOutput}
          </div>
        ) : (
          /* Structured Project View */
          <div className="space-y-2">
            {projectData?.stages?.map((stage) => (
              <div key={stage.stage_id} className="border border-gray-200 rounded overflow-hidden">
                {/* Stage Header */}
                <div className="p-2 bg-gray-50 border-b">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleStageExpansion(stage.stage_id)}
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      {expandedStages[stage.stage_id] ? (
                        <ChevronDown size={12} />
                      ) : (
                        <ChevronRight size={12} />
                      )}
                    </button>
                    
                    <div className="flex-1 min-w-0">
                      <InlineEditableField
                        value={stage.title}
                        onSave={(value) => updateStageTitle(projectData, setProjectData, stage.stage_id, value, isLocked)}
                        placeholder="Stage title"
                        displayClassName="text-xs font-medium truncate"
                        isLocked={isLocked}
                      />
                    </div>
                  </div>
                </div>

                {/* Stage Content */}
                {expandedStages[stage.stage_id] && (
                  <div className="p-2 space-y-2">
                    {/* Tasks */}
                    {stage.tasks?.map((task) => (
                      <div key={task.task_id} className="p-2 bg-gray-50 rounded text-xs space-y-1">
                        {/* Task Title */}
                        <InlineEditableField
                          value={task.title}
                          onSave={(value) => updateTaskField(projectData, setProjectData, stage.stage_id, task.task_id, 'title', value, isLocked)}
                          placeholder="Task title"
                          displayClassName="font-medium"
                          isLocked={isLocked}
                        />

                        {/* Task Description */}
                        <InlineEditableField
                          value={task.description}
                          onSave={(value) => updateTaskField(projectData, setProjectData, stage.stage_id, task.task_id, 'description', value, isLocked)}
                          placeholder="Task description"
                          multiline={true}
                          displayClassName="text-gray-600 text-xs"
                          isLocked={isLocked}
                        />

                        <div className="text-gray-500 text-xs">
                          Standard: {task.academic_standard}
                        </div>
                        
                        {task.resource_id && (
                          <div className="text-xs">
                            <a 
                              href={task.resource_id.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 underline"
                            >
                              📚 {task.resource_id.label}
                            </a>
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Gate */}
                    <div className="p-2 bg-blue-50 rounded text-xs space-y-1">
                      <InlineEditableField
                        value={stage.gate.title}
                        onSave={(value) => updateGateField(projectData, setProjectData, stage.stage_id, 'title', value, isLocked)}
                        placeholder="Gate title"
                        displayClassName="font-medium"
                        isLocked={isLocked}
                      />
                      
                      <InlineEditableField
                        value={stage.gate.description}
                        onSave={(value) => updateGateField(projectData, setProjectData, stage.stage_id, 'description', value, isLocked)}
                        placeholder="Gate description"
                        multiline={true}
                        displayClassName="text-gray-600 text-xs"
                        isLocked={isLocked}
                      />
                      
                      <div className="space-y-1">
                        {stage.gate.checklist?.map((item, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <Check size={10} className="text-green-500 flex-shrink-0" />
                            <span className="text-xs">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-purple-200 p-2">
        <button 
          onClick={() => navigator.clipboard.writeText(
            view === 'text' ? projectOutput : formatProjectForCopy(projectData)
          )}
          className="text-xs text-purple-600 hover:bg-purple-100 transition-colors px-1 py-0.5 rounded"
        >
          📋 Copy project
        </button>
      </div>
    </div>
  );
};

export default ProjectViewer;