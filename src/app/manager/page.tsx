"use client"

import { useState, useEffect } from "react";
import {
   BarChart,
   TrendingUp,
   Users,
   CheckCircle2,
   Target,
   Zap,
   DollarSign,
   ArrowUpRight,
   ShieldCheck,
   Briefcase,
   Activity
} from "lucide-react";
import { cn } from "@/utils/cn";
import { createClient } from "@/utils/supabase";
import { DashboardSkeleton } from "@/components/Skeleton";

export default function ManagerDashboard() {
   const [stats, setStats] = useState({
      personnelCount: 0,
      leadCount: 0,
      assetValue: 0,
      topPerformance: 0,
      activeLeads: [] as any[]
   });
   const [userData, setUserData] = useState<any>(null);
   const [loading, setLoading] = useState(true);
   const supabase = createClient();

   useEffect(() => {
      fetchManagerData();
   }, []);

   const fetchManagerData = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: me } = await supabase
         .from('users_metadata')
         .select('*')
         .eq('id', user.id)
         .single();
      setUserData(me);

      const { data: managedProjects } = await supabase
         .from('projects')
         .select('id, name')
         .eq('manager_id', user.id);

      const projectIds = managedProjects?.map(p => p.id) || [];

      // Leads overseeing these projects
      const { data: leadsData } = await supabase
         .from('project_allocations')
         .select(`
            project_lead_id,
            users_metadata!inner (full_name, score, role)
         `)
         .in('project_id', projectIds);

      const uniqueLeads = Array.from(new Map(leadsData?.map(l => [l.project_lead_id, l.users_metadata])).values());

      // Find employees reporting to these projects
      const { data: checklistData } = await supabase
         .from('checklists')
         .select('id')
         .in('project_id', projectIds);
      
      const checklistIds = checklistData?.map(c => c.id) || [];

      const { data: taskAllocations } = await supabase
         .from('checklist_allocations')
         .select('employee_id')
         .in('checklist_id', checklistIds);

      const uniqueEmployees = new Set(taskAllocations?.map(t => t.employee_id));

      // Calculate asset value (from revenue_records)
      const { data: revenueData } = await supabase
         .from('revenue_records')
         .select('amount')
         .in('employee_id', Array.from(uniqueEmployees));

      const totalAsset = revenueData?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;
      const topLeadScore = Math.max(...(uniqueLeads as any[]).map(l => l.score || 0), 0);

      setStats({
         personnelCount: uniqueEmployees.size,
         leadCount: uniqueLeads.length,
         assetValue: totalAsset,
         topPerformance: topLeadScore,
         activeLeads: (uniqueLeads as any[]).sort((a, b) => b.score - a.score).slice(0, 5)
      });

      setLoading(false);
   };

   if (loading) return <DashboardSkeleton />;

   return (
      <div className="space-y-6 pb-16">
         <div className="bg-background border border-secondary rounded-xl p-8 flex items-center justify-between shadow-sm relative overflow-hidden group transition-all">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-150 transition-all duration-700 pointer-events-none">
               <Zap className="h-40 w-40" />
            </div>
            <div>
               <p className="text-[10px] font-black text-accent uppercase tracking-[0.2em] mb-2">MANAGERIAL HUB</p>
               <h2 className="text-2xl font-black uppercase tracking-tight">{userData?.full_name}</h2>
               <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-2 flex items-center gap-2">
                  Overseeing <span className="text-foreground">{stats.personnelCount} personnel nodes</span> <span className="w-1 h-1 rounded-full bg-secondary" /> <span className="text-foreground">{stats.leadCount} project leads</span>
               </p>
            </div>
            <div className="hidden md:flex items-center gap-12">
               <div className="text-right">
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">AGGREGATE ASSET</p>
                  <p className="text-3xl font-black text-accent tracking-tighter">${(stats.assetValue / 1000).toFixed(0)}K</p>
               </div>
               <div className="text-right border-l border-secondary pl-12">
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">EFFICIENCY INDEX</p>
                  <p className="text-3xl font-black text-foreground tracking-tighter">98.4%</p>
               </div>
            </div>
         </div>

         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <QuickStat label="Network Personnel" value={stats.personnelCount} icon={Users} />
            <QuickStat label="Active Leads" value={stats.leadCount} icon={Briefcase} />
            <QuickStat label="Projected Asset" value={`$${(stats.assetValue / 1000).toFixed(0)}K`} icon={DollarSign} accent />
            <QuickStat label="Peak Performance" value={stats.topPerformance.toLocaleString()} icon={TrendingUp} />
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3 space-y-4">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                     <Zap className="h-5 w-5 text-accent" />
                     <h3 className="text-sm font-black uppercase tracking-widest">Lead Performance Matrix</h3>
                  </div>
                  <button className="text-[9px] font-black text-accent hover:underline uppercase tracking-widest">Global Analytics</button>
               </div>

               <div className="bg-background border border-secondary rounded-xl divide-y divide-secondary shadow-sm overflow-hidden">
                  {stats.activeLeads.map((lead, i) => (
                     <div key={i} className="flex items-center justify-between p-5 hover:bg-secondary/10 transition-colors group">
                        <div className="flex items-center gap-4">
                           <span className="text-xs font-black text-muted-foreground/30 w-6">{i + 1}</span>
                           <div className="h-10 w-10 rounded-xl bg-secondary border border-secondary flex items-center justify-center font-black text-xs group-hover:bg-foreground group-hover:text-background transition-all shadow-sm">
                              {lead.full_name[0]}
                           </div>
                           <div>
                              <p className="text-sm font-black uppercase tracking-tight">{lead.full_name}</p>
                              <div className="flex items-center gap-1.5 mt-0.5 opacity-60">
                                 <div className={cn("h-1.5 w-1.5 rounded-full", i === 0 ? "bg-accent shadow-[0_0_8px_rgba(var(--accent),0.5)]" : "bg-muted-foreground/30")} />
                                 <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{i === 0 ? "Peak State" : "Operational"}</p>
                              </div>
                           </div>
                        </div>
                        <div className="text-right">
                           <p className="text-base font-black tracking-tighter text-accent">{lead.score?.toLocaleString()}</p>
                           <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest opacity-40">PERFORMANCE INDEX</p>
                        </div>
                     </div>
                  ))}
                  {stats.activeLeads.length === 0 && (
                     <div className="p-16 text-center text-sm font-black uppercase tracking-widest text-muted-foreground opacity-30">No lead nodes detected in sector</div>
                  )}
               </div>

               <div className="flex items-center gap-2 pt-4">
                  <BarChart className="h-5 w-5 text-accent" />
                  <h3 className="text-sm font-black uppercase tracking-widest">Operational Deployment</h3>
               </div>
               <div className="bg-background border border-secondary rounded-xl p-8 space-y-8 shadow-sm">
                  <DeploymentBar label="Computational Load" usage={82} metrics="SECURE" />
                  <DeploymentBar label="Personnel Payouts" usage={94} metrics="ACTIVE" />
                  <DeploymentBar label="Strategic Assets" usage={45} metrics="OPTIMAL" />
               </div>
            </div>

            <div className="space-y-6">
               <h3 className="text-sm font-black uppercase tracking-widest">Sector Overview</h3>
               <div className="bg-background border border-secondary rounded-xl p-8 space-y-8 shadow-inner shadow-secondary/20">
                  <MetricRow name="Reporting Sector" personnel={stats.personnelCount} progress={92} />
                  <MetricRow name="Lead Command" personnel={stats.leadCount} progress={74} />
               </div>

               <div className="bg-accent text-white rounded-2xl p-8 text-center shadow-2xl shadow-accent/20 relative overflow-hidden group">
                  <div className="absolute -top-4 -right-4 p-8 opacity-10 group-hover:scale-[2] transition-all duration-700 pointer-events-none">
                     <ShieldCheck className="h-24 w-24" />
                  </div>
                  <ShieldCheck className="h-12 w-12 mx-auto mb-4 animate-float" />
                  <h5 className="font-black text-xs uppercase tracking-[0.3em]">Integrity Status</h5>
                  <p className="text-[10px] font-bold opacity-70 mt-3 uppercase tracking-widest">Unit Status: AUTHORIZED</p>
                  <button className="mt-8 w-full py-3.5 bg-background text-foreground rounded-xl font-black text-[10px] uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-xl">
                     COMMAND HISTORY
                  </button>
               </div>
            </div>
         </div>
      </div>
   );
}

