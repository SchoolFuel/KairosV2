import React, { useState } from "react";
import {
  MessageCircle,
  ChevronDown,
  Send,
  Lightbulb,
  Loader2,
  Copy,
  Download,
  Plus,
  X,
  BookOpen,
  Globe,
  Target,
  FileText
} from "lucide-react";

export default function SidebarAdvice() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [subject, setSubject] = useState("");
  const [recommendation, setRecommendation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasAdvice, setHasAdvice] = useState(false);
  const [error, setError] = useState(null);

  const toggleExpanded = () => setIsExpanded(!isExpanded);

  const handleSubmit = async () => {
    if (!userInput.trim()) return;

    setIsLoading(true);
    setRecommendation(null);
    setHasAdvice(false);
    setError(null);

    const fullPrompt = subject
      ? `${userInput}\n\nSubject Area: ${subject}`
      : userInput;

    try {
      google.script.run
        .withSuccessHandler((result) => {
          const isEmpty = !result || !result.action_response;
          const adviceData = isEmpty ? null : result.action_response.response;
          
          setRecommendation(adviceData);
          setHasAdvice(!!adviceData);
          setIsLoading(false);
        })
        .withFailureHandler((error) => {
          console.error("Error calling Apps Script:", error);
          setError("Failed to get advice. Please try again.");
          setIsLoading(false);
        })
        .getAdvice(fullPrompt);
    } catch (err) {
      setError("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleClear = () => {
    setUserInput("");
    setSubject("");
    setRecommendation(null);
    setHasAdvice(false);
    setError(null);
  };

  const getStatusConfig = () => {
    if (isLoading) return {
      color: "text-yellow-500",
      dot: "bg-yellow-500 shadow-yellow-500/50",
      subtitle: "Finding connections...",
      subtitleColor: "text-yellow-600"
    };
    if (error) return {
      color: "text-red-500",
      dot: "bg-red-500 shadow-red-500/50",
      subtitle: "Error occurred",
      subtitleColor: "text-red-600"
    };
    if (hasAdvice && recommendation?.advice) return {
      color: "text-green-500",
      dot: "bg-green-500 shadow-green-500/50",
      subtitle: "Advice ready",
      subtitleColor: "text-green-600"
    };
    if (hasAdvice && !recommendation?.advice) return {
      color: "text-red-500",
      dot: "bg-red-500 shadow-red-500/50",
      subtitle: "No advice available",
      subtitleColor: "text-red-600"
    };
    return {
      color: "text-gray-500",
      dot: "bg-gray-400",
      subtitle: "Ask for guidance",
      subtitleColor: "text-gray-600"
    };
  };

  const status = getStatusConfig();

  const buildFullText = () => {
    if (!recommendation) return "";
    
    return [
      `🧠 Advice: ${recommendation?.advice || ""}`,
      ``,
      `📘 Subject: ${recommendation?.subject || ""}`,
      ``,
      `🌍 Connection: ${recommendation?.connection || ""}`,
      ``,
      `📌 Examples:`,
      ...(recommendation?.examples?.length
        ? recommendation.examples.map((ex) => `• ${ex}`)
        : ["• No examples provided."]),
      ``,
      `📚 Resources:`,
      ...(recommendation?.resources?.length
        ? recommendation.resources.map((res) => `• ${res.title} - ${res.url}`)
        : ["• No resources provided."]),
    ].join("\n");
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(buildFullText());
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="w-full max-w-[300px] font-sans">
      {/* Main Card */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden transition-all duration-200">
        
        {/* Toggle Header */}
        <div 
          onClick={toggleExpanded}
          className="w-full p-3 cursor-pointer transition-colors duration-200 hover:bg-gray-50"
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              {/* Status Icon with Dot */}
              <div className="relative">
                <MessageCircle className={`w-5 h-5 ${status.color}`} />
                <div className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${status.dot} shadow-sm`}></div>
              </div>
              
              {/* Title and Status */}
              <div>
                <div className="font-medium text-gray-900">Get Advice</div>
                <div className={`text-sm ${status.subtitleColor}`}>
                  {status.subtitle}
                </div>
              </div>
            </div>
            
            {/* Chevron */}
            <ChevronDown 
              className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                isExpanded ? "rotate-180" : ""
              }`} 
            />
          </div>
        </div>

        {/* Expandable Content */}
        {isExpanded && (
          <div className="border-t border-gray-100">
            <div className="p-6 space-y-6">
              
              {/* Input Section */}
              <div className="space-y-4">
                {/* Question Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    What concept are you investigating?
                  </label>
                  <textarea
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="I'm struggling with... / I need help deciding..."
                    rows={2}
                    disabled={isLoading}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50"
                  />
                </div>

                {/* Subject Dropdown */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Subject Area
                  </label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    disabled={isLoading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50"
                  >
                    <option value="">-- Select Subject --</option>
                    <option value="ELA">English Language Arts</option>
                    <option value="Math">Mathematics</option>
                    <option value="Science">Science</option>
                    <option value="Social Studies">Social Studies</option>
                  </select>
                </div>

                {/* Action Buttons */}
                <div>
                  <button
                    onClick={handleSubmit}
                    disabled={!userInput.trim() || isLoading}
                    className="w-full bg-indigo-600 text-white text-sm py-2 px-3 rounded-lg font-medium hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Finding an Advice...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Get Advice</span>
                      </>
                    )}
                  </button>
                  
                  {!isLoading && (userInput || recommendation || subject) && (
                    <button
                      onClick={handleClear}
                      className="w-full mt-2 bg-gray-600 text-white text-sm py-2 px-3 rounded-lg font-medium hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2"
                    >
                      <X className="w-4 h-4" />
                      <span>Clear</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Error State */}
              {error && (
                <div className="p-2 bg-red-50 border border-red-200 rounded">
                  <div className="text-xs text-red-700">{error}</div>
                </div>
              )}

              {/* Advice Display */}
              {hasAdvice && recommendation && (
                <div className="bg-slate-50 border border-slate-200 rounded p-3 space-y-3">
                  
                  {/* Header */}
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                    <Lightbulb className="w-3 h-3 text-indigo-600" />
                    <h3 className="text-xs font-semibold text-slate-900">
                      Advice for you
                    </h3>
                  </div>

                  {/* Advice Content */}
                  <div className="space-y-3">
                    
                    {/* Main Advice */}
                    {recommendation.advice && (
                      <div>
                        <div className="flex items-center gap-1 mb-1">
                          <Target className="w-3 h-3 text-indigo-600" />
                          <h4 className="text-xs font-medium text-indigo-900">Advice</h4>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed pl-4">
                          {recommendation.advice}
                        </p>
                      </div>
                    )}

                    {/* Subject */}
                    {recommendation.subject && (
                      <div>
                        <div className="flex items-center gap-1 mb-1">
                          <BookOpen className="w-3 h-3 text-blue-600" />
                          <h4 className="text-xs font-medium text-blue-900">Subject</h4>
                        </div>
                        <p className="text-xs text-slate-700 pl-4">
                          {recommendation.subject}
                        </p>
                      </div>
                    )}

                    {/* Connection */}
                    {recommendation.connection && (
                      <div>
                        <div className="flex items-center gap-1 mb-1">
                          <Globe className="w-3 h-3 text-emerald-600" />
                          <h4 className="text-xs font-medium text-emerald-900">Connection</h4>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed pl-4">
                          {recommendation.connection}
                        </p>
                      </div>
                    )}

                    {/* Examples */}
                    {recommendation.examples && recommendation.examples.length > 0 && (
                      <div>
                        <div className="flex items-center gap-1 mb-1">
                          <FileText className="w-3 h-3 text-amber-600" />
                          <h4 className="text-xs font-medium text-amber-900">Examples</h4>
                        </div>
                        <ul className="space-y-1 pl-4">
                          {recommendation.examples.map((example, idx) => (
                            <li key={idx} className="flex items-start gap-1 text-xs text-slate-700">
                              <span className="w-1 h-1 bg-amber-500 rounded-full mt-1.5 flex-shrink-0"></span>
                              <span className="leading-relaxed">{example}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Resources */}
                    {recommendation.resources && recommendation.resources.length > 0 && (
                      <div>
                        <div className="flex items-center gap-1 mb-1">
                          <BookOpen className="w-3 h-3 text-purple-600" />
                          <h4 className="text-xs font-medium text-purple-900">Resources</h4>
                        </div>
                        <ul className="space-y-2 pl-4">
                          {recommendation.resources.map((resource, idx) => (
                            <li key={idx} className="border-l border-purple-200 pl-2">
                              <a
                                href={resource.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs font-medium text-purple-700 hover:text-purple-900 underline block"
                              >
                                {resource.title}
                              </a>
                              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                                {resource.description}
                              </p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Compact Action Buttons */}
                  <div className="pt-2 border-t border-slate-200 grid grid-cols-1 gap-1">
                    <button
                      onClick={copyToClipboard}
                      className="flex items-center justify-center gap-1 px-2 py-1 bg-slate-600 text-white rounded text-xs font-medium hover:bg-slate-700"
                    >
                      <Copy className="w-3 h-3" />
                      Copy
                    </button>
                    
                    <button
                      onClick={() => alert("✅ Added to your project!")}
                      className="flex items-center justify-center gap-1 px-2 py-1 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700"
                    >
                      <Plus className="w-3 h-3" />
                      Add to Project
                    </button>
                    
                    <button
                      onClick={() => alert("📄 PDF download is not available yet")}
                      className="flex items-center justify-center gap-1 px-2 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700"
                    >
                      <Download className="w-3 h-3" />
                      Download PDF
                    </button>
                  </div>
                </div>
              )}

              {/* Compact Tips Section */}
              {!recommendation && !isLoading && !error && (
                <div className="bg-blue-50 border border-blue-200 rounded p-2">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="w-3 h-3 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-xs font-medium text-blue-900 mb-1">
                        💡 Tips for better advice
                      </h4>
                      <ul className="text-xs text-blue-700 space-y-0.5">
                        <li>• Be specific about your situation</li>
                        <li>• Mention what you've tried</li>
                        <li>• Ask about decisions or goals</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}