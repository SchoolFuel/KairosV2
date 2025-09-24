/**
 * Build/activate "Gate Standard" sheet from a project payload.
 */
function openGateStandardSheetFromProject(project) {
  if (!project) throw new Error("openGateStandardSheetFromProject: missing project");
  const stages = Array.isArray(project.stages) ? project.stages.slice() : [];
  if (!stages.length) throw new Error("No stages found in project");

  const pid = String(project.project_id || project.id || "").trim();
  const uid = String(project.user_id || "").trim();

  // Sort stages by stage_order
  stages.sort((a, b) => (a.stage_order || 0) - (b.stage_order || 0));

  const SHEET_NAME = "Gate Standard";
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const lock = LockService.getDocumentLock();
  lock.tryLock(5000);

  // Hidden columns (1-based)
  const COL_J = 10, COL_K = 11, COL_L = 12, COL_M = 13;

  try {
    // Create or reset the sheet
    let sh = ss.getSheetByName(SHEET_NAME);
    if (!sh) {
      sh = ss.insertSheet(SHEET_NAME);
    } else {
      sh.clearFormats();
      sh.clearContents();
      sh.getRange(1, 1, sh.getMaxRows(), sh.getMaxColumns()).clearDataValidations();
    }

    // Header / layout
    const projectName = String(project.project_title || project.title || "Project").trim();
    sh.getRange(1, 1, 1, 7).merge()
      .setValue(projectName)
      .setFontWeight("bold").setFontSize(14).setBackground("#eef2ff");
    sh.getRange(2, 1, 1, 7).setBackground("#ffffff");

    // Column widths (A..G)
    sh.setColumnWidths(1, 1, 60);    // #
    sh.setColumnWidths(2, 1, 260);   // Checklist
    sh.setColumnWidths(3, 1, 360);   // Description
    sh.setColumnWidths(4, 1, 140);   // Status
    sh.setColumnWidths(5, 1, 160);   // Assigned To
    sh.setColumnWidths(6, 1, 140);   // Due Date
    sh.setColumnWidths(7, 1, 220);   // Feedback
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1000, COL_M).setFontFamily("Arial").setFontSize(10);

    // Top-level hidden IDs (row 1)
    sh.getRange(1, COL_J).setValue("_project_id");
    sh.getRange(1, COL_K).setValue(pid);
    sh.getRange(1, COL_L).setValue("_user_id");
    sh.getRange(1, COL_M).setValue(uid);

    // Cursor row to start drawing gates
    let r = 3;

    // Helper: set one row of values
    const writeRow = (rowIdx, arr) => sh.getRange(rowIdx, 1, 1, arr.length).setValues([arr]);

    stages.forEach((st, idx) => {
      const gateNum = st.stage_order || (idx + 1);
      const g = st.gate || {};
      const gateTitle = g.title || st.title || `Gate ${gateNum}`;
      const gateDesc  = g.description || "";
      const stageId   = String(st.stage_id || "").trim();
      const gateId    = String(g.gate_id || "").trim();

      // Gate title row (A:G merged)
      sh.getRange(r, 1, 1, 7).merge();
      sh.getRange(r, 1)
        .setValue(`Gate ${gateNum}: ${gateTitle}`)
        .setFontWeight("bold")
        .setBackground("#eef2ff")
        .setBorder(true, true, true, true, false, false, "#c7d2fe", SpreadsheetApp.BorderStyle.SOLID);
      // Hidden IDs on the gate title row
      sh.getRange(r, COL_J).setValue("_stage_id");
      sh.getRange(r, COL_K).setValue(stageId);
      sh.getRange(r, COL_L).setValue("_gate_id");
      sh.getRange(r, COL_M).setValue(gateId);
      r++;

      // Optional gate description row (A:G merged)
      if (gateDesc) {
        sh.getRange(r, 1, 1, 7).merge();
        sh.getRange(r, 1).setValue(gateDesc).setBackground("#f8fafc");
        r++;
      }

      // Subheader for this gate
      writeRow(r, ["#", "Checklist", "Description", "Status", "Assigned To", "Due Date", "Feedback"]);
      sh.getRange(r, 1, 1, 7).setFontWeight("bold").setBackground("#e0e7ff");
      r++;

      // Checklist rows (numbered per gate)
      const checklist = Array.isArray(g.checklist) ? g.checklist : [];
      if (!checklist.length) {
        writeRow(r, ["", "(no checklist items)", "", "Pending", "", "", ""]);
        sh.getRange(r, COL_J).setValue("_parent_stage_id");
        sh.getRange(r, COL_K).setValue(stageId);
        sh.getRange(r, COL_L).setValue("_parent_gate_id");
        sh.getRange(r, COL_M).setValue(gateId);
        r++;
      } else {
        let num = 1;
        checklist.forEach(item => {
          let code = "", text = "";
          if (item && typeof item === "object") {
            code = String(item.code || "").trim();
            text = String(item.title || item.description || item.text || "").trim();
          } else {
            const s = String(item || "").trim();
            const m = s.match(/^\s*\[([^\]]+)\]\s*(.*)$/);
            if (m) { code = m[1].trim(); text = (m[2] || "").trim(); }
            else { text = s; }
          }
          const checklistCell = code ? `${code} — ${text}` : text;

          writeRow(r, [num, checklistCell, "", "Pending", "", "", ""]);

          sh.getRange(r, COL_J).setValue("_parent_stage_id");
          sh.getRange(r, COL_K).setValue(stageId);
          sh.getRange(r, COL_L).setValue("_parent_gate_id");
          sh.getRange(r, COL_M).setValue(gateId);

          num++;
          r++;
        });
      }

      // Spacer row between gates
      r++;
    });

    // === Status dropdown ONLY on checklist rows ===
    const lastRow = sh.getLastRow();
    if (lastRow >= 3) {
      const statusRule = SpreadsheetApp.newDataValidation()
        .requireValueInList(["Pending", "Approved", "Reject"], true)
        .setAllowInvalid(false)
        .build();

      for (let row = 3; row <= lastRow; row++) {
        const a = sh.getRange(row, 1).getDisplayValue().trim();              // "#"/num/blank
        const b = sh.getRange(row, 2).getDisplayValue().trim().toLowerCase(); // header text or item text
        const isChecklistRow = /^\d+$/.test(a) || b === "(no checklist items)";
        const cell = sh.getRange(row, 4); // Status

        if (isChecklistRow) {
          cell.setDataValidation(statusRule);
          if (!cell.getDisplayValue()) cell.setValue("Pending");
        } else {
          cell.clearDataValidations();
        }
      }
    }

    // Hide hidden columns J..M
    sh.hideColumns(COL_J, 4);

    // Activate view
    ss.setActiveSheet(sh);
    sh.activate();
    sh.setActiveSelection("A3");

    return `Built "${SHEET_NAME}" with ${stages.length} gates for project ${pid}.`;
  } finally {
    lock.releaseLock();
  }
}









