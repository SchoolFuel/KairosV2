import React, { useState, useEffect } from 'react';
import { Edit2, Save, X } from 'lucide-react';

const InlineEditableField = ({ 
  value, 
  onSave, 
  multiline = false, 
  placeholder = "",
  className = "",
  displayClassName = "",
  isEditable = true,
  isLocked = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);

  useEffect(() => {
    setTempValue(value);
  }, [value]);

  const handleStart = (e) => {
    e.stopPropagation(); // Prevent event bubbling
    if (!isEditable || isLocked) return;
    setTempValue(value);
    setIsEditing(true);
  };

  const handleSave = (e) => {
    e?.stopPropagation();
    onSave(tempValue);
    setIsEditing(false);
  };

  const handleCancel = (e) => {
    e?.stopPropagation();
    setTempValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    e.stopPropagation();
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const handleInputChange = (e) => {
    e.stopPropagation();
    setTempValue(e.target.value);
  };

  if (isEditing) {
    return (
      <div className="flex items-start gap-1" onClick={(e) => e.stopPropagation()}>
        {multiline ? (
          <textarea
            value={tempValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            placeholder={placeholder}
            className={`flex-1 p-1 border rounded text-xs resize-none bg-white ${className}`}
            rows={2}
            autoFocus
          />
        ) : (
          <input
            type="text"
            value={tempValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            placeholder={placeholder}
            className={`flex-1 p-1 border rounded text-xs bg-white ${className}`}
            autoFocus
          />
        )}
        <div className="flex gap-1">
          <button
            onClick={handleSave}
            className="p-1 text-green-600 hover:bg-green-50 rounded"
            title="Save"
          >
            <Save size={10} />
          </button>
          <button
            onClick={handleCancel}
            className="p-1 text-red-600 hover:bg-red-50 rounded"
            title="Cancel"
          >
            <X size={10} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`group flex items-start gap-1 ${(!isEditable || isLocked) ? 'cursor-default' : 'cursor-text hover:bg-blue-50'} ${displayClassName ? 'p-1 rounded' : ''}`} 
      onClick={handleStart}
    >
      <div className={`flex-1 min-h-[16px] ${displayClassName}`}>
        {value || <span className="text-gray-400 italic">{placeholder}</span>}
      </div>
      {isEditable && !isLocked && (
        <button
          className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-100 rounded transition-opacity"
          title="Click to edit"
          onClick={handleStart}
        >
          <Edit2 size={8} />
        </button>
      )}
    </div>
  );
};

export default InlineEditableField;