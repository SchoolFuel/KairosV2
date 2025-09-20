function openGateStandardSheet() {
  const SHEET_NAME = "Gate Standard";
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);

  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.getRange(1, 1, 1, 7).merge()
      .setValue("Gate Standard")
      .setFontWeight("bold").setFontSize(14).setBackground("#eef2ff");
    sh.getRange(2, 1, 1, 7).setBackground("#ffffff");
    sh.getRange(3, 1, 1, 7).setValues([[
      "Gate","GateTitle","Description","Status","Assigned To","Due Date","Feedback"
    ]]).setFontWeight("bold").setBackground("#e0e7ff");
    sh.setColumnWidths(1, 1, 60);
    sh.setColumnWidths(2, 1, 240);
    sh.setColumnWidths(3, 1, 360);
    sh.setColumnWidths(4, 1, 140);
    sh.setColumnWidths(5, 1, 160);
    sh.setColumnWidths(6, 1, 120);
    sh.setColumnWidths(7, 1, 220);
    sh.setFrozenRows(3);
    sh.getRange(1, 1, 1000, 7).setFontFamily("Arial").setFontSize(10);
  }

  // Seed / ensure the four gate titles (Status = Pending)
  const START_ROW = 4;
  const wanted = [
    { gate: 1, title: "Habit log accuracy" },
    { gate: 2, title: "Chart/graph" },
    { gate: 3, title: "written explanation with evidence" },
    { gate: 4, title: "cause and effect diagram completed" }
  ];
  const lastRow = Math.max(sh.getLastRow(), START_ROW - 1);
  const existing = (lastRow >= START_ROW)
    ? sh.getRange(START_ROW, 1, lastRow - START_ROW + 1, 7).getValues()
    : [];
  const titleToRow = {};
  for (let i = 0; i < existing.length; i++) {
    const rowNum = START_ROW + i;
    const title = String(existing[i][1] || "").trim().toLowerCase();
    if (title) titleToRow[title] = rowNum;
  }
  wanted.forEach(w => {
    const key = w.title.toLowerCase();
    if (titleToRow[key]) {
      const r = titleToRow[key];
      sh.getRange(r, 1).setValue(w.gate);
      sh.getRange(r, 2).setValue(w.title);
      sh.getRange(r, 4).setValue("Pending");
    } else {
      sh.appendRow([w.gate, w.title, "", "Pending", "", "", ""]);
    }
  });

  ss.setActiveSheet(sh);
  sh.activate();
  sh.setActiveSelection("A4");
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
  const gateNum   = sh.getRange(row, GSD_COL.GATE_NUM).getDisplayValue().trim();
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
    if (id)   descById[String(id)]   = String(desc || "");
  }

  // Build rows: B=code, C=description, D=percentage (as fraction for % formatting)
  const rows = chosen.map(x => {
    const desc = x.id && (descById[x.id] != null) ? descById[x.id] : (descByCode[x.code] || "");
    const pct  = Number(x.percent || 0);
    return [x.code || "", desc, pct / 100];
  });

  // Find/create the sub-header "code | description | percentage"
  const nextGateRow  = GSD_findNextGateRow_(sh, row);
  const subHeaderRow = GSD_findSubHeader_(sh, row + 1, nextGateRow - 1);
  let insertAtRow;
  if (subHeaderRow === -1) {
    sh.insertRowsAfter(row, 1);
    const hdr = row + 1;
    sh.getRange(hdr, GSD_COL.TITLE, 1, 3)
      .setValues([["code","description","percentage"]])
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

  return { ok:true, inserted: rows.length, gateNum, gateTitle };
}




/*********************************
 * Catalog + helpers
 *********************************/
function GSD_ensureCatalog_() {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(GSD_CAT_NAME);
  if (!sh) {
    sh = ss.insertSheet(GSD_CAT_NAME);
    sh.getRange(1,1,1,6).setValues([[
      "standard_id","code","description","subject_area","grade_level","metadata"
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
function GSD_getActiveGateInfo() {
  const ss = SpreadsheetApp.getActive();
  const sh = ss.getActiveSheet();
  if (!sh || sh.getName() !== GSD_GS_NAME) {
    return { ok: false, reason: "Not on Gate Standard sheet" };
  }
  const rng = ss.getActiveRange();
  const row = rng ? rng.getRow() : 0;
  if (!row) return { ok: false, reason: "No active row" };

  const gateNum   = String(sh.getRange(row, GSD_COL.GATE_NUM).getDisplayValue() || "").trim();
  const gateTitle = String(sh.getRange(row, GSD_COL.TITLE).getDisplayValue() || "").trim();
  if (!/^\d+$/.test(gateNum) || !gateTitle) {
    return { ok: false, reason: "Active row is not a Gate Title row" };
  }
  return { ok: true, row, gateNum, gateTitle };
}
