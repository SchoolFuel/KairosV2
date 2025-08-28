import React, { useEffect, useState, useCallback } from "react";
import {
  Loader2,
  MessageSquareText,
  ChevronDown,
  ChevronRight,
  Save,
  Link as LinkIcon,
} from "lucide-react";
import "../styles/Teacher.css";

// ---------- helpers ----------
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

const autoGrow = (e) => {
  const el = e.target;
  el.style.height = "auto";
  el.style.height = Math.min(el.scrollHeight, 220) + "px";
};

export default function TeacherDashboard() {
  // List
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // Details
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsErr, setDetailsErr] = useState("");
  const [saveMsg, setSaveMsg] = useState("");
  const [project, setProject] = useState(null); // not strictly needed but kept for clarity
  const [draft, setDraft] = useState(null); // editable copy
  const [expandedStages, setExpandedStages] = useState({});
  const [overallComment, setOverallComment] = useState("");

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
      .withFailureHandler(() => {
        setErr("Failed to load");
        setLoading(false);
      })
      .getTeacherProjectsAll();
  }, []);

  // ---- helpers ----
  const toggleStage = useCallback(
    (id) => setExpandedStages((p) => ({ ...p, [id]: !p[id] })),
    []
  );

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

  // ---- Open details (all stages collapsed by default) ----
  const review = (projectId) => {
    const run = window?.google?.script?.run;
    if (!run || !projectId) return;

    setDetailsOpen(true);
    setDetailsLoading(true);
    setDetailsErr("");
    setSaveMsg("");
    setProject(null);
    setDraft(null);
    setExpandedStages({});
    setOverallComment("");

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
          // Keep ALL stages collapsed on open:
          setExpandedStages({});

          window.google.script.run
          .withSuccessHandler((msg) => setFlash(msg || 'Written to sheet'))
          .withFailureHandler((e) => setDetailsErr(e?.message || 'Failed to write to sheet'))
          .writeProjectToSheet(proj);
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
      .getTeacherProjectDetails(projectId); // GAS alias exists
  };

  // ---------- Per-task editing + save ----------
  const updateTaskField = (stageId, taskId, key, value) => {
    setDraft((d) => ({
      ...d,
      stages: d.stages.map((s) =>
        s.stage_id === stageId
          ? {
              ...s,
              tasks: s.tasks.map((t) =>
                t.task_id === taskId ? { ...t, [key]: value } : t
              ),
            }
          : s
      ),
    }));
  };

  const updateTaskReviewLocal = (stageId, taskId, field, value) => {
    setDraft((d) => ({
      ...d,
      stages: d.stages.map((s) =>
        s.stage_id === stageId
          ? {
              ...s,
              tasks: s.tasks.map((t) =>
                t.task_id === taskId ? { ...t, [field]: value } : t
              ),
            }
          : s
      ),
    }));
  };

  const saveTask = (task) => {
    const run = window?.google?.script?.run;
    if (!run || !draft?.project_id) return;
    setDetailsErr("");
    setSaveMsg("");
    run
      .withSuccessHandler(() => setFlash("Saved"))
      .withFailureHandler((e) => setDetailsErr(e?.message || "Save failed"))
      .updateTaskReview(
        draft.project_id,
        task.task_id,
        task.review_status || task.status || "Pending Approval",
        task.reviewer_feedback || ""
      );
  };

  // ---------- Stage feedback ----------
  const saveStageFeedback = (stage) => {
    const run = window?.google?.script?.run;
    if (!run || !draft?.project_id) return;
    setDetailsErr("");
    setSaveMsg("");
    run
      .withSuccessHandler(() => setFlash("Feedback saved"))
      .withFailureHandler((e) => setDetailsErr(e?.message || "Save failed"))
      .saveStageFeedback(
        draft.project_id,
        stage.stage_id,
        stage.reviewer_feedback || ""
      );
  };

  // ---------- Page actions ----------
  const approveAll = () => {
    const run = window?.google?.script?.run;
    if (!run || !draft?.project_id) return;

    // optimistic UI
    setDraft((d) => ({
      ...d,
      stages: d.stages.map((s) => ({
        ...s,
        tasks: s.tasks.map((t) => ({ ...t, review_status: "Approved" })),
      })),
    }));

    setDetailsErr("");
    setSaveMsg("");
    run
      .withSuccessHandler(() => setFlash("Approved all"))
      .withFailureHandler((e) =>
        setDetailsErr(e?.message || "Approve-all failed")
      )
      .approveAllTasks(draft.project_id);
  };

  const submitDecision = (decision) => {
    const run = window?.google?.script?.run;
    if (!run || !draft?.project_id) return;
    setDetailsErr("");
    setSaveMsg("");
    run
      .withSuccessHandler(() => setFlash(`Submitted: ${decision}`))
      .withFailureHandler((e) => setDetailsErr(e?.message || "Submit failed"))
      .submitProjectDecision(draft.project_id, decision, overallComment || "");
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
      <h2 className="td-heading">All Projects</h2>

      {rows.length === 0 ? (
        <div className="td-empty">No projects yet.</div>
      ) : (
        rows.map((p) => (
          <div key={p.project_id} className="td-card">
            <div className="td-card-header">
              <div className="td-title">{p.title || "Untitled"}</div>
              <span className="td-status">{p.status || "—"}</span>
            </div>
            <div className="td-subject">{p.subject_domain || "—"}</div>
            <div style={{ marginTop: 8 }}>
              <button
                className="td-review-btn"
                onClick={() => review(p.project_id)}
                disabled={!p.project_id}
                title={p.project_id ? "Open review" : "Missing id"}
              >
                <span
                  style={{
                    display: "inline-flex",
                    gap: 6,
                    alignItems: "center",
                  }}
                >
                  <MessageSquareText size={16} /> Review
                </span>
              </button>
            </div>
          </div>
        ))
      )}

      {detailsOpen && (
        <div className="td-details">
          {detailsLoading && (
            <div className="td-loading">
              <Loader2 className="spin" size={16} /> Loading project details…
            </div>
          )}

          {!detailsLoading && detailsErr && (
            <div className="td-error">{detailsErr}</div>
          )}

          {!detailsLoading && draft && (
            <>
              <div className="td-details-header">
                <div className="td-details-title">
                  {draft.project_title || draft.title || "Project Details"}
                </div>
                <div className="td-chip">
                  {draft.subject_domain || "—"} • {draft.status || "—"}
                </div>
              </div>

              {saveMsg && (
                <div className="td-chip" style={{ marginTop: 6 }}>
                  ✓ {saveMsg}
                </div>
              )}

              {draft.description && (
                <div className="td-desc">{draft.description}</div>
              )}

              <div className="td-subject" style={{ marginTop: 8 }}>
                Stages: {Array.isArray(draft.stages) ? draft.stages.length : 0}
              </div>

              {/* STAGES */}
              <div style={{ marginTop: 8 }}>
                {(draft.stages || []).map((st) => {
                  const open = !!expandedStages[st.stage_id];
                  return (
                    <div key={st.stage_id} className="td-stage">
                      <button
                        className="td-stage-toggle"
                        onClick={() => toggleStage(st.stage_id)}
                      >
                        <div className="td-stage-left">
                          {open ? (
                            <ChevronDown size={16} />
                          ) : (
                            <ChevronRight size={16} />
                          )}
                          <span className="td-stage-title">
                            {st.title || "Stage"}
                          </span>
                        </div>
                        <span className="td-stage-status">
                          {st.status || "—"}
                        </span>
                      </button>

                      {open && (
                        <div className="td-stage-body">
                          {/* TASKS */}
                          {(st.tasks || []).map((t) => (
                            <div
                              key={t.task_id}
                              className="td-task td-task--compact"
                            >
                              {/* Toolbar: title · evidence · status · save */}
                              <div className="td-task-toolbar">
                                <input
                                  className="td-input td-input-title"
                                  value={t.title || ""}
                                  onChange={(e) =>
                                    updateTaskField(
                                      st.stage_id,
                                      t.task_id,
                                      "title",
                                      e.target.value
                                    )
                                  }
                                  placeholder="Task title"
                                />

                                {t.evidence_link && (
                                  <a
                                    className="td-icon-btn"
                                    href={t.evidence_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="Evidence"
                                  >
                                    <LinkIcon size={16} />
                                  </a>
                                )}

                                <select
                                  className="td-pill-select"
                                  value={
                                    t.review_status ||
                                    t.status ||
                                    "Pending Approval"
                                  }
                                  onChange={(e) =>
                                    updateTaskReviewLocal(
                                      st.stage_id,
                                      t.task_id,
                                      "review_status",
                                      e.target.value
                                    )
                                  }
                                  title="Status"
                                >
                                  <option>Pending Approval</option>
                                  <option>Approved</option>
                                  <option>Needs Revision</option>
                                </select>

                                <button
                                  className="td-icon-btn"
                                  onClick={() => saveTask(t)}
                                  title="Save"
                                >
                                  <Save size={16} />
                                </button>
                              </div>

                              {/* Description (auto-resize) */}
                              <textarea
                                className="td-textarea td-textarea-auto"
                                rows={1}
                                onInput={autoGrow}
                                value={t.description || ""}
                                onChange={(e) =>
                                  updateTaskField(
                                    st.stage_id,
                                    t.task_id,
                                    "description",
                                    e.target.value
                                  )
                                }
                                placeholder="Task description"
                              />

                              {/* Feedback collapsible */}
                              <details className="td-disclosure">
                                <summary>Feedback</summary>
                                <input
                                  className="td-input"
                                  value={t.reviewer_feedback || ""}
                                  onChange={(e) =>
                                    updateTaskReviewLocal(
                                      st.stage_id,
                                      t.task_id,
                                      "reviewer_feedback",
                                      e.target.value
                                    )
                                  }
                                  placeholder="Optional feedback to student"
                                />
                              </details>
                            </div>
                          ))}

                          {/* STAGE FEEDBACK SAVE */}
                          <div className="td-gate">
                            <div className="td-gate-title">Stage Feedback</div>
                            <textarea
                              className="td-textarea"
                              rows={2}
                              value={st.reviewer_feedback || ""}
                              onChange={(e) =>
                                setDraft((d) => ({
                                  ...d,
                                  stages: d.stages.map((s) =>
                                    s.stage_id === st.stage_id
                                      ? {
                                          ...s,
                                          reviewer_feedback: e.target.value,
                                        }
                                      : s
                                  ),
                                }))
                              }
                              placeholder="Notes for this stage"
                            />
                            <div style={{ marginTop: 6 }}>
                              <button
                                className="td-btn td-btn-sm"
                                onClick={() => saveStageFeedback(st)}
                              >
                                Save Stage Feedback
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* PAGE ACTIONS */}
              {/* Student-style actions */}
              <div className="actions-section">
                <button className="approve-btn" onClick={approveAll}>
                  ✅ Approve All
                </button>
                <button
                  className="revision-btn"
                  onClick={() => submitDecision("return")}
                >
                  📝 Send for Revision
                </button>
                <button
                  className="reject-btn"
                  onClick={() => submitDecision("reject")}
                >
                  🛑 Reject Project
                </button>
              </div>

              {/* (Optional) general comments stays below */}
              <textarea
                className="td-textarea"
                rows={2}
                value={overallComment}
                onChange={(e) => setOverallComment(e.target.value)}
                placeholder="General comments for this project decision"
              />

              <button
                className="td-close"
                onClick={() => {
                  setDetailsOpen(false);
                  setProject(null);
                  setDraft(null);
                  setDetailsErr("");
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
