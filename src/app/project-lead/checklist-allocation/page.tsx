"use client"

import { useState, useEffect } from "react";
import {
   Plus, User, Calendar, Tag, Users, Zap, Target, FolderLock, ArrowUpRight, X, Briefcase, ShieldCheck, Search, Loader2
} from "lucide-react";
import { cn } from "@/utils/cn";
import { createClient } from "@/utils/supabase";
import { useUser } from "@/components/UserContext";

export default function ChecklistAllocationPage() {
   const [isAllocating, setIsAllocating] = useState(false);
   const [allocations, setAllocations] = useState<any[]>([]);
   const [team, setTeam] = useState<any[]>([]);
   const [projects, setProjects] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);
   const [formData, setFormData] = useState({ title: '', projectId: '', employeeId: '', deadline: '' });
   const { userId } = useUser();
   const supabase = createClient();

   useEffect(() => {
      if (userId) fetchData();
   }, [userId]);

   const fetchData = async () => {
      setLoading(true);

      // 1. Get projects overseen by this lead
      const { data: projectAllocations } = await supabase
         .from('project_allocations')
         .select('project_id, projects (*)')
         .eq('project_lead_id', userId);
      
      const myProjects = projectAllocations?.map((a: any) => Array.isArray(a.projects) ? a.projects[0] : a.projects).filter(Boolean) || [];
      setProjects(myProjects);
      const projectIds = myProjects.map((p: any) => p.id);

      // 2. Get current task allocations
      const { data: currentAllocations } = await supabase
         .from('checklist_allocations')
         .select(`
            id,
            completed,
            employee_id,
            users_metadata (full_name),
            checklists!inner (
               title,
               project_id,
               projects (name)
            )
         `)
         .in('checklists.project_id', projectIds)
         .order('created_at', { ascending: false });
      
      const formattedAllocations = (currentAllocations || []).map((a: any) => ({
         ...a,
         users_metadata: Array.isArray(a.users_metadata) ? a.users_metadata[0] : a.users_metadata,
         checklists: a.checklists ? {
            ...a.checklists,
            projects: Array.isArray(a.checklists.projects) ? a.checklists.projects[0] : a.checklists.projects
         } : null
      }));
      setAllocations(formattedAllocations);

      // 3. Get employees (all for now, or could filter by those in project teams)
      const { data: employees } = await supabase
         .from('users_metadata')
         .select('*')
         .eq('role', 'employee');
      
      setTeam(employees || []);

      setLoading(false);
   };

   const handleAllocate = async () => {
      if (!formData.title || !formData.projectId || !formData.employeeId) return;

      setLoading(true);
      // 1. Create the checklist item first
      const { data: checklist, error: chkError } = await supabase
         .from('checklists')
         .insert({
            project_id: formData.projectId,
            title: formData.title,
            priority: 'Medium'
         })
         .select()
         .single();

      if (checklist) {
         // 2. Allocate to employee
         const { error: allocError } = await supabase
            .from('checklist_allocations')
            .insert({
               checklist_id: checklist.id,
               employee_id: formData.employeeId,
               due_date: formData.deadline || null
            });
         
         if (!allocError) {
            setIsAllocating(false);
            setFormData({ title: '', projectId: '', employeeId: '', deadline: '' });
            fetchData();
         }
      }
      setLoading(false);
   };

   if (loading && allocations.length === 0) return (
      <div className="flex h-[60vh] items-center justify-center">
         <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
   );

   return (
      <div className="space-y-6 pb-16">
         <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
               <FolderLock className="h-5 w-5 text-accent" />
               <h2 className="text-xl font-bold uppercase tracking-tight">Task Allocation</h2>
            </div>
            <button onClick={() => setIsAllocating(true)} className="flex items-center gap-2 px-6 py-2.5 bg-foreground text-background rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-accent transition-all shadow-lg active:scale-95">
               <Plus className="h-4 w-4" /> Allocate Task
            </button>
         </div>

         {/* Stats Row */}
         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-background border border-secondary rounded-xl p-5 shadow-sm">
               <div className="flex items-center gap-2 mb-2"><Target className="h-4 w-4 text-accent" /><p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Active Ops</p></div>
               <p className="text-2xl font-black">{allocations.filter(a => !a.completed).length}</p>
            </div>
            <div className="bg-background border border-secondary rounded-xl p-5 shadow-sm">
               <div className="flex items-center gap-2 mb-2"><Zap className="h-4 w-4 text-accent" /><p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Personnel</p></div>
               <p className="text-2xl font-black">{team.length}</p>
            </div>
            <div className="bg-background border border-secondary rounded-xl p-5 shadow-sm">
               <div className="flex items-center gap-2 mb-2"><Briefcase className="h-4 w-4 text-accent" /><p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Clusters</p></div>
               <p className="text-2xl font-black">{projects.length}</p>
            </div>
             <div className="bg-background border border-secondary rounded-xl p-5 shadow-sm">
               <div className="flex items-center gap-2 mb-2"><ShieldCheck className="h-4 w-4 text-green-500" /><p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Integrity</p></div>
               <p className="text-2xl font-black text-green-500 uppercase">Secure</p>
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3 space-y-4">
               <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black uppercase tracking-widest">Current Allocations</h3>
               </div>
               <div className="bg-background border border-secondary rounded-xl divide-y divide-secondary overflow-hidden shadow-sm">
                  {allocations.length === 0 ? (
                     <div className="p-12 text-center text-muted-foreground uppercase text-[10px] font-black tracking-widest opacity-40">No active deployments</div>
                  ) : allocations.map((a) => (
                     <div key={a.id} className="p-4 hover:bg-secondary/10 transition-colors group">
                        <div className="flex items-center justify-between">
                           <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold group-hover:text-accent transition-colors uppercase truncate">{a.checklists?.title}</p>
                              <div className="flex items-center gap-4 mt-1">
                                 <span className="text-[9px] text-muted-foreground font-black uppercase tracking-widest flex items-center gap-1.5"><FolderLock className="h-3.5 w-3.5" /> {a.checklists?.projects?.name}</span>
                                 <span className="text-[9px] text-muted-foreground font-black uppercase tracking-widest flex items-center gap-1.5"><User className="h-3.5 w-3.5" /> {a.users_metadata?.full_name}</span>
                              </div>
                           </div>
                           <div className="flex items-center gap-4 ml-4">
                              <span className={cn("text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md border shrink-0 shadow-sm",
                                 a.completed ? "text-green-500 border-green-500/20 bg-green-500/5" : "text-amber-500 border-amber-500/20 bg-amber-500/5"
                              )}>{a.completed ? 'Success' : 'Active'}</span>
                           </div>
                        </div>
                     </div>
                  ))}
               </div>
            </div>

            <div className="space-y-6">
               <h3 className="text-sm font-black uppercase tracking-widest">Personnel Load</h3>
               <div className="bg-background border border-secondary rounded-xl p-6 space-y-6 shadow-sm">
                  {team.slice(0, 5).map((t, i) => (
                     <div key={i} className="space-y-2">
                        <div className="flex justify-between items-center">
                           <p className="text-[11px] font-black uppercase truncate pr-4">{t.full_name}</p>
                           <span className="text-[10px] font-black text-accent uppercase">{t.score || 0} pts</span>
                        </div>
                        <div className="h-2 w-full bg-secondary rounded-full overflow-hidden border border-secondary shadow-inner">
                           <div className="h-full bg-foreground rounded-full transition-all duration-1000" style={{ width: `${Math.min((t.score / 2000) * 100, 100)}%` }} />
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         </div>

         {/* Create Modal */}
         {isAllocating && (
            <div className="fixed inset-0 bg-background/80 backdrop-blur-xl z-[100] flex items-center justify-center p-6">
               <div className="bg-background w-full max-w-xl rounded-2xl border border-secondary p-8 shadow-2xl animate-in zoom-in-95 fade-in duration-300">
                  <div className="flex items-center justify-between mb-8">
                     <div>
                        <h3 className="text-lg font-black uppercase tracking-tight">New Task Deployment</h3>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Authorize operational node assignment</p>
                     </div>
                     <button onClick={() => setIsAllocating(false)} className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center hover:bg-muted transition-all active:scale-90">
                        <X className="h-5 w-5" />
                     </button>
                  </div>
                  
                  <div className="space-y-4">
                     <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Task Signature</label>
                        <div className="flex items-center gap-3 px-4 py-3.5 bg-secondary/20 border border-secondary focus-within:border-accent/40 rounded-xl transition-all shadow-inner">
                           <Briefcase className="h-4 w-4 text-muted-foreground" />
                           <input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} type="text" placeholder="DEPLOYMENT TITLE..." className="bg-transparent border-none outline-none text-xs font-black w-full placeholder:text-muted-foreground/30 uppercase tracking-widest" />
                        </div>
                     </div>

                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                           <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Operational Cluster</label>
                           <select 
                              value={formData.projectId} 
                              onChange={e => setFormData({...formData, projectId: e.target.value})}
                              className="w-full flex items-center gap-3 px-4 py-3.5 bg-secondary/20 border border-secondary focus-within:border-accent/40 rounded-xl transition-all shadow-inner text-xs font-black uppercase tracking-widest outline-none"
                           >
                              <option value="">SELECT CLUSTER...</option>
                              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                           </select>
                        </div>
                        <div className="space-y-1.5">
                           <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Personnel Node</label>
                           <select 
                              value={formData.employeeId} 
                              onChange={e => setFormData({...formData, employeeId: e.target.value})}
                              className="w-full flex items-center gap-3 px-4 py-3.5 bg-secondary/20 border border-secondary focus-within:border-accent/40 rounded-xl transition-all shadow-inner text-xs font-black uppercase tracking-widest outline-none"
                           >
                              <option value="">SELECT USER...</option>
                              {team.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                           </select>
                        </div>
                     </div>

                     <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Exclusion Deadline</label>
                        <div className="flex items-center gap-3 px-4 py-3.5 bg-secondary/20 border border-secondary focus-within:border-accent/40 rounded-xl transition-all shadow-inner">
                           <Calendar className="h-4 w-4 text-muted-foreground" />
                           <input value={formData.deadline} onChange={e => setFormData({...formData, deadline: e.target.value})} type="date" className="bg-transparent border-none outline-none text-xs font-black w-full text-foreground uppercase tracking-widest" />
                        </div>
                     </div>
                  </div>

                  <button 
                     onClick={handleAllocate}
                     disabled={loading || !formData.title || !formData.projectId || !formData.employeeId}
                     className="mt-8 w-full py-4 bg-foreground text-background rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-accent transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95 disabled:opacity-50"
                  >
                     {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><ArrowUpRight className="h-5 w-5" /> Execute Deployment</>}
                  </button>
               </div>
            </div>
         )}
      </div>
   );
}
