import React from 'react';
import { Sunrise, CheckCircle } from 'lucide-react';
import { CollapsibleHeader } from './CollapsibleHeader';
import { MorningPulseForm } from './MorningPulseForm';
import { DashboardView } from './DashboardView';
import { useMorningPulseState } from '../../../hooks/useMorningPulseState';


// Motivation array
const MOTIVATIONS = [
  "Unleash your full potential like a superhero, and tackle today's challenges with electrifying energy! You've got the power to conquer any obstacle that comes your way. Go shine bright!",
  "Push a little harder today for a better tomorrow.",
  "You're stronger than you think.",
  "Keep going, success is around the corner!"
];


// Default data constants
const DEFAULT_EMOJIS = [
  { emoji: '😔', level: 1, label: 'Low Energy' },
  { emoji: '😌', level: 2, label: 'Calm' },
  { emoji: '😁', level: 3, label: 'Good' },
  { emoji: '😎', level: 4, label: 'Strong' },
  { emoji: '🤩', level: 5, label: 'High Energy' }
];

const DEFAULT_DASHBOARD_DATA = {
  "ValueMessage": [
    
  ],
  "Peers": {
    "Diego Lopez": [
      "completed a major project assessment!",
      "is working on climate change research",
      "shared insights about sustainable practices"
    ],
    "Aiden Smith": [
      "is working on a task similar to yours",
      "completed the weekly assignment",
      "is looking for study partners"
    ],
    "Fatima Patel": [
      "is looking for experts in the area of climate change",
      "published a new research paper",
      "is organizing a climate awareness event"
    ],
    "Liam O'Connor": [
      "just started a new project",
      "is seeking feedback on his latest work",
      "completed the group presentation"
    ],
    "Sofia Martinez": [
      "is looking to put together a reading group",
      "shared interesting articles about sustainability",
      "is organizing a community cleanup event"
    ],
    "Jin Yamamoto": [
      "is new to your class group",
      "introduced himself in the discussion forum",
      "is eager to collaborate on projects"
    ]
  },
  "ActiveProjects": [
    "Climate Change in Arcadia, AZ",
    "Displacement of People Impacted by Climate Disasters",
    "Urban Heat Islands"
  ]  
};

