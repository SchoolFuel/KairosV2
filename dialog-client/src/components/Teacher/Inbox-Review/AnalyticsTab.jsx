import React from "react";

const AnalyticsTab = ({ analytics }) => {
  return (
    <div className="tpq-panel">
      <div className="tpq-panel-head">
        <h3>Review Analytics</h3>
        <span className="tpq-chip">Last 14 days</span>
      </div>
      <div className="tpq-stack">
        <div className="tpq-card">
          <div className="tpq-inline">
            <div>
              <div className="tpq-muted">Median Review Time</div>
              <div style={{ fontSize: 22, fontWeight: 800 }}>
                {analytics.medianReviewTime}
              </div>
            </div>
            <div>
              <div className="tpq-muted">Decline Rate</div>
              <div
                style={{ fontSize: 22, fontWeight: 800, color: "#e53e3e" }}
              >
                {analytics.declineRate}
              </div>
            </div>
            <div>
              <div className="tpq-muted">Throughput</div>
              <div
                style={{ fontSize: 22, fontWeight: 800, color: "#38a169" }}
              >
                {analytics.throughput}
              </div>
            </div>
          </div>
        </div>
        <div className="tpq-card">
          <div style={{ fontWeight: 700 }}>Top Decline Reasons</div>
          <ul className="tpq-muted">
            <li>Missing citations</li>
            <li>Insufficient evidence</li>
            <li>Wrong rubric attached</li>
          </ul>
        </div>
        <div className="tpq-card">
          <div style={{ fontWeight: 700 }}>Project Statistics</div>
          <div className="tpq-stats-grid">
            <div className="tpq-stat-item">
              <div className="tpq-stat-value">
                {analytics.totalProjects}
              </div>
              <div className="tpq-stat-label">Total Projects</div>
            </div>
            <div className="tpq-stat-item">
              <div className="tpq-stat-value" style={{ color: "#38a169" }}>
                {analytics.approvedProjects}
              </div>
              <div className="tpq-stat-label">Approved</div>
            </div>
            <div className="tpq-stat-item">
              <div className="tpq-stat-value" style={{ color: "#d69e2e" }}>
                {analytics.pendingProjects}
              </div>
              <div className="tpq-stat-label">Pending</div>
            </div>
            <div className="tpq-stat-item">
              <div className="tpq-stat-value" style={{ color: "#e53e3e" }}>
                {analytics.rejectedProjects}
              </div>
              <div className="tpq-stat-label">Rejected</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsTab;

