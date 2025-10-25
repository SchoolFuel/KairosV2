import { CheckCircle, Briefcase, Users, Heart } from 'lucide-react';
import { DashboardSection } from './DashboardSection';
import { PeerUpdatesSection } from './PeerUpdatesSection';
import { AcknowledgmentsSection } from './AcknowledgmentsSection';

// export const DashboardView = ({ 
//   dashboardData,
//   onReset,
//   responseMessage = '',
//   welcomeTitle = "Welcome to Your Day!",
//   welcomeSubtitle = "Here's what's happening in your learning community",
//   resetButtonText = "Submit New Morning Pulse",
//   sectionsConfig = null,
//   showResetButton = true,
//   className = ""
// }) => {
//   const defaultSectionsConfig = [
//     {
//       key: 'ValueMessage',
//       title: 'Daily Inspiration',
//       icon: Heart,
//       bgGradient: 'from-amber-50 to-orange-50',
//       borderColor: 'border-amber-200',
//       iconColor: 'text-amber-600',
//       titleColor: 'text-amber-900',
//       itemColor: 'text-amber-800',
//       dotColor: '',
//       renderItem: (item, index) => (
//           <p key={index} className="text-sm text-black-800 leading-relaxed italic">{item}</p>
//       )
//     },
//     {
//       key: 'Peers',
//       title: 'Peer Updates',
//       icon: Users,
//       bgGradient: 'from-green-50 to-emerald-50',
//       borderColor: 'border-green-200',
//       iconColor: 'text-green-600',
//       titleColor: 'text-green-900',
//       itemColor: 'text-black-800',
//       dotColor: 'bg-green-500',
//       maxHeight: '48'
//     },
//     {
//       key: 'ActiveProjects',
//       title: 'Active Projects',
//       icon: Briefcase,
//       bgGradient: 'from-blue-50 to-indigo-50',
//       borderColor: 'border-blue-200',
//       iconColor: 'text-blue-600',
//       titleColor: 'text-blue-900',
//       itemColor: 'text-black-800',
//       dotColor: 'bg-blue-500'
//     },
    
//   ];

//   const sections = sectionsConfig || defaultSectionsConfig;
//   const [selectedSectionKey, setSelectedSectionKey] = useState(sections[0].key);

//   return (
//     <div className={className}>
//       <div className="text-center mb-6">
//         <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
//         <h3 className="text-lg font-semibold text-gray-900 mb-1">{welcomeTitle}</h3>
//         <p className="text-sm text-gray-600">{welcomeSubtitle}</p>
//         {responseMessage && (
//         <p className="text-sm text-emerald-600 font-medium mt-2">{responseMessage}</p>
//         )}
//       </div>

//       <div className="space-y-4 max-h-96 overflow-y-auto">
//         {sections.map((section) => (
//           <DashboardSection
//             key={section.key}
//             title={section.title}
//             icon={section.icon}
//             items={dashboardData[section.key] || []}
//             bgGradient={section.bgGradient}
//             borderColor={section.borderColor}
//             iconColor={section.iconColor}
//             titleColor={section.titleColor}
//             itemColor={section.itemColor}
//             dotColor={section.dotColor}
//             maxHeight={section.maxHeight}
//             renderItem={section.renderItem}
//           />
//         ))}
//       </div>

//       {showResetButton && onReset && (
//         <div className="mt-6 pt-4 border-t border-gray-200">
//           <button
//             onClick={onReset}
//             className="w-full px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
//           >
//             {resetButtonText}
//           </button>
//         </div>
//       )}
//     </div>
//   );
// };

import React, { useState } from 'react';
// ... rest of imports