/**
 * Read "Gate Standard" sheet -> JSON using hidden IDs.

 */
/**

 */
function readGateStandardFromSheet(projectId, userId) {
  const SHEET_NAME = "Gate Standard";
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) throw new Error(`Sheet not found: ${SHEET_NAME}`);

  const COL = { NUM:1, CHECK:2, DESC:3, STATUS:4, ASSIGN:5, DUE:6, FEEDBACK:7, J:10, K:11, L:12, M:13 };
  const lastRow = sh.getLastRow();
  const lastCol = Math.max(sh.getLastColumn(), COL.M);
  if (lastRow < 3) return { project_id:"", user_id:"", gates:[] };

  const data = sh.getRange(1, 1, lastRow, lastCol).getDisplayValues();
  const safe = (r,c) => (data[r] && data[r][c] != null) ? String(data[r][c]).trim() : "";

  // Top-level hidden IDs in row 1
  const pidKey = safe(0, COL.J - 1), pidVal = safe(0, COL.K - 1);
  const uidKey = safe(0, COL.L - 1), uidVal = safe(0, COL.M - 1);
  const pid = pidKey === "_project_id" ? pidVal : "";
  const uid = uidKey === "_user_id" ? uidVal : "";

  if (projectId && pid && pid !== String(projectId)) {
    throw new Error("Gate Standard sheet project_id mismatch (param vs hidden)");
  }
  if (userId && uid && uid !== String(userId)) {
    throw new Error("Gate Standard sheet user_id mismatch (param vs hidden)");
  }

  const normStatus = (s) => {
    const x = String(s || "").trim().toLowerCase();
    if (x === "approved") return "Approved";
    if (x === "rejected" || x === "reject") return "Rejected";
    return "Pending Approval";
  };

  // Helpers to detect structural rows
  const isGateTitleRow = (r) => safe(r, COL.J - 1) === "_stage_id" && safe(r, COL.L - 1) === "_gate_id";
  const looksLikeSubheader = (r) =>
    safe(r, COL.NUM - 1) === "#" &&
    safe(r, COL.CHECK - 1).toLowerCase() === "checklist";

  const isSpacerRow = (r) => {
    const a = safe(r, COL.NUM - 1), b = safe(r, COL.CHECK - 1), c = safe(r, COL.DESC - 1);
    return !a && !b && !c;
  };

  const gates = [];
  let r = 2; // start scanning near row 3 (0-based index 2)

  while (r < data.length) {
    // Find next gate title row via hidden markers
    while (r < data.length && !isGateTitleRow(r)) r++;
    if (r >= data.length) break;

    const titleText = safe(r, 0); // merged A:G shows in col A
    let gate_number = null, gate_title = titleText || "";
    const m = titleText.match(/^Gate\s+(\d+)\s*:\s*(.*)$/i);
    if (m) { gate_number = Number(m[1]); gate_title = m[2]; }

    const stage_id = safe(r, COL.K - 1);
    const gate_id  = safe(r, COL.M - 1);

    // Optional description row (next row may be merged text without ID markers)
    let descRow = r + 1;
    let description = "";
    if (descRow < data.length && !isGateTitleRow(descRow) && !looksLikeSubheader(descRow)) {
      description = safe(descRow, 0); // merged description lives in col A
      // sanity: if this row is actually blank, don't consume it
      if (!description) descRow = r; // no real description
    } else {
      descRow = r;
    }

    // Find subheader row (skip description if any)
    let hdr = descRow + 1;
    while (hdr < data.length && !looksLikeSubheader(hdr)) hdr++;
    if (hdr >= data.length) break;

    // Checklist rows: from hdr+1 until spacer or next gate title
    const start = hdr + 1;
    let end = start - 1;
    for (let i = start; i < data.length; i++) {
      if (isSpacerRow(i) || isGateTitleRow(i) || looksLikeSubheader(i)) break;
      end = i;
    }

    const gate = {
      gate_number,
      stage_id,
      gate_id,
      title: gate_title,
      description,
      // Status/assigned/due/feedback on the gate row aren’t part of this layout; leave empty:
      status: "",
      assigned_to: "",
      due_date: "",
      feedback: "",
      checklist: []
    };

    // Extract checklist items
    for (let i = start; i <= end; i++) {
      const num = safe(i, COL.NUM - 1);
      const title = safe(i, COL.CHECK - 1);
      if (!title) continue; // skip blanks

      const item = {
        number: /^\d+$/.test(num) ? Number(num) : null,
        title,
        description: safe(i, COL.DESC - 1),
        status: normStatus(safe(i, COL.STATUS - 1)),
        assigned_to: safe(i, COL.ASSIGN - 1),
        due_date: safe(i, COL.DUE - 1),
        feedback: safe(i, COL.FEEDBACK - 1),
        // prefer explicit parent markers if present
        stage_id: (safe(i, COL.J - 1) === "_parent_stage_id" && safe(i, COL.K - 1)) || stage_id,
        gate_id:  (safe(i, COL.L - 1) === "_parent_gate_id"  && safe(i, COL.M - 1)) || gate_id
      };
      gate.checklist.push(item);
    }

    gates.push(gate);

    // Move r to after this block (skip spacer if present)
    r = end + 1;
    if (r < data.length && isSpacerRow(r)) r++;
  }

  return {
    project_id: pid || String(projectId || ""),
    user_id: uid || String(userId || ""),
    gates
  };
}


