"use client"

import { useState, useEffect } from "react";
import { Globe, Target, Zap, Activity, ArrowUpRight, DollarSign, Layers, Loader2, ShieldCheck } from "lucide-react";
import { cn } from "@/utils/cn";
import { createClient } from "@/utils/supabase";

export default function ProjectsOverviewPage() {
   const [projects, setProjects] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);
   const supabase = createClient();

   useEffect(() => {
      fetchProjects();
   }, []);

   const fetchProjects = async () => {
      setLoading(true);
      const { data, error } = await supabase
         .from('projects')
         .select(`
            *,
            managers:manager_id(full_name),
            project_allocations(project_lead_id, users_metadata(full_name))
         `)
         .order('created_at', { ascending: false });

      if (error) {
         console.error("Error fetching projects:", error);
      } else {
         setProjects(data || []);
      }
      setLoading(false);
   };

   if (loading) return (
      <div className="flex h-[60vh] items-center justify-center">
         <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
   );

   return (
      <div className="space-y-6 pb-16">
         <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
               <Layers className="h-5 w-5 text-accent" />
               <h2 className="text-xl font-black uppercase tracking-tight">Strategic Portfolio Hub</h2>
            </div>
            <div className="flex gap-2">
               <button className="px-4 py-2 bg-foreground text-background rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-accent transition-all shadow-md">All Clusters</button>
               <button className="px-4 py-2 bg-background border border-secondary rounded-lg font-black text-[10px] uppercase tracking-widest text-muted-foreground hover:border-accent/40 transition-all shadow-sm">Global Matrix</button>
            </div>
         </div>

         {/* Strategic Stats */}
         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-background border border-accent/40 rounded-xl p-5 shadow-sm transition-all hover:scale-[1.02]">
               <div className="flex items-center gap-2 mb-2"><DollarSign className="h-4 w-4 text-accent" /><p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Net Valuation</p></div>
               <p className="text-2xl font-black text-accent tracking-tighter">${(projects.length * 420).toLocaleString()}K</p>
            </div>
            <div className="bg-background border border-secondary rounded-xl p-5 shadow-sm transition-all hover:scale-[1.02]">
               <div className="flex items-center gap-2 mb-2"><Zap className="h-4 w-4 text-muted-foreground" /><p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Unit Velocity</p></div>
               <p className="text-2xl font-black tracking-tighter">98.4%</p>
            </div>
            <div className="bg-background border border-secondary rounded-xl p-5 shadow-sm transition-all hover:scale-[1.02]">
               <div className="flex items-center gap-2 mb-2"><Target className="h-4 w-4 text-muted-foreground" /><p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Active Nodes</p></div>
               <p className="text-2xl font-black tracking-tighter">{projects.filter(p => (p.completion_percentage || 0) < 100).length}</p>
            </div>
            <div className="bg-background border border-secondary rounded-xl p-5 shadow-sm transition-all hover:scale-[1.02]">
               <div className="flex items-center gap-2 mb-2"><Activity className="h-4 w-4 text-green-500" /><p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Health Index</p></div>
               <p className="text-2xl font-black text-green-500 uppercase tracking-tighter">Synced</p>
            </div>
         </div>

         {/* Projects Matrix */}
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.length === 0 ? (
               <div className="col-span-2 p-20 bg-secondary/5 border border-dashed border-secondary rounded-xl text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-30">Portfolio nodes not registered in the central system</div>
            ) : projects.map(project => (
               <div key={project.id} className="bg-background border border-secondary rounded-xl p-6 shadow-sm hover:shadow-xl hover:border-accent/40 hover:-translate-y-1 transition-all group relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-5 translate-x-10 group-hover:translate-x-0 transition-all pointer-events-none">
                     <Target className="h-24 w-24 text-accent" />
                  </div>
                  <div className="flex items-start justify-between mb-6">
                     <div>
                        <div className="flex items-center gap-2 mb-2">
                           <span className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground px-2.5 py-1 bg-secondary/50 rounded-lg shadow-inner">Operational Unit</span>
                           <span className={cn("text-[8px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded border shadow-sm",
                              project.status === 'Alert' ? "text-red-500 border-red-500/20 bg-red-500/5 shadow-red-500/10" :
                                 (project.completion_percentage === 100) ? "text-green-500 border-green-500/20 bg-green-500/5 shadow-green-500/10" :
                                    "text-accent border-accent/20 bg-accent/5 shadow-accent/10"
                           )}>
                              {project.completion_percentage === 100 ? 'Completed' : project.status || 'Active'}
                           </span>
                        </div>
                        <h4 className="text-lg font-black uppercase tracking-tight group-hover:text-accent transition-colors">{project.name}</h4>
                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-1 opacity-60">Manager: {project.managers?.full_name || "System Authorization"}</p>
                     </div>
                     <button className="h-10 w-10 rounded-xl bg-secondary/50 flex items-center justify-center group-hover:bg-accent group-hover:text-white transition-all shadow-sm">
                        <ArrowUpRight className="h-5 w-5" />
                     </button>
                  </div>

                  <div className="space-y-4">
                     <div className="space-y-2">
                        <div className="flex justify-between text-[9px] font-black uppercase tracking-widest">
                           <span className="text-muted-foreground flex items-center gap-1.5"><Activity className="h-3.5 w-3.5" /> Node Sync</span>
                           <span className="text-accent">{project.completion_percentage || 0}%</span>
                        </div>
                        <div className="h-2 w-full bg-secondary rounded-full overflow-hidden border border-secondary shadow-inner">
                           <div className={cn("h-full rounded-full transition-all duration-1000", project.status === 'Alert' || project.status === 'At Risk' ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" : "bg-foreground shadow-[0_0_8px_rgba(0,0,0,0.1)]")} style={{ width: `${project.completion_percentage || 0}%` }} />
                        </div>
                     </div>

                     <div className="flex justify-between pt-4 border-t border-secondary/50 text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                        <span className="flex items-center gap-1.5"><DollarSign className="h-3.5 w-3.5 text-accent" /> $120K Budgeted</span>
                        <div className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" /> {project.project_allocations?.[0]?.users_metadata?.full_name || "Unassigned"}</div>
                     </div>
                  </div>

                  {/* Operational Nodes (Team size or similar) */}
                  <div className="flex items-center gap-2 mt-6">
                     <div className="flex -space-x-2.5">
                        {Array.from({ length: 4 }).map((_, i) => (
                           <div key={i} className="h-7 w-7 rounded-lg bg-secondary border-2 border-background flex items-center justify-center text-[9px] font-black text-muted-foreground shadow-sm">U</div>
                        ))}
                     </div>
                     <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-2">Team Nodes Assigned</span>
                  </div>
               </div>
            ))}
         </div>
      </div>
   );
}
