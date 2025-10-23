function onOpen() {
  DocumentApp.getUi()
    .createMenu("Kairos")
    .addItem("Open Sidebar", "showSidebar")
    .addToUi();
}

function showSidebar() {
  const html = HtmlService.createHtmlOutputFromFile("Sidebar")
    .setTitle("Kairos for Personalized Learning")
    .setWidth(400);
  DocumentApp.getUi().showSidebar(html);
}

function getUserEmail() {
  var user_email = "teacher1@gmail.com"; // Session.getActiveUser().getEmail()
  const identity_url =
    "https://a3trgqmu4k.execute-api.us-west-1.amazonaws.com/prod/identity-fetch";

  const payload = {
    email_id: user_email,
  };
  const options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
    followRedirects: true,
  };

  const response = UrlFetchApp.fetch(identity_url, options);
  const status = response.getResponseCode();
  if (status < 200 || status >= 300) {
    throw new Error(
      "Identity fetch failed: HTTP " +
        status +
        " — " +
        response.getContentText()
    );
  }

  const responseJson = JSON.parse(response.getContentText());


  return {
    statusCode: status,
    email: user_email,
    role: responseJson.role,
  };
}




function callOpenAI(prompt) {
  const baseUrl =
    "https://a3trgqmu4k.execute-api.us-west-1.amazonaws.com/prod/invoke";
  const payload = {
    action: "advice",
    payload: { message: prompt, email_id: Session.getActiveUser().getEmail() },
  };
  const options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  };
  const response = UrlFetchApp.fetch(baseUrl, options);
  const result = JSON.parse(response.getContentText());
  return result.recommendation || "No response available";
}

function generateProject(prompt) {
  const baseUrl =
    "https://a3trgqmu4k.execute-api.us-west-1.amazonaws.com/prod/invoke";
  const payload = {
    action: "createproject",
    payload: { message: prompt, email_id: Session.getActiveUser().getEmail() },
  };
  const options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  };
  const response = UrlFetchApp.fetch(baseUrl, options);
  const result = JSON.parse(response.getContentText());
  return JSON.stringify(result.json.project) || "No response available";
}

function processDailyCheckin(payload) {
  const url = "YOUR_API_ENDPOINT/process-daily-checkin";
  const options = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    payload: JSON.stringify(payload),
  };
  const response = UrlFetchApp.fetch(url, options);
  return JSON.parse(response.getContentText());
}

/*********************************
 * API: My Projects
 *********************************/
