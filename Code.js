function onOpen() {
    SpreadsheetApp.getUi()
      .createMenu('Kairos')
      .addItem('Open Sidebar', 'showSidebar')
      .addToUi();
  }
  
  function showSidebar() {
    const html = HtmlService.createHtmlOutputFromFile('Sidebar')
      .setTitle("Kairos for Personalized Learning")
      .setWidth(400);
    SpreadsheetApp.getUi().showSidebar(html);
  }

  function getUserEmail() {
    var user_email = "teacher1@gmail.com"; //Session.getActiveUser().getEmail()
    const identity_url = 'https://a3trgqmu4k.execute-api.us-west-1.amazonaws.com/prod/identity-fetch';
    const payload = {
      email_id: user_email,
    };
    const options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,  // Important to get response even if it's 401/403 etc.
    };

    const response = UrlFetchApp.fetch(identity_url, options);

    const responseText = response.getContentText();
    const responseJson = JSON.parse(responseText);

    return {
      statusCode: response.getResponseCode(),
      email: user_email,
      role: responseJson.role
    }
  }
  function callOpenAI(prompt) {
  const baseUrl = 'https://a3trgqmu4k.execute-api.us-west-1.amazonaws.com/prod/invoke'; // Lambda URL

  const payload = {
    action: "advice",
    payload: {
      message: prompt,
      email_id: Session.getActiveUser().getEmail()
    }
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(baseUrl, options);
  const result = JSON.parse(response.getContentText());
  Logger.log(result)

  return result.recommendation || "No response available";
}

function generateProject(prompt) {
  const baseUrl = 'https://a3trgqmu4k.execute-api.us-west-1.amazonaws.com/prod/invoke'; // Lambda URL

  const payload = {
    action: "createproject",
    payload: {
      message: prompt,
      email_id: Session.getActiveUser().getEmail(),
    }
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(baseUrl, options);
  const result = JSON.parse(response.getContentText());

  return JSON.stringify(result.json.project) || "No response available";
}



function processDailyCheckin(payload) {


  console.log("this is from processDailyCheckin");
  
  const url = 'YOUR_API_ENDPOINT/process-daily-checkin';
 
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    payload: JSON.stringify(payload)
  };
  
  try {
    const response = UrlFetchApp.fetch(url, options);
    return JSON.parse(response.getContentText());
  } catch (error) {
    console.error('Error processing daily check-in:', error);
    throw error;
  }

}

function getTeacherProjectsAll() {
  const url = 'https://a3trgqmu4k.execute-api.us-west-1.amazonaws.com/prod/invoke';
  const body = {
    action: 'myprojects',
    payload: { user_id: '23e228fa-4592-4bdc-852e-192973c388ce', request: 'teacher_view_all' , subject_domain: 'Science' }
  };

  const res = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(body),
    muteHttpExceptions: true
  });

  const code = res.getResponseCode();
  const text = res.getContentText();
  if (code < 200 || code >= 300) throw new Error('API ' + code + ': ' + text);

  // Backend returns: { statusCode, body: { projects:[...], user_id } }
  const out = JSON.parse(text);

  // If body is a JSON string, parse it
  if (out && typeof out.body === 'string') {
    try { out.body = JSON.parse(out.body); } catch(e) {}
  }

  return out;
}

function getTeacherProjectDetails(projectId) {
  if (!projectId) throw new Error('Missing projectId');

  var url = 'https://a3trgqmu4k.execute-api.us-west-1.amazonaws.com/prod/invoke';
  var payload = {
    action: 'myprojects',
    payload: {
      user_id: '23e228fa-4592-4bdc-852e-192973c388ce',
      project_id: String(projectId),
      request: 'project_details'
    }
  };

  var res = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });

  var code = res.getResponseCode();
  var text = res.getContentText();
  Logger.log('DETAILS ' + code + ': ' + text);
  if (code < 200 || code >= 300) throw new Error('API ' + code + ': ' + text);

  var out  = JSON.parse(text);
  var body = (out && typeof out.body === 'string') ? JSON.parse(out.body) : out.body;

  // Try common shapes
  var project =
    (body && body.project) ||
    (Array.isArray(body && body.projects) ? body.projects[0] : null) ||
    out.project ||
    (Array.isArray(out.projects) ? out.projects[0] : null) ||
    (body && body.data && (body.data.project || (Array.isArray(body.data.projects) ? body.data.projects[0] : null))) ||
    null;

  // As a last resort, search recursively for an object that looks like a project
  if (!project) {
    project = (function findProject(o) {
      if (!o || typeof o !== 'object') return null;
      if ((o.project_id || o.id) && (o.project_title || o.title) && Array.isArray(o.stages)) return o;
      for (var k in o) {
        var v = o[k];
        if (Array.isArray(v)) {
          for (var i = 0; i < v.length; i++) {
            var f = findProject(v[i]); if (f) return f;
          }
        } else {
          var f2 = findProject(v); if (f2) return f2;
        }
      }
      return null;
    })(body || out);
  }

  if (!project) {
    Logger.log('DETAILS: could not locate project. Body keys=' + Object.keys(body || {}).join(','));
    // return debug to frontend instead of throwing
    return { statusCode: out.statusCode || 200, body: { project: null, debug: body || out } };
  }

  return { statusCode: out.statusCode || 200, body: { project: project } };
}


