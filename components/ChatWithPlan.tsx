
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { UserData, CalculatedMetrics, ExercisePlan, DietPlan, ChatMessage } from '../types';
import { startOrContinueChat } from '../services/geminiService';
import LoadingSpinner from './LoadingSpinner';

interface ChatWithPlanProps {
  userData: UserData;
  calculatedMetrics: CalculatedMetrics;
  initialExercisePlan: ExercisePlan | null;
  initialDietPlan: DietPlan | null;
}

const ChatWithPlan: React.FC<ChatWithPlanProps> = ({ 
  userData, 
  calculatedMetrics, 
  initialExercisePlan, 
  initialDietPlan 
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom when new messages are added
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Add an initial greeting message from the model, but only once when component mounts
  // and no messages exist yet.
   useEffect(() => {
    if (messages.length === 0) {
        setMessages([
            {
                id: crypto.randomUUID(),
                role: 'model',
                content: "Your plans are ready! How can I help you refine them or answer any questions? For example, you could ask 'Can you suggest an alternative for Monday's lunch?' or 'Make Friday's workout shorter'.",
                timestamp: new Date(),
            }
        ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array ensures this runs only once on mount


  const handleSendMessage = useCallback(async () => {
    if (!userInput.trim()) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: userInput.trim(),
      timestamp: new Date(),
    };

    setMessages(prevMessages => [...prevMessages, userMessage]);
    setUserInput('');
    setIsLoading(true);
    setChatError(null);

    // Pass the history *before* adding the current user message for the service,
    // as the service's current `activeChat.sendMessage` expects only the new message content.
    // The service internally manages history with the Gemini SDK.
    // We send the current `messages` state (which doesn't yet include `userMessage`)
    // and the `userMessage.content` separately.

    try {
      const modelResponseContent = await startOrContinueChat(
        messages, // History *before* this new user message
        userMessage.content,
        userData,
        calculatedMetrics,
        initialExercisePlan,
        initialDietPlan
      );

      const modelMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'model',
        content: modelResponseContent,
        timestamp: new Date(),
      };
      setMessages(prevMessages => [...prevMessages, modelMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred in chat.";
      setChatError(errorMessage);
      // Optionally add an error message to chat
       setMessages(prevMessages => [...prevMessages, {
         id: crypto.randomUUID(),
         role: 'model',
         content: `Sorry, I encountered an error: ${errorMessage}. Please try again or check console.`,
         timestamp: new Date()
       }]);
    } finally {
      setIsLoading(false);
    }
  }, [userInput, messages, userData, calculatedMetrics, initialExercisePlan, initialDietPlan]);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="mt-8 p-6 bg-slate-800 rounded-xl shadow-2xl">
      <h3 className="text-2xl font-semibold mb-4 text-sky-400 text-center">Chat About Your Plan</h3>
      
      <div 
        ref={chatContainerRef} 
        className="h-96 overflow-y-auto mb-4 p-4 bg-slate-700/50 border border-slate-600 rounded-lg space-y-4 scroll-smooth"
        aria-live="polite"
      >
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div 
              className={`max-w-[70%] p-3 rounded-xl shadow ${
                msg.role === 'user' 
                  ? 'bg-sky-600 text-white rounded-br-none' 
                  : 'bg-slate-600 text-slate-100 rounded-bl-none'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              <p className={`text-xs mt-1 ${msg.role === 'user' ? 'text-sky-200' : 'text-slate-400'} text-right`}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
             <div className="max-w-[70%] p-3 rounded-lg shadow bg-slate-600 text-slate-100 rounded-bl-none">
                <LoadingSpinner size="w-5 h-5" message="MetaFlux AI is thinking..." />
             </div>
          </div>
        )}
         {chatError && !isLoading && (
            <div className="flex justify-start">
                 <div className="max-w-[70%] p-3 rounded-lg shadow bg-red-700 text-white rounded-bl-none">
                    <p className="text-sm font-semibold">Chat Error:</p>
                    <p className="text-sm">{chatError}</p>
                 </div>
            </div>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <textarea
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask about your plan or request changes..."
          className="flex-grow p-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-colors placeholder-slate-400 resize-none"
          rows={2}
          aria-label="Chat message input"
          disabled={isLoading}
        />
        <button
          onClick={handleSendMessage}
          disabled={isLoading || !userInput.trim()}
          className="p-3 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-lg transition-colors disabled:bg-slate-500 disabled:cursor-not-allowed h-full flex items-center justify-center aspect-square"
          aria-label="Send chat message"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path d="M3.105 3.105a.5.5 0 01.815-.086L19.5 9.5a.5.5 0 010 .998L3.92 16.981a.5.5 0 01-.815-.086L2.016 3.105a.5.5 0 011.09.001z" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ChatWithPlan;
