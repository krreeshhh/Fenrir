"use client"

import { useState, useEffect } from "react";
import {
   BarChart,
   TrendingUp,
   Users,
   ArrowUpRight,
   ShieldCheck,
   Building,
   ShieldAlert,
   Globe,
   Activity,
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

export default function UnitHeadDashboard() {
   const [stats, setStats] = useState({
      headcount: 0,
      projectCount: 0,
      totalRevenue: 0,
      performanceIndex: 0,
      topPerformers: [] as any[],
      recentProjects: [] as any[]
   });
   const [userData, setUserData] = useState<any>(null);
   const [loading, setLoading] = useState(true);
   const [recentMails, setRecentMails] = useState<any[]>([]);
   const [upcomingMeetings, setUpcomingMeetings] = useState<any[]>([]);
   const supabase = createClient();

   useEffect(() => {
      fetchGlobalStats();
   }, []);

   const fetchGlobalStats = async () => {
      setLoading(true);

      try {
         // 1. Initial auth check
         const { data: { user } } = await supabase.auth.getUser();

         const promises = [
            supabase.from('users_metadata').select('*', { count: 'exact', head: true }) as any,
            supabase.from('projects').select('*, manager:manager_id(full_name)').order('created_at', { ascending: false }).limit(4) as any,
            supabase.from('revenue_records').select('amount') as any,
            supabase.from('users_metadata').select('*').order('score', { ascending: false }).limit(6) as any,
            supabase.from('projects').select('completion_percentage') as any
         ];

         // If we have a user, fetch their metadata too
         let userPromise = null;
         if (user) {
            userPromise = supabase.from('users_metadata').select('*').eq('id', user.id).single() as any;
         }

         const results = await Promise.all([...promises, ...(userPromise ? [userPromise] : [])]);

         const [{ count: userCount }, { data: projectsData, count: projCount }, { data: revenueData }, { data: topUsers }, { data: allProjects }] = results;

         if (userPromise) {
            setUserData(results[results.length - 1].data);
         }

         const totalRev = revenueData?.reduce((sum: number, item: any) => sum + Number(item.amount), 0) || 0;

         const avgPerf = allProjects && allProjects.length > 0
            ? Math.round(allProjects.reduce((sum: number, p: any) => sum + Number(p.completion_percentage || 0), 0) / allProjects.length)
            : 0;

         setStats({
            headcount: userCount || 0,
            projectCount: projCount || 0,
            totalRevenue: totalRev,
            performanceIndex: avgPerf,
            topPerformers: topUsers || [],
            recentProjects: projectsData || []
         });

         // Fetch mails and meetings for the unit head user
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
      } catch (error) {
         console.error("Critical System Sync Error:", error);
      } finally {
         setLoading(false);
      }
   };

   if (loading) return <DashboardSkeleton />;

   return (
      <div className="space-y-6 pb-16">

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Projects + Meetings overview */}
            <div className="lg:col-span-2 space-y-6">
               {/* Project Clusters */}
               <div className="space-y-4">
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-2">
                        <Building className="h-5 w-5 text-accent" />
                        <h3 className="text-sm font-bold uppercase tracking-wider">Strategic Portfolio</h3>
                     </div>
                     <button onClick={() => window.location.href = '/unit-head/projects'} className="text-xs font-bold text-accent hover:underline uppercase tracking-wider flex items-center gap-1">
                        View All <ChevronRight className="h-3 w-3" />
                     </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {stats.recentProjects.length === 0 ? (
                        <div className="col-span-2 p-12 bg-secondary/5 border border-dashed border-secondary rounded-xl text-center text-xs font-bold uppercase tracking-wider text-muted-foreground opacity-40">No active nodes detected</div>
                     ) : stats.recentProjects.map(proj => (
                        <div key={proj.id} className="bg-background border border-secondary rounded-xl p-6 shadow-sm hover:border-accent/40 transition-all group">
                           <div className="flex justify-between items-start mb-6">
                              <div>
                                 <h4 className="text-sm font-bold uppercase tracking-tight group-hover:text-accent transition-colors">{proj.name}</h4>
                                 <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mt-1">Lead: {proj.manager?.full_name || "System"}</p>
                              </div>
                              <div className="h-9 w-9 rounded-xl bg-secondary flex items-center justify-center group-hover:bg-accent group-hover:text-white transition-all shadow-sm">
                                 <ArrowUpRight className="h-4 w-4" />
                              </div>
                           </div>
                           <div className="space-y-4">
                              <div className="space-y-2">
                                 <div className="flex justify-between items-center text-[11px] font-bold uppercase tracking-wider">
                                    <span className="text-accent">Sync</span>
                                    <span>{proj.completion_percentage || 0}%</span>
                                 </div>
                                 <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                    <div className="h-full bg-foreground rounded-full transition-all duration-1000" style={{ width: `${proj.completion_percentage || 0}%` }} />
                                 </div>
                              </div>
                              <div className="flex justify-between pt-4 border-t border-secondary/50 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                 <span>Priority</span>
                                 <span className={cn(proj.priority === 'High' ? 'text-red-500' : proj.priority === 'Medium' ? 'text-amber-500' : 'text-green-500')}>{proj.priority || 'Low'}</span>
                              </div>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>

               {/* Meetings Overview */}
               <div className="bg-background border border-secondary rounded-xl shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-secondary flex items-center justify-between">
                     <h3 className="text-sm font-bold flex items-center gap-2"><Video className="h-4 w-4 text-accent" /> Upcoming Meetings</h3>
                     <button onClick={() => window.location.href = '/unit-head/meetings'} className="text-xs font-bold text-accent hover:underline uppercase tracking-wider flex items-center gap-1">
                        View All <ChevronRight className="h-3 w-3" />
                     </button>
                  </div>
                  {upcomingMeetings.length === 0 ? (
                     <div className="p-8 text-center">
                        <Calendar className="h-7 w-7 text-muted-foreground/20 mx-auto mb-2" />
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">No upcoming meetings</p>
                        <button onClick={() => window.location.href = '/unit-head/meetings'} className="mt-2 text-xs font-bold text-accent hover:underline">Schedule one</button>
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

            {/* Right: Performers + Mail overview */}
            <div className="space-y-6">
               {/* Network Matrix */}
               <div className="space-y-4">
                  <div className="flex items-center gap-2">
                     <BarChart className="h-5 w-5 text-accent" />
                     <h3 className="text-sm font-bold uppercase tracking-wider">Performance Matrix</h3>
                  </div>
                  <div className="bg-background border border-secondary rounded-xl divide-y divide-secondary overflow-hidden shadow-sm">
                     {stats.topPerformers.map((m, i) => (
                        <div key={m.id} className="flex items-center justify-between p-4 hover:bg-secondary/10 transition-colors group">
                           <div className="flex items-center gap-3">
                              <span className="text-[10px] font-bold text-muted-foreground/30 w-4">{i + 1}</span>
                              <div className="h-8 w-8 rounded-lg bg-secondary border border-secondary flex items-center justify-center font-bold text-[10px] group-hover:bg-foreground group-hover:text-background transition-all shadow-sm">
                                 {m.full_name[0]}
                              </div>
                              <div className="min-w-0">
                                 <p className="text-xs font-bold uppercase tracking-tight truncate">{m.full_name}</p>
                                 <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mt-0.5 opacity-60 truncate">{m.role?.replace('_', ' ')}</p>
                              </div>
                           </div>
                           <div className="text-right">
                              <p className="text-sm font-bold tracking-tighter text-accent">{m.score?.toLocaleString()}</p>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>

               {/* Mail Overview */}
               <div className="bg-background border border-secondary rounded-xl shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-secondary flex items-center justify-between">
                     <h3 className="text-sm font-bold flex items-center gap-2"><Mail className="h-4 w-4 text-accent" /> Recent Inbox</h3>
                     <button onClick={() => window.location.href = '/unit-head/mail'} className="text-xs font-bold text-accent hover:underline uppercase tracking-wider flex items-center gap-1">
                        Open <ChevronRight className="h-3 w-3" />
                     </button>
                  </div>
                  {recentMails.length === 0 ? (
                     <div className="p-8 text-center">
                        <MessageSquare className="h-7 w-7 text-muted-foreground/20 mx-auto mb-2" />
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">No messages yet</p>
                     </div>
                  ) : (
                     <div className="divide-y divide-secondary">
                        {recentMails.map(mail => (
                           <div key={mail.id} className="p-4 flex items-start gap-3 hover:bg-secondary/10 transition-colors group cursor-pointer" onClick={() => window.location.href = '/unit-head/mail'}>
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

function StatChip({ label, value, icon: Icon, accent = false, green = false }: any) {
   return (
      <div className={cn(
         "bg-background border rounded-xl p-4 shadow-sm flex items-center gap-3",
         accent ? "border-accent/30 bg-accent/5" : green ? "border-green-500/20 bg-green-500/5" : "border-secondary"
      )}>
         <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center shrink-0", accent ? "bg-accent/10" : green ? "bg-green-500/10" : "bg-secondary/50")}>
            <Icon className={cn("h-4 w-4", accent ? "text-accent" : green ? "text-green-500" : "text-muted-foreground")} />
         </div>
         <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{label}</p>
            <p className={cn("text-lg font-black tracking-tight", accent ? "text-accent" : green ? "text-green-500" : "")}>{value}</p>
         </div>
      </div>
   );
}

function AlertItem({ node, issue, risk, color }: any) {
   return (
      <div className="flex items-center gap-4 p-5 hover:bg-secondary/10 transition-colors group">
         <div className={cn("h-10 w-10 rounded-xl bg-secondary/50 border border-secondary flex items-center justify-center transition-all group-hover:bg-accent group-hover:text-white group-hover:border-accent shadow-sm", color)}>
            <ShieldAlert className="h-5 w-5" />
         </div>
         <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
               <p className="text-sm font-bold uppercase tracking-tight truncate">{node}</p>
               <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border bg-background shrink-0", color === 'text-red-500' ? "border-red-500/30" : "border-secondary")}>
                  {risk}
               </span>
            </div>
            <p className="text-xs font-bold text-muted-foreground mt-1 uppercase tracking-wider opacity-60">{issue}</p>
         </div>
      </div>
   );
}
