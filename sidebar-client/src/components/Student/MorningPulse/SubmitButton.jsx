import { Send, Loader2 } from 'lucide-react';

export const SubmitButton = ({ 
  onClick, 
  disabled, 
  isLoading, 
  loadingText = "Submitting...",
  buttonText = "Submit",
  icon: Icon = Send,
  loadingIcon: LoadingIcon = Loader2,
  variant = "primary",
  size = "default",
  className = ""
}) => {
  const baseClasses = "flex items-center justify-center space-x-2 font-medium transition-colors duration-200 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-amber-600 text-white hover:bg-amber-700 disabled:bg-gray-300",
    secondary: "bg-gray-600 text-white hover:bg-gray-700 disabled:bg-gray-300",
    outline: "border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:bg-gray-100"
  };
  
  const sizes = {
    sm: "px-3 py-1.5 text-sm rounded",
    default: "px-4 py-2 rounded-lg",
    lg: "px-6 py-3 text-lg rounded-lg"
  };
  
  const buttonClasses = `${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={buttonClasses}
    >
      {isLoading ? (
        <>
          <LoadingIcon className="w-4 h-4 animate-spin" />
          <span>{loadingText}</span>
        </>
      ) : (
        <>
          <Icon className="w-4 h-4" />
          <span>{buttonText}</span>
        </>
      )}
    </button>
  );
};