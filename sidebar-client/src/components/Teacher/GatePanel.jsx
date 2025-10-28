// src/components/GatePanel.jsx
import React from "react";
import { gsRun } from "./utils/gsRun"; // ← adjust path if your utils isn't here
import "./Teacher.css";

/* ---------- local helpers (self-contained) ---------- */
const norm = (s) => String(s ?? "").trim();
const makeKey = (gateId, title) => `STD:${norm(gateId)}:${norm(title)}`;
const clamp01 = (n) => {
  const v = Number(n);
  return Number.isFinite(v) ? Math.max(0, Math.min(100, v)) : 0;
};
const deb = (fn, ms) => {
  let t;
  return (...a) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...a), ms);
  };
};
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

  /* -------- standards (per-checklist) -------- */
  const [pickedByKey, setPickedByKey] = React.useState({});
  const items = cacheKey ? pickedByKey[cacheKey] || [] : [];

  const refreshFromCache = React.useCallback(async (key) => {
    const k = norm(key);
    if (!k) return;
    try {
      const res = await gsRun("STD_pullSelectionByKey", k); // { ok, items, ts? }
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

    awaitUpdate(cacheKey, getTs, refreshFromCache).then((hit) => {
      if (!hit) setTimeout(() => refreshFromCache(cacheKey), 400);
    });
  }, [gateId, checklistTitle, stage, g, cacheKey, getTs, refreshFromCache]);

  /* -------- per-checklist meta (Status/Assignee/Due/Feedback) -------- */
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

  const setItemPercent = React.useCallback(
    (index, rawVal) => {
      if (!cacheKey) return;
      const val = clamp01(parseFloat(rawVal)); // 0..100

      setPickedByKey((prev) => {
        const curr = prev[cacheKey] || [];
        const next = curr.map((it, i) =>
          i === index ? { ...it, percent: val } : it
        );

        const ctx = { gateId, checklistTitle };
        savePercentsDebounced(cacheKey, ctx, next);

        return { ...prev, [cacheKey]: next };
      });
    },
    [cacheKey, gateId, checklistTitle, savePercentsDebounced]
  );

  const percentInputValue = (v) => {
    if (v === null || v === undefined) return "";
    if (typeof v === "string") return v;
    if (Number.isFinite(v)) return String(v);
    return "";
  };

  const removeItem = React.useCallback(
    (index) => {
      if (!cacheKey) return;
      setPickedByKey((prev) => {
        const curr = prev[cacheKey] || [];
        const next = curr.filter((_, i) => i !== index);
        const ctx = { gateId, checklistTitle };
        savePercentsDebounced(cacheKey, ctx, next, "replace");
        return { ...prev, [cacheKey]: next };
      });
    },
    [cacheKey, gateId, checklistTitle, savePercentsDebounced]
  );

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

  /* -------- UI -------- */
  // If no gate on this stage (because none was attached/detached), say so clearly
  if (!g || !g.gate_id) {
    return (
      <div className="td-empty">
        This stage has no gate data. Select another stage.
      </div>
    );
  }

  return (
    <div className="td-gate clean">
      <div className="td-gate-header">
        <div className="td-gate-title-stack td-like-checklist">
          <strong>Gate {gateNum}:</strong>
          <div className="td-gate-title-text">
            “{g.title || stage?.title || "Gate"}”
          </div>
        </div>
      </div>

      {total === 0 ? (
        <div className="td-empty">No checklist items for this gate.</div>
      ) : (
        <div className="td-gate-detail one">
          {/* Checklist header */}
          <div className="td-checklist-title">
            <strong>Checklist {idx + 1}:</strong>
            <div className="td-checklist-text">“{checklistTitle || "—"}”</div>
          </div>

          {/* Add / Refresh */}
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

          {/* Picked standards */}
          <div style={{ marginBottom: 12, minHeight: 20 }}>
            {items.length === 0 ? (
              <div className="td-empty">No standards added yet.</div>
            ) : (
              <ul
                className="td-standards"
                style={{ paddingLeft: 0, margin: 0, listStyle: "none" }}
              >
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
                              const next = curr.map((row, j) =>
                                j === i ? { ...row, percent: val } : row
                              );
                              return { ...prev, [cacheKey]: next };
                            });
                          }}
                          onBlur={(e) => setItemPercent(i, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") e.currentTarget.blur();
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

          {/* Per-checklist meta */}
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

          {/* Pager */}
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

export default GatePanel;