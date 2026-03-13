"use client"

import { useState, useEffect } from "react";
import {
   FolderLock,
   Clock,
   Zap,
   ArrowUpRight,
   Loader2,
   Database,
   ShieldCheck,
   Activity,
   BarChart3,
   AlertCircle,
   Globe,
   Layers
} from "lucide-react";
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
      // Fetch projects where this user is the designated Project Lead
      const { data, error } = await supabase
         .from('projects')
         .select('*')
         .eq('project_lead_id', userId)
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

   if (projects.length === 0) return (
      <div className="flex flex-col items-center justify-center py-32 bg-secondary/5 border border-dashed border-secondary rounded-2xl opacity-80 shadow-sm">
         <Database className="h-16 w-16 text-muted-foreground/30 mb-6" />
         <p className="font-bold text-lg text-foreground">No Directives Assigned</p>
         <p className="text-sm font-medium text-muted-foreground mt-2">No projects have been assigned to your workspace yet.</p>
      </div>
   );

   const activeCount = projects.filter(p => p.status === 'active' || p.status === 'Active').length;
   const criticalCount = projects.filter(p => p.priority === 'High').length;

   return (
      <div className="space-y-10 pb-24">
         {/* Adaptive Command Header */}
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-secondary/50">
            <div className="flex items-center gap-5">
               <div className="h-12 w-12 bg-accent/10 rounded-xl flex items-center justify-center border border-accent/20">
                  <FolderLock className="h-6 w-6 text-accent" />
               </div>
               <div>
                  <h2 className="text-2xl font-bold tracking-tight">Active Projects</h2>
               </div>
            </div>
         </div>

         {/* Project Grid */}
         <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {projects.map(project => (
               <div
                  key={project.id}
                  className="bg-background border border-secondary rounded-2xl p-6 shadow-sm hover:border-accent/40 transition-all group relative flex flex-col h-full overflow-hidden"
               >
                  <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                     <ArrowUpRight className="h-5 w-5 text-accent" />
                  </div>

                  <div className="mb-6">
                     <div className="flex items-center gap-3 mb-4">
                        <span className={cn(
                           "text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border",
                           project.priority === 'High' ? "text-red-600 border-red-500/20 bg-red-500/10" : "text-accent border-accent/20 bg-accent/10"
                        )}>{project.priority || 'Medium'} PRIORITY</span>
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Status: {project.status}</span>
                     </div>
                     <h4 className="text-xl font-bold tracking-tight group-hover:text-accent transition-colors mb-2 line-clamp-2">{project.name}</h4>
                     <p className="text-sm font-medium text-muted-foreground leading-relaxed line-clamp-3 h-[4.5em]">{project.description || 'System mission parameters under development'}</p>
                  </div>

                  <div className="space-y-6 mt-auto">
                     {/* Progression Matrix */}
                     <div className="space-y-2">
                        <div className="flex justify-between items-end">
                           <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Progress</span>
                           <span className="text-sm font-bold text-foreground">{project.completion_percentage}%</span>
                        </div>
                        <div className="h-2 w-full bg-secondary/50 rounded-full overflow-hidden">
                           <div
                              className="h-full bg-accent transition-all duration-1000"
                              style={{ width: `${project.completion_percentage}%` }}
                           />
                        </div>
                     </div>

                     {/* Metadata Registry */}
                     <div className="grid grid-cols-2 gap-4 pt-5 border-t border-secondary/50">
                        <div className="space-y-1">
                           <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Expected Latency</p>
                           <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                              <Zap className="h-3.5 w-3.5 text-accent" /> {project.latency || '15ms'}
                           </p>
                        </div>
                        <div className="space-y-1">
                           <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Risk Factor</p>
                           <p className={cn(
                              "text-xs font-bold flex items-center gap-1.5",
                              project.risk_factor === 'High' ? "text-red-500" : "text-green-500"
                           )}>
                              <ShieldCheck className="h-3.5 w-3.5" /> {project.risk_factor || 'Optimal'}
                           </p>
                        </div>
                        <div className="space-y-1 mt-1">
                           <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Target Window</p>
                           <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5 text-amber-500" /> {project.deadline ? new Date(project.deadline).toLocaleDateString() : 'TBD'}
                           </p>
                        </div>
                        <div className="space-y-1 mt-1">
                           <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Logic Node</p>
                           <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                              <Globe className="h-3.5 w-3.5 text-blue-500" /> Internal_Alpha
                           </p>
                        </div>
                     </div>
                  </div>
               </div>
            ))}
         </div>
      </div>
   );
}

function MetricCard({ label, value, icon: Icon, color }: any) {
   return (
      <div className="bg-background border border-secondary rounded-2xl p-6 shadow-sm hover:border-accent/40 transition-all group">
         <div className="flex items-center gap-4 mb-4">
            <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center bg-secondary/20 group-hover:scale-110 transition-transform")}>
               <Icon className={cn("h-5 w-5", color)} />
            </div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{label}</p>
         </div>
         <p className="text-3xl font-bold tracking-tight">{value}</p>
      </div>
   );
}
