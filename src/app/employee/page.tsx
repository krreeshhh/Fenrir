"use client"

import { useState, useEffect } from "react";
import { DashboardSkeleton } from "@/components/Skeleton";

import {
   BarChart3,
   TrendingUp,
   CheckCircle2,
   ShieldCheck,
   Activity,
   Globe,
   Cpu,
   Layers,
   Clock,
   Zap,
   ArrowRight,
   Star,
   Target
} from "lucide-react";
import { cn } from "@/utils/cn";
import { createClient } from "@/utils/supabase";
import { useRouter } from "next/navigation";

export default function EmployeeDashboard() {
   const [userData, setUserData] = useState<any>(null);
   const [stats, setStats] = useState({
      tasksCount: 0,
      ongoingProjects: 0,
      finishedProjects: 0,
      rank: 0,
      score: 0
   });
   const [projects, setProjects] = useState<any[]>([]);
   const [completedTasks, setCompletedTasks] = useState<string[]>([]);
   const [loading, setLoading] = useState(true);
   const router = useRouter();
   const supabase = createClient();

   useEffect(() => {
      fetchDashboardData();
   }, []);

   const fetchDashboardData = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: metadata } = await supabase
         .from('users_metadata')
         .select('*')
         .eq('id', user.id)
         .single();

      if (metadata) {
         setUserData(metadata);
      }

      // Fetch projects/tasks for the Kanban
      const { data: allocations, error: allocError } = await supabase
         .from('checklist_allocations')
         .select(`
            id,
            status,
            checklists (
               id,
               title,
               projects (
                  id,
                  name,
                  description,
                  deadline,
                  priority
               )
            )
         `)
         .eq('employee_id', user.id);

      if (!allocError && allocations) {
         const pMap: Record<string, any> = {};
         const completedIds: string[] = [];

         allocations.forEach((alloc: any) => {
            const checklist = Array.isArray(alloc.checklists) ? alloc.checklists[0] : alloc.checklists;
            const project = Array.isArray(checklist?.projects) ? checklist.projects[0] : checklist?.projects;

            if (!project?.id) return;
            if (!pMap[project.id]) {
               pMap[project.id] = { ...project, tasks: [] };
            }
            pMap[project.id].tasks.push({ id: alloc.id, status: alloc.status });
            if (alloc.status === 'completed') completedIds.push(alloc.id);
         });

         const projectList = Object.values(pMap);
         setProjects(projectList);
         setCompletedTasks(completedIds);

         // Calculate project-level stats
         let ongoing = 0;
         let finished = 0;
         projectList.forEach((p: any) => {
            const done = p.tasks.filter((t: any) => t.status === 'completed').length;
            const total = p.tasks.length;
            if (done > 0 && done < total) ongoing++;
            if (done === total && total > 0) finished++;
         });

         const { count: revenueCount } = await supabase
            .from('revenue_records')
            .select('*', { count: 'exact', head: true })
            .eq('employee_id', user.id);

         const { data: rankData } = await supabase
            .from('users_metadata')
            .select('id, score')
            .eq('role', 'employee')
            .order('score', { ascending: false });

         const myRank = (rankData && user)
            ? rankData.findIndex(r => r.id === user.id) + 1
            : 0;

         setStats({
            tasksCount: allocations.length,
            ongoingProjects: ongoing,
            finishedProjects: finished,
            rank: myRank,
            score: metadata?.score || 0
         });
      }

      setLoading(false);
   };

   if (loading) return <DashboardSkeleton />;

   return (

      <div className="space-y-6 pb-16">

         {/* Stats Row */}
         <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <StatCard title="Ongoing Projects" value={stats.ongoingProjects} icon={Activity} highlight={true} />
            <StatCard title="Active Tasks" value={stats.tasksCount} icon={Layers} highlight={false} />
            <StatCard title="Global Rank" value={`#${stats.rank}`} icon={Star} highlight={false} />
         </div>

         {/* Project Kanban Board */}
         <div className="pt-4">
            <div className="flex items-center justify-between mb-8">
               <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-accent/10 rounded-xl flex items-center justify-center border border-accent/20">
                     <Target className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                     <h3 className="text-xl font-bold uppercase tracking-tight">Mission Control</h3>
                     <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-0.5">Live Operational Status</p>
                  </div>
               </div>
               <button
                  onClick={() => router.push('/employee/checklist')}
                  className="px-6 py-3 bg-secondary/30 hover:bg-secondary rounded-xl text-xs font-bold uppercase tracking-wider border border-secondary/50 transition-all flex items-center gap-2"
               >
                  View Detailed Checklist <ArrowRight className="h-3 w-3" />
               </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               <KanbanColumn
                  title="Newly Allocated"
                  icon={<Zap className="h-4 w-4 text-accent" />}
                  projects={projects.filter(p => p.tasks.every((t: any) => t.status !== 'completed'))}
                  completedIds={completedTasks}
               />
               <KanbanColumn
                  title="Ongoing Operations"
                  icon={<Activity className="h-4 w-4 text-amber-500" />}
                  projects={projects.filter(p => {
                     const done = p.tasks.filter((t: any) => t.status === 'completed').length;
                     return done > 0 && done < p.tasks.length;
                  })}
                  completedIds={completedTasks}
               />
               <KanbanColumn
                  title="Successful Sync"
                  icon={<CheckCircle2 className="h-4 w-4 text-green-500" />}
                  projects={projects.filter(p => p.tasks.every((t: any) => t.status === 'completed'))}
                  completedIds={completedTasks}
               />
            </div>
         </div>
      </div>

   );
}

