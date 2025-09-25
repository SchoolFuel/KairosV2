/*********************************
 * Standards Dialog + Sidebar bridge (NO sheet writes)
 *********************************/

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
  SpreadsheetApp.getUi().showModalDialog(html, "Add Standard");
}


/** (Optional) Back-compat wrapper if something still calls the old name */
function GS_openAddStandardDialog() {
  // No specific context; dialog should handle missing context gracefully
  const t = HtmlService.createTemplateFromFile("AddStandardDialog");
  t.context = { projectId: "", stageId: "", gateId: "", gateTitle: "" };
  const html = t.evaluate().setWidth(700).setHeight(560);
  SpreadsheetApp.getUi().showModalDialog(html, "Add Standard");
}



function _norm(s){ return String(s || "").trim(); }


 function STD_pushSelectionToSidebar(ctx, items) {
  if (!ctx || !_norm(ctx.gateId) || !_norm(ctx.checklistTitle)) {
    throw new Error("Missing context (gateId, checklistTitle).");
  }
  var gateId = _norm(ctx.gateId);
  var checklistTitle = _norm(ctx.checklistTitle);
  var key = 'STD:' + gateId + ':' + checklistTitle;

  var cache = CacheService.getUserCache();
  var prevRaw = cache.get(key);
  var prev = [];
  if (prevRaw) {
    try { prev = JSON.parse(prevRaw).items || []; } catch (e) {}
  }

  var incoming = Array.isArray(items) ? items : [];

  // Merge by (id|code) – keeps existing, updates percent if provided
  var map = new Map();
  prev.forEach(function(o){
    var k = (o.id || '') + '|' + (o.code || '');
    map.set(k, o);
  });
  incoming.forEach(function(o){
    var k = (o.id || '') + '|' + (o.code || '');
    var exist = map.get(k) || {};
    map.set(k, Object.assign({}, exist, o)); // prefer incoming fields (e.g., percent)
  });

  var merged = Array.from(map.values());

  var payload = { ctx: { gateId: gateId, checklistTitle: checklistTitle },
                  items: merged,
                  ts: Date.now() };

  cache.put(key, JSON.stringify(payload), 60 * 60);
  return { ok:true, count: merged.length, key: key, ts: payload.ts };
}




function STD_pullSelectionByKey(key) {
  key = _norm(key);
  var raw = key && CacheService.getUserCache().get(key);
  if (!raw) return { ok: true, items: [], key: key, ts: 0 };
  var obj = JSON.parse(raw);
  return { ok: true, items: Array.isArray(obj.items) ? obj.items : [], key: key, ts: obj.ts || 0 };
}


/*********************************
 * Standards Catalog (kept)
 *********************************/
const GSD_CAT_NAME = "StandardsCatalog";

function GSD_getCatalog_() {
  const ss = SpreadsheetApp.getActive();
  const sh = ss.getSheetByName(GSD_CAT_NAME);
  if (!sh) {
    throw new Error(`❌ Missing required sheet: "${GSD_CAT_NAME}". Please create it manually with the expected headers.`);
  }
  return sh;
}

function GSD_getSubjects() {
  const sh = GSD_getCatalog_();
  const vals = sh.getRange(2, 4, Math.max(0, sh.getLastRow() - 1), 1).getDisplayValues().flat();
  return Array.from(new Set(vals.map(v => String(v || "").trim()).filter(Boolean))).sort();
}

function GSD_getGrades() {
  const sh = GSD_getCatalog_();
  const vals = sh.getRange(2, 5, Math.max(0, sh.getLastRow() - 1), 1).getDisplayValues().flat();
  return Array.from(new Set(vals.map(v => String(v || "").trim()).filter(Boolean))).sort();
}

/** Search standards by filters; returns [{id,code,description,subject,grade}] */
function GSD_searchStandards(subject, grade, query, limit) {
  const sh = GSD_getCatalog_();
  const last = sh.getLastRow();
  if (last < 2) return [];
  const rows = sh.getRange(2, 1, last - 1, 6).getValues();
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
    out.push({ id: String(id || ""), code: String(code || ""), description: String(desc || ""), subject: String(subj || ""), grade: String(grd || "") });
    if (limit && out.length >= limit) break;
  }
  return out;
}