function updateTaskReview(projectId, taskId, status, feedback) {
  Logger.log(JSON.stringify({ fn:'updateTaskReview', projectId, taskId, status, feedback }));
  // TODO: call your backend here
  return { ok: true };
}

function saveStageFeedback(projectId, stageId, feedback) {
  Logger.log(JSON.stringify({ fn:'saveStageFeedback', projectId, stageId, feedback }));
  // TODO: call your backend here
  return { ok: true };
}

function approveAllTasks(projectId) {
  Logger.log(JSON.stringify({ fn:'approveAllTasks', projectId }));
  // TODO: call your backend here
  return { ok: true };
}

function submitProjectDecision(projectId, decision, comments) {
  Logger.log(JSON.stringify({ fn:'submitProjectDecision', projectId, decision, comments }));
  // decision ∈ {'approve','return','reject'} — we used 'return' and 'reject' above; approve-all button marks tasks, but you can also call 'approve' here if desired.
  // TODO: call your backend here
  return { ok: true };
}



/**
 * Write a full project object to the active sheet (clears first).
 * Call this from the client after you already fetched details.
 */


/********** PUBLIC: open (or create) a review sheet for a project **********/

/********** PUBLIC: open (or create) a review sheet for a project **********/
/********** PUBLIC: open (or create) a review sheet for a project **********/
function writeProjectToSheet(project) {
  if (!project) return 'No project to write.';

  const ss = SpreadsheetApp.getActive();
  const docProps = PropertiesService.getDocumentProperties();

  const projectId = String(project.project_id || project.id || '');
  const existingSheetId = projectId ? docProps.getProperty('proj:' + projectId) : null;
  let sh = existingSheetId ? getSheetById_(ss, Number(existingSheetId)) : null;

  if (!sh) {
    const rawTitle = project.project_title || project.title || 'Project';
    const base = (rawTitle || 'Project')
      .replace(/[\\\/\?\*\[\]:]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 95);

    let name = base || 'Project';
    let i = 2;
    while (ss.getSheetByName(name)) name = `${base} (${i++})`;
    sh = ss.insertSheet(name);

    if (projectId) docProps.setProperty('proj:' + projectId, String(sh.getSheetId()));
  }

  ss.setActiveSheet(sh);

  // Build
  sh.clearFormats();
  sh.clearContents();
  removeAllProtections_(sh);

  let r = 1;

  // --- META (no IDs) ---
  const meta = [
    ['Title',   project.project_title || project.title || ''],
    ['Subject', project.subject_domain || ''],
    ['Status',  project.status || ''],
    ['Owner',   project.owner_name || project.owner_email || ''],
    // NEW: Description row
    ['Description', project.description || '']         // ← value editable
  ];
  sh.getRange(r, 1, meta.length, 2).setValues(meta);
  sh.getRange(r, 1, meta.length, 1).setFontWeight('bold');
  sh.getRange(r, 2, meta.length, 1).setWrap(true);     // wrap description nicely
  protectRanges_(sh, [ sh.getRange(r, 1, meta.length, 1) ], 'Lock meta labels');
  r += meta.length + 2;

  // widths/fonts/freeze
  sh.setColumnWidths(1, 1, 160);   // labels
  sh.setColumnWidths(2, 1, 560);   // values (wide for description)
  sh.setColumnWidths(3, 7, 160);   // tables (C..I)
  sh.getRange(1, 1, 5000, 9).setFontFamily('Arial').setFontSize(10);
  sh.setFrozenRows(1);

  // Dropdown for task Status
  const statusValidation = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Pending Approval', 'Approved', 'Rejected'], true)
    .setAllowInvalid(false)
    .build();

  const stages = getStages_(project);
  if (!stages.length) {
    sh.getRange(6, 1).setValue('No stages found in payload. Check getTeacherProjectDetails().');
    return `Opened "${sh.getName()}" — 0 stage(s).`;
  }

  let taskCount = 0;

  stages.forEach((st, i) => {
    // Stage header (protected)
    sh.getRange(r, 1, 1, 9).merge();
    sh.getRange(r, 1).setValue(`Stage ${st.stage_order || i + 1}: ${st.title || 'Untitled'}`)
      .setFontWeight('bold')
      .setBackground('#eef2ff')
      .setBorder(true, true, true, true, false, false, '#c7d2fe', SpreadsheetApp.BorderStyle.SOLID);
    protectRanges_(sh, [ sh.getRange(r, 1, 1, 9) ], 'Lock stage header');
    r += 1;

    // Stage status line (protected)
    sh.getRange(r, 1, 1, 9).merge();
    sh.getRange(r, 1).setValue(`Status: ${st.status || '—'}`)
      .setFontStyle('italic').setBackground('#f8fafc');
    protectRanges_(sh, [ sh.getRange(r, 1, 1, 9) ], 'Lock stage status line');
    r += 1;

    // Task table header (protected) — NO IDs
    const taskHeader = [['Task #','Task Title','Description','Status','Evidence','Assigned To','Due Date','Feedback']];
    sh.getRange(r, 1, 1, 8).setValues(taskHeader)
      .setFontWeight('bold').setBackground('#e0e7ff');
    protectRanges_(sh, [ sh.getRange(r, 1, 1, 8) ], 'Lock task header');
    r += 1;

    const tasks = Array.isArray(st.tasks) ? st.tasks : [];
    if (!tasks.length) {
      sh.getRange(r, 1, 1, 8).merge();
      sh.getRange(r, 1).setValue('No tasks').setFontStyle('italic').setBackground('#f9fafb');
      r += 1;
    } else {
      const startRow = r;
      const rows = tasks.map((t, idx) => {
        taskCount += 1;
        return [
          idx + 1,
          t.title || '',
          t.description || '',
          t.review_status || t.status || 'Pending Approval',
          t.evidence_link || '',
          t.assigned_to || '',
          t.due_date || '',
          t.reviewer_feedback || ''
        ];
      });
      sh.getRange(r, 1, rows.length, 8).setValues(rows).setWrap(true);
      sh.getRange(startRow, 4, rows.length, 1).setDataValidation(statusValidation); // Status dropdown
      r += rows.length;
    }

    // Gate block
    r += 1;
    sh.getRange(r, 1, 1, 9).merge();
    sh.getRange(r, 1).setValue('Gate').setFontWeight('bold').setBackground('#eef2ff');
    protectRanges_(sh, [ sh.getRange(r, 1, 1, 9) ], 'Lock gate header');
    r += 1;

    const g = st.gate || {};
    const gateMeta = [
      ['Gate Status', g.status || ''],
      ['Feedback',    g.feedback || ''],   // value cell editable
      ['Review Date', g.review_date || ''],
      ['Rubric Score',g.rubric_score || '']
    ];
    sh.getRange(r, 1, gateMeta.length, 2).setValues(gateMeta);
    protectRanges_(sh, [ sh.getRange(r, 1, gateMeta.length, 1) ], 'Lock gate labels');
    r += gateMeta.length + 2;
  });

  return `Opened "${sh.getName()}" — ${stages.length} stage(s), ${taskCount} task(s).`;
}

/********** HELPERS (unchanged) **********/
function getSheetById_(ss, sheetId) {
  const sheets = ss.getSheets();
  for (var i = 0; i < sheets.length; i++) if (sheets[i].getSheetId() === sheetId) return sheets[i];
  return null;
}
function removeAllProtections_(sh) {
  sh.getProtections(SpreadsheetApp.ProtectionType.SHEET).forEach(p => p.remove());
  sh.getProtections(SpreadsheetApp.ProtectionType.RANGE).forEach(p => p.remove());
}
function protectRanges_(sh, ranges, description) {
  (ranges || []).forEach(function(range){
    var p = range.protect().setDescription(description || 'Protected');
    try { p.removeEditors(p.getEditors()); } catch(e) {}
  });
}
function getStages_(p){
  if (!p) return [];
  if (Array.isArray(p.stages)) return p.stages;
  if (Array.isArray(p.Stages)) return p.Stages;
  if (Array.isArray(p.stage_list)) return p.stage_list;
  if (p.data && Array.isArray(p.data.stages)) return p.data.stages;
  if (p.body && Array.isArray(p.body.stages)) return p.body.stages;
  return [];
}