/*********************************
 * Dialog entrypoint + data APIs
 *********************************/
const GSD_GS_NAME = "Gate Standard";
const GSD_CAT_NAME = "StandardsCatalog";
const GSD_COL = { GATE_NUM: 1, TITLE: 2, DESC: 3, STATUS: 4, ASSIGN: 5, DUE: 6, FEEDBACK: 7 };

function GS_openAddStandardDialog() {
  GSD_ensureCatalog_(); // ensure catalog sheet exists
  const html = HtmlService.createTemplateFromFile("AddStandardDialog").evaluate()
    .setWidth(700).setHeight(560);
  SpreadsheetApp.getUi().showModalDialog(html, "Add Standard");
}

function GSD_getSubjects() {
  const sh = GSD_ensureCatalog_();
  const vals = sh.getRange(2, 4, Math.max(0, sh.getLastRow() - 1), 1).getDisplayValues().flat();
  return Array.from(new Set(vals.map(v => String(v || "").trim()).filter(Boolean))).sort();
}
function GSD_getGrades() {
  const sh = GSD_ensureCatalog_();
  const vals = sh.getRange(2, 5, Math.max(0, sh.getLastRow() - 1), 1).getDisplayValues().flat();
  return Array.from(new Set(vals.map(v => String(v || "").trim()).filter(Boolean))).sort();
}

