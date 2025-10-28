/*********************************

/** Open the “Add Standards” dialog with context (project/stage/gate) */
function GS_openStandardDialogWithCtx(ctx) {
    if (!ctx || !ctx.gateId || !ctx.checklistTitle) {
      throw new Error("Missing context: gateId and checklistTitle are required.");
    }
  
    // Default/normalize optional fields (ok to be "NA" for now)
    ctx.projectId = String(ctx.projectId || "NA");
    ctx.stageId   = String(ctx.stageId   || "NA");
    ctx.gateId    = String(ctx.gateId);
    ctx.gateTitle = String(ctx.gateTitle || "");
    ctx.checklistTitle = String(ctx.checklistTitle);
  
    const t = HtmlService.createTemplateFromFile("AddStandardDialog");
    t.context = ctx;
    const html = t.evaluate().setWidth(700).setHeight(560);
    DocumentApp.getUi().showModalDialog(html, "Add Standard");
  }
  
  
  /** (Optional) Back-compat wrapper if something still calls the old name */
  function GS_openAddStandardDialog() {
    // No specific context; dialog should handle missing context gracefully
    const t = HtmlService.createTemplateFromFile("AddStandardDialog");
    t.context = { projectId: "", stageId: "", gateId: "", gateTitle: "" };
    const html = t.evaluate().setWidth(700).setHeight(560);
    DocumentApp.getUi().showModalDialog(html, "Add Standard");
  }
  
  
  
  function _norm(s){ return String(s || "").trim(); }
  
  
  function STD_pushSelectionToSidebar(ctx, items, mode) {
    if (!ctx || !_norm(ctx.gateId) || !_norm(ctx.checklistTitle)) {
      throw new Error("Missing context (gateId, checklistTitle).");
    }
    var gateId = _norm(ctx.gateId);
    var checklistTitle = _norm(ctx.checklistTitle);
    var key = 'STD:' + gateId + ':' + checklistTitle;
  
    var incoming = Array.isArray(items) ? items : [];
  
    // normalize/clamp percent
    var clean = incoming.map(function (o) {
      var copy = Object.assign({}, o);
      if (copy.percent !== undefined && copy.percent !== null) {
        var n = Number(copy.percent);
        if (!isFinite(n)) n = 0;
        if (n < 0) n = 0;
        if (n > 100) n = 100;
        copy.percent = n;
      }
      return copy;
    });
  
    var cache = CacheService.getUserCache();
    var final;
  
    mode = String(mode || 'merge');
    if (mode === 'replace') {
      // ✅ overwrite with exactly what client sent (used for Remove)
      final = clean;
    } else {
      // ➕ merge (used for Insert / percent edits)
      var prevRaw = cache.get(key);
      var prev = [];
      if (prevRaw) {
        try { prev = JSON.parse(prevRaw).items || []; } catch (e) {}
      }
      var map = new Map();
      prev.forEach(function (o) {
        var k = (o.id || '') + '|' + (o.code || '');
        map.set(k, o);
      });
      clean.forEach(function (o) {
        var k = (o.id || '') + '|' + (o.code || '');
        map.set(k, o);
      });
      final = Array.from(map.values());
    }
  
    cache.put(key, JSON.stringify({ ts: Date.now(), items: final }), 21600);
    return { ok: true, count: final.length };
  }
  
  
  
  
  function STD_pullSelectionByKey(key) {
    key = _norm(key);
    var raw = key && CacheService.getUserCache().get(key);
    if (!raw) return { ok: true, items: [], key: key, ts: 0 };
    var obj = JSON.parse(raw);
    return { ok: true, items: Array.isArray(obj.items) ? obj.items : [], key: key, ts: obj.ts || 0 };
  }
  
  
  // const GSD_FILE_ID = "YOUR_SPREADSHEET_FILE_ID_HERE";
  const GSD_FILE_ID = "https://docs.google.com/spreadsheets/d/14-QuRN0P8on2xS0PW7yoZLDp1QZjGZeD8XA4GWA3mHA/edit?gid=0#gid=0"
  
  // Name of the spreadsheet file in Drive (used if GSD_FILE_ID is null)
  const GSD_SPREADSHEET_NAME = "StandardsCatalog";
  
  // Name of the tab/sheet inside the spreadsheet
  const GSD_TAB_NAME = "Catalog"; //
  
  
  function GSD_getCatalog_() {
    const ss = GSD_FILE_ID
      ? SpreadsheetApp.openById(GSD_FILE_ID)
      : GSD_openSpreadsheetByName_(GSD_SPREADSHEET_NAME);
  
    let sh = ss.getSheetByName(GSD_TAB_NAME);
    if (!sh) {
      throw new Error(`❌ Missing required tab: "${GSD_TAB_NAME}" in spreadsheet "${ss.getName()}".`);
    }
    return sh;
  }
  
  function GSD_openSpreadsheetByName_(name) {
    const files = DriveApp.getFilesByName(name);
    if (!files.hasNext()) {
      throw new Error(`❌ Spreadsheet named "${name}" not found in Drive.`);
    }
    // If duplicates exist, we use the first match.
    const file = files.next();
    return SpreadsheetApp.openById(file.getId());
  }
  
  
  function GSD_getSubjects() {
    const sh = GSD_getCatalog_();
    const last = sh.getLastRow();
    if (last < 2) return [];
    const vals = sh.getRange(2, 4, last - 1, 1).getDisplayValues().flat(); // D = subject_area
    return Array.from(new Set(vals.map(v => String(v || "").trim()).filter(Boolean))).sort();
  }
  
  function GSD_getGrades() {
    const sh = GSD_getCatalog_();
    const last = sh.getLastRow();
    if (last < 2) return [];
    const vals = sh.getRange(2, 5, last - 1, 1).getDisplayValues().flat(); // E = grade_level
    return Array.from(new Set(vals.map(v => String(v || "").trim()).filter(Boolean))).sort();
  }
  
  
  
  /** Search standards by filters; returns [{id,code,description,subject,grade}] */
  function GSD_searchStandards(subject, grade, query, limit) {
    const sh = GSD_getCatalog_();
    const last = sh.getLastRow();
    if (last < 2) return [];
  
    // Columns: A..F (standard_id, code, description, subject_area, grade_level, metadata)
    const rows = sh.getRange(2, 1, last - 1, 6).getValues();
  
    const subjNorm = subject ? String(subject).trim() : "";
    const gradeNorm = grade ? String(grade).trim() : "";
    const q = String(query || "").toLowerCase().trim();
  
    const out = [];
    for (let i = 0; i < rows.length; i++) {
      const [standard_id, code, desc, subject_area, grade_level] = rows[i];
  
      if (subjNorm && String(subject_area || "").trim() !== subjNorm) continue;
      if (gradeNorm && String(grade_level || "").trim() !== gradeNorm) continue;
  
      if (q) {
        const codeL = String(code || "").toLowerCase();
        const descL = String(desc || "").toLowerCase();
        if (!(codeL.includes(q) || descL.includes(q))) continue;
      }
  
      out.push({
        id: String(standard_id || ""),
        code: String(code || ""),
        description: String(desc || ""),
        subject: String(subject_area || ""),
        grade: String(grade_level || ""),
      });
  
      if (limit && out.length >= Number(limit)) break;
    }
  
    return out;
  }