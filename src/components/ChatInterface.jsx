import React, { useState, useRef, useEffect } from "react";
import { Send, MessageSquare, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";

// REMOVED: import { generateChatResponseStream } from '../services/gemini';

const ChatInterface = ({ repoName, fullUrl }) => {
  // Added fullUrl prop
  const [messages, setMessages] = useState([
    {
      id: "0",
      role: "model",
      text: `Hello! I've analyzed **${repoName}**. I can explain the architecture, identify potential bugs, or help you generate new features. What would you like to know?`,
    },
  ]);

  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMsg = {
      id: Date.now().toString(),
      role: "user",
      text: input,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      // CALL PYTHON BACKEND INSTEAD OF GEMINI.JS
      const response = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg.text,
          repo_url: fullUrl,
        }),
      });

      if (!response.ok) throw new Error("Backend failed");

      const data = await response.json();

      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: "model", text: data.response },
      ]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        {
          id: "error",
          role: "model",
          text: "Sorry, I lost connection to the backend. Is the Python server running?",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="bg-[#2A3254] rounded-2xl border border-[#4A5578]/50 overflow-hidden flex flex-col h-[600px] shadow-lg">
      {/* Header */}
      <div className="p-6 border-b border-[#4A5578]/30 flex items-center justify-between bg-[#2A3254]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <MessageSquare className="text-[#3B82F6]" size={20} />
            <h2 className="text-lg font-semibold text-white">Ask Questions</h2>
          </div>
          <p className="text-sm text-[#94A3B8]">Context-aware AI assistant</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#0A0E27]/20 custom-scrollbar">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex w-full ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl p-4 shadow-sm relative ${
                msg.role === "user"
                  ? "bg-gradient-to-br from-[#3B82F6] to-[#06B6D4] text-white rounded-tr-sm"
                  : "bg-[#1A1F3A] border border-[#4A5578]/40 text-[#E2E8F0] rounded-tl-sm"
              }`}
            >
              {msg.role === "model" && (
                <Sparkles
                  size={14}
                  className="absolute -top-2 -left-2 text-[#3B82F6] bg-[#1A1F3A] rounded-full p-0.5"
                />
              )}
              <div className="prose prose-invert prose-sm max-w-none">
                <ReactMarkdown>{msg.text}</ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-[#1A1F3A] border border-[#4A5578]/40 text-[#E2E8F0] rounded-2xl rounded-tl-sm p-4">
              <span className="text-xs text-gray-400">AI is thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-[#2A3254] border-t border-[#4A5578]/30 flex gap-3">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Ask about the code..."
          className="flex-1 bg-[#1A1F3A] border border-[#4A5578] rounded-xl px-4 py-3 text-white focus:border-[#3B82F6] resize-none h-[52px]"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isTyping}
          className="w-[52px] h-[52px] flex items-center justify-center rounded-xl bg-gradient-to-r from-[#3B82F6] to-[#06B6D4] text-white hover:opacity-90 transition-opacity"
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
};

export default ChatInterface;
