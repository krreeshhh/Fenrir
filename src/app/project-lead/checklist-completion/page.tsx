"use client"

import { useState, useEffect } from "react";
import { CheckCircle2, Star, MessageSquare, ShieldCheck, XCircle, Clock, FolderLock, Loader2 } from "lucide-react";
import { cn } from "@/utils/cn";
import { createClient } from "@/utils/supabase";
import { useUser } from "@/components/UserContext";

export default function ChecklistCompletionPage() {
   const [items, setItems] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);
   const [actionLoading, setActionLoading] = useState<string | null>(null);
   const { userId } = useUser();
   const supabase = createClient();

   useEffect(() => {
      if (userId) fetchPendingVerifications();
   }, [userId]);

   const fetchPendingVerifications = async () => {
      setLoading(true);
      
      const { data: allocations } = await supabase
         .from('project_allocations')
         .select('project_id')
         .eq('project_lead_id', userId);
      
      const projectIds = allocations?.map(a => a.project_id) || [];
      
      if (projectIds.length === 0) {
         setItems([]);
         setLoading(false);
         return;
      }

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
               priority,
               project_id,
               projects (name)
            )
         `)
         .in('checklists.project_id', projectIds)
         .eq('status', 'completed')
         .eq('verified', false)
         .order('created_at', { ascending: false });

      if (error) {
         console.error("Error fetching verifications:", error);
      } else {
         setItems((data || []).map((i: any) => ({
            ...i,
            users_metadata: Array.isArray(i.users_metadata) ? i.users_metadata[0] : i.users_metadata,
            checklists: i.checklists ? {
               ...i.checklists,
               projects: Array.isArray(i.checklists.projects) ? i.checklists.projects[0] : i.checklists.projects
            } : null
         })));
      }
      setLoading(false);
   };

   const approve = async (id: string, employeeId: string, baseScore: number = 100) => {
      setActionLoading(id);
      
      const { error: verifyError } = await supabase
         .from('checklist_allocations')
         .update({ verified: true })
         .eq('id', id);

      if (!verifyError) {
         await supabase.rpc('increment_user_score', { 
            user_id: employeeId, 
            score_delta: baseScore 
         });
         
         setItems(prev => prev.filter(i => i.id !== id));
      } else {
         console.error("Verification failed:", verifyError);
      }
      
      setActionLoading(null);
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
               <CheckCircle2 className="h-5 w-5 text-accent" />
               <h2 className="text-xl font-bold uppercase tracking-tight">Verification Queue</h2>
            </div>
            <span className="px-3 py-1 bg-accent/10 border border-accent/20 text-accent rounded-lg font-black text-[10px] uppercase tracking-widest">
               {items.length} Pending
            </span>
         </div>
         <p className="text-sm text-muted-foreground -mt-2">Review completed tasks and approve reward points for your team.</p>

         {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-secondary/10 border border-dashed border-secondary rounded-xl opacity-60">
               <CheckCircle2 className="h-10 w-10 text-muted-foreground mb-3" />
               <p className="font-black text-xs uppercase tracking-widest text-muted-foreground">Queue Empty</p>
               <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-widest font-bold">All operational nodes verified</p>
            </div>
         ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {items.map(item => (
                  <div key={item.id} className="bg-background border border-secondary rounded-xl p-6 shadow-sm hover:border-accent/40 transition-all group flex flex-col">
                     <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                           <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center font-black text-sm group-hover:bg-foreground group-hover:text-background transition-all shadow-sm">
                              {item.users_metadata?.full_name[0]}
                           </div>
                           <div>
                              <h4 className="text-sm font-black uppercase text-foreground">{item.users_metadata?.full_name}</h4>
                              <p className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground flex items-center gap-1.5"><FolderLock className="h-3.5 w-3.5" /> {item.checklists?.projects?.name}</p>
                           </div>
                        </div>
                        <div className="text-right">
                           <span className="text-[9px] font-black bg-accent/10 text-accent border border-accent/20 px-2.5 py-1 rounded-md uppercase tracking-widest">
                              +{item.score_awarded || 100} pts
                           </span>
                        </div>
                     </div>

                     <div className="flex-1 space-y-3 mb-6">
                        <div className="bg-secondary/20 border border-secondary rounded-lg p-4">
                           <h5 className="text-sm font-bold mb-2 uppercase tracking-tight">{item.checklists?.title}</h5>
                           <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                              <span className="flex items-center gap-1.5"><Star className="h-3.5 w-3.5 text-accent" /> {item.difficulty_rating || item.checklists?.priority || 'Medium'}</span>
                              <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {item.completed_at ? new Date(item.completed_at).toLocaleTimeString() : 'Recent'}</span>
                           </div>
                        </div>
                        {item.employee_note && (
                           <div className="p-3 bg-secondary/10 border border-secondary rounded-lg flex items-start gap-2">
                              <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                              <p className="text-[11px] font-medium text-foreground/70 leading-relaxed italic">"{item.employee_note}"</p>
                           </div>
                        )}
                     </div>

                     <div className="flex gap-2 mt-auto">
                        <button 
                           onClick={() => approve(item.id, item.employee_id)} 
                           disabled={actionLoading === item.id}
                           className="flex-1 py-3 bg-foreground text-background rounded-lg font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-accent transition-all shadow-md active:scale-95 disabled:opacity-50"
                        >
                           {actionLoading === item.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                           ) : (
                              <>
                                 <ShieldCheck className="h-4 w-4" /> Verify Deployment
                              </>
                           )}
                        </button>
                        <button className="px-4 py-3 bg-background border border-secondary text-red-500 hover:bg-red-50 rounded-lg transition-colors shadow-sm">
                           <XCircle className="h-4 w-4" />
                        </button>
                     </div>
                  </div>
               ))}
            </div>
         )}
      </div>
   );
}
