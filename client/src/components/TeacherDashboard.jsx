import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import "../styles/Teacher.css";

import GatePanel from "./GatePanel";
import { gsRun } from "./utils/gsRun";

import Docteacher from "./Docteacher";
import "../styles/Docteacher.css";

const parseMaybeJSON = (v) => {
  if (typeof v !== "string") return v;
  try { return JSON.parse(v); } catch { return v; }
};
const safePreview = (v, n = 240) => {
  try { return JSON.stringify(parseMaybeJSON(v)).slice(0, n); }
  catch { return String(v).slice(0, n); }
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

/* ---------- Gate helpers ---------- */
function findStageWithGate(draft, stageId) {
  if (!draft || !Array.isArray(draft.stages)) return null;
  const want = String(stageId);

  // Find the clicked stage by ID (string-compare to avoid 1 vs "1" issues)
  const stage = draft.stages.find((s) => s && String(s.stage_id) === want);
  if (!stage) return null;

  // If the stage already has a gate, use it
  if (stage.gate) return stage;

  // Otherwise try to find a detached gate whose stage_id matches
  const carrier = draft.stages.find(
    (s) => s && s.gate && String(s.gate.stage_id || s.stage_id || "") === want
  );
  if (carrier && carrier.gate) {
    return { ...stage, gate: carrier.gate };
  }

  // No gate? Still return the stage so GatePanel can render a friendly message
  return stage;
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
        // relax if user_id isn’t always present in list payloads
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
  const [draft, setDraft] = useState(null);
  const [overallComment, setOverallComment] = useState("");
  const [selectedStageId, setSelectedStageId] = useState(null);

  // ---- Load list (gsRun) ----
  useEffect(() => {
    (async () => {
      try {
        const data = await gsRun("getTeacherProjectsAll");
        const obj = parseMaybeJSON(data);
        const body = parseMaybeJSON(obj?.body);
        const list = Array.isArray(body?.projects) ? body.projects : [];
        setRows(list);
      } catch (e) {
        setErr(e?.message || "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ---- Review flow: sidebar-only (no Sheet I/O) ----
  const review = async (projectId, userId) => {
    if (!projectId) {
      setDetailsErr("Missing project id");
      return;
    }

    setDetailsOpen(true);
    setDetailsLoading(true);
    setDetailsErr("");
    setSaveMsg("");
    setDraft(null);
    setOverallComment("");
    setSelectedStageId(null);

    try {
      const data = await gsRun("getTeacherProjectDetails", projectId, userId || "");
      const obj = parseMaybeJSON(data);
      const body = parseMaybeJSON(obj?.body);
      const proj = body?.project || null;

      if (!proj) {
        setDetailsErr(`No "project" in response (preview: ${safePreview(data)}…)`);
      } else {
        setDraft(deepClone(proj));
        setSelectedStageId(null);
      }
    } catch (e) {
      setDetailsErr(e?.message || "Request failed.");
    } finally {
      setDetailsLoading(false);
    }
  };

  // ---- Decision buttons: local UI only ----
  const submitDecision = (decision) => {
    if (draft) {
      setDraft((d) => ({
        ...d,
        status: decision === "Revision" ? "Pending Approval" : decision,
      }));
    }
    setSaveMsg(decision === "Revision" ? "Sent for revision 📝" : "Approved ✅");
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

              {!!saveMsg && (
                <div className="td-chip ok" style={{ marginTop: 6 }}>
                  {saveMsg}
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
                {(Array.isArray(draft.stages) ? draft.stages : [])
                  .slice()
                  .sort((a, b) => (a?.stage_order || 0) - (b?.stage_order || 0))
                  .filter((st) => st && st.stage_id)
                  .map((st) => {
                    const isActive = String(selectedStageId) === String(st.stage_id);
                    return (
                      <div
                        key={st.stage_id}
                        className={`td-stage td-stage--list ${isActive ? "is-active" : ""}`}
                        onClick={() => setSelectedStageId(String(st.stage_id))}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            setSelectedStageId(String(st.stage_id));
                          }
                        }}
                        style={{ cursor: "pointer" }}
                      >
                        <div className="td-stage-toggle">
                          <div className="td-stage-left">
                            <span className="td-stage-title">{st.title || "Stage"}</span>
                          </div>
                          <span className="td-stage-status">{st.status || "—"}</span>
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* Gate panel under the stage list */}
              {selectedStageId && (
                (() => {
                  const stage = findStageWithGate(draft, selectedStageId);
                  return stage ? <GatePanel stage={stage} /> : null;
                })()
              )}

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

      {/* Render Docteacher below Projects */}
      <Docteacher />
    </div>
  );
}