function KanbanColumn({ title, icon, projects, completedIds }: any) {
   const router = useRouter();
   return (
      <div className="space-y-6">
         <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
               {icon}
               <h3 className="text-xs font-bold uppercase tracking-wider">{title}</h3>
            </div>
            <span className="text-xs font-bold bg-secondary/50 border border-secondary px-2 py-0.5 rounded-md">{projects.length}</span>
         </div>
         <div className="space-y-4">
            {projects.length === 0 ? (
               <div className="h-32 flex items-center justify-center border-2 border-dashed border-secondary/30 rounded-2xl bg-secondary/5">
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider opacity-40">Zero Latency Zone</p>
               </div>
            ) : projects.map((p: any) => {
               const done = p.tasks.filter((t: any) => completedIds.includes(t.id)).length;
               const total = p.tasks.length;
               const perc = Math.round((done / total) * 100);

               return (
                  <div
                     key={p.id}
                     onClick={() => router.push('/employee/checklist')}
                     className="bg-background border border-secondary/60 rounded-2xl p-5 hover:border-accent hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all cursor-pointer group active:scale-95"
                  >
                     <div className="flex justify-between items-start mb-4">
                        <div className={cn(
                           "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border",
                           p.priority === 'High' ? "text-red-500 border-red-500/20 bg-red-500/5" :
                              p.priority === 'Medium' ? "text-amber-500 border-amber-500/20 bg-amber-500/5" :
                                 "text-green-500 border-green-500/20 bg-green-500/5"
                        )}>
                           {p.priority}
                        </div>
                        <span className="text-[11px] font-bold text-muted-foreground uppercase">{done}/{total} Nodes</span>
                     </div>
                     <h4 className="text-sm font-bold uppercase tracking-tight group-hover:text-accent transition-colors leading-tight mb-4">{p.name}</h4>
                     <div className="space-y-2">
                        <div className="h-1 w-full bg-secondary rounded-full overflow-hidden">
                           <div className="h-full bg-accent transition-all duration-1000" style={{ width: `${perc}%` }} />
                        </div>
                        <div className="flex items-center justify-between text-[10px] font-bold uppercase text-muted-foreground">
                           <span>{perc}% SYNCED</span>
                           <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-accent" />
                              {new Date(p.deadline).toLocaleDateString()}
                           </div>
                        </div>
                     </div>
                  </div>
               );
            })}
         </div>
      </div>
   );
}

function StatCard({ title, value, icon: Icon, highlight = false }: any) {
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
