import React, { useState, useEffect, useRef } from 'react';
import {
  FolderOpen, ChevronDown, Clock,
  Search, Filter, RotateCcw, Trash2
} from 'lucide-react';

export default function StudentPrototype() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [projects, setProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [forceReload, setForceReload] = useState(0);
  const [deleting, setDeleting] = useState({});
  const deletingRef = useRef({});
  const STUDENT_USER_ID = '23e228fa-4592-4bdc-852e-192973c388ce';
  const [showProjectDeleteDialog, setShowProjectDeleteDialog] = useState(false);
  const [deleteProjectReason, setDeleteProjectReason] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [loadingProjectId, setLoadingProjectId] = useState(null);



  // ✅ Fetch projects from backend and merge with delete requests
  const fetchProjects = () => {
    setIsLoading(true);
    setError(null);

    google.script.run
      .withSuccessHandler(async (result) => {
        try {
          if (result && result.action_response && result.action_response.projects) {
            const mappedProjects = result.action_response.projects.map((project) => ({
              project_id: project.project_id, // ✅ full UUID
              project_title: project.title,
              description: `${project.subject_domain} project - ${project.status}`,
              subject_domain: project.subject_domain,
              status: project.status,
            }));

            console.log("✅ Loaded projects:", mappedProjects);

            // ✅ Wait for delete requests (resolve before merging)
            const deleteRequests = await new Promise((resolve, reject) => {
              google.script.run
                .withSuccessHandler((res) => {
                  try {
                    // Handle all possible shapes: wrapper, string, or parsed JSON
                    let payloadJson = res;

                    if (res && typeof res === "object" && "body" in res) {
                      payloadJson = res.body; // unwrap Apps Script wrapper
                    }

                    if (typeof payloadJson === "string") {
                      payloadJson = JSON.parse(payloadJson); // parse if string
                    }

                    const requests = payloadJson?.action_response?.requests || [];
                    console.log("✅ Loaded delete requests:", requests);
                    resolve(requests);
                  } catch (err) {
                    console.error("❌ Failed to parse delete requests:", err, res);
                    reject(err);
                  }
                })
                .withFailureHandler((err) => {
                  console.error("❌ Failed to fetch delete requests:", err);
                  reject(err);
                })
                .sendDeleteToBackend({
                  action: "myprojects",
                  payload: {
                    user_id: "23e228fa-4592-4bdc-852e-192973c388ce",
                    email_id: "mindspark.user1@schoolfuel.org",
                    request: "delete_request_details_student",
                  },
                });
            });

            // ✅ Merge projects and intelligently determine their status
            const mergedProjects = mappedProjects.map((p) => {
              const deleteReq = deleteRequests.find(
                (r) =>
                  r.entity_type === "project" &&
                  r.status === "pending" &&
                  r.project_id === p.project_id
              );

              // Track deletion state for disabling buttons
              if (deleteReq) {
                deletingRef.current[p.project_id] = "pending";
                setDeleting((prev) => ({ ...prev, [p.project_id]: "pending" }));
              }

              // Determine final status
              let finalStatus = p.status;

              if (deleteReq) {
                // 🔸 project delete request pending
                finalStatus = "Pending";
              } else if (
                (p.status === "Approved" || p.status === "Completed") &&
                p.stages?.some(stage =>
                  stage.tasks?.some(t => t.status === "Revision")
                )
              ) {
                // 🔸 approved project, but one or more tasks under revision
                finalStatus = "Revision";
              } else if (p.status === "Pending") {
                // 🔸 project not yet approved
                finalStatus = "Pending";
              }

              return { ...p, status: finalStatus };
            });


            // ✅ Apply intelligent project status logic before final set
            const enhancedProjects = await Promise.all(
              mergedProjects.map(async (proj) => {
                // Skip if already pending deletion
                if (proj.status === "Pending Deletion") return proj;

                // Fetch full project details (to inspect tasks)
                return new Promise((resolve) => {
                  google.script.run
                    .withSuccessHandler((result) => {
                      try {
                        const fullProj = result?.action_response?.json?.project;
                        if (!fullProj) return resolve(proj);

                        const hasRevisionTask = (fullProj.stages || []).some((stage) =>
                          (stage.tasks || []).some((t) => t.status === "Revision")
                        );

                        if (
                          hasRevisionTask &&
                          (proj.status === "Approved" || proj.status === "Completed")
                        ) {
                          resolve({ ...proj, status: "Revision" });
                        } else {
                          resolve(proj);
                        }
                      } catch (err) {
                        console.error("Revision check failed for project:", proj.project_id, err);
                        resolve(proj);
                      }
                    })
                    .withFailureHandler(() => resolve(proj))
                    .getProjectDetails(proj.project_id);
                });
              })
            );

            setProjects(enhancedProjects);


          } else {
            setError("Invalid response format");
          }
        } catch (err) {
          console.error("❌ Error merging delete requests:", err);
          setError("Failed to merge delete requests");
        } finally {
          setIsLoading(false);
        }
      })
      .withFailureHandler((error) => {
        console.error("❌ Error calling Apps Script:", error);
        setError(error.message || "Failed to load projects");
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
    setLoadingProjectId(projectId); // show loader under the project
    google.script.run
      .withSuccessHandler(() => {
        setLoadingProjectId(null); // hide loader when dialog opens
      })
      .withFailureHandler(() => {
        setLoadingProjectId(null); // hide even if failed
      })
      .openPrototypeDialog(projectId);
  };


  const handleConfirmProjectDelete = () => {
    if (!selectedProjectId) return;

    const proj = projects.find(p => p.project_id === selectedProjectId);
    const payload = {
      action: "deleterequest",
      payload: {
        request: "student_create",
        actor: {
          role: "student",
          email_id: "mindspark.user1@schoolfuel.org",
          user_id: "23e228fa-4592-4bdc-852e-192973c388ce",
        },
        ids: {
          entity_type: "project",
          project_id: selectedProjectId,
        },
        subject_domain: proj ? proj.subject_domain : "General",
        reason: deleteProjectReason || "No reason provided",
      },
    };

    // Close the dialog immediately for UX
    setShowProjectDeleteDialog(false);
    setDeleteProjectReason("");

    google.script.run
      .withSuccessHandler((response) => {
        try {
          const parsed = typeof response === "string" ? JSON.parse(response) : response;
          const msg = parsed?.action_response?.response || "Delete request initiated successfully!";
          alert(msg);
        } catch {
          alert("Delete request initiated successfully!");
        }

        // Update local status
        setProjects(prev =>
          prev.map(p =>
            p.project_id === selectedProjectId
              ? { ...p, status: "Pending Deletion" }
              : p
          )
        );
        setDeleting(prev => ({ ...prev, [selectedProjectId]: "pending" }));
      })
      .withFailureHandler((err) => {
        console.error("Delete failed:", err);
        alert("Failed to send delete request. Please try again later.");
      })
      .sendDeleteToBackend(payload);
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
      'Approved': 'bg-green-100 text-green-800',     // ✅ green
      'Revision': 'bg-yellow-100 text-yellow-800',   // ✅ yellow
      'Pending': 'bg-red-100 text-red-800',          // ✅ red
      'Completed': 'bg-green-100 text-green-800',
      'default': 'bg-gray-100 text-gray-800',
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
                <div className="font-medium text-gray-900">My Projects</div>
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
                  <div key={project.project_id} className="relative border border-gray-200 rounded-lg overflow-hidden">
                    <div
                      className="p-3 bg-white hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => handleProjectClick(project.project_id)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-gray-900 mb-1">{project.project_title}</h3>
                          <p className="text-xs text-gray-600 mb-2 line-clamp-2">{project.description}</p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-xs px-2 py-1 rounded-full ${getSubjectColor(project.subject_domain)}`}>
                              {project.subject_domain}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(project.status)}`}>
                              {project.status}
                            </span>
                          </div>
                        </div>

                        {/* Right Column → Delete + ID */}
                        <div className="flex flex-col items-end gap-2">
                          <div className="flex items-center text-xs text-gray-400">
                            <Clock size={10} className="mr-1" />
                            <span>ID: {project.project_id.slice(-8)}</span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();

                              // Allow delete only when approved and not pending deletion
                              if (project.status !== "Approved" || deleting[project.project_id] === "pending") return;

                              setSelectedProjectId(project.project_id);
                              setShowProjectDeleteDialog(true);
                            }}
                            disabled={
                              deleting[project.project_id] === "pending" ||
                              project.status !== "Approved"
                            }
                            title={
                              deleting[project.project_id] === "pending"
                                ? "" // ❗ No tooltip when pending deletion
                                : project.status !== "Approved"
                                ? "You can only delete approved projects." // Only show this in non-approved state
                                : ""
                            }
                            className={`text-xs px-3 py-1.5 rounded-md inline-flex flex-col items-center justify-center w-[90px] text-center leading-tight border transition
                              ${
                                deleting[project.project_id] === "pending"
                                  ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                                  : project.status !== "Approved"
                                  ? "bg-gray-200 text-gray-500 border-gray-300 cursor-not-allowed"
                                  : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100 cursor-pointer"
                              }
                            `}
                          >
                            {deleting[project.project_id] === "pending" ? (
                              <>
                                <div className="flex items-center justify-center gap-1">
                                  <Trash2 size={12} />
                                  <span>Pending</span>
                                </div>
                                <span>Deletion</span>
                              </>
                            ) : (
                              <div className="flex items-center justify-center gap-1">
                                <Trash2 size={12} />
                                <span>Delete</span>
                              </div>
                            )}
                          </button>


                            {loadingProjectId === project.project_id && (
                              <div className="absolute bottom-2 right-3 flex items-center gap-1 text-gray-500 text-[11px] animate-pulse bg-white/80 px-2 py-0.5 rounded-md shadow-sm border border-gray-200">
                                <svg
                                  className="w-3.5 h-3.5 animate-spin text-gray-400"
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                >
                                  <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                  ></circle>
                                  <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                                  ></path>
                                </svg>
                                <span className="font-medium text-gray-600">Loading…</span>
                              </div>
                            )}



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
        {showProjectDeleteDialog && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50">
            <div className="bg-white rounded-xl shadow-lg w-[340px] border border-gray-200 p-4 animate-fadeIn">
              <h2 className="text-base font-semibold text-gray-900 text-center mb-2">
                Confirm Project Deletion
              </h2>

              <p className="text-sm text-gray-700 text-center mb-3">
                Are you sure you want to delete this project?
              </p>

              <textarea
                value={deleteProjectReason}
                onChange={(e) => setDeleteProjectReason(e.target.value)}
                placeholder="Reason "
                className="w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none h-12 mb-3"
              />

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setShowProjectDeleteDialog(false);
                    setDeleteProjectReason('');
                  }}
                  className="text-sm px-3 py-1.5 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
                >
                  Cancel
                </button>

                <button
                  onClick={() => handleConfirmProjectDelete(selectedProjectId)}
                  className="text-sm px-3 py-1.5 rounded-md bg-red-600 text-white hover:bg-red-700 transition"
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        )}

    </div>
  );
}
