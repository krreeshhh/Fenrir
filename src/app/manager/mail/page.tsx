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
  Zap,
  Briefcase,
  ShieldCheck,
  TrendingUp,
  ClipboardList
} from "lucide-react";
import { cn } from "@/utils/cn";
import { createClient } from "@/utils/supabase";
import { useUser } from "@/components/UserContext";

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
      // Strategic filtering: Ensure strictly personal data and hide operational/noise roles from Sent section
      const filtered = data.filter(m => {
        if (isInbox) return m.receiver_id === userId;
        
        // In Sent section: only show high-level correspondence (hide PL and Employee noise)
        const recipientRole = m.receiver?.role;
        return m.sender_id === userId && recipientRole !== 'employee' && recipientRole !== 'project_lead';
      });

      const formatted = filtered.map(m => ({
        ...m,
        senderName: m.sender?.full_name || 'Unknown',
        receiverName: m.receiver?.full_name || 'Unknown',
        senderRole: m.sender?.role || 'user',
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

  return (
    <div className="space-y-6 pb-20">

      {/* Quick Templates */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* To Unit Head */}
        <section className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-accent flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" /> To Unit Head
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TemplateCard
              icon={TrendingUp}
              title="Performance Report"
              desc="Escalate team performance summary to the unit head."
              onClick={() => openCompose(
                'Team Performance Report',
                'Performance update as of this week:\n\nProject completion: [X]%\nKey blockers: [None / List issues]\nRecommended action: [Your recommendation]',
                true
              )}
            />
            <TemplateCard
              icon={AlertCircle}
              title="Risk Escalation"
              desc="Flag critical project risks requiring senior attention."
              onClick={() => openCompose(
                'Risk Escalation — Immediate Review Required',
                'This is a formal risk escalation notice.\n\nProject: [Project Name]\nRisk Level: [High / Critical]\nDescription: [Brief risk summary]\nRecommended Resolution: [Action required]',
                true
              )}
            />
          </div>
        </section>

        {/* To Project Lead */}
        <section className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-amber-500 flex items-center gap-2">
            <Users className="h-4 w-4" /> To Project Lead
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TemplateCard
              icon={ClipboardList}
              title="Task Directive"
              desc="Issue instructions and objectives to your project lead."
              onClick={() => openCompose(
                'Task Directive',
                'DIRECTIVE: You are assigned to oversee the following deliverable:\n\nObjective: [Describe goal]\nDeadline: [Date]\nExpected output: [Deliverable details]\n\nPlease acknowledge receipt.',
                true
              )}
            />
            <TemplateCard
              icon={Briefcase}
              title="Project Status Request"
              desc="Request a progress update from your project lead."
              onClick={() => openCompose(
                'Status Update Request',
                'Please provide an update on your current project status, including:\n\n1. Completion percentage\n2. Active blockers\n3. Next milestones\n\nResponse required within 24 hours.',
                false
              )}
            />
          </div>
        </section>
      </div>

      {/* Action Row */}
      <div className="flex justify-start pb-2">
        <button
          onClick={() => { resetCompose(); setShowCompose(true); }}
          className="bg-foreground text-background px-8 py-3 rounded-lg font-bold text-sm uppercase tracking-wider hover:bg-accent hover:text-white transition-all shadow-sm active:scale-95 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" /> New Message
        </button>
      </div>

      {/* Status Toast */}
      {statusMsg && (
        <div className={cn(
          "p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 border shadow-xl mx-auto max-w-2xl",
          statusMsg.type === 'success'
            ? "bg-green-500/10 border-green-500/20 text-green-500"
            : "bg-red-500/10 border-red-500/20 text-red-500"
        )}>
          {statusMsg.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
          <p className="font-bold text-xs uppercase tracking-wider">{statusMsg.text}</p>
        </div>
      )}

      {/* Mail Client */}
      <section className="bg-background border border-secondary/20 rounded-3xl overflow-hidden shadow-sm flex h-[600px]">
        {/* Sidebar */}
        <div className="w-1/3 border-r border-secondary/20 flex flex-col bg-muted/5">
          <div className="p-4 border-b border-secondary/20 space-y-3">
            <div className="flex items-center bg-background border border-secondary px-3 py-2 rounded-xl focus-within:ring-2 ring-accent/30 transition-all">
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
                  activeTab === 'inbox'
                    ? "bg-foreground text-background"
                    : "hover:bg-secondary text-muted-foreground"
                )}
              >
                Inbox {unreadCount > 0 && <span className="ml-1 bg-accent text-white text-[9px] px-1.5 py-0.5 rounded-full">{unreadCount}</span>}
              </button>
              <button
                onClick={() => setActiveTab('sent')}
                className={cn(
                  "flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors",
                  activeTab === 'sent'
                    ? "bg-foreground text-background"
                    : "hover:bg-secondary text-muted-foreground"
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
                    "w-full text-left p-5 hover:bg-secondary/20 transition-all border-l-4",
                    selectedMail?.id === mail.id
                      ? "border-l-accent bg-accent/5"
                      : "border-l-transparent",
                    !mail.is_read && activeTab === 'inbox' ? "bg-background" : "opacity-70"
                  )}
                >
                  <div className="flex justify-between items-start mb-1.5">
                    <span className={cn(
                      "text-xs font-bold uppercase tracking-wide",
                      !mail.is_read && activeTab === 'inbox' ? "text-accent" : "text-muted-foreground"
                    )}>
                      {activeTab === 'inbox' ? mail.senderName : mail.receiverName}
                    </span>
                    <span className="text-[10px] font-medium text-muted-foreground">{mail.time}</span>
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
                    {(activeTab === 'inbox' ? selectedMail.senderName : selectedMail.receiverName)[0]}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-accent uppercase tracking-wider mb-0.5">
                      {activeTab === 'inbox' ? 'From' : 'To'}
                    </p>
                    <h3 className="text-xl font-bold tracking-tight truncate max-w-sm">{selectedMail.subject}</h3>
                    <div className="flex items-center gap-3 mt-1.5">
                      <p className="text-xs font-bold uppercase text-foreground/80">
                        {activeTab === 'inbox' ? selectedMail.senderName : selectedMail.receiverName}
                      </p>
                      <span className="h-1 w-1 bg-accent rounded-full" />
                      <p className="text-xs text-muted-foreground font-medium capitalize">
                        {selectedMail.senderRole?.replace('_', ' ')} — {new Date(selectedMail.sent_at).toLocaleString()}
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
                  <div className="p-6 bg-accent/5 border border-accent/20 rounded-2xl flex items-start gap-4 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-150 transition-transform duration-700 pointer-events-none">
                      <AlertCircle className="h-20 w-20 text-accent" />
                    </div>
                    <AlertCircle className="h-5 w-5 text-accent mt-0.5 shrink-0" />
                    <div className="relative z-10">
                      <p className="text-xs font-bold text-accent uppercase tracking-wider mb-1.5">High-Priority Notice</p>
                      <p className="font-medium text-sm leading-relaxed text-muted-foreground">
                        This message has been flagged as a high-priority directive. Prompt acknowledgement and action is required.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3">
              <MailIcon className="h-12 w-12 opacity-10" />
              <p className="text-sm font-medium">Select a message to read</p>
            </div>
          )}
        </div>
      </section>

      {/* Compose Modal */}
      {showCompose && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className="bg-background w-full max-w-2xl border border-secondary rounded-2xl p-8 shadow-xl animate-in zoom-in-95 duration-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
              <Send className="h-32 w-32 text-accent" />
            </div>

            <button
              onClick={() => setShowCompose(false)}
              className="absolute top-6 right-6 p-2 hover:bg-secondary rounded-lg transition-all active:scale-95 z-20"
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </button>

            <div className="mb-8 relative z-10">
              <h3 className="text-2xl font-bold tracking-tight mb-1">Compose Message</h3>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Secure Communication Channel</p>
            </div>

            <div className="space-y-5 relative z-10">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Recipient</label>
                <select
                  value={composeData.to}
                  onChange={e => setComposeData({ ...composeData, to: e.target.value })}
                  className="w-full bg-background border border-secondary rounded-lg p-3 text-sm font-medium focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all"
                >
                  <option value="">Select recipient...</option>
                  <optgroup label="Unit Head">
                    {recipients.unitHeads.map(r => (
                      <option key={r.id} value={r.id}>{r.full_name} ({r.email})</option>
                    ))}
                  </optgroup>
                  <optgroup label="Project Leads">
                    {recipients.projectLeads.map(r => (
                      <option key={r.id} value={r.id}>{r.full_name} ({r.email})</option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Subject</label>
                <input
                  value={composeData.subject}
                  onChange={e => setComposeData({ ...composeData, subject: e.target.value })}
                  placeholder="Message subject"
                  className="w-full bg-background border border-secondary rounded-lg p-3 text-sm font-medium focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all"
                />
              </div>

              <div
                className="flex items-center gap-3 p-4 bg-secondary/10 border border-secondary rounded-lg cursor-pointer hover:bg-secondary/20 transition-colors"
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

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Message</label>
                <textarea
                  value={composeData.body}
                  onChange={e => setComposeData({ ...composeData, body: e.target.value })}
                  rows={6}
                  placeholder="Type your message here..."
                  className="w-full bg-background border border-secondary rounded-lg p-4 text-sm font-medium focus:border-accent focus:ring-1 focus:ring-accent outline-none resize-none transition-all"
                />

                <div className="pt-2">
                  <button
                    onClick={handleSend}
                    disabled={!composeData.to || !composeData.subject || !composeData.body}
                    className="w-full py-4 bg-foreground text-background rounded-lg font-bold text-sm uppercase tracking-wider hover:bg-accent hover:text-white transition-all shadow-sm active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:active:scale-100"
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
      className="text-left bg-background border border-secondary rounded-2xl p-6 shadow-sm hover:shadow-md hover:-translate-y-1 hover:border-accent/30 transition-all group"
    >
      <div className="h-11 w-11 rounded-xl bg-secondary/50 group-hover:bg-accent/10 flex items-center justify-center mb-4 transition-colors">
        <Icon className="h-5 w-5 text-muted-foreground group-hover:text-accent transition-colors" />
      </div>
      <h4 className="font-bold text-sm mb-1.5">{title}</h4>
      <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">{desc}</p>
    </button>
  );
}
