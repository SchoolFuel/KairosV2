import React, { useState } from "react";
import { Filter, BookOpen, Search } from "lucide-react";

const SubjectFilter = ({ onApplyFilter, loading }) => {
  const [selectedSubject, setSelectedSubject] = useState("");

  const subjects = ["Science", "Technology", "English", "Math"];

  const handleApply = (e) => {
    e.preventDefault();
    if (selectedSubject) {
      onApplyFilter(selectedSubject);
    }
  };

  const handleClear = () => {
    setSelectedSubject("");
  };

  return (
    <div className="tpq-filters-container">
      <div className="tpq-filters-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Filter size={20} style={{ color: "#1a202c" }} />
            <h3>Filter Projects by Subject</h3>
          </div>
          <p className="tpq-filters-subtitle">
            Please select a subject to fetch projects
          </p>
        </div>
      </div>

      <form onSubmit={handleApply} className="tpq-filters-form">
        <div className="tpq-filter-group" style={{ maxWidth: "400px" }}>
          <label htmlFor="subject-filter" className="tpq-filter-label">
            <BookOpen size={16} />
            Subject
          </label>
          <select
            id="subject-filter"
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="tpq-filter-input"
            required
          >
            <option value="">Select a subject...</option>
            {subjects.map((subject) => (
              <option key={subject} value={subject}>
                {subject}
              </option>
            ))}
          </select>
        </div>

        <div className="tpq-filters-actions">
          <button
            type="button"
            onClick={handleClear}
            className="tpq-btn tpq-btn--secondary"
            disabled={loading || !selectedSubject}
          >
            Clear
          </button>
          <button
            type="submit"
            className="tpq-btn tpq-btn--primary"
            disabled={loading || !selectedSubject}
          >
            {loading ? (
              <>
                <span className="tpq-spinner"></span>
                Loading...
              </>
            ) : (
              <>
                <Search size={16} />
                Fetch Projects
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SubjectFilter;
