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
         .select('*, managers:manager_id(full_name)')
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

      setStats({
         headcount: userCount || 0,
         projectCount: projCount || 0,
         totalRevenue: totalRev,
         topPerformers: topUsers || [],
         recentProjects: projectsData || []
      });

      setLoading(false);
   };

   if (loading) return <DashboardSkeleton />;

   return (
      <div className="space-y-6 pb-16">
         {/* Executive Banner */}
         <div className="bg-background border border-secondary rounded-xl p-8 flex items-center justify-between shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-150 transition-all duration-700 pointer-events-none">
               <Globe className="h-40 w-40 text-accent" />
            </div>
            <div>
               <p className="text-[10px] font-black text-accent uppercase tracking-[0.2em] mb-2">Executive Command Node</p>
               <h2 className="text-2xl font-black uppercase tracking-tight">{userData?.full_name || "Organization Head"}</h2>
               <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-2 flex items-center gap-2">
                  Overseeing <span className="text-foreground">{stats.headcount} active nodes</span> <span className="w-1 h-1 rounded-full bg-secondary" /> <span className="text-foreground">{stats.projectCount} strategic projects</span>
               </p>
            </div>
            <div className="hidden md:flex items-center gap-12">
               <div className="text-right">
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">TOTAL VALUATION</p>
                  <p className="text-3xl font-black text-accent tracking-tighter">${(stats.totalRevenue / 1000).toFixed(0)}K</p>
               </div>
               <div className="text-right border-l border-secondary pl-12">
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">NETWORK HEALTH</p>
                  <span className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/10 text-green-500 rounded-lg border border-green-500/20 font-black text-[10px] uppercase tracking-widest">
                     <ShieldCheck className="h-3 w-3" /> Secure
                  </span>
               </div>
            </div>
         </div>

         {/* Stats Grid */}
         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <QuickStat label="Network Nodes" value={stats.headcount} icon={Users} />
            <QuickStat label="Active Units" value={stats.projectCount} icon={Target} accent />
            <QuickStat label="Asset Valuation" value={`$${(stats.totalRevenue / 1000000).toFixed(1)}M`} icon={DollarSign} />
            <QuickStat label="Performance Index" value="98.4%" icon={TrendingUp} green />
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3 space-y-6">
               {/* Project Clusters */}
               <div className="space-y-4">
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-2">
                        <Building className="h-5 w-5 text-accent" />
                        <h3 className="text-sm font-black uppercase tracking-widest">Strategic Portfolio Nodes</h3>
                     </div>
                     <button className="text-[10px] font-black text-accent hover:underline uppercase tracking-widest">View Portfolio</button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {stats.recentProjects.length === 0 ? (
                        <div className="col-span-2 p-12 bg-secondary/5 border border-dashed border-secondary rounded-xl text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-40">No active nodes detected</div>
                     ) : stats.recentProjects.map(proj => (
                        <div key={proj.id} className="bg-background border border-secondary rounded-xl p-6 shadow-sm hover:border-accent/40 shadow-accent/5 transition-all group">
                           <div className="flex justify-between items-start mb-6">
                              <div>
                                 <h4 className="text-sm font-black uppercase tracking-tight group-hover:text-accent transition-colors">{proj.name}</h4>
                                 <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Lead: {proj.managers?.full_name || "System"}</p>
                              </div>
                              <div className="h-9 w-9 rounded-xl bg-secondary flex items-center justify-center group-hover:bg-accent group-hover:text-white transition-all shadow-sm">
                                 <ArrowUpRight className="h-4 w-4" />
                              </div>
                           </div>
                           <div className="space-y-4">
                              <div className="space-y-2">
                                 <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                                    <span className="text-accent">Synchronization</span>
                                    <span>{proj.completion_percentage || 0}%</span>
                                 </div>
                                 <div className="h-2 w-full bg-secondary rounded-full overflow-hidden border border-secondary shadow-inner">
                                    <div className="h-full bg-foreground rounded-full transition-all duration-1000" style={{ width: `${proj.completion_percentage || 0}%` }} />
                                 </div>
                              </div>
                              <div className="flex justify-between pt-4 border-t border-secondary/50 text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                                 <span>Capital Allocation</span>
                                 <span className="text-foreground">$120K</span>
                              </div>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>

               {/* Network Matrix */}
               <div className="space-y-4 pt-4">
                  <div className="flex items-center gap-2">
                     <BarChart className="h-5 w-5 text-accent" />
                     <h3 className="text-sm font-black uppercase tracking-widest">High-Performance Matrix</h3>
                  </div>
                  <div className="bg-background border border-secondary rounded-xl divide-y divide-secondary overflow-hidden shadow-sm">
                     {stats.topPerformers.map((m, i) => (
                        <div key={m.id} className="flex items-center justify-between p-5 hover:bg-secondary/10 transition-colors group">
                           <div className="flex items-center gap-4">
                              <span className="text-xs font-black text-muted-foreground/30 w-6">{i + 1}</span>
                              <div className="h-10 w-10 rounded-xl bg-secondary border border-secondary flex items-center justify-center font-black text-xs group-hover:bg-foreground group-hover:text-background transition-all shadow-sm">
                                 {m.full_name[0]}
                              </div>
                              <div>
                                 <p className="text-sm font-black uppercase tracking-tight">{m.full_name}</p>
                                 <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mt-0.5 opacity-60">{m.role?.replace('_', ' ')} unit</p>
                              </div>
                           </div>
                           <div className="text-right">
                              <p className="text-base font-black tracking-tighter text-accent">{m.score?.toLocaleString()}</p>
                              <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest opacity-40">SYSTEM SCORE</p>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            </div>

            <div className="space-y-6">
               <h3 className="text-sm font-black uppercase tracking-widest">Protocol Alerts</h3>
               <div className="bg-background border border-secondary rounded-xl divide-y divide-secondary shadow-sm overflow-hidden">
                  <AlertItem node="Orion System" issue="Timeline Variance" risk="Moderate" color="text-yellow-500" />
                  <AlertItem node="Asset Node 04" issue="Operational Spike" risk="Critical" color="text-red-500" />
                  <AlertItem node="Security Link" issue="Protocol Manual Sync" risk="Manual" color="text-blue-500" />
               </div>
               
               <div className="bg-foreground text-background rounded-2xl p-8 text-center shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-150 transition-transform duration-700">
                     <Zap className="h-20 w-20 text-accent" />
                  </div>
                  <Globe className="h-12 w-12 mx-auto mb-4 animate-float text-accent" />
                  <h5 className="font-black text-xs uppercase tracking-[0.3em]">Global Index</h5>
                  <p className="text-3xl font-black mt-3 text-white tracking-tighter">TOP 1%</p>
                  <p className="text-[9px] font-bold opacity-60 mt-4 uppercase tracking-widest leading-relaxed">Unit Performance exceeds 99% of organizational benchmarks.</p>
                  <button className="mt-8 w-full py-4 bg-accent text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-accent/20 hover:scale-105 active:scale-95 transition-all">
                     Download Briefing
                  </button>
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
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{label}</p>
         </div>
         <p className={cn("text-xl font-black tracking-tight", green ? "text-green-500" : "")}>{value}</p>
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
               <p className="text-sm font-black uppercase tracking-tight truncate">{node}</p>
               <span className={cn("text-[8px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded border bg-background shrink-0", color === 'text-red-500' ? "border-red-500/30" : "border-secondary")}>
                  {risk}
               </span>
            </div>
            <p className="text-[10px] font-bold text-muted-foreground mt-1 uppercase tracking-widest opacity-60">{issue}</p>
         </div>
      </div>
   );
}
