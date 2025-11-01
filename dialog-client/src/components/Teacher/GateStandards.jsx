import React from "react";

export default function GateStandards() {
  // Updated 6-step flow (Rev2)
  const steps = [
    { t: "Upcoming Assessments", s: "Filter by due date or student. Pick which assessment to work on." },
    { t: "Review Project and Mastery Standards", s: "See project stage/gate/checklist and mastery standards. Add / change / remove." },
    { t: "Assessment Details, Materials and Delivery", s: "Describe task, attach materials, request AI help, set delivery logistics." },
    { t: "Review & Approve Plan", s: "Preview full plan before sending." },
    { t: "Notify Student", s: "Send plan to student and log in backend." },
    { t: "Evaluation & Feedback", s: "Review artifacts, score mastery, and publish feedback." },
  ];

  const [stepIdx, setStepIdx] = React.useState(0);
  const [aiText, setAiText] = React.useState("No draft requested yet.");
  const [selectedGate, setSelectedGate] = React.useState(null);
  const [upcomingList, setUpcomingList] = React.useState([]);
  const [artifacts, setArtifacts] = React.useState([]);
  const [rubricUrl, setRubricUrl] = React.useState(null);
  const [draft, setDraft] = React.useState({});
  const [filterDue, setFilterDue] = React.useState("2025-11-10T23:59");
  const [filterStudent, setFilterStudent] = React.useState("");

  // Mock data - replace with google.script.run calls
  React.useEffect(() => {
    const mockData = {
      items: [
        {
          gate_id: "GATE-2025-1105-001",
          student: "Billy Johnson",
          unit: "Water Conservation",
          dueDate: "2025-11-05T10:00",
          status: "Upcoming",
          mastery: [
            { id: "HS.E1U1.13", pct: 20, label: "Analyze environmental data" },
            { id: "HS.E2U1.15", pct: 10, label: "Evaluate solutions for water issues" },
          ],
          project: {
            stage: "Stage 3",
            gate: "Gate 2: Science Review",
            checklist: ["Collect local usage data", "Propose conservation strategy"],
          },
        },
        {
          gate_id: "GATE-2025-1108-002",
          student: "Ariana Cruz",
          unit: "Water Rights & Policy",
          dueDate: "2025-11-08T14:00",
          status: "Draft",
          mastery: [{ id: "HS.E2U1.15", pct: 45, label: "Evaluate solutions for water issues" }],
          project: {
            stage: "Stage 2",
            gate: "Gate 1: Research Check",
            checklist: ["Summarize AZ water policy", "Find 2 credible sources"],
          },
        },
      ],
    };
    setUpcomingList(mockData.items);
  }, []);

  function selectGate(gateId) {
    const gate = upcomingList.find((i) => i.gate_id === gateId) || null;
    setSelectedGate(gate);
    setStepIdx(1);
  }

  function applyFilters() {
    // In production: google.script.run.withSuccessHandler(...).getUpcomingList({ dueBefore: filterDue, student: filterStudent })
    alert(`Filtering with dueBefore=${filterDue} and student=${filterStudent}`);
  }

  function requestAI() {
    const ctx = document.getElementById("context")?.value || "";
    // In production: google.script.run.withSuccessHandler(...).aiGenerateMaterials({ context: ctx, standards: selectedGate?.mastery || [] })
    setAiText(
      `Suggested Task: Performance task using local water data and policy analysis\n` +
        `Rubric: Data Analysis, Scientific Reasoning, Communication, Citations & Ethics\n` +
        `Delivery: In-person · 45 min\n` +
        `Needs: Chromebook + calculator`
    );
  }

  function collectDraft() {
    const newDraft = {
      assessment_type: document.getElementById("assessType")?.value || "",
      context: document.getElementById("context")?.value || "",
      mode: document.getElementById("mode")?.value || "",
      duration: document.getElementById("duration")?.value || "",
      start: document.getElementById("start")?.value || "",
      dueDate: document.getElementById("dueDate")?.value || "",
      requirements: document.getElementById("reqs")?.value || "",
      special: document.getElementById("special")?.value || "",
    };
    setDraft(newDraft);
    return newDraft;
  }

  function saveDraft() {
    const plan = collectDraft();
    // In production: google.script.run.withSuccessHandler(...).saveGateDraft({ gate: selectedGate?.gate_id, draft: plan })
    alert("Draft saved (v0.3-draft).");
  }

  function finalizeAndNotify() {
    const payload = {
      gate_id: selectedGate?.gate_id,
      student: selectedGate?.student,
      draft: collectDraft(),
      message: document.getElementById("studentMsg")?.value || "",
    };
    // In production: google.script.run.withSuccessHandler(...).finalizeGatePlan(payload)
    alert("Plan sent to student. Gate locked.");
    // Load artifacts for step 6
    const mockArtifacts = ["report.pdf", "slides.pptx", "notes.md"];
    setArtifacts(mockArtifacts);
    setRubricUrl("https://example.com/rubric.pdf");
    setStepIdx(5);
  }

  function publishFeedback() {
    const payload = {
      gate_id: selectedGate?.gate_id,
      grade: document.getElementById("grade")?.value,
      evidence: document.getElementById("evidence")?.value,
      feedback: document.getElementById("feedback")?.value,
    };
    // In production: google.script.run.withSuccessHandler(...).submitFinalGrade(payload)
    alert("Feedback published. Student notified.");
  }

  function requestRevision() {
    const payload = {
      gate_id: selectedGate?.gate_id,
      grade: "Revision Requested",
      evidence: document.getElementById("evidence")?.value,
      feedback: document.getElementById("feedback")?.value,
    };
    // In production: google.script.run.withSuccessHandler(...).submitFinalGrade(payload)
    alert("Revision requested. Student notified.");
  }

  function addStandard() {
    alert("Add standard flow (search standards, append to gate_standards, write Draft).");
  }

  function editStandard(id) {
    alert(`Edit standard ${id} (update mastery target, etc.).`);
  }

  function removeStandard(id) {
    alert(`Remove standard ${id} from this gate.`);
  }

  function openArtifacts() {
    artifacts.forEach((a) => window.open(`https://example.com/${a}`, "_blank"));
  }

  function openRubric() {
    if (rubricUrl) window.open(rubricUrl, "_blank");
  }

  return (
    <div className="ga-dialog" role="dialog" aria-label="Gate Assessment Planner (Rev2)">
      <style>{`
        :root{--ink:#111827;--muted:#6b7280;--border:#e5e7eb;--bg:#ffffff;--accent:#6B2F5C;--ok:#16a34a;--warn:#f59e0b;--err:#dc2626}
        .ga-dialog{width:100%;max-width:980px;margin:24px auto;border:1px solid var(--border);border-radius:16px;overflow:hidden;box-shadow:0 8px 24px rgba(0,0,0,.06);background:#fff;height:86vh;display:grid;grid-template-rows:auto 1fr}
        .ga-topbar{display:flex;align-items:center;gap:10px;padding:10px 14px;border-bottom:1px solid var(--border);background:#fafafa}
        .ga-pill{background:#fef3c7;border:1px dashed #f59e0b;color:#92400e;padding:2px 8px;border-radius:999px;font-size:11px}
        .ga-content{display:grid;grid-template-columns:260px 1fr;height:100%;overflow:hidden}
        .ga-aside{border-right:1px solid var(--border);padding:14px 12px;background:#fbfbff;display:flex;flex-direction:column;min-height:0;overflow:hidden}
        .ga-header{display:flex;align-items:center;gap:10px;margin-bottom:12px;flex-shrink:0}
        .ga-title{font-weight:600}
        .ga-stepper{display:flex;flex-direction:column;gap:6px;flex:1 1 auto;overflow-y:scroll;overflow-x:hidden;padding-right:8px;min-height:0}
        .ga-stepper::-webkit-scrollbar{width:8px}
        .ga-stepper::-webkit-scrollbar-track{background:#f0f0f0;border-radius:4px}
        .ga-stepper::-webkit-scrollbar-thumb{background:#c1c1c1;border-radius:4px}
        .ga-stepper::-webkit-scrollbar-thumb:hover{background:#a8a8a8}
        .ga-step{display:flex;flex-direction:column;gap:4px;padding:8px;border-radius:10px;cursor:pointer;border:1px solid transparent}
        .ga-step.active{background:#f5f3ff;border:1px solid #e9d5ff}
        .ga-step-head{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:600;color:var(--ink)}
        .ga-bubble{width:22px;height:22px;border-radius:999px;display:grid;place-items:center;background:#fff;border:1px solid var(--border);font-size:12px;font-weight:600;color:var(--ink)}
        .ga-step.active .ga-bubble{background:var(--accent);color:#fff;border-color:var(--accent)}
        .ga-step-sub{font-size:11px;color:var(--muted);line-height:1.3}
        .ga-main{padding:16px;overflow:auto}
        .ga-h2{font-size:18px;margin:0 0 6px;font-weight:600;color:var(--ink)}
        .ga-sub{font-size:12px;color:var(--muted);margin-bottom:12px}
        .ga-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
        .ga-field{display:flex;flex-direction:column;gap:6px}
        .ga-field label{font-size:12px;color:#374151}
        .ga-input, .ga-select, .ga-textarea{border:1px solid var(--border);border-radius:10px;padding:10px;font-size:13px;width:100%}
        .ga-textarea{min-height:100px}
        .ga-card{border:1px solid var(--border);border-radius:12px;padding:12px;background:#fff}
        .ga-card-head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px}
        .ga-card-head-left{font-weight:600;font-size:13px;color:var(--ink);line-height:1.3}
        .ga-badge{display:inline-block;font-size:11px;padding:2px 8px;border-radius:999px;background:#eef2ff;border:1px solid #e0e7ff;color:#374151}
        .ga-mini-badge{display:inline-block;font-size:10px;padding:2px 6px;border-radius:999px;background:#f3f4f6;border:1px solid #e5e7eb;color:#4b5563;line-height:1.2}
        .ga-actions{display:flex;justify-content:space-between;gap:8px;position:sticky;bottom:0;background:#fff;border-top:1px solid var(--border);padding:12px;margin-top:10px;z-index:20}
        .ga-btn{border:0;border-radius:10px;padding:10px 14px;cursor:pointer;font-size:13px;line-height:1.2}
        .ga-ghost{background:#fff;border:1px solid var(--border)}
        .ga-primary{background:var(--accent);color:#fff}
        .ga-success{background:var(--ok);color:#fff}
        .ga-danger{background:var(--err);color:#fff}
        .ga-clean{list-style:disc;margin:0 0 0 1.1rem;padding:0;font-size:13px;color:var(--ink)}
        .ga-clean li{margin-bottom:4px}
        .ga-flex-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
        .ga-two-col-tight{display:grid;grid-template-columns:1fr 1fr;gap:8px}
        .ga-std-row{display:flex;justify-content:space-between;align-items:flex-start;border:1px solid var(--border);border-radius:10px;padding:8px 10px;margin-bottom:6px;font-size:12px}
        .ga-std-left{font-weight:500;color:var(--ink)}
        .ga-std-right{font-size:11px;color:var(--muted);text-align:right}
        .ga-std-actions{display:flex;gap:6px;margin-top:6px}
        .ga-std-actions button{font-size:11px;padding:4px 8px;border-radius:8px}
        .ga-tiny{font-size:11px;color:var(--muted);line-height:1.3}
      `}</style>

      <div className="ga-topbar">
        <span className="ga-pill">Preview (Rev2)</span>
        <div style={{ fontSize: 12, color: "var(--muted)" }}>
          This simulates the updated Google Apps Script dialog and step flow.
        </div>
      </div>

      <div className="ga-content">
        <aside className="ga-aside">
          <div className="ga-header">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ width: 28, height: 28, stroke: "var(--accent)" }}
            >
              <path d="M9 18h6" />
              <path d="M10 22h4" />
              <path d="M2 12a10 10 0 1 0 20 0A10 10 0 0 0 2 12Z" />
              <path d="M8 10a4 4 0 1 1 8 0c0 2-1 3-3 4v2h-2v-2c-2-1-3-2-3-4Z" />
            </svg>
            <div className="ga-title">Gate Assessment</div>
          </div>

          <div className="ga-stepper">
            {steps.map((s, i) => (
              <div
                key={s.t}
                className={`ga-step ${i === stepIdx ? "active" : ""}`}
                onClick={() => setStepIdx(i)}
              >
                <div className="ga-step-head">
                  <div className="ga-bubble">{i + 1}</div>
                  <div>{s.t}</div>
                </div>
                <div className="ga-step-sub">{s.s}</div>
              </div>
            ))}
          </div>

          <div style={{ fontSize: 10, color: "var(--muted)", textAlign: "center", paddingTop: 8, borderTop: "1px solid var(--border)" }}>
            Select a step to jump
          </div>
        </aside>

        <main className="ga-main">
          <h2 className="ga-h2">
            {stepIdx + 1}) {steps[stepIdx].t}
          </h2>
          <div className="ga-sub">{steps[stepIdx].s}</div>

          <div>
            {/* STEP 1: Upcoming Assessments */}
            {stepIdx === 0 && (
              <>
                <div className="ga-card" style={{ marginBottom: 12 }}>
                  <div className="ga-grid">
                    <div className="ga-field">
                      <label>Filter by due before</label>
                      <input
                        type="datetime-local"
                        id="filterDue"
                        className="ga-input"
                        value={filterDue}
                        onChange={(e) => setFilterDue(e.target.value)}
                      />
                    </div>
                    <div className="ga-field">
                      <label>Filter by student</label>
                      <input
                        type="text"
                        id="filterStudent"
                        className="ga-input"
                        placeholder="Type student name"
                        value={filterStudent}
                        onChange={(e) => setFilterStudent(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="ga-flex-row" style={{ marginTop: 10 }}>
                    <button className="ga-btn ga-ghost" style={{ fontSize: 12 }} onClick={applyFilters}>
                      Apply Filters
                    </button>
                    <div className="ga-tiny">Choose an assessment below and click "Select" to proceed.</div>
                  </div>
                </div>

                {upcomingList.map((item) => {
                  const d = new Date(item.dueDate);
                  const masteryList = item.mastery.map((m) => (
                    <div key={m.id} className="ga-tiny">
                      <b>{m.id}</b> {m.pct}% · {m.label}
                    </div>
                  ));
                  const checklistList = item.project.checklist.map((line, idx) => <li key={idx}>{line}</li>);

                  return (
                    <div key={item.gate_id} className="ga-card" style={{ marginBottom: 10 }}>
                      <div className="ga-card-head">
                        <div className="ga-card-head-left">
                          <div>
                            {item.student} <span className="ga-mini-badge">{item.status}</span>
                          </div>
                          <div className="ga-tiny">
                            Due {d.toLocaleDateString()} {d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </div>
                          <div className="ga-tiny">{item.unit}</div>
                        </div>
                        <button className="ga-btn ga-ghost" style={{ fontSize: 12 }} onClick={() => selectGate(item.gate_id)}>
                          Select
                        </button>
                      </div>
                      <div className="ga-two-col-tight">
                        <div>
                          <div className="ga-tiny" style={{ fontWeight: 600, color: "var(--ink)" }}>
                            Mastery Snapshot
                          </div>
                          {masteryList}
                        </div>
                        <div>
                          <div className="ga-tiny" style={{ fontWeight: 600, color: "var(--ink)" }}>
                            Project
                          </div>
                          <div className="ga-tiny">
                            {item.project.stage} · {item.project.gate}
                          </div>
                          <ul className="ga-clean" style={{ marginTop: 4 }}>{checklistList}</ul>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}

            {/* STEP 2: Review Project and Mastery Standards */}
            {stepIdx === 1 && (
              <>
                {!selectedGate ? (
                  <div className="ga-card">
                    <div className="ga-tiny">No assessment selected yet. Go back to step 1 and choose one.</div>
                  </div>
                ) : (
                  <div className="ga-grid">
                    <div className="ga-card">
                      <div className="ga-card-head">
                        <div className="ga-card-head-left">Project Details</div>
                      </div>
                      <div className="ga-tiny">
                        <b>Stage:</b> {selectedGate.project.stage}
                      </div>
                      <div className="ga-tiny">
                        <b>Gate:</b> {selectedGate.project.gate}
                      </div>
                      <div className="ga-tiny" style={{ marginTop: 6, fontWeight: 600, color: "var(--ink)" }}>
                        Gate Checklist
                      </div>
                      <ul className="ga-clean" style={{ marginTop: 4 }}>
                        {selectedGate.project.checklist.map((line, idx) => (
                          <li key={idx}>{line}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="ga-card">
                      <div className="ga-card-head">
                        <div className="ga-card-head-left">Mastery Standards</div>
                        <button className="ga-btn ga-ghost" style={{ fontSize: 11 }} onClick={addStandard}>
                          Add Standard
                        </button>
                      </div>
                      {selectedGate.mastery.map((m) => (
                        <div key={m.id} className="ga-std-row">
                          <div className="ga-std-left">
                            {m.id} <span style={{ color: "var(--muted)", fontWeight: 400 }}>({m.pct}%)</span>
                            <div className="ga-tiny">{m.label}</div>
                          </div>
                          <div className="ga-std-right">
                            <div className="ga-std-actions">
                              <button className="ga-btn ga-ghost" style={{ fontSize: 10, padding: "4px 6px" }} onClick={() => editStandard(m.id)}>
                                Edit
                              </button>
                              <button className="ga-btn ga-ghost" style={{ fontSize: 10, padding: "4px 6px" }} onClick={() => removeStandard(m.id)}>
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* STEP 3: Assessment Details, Materials and Delivery */}
            {stepIdx === 2 && (
              <div className="ga-grid">
                <div className="ga-card">
                  <div className="ga-card-head">
                    <div className="ga-card-head-left">Assessment Details & Materials</div>
                  </div>
                  <div className="ga-field">
                    <label>Assessment Type</label>
                    <select id="assessType" className="ga-select">
                      <option>Performance Task</option>
                      <option>Oral Defense</option>
                      <option>Project Artifact Review</option>
                      <option>Written Exam</option>
                    </select>
                  </div>
                  <div className="ga-field">
                    <label>Context / Objectives</label>
                    <textarea id="context" className="ga-textarea" placeholder="What are you assessing? Why now? Any constraints?" />
                  </div>
                  <div className="ga-field">
                    <label>Materials</label>
                    <div className="ga-flex-row">
                      <button className="ga-btn ga-ghost" style={{ fontSize: 12 }} onClick={() => alert("Drive Picker opens here in production.")}>
                        Attach Files
                      </button>
                      <button className="ga-btn ga-ghost" style={{ fontSize: 12 }} onClick={requestAI}>
                        Ask AI to Draft Materials
                      </button>
                    </div>
                    <div className="ga-tiny">Rubrics, prompts, exemplars.</div>
                  </div>
                  <div className="ga-field">
                    <label>AI Suggestions</label>
                    <pre
                      className="ga-tiny"
                      style={{ whiteSpace: "pre-wrap", border: "1px solid var(--border)", borderRadius: 8, padding: 8, minHeight: 60 }}
                    >
                      {aiText}
                    </pre>
                  </div>
                </div>
                <div className="ga-card">
                  <div className="ga-card-head">
                    <div className="ga-card-head-left">Delivery Plan</div>
                  </div>
                  <div className="ga-two-col-tight">
                    <div className="ga-field">
                      <label>Delivery Mode</label>
                      <select id="mode" className="ga-select">
                        <option>In-person</option>
                        <option>Online (proctored)</option>
                        <option>Online (asynchronous)</option>
                      </select>
                    </div>
                    <div className="ga-field">
                      <label>Duration (minutes)</label>
                      <input type="text" id="duration" className="ga-input" placeholder="45" />
                    </div>
                  </div>
                  <div className="ga-two-col-tight">
                    <div className="ga-field">
                      <label>Start</label>
                      <input type="datetime-local" id="start" className="ga-input" />
                    </div>
                    <div className="ga-field">
                      <label>Due / Final Submission</label>
                      <input type="datetime-local" id="dueDate" className="ga-input" />
                    </div>
                  </div>
                  <div className="ga-field">
                    <label>Requirements</label>
                    <textarea id="reqs" className="ga-textarea" placeholder="Devices, materials, accommodations, proctoring, group/individual, etc." />
                  </div>
                  <div className="ga-field">
                    <label>Special Conditions</label>
                    <textarea id="special" className="ga-textarea" placeholder="Make‑up policy, late submissions, extensions, etc." />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: Review & Approve Plan */}
            {stepIdx === 3 && (
              <div className="ga-card">
                <div className="ga-card-head">
                  <div className="ga-card-head-left">Plan Preview</div>
                </div>
                <ul className="ga-clean">
                  <li>
                    <b>Student:</b> {selectedGate ? selectedGate.student : "[not selected]"}
                  </li>
                  <li>
                    <b>Assessment Type:</b> {draft.assessment_type || document.getElementById("assessType")?.value || "(not set)"}
                  </li>
                  <li>
                    <b>Standards:</b> {selectedGate?.mastery.map((m) => m.id).join(", ") || "(none)"}
                  </li>
                  <li>
                    <b>Start:</b> {draft.start || document.getElementById("start")?.value || "(none)"} · <b>Due:</b>{" "}
                    {draft.dueDate || document.getElementById("dueDate")?.value || "(none)"}
                  </li>
                  <li>
                    <b>Mode:</b> {draft.mode || document.getElementById("mode")?.value || "(none)"} · <b>Duration:</b>{" "}
                    {draft.duration || document.getElementById("duration")?.value || "(none)"}
                  </li>
                  <li>
                    <b>Requirements:</b> {draft.requirements || document.getElementById("reqs")?.value || "(none)"}
                  </li>
                  <li>
                    <b>Special Conditions:</b> {draft.special || document.getElementById("special")?.value || "(none)"}
                  </li>
                  <li>
                    <b>Context:</b> {draft.context || document.getElementById("context")?.value || "(none)"}
                  </li>
                </ul>
                <div className="ga-tiny" style={{ marginTop: 8 }}>If this looks good, proceed to Notify Student.</div>
              </div>
            )}

            {/* STEP 5: Notify Student */}
            {stepIdx === 4 && (
              <div className="ga-card">
                <div className="ga-card-head">
                  <div className="ga-card-head-left">Notify Student</div>
                </div>
                <div className="ga-tiny" style={{ marginBottom: 8 }}>
                  This will write plan details to the database, lock the checklist, and send instructions to the student.
                </div>
                <div className="ga-field">
                  <label>Message to Student</label>
                  <textarea id="studentMsg" className="ga-textarea" placeholder="Hi Billy, here is your Gate Assessment plan..." />
                </div>
                <div className="ga-flex-row" style={{ marginTop: 10 }}>
                  <button className="ga-btn ga-success" style={{ fontSize: 12 }} onClick={finalizeAndNotify}>
                    Send & Lock Plan
                  </button>
                  <div className="ga-tiny">Current Gate ID: {selectedGate?.gate_id || "GATE-2025-1105-001"}</div>
                </div>
              </div>
            )}

            {/* STEP 6: Evaluation & Feedback */}
            {stepIdx === 5 && (
              <div className="ga-grid">
                <div className="ga-card">
                  <div className="ga-card-head">
                    <div className="ga-card-head-left">Evidence & Artifacts</div>
                  </div>
                  <div className="ga-tiny">Submitted Work</div>
                  <ul className="ga-clean" style={{ marginTop: 4 }}>
                    {artifacts.length > 0 ? artifacts.map((a, idx) => <li key={idx}>{a}</li>) : <li>No artifacts yet</li>}
                  </ul>
                  <div className="ga-flex-row" style={{ marginTop: 8 }}>
                    <button className="ga-btn ga-ghost" style={{ fontSize: 12 }} onClick={openArtifacts}>
                      Open All
                    </button>
                    <button className="ga-btn ga-ghost" style={{ fontSize: 12 }} onClick={openRubric}>
                      Rubric
                    </button>
                  </div>
                </div>
                <div className="ga-card">
                  <div className="ga-card-head">
                    <div className="ga-card-head-left">Evaluation & Feedback</div>
                  </div>
                  <div className="ga-field">
                    <label>Grade</label>
                    <select id="grade" className="ga-select">
                      <option>A</option>
                      <option>B</option>
                      <option>C</option>
                      <option>D</option>
                      <option>Incomplete</option>
                    </select>
                  </div>
                  <div className="ga-field">
                    <label>Evidence → Standards Mapping</label>
                    <textarea id="evidence" className="ga-textarea" placeholder="Describe how this work meets each mastery standard" />
                  </div>
                  <div className="ga-field">
                    <label>Feedback to Student</label>
                    <textarea id="feedback" className="ga-textarea" placeholder="Strengths, next steps, mastery guidance" />
                  </div>
                  <div className="ga-flex-row">
                    <button className="ga-btn ga-success" style={{ fontSize: 12 }} onClick={publishFeedback}>
                      Publish Feedback
                    </button>
                    <button className="ga-btn ga-danger" style={{ fontSize: 12 }} onClick={requestRevision}>
                      Request Revision
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="ga-actions">
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button className="ga-btn ga-ghost" onClick={() => setStepIdx(Math.max(0, stepIdx - 1))}>
                Back
              </button>
              <button className="ga-btn ga-ghost" onClick={saveDraft}>
                Save Draft
              </button>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {stepIdx < steps.length - 1 && stepIdx !== 4 && (
                <button className="ga-btn ga-primary" onClick={() => setStepIdx(Math.min(steps.length - 1, stepIdx + 1))}>
                  Next
                </button>
              )}
              {stepIdx === 4 && (
                <button className="ga-btn ga-success" onClick={finalizeAndNotify}>
                  Send Notification
                </button>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