/** Search standards by filters; returns [{id,code,description,subject,grade}] */
function GSD_searchStandards(subject, grade, query, limit) {
  const sh = GSD_ensureCatalog_();
  const last = sh.getLastRow();
  if (last < 2) return [];
  const rows = sh.getRange(2, 1, last - 1, 6).getValues(); // A..F
  const q = String(query || "").toLowerCase().trim();
  const out = [];
  for (let i = 0; i < rows.length; i++) {
    const [id, code, desc, subj, grd] = rows[i];
    if (subject && subj !== subject) continue;
    if (grade && grd !== grade) continue;
    if (q && !(
      String(code || "").toLowerCase().includes(q) ||
      String(desc || "").toLowerCase().includes(q)
    )) continue;
    out.push({
      id: String(id || ""),
      code: String(code || ""),
      description: String(desc || ""),
      subject: String(subj || ""),
      grade: String(grd || "")
    });
    if (limit && out.length >= limit) break;
  }
  return out;
}

/** Insert chosen standards under the currently selected Gate Title row.
 *  We keep a 3-col block: code | description | percentage
 *  No 100% enforcement; users can edit % later in the sheet.
 */
// Insert under selected Gate, keep sub-header, and ensure ONE blank row after the block.
function GSD_applyStandardsToActiveGate(chosen) {
  if (!Array.isArray(chosen) || !chosen.length) throw new Error("No standards were selected.");

  const ss = SpreadsheetApp.getActive();
  const sh = ss.getSheetByName(GSD_GS_NAME);
  if (!sh) throw new Error('Missing sheet: Gate Standard.');

  // Must be on a Gate Title row (col A number, col B title)
  const active = ss.getActiveRange();
  const row = active ? active.getRow() : 0;
  const gateNum = sh.getRange(row, GSD_COL.GATE_NUM).getDisplayValue().trim();
  const gateTitle = sh.getRange(row, GSD_COL.TITLE).getDisplayValue().trim();
  if (!/^\d+$/.test(gateNum) || !gateTitle) throw new Error("Click a Gate Title row first (col A number, col B title).");

  // Resolve descriptions from StandardsCatalog
  const cat = GSD_ensureCatalog_();
  const last = cat.getLastRow();
  const catRows = last >= 2 ? cat.getRange(2, 1, last - 1, 3).getValues() : []; // A:id, B:code, C:desc
  const descByCode = {}, descById = {};
  for (let i = 0; i < catRows.length; i++) {
    const [id, code, desc] = catRows[i];
    if (code) descByCode[String(code)] = String(desc || "");
    if (id) descById[String(id)] = String(desc || "");
  }

  // Build rows: B=code, C=description, D=percentage (as fraction for % formatting)
  const rows = chosen.map(x => {
    const desc = x.id && (descById[x.id] != null) ? descById[x.id] : (descByCode[x.code] || "");
    const pct = Number(x.percent || 0);
    return [x.code || "", desc, pct / 100];
  });

  // Find/create the sub-header "code | description | percentage"
  const nextGateRow = GSD_findNextGateRow_(sh, row);
  const subHeaderRow = GSD_findSubHeader_(sh, row + 1, nextGateRow - 1);
  let insertAtRow;
  if (subHeaderRow === -1) {
    sh.insertRowsAfter(row, 1);
    const hdr = row + 1;
    sh.getRange(hdr, GSD_COL.TITLE, 1, 3)
      .setValues([["Code", "Description", "Percentage"]])
      .setFontStyle("italic")
      .setBackground("#f1f5f9");
    insertAtRow = hdr + 1;               // first data row under the header
  } else {
    // append at end of current block (GSD_findBlockEnd_ stops before a blank row or next gate)
    insertAtRow = GSD_findBlockEnd_(sh, subHeaderRow) + 1;
  }

  // Insert the new rows
  sh.insertRowsBefore(insertAtRow, rows.length);
  sh.getRange(insertAtRow, GSD_COL.TITLE, rows.length, 3).setValues(rows);
  sh.getRange(insertAtRow, GSD_COL.STATUS, rows.length, 1).setNumberFormat("0%");

  // Ensure EXACTLY ONE empty row after the block
  const endRow = insertAtRow + rows.length - 1;
  const nextRow = endRow + 1;
  const a = sh.getRange(nextRow, GSD_COL.GATE_NUM).getDisplayValue().trim();
  const b = sh.getRange(nextRow, GSD_COL.TITLE).getDisplayValue().trim();
  const c = sh.getRange(nextRow, GSD_COL.DESC).getDisplayValue().trim();
  const isBlank = !a && !b && !c;
  if (!isBlank) {
    sh.insertRowsAfter(endRow, 1);       // add a spacer row before the next gate (or any content)
  }

  return { ok: true, inserted: rows.length, gateNum, gateTitle };
}




