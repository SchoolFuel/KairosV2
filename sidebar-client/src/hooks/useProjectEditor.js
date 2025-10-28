import { useState, useCallback } from 'react';

const useProjectEditor = () => {
  const [expandedStages, setExpandedStages] = useState({});

  const toggleStageExpansion = useCallback((stageId) => {
    setExpandedStages(prev => ({
      ...prev,
      [stageId]: !prev[stageId]
    }));
  }, []);

  const updateTaskField = useCallback((projectData, setProjectData, stageId, taskId, field, value, isLocked) => {
    if (isLocked) return;

    setProjectData(prev => ({
      ...prev,
      stages: prev.stages.map(stage => 
        stage.stage_id === stageId 
          ? {
              ...stage,
              tasks: stage.tasks.map(task => 
                task.task_id === taskId 
                  ? { ...task, [field]: value }
                  : task
              )
            }
          : stage
      )
    }));
  }, []);

  const updateStageTitle = useCallback((projectData, setProjectData, stageId, newTitle, isLocked) => {
    if (isLocked) return;

    setProjectData(prev => ({
      ...prev,
      stages: prev.stages.map(stage => 
        stage.stage_id === stageId 
          ? { ...stage, title: newTitle }
          : stage
      )
    }));
  }, []);

  const updateGateField = useCallback((projectData, setProjectData, stageId, field, value, isLocked) => {
    if (isLocked) return;

    setProjectData(prev => ({
      ...prev,
      stages: prev.stages.map(stage => 
        stage.stage_id === stageId 
          ? { ...stage, gate: { ...stage.gate, [field]: value } }
          : stage
      )
    }));
  }, []);

  const formatProjectForCopy = useCallback((data) => {
    if (!data) return '';
    
    let formatted = `${data.project_title}\n`;
    formatted += `${data.description}\n`;
    formatted += `Subject Focus: ${data.subject_domain}\n\n`;
    
    data.stages?.forEach((stage, index) => {
      formatted += `Stage ${index + 1}: ${stage.title}\n`;
      formatted += `${'='.repeat(stage.title.length + 10)}\n\n`;
      
      stage.tasks?.forEach((task, taskIndex) => {
        formatted += `Task ${taskIndex + 1}: ${task.title}\n`;
        formatted += `Description: ${task.description}\n`;
        formatted += `Standard: ${task.academic_standard}\n`;
        if (task.resource_id) {
          formatted += `Resource: ${task.resource_id.label} (${task.resource_id.url})\n`;
        }
        formatted += '\n';
      });
      
      formatted += `✅ Gate: ${stage.gate.title}\n`;
      formatted += `${stage.gate.description}\n`;
      formatted += 'Checklist:\n';
      stage.gate.checklist?.forEach(item => {
        formatted += `• ${item}\n`;
      });
      formatted += '\n';
    });
    
    return formatted;
  }, []);

  return {
    expandedStages,
    toggleStageExpansion,
    updateTaskField,
    updateStageTitle,
    updateGateField,
    formatProjectForCopy
  };
};

export default useProjectEditor;