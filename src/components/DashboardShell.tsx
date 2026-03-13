"use client"

import { useState } from "react"
import dynamic from 'next/dynamic'
import { UserRole } from "@/utils/supabase"
import { UserProvider, useUser } from "@/components/UserContext"

const Sidebar = dynamic(() => import("@/components/Sidebar"), {
  ssr: false,
  loading: () => <div className="w-72 h-full bg-background border-r border-secondary/50 skeleton" />
});

const Chatbot = dynamic(() => import("./Chatbot"), {
  ssr: false
});
import { cn } from "@/utils/cn"
import { Bell, Zap, MessageSquare, AlertCircle, CheckCircle2, X, Menu, Loader2 } from "lucide-react"
import { createClient } from "@/utils/supabase"
import { useEffect } from "react"

interface Notification {
  id: string;
  title: string;
  description: string;
  time: string;
  type: 'alert' | 'update' | 'message';
  read: boolean;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    title: 'High Priority Task',
    description: 'System Node Delta needs immediate validation in Sector 7.',
    time: '2m ago',
    type: 'alert',
    read: false
  },
  {
    id: '2',
    title: 'New Efficiency Record',
    description: 'Your impact score increased by +250 points today.',
    time: '1h ago',
    type: 'update',
    read: false
  },
  {
    id: '3',
    title: 'Meeting Scheduled',
    description: 'Project Sync with Unit Head starts in 30 minutes.',
    time: '2h ago',
    type: 'message',
    read: true
  }
];

interface DashboardShellProps {
  children: React.ReactNode;
  // role is still passed from the page so nav items are known immediately (no async flash)
  role: UserRole;
}

export default function DashboardShell({ children, role }: DashboardShellProps) {
  return (
    <UserProvider>
      <ShellInner role={role}>{children}</ShellInner>
    </UserProvider>
  );
}

