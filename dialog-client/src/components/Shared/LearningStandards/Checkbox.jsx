import React from 'react';
import { Check } from 'lucide-react';
const Checkbox = ({ checked, onChange, id }) => {
  return (
    <div className="relative">
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={onChange}
        className="w-5 h-5 border-2 border-gray-300 rounded cursor-pointer appearance-none transition-all checked:bg-blue-600 checked:border-blue-600 hover:border-blue-500"
      />
      {checked && (
        <Check className="absolute top-0.5 left-0.5 w-4 h-4 text-white pointer-events-none" strokeWidth={3} />
      )}
    </div>
  );
};
export default Checkbox;