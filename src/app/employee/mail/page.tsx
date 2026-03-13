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
   X,
   ChevronRight,
   Briefcase,
   MessageSquare,
   AlertCircle,
   User as UserIcon,
   Loader2
} from "lucide-react";
import { cn } from "@/utils/cn";
import { createClient } from "@/utils/supabase";
import { useUser } from "@/components/UserContext";
import { useEffect, useRef } from "react";

const templates = {
   resources: {
      subject: "Resource Request: Operational Node Expansion",
      body: "I am formally requesting additional resources for my current mission orbit. Specifically, I require: [Resource Details]. This allocation is critical for mitigating [Risk Factor] and ensuring node stability."
   },
   deadline: {
      subject: "Tactical Extension Request: [Directive Title]",
      body: "Requesting a temporal extension for Directive [Title] due to unforeseen operational complexity in the [Sub-system]. Proposed new synchronization window: [Date/Time]."
   },
   sync: {
      subject: "Operational Sync Required: Cluster Alignment",
      body: "I recommend a brief tactical synchronization to align on the current deployment trajectory for the [Cluster Name] project. Target objective: Hardware/Software parity verification."
   },
   update: {
      subject: "Mission Status Update: [Project Name]",
      body: "Submitting a high-level progress report for [Project]. All current directives are within the operational window. Key achievements: [List]. Remaining hurdles: [List]."
   },
   custom: {
      subject: "Directive Communication",
      body: "Type your operational directive here..."
   }
};

