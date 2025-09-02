import React, { useEffect, useState, useCallback } from "react";
import {
  Loader2,
  MessageSquareText,
} from "lucide-react";
import "../styles/Teacher.css";

/* ---------- helpers ---------- */
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
    // Prefer body.project; fall back to first
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

  // ---- Review flow: open sheet + sidebar summary (no tasks in sidebar) ----
  const review = (projectId) => {
    const run = window?.google?.script?.run;
    if (!run || !projectId) return;

    // Open summary panel
    setDetailsOpen(true);
    setDetailsLoading(true);
    setDetailsErr("");
    setSaveMsg("");
    setProject(null);
    setDraft(null);
    setOverallComment("");

    // Fetch details for sidebar summary
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

          // Write the exact project to the sheet (prevents shape issues)
          if (proj) {
            window.google.script.run
              .withSuccessHandler((msg) =>
                setFlash(msg || "Opened review sheet")
              )
              .withFailureHandler((e) =>
                setDetailsErr(e?.message || "Failed to write to sheet")
              )
              .writeProjectToSheet(proj);
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
      .getTeacherProjectDetails(projectId);
  };

  // ---------- Page actions (operate on the project as a whole) ----------
  const approveAll = () => {
    const run = window?.google?.script?.run;
    if (!run || !draft?.project_id) return;

    // optimistic UI: show a chip + (optionally) mark statuses in local state if needed
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
              <div className="td-title">
                {p.title || p.project_title || "Untitled"}
              </div>
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

      {/* Sidebar summary (no tasks) */}
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
                <div className="td-chip">
                  {draft.subject_domain || "—"} • {draft.status || "—"}
                </div>
              </div>

              {saveMsg && (
                <div className="td-chip" style={{ marginTop: 6 }}>
                  ✓ {saveMsg}
                </div>
              )}

              {/* Student name */}
              <div className="td-chip" style={{ marginTop: 6 }}>
                Student:{" "}
                {draft.owner_name ||
                  draft.owner_email ||
                  draft.student_name ||
                  "—"}
              </div>

              {/* Description */}
              {draft.description && (
                <div className="td-desc" style={{ marginTop: 8 }}>
                  {draft.description}
                </div>
              )}

              {/* Stages list only (no tasks) */}
              <div className="td-subject" style={{ marginTop: 12 }}>
                Stages
              </div>
              <div className="td-stage-list">
                {(draft.stages || [])
                  .slice()
                  .sort(
                    (a, b) => (a.stage_order || 0) - (b.stage_order || 0)
                  )
                  .map((st) => (
                    <div key={st.stage_id} className="td-stage td-stage--list">
                      <div
                        className="td-stage-toggle"
                        style={{ cursor: "default" }}
                      >
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

              {/* Actions in the SIDEBAR */}
              <div className="actions-section">
                <button
                  className="approve-btn"
                  onClick={approveAll}
                  disabled={!draft?.project_id || detailsLoading}
                  title="Mark all tasks Approved"
                >
                  ✅ Approve All
                </button>

                <button
                  className="revision-btn"
                  onClick={() => submitDecision("return")}
                  disabled={!draft?.project_id || detailsLoading}
                  title="Send project back for revision"
                >
                  📝 Send for Revision
                </button>

                <button
                  className="reject-btn"
                  onClick={() => submitDecision("reject")}
                  disabled={!draft?.project_id || detailsLoading}
                  title="Reject project"
                >
                  🛑 Reject Project
                </button>
              </div>

              {/* Optional general comments */}
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
