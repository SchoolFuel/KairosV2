import { EmojiSelector } from './EmojiSelector';
import { TextInputField } from './TextInputField';
import { SubmitButton } from './SubmitButton';

export const MorningPulseForm = ({ 
  emojis,
  selectedEmoji,
  onEmojiSelect,
  textInput,
  onTextChange,
  onSubmit,
  isLoading,
  emojiTitle = "How are you feeling today?",
  textTitle = "What's your energy focused on today?",
  textPlaceholder = "Today I'm feeling... / My energy is directed toward... / I'm focusing on...",
  submitButtonText = "Submit Morning Pulse",
  headerTitle = "Breathe In, Begin Now",
  formClassName = "",
  validation = true
}) => {
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  const isFormValid = validation ? (selectedEmoji && textInput.trim()) : true;

  return (
    <div className={formClassName}>
      <div className="text-center mb-2">
        <h3 className="text-medium font-semibold text-gray-900 mb-1">
          {headerTitle}
        </h3>
        {/* <div className="w-12 h-0.5 bg-gradient-to-r from-amber-400 to-orange-600 rounded-full mx-auto"></div> */}
      </div>

      <EmojiSelector
        emojis={emojis}
        selectedEmoji={selectedEmoji}
        onEmojiSelect={onEmojiSelect}
        disabled={isLoading}
        title={emojiTitle}
      />

      <TextInputField
        value={textInput}
        onChange={(e) => onTextChange(e.target.value)}
        onKeyPress={handleKeyPress}
        disabled={isLoading}
        title={textTitle}
        placeholder={textPlaceholder}
        required={validation}
      />

      <SubmitButton
        onClick={onSubmit}
        disabled={!isFormValid || isLoading}
        isLoading={isLoading}
        buttonText={submitButtonText}
        className="w-full"
      />
    </div>
  );
};
