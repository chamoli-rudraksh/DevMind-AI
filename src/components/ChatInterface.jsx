import React, { useState, useRef, useEffect } from "react";
import { Send, MessageSquare, Sparkles, Copy, Check, Zap } from "lucide-react";
import ReactMarkdown from "react-markdown";

const SUGGESTED_QUESTIONS = [
  "What is the main purpose of this codebase?",
  "What are the most complex parts of the code?",
  "How is the project structured?",
  "Are there any obvious bugs or anti-patterns?",
  "How can I contribute to this project?",
];

const ChatInterface = ({ repoName, fullUrl }) => {
  const [messages, setMessages] = useState([
    {
      id: "0",
      role: "model",
      text: `Hello! I've analyzed **${repoName}**. I can explain the architecture, identify potential bugs, suggest improvements, or help you understand any part of the code.\n\nWhat would you like to know?`,
    },
  ]);

  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSend = async (messageText) => {
    const msg = messageText || input;
    if (!msg.trim() || isTyping) return;

    const userMsg = {
      id: Date.now().toString(),
      role: "user",
      text: msg,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      const response = await fetch("/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg.text, repo_url: fullUrl }),
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
          text: "⚠️ I lost connection to the backend. Please ensure the Python server is running on port 8000.",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="bg-[#2A3254] rounded-2xl border border-[#4A5578]/50 overflow-hidden flex flex-col h-[700px] shadow-lg">
      {/* Header */}
      <div className="p-5 border-b border-[#4A5578]/30 flex items-center gap-3 bg-[#1A1F3A]">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#3B82F6] to-[#06B6D4] flex items-center justify-center">
          <MessageSquare size={18} className="text-white" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-white">AI Code Assistant</h2>
          <p className="text-xs text-[#94A3B8]">Context-aware · Analyzing {repoName}</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-emerald-400 font-medium">Live</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#0A0E27]/30 custom-scrollbar">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex w-full group ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div className="relative max-w-[85%]">
              {msg.role === "model" && (
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Sparkles size={12} className="text-[#3B82F6]" />
                  <span className="text-[10px] text-[#94A3B8] font-medium uppercase tracking-wider">DevMind AI</span>
                </div>
              )}
              <div
                className={`rounded-2xl p-4 shadow-sm ${
                  msg.role === "user"
                    ? "bg-gradient-to-br from-[#3B82F6] to-[#06B6D4] text-white rounded-tr-sm"
                    : "bg-[#1A1F3A] border border-[#4A5578]/40 text-[#E2E8F0] rounded-tl-sm"
                }`}
              >
                <div className="prose prose-invert prose-sm max-w-none prose-code:text-[#06B6D4] prose-pre:bg-[#0A0E27] prose-pre:border prose-pre:border-[#4A5578]/50">
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
              </div>
              {/* Copy button */}
              <button
                onClick={() => handleCopy(msg.text, msg.id)}
                className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 bg-[#2A3254] border border-[#4A5578] rounded-full flex items-center justify-center hover:bg-[#3B82F6]/20"
              >
                {copiedId === msg.id ? (
                  <Check size={10} className="text-emerald-400" />
                ) : (
                  <Copy size={10} className="text-[#94A3B8]" />
                )}
              </button>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-[#1A1F3A] border border-[#4A5578]/40 rounded-2xl rounded-tl-sm p-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-[#3B82F6] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 bg-[#3B82F6] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 bg-[#3B82F6] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions (show only initially) */}
      {messages.length <= 1 && (
        <div className="px-5 pb-3 flex flex-wrap gap-2">
          {SUGGESTED_QUESTIONS.map((q, i) => (
            <button
              key={i}
              onClick={() => handleSend(q)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1A1F3A] border border-[#4A5578]/50 rounded-full text-xs text-[#94A3B8] hover:text-white hover:border-[#3B82F6]/50 transition-all"
            >
              <Zap size={10} className="text-[#3B82F6]" />
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-4 bg-[#1A1F3A] border-t border-[#4A5578]/30 flex gap-3">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Ask about architecture, bugs, or request code explanations..."
          className="flex-1 bg-[#2A3254] border border-[#4A5578] rounded-xl px-4 py-3 text-white placeholder-[#4A5578] focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20 resize-none h-[52px] text-sm transition-all"
        />
        <button
          onClick={() => handleSend()}
          disabled={!input.trim() || isTyping}
          className="w-[52px] h-[52px] flex items-center justify-center rounded-xl bg-gradient-to-r from-[#3B82F6] to-[#06B6D4] text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/20"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};

export default ChatInterface;
