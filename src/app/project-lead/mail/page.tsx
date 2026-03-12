"use client"

import { useState } from "react";
import { 
  Mail as MailIcon, 
  Send, 
  Clock, 
  Database,
  Search,
  MoreVertical,
  Reply,
   CheckCircle2,
   Users,
   X,
   Loader2,
   AlertCircle,
   ChevronRight,
   MessageSquare,
   User as UserIcon,
   Plus,
   Zap,
   Briefcase,
   ShieldCheck
 } from "lucide-react";
 import { cn } from "@/utils/cn";
 import { createClient } from "@/utils/supabase";
 import { useUser } from "@/components/UserContext";
 import { useEffect } from "react";

export default function ProjectLeadMailPage() {
  const [activeTab, setActiveTab] = useState<'inbox' | 'sent'>('inbox');
  const [mails, setMails] = useState<any[]>([]);
  const [selectedMail, setSelectedMail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCompose, setShowCompose] = useState(false);
  const [recipients, setRecipients] = useState<{ managers: any[], employees: any[] }>({ managers: [], employees: [] });
  const [composeData, setComposeData] = useState({ to: '', subject: '', body: '', isNotification: false });
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const { userId } = useUser();
  const supabase = createClient();

  useEffect(() => {
    if (userId) {
      fetchMails();
      fetchRecipients();
    }
  }, [userId, activeTab]);

  const fetchRecipients = async () => {
     const { data: managers } = await supabase.from('users_metadata').select('id, full_name, email').eq('role', 'manager');
     const { data: employees } = await supabase.from('users_metadata').select('id, full_name, email').eq('role', 'employee');
     setRecipients({ 
        managers: managers || [], 
        employees: employees || [] 
     });
  };

  const fetchMails = async () => {
    setLoading(true);
    const isInbox = activeTab === 'inbox';
    
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:sender_id (full_name, email, role),
        receiver:receiver_id (full_name, email, role)
      `)
      .eq(isInbox ? 'receiver_id' : 'sender_id', userId)
      .order('sent_at', { ascending: false });

    if (!error && data) {
      // Strategic filtering: Ensure strictly personal data and hide operational/noise roles from Sent section
      const filtered = data.filter(m => {
        if (isInbox) return m.receiver_id === userId;
        
        // In Sent section: only show management-level correspondence (hide PL and Employee noise)
        const recipientRole = m.receiver?.role;
        return m.sender_id === userId && recipientRole !== 'employee' && recipientRole !== 'project_lead';
      });

      const formatted = filtered.map(m => ({
        ...m,
        senderName: m.sender?.full_name || "Unknown",
        receiverName: m.receiver?.full_name || "Unknown",
        senderRole: m.sender?.role || "user",
        time: new Date(m.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: new Date(m.sent_at).toLocaleDateString()
      }));

      setMails(formatted);
      if (formatted.length > 0) {
        setSelectedMail(formatted[0]);
      } else {
        setSelectedMail(null);
      }
    } else {
      setMails([]);
      setSelectedMail(null);
    }
    setLoading(false);
  };

  const markAsRead = async (mailId: string) => {
    if (activeTab === 'sent') return; // Don't mark sent mail as read by current user
    await supabase.from('messages').update({ is_read: true }).eq('id', mailId);
    setMails(prev => prev.map(m => m.id === mailId ? { ...m, is_read: true } : m));
  };

  const handleSelectMail = (mail: any) => {
    setSelectedMail(mail);
    if (!mail.is_read) markAsRead(mail.id);
  };

   const resetCompose = () => {
      setComposeData({ to: '', subject: '', body: '', isNotification: false });
   };

   const openCompose = (subject: string, body: string, isNotif: boolean) => {
      setComposeData({ to: '', subject, body, isNotification: isNotif });
      setShowCompose(true);
   };

   const handleSend = async () => {
      if (!userId || !composeData.to) return;
      
      const { error } = await supabase
         .from('messages')
         .insert({
            sender_id: userId,
            receiver_id: composeData.to,
            subject: composeData.subject,
            body: composeData.body,
            is_notification: composeData.isNotification,
            sent_at: new Date().toISOString()
         });

      if (!error) {
         setStatusMsg({ type: 'success', text: 'Transmission Sync Complete' });
         setShowCompose(false);
         resetCompose();
         fetchMails();
         setTimeout(() => setStatusMsg(null), 5000);
      } else {
         setStatusMsg({ type: 'error', text: 'Transmission Failure' });
      }
   };

   return (
      <div className="space-y-6 pb-20">
        
         {/* Communication Node Templates */}
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Manager Sector */}
            <section className="space-y-6">
               <h3 className="text-sm font-bold uppercase tracking-wider text-accent flex items-center gap-3">
                  <ShieldCheck className="h-4 w-4" /> Strategic Management
               </h3>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <TemplateCard 
                    icon={Database} 
                    title="Budget Request" 
                    desc="Escalate resource requirements to Management level."
                    onClick={() => openCompose('Budget Request', 'URGENT: Operational Budget Required for [Project Name]. Analysis indicates further capital injection necessary for milestone alignment.', true)}
                  />
                  <TemplateCard 
                    icon={Briefcase} 
                    title="Task Status Sitrep" 
                    desc="Provide high-level progress briefing to the Manager."
                    onClick={() => openCompose('Operational Sitrep', 'SITUATION REPORT: Node synchronization trending at [X]%. No critical blockers identified in current vector.', false)}
                  />
               </div>
            </section>

            {/* Employee Sector */}
            <section className="space-y-6">
               <h3 className="text-sm font-bold uppercase tracking-wider text-amber-500 flex items-center gap-3">
                  <Users className="h-4 w-4" /> Personnel Operations
               </h3>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <TemplateCard 
                    icon={Zap} 
                    title="Mission Directive" 
                    desc="Deploy mandatory operational nodes to active staff."
                    onClick={() => openCompose('Mission Directive', 'AUTHORIZED DIRECTIVE: You are assigned to the primary synchronization of [Project]. Baseline parameters: Immediate initialization.', true)}
                  />
                  <TemplateCard 
                    icon={MessageSquare} 
                    title="Feedback Node" 
                    desc="Dispense performance metrics and tactical advice."
                    onClick={() => openCompose('Performance Analysis', 'FEEDBACK: Excellent node synchronization achieved during the last sprint. Maintaining high-fidelity output.', false)}
                  />
               </div>
            </section>
         </div>

         <div className="flex justify-start pb-4">
            <button 
               onClick={() => { resetCompose(); setShowCompose(true); }}
               className="bg-foreground text-background px-8 py-3 rounded-lg font-bold text-sm uppercase tracking-wider hover:bg-accent hover:text-white transition-all shadow-sm active:scale-95 flex items-center gap-2"
            >
               <Plus className="h-4 w-4" /> New Message
            </button>
         </div>

         {statusMsg && (
            <div className={cn(
               "p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 border-2 shadow-2xl mx-auto max-w-2xl",
               statusMsg.type === 'success' ? "bg-green-500/10 border-green-500/20 text-green-500" : "bg-red-500/10 border-red-500/20 text-red-500"
            )}>
               {statusMsg.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
               <p className="font-bold text-xs uppercase tracking-wider">{statusMsg.text}</p>
            </div>
         )}

        <section className="bg-background border rounded-3xl overflow-hidden shadow-sm flex h-[600px] border-secondary/10">
           {/* Sidebar */}
           <div className="w-1/3 border-r flex flex-col bg-muted/10">
              <div className="p-4 border-b space-y-4">
                 <div className="flex items-center bg-background border px-3 py-2 rounded-xl focus-within:ring-2 ring-secondary-foreground transition-all">
                    <Search className="h-4 w-4 text-muted-foreground mr-2" />
                    <input type="text" placeholder="Search commands..." className="bg-transparent border-none outline-none text-sm w-full font-bold" />
                 </div>
                 <div className="flex gap-2">
                    <button 
                      onClick={() => setActiveTab('inbox')}
                      className={cn("flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors shadow-sm", activeTab === 'inbox' ? "bg-secondary-foreground text-secondary" : "hover:bg-muted text-muted-foreground")}
                    >
                      Inbox (1)
                    </button>
                    <button 
                      onClick={() => setActiveTab('sent')}
                      className={cn("flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors", activeTab === 'sent' ? "bg-secondary-foreground text-secondary" : "hover:bg-muted text-muted-foreground")}
                    >
                      Sent
                    </button>
                 </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar">
                 {loading ? (
                    <div className="flex items-center justify-center h-full">
                       <Loader2 className="h-6 w-6 animate-spin text-accent" />
                    </div>
                 ) : mails.length === 0 ? (
                    <div className="p-10 text-center">
                       <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">No Node Transmissions</p>
                    </div>
                 ) : (
                    mails.map((mail) => (
                       <button 
                         key={mail.id} 
                         onClick={() => handleSelectMail(mail)}
                         className={cn(
                           "w-full text-left p-6 hover:bg-secondary/20 transition-all border-l-4",
                           selectedMail?.id === mail.id ? "border-l-accent bg-accent/5" : "border-l-transparent",
                           !mail.is_read && activeTab === 'inbox' ? "bg-background" : "opacity-70"
                         )}
                       >
                          <div className="flex justify-between items-start mb-2">
                             <span className={cn("text-xs font-bold uppercase tracking-wider", !mail.is_read && activeTab === 'inbox' ? "text-accent" : "text-muted-foreground")}>
                                {activeTab === 'inbox' ? mail.senderName : mail.receiverName}
                             </span>
                             <span className="text-[11px] font-bold text-muted-foreground">{mail.time}</span>
                          </div>
                          <p className={cn("text-xs font-bold uppercase tracking-tight mb-2 truncate", !mail.is_read && activeTab === 'inbox' ? "text-foreground" : "text-muted-foreground")}>
                             {mail.subject}
                          </p>
                          <p className="text-[11px] text-muted-foreground line-clamp-1">{mail.body}</p>
                       </button>
                    ))
                 )}
              </div>
           </div>

           {/* Reading Pane */}
           <div className="flex-1 flex flex-col bg-background">
              {selectedMail ? (
                <>
                  <div className="p-8 border-b border-secondary/20 flex justify-between items-start bg-secondary/5">
                     <div className="flex items-center gap-6">
                        <div className="h-16 w-16 rounded-2xl bg-foreground text-background flex items-center justify-center font-bold text-2xl shadow-[0_10px_30px_rgba(0,0,0,0.1)]">
                           {(activeTab === 'inbox' ? selectedMail.senderName : selectedMail.receiverName)[0]}
                        </div>
                        <div>
                           <h2 className="text-xs font-bold text-accent uppercase tracking-wider mb-1 leading-none">Operational Insight</h2>
                           <h3 className="text-2xl font-bold uppercase tracking-tight leading-tight">{selectedMail.subject}</h3>
                           <div className="flex items-center gap-3 mt-3">
                              <p className="text-xs font-bold uppercase">{activeTab === 'inbox' ? selectedMail.senderName : selectedMail.receiverName}</p>
                              <span className="h-1 w-1 bg-accent rounded-full"></span>
                              <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">
                                 {selectedMail.senderRole} — {new Date(selectedMail.sent_at).toLocaleString()}
                              </p>
                           </div>
                        </div>
                     </div>
                     <div className="flex gap-2">
                        <button className="h-12 w-12 rounded-xl border border-secondary hover:bg-secondary flex items-center justify-center transition-all bg-background shadow-sm hover:shadow-md">
                           <Reply className="h-5 w-5" />
                        </button>
                        <button className="h-12 w-12 rounded-xl border border-secondary hover:bg-secondary flex items-center justify-center transition-all bg-background shadow-sm hover:shadow-md">
                           <MoreVertical className="h-5 w-5" />
                        </button>
                     </div>
                  </div>
                  <div className="p-10 flex-1 overflow-y-auto text-base leading-relaxed text-foreground/90 font-medium">
                     <div className="bg-secondary/5 p-10 rounded-[40px] border border-secondary/20 whitespace-pre-wrap shadow-inner mb-10">
                        {selectedMail.body}
                     </div>
                     
                     {selectedMail.is_notification && (
                        <div className="p-8 bg-accent/5 border border-accent/20 rounded-[32px] flex items-start gap-6 relative overflow-hidden group">
                           <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-150 transition-transform duration-700">
                             <AlertCircle className="h-24 w-24 text-accent" />
                           </div>
                           <AlertCircle className="h-6 w-6 text-accent mt-1 shrink-0" />
                           <div className="relative z-10">
                             <p className="text-xs font-bold text-accent uppercase tracking-wider mb-2">High-Priority Directive</p>
                             <p className="font-bold text-sm leading-relaxed opacity-80">
                                This communication originated from a critical operational node. Immediate analysis and acknowledgement of the requested parameters is required to maintain cluster integrity.
                             </p>
                           </div>
                        </div>
                     )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground font-bold">
                   Command node idle. Select a message.
                </div>
              )}
           </div>
        </section>

        {/* Compose Terminal Modal */}
        {showCompose && (
           <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
              <div className="bg-background w-full max-w-2xl border border-secondary rounded-2xl p-8 shadow-xl animate-in zoom-in-95 duration-200 relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                    <Send className="h-32 w-32 text-accent" />
                 </div>
                 
                 <button onClick={() => setShowCompose(false)} className="absolute top-6 right-6 p-2 hover:bg-secondary rounded-lg transition-all active:scale-95 z-20">
                    <X className="h-5 w-5 text-muted-foreground" />
                 </button>

                 <div className="mb-8 relative z-10">
                    <h3 className="text-2xl font-bold tracking-tight mb-1">Compose Message</h3>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Secure Communication Channel</p>
                 </div>

                 <div className="space-y-6 relative z-10">
                     <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Recipient</label>
                        <select 
                           value={composeData.to}
                           onChange={e => setComposeData({...composeData, to: e.target.value})}
                           className="w-full bg-background border border-secondary rounded-lg p-3 text-sm font-medium focus:border-accent focus:ring-1 focus:ring-accent outline-none"
                        >
                           <option value="">Select recipient...</option>
                           <optgroup label="Management">
                              {recipients.managers.map(r => (
                                 <option key={r.id} value={r.id}>{r.full_name} ({r.email})</option>
                              ))}
                           </optgroup>
                           <optgroup label="Personnel">
                              {recipients.employees.map(r => (
                                 <option key={r.id} value={r.id}>{r.full_name} ({r.email})</option>
                              ))}
                           </optgroup>
                        </select>
                     </div>

                     <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Subject</label>
                        <input 
                           value={composeData.subject}
                           onChange={e => setComposeData({...composeData, subject: e.target.value})}
                           placeholder="Message subject"
                           className="w-full bg-background border border-secondary rounded-lg p-3 text-sm font-medium focus:border-accent focus:ring-1 focus:ring-accent outline-none"
                        />
                     </div>

                     <div className="flex items-center gap-3 p-4 bg-secondary/10 border border-secondary rounded-lg cursor-pointer hover:bg-secondary/20 transition-colors" onClick={() => setComposeData({...composeData, isNotification: !composeData.isNotification})}>
                        <div className={cn(
                           "h-5 w-5 border rounded flex items-center justify-center transition-all",
                           composeData.isNotification ? "bg-accent border-accent text-white" : "border-secondary"
                        )}>
                           {composeData.isNotification && <CheckCircle2 className="h-3 w-3" />}
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider hover:text-accent transition-colors">Mark as High Priority Notification</span>
                     </div>

                     <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Message</label>
                        <textarea 
                           value={composeData.body}
                           onChange={e => setComposeData({...composeData, body: e.target.value})}
                           rows={6}
                           placeholder="Type your message here..."
                           className="w-full bg-background border border-secondary rounded-lg p-4 text-sm font-medium focus:border-accent focus:ring-1 focus:ring-accent outline-none resize-none"
                        />
                        
                        <div className="pt-4">
                           <button 
                              onClick={handleSend}
                              disabled={!composeData.to || !composeData.subject || !composeData.body}
                              className="w-full py-4 bg-foreground text-background rounded-lg font-bold text-sm uppercase tracking-wider hover:bg-accent hover:text-white transition-all shadow-sm active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
                           >
                              <Send className="h-4 w-4" /> Send Message
                           </button>
                        </div>
                     </div>
                 </div>
              </div>
           </div>
        )}
      </div>
       );
}

function TemplateCard({ icon: Icon, title, desc, onClick }: any) {
   return (
      <button 
        onClick={onClick}
        className="text-left bg-background border rounded-2xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-secondary-foreground/30 transition-all group"
      >
         <div className="h-12 w-12 rounded-xl bg-muted group-hover:bg-secondary flex items-center justify-center mb-4 transition-colors">
            <Icon className="h-6 w-6 text-muted-foreground group-hover:text-secondary-foreground transition-colors" />
         </div>
         <h4 className="font-bold text-sm mb-2">{title}</h4>
         <p className="text-[11px] text-muted-foreground leading-relaxed font-semibold uppercase tracking-tight">{desc}</p>
      </button>
   )
}

