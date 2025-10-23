import React, { useState } from 'react';
import { Users } from 'lucide-react';
import { ReactionPicker } from './ReactionPicker';

export const PeerUpdatesSection = ({
  peerData = {},
  reactions = {},
  onReaction,
  userEmail,
  bgGradient = "from-green-50 to-emerald-50",
  borderColor = "border-green-200",
  iconColor = "text-green-600",
  titleColor = "text-green-900",
  itemColor = "text-black-800",
  dotColor = "bg-green-500",
  className = "mb-4"
}) => {
  const [selectedPeer, setSelectedPeer] = useState('');

  const peerNames = Object.keys(peerData);
  const selectedPeerUpdates = selectedPeer ? peerData[selectedPeer] || [] : [];

  const handlePeerChange = (e) => {
    setSelectedPeer(e.target.value);
  };

  const handleReaction = (messageIndex, emoji, messageContent) => {
    if (onReaction && selectedPeer) {
      onReaction(selectedPeer, messageIndex, emoji, messageContent);
    }
  };

  return (
    <div className={`bg-gradient-to-br ${bgGradient} border ${borderColor} rounded-lg p-4 ${className}`}>
      <div className="flex items-center space-x-2 mb-3">
        <Users className={`w-5 h-5 ${iconColor}`} />
        <h4 className={`font-semibold ${titleColor}`}>Peer Updates</h4>
      </div>

      {/* Peer Selection Dropdown */}
      <div className="mb-4">
        <label htmlFor="peer-select" className="block mb-2 text-sm font-medium text-gray-700">
          Select a peer to view their updates:
        </label>
        <select
          id="peer-select"
          value={selectedPeer}
          onChange={handlePeerChange}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
        >
          <option value="">Choose a peer...</option>
          {peerNames.map(peerName => (
            <option key={peerName} value={peerName}>{peerName}</option>
          ))}
        </select>
      </div>

      {/* Selected Peer Updates */}
      {selectedPeer && selectedPeerUpdates.length > 0 && (
        <div className="space-y-3">
          <h5 className="text-sm font-medium text-gray-700 mb-2">
            {selectedPeer}'s Updates:
          </h5>
          <div className="space-y-2">
            {selectedPeerUpdates.map((update, index) => (
              <div key={index} className="flex items-start space-x-2 p-2 bg-white bg-opacity-50 rounded-lg">
                <div className={`w-2 h-2 ${dotColor} rounded-full mt-1.5 flex-shrink-0`}></div>
                <div className="flex-1">
                  <span className={`text-sm ${itemColor} leading-relaxed`}>
                    {update}
                  </span>
                  <div className="mt-2">
                    <ReactionPicker
                      onReaction={(emoji) => handleReaction(index, emoji, update)}
                      currentReaction={reactions[selectedPeer]?.[index]?.emoji}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedPeer && selectedPeerUpdates.length === 0 && (
        <div className="text-center py-4 text-gray-500">
          <p className="text-sm">No updates available for {selectedPeer}</p>
        </div>
      )}

      {!selectedPeer && (
        <div className="text-center py-4 text-gray-500">
          <p className="text-sm">Please select a peer to view their updates</p>
        </div>
      )}
    </div>
  );
};
