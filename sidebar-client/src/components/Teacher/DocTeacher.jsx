import "./Docteacher.css";
import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";

export default function Docteacher({ teacherEmail = "teacher@example.org" }) {
  // Sections to switch between
  const tabs = [
    { key: "inbox", label: "Inbox", sub: "Under Review" },
    { key: "rubrics", label: "Rubrics & Gates", sub: "Step-by-step" },
    { key: "calendar", label: "Calendar", sub: "Scheduling" },
    { key: "comments", label: "Comments", sub: "Canned + notes" },
    { key: "analytics", label: "Analytics", sub: "SLA & trends" },
  ];
  const [active, setActive] = useState("inbox");

  // --- Mock data (add subject & grade) ---
  const [rows, setRows] = useState([
    { id: "GI-1027", student: "Jacob Lee",      type: "gate_item", title: "Gate: Prep – Water Project", state: "UNDER_REVIEW", subject: "Science",        grade: "9-10"  },
    { id: "TSK-7841", student: "Elizabeth Diaz", type: "task",      title: "Cost model v2",              state: "UNDER_REVIEW", subject: "Math",           grade: "11-12" },
    { id: "RES-3321", student: "Noah Patel",     type: "resource",  title: "Annotated bibliography",     state: "UNDER_REVIEW", subject: "English",        grade: "HS"    },
    { id: "TSK-7921", student: "Maya Chen",      type: "task",      title: "Data collection sheet",      state: "UNDER_REVIEW", subject: "Geography",      grade: "9"     },
    { id: "GI-1029",  student: "Liam Ortiz",     type: "gate_item", title: "Gate: Schedule – Review",    state: "UNDER_REVIEW", subject: "Social Studies", grade: "10"    },
  ]);

  // Example fetch from Apps Script
  // useEffect(() => {
  //   const run = window?.google?.script?.run;
  //   if (!run) return;
  //   run.withSuccessHandler((serverRows) => setRows(serverRows || []))
  //      .withFailureHandler(console.error)
  //      .getItems({ state: "UNDER_REVIEW" });
  // }, []);

  // --- Filters (Subject, Grade, Search) ---
  const [fSubject, setFSubject] = useState("all");
  const [fGrade, setFGrade] = useState("all");
  const [fSearch, setFSearch] = useState("");

  const filtered = useMemo(() => {
    const q = fSearch.trim().toLowerCase();
    return rows.filter((r) => {
      const bySubject = fSubject === "all" || (r.subject || "").toLowerCase() === fSubject.toLowerCase();
      const byGrade   = fGrade   === "all" || (r.grade   || "").toLowerCase() === fGrade.toLowerCase();
      const bySearch  = !q || `${r.student} ${r.title} ${r.type} ${r.subject || ""} ${r.grade || ""}`.toLowerCase().includes(q);
      return bySubject && byGrade && bySearch;
    });
  }, [rows, fSubject, fGrade, fSearch]);

  // --- Selection ---
  const [selected, setSelected] = useState(() => new Set());
  const allChecked = filtered.length > 0 && filtered.every((r) => selected.has(r.id));
  const toggleAll = () => {
    const next = new Set(selected);
    if (allChecked) filtered.forEach((r) => next.delete(r.id));
    else filtered.forEach((r) => next.add(r.id));
    setSelected(next);
  };
  const toggleOne = (id) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  // --- Toast ---
  const [toast, setToast] = useState("");
  const toastTimer = useRef(null);
  const showToast = useCallback((msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 1600);
  }, []);
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  // --- Modal ---
  const [modalOpen, setModalOpen] = useState(false);
  const [modalItem, setModalItem] = useState(null);
  const openModal = (item) => { setModalItem(item); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setModalItem(null); };

  // --- Rubric meters (static demo) ---
  const [rubricVals, setRubricVals] = useState({ align: 0, evidence: 0, clarity: 0, complete: 0 });
  const setMeter = (key, value) => setRubricVals((p) => ({ ...p, [key]: value }));

  // --- Local comment states ---
  const [compose, setCompose] = useState("");   // Comments tab
  const [comment, setComment] = useState("");   // Modal textarea

  // --- Toolbar actions (mock) ---
  const getSelectedItems = () => rows.filter((r) => selected.has(r.id));
  const requireSelection = (fn) => {
    const items = getSelectedItems();
    if (!items.length) return showToast("Select at least one item.");
    fn(items);
  };
  const onApprove = () => requireSelection((items) => showToast(`Approved ${items.length} item(s).`));
  const onDecline = () => requireSelection((items) => showToast(`Declined ${items.length} item(s).`));
  const onRequestRev = () => requireSelection((items) => showToast(`Requested revision on ${items.length} item(s).`));
  const onRefresh = () => showToast("Refreshed.");

  // --- Row renderer ---
  const Row = ({ r }) => (
    <tr onClick={(e) => { if ((e.target).type !== "checkbox") openModal(r); }}>
      <td style={{ width: 26 }}>
        <input
          type="checkbox"
          className="rowChk"
          aria-label={`Select ${r.title}`}
          checked={selected.has(r.id)}
          onChange={() => toggleOne(r.id)}
          onClick={(e) => e.stopPropagation()}
        />
      </td>
      <td>{r.student}</td>
      <td>{r.type}</td>
      <td>{r.subject}</td>
      <td>{r.grade}</td>
      <td className="title-cell">{r.title}</td>
      <td><span className="state under_review">{r.state}</span></td>
    </tr>
  );

  return (
    <div className="wrap">
      {/* Header */}
      <div className="header">
        <div className="logo" aria-hidden="true" />
        <div className="title">Teacher Project Queue</div>
        <div className="sub" id="teacherName">Signed in as: {teacherEmail}</div>
      </div>

      {/* Section Switcher (dropdown replaces tabs) */}
      <div className="section-switch">
        <label htmlFor="sectionSelect">Section</label>
        <select
          id="sectionSelect"
          value={active}
          onChange={(e) => setActive(e.target.value)}
        >
          {tabs.map((t) => (
            <option key={t.key} value={t.key}>
              {t.label} — {t.sub}
            </option>
          ))}
        </select>
      </div>

      {/* INBOX */}
      {active === "inbox" && (
        <section className="panel" role="tabpanel">
          <div className="panel-head">
            <h3>Review Queue <span className="chip"><span>State:</span><strong> UNDER_REVIEW</strong></span></h3>
            <span className="badge" id="badgeSelected">{selected.size} selected</span>
          </div>

          {/* Filters: Subject, Grade, Search */}
          <div className="filters">
            <div className="field">
              <label htmlFor="fSubject">Subject</label>
              <select id="fSubject" value={fSubject} onChange={(e) => setFSubject(e.target.value)}>
                <option value="all">All subjects</option>
                <option>Math</option>
                <option>Science</option>
                <option>Social Studies</option>
                <option>Geography</option>
                <option>History</option>
                <option>English</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="fGrade">Grade</label>
              <select id="fGrade" value={fGrade} onChange={(e) => setFGrade(e.target.value)}>
                <option value="all">All grades</option>
                <option>HS</option>
                <option>9-12</option>
                <option>9-10</option>
                <option>11-12</option>
                <option>9</option>
                <option>10</option>
              </select>
            </div>
            <div className="field" style={{ gridColumn: "1 / -1" }}>
              <label htmlFor="fSearch">Search</label>
              <input id="fSearch" type="text" placeholder="Student, title, tag…" value={fSearch} onChange={(e) => setFSearch(e.target.value)} />
            </div>
          </div>

        
          {/* Table (with horizontal scroll) */}
          <div className="panel-body"> 
          <div className="table" role="region" aria-label="Items under review">
            <table>
              <thead>
                <tr>
                  <th style={{ width: 26 }}>
                    <input type="checkbox" id="chkAll" aria-label="Select all" checked={allChecked} onChange={toggleAll} />
                  </th>
                  <th>Student</th>
                  <th>Type</th>
                  <th>Subject</th>
                  <th>Grade</th>
                  <th>Title</th>
                  <th>State</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (<Row key={r.id} r={r} />))}
              </tbody>
            </table>
          </div>
          </div>

            {/* Actions */}
          <div className="toolbar">
            <div className="btn-group">
              <button className="btn ok" onClick={onApprove}>Approve</button>
              <button className="btn warn" onClick={onDecline}>Decline</button>
              <button className="btn primary" onClick={onRequestRev}>Request Revision</button>
            </div>
            <span className="count">Total: <strong id="totalCount">{filtered.length}</strong></span>
          </div>

        </section>
      )}


      {/* RUBRICS & GATES */}
      {active === "rubrics" && (
        <section className="panel" role="tabpanel">
          <div className="panel-head">
            <h3>Rubrics & Gate Steps</h3>
            <span className="chip">Step: <strong>Prep</strong></span>
          </div>
          <div className="stack" style={{ padding: "10px 12px" }}>
            <div className="card">
              <div className="inline" style={{ justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontWeight: 700 }}>Selected Item</div>
                  <div className="muted">{selected.size ? `${rows.find(r=>selected.has(r.id))?.title} — ${rows.find(r=>selected.has(r.id))?.student}` : "None"}</div>
                </div>
                <button className="btn" onClick={() => {
                  if (!selected.size) return showToast("Select one item first.");
                  const first = rows.find(r=>selected.has(r.id));
                  openModal(first);
                }}>Open Rubric</button>
              </div>
            </div>

            <div className="card">
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Gate Stepper</div>
              <div className="inline" style={{ flexWrap: "wrap", gap: 8 }}>
                {['Prep','Schedule','Notify','Complete','Review/Evaluate','Final Report','Feedback/Reflection'].map((s) => (
                  <span key={s} className="chip">{s}</span>
                ))}
              </div>
            </div>

            <div className="card">
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Required Fields</div>
              <div className="stack">
                <div className="field"><label>Reviewer</label><input type="text" placeholder="teacher@example.org" defaultValue={teacherEmail} /></div>
                <div className="field"><label>Due Date</label><input type="text" placeholder="YYYY-MM-DD" /></div>
                <div className="field"><label>Notes</label><textarea rows={3} placeholder="Internal notes" /></div>
                <div className="inline" style={{ justifyContent: "flex-end" }}>
                  <button className="btn primary" onClick={() => showToast("Step saved")}>Save Step</button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* CALENDAR */}
      {active === "calendar" && (
        <section className="panel" role="tabpanel">
          <div className="panel-head">
            <h3>Scheduling Assistant</h3>
            <span className="chip">Proposes slots</span>
          </div>
          <div className="stack" style={{ padding: "10px 12px" }}>
            <div className="card">
              <div className="inline" style={{ justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontWeight: 700 }}>Proposed Times</div>
                  <div className="muted">Synced from Google Calendar (placeholder)</div>
                </div>
                <button className="btn" onClick={() => showToast("Calendar refreshed")}>Refresh</button>
              </div>
              <div className="stack" style={{ marginTop: 8 }}>
                <label className="inline"><input type="radio" name="slot" /> Wed 10/08 10:30–10:50</label>
                <label className="inline"><input type="radio" name="slot" /> Wed 10/08 11:10–11:30</label>
                <label className="inline"><input type="radio" name="slot" /> Thu 10/09 09:00–09:20</label>
              </div>
              <div className="inline" style={{ justifyContent: "flex-end", marginTop: 8 }}>
                <button className="btn primary" onClick={() => showToast("Invite sent")}>Send Invite</button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* COMMENTS */}
      {active === "comments" && (
        <section className="panel" role="tabpanel">
          <div className="panel-head">
            <h3>Canned Comments</h3>
            <span className="chip">Merge fields</span>
          </div>
          <div className="stack" style={{ padding: "10px 12px" }}>
            <div className="card">
              <div style={{ fontWeight: 700 }}>Templates</div>
              <div className="stack" style={{ marginTop: 6 }}>
                <button className="btn" onClick={() => setCompose("Great work – proceed to the next step. ✅")}>Great</button>
                <button className="btn" onClick={() => setCompose("Please revise: clarify sources and attach citations.")}>Revise</button>
                <button className="btn" onClick={() => setCompose("Please propose 2 time slots for your gate review.")}>Schedule</button>
              </div>
            </div>
            <div className="card">
              <div style={{ fontWeight: 700 }}>Compose</div>
              <div className="stack" style={{ marginTop: 6 }}>
                <textarea rows={4} placeholder="Type feedback…" value={compose} onChange={(e) => setCompose(e.target.value)} />
                <div className="inline" style={{ justifyContent: "flex-end", gap: 8 }}>
                  <button className="btn" onClick={() => showToast("Preview opened")}>Preview</button>
                  <button className="btn primary" onClick={() => showToast("Sent to student")}>Send to Student</button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ANALYTICS */}
      {active === "analytics" && (
        <section className="panel" role="tabpanel">
          <div className="panel-head">
            <h3>Review Analytics</h3>
            <span className="chip">Last 14 days</span>
          </div>
          <div className="stack" style={{ padding: "10px 12px" }}>
            <div className="card">
              <div className="inline" style={{ justifyContent: "space-between" }}>
                <div>
                  <div className="muted">Median Review Time</div>
                  <div style={{ fontSize: 22, fontWeight: 800 }}>2.4h</div>
                </div>
                <div>
                  <div className="muted">Decline Rate</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "var(--warn)" }}>18%</div>
                </div>
                <div>
                  <div className="muted">Throughput</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "var(--ok)" }}>126</div>
                </div>
              </div>
            </div>
            <div className="card">
              <div style={{ fontWeight: 700 }}>Top Decline Reasons</div>
              <ul className="muted">
                <li>Missing citations</li>
                <li>Insufficient evidence</li>
                <li>Wrong rubric attached</li>
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="modal-backdrop" aria-hidden={false} onClick={(e) => { if (e.currentTarget === e.target) closeModal(); }}>
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
            <header>
              <div id="modalTitle" style={{ fontWeight: 700 }}>Review Item</div>
              <button className="btn" onClick={closeModal}>×</button>
            </header>
            <div className="body">
              <div className="grid">
                <div className="muted">Student</div>
                <div>{modalItem?.student ?? "—"}</div>
                <div className="muted">Type</div>
                <div>{modalItem?.type ?? "—"}</div>
                <div className="muted">Subject</div>
                <div>{modalItem?.subject ?? "—"}</div>
                <div className="muted">Grade</div>
                <div>{modalItem?.grade ?? "—"}</div>
                <div className="muted">Title</div>
                <div>{modalItem?.title ?? "—"}</div>
              </div>
              <div className="rubric">
                <div style={{ fontWeight: 700 }}>Rubric</div>
                <div className="rb"><div>Alignment to Standard</div><meter min={0} max={4} value={rubricVals.align} /></div>
                <div className="rb"><div>Evidence & Sources</div><meter min={0} max={4} value={rubricVals.evidence} /></div>
                <div className="rb"><div>Clarity & Organization</div><meter min={0} max={4} value={rubricVals.clarity} /></div>
                <div className="rb"><div>Completeness</div><meter min={0} max={4} value={rubricVals.complete} /></div>
              </div>
              <div className="field">
                <label>Comment to Student</label>
                <textarea rows={3} placeholder="Share strengths, next steps, and specifics." value={comment} onChange={(e) => setComment(e.target.value)} />
              </div>
            </div>
            <footer>
              <button className="btn warn" onClick={() => { showToast("Declined with feedback."); closeModal(); }}>Decline</button>
              <button className="btn" onClick={() => { showToast("Revision requested."); closeModal(); }}>Request Revision</button>
              <button className="btn ok" onClick={() => { showToast("Approved with rubric."); closeModal(); }}>Approve</button>
            </footer>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="toast">{toast}</div>
      )}
    </div>
  );
}