function ShellInner({ children, role }: DashboardShellProps) {
  const [isSidebarCompact, setIsSidebarCompact] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { fullName, loading, userId, avatarUrl } = useUser();
  const supabase = createClient();

  useEffect(() => {
    if (userId) {
      fetchNotifications();
      // Polling for new messages every 30 seconds
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [userId]);

  const fetchNotifications = async () => {
    // Sync external nodes (Gmail)
    try {
      const resp = await fetch('/api/mail/sync', { method: 'POST' });
      if (resp.status === 403) {
        console.warn('Mail Sync: Insufficient scopes. Please log out and log in again with Google.');
      }

      // Trigger deadline & meeting alarms
      await fetch('/api/notifications/scheduler', { method: 'POST' });
    } catch (e) {
      console.error('External node sync failure:', e);
    }

    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:sender_id (full_name)
      `)
      .eq('receiver_id', userId)
      .eq('is_read', false)
      .order('sent_at', { ascending: false })
      .limit(10);

    if (!error && data) {
      const formatted: Notification[] = data.map(m => ({
        id: m.id,
        title: m.subject || 'New Communication',
        description: m.body ? m.body.slice(0, 100) + (m.body.length > 100 ? '...' : '') : '',
        time: getTimeAgo(m.sent_at),
        type: m.is_notification ? 'alert' : 'message',
        read: m.is_read
      }));
      setNotifications(formatted);
    }
  };

  const getTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  const unreadCount = notifications.length;

  const markAllRead = async () => {
    if (!userId) return;
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('receiver_id', userId);
    setNotifications([]);
  };

  const removeNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('id', id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const displayName = loading ? "..." : (fullName || "User");
  const initials = displayName.slice(0, 1).toUpperCase();

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar - Naturally Stationary */}
      <Sidebar
        role={role}
        userName={displayName}
        avatarUrl={avatarUrl}
        isCompact={isSidebarCompact}
        onToggleCompact={() => setIsSidebarCompact(!isSidebarCompact)}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Container - Right Side */}
      <div className={cn(
        "flex-1 flex flex-col transition-all duration-500 h-full w-full",
        isSidebarCompact ? "lg:ml-20" : "lg:ml-72",
        "ml-0"
      )}>

        {/* Topbar - Stationary */}
        <header className="h-20 border-b border-secondary/50 bg-background/80 px-4 md:px-10 flex items-center justify-between shrink-0 sticky top-0 z-40 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 -ml-2 rounded-lg lg:hidden hover:bg-secondary transition-colors"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="animate-in fade-in slide-in-from-left-2 duration-500">
              <h1 className="text-lg font-bold tracking-tight leading-none">PIVOT</h1>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={cn(
                  "p-2.5 bg-secondary/30 border border-secondary/50 rounded-lg transition-all text-muted-foreground hover:text-accent group relative",
                  showNotifications && "border-accent/40 bg-secondary/60 text-accent"
                )}
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 h-2 w-2 bg-accent rounded-full border-2 border-background animate-pulse" />
                )}
              </button>

              {/* Notification Popup */}
              {showNotifications && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowNotifications(false)}
                  />
                  <div className="absolute right-0 mt-4 w-screen max-w-[calc(100vw-2rem)] md:w-96 bg-background/95 backdrop-blur-xl border border-secondary shadow-2xl rounded-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-200">
                    <div className="p-5 border-b border-secondary flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-bold uppercase tracking-tight">System Notifications</h3>
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Active Matrix Updates</p>
                      </div>
                      <button
                        onClick={markAllRead}
                        className="text-[10px] font-bold uppercase tracking-wider text-accent hover:underline"
                      >
                        Clear All
                      </button>
                    </div>

                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                      {notifications.length > 0 ? (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            className={cn(
                              "p-4 border-b border-secondary/50 last:border-0 hover:bg-secondary/20 transition-all cursor-pointer group relative",
                              !n.read && "bg-accent/5"
                            )}
                          >
                            <div className="flex gap-4">
                              <div className={cn(
                                "h-10 w-10 min-w-[40px] rounded-xl flex items-center justify-center shadow-sm",
                                n.type === 'alert' ? "bg-red-500/10 text-red-500" :
                                  n.type === 'update' ? "bg-accent/10 text-accent" : "bg-secondary text-muted-foreground"
                              )}>
                                {n.type === 'alert' ? <AlertCircle className="h-5 w-5" /> :
                                  n.type === 'update' ? <Zap className="h-5 w-5" /> : <MessageSquare className="h-5 w-5" />}
                              </div>
                              <div className="flex-1 pr-6">
                                <div className="flex justify-between items-start mb-1">
                                  <h4 className="text-xs font-bold tracking-tight">{n.title}</h4>
                                  <span className="text-[9px] font-medium text-muted-foreground uppercase">{n.time}</span>
                                </div>
                                <p className="text-[11px] text-muted-foreground font-medium leading-relaxed">{n.description}</p>
                              </div>
                            </div>
                            <button
                              onClick={(e) => removeNotification(n.id, e)}
                              className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 p-1 hover:bg-secondary rounded-md transition-all"
                            >
                              <X className="h-3 w-3 text-muted-foreground" />
                            </button>
                            {!n.read && (
                              <div className="absolute left-0 top-0 h-full w-1 bg-accent" />
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="p-10 text-center">
                          <CheckCircle2 className="h-10 w-10 text-accent/20 mx-auto mb-3" />
                          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Matrix Synchronized</p>
                          <p className="text-[10px] text-muted-foreground/60 mt-1">No pending notifications</p>
                        </div>
                      )}
                    </div>

                    {notifications.length > 0 && (
                      <div className="p-4 bg-secondary/10 border-t border-secondary text-center">
                        <button className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-all">
                          View All Activity Registry
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
            <div className="flex items-center gap-3 pl-4 border-l border-secondary/50">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold leading-none mb-1">{displayName}</p>
                <p className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider leading-none">Status: Active</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-foreground text-background flex items-center justify-center font-bold text-lg shadow-lg border border-accent/10 overflow-hidden bg-cover bg-center" style={avatarUrl ? { backgroundImage: `url(${avatarUrl})` } : {}}>
                {!avatarUrl && initials}
              </div>
            </div>
          </div>
        </header>

        {/* Content Area - Scrolling */}
        <main className="flex-1 overflow-y-auto p-6 md:p-10 scrollbar-hide">
          <div className="max-w-[1400px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
            {children}
          </div>
          {/* Chatbot stays relative to the viewport/page layout */}
          <Chatbot />
        </main>
      </div>
    </div>
  );
}
