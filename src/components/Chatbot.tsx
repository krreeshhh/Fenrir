"use client"

import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Bot, Zap, Loader2, Sparkles, ShieldCheck } from "lucide-react";
import { cn } from "@/utils/cn";

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'bot', text: string }[]>([
    { role: 'bot', text: "Operational HQ AI initialized. State your directive or inquiry regarding project nodes, personnel, or resource loops." }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage = input;
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setInput("");
    setIsTyping(true);

    try {
      const resp = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage }),
      });
      const data = await resp.json();
      setMessages(prev => [...prev, { role: 'bot', text: data.response || "Neural Link Failure." }]);
    } catch (err) {
      console.error("Chatbot frontend error:", err);
      setMessages(prev => [...prev, { role: 'bot', text: "Operational Error: AI Cognitive Node disconnected. Please verify connection." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-4 right-4 sm:bottom-8 sm:right-8 h-14 w-14 sm:h-16 sm:w-16 rounded-xl flex items-center justify-center shadow-[0_20px_50px_rgba(59,130,246,0.5)] active:scale-95 transition-all z-[60] border border-white/20 group",
          isOpen ? "bg-background text-foreground" : "bg-accent text-white"
        )}
      >
        {isOpen ? <X className="h-7 w-7" /> : <MessageSquare className="h-7 w-7 group-hover:scale-110 transition-transform" />}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500 border-2 border-accent"></span>
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed bottom-20 right-4 sm:bottom-28 sm:right-8 w-[calc(100vw-32px)] sm:w-[420px] bg-background/90 backdrop-blur-3xl border border-secondary shadow-[0_40px_100px_-15px_rgba(0,0,0,0.5)] rounded-xl flex flex-col z-[60] overflow-hidden animate-in slide-in-from-bottom-8 duration-700 ring-1 ring-white/10">

          {/* Header */}
          <div className="p-6 bg-secondary text-foreground flex items-center justify-between relative overflow-hidden border-b border-secondary">
            <div className="absolute top-0 right-0 p-8 opacity-5 -rotate-12 group-hover:rotate-0 transition-transform duration-1000">
              <Zap className="h-24 w-24 text-accent" />
            </div>
            <div className="flex items-center gap-4 relative z-10">
              <div className="h-12 w-12 rounded-xl bg-accent text-white flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.4)] border border-white/20 animate-pulse">
                <Bot className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-bold tracking-tight text-base leading-none uppercase">PIVOT</h4>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-2.5 bg-background/50 rounded-xl hover:bg-red-500/10 hover:text-red-500 transition-all">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages Container */}
          <div
            ref={scrollRef}
            className="flex-1 p-6 overflow-y-auto max-h-[480px] min-h-[380px] flex flex-col gap-6 scrollbar-hide"
          >
            {messages.map((m, i) => (
              <div key={i} className={cn(
                "flex flex-col gap-2 transition-all animate-in fade-in slide-in-from-bottom-2 duration-500",
                m.role === 'user' ? "items-end" : "items-start"
              )}>
                <div className={cn(
                  "max-w-[92%] p-5 rounded-2xl text-[13px] font-medium leading-relaxed shadow-sm border transition-all whitespace-pre-wrap text-left",
                  m.role === 'user'
                    ? "bg-foreground text-background self-end rounded-tr-none border-foreground shadow-lg"
                    : "bg-secondary/40 text-foreground self-start rounded-tl-none border-secondary/50 backdrop-blur-md"
                )}>
                  {m.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex items-center gap-3 p-4 bg-accent/5 rounded-xl rounded-tl-none w-fit border border-accent/20 animate-pulse">
                <Loader2 className="h-4 w-4 animate-spin text-accent" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-accent">PIVOT Syncing...</span>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-6 border-t border-secondary bg-background/50 backdrop-blur-md">
            <div className="flex gap-3 items-center bg-secondary/30 rounded-xl p-1 border border-secondary group focus-within:border-accent/40 transition-all">
              <input
                type="text"
                placeholder="Enter encrypted inquiry..."
                className="flex-1 bg-transparent border-none px-5 py-3 text-xs font-medium tracking-wide outline-none placeholder:text-muted-foreground/50"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              />
              <button
                onClick={handleSend}
                disabled={isTyping || !input.trim()}
                className="h-10 w-10 bg-accent text-white rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 disabled:opacity-30 disabled:scale-100 transition-all shadow-lg shadow-accent/20"
              >
                <Send className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  );
}
