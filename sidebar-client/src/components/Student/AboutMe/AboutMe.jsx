





import React, { useState, useEffect } from 'react';
import { User, ChevronDown, Mail, X, Plus, FolderKanban } from 'lucide-react';

export default function AboutMe() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  
  const [formData, setFormData] = useState({
    email_id: '',
    bio: '',
    interests: [],
    skills: [],
    endorsements: [],
    invitation: [],
    peer_project_email: '',        // 👈 used for join_a_peer.email
  });

  const [inputValues, setInputValues] = useState({
    interest: '',
    skill: '',
    endorsement: '',
    inviteEmail: ''
  });

  // 🔹 NEW: state for project dropdown in "Join a Project"
  const [peerProjects, setPeerProjects] = useState([]);
  const [isLoadingPeerProjects, setIsLoadingPeerProjects] = useState(false);
  const [peerProjectsError, setPeerProjectsError] = useState(null);
  const [selectedPeerProjectId, setSelectedPeerProjectId] = useState('');

  // 🔹 Load projects when the About Me card is expanded
  useEffect(() => {
    if (!isExpanded) return;
    if (peerProjects.length > 0 || isLoadingPeerProjects) return;

    setIsLoadingPeerProjects(true);
    setPeerProjectsError(null);

    google.script.run
      .withSuccessHandler((result) => {
        try {
          const projects = result?.action_response?.projects || [];
          const mapped = projects.map((p) => ({
            project_id: p.project_id,
            title: p.title,
          }));
          setPeerProjects(mapped);
        } catch (err) {
          console.error('Failed to map peer projects:', err);
          setPeerProjectsError('Failed to load projects');
        } finally {
          setIsLoadingPeerProjects(false);
        }
      })
      .withFailureHandler((error) => {
        console.error('Error loading peer projects:', error);
        setPeerProjectsError('Failed to load projects');
        setIsLoadingPeerProjects(false);
      })
      .getStudentProjects(); // ✅ reuses existing Apps Script function
  }, [isExpanded, peerProjects.length, isLoadingPeerProjects]);