export const DashboardView = ({
  dashboardData,
  onReset,
  responseMessage = '',
  welcomeTitle = "Welcome to Your Day!",
  welcomeSubtitle = "Here's what's happening in your learning community",
  resetButtonText = "Submit New Morning Pulse",
  sectionsConfig = null,
  showResetButton = true,
  className = "",
  reactions = {},
  acknowledgments = [],
  onReaction = null,
  onClearAcknowledgments = null,
  userEmail = 'user@example.com'
}) => {
  const defaultSectionsConfig = [
    {
      key: 'ValueMessage',
      title: 'Daily Inspiration',
      icon: Heart,
      bgGradient: 'from-amber-50 to-orange-50',
      borderColor: 'border-amber-200',
      iconColor: 'text-amber-600',
      titleColor: 'text-amber-900',
      itemColor: 'text-amber-800',
      dotColor: '',
      renderItem: (item, index) => (
          <p key={index} className="text-sm text-black-800 leading-relaxed italic">{item}</p>
      )
    },
    {
      key: 'Peers',
      title: 'Peer Updates',
      icon: Users,
      bgGradient: 'from-green-50 to-emerald-50',
      borderColor: 'border-green-200',
      iconColor: 'text-green-600',
      titleColor: 'text-green-900',
      itemColor: 'text-black-800',
      dotColor: 'bg-green-500',
      maxHeight: '48',
      isCustomComponent: true
    },
    {
      key: 'ActiveProjects',
      title: 'Active Projects',
      icon: Briefcase,
      bgGradient: 'from-blue-50 to-indigo-50',
      borderColor: 'border-blue-200',
      iconColor: 'text-blue-600',
      titleColor: 'text-blue-900',
      itemColor: 'text-black-800',
      dotColor: 'bg-blue-500'
    },
  ];

  const sections = sectionsConfig || defaultSectionsConfig;

  // Step 2: Add state for selected section key (default to first section)
  const [selectedSectionKey, setSelectedSectionKey] = useState(sections[0].key);

  // Get the currently selected section config and items
  const selectedSection = sections.find(section => section.key === selectedSectionKey);
  const selectedItems = dashboardData[selectedSectionKey] || [];

  // Optional: an onChange handler for dropdown
  const handleSectionChange = (e) => {
    setSelectedSectionKey(e.target.value);
  };

  return (
    <div className={className}>
      <div className="text-center mb-6">
        <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
        <h3 className="text-lg font-semibold text-gray-900 mb-1">{welcomeTitle}</h3>
        <p className="text-sm text-gray-600">{welcomeSubtitle}</p>
        {responseMessage && (
          <p className="text-sm text-emerald-600 font-medium mt-2">{responseMessage}</p>
        )}
      </div>

      {/* Step 1: Dropdown to select which section to view */}
      <div className="mb-4">
        <label htmlFor="section-select" className="block mb-1 font-semibold text-black text-sm">Please select from the following:</label>
        <select
          id="section-select"
          value={selectedSectionKey}
          onChange={handleSectionChange}
          className="w-full p-2 border border-gray-300 rounded-md"
        >
          {sections.map(({ key, title }) => (
            <option key={key} value={key}>{title}</option>
          ))}
        </select>
      </div>

      {/* Step 3: Render only the selected section */}
      {selectedSection ? (
        <>
          {selectedSection.isCustomComponent && selectedSectionKey === 'Peers' ? (
            <PeerUpdatesSection
              peerData={selectedItems}
              reactions={reactions}
              onReaction={onReaction}
              userEmail={userEmail}
              bgGradient={selectedSection.bgGradient}
              borderColor={selectedSection.borderColor}
              iconColor={selectedSection.iconColor}
              titleColor={selectedSection.titleColor}
              itemColor={selectedSection.itemColor}
              dotColor={selectedSection.dotColor}
            />
          ) : (
            <DashboardSection
              title={selectedSection.title}
              icon={selectedSection.icon}
              items={selectedItems}
              bgGradient={selectedSection.bgGradient}
              borderColor={selectedSection.borderColor}
              iconColor={selectedSection.iconColor}
              titleColor={selectedSection.titleColor}
              itemColor={selectedSection.itemColor}
              dotColor={selectedSection.dotColor}
              maxHeight={selectedSection.maxHeight}
              renderItem={selectedSection.renderItem}
            />
          )}
          
          {/* Show Acknowledgments section only when Peer Updates is selected and there are acknowledgments */}
          {selectedSectionKey === 'Peers' && acknowledgments.length > 0 && (
            <AcknowledgmentsSection
              acknowledgments={acknowledgments}
              onClear={onClearAcknowledgments}
            />
          )}
        </>
      ) : (
        <p>No section selected</p>
      )}

      {showResetButton && onReset && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={onReset}
            className="w-full px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
          >
            {resetButtonText}
          </button>
        </div>
      )}
    </div>
  );
};
