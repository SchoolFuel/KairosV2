import React, { useState } from "react";
import "./NeedHelpStarting.css";

export default function NeedHelpStarting() {
  const [issue, setIssue] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);   // <-- NEW

  const handleSubmit = () => {
    if (!issue.trim()) return;

    setLoading(true);   // start loading

    google.script.run
      .withSuccessHandler(() => {
        setSubmitted(true);
        setIssue("");
        setLoading(false); // stop loading
      })
      .submitHelpIssue(issue);
  };

  return (
    <div className="nhs-container">
      <p className="nhs-description">
        Having trouble getting started? Let us know below.
      </p>

      {/* TEXTAREA */}
      <textarea
        className="nhs-textarea"
        rows={3}
        placeholder="Describe your issue here..."
        value={issue}
        onChange={(e) => setIssue(e.target.value)}
      />

      {/* SUCCESS MESSAGE */}
      {submitted && (
        <div className="nhs-success">
          ✓ Thank you! Our team will review your issue.
        </div>
      )}

      {/* SUBMIT BUTTON */}
      <div className="nhs-submit-row">
        <button
          className="nhs-submit-btn"
          onClick={handleSubmit}
          disabled={loading}  // disable while loading
        >
          {loading ? "Sending..." : "Submit"}   {/* <-- dynamic text */}
        </button>
      </div>
    </div>
  );
}
