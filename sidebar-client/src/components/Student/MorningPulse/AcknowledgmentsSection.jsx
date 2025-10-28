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

  if (acknowledgments.length === 0) {
    return null;
  }

  return (
    <div className={`bg-gradient-to-br ${bgGradient} border ${borderColor} rounded-lg p-4 ${className} relative`}>
      <div className="flex items-center space-x-2 mb-3">
        <MessageSquare className={`w-5 h-5 ${iconColor}`} />
        <h4 className={`font-semibold ${titleColor}`}>Acknowledgments</h4>
      </div>

      <div className="space-y-2 pb-8">
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

      {/* Clear button positioned at bottom right */}
      <button
        onClick={onClear}
        className="absolute bottom-2 right-2 flex items-center space-x-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors duration-200"
        title="Clear all acknowledgments"
      >
        <X className="w-3 h-3" />
        <span>Clear</span>
      </button>
    </div>
  );
};
