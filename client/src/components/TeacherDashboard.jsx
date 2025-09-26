import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import "../styles/Teacher.css";

const parseMaybeJSON = (v) => {
  if (typeof v !== "string") return v;
  try {
    return JSON.parse(v);
  } catch {
    return v;
  }
};
const safePreview = (v, n = 240) => {
  try {
    return JSON.stringify(parseMaybeJSON(v)).slice(0, n);
  } catch {
    return String(v).slice(0, n);
  }
};
const deepClone = (obj) =>
  typeof structuredClone === "function"
    ? structuredClone(obj)
    : JSON.parse(JSON.stringify(obj));

/* ---------- status pill helper ---------- */
function pillClass(status) {
  const s = (status || "").toLowerCase();
  if (s.includes("approve")) return "is-approve";
  if (s.includes("reject") || s.includes("revision")) return "is-reject";
  if (s.includes("pending")) return "is-pending";
  return "is-neutral";
}

/* ---------- Gate helpers & UI ---------- */
function findStageWithGate(draft, stageId) {
  if (!draft || !Array.isArray(draft.stages)) return null;

  // Normal case: stage contains its gate
  const stage = draft.stages.find((s) => s && s.stage_id === stageId);
  if (stage && stage.gate) return stage;

  // Fallback for payloads that put { gate: {...} } in separate array items:
  // attach the first found gate to the selected stage if none is present.
  const gateEntry = draft.stages.find((s) => s && s.gate);
  if (stage && gateEntry && gateEntry.gate) {
    return { ...stage, gate: gateEntry.gate };
  }
  return stage || null;
}

// Poll until cache timestamp increases, then pull & render
async function awaitUpdate(cacheKey, getTs, doPull, tries = 8, delayMs = 150) {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const startTs = await getTs(cacheKey);
  for (let i = 0; i < tries; i++) {
    await sleep(delayMs);
    const nowTs = await getTs(cacheKey);
    if (nowTs > startTs) {
      await doPull(cacheKey);
      return true;
    }
  }
  return false;
}

// ---- helpers (keep at top of file) ----
const gsRun = (fn, ...args) =>
  new Promise((resolve, reject) => {
    const run = window?.google?.script?.run;
    if (!run) return reject(new Error("google.script.run not available"));
    run
      .withSuccessHandler(resolve)
      .withFailureHandler(reject)
      [fn](...args);
  });

const deb = (fn, ms) => {
  let t;
  return (...a) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...a), ms);
  };
};
const norm = (s) => String(s ?? "").trim();
const makeKey = (gateId, title) => `STD:${norm(gateId)}:${norm(title)}`;
const clamp01 = (n) => Math.max(0, Math.min(100, Number.isFinite(n) ? n : 0));




