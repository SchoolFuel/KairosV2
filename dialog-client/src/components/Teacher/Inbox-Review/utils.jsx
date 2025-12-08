import React from "react";
import { CheckCircle, XCircle, Clock } from "lucide-react";

/**
 * Parse JSON string safely, return original if not JSON
 */
export const parseMaybeJSON = (v) => {
  if (typeof v !== "string") return v;
  try {
    return JSON.parse(v);
  } catch {
    return v;
  }
};

/**
 * Safely preview a value as JSON string
 */
export const safePreview = (v, n = 240) => {
  try {
    return JSON.stringify(parseMaybeJSON(v)).slice(0, n);
  } catch {
    return String(v).slice(0, n);
  }
};

/**
 * Deep clone an object
 */
export const deepClone = (obj) =>
  typeof structuredClone === "function"
    ? structuredClone(obj)
    : JSON.parse(JSON.stringify(obj));

/**
 * Get CSS class for status pill
 */
export function pillClass(status) {
  const s = (status || "").toLowerCase();
  if (s.includes("project change")) return "is-project-change";
  if (s.includes("approve")) return "is-approve";
  if (s.includes("reject") || s.includes("revision")) return "is-reject";
  if (s.includes("pending") || s.includes("new project")) return "is-pending";
  return "is-neutral";
}

/**
 * Get status icon component
 */
export function getStatusIcon(status) {
  const s = (status || "").toLowerCase();
  if (s.includes("approve"))
    return <CheckCircle className="status-icon approved" />;
  if (s.includes("reject") || s.includes("revision"))
    return <XCircle className="status-icon rejected" />;
  if (s.includes("pending") || s.includes("new project"))
    return <Clock className="status-icon pending" />;
  return <Clock className="status-icon neutral" />;
}
