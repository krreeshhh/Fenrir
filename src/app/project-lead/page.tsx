"use client"

import { useState, useEffect } from "react";
import {
   BarChart3,
   TrendingUp,
   Users,
   CheckCircle2,
   Target,
   Zap,
   ShieldCheck,
   ChevronRight,
   Plus,
   ArrowUpRight,
   FolderLock,
   Activity
} from "lucide-react";
import { cn } from "@/utils/cn";
import { createClient } from "@/utils/supabase";
import { DashboardSkeleton } from "@/components/Skeleton";

export default function ProjectLeadDashboard() {
   const [stats, setStats] = useState({
      activeProjects: [] as any[],
      pendingValidations: [] as any[],
      teamCount: 0,
      unitScore: 0,
      velocity: "+12%",
      avgCompletion: 0,
      leadRankings: [] as any[]
   });
   const [userData, setUserData] = useState<any>(null);
   const [loading, setLoading] = useState(true);
   const supabase = createClient();

   useEffect(() => {
      fetchLeadData();
   }, []);

   const fetchLeadData = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: me } = await supabase
         .from('users_metadata')
         .select('*')
         .eq('id', user.id)
         .single();
      setUserData(me);

      const { data: allocations } = await supabase
         .from('project_allocations')
         .select(`
          project_id,
          projects (
            id,
            name,
            completion_percentage,
            status
          )
        `)
         .eq('project_lead_id', user.id);

      const overseeingProjects = allocations?.map((a: any) => Array.isArray(a.projects) ? a.projects[0] : a.projects).filter(Boolean) || [];
      const projectIds = overseeingProjects.map((p: any) => p.id);

      const { data: teamData } = await supabase
         .from('checklist_allocations')
         .select(`employee_id, checklists!inner (project_id)`)
         .in('checklists.project_id', projectIds);

      const uniqueEmployees = new Set(teamData?.map((t: any) => t.employee_id));

      const { data: pending } = await supabase
         .from('checklist_allocations')
         .select(`
          id, created_at,
          users_metadata (full_name),
          checklists!inner (title, project_id)
        `)
         .in('checklists.project_id', projectIds)
         .eq('verified', false)
         .limit(5);

      const { data: ranks } = await supabase
         .from('users_metadata')
         .select('*')
         .eq('role', 'project_lead')
         .order('score', { ascending: false })
         .limit(5);

      const avgComp = overseeingProjects.length > 0
         ? Math.round(overseeingProjects.reduce((sum, p) => sum + Number(p.completion_percentage), 0) / overseeingProjects.length)
         : 0;

      setStats({
         activeProjects: overseeingProjects,
         pendingValidations: pending || [],
         teamCount: uniqueEmployees.size,
         unitScore: me?.score || 0,
         velocity: "+14%",
         avgCompletion: avgComp,
         leadRankings: ranks || []
      });

      setLoading(false);
   };

   if (loading) return <DashboardSkeleton />;

   return (

      <div className="space-y-6 pb-16">

         {/* Welcome Banner */}
         <div className="bg-background border border-secondary rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
            <div className="text-center sm:text-left">
               <p className="text-xs font-bold text-accent uppercase tracking-wider mb-1">Project Lead</p>
               <h2 className="text-xl font-bold">{userData?.full_name}</h2>
               <p className="text-sm text-muted-foreground mt-1 text-center sm:text-left">
                  Managing <span className="font-bold text-foreground">{stats.activeProjects.length} active projects</span> · {stats.teamCount} team members
               </p>
            </div>
            <div className="flex items-center gap-8 sm:gap-12 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 sm:border-l border-secondary pt-6 sm:pt-0 sm:pl-12">
               <div className="text-left sm:text-right">
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Score</p>
                  <p className="text-2xl font-bold text-accent">{stats.unitScore.toLocaleString()}</p>
               </div>
               <div className="text-right">
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Avg. Progress</p>
                  <p className="text-2xl font-bold">{stats.avgCompletion}%</p>
               </div>
            </div>
         </div>

         {/* Stats Row */}
         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <QuickStat title="Team Members" value={stats.teamCount} icon={Users} />
            <QuickStat title="Avg Completion" value={`${stats.avgCompletion}%`} icon={CheckCircle2} />
            <QuickStat title="Score" value={stats.unitScore.toLocaleString()} icon={Zap} highlight />
            <QuickStat title="Velocity" value={stats.velocity} icon={TrendingUp} />
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Active Projects */}
            <div className="lg:col-span-3 space-y-4">
               <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                     <div className="h-10 w-10 bg-accent/10 rounded-xl flex items-center justify-center border border-accent/20">
                        <FolderLock className="h-5 w-5 text-accent" />
                     </div>
                     <div>
                        <h3 className="text-xl font-bold tracking-tight">Active Projects</h3>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-0.5">Assigned Clusters</p>
                     </div>
                  </div>
                  <button onClick={() => window.location.href = '/project-lead/projects-allocated'} className="text-xs font-bold text-accent hover:underline flex items-center gap-1">
                     View All <ChevronRight className="h-3 w-3" />
                  </button>
               </div>

               <div className="bg-background border border-secondary rounded-xl divide-y divide-secondary shadow-sm">
                  {stats.activeProjects.map((p, i) => (
                     <div key={p.id} className="flex items-center justify-between p-5 hover:bg-secondary/10 transition-colors group">
                        <div className="flex-1">
                           <p className="text-sm font-bold">{p.name}</p>
                           <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">{p.status}</p>
                        </div>
                        <div className="flex items-center gap-4">
                           <div className="w-24 text-right">
                              <p className="text-xs font-bold mb-1">{Math.round(p.completion_percentage || 0)}%</p>
                              <div className="h-1.5 w-24 bg-secondary rounded-full overflow-hidden">
                                 <div
                                    className={cn("h-full rounded-full transition-all duration-1000", i % 2 === 0 ? "bg-accent" : "bg-foreground")}
                                    style={{ width: `${Math.round(p.completion_percentage || 0)}%` }}
                                 />
                              </div>
                           </div>
                           <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center group-hover:bg-accent group-hover:text-white transition-all">
                              <ArrowUpRight className="h-4 w-4" />
                           </div>
                        </div>
                     </div>
                  ))}
                  {stats.activeProjects.length === 0 && (
                     <div className="p-8 text-center text-sm text-muted-foreground">
                        No active projects assigned.
                     </div>
                  )}
               </div>

               {/* Lead Rankings */}
               <div className="flex items-center justify-between pt-6 mb-4">
                  <div className="flex items-center gap-3">
                     <Zap className="h-5 w-5 text-accent" />
                     <h3 className="text-lg font-bold">Lead Rankings</h3>
                  </div>
                  <button onClick={() => window.location.href = '/project-lead/leads-leaderboard'} className="text-xs font-bold text-accent hover:underline">Full Leaderboard</button>
               </div>
               <div className="bg-background border border-secondary rounded-xl divide-y divide-secondary shadow-sm overflow-hidden">
                  {stats.leadRankings.map((r, i) => (
                     <div key={r.id} className={cn(
                        "flex items-center justify-between p-4 transition-colors",
                        r.id === userData?.id ? "bg-accent/5" : "hover:bg-secondary/10"
                     )}>
                        <div className="flex items-center gap-4">
                           <span className="text-xs font-bold text-muted-foreground/30 w-6 text-center">{i + 1}</span>
                           <div className="h-10 w-10 rounded-lg bg-secondary border border-secondary flex items-center justify-center font-bold text-sm shadow-sm group-hover:bg-foreground group-hover:text-background transition-all">
                              {r.full_name[0]}
                           </div>
                           <div>
                              <p className="text-sm font-bold">{r.full_name}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{r.id === userData?.id ? "You" : "Lead"}</p>
                           </div>
                        </div>
                        <span className="text-lg font-bold text-accent pr-2">{r.score.toLocaleString()}</span>
                     </div>
                  ))}
               </div>
            </div>

            {/* Pending Validations */}
            <div className="space-y-6 lg:pt-0 pt-6">
               <h3 className="text-lg font-bold flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-accent" /> Pending Validations</h3>
               <div className="bg-background border border-secondary rounded-xl divide-y divide-secondary shadow-sm">
                  {stats.pendingValidations.map((v) => (
                     <div key={v.id} className="p-5 hover:bg-secondary/10 transition-colors">
                        <p className="text-sm font-bold truncate">{v.users_metadata?.full_name || "Unknown"}</p>
                        <p className="text-xs text-muted-foreground mt-1 truncate">{v.checklists?.title || "Manual Task"}</p>
                        <span className="inline-block mt-3 text-[11px] font-bold text-accent uppercase tracking-wider px-2 py-0.5 rounded-md bg-accent/10 border border-accent/20">Awaiting review</span>
                     </div>
                  ))}
                  {stats.pendingValidations.length === 0 && (
                     <div className="p-8 text-center text-sm font-bold text-muted-foreground opacity-50">
                        All tasks validated.
                     </div>
                  )}
               </div>
               <button onClick={() => window.location.href = '/project-lead/checklist-completion'} className="w-full py-3 bg-secondary/30 border border-secondary hover:border-accent rounded-xl text-xs font-bold uppercase tracking-wider transition-all">
                  Review Completions
               </button>

               <div className="bg-accent/10 border border-accent/20 text-foreground rounded-xl p-6 text-center relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:scale-150 transition-all duration-700">
                     <ShieldCheck className="h-32 w-32" />
                  </div>
                  <ShieldCheck className="h-8 w-8 text-accent mx-auto mb-3 relative z-10" />
                  <h5 className="font-bold text-sm">Unit Insights</h5>
                  <p className="text-xs opacity-70 mt-2 font-medium">Unit efficiency is stable. Zero anomalies detected.</p>
                  <button onClick={() => window.location.href = '/project-lead/projects-allocated'} className="mt-4 w-full py-2.5 bg-background border border-secondary text-foreground rounded-lg font-bold text-xs uppercase tracking-wider hover:border-accent transition-all">
                     View Metrics
                  </button>
               </div>
            </div>
         </div>
      </div>

   );
}

function QuickStat({ title, value, icon: Icon, highlight = false }: any) {
   return (
      <div className={cn(
         "bg-background border rounded-lg p-4 shadow-sm transition-all group",
         highlight ? "border-accent/40" : "border-secondary hover:border-accent/30"
      )}>
         <div className="flex items-center justify-between mb-3">
            <div className={cn(
               "p-2 rounded-lg border",
               highlight ? "bg-accent/10 border-accent text-accent" : "bg-secondary/50 border-secondary text-muted-foreground"
            )}>
               <Icon className="h-4 w-4" />
            </div>
         </div>
         <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">{title}</p>
         <p className="text-xl font-bold tracking-tight">{value}</p>
      </div>
   );
}
