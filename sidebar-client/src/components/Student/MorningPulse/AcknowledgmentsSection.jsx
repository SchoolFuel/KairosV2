import React from 'react';
import { MessageSquare, X } from 'lucide-react';

export const AcknowledgmentsSection = ({
  acknowledgments = [],
  onClear,
  bgGradient = "from-purple-50 to-indigo-50",
  borderColor = "border-purple-200",
  iconColor = "text-purple-600",
  titleColor = "text-purple-900",
  itemColor = "text-gray-700",
  className = "mb-4"
}) => {
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const baseClasses = "flex items-center justify-center px-4 py-2 font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 text-sm";
  const submitClasses = `${baseClasses} bg-purple-600 text-white hover:bg-purple-700 disabled:bg-gray-300`;
  const clearClasses = `${baseClasses} bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300 disabled:bg-gray-50`;

  const handleSubmit = () => {
    console.log("Submit button clicked!");
  };

  if (acknowledgments.length === 0) {
    return null;
  }

  return (
    <div className={`bg-gradient-to-br ${bgGradient} border ${borderColor} rounded-lg p-4 ${className} relative`}>
      <div className="flex items-center space-x-2 mb-3">
        <MessageSquare className={`w-5 h-5 ${iconColor}`} />
        <h4 className={`font-semibold ${titleColor}`}>Acknowledgments</h4>
      </div>

      <div className="space-y-2 pb-3">
        {acknowledgments.map((ack, index) => (
          <div key={index} className="flex items-center space-x-2 p-2 bg-white bg-opacity-50 rounded-lg">
            <span className="text-lg">{ack.emoji}</span>
            <div className="flex-1">
              <p className={`text-sm ${itemColor}`}>
                <span className="font-medium">{ack.user}</span> reacted {ack.emoji} to{' '}
                <span className="font-medium">{ack.peerName}</span>: "{ack.messageContent}"
              </p>
              <p className="text-xs text-gray-500">
                {formatTimestamp(ack.timestamp)}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex space-x-2">
        <button
          onClick={handleSubmit}
          className={submitClasses}
          title="Submit all selected reactions"
        >
          <span>Submit</span>
        </button>

        <button
          onClick={onClear}
          className={clearClasses}
          title="Clear all reactions"
        >
          <span>Clear</span>
        </button>
      </div>

    </div>
  );
};
