"use client"

import { useState, useEffect } from "react";
import {
   Mail as MailIcon,
   Send,
   Search,
   MoreVertical,
   Reply,
   CheckCircle2,
   X,
   Loader2,
   AlertCircle,
   Plus,
   Shield,
   Crown,
   Briefcase,
   TrendingUp,
   FileText,
   Pencil,
   Users,
   ShieldCheck,
   User,
   Building
} from "lucide-react";
import { cn } from "@/utils/cn";
import { createClient } from "@/utils/supabase";
import { useUser } from "@/components/UserContext";

type RoleFilter = 'unit_head' | 'manager' | 'project_lead' | 'employee' | 'all';

const ROLE_LABELS: Record<RoleFilter, string> = {
   unit_head: 'Unit Heads',
   manager: 'Managers',
   project_lead: 'Project Leads',
   employee: 'Employees',
   all: 'All Users'
};

const ROLE_COLORS: Record<RoleFilter, string> = {
   unit_head: 'text-violet-400 border-violet-400/30 bg-violet-400/5',
   manager: 'text-blue-400 border-blue-400/30 bg-blue-400/5',
   project_lead: 'text-amber-400 border-amber-400/30 bg-amber-400/5',
   employee: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/5',
   all: 'text-muted-foreground border-secondary bg-secondary/20'
};

