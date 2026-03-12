"use client"

import { useState, useEffect } from "react";
import {
   Users,
   Target,
   Briefcase,
   Plus,
   Search,
   CheckCircle2,
   AlertCircle,
   ArrowUpRight,
   ShieldCheck,
   Building,
   X,
   Globe,
   Loader2,
   Calendar,
   BarChart3,
   Activity,
   Edit3,
   Clock,
   ChevronDown,
   MessageSquare,
   Layers
} from "lucide-react";
import { cn } from "@/utils/cn";
import { createClient } from "@/utils/supabase";
import { useUser } from "@/components/UserContext";

export default function ProjectAllocationPage() {
   const [isCreating, setIsCreating] = useState(false);
   const [editingProject, setEditingProject] = useState<any>(null);
   const [search, setSearch] = useState("");
   const [projects, setProjects] = useState<any[]>([]);
   const [leads, setLeads] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);
   const [expandedProject, setExpandedProject] = useState<string | null>(null);

   const [formData, setFormData] = useState({
      name: '',
      description: '',
      leadId: '',
      deadline: '',
      priority: 'Medium',
      riskFactor: 'Low',
      latency: '15ms'
   });

   const { userId } = useUser();
   const supabase = createClient();

   useEffect(() => {
      if (userId) fetchData();
   }, [userId]);

   const fetchData = async () => {
      setLoading(true);

      // 1. Fetch projects managed by this manager with leads and sub-task details
      const { data: projData } = await supabase
         .from('projects')
         .select(`
            *,
            lead_meta:project_lead_id (full_name),
            checklists (
               id,
               title,
               status,
               checklist_allocations (
                  id,
                  status,
                  verified,
                  employee_id,
                  employee_note,
                  difficulty_rating,
                  users_metadata (full_name)
               )
            )
         `)
         .eq('manager_id', userId);

      const formattedProjects = (projData || []).map(p => ({
         ...p,
         lead: p.lead_meta?.full_name || 'Unassigned',
         leadId: p.project_lead_id || '',
         tasks: (p.checklists || []).map((c: any) => ({
            ...c,
            allocations: (c.checklist_allocations || []).map((ca: any) => ({
               ...ca,
               employee: ca.users_metadata?.full_name || 'Unknown'
            }))
         }))
      }));
      setProjects(formattedProjects);

      // 2. Fetch all leads for assignment
      const { data: leadData } = await supabase
         .from('users_metadata')
         .select('id, full_name')
         .eq('role', 'project_lead');
      setLeads(leadData || []);

      setLoading(false);
   };

   const handleCreateOrUpdate = async () => {
      if (!formData.name || !formData.leadId) return;
      setLoading(true);

      const projectData = {
         name: formData.name,
         description: formData.description,
         manager_id: userId,
         deadline: formData.deadline || null,
         priority: formData.priority,
         risk_factor: formData.riskFactor,
         latency: formData.latency,
         status: 'active'
      };

      if (editingProject) {
         await supabase.from('projects').update({
            ...projectData,
            project_lead_id: formData.leadId
         }).eq('id', editingProject.id);
      } else {
         await supabase
            .from('projects')
            .insert({
               ...projectData,
               project_lead_id: formData.leadId,
               completion_percentage: 0
            });
      }

      setIsCreating(false);
      setEditingProject(null);
      resetForm();
      fetchData();
      setLoading(false);
   };

   const resetForm = () => {
      setFormData({
         name: '', description: '', leadId: '', deadline: '',
         priority: 'Medium', riskFactor: 'Low', latency: '15ms'
      });
   };

   const startEdit = (p: any) => {
      setEditingProject(p);
      setFormData({
         name: p.name,
         description: p.description || '',
         leadId: p.leadId,
         deadline: p.deadline ? new Date(p.deadline).toISOString().split('T')[0] : '',
         priority: p.priority || 'Medium',
         riskFactor: p.risk_factor || 'Low',
         latency: p.latency || '15ms'
      });
      setIsCreating(true);
   };

   const filtered = projects.filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.lead.toLowerCase().includes(search.toLowerCase())
   );

   if (loading && projects.length === 0) return (
      <div className="flex h-[60vh] items-center justify-center">
         <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
   );

   return (
      <div className="space-y-8 pb-24">
         {/* Page Header */}
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-secondary/50">
            <div className="flex items-center gap-4">
               <div className="h-12 w-12 bg-accent/10 rounded-xl flex items-center justify-center border border-accent/20">
                  <Briefcase className="h-6 w-6 text-accent" />
               </div>
               <div>
                  <h2 className="text-2xl font-bold tracking-tight">Project Orchestration</h2>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-1">Matrix Resource Management</p>
               </div>
            </div>
            <button
               onClick={() => { setEditingProject(null); resetForm(); setIsCreating(true); }}
               className="bg-foreground text-background px-6 py-3 rounded-lg font-bold text-xs uppercase tracking-wider hover:bg-accent hover:text-white transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2"
            >
               <Plus className="h-4 w-4" /> Initialize Project
            </button>
         </div>

         {/* Project Pipeline */}
         <div className="space-y-6">
            <div className="flex items-center justify-between bg-secondary/10 border border-secondary p-4 rounded-xl">
               <h3 className="text-sm font-bold flex items-center gap-2">
                  <Layers className="h-4 w-4 text-accent" /> System Pipeline
               </h3>
               <div className="flex items-center gap-2 bg-background border border-secondary px-4 py-2 rounded-lg shadow-sm focus-within:border-accent transition-all">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <input
                     value={search}
                     onChange={e => setSearch(e.target.value)}
                     type="text"
                     placeholder="Filter projects..."
                     className="bg-transparent border-none outline-none text-xs font-medium w-48 placeholder:text-muted-foreground"
                  />
               </div>
            </div>

            <div className="space-y-4">
               {filtered.length === 0 ? (
                  <div className="p-24 border-2 border-dashed border-secondary/50 rounded-2xl text-center bg-secondary/5">
                     <p className="text-sm font-bold text-muted-foreground">No active projects synchronized in local sector.</p>
                  </div>
               ) : filtered.map(p => {
                  const isExpanded = expandedProject === p.id;
                  return (
                     <div key={p.id} className={cn("bg-background border rounded-xl overflow-hidden transition-all shadow-sm group hover:border-accent/40", isExpanded ? "border-accent/40" : "border-secondary")}>
                        {/* Summary Row */}
                        <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                           <div className="flex-1">
                              <div className="flex items-center gap-4 mb-2">
                                 <h4 className="text-lg font-bold tracking-tight group-hover:text-accent transition-colors">{p.name}</h4>
                                 <span className={cn(
                                    "px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-md border",
                                    p.priority === 'High' ? "text-red-500 border-red-500/20 bg-red-500/5" : "text-accent border-accent/20 bg-accent/5"
                                 )}>{p.priority} Priority</span>
                              </div>
                              <div className="flex items-center gap-6 mt-3">
                                 <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                    <ShieldCheck className="h-3.5 w-3.5 text-accent" /> Lead: <span className="text-foreground">{p.lead}</span>
                                 </p>
                                 <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                    <Clock className="h-3.5 w-3.5 text-amber-500" /> Deadline: <span className="text-foreground">{p.deadline ? new Date(p.deadline).toLocaleDateString() : 'TBD'}</span>
                                 </p>
                              </div>
                           </div>

                           <div className="flex items-center gap-8">
                              <div className="w-48 space-y-2 hidden md:block">
                              </div>

                              <div className="flex items-center gap-2">
                                 <button onClick={() => startEdit(p)} className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
                                    <Edit3 className="h-4 w-4" />
                                 </button>
                                 <button
                                    onClick={() => setExpandedProject(isExpanded ? null : p.id)}
                                    className={cn("p-2 rounded-lg transition-all", isExpanded ? "bg-accent/10 text-accent" : "hover:bg-secondary text-muted-foreground hover:text-foreground")}
                                 >
                                    <ChevronDown className={cn("h-4 w-4 transition-transform duration-300", isExpanded ? "rotate-180" : "rotate-0")} />
                                 </button>
                              </div>
                           </div>
                        </div>

                        {/* Expandable Details (Tasks Created by Lead) */}
                        {isExpanded && (
                           <div className="border-t border-secondary bg-secondary/10 p-6 md:p-8">
                              <div className="mb-6 flex items-center justify-between">
                                 <h5 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                                    <Layers className="h-3 w-3" /> Delegated Directives (via {p.lead})
                                 </h5>
                                 <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground bg-background px-2 py-1 rounded-md border border-secondary">{p.tasks.length} Active Nodes</span>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                 {p.tasks.length === 0 ? (
                                    <div className="col-span-full py-12 text-center border-2 border-dashed border-secondary/40 rounded-xl bg-background/50">
                                       <p className="text-xs font-medium text-muted-foreground">Command lead has not initialized sub-tasks.</p>
                                    </div>
                                 ) : p.tasks.map((task: any) => (
                                    <div key={task.id} className="bg-background border border-secondary rounded-xl p-5 shadow-sm">
                                       <div className="flex justify-between items-start mb-4">
                                          <h6 className="text-sm font-bold tracking-tight truncate pr-4">{task.title}</h6>
                                          <span className={cn(
                                             "text-[11px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider",
                                             task.status === 'completed' ? "border-green-500/30 bg-green-500/5 text-green-500" :
                                                task.status === 'ongoing' ? "border-blue-500/30 bg-blue-500/5 text-blue-500" :
                                                   "border-amber-500/30 bg-amber-500/5 text-amber-500"
                                          )}>{task.status}</span>
                                       </div>

                                       <div className="space-y-4">
                                          {task.allocations.length === 0 && (
                                             <p className="text-xs text-muted-foreground font-medium italic">Unassigned</p>
                                          )}
                                          {task.allocations.map((alloc: any) => (
                                             <div key={alloc.id} className="space-y-2 border-t border-secondary/50 pt-3 first:border-0 first:pt-0">
                                                <div className="flex items-center gap-2">
                                                   <div className="h-5 w-5 rounded-md bg-secondary/50 flex items-center justify-center">
                                                      <Users className="h-3 w-3 text-muted-foreground" />
                                                   </div>
                                                   <span className="text-[11px] font-bold truncate">{alloc.employee}</span>
                                                </div>

                                                {alloc.employee_note && (
                                                   <div className="bg-secondary/20 rounded-lg p-2.5 border border-secondary/50 text-xs font-medium leading-relaxed italic text-muted-foreground ml-7">
                                                      "{alloc.employee_note}"
                                                   </div>
                                                )}

                                                <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80 pl-7 pt-1">
                                                   <span className="flex items-center gap-1"><BarChart3 className="h-3 w-3" /> {alloc.difficulty_rating || 'Medium'}</span>
                                                   {alloc.verified ? (
                                                      <span className="text-green-500 flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> Verified</span>
                                                   ) : alloc.status === 'completed' ? (
                                                      <span className="text-amber-500 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Pending</span>
                                                   ) : (
                                                      <span>{alloc.status}</span>
                                                   )}
                                                </div>
                                             </div>
                                          ))}
                                       </div>
                                    </div>
                                 ))}
                              </div>
                           </div>
                        )}
                     </div>
                  );
               })}
            </div>
         </div>

         {/* Initialization Modal */}
         {isCreating && (
            <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
               <div className="bg-background w-full max-w-2xl border border-secondary rounded-2xl p-8 shadow-2xl animate-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-between mb-8">
                     <div>
                        <h3 className="text-2xl font-bold tracking-tight">
                           {editingProject ? 'Update Project' : 'Initialize Project'}
                        </h3>
                        <p className="text-xs font-medium text-muted-foreground mt-1">Configure project parameters and assignments.</p>
                     </div>
                     <button
                        onClick={() => { setIsCreating(false); setEditingProject(null); }}
                        className="p-2 rounded-lg bg-secondary/50 hover:bg-secondary transition-all text-muted-foreground hover:text-foreground"
                     >
                        <X className="h-5 w-5" />
                     </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-5">
                        <div className="space-y-2">
                           <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Project Name</label>
                           <input
                              value={formData.name}
                              onChange={e => setFormData({ ...formData, name: e.target.value })}
                              placeholder="Project title..."
                              className="w-full bg-background border border-secondary rounded-lg p-3 text-sm font-medium focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all"
                           />
                        </div>

                        <div className="space-y-2">
                           <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Description</label>
                           <textarea
                              value={formData.description}
                              onChange={e => setFormData({ ...formData, description: e.target.value })}
                              rows={5}
                              placeholder="Project description..."
                              className="w-full bg-background border border-secondary rounded-lg p-3 text-sm font-medium focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all resize-none"
                           />
                        </div>
                     </div>

                     <div className="space-y-5">
                        <div className="space-y-2">
                           <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Assigned Lead</label>
                           <select
                              value={formData.leadId}
                              onChange={e => setFormData({ ...formData, leadId: e.target.value })}
                              className="w-full bg-background border border-secondary rounded-lg p-3 text-sm font-medium focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all cursor-pointer"
                           >
                              <option value="">Select a Lead...</option>
                              {leads.map(l => <option key={l.id} value={l.id}>{l.full_name}</option>)}
                           </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-2">
                              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Priority</label>
                              <select
                                 value={formData.priority}
                                 onChange={e => setFormData({ ...formData, priority: e.target.value })}
                                 className="w-full bg-background border border-secondary rounded-lg p-2.5 text-xs font-bold focus:border-accent outline-none transition-all cursor-pointer uppercase tracking-wider"
                              >
                                 <option value="Low">Low</option>
                                 <option value="Medium">Medium</option>
                                 <option value="High">High</option>
                              </select>
                           </div>
                           <div className="space-y-2">
                              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Risk Level</label>
                              <select
                                 value={formData.riskFactor}
                                 onChange={e => setFormData({ ...formData, riskFactor: e.target.value })}
                                 className="w-full bg-background border border-secondary rounded-lg p-2.5 text-xs font-bold focus:border-accent outline-none transition-all cursor-pointer uppercase tracking-wider"
                              >
                                 <option value="Low">Optimal</option>
                                 <option value="Medium">Moderate</option>
                                 <option value="High">Substantial</option>
                              </select>
                           </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-2">
                              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Deadline</label>
                              <input
                                 value={formData.deadline}
                                 onChange={e => setFormData({ ...formData, deadline: e.target.value })}
                                 type="date"
                                 className="w-full bg-background border border-secondary rounded-lg p-2.5 text-xs font-medium focus:border-accent outline-none transition-all"
                              />
                           </div>
                           <div className="space-y-2">
                              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Latency TGT</label>
                              <input
                                 value={formData.latency}
                                 onChange={e => setFormData({ ...formData, latency: e.target.value })}
                                 placeholder="15ms"
                                 className="w-full bg-background border border-secondary rounded-lg p-2.5 text-xs font-medium focus:border-accent outline-none transition-all uppercase"
                              />
                           </div>
                        </div>

                        <div className="pt-4 mt-auto">
                           <button
                              onClick={handleCreateOrUpdate}
                              disabled={loading || !formData.name || !formData.leadId}
                              className="w-full py-4 bg-foreground text-background rounded-lg font-bold text-xs uppercase tracking-wider hover:bg-accent hover:text-white transition-all shadow-sm active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:active:scale-100"
                           >
                              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><CheckCircle2 className="h-4 w-4" /> {editingProject ? 'Save Changes' : 'Initialize Project'}</>}
                           </button>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
}

function MetricCard({ label, value, icon: Icon, color }: any) {
   return (
      <div className="bg-background border border-secondary rounded-xl p-6 shadow-sm hover:shadow-md transition-all group hover:border-accent/40">
         <div className="flex items-center gap-3 mb-4">
            <div className={cn("p-2 rounded-lg bg-secondary/30 group-hover:bg-accent/10 transition-colors")}>
               <Icon className={cn("h-4 w-4", color)} />
            </div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{label}</p>
         </div>
         <p className="text-3xl font-bold tracking-tight">{value}</p>
      </div>
   );
}

