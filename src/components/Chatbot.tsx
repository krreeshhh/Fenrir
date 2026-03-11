"use client"

import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Bot, Zap, Loader2 } from "lucide-react";
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
      setMessages(prev => [...prev, { role: 'bot', text: data.response }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'bot', text: "Error: AI Node disconnected. Please try again." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-8 right-8 h-16 w-16 rounded-[24px] flex items-center justify-center shadow-3xl hover:scale-110 transition-all z-[60] border-4",
          isOpen ? "bg-background text-foreground border-muted" : "bg-secondary-foreground text-secondary border-secondary/20"
        )}
      >
        {isOpen ? <X className="h-7 w-7" /> : <MessageSquare className="h-7 w-7" />}
        {!isOpen && <div className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-background animate-pulse"></div>}
      </button>

      {isOpen && (
        <div className="fixed bottom-28 right-8 w-[90vw] md:w-[400px] bg-background/95 backdrop-blur-2xl border-4 border-secondary/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] rounded-[40px] flex flex-col z-[60] overflow-hidden animate-in slide-in-from-bottom-8 duration-500">
           
           {/* Header */}
           <div className="p-8 bg-secondary-foreground text-secondary flex items-center justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
                 <Zap className="h-16 w-16" />
              </div>
              <div className="flex items-center gap-4 relative z-10">
                 <div className="h-12 w-12 rounded-2xl bg-secondary text-secondary-foreground flex items-center justify-center border-2 border-secondary/20 shadow-inner">
                    <Bot className="h-6 w-6" />
                 </div>
                 <div>
                    <h4 className="font-black tracking-tighter text-lg leading-none">System Intelligence</h4>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mt-2 flex items-center gap-2">
                       <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse"></span>
                       Node Active
                    </p>
                 </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="bg-secondary/10 p-2 rounded-xl hover:bg-secondary/20 transition-colors">
                 <X className="h-5 w-5" />
              </button>
           </div>

           {/* Messages Container */}
           <div 
             ref={scrollRef}
             className="flex-1 p-8 overflow-y-auto max-h-[450px] min-h-[350px] flex flex-col gap-6 custom-scrollbar"
           >
              {messages.map((m, i) => (
                <div key={i} className={cn(
                  "flex flex-col gap-2 transition-all animate-in fade-in slide-in-from-bottom-2",
                  m.role === 'user' ? "items-end" : "items-start"
                )}>
                  <div className={cn(
                    "max-w-[85%] p-5 rounded-[28px] text-sm font-medium leading-relaxed shadow-sm border",
                    m.role === 'user' 
                      ? "bg-secondary-foreground text-secondary self-end rounded-tr-none border-secondary-foreground" 
                      : "bg-muted/50 text-foreground self-start rounded-tl-none border-muted"
                  )}>
                    {m.text}
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-50 px-2">
                     {m.role === 'bot' ? 'System Intelligence' : 'Authorized User'}
                  </span>
                </div>
              ))}
              {isTyping && (
                <div className="flex items-center gap-3 p-5 bg-muted/20 rounded-[28px] rounded-tl-none w-fit border border-dashed border-muted">
                   <Loader2 className="h-4 w-4 animate-spin text-secondary-foreground" />
                   <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Analyzing Node...</span>
                </div>
              )}
           </div>

           {/* Input Area */}
           <div className="p-8 border-t-2 border-muted bg-muted/10 relative">
              <div className="flex gap-4 items-center">
                 <input 
                   type="text" 
                   placeholder="Awaiting directive..." 
                   className="flex-1 bg-background border-2 border-muted rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:border-secondary-foreground transition-all shadow-inner"
                   value={input}
                   onChange={(e) => setInput(e.target.value)}
                   onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                 />
                 <button 
                   onClick={handleSend}
                   disabled={isTyping || !input.trim()}
                   className="h-14 w-14 bg-secondary-foreground text-secondary rounded-2xl flex items-center justify-center hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all shadow-xl"
                 >
                    <Send className="h-6 w-6" />
                 </button>
              </div>
           </div>
        </div>
      )}
    </>
  );
}
