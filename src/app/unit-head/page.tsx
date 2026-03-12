"use client"

import { useState, useEffect } from "react";
import {
   BarChart,
   TrendingUp,
   Users,
   CheckCircle2,
   Target,
   DollarSign,
   ArrowUpRight,
   ShieldCheck,
   Building,
   ShieldAlert,
   Globe,
   Activity,
   Zap
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
   const supabase = createClient();

   useEffect(() => {
      fetchGlobalStats();
   }, []);

   const fetchGlobalStats = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
         const { data: me } = await supabase
            .from('users_metadata')
            .select('*')
            .eq('id', user.id)
            .single();
         setUserData(me);
      }

      const { count: userCount } = await supabase
         .from('users_metadata')
         .select('*', { count: 'exact', head: true });

      const { data: projectsData, count: projCount } = await supabase
         .from('projects')
         .select('*, manager:manager_id(full_name)')
         .order('created_at', { ascending: false })
         .limit(4);

      const { data: revenueData } = await supabase
         .from('revenue_records')
         .select('amount');

      const totalRev = revenueData?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;

      const { data: topUsers } = await supabase
         .from('users_metadata')
         .select('*')
         .order('score', { ascending: false })
         .limit(6);

      const { data: allProjects } = await supabase
         .from('projects')
         .select('completion_percentage');

      const avgPerf = allProjects && allProjects.length > 0
         ? Math.round(allProjects.reduce((sum, p) => sum + Number(p.completion_percentage || 0), 0) / allProjects.length)
         : 0;

      setStats({
         headcount: userCount || 0,
         projectCount: projCount || 0,
         totalRevenue: totalRev,
         performanceIndex: avgPerf,
         topPerformers: topUsers || [],
         recentProjects: projectsData || []
      });

      setLoading(false);
   };

   if (loading) return <DashboardSkeleton />;

   return (
      <div className="space-y-6 pb-16">
         {/* Executive Banner */}
         <div className="bg-background border border-secondary rounded-xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between shadow-sm relative overflow-hidden group gap-6">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-150 transition-all duration-700 pointer-events-none">
               <Globe className="h-40 w-40 text-accent" />
            </div>
            <div className="text-center sm:text-left z-10">
               <p className="text-xs font-bold text-accent uppercase tracking-wider mb-2">Executive Command Node</p>
               <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-tight">{userData?.full_name || "Organization Head"}</h2>
               <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-4 flex flex-wrap items-center justify-center sm:justify-start gap-4">
                  <div className="flex items-center gap-2">Nodes: <span className="text-foreground">{stats.headcount}</span></div>
                  <span className="hidden sm:block w-1.5 h-1.5 rounded-full bg-secondary" />
                  <div className="flex items-center gap-2">Projects: <span className="text-foreground">{stats.projectCount} Strategic</span></div>
               </div>
            </div>
            <div className="flex items-center gap-8 sm:gap-12 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 sm:border-l border-secondary pt-6 sm:pt-0 sm:pl-12 z-10">
               <div className="text-left sm:text-right">
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">PERFORMANCE</p>
                  <p className="text-2xl sm:text-3xl font-bold text-accent tracking-tighter">{stats.performanceIndex}%</p>
               </div>
               <div className="text-left sm:text-right">
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">VALUATION</p>
                  <p className="text-2xl sm:text-3xl font-bold text-white tracking-tighter">${(stats.totalRevenue / 1000).toFixed(0)}K</p>
               </div>
               <div className="text-right">
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">HEALTH</p>
                  <span className="inline-flex items-center gap-2 px-2.5 py-1 bg-green-500/10 text-green-500 rounded-lg border border-green-500/20 font-bold text-[11px] uppercase tracking-wider leading-none">
                     <ShieldCheck className="h-3 w-3" /> Secure
                  </span>
               </div>
            </div>
         </div>


         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
               {/* Project Clusters */}
               <div className="space-y-4">
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-2">
                        <Building className="h-5 w-5 text-accent" />
                        <h3 className="text-sm font-bold uppercase tracking-wider">Strategic Portfolio Nodes</h3>
                     </div>
                     <button onClick={() => window.location.href = '/unit-head/projects'} className="text-xs font-bold text-accent hover:underline uppercase tracking-wider">View Portfolio</button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {stats.recentProjects.length === 0 ? (
                        <div className="col-span-2 p-12 bg-secondary/5 border border-dashed border-secondary rounded-xl text-center text-xs font-bold uppercase tracking-wider text-muted-foreground opacity-40">No active nodes detected</div>
                     ) : stats.recentProjects.map(proj => (
                        <div key={proj.id} className="bg-background border border-secondary rounded-xl p-6 shadow-sm hover:border-accent/40 shadow-accent/5 transition-all group">
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
                                    <span className="text-accent">Synchronization</span>
                                    <span>{proj.completion_percentage || 0}%</span>
                                 </div>
                                 <div className="h-2 w-full bg-secondary rounded-full overflow-hidden border border-secondary shadow-inner">
                                    <div className="h-full bg-foreground rounded-full transition-all duration-1000" style={{ width: `${proj.completion_percentage || 0}%` }} />
                                 </div>
                              </div>
                              <div className="flex justify-between pt-4 border-t border-secondary/50 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                 <span>System Priority</span>
                                 <span className={cn("text-foreground", proj.priority === 'High' ? 'text-red-500 font-bold' : proj.priority === 'Medium' ? 'text-amber-500 font-bold' : 'text-green-500 font-bold')}>{proj.priority || 'Low'}</span>
                              </div>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            </div>

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

               <div className="bg-background border border-secondary rounded-xl shadow-sm overflow-hidden p-6 flex flex-col items-center justify-center text-center space-y-3">
                  <ShieldCheck className="h-8 w-8 text-accent opacity-20" />
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Security Protocol</p>
                  <p className="text-[11px] font-bold opacity-70">All system nodes are currently synchronized.</p>
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
