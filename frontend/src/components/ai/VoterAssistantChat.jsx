import React, { useState, useRef, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import {
  MessageSquare,
  Sparkles,
  X,
  Send,
  ShieldCheck,
  Bot,
  User,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';

export const VoterAssistantChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'Hello! I am your Sovereign Democracy Civic Assistant powered by Google Gemini. Ask me anything about registering with your Aadhaar suffix, generating your Secret Voting Key (SVK), casting an anonymous ballot, or verifying your blockchain receipt.',
      actions: ['How do I register?', 'What is an SVK?', 'How do I cast a ballot?', 'How to verify receipt?'],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (messageText) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg = {
      role: 'user',
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await axiosClient.post('/ai/assistant/chat', {
        message: textToSend.trim(),
      });

      if (res.success && res.data) {
        const assistantMsg = {
          role: 'assistant',
          text: res.data.reply,
          actions: res.data.suggestedActions || [],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            text: 'I could not process your query at this moment. Please check the official election guides or try again shortly.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: 'Unable to connect to the Civic Assistant service: ' + err.message,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-xs shadow-2xl shadow-cyan-500/30 hover:scale-105 transition-all cursor-pointer border border-cyan-400/30"
          title="Open AI Civic Assistant"
        >
          <Sparkles className="h-4 w-4 animate-pulse text-slate-950" />
          <span className="font-extrabold tracking-wide">Civic AI Assistant</span>
        </button>
      )}

      {/* Chat Window Modal */}
      {isOpen && (
        <div className="flex flex-col w-[360px] sm:w-[420px] h-[540px] rounded-3xl border border-slate-800 bg-[#0c101c]/95 backdrop-blur-2xl shadow-2xl shadow-cyan-950/40 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/80">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>Civic Assistant</span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                    Gemini AI
                  </span>
                </h3>
                <p className="text-[10px] text-slate-400">Grounded in Sovereign Democracy protocols</p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-cyan-500 text-slate-950 font-medium rounded-tr-none shadow-md shadow-cyan-500/10'
                      : 'bg-slate-900/90 text-slate-200 border border-slate-800 rounded-tl-none'
                  }`}
                >
                  <p>{msg.text}</p>
                </div>
                <span className="text-[9px] text-slate-500 mt-1 px-1">{msg.timestamp}</span>

                {/* Suggested Action Pills */}
                {msg.actions && msg.actions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2 max-w-[90%]">
                    {msg.actions.map((act, j) => (
                      <button
                        key={j}
                        onClick={() => handleSend(act)}
                        disabled={loading}
                        className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-800 hover:border-cyan-500/40 transition-all cursor-pointer disabled:opacity-50"
                      >
                        {act}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900/60 p-3 rounded-2xl border border-slate-800 max-w-[70%]">
                <Sparkles className="h-3.5 w-3.5 animate-spin text-cyan-400" />
                <span>Gemini is generating response...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input & Privacy Disclaimer */}
          <div className="p-3 border-t border-slate-800 bg-slate-900/80 space-y-2">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about voting, SVK, registration..."
                disabled={loading}
                className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="p-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all cursor-pointer disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
            <div className="flex items-center justify-between text-[9px] text-slate-500 px-1">
              <span className="flex items-center gap-1">
                <ShieldCheck className="h-3 w-3 text-cyan-400" />
                <span>Zero key or PII exposure</span>
              </span>
              <span>Sovereign Democracy AI</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
