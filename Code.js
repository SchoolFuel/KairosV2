function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("Kairos")
    .addItem("Open Sidebar", "showSidebar")
    .addToUi();
}

function showSidebar() {
  const html = HtmlService.createHtmlOutputFromFile("Sidebar")
    .setTitle("Kairos for Personalized Learning")
    .setWidth(400);
  SpreadsheetApp.getUi().showSidebar(html);
}

function getUserEmail() {
  var user_email = "teacher1@gmail.com"; // Session.getActiveUser().getEmail()
  const identity_url = "https://a3trgqmu4k.execute-api.us-west-1.amazonaws.com/prod/identity-fetch";
  const payload = { email_id: user_email };
  const options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  };
  const response = UrlFetchApp.fetch(identity_url, options);
  const responseJson = JSON.parse(response.getContentText());
  return {
    statusCode: response.getResponseCode(),
    email: user_email,
    role: responseJson.role,
  };
}

function callOpenAI(prompt) {
  const baseUrl = "https://a3trgqmu4k.execute-api.us-west-1.amazonaws.com/prod/invoke";
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
  const baseUrl = "https://a3trgqmu4k.execute-api.us-west-1.amazonaws.com/prod/invoke";
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
  const url = "https://a3trgqmu4k.execute-api.us-west-1.amazonaws.com/prod/invoke";
  const body = { action: "myprojects", payload: { request: "teacher_view_all", subject_domain: "History" } };

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
  try { out = JSON.parse(text); } catch { throw new Error("Bad JSON: " + text); }

  let bodyLike = out && typeof out.body === "string" ? JSON.parse(out.body) : out.body;
  if (!bodyLike) bodyLike = out.action_response || out;

  return { statusCode: out.statusCode || out.status || 200, body: bodyLike };
}

function getTeacherProjectDetails(projectId, userId) {
  if (!projectId) throw new Error("Missing projectId");
  if (!userId) throw new Error("Missing userId");

  const url = "https://a3trgqmu4k.execute-api.us-west-1.amazonaws.com/prod/invoke";
  const payload = {
    action: "myprojects",
    payload: { project_id: String(projectId), user_id: String(userId), request: "project_details" },
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
  try { out = JSON.parse(text); } catch (e) { throw new Error("Bad JSON: " + text); }

  const body = out && typeof out.body === "string" ? JSON.parse(out.body) : out.body;

  let project =
    (body && body.project) ||
    (Array.isArray(body && body.projects) ? body.projects[0] : null) ||
    out.project ||
    (Array.isArray(out.projects) ? out.projects[0] : null) ||
    (body && body.data && (body.data.project || (Array.isArray(body.data.projects) ? body.data.projects[0] : null))) ||
    null;

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
    return { statusCode: out.statusCode || 200, body: { project: null, debug: body || out } };
  }
  if (project && !project.user_id && out.action_response?.user_id) {
    project.user_id = out.action_response.user_id;
  }

  return { statusCode: out.statusCode || 200, body: { project } };
}

/*********************************
 * Status normalization (single source of truth)
 *********************************/
function normStatus(s) {
  const x = String(s == null ? "" : s).trim().toLowerCase();
  if (x === "approved") return "Approved";
  if (x === "rejected" || x === "reject") return "Rejected";
  // includes "", null, "pending", "pending approval", etc.
  return "Pending Approval";
}

/*********************************
 * Write project -> Sheet
 * - Clears old validations
 * - Only task rows get dropdowns (D col)
 *********************************/
