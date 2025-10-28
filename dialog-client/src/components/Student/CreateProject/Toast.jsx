import React, { useEffect } from 'react';
import { Clock, CheckCircle, AlertCircle, X } from 'lucide-react';

const Toast = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const colors = {
    success: 'bg-green-50 border-green-500 text-green-800',
    error: 'bg-red-50 border-red-500 text-red-800',
    info: 'bg-blue-50 border-blue-500 text-blue-800'
  };

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-600" />,
    error: <AlertCircle className="w-5 h-5 text-red-600" />,
    info: <Clock className="w-5 h-5 text-blue-600" />
  };

  return (
    <div className={`fixed top-6 right-6 z-50 ${colors[type]} border-l-4 rounded-lg shadow-lg p-4 pr-12 max-w-md animate-slide-in`}>
      <div className="flex items-center gap-3">
        {icons[type]}
        <p className="font-medium text-sm">{message}</p>
      </div>
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
export default Toast;