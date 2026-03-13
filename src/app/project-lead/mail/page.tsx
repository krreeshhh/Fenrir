"use client"

import { useState, useEffect } from "react";
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
   ShieldCheck,
   TrendingUp,
   Bell,
   FileText,
   Pencil
} from "lucide-react";
import { cn } from "@/utils/cn";
import { createClient } from "@/utils/supabase";
import { useUser } from "@/components/UserContext";

type RecipientMode = 'manager' | 'employee' | 'all';

export default function ProjectLeadMailPage() {
   const [activeTab, setActiveTab] = useState<'inbox' | 'sent'>('inbox');
   const [mails, setMails] = useState<any[]>([]);
   const [selectedMail, setSelectedMail] = useState<any>(null);
   const [loading, setLoading] = useState(true);
   const [showCompose, setShowCompose] = useState(false);
   const [recipients, setRecipients] = useState<{ managers: any[], employees: any[] }>({ managers: [], employees: [] });
   const [composeData, setComposeData] = useState({ to: '', subject: '', body: '', isNotification: false });
   const [recipientMode, setRecipientMode] = useState<RecipientMode>('all');
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
         const filtered = data.filter(m => {
            if (isInbox) return m.receiver_id === userId;
            return m.sender_id === userId;
         });

         const formatted = filtered.map(m => ({
            ...m,
            senderName: m.sender?.full_name || "Unknown",
            receiverName: m.receiver?.full_name || "Unknown",
            senderRole: m.sender?.role || "user",
            receiverRole: m.receiver?.role || "user",
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
      if (activeTab === 'sent') return;
      await supabase.from('messages').update({ is_read: true }).eq('id', mailId);
      setMails(prev => prev.map(m => m.id === mailId ? { ...m, is_read: true } : m));
   };

   const handleSelectMail = (mail: any) => {
      setSelectedMail(mail);
      if (!mail.is_read) markAsRead(mail.id);
   };

   const resetCompose = () => {
      setComposeData({ to: '', subject: '', body: '', isNotification: false });
      setRecipientMode('all');
   };

   const openCompose = (subject: string, body: string, isNotif: boolean, mode: RecipientMode) => {
      setComposeData({ to: '', subject, body, isNotification: isNotif });
      setRecipientMode(mode);
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
         setStatusMsg({ type: 'success', text: 'Message Sent Successfully' });
         setShowCompose(false);
         resetCompose();
         fetchMails();
         setTimeout(() => setStatusMsg(null), 5000);
      } else {
         setStatusMsg({ type: 'error', text: 'Failed to Send Message' });
      }
   };

   /* Compute available recipient list for compose modal */
   const availableRecipients = recipientMode === 'manager'
      ? recipients.managers
      : recipientMode === 'employee'
         ? recipients.employees
         : [...recipients.managers, ...recipients.employees];

   return (
      <div className="space-y-8 pb-20">

         {/* ─── Templates Section ─── */}
         <div className="space-y-6">
            {/* Manager Templates */}
            <div>
               <div className="flex items-center gap-3 mb-4">
                  <div className="h-8 w-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
                     <ShieldCheck className="h-4 w-4 text-accent" />
                  </div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-accent">Manager Templates</h3>
                  <div className="flex-1 h-px bg-accent/10" />
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <TemplateCard
                     icon={Database}
                     title="Budget Request"
                     desc="Escalate resource requirements to Management."
                     badge="Manager Only"
                     badgeColor="text-accent border-accent/30 bg-accent/5"
                     onClick={() => openCompose(
                        'Budget Request',
                        'Dear Manager,\n\nI am writing to formally request budget approval for [Project Name].\n\nCurrent allocation is insufficient to meet the upcoming milestone. An estimated budget of [Amount] is required to ensure project continuity and team performance.\n\nKindly review and approve at your earliest convenience.\n\nBest regards,\n[Your Name]',
                        true,
                        'manager'
                     )}
                  />
                  <TemplateCard
                     icon={TrendingUp}
                     title="Progress Sitrep"
                     desc="Provide a high-level status briefing to the Manager."
                     badge="Manager Only"
                     badgeColor="text-accent border-accent/30 bg-accent/5"
                     onClick={() => openCompose(
                        'Project Progress Report',
                        'Dear Manager,\n\nHere is the latest status update for [Project Name]:\n\n• Overall Completion: [X]%\n• Tasks Completed This Week: [N]\n• Pending Validations: [N]\n• Next Milestone Target: [Date]\n\nNo critical blockers at this time. The team remains on track.\n\nBest regards,\n[Your Name]',
                        false,
                        'manager'
                     )}
                  />
               </div>
            </div>

            {/* Employee Templates */}
            <div>
               <div className="flex items-center gap-3 mb-4">
                  <div className="h-8 w-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                     <Users className="h-4 w-4 text-amber-500" />
                  </div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-amber-500">Employee Templates</h3>
                  <div className="flex-1 h-px bg-amber-500/10" />
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <TemplateCard
                     icon={Bell}
                     title="Task Assignment"
                     desc="Formally assign a new task or checklist to an employee."
                     badge="Employee Only"
                     badgeColor="text-amber-500 border-amber-500/30 bg-amber-500/5"
                     onClick={() => openCompose(
                        'New Task Assignment',
                        'Hi [Employee Name],\n\nYou have been assigned a new task under [Project Name].\n\nTask: [Task Title]\nDeadline: [Date]\nPriority: [High / Medium / Low]\n\nPlease review the checklist and begin work as soon as possible. Reach out if you need any clarification.\n\nBest regards,\n[Your Name]',
                        true,
                        'employee'
                     )}
                  />
                  <TemplateCard
                     icon={MessageSquare}
                     title="Performance Feedback"
                     desc="Send performance metrics and feedback to an employee."
                     badge="Employee Only"
                     badgeColor="text-amber-500 border-amber-500/30 bg-amber-500/5"
                     onClick={() => openCompose(
                        'Performance Feedback',
                        'Hi [Employee Name],\n\nI wanted to share some feedback based on your recent work on [Project Name].\n\n✅ Strengths: [What they did well]\n📈 Areas for Growth: [What can be improved]\n🎯 Focus for Next Sprint: [Goals]\n\nOverall, you are making great progress. Keep up the excellent work!\n\nBest regards,\n[Your Name]',
                        false,
                        'employee'
                     )}
                  />
               </div>
            </div>

            {/* Custom */}
            <div>
               <div className="flex items-center gap-3 mb-4">
                  <div className="h-8 w-8 rounded-lg bg-secondary/50 border border-secondary flex items-center justify-center">
                     <Pencil className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Custom Message</h3>
                  <div className="flex-1 h-px bg-secondary/50" />
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <TemplateCard
                     icon={FileText}
                     title="Custom Message"
                     desc="Write a custom message to any manager or employee."
                     badge="All Recipients"
                     badgeColor="text-muted-foreground border-secondary bg-secondary/20"
                     onClick={() => openCompose('', '', false, 'all')}
                  />
               </div>
            </div>
         </div>

         {/* ─── New Message Button ─── */}
         <div className="flex justify-start">
            <button
               onClick={() => { resetCompose(); setShowCompose(true); }}
               className="bg-foreground text-background px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-accent hover:text-white transition-all shadow-sm active:scale-95 flex items-center gap-2"
            >
               <Plus className="h-4 w-4" /> Compose New Message
            </button>
         </div>

         {/* ─── Status Toast ─── */}
         {statusMsg && (
            <div className={cn(
               "p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 border shadow-xl",
               statusMsg.type === 'success' ? "bg-green-500/10 border-green-500/20 text-green-500" : "bg-red-500/10 border-red-500/20 text-red-500"
            )}>
               {statusMsg.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
               <p className="font-bold text-xs uppercase tracking-wider">{statusMsg.text}</p>
            </div>
         )}

         {/* ─── Mail Client ─── */}
         <section className="bg-background border border-secondary rounded-3xl overflow-hidden shadow-sm flex h-[600px]">
            {/* Sidebar */}
            <div className="w-1/3 border-r border-secondary flex flex-col bg-secondary/5">
               <div className="p-4 border-b border-secondary space-y-3">
                  <div className="flex items-center bg-background border border-secondary px-3 py-2 rounded-xl focus-within:border-accent transition-all">
                     <Search className="h-4 w-4 text-muted-foreground mr-2" />
                     <input type="text" placeholder="Search messages..." className="bg-transparent border-none outline-none text-sm w-full font-medium" />
                  </div>
                  <div className="flex gap-2">
                     <button
                        onClick={() => setActiveTab('inbox')}
                        className={cn("flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors", activeTab === 'inbox' ? "bg-foreground text-background" : "hover:bg-secondary/40 text-muted-foreground")}
                     >
                        Inbox
                     </button>
                     <button
                        onClick={() => setActiveTab('sent')}
                        className={cn("flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors", activeTab === 'sent' ? "bg-foreground text-background" : "hover:bg-secondary/40 text-muted-foreground")}
                     >
                        Sent
                     </button>
                  </div>
               </div>

               <div className="flex-1 overflow-y-auto">
                  {loading ? (
                     <div className="flex items-center justify-center h-full">
                        <Loader2 className="h-6 w-6 animate-spin text-accent" />
                     </div>
                  ) : mails.length === 0 ? (
                     <div className="p-10 text-center">
                        <MailIcon className="h-8 w-8 text-muted-foreground/20 mx-auto mb-3" />
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">No messages</p>
                     </div>
                  ) : (
                     mails.map((mail) => (
                        <button
                           key={mail.id}
                           onClick={() => handleSelectMail(mail)}
                           className={cn(
                              "w-full text-left p-5 hover:bg-secondary/20 transition-all border-l-2",
                              selectedMail?.id === mail.id ? "border-l-accent bg-accent/5" : "border-l-transparent",
                              !mail.is_read && activeTab === 'inbox' ? "bg-background" : "opacity-70"
                           )}
                        >
                           <div className="flex justify-between items-start mb-1.5">
                              <span className={cn("text-xs font-bold uppercase tracking-wider truncate", !mail.is_read && activeTab === 'inbox' ? "text-accent" : "text-muted-foreground")}>
                                 {activeTab === 'inbox' ? mail.senderName : mail.receiverName}
                              </span>
                              <span className="text-[10px] font-bold text-muted-foreground ml-2 shrink-0">{mail.time}</span>
                           </div>
                           <p className={cn("text-xs font-bold uppercase tracking-tight mb-1 truncate", !mail.is_read && activeTab === 'inbox' ? "text-foreground" : "text-muted-foreground")}>
                              {mail.subject}
                           </p>
                           <p className="text-[11px] text-muted-foreground line-clamp-1 font-medium">{mail.body}</p>
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
                        <div className="flex items-center gap-5">
                           <div className="h-14 w-14 rounded-2xl bg-foreground text-background flex items-center justify-center font-bold text-xl shadow-lg">
                              {(activeTab === 'inbox' ? selectedMail.senderName : selectedMail.receiverName)?.[0]}
                           </div>
                           <div>
                              <div className="flex items-center gap-2 mb-1">
                                 <span className={cn(
                                    "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border",
                                    activeTab === 'inbox'
                                       ? selectedMail.senderRole === 'manager' ? "text-accent border-accent/20 bg-accent/5" : "text-amber-500 border-amber-500/20 bg-amber-500/5"
                                       : selectedMail.receiverRole === 'manager' ? "text-accent border-accent/20 bg-accent/5" : "text-amber-500 border-amber-500/20 bg-amber-500/5"
                                 )}>
                                    {activeTab === 'inbox' ? selectedMail.senderRole : selectedMail.receiverRole}
                                 </span>
                              </div>
                              <h3 className="text-xl font-bold uppercase tracking-tight leading-tight">{selectedMail.subject}</h3>
                              <div className="flex items-center gap-2 mt-1.5">
                                 <p className="text-xs font-bold uppercase">{activeTab === 'inbox' ? selectedMail.senderName : selectedMail.receiverName}</p>
                                 <span className="h-1 w-1 bg-accent rounded-full"></span>
                                 <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">
                                    {new Date(selectedMail.sent_at).toLocaleString()}
                                 </p>
                              </div>
                           </div>
                        </div>
                        <div className="flex gap-2">
                           <button className="h-10 w-10 rounded-xl border border-secondary hover:bg-secondary flex items-center justify-center transition-all bg-background">
                              <Reply className="h-4 w-4" />
                           </button>
                           <button className="h-10 w-10 rounded-xl border border-secondary hover:bg-secondary flex items-center justify-center transition-all bg-background">
                              <MoreVertical className="h-4 w-4" />
                           </button>
                        </div>
                     </div>
                     <div className="p-8 flex-1 overflow-y-auto">
                        <div className="bg-secondary/5 p-8 rounded-2xl border border-secondary/20 whitespace-pre-wrap text-sm font-medium leading-relaxed text-foreground/90 mb-6">
                           {selectedMail.body}
                        </div>

                        {selectedMail.is_notification && (
                           <div className="p-5 bg-accent/5 border border-accent/20 rounded-xl flex items-start gap-4">
                              <AlertCircle className="h-5 w-5 text-accent mt-0.5 shrink-0" />
                              <div>
                                 <p className="text-xs font-bold text-accent uppercase tracking-wider mb-1">High-Priority Notification</p>
                                 <p className="text-xs font-medium text-foreground/70 leading-relaxed">
                                    This message was marked as high priority. Please review and respond promptly.
                                 </p>
                              </div>
                           </div>
                        )}
                     </div>
                  </>
               ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3">
                     <MailIcon className="h-10 w-10 opacity-20" />
                     <p className="font-bold text-sm uppercase tracking-wider opacity-40">Select a message to read</p>
                  </div>
               )}
            </div>
         </section>

         {/* ─── Compose Modal ─── */}
         {showCompose && (
            <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
               <div className="bg-background w-full max-w-2xl border border-secondary rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">

                  {/* Modal Header */}
                  <div className="flex items-center justify-between p-6 border-b border-secondary">
                     <div className="flex items-center gap-3">
                        <div className="h-9 w-9 bg-accent/10 border border-accent/20 rounded-xl flex items-center justify-center">
                           <Send className="h-4 w-4 text-accent" />
                        </div>
                        <div>
                           <h3 className="text-base font-bold tracking-tight">Compose Message</h3>
                           <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                              {recipientMode === 'manager' ? 'Sending to Manager only' : recipientMode === 'employee' ? 'Sending to Employee only' : 'All recipients available'}
                           </p>
                        </div>
                     </div>
                     <button onClick={() => setShowCompose(false)} className="p-2 hover:bg-secondary rounded-lg transition-all">
                        <X className="h-5 w-5 text-muted-foreground" />
                     </button>
                  </div>

                  <div className="p-6 space-y-5">
                     {/* Recipient Filter Pill */}
                     <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Recipient Type:</span>
                        {(['manager', 'employee', 'all'] as RecipientMode[]).map(mode => (
                           <button
                              key={mode}
                              onClick={() => { setRecipientMode(mode); setComposeData(p => ({ ...p, to: '' })); }}
                              className={cn(
                                 "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border transition-all",
                                 recipientMode === mode
                                    ? mode === 'manager' ? "bg-accent text-white border-accent" : mode === 'employee' ? "bg-amber-500 text-white border-amber-500" : "bg-foreground text-background border-foreground"
                                    : "border-secondary text-muted-foreground hover:border-foreground/30"
                              )}
                           >
                              {mode === 'all' ? 'All' : mode}
                           </button>
                        ))}
                     </div>

                     {/* Recipient Select */}
                     <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">To</label>
                        <select
                           value={composeData.to}
                           onChange={e => setComposeData({ ...composeData, to: e.target.value })}
                           className="w-full bg-background border border-secondary rounded-xl p-3 text-sm font-medium focus:border-accent focus:ring-1 focus:ring-accent outline-none"
                        >
                           <option value="">Select recipient...</option>
                           {recipientMode === 'all' ? (
                              <>
                                 <optgroup label="Management">
                                    {recipients.managers.map(r => <option key={r.id} value={r.id}>{r.full_name} ({r.email})</option>)}
                                 </optgroup>
                                 <optgroup label="Employees">
                                    {recipients.employees.map(r => <option key={r.id} value={r.id}>{r.full_name} ({r.email})</option>)}
                                 </optgroup>
                              </>
                           ) : (
                              availableRecipients.map(r => <option key={r.id} value={r.id}>{r.full_name} ({r.email})</option>)
                           )}
                        </select>
                     </div>

                     {/* Subject */}
                     <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Subject</label>
                        <input
                           value={composeData.subject}
                           onChange={e => setComposeData({ ...composeData, subject: e.target.value })}
                           placeholder="e.g. Budget Request for Q2"
                           className="w-full bg-background border border-secondary rounded-xl p-3 text-sm font-medium focus:border-accent focus:ring-1 focus:ring-accent outline-none"
                        />
                     </div>

                     {/* Priority Toggle */}
                     <div
                        className="flex items-center gap-3 p-3.5 bg-secondary/10 border border-secondary rounded-xl cursor-pointer hover:bg-secondary/20 transition-colors"
                        onClick={() => setComposeData({ ...composeData, isNotification: !composeData.isNotification })}
                     >
                        <div className={cn(
                           "h-5 w-5 border rounded flex items-center justify-center transition-all shrink-0",
                           composeData.isNotification ? "bg-accent border-accent text-white" : "border-secondary"
                        )}>
                           {composeData.isNotification && <CheckCircle2 className="h-3 w-3" />}
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider">Mark as High Priority</span>
                     </div>

                     {/* Body */}
                     <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Message</label>
                        <textarea
                           value={composeData.body}
                           onChange={e => setComposeData({ ...composeData, body: e.target.value })}
                           rows={7}
                           placeholder="Write your message here..."
                           className="w-full bg-background border border-secondary rounded-xl p-4 text-sm font-medium focus:border-accent focus:ring-1 focus:ring-accent outline-none resize-none"
                        />
                     </div>

                     {/* Send Button */}
                     <button
                        onClick={handleSend}
                        disabled={!composeData.to || !composeData.subject || !composeData.body}
                        className="w-full py-4 bg-foreground text-background rounded-xl font-bold text-sm uppercase tracking-wider hover:bg-accent hover:text-white transition-all shadow-sm active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                     >
                        <Send className="h-4 w-4" /> Send Message
                     </button>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
}

function TemplateCard({ icon: Icon, title, desc, badge, badgeColor, onClick }: any) {
   return (
      <button
         onClick={onClick}
         className="text-left bg-background border border-secondary rounded-2xl p-5 shadow-sm hover:shadow-lg hover:-translate-y-1 hover:border-foreground/20 transition-all group"
      >
         <div className="flex items-start justify-between mb-3">
            <div className="h-10 w-10 rounded-xl bg-secondary/50 group-hover:bg-secondary flex items-center justify-center transition-colors">
               <Icon className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
            </div>
            <span className={cn("text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border", badgeColor)}>
               {badge}
            </span>
         </div>
         <h4 className="font-bold text-sm mb-1 group-hover:text-accent transition-colors">{title}</h4>
         <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">{desc}</p>
      </button>
   )
}
