import React, { useState, useEffect } from "react";
import { Plus, X, Loader2, Save } from "lucide-react";

const ReviewGateStandard = ({
  gate,
  isEditable,
  isFrozen,
  onUpdate,
  projectId,
  stageId,
  invokerEmail,
  studentId,
  gateId,
}) => {
  const isDisabled = isFrozen || !isEditable;
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [gateStandardsData, setGateStandardsData] = useState(null);
  const [loadingGateStandards, setLoadingGateStandards] = useState(false);
  const [gateStandardsError, setGateStandardsError] = useState(null);
  const [savingGateStandards, setSavingGateStandards] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState(null);
  const [saveErrorMessage, setSaveErrorMessage] = useState(null);

  // Normalize checklist: convert old string format to new object format, always return exactly 4 items
  const normalizeChecklist = (checklist) => {
    const defaultItems = Array(4)
      .fill(null)
      .map(() => ({
        text: "",
        learningStandards: [],
        status: "",
        due_date: "",
        feedback: "",
      }));

    if (!checklist || !Array.isArray(checklist)) return defaultItems;

    // Map existing items
    const mapped = checklist.map((item, index) => {
      // If it's already an object with the new structure, return it
      if (typeof item === "object" && item !== null) {
        return {
          text: item.text || item.description || "",
          learningStandards: item.learningStandards || item.standards || [],
          status: item.status || "",
          due_date: item.due_date || "",
          feedback: item.feedback || "",
          gate_checklist_id: item.gate_checklist_id,
          reviewer_id: item.reviewer_id,
          assigned_to: item.assigned_to,
        };
      }
      // If it's a string (old format), convert to new format
      return {
        text: typeof item === "string" ? item : "",
        learningStandards: [],
        status: "",
        due_date: "",
        feedback: "",
      };
    });

    // Ensure we have exactly 4 items
    for (let i = 0; i < 4; i++) {
      if (mapped[i]) {
        defaultItems[i] = mapped[i];
      }
    }

    return defaultItems;
  };

  const [checklistItems, setChecklistItems] = useState(() => {
    return normalizeChecklist(gate?.checklist);
  });

  // Load gate standards from API
  const loadGateStandards = React.useCallback(async () => {
    if (!projectId || !stageId || !invokerEmail) return;

    setLoadingGateStandards(true);
    setGateStandardsError(null);

    try {
      const response = await new Promise((resolve, reject) => {
        google.script.run
          .withSuccessHandler(resolve)
          .withFailureHandler(reject)
          .getGateStandards(projectId, invokerEmail);
      });

      console.log("Gate standards API response:", response);

      // Handle different response structures
      let apiData = null;
      if (response.success) {
        // Try multiple paths for response data
        if (response.action_response?.response) {
          apiData = response.action_response.response;
        } else if (response.data?.action_response?.response) {
          apiData = response.data.action_response.response;
        } else if (response.data?.response) {
          apiData = response.data.response;
        } else if (response.response) {
          apiData = response.response;
        }
      }

      if (apiData && apiData.stages) {
        // Find the stage data for current stageId
        const stageData = apiData.stages.find((s) => s.stage_id === stageId);

        console.log("Found stage data for stageId:", stageId, stageData);

        if (stageData && stageData.checklists) {
          // Transform API data to component format
          const transformedChecklists = stageData.checklists.map(
            (checklist) => ({
              text: checklist.gate_checklist_title || "",
              description: checklist.gate_checklist_description || "",
              learningStandards: (checklist.standards || []).map((std) => ({
                lsCode: std.code || "",
                lsDescription: std.description || "",
                percentage: parseFloat(std.percentage) || 0,
                gate_standard: std.gate_standard,
                standard_id: std.standard_id,
              })),
              status: checklist.status,
              due_date: checklist.due_date,
              feedback: checklist.feedback,
              reviewer_id: checklist.reviewer_id,
              assigned_to: checklist.assigned_to,
              gate_checklist_id: checklist.gate_checklist_id,
            })
          );

          console.log("Transformed checklists:", transformedChecklists);

          // Ensure we have exactly 4 items (pad with empty if needed)
          while (transformedChecklists.length < 4) {
            transformedChecklists.push({
              text: "",
              description: "",
              learningStandards: [],
              status: "",
              due_date: "",
              feedback: "",
            });
          }

          setGateStandardsData({
            stageData,
            checklists: transformedChecklists,
          });

          // Update checklist items with API data
          setChecklistItems(transformedChecklists.slice(0, 4));
        } else {
          console.warn("No checklists found for stage:", stageId);
        }
      } else {
        console.warn("No stages data found in API response");
      }
    } catch (error) {
      console.error("Error loading gate standards:", error);
      setGateStandardsError(error.message || "Failed to load gate standards");
    } finally {
      setLoadingGateStandards(false);
    }
  }, [projectId, stageId, invokerEmail]);

  // Fetch gate standards from API when component mounts or projectId/stageId changes
  useEffect(() => {
    if (projectId && stageId && invokerEmail) {
      loadGateStandards();
    }
  }, [projectId, stageId, invokerEmail, loadGateStandards]);

  // Update local state when gate prop changes
  useEffect(() => {
    // Only use gate prop data if we don't have API data
    if (!gateStandardsData) {
      const normalized = normalizeChecklist(gate?.checklist);
      setChecklistItems(normalized);
    }
    // Ensure active tab is valid (0-3)
    if (activeTabIndex >= 4) {
      setActiveTabIndex(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gate?.checklist, gateStandardsData]);

  // Update checklist item description
  const updateChecklistText = (index, value) => {
    if (isDisabled) return;

    const updated = [...checklistItems];
    updated[index] = {
      ...updated[index],
      text: value,
    };

    setChecklistItems(updated);

    // Notify parent component
    if (onUpdate) {
      onUpdate("checklist", null, updated);
    }
  };

  // Add new learning standard to a checklist item
  const addLearningStandard = (checklistIndex) => {
    if (isDisabled) return;

    const updated = [...checklistItems];
    if (!updated[checklistIndex].learningStandards) {
      updated[checklistIndex].learningStandards = [];
    }

    updated[checklistIndex].learningStandards.push({
      lsCode: "",
      lsDescription: "",
      percentage: 0,
    });

    setChecklistItems(updated);

    // Notify parent component
    if (onUpdate) {
      onUpdate("checklist", null, updated);
    }
  };

  // Update learning standard field
  const updateLearningStandard = (checklistIndex, lsIndex, field, value) => {
    if (isDisabled) return;

    const updated = [...checklistItems];
    const ls = updated[checklistIndex].learningStandards[lsIndex];

    // Validate percentage
    if (field === "percentage") {
      const numValue = parseFloat(value) || 0;
      ls.percentage = Math.min(100, Math.max(0, numValue));
    } else {
      ls[field] = value;
    }

    setChecklistItems(updated);

    // Notify parent component
    if (onUpdate) {
      onUpdate("checklist", null, updated);
    }
  };

  // Remove learning standard
  const removeLearningStandard = (checklistIndex, lsIndex) => {
    if (isDisabled) return;

    const currentItem = checklistItems[checklistIndex];
    const learningStandard = currentItem?.learningStandards?.[lsIndex];

    // Remove from UI state immediately for instant feedback
    const updated = [...checklistItems];
    updated[checklistIndex].learningStandards = updated[
      checklistIndex
    ].learningStandards.filter((_, i) => i !== lsIndex);

    setChecklistItems(updated);

    // Notify parent component immediately
    if (onUpdate) {
      onUpdate("checklist", null, updated);
    }

    // Call backend API to delete the gate standard in the background (non-blocking)
    // Use gate_standard field if available, otherwise fall back to standard_id
    const gateStandardId =
      learningStandard?.gate_standard || learningStandard?.standard_id;
    if (gateStandardId && invokerEmail) {
      // Call API asynchronously without blocking UI
      google.script.run
        .withSuccessHandler((response) => {
          if (!response.success) {
            console.error(
              "Failed to delete gate standard from backend:",
              response.message
            );
            setSaveErrorMessage(
              response.message ||
                "Failed to delete gate standard from backend. Please refresh and try again."
            );
          }
        })
        .withFailureHandler((error) => {
          console.error("Error deleting gate standard:", error);
          setSaveErrorMessage(
            error.message ||
              "Failed to delete gate standard from backend. Please refresh and try again."
          );
        })
        .deleteGateStandard(gateStandardId, invokerEmail);
    }
  };

  // Update checklist metadata (status, due_date, feedback)
  const updateChecklistMetadata = (index, field, value) => {
    if (isDisabled) return;

    const updated = [...checklistItems];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };

    setChecklistItems(updated);

    // Notify parent component
    if (onUpdate) {
      onUpdate("checklist", null, updated);
    }
  };

  // Get effective gate_id from props or API data
  const getEffectiveGateId = () => {
    if (gateId) return gateId;
    if (gate?.gate_id) return gate.gate_id;
    if (gateStandardsData?.stageData?.gate_id)
      return gateStandardsData.stageData.gate_id;
    return null;
  };

  // Transform checklist items to API payload format
  const transformChecklistToPayload = () => {
    const effectiveGateId = getEffectiveGateId();
    if (!effectiveGateId) {
      throw new Error("Gate ID is required to save gate standards");
    }

    const checklists = checklistItems.map((item) => {
      // Filter out empty learning standards and deduplicate by standard_id
      const standardsMap = new Map();
      (item.learningStandards || []).forEach((ls) => {
        if (ls.standard_id) {
          // Use standard_id as key to deduplicate
          if (!standardsMap.has(ls.standard_id)) {
            standardsMap.set(ls.standard_id, {
              standard_id: ls.standard_id,
              percentage: parseFloat(ls.percentage) || 0,
            });
          }
        }
      });

      return {
        gate_checklist_title: item.text || "",
        gate_checklist_description: item.description || item.text || "",
        status: item.status || "Pending",
        standards: Array.from(standardsMap.values()),
      };
    });

    return {
      stage_id: stageId,
      gate_id: effectiveGateId,
      checklists: checklists,
    };
  };

  // Handle save gate standards
  const handleSaveGateStandards = async () => {
    if (!projectId || !stageId || !studentId || !invokerEmail) {
      setSaveErrorMessage(
        "Missing required data (projectId, stageId, studentId, or invokerEmail)"
      );
      return;
    }

    setSavingGateStandards(true);
    setSaveErrorMessage(null);
    setSaveSuccessMessage(null);

    try {
      const stagePayload = transformChecklistToPayload();

      const payload = {
        project_id: projectId,
        student_id: studentId,
        invoker_email: invokerEmail,
        stages: [stagePayload], // Save only the current stage
      };

      console.log(
        "Saving gate standards payload:",
        JSON.stringify(payload, null, 2)
      );

      const response = await new Promise((resolve, reject) => {
        google.script.run
          .withSuccessHandler(resolve)
          .withFailureHandler(reject)
          .saveGateStandards(payload);
      });

      if (response.success) {
        setSaveSuccessMessage("Gate standards saved successfully!");
        // Optionally reload gate standards after save
        // loadGateStandards();
      } else {
        setSaveErrorMessage(
          response.message || "Failed to save gate standards"
        );
      }
    } catch (error) {
      console.error("Error saving gate standards:", error);
      setSaveErrorMessage(error.message || "Failed to save gate standards");
    } finally {
      setSavingGateStandards(false);
    }
  };

  // Auto-dismiss success/error messages after 7 seconds
  useEffect(() => {
    if (saveSuccessMessage) {
      const timer = setTimeout(() => {
        setSaveSuccessMessage(null);
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [saveSuccessMessage]);

  useEffect(() => {
    if (saveErrorMessage) {
      const timer = setTimeout(() => {
        setSaveErrorMessage(null);
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [saveErrorMessage]);

  const currentItem = checklistItems[activeTabIndex] || {
    text: "",
    learningStandards: [],
    status: "",
    due_date: "",
    feedback: "",
  };

  // Get API data for current item, merge with local state
  const currentItemApiData = gateStandardsData?.checklists?.[activeTabIndex];

  // Use local state first (which may include API data that was loaded), then fall back to API data
  // This allows local edits to override API data
  const effectiveStatus =
    currentItem.status !== undefined && currentItem.status !== ""
      ? currentItem.status
      : currentItemApiData?.status || "";
  const effectiveDueDate =
    currentItem.due_date !== undefined && currentItem.due_date !== ""
      ? currentItem.due_date
      : currentItemApiData?.due_date || "";
  const effectiveFeedback =
    currentItem.feedback !== undefined && currentItem.feedback !== ""
      ? currentItem.feedback
      : currentItemApiData?.feedback || "";

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      {/* Loading State */}
      {loadingGateStandards && (
        <div className="mb-4 p-4 bg-white rounded-lg border border-blue-200 flex items-center gap-3">
          <Loader2 className="animate-spin text-blue-600" size={20} />
          <span className="text-sm text-gray-600">
            Loading gate standards...
          </span>
        </div>
      )}

      {/* Error State */}
      {gateStandardsError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">
            Error loading gate standards: {gateStandardsError}
          </p>
        </div>
      )}
      <div className="mb-3">
        <label className="block text-xs font-semibold text-blue-900 mb-1">
          GATE TITLE
        </label>
        {isEditable && !isFrozen ? (
          <input
            type="text"
            value={gate?.title || ""}
            onChange={(e) =>
              onUpdate && onUpdate("title", null, e.target.value)
            }
            className="w-full px-3 py-2 border border-blue-300 rounded-lg bg-white text-sm font-medium text-blue-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
            disabled={isDisabled}
          />
        ) : (
          gate?.title && (
            <div className="w-full px-3 py-2 border border-blue-200 rounded-lg bg-white text-sm font-medium text-blue-900">
              {gate.title}
            </div>
          )
        )}
      </div>

      <div className="mb-3">
        <label className="block text-xs font-semibold text-blue-900 mb-1">
          DESCRIPTION
        </label>
        {isEditable && !isFrozen ? (
          <textarea
            value={gate?.description || ""}
            onChange={(e) =>
              onUpdate && onUpdate("description", null, e.target.value)
            }
            className="w-full px-3 py-2 border border-blue-300 rounded-lg bg-white text-sm text-blue-800 min-h-[3rem] whitespace-pre-wrap focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-y"
            disabled={isDisabled}
          />
        ) : (
          gate?.description && (
            <div className="w-full px-3 py-2 border border-blue-200 rounded-lg bg-white text-sm text-blue-800 min-h-[3rem] whitespace-pre-wrap">
              {gate.description}
            </div>
          )
        )}
      </div>

      <div>
        <label className="block text-xs font-semibold text-blue-900 mb-2">
          CHECKLIST
        </label>

        {isEditable && !isFrozen ? (
          <div>
            {/* Tabs */}
            <div className="flex gap-1 mb-3 border-b border-blue-300 overflow-x-auto">
              {checklistItems.map((item, index) => (
                <button
                  key={index}
                  onClick={() => setActiveTabIndex(index)}
                  className={`px-3 py-2 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
                    activeTabIndex === index
                      ? "border-blue-600 text-blue-900 bg-blue-100"
                      : "border-transparent text-blue-700 hover:text-blue-900 hover:bg-blue-50"
                  }`}
                  disabled={isDisabled}
                >
                  Checklist {index + 1}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {currentItem && (
              <div className="space-y-4 bg-white rounded-lg p-4 border border-blue-200">
                {/* Checklist Description */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Checklist Description
                  </label>
                  <input
                    type="text"
                    value={currentItem.text || ""}
                    onChange={(e) =>
                      updateChecklistText(activeTabIndex, e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    disabled={isDisabled}
                    placeholder="Enter checklist description"
                  />
                </div>

                {/* Learning Standards Section */}
                <div>
                  <div className="mb-2">
                    <label className="block text-xs font-semibold text-gray-700">
                      Learning Standards
                    </label>
                  </div>

                  {/* Learning Standards List */}
                  <div className="space-y-3">
                    {(!currentItem.learningStandards ||
                      currentItem.learningStandards.length === 0) && (
                      <div className="text-center py-4 text-sm text-gray-500">
                        No learning standards added yet. Click "Add Standard"
                        below to add one.
                      </div>
                    )}

                    {(currentItem.learningStandards || []).map(
                      (ls, lsIndex) => (
                        <div
                          key={lsIndex}
                          className="p-3 border border-gray-200 rounded-lg bg-gray-50 space-y-2"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-gray-600">
                              Learning Standard {lsIndex + 1}
                            </span>
                            <button
                              onClick={() =>
                                removeLearningStandard(activeTabIndex, lsIndex)
                              }
                              className="text-red-600 hover:text-red-800"
                              disabled={isDisabled}
                            >
                              <X size={14} />
                            </button>
                          </div>
                          
                          {/* LS Description*/}
                          <div className="mb-3">
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              LS Description
                            </label>
                            <input
                              type="text"
                              value={ls.lsDescription || ""}
                              onChange={(e) =>
                                updateLearningStandard(
                                  activeTabIndex,
                                  lsIndex,
                                  "lsDescription",
                                  e.target.value
                                )
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                              disabled={isDisabled}
                            />
                          </div>

                          {/* LS Code and Percentage - Side by Side (4:1) */}
                          <div className="flex gap-3">
                            {/* LS Code - 80% (4 parts) */}
                            <div className="flex-[4]">
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                LS Code
                              </label>
                              <input
                                type="text"
                                value={ls.lsCode || ""}
                                onChange={(e) =>
                                  updateLearningStandard(
                                    activeTabIndex,
                                    lsIndex,
                                    "lsCode",
                                    e.target.value
                                  )
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                                disabled={isDisabled}
                              />
                            </div>

                            {/* Percentage - 20% (1 part) */}
                            <div className="flex-[1]">
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Percent (≤ 100)
                              </label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="0.1"
                                  value={ls.percentage || 0}
                                  onChange={(e) =>
                                    updateLearningStandard(
                                      activeTabIndex,
                                      lsIndex,
                                      "percentage",
                                      e.target.value
                                    )
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                                  disabled={isDisabled}
                                  placeholder="0-100"
                                />
                                <span className="text-sm text-gray-500 whitespace-nowrap">
                                  %
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    )}

                    {/* Add Standard Button - Below the latest standard */}
                    <button
                      onClick={() => addLearningStandard(activeTabIndex)}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors border border-blue-300"
                      disabled={isDisabled}
                    >
                      <Plus size={14} />
                      Add Standard
                    </button>
                  </div>
                </div>

                {/* Status, Due Date, and Feedback - Below Learning Standards */}
                <div className="mt-6 pt-4 border-t border-gray-200 space-y-4">
                  {/* Status */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={effectiveStatus}
                      onChange={(e) =>
                        updateChecklistMetadata(
                          activeTabIndex,
                          "status",
                          e.target.value
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                      disabled={isDisabled}
                    >
                      <option value="">Select status</option>
                      <option value="Pending">Pending</option>
                      <option value="Approved">Approved</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>

                  {/* Due Date */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={
                        effectiveDueDate
                          ? (() => {
                              try {
                                // Handle different date formats from API (e.g., "2025-11-22 00:00:00" or ISO string)
                                const date = new Date(effectiveDueDate);
                                if (isNaN(date.getTime())) return "";
                                // Return YYYY-MM-DD format for date input
                                const year = date.getFullYear();
                                const month = String(
                                  date.getMonth() + 1
                                ).padStart(2, "0");
                                const day = String(date.getDate()).padStart(
                                  2,
                                  "0"
                                );
                                return `${year}-${month}-${day}`;
                              } catch (e) {
                                return "";
                              }
                            })()
                          : ""
                      }
                      onChange={(e) => {
                        const dateValue = e.target.value
                          ? new Date(e.target.value + "T00:00:00").toISOString()
                          : "";
                        updateChecklistMetadata(
                          activeTabIndex,
                          "due_date",
                          dateValue
                        );
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                      disabled={isDisabled}
                    />
                  </div>

                  {/* Feedback */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Feedback
                    </label>
                    <textarea
                      value={effectiveFeedback}
                      onChange={(e) =>
                        updateChecklistMetadata(
                          activeTabIndex,
                          "feedback",
                          e.target.value
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-700 min-h-[3rem] focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-y"
                      disabled={isDisabled}
                      placeholder="Enter feedback"
                    />
                  </div>
                </div>

                {/* Save Button */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <button
                    onClick={handleSaveGateStandards}
                    disabled={true}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {savingGateStandards ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        Save Gate Standards
                      </>
                    )}
                  </button>
                  {saveSuccessMessage && (
                    <div className="mt-2 text-sm text-green-600 font-medium">
                      {saveSuccessMessage}
                    </div>
                  )}
                  {saveErrorMessage && (
                    <div className="mt-2 text-sm text-red-600 font-medium">
                      {saveErrorMessage}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          // Read-only view
          <div>
            <div className="flex gap-1 mb-3 border-b border-blue-300">
              {checklistItems.map((item, index) => (
                <button
                  key={index}
                  onClick={() => setActiveTabIndex(index)}
                  className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                    activeTabIndex === index
                      ? "border-blue-600 text-blue-900 bg-blue-50"
                      : "border-transparent text-blue-700 hover:text-blue-900 hover:bg-blue-50"
                  }`}
                >
                  Checklist {index + 1}
                </button>
              ))}
            </div>
            {currentItem && (
              <div className="space-y-4 bg-white rounded-lg p-4 border border-blue-200 text-sm">
                <div>
                  <span className="font-semibold text-gray-700">
                    Checklist Description:{" "}
                  </span>
                  <span className="text-gray-600">
                    {currentItem.text || "—"}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700 mb-2 block">
                    Learning Standards:{" "}
                  </span>
                  {currentItem.learningStandards &&
                  currentItem.learningStandards.length > 0 ? (
                    <div className="space-y-2 mt-2">
                      {currentItem.learningStandards.map((ls, lsIndex) => (
                        <div
                          key={lsIndex}
                          className="p-2 border border-gray-200 rounded bg-gray-50"
                        >
                          <div className="text-xs font-medium text-gray-600 mb-1">
                            Learning Standard {lsIndex + 1}
                          </div>
                          <div className="text-xs text-gray-700 space-y-1">
                            <div className="flex gap-2">
                              <div className="flex-[4]">
                                LS Code: {ls.lsCode || "—"}
                              </div>
                              <div className="flex-[1]">
                                Percent: {ls.percentage || 0}%
                              </div>
                            </div>
                            <div>LS Description: {ls.lsDescription || "—"}</div>
                            {ls.standard_id && (
                              <div className="text-xs text-gray-500">
                                Standard ID: {ls.standard_id}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-gray-500">No learning standards</span>
                  )}
                </div>

                {/* Status, Due Date, and Feedback - Below Learning Standards (Read-only) */}
                <div className="mt-6 pt-4 border-t border-gray-200 space-y-2">
                  {effectiveStatus && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-700">
                        Status:
                      </span>
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded ${
                          effectiveStatus === "Approved"
                            ? "bg-green-100 text-green-700"
                            : effectiveStatus === "Rejected"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {effectiveStatus}
                      </span>
                    </div>
                  )}
                  {effectiveDueDate && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-700">
                        Due Date:
                      </span>
                      <span className="text-xs text-gray-600">
                        {new Date(effectiveDueDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {effectiveFeedback && (
                    <div>
                      <span className="text-xs font-semibold text-gray-700">
                        Feedback:
                      </span>
                      <p className="text-xs text-gray-600 mt-1">
                        {effectiveFeedback}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewGateStandard;