// ---- GatePanel ----
function GatePanel({ stage }) {
  if (!stage) return <div className="td-empty">No stage selected.</div>;

  const g = stage.gate || {};
  const checklist = Array.isArray(g.checklist) ? g.checklist : [];

  const [idx, setIdx] = React.useState(0);
  React.useEffect(() => setIdx(0), [stage?.stage_id]);

  const total = checklist.length;
  const gateId = norm(g.gate_id || g.id || "");
  const checklistTitle = total ? norm(checklist[idx]) : "";
  const cacheKey =
    gateId && checklistTitle ? makeKey(gateId, checklistTitle) : "";

  // -------- standards (per-checklist) --------
  const [pickedByKey, setPickedByKey] = React.useState({});
  const items = cacheKey ? pickedByKey[cacheKey] || [] : [];

  const refreshFromCache = React.useCallback(async (key) => {
    const k = norm(key);
    if (!k) return;
    try {
      const res = await gsRun("STD_pullSelectionByKey", k); // { ok, items }
      setPickedByKey((prev) => ({ ...prev, [k]: res?.items || [] }));
    } catch (e) {
      console.warn("STD_pullSelectionByKey failed:", e);
    }
  }, []);

  React.useEffect(() => {
    if (cacheKey) refreshFromCache(cacheKey);
  }, [cacheKey, refreshFromCache]);
  React.useEffect(() => {
    const onFocus = () => cacheKey && refreshFromCache(cacheKey);
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [cacheKey, refreshFromCache]);

  const getTs = React.useCallback(async (key) => {
    const k = norm(key);
    if (!k) return 0;
    try {
      const res = await gsRun("STD_pullSelectionByKey", k); // expects { ts }
      return Number(res?.ts || 0);
    } catch {
      return 0;
    }
  }, []);

  const openDialog = React.useCallback(() => {
    if (!gateId || !checklistTitle) {
      alert("Missing gate/checklist");
      return;
    }

    const ctx = {
      projectId: String(stage?.project_id || "NA"),
      stageId: String(stage?.stage_id || "NA"),
      gateId,
      gateTitle: String(g?.title || stage?.title || ""),
      checklistTitle,
    };

    const run = window?.google?.script?.run;
    if (!run) {
      alert("google.script.run not available");
      return;
    }

    run
      .withFailureHandler((e) => alert("Failed to open: " + (e?.message || e)))
      .GS_openStandardDialogWithCtx(ctx);

    // Start a short poll; when dialog pushes & closes, ts increases → we pull
    awaitUpdate(cacheKey, getTs, refreshFromCache).then((hit) => {
      if (!hit) {
        // fallback in case polling missed it
        setTimeout(() => refreshFromCache(cacheKey), 400);
      }
    });
  }, [gateId, checklistTitle, stage, g, cacheKey, getTs, refreshFromCache]);

  // -------- meta (Status/Assignee/Due/Feedback) per checklist --------
  const [metaByKey, setMetaByKey] = React.useState(
    /** @type {Record<string,{status?:string,assignee?:string,dueDate?:string,feedback?:string}>} */ ({})
  );
  const m = metaByKey[cacheKey] || {
    status: "",
    assignee: "",
    dueDate: "",
    feedback: "",
  };

  const pushMetaDebounced = React.useMemo(
    () =>
      deb(async (key, meta) => {
        if (!key) return;
        try {
          await gsRun("STD_pushChecklistMetaByKey", key, meta);
        } catch (e) {
          console.warn("push meta failed:", e);
        }
      }, 250),
    []
  );
  
  // debounced save of updated percents back to cache (re-uses your push API)
const savePercentsDebounced = React.useMemo(
  () =>
    deb(async (key, ctx, arr, mode = "merge") => {
      try {
        await gsRun("STD_pushSelectionToSidebar", ctx, arr, mode);
      } catch (e) {
        console.warn("save percents failed:", e);
      }
    }, 250),
  []
);


  const setItemPercent = React.useCallback((index, rawVal) => {
    if (!cacheKey) return;
    const val = clamp01(parseFloat(rawVal)); // 0..100

    setPickedByKey(prev => {
      const curr = prev[cacheKey] || [];
      const next = curr.map((it, i) => i === index ? { ...it, percent: val } : it);

      // push to cache so it persists
      const ctx = { gateId, checklistTitle };
      savePercentsDebounced(cacheKey, ctx, next);

      return { ...prev, [cacheKey]: next };
    });
  }, [cacheKey, gateId, checklistTitle, savePercentsDebounced]);

  // ...render list using setItemPercent on the <input>...

  const percentInputValue = (v) => {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v;
  if (Number.isFinite(v)) return String(v);
  return "";
};

const removeItem = React.useCallback((index) => {
  if (!cacheKey) return;
  setPickedByKey(prev => {
    const curr = prev[cacheKey] || [];
    const next = curr.filter((_, i) => i !== index);

    const ctx = { gateId, checklistTitle };
    savePercentsDebounced(cacheKey, ctx, next, "replace"); // 👈 overwrite on server

    return { ...prev, [cacheKey]: next };
  });
}, [cacheKey, gateId, checklistTitle, savePercentsDebounced]);





  const loadMeta = React.useCallback(async (key) => {
    if (!key) return;
    try {
      const res = await gsRun("STD_pullChecklistMetaByKey", key); // { ok, meta }
      setMetaByKey((prev) => ({ ...prev, [key]: res?.meta || {} }));
    } catch (e) {
      console.warn("pull meta failed:", e);
    }
  }, []);

  React.useEffect(() => {
    if (cacheKey) loadMeta(cacheKey);
  }, [cacheKey, loadMeta]);

  function setMeta(field, value) {
    if (!cacheKey) return;
    setMetaByKey((prev) => {
      const next = { ...(prev[cacheKey] || {}), [field]: value };
      pushMetaDebounced(cacheKey, next);
      return { ...prev, [cacheKey]: next };
    });
  }
  const gateNum =
  g.gate_num ?? g.num ?? stage?.gate_number ?? stage?.stage_order ?? 1;

  // -------- UI --------
  return (
    <div className="td-gate clean">
   <div className="td-gate-header">
  {/* Gate header styled like checklist */}
  <div className="td-gate-title-stack td-like-checklist">
    <strong>Gate {gateNum}:</strong>
    <div className="td-gate-title-text">“{g.title || stage?.title || "Gate"}”</div>
  </div>

</div>

      {total === 0 ? (
        <div className="td-empty">No checklist items for this gate.</div>
      ) : (
        <div className="td-gate-detail one">
          {/* Checklist header (top, bold) */}
          <div className="td-checklist-title">
            <strong>Checklist {idx + 1}:</strong>
            <div className="td-checklist-text">“{checklistTitle || "—"}”</div>
          </div>

          {/* Add / Refresh row */}
          <div
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <button className="td-btn td-btn-primary" onClick={openDialog}>
              ➕ Add
            </button>
            <button
              className="td-btn"
              onClick={() => cacheKey && refreshFromCache(cacheKey)}
              disabled={!cacheKey}
            >
              ↻ Refresh
            </button>
          </div>

          {/* Picked standards (per checklist) */}
          <div style={{ marginBottom: 12, minHeight: 20 }}>
            {items.length === 0 ? (
              <div className="td-empty">No standards added yet.</div>
            ) : (
              <ul className="td-standards" style={{ paddingLeft:0, margin:0, listStyle:"none" }}>
      {items.map((it, i) => (
        <li key={i} className="std-row">
  <code className="std-code">{it.code}</code>

  <div className="std-actions">
    <div className="std-pct">
     <input
  type="number"
  min={0}
  max={100}
  step={1}
  value={percentInputValue(it.percent)}
  onChange={(e) => {
    const val = e.target.value; // keep as string while typing
    setPickedByKey((prev) => {
      const curr = prev[cacheKey] || [];
      const next = curr.map((row, j) => (j === i ? { ...row, percent: val } : row));
      return { ...prev, [cacheKey]: next };
    });
  }}
  onBlur={(e) => setItemPercent(i, e.target.value)}  // sanitize & persist
  onKeyDown={(e) => {
    if (e.key === "Enter") e.currentTarget.blur();   // commit on Enter
  }}
  aria-label={`Percent for ${it.code}`}
/>

      <span className="std-pct-suffix">%</span>
    </div>

    <button
      type="button"
      className="std-remove"
      aria-label={`Remove ${it.code}`}
      title="Remove"
      onClick={() => removeItem(i)}
    >
      ×
    </button>
  </div>
</li>

   
      ))}
    </ul>
            )}
          </div>

          {/* —— PER-CHECKLIST CONTROLS —— */}
          <div className="td-gd-grid one" style={{ marginTop: 8 }}>
            <div className="td-gd-field">
              <label>Status</label>
              <select
                value={m.status || ""}
                onChange={(e) => setMeta("status", e.target.value)}
              >
                <option value="">Select Status</option>
                <option>Pending Approval</option>
                <option>Approved</option>
                <option>Rejected</option>
              </select>
            </div>

            <div className="td-gd-field">
              <label>Assigned To</label>
              <input
                type="text"
                placeholder="Name / email"
                value={m.assignee || ""}
                onChange={(e) => setMeta("assignee", e.target.value)}
              />
            </div>

            <div className="td-gd-field">
              <label>Due Date</label>
              <input
                type="date"
                value={m.dueDate || ""}
                onChange={(e) => setMeta("dueDate", e.target.value)}
              />
            </div>

            <div className="td-gd-field" style={{ gridColumn: "1 / -1" }}>
              <label>Feedback</label>
              <textarea
                rows={2}
                placeholder="Notes or feedback…"
                value={m.feedback || ""}
                onChange={(e) => setMeta("feedback", e.target.value)}
              />
            </div>
          </div>

          {/* Navigation + dots */}
          <div className="td-gd-actions two" style={{ marginTop: 10 }}>
            <button
              className="td-btn"
              onClick={() => setIdx((v) => Math.max(0, v - 1))}
              disabled={idx === 0}
            >
              ◀ Prev
            </button>
            <div
              className="td-gate-dots"
              role="tablist"
              aria-label="Checklist pager"
            >
              {checklist.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  className={`dot ${i === idx ? "is-on" : ""}`}
                  aria-pressed={i === idx}
                  title={String(checklist[i] || "")}
                  onClick={() => setIdx(i)}
                />
              ))}
            </div>
            <button
              className="td-btn td-btn-primary"
              onClick={() => setIdx((v) => Math.min(total - 1, v + 1))}
              disabled={idx === total - 1}
            >
              Next ▶
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Card component ---------- */
function ProjectCard({ p, onReview }) {
  const title = p.title || p.project_title || "Untitled";
  const subject = p.subject_domain || "—";
  const status = (p.status || "—").trim();
  const owner = p.owner_name || p.owner_email || "";

  return (
    <div className="td-card td-card--elevated">
      <div className="td-card-row">
        <div className="td-card-main">
          <div className="td-card-title" title={title}>
            {title}
          </div>
          <div className="td-card-meta">
            <span className="td-card-chip td-card-chip--subject">
              {subject}
            </span>
            {owner ? <span className="td-card-sep">•</span> : null}
            {owner ? <span className="td-card-owner">{owner}</span> : null}
          </div>
        </div>
        <span className={`td-status-pill ${pillClass(status)}`}>{status}</span>
      </div>

      <button
        className="td-review-cta"
        onClick={onReview}
        disabled={!p.project_id}
        title={p.project_id ? "Open review" : "Missing id"}
      >
        Review
      </button>
    </div>
  );
}

export default function TeacherDashboard() {
  // List
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // Sidebar details (summary only)
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsErr, setDetailsErr] = useState("");
  const [saveMsg, setSaveMsg] = useState("");
  const [project, setProject] = useState(null);
  const [draft, setDraft] = useState(null); // full project object for actions
  const [overallComment, setOverallComment] = useState("");
  const [selectedStageId, setSelectedStageId] = useState(null);

  // ---- Load list ----
  useEffect(() => {
    const run = window?.google?.script?.run;
    if (!run) {
      setErr("google.script.run not available");
      setLoading(false);
      return;
    }
    run
      .withSuccessHandler((data) => {
        try {
          const obj = parseMaybeJSON(data);
          const body = parseMaybeJSON(obj?.body);
          const list = Array.isArray(body?.projects) ? body.projects : [];
          setRows(list);
        } catch {
          setErr("Unexpected response from server");
        } finally {
          setLoading(false);
        }
      })
      .withFailureHandler((e) => {
        setErr(e?.message || "Failed to load");
        setLoading(false);
      })
      .getTeacherProjectsAll();
  }, []);

  // ---- helpers ----
  const extractProject = (data) => {
    const obj = parseMaybeJSON(data);
    const body = parseMaybeJSON(obj?.body);
    return (
      body?.project ||
      (Array.isArray(body?.projects) ? body.projects[0] : null) ||
      null
    );
  };

  const setFlash = (msg) => {
    setSaveMsg(msg);
    setTimeout(() => setSaveMsg(""), 1500);
  };

  // ---- Review flow: open sheet + sidebar summary ----
  const review = (projectId, userId) => {
    const run = window?.google?.script?.run;
    if (!run || !projectId || !userId) {
      setDetailsErr("Missing project id or user id");
      return;
    }

    setDetailsOpen(true);
    setDetailsLoading(true);
    setDetailsErr("");
    setSaveMsg("");
    setProject(null);
    setDraft(null);
    setOverallComment("");
    setSelectedStageId(null);

    run
      .withSuccessHandler((data) => {
        try {
          const proj = extractProject(data);
          if (!proj) {
            setDetailsErr(
              `No "project" in response (preview: ${safePreview(data)}…)`
            );
          }
          setProject(proj || null);
          setDraft(proj ? deepClone(proj) : null);

          if (proj) {
            // Open/write the project sheet only (keep your sheet flow)
            window.google.script.run
              .withSuccessHandler((msg) =>
                setFlash(msg || "Opened review sheet")
              )
              .withFailureHandler((e) =>
                setDetailsErr(e?.message || "Failed to write to sheet")
              )
              .writeProjectToSheet(proj);



            setSelectedStageId(null);

            // NOTE: Gate Standard sheet is no longer opened.
          }
        } catch {
          setDetailsErr("Could not parse details response.");
        } finally {
          setDetailsLoading(false);
        }
      })
      .withFailureHandler((e) => {
        setDetailsErr(e?.message || "Request failed.");
        setDetailsLoading(false);
      })
      .getTeacherProjectDetails(projectId, userId);
  };

  // ---- Decision buttons: no-ops for now ----
  const submitDecision = (decision) => {
    setSaveMsg("Sent ✅");
    setTimeout(() => setSaveMsg(""), 2000);
  };


  // ---------- UI ----------
  if (loading) {
    return (
      <div className="td-loading">
        <Loader2 className="spin" size={16} />
        Loading all projects…
      </div>
    );
  }
  if (err) return <div className="td-error">{err}</div>;

  return (
    <div className="td-wrapper">
      <h1 className="td-heading">Project Workflow</h1>

      {rows.length === 0 ? (
        <div className="td-empty">No projects yet.</div>
      ) : (
        rows.map((p) => (
          <ProjectCard
            key={p.project_id}
            p={p}
            onReview={() => review(p.project_id, p.user_id)}
          />
        ))
      )}

      {/* Sidebar summary */}
      {detailsOpen && (
        <div className="td-details">
          {detailsLoading && (
            <div className="td-loading">
              <Loader2 className="spin" size={16} /> Loading project…
            </div>
          )}

          {!detailsLoading && detailsErr && (
            <div className="td-error">{detailsErr}</div>
          )}

          {!detailsLoading && draft && (
            <>
              <div className="td-details-header">
                <div className="td-details-title">
                  {draft.project_title || draft.title || "Project"}
                </div>
                <span className={`td-status-pill ${pillClass(draft.status)}`}>
                  {draft.status || "—"}
                </span>
              </div>

              <div className="td-card-meta" style={{ marginTop: 6 }}>
                <span className="td-card-chip td-card-chip--subject">
                  {draft.subject_domain || "—"}
                </span>
                {(draft.owner_name || draft.owner_email) && (
                  <>
                    <span className="td-card-sep">•</span>
                    <span className="td-card-owner">
                      {draft.owner_name || draft.owner_email}
                    </span>
                  </>
                )}
              </div>

              {saveMsg === "sent" && (
  <div className="td-chip ok" style={{ marginTop: 6 }}>
    <span className="tick">✓</span> Sent
  </div>
)}

              {draft.description && (
                <div className="td-desc" style={{ marginTop: 8 }}>
                  {draft.description}
                </div>
              )}

              <div className="td-subject" style={{ marginTop: 12 }}>
                Stages
              </div>
              <div className="td-stage-list">
                {(draft.stages || [])
                  .slice()
                  .sort((a, b) => (a.stage_order || 0) - (b.stage_order || 0))
                  .filter((st) => st && st.stage_id) // skip detached gate-only entries if any
                  .map((st) => (
                    <div
                      key={st.stage_id}
                      className={`td-stage td-stage--list ${
                        selectedStageId === st.stage_id ? "is-active" : ""
                      }`}
                      onClick={() => setSelectedStageId(st.stage_id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) =>
                        (e.key === "Enter" || e.key === " ") &&
                        setSelectedStageId(st.stage_id)
                      }
                      style={{ cursor: "pointer" }}
                    >
                      <div className="td-stage-toggle">
                        <div className="td-stage-left">
                          <span className="td-stage-title">
                            {st.title || "Stage"}
                          </span>
                        </div>
                        <span className="td-stage-status">
                          {st.status || "—"}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>

              {/* Gate panel under the stage list */}
              {selectedStageId && (
                <GatePanel
                  stage={findStageWithGate(draft, selectedStageId)}
                  projectId={draft?.project_id}
                  draft={draft}
                />
              )}

              {saveMsg && <div className="flash-message">{saveMsg}</div>}

              <div className="actions-section">
                <button
                  className="approve-btn"
                  onClick={() => submitDecision("Approved")}
                  disabled={!draft?.project_id || detailsLoading}
                  title="Approve this project"
                >
                  ✅ Process Approved
                </button>

                <button
                  className="revision-btn"
                  onClick={() => submitDecision("Revision")}
                  disabled={!draft?.project_id || detailsLoading}
                  title="Send project back for revision"
                >
                  📝 Send for Revision
                </button>

                {/* You can keep or remove this extra button; it no longer opens any sheet */}
              </div>

              <textarea
                className="td-textarea"
                rows={2}
                value={overallComment}
                onChange={(e) => setOverallComment(e.target.value)}
                placeholder="General comments for this project decision"
                style={{ marginTop: 6 }}
              />

              <button
                className="td-close"
                onClick={() => {
                  setDetailsOpen(false);
                  setProject(null);
                  setDraft(null);
                  setDetailsErr("");
                  setSaveMsg("");
                  setOverallComment("");
                  setSelectedStageId(null);
                }}
              >
                Close
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
