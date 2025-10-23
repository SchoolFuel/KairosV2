import { useState, useEffect } from 'react';
import {
  FolderOpen, ChevronDown, BookOpen, 
  Clock, Search, Filter, RotateCcw
} from 'lucide-react';
import ProjectDetail from './ProjectDetail';

export default function StudentProjects() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [projects, setProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [forceReload, setForceReload] = useState(0); // Add this to force reload

  const fetchProjects = () => {
    setIsLoading(true);
    setError(null);
    
    google.script.run
      .withSuccessHandler((result) => {
        if (result && result.action_response && result.action_response.projects) {
          // Map the API response to match your component's expected structure
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

  const reloadProjects = () => {
    // Clear current data
    setProjects([]);
    setError(null);
    setSearchTerm(''); // Clear search
    setSelectedSubject(''); // Clear filter
    
    // Force a reload by incrementing the counter
    setForceReload(prev => prev + 1);
    
    // If component is not expanded, expand it
    if (!isExpanded) {
      setIsExpanded(true);
    }
  };

  // Load projects when component expands OR when forceReload changes
  useEffect(() => {
    if (isExpanded && (projects.length === 0 || forceReload > 0) && !isLoading) {
      fetchProjects();
    }
  }, [isExpanded, forceReload]); // Remove projects.length and error dependencies

  // Get unique subjects for filtering
  const subjects = [...new Set(projects.map(p => p.subject_domain))];

  // Filter projects based on search and subject
  const filteredProjects = projects.filter(project => {
    const matchesSearch = !searchTerm || 
      project.project_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSubject = !selectedSubject || project.subject_domain === selectedSubject;
    
    return matchesSearch && matchesSubject;
  });

  const toggleExpanded = () => setIsExpanded(!isExpanded);

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

  const getStatusText = () => {
    if (isLoading) return 'Loading projects...';
    if (error) return 'Error loading projects';
    if (projects.length === 0) return 'No projects yet';
    return `${filteredProjects.length} project${filteredProjects.length !== 1 ? 's' : ''}`;
  };

  const getStatusClass = () => {
    if (isLoading) return 'text-yellow-400';
    if (error) return 'text-red-600';
    if (projects.length === 0) return 'text-gray-600';
    return 'text-purple-600';
  };

  const getStatusDot = () => {
    if (isLoading) return 'bg-blue-500';
    if (error) return 'bg-red-500';
    if (projects.length === 0) return 'bg-gray-400';
    return 'bg-purple-500';
  };

  const handleProjectClick = (projectId) => {
    setSelectedProjectId(projectId);
  };

  const handleBackToList = () => {
    setSelectedProjectId(null);
  };

  if (selectedProjectId) {
    return <ProjectDetail projectId={selectedProjectId} onBack={handleBackToList} />;
  }

  return (
    <div className="w-full max-w-[300px] font-sans">
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm w-full overflow-hidden transition-all duration-200">
        {/* Toggle Button */}
        <div 
          onClick={toggleExpanded} 
          className="w-full p-3 cursor-pointer transition-colors duration-200 hover:bg-gray-50"
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="relative">
                <FolderOpen className={`w-5 h-5 ${getStatusClass()}`} />
                <div className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${getStatusDot()}`}></div>
              </div>
              <div>
                <div className="font-medium text-gray-900">My Projects</div>
                <div className="text-sm text-gray-500">
                  {getStatusText()}
                </div>
              </div>
            </div>
            <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
          </div>
        </div>

        {/* Expandable Content */}
        {isExpanded && (
          <div className="border-t border-gray-100">
            <div className="p-3">
              {/* Search and Filter Controls */}
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

              {/* Reload Project Button - Improved */}
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

              {/* Loading State */}
              {isLoading && (
                <div className="text-center py-8">
                  <div className="inline-flex items-center gap-2 text-sm text-gray-600">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    Loading your projects...
                  </div>
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="text-center py-8">
                  <div className="text-red-600 mb-2">⚠️</div>
                  <p className="text-sm text-red-600 mb-1">Failed to load projects</p>
                  <p className="text-xs text-gray-400 mb-3">{error}</p>
                  <button 
                    onClick={fetchProjects}
                    className="text-xs px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              )}

              {/* Empty State */}
              {!isLoading && !error && projects.length === 0 && (
                <div className="text-center py-8">
                  <BookOpen className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 mb-1">No projects yet</p>
                  <p className="text-xs text-gray-400">Create your first project to get started!</p>
                </div>
              )}

              {/* No Results State */}
              {!isLoading && !error && projects.length > 0 && filteredProjects.length === 0 && (
                <div className="text-center py-6">
                  <Search className="w-6 h-6 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No matching projects</p>
                  <p className="text-xs text-gray-400">Try adjusting your search or filter</p>
                </div>
              )}

              {/* Projects List */}
              {!isLoading && !error && filteredProjects.length > 0 && (
                <div className="space-y-2">
                  {filteredProjects.map((project) => (
                    <div key={project.project_id} className="border border-gray-200 rounded-lg overflow-hidden">
                      {/* Project Card */}
                      <div className="p-3 bg-white hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => handleProjectClick(project.project_id)}>
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

              {/* Status Summary */}
              <div className={`text-center py-1 px-2 rounded-full text-xs font-medium inline-block mt-3 ${
                isLoading ? 'bg-blue-100 text-blue-800' :
                error ? 'bg-red-100 text-red-800' :
                projects.length === 0 ? 'bg-gray-100 text-gray-700' :
                'bg-purple-100 text-purple-800'
              }`}>
                {isLoading ? '🔄 Loading...' :
                 error ? '❌ Error' :
                 projects.length === 0 ? '📁 Empty' :
                 `📚 ${filteredProjects.length} project${filteredProjects.length !== 1 ? 's' : ''}`}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}