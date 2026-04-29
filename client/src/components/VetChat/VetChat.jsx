import React, { useState, useRef, useEffect, useCallback } from "react";
import axios from "axios";
import API_BASE_URL, { getAuthHeaders } from "../../config/api";
import { Send, Trash2, Bot, AlertTriangle, Sparkles, RefreshCcw } from "lucide-react";

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

  const saveChatHistory = useCallback(() => {
    try {
      const serialized = messages.map(msg => ({
        ...msg,
        timestamp: msg.timestamp.toISOString(),
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serialized));
    } catch (error) {
      console.error("Error saving chat history:", error);
    }
  }, [messages]);

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

  const sendMessageToServer = async (userMessage, conversationHistory) => {
    const apiUrl = `${API_BASE_URL}/animal/vetchat/`;
    const requestBody = {
      message: userMessage,
      history: conversationHistory,
    };

    try {
      const response = await axios.post(apiUrl, requestBody, {
        headers: getAuthHeaders(),
        timeout: 35000,
      });

      if (response.data?.reply) {
        return response.data.reply;
      }
      throw new Error("Unexpected response format from server.");
    } catch (error) {
      console.error("VetChat API error:", error);

      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;

        if (status === 401) {
          throw new Error("Session expired. Please log in again.");
        } else if (status === 400) {
          throw new Error(data?.error || "Invalid request. Please try again.");
        } else if (status === 429) {
          throw new Error(`Rate limit exceeded. Please try again in a few moments.`);
        } else if (status >= 500) {
          throw new Error(data?.error || "Service temporarily unavailable. Please try again later.");
        } else {
          throw new Error(data?.error || `API error (${status}). Please try again later.`);
        }
      } else if (error.request) {
        throw new Error("Unable to connect to the service. Please check your internet connection.");
      } else if (error.code === "ECONNABORTED") {
        throw new Error("Request timed out. Please try again.");
      }

      throw error;
    }
  };

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
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
      const aiResponse = await sendMessageToServer(userMessageText, conversationHistory);

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
      const aiResponse = await sendMessageToServer(question, conversationHistory);

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
        text: `I apologize, but I encountered an issue: ${error.message}. Please try again.`,
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
    "Common signs of illness in pets?",
    "When to seek emergency care?",
    "Disease prevention tips?",
    "Required vaccinations?",
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-220px)] min-h-[500px] bg-slate-50/30 overflow-hidden transition-all duration-500">
      {/* Premium Header */}
      <div className="relative z-10 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-600/20 transform hover:rotate-6 transition-transform">
                <Bot size={26} />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">Veterinary AI</h3>
                <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-wider rounded-full">Online</span>
              </div>
              <p className="text-slate-500 text-xs font-medium flex items-center gap-1">
                <Sparkles size={12} className="text-blue-500" />
                Specialized in animal health guidance
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {messages.length > 1 && (
              <button
                onClick={clearChatHistory}
                className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all duration-200"
                title="Clear History"
              >
                <Trash2 size={20} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-8 space-y-8 scroll-smooth bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] [background-position:center]">
        {messages.map((message, index) => (
          <div
            key={message.id}
            className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"} group animate-in fade-in slide-in-from-bottom-2 duration-300`}
          >
            <div className={`flex gap-3 max-w-[85%] ${message.sender === "user" ? "flex-row-reverse" : "flex-row"}`}>
              {message.sender === "bot" && (
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 transition-transform group-hover:scale-110 ${message.error ? "bg-red-100 text-red-600" : "bg-blue-50 text-blue-600"}`}>
                  <Bot size={18} />
                </div>
              )}

              <div className="flex flex-col gap-1">
                <div
                  className={`relative px-5 py-3.5 rounded-2xl text-sm leading-relaxed shadow-sm transition-all ${message.sender === "user"
                    ? "bg-blue-600 text-white rounded-tr-none shadow-blue-600/10"
                    : message.error
                      ? "bg-red-50 text-red-900 border border-red-100 rounded-tl-none"
                      : "bg-white text-slate-700 border border-slate-100 rounded-tl-none hover:shadow-md"
                    }`}
                >
                  <p className="whitespace-pre-wrap break-words">{message.text}</p>

                  {message.sender === "bot" && !message.error && index === 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-50 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {quickQuestions.map((q, i) => (
                        <button
                          key={i}
                          onClick={() => handleQuickQuestion(q)}
                          className="text-left px-3 py-2 text-xs text-blue-600 bg-blue-50/50 hover:bg-blue-600 hover:text-white rounded-lg transition-all border border-blue-100/50"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <span className={`text-[10px] font-semibold uppercase tracking-widest px-1 ${message.sender === "user" ? "text-right text-slate-400" : "text-left text-slate-400"}`}>
                  {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start animate-in fade-in slide-in-from-left-2 duration-300">
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 flex-shrink-0 mt-1">
                <Bot size={18} />
              </div>
              <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-none px-5 py-4 shadow-sm flex gap-1.5 items-center">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white px-6 py-6 border-t border-slate-100">
        <form
          onSubmit={handleSendMessage}
          className="relative flex items-center"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => {
              setInputText(e.target.value);
              setError(null);
            }}
            placeholder="Ask anything about your pet's health..."
            disabled={isTyping}
            className="w-full pl-6 pr-16 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 focus:bg-white transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isTyping}
            className={`absolute right-2 p-3 rounded-xl transition-all duration-300 ${!inputText.trim() || isTyping
              ? "text-slate-300 bg-transparent"
              : "text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 transform active:scale-95"
              }`}
          >
            {isTyping ? (
              <RefreshCcw className="animate-spin" size={20} />
            ) : (
              <Send size={20} />
            )}
          </button>
        </form>

        <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-slate-400 font-medium">
          <AlertTriangle size={14} className="text-amber-500" />
          <p>For emergencies, please contact a professional veterinarian immediately.</p>
        </div>
      </div>
    </div>
  );
};

export default VetChat;

