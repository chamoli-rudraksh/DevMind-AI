import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { generateChatResponseStream } from '../services/gemini';

const ChatInterface = ({ repoName }) => {
  const [messages, setMessages] = useState([
    {
      id: '0',
      role: 'model',
      text: `Hello! I've analyzed **${repoName}**. I can explain the architecture, identify potential bugs, or help you generate new features based on this codebase. What would you like to know?`,
    },
  ]);

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const history = messages.map((m) => ({
        role: m.role,
        parts: [{ text: m.text }],
      }));

      const result = await generateChatResponseStream(
        history,
        userMsg.text,
        repoName
      );

      const modelMsgId = (Date.now() + 1).toString();
      setMessages((prev) => [
        ...prev,
        { id: modelMsgId, role: 'model', text: '' },
      ]);

      let fullText = '';

      for await (const chunk of result) {
        const text = chunk?.text || '';
        fullText += text;

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === modelMsgId
              ? { ...msg, text: fullText }
              : msg
          )
        );
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: 'error',
          role: 'model',
          text:
            'Sorry, I encountered an error connecting to the AI service. Please check your API key.',
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
            <h2 className="text-lg font-semibold text-white">
              Ask Questions
            </h2>
          </div>
          <p className="text-sm text-[#94A3B8]">
            Context-aware AI assistant
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#0A0E27]/20">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex w-full ${
              msg.role === 'user'
                ? 'justify-end'
                : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[80%] rounded-2xl p-4 shadow-sm relative animate-in fade-in slide-in-from-bottom-2 duration-300 ${
                msg.role === 'user'
                  ? 'bg-gradient-to-br from-[#3B82F6] to-[#06B6D4] text-white rounded-tr-sm'
                  : 'bg-[#1A1F3A] border border-[#4A5578]/40 text-[#E2E8F0] rounded-tl-sm'
              }`}
            >
              {msg.role === 'model' && (
                <Sparkles
                  size={14}
                  className="absolute -top-2 -left-2 text-[#3B82F6] bg-[#1A1F3A] rounded-full p-0.5"
                />
              )}

              <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-[#0A0E27]/50 prose-pre:border prose-pre:border-[#4A5578]/30 prose-code:text-[#06B6D4]">
                <ReactMarkdown>{msg.text}</ReactMarkdown>
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-[#1A1F3A] border border-[#4A5578]/40 text-[#E2E8F0] rounded-2xl rounded-tl-sm p-4 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-[#3B82F6] rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 bg-[#3B82F6] rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 bg-[#3B82F6] rounded-full animate-bounce" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-[#2A3254] border-t border-[#4A5578]/30">
        {messages.length < 3 && (
          <div className="flex gap-2 overflow-x-auto pb-3 mb-2 no-scrollbar">
            {[
              'Explain architecture',
              'Identify bugs',
              'Improve performance',
            ].map((s) => (
              <button
                key={s}
                onClick={() => setInput(s)}
                className="whitespace-nowrap px-3 py-1.5 rounded-full bg-[#3B82F6]/10 border border-[#3B82F6]/30 text-[#3B82F6] text-xs hover:bg-[#3B82F6]/20 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask a question about this codebase..."
            className="flex-1 bg-[#1A1F3A] border border-[#4A5578] rounded-xl px-4 py-3 text-white placeholder-[#94A3B8] focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] resize-none h-[52px]"
          />

          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="w-[52px] h-[52px] flex items-center justify-center rounded-xl bg-gradient-to-r from-[#3B82F6] to-[#06B6D4] text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity shadow-lg"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