// Submit ONLY the Join Project + Invites
const handleSecondarySubmit = () => {
  const peerEmail = formData.peer_project_email?.trim();
  const hasJoinPeerInput = peerEmail || selectedPeerProjectId;

  // Validate Join project
  if (hasJoinPeerInput) {
    if (!peerEmail || !isValidEmail(peerEmail) || !selectedPeerProjectId) {
      setSubmitStatus('error');
      return;
    }
  }

  const payload = {
    invitation: formData.invitation,
    join_a_peer: hasJoinPeerInput
      ? [{ email: peerEmail, project_id: selectedPeerProjectId }]
      : [],
  };

  setIsSubmitting(true);
  setSubmitStatus(null);

  google.script.run
    .withSuccessHandler((result) => {
      if (result.success) {
        setSubmitStatus('success');
      } else {
        setSubmitStatus('error');
      }
      setIsSubmitting(false);
    })
    .withFailureHandler(() => {
      setSubmitStatus('error');
      setIsSubmitting(false);
    })
    .submitPeerActions(payload); // 👈 NEW ENDPOINT
};



  // Handle simple text inputs
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle array inputs
  const addToArray = (field, inputKey) => {
    const value = inputValues[inputKey].trim();
    if (value && !formData[field].includes(value)) {
      setFormData(prev => ({
        ...prev,
        [field]: [...prev[field], value]
      }));
      setInputValues(prev => ({
        ...prev,
        [inputKey]: ''
      }));
    }
  };

  // Remove from array
  const removeFromArray = (field, item) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter(i => i !== item)
    }));
  };

  // Handle key press for adding items
  const handleKeyPress = (e, field, inputKey) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addToArray(field, inputKey);
    }
  };

  // Email validation
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Submit form
  const handleSubmit = () => {
    // Basic validation
    const isEmailValid = formData.email_id && isValidEmail(formData.email_id);
    const isBioValid = formData.bio && formData.bio.trim();

    if (!isEmailValid || !isBioValid) {
      setSubmitStatus('error');
      return;
    }

    // Validate join_a_peer only if user has started filling it
    const peerEmail = (formData.peer_project_email || '').trim();
    const hasJoinPeerInput = peerEmail || selectedPeerProjectId;

    if (hasJoinPeerInput) {
      // If they touched this section, both email and project must be valid
      if (!peerEmail || !isValidEmail(peerEmail) || !selectedPeerProjectId) {
        setSubmitStatus('error');
        return;
      }
    }

    setIsSubmitting(true);
    setSubmitStatus(null);

    // Build join_a_peer in the format you specified
    const join_a_peer = peerEmail && selectedPeerProjectId
      ? [
          {
            email: peerEmail,
            project_id: selectedPeerProjectId
          }
        ]
      : [];

    const payload = {
      email_id: formData.email_id,
      bio: formData.bio,
      interests: formData.interests,
      skills: formData.skills,
      endorsements: formData.endorsements,
      invitation: formData.invitation,
      join_a_peer,                    // 👈 NEW FIELD
    };

    google.script.run
      .withSuccessHandler((result) => {
        if (result.success || result.status === 'success') {
          setSubmitStatus('success');
          setFormData({
            email_id: '',
            bio: '',
            interests: [],
            skills: [],
            endorsements: [],
            invitation: [],
            peer_project_email: '',
          });
          setSelectedPeerProjectId('');
          console.log('✅ Success:', result);
        } else {
          console.error('❌ API returned failure:', result);
          setSubmitStatus('error');
        }
        setIsSubmitting(false);
      })
      .withFailureHandler((error) => {
        console.error('Error submitting info:', error);
        setSubmitStatus('error');
        setIsSubmitting(false);
      })
      .submitAboutMeInfo(payload);
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const getStatusColor = () => {
    if (submitStatus === 'success') return 'text-green-600';
    if (submitStatus === 'error') return 'text-red-600';
    if (isSubmitting) return 'text-blue-600';
    return 'text-gray-600';
  };

  const getStatusDot = () => {
    if (submitStatus === 'success') return 'bg-green-500';
    if (submitStatus === 'error') return 'bg-red-500';
    if (isSubmitting) return 'bg-blue-500';
    return 'bg-gray-400';
  };

  const getStatusText = () => {
    if (submitStatus === 'success') return 'Tell us about yourself';
    if (submitStatus === 'error') return 'Error occurred';
    if (isSubmitting) return 'Submitting...';
    return 'Tell us about yourself';
  };

  return (
    <div className="w-full font-sans">
      <div className="w-full bg-white border border-gray-200 rounded-lg shadow-sm transition-all duration-200">
        {/* Header Area */}
        <div
          onClick={toggleExpanded}
          className="p-3 cursor-pointer hover:bg-gray-50 transition"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <User className={`w-6 h-6 ${getStatusColor()}`} />
                <div
                  className={`absolute -top-1 w-2 h-2 rounded-full ${getStatusDot()}`}
                  style={{ right: '-0.05rem' }}
                ></div>
              </div>
              <div>
                <div className="font-medium text-gray-900 text-base">About Me</div>
                <div className="text-sm text-gray-500">
                  {getStatusText()}
                </div>
              </div>
            </div>
            <ChevronDown
              className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                isExpanded ? 'rotate-180' : ''
              }`}
            />
          </div>
        </div>

        {/* Expanded Section */}
        {isExpanded && (
          <div className="p-4 border-t border-gray-100">
            <div className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={formData.email_id}
                  onChange={(e) => handleInputChange('email_id', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Enter your email address"
                  disabled={isSubmitting}
                  required
                />
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bio *
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  placeholder="Tell us about yourself..."
                  disabled={isSubmitting}
                  required
                />
              </div>

              {/* Interests */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Interests
                </label>
                <div className="flex flex-wrap gap-1 mb-2">
                  {formData.interests.map((interest, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-indigo-100 text-indigo-800"
                    >
                      {interest}
                      <button
                        type="button"
                        onClick={() => removeFromArray('interests', interest)}
                        className="ml-1 text-indigo-600 hover:text-indigo-800"
                        disabled={isSubmitting}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex">
                  <input
                    type="text"
                    value={inputValues.interest}
                    onChange={(e) =>
                      setInputValues((prev) => ({ ...prev, interest: e.target.value }))
                    }
                    onKeyPress={(e) => handleKeyPress(e, 'interests', 'interest')}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Add an interest"
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => addToArray('interests', 'interest')}
                    disabled={isSubmitting}
                    className="px-3 py-2 bg-indigo-600 text-white rounded-r-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 transition"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Skills */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Skills
                </label>
                <div className="flex flex-wrap gap-1 mb-2">
                  {formData.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeFromArray('skills', skill)}
                        className="ml-1 text-green-600 hover:text-green-800"
                        disabled={isSubmitting}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex">
                  <input
                    type="text"
                    value={inputValues.skill}
                    onChange={(e) =>
                      setInputValues((prev) => ({ ...prev, skill: e.target.value }))
                    }
                    onKeyPress={(e) => handleKeyPress(e, 'skills', 'skill')}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Add a skill"
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => addToArray('skills', 'skill')}
                    disabled={isSubmitting}
                    className="px-3 py-2 bg-indigo-600 text-white rounded-r-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 transition"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Endorsements */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Endorsements
                </label>
                <div className="flex flex-wrap gap-1 mb-2">
                  {formData.endorsements.map((endorsement, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800"
                    >
                      {endorsement}
                      <button
                        type="button"
                        onClick={() => removeFromArray('endorsements', endorsement)}
                        className="ml-1 text-yellow-600 hover:text-yellow-800"
                        disabled={isSubmitting}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex">
                  <input
                    type="text"
                    value={inputValues.endorsement}
                    onChange={(e) =>
                      setInputValues((prev) => ({
                        ...prev,
                        endorsement: e.target.value
                      }))
                    }
                    onKeyPress={(e) => handleKeyPress(e, 'endorsements', 'endorsement')}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Add an endorsement"
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => addToArray('endorsements', 'endorsement')}
                    disabled={isSubmitting}
                    className="px-3 py-2 bg-indigo-600 text-white rounded-r-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 transition"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>


                            {/* Submit Button */}
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSubmit}
                className="w-full flex items-center justify-center px-4 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                      />
                    </svg>
                    Submit Profile
                  </>
                )}
              </button>



              <hr className="my-6 border-gray-300" />

              {/* Invite Others */}



              {/* Join a peers project – email + project dropdown -> join_a_peer */}
              <div className="">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FolderKanban className="inline w-4 h-4 mr-1" />
                  Add a peer's project                </label>

                <p className="text-xs text-gray-600 mb-2">
                  Join your peer&apos;s project and collaborate
                </p>

                {/* Peer email */}
                <div className="flex mb-2">
                  <input
                    type="email"
                    value={formData.peer_project_email}
                    onChange={(e) =>
                      handleInputChange('peer_project_email', e.target.value)
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const trimmed = (formData.peer_project_email || '').trim();
                        if (!trimmed || !isValidEmail(trimmed)) return;
                        handleInputChange('peer_project_email', trimmed);
                      }
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Enter peer's email"
                    disabled={isSubmitting}
                    aria-label="Peer email"
                  />
                </div>

                {/* Project dropdown */}
                <div className="mt-1">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Select a project
                  </label>
                  <select
                    value={selectedPeerProjectId}
                    onChange={(e) => setSelectedPeerProjectId(e.target.value)}
                    disabled={isSubmitting || isLoadingPeerProjects || !!peerProjectsError}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                  >
                    <option value="">
                      {isLoadingPeerProjects
                        ? 'Loading projects...'
                        : peerProjectsError
                        ? 'Failed to load projects'
                        : 'Choose a project'}
                    </option>
                    {peerProjects.map((p) => (
                      <option key={p.project_id} value={p.project_id}>
                        {p.title}
                      </option>
                    ))}
                  </select>

                  {peerProjectsError && (
                    <p className="text-xs text-red-600 mt-1">
                      {peerProjectsError}
                    </p>
                  )}
                </div>
              </div>

              <div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
    <Mail className="inline w-4 h-4 mr-1" />
    Invite Others
  </label>

  <p className="text-xs text-gray-600 mb-2">
    Invite people to upload their resume/credential information
  </p>

  {/* Already-added invitations */}
  <div className="flex flex-wrap gap-1 mb-2">
    {formData.invitation.map((email, index) => (
      <span
        key={index}
        className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800"
      >
        {email}
        <button
          type="button"
          onClick={() => removeFromArray("invitation", email)}
          className="ml-1 text-purple-600 hover:text-purple-800"
          disabled={isSubmitting}
        >
          <X className="w-3 h-3" />
        </button>
      </span>
    ))}
  </div>

  {/* Email input */}
  <div className="mb-2">
    <input
      type="email"
      value={inputValues.inviteEmail}
      onChange={(e) =>
        setInputValues((prev) => ({ ...prev, inviteEmail: e.target.value }))
      }
      onKeyPress={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          const email = inputValues.inviteEmail.trim();
          if (isValidEmail(email)) addToArray("invitation", "inviteEmail");
        }
      }}
      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm 
                 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
      placeholder="Enter email address"
      disabled={isSubmitting}
    />
  </div>

  {/* ⭐ NEW — PROJECT DROPDOWN (same as Join A Project) */}
  <div className="mt-1">
    <label className="block text-xs font-medium text-gray-600 mb-1">
      Select a project
    </label>

    <select
      value={selectedPeerProjectId}
      onChange={(e) => setSelectedPeerProjectId(e.target.value)}
      disabled={isSubmitting || isLoadingPeerProjects || !!peerProjectsError}
      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm
                 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
    >
      <option value="">
        {isLoadingPeerProjects
          ? "Loading projects..."
          : peerProjectsError
          ? "Failed to load projects"
          : "Choose a project"}
      </option>

      {peerProjects.map((p) => (
        <option key={p.project_id} value={p.project_id}>
          {p.title}
        </option>
      ))}
    </select>

    {peerProjectsError && (
      <p className="text-xs text-red-600 mt-1">{peerProjectsError}</p>
    )}
  </div>
</div>







              {/* Status Messages */}
              {submitStatus === 'success' && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm text-green-800">✓ Successfully submitted!</p>
                </div>
              )}
              {submitStatus === 'error' && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-800">
                    ✗ Error submitting form. Please check your inputs and try again.
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSecondarySubmit}
                className="w-full flex items-center justify-center px-4 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                      />
                    </svg>
                    Invite or Add
                  </>
                )}
              </button>

              





              {/* Status Label */}
              <div className="text-center">
                <div
                  className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
                    submitStatus === 'success'
                      ? 'bg-green-100 text-green-800'
                      : submitStatus === 'error'
                      ? 'bg-red-100 text-red-800'
                      : isSubmitting
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {submitStatus === 'success'
                    ? '✨ Profile Updated!'
                    : submitStatus === 'error'
                    ? '❌ Submission Failed'
                    : isSubmitting
                    ? '⏰ Processing...'
                    : '📝 Ready to Submit'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
