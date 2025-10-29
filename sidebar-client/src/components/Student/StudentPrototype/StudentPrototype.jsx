import React, { useState, useEffect } from 'react';
import {
  FolderOpen, ChevronDown, Clock,
  Search, Filter, RotateCcw
} from 'lucide-react';

export default function StudentPrototype() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [projects, setProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [forceReload, setForceReload] = useState(0);

  // Fetch projects from backend
  const fetchProjects = () => {
    setIsLoading(true);
    setError(null);

    google.script.run
      .withSuccessHandler((result) => {
        if (result && result.action_response && result.action_response.projects) {
          const mappedProjects = result.action_response.projects.map(project => ({
            project_id: project.project_id,
            project_title: project.title,
            description: `${project.subject_domain} project - ${project.status}`,
            subject_domain: project.subject_domain,
            status: project.status
          }));
          setProjects(mappedProjects);
        } else {
          setError('Invalid response format');
        }
        setIsLoading(false);
      })
      .withFailureHandler((error) => {
        console.error("Error calling Apps Script:", error);
        setError(error.message || 'Failed to load projects');
        setIsLoading(false);
      })
      .getStudentProjects();
  };

  // Reload projects
  const reloadProjects = () => {
    setProjects([]);
    setError(null);
    setSearchTerm('');
    setSelectedSubject('');
    setForceReload(prev => prev + 1);
    if (!isExpanded) setIsExpanded(true);
  };

  // Fetch on expand
  useEffect(() => {
    if (isExpanded && (projects.length === 0 || forceReload > 0) && !isLoading) {
      fetchProjects();
    }
  }, [isExpanded, forceReload]);

  // Filter logic
  const subjects = [...new Set(projects.map(p => p.subject_domain))];

  const filteredProjects = projects.filter(project => {
    const matchesSearch = !searchTerm ||
      project.project_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = !selectedSubject || project.subject_domain === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  // Toggle expand
  const toggleExpanded = () => setIsExpanded(!isExpanded);

  // Open dialog
  const handleProjectClick = (projectId) => {
    google.script.run.openPrototypeDialog(projectId);
  };

  // Color helpers
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

  // Dynamic header color
  const headerColor = isLoading || projects.length === 0
    ? 'text-gray-400'
    : 'text-purple-600';

  const dotColor = isLoading || projects.length === 0
    ? 'bg-gray-300'
    : 'bg-purple-500';

  return (
    <div className="w-full max-w-[300px] font-sans">
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm w-full overflow-hidden transition-all duration-200">
        
        {/* Header */}
        <div
        onClick={toggleExpanded}
        className="w-full p-3 cursor-pointer transition-colors duration-200 hover:bg-gray-50"
        >
        <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
            {/* Folder + Dot */}
            <div className="relative">
                <FolderOpen
                strokeWidth={2.5} // Makes the icon slightly bolder like "My Projects"
                className={`w-5 h-5 transition-colors duration-200 ${
                    isLoading
                    ? 'text-yellow-500'
                    : error
                    ? 'text-red-600'
                    : projects.length === 0
                    ? 'text-gray-400'
                    : 'text-purple-600'
                }`}
                />
                <div
                className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${
                    isLoading
                    ? 'bg-blue-500'
                    : error
                    ? 'bg-red-500'
                    : projects.length === 0
                    ? 'bg-gray-400'
                    : 'bg-purple-500'
                }`}
                ></div>
            </div>

            {/* Title + Subtitle */}
            <div>
                <div className="font-medium text-gray-900">Prototype Projects</div>
                <div className="text-sm text-gray-500">
                {isLoading
                    ? 'Loading projects...'
                    : error
                    ? 'Error loading projects'
                    : projects.length === 0
                    ? 'No projects yet'
                    : `${projects.length} project${projects.length !== 1 ? 's' : ''}`}
                </div>
            </div>
            </div>

            {/* Chevron */}
            <ChevronDown
            className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                isExpanded ? 'rotate-180' : ''
            }`}
            />
        </div>
        </div>

        {/* Expandable content */}
        {isExpanded && (
          <div className="border-t border-gray-100 p-3">
            {projects.length > 0 && !error && (
              <div className="mb-3 space-y-2">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search projects..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-7 pr-3 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 focus:border-purple-500 outline-none"
                  />
                </div>

                {/* Subject Filter */}
                {subjects.length > 1 && (
                  <div className="relative">
                    <Filter className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
                    <select
                      value={selectedSubject}
                      onChange={(e) => setSelectedSubject(e.target.value)}
                      className="w-full pl-7 pr-3 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 focus:border-purple-500 outline-none bg-white"
                    >
                      <option value="">All Subjects</option>
                      {subjects.map(subject => (
                        <option key={subject} value={subject}>{subject}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* Reload Button */}
            <div className="mb-3">
              <button
                onClick={reloadProjects}
                disabled={isLoading}
                className={`
                  flex items-center gap-2 text-xs px-3 py-2 rounded transition-all duration-200
                  ${isLoading
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200 active:scale-95'
                  }
                `}
              >
                <RotateCcw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'Reloading...' : 'Reload Projects'}
              </button>
            </div>

            {/* Projects List */}
            {!isLoading && !error && filteredProjects.length > 0 && (
              <div className="space-y-2">
                {filteredProjects.map((project) => (
                  <div key={project.project_id} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div
                      className="p-3 bg-white hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => handleProjectClick(project.project_id)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-gray-900 mb-1">
                            {project.project_title}
                          </h3>
                          <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                            {project.description}
                          </p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-xs px-2 py-1 rounded-full ${getSubjectColor(project.subject_domain)}`}>
                              {project.subject_domain}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(project.status)}`}>
                              {project.status}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center text-xs text-gray-400">
                          <Clock size={10} className="mr-1" />
                          <span>ID: {project.project_id.slice(-8)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* States */}
            {isLoading && <div className="text-center py-3 text-gray-500 text-xs">Loading projects...</div>}
            {error && <div className="text-center py-3 text-red-500 text-xs">Failed to load: {error}</div>}
          </div>
        )}
      </div>
    </div>
  );
}
