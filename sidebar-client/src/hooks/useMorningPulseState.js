import { useState } from 'react';

export const useMorningPulseState = (initialState = {}) => {
  const [isExpanded, setIsExpanded] = useState(initialState.isExpanded || false);
  const [selectedEmoji, setSelectedEmoji] = useState(initialState.selectedEmoji || '');
  const [textInput, setTextInput] = useState(initialState.textInput || '');
  const [isLoadingPulse, setIsLoadingPulse] = useState(initialState.isLoadingPulse || false);
  const [currentStep, setCurrentStep] = useState(initialState.currentStep || 'pulse');
  const [responseMessage, setResponseMessage] = useState(initialState.responseMessage || '');


  const resetForm = () => {
    setSelectedEmoji('');
    setTextInput('');
    setCurrentStep('pulse');
  };

  const resetAll = () => {
    setIsExpanded(false);
    resetForm();
    setIsLoadingPulse(false);
  };

  return {
    isExpanded,
    setIsExpanded,
    selectedEmoji,
    setSelectedEmoji,
    textInput,
    setTextInput,
    isLoadingPulse,
    setIsLoadingPulse,
    currentStep,
    setCurrentStep,
    resetForm,
    resetAll,
    responseMessage,
    setResponseMessage
  };
};