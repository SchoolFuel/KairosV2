function getTeacherProjectDetails(projectId, userId) {
  if (!projectId) throw new Error("Missing projectId");
  if (!userId) throw new Error("Missing userId");

  const url =
    "https://a3trgqmu4k.execute-api.us-west-1.amazonaws.com/prod/invoke";
  const payload = {
    action: "myprojects",
    payload: {
      project_id: String(projectId),
      user_id: String(userId),
      email_id: "teacher1@gmail.com",
      request: "project_details",
    },
  };

  const res = UrlFetchApp.fetch(url, {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  });

  const code = res.getResponseCode();
  const text = res.getContentText();
  if (code < 200 || code >= 300) throw new Error("API " + code + ": " + text);

  let out = {};
  try {
    out = JSON.parse(text);
  } catch (e) {
    throw new Error("Bad JSON: " + text);
  }

  const body =
    out && typeof out.body === "string" ? JSON.parse(out.body) : out.body;

  let project =
    (body && body.project) ||
    (Array.isArray(body && body.projects) ? body.projects[0] : null) ||
    out.project ||
    (Array.isArray(out.projects) ? out.projects[0] : null) ||
    (body &&
      body.data &&
      (body.data.project ||
        (Array.isArray(body.data.projects) ? body.data.projects[0] : null))) ||
    null;

  if (!project) {
    (function findProject(o) {
      if (!o || typeof o !== "object" || project) return;
      const looks =
        (o.project_id || o.id) &&
        (o.project_title || o.title) &&
        Array.isArray(o.stages);
      if (looks) {
        project = o;
        return;
      }
      for (const k in o) {
        const v = o[k];
        if (Array.isArray(v)) v.forEach(findProject);
        else findProject(v);
        if (project) return;
      }
    })(body || out);
  }

  if (!project) {
    return {
      statusCode: out.statusCode || 200,
      body: { project: null, debug: body || out },
    };
  }
  if (project && !project.user_id && out.action_response?.user_id) {
    project.user_id = out.action_response.user_id;
  }

  return { statusCode: out.statusCode || 200, body: { project } };
}

function getTeacherProjectsAll() {
  const url =
    "https://a3trgqmu4k.execute-api.us-west-1.amazonaws.com/prod/invoke";
  const body = {
    action: "myprojects",
    payload: {
      request: "teacher_view_all",
      email_id: "teacher1@gmail.com",
      subject_domain: "Science",
    },
  };

  const res = UrlFetchApp.fetch(url, {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(body),
    muteHttpExceptions: true,
  });

  const code = res.getResponseCode();
  const text = res.getContentText();
  if (code < 200 || code >= 300) throw new Error("API " + code + ": " + text);

  let out;
  try {
    out = JSON.parse(text);
  } catch {
    throw new Error("Bad JSON: " + text);
  }

  let bodyLike =
    out && typeof out.body === "string" ? JSON.parse(out.body) : out.body;
  if (!bodyLike) bodyLike = out.action_response || out;

  return { statusCode: out.statusCode || out.status || 200, body: bodyLike };
}

/**
 * Submit a deletion request from student
 * @param {Object} deletionData - Deletion request data
 * @returns {Object} Response with success status
 */
function submitDeletionRequest(deletionData) {
  if (!deletionData) throw new Error("Missing deletionData");
  if (!deletionData.entity_type) throw new Error("Missing entity_type");
  if (!deletionData.project_title) throw new Error("Missing project_title");

  const url =
    "https://a3trgqmu4k.execute-api.us-west-1.amazonaws.com/prod/invoke";

  // Construct payload based on entity type
  const payload = {
    action: "myprojects",
    payload: {
      request: "delete_request",
      entity_type: deletionData.entity_type, // "task", "stage", or "project"
      project_title: deletionData.project_title,
      stage_title: deletionData.stage_title || null,
      task_title: deletionData.task_title || null,
      task_id: deletionData.task_id || null,
      project_id: deletionData.project_id || null,
      user_id: deletionData.user_id || null,
      email_id: "student1@gmail.com", // This should come from the student context
      reason: deletionData.reason || "No reason provided",
    },
  };

  try {
    Logger.log("=== submitDeletionRequest START ===");
    Logger.log("Payload: " + JSON.stringify(payload, null, 2));

    const options = {
      method: "POST",
      contentType: "application/json",
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
    };

    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();

    Logger.log("Response Code: " + responseCode);
    Logger.log("Response Text: " + responseText);

    if (responseCode < 200 || responseCode >= 300) {
      throw new Error("API " + responseCode + ": " + responseText);
    }

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      throw new Error("Bad JSON response: " + responseText);
    }

    Logger.log("=== submitDeletionRequest SUCCESS ===");
    return {
      success: true,
      statusCode: responseCode,
      message: "Deletion request submitted successfully",
      data: responseData,
    };
  } catch (error) {
    Logger.log("=== submitDeletionRequest ERROR ===");
    Logger.log("Error: " + error.toString());
    return {
      success: false,
      message: error.message || "Failed to submit deletion request",
    };
  }
}

