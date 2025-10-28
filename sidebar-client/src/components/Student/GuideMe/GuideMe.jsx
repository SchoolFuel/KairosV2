import React, { useState, useEffect } from 'react';
import {
    Clock,
    Download,
    Copy,
    ThumbsUp,
    ThumbsDown,
    Send,
    ChevronDown,
    ChevronUp,
    Bot,
    BotMessageSquare,
    Bug
} from 'lucide-react';

// Typing indicator component
const TypingIndicator = () => (
    <div className="flex items-center space-x-1 py-2">
        <div className="flex space-x-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
        {/* <span className="text-xs text-gray-500 ml-2"></span> */}
    </div>
);


// Message formatting function - ADD THIS
const formatAIMessage = (text) => {
    if (!text) return '';

    // Split into paragraphs and format each one
    const paragraphs = text.split('\n\n').filter(p => p.trim());

    return paragraphs.map((paragraph, pIndex) => {
        // Handle bullet points
        if (paragraph.includes('\n•') || paragraph.includes('\n-') || paragraph.includes('\n*')) {
            const lines = paragraph.split('\n');
            const nonListLines = [];
            const listItems = [];

            lines.forEach(line => {
                const trimmed = line.trim();
                if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*')) {
                    listItems.push(trimmed.replace(/^[•\-*]\s*/, ''));
                } else if (trimmed) {
                    nonListLines.push(trimmed);
                }
            });

            return (
                <div key={pIndex} className="mb-2">
                    {nonListLines.map((line, index) => (
                        <p key={index} className="mb-1 text-xs">{line}</p>
                    ))}
                    {listItems.length > 0 && (
                        <ul className="list-disc list-inside ml-2 space-y-0.5 text-xs">
                            {listItems.map((item, index) => (
                                <li key={index}>{item}</li>
                            ))}
                        </ul>
                    )}
                </div>
            );
        }

        // Handle numbered lists
        if (/^\d+\./.test(paragraph.trim())) {
            const items = paragraph.split('\n').filter(line => /^\d+\./.test(line.trim()));
            const regularText = paragraph.split('\n').filter(line => !/^\d+\./.test(line.trim()) && line.trim());

            return (
                <div key={pIndex} className="mb-2">
                    {regularText.map((line, index) => (
                        <p key={index} className="mb-1 text-xs">{line}</p>
                    ))}
                    {items.length > 0 && (
                        <ol className="list-decimal list-inside ml-2 space-y-0.5 text-xs">
                            {items.map((item, index) => (
                                <li key={index}>{item.replace(/^\d+\.\s*/, '')}</li>
                            ))}
                        </ol>
                    )}
                </div>
            );
        }

        // Regular paragraph with line breaks
        return (
            <p key={pIndex} className="mb-2 last:mb-0 text-xs leading-relaxed">
                {paragraph.split('\n').map((line, lIndex) => (
                    <React.Fragment key={lIndex}>
                        {line}
                        {lIndex < paragraph.split('\n').length - 1 && <br />}
                    </React.Fragment>
                ))}
            </p>
        );
    });
};

