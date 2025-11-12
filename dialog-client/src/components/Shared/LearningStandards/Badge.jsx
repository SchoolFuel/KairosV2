import React from "react";
const Badge = ({ children, variant = "default", style }) => {
  const variants = {
    grade: "bg-emerald-100 text-emerald-700 border-emerald-200",
    subject: "bg-purple-100 text-purple-700 border-purple-200",
    code: "bg-blue-50 text-blue-700 border-blue-200",
    default: "bg-gray-100 text-gray-700 border-gray-200",
  };

  // If style prop is provided, use it and override className colors
  const className = style
    ? `px-2.5 py-1 text-xs font-semibold rounded-md border`
    : `px-2.5 py-1 text-xs font-semibold rounded-md border ${variants[variant]}`;

  return (
    <span className={className} style={style}>
      {children}
    </span>
  );
};
export default Badge;
