import React, { useEffect, useState } from "react";
import {
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  BookOpen,
  Trash2,
  RefreshCw,
  ArrowLeft,
} from "lucide-react";
import ReviewStageTab from "./ReviewStageTab";
import ReviewTaskCard from "./ReviewTaskCard";
import ReviewGateStandard from "./ReviewGateStandard ";
import GateAssessment from "../GateAssessment/GateAssessment";
import { useDeletionRequests } from "./useDeletionRequests.jsx";
import ProjectCard from "./ProjectCard";
import { deepClone } from "./utils.jsx";
import InboxTab from "./InboxTab";
import CalendarTab from "./CalendarTab";
import AnalyticsTab from "./AnalyticsTab";
import ResourcesTab from "./ResourcesTab";
import DeletionRequestsModal from "./DeletionRequestsModal";
import "./TeacherProjectQueue.css";

export default function TeacherProjectQueue() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProject, setSelectedProject] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [studentNameFilter, setStudentNameFilter] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");

  const {
    deletionRequests,
    loadDeletionRequests,
    flagTasksWithDeletionRequests,
    removeDeletionRequest,
  } = useDeletionRequests();

  const [projectDetails, setProjectDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");
  const [selectedStageId, setSelectedStageId] = useState(null);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [stageStatuses, setStageStatuses] = useState({});
  const [initialStageStatuses, setInitialStageStatuses] = useState({});
  const [stageFeedbacks, setStageFeedbacks] = useState({});
  const [overallComment, setOverallComment] = useState("");
  const [editableProjectData, setEditableProjectData] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [showDeletionRequestsModal, setShowDeletionRequestsModal] =
    useState(false);
  const [selectedProjectDeletionRequests, setSelectedProjectDeletionRequests] =
    useState([]);

  const [activeTab, setActiveTab] = useState("inbox");
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const stageContentRef = React.useRef(null);
  const descriptionTextareaRef = React.useRef(null);

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

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage("");
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => {
        setErrorMessage("");
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);
  useEffect(() => {
    if (activeTab === "inbox" && projects.length === 0 && !loading) {
      loadProjects();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  useEffect(() => {
    if (projects.length > 0) {
      const total = projects.length;
      const approved = projects.filter((p) =>
        p.status.toLowerCase().includes("approve")
      ).length;
      const pending = projects.filter(
        (p) =>
          p.status.toLowerCase().includes("pending") ||
          p.status.toLowerCase().includes("new project")
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

  useEffect(() => {
    if (stageContentRef.current) {
      stageContentRef.current.scrollTop = 0;
    }
  }, [currentStageIndex]);

  useEffect(() => {
    if (
      descriptionTextareaRef.current &&
      editableProjectData?.description !== undefined
    ) {
      descriptionTextareaRef.current.style.height = "auto";
      const scrollHeight = descriptionTextareaRef.current.scrollHeight;
      const minHeight = 40;
      const maxHeight = 300;
      const newHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight);
      descriptionTextareaRef.current.style.height = newHeight + "px";
    }
  }, [editableProjectData?.description]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError("");

      return new Promise((resolve, reject) => {
        google.script.run
          .withSuccessHandler(async (response) => {
            try {
              let projects = [];

              if (response && response.body) {
                const body = response.body;
                if (Array.isArray(body.projects)) {
                  projects = body.projects;
                } else if (
                  body.action_response &&
                  Array.isArray(body.action_response.projects)
                ) {
                  projects = body.action_response.projects;
                } else if (body.projects && Array.isArray(body.projects)) {
                  projects = body.projects;
                } else if (
                  body.action_response?.json?.projects &&
                  Array.isArray(body.action_response.json.projects)
                ) {
                  projects = body.action_response.json.projects;
                }
              } else if (
                response &&
                response.action_response &&
                Array.isArray(response.action_response.projects)
              ) {
                projects = response.action_response.projects;
              } else if (
                response &&
                response.action_response?.json?.projects &&
                Array.isArray(response.action_response.json.projects)
              ) {
                projects = response.action_response.json.projects;
              } else if (Array.isArray(response)) {
                projects = response;
              }

              const mappedProjects = projects.map((project) => ({
                project_id: project.project_id || project.id,
                user_id: project.user_id,
                title: project.title || project.project_title || "",
                project_title: project.title || project.project_title || "",
                subject_domain: project.subject_domain || "",
                status: project.status || "New Project",
                owner_name: project.Student_Name || project.owner_name || "",
                owner_email: project.owner_email || "",
                description: project.description || "",
                project_feedback:
                  project.project_feedback || project.feedback || "",
                created_at: project.created_at || new Date().toISOString(),
                stages: project.stages || [],
              }));

              setProjects(mappedProjects);
              setLoading(false);
              resolve(mappedProjects);

              const subjectDomains = mappedProjects
                .map((p) => p.subject_domain)
                .filter((d) => d);

              if (subjectDomains.length > 0) {
                loadDeletionRequests(subjectDomains)
                  .then((deletionRequestsList) => {
                    const flaggedProjects = flagTasksWithDeletionRequests(
                      mappedProjects,
                      deletionRequestsList
                    );
                    setProjects(flaggedProjects);
                  })
                  .catch((err) => {
                    console.error("Error loading deletion requests:", err);
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

  // Helper function to set status to "Project change" for projects with deletion requests
  const filteredProjects = projects.filter((project) => {
    let matchesFilter = true;
    if (filter !== "all") {
      const statusLower = project.status.toLowerCase();
      const hasDeletionRequests =
        project.hasDeletionRequests ||
        (project.deletion_requested &&
          project.deletion_request_status === "pending");

      if (filter === "pending") {
        matchesFilter =
          (statusLower.includes("pending") ||
            statusLower.includes("new project")) &&
          !hasDeletionRequests;
      } else if (filter === "revision") {
        matchesFilter =
          statusLower.includes("revision") && !hasDeletionRequests;
      } else if (filter === "project-change") {
        matchesFilter = hasDeletionRequests;
      } else if (filter === "approve") {
        matchesFilter =
          (statusLower.includes("approve") ||
            statusLower.includes("approved")) &&
          !hasDeletionRequests;
      } else {
        matchesFilter =
          statusLower.includes(filter.toLowerCase()) && !hasDeletionRequests;
      }
    }

    // Search filter
    const matchesSearch =
      !searchTerm ||
      project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.subject_domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.owner_name.toLowerCase().includes(searchTerm.toLowerCase());

    let matchesDateRange = true;
    if (startDate || endDate) {
      if (project.created_at) {
        const projectDate = new Date(project.created_at);
        projectDate.setHours(0, 0, 0, 0);

        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          if (projectDate < start) {
            matchesDateRange = false;
          }
        }

        if (endDate && matchesDateRange) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          if (projectDate > end) {
            matchesDateRange = false;
          }
        }
      } else {
        matchesDateRange = false;
      }
    }

    // Student Name filter
    const matchesStudentName =
      !studentNameFilter ||
      (project.owner_name &&
        project.owner_name
          .toLowerCase()
          .includes(studentNameFilter.toLowerCase()));

    // Subject filter
    const matchesSubject =
      !subjectFilter ||
      (project.subject_domain &&
        project.subject_domain.toLowerCase() === subjectFilter.toLowerCase());

    return (
      matchesFilter &&
      matchesSearch &&
      matchesDateRange &&
      matchesStudentName &&
      matchesSubject
    );
  });

  const handleReview = (project) => {
    setSelectedProject(project);
    setShowDetails(true);
    setCurrentStageIndex(0);
    setOverallComment("");
    setHasUnsavedChanges(false);
    setEditableProjectData(null);
    setSuccessMessage("");
    setErrorMessage("");
    setIsSaving(false);
    setShowCloseConfirm(false);

    if (project.stages && Array.isArray(project.stages)) {
      const initialStatuses = {};
      const currentStatuses = {};
      project.stages.forEach((stage) => {
        if (stage.stage_id && stage.status) {
          initialStatuses[stage.stage_id] = stage.status;
          currentStatuses[stage.stage_id] = stage.status;
        }
      });
      setInitialStageStatuses(initialStatuses);
      setStageStatuses(currentStatuses);
      setStageFeedbacks({});
    } else {
      setInitialStageStatuses({});
      setStageStatuses({});
      setStageFeedbacks({});
    }

    setDetailsLoading(true);
    setDetailsError("");

    google.script.run
      .withSuccessHandler((response) => {
        try {
          let projectDetails = project;
          let fetchedProject = null;
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
            projectDetails = {
              ...project,
              ...fetchedProject,
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
              project_feedback:
                fetchedProject.project_feedback ||
                fetchedProject.feedback ||
                project.project_feedback ||
                project.feedback ||
                "",
              stages: fetchedProject.stages || project.stages || [],
            };
          } else {
            projectDetails = {
              ...project,
              stages: project.stages || [],
            };
          }

          const projectWithDeletionFlags = flagTasksWithDeletionRequests(
            [projectDetails],
            deletionRequests
          )[0];

          setProjectDetails(projectWithDeletionFlags);
          const editableCopy = deepClone(projectWithDeletionFlags);
          setEditableProjectData(editableCopy);

          if (editableCopy.stages && Array.isArray(editableCopy.stages)) {
            const initialStatuses = {};
            const currentStatuses = {};
            editableCopy.stages.forEach((stage) => {
              if (stage.stage_id && stage.status) {
                initialStatuses[stage.stage_id] = stage.status;
                currentStatuses[stage.stage_id] = stage.status;
              }
            });
            setInitialStageStatuses(initialStatuses);
            setStageStatuses(currentStatuses);
            setStageFeedbacks({});
          } else {
            setInitialStageStatuses({});
            setStageStatuses({});
            setStageFeedbacks({});
          }

          setDetailsLoading(false);
        } catch (parseError) {
          console.error("Error parsing project details:", parseError);
          setDetailsError("Error loading project details");
          setProjectDetails(project);
          const editableCopy = deepClone(project);
          setEditableProjectData(editableCopy);
          setDetailsLoading(false);
        }
      })
      .withFailureHandler((error) => {
        console.error("Error fetching project details:", error);
        setDetailsError("Failed to load project details");
        setProjectDetails(project);
        const editableCopy = deepClone(project);
        setEditableProjectData(editableCopy);
        setDetailsLoading(false);
      })
      .getTeacherProjectDetails(project.project_id, project.user_id);
  };

  const handleApprove = async (project) => {
    try {
      const projectDataToSave = deepClone(editableProjectData || project);

      if (!projectDataToSave.project_id || !projectDataToSave.user_id) {
        setErrorMessage(
          "Error: Missing project ID or user ID. Cannot approve project."
        );
        return;
      }

      if (projectDataToSave.stages && Object.keys(stageStatuses).length > 0) {
        projectDataToSave.stages = projectDataToSave.stages.map((stage) => {
          if (stageStatuses[stage.stage_id]) {
            stage.status = stageStatuses[stage.stage_id];
          }
          return stage;
        });
      }

      setIsSaving(true);
      setSuccessMessage("");
      setErrorMessage("");
      google.script.run
        .withSuccessHandler((response) => {
          setIsSaving(false);
          if (response.success) {
            setProjects((prev) =>
              prev.map((p) =>
                p.project_id === project.project_id
                  ? { ...p, status: "Approved" }
                  : p
              )
            );

            if (projectDetails) {
              setProjectDetails((prev) => ({ ...prev, status: "Approved" }));
            }

            setHasUnsavedChanges(false);
            setSuccessMessage("Project approved successfully!");
            setErrorMessage("");
          } else {
            setIsSaving(false);
            setErrorMessage(response.message || "Failed to approve project");
            setSuccessMessage("");
          }
        })
        .withFailureHandler((error) => {
          setIsSaving(false);
          console.error("Error approving project:", error);
          setErrorMessage(
            "Error approving project: " + (error.message || "Unknown error")
          );
          setSuccessMessage("");
        })
        .saveTeacherProjectUpdate(projectDataToSave, "Approved");
    } catch (err) {
      setIsSaving(false);
      console.error("Error approving project:", err);
      setErrorMessage(
        "Error approving project: " + (err.message || "Unknown error")
      );
      setSuccessMessage(""); // Clear success message
    }
  };

  const handleStageApprove = async (stageId) => {
    try {
      const stageIndex = editableProjectData.stages.findIndex(
        (s) => s.stage_id === stageId
      );

      if (stageIndex === -1) {
        setErrorMessage("Stage not found");
        return;
      }

      setEditableProjectData((prev) => {
        const newData = deepClone(prev);
        newData.stages[stageIndex].status = "Approved";
        return newData;
      });

      setStageStatuses((prev) => ({
        ...prev,
        [stageId]: "Approved",
      }));

      setHasUnsavedChanges(true);
      setSuccessMessage(
        `Stage "${
          editableProjectData.stages[stageIndex].title || "stage"
        }" marked as Approved`
      );
      setErrorMessage("");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      console.error("Error approving stage:", err);
      setErrorMessage(
        "Error approving stage: " + (err.message || "Unknown error")
      );
    }
  };

  const handleStageRevision = async (stageId) => {
    try {
      const stageIndex = editableProjectData.stages.findIndex(
        (s) => s.stage_id === stageId
      );

      if (stageIndex === -1) {
        setErrorMessage("Stage not found");
        return;
      }

      setEditableProjectData((prev) => {
        const newData = deepClone(prev);
        newData.stages[stageIndex].status = "Revision";
        return newData;
      });

      setStageStatuses((prev) => ({
        ...prev,
        [stageId]: "Revision",
      }));

      setHasUnsavedChanges(true);
      setSuccessMessage(
        `Stage "${
          editableProjectData.stages[stageIndex].title || "stage"
        }" marked for Revision`
      );
      setErrorMessage("");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      console.error("Error requesting stage revision:", err);
      setErrorMessage(
        "Error requesting stage revision: " + (err.message || "Unknown error")
      );
    }
  };

  const handleSubmitAll = async () => {
    try {
      if (!editableProjectData || !selectedProject) {
        setErrorMessage("Error: Missing project data. Cannot submit.");
        return;
      }
      if (!editableProjectData.project_id || !editableProjectData.user_id) {
        setErrorMessage("Error: Missing project ID or user ID. Cannot submit.");
        return;
      }

      const projectDataToSave = deepClone(editableProjectData);

      if (projectDataToSave.stages) {
        projectDataToSave.stages = projectDataToSave.stages.map((stage) => {
          const status = stageStatuses[stage.stage_id] || stage.status;
          if (status) {
            stage.status = status;
          }
          const feedback = stageFeedbacks[stage.stage_id];
          if (feedback !== undefined) {
            // Ensure gate object exists
            if (!stage.gate) {
              stage.gate = {};
            }
            stage.gate.feedback = feedback;
          }
          return stage;
        });
      }

      const allStages = projectDataToSave.stages || [];
      const stagesWithStatus = allStages.filter((s) => s.status);

      let overallStatus = "Revision";

      if (
        allStages.length > 0 &&
        stagesWithStatus.length === allStages.length
      ) {
        const allApproved = stagesWithStatus.every(
          (s) => s.status === "Approved"
        );
        if (allApproved) {
          overallStatus = "Approved";
        }
      }

      setIsSaving(true);
      setSuccessMessage("");
      setErrorMessage("");
      google.script.run
        .withSuccessHandler((response) => {
          setIsSaving(false);
          if (response.success) {
            setProjects((prev) =>
              prev.map((p) =>
                p.project_id === selectedProject.project_id
                  ? { ...p, status: overallStatus }
                  : p
              )
            );

            if (projectDetails) {
              setProjectDetails((prev) => ({ ...prev, status: overallStatus }));
            }

            setHasUnsavedChanges(false);
            setInitialStageStatuses(stageStatuses);
            setSuccessMessage("All stage decisions submitted successfully!");
            setErrorMessage("");

            setTimeout(() => {
              closeDialog();
            }, 2000);
          } else {
            setIsSaving(false);
            setErrorMessage(response.message || "Failed to submit decisions");
            setSuccessMessage("");
          }
        })
        .withFailureHandler((error) => {
          setIsSaving(false);
          console.error("Error submitting decisions:", error);
          setErrorMessage(
            "Error submitting decisions: " + (error.message || "Unknown error")
          );
          setSuccessMessage("");
        })
        .saveTeacherProjectUpdate(projectDataToSave, overallStatus);
    } catch (err) {
      setIsSaving(false);
      console.error("Error submitting decisions:", err);
      setErrorMessage(
        "Error submitting decisions: " + (err.message || "Unknown error")
      );
      setSuccessMessage(""); // Clear success message
    }
  };

  const handleReject = async (project) => {
    try {
      const projectDataToSave = deepClone(editableProjectData || project);

      if (!projectDataToSave.project_id || !projectDataToSave.user_id) {
        setErrorMessage(
          "Error: Missing project ID or user ID. Cannot request revision."
        );
        return;
      }

      if (projectDataToSave.stages && Object.keys(stageStatuses).length > 0) {
        projectDataToSave.stages = projectDataToSave.stages.map((stage) => {
          if (stageStatuses[stage.stage_id]) {
            stage.status = stageStatuses[stage.stage_id];
          }
          return stage;
        });
      }

      setIsSaving(true);
      setSuccessMessage("");
      setErrorMessage("");

      google.script.run
        .withSuccessHandler((response) => {
          setIsSaving(false);
          if (response.success) {
            setProjects((prev) =>
              prev.map((p) =>
                p.project_id === project.project_id
                  ? { ...p, status: "Revision" }
                  : p
              )
            );

            if (projectDetails) {
              setProjectDetails((prev) => ({
                ...prev,
                status: "Revision",
              }));
            }

            setHasUnsavedChanges(false);
            setSuccessMessage("Revision requested successfully!");
            setErrorMessage("");
          } else {
            setErrorMessage(response.message || "Failed to request revision");
            setSuccessMessage("");
          }
        })
        .withFailureHandler((error) => {
          setIsSaving(false);
          console.error("Error requesting revision:", error);
          setErrorMessage(
            "Error requesting revision: " + (error.message || "Unknown error")
          );
          setSuccessMessage("");
        })
        .saveTeacherProjectUpdate(projectDataToSave, "Revision");
    } catch (err) {
      setIsSaving(false);
      console.error("Error requesting revision:", err);
      setErrorMessage(
        "Error requesting revision: " + (err.message || "Unknown error")
      );
      setSuccessMessage(""); // Clear success message
    }
  };

  const handleCloseDetails = () => {
    const hasChangedStatuses =
      Object.keys(stageStatuses).some(
        (stageId) => stageStatuses[stageId] !== initialStageStatuses[stageId]
      ) ||
      Object.keys(initialStageStatuses).some(
        (stageId) => !stageStatuses[stageId]
      );

    const hasChangedFeedbacks =
      editableProjectData?.stages?.some((stage) => {
        if (!stage.stage_id) return false;
        const currentFeedback = stageFeedbacks[stage.stage_id] || "";
        const originalFeedback = stage.gate?.feedback || "";
        return currentFeedback !== originalFeedback;
      }) || false;

    if (hasUnsavedChanges || hasChangedStatuses || hasChangedFeedbacks) {
      setShowCloseConfirm(true);
      return;
    }
    closeDialog();
  };

  const closeDialog = () => {
    setShowDetails(false);
    setSelectedProject(null);
    setEditableProjectData(null);
    setHasUnsavedChanges(false);
    setStageStatuses({});
    setInitialStageStatuses({});
    setStageFeedbacks({});
    setSuccessMessage("");
    setErrorMessage("");
    setShowCloseConfirm(false);
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
                  const flagged = flagTasksWithDeletionRequests(
                    prevProjects,
                    requests
                  );
                  return flagged;
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
              const flagged = flagTasksWithDeletionRequests(
                prevProjects,
                updatedDeletionRequests
              );
              return flagged;
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
                  const flagged = flagTasksWithDeletionRequests(
                    prevProjects,
                    requests
                  );
                  return flagged;
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
                      const flagged = flagTasksWithDeletionRequests(
                        updatedProjects,
                        requests
                      );
                      return flagged;
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
              const flagged = flagTasksWithDeletionRequests(
                prevProjects,
                updatedDeletionRequests
              );
              return flagged;
            });

            setSuccessMessage(
              `Deletion request for "${
                task.title || "task"
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
      console.error("Error rejecting task deletion:", err);
      setErrorMessage(
        "Error rejecting task deletion: " + (err.message || "Unknown error")
      );
      setSuccessMessage("");
    }
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
          <button
            onClick={() => loadProjects()}
            className="tpq-btn tpq-btn--primary"
          >
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
    { key: "resource", label: "Resource", sub: "Learning Materials" },
  ];

  return (
    <div className="tpq-container">
      {/* Header with Back, Refresh, and Section */}
      <div
        className="tpq-header"
        style={{ marginBottom: "16px", alignItems: "center" }}
      >
        <div
          style={{
            display: "flex",
            gap: "12px",
            alignItems: "center",
            flex: 1,
          }}
        >
          {/* Section Switcher */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <label
              htmlFor="sectionSelect"
              style={{ margin: 0, fontWeight: 600, color: "#2d3748" }}
            >
              Section
            </label>
            <select
              id="sectionSelect"
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value)}
              className="tpq-section-select"
              style={{
                width: "auto",
                minWidth: "200px",
                padding: "8px 12px",
                margin: 0,
              }}
            >
              {tabs.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.label}
                  {t.sub ? ` — ${t.sub}` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>
        {activeTab === "inbox" && (
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button
              onClick={() => loadProjects()}
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
              <RefreshCw size={16} className={loading ? "spin" : ""} />
              Refresh
            </button>
          </div>
        )}
      </div>

      {/* INBOX TAB */}
      {activeTab === "inbox" && (
        <InboxTab
          projects={projects}
          filteredProjects={filteredProjects}
          filter={filter}
          setFilter={setFilter}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          studentNameFilter={studentNameFilter}
          setStudentNameFilter={setStudentNameFilter}
          subjectFilter={subjectFilter}
          setSubjectFilter={setSubjectFilter}
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
              if (req.request_id && !uniqueDetailsMap.has(req.request_id)) {
                uniqueDetailsMap.set(req.request_id, req);
              }
            });
            const uniqueDetails = Array.from(uniqueDetailsMap.values());
            setSelectedProjectDeletionRequests(uniqueDetails);
            setShowDeletionRequestsModal(true);
          }}
          loading={loading}
        />
      )}

      {/* GATE ASSESSMENT TAB - Integrated workflow */}
      {activeTab === "gate-assess" && (
        <div className="tpq-gate-assessment-wrapper">
          <GateAssessment onCancel={() => setActiveTab("inbox")} />
        </div>
      )}

      {/* CALENDAR TAB */}
      {activeTab === "calendar" && <CalendarTab />}

      {/* ANALYTICS TAB */}
      {activeTab === "analytics" && <AnalyticsTab analytics={analytics} />}

      {/* RESOURCE TAB */}
      {activeTab === "resource" && <ResourcesTab />}

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
            <div className="tpq-modal-header" style={{ padding: "12px 24px" }}>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    marginBottom: 0,
                    flexWrap: "wrap",
                  }}
                >
                  <h2
                    style={{ margin: 0, fontSize: "18px", lineHeight: "1.3" }}
                  >
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
                              color: "#065f46",
                              backgroundColor: "#d1fae5",
                              border: "1px solid #a7f3d0",
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
                              color: "#92400e",
                              backgroundColor: "#fef3c7",
                              border: "1px solid #fde68a",
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
                  onClick={(e) => {
                    e.stopPropagation();
                    // Check for unsaved changes before closing
                    handleCloseDetails();
                  }}
                  style={{ zIndex: 10001 }}
                >
                  ×
                </button>
              </div>
            </div>

            <div
              className="tpq-modal-content"
              style={{
                paddingTop: "4px",
                paddingBottom: "0px",
                paddingLeft: "24px",
                paddingRight: "24px",
              }}
            >
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
                  <div
                    className="tpq-modal-section"
                    style={{ marginTop: 0, marginBottom: "6px" }}
                  >
                    <h4>Description</h4>
                    <textarea
                      ref={descriptionTextareaRef}
                      value={editableProjectData.description || ""}
                      onChange={(e) => {
                        setEditableProjectData((prev) => {
                          const newData = deepClone(prev);
                          newData.description = e.target.value;
                          return newData;
                        });
                        setHasUnsavedChanges(true);
                        setSuccessMessage("");
                        setErrorMessage("");
                        // Auto-resize textarea
                        if (descriptionTextareaRef.current) {
                          descriptionTextareaRef.current.style.height = "auto";
                          const scrollHeight =
                            descriptionTextareaRef.current.scrollHeight;
                          const minHeight = 40; // Minimum height for one line
                          const maxHeight = 300;
                          const newHeight = Math.min(
                            Math.max(scrollHeight, minHeight),
                            maxHeight
                          );
                          descriptionTextareaRef.current.style.height =
                            newHeight + "px";
                        }
                      }}
                      className={`w-full px-3 py-2 border rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none overflow-hidden ${
                        editableProjectData.deletion_requested &&
                        editableProjectData.deletion_request_status ===
                          "pending"
                          ? "border-red-500 border-2 bg-red-50"
                          : "border-gray-300"
                      }`}
                      placeholder="Project description"
                      rows={1}
                      style={{
                        minHeight: "40px",
                        height: "auto",
                        lineHeight: "1.5",
                        paddingTop: "8px",
                        paddingBottom: "8px",
                      }}
                    />
                  </div>

                  {/* Project Feedback from Student */}
                  {editableProjectData?.project_feedback && (
                    <div
                      className="tpq-modal-section"
                      style={{
                        marginTop: 0,
                        marginBottom: "6px",
                        padding: "12px 16px",
                        backgroundColor: "#f0f9ff",
                        border: "1px solid #bfdbfe",
                        borderRadius: "6px",
                      }}
                    >
                      <h4
                        style={{
                          marginBottom: "8px",
                          color: "#1e40af",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <BookOpen size={16} />
                        Student Feedback
                      </h4>
                      <div
                        style={{
                          padding: "12px",
                          backgroundColor: "white",
                          border: "1px solid #cbd5e0",
                          borderRadius: "6px",
                          fontSize: "14px",
                          color: "#4a5568",
                          lineHeight: "1.6",
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {editableProjectData.project_feedback}
                      </div>
                    </div>
                  )}

                  {/* Stages Section - Replicated from CreateProject */}
                  <div
                    className="tpq-modal-section"
                    style={{ marginTop: 0, paddingTop: 0 }}
                  >
                    <h4 style={{ marginBottom: "8px" }}>Project Stages</h4>
                    {editableProjectData?.stages &&
                    Array.isArray(editableProjectData.stages) &&
                    editableProjectData.stages.length > 0 ? (
                      <div
                        className="border-b border-gray-200 bg-gray-50"
                        style={{
                          position: "sticky",
                          top: 0,
                          zIndex: 10,
                          backgroundColor: "#f9fafb",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                        }}
                      >
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
                                stageStatus={
                                  stageStatuses[stage.stage_id] || stage.status
                                }
                              />
                            ))}
                        </div>
                      </div>
                    ) : null}

                    {editableProjectData?.stages &&
                    Array.isArray(editableProjectData.stages) &&
                    editableProjectData.stages.length > 0 ? (
                      <>
                        {/* Stage Content */}
                        <div ref={stageContentRef} className="mt-4">
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
                            const isLastStage =
                              currentStageIndex === sortedStages.length - 1;

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
                                              style={{
                                                backgroundColor: "#d1fae5",
                                                color: "#065f46",
                                                border: "1px solid #a7f3d0",
                                              }}
                                              className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                                              style={{
                                                backgroundColor: "#fef3c7",
                                                color: "#92400e",
                                                border: "1px solid #fde68a",
                                              }}
                                              className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

                                {/* Stage Feedback Section */}
                                <div className="mt-6 pt-6 border-t border-gray-200">
                                  <label className="block text-xs font-semibold text-gray-500 mb-2">
                                    STAGE FEEDBACK
                                  </label>
                                  {/* Display existing feedback if available and different from current */}
                                  {currentStage.gate?.feedback &&
                                    (!stageFeedbacks[currentStage.stage_id] ||
                                      stageFeedbacks[currentStage.stage_id] !==
                                        currentStage.gate.feedback) && (
                                      <div
                                        style={{
                                          marginBottom: "12px",
                                          padding: "12px 16px",
                                          backgroundColor: "#f0f9ff",
                                          border: "1px solid #bfdbfe",
                                          borderRadius: "6px",
                                        }}
                                      >
                                        <div
                                          style={{
                                            fontSize: "12px",
                                            fontWeight: 600,
                                            color: "#1e40af",
                                            marginBottom: "6px",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "6px",
                                          }}
                                        >
                                          <BookOpen size={14} />
                                          Previous Feedback
                                        </div>
                                        <div
                                          style={{
                                            padding: "8px 12px",
                                            backgroundColor: "white",
                                            border: "1px solid #cbd5e0",
                                            borderRadius: "4px",
                                            fontSize: "14px",
                                            color: "#4a5568",
                                            lineHeight: "1.6",
                                            whiteSpace: "pre-wrap",
                                          }}
                                        >
                                          {currentStage.gate.feedback}
                                        </div>
                                      </div>
                                    )}
                                  <textarea
                                    value={
                                      stageFeedbacks[currentStage.stage_id] ||
                                      currentStage.gate?.feedback ||
                                      ""
                                    }
                                    onChange={(e) => {
                                      setStageFeedbacks((prev) => ({
                                        ...prev,
                                        [currentStage.stage_id]: e.target.value,
                                      }));
                                      setHasUnsavedChanges(true);
                                      setSuccessMessage("");
                                      setErrorMessage("");
                                    }}
                                    className="w-full px-4 py-3 border rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none"
                                    rows={2}
                                    style={{
                                      minHeight: "60px",
                                      lineHeight: "1.5",
                                    }}
                                  />
                                  {(stageFeedbacks[currentStage.stage_id] ||
                                    currentStage.gate?.feedback) && (
                                    <div
                                      style={{
                                        marginTop: "8px",
                                        fontSize: "12px",
                                        color: "#6b7280",
                                        fontStyle: "italic",
                                      }}
                                    >
                                      Feedback will be saved when you submit all
                                      decisions
                                    </div>
                                  )}
                                </div>

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

                                {/* Stage-Level Actions */}
                                <div
                                  className="mt-6 pt-6 border-t border-gray-200"
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    gap: "12px",
                                  }}
                                >
                                  <div style={{ flex: 1 }}>
                                    <div
                                      style={{
                                        fontSize: "12px",
                                        fontWeight: 600,
                                        color: "#6b7280",
                                        marginBottom: "8px",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.5px",
                                      }}
                                    >
                                      Stage Review Status
                                    </div>
                                    {currentStage.status ||
                                    stageStatuses[currentStage.stage_id] ? (
                                      <div
                                        style={{
                                          display: "inline-flex",
                                          alignItems: "center",
                                          gap: "6px",
                                          padding: "6px 12px",
                                          borderRadius: "6px",
                                          fontSize: "14px",
                                          fontWeight: 500,
                                          backgroundColor:
                                            (currentStage.status ||
                                              stageStatuses[
                                                currentStage.stage_id
                                              ]) === "Approved"
                                              ? "#d1fae5"
                                              : "#fef3c7",
                                          color:
                                            (currentStage.status ||
                                              stageStatuses[
                                                currentStage.stage_id
                                              ]) === "Approved"
                                              ? "#065f46"
                                              : "#92400e",
                                          border:
                                            (currentStage.status ||
                                              stageStatuses[
                                                currentStage.stage_id
                                              ]) === "Approved"
                                              ? "1px solid #a7f3d0"
                                              : "1px solid #fde68a",
                                        }}
                                      >
                                        {(currentStage.status ||
                                          stageStatuses[currentStage.stage_id]) === "Pending" ? "Revision" : (currentStage.status ||
                                            stageStatuses[currentStage.stage_id])}
                                      </div>
                                    ) : (
                                      <div
                                        style={{
                                          fontSize: "14px",
                                          color: "#9ca3af",
                                          fontStyle: "italic",
                                        }}
                                      >
                                        No status set
                                      </div>
                                    )}
                                  </div>
                                  <div
                                    style={{
                                      display: "flex",
                                      gap: "8px",
                                      flexWrap: "wrap",
                                    }}
                                  >
                                    <button
                                      onClick={() =>
                                        handleStageApprove(
                                          currentStage.stage_id
                                        )
                                      }
                                      disabled={isSaving}
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "6px",
                                        padding: "8px 16px",
                                        backgroundColor: "#d1fae5",
                                        color: "#065f46",
                                        border: "1px solid #a7f3d0",
                                        borderRadius: "6px",
                                        fontSize: "14px",
                                        fontWeight: 500,
                                        cursor: isSaving
                                          ? "not-allowed"
                                          : "pointer",
                                        opacity: isSaving ? 0.6 : 1,
                                      }}
                                      title="Approve this stage"
                                    >
                                      <CheckCircle size={16} />
                                      Approve Stage
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleStageRevision(
                                          currentStage.stage_id
                                        )
                                      }
                                      disabled={isSaving}
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "6px",
                                        padding: "8px 16px",
                                        backgroundColor: "#fef3c7",
                                        color: "#92400e",
                                        border: "1px solid #fde68a",
                                        borderRadius: "6px",
                                        fontSize: "14px",
                                        fontWeight: 500,
                                        cursor: isSaving
                                          ? "not-allowed"
                                          : "pointer",
                                        opacity: isSaving ? 0.6 : 1,
                                      }}
                                      title="Request revision for this stage"
                                    >
                                      <XCircle size={16} />
                                      Request Revision
                                    </button>
                                    {isLastStage && (
                                      <button
                                        onClick={handleSubmitAll}
                                        disabled={isSaving}
                                        style={{
                                          display: "flex",
                                          alignItems: "center",
                                          gap: "6px",
                                          padding: "10px 20px",
                                          backgroundColor: "#3182ce",
                                          color: "white",
                                          border: "1px solid #2563eb",
                                          borderRadius: "6px",
                                          fontSize: "15px",
                                          fontWeight: 600,
                                          cursor: isSaving
                                            ? "not-allowed"
                                            : "pointer",
                                          opacity: isSaving ? 0.6 : 1,
                                          marginLeft: "auto",
                                        }}
                                        title="Submit all stage decisions to backend"
                                      >
                                        {isSaving ? (
                                          <>
                                            <Loader2
                                              size={16}
                                              className="spin"
                                            />
                                            Submitting...
                                          </>
                                        ) : (
                                          <>
                                            <CheckCircle size={16} />
                                            Submit All Decisions
                                          </>
                                        )}
                                      </button>
                                    )}
                                  </div>
                                </div>
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

              {/* Close button - Always available */}
              {!detailsLoading && editableProjectData && (
                <div
                  className="tpq-modal-actions"
                  style={{
                    marginTop: "24px",
                    marginBottom: 0,
                    paddingBottom: "8px",
                    justifyContent: "flex-end",
                  }}
                >
                  <button
                    className="tpq-btn tpq-btn--secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCloseDetails();
                    }}
                    disabled={isSaving}
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Unsaved Changes */}
      {showCloseConfirm && (
        <div
          className="tpq-modal-overlay"
          style={{ zIndex: 20000, position: "fixed" }}
        >
          <div
            className="tpq-modal"
            style={{ maxWidth: "420px", zIndex: 20001 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="tpq-modal-header" style={{ paddingBottom: "16px" }}>
              <div
                style={{ display: "flex", alignItems: "center", gap: "12px" }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    backgroundColor: "#fef3c7",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                    <line x1="12" y1="9" x2="12" y2="13"></line>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                  </svg>
                </div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: "20px",
                    fontWeight: "600",
                    color: "#1a202c",
                  }}
                >
                  Unsaved Changes
                </h2>
              </div>
            </div>
            <div
              className="tpq-modal-content"
              style={{
                paddingTop: "0",
                paddingBottom: "24px",
                marginTop: "8px",
                marginBottom: "8px",
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: "15px",
                  lineHeight: "1.6",
                  color: "#4a5568",
                }}
              >
                You have unsaved changes. Are you sure you want to close? All
                unsaved edits will be lost.
              </p>
            </div>
            <div
              className="tpq-modal-actions"
              style={{
                paddingTop: "20px",
                paddingBottom: "8px",
                paddingRight: "24px",
                borderTop: "1px solid #e2e8f0",
                gap: "12px",
                justifyContent: "flex-end",
                marginTop: "8px",
              }}
            >
              <button
                onClick={() => setShowCloseConfirm(false)}
                style={{
                  minWidth: "100px",
                  padding: "10px 20px",
                  fontSize: "14px",
                  fontWeight: "500",
                  backgroundColor: "#f7fafc",
                  color: "#2d3748",
                  border: "1px solid #cbd5e0",
                  borderRadius: "6px",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "#edf2f7";
                  e.target.style.borderColor = "#a0aec0";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "#f7fafc";
                  e.target.style.borderColor = "#cbd5e0";
                }}
              >
                Cancel
              </button>
              <button
                onClick={closeDialog}
                style={{
                  minWidth: "140px",
                  padding: "10px 20px",
                  fontSize: "14px",
                  fontWeight: "500",
                  backgroundColor: "#f7fafc",
                  color: "#2d3748",
                  border: "1px solid #cbd5e0",
                  borderRadius: "6px",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "#edf2f7";
                  e.target.style.borderColor = "#a0aec0";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "#f7fafc";
                  e.target.style.borderColor = "#cbd5e0";
                }}
              >
                Close Without Saving
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deletion Requests Details Modal */}
      <DeletionRequestsModal
        isOpen={showDeletionRequestsModal}
        onClose={() => {
          setShowDeletionRequestsModal(false);
          setSelectedProjectDeletionRequests([]);
        }}
        deletionRequests={selectedProjectDeletionRequests}
      />
    </div>
  );
}
