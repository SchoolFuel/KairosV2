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
      const allRequests = [];
      const uniqueDomains = [...new Set(subjectDomains)];

      for (const domain of uniqueDomains) {
        if (!domain) continue;

        try {
          const response = await new Promise((resolve, reject) => {
            google.script.run
              .withSuccessHandler((res) => {
                resolve(res);
              })
              .withFailureHandler((error) => {
                console.error(
                  `Error loading deletion requests for ${domain}:`,
                  error
                );
                resolve({ requests: [] }); // Return empty on error
              })
              .getDeletionRequests(domain);
          });

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

          // Filter only pending requests for tasks and stages
          const pendingRequests = requests.filter(
            (req) =>
              req.status === "pending" &&
              (req.entity_type === "task" || req.entity_type === "stage")
          );
          allRequests.push(...pendingRequests);
        } catch (err) {
          console.error(
            `Error processing deletion requests for ${domain}:`,
            err
          );
        }
      }

      console.log(`Loaded ${allRequests.length} pending deletion requests`);
      setDeletionRequests(allRequests);
      return allRequests;
    } catch (err) {
      console.error("Error loading deletion requests:", err);
      setDeletionRequests([]);
      return [];
    }
  };

  /**
   * Deep clone helper function
   */
  const deepClone = (obj) =>
    typeof structuredClone === "function"
      ? structuredClone(obj)
      : JSON.parse(JSON.stringify(obj));

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
    return projectsList.map((project) => {
      // Deep clone project to avoid mutating original
      const flaggedProject = deepClone(project);

      // First, clear any existing deletion flags (we only use API data)
      if (flaggedProject.stages && Array.isArray(flaggedProject.stages)) {
        flaggedProject.stages.forEach((stage) => {
          // Clear stage deletion flags
          delete stage.deletion_requested;
          delete stage.deletion_request_status;
          delete stage.deletion_request_id;

          if (stage.tasks && Array.isArray(stage.tasks)) {
            stage.tasks.forEach((task) => {
              // Clear task deletion flags
              delete task.deletion_requested;
              delete task.deletion_request_status;
              delete task.deletion_request_id;
            });
          }
        });
      }

      // If no deletion requests from API, return project with cleared flags
      if (!deletionRequestsList || deletionRequestsList.length === 0) {
        flaggedProject.hasDeletionRequests = false;
        flaggedProject.deletionRequestCount = 0;
        return flaggedProject;
      }

      // Find deletion requests for this project from API
      const projectRequests = deletionRequestsList.filter(
        (req) => req.project_id === project.project_id
      );

      console.log(
        `Project ${project.project_id}: Found ${projectRequests.length} deletion requests`,
        projectRequests.map((r) => ({
          entity_type: r.entity_type,
          stage_id: r.stage_id,
          task_id: r.task_id,
        }))
      );

      if (projectRequests.length === 0) {
        flaggedProject.hasDeletionRequests = false;
        flaggedProject.deletionRequestCount = 0;
        return flaggedProject;
      }

      // Flag stages and tasks based ONLY on API deletion requests
      if (flaggedProject.stages && Array.isArray(flaggedProject.stages)) {
        flaggedProject.stages.forEach((stage) => {
          // Check for stage deletion requests
          const stageRequest = projectRequests.find(
            (req) =>
              req.entity_type === "stage" && req.stage_id === stage.stage_id
          );

          if (stageRequest) {
            // Flag stage if found in API response
            console.log(
              `Flagging stage for deletion: stage_id=${stage.stage_id}, title=${stage.title}`,
              `Request stage_id=${stageRequest.stage_id}`
            );
            stage.deletion_requested = true;
            stage.deletion_request_status = "pending";
            stage.deletion_request_id = stageRequest.request_id; // Store request_id for rejection
          } else {
            // Debug: log why stage wasn't matched
            const stageRequests = projectRequests.filter(
              (req) => req.entity_type === "stage"
            );
            if (stageRequests.length > 0) {
              console.log(
                `Stage not matched: stage_id=${stage.stage_id}, title=${stage.title}`,
                `Available stage requests:`,
                stageRequests.map((r) => r.stage_id)
              );
            }
          }

          // Check for task deletion requests
          if (stage.tasks && Array.isArray(stage.tasks)) {
            stage.tasks.forEach((task) => {
              const taskRequest = projectRequests.find(
                (req) =>
                  req.entity_type === "task" &&
                  req.task_id === task.task_id &&
                  req.stage_id === stage.stage_id
              );

              if (taskRequest) {
                // Only flag if found in API response
                task.deletion_requested = true;
                task.deletion_request_status = "pending";
                task.deletion_request_id = taskRequest.request_id; // Store request_id for rejection
              }
            });
          }
        });
      }

      // Add hasDeletionRequests flag to project based on API data
      flaggedProject.hasDeletionRequests = projectRequests.length > 0;
      flaggedProject.deletionRequestCount = projectRequests.length;

      return flaggedProject;
    });
  };

  return {
    deletionRequests,
    loadDeletionRequests,
    flagTasksWithDeletionRequests,
  };
}