function writeProjectToSheet(project) {
  if (!project) throw new Error("writeProjectToSheet: no project payload");
  const pid = String(project.project_id || project.id || "").trim();
  if (!pid) throw new Error("writeProjectToSheet: missing project_id on project");
  const uid = String(project.user_id || "").trim();
  if (!uid) throw new Error("writeProjectToSheet: missing userId parameter");

  if (project.user_id && String(project.user_id).trim() !== uid) {
    throw new Error("writeProjectToSheet: user_id mismatch between project payload and parameter");
  }
  project.user_id = uid;

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const docProps = PropertiesService.getDocumentProperties();
  const existingSheetId = docProps.getProperty("proj:" + pid);
  let sh = existingSheetId ? getSheetById_(ss, Number(existingSheetId)) : null;

  if (!sh) {
    const rawTitle = project.project_title || "Project";
    const base = (rawTitle || "Project").replace(/[\\\/\?\*\[\]:]/g, "").replace(/\s+/g, " ").trim().substring(0, 95);
    let name = base || "Project";
    let i = 2;
    while (ss.getSheetByName(name)) name = `${base} (${i++})`;
    sh = ss.insertSheet(name);
    docProps.setProperty("proj:" + pid, String(sh.getSheetId()));
  }

  ss.setActiveSheet(sh);
  sh.clearFormats();
  sh.clearContents();
  // Make sure no old validations remain anywhere
  sh.getRange(1, 1, sh.getMaxRows(), sh.getMaxColumns()).clearDataValidations();

  // Hidden columns J..M
  const COL_J = 10, COL_K = 11, COL_L = 12, COL_M = 13;

  // Meta (A..B)
  const meta = [
    ["Title",       project.project_title || ""],       // only project_title is shown
    ["Subject",     project.subject_domain || ""],
    ["Status",      normStatus(project.status)],
    ["Owner",       project.owner_name || project.owner_email || ""],
    ["Description", project.description || ""],
  ];
  sh.getRange(1, 1, meta.length, 2).setValues(meta);
  sh.getRange(1, 1, meta.length, 1).setFontWeight("bold");
  sh.getRange(1, 2, meta.length, 1).setWrap(true);

  // Store IDs in hidden columns (row 1)
  sh.getRange(1, COL_J).setValue("_project_id");
  sh.getRange(1, COL_K).setValue(pid);
  sh.getRange(1, COL_L).setValue("_user_id");
  sh.getRange(1, COL_M).setValue(uid);

  // Styles
  sh.setColumnWidths(1, 1, 160);
  sh.setColumnWidths(2, 1, 560);
  sh.setColumnWidths(3, 7, 160);
  sh.getRange(1, 1, 5000, COL_M).setFontFamily("Arial").setFontSize(10);
  sh.setFrozenRows(1);

  // Validation for task status (allowed values)
  const statusValidation = SpreadsheetApp.newDataValidation()
    .requireValueInList(["Pending Approval", "Approved", "Rejected"], true)
    .setAllowInvalid(false)
    .build();

  let r = meta.length + 3; // start after meta + spacer
  const stages = Array.isArray(project.stages) ? project.stages : [];
  let taskCount = 0;

  if (!stages.length) {
    sh.getRange(r, 1).setValue("No stages found in payload.");
    sh.hideColumns(COL_J, 4);
    return `Opened "${sh.getName()}" — 0 stage(s).`;
  }

  for (let i = 0; i < stages.length; i++) {
    const st = stages[i] || {};

    // Stage header (A..I)
    sh.getRange(r, 1, 1, 9).merge();
    sh.getRange(r, 1)
      .setValue(`Stage ${st.stage_order || i + 1}: ${st.title || "Untitled"}`)
      .setFontWeight("bold")
      .setBackground("#eef2ff")
      .setBorder(true, true, true, true, false, false, "#c7d2fe", SpreadsheetApp.BorderStyle.SOLID);

    // Hidden: stage_id on header row (J/K)
    sh.getRange(r, COL_J).setValue("_stage_id");
    sh.getRange(r, COL_K).setValue(st.stage_id || "");
    r++;

    // Stage status line (text only)
    sh.getRange(r, 1, 1, 9).merge();
    sh.getRange(r, 1).setValue(`Status: ${normStatus(st.status)}`).setFontStyle("italic").setBackground("#f8fafc");
    r++;

    // Task header
    const headerRow = r;
    sh.getRange(r, 1, 1, 7)
      .setValues([["Task #","Task Title","Description","Status","Evidence","Assigned To","Due Date"]])
      .setFontWeight("bold")
      .setBackground("#e0e7ff");
    // Ensure *header* Status cell has NO validation
    sh.getRange(headerRow, 4).clearDataValidations();
    r++;

    // Tasks
    const tasks = Array.isArray(st.tasks) ? st.tasks : [];
    if (!tasks.length) {
      sh.getRange(r, 1, 1, 8).merge();
      sh.getRange(r, 1).setValue("No tasks").setFontStyle("italic").setBackground("#f9fafb");
      r++;
    } else {
      const rows = tasks.map((t, idx) => {
        taskCount++;
        return [
          idx + 1,
          t.title || "",
          t.description || "",
          normStatus(t.status),                 // normalized to allowed set
          t.evidence_link || "",
          t.assigned_to || "",
          t.due_date || "",
        ];
      });
      const startRow = r;
      sh.getRange(startRow, 1, rows.length, 7).setValues(rows).setWrap(true);

      // Apply validation ONLY to task Status cells (column D)
      sh.getRange(startRow, 4, rows.length, 1).setDataValidation(statusValidation);

      // Hidden per-task: _task_id (J/K) and link _stage_id (L/M)
      for (let k = 0; k < tasks.length; k++) {
        const rowIdx = startRow + k;
        const t = tasks[k] || {};
        sh.getRange(rowIdx, COL_J).setValue("_task_id");
        sh.getRange(rowIdx, COL_K).setValue(t.task_id || "");
        sh.getRange(rowIdx, COL_L).setValue("_stage_id");
        sh.getRange(rowIdx, COL_M).setValue(st.stage_id || "");
      }
      r += rows.length;
    }

    // Gate header
    r++;
    sh.getRange(r, 1, 1, 9).merge();
    sh.getRange(r, 1).setValue("Gate").setFontWeight("bold").setBackground("#eef2ff");

    // Hidden gate_id on the gate header row
    sh.getRange(r, COL_J).setValue("_gate_id");
    sh.getRange(r, COL_K).setValue((st.gate && st.gate.gate_id) || "");
    r++;

    // Gate meta
    const g = st.gate || {};
    const gateMeta = [
      ["Gate Status", g.status || ""],
      ["Feedback", g.feedback || ""],
      ["Review Date", g.review_date || ""],
      ["Rubric Score", g.rubric_score || ""],
    ];
    sh.getRange(r, 1, gateMeta.length, 2).setValues(gateMeta);
    r += gateMeta.length + 2;
  }

  // Hide J..M
  sh.hideColumns(10, 4);

  return `Opened "${sh.getName()}" — ${stages.length} stage(s), ${taskCount} task(s).`;
}

