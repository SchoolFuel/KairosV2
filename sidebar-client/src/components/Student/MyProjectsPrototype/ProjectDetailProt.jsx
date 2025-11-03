import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export default function PrototypeDialog({ htmlFilePath, onClose }) {
  useEffect(() => {
    // Prevent background scrolling when modal is open
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'auto'; };
  }, []);

  // Build a full absolute URL for the iframe
  const fullPath = `${window.location.origin}${htmlFilePath.startsWith('/') ? '' : '/'}${htmlFilePath}`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white rounded-lg shadow-xl relative w-[90%] max-w-[850px] max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-3 border-b border-gray-200 bg-gray-50">
          <h2 className="text-base font-semibold text-gray-800">Project Prototype</h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-200"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Embedded HTML content */}
        <iframe
          src={fullPath}
          title="Prototype Preview"
          className="flex-grow w-full border-none"
          style={{
            height: 'calc(90vh - 50px)',
            backgroundColor: '#f8fafc',
          }}
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
        ></iframe>
      </div>
    </div>
  );
}
