export const TextInputField = ({ 
  value, 
  onChange, 
  onKeyPress, 
  disabled = false,
  placeholder = "Share your thoughts...",
  title = "What's on your mind?",
  maxLength = 500,
  rows = 3,
  required = false,
  className = "mb-6"
}) => (
  <div className={className}>
    <h4 className="text-sm font-medium text-gray-700 mb-2">
      {title} {required && <span className="text-red-500">*</span>}
    </h4>
    <div className="relative">
      <textarea
        value={value}
        onChange={onChange}
        onKeyPress={onKeyPress}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        required={required}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed"
        maxLength={maxLength}
      />
      <div className="absolute bottom-2 right-2 text-xs text-gray-400">
        {value.length}/{maxLength}
      </div>
    </div>
  </div>
);