import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { getGeminiApiUrl, getListModelsUrl, GEMINI_MODEL } from "../../config/gemini";

const VetChat = () => {
  const STORAGE_KEY = "vet_chat_history";
  
  const getInitialMessages = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }));
      }
    } catch (error) {
      console.error("Error loading chat history:", error);
    }
    return [
      {
        id: 1,
        text: "Hello! I'm your virtual veterinary assistant. I'm here to provide general guidance about animal health and wellness. How can I assist you today?",
        sender: "bot",
        timestamp: new Date(),
      },
    ];
  };

  const [messages, setMessages] = useState(getInitialMessages);
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef(null);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    saveChatHistory();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const saveChatHistory = () => {
    try {
      const serialized = messages.map(msg => ({
        ...msg,
        timestamp: msg.timestamp.toISOString(),
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serialized));
    } catch (error) {
      console.error("Error saving chat history:", error);
    }
  };

  const clearChatHistory = () => {
    const initialMessage = [
      {
        id: 1,
        text: "Hello! I'm your virtual veterinary assistant. I'm here to provide general guidance about animal health and wellness. How can I assist you today?",
        sender: "bot",
        timestamp: new Date(),
      },
    ];
    setMessages(initialMessage);
    localStorage.removeItem(STORAGE_KEY);
  };

  const formatConversationHistory = (currentMessages) => {
    return currentMessages
      .filter((m) => m.sender === "user" || m.sender === "bot")
      .map((m) => ({
        role: m.sender === "user" ? "user" : "model",
        parts: [{ text: m.text }],
      }));
  };

  const buildSystemPrompt = () => {
    return `You are a professional veterinary assistant providing expert guidance on animal health and wellness. 

IMPORTANT GUIDELINES:
- Always respond formally, politely, and professionally
- Provide accurate, evidence-based information about animal health
- For serious or emergency symptoms, always recommend consulting a licensed veterinarian immediately
- Be empathetic and understanding in your responses
- Avoid making definitive diagnoses - instead, provide general guidance and recommend professional veterinary consultation
- Use clear, professional language that is accessible to pet owners
- If asked about specific medications or treatments, always recommend consulting a veterinarian for proper dosing and administration
- Stay within your knowledge domain - if unsure, recommend consulting a professional

Your responses should be helpful, informative, and prioritize animal welfare and safety.`;
  };

  const sendMessageToGemini = async (userMessage, conversationHistory, modelName = GEMINI_MODEL) => {
    const systemPrompt = buildSystemPrompt();
    const apiUrl = getGeminiApiUrl(modelName);
    
    console.log("Calling Gemini API:", {
      url: apiUrl.replace(/key=[^&]+/, 'key=***'), // Mask API key in logs
      model: modelName,
    });
    
    const requestBody = {
      contents: [
        {
          role: "user",
          parts: [{ text: systemPrompt }],
        },
        ...conversationHistory,
        {
          role: "user",
          parts: [{ text: userMessage }],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
      ],
    };

    const response = await axios.post(
      apiUrl,
      requestBody,
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 30000,
      }
    );
    
    console.log("Gemini API Response:", {
      status: response.status,
      hasCandidates: !!response.data?.candidates,
    });

      if (
        response.data &&
        response.data.candidates &&
        response.data.candidates.length > 0
      ) {
        const candidate = response.data.candidates[0];
        if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
          return candidate.content.parts[0].text;
        }
      }

    if (
      response.data &&
      response.data.candidates &&
      response.data.candidates.length > 0
    ) {
      const candidate = response.data.candidates[0];
      if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
        return candidate.content.parts[0].text;
      }
    }

    throw new Error("Unexpected response format from Gemini API");
  };

  const listAvailableModels = async () => {
    try {
      const response = await axios.get(getListModelsUrl(), {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 10000,
      });
      
      if (response.data && response.data.models) {
        const availableModels = response.data.models
          .filter(model => model.supportedGenerationMethods?.includes('generateContent'))
          .map(model => model.name.replace('models/', ''));
        
        console.log("Available models:", availableModels);
        return availableModels;
      }
      return [];
    } catch (error) {
      console.error("Error listing models:", error);
      return [];
    }
  };

  const prioritizeStableModels = (models) => {
    // Preferred stable models in order of preference
    const preferredModels = [
      'gemini-2.5-flash',
      'gemini-2.0-flash',
      'gemini-flash-latest',
      'gemini-pro-latest',
      'gemini-2.5-pro',
      'gemini-2.0-pro-exp',
    ];
    
    const stable = [];
    const preview = [];
    const experimental = [];
    
    models.forEach(model => {
      if (preferredModels.includes(model)) {
        stable.push(model);
      } else if (model.includes('preview') || model.includes('Preview')) {
        preview.push(model);
      } else if (model.includes('exp') || model.includes('experimental')) {
        experimental.push(model);
      } else {
        stable.push(model);
      }
    });
    
    // Sort preferred models to front
    stable.sort((a, b) => {
      const aIndex = preferredModels.indexOf(a);
      const bIndex = preferredModels.indexOf(b);
      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      return 0;
    });
    
    return [...stable, ...preview, ...experimental];
  };

  const sendMessageWithFallback = async (userMessage, conversationHistory) => {
    // First, try to get available models
    const availableModels = await listAvailableModels();
    
    // Prioritize stable models, filter out preview/experimental if we have stable ones
    let modelsToTry;
    if (availableModels.length > 0) {
      const prioritized = prioritizeStableModels(availableModels);
      
      // Filter to only stable, non-preview models
      const stableOnly = prioritized.filter(m => 
        !m.includes('preview') && 
        !m.includes('Preview') && 
        !m.includes('exp') &&
        !m.includes('experimental') &&
        !m.includes('thinking') &&
        !m.includes('tts') &&
        !m.includes('image') &&
        !m.includes('computer-use') &&
        !m.includes('lite') &&
        !m.includes('learnlm') &&
        !m.includes('gemma') &&
        !m.includes('nano') &&
        !m.includes('robotics')
      );
      
      // Use stable models, limit to top 3 to avoid rate limits
      modelsToTry = stableOnly.length > 0 
        ? stableOnly.slice(0, 3)
        : ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-flash-latest'];
    } else {
      modelsToTry = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-flash-latest'];
    }
    
    console.log("Trying models in order:", modelsToTry);
    
    let lastError = null;

    for (const model of modelsToTry) {
      try {
        return await sendMessageToGemini(userMessage, conversationHistory, model);
      } catch (error) {
        console.error(`Error with model ${model}:`, error);
        lastError = error;
        
        // For 429 errors, don't try other models - wait instead
        if (error.response?.status === 429) {
          throw error;
        }
        
        if (error.response?.status === 404) {
          continue;
        }
        
        // For other errors, continue to next model
        continue;
      }
    }

    throw lastError || new Error("All model attempts failed. Please check your API key has access to Gemini models.");
  };

  const sendMessageToGeminiHandler = async (userMessage, conversationHistory) => {
    try {
      return await sendMessageWithFallback(userMessage, conversationHistory);
    } catch (error) {
      console.error("Gemini API error:", error);
      
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        
        if (status === 404) {
          const errorMsg = data?.error?.message || "Resource not found";
          throw new Error(
            `API endpoint not found (404). ${errorMsg}. Please verify: 1) Your API key is valid and has Generative AI API enabled, 2) The API key has access to Gemini models in Google Cloud Console, 3) Check the browser console for available models.`
          );
        } else if (status === 400) {
          throw new Error(
            data.error?.message || "Invalid request. Please try rephrasing your question."
          );
        } else if (status === 403) {
          throw new Error(
            "API access denied. Please check your API key configuration and ensure it has the necessary permissions."
          );
        } else if (status === 429) {
          const retryAfter = error.response.headers?.['retry-after'] || error.response.headers?.['Retry-After'];
          const waitTime = retryAfter ? `${retryAfter} seconds` : "a few moments";
          throw new Error(
            `Rate limit exceeded (429). Please wait ${waitTime} before trying again. Your API key may have hit the request limit.`
          );
        } else if (status >= 500) {
          throw new Error(
            "Service temporarily unavailable. Please try again later."
          );
        } else {
          throw new Error(
            data.error?.message || `API error (${status}). Please try again later.`
          );
        }
      } else if (error.request) {
        throw new Error(
          "Unable to connect to the service. Please check your internet connection."
        );
      } else if (error.code === "ECONNABORTED") {
        throw new Error(
          "Request timed out. Please try again."
        );
      }
      
      throw error;
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || isTyping) return;

    const userMessageText = inputText.trim();
    setInputText("");
    setError(null);

    const userMessage = {
      id: Date.now(),
      text: userMessageText,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    try {
      const conversationHistory = formatConversationHistory(messages);
      const aiResponse = await sendMessageToGeminiHandler(userMessageText, conversationHistory);

      const botMessage = {
        id: Date.now() + 1,
        text: aiResponse.trim(),
        sender: "bot",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      setError(error.message);

      const errorMessage = {
        id: Date.now() + 1,
        text: `I apologize, but I encountered an issue: ${error.message}. Please try again, or contact a veterinarian directly for immediate assistance.`,
        sender: "bot",
        timestamp: new Date(),
        error: true,
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickQuestion = async (question) => {
    if (isTyping) return;

    setInputText(question);
    setError(null);

    const userMessage = {
      id: Date.now(),
      text: question,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    try {
      const conversationHistory = formatConversationHistory(messages);
      const aiResponse = await sendMessageToGeminiHandler(question, conversationHistory);

      const botMessage = {
        id: Date.now() + 1,
        text: aiResponse.trim(),
        sender: "bot",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      setError(error.message);

      const errorMessage = {
        id: Date.now() + 1,
        text: `I apologize, but I encountered an issue: ${error.message}. Please try again, or contact a veterinarian directly for immediate assistance.`,
        sender: "bot",
        timestamp: new Date(),
        error: true,
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const quickQuestions = [
    "What are common signs of illness in animals?",
    "When should I seek immediate veterinary care?",
    "How can I prevent diseases in my animals?",
    "What vaccinations do animals typically need?",
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-250px)] max-h-[800px] bg-white rounded-lg border border-gray-200/60 overflow-hidden">
      <div className="bg-blue-600 text-white p-4 border-b border-blue-700/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-semibold">Veterinary Assistant</h3>
              <p className="text-blue-100 text-xs">
                Powered by AI - Ask me anything about animal health
              </p>
            </div>
          </div>
          {messages.length > 1 && (
            <button
              onClick={clearChatHistory}
              className="px-2.5 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-xs font-medium"
              title="Clear chat history"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
          >
            {message.sender === "bot" && !message.error && (
              <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
                <svg
                  className="w-4 h-4 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
            )}
            <div
              className={`max-w-[75%] rounded-lg px-3.5 py-2.5 ${
                message.sender === "user"
                  ? "bg-blue-600 text-white shadow-sm"
                  : message.error
                  ? "bg-red-50 text-red-900 border border-red-200"
                  : "bg-white text-gray-900 shadow-sm border border-gray-200/60"
              }`}
            >
              <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                {message.text}
              </p>
              <p
                className={`text-xs mt-1.5 ${
                  message.sender === "user"
                    ? "text-blue-100"
                    : message.error
                    ? "text-red-600"
                    : "text-gray-500"
                }`}
              >
                {message.timestamp.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start animate-fade-in">
            <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
              <svg
                className="w-4 h-4 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            </div>
            <div className="bg-white rounded-lg px-3.5 py-2.5 shadow-sm border border-gray-200/60">
              <div className="flex space-x-1.5">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></div>
                <div
                  className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                ></div>
                <div
                  className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {error && !isTyping && (
          <div className="bg-yellow-50 border-l-2 border-yellow-400 p-3 rounded-r-lg">
            <div className="flex items-start">
              <svg
                className="w-4 h-4 text-yellow-400 mt-0.5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <p className="text-xs text-yellow-800">{error}</p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {messages.length === 1 && (
        <div className="px-4 pt-3 pb-2 border-t border-gray-200/60 bg-white">
          <p className="text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">
            Quick Questions
          </p>
          <div className="flex flex-wrap gap-1.5">
            {quickQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => handleQuickQuestion(question)}
                disabled={isTyping}
                className="px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 rounded-full hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      <form
        onSubmit={handleSendMessage}
        className="border-t border-gray-200/60 p-3 bg-white"
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => {
              setInputText(e.target.value);
              setError(null);
            }}
            placeholder="Type your question about animal health..."
            disabled={isTyping}
            className="flex-1 px-3.5 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 disabled:bg-gray-50 disabled:cursor-not-allowed transition-all"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e);
              }
            }}
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isTyping}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-medium flex items-center gap-2 shadow-sm hover:shadow disabled:shadow-none"
          >
            {isTyping ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>Sending...</span>
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4"
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
                <span>Send</span>
              </>
            )}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2 px-1 flex items-center gap-1">
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          For emergency situations, please contact a veterinarian immediately. This is for general guidance only.
        </p>
      </form>
    </div>
  );
};

export default VetChat;
