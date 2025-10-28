import React, { useState, useCallback } from "react";
import {
  ClipboardList,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
} from "lucide-react";
import "../styles/Workshop.css";
import standardsData from "../data/learning-standards.json";
import Select from "react-select";

const STEPS = ["Topic", "Standards", "Group", "Artifacts", "Review", "Results"];

export default function SidebarWorkshop() {

  
  const [isExpanded, setIsExpanded] = useState(false);
  const [step, setStep] = useState(0);
  const [copySuccess, setCopySuccess] = useState("");


  const [procStatus, setProcStatus] = useState("idle");

  const [processed, setProcessed] = useState(null);

  const [data, setData] = useState({
    topic: "",
    duration: 20,
    standards: "",
    standard: "",
    grade: "",
    subject: "",
    keywords: "",
    students: "",
    demographics: [],
    personas: [],
    notes: "",
    artifacts: [],
    resources: [], 
  });

 const formatWorkshopForCopy = useCallback((processed, data) => {
    if (!processed?.body?.action_response) return "";

    const { artifacts } = processed.body.action_response;

    let formatted = `📦 Workshop Results\n\n`;

    Object.entries(artifacts)
      .filter(([k]) =>
        (data.artifacts || [])
          .map(a => a.toLowerCase().replace(/\s+/g, "_"))
          .includes(k.toLowerCase().replace(/\s+/g, "_"))
      )
      .forEach(([k, v]) => {
        const fileName = v.download_url.split("/").pop().split("?")[0]; // clean name
        formatted += `• **${k}** → [${fileName}](${v.download_url})\n\n`;
      });

    return formatted;
  }, []);


  const toggleExpanded = () => setIsExpanded(!isExpanded);
  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const prev = () => setStep((s) => Math.max(s - 1, 0));
  const setField = (k) => (v) => setData((d) => ({ ...d, [k]: v }));
  const toggleInArray = (k, value) =>
    setData((d) => {
      const set = new Set(d[k]);
      set.has(value) ? set.delete(value) : set.add(value);
      return { ...d, [k]: Array.from(set) };
    });

  // Header status helpers (mirrors Advice styling)
  const getWSStatusClass = () => {
    if (procStatus === "processing") return "text-yellow";
    if (procStatus === "success") return "text-green";
    if (procStatus === "error") return "text-red";
    return "text-gray";
  };
  const getWSStatusDot = () => {
    if (procStatus === "processing") return "dot-yellow";
    if (procStatus === "success") return "dot-green";
    if (procStatus === "error") return "dot-red";
    return "dot-gray";
  };
  const getWSSubtitle = () => {
    if (procStatus === "processing") return "Processing workshop…";
    if (procStatus === "success") return "Processed successfully";
    if (procStatus === "error") return "Processing failed";
    return "Plan engaging workshops";
  };
  const getWSSubtitleColor = () => {
    if (procStatus === "processing") return "#facc15";
    if (procStatus === "success") return "#22c55e";
    if (procStatus === "error") return "#ef4444";
    return "#6b7280";
  };
  
  // Remove empty values before sending to backend
  function prune(obj) {
    if (Array.isArray(obj)) {
      const arr = obj
        .map(prune)
        .filter(
          (v) =>
            v !== undefined &&
            v !== null &&
            !(typeof v === "string" && v.trim() === "") &&
            !(Array.isArray(v) && v.length === 0) &&
            !(typeof v === "object" && !Array.isArray(v) && Object.keys(v).length === 0)
        );
      return arr.length ? arr : undefined;
    }
    if (obj && typeof obj === "object") {
      const out = {};
      for (const [k, v] of Object.entries(obj)) {
        const pv = prune(v);
        if (
          pv !== undefined &&
          pv !== null &&
          !(typeof pv === "string" && pv.trim() === "") &&
          !(Array.isArray(pv) && pv.length === 0) &&
          !(typeof pv === "object" && !Array.isArray(pv) && Object.keys(pv).length === 0)
        ) {
          out[k] = pv;
        }
      }
      return Object.keys(out).length ? out : undefined;
    }
    return obj;
  }

  // Send to backend; store result; jump to Step 6
async function processWorkshop() {
    try {
      setProcStatus("processing");

      // Build payload in backend’s expected format
    const payload = {
      "action": "workshop",
      "payload": {
        "email_id": "mindspark.user1@schoolfuel.org",
        "workshop_input": {
          "topic": (data.topic || "").trim(),
          "audience": `${data.grade || ""} ${data.subject || ""} students`.trim(),
          "required_artifacts": (data.artifacts || []).map((a) => a.trim()),
          "total_workshop_time": data.duration,
          "reading_level": data.grade
        },
        "huddle_id": "test-huddle-uuid-1234"
      }
    };


  //     {
  //     "action": "workshop",
  //     "payload": {
  //   "email_id": "student1@gmail.com",
  //   "workshop_input": {
  //     "topic": "I want a robotics related workshop that discusses how robotics can be tied to health care (specifically hospitals)",
  //     "audience": "Grade 6 science students",
  //     "required_artifacts": ["slides", "worksheet", "Discussion Guide", "Quiz"],
  //     "total_workshop_time": 20,
  //     "reading_level": "Grade 6"
  //   },
  //   "huddle_id": "test-huddle-uuid-1234"
  // }
  // }


      // Connect via WebSocket
      const ws = new WebSocket("wss://s7pmpoc37f.execute-api.us-west-1.amazonaws.com/prod");

      ws.onopen = () => {
        console.log("WebSocket connected");
        ws.send(JSON.stringify(payload));
      };

      ws.onmessage = (event) => {
        console.log("Raw WS event:", event.data);
        try {
          const result = JSON.parse(event.data);

          // ✅ Wait until backend explicitly says "success"
          if (result?.body?.action_response?.status === "success") {
            setProcessed(result);
            setProcStatus("success");
            setStep(5);
            ws.close(); // only close when it's done
          } else {
            console.log("⏳ Still processing… keeping socket open");
            // don’t close yet, just wait for next message
          }
        } catch (e) {
          console.error("Parse error:", e);
          setProcStatus("error");
          ws.close();
        }
      };

      ws.onerror = (err) => {
        console.error("WebSocket error:", err);
        setProcStatus("error");
        ws.close();
      };

      ws.onclose = () => {
        console.log("WebSocket closed");
      };

       } catch (err) {
      console.error("Process failed:", err);
      setProcStatus("error");
    }
  } 


  function buildResultsText(r) {
    try {
      if (r?.user_response?.artifacts) {
        const lines = ["## Generated Artifacts"];
        for (const [key, val] of Object.entries(r.user_response.artifacts)) {
          lines.push(`• ${key}: ${val.s3_uri}`);
        }
        return lines.join("\n");
      }
      return JSON.stringify(r ?? {}, null, 2);
    } catch {
      return JSON.stringify(r ?? {}, null, 2);
    }
  };

  function DownloadButton({ presignedUrl, filename }) {
    const handleDownload = () => {
      fetch(presignedUrl)
        .then(res => res.blob())
        .then(blob => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = filename;  // correct extension
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        })
        .catch(err => console.error("Download failed:", err));
    };

    return (
      <button
        onClick={handleDownload}
        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        {filename}
      </button>
    );
  }




  function insertResultsIntoDoc() {
    if (!processed) return;
    const text = formatWorkshopForCopy(processed, data);

    navigator.clipboard.writeText(text).then(() => {
      setCopySuccess("✅ Workshop results copied! You can now paste them into Google Docs.");
      setTimeout(() => setCopySuccess(""), 4000); // Hide after 4s
    }).catch(() => {
      setCopySuccess("❌ Failed to copy results. Please try again.");
      setTimeout(() => setCopySuccess(""), 4000);
    });
  }




  // Standards filters (subject + keywords)
  const subjectOptions = Array.from(new Set((standardsData || []).map((s) => s.subject_area)));
  const filteredStandards = (standardsData || [])
    .filter((s) => !data.subject || s.subject_area === data.subject)
    .filter((s) => {
      if (!data.keywords) return true;
      const keys = data.keywords.toLowerCase().split(/\s+/).filter(Boolean);
      const hay = `${s.code} ${s.description}`.toLowerCase();
      return keys.some((kw) => hay.includes(kw));
    });

  return (
    <div className="workshop-wrapper">
      <div className={`workshop-card status-${procStatus}`}>
        <div onClick={toggleExpanded} className="workshop-toggle">
          <div className="workshop-header">
            <div className="workshop-header-left">
              <div className="status-icon">
                <ClipboardList className={`icon ${getWSStatusClass()}`} />
                <div className={`status-dot ${getWSStatusDot()}`} />
              </div>
              <div>
                <div className="title">Workshop Designer</div>
                <div className="subtitle" style={{ color: getWSSubtitleColor() }}>
                  {getWSSubtitle()}
                </div>
              </div>
            </div>
            <ChevronDown className={`chevron ${isExpanded ? "rotate" : ""}`} />
          </div>
        </div>

        {isExpanded && (
          <div className="workshop-panel">
            <div className="panel-body">
              {/* Stepper */}
              <div className="mb-3">
                <div className="text-xs text-gray-500 mb-1">
                  Step {step + 1} of {STEPS.length}: <strong>{STEPS[step]}</strong>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: `repeat(${STEPS.length}, 1fr)`,
                    gap: 6,
                  }}
                >
                  {STEPS.map((label, i) => (
                    <div
                      key={label}
                      className="h-1.5 rounded-full"
                      style={{ background: i <= step ? "#6366f1" : "#e5e7eb" }}
                    />
                  ))}
                </div>
              </div>

              {/* Scrollable content */}
              <div className="workshop-step">
                {/* Step 1: Topic */}
                {step === 0 && (
                  <Section>
                    <Label>What is your workshop about?</Label>
                    <textarea
                      rows="3"
                      value={data.topic}
                      onChange={(e) => setField("topic")(e.target.value)}
                      placeholder="e.g., Modeling photosynthesis; Socratic seminar on chapters 3–4"
                    />
                    <Label className="mt-3">Duration (minutes)</Label>
                    <input
                      type="range"
                      min="10"
                      max="90"
                      value={data.duration}
                      onChange={(e) => setField("duration")(Number(e.target.value))}
                    />
                    <div className="text-sm text-gray-600 mt-1">{data.duration} minutes</div>
                  </Section>
                )}

                {/* Step 2: Standards + Additional Feedback */}
                {step === 1 && (
                <Section>
                  <div
                    className="grid"
                    style={{ gridTemplateColumns: "1fr 1fr", gap: 12 }}
                  >
                    <div>
                      <Label>Grade</Label>
                      <select
                        value={data.grade}
                        onChange={(e) => setField("grade")(e.target.value)}
                      >
                        <option value="">Select</option>
                        <option value="Grade 6">Grade 6</option>
                        <option value="Grade 7">Grade 7</option>
                        <option value="Grade 8">Grade 8</option>
                        <option value="Grade 9">Grade 9</option>
                        <option value="Grade 10">Grade 10</option>
                        <option value="Grade 11">Grade 11</option>
                        <option value="Grade 12">Grade 12</option>
                      </select>
                    </div>

                    <div>
                      <Label>Subject</Label>
                      <select
                        value={data.subject}
                        onChange={(e) => setField("subject")(e.target.value)}
                      >
                        <option value="">Select</option>
                        {[...new Set(standardsData.map((s) => s.subject_area))].map((subject) => (
                          <option key={subject} value={subject}>
                            {subject}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div style={{ gridColumn: "span 2" }}>
                      <Label>Keywords</Label>
                      <input
                        type="text"
                        placeholder="Search..."
                        value={data.keywords}
                        onChange={(e) => setField("keywords")(e.target.value)}
                      />
                    </div>

                    <div style={{ gridColumn: "span 2" }}>
                      <Label>Standards</Label>
                      <Select
                        value={
                          data.standard
                            ? { value: data.standard, label: data.standard } 
                            : null
                        }
                        onChange={(option) => setField("standard")(option?.value || "")}
                        options={standardsData
                          .filter(s => {
                            if (!data.subject) return true;
                            return s.subject_area === data.subject;
                          })
                          .filter(s => {
                            if (!data.keywords) return true;
                            const keywordList = data.keywords.toLowerCase().split(" ");
                            const description = s.description.toLowerCase();
                            return keywordList.every(kw => description.includes(kw));
                          })
                          .map((s) => ({
                            value: s.code,
                            label: `${s.code} – ${s.description}`,
                          }))
                        }
                        menuPlacement="auto"
                        menuPosition="fixed"
                        menuPortalTarget={document.body} 
                        styles={{
                          container: (base) => ({ ...base, width: "100%" }),
                          menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                          menu: (base) => ({
                            ...base,
                            textAlign: "left",
                            left: "0px",
                          }),
                          option: (base) => ({ ...base, fontSize: "0.8rem" }),                           
                        }}
                        isClearable
                      />
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                          Why align with standards? Keeps outcomes clear &amp; measurable.
                  </div>
                  
                  <Label className="mt-3">Additional Feedback</Label>
                  <textarea
                    rows="2"
                    value={data.notes}
                    onChange={(e) => setField("notes")(e.target.value)}
                  />
                </Section>
              )}

                {/* Step 3: Group */}
                {step === 2 && (
                  <Section>
                    <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div>
                        <Label># Students</Label>
                        <input
                          type="number"
                          min="1"
                          value={data.students}
                          onChange={(e) => setField("students")(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Demographics</Label>
                        <Chips
                          options={["ELL", "IEP", "Gifted"]}
                          values={data.demographics}
                          onToggle={(v) => toggleInArray("demographics", v)}
                        />
                      </div>
                    </div>
                  </Section>
                )}

                {/* Step 4: Artifacts */}
                {step === 3 && (
                  <Section>
                    <Label>Artifacts</Label>
                    <Chips
                      options={["Worksheet", "Slides", "Discussion Guide", "Quiz"]}
                      values={data.artifacts}
                      onToggle={(v) => toggleInArray("artifacts", v)}
                    />
                    <Label className="mt-3">Resources (title + URL)</Label>
                    <ResourceEditor
                      resources={data.resources}
                      onChange={(resources) => setField("resources")(resources)}
                    />
                  </Section>
                )}

                {/* Step 5: Review */}
                {step === 4 && (
                  <Section>
                    <h4 className="title" style={{ marginBottom: 8 }}>
                      Preview
                    </h4>
                    <div className="markdown">
                      <h5>🧩 Topic & Duration</h5>
                      <p>{data.topic || "—"}</p>
                      <p>
                        <strong>Duration:</strong> {data.duration} min
                      </p>

                      <h5>🎯 Standards</h5>
                      <p>
                        <strong>Grade:</strong> {data.grade || "—"} |{" "}
                        <strong>Subject:</strong> {data.subject || "—"} |{" "}
                        <strong>Standard:</strong> {data.standard || "—"}
                      </p>
                      <p>
                        <strong>Additional Feedback:</strong>{" "}
                        {data.notes && data.notes.trim() !== "" ? data.notes : "No feedback provided"}
                      </p>


                      <h5>👥 Group</h5>
                      <p>
                        <strong>Students:</strong> {data.students || "—"}
                      </p>
                      <p>
                        <strong>Demographics:</strong>{" "}
                        {data.demographics.length ? data.demographics.join(", ") : "—"}
                      </p>

                      <h5>📦 Artifacts</h5>
                      <p>
                        {data.artifacts.length ? data.artifacts.join(", ") : "No artifacts selected"}
                      </p>

                      <h5>🔗 Resources</h5>
                      {data.resources.length ? (
                        <ul>
                          {data.resources.map((r, i) => (
                            <li key={i}>
                              {r.title} — <a href={r.url} target="_blank" rel="noreferrer">{r.url}</a>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p>No links provided</p>
                      )}

                    </div>

                    <div
                      className="btn-group"
                      style={{ display: "flex", justifyContent: "center", marginTop: 16 }}
                    >
                      <button
                        className="submit-btn process-btn"
                        title="Send this workshop for processing"
                        onClick={processWorkshop}
                        disabled={procStatus === "processing"}
                      >
                        {procStatus === "processing" && <span className="spinner" />}
                        <Download className="icon" />
                        {procStatus === "processing" ? "Processing Workshop..." : "Process Workshop"}
                      </button>
                    </div>

                  </Section>
                )}

                {/* Step 6: Results */}
                {step === 5 && (
                  <Section>
                    <h4 className="title" style={{ marginBottom: 8 }}>
                      Processed Results
                    </h4>

                    {!processed ? (
                      <div className="text-sm text-gray-500">
                        No result available. Please run <strong>Process Workshop</strong> in Step 5.
                      </div>
                    ) : (
                      <>
                        <div
                          className="results-box"
                          style={{
                            border: "1px solid #e5e7eb",
                            borderRadius: 8,
                            padding: 12,
                            maxHeight: 320,
                            overflow: "auto",
                          }}
                        >
                          {/* Artifacts */}
                          <h5>📦 Generated Artifacts</h5>
                          <ul>
                            {processed?.body?.action_response?.artifacts &&
                            Object.keys(processed.body.action_response.artifacts).length > 0 ? (
                              Object.entries(processed.body.action_response.artifacts)
                                .filter(([k]) => 
                                  (data.artifacts || [])
                                    .map(a => a.toLowerCase().replace(/\s+/g, "_"))
                                    .includes(k.toLowerCase().replace(/\s+/g, "_"))
                                )
                                .map(([k, v]) => {
                                  const fileName = v.download_url.split("/").pop().split("?")[0];
                                  return (
                                    <li key={k} className="flex items-center gap-2">
                                      <strong>{k}:</strong>{" "}
                                      <a
                                        href={v.download_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-blue-600 underline"
                                      >
                                        {fileName}
                                      </a>

                                    </li>
                                  );
                                })

                            ) : (
                              <li>—</li>
                            )}
                          </ul>
                        </div>

                        {/* Buttons */}
                        <div className="btn-group" style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
                          <button className="submit-btn process-btn" onClick={insertResultsIntoDoc}>
                            Copy to clipboard
                          </button>
                        </div>
                        {copySuccess && (
                          <div style={{ marginTop: 10, color: "green", fontSize: "0.9rem" }}>
                            {copySuccess}
                          </div>
                        )}
                      </>
                    )}
                  </Section>
                )}

              </div>

              {/* Nav buttons */}
              <div className="nav-row">
                <button className="nav-btn" onClick={prev} disabled={step === 0}>
                  <ChevronLeft className="icon-sm" />
                  Back
                </button>
                <button className="nav-btn" onClick={next} disabled={step === STEPS.length - 1}>
                  Next
                  <ChevronRight className="icon-sm" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- tiny presentational helpers ---------- */

function Section({ children }) {
  return <div className="input-section">{children}</div>;
}
function Label({ children, className = "" }) {
  return <label className={className}>{children}</label>;
}
function Chips({ options, values, onToggle }) {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {options.map((opt) => {
        const active = values.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onToggle(opt)}
            style={{
              padding: "6px 10px",
              borderRadius: 9999,
              fontSize: 12,
              border: `1px solid ${active ? "#6366f1" : "#e5e7eb"}`,
              background: active ? "#eef2ff" : "#fff",
              color: active ? "#3730a3" : "#374151",
            }}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}
function ResourceEditor({ resources, onChange }) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");

  const add = () => {
    const t = title.trim();
    const u = url.trim();
    if (!t || !u) return;
    onChange([...(resources || []), { title: t, url: u }]);
    setTitle("");
    setUrl("");
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      add();
    }
  };

  return (
    <div>
      <div className="resource-inputs">
        <input
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={onKeyDown}
        />
        <input
          placeholder="URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={add}
        />
      </div>

      <div style={{ marginTop: 8, display: "flex", justifyContent: "center" }}>
        <button className="submit-btn" type="button" onClick={add} disabled={!title.trim() || !url.trim()}>
          Add
        </button>
      </div>

      <ul className="resource-list" style={{ marginTop: 8 }}>
        {resources.map((r, i) => (
          <li key={`${r.title}-${i}`} className="resource-row">
            <span className="text-gray">
              {r.title} — {r.url}
            </span>
            <button
              className="clear-btn clear-btn--outline"
              type="button"
              onClick={() => onChange(resources.filter((_, idx) => idx !== i))}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
