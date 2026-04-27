"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import { chatApi, ChatMessage } from "@/lib/chat";
import { useAuth } from "@clerk/nextjs";

// ── Gemini logo SVG ───────────────────────────────────────────────────────────
function GeminiIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <defs>
        <linearGradient id="gG" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="50%" stopColor="#7c6af7" />
          <stop offset="100%" stopColor="#4ade80" />
        </linearGradient>
      </defs>
      <path
        d="M14 2 C14 2 16 10 22 14 C16 18 14 26 14 26 C14 26 12 18 6 14 C12 10 14 2 14 2Z"
        fill="url(#gG)"
      />
    </svg>
  );
}

// ── Typing indicator ──────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="dot w-1.5 h-1.5 rounded-full animate-bounce"
          style={{ background: "#8B5CF6", animationDelay: `${i * 0.1}s` }}
        />
      ))}
    </div>
  );
}

// ── Bubble ────────────────────────────────────────────────────────────────────
function Bubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"} items-end animate-in fade-in slide-in-from-bottom-2 duration-300`}>
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-tr from-violet-600 to-fuchsia-600 shadow-lg shadow-violet-500/20">
          <GeminiIcon size={16} />
        </div>
      )}
      <div
        className={`w-fit min-w-[50px] max-w-[85%] rounded-[20px] px-4 py-3 text-[14px] leading-relaxed shadow-sm break-words ${isUser
          ? "bg-gradient-to-tr from-violet-600 to-violet-700 text-white rounded-br-none border border-violet-400/20 shadow-violet-500/10"
          : "bg-white/5 border border-white/10 text-slate-200 rounded-bl-none backdrop-blur-md"
          }`}
      >
        <div className="prose prose-invert prose-sm max-w-none 
          prose-p:leading-relaxed prose-p:my-1 
          prose-ul:my-2 prose-li:my-0.5">
          <ReactMarkdown>{msg.content}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}

// ── Main widget ───────────────────────────────────────────────────────────────
export default function ChatWidget() {
  const { isSignedIn, getToken } = useAuth();
  const [open, setOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const initSession = useCallback(async () => {
    if (!isSignedIn) return;
    try {
      const token = await getToken();
      if (!token) throw new Error("No token");

      const stored = sessionStorage.getItem("chatSessionId");
      if (stored) {
        setSessionId(stored);
        const { messages: hist } = await chatApi.getHistory(stored, token);
        setMessages(hist);
      } else {
        const { sessionId: id } = await chatApi.createSession(token);
        sessionStorage.setItem("chatSessionId", id);
        setSessionId(id);
      }
    } catch (err) {
      console.error("Chat init error:", err);
      setError("Could not connect to assistant.");
    }
  }, [isSignedIn, getToken]);

  useEffect(() => {
    if (open && !sessionId) initSession();
  }, [open, sessionId, initSession]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 300);
  }, [open]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading || !sessionId) return;

    const token = await getToken();
    if (!token) {
      setError("Please sign in again.");
      return;
    }

    setInput("");
    setError(null);
    setMessages(prev => [...prev, { role: "user", content: text }]);
    setLoading(true);

    try {
      const { reply } = await chatApi.sendMessage(sessionId, text, token);
      setMessages(prev => [...prev, { role: "model", content: reply }]);
    } catch (e: unknown) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const clearChat = async () => {
    if (!sessionId) return;
    try {
      const token = await getToken();
      if (!token) return;
      await chatApi.clearSession(sessionId, token);
      setMessages([]);
    } catch (err) {
      setError("Failed to clear chat.");
    }
  };

  if (!isSignedIn) return null;

  return (
    <>
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center bg-gradient-to-tr from-violet-600 to-fuchsia-600 shadow-lg shadow-violet-500/20 transition-all hover:scale-110 active:scale-95"
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <GeminiIcon size={26} />
        )}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-40 flex flex-col w-[350px] sm:w-[400px] h-[500px] sm:h-[600px] bg-[#0D121F] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
          <header className="flex items-center gap-3 px-4 py-3.5 bg-white/5 border-b border-white/10 backdrop-blur-md">
            <div className="relative">
              <div className="w-9 h-9 rounded-full flex items-center justify-center bg-[#1A1F2E] border border-white/10 shadow-inner">
                <GeminiIcon size={20} />
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#0D121F]" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm text-white tracking-tight">MockMate AI Assistant</p>
              <p className="text-[10px] text-emerald-500/90 font-semibold uppercase tracking-widest">Active Now</p>
            </div>
            <button
              onClick={clearChat}
              className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all duration-300 shadow-sm shadow-red-500/5 -translate-x-[10px]"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              </svg>
              <span className="text-[11px] font-bold">Clear</span>
            </button>
          </header>

          <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-6 custom-scrollbar bg-gradient-to-b from-transparent to-[#0D121F]/50">
            {messages.length === 0 && !loading && (
              <div className="flex flex-col items-center justify-center h-full gap-5 text-center px-6 animate-in fade-in zoom-in duration-500">
                <div className="relative">
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-violet-600/20 to-fuchsia-600/20 flex items-center justify-center border border-white/10 shadow-2xl">
                    <GeminiIcon size={44} />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-violet-600 rounded-full flex items-center justify-center animate-bounce shadow-lg shadow-violet-500/40">
                    <span className="text-[10px] font-bold">✨</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Welcome to MockMate!</h3>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-[200px]">
                    I'm your AI career guide. Ask me about interviews, pricing, or resume tips!
                  </p>
                </div>
              </div>
            )}

            {messages.map((msg, i) => <Bubble key={i} msg={msg} />)}

            {loading && (
              <div className="flex gap-3 items-end animate-in fade-in slide-in-from-left-2 duration-300">
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-white/5 border border-white/10">
                  <GeminiIcon size={16} />
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl rounded-bl-none overflow-hidden">
                  <TypingDots />
                </div>
              </div>
            )}

            {error && (
              <div className="mx-auto px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-[11px] text-red-400 font-medium flex items-center gap-2 animate-shake">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {error}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="p-4 bg-white/5 border-t border-white/10 backdrop-blur-xl">
            <div className="flex items-center gap-2 bg-[#1A1F2E] border border-white/10 rounded-2xl p-2.5 shadow-inner focus-within:ring-2 focus-within:ring-violet-500/30 focus-within:border-violet-500/50 transition-all duration-300 group">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Message MockMate..."
                rows={1}
                className="flex-1 bg-transparent border-none outline-none text-[15px] text-white placeholder:text-slate-500 py-1.5 pl-4 pr-[2px] resize-none max-h-16 leading-relaxed"
                onInput={e => {
                  const el = e.currentTarget;
                  el.style.height = "auto";
                  el.style.height = `${Math.min(el.scrollHeight, 64)}px`;
                }}
              />
              <button
                onClick={send}
                disabled={loading || !input.trim()}
                className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-tr from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/20 hover:scale-105 active:scale-95 disabled:opacity-30 disabled:grayscale transition-all duration-300"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
