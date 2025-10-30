import React from "react";

export default function GateStandards() {
  const steps = [
    { t: "Upcoming Assessment Notice", s: "Teacher sees alert and key facts." },
    { t: "Review Details & Mastery", s: "Standards, % mastery, due date." },
    { t: "Assessment Type & Materials", s: "Select type, attach files, or request AI help." },
    { t: "Delivery Details", s: "Time, duration, online/in-person, requirements." },
    { t: "Summary & Approval", s: "Review + confirm or edit." },
    { t: "Send to Student & RDS", s: "Submit plan to backend and notify." },
    { t: "Completion & Evaluation", s: "Teacher receives artifacts for grading." },
    { t: "Finalize & Feedback", s: "Assign grade, update standards, notify student." },
  ];

  const [stepIdx, setStepIdx] = React.useState(0);
  const [aiText, setAiText] = React.useState("");
  const [showWorkflow, setShowWorkflow] = React.useState(false);
  const [lightbox, setLightbox] = React.useState({ open: false, src: "", alt: "" });

  function requestAI() {
    setAiText(
      "AI draft prepared: 3-step performance task, rubric (4 criteria), and sample answer key."
    );
  }
  function saveDraft() {
    alert("Draft saved (mock).");
  }
  function approveAndSend() {
    alert("Plan approved & sent (mock).");
    setStepIdx(5);
  }

  return (
    <div className="ga-dialog" role="dialog" aria-label="Gate Assessment Planner">
      <style>{`
        :root{--ink:#111827;--muted:#6b7280;--border:#e5e7eb;--bg:#ffffff;--accent:#6B2F5C;--ok:#16a34a;--warn:#f59e0b;--err:#dc2626}
        .ga-dialog{width:720px;max-width:100vw;height:86vh;display:grid;grid-template-columns:220px 1fr;border:1px solid var(--border);border-radius:14px;overflow:hidden;background:#fff}
        .ga-aside{border-right:1px solid var(--border);padding:14px 12px;background:#fafafa;display:flex;flex-direction:column;min-height:0}
        .ga-header{display:flex;align-items:center;gap:10px;margin-bottom:12px}
        .ga-title{font-weight:600}
        .ga-stepper{display:flex;flex-direction:column;gap:6px;flex:1;min-height:0;overflow-y:auto}
        .ga-step{display:flex;gap:8px;align-items:center;padding:8px;border-radius:10px;cursor:pointer}
        .ga-step.active{background:#f5f3ff;border:1px solid #e9d5ff}
        .ga-bubble{width:22px;height:22px;border-radius:999px;display:grid;place-items:center;background:#fff;border:1px solid var(--border);font-size:12px}
        .ga-step.active .ga-bubble{background:var(--accent);color:#fff;border-color:var(--accent)}
        .ga-main{padding:16px;overflow:auto}
        .ga-h2{font-size:18px;margin:0 0 6px}
        .ga-sub{font-size:12px;color:var(--muted);margin-bottom:12px}
        .ga-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
        .ga-field{display:flex;flex-direction:column;gap:6px}
        .ga-field label{font-size:12px;color:#374151}
        .ga-input, .ga-select, .ga-textarea{border:1px solid var(--border);border-radius:10px;padding:10px;font-size:13px}
        .ga-textarea{min-height:100px}
        .ga-card{border:1px solid var(--border);border-radius:12px;padding:12px}
        .ga-badge{display:inline-block;font-size:11px;padding:2px 8px;border-radius:999px;background:#eef2ff;border:1px solid #e0e7ff;color:#374151}
        .ga-actions{display:flex;justify-content:space-between;gap:8px;position:sticky;bottom:0;background:#fff;border-top:1px solid var(--border);padding:12px;margin-top:10px}
        .ga-btn{border:0;border-radius:10px;padding:10px 14px;cursor:pointer}
        .ga-ghost{background:#fff;border:1px solid var(--border)}
        .ga-primary{background:var(--accent);color:#fff}
        .ga-success{background:var(--ok);color:#fff}
        .ga-danger{background:var(--err);color:#fff}
        .ga-table{border:1px solid var(--border);border-radius:12px;overflow:hidden;margin-top:8px}
        .ga-toggle{font-size:12px;color:var(--muted);cursor:pointer;margin:-4px 0 8px}
        .ga-pill{background:#fef3c7;border:1px dashed #f59e0b;color:#92400e;padding:2px 8px;border-radius:999px;font-size:11px}
      `}</style>

      <aside className="ga-aside">
        <div className="ga-header">
          <img
            alt="icon"
            width={28}
            height={28}
            src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 24 24' fill='none' stroke='%236B2F5C' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M9 18h6'/%3E%3Cpath d='M10 22h4'/%3E%3Cpath d='M2 12a10 10 0 1 0 20 0A10 10 0 0 0 2 12Z'/%3E%3Cpath d='M8 10a4 4 0 1 1 8 0c0 2-1 3-3 4v2h-2v-2c-2-1-3-2-3-4Z'/%3E%3C/svg%3E"
          />
          <div className="ga-title">Gate Assessment</div>
        </div>

        <div className="ga-stepper">
          {steps.map((s, i) => (
            <div
              key={s.t}
              className={`ga-step ${i === stepIdx ? "active" : ""}`}
              onClick={() => setStepIdx(i)}
            >
              <div className="ga-bubble">{i + 1}</div>
              <div>{s.t}</div>
            </div>
          ))}
        </div>
      </aside>

      <main className="ga-main">
        <h2 className="ga-h2">{stepIdx + 1}) {steps[stepIdx].t}</h2>
        <div className="ga-sub">{steps[stepIdx].s}</div>

        <div>
          {stepIdx === 0 && (
            <div className="ga-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 600 }}>
                    Student: <span className="ga-pill">Billy Johnson</span>
                  </div>
                  <div className="ga-sub">Unit: Water Conservation · Due: 2025-11-05</div>
                </div>
                <span className="ga-badge">Upcoming</span>
              </div>
            </div>
          )}

          {stepIdx === 1 && (
            <div className="ga-grid">
              <div className="ga-card">
                <div style={{ fontWeight: 600, marginBottom: 6 }}>Academic Standards</div>
                <ul style={{ margin: "0 0 6px 16px" }}>
                  <li>HS.E1U1.13 — Analyze environmental data (mastery 20%)</li>
                  <li>HS.E2U1.15 — Evaluate solutions for water issues (mastery 10%)</li>
                </ul>
                <div className="ga-sub">Current mastery snapshot as of today.</div>
              </div>
              <div className="ga-card">
                <div className="ga-field">
                  <label>Due Date</label>
                  <input type="datetime-local" className="ga-input" defaultValue="2025-11-05T10:00" />
                </div>
                <div className="ga-field">
                  <label>Notes</label>
                  <textarea className="ga-textarea" placeholder="Any special considerations" />
                </div>
              </div>
            </div>
          )}

          {stepIdx === 2 && (
            <div className="ga-grid">
              <div className="ga-card">
                <div className="ga-field">
                  <label>Assessment Type</label>
                  <select className="ga-select">
                    <option>Performance Task</option>
                    <option>Oral Defense</option>
                    <option>Project Artifact Review</option>
                    <option>Written Exam</option>
                  </select>
                </div>
                <div className="ga-field">
                  <label>Context / Objectives</label>
                  <textarea className="ga-textarea" placeholder="Describe the assessment goal and constraints" />
                </div>
                <div className="ga-field">
                  <label>Materials</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="ga-btn ga-ghost">Attach Files</button>
                    <button className="ga-btn ga-ghost" onClick={requestAI}>Ask AI to Draft Materials</button>
                  </div>
                  <div className="ga-sub">Rubrics, prompts, exemplars. (Drive Picker or uploads.)</div>
                </div>
              </div>
              <div className="ga-card">
                <div style={{ fontWeight: 600, marginBottom: 6 }}>AI Suggestions</div>
                <div className="ga-sub">{aiText || "No draft requested yet."}</div>
              </div>
            </div>
          )}

          {stepIdx === 3 && (
            <div className="ga-grid">
              <div className="ga-card">
                <div className="ga-field">
                  <label>Delivery Mode</label>
                  <select className="ga-select">
                    <option>In-person</option>
                    <option>Online (proctored)</option>
                    <option>Online (asynchronous)</option>
                  </select>
                </div>
                <div className="ga-field">
                  <label>Start</label>
                  <input type="datetime-local" className="ga-input" />
                </div>
                <div className="ga-field">
                  <label>Duration (minutes)</label>
                  <input type="text" className="ga-input" placeholder="e.g., 45" />
                </div>
              </div>
              <div className="ga-card">
                <div className="ga-field">
                  <label>Requirements</label>
                  <textarea className="ga-textarea" placeholder="Devices, materials, accommodations, proctoring, group/individual, etc." />
                </div>
                <div className="ga-field">
                  <label>Special Conditions</label>
                  <textarea className="ga-textarea" placeholder="Make‑up policy, late submissions, etc." />
                </div>
              </div>
            </div>
          )}

          {stepIdx === 4 && (
            <div className="ga-card">
              <div style={{ fontWeight: 600, marginBottom: 8 }}>Plan Summary</div>
              <div className="ga-sub">Review the auto‑generated summary before approval.</div>
              <ul style={{ margin: "8px 0 0 18px" }}>
                <li><b>Type:</b> Performance Task</li>
                <li><b>Standards:</b> HS.E1U1.13, HS.E2U1.15</li>
                <li><b>When:</b> Nov 5, 10:00–10:45</li>
                <li><b>Mode:</b> In‑person</li>
                <li><b>Materials:</b> Prompt + rubric (attached)</li>
              </ul>
            </div>
          )}

          {stepIdx === 5 && (
            <div className="ga-card">
              <div style={{ fontWeight: 600, marginBottom: 8 }}>Sending to Student…</div>
              <div className="ga-sub">Plan will be persisted to RDS, and the student notified via in‑app + email.</div>
              <div style={{ marginTop: 8 }}>Status: <span className="ga-badge">Queued</span></div>
            </div>
          )}

          {stepIdx === 6 && (
            <div className="ga-card">
              <div style={{ fontWeight: 600, marginBottom: 8 }}>Assessment Completed</div>
              <div className="ga-sub">Artifacts available: report.pdf, presentation.pptx, observation-notes.md</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 10 }}>
                <img src="https://via.placeholder.com/200x120.png?text=Artifact+1" alt="Artifact 1" style={{ width: '100%', borderRadius: 8, cursor: 'pointer', border: '1px solid var(--border)' }} onClick={() => setLightbox({ open: true, src: 'https://via.placeholder.com/1200x800.png?text=Artifact+1', alt: 'Artifact 1' })} />
                <img src="https://via.placeholder.com/200x120.png?text=Artifact+2" alt="Artifact 2" style={{ width: '100%', borderRadius: 8, cursor: 'pointer', border: '1px solid var(--border)' }} onClick={() => setLightbox({ open: true, src: 'https://via.placeholder.com/1200x800.png?text=Artifact+2', alt: 'Artifact 2' })} />
                <img src="https://via.placeholder.com/200x120.png?text=Artifact+3" alt="Artifact 3" style={{ width: '100%', borderRadius: 8, cursor: 'pointer', border: '1px solid var(--border)' }} onClick={() => setLightbox({ open: true, src: 'https://via.placeholder.com/1200x800.png?text=Artifact+3', alt: 'Artifact 3' })} />
              </div>
            </div>
          )}

          {stepIdx === 7 && (
            <div className="ga-grid">
              <div className="ga-card">
                <div className="ga-field">
                  <label>Final Grade</label>
                  <select className="ga-select">
                    <option>A</option><option>B</option><option>C</option><option>D</option><option>Incomplete</option>
                  </select>
                </div>
                <div className="ga-field">
                  <label>Evidence → Standards Mapping</label>
                  <textarea className="ga-textarea" placeholder="Describe how evidence meets each standard" />
                </div>
              </div>
              <div className="ga-card">
                <div className="ga-field">
                  <label>Feedback to Student</label>
                  <textarea className="ga-textarea" placeholder="Strengths, next steps, and mastery guidance" />
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="ga-btn ga-success">Publish Feedback</button>
                  <button className="ga-btn ga-danger">Request Revision</button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="ga-actions">
          <div style={{ display: "flex", gap: 8 }}>
            <button className="ga-btn ga-ghost" onClick={() => setStepIdx(Math.max(0, stepIdx - 1))}>Back</button>
            <button className="ga-btn ga-ghost" onClick={saveDraft}>Save Draft</button>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {stepIdx < 4 && (
              <button className="ga-btn ga-primary" onClick={() => setStepIdx(Math.min(7, stepIdx + 1))}>Next</button>
            )}
            {stepIdx === 4 && (
              <button className="ga-btn ga-success" onClick={approveAndSend}>Approve & Send</button>
            )}
          </div>
        </div>

        <div className="ga-toggle" onClick={() => setShowWorkflow((s) => !s)}>
          {showWorkflow ? "▼ Hide step-by-step workflow table" : "▶ Show step-by-step workflow table"}
        </div>

        {showWorkflow && (
          <section>
            <div className="ga-table">
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid var(--border)", background: "#fafafa" }}>#</th>
                    <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid var(--border)", background: "#fafafa" }}>Step</th>
                    <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid var(--border)", background: "#fafafa" }}>Owner</th>
                    <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid var(--border)", background: "#fafafa" }}>Key Fields/UI</th>
                    <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid var(--border)", background: "#fafafa" }}>Backend Action</th>
                    <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid var(--border)", background: "#fafafa" }}>Outputs/Events</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: 10, borderBottom: "1px solid var(--border)" }}>1</td>
                    <td style={{ padding: 10, borderBottom: "1px solid var(--border)" }}>Notification of upcoming gate</td>
                    <td style={{ padding: 10, borderBottom: "1px solid var(--border)" }}>System → Teacher</td>
                    <td style={{ padding: 10, borderBottom: "1px solid var(--border)" }}>Banner + card (Student, Unit, Standards, Due date)</td>
                    <td style={{ padding: 10, borderBottom: "1px solid var(--border)" }}>Fetch gate data from RDS via API (/gate/upcoming)</td>
                    <td style={{ padding: 10, borderBottom: "1px solid var(--border)" }}>Teacher alerted and dialog launched</td>
                  </tr>
                  <tr>
                    <td style={{ padding: 10, borderBottom: "1px solid var(--border)" }}>2</td>
                    <td style={{ padding: 10, borderBottom: "1px solid var(--border)" }}>Review details & mastery</td>
                    <td style={{ padding: 10, borderBottom: "1px solid var(--border)" }}>Teacher</td>
                    <td style={{ padding: 10, borderBottom: "1px solid var(--border)" }}>Read-only card showing academic standards, % mastery, and due date</td>
                    <td style={{ padding: 10, borderBottom: "1px solid var(--border)" }}>None (view-only)</td>
                    <td style={{ padding: 10, borderBottom: "1px solid var(--border)" }}>Teacher reviews and proceeds</td>
                  </tr>
                  <tr>
                    <td style={{ padding: 10, borderBottom: "1px solid var(--border)" }}>3</td>
                    <td style={{ padding: 10, borderBottom: "1px solid var(--border)" }}>Define Assessment Type & Materials</td>
                    <td style={{ padding: 10, borderBottom: "1px solid var(--border)" }}>Teacher</td>
                    <td style={{ padding: 10, borderBottom: "1px solid var(--border)" }}>Dropdown for type, textarea for context, file upload, “Ask AI” button</td>
                    <td style={{ padding: 10, borderBottom: "1px solid var(--border)" }}>Optional API call to /ai/generate for materials and rubrics</td>
                    <td style={{ padding: 10, borderBottom: "1px solid var(--border)" }}>Draft assessment plan saved</td>
                  </tr>
                  <tr>
                    <td style={{ padding: 10, borderBottom: "1px solid var(--border)" }}>4</td>
                    <td style={{ padding: 10, borderBottom: "1px solid var(--border)" }}>Specify Delivery Details</td>
                    <td style={{ padding: 10, borderBottom: "1px solid var(--border)" }}>Teacher</td>
                    <td style={{ padding: 10, borderBottom: "1px solid var(--border)" }}>Date/time picker, mode, duration, requirements textarea</td>
                    <td style={{ padding: 10, borderBottom: "1px solid var(--border)" }}>Validate calendar conflicts, save to draft table</td>
                    <td style={{ padding: 10, borderBottom: "1px solid var(--border)" }}>Draft updated</td>
                  </tr>
                  <tr>
                    <td style={{ padding: 10, borderBottom: "1px solid var(--border)" }}>5</td>
                    <td style={{ padding: 10, borderBottom: "1px solid var(--border)" }}>Review & Approve Assessment Plan</td>
                    <td style={{ padding: 10, borderBottom: "1px solid var(--border)" }}>Teacher</td>
                    <td style={{ padding: 10, borderBottom: "1px solid var(--border)" }}>Auto-generated summary view with editable fields</td>
                    <td style={{ padding: 10, borderBottom: "1px solid var(--border)" }}>POST /gate/plan/finalize</td>
                    <td style={{ padding: 10, borderBottom: "1px solid var(--border)" }}>Plan locked and ready to send</td>
                  </tr>
                  <tr>
                    <td style={{ padding: 10, borderBottom: "1px solid var(--border)" }}>6</td>
                    <td style={{ padding: 10, borderBottom: "1px solid var(--border)" }}>Send to Student & Update Backend</td>
                    <td style={{ padding: 10, borderBottom: "1px solid var(--border)" }}>System</td>
                    <td style={{ padding: 10, borderBottom: "1px solid var(--border)" }}>Progress status display</td>
                    <td style={{ padding: 10, borderBottom: "1px solid var(--border)" }}>Write finalized plan to RDS; trigger notification service</td>
                    <td style={{ padding: 10, borderBottom: "1px solid var(--border)" }}>Student receives assignment notification</td>
                  </tr>
                  <tr>
                    <td style={{ padding: 10, borderBottom: "1px solid var(--border)" }}>7</td>
                    <td style={{ padding: 10, borderBottom: "1px solid var(--border)" }}>Assessment Completion Notice</td>
                    <td style={{ padding: 10, borderBottom: "1px solid var(--border)" }}>System → Teacher</td>
                    <td style={{ padding: 10, borderBottom: "1px solid var(--border)" }}>Notification card with artifact links and rubric</td>
                    <td style={{ padding: 10, borderBottom: "1px solid var(--border)" }}>Pull assessment artifacts (S3) and attach rubric reference</td>
                    <td style={{ padding: 10, borderBottom: "1px solid var(--border)" }}>Teacher opens evaluation screen</td>
                  </tr>
                  <tr>
                    <td style={{ padding: 10 }}>8</td>
                    <td style={{ padding: 10 }}>Grade & Feedback Submission</td>
                    <td style={{ padding: 10 }}>Teacher</td>
                    <td style={{ padding: 10 }}>Grade dropdown, evidence-to-standards textarea, feedback field</td>
                    <td style={{ padding: 10 }}>POST /gate/grade → update RDS + standards mastery</td>
                    <td style={{ padding: 10 }}>Student notified with final feedback and mastery update</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Lightbox for images */}
        {lightbox.open && (
          <div
            onClick={() => setLightbox({ open: false, src: "", alt: "" })}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}
          >
            <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', padding: 8, borderRadius: 12, maxWidth: '90vw', maxHeight: '90vh' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px' }}>
                <div style={{ fontWeight: 700 }}>{lightbox.alt}</div>
                <button className="ga-btn ga-ghost" onClick={() => setLightbox({ open: false, src: "", alt: "" })}>×</button>
              </div>
              <div style={{ overflow: 'auto' }}>
                <img src={lightbox.src} alt={lightbox.alt} style={{ display: 'block', maxWidth: '88vw', maxHeight: '80vh', borderRadius: 8 }} />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}


