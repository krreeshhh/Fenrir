"use client"

import { useState, useEffect } from "react";
import {
   Mail as MailIcon,
   Send,
   Search,
   MoreVertical,
   Reply,
   CheckCircle2,
   Users,
   X,
   Loader2,
   AlertCircle,
   Plus,
   Briefcase,
   ShieldCheck,
   TrendingUp,
   ClipboardList,
   Bell,
   FileText,
   Pencil,
   Crown
} from "lucide-react";
import { cn } from "@/utils/cn";
import { createClient } from "@/utils/supabase";
import { useUser } from "@/components/UserContext";

type RecipientMode = 'unit_head' | 'project_lead' | 'all';

export default function ManagerMailPage() {
   const [activeTab, setActiveTab] = useState<'inbox' | 'sent'>('inbox');
   const [mails, setMails] = useState<any[]>([]);
   const [selectedMail, setSelectedMail] = useState<any>(null);
   const [loading, setLoading] = useState(true);
   const [showCompose, setShowCompose] = useState(false);
   const [recipients, setRecipients] = useState<{ unitHeads: any[]; projectLeads: any[] }>({
      unitHeads: [],
      projectLeads: []
   });
   const [composeData, setComposeData] = useState({
      to: '',
      subject: '',
      body: '',
      isNotification: false
   });
   const [recipientMode, setRecipientMode] = useState<RecipientMode>('all');
   const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

   const { userId } = useUser();
   const supabase = createClient();

   useEffect(() => {
      if (userId) {
         fetchMails();
         fetchRecipients();
      }
   }, [userId, activeTab]);

   const fetchRecipients = async () => {
      const { data: unitHeads } = await supabase
         .from('users_metadata')
         .select('id, full_name, email')
         .eq('role', 'unit_head');

      const { data: projectLeads } = await supabase
         .from('users_metadata')
         .select('id, full_name, email')
         .eq('role', 'project_lead');

      setRecipients({
         unitHeads: unitHeads || [],
         projectLeads: projectLeads || []
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
            senderName: m.sender?.full_name || 'Unknown',
            receiverName: m.receiver?.full_name || 'Unknown',
            senderRole: m.sender?.role || 'user',
            receiverRole: m.receiver?.role || 'user',
            time: new Date(m.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            date: new Date(m.sent_at).toLocaleDateString()
         }));

         setMails(formatted);
         setSelectedMail(formatted.length > 0 ? formatted[0] : null);
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

      const { error } = await supabase.from('messages').insert({
         sender_id: userId,
         receiver_id: composeData.to,
         subject: composeData.subject,
         body: composeData.body,
         is_notification: composeData.isNotification,
         sent_at: new Date().toISOString()
      });

      if (!error) {
         setStatusMsg({ type: 'success', text: 'Message sent successfully' });
         setShowCompose(false);
         resetCompose();
         fetchMails();
         setTimeout(() => setStatusMsg(null), 5000);
      } else {
         setStatusMsg({ type: 'error', text: 'Failed to send message' });
      }
   };

   const unreadCount = mails.filter(m => !m.is_read && activeTab === 'inbox').length;

   /* Compute available recipients for compose modal */
   const availableRecipients = recipientMode === 'unit_head'
      ? recipients.unitHeads
      : recipientMode === 'project_lead'
         ? recipients.projectLeads
         : [...recipients.unitHeads, ...recipients.projectLeads];

   return (
      <div className="space-y-8 pb-20">

         {/* ─── Templates Section ─── */}
         <div className="space-y-6">

            {/* Unit Head Templates */}
            <div>
               <div className="flex items-center gap-3 mb-4">
                  <div className="h-8 w-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
                     <Crown className="h-4 w-4 text-accent" />
                  </div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-accent">Unit Head Templates</h3>
                  <div className="flex-1 h-px bg-accent/10" />
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <TemplateCard
                     icon={TrendingUp}
                     title="Performance Report"
                     desc="Escalate team performance summary to the Unit Head."
                     badge="Unit Head Only"
                     badgeColor="text-accent border-accent/30 bg-accent/5"
                     onClick={() => openCompose(
                        'Team Performance Report',
                        'Dear Unit Head,\n\nHere is our performance summary for this period:\n\n• Team Completion Rate: [X]%\n• Projects Active: [N]\n• Tasks Delivered on Time: [N]\n• Key Achievements: [Describe]\n• Blockers Identified: [None / List]\n\nKindly review and advise on further direction.\n\nBest regards,\n[Your Name]',
                        true,
                        'unit_head'
                     )}
                  />
                  <TemplateCard
                     icon={AlertCircle}
                     title="Risk Escalation"
                     desc="Flag critical project risks requiring senior attention."
                     badge="Unit Head Only"
                     badgeColor="text-accent border-accent/30 bg-accent/5"
                     onClick={() => openCompose(
                        'Risk Escalation — Immediate Review Required',
                        'Dear Unit Head,\n\nI am formally escalating a critical risk that requires your immediate attention.\n\nProject: [Project Name]\nRisk Level: High / Critical\nRisk Summary: [Brief description of what the risk is]\nPotential Impact: [What could happen if unaddressed]\nProposed Resolution: [What you recommend]\n\nYour guidance on this matter is urgently needed.\n\nBest regards,\n[Your Name]',
                        true,
                        'unit_head'
                     )}
                  />
               </div>
            </div>

            {/* Project Lead Templates */}
            <div>
               <div className="flex items-center gap-3 mb-4">
                  <div className="h-8 w-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                     <Users className="h-4 w-4 text-amber-500" />
                  </div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-amber-500">Project Lead Templates</h3>
                  <div className="flex-1 h-px bg-amber-500/10" />
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <TemplateCard
                     icon={Bell}
                     title="Task Directive"
                     desc="Issue instructions and objectives to a Project Lead."
                     badge="Project Lead Only"
                     badgeColor="text-amber-500 border-amber-500/30 bg-amber-500/5"
                     onClick={() => openCompose(
                        'Task Directive',
                        'Hi [Project Lead Name],\n\nYou are directed to oversee the following deliverable on behalf of this department:\n\nObjective: [Describe the goal]\nProject: [Project Name]\nDeadline: [Date]\nExpected Output: [Deliverable details]\nPriority: High / Medium / Low\n\nPlease confirm receipt and begin planning accordingly.\n\nBest regards,\n[Your Name]',
                        true,
                        'project_lead'
                     )}
                  />
                  <TemplateCard
                     icon={ClipboardList}
                     title="Status Update Request"
                     desc="Request a progress update from your Project Lead."
                     badge="Project Lead Only"
                     badgeColor="text-amber-500 border-amber-500/30 bg-amber-500/5"
                     onClick={() => openCompose(
                        'Project Status Update Request',
                        'Hi [Project Lead Name],\n\nPlease provide an updated status report for your current project, covering the following:\n\n1. Overall completion percentage\n2. Any active blockers or delays\n3. Next key milestones and target dates\n4. Team morale or resourcing concerns\n\nA response is expected within 24 hours.\n\nBest regards,\n[Your Name]',
                        false,
                        'project_lead'
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
                     desc="Write a custom message to any Unit Head or Project Lead."
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
               statusMsg.type === 'success'
                  ? "bg-green-500/10 border-green-500/20 text-green-500"
                  : "bg-red-500/10 border-red-500/20 text-red-500"
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
                     <Search className="h-4 w-4 text-muted-foreground mr-2 shrink-0" />
                     <input
                        type="text"
                        placeholder="Search messages..."
                        className="bg-transparent border-none outline-none text-sm w-full font-medium placeholder:text-muted-foreground/50"
                     />
                  </div>
                  <div className="flex gap-2">
                     <button
                        onClick={() => setActiveTab('inbox')}
                        className={cn(
                           "flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors",
                           activeTab === 'inbox' ? "bg-foreground text-background" : "hover:bg-secondary/40 text-muted-foreground"
                        )}
                     >
                        Inbox {unreadCount > 0 && <span className="ml-1 bg-accent text-white text-[9px] px-1.5 py-0.5 rounded-full">{unreadCount}</span>}
                     </button>
                     <button
                        onClick={() => setActiveTab('sent')}
                        className={cn(
                           "flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors",
                           activeTab === 'sent' ? "bg-foreground text-background" : "hover:bg-secondary/40 text-muted-foreground"
                        )}
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
                     mails.map(mail => (
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
                              <span className={cn(
                                 "text-xs font-bold uppercase tracking-wide truncate",
                                 !mail.is_read && activeTab === 'inbox' ? "text-accent" : "text-muted-foreground"
                              )}>
                                 {activeTab === 'inbox' ? mail.senderName : mail.receiverName}
                              </span>
                              <span className="text-[10px] font-medium text-muted-foreground ml-2 shrink-0">{mail.time}</span>
                           </div>
                           <p className={cn(
                              "text-xs font-bold uppercase tracking-tight mb-1 truncate",
                              !mail.is_read && activeTab === 'inbox' ? "text-foreground" : "text-muted-foreground"
                           )}>
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
                           <div className="h-14 w-14 rounded-2xl bg-foreground text-background flex items-center justify-center font-bold text-xl shadow-lg shrink-0">
                              {(activeTab === 'inbox' ? selectedMail.senderName : selectedMail.receiverName)?.[0]}
                           </div>
                           <div>
                              <div className="flex items-center gap-2 mb-1">
                                 <span className={cn(
                                    "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border",
                                    (activeTab === 'inbox' ? selectedMail.senderRole : selectedMail.receiverRole) === 'unit_head'
                                       ? "text-accent border-accent/20 bg-accent/5"
                                       : "text-amber-500 border-amber-500/20 bg-amber-500/5"
                                 )}>
                                    {(activeTab === 'inbox' ? selectedMail.senderRole : selectedMail.receiverRole)?.replace('_', ' ')}
                                 </span>
                              </div>
                              <h3 className="text-xl font-bold tracking-tight truncate max-w-sm">{selectedMail.subject}</h3>
                              <div className="flex items-center gap-2 mt-1.5">
                                 <p className="text-xs font-bold uppercase text-foreground/80">
                                    {activeTab === 'inbox' ? selectedMail.senderName : selectedMail.receiverName}
                                 </p>
                                 <span className="h-1 w-1 bg-accent rounded-full" />
                                 <p className="text-xs text-muted-foreground font-medium">
                                    {new Date(selectedMail.sent_at).toLocaleString()}
                                 </p>
                              </div>
                           </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                           <button className="h-10 w-10 rounded-xl border border-secondary hover:bg-secondary flex items-center justify-center transition-all bg-background">
                              <Reply className="h-4 w-4" />
                           </button>
                           <button className="h-10 w-10 rounded-xl border border-secondary hover:bg-secondary flex items-center justify-center transition-all bg-background">
                              <MoreVertical className="h-4 w-4" />
                           </button>
                        </div>
                     </div>

                     <div className="p-8 flex-1 overflow-y-auto">
                        <div className="bg-secondary/5 p-8 rounded-2xl border border-secondary/20 whitespace-pre-wrap text-sm leading-relaxed font-medium text-foreground/90 mb-6 shadow-inner">
                           {selectedMail.body}
                        </div>

                        {selectedMail.is_notification && (
                           <div className="p-5 bg-accent/5 border border-accent/20 rounded-xl flex items-start gap-4">
                              <AlertCircle className="h-5 w-5 text-accent mt-0.5 shrink-0" />
                              <div>
                                 <p className="text-xs font-bold text-accent uppercase tracking-wider mb-1">High-Priority Notice</p>
                                 <p className="font-medium text-xs leading-relaxed text-muted-foreground">
                                    This message has been flagged as high priority. Prompt acknowledgement and action is required.
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
                              {recipientMode === 'unit_head' ? 'Sending to Unit Head only' : recipientMode === 'project_lead' ? 'Sending to Project Lead only' : 'All recipients available'}
                           </p>
                        </div>
                     </div>
                     <button onClick={() => setShowCompose(false)} className="p-2 hover:bg-secondary rounded-lg transition-all">
                        <X className="h-5 w-5 text-muted-foreground" />
                     </button>
                  </div>

                  <div className="p-6 space-y-5">
                     {/* Recipient Filter Pills */}
                     <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Recipient Type:</span>
                        {([
                           { mode: 'unit_head', label: 'Unit Head' },
                           { mode: 'project_lead', label: 'Project Lead' },
                           { mode: 'all', label: 'All' }
                        ] as { mode: RecipientMode; label: string }[]).map(({ mode, label }) => (
                           <button
                              key={mode}
                              onClick={() => { setRecipientMode(mode); setComposeData(p => ({ ...p, to: '' })); }}
                              className={cn(
                                 "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border transition-all",
                                 recipientMode === mode
                                    ? mode === 'unit_head' ? "bg-accent text-white border-accent"
                                       : mode === 'project_lead' ? "bg-amber-500 text-white border-amber-500"
                                          : "bg-foreground text-background border-foreground"
                                    : "border-secondary text-muted-foreground hover:border-foreground/30"
                              )}
                           >
                              {label}
                           </button>
                        ))}
                     </div>

                     {/* Recipient Dropdown */}
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
                                 <optgroup label="Unit Head">
                                    {recipients.unitHeads.map(r => <option key={r.id} value={r.id}>{r.full_name} ({r.email})</option>)}
                                 </optgroup>
                                 <optgroup label="Project Leads">
                                    {recipients.projectLeads.map(r => <option key={r.id} value={r.id}>{r.full_name} ({r.email})</option>)}
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
                           placeholder="e.g. Risk Escalation for Q2"
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
                        className="w-full py-4 bg-foreground text-background rounded-xl font-bold text-sm uppercase tracking-wider hover:bg-accent hover:text-white transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
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
   );
}
