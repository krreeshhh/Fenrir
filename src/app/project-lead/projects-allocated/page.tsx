"use client"

import { useState, useEffect } from "react";
import { FolderLock, Clock, Zap, ArrowUpRight, Loader2, Database } from "lucide-react";
import { cn } from "@/utils/cn";
import { createClient } from "@/utils/supabase";
import { useUser } from "@/components/UserContext";

export default function ProjectsAllocatedPage() {
   const [projects, setProjects] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);
   const { userId } = useUser();
   const supabase = createClient();

   useEffect(() => {
      if (userId) fetchProjects();
   }, [userId]);

   const fetchProjects = async () => {
      setLoading(true);
      const { data: allocations, error } = await supabase
         .from('project_allocations')
         .select(`
            project_id,
            projects (*)
         `)
         .eq('project_lead_id', userId);

      if (error) {
         console.error("Error fetching projects:", error);
      } else {
         const extracted = allocations?.map((a: any) => Array.isArray(a.projects) ? a.projects[0] : a.projects).filter(Boolean) || [];
         setProjects(extracted);
      }
      setLoading(false);
   };

   if (loading) return (
      <div className="flex h-[60vh] items-center justify-center">
         <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
   );

   if (projects.length === 0) return (
      <div className="flex flex-col items-center justify-center py-20 bg-secondary/10 border border-dashed border-secondary rounded-lg opacity-60">
         <Database className="h-10 w-10 text-muted-foreground mb-3" />
         <p className="font-bold text-base uppercase tracking-widest">No Projects Allocated</p>
         <p className="text-sm text-muted-foreground mt-1">You are not currently leading any active projects.</p>
      </div>
   );

   const activeCount = projects.filter(p => p.status === 'Active').length;
   const avgProgress = Math.round(projects.reduce((s, p) => s + (p.completion_percentage || 0), 0) / projects.length);

   return (
      <div className="space-y-6 pb-16">
         <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
               <FolderLock className="h-5 w-5 text-accent" />
               <h2 className="text-xl font-bold uppercase tracking-tight">Assigned Projects</h2>
            </div>
            <span className="text-[10px] font-black text-accent uppercase tracking-[0.2em] bg-accent/10 border border-accent/20 rounded-lg px-3 py-1.5 shadow-sm">
               Lead Node Access
            </span>
         </div>

         <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-background border border-accent/40 rounded-lg p-5 shadow-sm">
               <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Total Payload</p>
               <p className="text-2xl font-black text-accent">{projects.length}</p>
            </div>
            <div className="bg-background border border-secondary rounded-lg p-5 shadow-sm">
               <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Active Status</p>
               <p className="text-2xl font-black text-foreground">{activeCount}</p>
            </div>
            <div className="bg-background border border-secondary rounded-lg p-5 shadow-sm">
               <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Mean Velocity</p>
               <p className="text-2xl font-black text-foreground">{avgProgress}%</p>
            </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map(project => (
               <div key={project.id} className="bg-background border border-secondary rounded-xl p-6 shadow-sm hover:shadow-md hover:border-accent/40 transition-all group flex flex-col justify-between h-full">
                  <div>
                     <div className="flex items-start justify-between mb-4">
                        <div className="space-y-1">
                           <h4 className="text-base font-black group-hover:text-accent transition-colors uppercase truncate max-w-[180px]">{project.name}</h4>
                           <div className="flex items-center gap-2">
                              <span className={cn("text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded border shadow-sm",
                                 project.complexity === 'High' ? "text-red-500 border-red-500/20 bg-red-500/5" :
                                    project.complexity === 'Medium' ? "text-accent border-accent/20 bg-accent/5" :
                                       "text-green-500 border-green-500/20 bg-green-500/5"
                              )}>{project.complexity || 'M'}</span>
                              <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground border border-secondary px-2 py-0.5 rounded">{project.status}</span>
                           </div>
                        </div>
                        <div className="h-8 w-8 rounded-lg bg-secondary/50 flex items-center justify-center group-hover:bg-accent group-hover:text-white transition-all shadow-sm">
                           <ArrowUpRight className="h-4 w-4" />
                        </div>
                     </div>

                     <div className="space-y-4">
                        <div className="space-y-1.5">
                           <div className="flex justify-between text-[9px] font-black uppercase tracking-widest">
                              <span className="text-muted-foreground">Progression</span>
                              <span className="text-accent">{project.completion_percentage}%</span>
                           </div>
                           <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden border border-secondary shadow-inner">
                              <div 
                                 className="h-full bg-accent rounded-full transition-all duration-1000" 
                                 style={{ width: `${project.completion_percentage}%` }} 
                              />
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="mt-8 pt-4 border-t border-secondary flex justify-between items-center text-[10px] font-bold text-muted-foreground">
                     <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> Q4-2026</span>
                     <div className="flex -space-x-2">
                        {Array.from({ length: 3 }).map((_, i) => (
                           <div key={i} className="h-6 w-6 rounded-md bg-secondary border-2 border-background flex items-center justify-center text-[8px] font-black shadow-sm">U{i}</div>
                        ))}
                     </div>
                  </div>
               </div>
            ))}
         </div>
      </div>
   );
}
