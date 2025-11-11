import React, { useEffect, useState } from "react";
import {
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  BookOpen,
  Trash2,
  RefreshCw,
} from "lucide-react";
import ReviewStageTab from "./ReviewStageTab";
import ReviewTaskCard from "./ReviewTaskCard";
import ReviewGateStandard from "./ReviewGateStandard ";
import GateAssessment from "../GateAssessment/GateAssessment";
import { useDeletionRequests } from "./useDeletionRequests.jsx";
import ProjectCard from "./ProjectCard";
import { deepClone } from "./utils.jsx";
import "./TeacherProjectQueue.css";

/* ---------- Main Component ---------- */
export default function TeacherProjectQueue() {
  // State management
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all"); // all, pending
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProject, setSelectedProject] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  // Deletion requests hook
  const {
    deletionRequests,
    loadDeletionRequests,
    flagTasksWithDeletionRequests,
    removeDeletionRequest,
  } = useDeletionRequests();

  // Detailed project review state
  const [projectDetails, setProjectDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");
  const [selectedStageId, setSelectedStageId] = useState(null);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [stageStatuses, setStageStatuses] = useState({}); // Track individual stage approval/rejection
  const [overallComment, setOverallComment] = useState("");
  const [editableProjectData, setEditableProjectData] = useState(null); // Editable copy of project data
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false); // Track unsaved changes for close warning
  const [successMessage, setSuccessMessage] = useState(""); // Success message to display
  const [errorMessage, setErrorMessage] = useState(""); // Error message to display
  const [isSaving, setIsSaving] = useState(false); // Loading state for approve/reject actions
  const [showCloseConfirm, setShowCloseConfirm] = useState(false); // Show confirmation dialog for closing with unsaved changes
  const [showDeletionRequestsModal, setShowDeletionRequestsModal] =
    useState(false); // Show deletion requests details modal
  const [selectedProjectDeletionRequests, setSelectedProjectDeletionRequests] =
    useState([]); // Deletion requests for selected project

  // Advanced features state
  const [activeTab, setActiveTab] = useState("inbox"); // inbox, gate-A, calendar, analytics
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  // Ref for scrollable stage content container
  const stageContentRef = React.useRef(null);

  const [analytics, setAnalytics] = useState({
    totalProjects: 0,
    approvedProjects: 0,
    pendingProjects: 0,
    rejectedProjects: 0,
    averageReviewTime: 0,
    completionRate: 0,
    medianReviewTime: "2.4h",
    declineRate: "18%",
    throughput: 126,
  });

  // Load projects on component mount
  useEffect(() => {
    loadProjects();
  }, []);

  // Auto-dismiss success messages after 7 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage("");
      }, 7000); // 7 seconds

      return () => clearTimeout(timer); // Cleanup on unmount or message change
    }
  }, [successMessage]);

  // Auto-dismiss error messages after 7 seconds
  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => {
        setErrorMessage("");
      }, 7000); // 7 seconds

      return () => clearTimeout(timer); // Cleanup on unmount or message change
    }
  }, [errorMessage]);

  // Calculate analytics when projects change
  useEffect(() => {
    if (projects.length > 0) {
      const total = projects.length;
      const approved = projects.filter((p) =>
        p.status.toLowerCase().includes("approve")
      ).length;
      const pending = projects.filter((p) =>
        p.status.toLowerCase().includes("pending")
      ).length;
      const rejected = projects.filter(
        (p) =>
          p.status.toLowerCase().includes("reject") ||
          p.status.toLowerCase().includes("revision")
      ).length;

      setAnalytics((prev) => ({
        ...prev,
        totalProjects: total,
        approvedProjects: approved,
        pendingProjects: pending,
        rejectedProjects: rejected,
        completionRate: Math.round((approved / total) * 100),
      }));
    }
  }, [projects]);

  // Reset scroll to top when stage index changes
  useEffect(() => {
    if (stageContentRef.current) {
      stageContentRef.current.scrollTop = 0;
    }
  }, [currentStageIndex]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError("");

      // Call Google Apps Script function to fetch all teacher projects
      return new Promise((resolve, reject) => {
        google.script.run
          .withSuccessHandler(async (response) => {
            try {
              console.log(
                "Raw API response:",
                JSON.stringify(response, null, 2)
              );

              // Handle the response structure: { statusCode, body: { action_response: { projects: [...] } } }
              let projects = [];

              if (response && response.body) {
                const body = response.body;
                console.log("Response body:", JSON.stringify(body, null, 2));

                // Try multiple paths to find projects array
                // Path 1: body.projects (direct)
                if (Array.isArray(body.projects)) {
                  projects = body.projects;
                  console.log(
                    `Found ${projects.length} projects in body.projects`
                  );
                }
                // Path 2: body.action_response.projects
                else if (
                  body.action_response &&
                  Array.isArray(body.action_response.projects)
                ) {
                  projects = body.action_response.projects;
                  console.log(
                    `Found ${projects.length} projects in body.action_response.projects`
                  );
                }
                // Path 3: body.projects (if it's an object with projects property)
                else if (body.projects && Array.isArray(body.projects)) {
                  projects = body.projects;
                  console.log(
                    `Found ${projects.length} projects in body.projects (nested)`
                  );
                }
              }
              // Path 4: response.action_response.projects (direct on response)
              else if (
                response &&
                response.action_response &&
                Array.isArray(response.action_response.projects)
              ) {
                projects = response.action_response.projects;
                console.log(
                  `Found ${projects.length} projects in response.action_response.projects`
                );
              }
              // Path 5: response is directly an array
              else if (Array.isArray(response)) {
                projects = response;
                console.log(
                  `Found ${projects.length} projects in response array`
                );
              }

              console.log(`Total projects found: ${projects.length}`);

              if (projects.length === 0) {
                console.warn(
                  "No projects found in response. Full response structure:",
                  response
                );
                // Don't set error, just let empty state show naturally
              }

              // Map API response to component expected format
              const mappedProjects = projects.map((project) => ({
                project_id: project.project_id || project.id,
                user_id: project.user_id,
                title: project.title || project.project_title || "",
                project_title: project.title || project.project_title || "",
                subject_domain: project.subject_domain || "",
                status: project.status || "Pending",
                owner_name: project.Student_Name || project.owner_name || "",
                owner_email: project.owner_email || "",
                description: project.description || "",
                created_at: project.created_at || new Date().toISOString(),
                stages: project.stages || [], // Keep stages if available, otherwise empty array
              }));

              console.log(`Mapped ${mappedProjects.length} projects`);

              // Show projects immediately (don't wait for deletion requests)
              setProjects(mappedProjects);
              setLoading(false); // Set loading to false immediately
              resolve(mappedProjects);

              // Load deletion requests in background and update projects
              // This allows UI to show projects faster
              const subjectDomains = mappedProjects
                .map((p) => p.subject_domain)
                .filter((d) => d);

              if (subjectDomains.length > 0) {
                loadDeletionRequests(subjectDomains)
                  .then((deletionRequestsList) => {
                    // Flag tasks with deletion requests and update projects
                    const flaggedProjects = flagTasksWithDeletionRequests(
                      mappedProjects,
                      deletionRequestsList
                    );
                    setProjects(flaggedProjects);
                    console.log("Projects updated with deletion request flags");
                  })
                  .catch((err) => {
                    console.error("Error loading deletion requests:", err);
                    // Don't block UI if deletion requests fail
                  });
              }
            } catch (parseError) {
              console.error("Error parsing projects response:", parseError);
              setError("Error parsing project data: " + parseError.message);
              setLoading(false);
              reject(parseError);
            }
          })
          .withFailureHandler((error) => {
            console.error("Error loading projects:", error);
            setError(error?.message || "Failed to load projects");
            setLoading(false);
            reject(error);
          })
          .getTeacherProjectsAll();
      });
    } catch (err) {
      console.error("Error in loadProjects:", err);
      setError(err?.message || "Failed to load projects");
      setLoading(false);
    }
  };

  // Filter projects based on status and search term
  const filteredProjects = projects.filter((project) => {
    const matchesFilter =
      filter === "all" ||
      project.status.toLowerCase().includes(filter.toLowerCase());

    const matchesSearch =
      !searchTerm ||
      project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.subject_domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.owner_name.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  // Action handlers
  const handleReview = (project) => {
    setSelectedProject(project);
    setShowDetails(true);
    setCurrentStageIndex(0);
    setStageStatuses({}); // Reset stage statuses for new project
    setOverallComment(""); // Reset comments
    setHasUnsavedChanges(false); // Reset unsaved changes
    setEditableProjectData(null); // Will be set when projectDetails loads
    setSuccessMessage(""); // Reset success message
    setErrorMessage(""); // Reset error message
    setIsSaving(false); // Reset saving state
    setShowCloseConfirm(false); // Reset close confirmation state

    // Fetch detailed project data (including stages) when reviewing
    setDetailsLoading(true);
    setDetailsError("");

    google.script.run
      .withSuccessHandler((response) => {
        try {
          let projectDetails = project; // Start with basic project data
          let fetchedProject = null;

          // Handle nested response structure: response.body.action_response.json.project
          if (response?.body?.action_response?.json?.project) {
            fetchedProject = response.body.action_response.json.project;
          } else if (response?.body?.project) {
            fetchedProject = response.body.project;
          } else if (response?.project) {
            fetchedProject = response.project;
          } else if (response?.body?.action_response?.project) {
            fetchedProject = response.body.action_response.project;
          }

          if (fetchedProject) {
            // Merge detailed project data with basic data
            projectDetails = {
              ...project,
              ...fetchedProject,
              // Ensure required fields are present
              project_id: fetchedProject.project_id || project.project_id,
              title:
                fetchedProject.title ||
                fetchedProject.project_title ||
                project.title,
              project_title:
                fetchedProject.project_title ||
                fetchedProject.title ||
                project.project_title,
              description:
                fetchedProject.description || project.description || "",
              stages: fetchedProject.stages || project.stages || [],
            };
          } else {
            // If no fetched project but we have basic project, use it with empty stages array
            projectDetails = {
              ...project,
              stages: project.stages || [],
            };
          }

          // Flag tasks with deletion requests before setting project details
          const projectWithDeletionFlags = flagTasksWithDeletionRequests(
            [projectDetails],
            deletionRequests
          )[0];

          setProjectDetails(projectWithDeletionFlags);
          // Initialize editable copy (deep clone)
          const editableCopy = deepClone(projectWithDeletionFlags);
          setEditableProjectData(editableCopy);
          setDetailsLoading(false);
        } catch (parseError) {
          console.error("Error parsing project details:", parseError);
          setDetailsError("Error loading project details");
          // Fallback to basic project data if detailed fetch fails
          setProjectDetails(project);
          // Initialize editable copy with basic project data
          const editableCopy = deepClone(project);
          setEditableProjectData(editableCopy);
          setDetailsLoading(false);
        }
      })
      .withFailureHandler((error) => {
        console.error("Error fetching project details:", error);
        setDetailsError("Failed to load project details");
        // Fallback to basic project data
        setProjectDetails(project);
        // Initialize editable copy with basic project data
        const editableCopy = deepClone(project);
        setEditableProjectData(editableCopy);
        setDetailsLoading(false);
      })
      .getTeacherProjectDetails(project.project_id, project.user_id);
  };

  const handleApprove = async (project) => {
    try {
      // Use editableProjectData if available (from review modal), otherwise use project
      const projectDataToSave = deepClone(editableProjectData || project);

      if (!projectDataToSave.project_id || !projectDataToSave.user_id) {
        setErrorMessage(
          "Error: Missing project ID or user ID. Cannot approve project."
        );
        return;
      }

      // Show loading state immediately
      setIsSaving(true);
      setSuccessMessage(""); // Clear any previous message
      setErrorMessage(""); // Clear any previous error

      // Call backend API to save project with Approved status
      google.script.run
        .withSuccessHandler((response) => {
          setIsSaving(false); // Clear loading state
          if (response.success) {
            // Update project status locally
            setProjects((prev) =>
              prev.map((p) =>
                p.project_id === project.project_id
                  ? { ...p, status: "Approved" }
                  : p
              )
            );

            // Update projectDetails if it exists
            if (projectDetails) {
              setProjectDetails((prev) => ({ ...prev, status: "Approved" }));
            }

            // Clear unsaved changes flag since everything is saved
            setHasUnsavedChanges(false);

            // Show success message in green
            setSuccessMessage("Project approved successfully!");
            setErrorMessage(""); // Clear any error message
          } else {
            setIsSaving(false); // Clear loading state
            setErrorMessage(response.message || "Failed to approve project");
            setSuccessMessage(""); // Clear success message
          }
        })
        .withFailureHandler((error) => {
          setIsSaving(false); // Clear loading state
          console.error("Error approving project:", error);
          setErrorMessage(
            "Error approving project: " + (error.message || "Unknown error")
          );
          setSuccessMessage(""); // Clear success message
        })
        .saveTeacherProjectUpdate(projectDataToSave, "Approved");
    } catch (err) {
      setIsSaving(false); // Clear loading state on error
      console.error("Error approving project:", err);
      setErrorMessage(
        "Error approving project: " + (err.message || "Unknown error")
      );
      setSuccessMessage(""); // Clear success message
    }
  };

  const handleReject = async (project) => {
    try {
      // Use editableProjectData if available (from review modal), otherwise use project
      const projectDataToSave = deepClone(editableProjectData || project);

      if (!projectDataToSave.project_id || !projectDataToSave.user_id) {
        setErrorMessage(
          "Error: Missing project ID or user ID. Cannot request revision."
        );
        return;
      }

      // Show loading state immediately
      setIsSaving(true);
      setSuccessMessage(""); // Clear any previous message
      setErrorMessage(""); // Clear any previous error

      // Call backend API to save project with Pending Revision status
      google.script.run
        .withSuccessHandler((response) => {
          setIsSaving(false); // Clear loading state
          if (response.success) {
            // Update project status locally
            setProjects((prev) =>
              prev.map((p) =>
                p.project_id === project.project_id
                  ? { ...p, status: "Pending Revision" }
                  : p
              )
            );

            // Update projectDetails if it exists
            if (projectDetails) {
              setProjectDetails((prev) => ({
                ...prev,
                status: "Pending Revision",
              }));
            }

            // Clear unsaved changes flag since everything is saved
            setHasUnsavedChanges(false);

            // Show success message in green
            setSuccessMessage("Revision requested successfully!");
            setErrorMessage(""); // Clear any error message
          } else {
            setIsSaving(false); // Clear loading state
            setErrorMessage(response.message || "Failed to request revision");
            setSuccessMessage(""); // Clear success message
          }
        })
        .withFailureHandler((error) => {
          setIsSaving(false); // Clear loading state
          console.error("Error requesting revision:", error);
          setErrorMessage(
            "Error requesting revision: " + (error.message || "Unknown error")
          );
          setSuccessMessage(""); // Clear success message
        })
        .saveTeacherProjectUpdate(projectDataToSave, "Pending Revision");
    } catch (err) {
      setIsSaving(false); // Clear loading state on error
      console.error("Error requesting revision:", err);
      setErrorMessage(
        "Error requesting revision: " + (err.message || "Unknown error")
      );
      setSuccessMessage(""); // Clear success message
    }
  };

  const handleCloseDetails = () => {
    if (hasUnsavedChanges) {
      // Show custom confirmation dialog instead of browser confirm
      setShowCloseConfirm(true);
      return;
    }
    // Close immediately if no unsaved changes
    closeDialog();
  };

  const closeDialog = () => {
    setShowDetails(false);
    setSelectedProject(null);
    setEditableProjectData(null);
    setHasUnsavedChanges(false);
    setSuccessMessage(""); // Clear success message when closing
    setErrorMessage(""); // Clear error message when closing
    setShowCloseConfirm(false); // Close confirmation dialog
  };

  // Handle stage deletion approval
  const handleApproveStageDeletion = async (stageIndex) => {
    try {
      // Find stage by index - need to filter out gates first to get correct index
      const stagesOnly = editableProjectData.stages.filter(
        (item) => item.stage_id
      );
      const stage = stagesOnly[stageIndex];

      if (!stage) {
        setErrorMessage("Stage not found");
        return;
      }

      const requestId = stage.deletion_request_id;
      const stageId = stage.stage_id;

      if (!requestId) {
        setErrorMessage("Deletion request ID not found");
        return;
      }

      setIsSaving(true);
      setSuccessMessage("");
      setErrorMessage("");

      google.script.run
        .withSuccessHandler((response) => {
          if (response.success) {
            // Backend already deleted the stage, remove immediately from UI
            setEditableProjectData((prev) => {
              const newData = deepClone(prev);

              // Find and remove stage by stage_id (more reliable than index)
              const filteredStages = newData.stages.filter(
                (s) => s.stage_id !== stageId
              );
              newData.stages = filteredStages;

              // Update current stage index if needed
              // Count only actual stages (with stage_id) for index calculation
              const remainingStages = filteredStages.filter((s) => s.stage_id);
              if (
                currentStageIndex >= remainingStages.length &&
                remainingStages.length > 0
              ) {
                setCurrentStageIndex(Math.max(0, remainingStages.length - 1));
              } else if (remainingStages.length === 0) {
                setCurrentStageIndex(0);
              }

              return newData;
            });

            // Also update projectDetails if it exists
            if (projectDetails) {
              setProjectDetails((prev) => {
                const newData = deepClone(prev);
                newData.stages = newData.stages.filter(
                  (s) => s.stage_id !== stageId
                );
                return newData;
              });
            }

            // Update main projects list as well
            setProjects((prevProjects) => {
              return prevProjects.map((project) => {
                if (project.project_id === editableProjectData.project_id) {
                  const updatedProject = deepClone(project);
                  updatedProject.stages = updatedProject.stages.filter(
                    (s) => s.stage_id !== stageId
                  );
                  return updatedProject;
                }
                return project;
              });
            });

            // Remove the approved request from deletion requests list
            removeDeletionRequest(requestId);

            setIsSaving(false);
            setSuccessMessage(
              `Stage "${stage.title || "stage"}" deleted successfully!`
            );
            setErrorMessage("");

            // Reload deletion requests in background to update counts
            const subjectDomains = [editableProjectData.subject_domain].filter(
              (d) => d
            );
            loadDeletionRequests(subjectDomains)
              .then((requests) => {
                // Re-flag projects with updated deletion requests
                setEditableProjectData((prev) => {
                  const flaggedProjects = flagTasksWithDeletionRequests(
                    [prev],
                    requests
                  );
                  return flaggedProjects[0] || prev;
                });

                // Also update main projects list
                setProjects((prevProjects) => {
                  return flagTasksWithDeletionRequests(prevProjects, requests);
                });
              })
              .catch((err) => {
                console.warn("Background sync failed (non-critical):", err);
              });
          } else {
            setIsSaving(false);
            setErrorMessage(
              response.message || "Failed to approve deletion request"
            );
            setSuccessMessage("");
          }
        })
        .withFailureHandler((error) => {
          setIsSaving(false);
          console.error("Error approving deletion request:", error);
          setErrorMessage(
            "Error approving deletion request: " +
              (error.message || "Unknown error")
          );
          setSuccessMessage("");
        })
        .approveDeletionRequest(requestId, "stage");
    } catch (err) {
      setIsSaving(false);
      console.error("Error approving stage deletion:", err);
      setErrorMessage(
        "Error approving stage deletion: " + (err.message || "Unknown error")
      );
      setSuccessMessage("");
    }
  };

  // Handle stage deletion rejection
  const handleRejectStageDeletion = async (stageIndex) => {
    try {
      // Find stage by index - need to filter out gates first to get correct index
      const stagesOnly = editableProjectData.stages.filter(
        (item) => item.stage_id
      );
      const stage = stagesOnly[stageIndex];

      if (!stage) {
        setErrorMessage("Stage not found");
        return;
      }

      const requestId = stage.deletion_request_id;
      const stageId = stage.stage_id;

      if (!requestId) {
        setErrorMessage("Deletion request ID not found");
        return;
      }

      setIsSaving(true);
      setSuccessMessage("");
      setErrorMessage("");

      google.script.run
        .withSuccessHandler((response) => {
          setIsSaving(false);
          if (response.success) {
            // Compute updated deletion requests list (remove the rejected one)
            const updatedDeletionRequests = deletionRequests.filter(
              (req) => req.request_id !== requestId
            );

            // Update deletion requests state immediately
            removeDeletionRequest(requestId);

            // Remove deletion flags from local state and re-flag with updated requests
            setEditableProjectData((prev) => {
              const newData = deepClone(prev);

              // Find stage by stage_id (more reliable than index)
              const stageToUpdate = newData.stages.find(
                (s) => s.stage_id === stageId
              );

              if (stageToUpdate) {
                // Remove flags from stage
                delete stageToUpdate.deletion_requested;
                delete stageToUpdate.deletion_request_status;
                delete stageToUpdate.deletion_request_id;
              }

              // Re-flag the entire project with updated deletion requests (excluding rejected one)
              const flaggedProjects = flagTasksWithDeletionRequests(
                [newData],
                updatedDeletionRequests
              );

              return flaggedProjects[0] || newData;
            });

            // Also update projectDetails if it exists
            if (projectDetails) {
              setProjectDetails((prev) => {
                const newData = deepClone(prev);
                const stageToUpdate = newData.stages.find(
                  (s) => s.stage_id === stageId
                );
                if (stageToUpdate) {
                  delete stageToUpdate.deletion_requested;
                  delete stageToUpdate.deletion_request_status;
                  delete stageToUpdate.deletion_request_id;
                }
                const flaggedProjects = flagTasksWithDeletionRequests(
                  [newData],
                  updatedDeletionRequests
                );
                return flaggedProjects[0] || newData;
              });
            }

            // Update main projects list as well
            setProjects((prevProjects) => {
              return flagTasksWithDeletionRequests(
                prevProjects,
                updatedDeletionRequests
              );
            });

            setSuccessMessage(
              `Deletion request for "${
                stage.title || "stage"
              }" rejected successfully!`
            );
            setErrorMessage("");

            // Note: We don't reload deletion requests here because:
            // 1. Local state is already updated (request removed, flags cleared)
            // 2. Backend might not have processed the rejection yet
            // 3. Reloading could reintroduce the rejected request if backend is slow
            // 4. Next refresh will get the correct state from backend
          } else {
            setErrorMessage(
              response.message || "Failed to reject deletion request"
            );
            setSuccessMessage("");
          }
        })
        .withFailureHandler((error) => {
          setIsSaving(false);
          console.error("Error rejecting deletion request:", error);
          setErrorMessage(
            "Error rejecting deletion request: " +
              (error.message || "Unknown error")
          );
          setSuccessMessage("");
        })
        .rejectDeletionRequest(requestId);
    } catch (err) {
      setIsSaving(false);
      console.error("Error rejecting stage deletion:", err);
      setErrorMessage(
        "Error rejecting stage deletion: " + (err.message || "Unknown error")
      );
      setSuccessMessage("");
    }
  };

  // Handle task deletion approval
  const handleApproveTaskDeletion = async (stageIndex, taskIndex) => {
    try {
      // Find stage by index - need to filter out gates first to get correct index
      const stagesOnly = editableProjectData.stages.filter(
        (item) => item.stage_id
      );
      const stage = stagesOnly[stageIndex];

      if (!stage || !stage.tasks || !stage.tasks[taskIndex]) {
        setErrorMessage("Task not found");
        return;
      }

      const task = stage.tasks[taskIndex];
      const requestId = task.deletion_request_id;
      const stageId = stage.stage_id;
      const taskId = task.task_id;

      if (!requestId) {
        setErrorMessage("Deletion request ID not found");
        return;
      }

      setIsSaving(true);
      setSuccessMessage("");
      setErrorMessage("");

      google.script.run
        .withSuccessHandler((response) => {
          if (response.success) {
            // Backend already deleted the task, remove immediately from UI
            setEditableProjectData((prev) => {
              const newData = deepClone(prev);

              // Find stage by stage_id (more reliable than index)
              const stageToUpdate = newData.stages.find(
                (s) => s.stage_id === stageId
              );

              if (stageToUpdate && stageToUpdate.tasks) {
                // Remove task by task_id (more reliable than index)
                stageToUpdate.tasks = stageToUpdate.tasks.filter(
                  (t) => t.task_id !== taskId
                );
              }

              return newData;
            });

            // Also update projectDetails if it exists
            if (projectDetails) {
              setProjectDetails((prev) => {
                const newData = deepClone(prev);
                const stageToUpdate = newData.stages.find(
                  (s) => s.stage_id === stageId
                );
                if (stageToUpdate && stageToUpdate.tasks) {
                  stageToUpdate.tasks = stageToUpdate.tasks.filter(
                    (t) => t.task_id !== taskId
                  );
                }
                return newData;
              });
            }

            // Update main projects list as well
            setProjects((prevProjects) => {
              return prevProjects.map((project) => {
                if (project.project_id === editableProjectData.project_id) {
                  const updatedProject = deepClone(project);
                  const stageToUpdate = updatedProject.stages.find(
                    (s) => s.stage_id === stageId
                  );
                  if (stageToUpdate && stageToUpdate.tasks) {
                    stageToUpdate.tasks = stageToUpdate.tasks.filter(
                      (t) => t.task_id !== taskId
                    );
                  }
                  return updatedProject;
                }
                return project;
              });
            });

            // Remove the approved request from deletion requests list
            removeDeletionRequest(requestId);

            setIsSaving(false);
            setSuccessMessage(
              `Task "${task.title || "task"}" deleted successfully!`
            );
            setErrorMessage("");

            // Reload deletion requests in background to update counts
            const subjectDomains = [editableProjectData.subject_domain].filter(
              (d) => d
            );
            loadDeletionRequests(subjectDomains)
              .then((requests) => {
                // Re-flag projects with updated deletion requests
                setEditableProjectData((prev) => {
                  const flaggedProjects = flagTasksWithDeletionRequests(
                    [prev],
                    requests
                  );
                  return flaggedProjects[0] || prev;
                });

                // Also update main projects list
                setProjects((prevProjects) => {
                  return flagTasksWithDeletionRequests(prevProjects, requests);
                });
              })
              .catch((err) => {
                console.warn("Background sync failed (non-critical):", err);
              });
          } else {
            setIsSaving(false);
            setErrorMessage(
              response.message || "Failed to approve deletion request"
            );
            setSuccessMessage("");
          }
        })
        .withFailureHandler((error) => {
          setIsSaving(false);
          console.error("Error approving deletion request:", error);
          setErrorMessage(
            "Error approving deletion request: " +
              (error.message || "Unknown error")
          );
          setSuccessMessage("");
        })
        .approveDeletionRequest(requestId, "task");
    } catch (err) {
      setIsSaving(false);
      console.error("Error approving task deletion:", err);
      setErrorMessage(
        "Error approving task deletion: " + (err.message || "Unknown error")
      );
      setSuccessMessage("");
    }
  };

  // Handle project deletion approval
  const handleApproveProjectDeletion = async (projectData) => {
    try {
      // Use editableProjectData if available (from review modal), otherwise use projectData
      const project = editableProjectData || projectData;

      if (!project || !project.deletion_request_id) {
        setErrorMessage("Deletion request ID not found");
        return;
      }

      const requestId = project.deletion_request_id;

      setIsSaving(true);
      setSuccessMessage("");
      setErrorMessage("");

      google.script.run
        .withSuccessHandler((response) => {
          if (response.success) {
            // Remove the approved request from deletion requests list
            removeDeletionRequest(requestId);

            // Close the review modal if it's open for this project
            if (
              selectedProject &&
              selectedProject.project_id === project.project_id
            ) {
              handleCloseDetails();
            }

            // Remove project from projects list (backend handles actual deletion)
            setProjects((prevProjects) => {
              const remainingProjects = prevProjects.filter(
                (p) => p.project_id !== project.project_id
              );

              // Reload deletion requests in background to update counts for remaining projects
              const subjectDomains = remainingProjects
                .map((p) => p.subject_domain)
                .filter((d) => d);

              if (subjectDomains.length > 0) {
                // Load deletion requests asynchronously
                loadDeletionRequests(subjectDomains)
                  .then((requests) => {
                    // Update remaining projects with updated deletion requests
                    setProjects((prevProjects) => {
                      const updatedProjects = prevProjects.filter(
                        (p) => p.project_id !== project.project_id
                      );
                      return flagTasksWithDeletionRequests(
                        updatedProjects,
                        requests
                      );
                    });
                  })
                  .catch((err) => {
                    console.warn("Background sync failed (non-critical):", err);
                  });
              }

              return remainingProjects;
            });

            setIsSaving(false);
            setSuccessMessage(
              `Project "${
                project.title || project.project_title || "project"
              }" deleted successfully!`
            );
            setErrorMessage("");
          } else {
            setIsSaving(false);
            setErrorMessage(
              response.message || "Failed to approve deletion request"
            );
            setSuccessMessage("");
          }
        })
        .withFailureHandler((error) => {
          setIsSaving(false);
          console.error("Error approving deletion request:", error);
          setErrorMessage(
            "Error approving deletion request: " +
              (error.message || "Unknown error")
          );
          setSuccessMessage("");
        })
        .approveDeletionRequest(requestId, "project");
    } catch (err) {
      setIsSaving(false);
      console.error("Error approving project deletion:", err);
      setErrorMessage(
        "Error approving project deletion: " + (err.message || "Unknown error")
      );
      setSuccessMessage("");
    }
  };

  // Handle project deletion rejection
  const handleRejectProjectDeletion = async (projectData) => {
    try {
      // Use editableProjectData if available (from review modal), otherwise use projectData
      const project = editableProjectData || projectData;

      if (!project || !project.deletion_request_id) {
        setErrorMessage("Deletion request ID not found");
        return;
      }

      const requestId = project.deletion_request_id;

      setIsSaving(true);
      setSuccessMessage("");
      setErrorMessage("");

      google.script.run
        .withSuccessHandler((response) => {
          setIsSaving(false);
          if (response.success) {
            // Compute updated deletion requests list (remove the rejected one)
            const updatedDeletionRequests = deletionRequests.filter(
              (req) => req.request_id !== requestId
            );

            // Update deletion requests state immediately
            removeDeletionRequest(requestId);

            // Remove deletion flags from project in projects list
            setProjects((prevProjects) => {
              return prevProjects.map((p) => {
                if (p.project_id === project.project_id) {
                  const updatedProject = { ...p };
                  delete updatedProject.deletion_requested;
                  delete updatedProject.deletion_request_status;
                  delete updatedProject.deletion_request_id;

                  // Re-flag projects with updated deletion requests (excluding rejected one)
                  const flaggedProjects = flagTasksWithDeletionRequests(
                    [updatedProject],
                    updatedDeletionRequests
                  );
                  return flaggedProjects[0] || updatedProject;
                }
                return p;
              });
            });

            // Also update editableProjectData if it exists (review modal)
            if (
              editableProjectData &&
              editableProjectData.project_id === project.project_id
            ) {
              setEditableProjectData((prev) => {
                if (!prev) return prev;
                const newData = { ...prev };
                delete newData.deletion_requested;
                delete newData.deletion_request_status;
                delete newData.deletion_request_id;

                // Re-flag with updated deletion requests
                const flaggedProjects = flagTasksWithDeletionRequests(
                  [newData],
                  updatedDeletionRequests
                );
                return flaggedProjects[0] || newData;
              });
            }

            setSuccessMessage(
              `Deletion request for project "${
                project.title || project.project_title || "project"
              }" rejected successfully!`
            );
            setErrorMessage("");
          } else {
            setErrorMessage(
              response.message || "Failed to reject deletion request"
            );
            setSuccessMessage("");
          }
        })
        .withFailureHandler((error) => {
          setIsSaving(false);
          console.error("Error rejecting deletion request:", error);
          setErrorMessage(
            "Error rejecting deletion request: " +
              (error.message || "Unknown error")
          );
          setSuccessMessage("");
        })
        .rejectDeletionRequest(requestId);
    } catch (err) {
      setIsSaving(false);
      console.error("Error rejecting project deletion:", err);
      setErrorMessage(
        "Error rejecting project deletion: " + (err.message || "Unknown error")
      );
      setSuccessMessage("");
    }
  };

  // Handle task deletion rejection
  const handleRejectTaskDeletion = async (stageIndex, taskIndex) => {
    try {
      // Find stage by index - need to filter out gates first to get correct index
      const stagesOnly = editableProjectData.stages.filter(
        (item) => item.stage_id
      );
      const stage = stagesOnly[stageIndex];

      if (!stage || !stage.tasks || !stage.tasks[taskIndex]) {
        setErrorMessage("Task not found");
        return;
      }

      const task = stage.tasks[taskIndex];
      const requestId = task.deletion_request_id;
      const stageId = stage.stage_id;
      const taskId = task.task_id;

      if (!requestId) {
        setErrorMessage("Deletion request ID not found");
        return;
      }

      setIsSaving(true);
      setSuccessMessage("");
      setErrorMessage("");

      google.script.run
        .withSuccessHandler((response) => {
          setIsSaving(false);
          if (response.success) {
            // Compute updated deletion requests list (remove the rejected one)
            const updatedDeletionRequests = deletionRequests.filter(
              (req) => req.request_id !== requestId
            );

            // Update deletion requests state immediately
            removeDeletionRequest(requestId);

            // Remove deletion flags from local state and re-flag with updated requests
            setEditableProjectData((prev) => {
              const newData = deepClone(prev);

              // Find stage by stage_id (more reliable than index)
              const stageToUpdate = newData.stages.find(
                (s) => s.stage_id === stageId
              );

              if (stageToUpdate && stageToUpdate.tasks) {
                // Find task by task_id (more reliable than index)
                const taskToUpdate = stageToUpdate.tasks.find(
                  (t) => t.task_id === taskId
                );

                if (taskToUpdate) {
                  // Remove flags from task
                  delete taskToUpdate.deletion_requested;
                  delete taskToUpdate.deletion_request_status;
                  delete taskToUpdate.deletion_request_id;
                }
              }

              // Re-flag the entire project with updated deletion requests (excluding rejected one)
              const flaggedProjects = flagTasksWithDeletionRequests(
                [newData],
                updatedDeletionRequests
              );

              return flaggedProjects[0] || newData;
            });

            // Also update projectDetails if it exists
            if (projectDetails) {
              setProjectDetails((prev) => {
                const newData = deepClone(prev);
                const stageToUpdate = newData.stages.find(
                  (s) => s.stage_id === stageId
                );
                if (stageToUpdate && stageToUpdate.tasks) {
                  const taskToUpdate = stageToUpdate.tasks.find(
                    (t) => t.task_id === taskId
                  );
                  if (taskToUpdate) {
                    delete taskToUpdate.deletion_requested;
                    delete taskToUpdate.deletion_request_status;
                    delete taskToUpdate.deletion_request_id;
                  }
                }
                const flaggedProjects = flagTasksWithDeletionRequests(
                  [newData],
                  updatedDeletionRequests
                );
                return flaggedProjects[0] || newData;
              });
            }

            // Update main projects list as well
            setProjects((prevProjects) => {
              return flagTasksWithDeletionRequests(
                prevProjects,
                updatedDeletionRequests
              );
            });

            setSuccessMessage(
              `Deletion request for "${
                task.title || "task"
              }" rejected successfully!`
            );
            setErrorMessage("");

            // Note: We don't reload deletion requests here because:
            // 1. Local state is already updated (request removed, flags cleared)
            // 2. Backend might not have processed the rejection yet
            // 3. Reloading could reintroduce the rejected request if backend is slow
            // 4. Next refresh will get the correct state from backend
          } else {
            setErrorMessage(
              response.message || "Failed to reject deletion request"
            );
            setSuccessMessage("");
          }
        })
        .withFailureHandler((error) => {
          setIsSaving(false);
          console.error("Error rejecting deletion request:", error);
          setErrorMessage(
            "Error rejecting deletion request: " +
              (error.message || "Unknown error")
          );
          setSuccessMessage("");
        })
        .rejectDeletionRequest(requestId);
    } catch (err) {
      setIsSaving(false);
      console.error("Error rejecting task deletion:", err);
      setErrorMessage(
        "Error rejecting task deletion: " + (err.message || "Unknown error")
      );
      setSuccessMessage("");
    }
  };

  // Helper function to update editable project data
  const updateEditableData = (path, value) => {
    setEditableProjectData((prev) => {
      if (!prev) return prev;
      const newData = deepClone(prev);
      const keys = path.split(".");
      let current = newData;

      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (key.includes("[") && key.includes("]")) {
          // Handle array indices like "stages[0]"
          const match = key.match(/(\w+)\[(\d+)\]/);
          if (match) {
            const arrName = match[1];
            const arrIndex = parseInt(match[2]);
            if (!current[arrName]) current[arrName] = [];
            if (!current[arrName][arrIndex]) current[arrName][arrIndex] = {};
            current = current[arrName][arrIndex];
            continue;
          }
        }
        if (!current[key]) current[key] = {};
        current = current[key];
      }

      const lastKey = keys[keys.length - 1];
      if (lastKey.includes("[") && lastKey.includes("]")) {
        const match = lastKey.match(/(\w+)\[(\d+)\]/);
        if (match) {
          const arrName = match[1];
          const arrIndex = parseInt(match[2]);
          if (!current[arrName]) current[arrName] = [];
          current[arrName][arrIndex] = value;
        }
      } else {
        current[lastKey] = value;
      }

      return newData;
    });
    setHasUnsavedChanges(true);
    setSuccessMessage(""); // Clear success message when making edits
    setErrorMessage(""); // Clear error message when making edits
  };

  // Loading state
  if (loading) {
    return (
      <div className="tpq-container">
        <div className="tpq-loading">
          <Loader2 className="spin" size={32} style={{ color: "#3182ce" }} />
          <p style={{ fontSize: "16px", marginTop: "16px", color: "#4a5568" }}>
            Loading projects...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="tpq-container">
        <div className="tpq-error">
          <XCircle size={24} />
          <p>{error}</p>
          <button onClick={loadProjects} className="tpq-btn tpq-btn--primary">
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Tab configuration
  const tabs = [
    { key: "inbox", label: "Inbox", sub: "Under Review" },
    { key: "gate-assess", label: "Gate Assessment", sub: "Workflow" },
    { key: "calendar", label: "Calendar", sub: "Scheduling" },
    { key: "analytics", label: "Analytics", sub: "SLA & trends" },
  ];

  return (
    <div className="tpq-container">
      {/* Header */}
      <div className="tpq-header">
        <div style={{ flex: 1 }}>
          <h1>Teacher Project Queue</h1>
          <p>Review and manage student project submissions</p>
        </div>
        <button
          onClick={loadProjects}
          disabled={loading}
          className="tpq-btn tpq-btn--secondary"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 16px",
            opacity: loading ? 0.6 : 1,
            cursor: loading ? "not-allowed" : "pointer",
          }}
          title="Refresh project list"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Section Switcher */}
      <div className="tpq-section-switch">
        <label htmlFor="sectionSelect">Section</label>
        <select
          id="sectionSelect"
          value={activeTab}
          onChange={(e) => setActiveTab(e.target.value)}
          className="tpq-section-select"
        >
          {tabs.map((t) => (
            <option key={t.key} value={t.key}>
              {t.label}
              {t.sub ? ` — ${t.sub}` : ""}
            </option>
          ))}
        </select>
      </div>

      {/* INBOX TAB */}
      {activeTab === "inbox" && (
        <>
          {/* Filters and Search */}
          <div className="tpq-controls">
            <div className="tpq-filters">
              <button
                className={`tpq-filter-btn ${filter === "all" ? "active" : ""}`}
                onClick={() => setFilter("all")}
              >
                All ({projects.length})
              </button>
            </div>

            <div className="tpq-search">
              <input
                type="text"
                placeholder="Search projects, subjects, or students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="tpq-search-input"
              />
            </div>
          </div>

          {/* Projects List */}
          <div className="tpq-projects">
            {filteredProjects.length === 0 ? (
              <div className="tpq-empty">
                <BookOpen size={48} />
                <h3>No projects found</h3>
                <p>
                  {searchTerm || filter !== "all"
                    ? "Try adjusting your search or filter criteria"
                    : projects.length === 0
                    ? "No projects have been submitted yet"
                    : `No projects match your filters. Showing ${
                        projects.length
                      } total project${projects.length !== 1 ? "s" : ""}.`}
                </p>
              </div>
            ) : (
              filteredProjects.map((project) => (
                <ProjectCard
                  key={project.project_id}
                  project={project}
                  onReview={handleReview}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onViewDeletionRequests={(project) => {
                    // Simply show the deletion request details that are already available
                    // Backend will send titles in the future
                    // Deduplicate by request_id to ensure only unique requests are shown
                    const details = project.deletionRequestDetails || [];
                    const uniqueDetailsMap = new Map();
                    details.forEach((req) => {
                      if (
                        req.request_id &&
                        !uniqueDetailsMap.has(req.request_id)
                      ) {
                        uniqueDetailsMap.set(req.request_id, req);
                      }
                    });
                    const uniqueDetails = Array.from(uniqueDetailsMap.values());
                    setSelectedProjectDeletionRequests(uniqueDetails);
                    setShowDeletionRequestsModal(true);
                  }}
                />
              ))
            )}
          </div>
        </>
      )}

      {/* GATE ASSESSMENT TAB - Integrated workflow */}
      {activeTab === "gate-assess" && (
        <div className="tpq-gate-assessment-wrapper">
          <GateAssessment onCancel={() => setActiveTab("inbox")} />
        </div>
      )}

      {/* CALENDAR TAB */}
      {activeTab === "calendar" && (
        <div className="tpq-panel">
          <div className="tpq-panel-head">
            <h3>Scheduling Assistant</h3>
            <span className="tpq-chip">Proposes slots</span>
          </div>
          <div className="tpq-stack">
            <div className="tpq-card">
              <div className="tpq-inline">
                <div>
                  <div style={{ fontWeight: 700 }}>Proposed Times</div>
                  <div className="tpq-muted">
                    Synced from Google Calendar (placeholder)
                  </div>
                </div>
                <button className="tpq-btn">Refresh</button>
              </div>
              <div className="tpq-stack" style={{ marginTop: 8 }}>
                <label className="tpq-inline">
                  <input type="radio" name="slot" /> Wed 10/08 10:30–10:50
                </label>
                <label className="tpq-inline">
                  <input type="radio" name="slot" /> Wed 10/08 11:10–11:30
                </label>
                <label className="tpq-inline">
                  <input type="radio" name="slot" /> Thu 10/09 09:00–09:20
                </label>
              </div>
              <div
                className="tpq-inline"
                style={{ justifyContent: "flex-end", marginTop: 8 }}
              >
                <button className="tpq-btn tpq-btn--primary">
                  Send Invite
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ANALYTICS TAB */}
      {activeTab === "analytics" && (
        <div className="tpq-panel">
          <div className="tpq-panel-head">
            <h3>Review Analytics</h3>
            <span className="tpq-chip">Last 14 days</span>
          </div>
          <div className="tpq-stack">
            <div className="tpq-card">
              <div className="tpq-inline">
                <div>
                  <div className="tpq-muted">Median Review Time</div>
                  <div style={{ fontSize: 22, fontWeight: 800 }}>
                    {analytics.medianReviewTime}
                  </div>
                </div>
                <div>
                  <div className="tpq-muted">Decline Rate</div>
                  <div
                    style={{ fontSize: 22, fontWeight: 800, color: "#e53e3e" }}
                  >
                    {analytics.declineRate}
                  </div>
                </div>
                <div>
                  <div className="tpq-muted">Throughput</div>
                  <div
                    style={{ fontSize: 22, fontWeight: 800, color: "#38a169" }}
                  >
                    {analytics.throughput}
                  </div>
                </div>
              </div>
            </div>
            <div className="tpq-card">
              <div style={{ fontWeight: 700 }}>Top Decline Reasons</div>
              <ul className="tpq-muted">
                <li>Missing citations</li>
                <li>Insufficient evidence</li>
                <li>Wrong rubric attached</li>
              </ul>
            </div>
            <div className="tpq-card">
              <div style={{ fontWeight: 700 }}>Project Statistics</div>
              <div className="tpq-stats-grid">
                <div className="tpq-stat-item">
                  <div className="tpq-stat-value">
                    {analytics.totalProjects}
                  </div>
                  <div className="tpq-stat-label">Total Projects</div>
                </div>
                <div className="tpq-stat-item">
                  <div className="tpq-stat-value" style={{ color: "#38a169" }}>
                    {analytics.approvedProjects}
                  </div>
                  <div className="tpq-stat-label">Approved</div>
                </div>
                <div className="tpq-stat-item">
                  <div className="tpq-stat-value" style={{ color: "#d69e2e" }}>
                    {analytics.pendingProjects}
                  </div>
                  <div className="tpq-stat-label">Pending</div>
                </div>
                <div className="tpq-stat-item">
                  <div className="tpq-stat-value" style={{ color: "#e53e3e" }}>
                    {analytics.rejectedProjects}
                  </div>
                  <div className="tpq-stat-label">Rejected</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Project Details Modal */}
      {showDetails && selectedProject && (
        <div
          className="tpq-modal-overlay"
          onClick={(e) => {
            // Only close if clicking the overlay background, not modal content
            if (e.target === e.currentTarget) {
              handleCloseDetails();
            }
          }}
        >
          <div
            className="tpq-modal tpq-modal--large"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="tpq-modal-header">
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    marginBottom: "8px",
                    flexWrap: "wrap",
                  }}
                >
                  <h2 style={{ margin: 0 }}>
                    {editableProjectData?.title ||
                      editableProjectData?.project_title ||
                      selectedProject.title}
                  </h2>
                  {editableProjectData?.deletion_requested &&
                    editableProjectData?.deletion_request_status ===
                      "pending" &&
                    editableProjectData?.deletion_request_id && (
                      <>
                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "4px 10px",
                            backgroundColor: "#fee2e2",
                            color: "#dc2626",
                            border: "1px solid #fecaca",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: "500",
                          }}
                        >
                          <Trash2 size={12} />
                          Project Deletion Requested
                        </div>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            onClick={() => {
                              if (editableProjectData.deletion_request_id) {
                                handleApproveProjectDeletion(
                                  editableProjectData
                                );
                              }
                            }}
                            disabled={isSaving}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                              padding: "6px 12px",
                              fontSize: "12px",
                              fontWeight: "500",
                              color: "white",
                              backgroundColor: "#16a34a",
                              border: "none",
                              borderRadius: "6px",
                              cursor: isSaving ? "not-allowed" : "pointer",
                              opacity: isSaving ? 0.6 : 1,
                            }}
                            title="Approve project deletion"
                          >
                            <CheckCircle size={12} />
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              if (editableProjectData.deletion_request_id) {
                                handleRejectProjectDeletion(
                                  editableProjectData
                                );
                              }
                            }}
                            disabled={isSaving}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                              padding: "6px 12px",
                              fontSize: "12px",
                              fontWeight: "500",
                              color: "#374151",
                              backgroundColor: "#e5e7eb",
                              border: "none",
                              borderRadius: "6px",
                              cursor: isSaving ? "not-allowed" : "pointer",
                              opacity: isSaving ? 0.6 : 1,
                            }}
                            title="Reject project deletion"
                          >
                            <XCircle size={12} />
                            Reject
                          </button>
                        </div>
                      </>
                    )}
                </div>
                {isSaving && (
                  <span
                    style={{
                      fontSize: "14px",
                      color: "#3182ce",
                      marginTop: "4px",
                      display: "block",
                      fontWeight: "500",
                    }}
                  >
                    Saving...
                  </span>
                )}
                {!isSaving && successMessage && (
                  <span
                    style={{
                      fontSize: "14px",
                      color: "#16a34a",
                      marginTop: "4px",
                      display: "block",
                      fontWeight: "500",
                    }}
                  >
                    {successMessage}
                  </span>
                )}
                {!isSaving && errorMessage && (
                  <span
                    style={{
                      fontSize: "14px",
                      color: "#e53e3e",
                      marginTop: "4px",
                      display: "block",
                      fontWeight: "500",
                    }}
                  >
                    {errorMessage}
                  </span>
                )}
              </div>
              <div
                style={{ display: "flex", gap: "8px", alignItems: "center" }}
              >
                <button
                  className="tpq-modal-close"
                  onClick={handleCloseDetails}
                >
                  ×
                </button>
              </div>
            </div>

            <div className="tpq-modal-content">
              {detailsLoading ? (
                <div className="tpq-loading">
                  <Loader2 className="spin" size={24} />
                  <p>Loading project details...</p>
                </div>
              ) : detailsError ? (
                <div className="tpq-error">
                  <p>{detailsError}</p>
                  <p
                    style={{
                      fontSize: "14px",
                      marginTop: "8px",
                      color: "#718096",
                    }}
                  >
                    Showing basic project information.
                  </p>
                </div>
              ) : null}

              {!detailsLoading && editableProjectData && (
                <>
                  {/* Project Description */}
                  <div className="tpq-modal-section">
                    <h4>Description</h4>
                    <textarea
                      value={editableProjectData.description || ""}
                      onChange={(e) =>
                        updateEditableData("description", e.target.value)
                      }
                      className={`w-full px-4 py-3 border rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-y min-h-[100px] ${
                        editableProjectData.deletion_requested &&
                        editableProjectData.deletion_request_status ===
                          "pending"
                          ? "border-red-500 border-2 bg-red-50"
                          : "border-gray-300"
                      }`}
                      placeholder="Project description"
                    />
                  </div>

                  {/* Stages Section - Replicated from CreateProject */}
                  <div className="tpq-modal-section">
                    <h4>Project Stages</h4>
                    {editableProjectData?.stages &&
                    Array.isArray(editableProjectData.stages) &&
                    editableProjectData.stages.length > 0 ? (
                      <>
                        {/* Stage Tabs Navigation */}
                        <div className="border-b border-gray-200 bg-gray-50">
                          <div className="flex gap-1">
                            {editableProjectData.stages
                              .slice()
                              // Filter out gate-only objects (keep only items with stage_id)
                              .filter((item) => item.stage_id)
                              .sort(
                                (a, b) =>
                                  (a?.stage_order || 0) - (b?.stage_order || 0)
                              )
                              .map((stage, index) => (
                                <ReviewStageTab
                                  key={stage.stage_id || `stage-${index}`}
                                  index={index}
                                  isActive={currentStageIndex === index}
                                  onClick={() => {
                                    setCurrentStageIndex(index);
                                    // Reset scroll to top when switching stages
                                    if (stageContentRef.current) {
                                      stageContentRef.current.scrollTop = 0;
                                    }
                                  }}
                                  stage={stage}
                                />
                              ))}
                          </div>
                        </div>

                        {/* Stage Content */}
                        <div
                          ref={stageContentRef}
                          className="mt-4 max-h-[50vh] overflow-y-auto"
                        >
                          {(() => {
                            // Filter out gate-only objects and sort (keep only items with stage_id)
                            const sortedStages = editableProjectData.stages
                              .slice()
                              .filter((item) => item.stage_id)
                              .sort(
                                (a, b) =>
                                  (a?.stage_order || 0) - (b?.stage_order || 0)
                              );
                            const currentStage =
                              sortedStages[currentStageIndex];

                            if (!currentStage) return null;

                            return (
                              <div className="space-y-6">
                                {/* Stage Title */}
                                <div>
                                  <label className="block text-xs font-semibold text-gray-500 mb-2">
                                    STAGE TITLE
                                  </label>
                                  <div className="relative">
                                    <input
                                      type="text"
                                      value={currentStage.title || ""}
                                      onChange={(e) => {
                                        const sortedStages = [
                                          ...editableProjectData.stages,
                                        ].sort(
                                          (a, b) =>
                                            (a?.stage_order || 0) -
                                            (b?.stage_order || 0)
                                        );
                                        const stageIndex =
                                          editableProjectData.stages.findIndex(
                                            (s) =>
                                              s.stage_id ===
                                              currentStage.stage_id
                                          );
                                        setEditableProjectData((prev) => {
                                          const newData = deepClone(prev);
                                          newData.stages[stageIndex].title =
                                            e.target.value;
                                          return newData;
                                        });
                                        setHasUnsavedChanges(true);
                                        setSuccessMessage(""); // Clear success message when making edits
                                        setErrorMessage(""); // Clear error message when making edits
                                      }}
                                      className={`w-full px-4 py-3 border rounded-lg bg-white font-semibold text-lg text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none ${
                                        currentStage.deletion_requested &&
                                        currentStage.deletion_request_status ===
                                          "pending"
                                          ? "border-red-500 border-2 bg-red-50"
                                          : "border-gray-300"
                                      }`}
                                      placeholder="Untitled Stage"
                                    />
                                    {/* Deletion Request UI */}
                                    {currentStage.deletion_requested &&
                                      currentStage.deletion_request_status ===
                                        "pending" && (
                                        <div className="absolute top-2 right-2 flex items-center gap-2">
                                          <div className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-700 bg-red-100 rounded">
                                            <Trash2 size={12} />
                                            Deletion Requested
                                          </div>
                                          <div className="flex gap-1">
                                            <button
                                              onClick={() => {
                                                // Find the stage index in the filtered stages list
                                                const stagesOnly =
                                                  editableProjectData.stages.filter(
                                                    (item) => item.stage_id
                                                  );
                                                const stageIndex =
                                                  stagesOnly.findIndex(
                                                    (s) =>
                                                      s.stage_id ===
                                                      currentStage.stage_id
                                                  );
                                                if (stageIndex !== -1) {
                                                  handleApproveStageDeletion(
                                                    stageIndex
                                                  );
                                                }
                                              }}
                                              disabled={isSaving}
                                              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                              title="Approve deletion"
                                            >
                                              <CheckCircle size={12} />
                                              Approve
                                            </button>
                                            <button
                                              onClick={() => {
                                                // Find the stage index in the filtered stages list
                                                const stagesOnly =
                                                  editableProjectData.stages.filter(
                                                    (item) => item.stage_id
                                                  );
                                                const stageIndex =
                                                  stagesOnly.findIndex(
                                                    (s) =>
                                                      s.stage_id ===
                                                      currentStage.stage_id
                                                  );
                                                if (stageIndex !== -1) {
                                                  handleRejectStageDeletion(
                                                    stageIndex
                                                  );
                                                }
                                              }}
                                              disabled={isSaving}
                                              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                              title="Reject deletion"
                                            >
                                              <XCircle size={12} />
                                              Reject
                                            </button>
                                          </div>
                                        </div>
                                      )}
                                  </div>
                                </div>

                                {/* Tasks */}
                                {currentStage.tasks &&
                                  currentStage.tasks.length > 0 && (
                                    <div>
                                      <h3 className="text-lg font-bold text-gray-900 mb-4">
                                        Tasks
                                      </h3>
                                      <div className="space-y-4">
                                        {currentStage.tasks.map(
                                          (task, taskIndex) => {
                                            const stageIndex =
                                              editableProjectData.stages.findIndex(
                                                (s) =>
                                                  s.stage_id ===
                                                  currentStage.stage_id
                                              );
                                            return (
                                              <ReviewTaskCard
                                                key={taskIndex}
                                                task={task}
                                                taskIndex={taskIndex}
                                                stageIndex={stageIndex}
                                                isEditable={true}
                                                projectTitle={
                                                  editableProjectData.project_title ||
                                                  editableProjectData.title
                                                }
                                                onUpdate={(field, value) => {
                                                  setEditableProjectData(
                                                    (prev) => {
                                                      const newData =
                                                        deepClone(prev);
                                                      newData.stages[
                                                        stageIndex
                                                      ].tasks[taskIndex][
                                                        field
                                                      ] = value;
                                                      return newData;
                                                    }
                                                  );
                                                  setHasUnsavedChanges(true);
                                                  setSuccessMessage(""); // Clear success message when making edits
                                                  setErrorMessage(""); // Clear error message when making edits
                                                }}
                                                onApproveDeletion={
                                                  handleApproveTaskDeletion
                                                }
                                                onRejectDeletion={
                                                  handleRejectTaskDeletion
                                                }
                                              />
                                            );
                                          }
                                        )}
                                      </div>
                                    </div>
                                  )}

                                {/* Gate Standards */}
                                {currentStage.gate && (
                                  <div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-4">
                                      Gate Standards
                                    </h3>
                                    <ReviewGateStandard
                                      gate={currentStage.gate}
                                      isEditable={true}
                                      projectId={editableProjectData.project_id}
                                      stageId={currentStage.stage_id}
                                      invokerEmail="teacher1@gmail.com"
                                      studentId={editableProjectData.user_id}
                                      gateId={currentStage.gate?.gate_id}
                                      onUpdate={(field, index, value) => {
                                        const stageIndex =
                                          editableProjectData.stages.findIndex(
                                            (s) =>
                                              s.stage_id ===
                                              currentStage.stage_id
                                          );
                                        setEditableProjectData((prev) => {
                                          const newData = deepClone(prev);
                                          if (field === "checklist") {
                                            // New structure: value is the entire checklist array
                                            if (
                                              !newData.stages[stageIndex].gate
                                            ) {
                                              newData.stages[stageIndex].gate =
                                                {};
                                            }
                                            newData.stages[
                                              stageIndex
                                            ].gate.checklist = value;
                                          } else {
                                            // Other gate fields (title, description)
                                            if (
                                              !newData.stages[stageIndex].gate
                                            ) {
                                              newData.stages[stageIndex].gate =
                                                {};
                                            }
                                            newData.stages[stageIndex].gate[
                                              field
                                            ] = value;
                                          }
                                          return newData;
                                        });
                                        setHasUnsavedChanges(true);
                                        setSuccessMessage(""); // Clear success message when making edits
                                        setErrorMessage(""); // Clear error message when making edits
                                      }}
                                    />
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      </>
                    ) : (
                      <div
                        className="tpq-empty-state"
                        style={{
                          padding: "32px",
                          textAlign: "center",
                          color: "#6b7280",
                        }}
                      >
                        <BookOpen
                          size={48}
                          style={{ marginBottom: "16px", opacity: 0.5 }}
                        />
                        <p>No stages available for this project.</p>
                        <p style={{ fontSize: "14px", marginTop: "8px" }}>
                          Stages will appear here once the project structure is
                          defined.
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Final Actions - These save to backend with full project data and stage statuses */}
            <div className="tpq-modal-actions">
              <button
                className="tpq-btn tpq-btn--approve"
                onClick={() => {
                  // Final approve: saves all project data + stage statuses to backend
                  handleApprove(selectedProject);
                  // Dialog stays open to show success message
                }}
                disabled={isSaving}
                style={{
                  opacity: isSaving ? 0.6 : 1,
                  cursor: isSaving ? "not-allowed" : "pointer",
                }}
              >
                <CheckCircle size={14} />
                {isSaving ? "Saving..." : "Approve"}
              </button>
              <button
                className="tpq-btn tpq-btn--reject"
                onClick={() => {
                  // Final reject: saves all project data + stage statuses to backend
                  handleReject(selectedProject);
                  // Dialog stays open to show success message
                }}
                disabled={isSaving}
                style={{
                  opacity: isSaving ? 0.6 : 1,
                  cursor: isSaving ? "not-allowed" : "pointer",
                }}
              >
                <XCircle size={14} />
                {isSaving ? "Saving..." : "Request Revision"}
              </button>
              <button
                className="tpq-btn tpq-btn--secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCloseDetails();
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Unsaved Changes */}
      {showCloseConfirm && (
        <div className="tpq-modal-overlay" style={{ zIndex: 2000 }}>
          <div
            className="tpq-modal"
            style={{ maxWidth: "400px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="tpq-modal-header">
              <h2>Unsaved Changes</h2>
            </div>
            <div className="tpq-modal-content">
              <p>
                You have unsaved changes. Are you sure you want to close? All
                unsaved edits will be lost.
              </p>
            </div>
            <div className="tpq-modal-actions">
              <button
                className="tpq-btn tpq-btn--secondary"
                onClick={() => setShowCloseConfirm(false)}
              >
                Cancel
              </button>
              <button className="tpq-btn tpq-btn--reject" onClick={closeDialog}>
                Close Without Saving
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deletion Requests Details Modal */}
      {showDeletionRequestsModal && (
        <div className="tpq-modal-overlay" style={{ zIndex: 2000 }}>
          <div
            className="tpq-modal"
            style={{ maxWidth: "600px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="tpq-modal-header">
              <h2>Deletion Requests</h2>
              <button
                className="tpq-modal-close"
                onClick={() => {
                  setShowDeletionRequestsModal(false);
                  setSelectedProjectDeletionRequests([]);
                }}
              >
                ×
              </button>
            </div>
            <div
              className="tpq-modal-content"
              style={{ maxHeight: "60vh", overflowY: "auto" }}
            >
              {selectedProjectDeletionRequests.length === 0 ? (
                <p>No deletion requests found.</p>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  {selectedProjectDeletionRequests.map((request, index) => (
                    <div
                      key={request.request_id || index}
                      style={{
                        border: "1px solid #fecaca",
                        backgroundColor: "#fef2f2",
                        borderRadius: "8px",
                        padding: "16px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "12px",
                        }}
                      >
                        <Trash2
                          size={20}
                          style={{
                            color: "#dc2626",
                            marginTop: "2px",
                            flexShrink: 0,
                          }}
                        />
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              fontWeight: 600,
                              color: "#991b1b",
                              marginBottom: "4px",
                            }}
                          >
                            {request.entity_type === "project"
                              ? "Project"
                              : request.entity_type === "stage"
                              ? "Stage"
                              : "Task"}{" "}
                            Deletion Request
                          </div>
                          {request.entity_type === "project" && (
                            <div style={{ fontSize: "14px", color: "#b91c1c" }}>
                              <strong>Project:</strong>{" "}
                              {request.project_title || "Untitled Project"}
                            </div>
                          )}
                          {request.entity_type === "stage" && (
                            <div style={{ fontSize: "14px", color: "#b91c1c" }}>
                              <strong>Stage:</strong>{" "}
                              {request.stage_title || "Untitled Stage"}
                            </div>
                          )}
                          {request.entity_type === "task" && (
                            <div
                              style={{
                                fontSize: "14px",
                                color: "#b91c1c",
                                display: "flex",
                                flexDirection: "column",
                                gap: "4px",
                              }}
                            >
                              <div>
                                <strong>Stage:</strong>{" "}
                                {request.stage_title || "Untitled Stage"}
                              </div>
                              <div>
                                <strong>Task:</strong>{" "}
                                {request.task_title || "Untitled Task"}
                              </div>
                            </div>
                          )}
                          {request.reason && (
                            <div
                              style={{
                                fontSize: "14px",
                                color: "#dc2626",
                                marginTop: "8px",
                              }}
                            >
                              <strong>Reason:</strong> {request.reason}
                            </div>
                          )}
                          {request.requested_by && (
                            <div
                              style={{
                                fontSize: "12px",
                                color: "#dc2626",
                                marginTop: "8px",
                              }}
                            >
                              Requested by: {request.requested_by}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="tpq-modal-actions">
              <button
                className="tpq-btn tpq-btn--secondary"
                onClick={() => {
                  setShowDeletionRequestsModal(false);
                  setSelectedProjectDeletionRequests([]);
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
