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
  File,
  Image,
  Video,
  Music,
  Globe,
  FileSpreadsheet,
  Presentation,
} from "lucide-react";

const ResourcesTab = () => {
  // Helper function to get icon based on resource format
  const getResourceIcon = (format, type) => {
    const formatLower = format?.toLowerCase() || "";
    const typeLower = type?.toLowerCase() || "";

    if (formatLower === "html_webpage" || typeLower.includes("html") || typeLower.includes("webpage")) {
      return <Globe size={18} color="#3b82f6" />;
    }
    if (formatLower === "pdf" || typeLower.includes("pdf")) {
      return <FileText size={18} color="#dc2626" />;
    }
    if (formatLower === "google_doc" || typeLower.includes("google doc")) {
      return <FileText size={18} color="#4285f4" />;
    }
    if (formatLower === "google_slide" || typeLower.includes("google slide")) {
      return <Presentation size={18} color="#fbbc04" />;
    }
    if (formatLower === "google_sheet" || typeLower.includes("google sheet")) {
      return <FileSpreadsheet size={18} color="#34a853" />;
    }
    if (formatLower === "video_stream" || formatLower.includes("video") || typeLower.includes("video")) {
      return <Video size={18} color="#9333ea" />;
    }
    if (formatLower === "audio" || typeLower.includes("audio")) {
      return <Music size={18} color="#f59e0b" />;
    }
    if (formatLower === "image" || typeLower.includes("image")) {
      return <Image size={18} color="#10b981" />;
    }
    // Default icon
    return <BookOpen size={18} color="#3182ce" />;
  };

  const [resourceType, setResourceType] = useState("global");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
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

  // Function to get all static resources
  const getAllStaticResources = () => {
    return [
      {
        id: "1",
        description: "Interactive Math Learning Portal",
        type: "HTML Webpage",
        format: "html_webpage",
        subject: "Mathematics",
        url: "https://www.khanacademy.org/math",
        intended_user: "S",
        project_id: null,
        student_id: null,
      },
      {
        id: "2",
        description: "Chemistry Lab Safety Guide",
        type: "Document",
        format: "pdf",
        subject: "Science",
        url: "https://www.example.com/chemistry-safety.pdf",
        intended_user: "S",
        project_id: null,
        student_id: null,
      },
      {
        id: "3",
        description: "Project Research Notes Template",
        type: "Google Document",
        format: "google_doc",
        subject: "General",
        url: "https://docs.google.com/document/d/example123",
        intended_user: "S",
        project_id: null,
        student_id: null,
      },
      {
        id: "4",
        description: "History Timeline Presentation",
        type: "Google Slides",
        format: "google_slide",
        subject: "History",
        url: "https://docs.google.com/presentation/d/example456",
        intended_user: "T",
        project_id: null,
        student_id: null,
      },
      {
        id: "5",
        description: "Science Experiment Data Collection",
        type: "Google Sheets",
        format: "google_sheet",
        subject: "Science",
        url: "https://docs.google.com/spreadsheets/d/example789",
        intended_user: "S",
        project_id: null,
        student_id: null,
      },
      {
        id: "6",
        description: "Introduction to Photosynthesis",
        type: "Video Stream",
        format: "video_stream",
        subject: "Science",
        url: "https://www.youtube.com/watch?v=eo5XndJaz-Y",
        intended_user: "S",
        project_id: null,
        student_id: null,
      },
      {
        id: "7",
        description: "Language Learning Audio Course",
        type: "Audio",
        format: "audio",
        subject: "Language Arts",
        url: "https://www.example.com/audio/language-course.mp3",
        intended_user: "S",
        project_id: null,
        student_id: null,
      },
      {
        id: "8",
        description: "Periodic Table Reference Image",
        type: "Image",
        format: "image",
        subject: "Science",
        url: "https://www.example.com/images/periodic-table.png",
        intended_user: "S",
        project_id: null,
        student_id: null,
      },
    ];
  };

  // Load all resources when component mounts
  React.useEffect(() => {
    const allResources = getAllStaticResources();
    setSearchResults(allResources);
  }, []);

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
      }
      // For global resources, allow empty search to show all resources

      // TODO: Call backend API to search for resources
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      // Get all static resources
      const staticResources = getAllStaticResources();

      // Filter resources based on search criteria for global resources
      let mockResults = staticResources;
      if (resourceType === "global") {
        mockResults = staticResources.filter((resource) => {
          const matchesDescription =
            !globalDescription ||
            resource.description
              .toLowerCase()
              .includes(globalDescription.toLowerCase());
          const matchesType =
            !globalType ||
            resource.type.toLowerCase().includes(globalType.toLowerCase()) ||
            resource.format.toLowerCase().includes(globalType.toLowerCase());
          const matchesFormat =
            !globalFormat ||
            resource.format.toLowerCase().includes(globalFormat.toLowerCase());
          const matchesSubject =
            !globalSubject ||
            resource.subject.toLowerCase().includes(globalSubject.toLowerCase());

          return (
            matchesDescription && matchesType && matchesFormat && matchesSubject
          );
        });
      } else if (resourceType === "project-specific") {
        // For project-specific, add project and student IDs
        mockResults = staticResources.map((resource) => ({
          ...resource,
          project_id: projectProjectId,
          student_id: projectStudentId,
        }));
      }

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
      setProjectStudentId("");
      setProjectProjectId("");
      setShowAddForm(false);
      // Refresh resources list
      const allResources = getAllStaticResources();
      setSearchResults(allResources);
      
      // Close modal after a short delay to show success message
      setTimeout(() => {
        setSuccess("");
      }, 2000);
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
      if (!resourceDescription || !resourceTypeField || !resourceFormat) {
        setError("Please fill in all required fields (Description, Type, Format)");
        setLoading(false);
        return;
      }

      if (
        resourceType === "project-specific" &&
        (!projectStudentId || !projectProjectId)
      ) {
        setError("Please provide Student ID and Project ID for project-specific resources");
        setLoading(false);
        return;
      }

      // TODO: Call backend API to update resource
      await new Promise((resolve) => setTimeout(resolve, 500));

      setSuccess("Resource updated successfully!");
      setSelectedResource(null);
      setShowEditForm(false);
      // Refresh resources list
      const allResources = getAllStaticResources();
      setSearchResults(allResources);
      
      setTimeout(() => {
        setSuccess("");
      }, 2000);
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
      setShowEditForm(false);
      // Refresh resources list
      const allResources = getAllStaticResources();
      setSearchResults(allResources.filter(r => r.id !== resourceId));
      
      setTimeout(() => {
        setSuccess("");
      }, 2000);
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
    setResourceType(resource.project_id ? "project-specific" : "global");
    setProjectStudentId(resource.student_id || "");
    setProjectProjectId(resource.project_id || "");
    setShowEditForm(true);
    setError("");
    setSuccess("");
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
        {/* Add Resource Button at the top */}
        <div className="tpq-card">
          <button
            className="tpq-btn tpq-btn--primary"
            onClick={() => {
              setShowAddForm(true);
              setError("");
              setSuccess("");
              // Reset form when opening
              setResourceType("global");
              setResourceDescription("");
              setResourceTypeField("");
              setResourceFormat("");
              setResourceSubject("");
              setResourceUrl("");
              setResourceFile(null);
              setProjectStudentId("");
              setProjectProjectId("");
            }}
            style={{ display: "flex", alignItems: "center", gap: "8px" }}
          >
            <Plus size={16} />
            Add Resource
          </button>
        </div>

        {/* Add Resource Modal Dialog */}
        {showAddForm && (
          <div
            className="tpq-modal-overlay"
            style={{ zIndex: 2000 }}
            onClick={() => {
              setShowAddForm(false);
              setError("");
            }}
          >
            <div
              className="tpq-modal tpq-modal--large"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="tpq-modal-header">
                <h2>Add New Resource</h2>
                <button
                  className="tpq-modal-close"
                  onClick={() => {
                    setShowAddForm(false);
                    setError("");
                    setSuccess("");
                  }}
                >
                  ×
                </button>
              </div>
              <div className="tpq-modal-content">
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

                <div className="tpq-stack" style={{ gap: "16px" }}>
                  <div style={{ marginBottom: "16px", padding: "12px", backgroundColor: "#f7fafc", borderRadius: "6px" }}>
                    <div style={{ fontWeight: 600, marginBottom: "8px", fontSize: "14px" }}>
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
                          name="addResourceType"
                          value="project-specific"
                          checked={resourceType === "project-specific"}
                          onChange={(e) => {
                            setResourceType(e.target.value);
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
                          name="addResourceType"
                          value="global"
                          checked={resourceType === "global"}
                          onChange={(e) => {
                            setResourceType(e.target.value);
                          }}
                        />
                        <span>Global</span>
                      </label>
                    </div>
                  </div>

                  {resourceType === "project-specific" && (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "12px",
                        marginBottom: "16px",
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
                  
                  {/* Add Resource and Cancel buttons at bottom right of content */}
                  <div style={{ display: "flex", gap: "12px", marginTop: "24px", paddingTop: "24px", borderTop: "1px solid #e2e8f0", justifyContent: "flex-end" }}>
                    <button
                      className="tpq-btn tpq-btn--primary"
                      onClick={handleAddResource}
                      disabled={loading}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      {loading ? (
                        <Loader2 size={16} className="spin" />
                      ) : (
                        <Plus size={16} />
                      )}
                      {loading ? "Adding..." : "Add Resource"}
                    </button>
                    <button
                      className="tpq-btn tpq-btn--secondary"
                      onClick={() => {
                        setShowAddForm(false);
                        setError("");
                        setSuccess("");
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Resource Modal Dialog */}
        {showEditForm && selectedResource && (
          <div
            className="tpq-modal-overlay"
            style={{ zIndex: 2000 }}
            onClick={() => {
              setShowEditForm(false);
              setError("");
            }}
          >
            <div
              className="tpq-modal tpq-modal--large"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="tpq-modal-header">
                <h2>Edit Resource</h2>
                <button
                  className="tpq-modal-close"
                  onClick={() => {
                    setShowEditForm(false);
                    setError("");
                    setSuccess("");
                    setSelectedResource(null);
                  }}
                >
                  ×
                </button>
              </div>
              <div className="tpq-modal-content">
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

                <div className="tpq-stack" style={{ gap: "16px" }}>
                  <div style={{ marginBottom: "16px", padding: "12px", backgroundColor: "#f7fafc", borderRadius: "6px" }}>
                    <div style={{ fontWeight: 600, marginBottom: "8px", fontSize: "14px" }}>
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
                          name="editResourceType"
                          value="project-specific"
                          checked={resourceType === "project-specific"}
                          onChange={(e) => {
                            setResourceType(e.target.value);
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
                          name="editResourceType"
                          value="global"
                          checked={resourceType === "global"}
                          onChange={(e) => {
                            setResourceType(e.target.value);
                          }}
                        />
                        <span>Global</span>
                      </label>
                    </div>
                  </div>

                  {resourceType === "project-specific" && (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "12px",
                        marginBottom: "16px",
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
                  
                  {/* Update and Delete buttons at bottom right of content */}
                  <div style={{ display: "flex", gap: "12px", marginTop: "24px", paddingTop: "24px", borderTop: "1px solid #e2e8f0", justifyContent: "flex-end" }}>
                    <button
                      className="tpq-btn tpq-btn--primary"
                      onClick={handleUpdateResource}
                      disabled={loading}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
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
                      className="tpq-btn"
                      onClick={() => {
                        if (selectedResource) {
                          handleDeleteResource(selectedResource.id);
                        }
                      }}
                      disabled={loading}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        backgroundColor: "#fee2e2",
                        color: "#dc2626",
                        border: "1px solid #fecaca",
                      }}
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                    <button
                      className="tpq-btn tpq-btn--secondary"
                      onClick={() => {
                        setShowEditForm(false);
                        setError("");
                        setSuccess("");
                        setSelectedResource(null);
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Show all resources */}
        {searchResults.length > 0 && (
          <div className="tpq-card">
            <div style={{ fontWeight: 700, marginBottom: "16px" }}>
              All Resources ({searchResults.length})
            </div>
            <div className="tpq-stack" style={{ gap: "12px" }}>
              {searchResults.map((resource) => (
                <div
                  key={resource.id}
                  style={{
                    padding: "16px",
                    border: "1px solid #cbd5e0",
                    borderRadius: "6px",
                    backgroundColor: selectedResource?.id === resource.id ? "#eff6ff" : "white",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onClick={() => handleSelectResource(resource)}
                  onMouseEnter={(e) => {
                    if (selectedResource?.id !== resource.id) {
                      e.currentTarget.style.backgroundColor = "#f7fafc";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedResource?.id !== resource.id) {
                      e.currentTarget.style.backgroundColor = "white";
                    }
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
                      {getResourceIcon(resource.format, resource.type)}
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
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResourcesTab;
