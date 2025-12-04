import React, { useState } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Loader2,
  X,
  Check,
  BookOpen,
  FileText,
  Link as LinkIcon,
} from "lucide-react";

const ResourcesTab = () => {
  const [resourceType, setResourceType] = useState("project-specific");
  const [action, setAction] = useState("add");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [projectStudentId, setProjectStudentId] = useState("");
  const [projectProjectId, setProjectProjectId] = useState("");

  const [globalDescription, setGlobalDescription] = useState("");
  const [globalType, setGlobalType] = useState("");
  const [globalFormat, setGlobalFormat] = useState("");
  const [globalSubject, setGlobalSubject] = useState("");

  const [resourceDescription, setResourceDescription] = useState("");
  const [resourceTypeField, setResourceTypeField] = useState("");
  const [resourceFormat, setResourceFormat] = useState("");
  const [resourceSubject, setResourceSubject] = useState("");
  const [resourceUrl, setResourceUrl] = useState("");
  const [resourceFile, setResourceFile] = useState(null);

  const [searchResults, setSearchResults] = useState([]);
  const [selectedResource, setSelectedResource] = useState(null);
  const [showResourceForm, setShowResourceForm] = useState(false);
  React.useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  React.useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleSearch = async () => {
    setLoading(true);
    setError("");
    setSearchResults([]);
    setSelectedResource(null);
    setShowResourceForm(false);

    try {
      if (resourceType === "project-specific") {
        if (!projectStudentId || !projectProjectId) {
          setError(
            "Please provide both Student ID and Project ID for project-specific resources"
          );
          setLoading(false);
          return;
        }
      } else {
        if (
          action !== "add" &&
          !globalDescription &&
          !globalType &&
          !globalFormat &&
          !globalSubject
        ) {
          setError(
            "Please provide at least one search criteria (Description, Type, Format, or Subject)"
          );
          setLoading(false);
          return;
        }
      }

      // TODO: Call backend API to search for resources
      await new Promise((resolve) => setTimeout(resolve, 500));
      const mockResults = [
        {
          id: "1",
          description: "Introduction to Algebra",
          type: "Video",
          format: "MP4",
          subject: "Mathematics",
          url: "https://example.com/algebra",
          intended_user: "T",
          project_id:
            resourceType === "project-specific" ? projectProjectId : null,
          student_id:
            resourceType === "project-specific" ? projectStudentId : null,
        },
        {
          id: "2",
          description: "Chemistry Lab Safety Guide",
          type: "Document",
          format: "PDF",
          subject: "Science",
          url: "https://example.com/chemistry",
          intended_user: "S",
          project_id:
            resourceType === "project-specific" ? projectProjectId : null,
          student_id:
            resourceType === "project-specific" ? projectStudentId : null,
        },
      ];

      setSearchResults(mockResults);
      setSuccess(`Found ${mockResults.length} resource(s)`);
    } catch (err) {
      setError(err.message || "Failed to search resources");
    } finally {
      setLoading(false);
    }
  };

  const handleAddResource = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (!resourceDescription || !resourceTypeField || !resourceFormat) {
        setError(
          "Please fill in all required fields (Description, Type, Format)"
        );
        setLoading(false);
        return;
      }

      if (
        resourceType === "project-specific" &&
        (!projectStudentId || !projectProjectId)
      ) {
        setError(
          "Please provide Student ID and Project ID for project-specific resources"
        );
        setLoading(false);
        return;
      }

      // TODO: Call backend API to add resource
      await new Promise((resolve) => setTimeout(resolve, 500));

      setSuccess("Resource added successfully!");
      setResourceDescription("");
      setResourceTypeField("");
      setResourceFormat("");
      setResourceSubject("");
      setResourceUrl("");
      setResourceFile(null);
      setShowResourceForm(false);
    } catch (err) {
      setError(err.message || "Failed to add resource");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateResource = async () => {
    if (!selectedResource) {
      setError("Please select a resource to update");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // TODO: Call backend API to update resource
      await new Promise((resolve) => setTimeout(resolve, 500));

      setSuccess("Resource updated successfully!");
      setSelectedResource(null);
      setShowResourceForm(false);
      handleSearch();
    } catch (err) {
      setError(err.message || "Failed to update resource");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteResource = async (resourceId) => {
    if (!window.confirm("Are you sure you want to delete this resource?")) {
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // TODO: Call backend API to delete resource
      await new Promise((resolve) => setTimeout(resolve, 500));

      setSuccess("Resource deleted successfully!");
      setSelectedResource(null);
      handleSearch();
    } catch (err) {
      setError(err.message || "Failed to delete resource");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectResource = (resource) => {
    setSelectedResource(resource);
    setResourceDescription(resource.description || "");
    setResourceTypeField(resource.type || "");
    setResourceFormat(resource.format || "");
    setResourceSubject(resource.subject || "");
    setResourceUrl(resource.url || "");
    setShowResourceForm(true);
  };

  const resetForm = () => {
    setResourceDescription("");
    setResourceTypeField("");
    setResourceFormat("");
    setResourceSubject("");
    setResourceUrl("");
    setResourceFile(null);
    setSelectedResource(null);
    setShowResourceForm(false);
    setSearchResults([]);
  };

  return (
    <div className="tpq-panel">
      <div className="tpq-panel-head">
        <h3>Resource Management</h3>
        <span className="tpq-chip">Learning Materials</span>
      </div>

      {success && (
        <div
          style={{
            padding: "12px 16px",
            backgroundColor: "#d1fae5",
            border: "1px solid #a7f3d0",
            borderRadius: "6px",
            marginBottom: "16px",
            color: "#065f46",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <Check size={16} />
          {success}
        </div>
      )}

      {error && (
        <div
          style={{
            padding: "12px 16px",
            backgroundColor: "#fee2e2",
            border: "1px solid #fecaca",
            borderRadius: "6px",
            marginBottom: "16px",
            color: "#dc2626",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <X size={16} />
          {error}
        </div>
      )}

      <div className="tpq-stack">
        <div className="tpq-card">
          <div style={{ fontWeight: 700, marginBottom: "12px" }}>
            Resource Type
          </div>
          <div style={{ display: "flex", gap: "16px" }}>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
              }}
            >
              <input
                type="radio"
                name="resourceType"
                value="project-specific"
                checked={resourceType === "project-specific"}
                onChange={(e) => {
                  setResourceType(e.target.value);
                  resetForm();
                }}
              />
              <span>Project Specific</span>
            </label>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
              }}
            >
              <input
                type="radio"
                name="resourceType"
                value="global"
                checked={resourceType === "global"}
                onChange={(e) => {
                  setResourceType(e.target.value);
                  resetForm();
                }}
              />
              <span>Global</span>
            </label>
          </div>
        </div>

        <div className="tpq-card">
          <div style={{ fontWeight: 700, marginBottom: "12px" }}>Action</div>
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
            <button
              className={`tpq-btn ${
                action === "add" ? "tpq-btn--primary" : "tpq-btn--secondary"
              }`}
              onClick={() => {
                setAction("add");
                resetForm();
              }}
              style={{ display: "flex", alignItems: "center", gap: "8px" }}
            >
              <Plus size={16} />
              Add New Resource(s)
            </button>
            <button
              className={`tpq-btn ${
                action === "change" ? "tpq-btn--primary" : "tpq-btn--secondary"
              }`}
              onClick={() => {
                setAction("change");
                resetForm();
              }}
              style={{ display: "flex", alignItems: "center", gap: "8px" }}
            >
              <Edit size={16} />
              Change Resource
            </button>
            <button
              className={`tpq-btn ${
                action === "delete" ? "tpq-btn--primary" : "tpq-btn--secondary"
              }`}
              onClick={() => {
                setAction("delete");
                resetForm();
              }}
              style={{ display: "flex", alignItems: "center", gap: "8px" }}
            >
              <Trash2 size={16} />
              Delete Resource
            </button>
          </div>
        </div>

        {(action === "change" || action === "delete") && (
          <div className="tpq-card">
            <div
              style={{
                fontWeight: 700,
                marginBottom: "16px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Search size={18} />
              Search Resources
            </div>

            {resourceType === "project-specific" ? (
              <div className="tpq-stack" style={{ gap: "12px" }}>
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "6px",
                      fontSize: "14px",
                      fontWeight: 500,
                    }}
                  >
                    Student ID <span style={{ color: "#e53e3e" }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={projectStudentId}
                    onChange={(e) => setProjectStudentId(e.target.value)}
                    placeholder="Enter Student ID"
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid #cbd5e0",
                      borderRadius: "6px",
                      fontSize: "14px",
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "6px",
                      fontSize: "14px",
                      fontWeight: 500,
                    }}
                  >
                    Project ID <span style={{ color: "#e53e3e" }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={projectProjectId}
                    onChange={(e) => setProjectProjectId(e.target.value)}
                    placeholder="Enter Project ID"
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid #cbd5e0",
                      borderRadius: "6px",
                      fontSize: "14px",
                    }}
                  />
                </div>
                <button
                  className="tpq-btn tpq-btn--primary"
                  onClick={handleSearch}
                  disabled={loading}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    justifyContent: "center",
                  }}
                >
                  {loading ? (
                    <Loader2 size={16} className="spin" />
                  ) : (
                    <Search size={16} />
                  )}
                  Search
                </button>
              </div>
            ) : (
              <div className="tpq-stack" style={{ gap: "12px" }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "12px",
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "6px",
                        fontSize: "14px",
                        fontWeight: 500,
                      }}
                    >
                      Description
                    </label>
                    <input
                      type="text"
                      value={globalDescription}
                      onChange={(e) => setGlobalDescription(e.target.value)}
                      placeholder="Search by description"
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        border: "1px solid #cbd5e0",
                        borderRadius: "6px",
                        fontSize: "14px",
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "6px",
                        fontSize: "14px",
                        fontWeight: 500,
                      }}
                    >
                      Type
                    </label>
                    <input
                      type="text"
                      value={globalType}
                      onChange={(e) => setGlobalType(e.target.value)}
                      placeholder="e.g., Video, Document"
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        border: "1px solid #cbd5e0",
                        borderRadius: "6px",
                        fontSize: "14px",
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "6px",
                        fontSize: "14px",
                        fontWeight: 500,
                      }}
                    >
                      Format
                    </label>
                    <input
                      type="text"
                      value={globalFormat}
                      onChange={(e) => setGlobalFormat(e.target.value)}
                      placeholder="e.g., PDF, MP4, DOCX"
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        border: "1px solid #cbd5e0",
                        borderRadius: "6px",
                        fontSize: "14px",
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "6px",
                        fontSize: "14px",
                        fontWeight: 500,
                      }}
                    >
                      Subject
                    </label>
                    <input
                      type="text"
                      value={globalSubject}
                      onChange={(e) => setGlobalSubject(e.target.value)}
                      placeholder="e.g., Mathematics, Science"
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        border: "1px solid #cbd5e0",
                        borderRadius: "6px",
                        fontSize: "14px",
                      }}
                    />
                  </div>
                </div>
                <button
                  className="tpq-btn tpq-btn--primary"
                  onClick={handleSearch}
                  disabled={loading}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    justifyContent: "center",
                  }}
                >
                  {loading ? (
                    <Loader2 size={16} className="spin" />
                  ) : (
                    <Search size={16} />
                  )}
                  Search
                </button>
              </div>
            )}
          </div>
        )}

        {action === "add" && (
          <div className="tpq-card">
            <div
              style={{
                fontWeight: 700,
                marginBottom: "16px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Plus size={18} />
              Add New Resource(s)
            </div>

            {resourceType === "project-specific" && (
              <div
                className="tpq-stack"
                style={{ gap: "12px", marginBottom: "16px" }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "6px",
                      fontSize: "14px",
                      fontWeight: 500,
                    }}
                  >
                    Student ID <span style={{ color: "#e53e3e" }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={projectStudentId}
                    onChange={(e) => setProjectStudentId(e.target.value)}
                    placeholder="Enter Student ID"
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid #cbd5e0",
                      borderRadius: "6px",
                      fontSize: "14px",
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "6px",
                      fontSize: "14px",
                      fontWeight: 500,
                    }}
                  >
                    Project ID <span style={{ color: "#e53e3e" }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={projectProjectId}
                    onChange={(e) => setProjectProjectId(e.target.value)}
                    placeholder="Enter Project ID"
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid #cbd5e0",
                      borderRadius: "6px",
                      fontSize: "14px",
                    }}
                  />
                </div>
              </div>
            )}

            <div className="tpq-stack" style={{ gap: "12px" }}>
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "6px",
                    fontSize: "14px",
                    fontWeight: 500,
                  }}
                >
                  Description <span style={{ color: "#e53e3e" }}>*</span>
                </label>
                <input
                  type="text"
                  value={resourceDescription}
                  onChange={(e) => setResourceDescription(e.target.value)}
                  placeholder="Enter resource description"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #cbd5e0",
                    borderRadius: "6px",
                    fontSize: "14px",
                  }}
                />
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "6px",
                      fontSize: "14px",
                      fontWeight: 500,
                    }}
                  >
                    Type <span style={{ color: "#e53e3e" }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={resourceTypeField}
                    onChange={(e) => setResourceTypeField(e.target.value)}
                    placeholder="e.g., Video, Document"
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid #cbd5e0",
                      borderRadius: "6px",
                      fontSize: "14px",
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "6px",
                      fontSize: "14px",
                      fontWeight: 500,
                    }}
                  >
                    Format <span style={{ color: "#e53e3e" }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={resourceFormat}
                    onChange={(e) => setResourceFormat(e.target.value)}
                    placeholder="e.g., PDF, MP4, DOCX"
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid #cbd5e0",
                      borderRadius: "6px",
                      fontSize: "14px",
                    }}
                  />
                </div>
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "6px",
                    fontSize: "14px",
                    fontWeight: 500,
                  }}
                >
                  Subject
                </label>
                <input
                  type="text"
                  value={resourceSubject}
                  onChange={(e) => setResourceSubject(e.target.value)}
                  placeholder="e.g., Mathematics, Science"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #cbd5e0",
                    borderRadius: "6px",
                    fontSize: "14px",
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "6px",
                    fontSize: "14px",
                    fontWeight: 500,
                  }}
                >
                  URL / Link
                </label>
                <input
                  type="url"
                  value={resourceUrl}
                  onChange={(e) => setResourceUrl(e.target.value)}
                  placeholder="https://example.com/resource"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #cbd5e0",
                    borderRadius: "6px",
                    fontSize: "14px",
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "6px",
                    fontSize: "14px",
                    fontWeight: 500,
                  }}
                >
                  File Upload (Optional)
                </label>
                <input
                  type="file"
                  onChange={(e) => setResourceFile(e.target.files[0])}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #cbd5e0",
                    borderRadius: "6px",
                    fontSize: "14px",
                  }}
                />
              </div>
              <button
                className="tpq-btn tpq-btn--primary"
                onClick={handleAddResource}
                disabled={loading}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  justifyContent: "center",
                }}
              >
                {loading ? (
                  <Loader2 size={16} className="spin" />
                ) : (
                  <Plus size={16} />
                )}
                {loading ? "Adding..." : "Add Resource"}
              </button>
            </div>
          </div>
        )}

        {searchResults.length > 0 && (
          <div className="tpq-card">
            <div style={{ fontWeight: 700, marginBottom: "16px" }}>
              Search Results ({searchResults.length})
            </div>
            <div className="tpq-stack" style={{ gap: "12px" }}>
              {searchResults.map((resource) => (
                <div
                  key={resource.id}
                  style={{
                    padding: "16px",
                    border: "1px solid #cbd5e0",
                    borderRadius: "6px",
                    backgroundColor:
                      selectedResource?.id === resource.id
                        ? "#eff6ff"
                        : "white",
                    cursor: action === "change" ? "pointer" : "default",
                  }}
                  onClick={() =>
                    action === "change" && handleSelectResource(resource)
                  }
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          marginBottom: "8px",
                        }}
                      >
                        {resource.type === "Video" ? (
                          <FileText size={18} color="#9333ea" />
                        ) : (
                          <BookOpen size={18} color="#3182ce" />
                        )}
                        <h4
                          style={{
                            margin: 0,
                            fontSize: "16px",
                            fontWeight: 600,
                          }}
                        >
                          {resource.description}
                        </h4>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: "16px",
                          flexWrap: "wrap",
                          fontSize: "14px",
                          color: "#718096",
                        }}
                      >
                        <span>
                          <strong>Type:</strong> {resource.type}
                        </span>
                        <span>
                          <strong>Format:</strong> {resource.format}
                        </span>
                        {resource.subject && (
                          <span>
                            <strong>Subject:</strong> {resource.subject}
                          </span>
                        )}
                        <span>
                          <strong>Intended User:</strong>{" "}
                          {resource.intended_user === "T"
                            ? "Teacher"
                            : "Student"}
                        </span>
                      </div>
                      {resource.url && (
                        <div style={{ marginTop: "8px", fontSize: "14px" }}>
                          <a
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              color: "#3182ce",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <LinkIcon size={14} />
                            View Resource
                          </a>
                        </div>
                      )}
                    </div>
                    {action === "delete" && (
                      <button
                        className="tpq-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteResource(resource.id);
                        }}
                        disabled={loading}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                          padding: "6px 12px",
                          backgroundColor: "#fee2e2",
                          color: "#dc2626",
                          border: "1px solid #fecaca",
                        }}
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {showResourceForm && selectedResource && action === "change" && (
          <div className="tpq-card">
            <div
              style={{
                fontWeight: 700,
                marginBottom: "16px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Edit size={18} />
              Update Resource
            </div>
            <div className="tpq-stack" style={{ gap: "12px" }}>
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "6px",
                    fontSize: "14px",
                    fontWeight: 500,
                  }}
                >
                  Description <span style={{ color: "#e53e3e" }}>*</span>
                </label>
                <input
                  type="text"
                  value={resourceDescription}
                  onChange={(e) => setResourceDescription(e.target.value)}
                  placeholder="Enter resource description"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #cbd5e0",
                    borderRadius: "6px",
                    fontSize: "14px",
                  }}
                />
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "6px",
                      fontSize: "14px",
                      fontWeight: 500,
                    }}
                  >
                    Type <span style={{ color: "#e53e3e" }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={resourceTypeField}
                    onChange={(e) => setResourceTypeField(e.target.value)}
                    placeholder="e.g., Video, Document"
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid #cbd5e0",
                      borderRadius: "6px",
                      fontSize: "14px",
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "6px",
                      fontSize: "14px",
                      fontWeight: 500,
                    }}
                  >
                    Format <span style={{ color: "#e53e3e" }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={resourceFormat}
                    onChange={(e) => setResourceFormat(e.target.value)}
                    placeholder="e.g., PDF, MP4, DOCX"
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid #cbd5e0",
                      borderRadius: "6px",
                      fontSize: "14px",
                    }}
                  />
                </div>
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "6px",
                    fontSize: "14px",
                    fontWeight: 500,
                  }}
                >
                  Subject
                </label>
                <input
                  type="text"
                  value={resourceSubject}
                  onChange={(e) => setResourceSubject(e.target.value)}
                  placeholder="e.g., Mathematics, Science"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #cbd5e0",
                    borderRadius: "6px",
                    fontSize: "14px",
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "6px",
                    fontSize: "14px",
                    fontWeight: 500,
                  }}
                >
                  URL / Link
                </label>
                <input
                  type="url"
                  value={resourceUrl}
                  onChange={(e) => setResourceUrl(e.target.value)}
                  placeholder="https://example.com/resource"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #cbd5e0",
                    borderRadius: "6px",
                    fontSize: "14px",
                  }}
                />
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  className="tpq-btn tpq-btn--primary"
                  onClick={handleUpdateResource}
                  disabled={loading}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    flex: 1,
                    justifyContent: "center",
                  }}
                >
                  {loading ? (
                    <Loader2 size={16} className="spin" />
                  ) : (
                    <Check size={16} />
                  )}
                  {loading ? "Updating..." : "Update Resource"}
                </button>
                <button
                  className="tpq-btn tpq-btn--secondary"
                  onClick={() => {
                    setShowResourceForm(false);
                    setSelectedResource(null);
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResourcesTab;
