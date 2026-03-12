"use client"

import { useState, useEffect } from "react";
import {
   CheckCircle2,
   Star,
   MessageSquare,
   ShieldCheck,
   XCircle,
   Clock,
   FolderLock,
   Loader2,
   ClipboardCheck,
   ArrowUpRight,
   Zap,
   Activity
} from "lucide-react";
import { cn } from "@/utils/cn";
import { createClient } from "@/utils/supabase";
import { useUser } from "@/components/UserContext";

export default function ChecklistCompletionPage() {
   const [items, setItems] = useState<any[]>([]);
   const [completedProjects, setCompletedProjects] = useState<any[]>([]);
   const [history, setHistory] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);
   const [actionLoading, setActionLoading] = useState<string | null>(null);
   const { userId } = useUser();
   const supabase = createClient();

   useEffect(() => {
      if (userId) fetchPendingVerifications();
   }, [userId]);

   const fetchPendingVerifications = async () => {
      setLoading(true);

      // 1. Identify all projects where this user is the Authority Lead
      const { data: myProjects } = await supabase
         .from('projects')
         .select('*')
         .eq('project_lead_id', userId);

      const projectIds = myProjects?.map(p => p.id) || [];

      // Separate completed projects for the second section
      const finishedProjects = (myProjects || []).filter(p => p.completion_percentage >= 100);
      setCompletedProjects(finishedProjects);

      if (projectIds.length === 0) {
         setItems([]);
         setLoading(false);
         return;
      }

      // 2. Fetch all completed but unverified allocations within those projects
      const { data, error } = await supabase
         .from('checklist_allocations')
         .select(`
            id,
            completed_at,
            employee_id,
            status,
            difficulty_rating,
            employee_note,
            users_metadata (full_name),
            checklists!inner (
               title,
               description,
               project_id,
               projects (name)
            )
         `)
         .in('checklists.project_id', projectIds)
         .eq('status', 'completed')
         .eq('verified', false)
         .order('completed_at', { ascending: false });

      if (error) {
         console.error("Error fetching verifications:", error);
         setItems([]); // Clear anyway on error
      } else {
         const formatted = (data || []).map((i: any) => ({
            ...i,
            user_meta: i.users_metadata,
            task_meta: i.checklists,
            project_name: i.checklists?.projects?.name || 'Unknown Cluster'
         }));
         setItems(formatted);
      }
      setLoading(false);
   };

   const approve = async (id: string, employeeId: string, itemData: any, baseScore: number = 100) => {
      setActionLoading(id);

      // Mark as verified
      const { error: verifyError } = await supabase
         .from('checklist_allocations')
         .update({
            verified: true,
            status: 'verified' // Explicitly update status to verified as well
         })
         .eq('id', id);

      if (!verifyError) {
         // Increment employee score for successful deployment
         await supabase.rpc('increment_user_score', {
            user_id: employeeId,
            score_delta: baseScore
         });

         setHistory(prev => [{ ...itemData, verified_at: new Date().toISOString() }, ...prev].slice(0, 5));
         await fetchPendingVerifications();
      } else {
         console.error("Verification failed:", verifyError);
      }

      setActionLoading(null);
   };

   const reject = async (id: string) => {
      setActionLoading(id);
      const { error } = await supabase
         .from('checklist_allocations')
         .update({
            status: 'ongoing',
            verified: false
         })
         .eq('id', id);

      if (!error) {
         await fetchPendingVerifications();
      }
      setActionLoading(null);
   };

   if (loading) return (
      <div className="flex h-[60vh] items-center justify-center">
         <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
   );

   return (
      <div className="space-y-10 pb-24">
         {/* Adaptive Header */}
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-secondary/50">
            <div className="flex items-center gap-5">
               <div className="h-12 w-12 bg-accent/10 rounded-xl flex items-center justify-center border border-accent/20">
                  <ClipboardCheck className="h-6 w-6 text-accent" />
               </div>
               <div>
                  <h2 className="text-2xl font-bold tracking-tight">Verification Queue</h2>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-1">Authenticating submitted tasks</p>
               </div>
            </div>
            <div className="flex items-center gap-4">
               <div className="px-4 py-2 bg-secondary/30 text-foreground font-bold text-xs rounded-lg border border-secondary flex items-center gap-2">
                  <Activity className="h-4 w-4 text-accent" /> Queue Depth: {items.length}
               </div>
            </div>
         </div>

         {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 bg-secondary/5 border-2 border-dashed border-secondary/30 rounded-2xl">
               <ShieldCheck className="h-12 w-12 text-muted-foreground/30 mb-4" />
               <p className="font-bold text-lg text-foreground">Queue Synchronized</p>
               <p className="text-xs font-medium text-muted-foreground mt-2 text-center max-w-sm">All verifications have been completed or are in progress</p>
            </div>
         ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {items.map(item => (
                  <div key={item.id} className="bg-background border border-secondary rounded-xl p-6 hover:border-accent hover:shadow-sm transition-all group relative overflow-hidden">
                     {/* Task Priority Accent */}
                     <div className={cn(
                        "absolute top-0 left-0 w-1.5 h-full",
                        item.task_meta?.priority === 'High' ? "bg-red-500" : "bg-accent"
                     )} />

                     <div className="flex items-start justify-between mb-6 pl-2">
                        <div className="flex items-center gap-4">
                           <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center font-bold text-sm group-hover:bg-foreground group-hover:text-background transition-all shadow-sm">
                              {item.user_meta?.full_name?.[0] || 'U'}
                           </div>
                           <div>
                              <h4 className="text-sm font-bold">{item.user_meta?.full_name}</h4>
                              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mt-0.5">
                                 <FolderLock className="h-3 w-3" /> {item.project_name}
                              </p>
                           </div>
                        </div>
                        <div className="flex flex-col items-end">
                           <span className="text-[11px] font-bold bg-green-500/10 text-green-600 border border-green-500/20 px-2 py-0.5 rounded-md uppercase tracking-wider">
                              +100 XP
                           </span>
                           <span className="text-xs font-medium text-muted-foreground mt-2 flex items-center gap-1">
                              <Clock className="h-3 w-3" /> {item.completed_at ? new Date(item.completed_at).toLocaleTimeString() : 'TBD'}
                           </span>
                        </div>
                     </div>

                     <div className="flex-1 space-y-4 mb-6 pl-2">
                        <div className="bg-secondary/10 border border-secondary rounded-lg p-5">
                           <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center gap-3">
                                 <div className="h-5 w-5 bg-green-500/20 rounded flex items-center justify-center text-green-500">
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                 </div>
                                 <h5 className="text-sm font-bold tracking-tight">{item.task_meta?.title}</h5>
                              </div>
                              <Zap className="h-4 w-4 text-accent opacity-50" />
                           </div>
                           <p className="text-xs font-bold text-accent uppercase tracking-wider mb-3 opacity-90">Task verified by Employee</p>

                           {item.task_meta?.description && (
                              <div className="bg-background border border-secondary rounded-md p-3 mb-4">
                                 <p className="text-xs font-medium text-foreground/80 leading-relaxed">
                                    {item.task_meta.description}
                                 </p>
                              </div>
                           )}

                           <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-wider text-foreground/70">
                              <span className="flex items-center gap-1.5 bg-background px-2 py-1 border border-secondary rounded-md">
                                 <Star className="h-3.5 w-3.5 text-amber-500" /> {item.difficulty_rating || 'Standard'}
                              </span>
                              <span className="flex items-center gap-1.5 bg-background px-2 py-1 border border-secondary rounded-md">
                                 <ShieldCheck className="h-3.5 w-3.5 text-blue-500" /> {item.task_meta?.priority || 'Medium'}
                              </span>
                           </div>
                        </div>

                        {item.employee_note && (
                           <div className="p-3 bg-accent/5 border border-accent/10 rounded-lg flex items-start gap-3">
                              <MessageSquare className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                              <div>
                                 <p className="text-[11px] font-bold text-accent uppercase tracking-wider mb-0.5">Note Added</p>
                                 <p className="text-xs font-medium text-foreground/80 leading-relaxed">"{item.employee_note}"</p>
                              </div>
                           </div>
                        )}
                     </div>

                     <div className="flex gap-3 pl-2">
                        <button
                           onClick={() => approve(item.id, item.employee_id, item)}
                           disabled={actionLoading === item.id}
                           className="flex-1 py-3 bg-foreground text-background font-bold text-[11px] uppercase tracking-wider rounded-lg flex items-center justify-center gap-2 hover:bg-accent hover:text-white transition-all shadow-sm active:scale-95 disabled:opacity-50"
                        >
                           {actionLoading === item.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                           ) : (
                              <>
                                 <ShieldCheck className="h-4 w-4" /> Verify Result
                              </>
                           )}
                        </button>
                        <button
                           onClick={() => reject(item.id)}
                           disabled={actionLoading === item.id}
                           className="px-4 py-3 bg-secondary/30 border border-secondary text-red-500 hover:bg-red-500 hover:text-white hover:border-red-500 rounded-lg transition-all active:scale-95 flex items-center justify-center"
                        >
                           <XCircle className="h-4 w-4" />
                        </button>
                     </div>
                  </div>
               ))}
            </div>
         )}

         {/* Recent Transmissions (Session History) */}
         {history.length > 0 && (
            <div className="pt-10 animate-in slide-in-from-bottom-4 duration-500">
               <h3 className="text-sm font-bold flex items-center gap-2 mb-6">
                  <Activity className="h-4 w-4 text-accent" /> Recent Verifications
               </h3>
               <div className="space-y-3">
                  {history.map((h, i) => (
                     <div key={i} className="bg-secondary/10 border border-secondary rounded-lg p-4 flex items-center justify-between hover:bg-secondary/20 transition-colors">
                        <div className="flex items-center gap-4">
                           <div className="h-8 w-8 bg-green-500/20 text-green-500 rounded flex items-center justify-center">
                               <CheckCircle2 className="h-4 w-4" />
                           </div>
                           <div>
                              <p className="text-sm font-bold tracking-tight">{h.task_meta?.title}</p>
                              <p className="text-xs font-bold text-muted-foreground mt-0.5"><span className="text-foreground">{h.user_meta?.full_name}</span> · {h.project_name}</p>
                           </div>
                        </div>
                        <div className="text-right">
                           <p className="text-[11px] font-bold text-green-500 uppercase tracking-wider">Verified</p>
                           <p className="text-xs font-medium text-muted-foreground mt-0.5">{new Date(h.verified_at).toLocaleTimeString()}</p>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         )}

         {/* Completed Project Clusters */}
         {completedProjects.length > 0 && (
            <div className="pt-16 space-y-8">
               <div className="flex items-center gap-6">
                  <div className="h-px bg-secondary flex-1" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">Completed Projects</h3>
                  <div className="h-px bg-secondary flex-1" />
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {completedProjects.map(project => (
                     <div key={project.id} className="bg-background border border-secondary rounded-xl p-6 relative group overflow-hidden transition-all shadow-sm hover:border-accent hover:shadow-md">
                        <div className="absolute -top-4 -right-4 h-24 w-24 bg-green-500/5 rounded-full flex items-center justify-center group-hover:bg-green-500/10 transition-colors">
                           <ShieldCheck className="h-10 w-10 text-green-500/20 group-hover:text-green-500/40 transition-colors" />
                        </div>
                        <div className="relative z-10">
                           <p className="text-[11px] font-bold text-green-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                              <CheckCircle2 className="h-3 w-3 text-green-500" /> Fully Synced
                           </p>
                           <h4 className="text-lg font-bold tracking-tight mb-4 leading-tight">{project.name}</h4>
                           <div className="flex items-center justify-between pt-4 border-t border-secondary">
                              <div className="space-y-1">
                                 <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Deployed On</p>
                                 <p className="text-xs font-bold">{new Date(project.created_at).toLocaleDateString()}</p>
                              </div>
                              <button className="px-4 py-2 bg-secondary/30 hover:bg-accent hover:text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-all">
                                 View Task
                              </button>
                           </div>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         )}

      </div>
   );
}