/*********************************
 * Read project <- Sheet
 * - Validates hidden IDs
 * - Normalizes all statuses
 *********************************/
function readProjectFromSheet(projectId, userId) {
  if (!projectId) throw new Error("readProjectFromSheet: missing projectId");
  if (!userId) throw new Error("readProjectFromSheet: missing userId");

  const pid = String(projectId).trim();
  const uid = String(userId).trim();

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const docProps = PropertiesService.getDocumentProperties();
  const sheetId = docProps.getProperty("proj:" + pid);
  if (!sheetId) throw new Error("No sheet found for projectId: " + pid);

  const sh = getSheetById_(ss, Number(sheetId));
  if (!sh) throw new Error("Sheet not found for projectId: " + pid);

  const lastRow = sh.getLastRow();
  const maxCol = Math.max(sh.getLastColumn(), 13);
  if (lastRow === 0) throw new Error("Sheet is empty");

  const data = sh.getRange(1, 1, lastRow, maxCol).getDisplayValues();

  // Zero-based indices for hidden cols
  const COL_J = 9, COL_K = 10, COL_L = 11, COL_M = 12;
  const safe = (r, c) => (data[r] && data[r][c] != null) ? String(data[r][c]).trim() : "";

  // Validate hidden IDs
  const hiddenPidKey = safe(0, COL_J);
  const hiddenPidVal = safe(0, COL_K);
  const hiddenUidKey = safe(0, COL_L);
  const hiddenUidVal = safe(0, COL_M);

  if (hiddenPidKey === "_project_id" && hiddenPidVal && hiddenPidVal !== pid) {
    throw new Error("readProjectFromSheet: project_id mismatch (param vs sheet)");
  }
  if (hiddenUidKey === "_user_id" && hiddenUidVal && hiddenUidVal !== uid) {
    throw new Error("readProjectFromSheet: user_id mismatch (param vs sheet)");
  }

  // Base project object
  const project = {
    project_id: hiddenPidVal || pid,
    user_id: hiddenUidVal || uid,
    project_title: safe(0, 1),
    subject_domain: safe(1, 1),
    status: normStatus(safe(2, 1)),
    owner_name: "",
    owner_email: "",
    description: safe(4, 1),
    stages: [],
  };

  // Owner parsing (row 4 col B)
  const ownerField = safe(3, 1);
  if (ownerField) {
    const emailMatch = ownerField.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
    if (emailMatch) {
      project.owner_email = emailMatch[0];
      project.owner_name =
        ownerField.replace(emailMatch[0], "").replace(/[<>]/g, "").trim() ||
        ownerField.split("@")[0];
    } else {
      project.owner_name = ownerField;
    }
  }

  const isStageHeader = (v) => typeof v === "string" && v.trim().startsWith("Stage ");
  const isTaskIndex   = (v) => typeof v === "string" && /^\d+$/.test(v.trim());
  const looksLikeTaskHeader = (row) => {
    if (!data[row]) return false;
    const rowStr = data[row].map(v => (v || "").toString().toLowerCase()).join("|");
    return /task|title|description|status|evidence|assigned|due/.test(rowStr);
  };

  // find first stage header (col A)
  let r = 0;
  while (r < data.length && !(data[r][0] && isStageHeader(String(data[r][0])))) r++;

  let stageOrder = 1;
  while (r < data.length) {
    const a = safe(r, 0);
    if (!a) { r++; continue; }
    if (!isStageHeader(a)) { r++; continue; }

    const stageTitle = a.replace(/^Stage\s+\d+:\s*/, "").trim();
    const stage = {
      stage_id: `stage_${stageOrder}`, // fallback
      stage_order: stageOrder,
      title: stageTitle,
      status: "",
      tasks: [],
      gate: { gate_id: "", title: "Gate", status: "", feedback: "", review_date: "", rubric_score: "" }
    };

    // hidden stage_id on header row
    if (safe(r, COL_J) === "_stage_id" && safe(r, COL_K)) {
      stage.stage_id = safe(r, COL_K);
    }

    // optional "Status: ..." line right under header
    const maybeStatusRow = r + 1;
    if (maybeStatusRow < data.length && safe(maybeStatusRow, 0).startsWith("Status: ")) {
      const rawStageStatus = safe(maybeStatusRow, 0).replace("Status: ", "").trim();
      stage.status = normStatus(rawStageStatus);
      r = maybeStatusRow + 1;
    } else {
      // no explicit status line; default to Pending Approval (our rule)
      stage.status = normStatus("");
      r = r + 1;
    }

    // skip task header row if present
    if (looksLikeTaskHeader(r)) r++;

    // tasks
    let taskOrder = 1;
    while (r < data.length) {
      const first = safe(r, 0);
      if (!first) { r++; continue; }
      if (isStageHeader(first)) break;     // next stage header → stop tasks
      if (first === "No tasks") { r++; break; }

      if (first === "Gate") {
        // Hidden gate_id on the gate header row
        if (safe(r, COL_J) === "_gate_id" && safe(r, COL_K)) {
          stage.gate.gate_id = safe(r, COL_K);
        }
        r++;
        while (r < data.length) {
          const la = safe(r, 0);
          const vb = safe(r, 1);
          if (!la) { r++; break; }
          if (isStageHeader(la)) break;
          const key = la.toLowerCase();
          if (key === "gate status") stage.gate.status = vb;
          else if (key === "feedback") stage.gate.feedback = vb;
          else if (key === "review date") stage.gate.review_date = vb;
          else if (key === "rubric score") stage.gate.rubric_score = vb;
          r++;
        }
        break;
      }

      if (isTaskIndex(first)) {
        const row = data[r];
        const rawTaskStatus = row[3];
        const task = {
          task_id: `task_${stageOrder}_${taskOrder}`, // fallback; can be overridden by hidden col
          task_order: taskOrder,
          title: (row[1] || "").toString().trim(),
          description: (row[2] || "").toString().trim(),
          status: normStatus(rawTaskStatus), // normalized to allowed set
          evidence_link: (row[4] || "").toString().trim(),
          assigned_to: (row[5] || "").toString().trim(),
          due_date: (row[6] || "").toString().trim(),
          stage_id: stage.stage_id
        };

        // hidden overrides on task row
        if (safe(r, COL_J) === "_task_id" && safe(r, COL_K)) {
          task.task_id = safe(r, COL_K);
        }
        if (safe(r, COL_L) === "_stage_id" && safe(r, COL_M)) {
          task.stage_id = safe(r, COL_M);
        }

        stage.tasks.push(task);
        taskOrder++;
        r++;
        continue;
      }

      r++;
    }

    project.stages.push(stage);
    stageOrder++;
  }

  return project;
}

