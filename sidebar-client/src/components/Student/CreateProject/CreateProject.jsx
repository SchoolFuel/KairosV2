import React, { useState } from 'react';
import { FolderPlus, ChevronDown } from 'lucide-react';

export default function CreateProject() {
  const [isExpanded, setIsExpanded] = useState(false);

  const openCreateProjectDialog = () => {
    try {
      google.script.run
        .withSuccessHandler(() => {
          console.log("Dialog opened successfully");
        })
        .withFailureHandler((err) => {
          console.error(err);
        })
        .openDialog("create-project", "Create Project");
    } catch (err) {
      console.log("Error opening dialog: ", err);
    }
  };

  return (
    <div className="w-full max-w-[300px] font-sans">
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm w-full overflow-hidden transition-all duration-200">
        {/* Toggle Button */}
        <div 
          onClick={() => setIsExpanded(!isExpanded)} 
          className="w-full p-3 cursor-pointer transition-colors duration-200 hover:bg-gray-50"
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="relative">
                <FolderPlus className="w-5 h-5 text-gray-600" />
                <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-gray-400"></div>
              </div>
              <div>
                <div className="font-medium text-gray-900">Create Project</div>
                <div className="text-sm text-gray-500">
                  Create amazing projects
                </div>
              </div>
            </div>
            <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
          </div>
        </div>

        {/* Expandable Content */}
        {isExpanded && (
          <div className="border-t border-gray-100">
            <div className="p-3">
              <div className="mb-3">
                <button
                  onClick={openCreateProjectDialog}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium transition-colors hover:bg-purple-700"
                >
                  <FolderPlus className="w-4 h-4" />
                  <span>Generate Project</span>
                </button>
              </div>

              {/* Tips */}
              <div className="mt-3 bg-gray-50 border border-gray-200 p-2 rounded-lg">
                <h5 className="text-xs font-medium text-gray-900 mb-1">💡 Tips for Better Projects:</h5>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• Describe your learning objectives clearly</li>
                  <li>• Mention target skill level or grade</li>
                  <li>• Include preferred duration or scope</li>
                  <li>• Specify any required tools or resources</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}