function QuickStat({ label, value, icon: Icon, accent = false }: any) {
   return (
      <div className={cn(
         "bg-background border rounded-xl p-5 shadow-sm transition-all hover:scale-[1.02]",
         accent ? "border-accent/40 bg-accent/5" : "border-secondary"
      )}>
         <div className="flex items-center gap-2 mb-2">
            <Icon className={cn("h-4 w-4", accent ? "text-accent" : "text-muted-foreground")} />
            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{label}</p>
         </div>
         <p className="text-2xl font-black tracking-tighter">{value}</p>
      </div>
   );
}

function DeploymentBar({ label, usage, metrics }: any) {
   return (
      <div className="space-y-3">
         <div className="flex justify-between items-center">
            <p className="text-[10px] font-black uppercase tracking-widest">{label}</p>
            <span className="text-[9px] font-black border border-accent/20 text-accent px-2 py-0.5 rounded shadow-sm">{metrics}</span>
         </div>
         <div className="h-2 w-full bg-secondary rounded-full overflow-hidden border border-secondary shadow-inner">
            <div className="h-full bg-foreground rounded-full transition-all duration-1000" style={{ width: `${usage}%` }} />
         </div>
      </div>
   );
}

function MetricRow({ name, personnel, progress }: any) {
   return (
      <div className="space-y-3 pb-8 border-b border-secondary/50 last:border-0 last:pb-0">
         <div className="flex justify-between items-center">
            <p className="text-[10px] font-black uppercase tracking-widest">{name}</p>
            <p className="text-base font-black tracking-tighter">{progress}%</p>
         </div>
         <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden border border-secondary shadow-inner">
            <div className="h-full bg-accent rounded-full" style={{ width: `${progress}%` }} />
         </div>
         <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">{personnel} operational nodes detected</p>
      </div>
   );
}