/*********************************
 * Catalog + helpers
 *********************************/
function GSD_ensureCatalog_() {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(GSD_CAT_NAME);
  if (!sh) {
    sh = ss.insertSheet(GSD_CAT_NAME);
    sh.getRange(1, 1, 1, 6).setValues([[
      "standard_id", "code", "description", "subject_area", "grade_level", "metadata"
    ]]).setFontWeight("bold");
    sh.setFrozenRows(1);
  }
  return sh;
}

function GSD_findNextGateRow_(sh, fromRow) {
  const last = sh.getLastRow();
  for (let r = fromRow + 1; r <= last; r++) {
    const a = sh.getRange(r, GSD_COL.GATE_NUM).getDisplayValue().trim();
    const b = sh.getRange(r, GSD_COL.TITLE).getDisplayValue().trim();
    if (/^\d+$/.test(a) && b) return r;
  }
  return last + 1;
}

function GSD_findSubHeader_(sh, startRow, endRow) {
  if (endRow < startRow) return -1;
  const vals = sh.getRange(startRow, GSD_COL.TITLE, endRow - startRow + 1, 3).getDisplayValues();
  for (let i = 0; i < vals.length; i++) {
    const [b, c, d] = vals[i].map(s => String(s || "").toLowerCase().trim());
    if (b === "code" && c === "description" && (d === "percentage" || d === "weight %" || d === "weight%"))
      return startRow + i;
  }
  return -1;
}

function GSD_findBlockEnd_(sh, subHeaderRow) {
  const last = sh.getLastRow();
  let r = subHeaderRow + 1;
  while (r <= last) {
    const a = sh.getRange(r, GSD_COL.GATE_NUM).getDisplayValue().trim();
    const b = sh.getRange(r, GSD_COL.TITLE).getDisplayValue().trim();
    const c = sh.getRange(r, GSD_COL.DESC).getDisplayValue().trim();
    if ((/^\d+$/.test(a) && b) || (!b && !c)) return r - 1;
    r++;
  }
  return last;
}



/** Server: return info about the currently selected Gate row for the dialog */
/** Robust: find the gate that contains the current selection by
 * walking upward to the gate title row marked with hidden IDs:
 *   J="_stage_id", L="_gate_id"
 */
/** Only "OK" when selection is on a checklist row inside a gate.
 * Gate title row is marked by hidden IDs: J="_stage_id", L="_gate_id"
 * Layout: [gate title] -> (optional desc) -> subheader -> checklist rows -> spacer/next gate
 */
