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
      .getTeacherProjectDetails(projectId ,userId);
  };

  // ---------- Page actions (operate on the project as a whole) ----------
  const submitDecision = (decision) => {
    const run = window?.google?.script?.run;
    if (!run || !draft?.project_id) return;
    const uid = (draft.user_id || "").trim(); 

    setDetailsErr("");
    setSaveMsg("Sending ...");

    run
      .withSuccessHandler((result) => {
        if (result.success) {
          setSaveMsg("Sent ✅");
          setTimeout(() => setSaveMsg(""), 2500);
        } else {
          setDetailsErr(`Failed: ${result.error}`);
          setSaveMsg("");
        }
      })
      .withFailureHandler((e) => {
        setDetailsErr(`Error: ${e.message}`);
        setSaveMsg("");
      })
      // NOTE: Apps Script function should have 3 args (projectId, decision, overallComment)
      .submitProjectDecision(draft.project_id, uid, decision, overallComment);
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
            onReview={() => review(p.project_id,p.user_id)}
          />
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

              <div className="td-chip" style={{ marginTop: 6 }}>
                Student:{" "}
                {draft.owner_name ||
                  draft.owner_email ||
                  draft.student_name ||
                  "—"}
              </div>

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

              {saveMsg && <div className="flash-message">{saveMsg}</div>}

              <div className="actions-section">
                <button
                  className="approve-btn"
                  onClick={() => submitDecision("Approved")}
                  disabled={
                    !draft?.project_id ||
                    detailsLoading ||
                    (saveMsg || "").startsWith("Sending")
                  }
                  title="Approve this project"
                >
                  ✅ Process Approved
                </button>

                <button
                  className="revision-btn"
                  onClick={() => submitDecision("Revision")}
                  disabled={
                    !draft?.project_id ||
                    detailsLoading ||
                    (saveMsg || "").startsWith("Sending")
                  }
                  title="Send project back for revision"
                >
                  📝 Send for Revision
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
