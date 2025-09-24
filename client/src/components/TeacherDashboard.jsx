import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import "../styles/Teacher.css";

const parseMaybeJSON = (v) => {
  if (typeof v !== "string") return v;
  try { return JSON.parse(v); } catch { return v; }
};
const safePreview = (v, n = 240) => {
  try { return JSON.stringify(parseMaybeJSON(v)).slice(0, n); }
  catch { return String(v).slice(0, n); }
};
const deepClone = (obj) =>
  typeof structuredClone === "function" ? structuredClone(obj) : JSON.parse(JSON.stringify(obj));

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

function GatePanel({ stage }) {
  const g = stage?.gate || {};
  const checklist = Array.isArray(g.checklist) ? g.checklist : [];

  const [idx, setIdx] = React.useState(0);
  React.useEffect(() => { setIdx(0); }, [stage?.stage_id]);

  const total = checklist.length;
  const goPrev = () => setIdx((i) => Math.max(0, i - 1));
  const goNext = () => setIdx((i) => Math.min(total - 1, i + 1));

  const itemText = total ? String(checklist[idx] || "") : "";

  return (
    <div className="td-gate clean">
      <div className="td-gate-header">
        <div className="td-gate-title">
          {g.title || `Gate • ${stage?.title || "Stage"}`}
          {total > 0 && <span className="td-gate-step-inline"> · {idx + 1}/{total}</span>}
        </div>
        <div className="td-gate-meta">
          {g.status ? (
            <span className={`td-status-pill ${pillClass(g.status)}`}>{g.status}</span>
          ) : null}
          {g.review_date ? <span className="td-gate-date">Review: {g.review_date}</span> : null}
        </div>
      </div>

      {total === 0 ? (
        <div className="td-empty">No checklist items for this gate.</div>
      ) : (
        <div className="td-gate-detail one">
          {/* Selected checklist item */}
          <div className="td-gd-title">
            <span className="td-gd-no">{idx + 1}</span>
            <span className="td-gd-text">{itemText}</span>
            <div className="td-gd-spacer" />
            <button className="td-btn td-btn-primary" onClick={() => {/* no-op */}}>
              Add
            </button>
          </div>

          {/* Fields (description removed) */}
          <div className="td-gd-grid one">
            <div className="td-gd-field">
              <label>Status</label>
              <select defaultValue="">
                <option value="">—</option>
                <option>Pending Approval</option>
                <option>Approved</option>
                <option>Rejected</option>
              </select>
            </div>

            <div className="td-gd-field">
              <label>Assigned To</label>
              <input type="text" placeholder="Name / email" />
            </div>

            <div className="td-gd-field">
              <label>Due Date</label>
              <input type="date" />
            </div>

            <div className="td-gd-field" style={{ gridColumn: "1 / -1" }}>
              <label>Feedback</label>
              <textarea rows={2} placeholder="Notes or feedback…" />
            </div>
          </div>

          {/* Navigation + dots */}
          <div className="td-gd-actions two">
            <button className="td-btn" onClick={goPrev} disabled={idx === 0}>◀ Prev</button>
            <div className="td-gate-dots">
              {Array.from({ length: total }).map((_, i) => (
                <span key={i} className={`dot ${i === idx ? "is-on" : ""}`} />
              ))}
            </div>
            <button className="td-btn td-btn-primary" onClick={goNext} disabled={idx === total - 1}>
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
          <div className="td-card-title" title={title}>{title}</div>
          <div className="td-card-meta">
            <span className="td-card-chip td-card-chip--subject">{subject}</span>
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
    return body?.project || (Array.isArray(body?.projects) ? body.projects[0] : null) || null;
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
            setDetailsErr(`No "project" in response (preview: ${safePreview(data)}…)`);
          }
          setProject(proj || null);
          setDraft(proj ? deepClone(proj) : null);

          if (proj) {
            // Open/write the project sheet only (keep your sheet flow)
            window.google.script.run
              .withSuccessHandler((msg) => setFlash(msg || "Opened review sheet"))
              .withFailureHandler((e) => setDetailsErr(e?.message || "Failed to write to sheet"))
              .writeProjectToSheet(proj);

            // auto-select first stage for Gate view
            const firstStage =
              (proj.stages || [])
                .slice()
                .sort((a, b) => (a.stage_order || 0) - (b.stage_order || 0))
                .find((s) => s && s.stage_id);
            setSelectedStageId(firstStage ? firstStage.stage_id : null);

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
    setSaveMsg(decision === "Approved" ? "Approved (no-op)" : "Sent for revision (no-op)");
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
          <ProjectCard key={p.project_id} p={p} onReview={() => review(p.project_id, p.user_id)} />
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

          {!detailsLoading && detailsErr && <div className="td-error">{detailsErr}</div>}

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
                    <span className="td-card-owner">{draft.owner_name || draft.owner_email}</span>
                  </>
                )}
              </div>

              {saveMsg && <div className="td-chip" style={{ marginTop: 6 }}>✓ {saveMsg}</div>}

              {draft.description && <div className="td-desc" style={{ marginTop: 8 }}>{draft.description}</div>}

              <div className="td-subject" style={{ marginTop: 12 }}>Stages</div>
              <div className="td-stage-list">
                {(draft.stages || [])
                  .slice()
                  .sort((a, b) => (a.stage_order || 0) - (b.stage_order || 0))
                  .filter((st) => st && st.stage_id) // skip detached gate-only entries if any
                  .map((st) => (
                    <div
                      key={st.stage_id}
                      className={`td-stage td-stage--list ${selectedStageId === st.stage_id ? "is-active" : ""}`}
                      onClick={() => setSelectedStageId(st.stage_id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setSelectedStageId(st.stage_id)}
                      style={{ cursor: "pointer" }}
                    >
                      <div className="td-stage-toggle">
                        <div className="td-stage-left">
                          <span className="td-stage-title">{st.title || "Stage"}</span>
                        </div>
                        <span className="td-stage-status">{st.status || "—"}</span>
                      </div>
                    </div>
                  ))}
              </div>

              {/* Gate panel under the stage list */}
              {selectedStageId && (
                <GatePanel stage={findStageWithGate(draft, selectedStageId)} />
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
                <button
                  className="td-btn td-btn-primary"
                  onClick={() => {}}
                  disabled={!draft?.project_id || detailsLoading}
                  title="Add Gate standards"
                >
                  📤 Add Gate standards
                </button>
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