export default function MailPage() {
   const [activeTab, setActiveTab] = useState<'inbox' | 'sent'>('inbox');
   const [mails, setMails] = useState<any[]>([]);
   const [selectedMail, setSelectedMail] = useState<any>(null);
   const [loading, setLoading] = useState(true);
   const [isComposing, setIsComposing] = useState(false);
   const [composeStep, setComposeStep] = useState<'project' | 'editor'>('project');
   const [selectedProjectForMail, setSelectedProjectForMail] = useState<any>(null);
   const [projects, setProjects] = useState<any[]>([]);
   const [editorData, setEditorData] = useState({ subject: '', body: '', recipientId: '' });
   const [placeholders, setPlaceholders] = useState<Record<string, string>>({});
   const [leads, setLeads] = useState<any[]>([]);
   const [sending, setSending] = useState(false);
   const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
   const [searchTerm, setSearchTerm] = useState("");

   const { userId } = useUser();
   const supabase = createClient();

   useEffect(() => {
      if (userId) {
         fetchMails();
         fetchLeads();
         fetchProjects();
      }
   }, [userId, activeTab]);

   const fetchMails = async () => {
      setLoading(true);
      const isInbox = activeTab === 'inbox';

      const { data, error } = await supabase
         .from('messages')
         .select(`
            *,
            sender:sender_id (full_name, email),
            receiver:receiver_id (full_name, email)
         `)
         .order('sent_at', { ascending: false });

      if (!error && data) {
         // Defensive filtering to ensure strictly personal data
         const filtered = data.filter(m =>
            isInbox ? m.receiver_id === userId : m.sender_id === userId
         );

         const formatted = filtered.map(m => ({
            ...m,
            senderName: m.sender?.full_name || "Unknown",
            receiverName: m.receiver?.full_name || "Unknown",
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

   const fetchLeads = async () => {
      const { data } = await supabase
         .from('users_metadata')
         .select('id, full_name, role, email')
         .eq('role', 'project_lead');
      if (data) setLeads(data);
   };

   const fetchProjects = async () => {
      if (!userId) return;

      // Fetch projects assigned to this employee via checklist_allocations
      const { data, error } = await supabase
         .from('checklist_allocations')
         .select(`
            checklists (
               projects (
                  id,
                  name
               )
            )
         `)
         .eq('employee_id', userId);

      if (!error && data) {
         // Extract unique projects from the nested structure
         const uniqueProjects = new Map();
         data.forEach((alloc: any) => {
            const proj = alloc.checklists?.projects;
            if (proj && Array.isArray(proj)) {
               proj.forEach(p => uniqueProjects.set(p.id, p));
            } else if (proj) {
               uniqueProjects.set(proj.id, proj);
            }
         });
         setProjects(Array.from(uniqueProjects.values()));
      }
   };

   const extractPlaceholders = (text: string) => {
      const regex = /\[([^\]]+)\]/g;
      const found = [];
      let match;
      while ((match = regex.exec(text)) !== null) {
         found.push(match[1]);
      }
      return found;
   };

   const startCompose = (type: keyof typeof templates) => {
      const template = templates[type];
      setEditorData({
         ...template,
         recipientId: leads[0]?.id || ''
      });

      const found = extractPlaceholders(template.body);
      const initialPlaceholders: Record<string, string> = {};
      found.forEach(p => initialPlaceholders[p] = '');
      setPlaceholders(initialPlaceholders);

      setComposeStep('project');
      setIsComposing(true);
   };

   const handleProjectSelect = (proj: any) => {
      setSelectedProjectForMail(proj);

      let newBody = editorData.body;
      let newSubject = editorData.subject;

      // Auto-fill project placeholders
      const projectPlaceholders = ['Project Name', 'Project', 'Cluster Name'];
      projectPlaceholders.forEach(pn => {
         const regex = new RegExp(`\\[${pn}\\]`, 'g');
         newBody = newBody.replace(regex, proj.name);
         newSubject = newSubject.replace(regex, proj.name);
      });

      setEditorData(prev => ({ ...prev, body: newBody, subject: newSubject }));

      // Refresh remaining placeholders excluding the ones we just filled
      const remainingFound = extractPlaceholders(newBody);
      const updatedPlaceholders: Record<string, string> = {};
      remainingFound.forEach(p => {
         if (!projectPlaceholders.includes(p)) {
            updatedPlaceholders[p] = placeholders[p] || '';
         }
      });
      setPlaceholders(updatedPlaceholders);

      setComposeStep('editor');
   };

   const updateBodyWithPlaceholders = (currentBody: string, currentPlaceholders: Record<string, string>) => {
      let updatedBody = currentBody;
      Object.entries(currentPlaceholders).forEach(([key, value]) => {
         if (value) {
            updatedBody = updatedBody.replaceAll(`[${key}]`, value);
         }
      });
      return updatedBody;
   };

   const sendMessage = async () => {
      if (!editorData.recipientId || !editorData.subject || !editorData.body) return;

      setSending(true);
      const finalBody = updateBodyWithPlaceholders(editorData.body, placeholders);

      // 1. Internal Sync (Database Reference)
      const { error } = await supabase
         .from('messages')
         .insert({
            sender_id: userId,
            receiver_id: editorData.recipientId,
            subject: editorData.subject,
            body: finalBody,
            is_notification: true
         });

      if (!error) {
         // 2. Automated External Dispatch (Google API)
         const targetLead = leads.find(l => l.id === editorData.recipientId);
         if (targetLead?.email) {
            try {
               const response = await fetch('/api/mail/send', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                     to: targetLead.email,
                     subject: editorData.subject,
                     body: finalBody
                  })
               });

               if (!response.ok) {
                  // Fallback to mailto if API fails (e.g. token expired)
                  const mailtoUrl = `mailto:${targetLead.email}?subject=${encodeURIComponent(editorData.subject)}&body=${encodeURIComponent(finalBody)}`;
                  window.location.href = mailtoUrl;
               }
            } catch (err) {
               console.error("Automation error, falling back to client dispatch", err);
               const mailtoUrl = `mailto:${targetLead.email}?subject=${encodeURIComponent(editorData.subject)}&body=${encodeURIComponent(finalBody)}`;
               window.location.href = mailtoUrl;
            }
         }

         setStatusMsg({ type: 'success', text: 'Operational Directive Dispatched Externally' });
         setIsComposing(false);
         fetchMails();
         setTimeout(() => setStatusMsg(null), 3000);
      } else {
         setStatusMsg({ type: 'error', text: 'Internal Log Failed' });
      }
      setSending(false);
   };

   const filteredMails = mails.filter(mail => {
      const search = searchTerm.toLowerCase();
      return (
         mail.subject?.toLowerCase().includes(search) ||
         mail.body?.toLowerCase().includes(search) ||
         mail.senderName?.toLowerCase().includes(search) ||
         mail.receiverName?.toLowerCase().includes(search)
      );
   });

   return (

      <div className="space-y-6 pb-20">

         {/* Quick Action Templates */}
         <section>
            <h3 className="text-xl font-bold uppercase tracking-wider mb-6 flex items-center gap-3">
               <span className="h-8 w-1 bg-accent rounded-full"></span>
               Templates
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
               <TemplateCard
                  icon={Clock}
                  title="Deadline Extension"
                  desc="Request a tactical extension for your current window."
                  onClick={() => startCompose("deadline")}
               />
               <TemplateCard
                  icon={Database}
                  title="Resource Request"
                  desc="Ask for additional hardware or technical allocations."
                  onClick={() => startCompose("resources")}
               />
               <TemplateCard
                  icon={MessageSquare}
                  title="Operational Sync"
                  desc="Request a high-level synchronization meeting."
                  onClick={() => startCompose("sync")}
               />
               <TemplateCard
                  icon={CheckCircle2}
                  title="Status Update"
                  desc="Dispatch a high-level progress report."
                  onClick={() => startCompose("update")}
               />
               <TemplateCard
                  icon={Send}
                  title="Custom Message"
                  desc="Draft a standard directive to a specific lead node."
                  onClick={() => startCompose("custom")}
               />
            </div>
         </section>

         {statusMsg && (
            <div className={cn(
               "p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 border shadow-lg",
               statusMsg.type === 'success' ? "bg-green-500/10 border-green-500/20 text-green-500" : "bg-red-500/10 border-red-500/20 text-red-500"
            )}>
               {statusMsg.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
               <p className="font-bold text-xs uppercase tracking-wider">{statusMsg.text}</p>
            </div>
         )}

         <section className="bg-background border border-secondary/20 rounded-3xl overflow-hidden shadow-2xl flex h-[650px]">
            {/* Sidebar */}
            <div className="w-[350px] border-r border-secondary/20 flex flex-col bg-muted/5">
               <div className="p-6 border-b border-secondary/20 space-y-4">
                  <div className="flex items-center bg-secondary/10 border border-secondary/30 px-4 py-2.5 rounded-xl transition-all">
                     <Search className="h-4 w-4 text-muted-foreground mr-3" />
                     <input 
                        type="text" 
                        placeholder="Search mail..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-transparent border-none outline-none text-xs font-bold tracking-wider w-full uppercase" 
                     />
                  </div>
                  <div className="flex gap-2">
                     <button
                        onClick={() => setActiveTab('inbox')}
                        className={cn("flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all", activeTab === 'inbox' ? "bg-foreground text-background" : "hover:bg-secondary text-muted-foreground")}
                     >
                        Inbox
                     </button>
                     <button
                        onClick={() => setActiveTab('sent')}
                        className={cn("flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all", activeTab === 'sent' ? "bg-foreground text-background" : "hover:bg-secondary text-muted-foreground")}
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
                  ) : filteredMails.length === 0 ? (
                     <div className="p-10 text-center">
                        <p className="text-xs font-bold text-muted-foreground uppercase">
                           {searchTerm ? `No results for "${searchTerm}"` : 'No Communications Found'}
                        </p>
                     </div>
                  ) : (
                     filteredMails.map((mail) => (
                        <button
                           key={mail.id}
                           onClick={() => setSelectedMail(mail)}
                           className={cn(
                              "w-full text-left p-6 hover:bg-secondary/20 transition-all border-l-4",
                              selectedMail?.id === mail.id ? "border-l-accent bg-accent/5" : "border-l-transparent",
                              !mail.is_read && activeTab === 'inbox' ? "bg-background" : "opacity-70"
                           )}
                        >
                           <div className="flex justify-between items-start mb-2">
                              <span className="text-xs font-bold uppercase tracking-wide truncate">
                                 {activeTab === 'inbox' ? mail.senderName : mail.receiverName}
                              </span>
                              <span className="text-[11px] font-bold text-muted-foreground">{mail.time}</span>
                           </div>
                           <p className="text-xs font-bold uppercase tracking-tight mb-2 truncate">{mail.subject}</p>
                           <p className="text-[11px] text-muted-foreground line-clamp-1">{mail.body}</p>
                        </button>
                     ))
                  )}
               </div>
            </div>

            {/* Reading Pane */}
            <div className="flex-1 flex flex-col bg-background relative overflow-hidden">
               {selectedMail ? (
                  <>
                     <div className="p-8 border-b border-secondary/20 flex justify-between items-start bg-secondary/5">
                        <div className="flex items-center gap-6">
                           <div className="h-14 w-14 rounded-2xl bg-foreground text-background flex items-center justify-center font-bold text-xl shadow-xl">
                              {(activeTab === 'inbox' ? selectedMail.senderName : selectedMail.receiverName)[0]}
                           </div>
                           <div>
                              <h2 className="text-xs font-bold text-accent uppercase tracking-wider mb-1">Directive Header</h2>
                              <h3 className="text-xl font-bold uppercase tracking-tight">{selectedMail.subject}</h3>
                              <div className="flex items-center gap-2 mt-2">
                                 <p className="text-xs font-bold">{activeTab === 'inbox' ? selectedMail.senderName : selectedMail.receiverName}</p>
                                 <span className="h-1 w-1 bg-muted-foreground rounded-full"></span>
                                 <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">
                                    {selectedMail.sent_at && new Date(selectedMail.sent_at).toLocaleString()}
                                 </p>
                              </div>
                           </div>
                        </div>
                        <div className="flex gap-2 text-muted-foreground">
                           <button className="h-10 w-10 border border-secondary rounded-xl hover:bg-secondary flex items-center justify-center transition-all bg-background">
                              <Reply className="h-5 w-5" />
                           </button>
                           <button className="h-10 w-10 border border-secondary rounded-xl hover:bg-secondary flex items-center justify-center transition-all bg-background">
                              <MoreVertical className="h-5 w-5" />
                           </button>
                        </div>
                     </div>
                     <div className="p-10 flex-1 overflow-y-auto text-sm leading-relaxed text-foreground/90 font-medium">
                        <div className="bg-secondary/5 p-8 rounded-3xl border border-secondary/10 whitespace-pre-wrap">
                           {selectedMail.body}
                        </div>

                        {selectedMail.is_notification && (
                           <div className="mt-8 p-6 bg-accent/5 border border-accent/20 rounded-2xl flex items-start gap-4">
                              <AlertCircle className="h-5 w-5 text-accent mt-0.5" />
                              <div>
                                 <p className="text-xs font-bold text-accent uppercase tracking-wider mb-1">System Action Notice</p>
                                 <p className="text-xs font-bold leading-relaxed opacity-70">
                                    This communication has been flagged for prioritized review. Please ensure follow-up protocols are observed.
                                 </p>
                              </div>
                           </div>
                        )}
                     </div>
                  </>
               ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                     <MailIcon className="h-12 w-12 opacity-10 mb-4" />
                     <p className="text-xs font-bold uppercase tracking-wider">Communication Channel Idle</p>
                  </div>
               )}
            </div>
         </section>

         {/* Compose Modal */}
         {isComposing && (
            <div className="fixed inset-0 bg-background/80 backdrop-blur-xl z-[200] flex items-center justify-center p-6">
               <div className="bg-background w-full max-w-2xl rounded-[32px] border border-secondary p-10 shadow-2xl animate-in zoom-in-95 duration-300 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8">
                     <button onClick={() => setIsComposing(false)} className="h-10 w-10 rounded-xl hover:bg-secondary flex items-center justify-center transition-all">
                        <X className="h-5 w-5" />
                     </button>
                  </div>

                  <div className="mb-8">
                     <h2 className="text-xs font-bold text-accent uppercase tracking-wider mb-2">Compose Directive</h2>
                     <h3 className="text-2xl font-bold uppercase tracking-tight">
                        {composeStep === 'project' ? 'Select Target Project' : 'Finalize Mission Parameters'}
                     </h3>
                  </div>

                  <div className="space-y-6">
                     {composeStep === 'project' ? (
                        <div className="grid grid-cols-1 gap-4">
                           <p className="text-xs font-bold text-muted-foreground mb-2">Which operational cluster is this directive regarding?</p>
                           {projects.map(proj => (
                              <button
                                 key={proj.id}
                                 onClick={() => handleProjectSelect(proj)}
                                 className="w-full text-left p-6 bg-secondary/10 border border-secondary/30 rounded-2xl hover:border-accent hover:bg-accent/5 transition-all group flex justify-between items-center"
                              >
                                 <span className="text-sm font-bold uppercase tracking-tight group-hover:text-accent">{proj.name}</span>
                                 <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-accent" />
                              </button>
                           ))}
                           <button
                              onClick={() => setComposeStep('editor')}
                              className="mt-4 p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground underline underline-offset-4"
                           >
                              Skip Project Selection
                           </button>
                        </div>
                     ) : (
                        <>
                           <div className="space-y-2">
                              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                 <Briefcase className="h-3 w-3" /> Target Project
                              </label>
                              <div className="p-4 bg-secondary/10 border border-secondary/30 rounded-xl text-xs font-bold uppercase text-accent">
                                 {selectedProjectForMail?.name || 'GENERIC DIRECTIVE'}
                              </div>
                           </div>

                           <div className="space-y-2">
                              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                 <UserIcon className="h-3 w-3" /> Target Lead Node
                              </label>
                              <select
                                 value={editorData.recipientId}
                                 onChange={e => setEditorData({ ...editorData, recipientId: e.target.value })}
                                 className="w-full bg-secondary/20 border border-secondary rounded-xl p-4 text-xs font-bold outline-none appearance-none"
                              >
                                 {leads.map(lead => (
                                    <option key={lead.id} value={lead.id}>{lead.full_name} ({lead.role})</option>
                                 ))}
                              </select>
                           </div>

                           {Object.keys(placeholders).length > 0 && (
                              <div className="space-y-4 p-6 bg-secondary/5 rounded-[24px] border border-secondary/10">
                                 <p className="text-[11px] font-bold uppercase tracking-wider text-accent mb-2">Missing Parameters Detected</p>
                                 {Object.keys(placeholders).map(p => (
                                    <div key={p} className="space-y-1">
                                       <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{p}</label>
                                       <input
                                          type="text"
                                          value={placeholders[p]}
                                          onChange={e => {
                                             const updated = { ...placeholders, [p]: e.target.value };
                                             setPlaceholders(updated);
                                             // We don't update editorData.body yet to keep placeholders visible or we can update a temp body
                                          }}
                                          placeholder={`ENTER ${p.toUpperCase()}...`}
                                          className="w-full bg-background/50 border border-secondary/30 rounded-lg p-3 text-xs font-bold outline-none focus:border-accent transition-all"
                                       />
                                    </div>
                                 ))}
                              </div>
                           )}

                           <div className="space-y-2">
                              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Directive Body (Preview)</label>
                              <textarea
                                 value={updateBodyWithPlaceholders(editorData.body, placeholders)}
                                 onChange={e => setEditorData({ ...editorData, body: e.target.value })}
                                 rows={6}
                                 className="w-full bg-secondary/20 border border-secondary focus:border-accent rounded-xl p-4 text-xs font-bold outline-none transition-all resize-none"
                              />
                              <p className="text-[11px] text-muted-foreground italic font-medium">Text edit mode is enabled for final adjustments.</p>
                           </div>

                           <div className="flex gap-4">
                              <button
                                 onClick={() => setComposeStep('project')}
                                 className="px-6 py-5 border border-secondary rounded-2xl font-bold text-xs uppercase tracking-wider hover:bg-secondary transition-all"
                              >
                                 Back
                              </button>
                              <button
                                 onClick={() => {
                                    // Commit placeholders to final body before sending
                                    const finalBody = updateBodyWithPlaceholders(editorData.body, placeholders);
                                    setEditorData(prev => ({ ...prev, body: finalBody }));
                                    sendMessage();
                                 }}
                                 disabled={sending}
                                 className="flex-1 py-5 bg-foreground text-background rounded-2xl font-bold text-xs uppercase tracking-wider hover:bg-accent transition-all flex items-center justify-center gap-3 shadow-xl disabled:opacity-50"
                              >
                                 {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <>DISPATCH COMMUNICATION <Send className="h-4 w-4" /></>}
                              </button>
                           </div>
                        </>
                     )}
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
         className="text-left bg-background border rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-1 hover:border-secondary-foreground/30 transition-all group"
      >
         <div className="h-10 w-10 rounded-xl bg-muted group-hover:bg-secondary flex items-center justify-center mb-4 transition-colors">
            <Icon className="h-5 w-5 text-muted-foreground group-hover:text-secondary-foreground transition-colors" />
         </div>
         <h4 className="font-bold text-sm mb-2">{title}</h4>
         <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">{desc}</p>
      </button>
   )
}
