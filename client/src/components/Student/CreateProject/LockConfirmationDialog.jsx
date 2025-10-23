import React, { useState } from 'react';
import { Lock, CheckCircle, XCircle, Loader2 } from 'lucide-react';

const LockConfirmationDialog = ({ showDialog, onConfirm, onCancel, projectData }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // 'success', 'error', or null
  const [statusMessage, setStatusMessage] = useState('');

  if (!showDialog) return null;

  const handleLockAndSubmit = async () => {
    if (!projectData) {
    setSubmitStatus('error');
    setStatusMessage('No project data available to submit.');
    return;
  }
    console.log(projectData)
    const cleanProjectData = JSON.parse(JSON.stringify(projectData));
    setIsSubmitting(true);
    setSubmitStatus(null);
    setStatusMessage('');

    try {
      // Call the backend function in Code.js
      google.script.run
        .withSuccessHandler((result) => {
          setIsSubmitting(false);
          
          if (result && result.success) {
            setSubmitStatus('success');
            setStatusMessage(result.message || 'Project successfully locked and submitted for review!');
            
            // Auto-close dialog after 2 seconds on success
            setTimeout(() => {
              onConfirm(result);
            }, 2000);
          } else {
            setSubmitStatus('error');
            setStatusMessage(result.message || 'Failed to lock project. Please try again.');
          }
        })
        .withFailureHandler((error) => {
          console.error("Error calling lockProject:", error);
          setIsSubmitting(false);
          setSubmitStatus('error');
          setStatusMessage('Network error occurred. Please check your connection and try again.');
        })
        .lockProject(cleanProjectData);

    } catch (error) {
      console.error("Unexpected error:", error);
      setIsSubmitting(false);
      setSubmitStatus('error');
      setStatusMessage('An unexpected error occurred. Please try again.');
    }
  };

  const handleCancel = () => {
    if (!isSubmitting) {
      setSubmitStatus(null);
      setStatusMessage('');
      onCancel();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
      <div className="bg-white rounded-lg w-full max-w-sm mx-2">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-red-600" />
            <h2 className="text-lg font-semibold text-gray-900">Lock Project</h2>
          </div>
        </div>

        <div className="p-4">
          {/* Status Message Display */}
          {submitStatus && (
            <div className={`mb-4 p-3 rounded-lg border ${
              submitStatus === 'success' 
                ? 'bg-green-50 border-green-200 text-green-800' 
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              <div className="flex items-start gap-2">
                {submitStatus === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                )}
                <p className="text-sm font-medium">{statusMessage}</p>
              </div>
            </div>
          )}

          {/* Main Dialog Content */}
          {!submitStatus && (
            <>
              <p className="text-sm text-gray-700 mb-3">
                Are you sure you want to lock and submit this project for teacher review?
              </p>
              <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                <div className="flex items-start gap-2">
                  <span className="text-yellow-600 text-lg">⚠️</span>
                  <p className="text-sm text-yellow-800">
                    <strong>Warning:</strong> You won't be able to make any further edits after locking.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 p-4 border-t border-gray-200">
          <button
            onClick={handleCancel}
            disabled={isSubmitting}
            className={`px-4 py-2 text-sm rounded-lg transition-colors ${
              isSubmitting 
                ? 'text-gray-400 bg-gray-100 cursor-not-allowed' 
                : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
            }`}
          >
            Cancel
          </button>
          
          {!submitStatus && (
            <button
              onClick={handleLockAndSubmit}
              disabled={isSubmitting}
              className={`px-4 py-2 text-sm rounded-lg transition-colors flex items-center gap-2 ${
                isSubmitting
                  ? 'bg-red-400 text-white cursor-not-allowed'
                  : 'bg-red-600 text-white hover:bg-red-700'
              }`}
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSubmitting ? 'Submitting...' : 'Lock & Submit'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default LockConfirmationDialog;