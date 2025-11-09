import { useState } from "react";

/**
 * Custom hook for managing deletion requests
 * Handles loading deletion requests from API and flagging tasks/stages
 */
export function useDeletionRequests() {
  const [deletionRequests, setDeletionRequests] = useState([]);

  /**
   * Load deletion requests for all subject domains
   * @param {Array<string>} subjectDomains - Array of subject domains to fetch requests for
   * @returns {Promise<Array>} Array of pending deletion requests
   */
  const loadDeletionRequests = async (subjectDomains) => {
    try {
      const uniqueDomains = [...new Set(subjectDomains)].filter((d) => d);
      
      if (uniqueDomains.length === 0) {
        setDeletionRequests([]);
        return [];
      }

      // Make all API calls in parallel instead of sequentially
      const deletionRequestPromises = uniqueDomains.map((domain) => {
        return new Promise((resolve) => {
          google.script.run
            .withSuccessHandler((res) => {
              resolve({ domain, response: res, error: null });
            })
            .withFailureHandler((error) => {
              console.error(
                `Error loading deletion requests for ${domain}:`,
                error
              );
              resolve({ domain, response: null, error }); // Return empty on error
            })
            .getDeletionRequests(domain);
        });
      });

      // Wait for all requests to complete in parallel
      const results = await Promise.all(deletionRequestPromises);

      // Process all responses
      const allRequests = [];
      results.forEach(({ domain, response, error }) => {
        if (error || !response) return;

        // Extract requests from response
        let requests = [];
        if (
          response &&
          response.action_response &&
          Array.isArray(response.action_response.requests)
        ) {
          requests = response.action_response.requests;
        } else if (
          response &&
          response.body &&
          response.body.action_response &&
          Array.isArray(response.body.action_response.requests)
        ) {
          requests = response.body.action_response.requests;
        } else if (Array.isArray(response.requests)) {
          requests = response.requests;
        }

        // Filter only pending requests for tasks, stages, and projects
        const pendingRequests = requests.filter(
          (req) =>
            req.status === "pending" &&
            (req.entity_type === "task" || req.entity_type === "stage" || req.entity_type === "project")
        );
        allRequests.push(...pendingRequests);
      });

      // Deduplicate by request_id to prevent duplicates
      const uniqueRequestsMap = new Map();
      allRequests.forEach((req) => {
        if (req.request_id) {
          // Only keep the first occurrence of each request_id
          if (!uniqueRequestsMap.has(req.request_id)) {
            uniqueRequestsMap.set(req.request_id, req);
          }
        }
      });
      const uniqueRequests = Array.from(uniqueRequestsMap.values());

      const duplicateCount = allRequests.length - uniqueRequests.length;
      if (duplicateCount > 0) {
        console.log(`Removed ${duplicateCount} duplicate deletion requests`);
      }
      console.log(`Loaded ${uniqueRequests.length} unique pending deletion requests`);
      setDeletionRequests(uniqueRequests);
      return uniqueRequests;
    } catch (err) {
      console.error("Error loading deletion requests:", err);
      setDeletionRequests([]);
      return [];
    }
  };

  /**
   * Deep clone helper function
   * Optimized to use structuredClone if available (faster than JSON.parse/stringify)
   */
  const deepClone = (obj) => {
    if (typeof structuredClone === "function") {
      return structuredClone(obj);
    }
    // Fallback for older browsers
    return JSON.parse(JSON.stringify(obj));
  };

  /**
   * Match deletion requests to tasks and stages in projects
   * Only uses deletion requests from API, ignores any existing flags in project data
   * @param {Array} projectsList - Array of projects to flag
   * @param {Array} deletionRequestsList - Array of deletion requests from API
   * @returns {Array} Projects with flagged tasks and stages
   */
  const flagTasksWithDeletionRequests = (
    projectsList,
    deletionRequestsList
  ) => {
    // Early return if no requests
    if (!deletionRequestsList || deletionRequestsList.length === 0) {
      return projectsList.map((project) => ({
        ...project,
        hasDeletionRequests: false,
        deletionRequestCount: 0,
        deletionRequestDetails: [],
      }));
    }

    // Create lookup maps for O(1) access instead of O(n) find operations
    const requestsByProjectId = new Map();
    deletionRequestsList.forEach((req) => {
      if (!requestsByProjectId.has(req.project_id)) {
        requestsByProjectId.set(req.project_id, []);
      }
      requestsByProjectId.get(req.project_id).push(req);
    });

    return projectsList.map((project) => {
      // Deep clone project to avoid mutating original
      const flaggedProject = deepClone(project);

      // Get requests for this project (O(1) lookup)
      let projectRequests = requestsByProjectId.get(project.project_id) || [];

      // Deduplicate project requests by request_id to ensure uniqueness
      // This handles cases where the API might return duplicate requests
      const uniqueProjectRequestsMap = new Map();
      projectRequests.forEach((req) => {
        if (req.request_id && !uniqueProjectRequestsMap.has(req.request_id)) {
          uniqueProjectRequestsMap.set(req.request_id, req);
        }
      });
      projectRequests = Array.from(uniqueProjectRequestsMap.values());

      if (projectRequests.length === 0) {
        flaggedProject.hasDeletionRequests = false;
        flaggedProject.deletionRequestCount = 0;
        flaggedProject.deletionRequestDetails = [];
        return flaggedProject;
      }

      // Separate project-level requests from stage/task requests
      const projectLevelRequests = projectRequests.filter(
        (req) => req.entity_type === "project"
      );
      
      // If there's a project-level deletion request, flag the entire project
      if (projectLevelRequests.length > 0) {
        // Use the first project-level request (there should only be one per project)
        const projectRequest = projectLevelRequests[0];
        flaggedProject.deletion_requested = true;
        flaggedProject.deletion_request_status = "pending";
        flaggedProject.deletion_request_id = projectRequest.request_id;
      } else {
        // Clear project-level flags if no project deletion request
        delete flaggedProject.deletion_requested;
        delete flaggedProject.deletion_request_status;
        delete flaggedProject.deletion_request_id;
      }

      // Create lookup maps for stages and tasks for faster matching
      // If multiple requests exist for the same stage/task, we keep the first one
      const stageRequestMap = new Map();
      const taskRequestMap = new Map();
      
      // Only process stage and task requests (exclude project requests from stage/task mapping)
      const stageTaskRequests = projectRequests.filter(
        (req) => req.entity_type === "stage" || req.entity_type === "task"
      );
      
      stageTaskRequests.forEach((req) => {
        if (req.entity_type === "stage" && req.stage_id) {
          // Only keep first request for each stage
          if (!stageRequestMap.has(req.stage_id)) {
            stageRequestMap.set(req.stage_id, req);
          }
        } else if (req.entity_type === "task" && req.task_id && req.stage_id) {
          const key = `${req.stage_id}:${req.task_id}`;
          // Only keep first request for each task
          if (!taskRequestMap.has(key)) {
            taskRequestMap.set(key, req);
          }
        }
      });

      // Create lookup maps for stages and tasks in project for title enrichment
      const stageMap = new Map();
      const taskMap = new Map();

      // Flag stages and tasks based ONLY on API deletion requests
      if (flaggedProject.stages && Array.isArray(flaggedProject.stages)) {
        flaggedProject.stages.forEach((stage) => {
          // Clear existing flags
          delete stage.deletion_requested;
          delete stage.deletion_request_status;
          delete stage.deletion_request_id;

          // Check for stage deletion requests (O(1) lookup)
          const stageRequest = stageRequestMap.get(stage.stage_id);
          if (stageRequest) {
            stage.deletion_requested = true;
            stage.deletion_request_status = "pending";
            stage.deletion_request_id = stageRequest.request_id;
          }

          // Store stage for title lookup
          if (stage.stage_id) {
            stageMap.set(stage.stage_id, stage);
          }

          // Check for task deletion requests
          if (stage.tasks && Array.isArray(stage.tasks)) {
            stage.tasks.forEach((task) => {
              // Clear existing flags
              delete task.deletion_requested;
              delete task.deletion_request_status;
              delete task.deletion_request_id;

              // Check for task deletion requests (O(1) lookup)
              const key = `${stage.stage_id}:${task.task_id}`;
              const taskRequest = taskRequestMap.get(key);
              if (taskRequest) {
                task.deletion_requested = true;
                task.deletion_request_status = "pending";
                task.deletion_request_id = taskRequest.request_id;
              }

              // Store task for title lookup
              if (task.task_id && stage.stage_id) {
                const taskKey = `${stage.stage_id}:${task.task_id}`;
                taskMap.set(taskKey, task);
              }
            });
          }
        });
      }

      // Add hasDeletionRequests flag to project
      flaggedProject.hasDeletionRequests = projectRequests.length > 0;
      flaggedProject.deletionRequestCount = projectRequests.length;

      // Store deletion request details for display (enriched with titles)
      // Deduplicate by request_id to prevent displaying duplicates
      const uniqueRequestDetailsMap = new Map();
      projectRequests.forEach((req) => {
        if (req.request_id && !uniqueRequestDetailsMap.has(req.request_id)) {
          let stageTitle = req.stage_title || null;
          let taskTitle = req.task_title || null;

          // Look up stage title from project structure (O(1) lookup)
          if (req.stage_id) {
            const stage = stageMap.get(req.stage_id);
            if (stage && stage.title) {
              stageTitle = stage.title;
            }
          }

          // Look up task title from project structure (O(1) lookup)
          if (req.task_id && req.stage_id) {
            const taskKey = `${req.stage_id}:${req.task_id}`;
            const task = taskMap.get(taskKey);
            if (task && task.title) {
              taskTitle = task.title;
            }
          }

          uniqueRequestDetailsMap.set(req.request_id, {
            request_id: req.request_id,
            entity_type: req.entity_type,
            stage_title: stageTitle,
            task_title: taskTitle,
            stage_id: req.stage_id,
            task_id: req.task_id,
            project_title: req.project_title || null,
            requested_by: req.requested_by,
            requested_at: req.requested_at,
            reason: req.reason,
          });
        }
      });
      flaggedProject.deletionRequestDetails = Array.from(uniqueRequestDetailsMap.values());

      return flaggedProject;
    });
  };

  /**
   * Remove a deletion request from the local state
   * Used when a request is rejected/approved to immediately update UI
   * @param {String} requestId - The request ID to remove
   */
  const removeDeletionRequest = (requestId) => {
    setDeletionRequests((prev) => prev.filter((req) => req.request_id !== requestId));
  };

  return {
    deletionRequests,
    loadDeletionRequests,
    flagTasksWithDeletionRequests,
    removeDeletionRequest,
  };
}