export default function SidebarMorningPulse({
  // Data props
  emojis = DEFAULT_EMOJIS,
  dashboardData = DEFAULT_DASHBOARD_DATA,
  
  // API props
  onSubmitPulse = null,
  userEmail = 'user@example.com',
  
  // Text customization props
  pulseHeaderTitle = "Breathe In, Begin Now",
  emojiSelectorTitle = "How are you feeling today?",
  textInputTitle = "What's your energy focused on today?",
  textInputPlaceholder = "Today I'm feeling... / My energy is directed toward... / I'm focusing on...",
  submitButtonText = "Submit Morning Pulse",
  dashboardWelcomeTitle = "Welcome to Your Day!",
  dashboardWelcomeSubtitle = "Here's what's happening in your learning community",
  resetButtonText = "Submit New Morning Pulse",
  
  // Header text props
  pulseHeaderText = "Start Your Day!",
  pulseSubtext = "It's your moment to reflect",
  dashboardHeaderText = "Your Daily Dashboard",
  dashboardSubtext = "Pulse submitted successfully",
  loadingSubtext = "Submitting pulse...",
  
  // Styling props
  sectionsConfig = null,
  className = "bg-white border border-gray-200 rounded-lg",
  
  // State control props (for external state management)
  initialState = {},
  externalState = null,
  
  // Feature flags
  enableValidation = true,
  showResetButton = true,
  autoExpand = false
}) {
  // Use external state if provided, otherwise use internal hook
  const internalState = useMorningPulseState(initialState);
  const state = externalState || internalState;

  const {
    isExpanded,
    setIsExpanded,
    selectedEmoji,
    setSelectedEmoji,
    textInput,
    setTextInput,
    isLoadingPulse,
    setIsLoadingPulse,
    currentStep,
    setResponseMessage,
    setCurrentStep,
    resetForm
  } = state;

  const [motivation, setMotivation] = React.useState(""); 
  const [updatedDashboardData, setUpdatedDashboardData] = React.useState(dashboardData);
  const [reactions, setReactions] = React.useState({}); // Store reactions: {peerName: {messageIndex: {emoji: '😊', user: 'currentUser'}}}
  const [acknowledgments, setAcknowledgments] = React.useState([]); // Store acknowledgment history
   

  // Auto-expand functionality
  React.useEffect(() => {
    if (autoExpand && !isExpanded) {
      setIsExpanded(true);
    }
  }, [autoExpand, isExpanded, setIsExpanded]);

  const toggleExpanded = () => setIsExpanded(!isExpanded);

  React.useEffect(() => {
    console.log('Dashboard data updated:', updatedDashboardData);
  }, [updatedDashboardData]);

const handlePulseSubmit = () => {
  // Validation check
  if (enableValidation && (!selectedEmoji || !textInput.trim())) {
    return;
  }

  setIsLoadingPulse(true);

  const userInput = {
    emoji: selectedEmoji,
    message: textInput.trim()
  };
 
      google.script.run
        .withSuccessHandler((motivationText) => {
          // Set the motivation message
          //setMotivation(motivationText || "Stay motivated and keep going!");
          console.log('Received inspiration text:', motivationText);
          const newDashboardData = {
            ...updatedDashboardData,
            ValueMessage: [motivationText || "Stay motivated and keep going!"]
          };
          setUpdatedDashboardData(newDashboardData);
          
          // Update state to show dashboard
          setIsLoadingPulse(false);
          setCurrentStep('dashboard');
        })
        .withFailureHandler((error) => {
          console.error('Error submitting Morning Pulse:', error);
          alert("Something went wrong. Check console.");
          setIsLoadingPulse(false);
        })
        .processDailyCheckin(userInput);
};

  const handleReset = () => {
    resetForm();
    //setMotivation("");
    setUpdatedDashboardData(dashboardData);
    setReactions({});
    setAcknowledgments([]);
  };

  // Handle reaction to peer updates
  const handleReaction = (peerName, messageIndex, emoji, messageContent) => {
    const newReaction = {
      peerName,
      messageIndex,
      emoji,
      user: userEmail,
      messageContent,
      timestamp: new Date().toISOString()
    };
    
    // Update reactions state (replace existing reaction if any)
    setReactions(prev => ({
      ...prev,
      [peerName]: {
        ...prev[peerName],
        [messageIndex]: newReaction
      }
    }));
    
    // Update acknowledgments (replace existing reaction if any)
    setAcknowledgments(prev => {
      const filtered = prev.filter(ack => 
        !(ack.peerName === peerName && ack.messageIndex === messageIndex)
      );
      return [...filtered, newReaction];
    });
  };

  // Clear acknowledgments
  const clearAcknowledgments = () => {
    setAcknowledgments([]);
  };

  const getStatusIcon = () => {
    return currentStep === 'dashboard' ? CheckCircle : Sunrise;
  };

  const getHeaderMessage = () => {
    return currentStep === 'dashboard' ? dashboardHeaderText : pulseHeaderText;
  };

  const getSubMessage = () => {
    if (currentStep === 'dashboard') return dashboardSubtext;
    if (isLoadingPulse) return loadingSubtext;
    return pulseSubtext;
  };

  const getIconColor = () => {
    return currentStep === 'dashboard' ? "text-emerald-600" : "text-gray-600";
  };

  const StatusIcon = getStatusIcon();

  const getStatusDot = () => {
    // map to whatever flags you actually have
    // (kept your original ordering; tweak as you wish)
    if (isLoadingPulse) return 'bg-yellow-500';
    if (currentStep === 'dashboard') return 'bg-green-500';
    return 'bg-gray-400';
  };

const StatusIconWithDot = () => (
    <div className="relative inline-flex">
      <StatusIcon className={`h-5 w-5 ${getIconColor()}`} />
      <span
        className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${getStatusDot()}`}
      />
    </div>
  );

  return (
    <div className={className}>
      <CollapsibleHeader
        isExpanded={isExpanded}
        onToggle={toggleExpanded}
        icon={StatusIconWithDot}
        title={getHeaderMessage()}
        subtitle={getSubMessage()}
        iconColor={getIconColor()}
      />

      {isExpanded && (
        <div className="border-t border-gray-200 p-4">
          {currentStep === 'pulse' && (
            <MorningPulseForm
              emojis={emojis}
              selectedEmoji={selectedEmoji}
              onEmojiSelect={setSelectedEmoji}
              textInput={textInput}
              onTextChange={setTextInput}
              onSubmit={handlePulseSubmit}
              isLoading={isLoadingPulse}
              emojiTitle={emojiSelectorTitle}
              textTitle={textInputTitle}
              textPlaceholder={textInputPlaceholder}
              submitButtonText={submitButtonText}
              headerTitle={pulseHeaderTitle}
              validation={enableValidation}
            />
          )}

          {currentStep === 'dashboard' && (
            <>
            {/* {motivation && (
                <div className="mb-4 p-3 bg-emerald-100 text-emerald-800 rounded-lg text-center font-semibold">
                  {motivation}
                </div>
              )} */}
            <DashboardView
              dashboardData={updatedDashboardData}
              onReset={showResetButton ? handleReset : null}
              welcomeTitle={dashboardWelcomeTitle}
              welcomeSubtitle={dashboardWelcomeSubtitle}
              resetButtonText={resetButtonText}
              sectionsConfig={sectionsConfig}
              showResetButton={showResetButton}
              responseMessage={state.responseMessage}
              reactions={reactions}
              acknowledgments={acknowledgments}
              onReaction={handleReaction}
              onClearAcknowledgments={clearAcknowledgments}
              userEmail={userEmail}
            />
            </>

          )}
        </div>
      )}
    </div>
  );
}
