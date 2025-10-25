export const DashboardSection = ({ 
  title, 
  icon: Icon, 
  items, 
  bgGradient = "from-blue-50 to-indigo-50",
  borderColor = "border-blue-200",
  iconColor = "text-blue-600",
  titleColor = "text-blue-900",
  itemColor = "text-blue-800",
  dotColor = "bg-blue-500",
  maxHeight = null,
  renderItem = null,
  className = "mb-4"
}) => (
  <div className={`bg-gradient-to-br ${bgGradient} border ${borderColor} rounded-lg p-4 ${className}`}>
    <div className="flex items-center space-x-2 mb-3">
      <Icon className={`w-5 h-5 ${iconColor}`} />
      <h4 className={`font-semibold ${titleColor}`}>{title}</h4>
    </div>
    <div className={`space-y-2 ${maxHeight ? `max-h-${maxHeight} overflow-y-auto` : ''}`}>
      {items.map((item, index) => (
        <div key={index} className="flex items-start space-x-2">
          <div className={`w-2 h-2 ${dotColor} rounded-full mt-1.5 flex-shrink-0`}></div>
          {renderItem ? renderItem(item, index) : (
            <span className={`text-sm ${itemColor} leading-relaxed`}>
              {typeof item === 'string' ? item : item.text || item.message}
            </span>
          )}
        </div>
      ))}
    </div>
  </div>
);

// export const DashboardSection = ({ 
//   title, 
//   icon: Icon, 
//   items, 
//   bgGradient = "from-blue-50 to-indigo-50",
//   borderColor = "border-blue-200",
//   iconColor = "text-blue-600",
//   titleColor = "text-blue-900",
//   itemColor = "text-blue-800",
//   dotColor = "bg-blue-500",
//   maxHeight = null,
//   renderItem = null,
//   className = "mb-4",
//   onSelectChange = null,  // Optional prop for onChange handler
//   selectedValue = null    // Optional prop for controlled select
// }) => (
//   <div className={`bg-gradient-to-br ${bgGradient} border ${borderColor} rounded-lg p-4 ${className}`}>
//     <div className="flex items-center space-x-2 mb-3">
//       <Icon className={`w-5 h-5 ${iconColor}`} />
//       <h4 className={`font-semibold ${titleColor}`}>{title}</h4>
//     </div>

//     <div>
//       <select
//         className={`w-full p-2 rounded border ${itemColor} border-gray-300`}
//         onChange={onSelectChange}
//         value={selectedValue} // optional controlled value
//       >
//         {items.map((item, index) => {
//           // Extract label/value from the item (string or object)
//           const optionLabel = typeof item === 'string' ? item : item.text || item.message || `Option ${index+1}`;
//           const optionValue = optionLabel; // or customize as needed
//           return (
//             <option key={index} value={optionValue}>
//               {optionLabel}
//             </option>
//           );
//         })}
//       </select>
//     </div>
//   </div>
// );
