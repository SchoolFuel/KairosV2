import React from "react";

const CalendarTab = () => {
  return (
    <div className="tpq-panel">
      <div className="tpq-panel-head">
        <h3>Scheduling Assistant</h3>
        <span className="tpq-chip">Proposes slots</span>
      </div>
      <div className="tpq-stack">
        <div className="tpq-card">
          <div className="tpq-inline">
            <div>
              <div style={{ fontWeight: 700 }}>Proposed Times</div>
              <div className="tpq-muted">
                Synced from Google Calendar (placeholder)
              </div>
            </div>
            <button className="tpq-btn">Refresh</button>
          </div>
          <div className="tpq-stack" style={{ marginTop: 8 }}>
            <label className="tpq-inline">
              <input type="radio" name="slot" /> Wed 10/08 10:30–10:50
            </label>
            <label className="tpq-inline">
              <input type="radio" name="slot" /> Wed 10/08 11:10–11:30
            </label>
            <label className="tpq-inline">
              <input type="radio" name="slot" /> Thu 10/09 09:00–09:20
            </label>
          </div>
          <div
            className="tpq-inline"
            style={{ justifyContent: "flex-end", marginTop: 8 }}
          >
            <button className="tpq-btn tpq-btn--primary">
              Send Invite
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarTab;

