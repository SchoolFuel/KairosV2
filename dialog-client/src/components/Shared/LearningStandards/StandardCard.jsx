import React, { useCallback } from 'react';
import Checkbox from './Checkbox'
import Badge from './Badge'
const StandardCard = ({ standard, isSelected, onToggle }) => {
  const handleClick = useCallback(() => {
    onToggle(standard.code);
  }, [standard.code, onToggle]);
  const handleCheckboxChange = useCallback((e) => {
    e.stopPropagation();
    onToggle(standard.code);
  }, [standard.code, onToggle]);

  return (
    <div
      className={`p-4 border-2 rounded-lg cursor-pointer mb-3 transition-all ${
        isSelected
          ? 'bg-blue-50 border-blue-600 shadow-sm'
          : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm hover:-translate-y-0.5'
      }`}
      onClick={handleClick}
    >
      <div className="flex items-start gap-4">
        <div onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={isSelected}
            onChange={handleCheckboxChange}
            id={`std-${standard.code}`}
          />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Badge variant="grade">{standard.grade_level}</Badge>
            <Badge variant="subject">{standard.subject_area}</Badge>
            <Badge variant="code">
              <span className="font-mono font-bold">{standard.code}</span>
            </Badge>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">
            {standard.description}
          </p>
        </div>
      </div>
    </div>
  );
};
export default StandardCard;