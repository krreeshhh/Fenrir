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
            <div className="bg-background border border-secondary rounded-lg p-6 flex items-center justify-between">
               <div>
                  <p className="text-xs font-bold text-accent uppercase tracking-widest mb-1">Project Lead</p>
                  <h2 className="text-xl font-bold">{userData?.full_name}</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                     Managing <span className="font-bold text-foreground">{stats.activeProjects.length} active projects</span> · {stats.teamCount} team members
                  </p>
               </div>
               <div className="hidden md:flex items-center gap-6">
                  <div className="text-center">
                     <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Score</p>
                     <p className="text-2xl font-black text-accent">{stats.unitScore.toLocaleString()}</p>
                  </div>
                  <div className="text-center">
                     <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Avg. Progress</p>
                     <p className="text-2xl font-black">{stats.avgCompletion}%</p>
                  </div>
               </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               <QuickStat label="Team Members" value={stats.teamCount} icon={Users} />
               <QuickStat label="Avg Completion" value={`${stats.avgCompletion}%`} icon={CheckCircle2} />
               <QuickStat label="Score" value={stats.unitScore.toLocaleString()} icon={Zap} accent />
               <QuickStat label="Velocity" value={stats.velocity} icon={TrendingUp} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
               {/* Active Projects */}
               <div className="lg:col-span-3 space-y-4">
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-2">
                        <FolderLock className="h-5 w-5 text-accent" />
                        <h3 className="text-lg font-bold">Active Projects</h3>
                     </div>
                     <button className="text-xs font-bold text-accent hover:underline flex items-center gap-1">
                        View All <ChevronRight className="h-4 w-4" />
                     </button>
                  </div>

                  <div className="bg-background border border-secondary rounded-lg divide-y divide-secondary">
                     {stats.activeProjects.map((p, i) => (
                        <div key={p.id} className="flex items-center justify-between p-4 hover:bg-secondary/10 transition-colors group">
                           <div className="flex-1">
                              <p className="text-sm font-bold">{p.name}</p>
                              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">{p.status}</p>
                           </div>
                           <div className="flex items-center gap-4">
                              <div className="w-24 text-right">
                                 <p className="text-xs font-bold mb-1">{Math.round(p.completion_percentage || 0)}%</p>
                                 <div className="h-1.5 w-24 bg-secondary rounded-full overflow-hidden">
                                    <div
                                       className={cn("h-full rounded-full", i % 2 === 0 ? "bg-accent" : "bg-foreground")}
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
                  <div className="flex items-center justify-between pt-2">
                     <div className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-accent" />
                        <h3 className="text-lg font-bold">Lead Rankings</h3>
                     </div>
                     <button className="text-xs font-bold text-accent hover:underline">Full Leaderboard</button>
                  </div>
                  <div className="bg-background border border-secondary rounded-lg divide-y divide-secondary">
                     {stats.leadRankings.map((r, i) => (
                        <div key={r.id} className={cn(
                           "flex items-center justify-between p-4 transition-colors",
                           r.id === userData?.id ? "bg-accent/5 border-l-2 border-l-accent" : "hover:bg-secondary/10"
                        )}>
                           <div className="flex items-center gap-3">
                              <span className="text-sm font-black text-muted-foreground/40 w-6">{i + 1}</span>
                              <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center font-black text-sm">
                                 {r.full_name[0]}
                              </div>
                              <p className="text-sm font-bold">{r.full_name}</p>
                           </div>
                           <span className="text-sm font-black">{r.score.toLocaleString()}</span>
                        </div>
                     ))}
                  </div>
               </div>

               {/* Pending Validations */}
               <div className="space-y-4">
                  <div className="flex items-center gap-2">
                     <CheckCircle2 className="h-5 w-5 text-accent" />
                     <h3 className="text-lg font-bold">Pending Validations</h3>
                  </div>
                  <div className="bg-background border border-secondary rounded-lg divide-y divide-secondary">
                     {stats.pendingValidations.map((v) => (
                        <div key={v.id} className="p-4 hover:bg-secondary/10 transition-colors">
                           <p className="text-sm font-bold truncate">{v.users_metadata?.full_name || "Unknown"}</p>
                           <p className="text-[11px] text-muted-foreground mt-1 truncate">{v.checklists?.title || "Manual Task"}</p>
                           <span className="inline-block mt-2 text-[9px] font-bold text-accent uppercase tracking-widest">Awaiting review</span>
                        </div>
                     ))}
                     {stats.pendingValidations.length === 0 && (
                        <div className="p-6 text-center text-sm text-muted-foreground">
                           All tasks validated.
                        </div>
                     )}
                  </div>
                  <button className="w-full py-3 bg-background border border-secondary rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-accent hover:text-white hover:border-accent transition-all">
                     Review Completions
                  </button>

                  <div className="bg-foreground text-background rounded-lg p-6 text-center">
                     <ShieldCheck className="h-8 w-8 text-accent mx-auto mb-3" />
                     <h5 className="font-bold text-sm">Unit Insights</h5>
                     <p className="text-xs opacity-60 mt-2 leading-relaxed">Unit efficiency is stable. Zero anomalies detected.</p>
                     <button className="mt-4 px-6 py-2.5 bg-accent text-white rounded-lg font-bold text-xs uppercase tracking-widest hover:scale-105 transition-all">
                        View Metrics
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
         "bg-background border rounded-lg p-4 shadow-sm",
         accent ? "border-accent/40" : "border-secondary"
      )}>
         <div className="flex items-center gap-2 mb-2">
            <Icon className={cn("h-4 w-4", accent ? "text-accent" : "text-muted-foreground")} />
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{label}</p>
         </div>
         <p className="text-xl font-black tracking-tight">{value}</p>
      </div>
   );
}