export default function ExpandableGuideMe({
    defaultExpanded = false,
    className = '',
    onExport = null
}) {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);
    const [timeLeft, setTimeLeft] = useState(20 * 60); // 20 minutes in seconds
    const [isRunning, setIsRunning] = useState(false);
    const [mode, setMode] = useState('Student');
    const [focus, setFocus] = useState('Explain');
    const [savedFocus, setSavedFocus] = useState(''); // Save focus when conversation starts
    const [conversationStarted, setConversationStarted] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [conversationId, setConversationId] = useState(null);
    const [isWaitingForResponse, setIsWaitingForResponse] = useState(false); // NEW STATE
    const [context, setContext] = useState({
        course: '',
        grade: '',
        readingLevel: '',
        standards: [],
        pastedContent: ''
    });
    const [standardsInput, setStandardsInput] = useState('');
    const [showBugReport, setShowBugReport] = useState(false);
    const [bugReportText, setBugReportText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [hasMessage, setHasMessage] = useState(false);

    // Timer effect
    useEffect(() => {
        let interval = null;
        if (isRunning && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(timeLeft => timeLeft - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            setIsRunning(false);
            resetConversation();
            setConversationId(null);
            setContext({
                course: '',
                grade: '',
                readingLevel: '',
                standards: [],
                pastedContent: ''
            });
        }
        return () => clearInterval(interval);
    }, [isRunning, timeLeft]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const getStatusDot = () => {
        if (hasMessage) return 'bg-green-500';
        if (isLoading) return 'bg-yellow-500';
        return 'bg-gray-400';
    };
    const startTimer = () => {
        setIsRunning(true);
    };

    const resetTimer = () => {
        setTimeLeft(20 * 60);
        setIsRunning(false);
        setIsLoading(false);
        setHasMessage(false);
    };

    const handleSendMessage = () => {
        if (inputMessage.trim() && !isWaitingForResponse) { // Prevent sending while waiting
            // Save focus and mark conversation as started on first message
            if (!conversationStarted) {
                setSavedFocus(focus);
                setConversationStarted(true);
            }

            const newMessage = {
                id: Date.now(),
                text: inputMessage,
                isUser: true,
                timestamp: new Date().toLocaleTimeString()
            };

            setMessages(prev => [...prev, newMessage]);
            setIsWaitingForResponse(true); // Show typing indicator

            // ADD THESE LINES - Set loading state
            setIsLoading(true);
            setHasMessage(false); // Reset hasMessage when starting new request

            // Prepare different payloads based on conversation state
            let aiPayload;
            let scriptFunction;

            if (conversationId) {
                // Continue existing conversation
                aiPayload = {
                    message: inputMessage,
                    conversation_id: conversationId
                };
                scriptFunction = 'callAIServiceContinue';
            } else {
                // Start new conversation
                aiPayload = {
                    message: inputMessage,
                    context: {
                        mode,
                        focus: conversationStarted ? savedFocus : focus,
                        course: context.course,
                        grade: context.grade,
                        readingLevel: context.readingLevel,
                        standards: context.standards,
                        pastedContent: context.pastedContent
                    }
                };
                scriptFunction = 'callAIServiceInitiation';
            }

            console.log('AI Payload:', JSON.stringify(aiPayload));
            console.log('Using function:', scriptFunction);

            // Success handler function
            const handleSuccess = (aiResponse) => {
                setIsWaitingForResponse(false); // Hide typing indicator

                // ADD THESE LINES - Update loading states
                setIsLoading(false);
                setHasMessage(true);

                console.log('AI Response:', JSON.stringify(aiResponse));

                // Check if there's an error in the response
                if (aiResponse.error) {
                    console.error('AI Service Error:', aiResponse.error);
                    const errorResponse = {
                        id: Date.now() + 1,
                        text: aiResponse.message || "I'm sorry, I'm having trouble connecting right now. Please try again.",
                        isUser: false,
                        timestamp: new Date().toLocaleTimeString(),
                        citations: []
                    };
                    setMessages(prev => [...prev, errorResponse]);
                    return;
                }

                // Store the conversation ID from the response if it's the first message
                if (!conversationId && aiResponse.conversation_id) {
                    console.log('Setting conversation ID:', aiResponse.conversation_id);
                    setConversationId(aiResponse.conversation_id);
                }

                // Create response message from AI
                const responseMessage = {
                    id: Date.now() + 1,
                    text: aiResponse.message || `I understand you want me to ${(conversationStarted ? savedFocus : focus).toLowerCase()} this topic in ${mode} mode. Let me help you with that based on your ${context.course || 'current'} course context.`,
                    isUser: false,
                    timestamp: new Date().toLocaleTimeString(),
                    citations: aiResponse.citations || []
                };
                setMessages(prev => [...prev, responseMessage]);
            };

            // Failure handler function
            const handleFailure = (error) => {
                setIsWaitingForResponse(false); // Hide typing indicator

                // ADD THESE LINES - Update loading states on failure
                setIsLoading(false);
                setHasMessage(false); // Keep hasMessage false since we didn't get a successful response

                console.error('AI Service Error:', error);
                // Handle error with fallback response
                const errorResponse = {
                    id: Date.now() + 1,
                    text: "I'm sorry, I'm having trouble connecting right now. Please try again.",
                    isUser: false,
                    timestamp: new Date().toLocaleTimeString(),
                    citations: []
                };
                setMessages(prev => [...prev, errorResponse]);
            };

            // Call the appropriate Apps Script function based on conversation state
            if (scriptFunction === 'callAIServiceContinue') {
                google.script.run
                    .withSuccessHandler(handleSuccess)
                    .withFailureHandler(handleFailure)
                    .callAIServiceContinue(aiPayload);
            } else {
                google.script.run
                    .withSuccessHandler(handleSuccess)
                    .withFailureHandler(handleFailure)
                    .callAIServiceInitiation(aiPayload);
            }

            setInputMessage('');
            if (!isRunning) startTimer();
        }
    };

    const addStandard = () => {
        if (standardsInput.trim() && !context.standards.includes(standardsInput.trim())) {
            setContext(prev => ({
                ...prev,
                standards: [...prev.standards, standardsInput.trim()]
            }));
            setStandardsInput('');
        }
    };

    const removeStandard = (standard) => {
        setContext(prev => ({
            ...prev,
            standards: prev.standards.filter(s => s !== standard)
        }));
    };

    const exportSession = () => {
        try {
            console.log('Export button clicked'); // Debug log

            const sessionData = {
                mode,
                focus: savedFocus || focus,
                context,
                messages,
                timeUsed: (20 * 60) - timeLeft
            };

            console.log('Session data:', sessionData); // Debug log

            // Enhanced debugging for messages
            console.log('Messages array:', messages);
            console.log('Messages length:', messages?.length);
            if (messages && messages.length > 0) {
                console.log('First message structure:', messages[0]);
                console.log('Message keys:', Object.keys(messages[0]));
                messages.forEach((msg, idx) => {
                    console.log(`Message ${idx}:`, {
                        role: msg.role,
                        content: msg.content,
                        text: msg.text, // Sometimes content is stored as 'text'
                        message: msg.message, // Or as 'message'
                        allKeys: Object.keys(msg)
                    });
                });
            }

            if (onExport) {
                onExport(sessionData);
            } else {
                // Create plain text format
                let textContent = '';

                // Add session header
                textContent += `Guide Me Session Export\n`;
                textContent += `Date: ${new Date().toISOString().split('T')[0]}\n`;
                textContent += `Mode: ${sessionData.mode || 'Not specified'}\n`;
                textContent += `Focus: ${sessionData.focus || 'Not specified'}\n`;
                textContent += `Time Used: ${Math.floor(sessionData.timeUsed / 60)}:${String(sessionData.timeUsed % 60).padStart(2, '0')}\n`;
                textContent += `\n${'='.repeat(50)}\n\n`;

                // Add context if available
                if (sessionData.context) {
                    textContent += `Context:\n${sessionData.context}\n\n`;
                    textContent += `${'='.repeat(50)}\n\n`;
                }

                // Add messages with enhanced property checking
                textContent += `Conversation:\n\n`;
                if (sessionData.messages && sessionData.messages.length > 0) {
                    sessionData.messages.forEach((message, index) => {
                        // Handle your specific message structure
                        const role = message.isUser ? 'User' : 'Assistant';
                        const content = message.text || 'No content';

                        textContent += `${role}: ${content}\n\n`;

                        // Add separator between messages (except for the last one)
                        if (index < sessionData.messages.length - 1) {
                            textContent += `${'-'.repeat(30)}\n\n`;
                        }
                    });
                } else {
                    textContent += 'No messages in this session.\n\n';
                }

                console.log('Text content created:', textContent.substring(0, 200) + '...'); // Debug log

                // Create and download text file
                const dataBlob = new Blob([textContent], { type: 'text/plain' });
                const url = URL.createObjectURL(dataBlob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `guide-me-session-${new Date().toISOString().split('T')[0]}.txt`;

                // Ensure the link is added to the document
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                URL.revokeObjectURL(url);

                console.log('File download initiated'); // Debug log
            }
        } catch (error) {
            console.error('Error in exportSession:', error);
            alert('Failed to export session. Check console for details.');
        }
    };

    const copyMessage = (text) => {
        navigator.clipboard.writeText(text);
    };

    const getSessionStatus = () => {
        const totalTime = 20 * 60;
        const timeUsed = totalTime - timeLeft;
        const messageCount = messages.length;
        // if the conversation is completed, the chat area should be cleared
        if (messageCount === 0) {
            return "Ready to chat with AI?";
        } else if (isRunning) {
            return `Active - ${messageCount} msgs`;
        } else {
            return `${messageCount} msgs - ${Math.floor(timeUsed / 60)}m`;
        }
    };

    const resetConversation = () => {
        setMessages([]);
        setConversationStarted(false);
        setSavedFocus('');
        setIsWaitingForResponse(false); // Reset waiting state
        resetTimer();
        setContext({
            course: '',
            grade: '',
            readingLevel: '',
            standards: [],
            pastedContent: ''
        });
        // reset the status dot
        setIsLoading(false);
        setHasMessage(false);
        setConversationId(null);
    };

    const handleReportBug = () => {
        setShowBugReport((show) => !show); // toggles form visibility
    };

    const handleSubmitBugReport = () => {
        if (bugReportText.trim()) {
            setBugReportText('');
            setShowBugReport(false);
            alert('Thank you for your bug report!');
        }
    };

    return (
        <div className={`w-full max-w-full bg-white border border-gray-200 rounded-lg overflow-hidden ${className}`}>
            {/* Header - Always Visible - Optimized for narrow sidebar */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full px-3 py-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors bg-white"
            >
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3 ">
                        <div className="relative">
                            <Bot className="w-5 h-5 text-gray-600" />
                            <div className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${getStatusDot()}`}></div>
                        </div>
                        <div>
                            <h3 className="font-medium text-gray-900 text-base ">Guide Me</h3>
                            <p className="text-sm text-gray-500">{getSessionStatus()}</p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                    {isRunning && (
                        <div className="flex items-center space-x-1 text-blue-600">
                            <Clock className="w-3 h-3" />
                            <span className="text-xs font-mono">{formatTime(timeLeft)}</span>
                        </div>
                    )}
                    <div className={`transform transition-transform duration-200 `}>
                        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                </div>
            </button>

            {/* Expanded Content */}
            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
                }`}>
                <div className="border-t border-gray-200 flex flex-col h-full">
                    {/* Timer and Export - Compact for sidebar */}
                    <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
                        <div className="flex flex-col space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2 bg-blue-50 px-2 py-1.5 rounded-lg">
                                    <Clock className="w-3 h-3 text-blue-600" />
                                    <span className="text-sm font-mono text-blue-600">
                                        {formatTime(timeLeft)}
                                    </span>
                                    <button
                                        onClick={resetTimer}
                                        className="text-xs text-blue-600 hover:text-blue-800 ml-1"
                                    >
                                        Reset
                                    </button>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${isRunning
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-gray-100 text-gray-600'}`}>
                                        {isRunning ? 'Active' : 'Paused'}
                                    </div>
                                    {conversationStarted && (
                                        <button
                                            onClick={resetConversation}
                                            className="text-xs text-gray-600 hover:text-gray-800 underline"
                                        >
                                            New Chat
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Mode and Focus Selection - Hide focus when conversation started */}
                    {!conversationStarted && (
                        <div className="px-3 py-3 border-b border-gray-200">
                            <div className="space-y-3">
                                {/* Focus Selection */}
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Focus</label>
                                    <div className="grid grid-cols-2 gap-1">
                                        {['Explain', 'Brainstorm', 'Plan', 'Practice'].map((f) => (
                                            <button
                                                key={f}
                                                onClick={() => setFocus(f)}
                                                className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors truncate ${focus === f
                                                    ? 'bg-purple-600 text-white'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                    }`}
                                            >
                                                {f}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Show saved focus when conversation started */}
                    {conversationStarted && (
                        <div className="px-3 py-2 bg-purple-50 border-b border-gray-200">
                            <div className="flex items-center justify-center">
                                <span className="text-xs text-purple-700 font-medium">
                                    Focus Mode: {savedFocus}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Context Settings */}
                    <ContextSection
                        context={context}
                        setContext={setContext}
                        standardsInput={standardsInput}
                        setStandardsInput={setStandardsInput}
                        addStandard={addStandard}
                        removeStandard={removeStandard}
                        conversationStarted={conversationStarted}
                    />

                    {/* Chat Area - Flexible height */}
                    <div className="px-3 py-3 flex-1 min-h-0">
                        <div className={`border border-gray-200 rounded-lg flex flex-col bg-white ${conversationStarted ? 'h-80' : 'h-48'
                            }`}>
                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                                {messages.length === 0 && !isWaitingForResponse ? (
                                    <div className="text-center text-gray-500 py-6 text-xs">
                                    </div>
                                ) : (
                                    <>
                                        {messages.map((message) => (
                                            <div key={message.id} className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[85%] rounded-lg px-2 py-1.5 text-xs ${message.isUser
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-gray-100 text-gray-900'
                                                    }`}>
                                                    {/* UPDATED MESSAGE RENDERING - THIS IS THE KEY CHANGE */}
                                                    <div className="mb-1">
                                                        {message.isUser ? (
                                                            <p className="leading-relaxed text-xs">{message.text}</p>
                                                        ) : (
                                                            <div className="space-y-1">
                                                                {formatAIMessage(message.text)}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Citations */}
                                                    {!message.isUser && message.citations && (
                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                            {message.citations.map((citation, idx) => (
                                                                <span
                                                                    key={idx}
                                                                    className="inline-block px-1 py-0.5 bg-white text-gray-700 text-xs rounded"
                                                                >
                                                                    {citation}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {/* Action buttons */}
                                                    {!message.isUser && (
                                                        <div className="flex items-center justify-between mt-1.5 pt-1 border-t border-gray-200">
                                                            <div className="flex items-center space-x-2">
                                                                <button
                                                                    onClick={() => copyMessage(message.text)}
                                                                    className="flex items-center space-x-1 text-xs text-gray-600 hover:text-gray-800"
                                                                >
                                                                    <Copy className="w-2.5 h-2.5" />
                                                                    <span>Copy</span>
                                                                </button>
                                                            </div>
                                                            <div className="flex space-x-1">
                                                                <button className="text-green-600 hover:text-green-800">
                                                                    <ThumbsUp className="w-2.5 h-2.5" />
                                                                </button>
                                                                <button className="text-red-600 hover:text-red-800">
                                                                    <ThumbsDown className="w-2.5 h-2.5" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="text-xs opacity-70 mt-1">
                                                        {message.timestamp}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        {/* TYPING INDICATOR - NEW ADDITION */}
                                        {isWaitingForResponse && (
                                            <div className="flex justify-start">
                                                <div className="max-w-[85%] rounded-lg px-2 py-1.5 bg-gray-100 text-gray-900">
                                                    <TypingIndicator />
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Input Area - Compact for sidebar */}
                            <div className="border-t border-gray-200 p-2">
                                <div className="flex space-x-1 items-end"> {/* Added items-end */}
                                    <textarea
                                        value={inputMessage}
                                        onChange={(e) => setInputMessage(e.target.value)}
                                        rows={3}
                                        placeholder={isWaitingForResponse ? "Waiting for response..." : "Ask me anything..."}
                                        disabled={isWaitingForResponse}
                                        className="flex-1 px-3 py-3 border border-gray-300 rounded-lg text-xs resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey && !isWaitingForResponse) {
                                                e.preventDefault();
                                                handleSendMessage();
                                            }
                                        }}
                                    />

                                    <button
                                        onClick={handleSendMessage}
                                        disabled={isWaitingForResponse}
                                        className={`px-2 py-2 h-8 rounded-lg transition-colors flex-shrink-0 ${isWaitingForResponse
                                            ? 'bg-gray-400 cursor-not-allowed'
                                            : 'bg-blue-600 hover:bg-blue-700'
                                            } text-white flex items-center justify-center`}
                                    >
                                        <Send className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="sticky bottom-0 bg-white border-t border-gray-200">
                        {/* Report a Bug section */}
                        <div className="px-3 py-2 border-b border-gray-100">
                            <button
                                onClick={handleReportBug}
                                className="flex items-center gap-2 text-xs text-red-600 font-medium hover:underline focus:outline-none"
                            >
                                <Bug className="w-4 h-4 text-red-500" />
                                Report a Bug
                            </button>
                            {showBugReport && (
                                <div className="mt-2 flex flex-col gap-2">
                                    <textarea
                                        value={bugReportText}
                                        onChange={(e) => setBugReportText(e.target.value)}
                                        placeholder="Describe the bug or issue..."
                                        rows={3}
                                        className="w-full border border-gray-300 rounded p-2 text-xs resize-none"
                                    />
                                    <button
                                        onClick={handleSubmitBugReport}
                                        disabled={!bugReportText.trim()}
                                        className="self-end bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700 disabled:opacity-50"
                                    >
                                        Submit
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Export Session button */}
                        <button
                            onClick={exportSession}
                            className="flex items-center justify-center space-x-1 bg-green-600 text-white px-3 py-1.5 rounded text-sm hover:bg-green-700 w-full"
                        >
                            <Download className="w-3 h-3" />
                            <span>Export Session</span>
                        </button>
                    </div>
                </div>

            </div>
        </div>



    );
}

// Context Section Component - Optimized for sidebar
function ContextSection({
    context,
    setContext,
    standardsInput,
    setStandardsInput,
    addStandard,
    removeStandard,
    conversationStarted
}) {
    const [isContextExpanded, setIsContextExpanded] = useState(false);

    return (
        <div className="border-b border-gray-200">
            <button
                onClick={() => setIsContextExpanded(!isContextExpanded)}
                className="w-full px-3 py-2 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
            >
                <span className="text-xs font-medium text-gray-700">
                    Context Settings {conversationStarted && '(Locked)'}
                </span>
                <div className="transform transition-transform duration-200">
                    {isContextExpanded ?
                        <ChevronUp className="w-3 h-3 text-gray-400" /> :
                        <ChevronDown className="w-3 h-3 text-gray-400" />
                    }
                </div>
            </button>

            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isContextExpanded ? 'max-h-96 opacity-100 overflow-y-auto' : 'max-h-0 opacity-0'
                }`}>
                <div className="px-3 pb-3 space-y-2">
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Course</label>
                        <input
                            type="text"
                            placeholder="e.g., Biology 101"
                            value={context.course}
                            onChange={(e) => setContext(prev => ({ ...prev, course: e.target.value }))}
                            disabled={conversationStarted}
                            className={`w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent ${conversationStarted ? 'bg-gray-50 text-gray-500' : ''
                                }`}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Grade</label>
                            <input
                                type="text"
                                placeholder="e.g., 9th"
                                value={context.grade}
                                onChange={(e) => setContext(prev => ({ ...prev, grade: e.target.value }))}
                                disabled={conversationStarted}
                                className={`w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent ${conversationStarted ? 'bg-gray-50 text-gray-500' : ''
                                    }`}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Reading Level</label>
                            <input
                                type="text"
                                placeholder="e.g., 8th"
                                value={context.readingLevel}
                                onChange={(e) => setContext(prev => ({ ...prev, readingLevel: e.target.value }))}
                                disabled={conversationStarted}
                                className={`w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent ${conversationStarted ? 'bg-gray-50 text-gray-500' : ''
                                    }`}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Standards</label>
                        <div className="flex space-x-1">
                            <input
                                type="text"
                                placeholder="Add standard"
                                value={standardsInput}
                                onChange={(e) => setStandardsInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && !conversationStarted && addStandard()}
                                disabled={conversationStarted}
                                className={`flex-1 px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent ${conversationStarted ? 'bg-gray-50 text-gray-500' : ''
                                    }`}
                            />
                            <button
                                onClick={addStandard}
                                disabled={conversationStarted}
                                className={`px-2 py-1.5 rounded-lg text-xs transition-colors flex-shrink-0 ${conversationStarted
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-blue-600 text-white hover:bg-blue-700'
                                    }`}
                            >
                                Add
                            </button>
                        </div>
                        {context.standards.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                                {context.standards.map((standard) => (
                                    <span
                                        key={standard}
                                        className={`inline-flex items-center px-1.5 py-0.5 text-xs rounded-full transition-colors ${conversationStarted
                                            ? 'bg-gray-100 text-gray-600 cursor-default'
                                            : 'bg-blue-100 text-blue-800 cursor-pointer hover:bg-blue-200'
                                            }`}
                                        onClick={() => !conversationStarted && removeStandard(standard)}
                                    >
                                        <span className="truncate max-w-20">{standard}</span>
                                        {!conversationStarted && <span className="ml-1">×</span>}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Paste Content */}
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Additional Context</label>
                        <textarea
                            placeholder="Add any relevant text or context here..."
                            value={context.pastedContent}
                            onChange={(e) => setContext(prev => ({ ...prev, pastedContent: e.target.value }))}
                            disabled={conversationStarted}
                            className={`w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent h-16 resize-none ${conversationStarted ? 'bg-gray-50 text-gray-500' : ''
                                }`}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

