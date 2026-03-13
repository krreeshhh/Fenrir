"use client"

import { useState, useEffect } from "react";
import {
   Users,
   Shield,
   ShieldCheck,
   ShieldAlert,
   Activity,
   Globe,
   Zap,
   UserPlus,
   Mail,
   Calendar,
   Video,
   Clock,
   MessageSquare,
   ChevronRight
} from "lucide-react";
import { cn } from "@/utils/cn";
import { createClient } from "@/utils/supabase";
import { DashboardSkeleton } from "@/components/Skeleton";

export default function AdminDashboard() {
   const [stats, setStats] = useState({
      totalUsers: 0,
      roleDistribution: {} as Record<string, number>,
      recentActivity: [] as any[]
   });
   const [loading, setLoading] = useState(true);
   const [recentMails, setRecentMails] = useState<any[]>([]);
   const [upcomingMeetings, setUpcomingMeetings] = useState<any[]>([]);
   const supabase = createClient();

   useEffect(() => {
      fetchAdminStats();
   }, []);

   const fetchAdminStats = async () => {
      setLoading(true);

      const { data: users, count } = await supabase
         .from('users_metadata')
         .select('*', { count: 'exact' });

      if (users) {
         const distribution = users.reduce((acc: any, curr: any) => {
            acc[curr.role] = (acc[curr.role] || 0) + 1;
            return acc;
         }, {});

         setStats({
            totalUsers: count || 0,
            roleDistribution: distribution,
            recentActivity: users.slice(0, 5)
         });

         // Fetch admin's own mail & meetings
         const { data: { user } } = await supabase.auth.getUser();
         if (user) {
            const [mailRes, mtgRes] = await Promise.all([
               supabase
                  .from('messages')
                  .select('*, sender:sender_id(full_name, role)')
                  .eq('receiver_id', user.id)
                  .order('sent_at', { ascending: false })
                  .limit(4),
               supabase
                  .from('meeting_participants')
                  .select('meeting:meetings(*)')
                  .eq('user_id', user.id)
            ]);
            setRecentMails(mailRes.data || []);
            const now = new Date();
            const upcoming = (mtgRes.data || [])
               .map((d: any) => d.meeting)
               .filter((m: any) => m && new Date(m.scheduled_at) >= now)
               .sort((a: any, b: any) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
               .slice(0, 4);
            setUpcomingMeetings(upcoming);
         }
      }
      setLoading(false);
   };

   if (loading) return <DashboardSkeleton />;

   return (
      <div className="space-y-6 pb-16">

         {/* Stats Grid */}
         <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <QuickStat label="Total Nodes" value={stats.totalUsers} icon={Users} />
            <QuickStat label="Unit Heads" value={stats.roleDistribution.unit_head || 0} icon={Globe} accent />
            <QuickStat label="Managers" value={stats.roleDistribution.manager || 0} icon={Zap} />
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3 space-y-6">
               {/* Role Distribution */}
               <div className="space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider">Network Architecture</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <DistributionCard label="Employees" count={stats.roleDistribution.employee || 0} percentage={(stats.roleDistribution.employee || 0) / stats.totalUsers * 100} color="bg-foreground" />
                     <DistributionCard label="Project Leads" count={stats.roleDistribution.project_lead || 0} percentage={(stats.roleDistribution.project_lead || 0) / stats.totalUsers * 100} color="bg-accent" />
                  </div>
               </div>

               {/* Recent Node Accessions */}
               <div className="space-y-4 pt-4">
                  <div className="flex items-center justify-between">
                     <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                        <UserPlus className="h-5 w-5 text-accent" /> Recent Node Accessions
                     </h3>
                     <button onClick={() => window.location.href = '/admin/users'} className="text-xs font-bold text-accent hover:underline uppercase tracking-wider flex items-center gap-1">Audit Registry <ChevronRight className="h-3 w-3" /></button>
                  </div>
                  <div className="bg-background border border-secondary rounded-xl divide-y divide-secondary overflow-hidden shadow-sm">
                     {stats.recentActivity.map((user) => (
                        <div key={user.id} className="flex items-center justify-between p-5 hover:bg-secondary/10 transition-colors group">
                           <div className="flex items-center gap-4">
                              <div className="h-10 w-10 rounded-xl bg-secondary border border-secondary flex items-center justify-center font-bold text-xs group-hover:bg-foreground group-hover:text-background transition-all shadow-sm">
                                 {user.full_name[0]}
                              </div>
                              <div>
                                 <p className="text-sm font-bold uppercase tracking-tight">{user.full_name}</p>
                                 <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mt-0.5 opacity-60">ID: PVT-{user.id.slice(0, 8).toUpperCase()}</p>
                              </div>
                           </div>
                           <span className="text-xs font-bold bg-secondary/50 text-foreground border border-secondary px-3 py-1.5 rounded-lg uppercase tracking-wider">{user.role?.replace('_', ' ')}</span>
                        </div>
                     ))}
                  </div>
               </div>

               {/* Meetings Overview */}
               <div className="bg-background border border-secondary rounded-xl shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-secondary flex items-center justify-between">
                     <h3 className="text-sm font-bold flex items-center gap-2"><Video className="h-4 w-4 text-accent" /> Upcoming Meetings</h3>
                     <button onClick={() => window.location.href = '/admin/meetings'} className="text-xs font-bold text-accent hover:underline uppercase tracking-wider flex items-center gap-1">View All <ChevronRight className="h-3 w-3" /></button>
                  </div>
                  {upcomingMeetings.length === 0 ? (
                     <div className="p-8 text-center">
                        <Calendar className="h-7 w-7 text-muted-foreground/20 mx-auto mb-2" />
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">No upcoming meetings</p>
                        <button onClick={() => window.location.href = '/admin/meetings'} className="mt-2 text-xs font-bold text-accent hover:underline">Schedule one</button>
                     </div>
                  ) : (
                     <div className="divide-y divide-secondary">
                        {upcomingMeetings.map(mtg => (
                           <div key={mtg.id} className="p-4 flex items-center gap-4 hover:bg-secondary/10 transition-colors group">
                              <div className="h-10 w-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
                                 <Video className="h-4 w-4 text-accent" />
                              </div>
                              <div className="flex-1 min-w-0">
                                 <p className="text-sm font-bold truncate group-hover:text-accent transition-colors">{mtg.title}</p>
                                 <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5 mt-0.5">
                                    <Clock className="h-3 w-3" />
                                    {new Date(mtg.scheduled_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                 </p>
                              </div>
                              <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 border border-secondary rounded-md text-muted-foreground shrink-0">{mtg.duration_minutes ?? 30}m</span>
                           </div>
                        ))}
                     </div>
                  )}
               </div>
            </div>

            <div className="space-y-6">
               <h3 className="text-sm font-bold uppercase tracking-wider">System Protocol</h3>

               {/* Mail Overview */}
               <div className="bg-background border border-secondary rounded-xl shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-secondary flex items-center justify-between">
                     <h3 className="text-sm font-bold flex items-center gap-2"><Mail className="h-4 w-4 text-accent" /> Recent Inbox</h3>
                     <button onClick={() => window.location.href = '/admin/mail'} className="text-xs font-bold text-accent hover:underline uppercase tracking-wider flex items-center gap-1">Open <ChevronRight className="h-3 w-3" /></button>
                  </div>
                  {recentMails.length === 0 ? (
                     <div className="p-8 text-center">
                        <MessageSquare className="h-7 w-7 text-muted-foreground/20 mx-auto mb-2" />
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">No messages yet</p>
                     </div>
                  ) : (
                     <div className="divide-y divide-secondary">
                        {recentMails.map(mail => (
                           <div key={mail.id} className="p-4 flex items-start gap-3 hover:bg-secondary/10 transition-colors cursor-pointer" onClick={() => window.location.href = '/admin/mail'}>
                              <div className={cn("h-2 w-2 rounded-full mt-2 shrink-0", !mail.is_read ? "bg-accent" : "bg-transparent")} />
                              <div className="flex-1 min-w-0">
                                 <p className={cn("text-xs font-bold truncate", !mail.is_read ? "text-foreground" : "text-muted-foreground")}>{mail.subject}</p>
                                 <p className="text-[10px] text-muted-foreground font-medium mt-0.5">{mail.sender?.full_name} · {mail.sender?.role?.replace('_', ' ')}</p>
                              </div>
                              <span className="text-[10px] text-muted-foreground shrink-0">{new Date(mail.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                           </div>
                        ))}
                     </div>
                  )}
               </div>
            </div>
         </div>
      </div>
   );
}

function QuickStat({ label, value, icon: Icon, accent = false, green = false }: any) {
   return (
      <div className={cn(
         "bg-background border rounded-xl p-5 shadow-sm transition-all hover:scale-[1.02]",
         accent ? "border-accent/40 bg-accent/5 ring-1 ring-accent/10" : "border-secondary"
      )}>
         <div className="flex items-center gap-2 mb-2">
            <Icon className={cn("h-4 w-4", accent ? "text-accent" : green ? "text-green-500" : "text-muted-foreground")} />
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{label}</p>
         </div>
         <p className={cn("text-xl font-bold tracking-tight", green ? "text-green-500" : "")}>{value}</p>
      </div>
   );
}

function DistributionCard({ label, count, percentage, color }: any) {
   return (
      <div className="bg-background border border-secondary rounded-xl p-6 shadow-sm">
         <div className="flex justify-between items-center mb-4">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
            <span className="text-sm font-bold">{count}</span>
         </div>
         <div className="h-2 w-full bg-secondary rounded-full overflow-hidden border border-secondary">
            <div className={cn("h-full transition-all duration-1000", color)} style={{ width: `${percentage}%` }} />
         </div>
      </div>
   );
}