/*********************************
 * Submit (send to backend)
 * - Status already normalized from the sheet
 * - Remove user_id from project body; pass at top-level
 *********************************/
function submitProjectDecision(projectId, userId, decision, overallComment) {
  try {
    if (!projectId) throw new Error("Missing projectId");

    const projectData = readProjectFromSheet(projectId, userId);
    const uid = String(userId || projectData.user_id).trim();
    if (!uid) throw new Error("Missing user_id");

    // DO NOT include user_id inside project body
    const { user_id: _omit, ...projectNoUser } = projectData;

    // Optional: add comment/decision metadata if needed by backend (kept out of project body)
    const cleanedProject = emptyToNullDeep(projectNoUser);

    const payload = {
      action: "saveproject",
      payload: {
        json: { project: cleanedProject },
        user_id: uid,
        generatedAt: new Date().toISOString()
      }
    };

    const res = UrlFetchApp.fetch(
      "https://a3trgqmu4k.execute-api.us-west-1.amazonaws.com/prod/invoke",
      {
        method: "POST",
        contentType: "application/json",
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      }
    );

    const code = res.getResponseCode();
    const txt  = res.getContentText();
    if (code < 200 || code >= 300) throw new Error(`Backend error ${code}: ${txt}`);

    const result = JSON.parse(txt);
    if (result && result.status === "error") {
      return { success: false, error: result.message || "Backend reported error", result };
    }

    // Buttons are not tied to status; they just send. Keep a friendly message:
    return { success: true, result, message: "Project payload sent successfully." };

  } catch (e) {
    return { success: false, error: e.message || String(e) };
  }
}

