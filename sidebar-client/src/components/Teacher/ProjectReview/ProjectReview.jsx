import React, { useState } from "react";
import { BookOpen, ChevronDown, ArrowLeft, Loader2, Filter } from "lucide-react";

export default function ProjectReview() {
  const [isSubjectsExpanded, setIsSubjectsExpanded] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("All");
  const [studentNameFilter, setStudentNameFilter] = useState("");

  const subjects = ["Science", "Technology", "English", "Math"];

  const fetchProjects = async (subject) => {
    console.log("I am in fetch projects: ", subject)
    setLoading(true);
    setError(null);

    try {
      google.script.run
        .withSuccessHandler((result)=>{
            setProjects(result.action_response.projects || []);
            setSelectedSubject(subject);
            setLoading(false);
        })
        .withFailureHandler((error)=>{
            console.error("Error calling Apps Script:", error);
            setError("Failed to fetch projects")  
            setLoading(false);
        })
        .getTeacherProjects(subject)
      
    /*
      const data = await response.json();
      
      if (data.status === "success") {
        setProjects(data.action_response.projects || []);
        setSelectedSubject(subject);
      } else {
        setError("Failed to fetch projects");
      }*/
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } 
  };

  const handleSubjectClick = (subject) => {
    fetchProjects(subject);
  };

  const handleBack = () => {
    setSelectedSubject(null);
    setProjects([]);
    setStatusFilter("All");
    setStudentNameFilter("");
  };

  // Get unique statuses from projects
  const uniqueStatuses = ["All", ...new Set(projects.map(p => p.status))];

  // Filter projects
  const filteredProjects = projects.filter(project => {
    const matchesStatus = statusFilter === "All" || project.status === statusFilter;
    const matchesName = studentNameFilter === "" || 
      project.Student_Name.toLowerCase().includes(studentNameFilter.toLowerCase());
    return matchesStatus && matchesName;
  });

  return (
    <div className="w-full max-w-[300px] font-sans" style={{ marginTop: "24px" }}>
      {/* Subjects Card */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm w-full overflow-hidden transition-all duration-200 mb-3">
        {/* Toggle Button */}
        <div
          onClick={() => setIsSubjectsExpanded(!isSubjectsExpanded)}
          className="w-full p-3 cursor-pointer transition-colors duration-200 hover:bg-gray-50"
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="relative">
                <BookOpen className="w-5 h-5 text-gray-600" />
                <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-green-500"></div>
              </div>
              <div>
                <div className="font-medium text-gray-900">ProjectReview</div>
                <div className="text-sm text-gray-500">
                  {selectedSubject ? `Viewing ${selectedSubject}` : "Manage subject areas"}
                </div>
              </div>
            </div>
            <ChevronDown
              className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                isSubjectsExpanded ? "rotate-180" : ""
              }`}
            />
          </div>
        </div>

        {/* Expandable Content */}
        {isSubjectsExpanded && (
          <div className="border-t border-gray-100">
            <div className="p-3">
              {/* Loading State */}
              {loading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                  <span className="ml-2 text-sm text-gray-600">Loading projects...</span>
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                  {error}
                </div>
              )}

              {/* Subject Selection View */}
              {!loading && !selectedSubject && (
                <div className="space-y-2">
                  {subjects.map((subject, index) => (
                    <div
                      key={index}
                      onClick={() => handleSubjectClick(subject)}
                      className="p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      <div className="font-medium text-gray-900 text-sm">
                        {subject}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Projects View */}
              {!loading && selectedSubject && (
                <div className="space-y-3">
                  {/* Back Button */}
                  <button
                    onClick={handleBack}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Subjects</span>
                  </button>

                  {/* Filters */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-medium text-gray-700">
                      <Filter className="w-3 h-3" />
                      <span>Filters</span>
                    </div>
                    
                    {/* Status Filter */}
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {uniqueStatuses.map((status, index) => (
                        <option key={index} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>

                    {/* Student Name Filter */}
                    <input
                      type="text"
                      placeholder="Search by student name..."
                      value={studentNameFilter}
                      onChange={(e) => setStudentNameFilter(e.target.value)}
                      className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Projects List */}
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {filteredProjects.length === 0 ? (
                      <div className="p-4 text-center text-sm text-gray-500">
                        No projects found
                      </div>
                    ) : (
                      filteredProjects.map((project) => (
                        <div
                          key={project.project_id}
                          className="p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="font-medium text-gray-900 text-sm mb-1">
                            {project.title}
                          </div>
                          <div className="text-xs text-gray-600 space-y-0.5">
                            <div>Student: {project.Student_Name}</div>
                            <div className="flex items-center justify-between">
                              <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                                project.status === "Pending" ? "bg-yellow-100 text-yellow-800" :
                                project.status === "Pending Revision" ? "bg-orange-100 text-orange-800" :
                                "bg-gray-100 text-gray-800"
                              }`}>
                                {project.status}
                              </span>
                              <span className="text-gray-500">
                                {new Date(project.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Results Count */}
                  {filteredProjects.length > 0 && (
                    <div className="text-xs text-gray-500 text-center">
                      Showing {filteredProjects.length} of {projects.length} projects
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}