export default function AdminMailPage() {
   const [activeTab, setActiveTab] = useState<'inbox' | 'sent'>('inbox');
   const [mails, setMails] = useState<any[]>([]);
   const [selectedMail, setSelectedMail] = useState<any>(null);
   const [loading, setLoading] = useState(true);
   const [showCompose, setShowCompose] = useState(false);
   const [allUsers, setAllUsers] = useState<any[]>([]);
   const [composeData, setComposeData] = useState({ to: '', subject: '', body: '', isNotification: false });
   const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
   const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

   const { userId } = useUser();
   const supabase = createClient();

   useEffect(() => {
      if (userId) { fetchMails(); fetchAllUsers(); }
   }, [userId, activeTab]);

   const fetchAllUsers = async () => {
      const { data } = await supabase.from('users_metadata').select('id, full_name, email, role').order('role');
      setAllUsers(data || []);
   };

   const fetchMails = async () => {
      setLoading(true);
      const { data, error } = await supabase
         .from('messages')
         .select(`*, sender:sender_id(full_name, email, role), receiver:receiver_id(full_name, email, role)`)
         .eq(activeTab === 'inbox' ? 'receiver_id' : 'sender_id', userId)
         .order('sent_at', { ascending: false });

      if (!error && data) {
         const formatted = data.map(m => ({
            ...m,
            senderName: m.sender?.full_name || 'Unknown',
            receiverName: m.receiver?.full_name || 'Unknown',
            senderRole: m.sender?.role || 'user',
            receiverRole: m.receiver?.role || 'user',
            time: new Date(m.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
         }));
         setMails(formatted);
         setSelectedMail(formatted[0] ?? null);
      } else {
         setMails([]); setSelectedMail(null);
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

   const openCompose = (subject: string, body: string, isNotif: boolean, filter: RoleFilter) => {
      setComposeData({ to: '', subject, body, isNotification: isNotif });
      setRoleFilter(filter);
      setShowCompose(true);
   };

   const handleSend = async () => {
      if (!userId || !composeData.to) return;
      const { error } = await supabase.from('messages').insert({
         sender_id: userId, receiver_id: composeData.to, subject: composeData.subject,
         body: composeData.body, is_notification: composeData.isNotification, sent_at: new Date().toISOString()
      });
      if (!error) {
         setStatusMsg({ type: 'success', text: 'Message Sent Successfully' });
         setShowCompose(false);
         setComposeData({ to: '', subject: '', body: '', isNotification: false });
         fetchMails();
         setTimeout(() => setStatusMsg(null), 5000);
      } else {
         setStatusMsg({ type: 'error', text: 'Failed to Send Message' });
      }
   };

   // Filter recipient list by selected role
   const filteredRecipients = roleFilter === 'all'
      ? allUsers
      : allUsers.filter(u => u.role === roleFilter);

   const unreadCount = mails.filter(m => !m.is_read && activeTab === 'inbox').length;

   const TEMPLATES = [
      {
         group: 'Unit Head',
         filter: 'unit_head' as RoleFilter,
         icon: Crown,
         items: [
            {
               icon: Shield,
               title: 'System Policy Notice',
               desc: 'Broadcast a system-wide policy update to unit heads.',
               subject: 'System Policy Notice',
               body: 'Dear Unit Head,\n\nThis is an official policy notice from the Administrative Office.\n\nPolicy Reference: [Policy ID]\nEffective Date: [Date]\nScope: [Affected departments]\n\nSummary of Changes:\n1. [Change 1]\n2. [Change 2]\n\nAll units are required to acknowledge receipt and comply immediately.\n\nBest regards,\nSystem Administrator',
               isNotif: true
            },
            {
               icon: TrendingUp,
               title: 'Organizational Audit Request',
               desc: 'Request a comprehensive audit report.',
               subject: 'Organizational Audit Request',
               body: 'Dear Unit Head,\n\nThe Administrative Office requires a comprehensive audit report covering:\n\n1. Headcount and personnel roster\n2. Active project status and completion rates\n3. Budget utilization\n4. Compliance adherence\n5. Risk flags and mitigation plans\n\nPlease submit your report by [Date].\n\nBest regards,\nSystem Administrator',
               isNotif: false
            }
         ]
      },
      {
         group: 'Manager',
         filter: 'manager' as RoleFilter,
         icon: Building,
         items: [
            {
               icon: Briefcase,
               title: 'Strategic Directive',
               desc: 'Issue a strategic directive to all managers.',
               subject: 'Strategic Directive — Admin Office',
               body: 'Dear Manager,\n\nThe following directive is issued from the Administrative Office:\n\nDirective: [Details]\nEffective: [Date]\nScope: All managed projects\nAction Required: [Steps]\n\nPlease acknowledge and cascade to your teams.\n\nBest regards,\nSystem Administrator',
               isNotif: true
            },
            {
               icon: FileText,
               title: 'Performance Overview Request',
               desc: 'Request a performance snapshot from managers.',
               subject: 'Performance Overview Request',
               body: 'Dear Manager,\n\nPlease provide a performance overview for the current period, including:\n\n1. Team productivity metrics\n2. Project delivery status\n3. Budget utilization\n4. Key achievements and blockers\n\nSubmit by: [Date]\n\nBest regards,\nSystem Administrator',
               isNotif: false
            }
         ]
      },
      {
         group: 'Project Lead',
         filter: 'project_lead' as RoleFilter,
         icon: ShieldCheck,
         items: [
            {
               icon: TrendingUp,
               title: 'Project Status Request',
               desc: 'Request a project status update from leads.',
               subject: 'Project Status Update Request',
               body: 'Dear Project Lead,\n\nThe Administrative Office requests an immediate project status update:\n\n1. Current completion percentage\n2. Blockers and risks\n3. Resource requirements\n4. Revised timeline (if applicable)\n\nRequired by: [Date]\n\nBest regards,\nSystem Administrator',
               isNotif: false
            },
            {
               icon: Shield,
               title: 'Compliance Notice',
               desc: 'Issue a compliance reminder to project leads.',
               subject: 'Compliance Notice — Action Required',
               body: 'Dear Project Lead,\n\nThis is a compliance notice from the Administrative Office.\n\nCompliance Area: [Area]\nDeadline: [Date]\nRequired Action: [Action]\n\nNon-compliance may result in project suspension. Please act immediately.\n\nBest regards,\nSystem Administrator',
               isNotif: true
            }
         ]
      },
      {
         group: 'Employee',
         filter: 'employee' as RoleFilter,
         icon: User,
         items: [
            {
               icon: FileText,
               title: 'General Announcement',
               desc: 'Send a general announcement to employees.',
               subject: 'General Announcement',
               body: 'Dear Employee,\n\nThis is a general announcement from the Administrative Office.\n\n[Announcement Details]\n\nFor queries, contact your project lead or manager.\n\nBest regards,\nSystem Administrator',
               isNotif: false
            },
            {
               icon: Briefcase,
               title: 'Task Assignment Notice',
               desc: 'Notify an employee of a specific task or assignment.',
               subject: 'Task Assignment Notice',
               body: 'Dear Employee,\n\nYou have been assigned the following task by the Administrative Office:\n\nTask: [Task Name]\nProject: [Project]\nDeadline: [Date]\nPriority: [High / Medium / Low]\n\nPlease coordinate with your project lead and begin immediately.\n\nBest regards,\nSystem Administrator',
               isNotif: true
            }
         ]
      }
   ];

   return (
      <div className="space-y-8 pb-20">
         {/* ─── Templates by Role Group ─── */}
         <div className="space-y-8">
            {TEMPLATES.map(group => (
               <div key={group.group}>
                  <div className="flex items-center gap-3 mb-4">
                     <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center border", ROLE_COLORS[group.filter])}>
                        <group.icon className="h-4 w-4" />
                     </div>
                     <h3 className={cn("text-xs font-black uppercase tracking-widest", ROLE_COLORS[group.filter].split(' ')[0])}>
                        {group.group} Templates
                     </h3>
                     <div className="flex-1 h-px bg-secondary/50" />
                     <span className={cn("text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border", ROLE_COLORS[group.filter])}>
                        {group.group}
                     </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     {group.items.map(item => (
                        <TemplateCard
                           key={item.title}
                           icon={item.icon}
                           title={item.title}
                           desc={item.desc}
                           badge={group.group}
                           badgeColor={ROLE_COLORS[group.filter]}
                           onClick={() => openCompose(item.subject, item.body, item.isNotif, group.filter)}
                        />
                     ))}
                  </div>
               </div>
            ))}

            {/* Custom Broadcast */}
            <div>
               <div className="flex items-center gap-3 mb-4">
                  <div className="h-8 w-8 rounded-lg bg-secondary/50 border border-secondary flex items-center justify-center">
                     <Pencil className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Custom Broadcast</h3>
                  <div className="flex-1 h-px bg-secondary/50" />
                  <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border text-muted-foreground border-secondary bg-secondary/20">All Users</span>
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <TemplateCard
                     icon={FileText}
                     title="Custom Message"
                     desc="Write a custom message to any user — employees, managers, project leads, or unit heads."
                     badge="All Recipients"
                     badgeColor="text-muted-foreground border-secondary bg-secondary/20"
                     onClick={() => openCompose('', '', false, 'all')}
                  />
               </div>
            </div>
         </div>

         {/* New Message Button */}
         <button
            onClick={() => { setComposeData({ to: '', subject: '', body: '', isNotification: false }); setRoleFilter('all'); setShowCompose(true); }}
            className="bg-foreground text-background px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-accent hover:text-white transition-all shadow-sm active:scale-95 flex items-center gap-2"
         >
            <Plus className="h-4 w-4" /> Compose New Message
         </button>

         {/* Status Toast */}
         {statusMsg && (
            <div className={cn("p-4 rounded-xl flex items-center gap-3 animate-in fade-in border shadow-xl", statusMsg.type === 'success' ? "bg-green-500/10 border-green-500/20 text-green-500" : "bg-red-500/10 border-red-500/20 text-red-500")}>
               {statusMsg.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
               <p className="font-bold text-xs uppercase tracking-wider">{statusMsg.text}</p>
            </div>
         )}

         {/* ─── Mail Client ─── */}
         <section className="bg-background border border-secondary rounded-3xl overflow-hidden shadow-sm flex h-[600px]">
            <div className="w-1/3 border-r border-secondary flex flex-col bg-secondary/5">
               <div className="p-4 border-b border-secondary space-y-3">
                  <div className="flex items-center bg-background border border-secondary px-3 py-2 rounded-xl focus-within:border-accent transition-all">
                     <Search className="h-4 w-4 text-muted-foreground mr-2 shrink-0" />
                     <input type="text" placeholder="Search messages..." className="bg-transparent border-none outline-none text-sm w-full font-medium" />
                  </div>
                  <div className="flex gap-2">
                     {(['inbox', 'sent'] as const).map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)} className={cn("flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors", activeTab === tab ? "bg-foreground text-background" : "hover:bg-secondary/40 text-muted-foreground")}>
                           {tab} {tab === 'inbox' && unreadCount > 0 && <span className="ml-1 bg-accent text-white text-[9px] px-1.5 py-0.5 rounded-full">{unreadCount}</span>}
                        </button>
                     ))}
                  </div>
               </div>
               <div className="flex-1 overflow-y-auto">
                  {loading ? (
                     <div className="flex items-center justify-center h-full"><Loader2 className="h-6 w-6 animate-spin text-accent" /></div>
                  ) : mails.length === 0 ? (
                     <div className="p-10 text-center"><MailIcon className="h-8 w-8 text-muted-foreground/20 mx-auto mb-3" /><p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">No messages</p></div>
                  ) : mails.map(mail => (
                     <button key={mail.id} onClick={() => handleSelectMail(mail)} className={cn("w-full text-left p-5 hover:bg-secondary/20 transition-all border-l-2", selectedMail?.id === mail.id ? "border-l-accent bg-accent/5" : "border-l-transparent", !mail.is_read && activeTab === 'inbox' ? "bg-background" : "opacity-70")}>
                        <div className="flex justify-between items-start mb-1.5">
                           <span className={cn("text-xs font-bold uppercase tracking-wide truncate", !mail.is_read && activeTab === 'inbox' ? "text-accent" : "text-muted-foreground")}>
                              {activeTab === 'inbox' ? mail.senderName : mail.receiverName}
                           </span>
                           <span className="text-[10px] font-medium text-muted-foreground ml-2 shrink-0">{mail.time}</span>
                        </div>
                        <p className={cn("text-xs font-bold uppercase tracking-tight mb-1 truncate", !mail.is_read && activeTab === 'inbox' ? "text-foreground" : "text-muted-foreground")}>{mail.subject}</p>
                        <p className="text-[11px] text-muted-foreground line-clamp-1 font-medium">{mail.body}</p>
                     </button>
                  ))}
               </div>
            </div>

            <div className="flex-1 flex flex-col bg-background">
               {selectedMail ? (
                  <>
                     <div className="p-8 border-b border-secondary/20 flex justify-between items-start bg-secondary/5">
                        <div className="flex items-center gap-5">
                           <div className="h-14 w-14 rounded-2xl bg-foreground text-background flex items-center justify-center font-bold text-xl shadow-lg shrink-0">
                              {(activeTab === 'inbox' ? selectedMail.senderName : selectedMail.receiverName)?.[0]}
                           </div>
                           <div>
                              <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border text-accent border-accent/20 bg-accent/5">
                                 {(activeTab === 'inbox' ? selectedMail.senderRole : selectedMail.receiverRole)?.replace('_', ' ')}
                              </span>
                              <h3 className="text-xl font-bold tracking-tight mt-1">{selectedMail.subject}</h3>
                              <div className="flex items-center gap-2 mt-1.5">
                                 <p className="text-xs font-bold uppercase">{activeTab === 'inbox' ? selectedMail.senderName : selectedMail.receiverName}</p>
                                 <span className="h-1 w-1 bg-accent rounded-full" />
                                 <p className="text-xs text-muted-foreground font-medium">{new Date(selectedMail.sent_at).toLocaleString()}</p>
                              </div>
                           </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                           <button className="h-10 w-10 rounded-xl border border-secondary hover:bg-secondary flex items-center justify-center transition-all"><Reply className="h-4 w-4" /></button>
                           <button className="h-10 w-10 rounded-xl border border-secondary hover:bg-secondary flex items-center justify-center transition-all"><MoreVertical className="h-4 w-4" /></button>
                        </div>
                     </div>
                     <div className="p-8 flex-1 overflow-y-auto">
                        <div className="bg-secondary/5 p-8 rounded-2xl border border-secondary/20 whitespace-pre-wrap text-sm font-medium leading-relaxed text-foreground/90 mb-6">{selectedMail.body}</div>
                        {selectedMail.is_notification && (
                           <div className="p-5 bg-accent/5 border border-accent/20 rounded-xl flex items-start gap-4">
                              <AlertCircle className="h-5 w-5 text-accent mt-0.5 shrink-0" />
                              <div>
                                 <p className="text-xs font-bold text-accent uppercase tracking-wider mb-1">High-Priority Notice</p>
                                 <p className="text-xs font-medium text-foreground/70 leading-relaxed">This message is flagged high priority. Immediate action required.</p>
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
               <div className="bg-background w-full max-w-2xl border border-secondary rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden max-h-[90vh] flex flex-col">
                  <div className="flex items-center justify-between p-6 border-b border-secondary shrink-0">
                     <div className="flex items-center gap-3">
                        <div className="h-9 w-9 bg-accent/10 border border-accent/20 rounded-xl flex items-center justify-center">
                           <Send className="h-4 w-4 text-accent" />
                        </div>
                        <div>
                           <h3 className="text-base font-bold tracking-tight">Compose Message</h3>
                           <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Admin Broadcast — All Roles</p>
                        </div>
                     </div>
                     <button onClick={() => setShowCompose(false)} className="p-2 hover:bg-secondary rounded-lg transition-all"><X className="h-5 w-5 text-muted-foreground" /></button>
                  </div>
                  <div className="p-6 space-y-5 overflow-y-auto flex-1">
                     {/* Role Filter Chips */}
                     <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Send To Role</label>
                        <div className="flex flex-wrap gap-2">
                           {(Object.keys(ROLE_LABELS) as RoleFilter[]).map(role => (
                              <button
                                 key={role}
                                 onClick={() => { setRoleFilter(role); setComposeData(d => ({ ...d, to: '' })); }}
                                 className={cn("px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border", roleFilter === role ? "bg-foreground text-background border-foreground" : "border-secondary text-muted-foreground hover:bg-secondary/40")}
                              >
                                 {ROLE_LABELS[role]}
                              </button>
                           ))}
                        </div>
                     </div>

                     <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                           <span>Recipient ({ROLE_LABELS[roleFilter]})</span>
                           <span className="text-accent">{filteredRecipients.length} available</span>
                        </label>
                        <select value={composeData.to} onChange={e => setComposeData({ ...composeData, to: e.target.value })} className="w-full bg-background border border-secondary rounded-xl p-3 text-sm font-medium focus:border-accent outline-none">
                           <option value="">Select recipient...</option>
                           {filteredRecipients.map(r => (
                              <option key={r.id} value={r.id}>
                                 {r.full_name} — {r.role?.replace('_', ' ')} {r.email ? `(${r.email})` : ''}
                              </option>
                           ))}
                        </select>
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Subject</label>
                        <input value={composeData.subject} onChange={e => setComposeData({ ...composeData, subject: e.target.value })} placeholder="Message subject" className="w-full bg-background border border-secondary rounded-xl p-3 text-sm font-medium focus:border-accent outline-none" />
                     </div>
                     <div className="flex items-center gap-3 p-3.5 bg-secondary/10 border border-secondary rounded-xl cursor-pointer hover:bg-secondary/20 transition-colors" onClick={() => setComposeData({ ...composeData, isNotification: !composeData.isNotification })}>
                        <div className={cn("h-5 w-5 border rounded flex items-center justify-center transition-all shrink-0", composeData.isNotification ? "bg-accent border-accent text-white" : "border-secondary")}>
                           {composeData.isNotification && <CheckCircle2 className="h-3 w-3" />}
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider">Mark as High Priority</span>
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Message</label>
                        <textarea value={composeData.body} onChange={e => setComposeData({ ...composeData, body: e.target.value })} rows={7} placeholder="Write your message here..." className="w-full bg-background border border-secondary rounded-xl p-4 text-sm font-medium focus:border-accent outline-none resize-none" />
                     </div>
                     <button onClick={handleSend} disabled={!composeData.to || !composeData.subject || !composeData.body} className="w-full py-4 bg-foreground text-background rounded-xl font-bold text-sm uppercase tracking-wider hover:bg-accent hover:text-white transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
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
      <button onClick={onClick} className="text-left bg-background border border-secondary rounded-2xl p-5 shadow-sm hover:shadow-lg hover:-translate-y-1 hover:border-foreground/20 transition-all group">
         <div className="flex items-start justify-between mb-3">
            <div className="h-10 w-10 rounded-xl bg-secondary/50 group-hover:bg-secondary flex items-center justify-center transition-colors">
               <Icon className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
            </div>
            <span className={cn("text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border", badgeColor)}>{badge}</span>
         </div>
         <h4 className="font-bold text-sm mb-1 group-hover:text-accent transition-colors">{title}</h4>
         <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">{desc}</p>
      </button>
   );
}
