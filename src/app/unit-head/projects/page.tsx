"use client"

import { useState, useEffect } from "react";
import { Globe, Target, Zap, Activity, ArrowUpRight, DollarSign, Layers, Loader2, ShieldCheck, ShieldAlert } from "lucide-react";
import { cn } from "@/utils/cn";
import { createClient } from "@/utils/supabase";

export default function ProjectsOverviewPage() {
   const [projects, setProjects] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);
   const [errorMsg, setErrorMsg] = useState<string | null>(null);
   const supabase = createClient();

   useEffect(() => {
      fetchProjects();
   }, []);

   const fetchProjects = async () => {
      setLoading(true);
      setErrorMsg(null);
      try {
         // 1. Parallel Fetch of Projects and Allocations
         const [projectsRes, allocationsRes] = await Promise.all([
            supabase
               .from('projects')
               .select('*')
               .order('created_at', { ascending: false }) as any,
            supabase
               .from('checklist_allocations')
               .select('employee_id, checklists!inner(project_id)') as any
         ]);

         const { data: projectsData, error: projError } = projectsRes;
         const { data: allocations, error: allocError } = allocationsRes;

         if (projError) throw projError;
         if (allocError) console.error("Allocations Fetch Error:", allocError);

         if (!projectsData || projectsData.length === 0) {
            setProjects([]);
            setLoading(false);
            return;
         }

         // 2. Fetch User Metadata (Managers and Leads) based on projects fetched
         const userIds = new Set<string>();
         projectsData.forEach((p: any) => {
            if (p.manager_id) userIds.add(p.manager_id);
            if (p.project_lead_id) userIds.add(p.project_lead_id);
         });

         let userMap = new Map();
         if (userIds.size > 0) {
            const { data: users } = await supabase
               .from('users_metadata')
               .select('id, full_name')
               .in('id', Array.from(userIds));
            userMap = new Map((users || []).map(u => [u.id, u]));
         }

         // 3. Combine data
         const processedProjects = projectsData.map((proj: any) => {
            const teamNodesCount = new Set(
               (allocations || [])
                  .filter((a: any) => a.checklists?.project_id === proj.id)
                  .map((a: any) => a.employee_id)
            ).size;

            return {
               ...proj,
               manager: userMap.get(proj.manager_id),
               lead: userMap.get(proj.project_lead_id),
               teamSize: teamNodesCount
            };
         });

         setProjects(processedProjects);
      } catch (err: any) {
         console.error("Global Portfolio Fetch Error:", err);
         setErrorMsg(err.message || "Protocol synchronization failed.");
      } finally {
         setLoading(false);
      }
   };

   if (loading) return (
      <div className="flex h-[60vh] items-center justify-center">
         <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
   );

   return (
      <div className="space-y-6 pb-16">
         {/* Strategic Banner */}
         {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 text-red-500">
               <ShieldAlert className="h-5 w-5" />
               <p className="text-sm font-bold uppercase tracking-wider">{errorMsg}</p>
            </div>
         )}
         <div className="bg-background border border-secondary rounded-xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between shadow-sm relative overflow-hidden group gap-6">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-150 transition-all duration-700 pointer-events-none">
               <Layers className="h-40 w-40 text-accent" />
            </div>
            <div className="text-center sm:text-left z-10">
               <p className="text-xs font-bold text-accent uppercase tracking-wider mb-2">Portfolio Registry</p>
               <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-tight">Project Overview</h2>
            </div>
            <div className="flex items-center gap-8 sm:gap-12 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 sm:border-l border-secondary pt-6 sm:pt-0 sm:pl-12 z-10">
               <div className="text-left sm:text-right">
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">TOTAL NODES</p>
                  <p className="text-2xl sm:text-3xl font-bold text-accent tracking-tighter">{projects.length}</p>
               </div>
               <div className="text-right">
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">SYSTEM STATUS</p>
                  <span className="inline-flex items-center gap-2 px-2.5 py-1 bg-green-500/10 text-green-500 rounded-lg border border-green-500/20 font-bold text-[11px] uppercase tracking-wider leading-none">
                     <ShieldCheck className="h-3 w-3" /> Nominal
                  </span>
               </div>
            </div>
         </div>

         {/* Projects Matrix */}
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.length === 0 ? (
               <div className="col-span-2 p-20 bg-secondary/5 border border-dashed border-secondary rounded-xl text-center text-xs font-bold uppercase tracking-wider text-muted-foreground opacity-30">Portfolio nodes not registered in the central system</div>
            ) : projects.map(project => (
               <div key={project.id} className="bg-background border border-secondary rounded-xl p-6 shadow-sm hover:border-accent/40 shadow-accent/5 transition-all group relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-5 translate-x-10 group-hover:translate-x-0 transition-all pointer-events-none">
                     <Target className="h-24 w-24 text-accent" />
                  </div>
                  <div className="flex items-start justify-between mb-6">
                     <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-2">
                           <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground px-2 py-0.5 bg-secondary/30 rounded border border-secondary">Cluster Node</span>
                           <span className={cn("text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border",
                              project.priority === 'High' ? "text-red-500 border-red-500/20 bg-red-500/10" :
                                 project.priority === 'Medium' ? "text-amber-500 border-amber-500/20 bg-amber-500/10" :
                                    "text-green-500 border-green-500/20 bg-green-500/10"
                           )}>
                              {project.priority || 'Low'} Priority
                           </span>
                        </div>
                        <h4 className="text-base font-bold uppercase tracking-tight group-hover:text-accent transition-colors truncate">{project.name}</h4>
                        <div className="flex items-center gap-4 mt-1.5 opacity-60">
                           <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                              <Zap className="h-3 w-3 text-accent" /> {project.manager?.full_name || "System Manager"}
                           </p>
                           <span className="w-1 h-1 rounded-full bg-secondary" />
                           <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                              Lead: {project.lead?.full_name || "Unassigned"}
                           </p>
                        </div>
                     </div>
                     <div className="h-9 w-9 rounded-xl bg-secondary flex items-center justify-center group-hover:bg-accent group-hover:text-white transition-all shadow-sm shrink-0">
                        <ArrowUpRight className="h-4 w-4" />
                     </div>
                  </div>

                  <div className="space-y-4">
                     <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-wider">
                           <span className="text-muted-foreground flex items-center gap-1.5"><Activity className="h-3 w-3" /> Synchronization</span>
                           <span className="text-accent">{project.completion_percentage || 0}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden border border-secondary shadow-inner">
                           <div className={cn("h-full rounded-full transition-all duration-1000", project.priority === 'High' ? "bg-red-500" : "bg-foreground")} style={{ width: `${project.completion_percentage || 0}%` }} />
                        </div>
                     </div>

                     <div className="flex justify-between items-center pt-4 border-t border-secondary/50">
                        <div className="flex items-center gap-3">
                           <div className="flex -space-x-2">
                              {Array.from({ length: Math.min(project.teamSize, 3) }).map((_, i) => (
                                 <div key={i} className="h-6 w-6 rounded-lg bg-secondary border border-background flex items-center justify-center text-[9px] font-bold text-muted-foreground shadow-sm">
                                    {i < 3 ? 'U' : `+${project.teamSize - 3}`}
                                 </div>
                              ))}
                              {project.teamSize > 3 && (
                                 <div className="h-6 w-6 rounded-lg bg-secondary border border-background flex items-center justify-center text-[9px] font-bold text-muted-foreground shadow-sm">
                                    +{project.teamSize - 3}
                                 </div>
                              )}
                              {project.teamSize === 0 && (
                                 <div className="h-6 w-6 rounded-lg bg-secondary/50 border border-dashed border-secondary flex items-center justify-center text-[9px] font-bold text-muted-foreground/30">
                                    0
                                 </div>
                              )}
                           </div>
                           <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground opacity-50">{project.teamSize} Nodes</span>
                        </div>
                        <span className="text-[10px] font-black text-accent uppercase tracking-widest bg-accent/5 px-2 py-1 rounded">
                           Status: {project.status || 'Active'}
                        </span>
                     </div>
                  </div>
               </div>
            ))}
         </div>
      </div>
   );
}