function getTeacherProjectsAll() {
  const url =A
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



/*********************************
 * Status normalization (single source of truth)
 *********************************/
function normStatus(s) {
  const x = String(s == null ? "" : s)
    .trim()
    .toLowerCase();
  if (x === "approved") return "Approved";
  if (x === "rejected" || x === "reject") return "Rejected";
  // includes "", null, "pending", "pending approval", etc.
  return "Pending Approval";
}






function submitProjectDecision(projectId, userId, decision, overallComment, projectSnapshot) {
  // Sidebar-only: do not read Sheets, do not call backend.
  // Optionally accept a project snapshot from the client (React) so you can log or preview what was decided on.
  if (!projectId) {
    return { success: false, error: "Missing projectId" };
  }
  if (!userId) {
    return { success: false, error: "Missing userId" };
  }

  // If you want to enforce normalized statuses locally, you can:
  const normStatusLocal = (s) => {
    const x = String(s == null ? "" : s).trim().toLowerCase();
    if (x === "approved") return "Approved";
    if (x === "rejected" || x === "reject") return "Rejected";
    return "Pending Approval";
  };

  // Nothing is sent anywhere; just echo back what the UI sent.
  return {
    success: true,
    message: "Decision captured locally (no backend, no Sheets).",
    echo: {
      projectId: String(projectId),
      userId: String(userId),
      decision: normStatusLocal(decision),
      overallComment: String(overallComment || ""),
      // Optional: whatever your React passes as a snapshot of the project at decision time
      projectSnapshot: projectSnapshot || null,
    },
  };
}



function getTeacherProjectDetails(projectId, userId) {
  if (!projectId) return { statusCode: 400, body: { project: null, error: "Missing projectId" } };
  if (!userId)     return { statusCode: 400, body: { project: null, error: "Missing userId" } };

  const url = "https://a3trgqmu4k.execute-api.us-west-1.amazonaws.com/prod/invoke";
  const payload = {
    action: "myprojects",
    payload: {
      request: "project_details",
      project_id: String(projectId),
      user_id: String(userId),
      email_id: "teacher1@gmail.com" // or Session.getActiveUser().getEmail()
    }
  };

  const res = UrlFetchApp.fetch(url, {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
    followRedirects: true
  });

  const status = res.getResponseCode();
  const text   = res.getContentText();

  if (status < 200 || status >= 300) {
    return { statusCode: status, body: { project: null, error: "Backend HTTP " + status, debug: text } };
  }

  // Safe parse helpers
  const sp = (v) => { try { return typeof v === "string" ? JSON.parse(v) : v; } catch { return null; } };
  const out  = sp(text) || {};
  const body = (out && out.body != null ? sp(out.body) : null) || out.action_response || out || {};

  // Prefer the shape you showed: action_response.json.project
  let project =
    (out.action_response && out.action_response.json && out.action_response.json.project) ||
    (body.json && body.json.project) ||
    body.project ||
    (Array.isArray(body.projects) ? body.projects[0] : null) ||
    out.project ||
    (Array.isArray(out.projects) ? out.projects[0] : null) ||
    (body.data && (body.data.project || (Array.isArray(body.data.projects) ? body.data.projects[0] : null))) ||
    null;

  // Deep fallback – scan for a project-like object
  if (!project) {
    (function findProject(o) {
      if (!o || typeof o !== "object" || project) return;
      const looks = (o.project_id || o.id) && (o.project_title || o.title) && Array.isArray(o.stages);
      if (looks) { project = o; return; }
      for (const k in o) {
        const v = o[k];
        if (Array.isArray(v)) v.forEach(findProject);
        else findProject(v);
        if (project) return;
      }
    })(body || out);
  }

  if (!project) {
    return { statusCode: out.statusCode || status || 200, body: { project: null, error: "No project found", debug: body || out } };
  }

  // Attach user_id if provided elsewhere
  if (!project.user_id && out.action_response && out.action_response.user_id) {
    project.user_id = out.action_response.user_id;
  }

  // Normalize statuses for UI
  const norm = (s) => {
    const x = String(s == null ? "" : s).trim().toLowerCase();
    if (x === "approved") return "Approved";
    if (x === "rejected" || x === "reject") return "Rejected";
    return "Pending Approval";
  };

  project.status = norm(project.status);

  // Ensure stages is an array
  const stages = Array.isArray(project.stages) ? project.stages.slice() : [];

  // 1) Normalize stage/task/gate status
  stages.forEach((st) => {
    if (!st) return;
    st.status = norm(st.status);
    if (Array.isArray(st.tasks)) {
      st.tasks.forEach((t) => { t.status = norm(t.status); });
    }
    if (st.gate) {
      st.gate.status = norm(st.gate.status);
    }
  });

  // 2) DETACH gates: remove st.gate and append { gate: {..., stage_id} } entries
  const detachedGateEntries = [];
  const normalizedStages = stages.map((st) => {
    if (st && st.gate) {
      const g = Object.assign({}, st.gate);
      if (!g.stage_id) g.stage_id = st.stage_id;       // carry stage_id for matching
      detachedGateEntries.push({ gate: g });
      const { gate, ...rest } = st;
      return rest;                                      // return stage WITHOUT gate
    }
    return st;
  });

  project.stages = normalizedStages.concat(detachedGateEntries);

  return { statusCode: out.statusCode || status || 200, body: { project } };
}