/**
 * Save teacher's project updates (approve, reject, or save edits)
 * @param {Object} projectData - The full project data object
 * @param {String} status - The new status (e.g., "Approved", "Pending Revision")
 * @returns {Object} Response with success status and message
 */
function saveTeacherProjectUpdate(projectData, status) {
  if (!projectData) throw new Error("Missing projectData");
  if (!projectData.project_id) throw new Error("Missing project_id");
  if (!projectData.user_id) throw new Error("Missing user_id");

  const url =
    "https://a3trgqmu4k.execute-api.us-west-1.amazonaws.com/prod/invoke";

  try {
    Logger.log("=== saveTeacherProjectUpdate START ===");
    Logger.log(
      "Input projectData keys: " + Object.keys(projectData).join(", ")
    );
    Logger.log("Input status: " + status);
    Logger.log("Input project_id: " + projectData.project_id);
    Logger.log("Input user_id: " + projectData.user_id);

    // Add status to project data if provided (null means preserve existing status)
    // Deep clone projectData to avoid mutating the original
    const projectToSave = JSON.parse(JSON.stringify(projectData));
    if (status !== null && status !== undefined) {
      projectToSave.status = status;
      Logger.log("Status added to project: " + status);
    } else {
      Logger.log("Status preserved: " + (projectToSave.status || "none"));
    }

    Logger.log(
      "Project to save keys: " + Object.keys(projectToSave).join(", ")
    );
    if (projectToSave.stages && Array.isArray(projectToSave.stages)) {
      Logger.log("Number of stages: " + projectToSave.stages.length);
      projectToSave.stages.forEach((stage, idx) => {
        Logger.log(
          "Stage " +
            idx +
            " - stage_id: " +
            (stage.stage_id || "missing") +
            ", title: " +
            (stage.title || "missing") +
            ", teacher_review_status: " +
            (stage.teacher_review_status || "none")
        );
      });
    }

    // Prepare the payload according to saveproject action format
    const payload = {
      action: "saveproject",
      payload: {
        json: {
          project: projectToSave,
        },
        user_id: String(projectData.user_id),
        email_id: "teacher1@gmail.com",
        generatedAt: new Date().toISOString(),
      },
    };

    Logger.log("=== PAYLOAD TO SEND ===");
    Logger.log(JSON.stringify(payload, null, 2));

    const options = {
      method: "POST",
      contentType: "application/json",
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
    };

    // Make the API call to the backend
    Logger.log("Sending request to: " + url);
    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();

    Logger.log("=== API RESPONSE ===");
    Logger.log("Response Code: " + responseCode);
    Logger.log("Response Text: " + responseText);

    if (responseCode < 200 || responseCode >= 300) {
      throw new Error("API " + responseCode + ": " + responseText);
    }

    let responseData;
    try {
      responseData = JSON.parse(responseText);
      Logger.log(
        "Parsed response data keys: " + Object.keys(responseData).join(", ")
      );
      if (responseData.action_response) {
        Logger.log(
          "action_response keys: " +
            Object.keys(responseData.action_response).join(", ")
        );
      }
    } catch (e) {
      Logger.log("ERROR: Failed to parse response as JSON: " + e.toString());
      throw new Error("Bad JSON response: " + responseText);
    }

    // Return success response
    Logger.log("=== SUCCESS ===");
    Logger.log("Returning success response");
    Logger.log("=== saveTeacherProjectUpdate END ===");

    return {
      success: true,
      statusCode: responseCode,
      message:
        responseData.action_response?.response ||
        "Project updated successfully!",
      data: responseData,
    };
  } catch (error) {
    Logger.log("=== ERROR in saveTeacherProjectUpdate ===");
    Logger.log("Error type: " + error.toString());
    Logger.log("Error message: " + error.message);
    console.error("Error in saveTeacherProjectUpdate:", error);

    // Handle different types of errors
    if (
      error.toString().includes("DNS error") ||
      error.toString().includes("network")
    ) {
      return {
        success: false,
        message:
          "Network connection error. Please check your internet connection.",
      };
    } else if (error.toString().includes("timeout")) {
      return {
        success: false,
        message: "Request timed out. Please try again.",
      };
    } else {
      return {
        success: false,
        message:
          error.message ||
          "An unexpected error occurred. Please contact support if the problem persists.",
      };
    }
  }
}