/*********************************
 * Utils
 *********************************/
function getSheetById_(ss, sheetId) {
  const sheets = ss.getSheets();
  for (let i = 0; i < sheets.length; i++) {
    if (sheets[i].getSheetId() === sheetId) return sheets[i];
  }
  return null;
}

function emptyToNullDeep(value) {
  if (typeof value === "string" && value.trim() === "") return null;
  if (Array.isArray(value)) return value.map(emptyToNullDeep);
  if (value && typeof value === "object") {
    const out = {};
    Object.keys(value).forEach((k) => { out[k] = emptyToNullDeep(value[k]); });
    return out;
  }
  return value;
}

function testReadProjectFromSheet_print() {
  const projectId = "f1e1b4b3-6b2d-4e9e-8d8c-0f4f4c7c4e7a";
  const userId    = "23e228fa-4592-4bdc-852e-192973c388ce";
  try {
    const project = readProjectFromSheet(projectId, userId);
    Logger.log("===== readProjectFromSheet OUTPUT =====");
    Logger.log(JSON.stringify(project, null, 2));
    Logger.log("=======================================");
    return project; // also returns the object for programmatic use
  } catch (err) {
    Logger.log("readProjectFromSheet ERROR: " + (err && err.stack ? err.stack : err));
    return { success: false, error: String(err && err.message ? err.message : err) };
  }
}

