import React, { useState, useEffect } from 'react';
import {ChevronDown, ChevronRight, BookOpen, 
  Clock, ArrowLeft, CheckCircle, Target, ExternalLink, Calendar
} from 'lucide-react';

// ProjectDetail Component (embedded)
export default function ProjectDetail({ projectId, onBack }) {
  const [project, setProject] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedStages, setExpandedStages] = useState({});

  // Fetch project details when component mounts
  useEffect(() => {
    if (projectId) {
      fetchProjectDetails();
    }
  }, [projectId]);

  const fetchProjectDetails = () => {
    setIsLoading(true);
    setError(null);
    
    google.script.run
      .withSuccessHandler((result) => {
        if (result && result.action_response && result.action_response.json) {
          setProject(result.action_response.json.project);
        } else {
          setError('Invalid response format');
        }
        setIsLoading(false);
      })
      .withFailureHandler((error) => {
        console.error("Error calling Apps Script:", error);
        setError(error.message || 'Failed to load project details');
        setIsLoading(false);
      })
      .getProjectDetails(projectId);
  };

  const toggleStageExpansion = (stageId) => {
    setExpandedStages(prev => ({
      ...prev,
      [stageId]: !prev[stageId]
    }));
  };

  const getSubjectColor = (subject) => {
    const colors = {
      'Math': 'bg-blue-100 text-blue-800',
      'Science': 'bg-green-100 text-green-800',
      'History': 'bg-purple-100 text-purple-800',
      'English': 'bg-orange-100 text-orange-800',
      'Art': 'bg-yellow-100 text-yellow-800',
      'Technology': 'bg-red-100 text-red-800',
      'default': 'bg-gray-100 text-gray-800'
    };
    return colors[subject] || colors.default;
  };

  const getStatusColor = (status) => {
    const colors = {
      'Pending': 'bg-yellow-100 text-yellow-800',
      'In Progress': 'bg-blue-100 text-blue-800',
      'Completed': 'bg-green-100 text-green-800',
      'On Hold': 'bg-gray-100 text-gray-800',
      'default': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || colors.default;
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-[300px] font-sans">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
          <div className="text-center py-8">
            <div className="inline-flex items-center gap-2 text-sm text-gray-600">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              Loading project details...
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-[300px] font-sans">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
          <div className="flex items-center gap-2 mb-4">
            <button 
              onClick={onBack}
              className="p-1 hover:bg-gray-200 rounded"
            >
              <ArrowLeft size={16} />
            </button>
            <h2 className="text-lg font-medium text-gray-900">Project Details</h2>
          </div>
          
          <div className="text-center py-8">
            <div className="text-red-600 mb-2">⚠️</div>
            <p className="text-sm text-red-600 mb-1">Failed to load project details</p>
            <p className="text-xs text-gray-400 mb-3">{error}</p>
            <button 
              onClick={fetchProjectDetails}
              className="text-xs px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  return (
    <div className="w-full max-w-[300px] font-sans">
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-2 mb-3">
            <button 
              onClick={onBack}
              className="p-1 hover:bg-gray-200 rounded"
            >
              <ArrowLeft size={16} />
            </button>
            <h2 className="text-lg font-medium text-gray-900">Project Details</h2>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-900">{project.project_title}</h3>
            <p className="text-xs text-gray-600">{project.description}</p>
            
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs px-2 py-1 rounded-full ${getSubjectColor(project.subject_domain)}`}>
                {project.subject_domain}
              </span>
              <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(project.status)}`}>
                {project.status}
              </span>
            </div>
            
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Target size={10} />
                {project.stages?.length || 0} stage{(project.stages?.length || 0) !== 1 ? 's' : ''}
              </span>
              <span className="flex items-center gap-1">
                <Clock size={10} />
                {project.stages?.reduce((total, stage) => total + (stage.tasks?.length || 0), 0) || 0} task{(project.stages?.reduce((total, stage) => total + (stage.tasks?.length || 0), 0) || 0) !== 1 ? 's' : ''}
              </span>
              {project.created_at && (
                <span className="flex items-center gap-1">
                  <Calendar size={10} />
                  {new Date(project.created_at).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stages */}
        <div className="max-h-80 overflow-y-auto">
          <div className="p-3 space-y-2">
            {project.stages?.map((stage) => (
              <div key={stage.stage_id} className="border border-gray-200 rounded overflow-hidden">
                {/* Stage Header */}
                <div 
                  className="p-2 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => toggleStageExpansion(stage.stage_id)}
                >
                  <div className="flex items-center gap-2">
                    <button className="p-1 hover:bg-gray-200 rounded">
                      {expandedStages[stage.stage_id] ? (
                        <ChevronDown size={12} />
                      ) : (
                        <ChevronRight size={12} />
                      )}
                    </button>
                    <div className="flex-1 flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-medium text-gray-900">
                          Stage {stage.stage_order}: {stage.title}
                        </h4>
                        <div className="text-xs text-gray-500 mt-1">
                          {stage.tasks?.length || 0} task{(stage.tasks?.length || 0) !== 1 ? 's' : ''}
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(stage.status)}`}>
                        {stage.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stage Content */}
                {expandedStages[stage.stage_id] && (
                  <div className="border-t border-gray-200 p-2 space-y-2">
                    {/* Tasks */}
                    {stage.tasks?.map((task) => (
                      <div key={task.task_id} className="p-2 bg-blue-50 rounded text-xs space-y-1">
                        <h5 className="font-medium text-gray-900">{task.title}</h5>
                        <p className="text-gray-600">{task.description}</p>
                        
                        <div className="flex items-center justify-between text-gray-500">
                          <div className="flex items-center gap-3">
                            {task.status && (
                              <span className={`px-2 py-0.5 rounded-full ${getStatusColor(task.status)}`}>
                                {task.status}
                              </span>
                            )}
                            {task.due_date && (
                              <span className="flex items-center gap-1">
                                <Calendar size={8} />
                                {new Date(task.due_date).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {task.evidence_link && (
                          <div>
                            <a 
                              href={task.evidence_link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 underline"
                            >
                              <BookOpen size={10} />
                              View Resource
                              <ExternalLink size={8} />
                            </a>
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Gate */}
                    {stage.gate && (
                      <div className="p-2 bg-green-50 rounded text-xs space-y-1">
                        <h5 className="font-medium text-gray-900 flex items-center gap-1">
                          <CheckCircle size={10} className="text-green-600" />
                          {stage.gate.title}
                        </h5>
                        <p className="text-gray-600">{stage.gate.description}</p>
                        
                        {stage.gate.checklist && stage.gate.checklist.length > 0 && (
                          <div className="space-y-1 mt-2">
                            <div className="text-xs font-medium text-gray-700 mb-1">Checklist:</div>
                            {stage.gate.checklist.map((item, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                                <span className="text-xs text-gray-700">{item}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {stage.gate.status && (
                          <div className="mt-2">
                            <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(stage.gate.status)}`}>
                              Gate Status: {stage.gate.status}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}