function GSD_getActiveGateInfo() {
  const ss = SpreadsheetApp.getActive();
  const sh = ss.getActiveSheet();
  if (!sh || sh.getName() !== "Gate Standard") {
    return { ok: false, reason: "Not on Gate Standard sheet" };
  }

  const rng = ss.getActiveRange();
  const selRow = rng ? rng.getRow() : 0;
  if (!selRow) return { ok: false, reason: "No active row" };

  const COL = { NUM:1, CHECK:2, DESC:3, J:10, K:11, L:12, M:13 };

  // 1) Walk UP to find the nearest gate title row (has hidden markers)
  let gateRow = -1, stageId = "", gateId = "";
  for (let r = selRow; r >= 1; r--) {
    const j = sh.getRange(r, COL.J).getDisplayValue().trim();
    const l = sh.getRange(r, COL.L).getDisplayValue().trim();
    if (j === "_stage_id" && l === "_gate_id") {
      gateRow = r;
      stageId = sh.getRange(r, COL.K).getDisplayValue().trim();
      gateId  = sh.getRange(r, COL.M).getDisplayValue().trim();
      break;
    }
    if (r === 1) break;
  }
  if (gateRow === -1) return { ok: false, reason: "Active row is not within a Gate block" };

  // 2) Locate subheader row under this gate (skip optional description)
  let r = gateRow + 1;
  const hasHidden = (row) => !!sh.getRange(row, COL.J).getDisplayValue().trim() ||
                             !!sh.getRange(row, COL.L).getDisplayValue().trim();
  if (!hasHidden(r)) r++; // likely the optional description row

  // Now r should be the subheader: "# | Checklist | Description | ..."
  const header = sh.getRange(r, 1, 1, 7).getDisplayValues()[0].map(s=>String(s||"").toLowerCase().trim());
  const looksLikeSubheader = header[0] === "#" && header[1] === "checklist";
  if (!looksLikeSubheader) {
    return { ok: false, reason: "Could not locate Checklist subheader for this gate" };
  }
  const subHeaderRow = r;

  // 3) Determine checklist block range: from subHeaderRow+1 until spacer or next gate header
  const last = sh.getLastRow();
  let startChecklist = subHeaderRow + 1;
  let endChecklist = startChecklist - 1;
  for (let row = startChecklist; row <= last; row++) {
    const a = sh.getRange(row, COL.NUM).getDisplayValue().trim();
    const b = sh.getRange(row, COL.CHECK).getDisplayValue().trim();
    const j = sh.getRange(row, COL.J).getDisplayValue().trim();
    const l = sh.getRange(row, COL.L).getDisplayValue().trim();
    const isSpacer = !a && !b && !sh.getRange(row, COL.DESC).getDisplayValue().trim();
    const isNextGateHeader = (j === "_stage_id" && l === "_gate_id");
    if (isSpacer || isNextGateHeader) break;
    endChecklist = row;
  }

  // 4) Selection must be strictly inside the checklist rows
  const onChecklist = selRow >= startChecklist && selRow <= endChecklist;
  if (!onChecklist) {
    // We *found* the gate, but selection isn't on a checklist row (it's on title/desc/header/spacer)
    return { ok: false, reason: "Select a checklist row (not the gate header)" };
  }

  // 5) Parse gate title text
  const titleText = sh.getRange(gateRow, 1).getDisplayValue().trim();
  let gateNum = "", gateTitle = titleText;
  const m = titleText.match(/^Gate\s+(\d+)\s*:\s*(.*)$/i);
  if (m) { gateNum = m[1]; gateTitle = m[2]; }

  return { ok: true, row: gateRow, gateNum, gateTitle, stage_id: stageId, gate_id: gateId };
}













function test_readGateStandard() {
  const PROJECT_ID = "69e53a65-b4d0-4753-a0f8-273e09c42355";
  const USER_ID    = "23e228fa-4592-4bdc-852e-192973c388ce";

  const out = readGateStandardFromSheet(PROJECT_ID, USER_ID);
  Logger.log(JSON.stringify(out, null, 2));

  if (out.project_id !== PROJECT_ID) throw new Error("project_id mismatch");
  if (out.user_id !== USER_ID) throw new Error("user_id mismatch");
  if (!Array.isArray(out.gates) || out.gates.length === 0) throw new Error("No gates parsed");
  if (!out.gates[0].checklist || out.gates[0].checklist.length === 0) throw new Error("No checklist items found");

  Logger.log("✅ reader sanity checks passed");
}


