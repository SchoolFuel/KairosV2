import React from 'react';
import { Lock, AlertCircle } from 'lucide-react';
const ConfirmModal = ({ isOpen, onConfirm, onCancel, title, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 animate-slide-in">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          </div>
        </div>
        
        <div className="p-6">
          <p className="text-gray-700 leading-relaxed">{message}</p>
        </div>
        
        <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-6 py-2.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-2.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold flex items-center gap-2"
          >
            <Lock className="w-4 h-4" />
            Yes, Lock & Submit
          </button>
        </div>
      </div>
    </div>
  );
};
export default ConfirmModal;