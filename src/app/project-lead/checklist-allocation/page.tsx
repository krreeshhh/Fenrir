"use client"

import { useState, useEffect } from "react";
import {
   Plus, 
   User, 
   Calendar, 
   Tag, 
   Users, 
   Zap, 
   Target, 
   FolderLock, 
   ArrowUpRight, 
   X, 
   Briefcase, 
   ShieldCheck, 
   Search, 
   Loader2,
   ChevronDown,
   ChevronUp,
   MessageSquare,
   AlertCircle,
   CheckCircle2,
   Edit3,
   Clock,
   BarChart3,
   Trash2,
   Layers
} from "lucide-react";
import { cn } from "@/utils/cn";
import { createClient } from "@/utils/supabase";
import { useUser } from "@/components/UserContext";

export default function ChecklistAllocationPage() {
   const [isAllocating, setIsAllocating] = useState(false);
   const [editingTask, setEditingTask] = useState<any>(null);
   const [allocations, setAllocations] = useState<any[]>([]);
   const [team, setTeam] = useState<any[]>([]);
   const [projects, setProjects] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);
   const [expandedProject, setExpandedProject] = useState<string | null>(null);
   
   const [formData, setFormData] = useState({ 
      projectId: '', 
      employeeId: '',
      items: [
         { title: '', description: '', deadline: '', role: 'Contributor', difficulty: 'Medium' }
      ]
   });
   
   const { userId } = useUser();
   const supabase = createClient();

   useEffect(() => {
      if (userId) fetchData();
   }, [userId]);

   const fetchData = async () => {
      setLoading(true);

      // 1. Get projects overseen by this lead
      const { data: myProjects } = await supabase
         .from('projects')
         .select('*')
         .eq('project_lead_id', userId);
      
      setProjects(myProjects || []);
      const projectIds = (myProjects || []).map((p: any) => p.id);

      // 2. Get current task allocations
      const { data: currentAllocations } = await supabase
         .from('checklist_allocations')
         .select(`
            *,
            users_metadata (id, full_name, avatar_url),
            checklists!inner (
               id,
               title,
               description,
               project_id,
               projects (id, name)
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

      // 3. Get team
      const { data: employees } = await supabase
         .from('users_metadata')
         .select('*')
         .eq('role', 'employee');
      setTeam(employees || []);

      setLoading(false);
   };

   const addItem = () => {
      setFormData({
         ...formData,
         items: [...formData.items, { title: '', description: '', deadline: '', role: 'Contributor', difficulty: 'Medium' }]
      });
   };

   const removeItem = (index: number) => {
      if (formData.items.length <= 1) return;
      setFormData({
         ...formData,
         items: formData.items.filter((_, i) => i !== index)
      });
   };

   const updateItem = (index: number, field: string, value: string) => {
      const newItems = [...formData.items];
      newItems[index] = { ...newItems[index], [field]: value };
      setFormData({ ...formData, items: newItems });
   };

   const handleAllocateAll = async () => {
      if (!formData.projectId || !formData.employeeId || formData.items.some(i => !i.title)) return;
      setLoading(true);

      for (const item of formData.items) {
         // Insert Checklist
         const { data: checklist, error: chkError } = await supabase
            .from('checklists')
            .insert({
               project_id: formData.projectId,
               title: item.title,
               description: item.description || 'Systemic directive from Lead node.',
               status: 'not_started'
            })
            .select()
            .single();

         if (checklist) {
            // Insert Allocation
            await supabase
               .from('checklist_allocations')
               .insert({
                  checklist_id: checklist.id,
                  employee_id: formData.employeeId,
                  deadline: item.deadline || null,
                  role_on_project: item.role,
                  difficulty_rating: item.difficulty,
                  status: 'not_started'
               });
         }
      }

      setIsAllocating(false);
      resetForm();
      fetchData();
      setLoading(false);
   };

   const handleUpdateSingle = async () => {
      if (!editingTask || !formData.items[0].title) return;
      setLoading(true);
      
      const item = formData.items[0];

      await supabase
         .from('checklists')
         .update({
            title: item.title,
            description: item.description,
         })
         .eq('id', editingTask.checklists.id);

      await supabase
         .from('checklist_allocations')
         .update({
            employee_id: formData.employeeId,
            deadline: item.deadline || null,
            role_on_project: item.role,
            difficulty_rating: item.difficulty,
         })
         .eq('id', editingTask.id);

      setEditingTask(null);
      resetForm();
      fetchData();
      setLoading(false);
   };

   const resetForm = () => {
      setFormData({ 
         projectId: '', 
         employeeId: '',
         items: [{ title: '', description: '', deadline: '', role: 'Contributor', difficulty: 'Medium' }]
      });
   };

   const startEdit = (task: any) => {
      setEditingTask(task);
      setFormData({
         projectId: task.checklists.project_id,
         employeeId: task.employee_id,
         items: [{
            title: task.checklists.title,
            description: task.checklists.description || '',
            deadline: task.deadline ? new Date(task.deadline).toISOString().split('T')[0] : '',
            role: task.role_on_project || 'Contributor',
            difficulty: task.difficulty_rating || 'Medium'
         }]
      });
      setIsAllocating(true);
   };

   const getProjectAllocations = (pId: string) => {
      const filtered = allocations.filter(a => a.checklists?.project_id === pId);
      // Group by employee
      const grouped: Record<string, any[]> = {};
      filtered.forEach(a => {
         const empId = a.employee_id;
         if (!grouped[empId]) grouped[empId] = [];
         grouped[empId].push(a);
      });
      return grouped;
   };

   if (loading && allocations.length === 0) return (
      <div className="flex h-[60vh] items-center justify-center">
         <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
   );

   return (
      <div className="space-y-8 pb-32">
         {/* Adaptive Command Header */}
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-secondary/50">
            <div>
               <div className="flex items-center gap-4 mb-2">
                  <div className="h-12 w-12 bg-accent/10 rounded-xl flex items-center justify-center border border-accent/20">
                     <Layers className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                     <h2 className="text-2xl font-bold tracking-tight">Task Allocation</h2>
                     <p className="text-xs font-bold text-muted-foreground mt-1">Assign directives to personnel</p>
                  </div>
               </div>
            </div>
            
            <button 
               onClick={() => { setEditingTask(null); resetForm(); setIsAllocating(true); }} 
               className="bg-foreground text-background px-6 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider hover:bg-accent hover:text-white transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2"
            >
               <Plus className="h-4 w-4" /> Batch Initialize
            </button>
         </div>

         {/* Project Command Nodes */}
         <div className="space-y-6">
            {projects.length === 0 ? (
               <div className="p-20 border border-dashed border-secondary rounded-xl text-center bg-secondary/5">
                  <Briefcase className="h-12 w-12 text-secondary mx-auto mb-4 opacity-40" />
                  <p className="text-sm font-medium text-muted-foreground">No projects assigned to your node.</p>
               </div>
            ) : projects.map(project => {
               const groupedTasks = getProjectAllocations(project.id);
               const isExpanded = expandedProject === project.id;
               const tasksArray = Object.values(groupedTasks).flat();
               const progress = tasksArray.length > 0 
                  ? Math.round((tasksArray.filter(t => t.status === 'completed').length / tasksArray.length) * 100) 
                  : 0;

               return (
                  <div key={project.id} className="bg-background border border-secondary rounded-xl shadow-sm hover:border-accent/30 transition-all overflow-hidden">
                     <button 
                        onClick={() => setExpandedProject(isExpanded ? null : project.id)}
                        className={cn(
                           "w-full flex items-center justify-between p-6 text-left transition-all hover:bg-secondary/5",
                           isExpanded && "bg-secondary/5 border-b border-secondary/50"
                        )}
                     >
                        <div className="flex items-center gap-6">
                           <div className="relative">
                              <Target className="h-10 w-10 text-muted-foreground opacity-20" />
                              <div className="absolute inset-0 flex items-center justify-center">
                                 <span className="text-sm font-bold text-accent">{tasksArray.length}</span>
                              </div>
                           </div>
                           <div>
                              <h3 className="text-xl font-bold tracking-tight mb-2">{project.name}</h3>
                              <div className="flex items-center gap-4">
                                 <div className="h-2 w-32 bg-secondary/50 rounded-full overflow-hidden">
                                    <div className="h-full bg-accent transition-all duration-500" style={{ width: `${progress}%` }} />
                                 </div>
                                 <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{progress}% Completed</span>
                              </div>
                           </div>
                        </div>
                        <ChevronDown className={cn("h-6 w-6 text-muted-foreground transition-transform duration-300", isExpanded ? "rotate-180" : "rotate-0")} />
                     </button>

                     {isExpanded && (
                        <div className="p-6 space-y-8 bg-secondary/5">
                           {Object.keys(groupedTasks).length === 0 ? (
                              <div className="py-12 text-center text-muted-foreground/60">
                                 <p className="text-sm font-medium">No tasks allocated for this project yet.</p>
                              </div>
                           ) : Object.entries(groupedTasks).map(([empId, tasks]: [string, any]) => (
                              <div key={empId} className="space-y-4">
                                 <div className="flex items-center gap-3 border-b border-secondary/50 pb-3">
                                    <div className="h-8 w-8 rounded-lg bg-foreground text-background flex items-center justify-center font-bold text-sm">
                                       {tasks[0].users_metadata.full_name.slice(0, 1)}
                                    </div>
                                    <h4 className="text-sm font-bold text-foreground">{tasks[0].users_metadata.full_name}</h4>
                                    <span className="text-xs font-bold text-muted-foreground uppercase">— Tasks</span>
                                 </div>

                                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {tasks.map((task: any) => (
                                       <div key={task.id} className="bg-background border border-secondary rounded-xl p-5 hover:border-accent/50 transition-all shadow-sm group relative">
                                          <div className="flex justify-between items-start mb-4">
                                             <div className={cn(
                                                "px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded-md border",
                                                task.status === 'completed' ? "bg-green-500/10 border-green-500/20 text-green-600" : "bg-amber-500/10 border-amber-500/20 text-amber-600"
                                             )}>{task.status.replace('_', ' ')}</div>
                                             <button onClick={() => startEdit(task)} className="p-1.5 hover:bg-secondary rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Edit3 className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                                             </button>
                                          </div>
                                          
                                          <h5 className="text-sm font-bold mb-3">{task.checklists.title}</h5>
                                          
                                          <div className="space-y-3 pt-3 border-t border-secondary/50">
                                             {task.employee_note && (
                                                <div className="bg-secondary/20 p-3 rounded-lg border border-secondary text-xs text-muted-foreground italic">
                                                   "{task.employee_note}"
                                                </div>
                                             )}
                                             
                                             <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                                <span className="flex items-center gap-1.5">
                                                   <BarChart3 className="h-3.5 w-3.5 text-accent" /> {task.difficulty_rating || 'Medium'}
                                                </span>
                                                {task.deadline && (
                                                   <span className="flex items-center gap-1.5">
                                                      <Clock className="h-3.5 w-3.5 text-amber-500" /> {new Date(task.deadline).toLocaleDateString()}
                                                   </span>
                                                )}
                                             </div>
                                          </div>
                                       </div>
                                    ))}
                                    <button 
                                       onClick={() => {
                                          resetForm();
                                          setFormData(f => ({ ...f, projectId: project.id, employeeId: empId }));
                                          setIsAllocating(true);
                                       }}
                                       className="border border-dashed border-secondary rounded-xl hover:border-accent/40 bg-background/50 flex flex-col items-center justify-center p-8 transition-all group shadow-sm"
                                    >
                                       <Plus className="h-6 w-6 text-muted-foreground mb-2 group-hover:text-accent transition-colors" />
                                       <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground group-hover:text-accent transition-colors">Add Directive</span>
                                    </button>
                                 </div>
                              </div>
                           ))}
                        </div>
                     )}
                  </div>
               );
            })}
         </div>

         {/* Allocation Modal (Dynamic Multi-Item) */}
         {isAllocating && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
               <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setIsAllocating(false)} />
               <div className="relative bg-background border border-secondary rounded-2xl p-8 w-full max-w-4xl shadow-xl animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh] custom-scrollbar">
                  <button onClick={() => setIsAllocating(false)} className="absolute top-6 right-6 p-2 text-muted-foreground hover:bg-secondary hover:text-foreground rounded-lg transition-colors border-none">
                     <X className="h-5 w-5" />
                  </button>

                  <div className="mb-8">
                     <h3 className="text-2xl font-bold tracking-tight">
                        {editingTask ? "Node Revision" : "Batch Deployment"}
                     </h3>
                     <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-1">Configure task synchronization parameters</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                     <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Active Cluster</label>
                        <select 
                           disabled={!!editingTask}
                           value={formData.projectId} 
                           onChange={e => setFormData({...formData, projectId: e.target.value})}
                           className="w-full bg-background border border-secondary rounded-lg px-4 py-3 text-sm font-medium focus:border-accent focus:ring-1 focus:ring-accent outline-none shadow-sm"
                        >
                           <option value="">Select Project...</option>
                           {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                     </div>
                     <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Executing Node</label>
                        <select 
                           value={formData.employeeId} 
                           onChange={e => setFormData({...formData, employeeId: e.target.value})}
                           className="w-full bg-background border border-secondary rounded-lg px-4 py-3 text-sm font-medium focus:border-accent focus:ring-1 focus:ring-accent outline-none shadow-sm"
                        >
                           <option value="">Select Personnel...</option>
                           {team.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                        </select>
                     </div>
                  </div>

                  <div className="space-y-6">
                     <h4 className="text-sm font-bold flex items-center gap-2 border-b border-secondary/50 pb-2">
                        <Layers className="h-4 w-4 text-accent" /> Task Specifications
                     </h4>
                     
                     {formData.items.map((item, idx) => (
                        <div key={idx} className="p-6 border border-secondary rounded-xl bg-secondary/5 relative group animate-in slide-in-from-right-4 duration-200">
                           {!editingTask && formData.items.length > 1 && (
                              <button 
                                 onClick={() => removeItem(idx)}
                                 className="absolute -top-3 -right-3 h-8 w-8 bg-red-100 text-red-600 border-none rounded-full flex items-center justify-center hover:scale-110 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                              >
                                 <Trash2 className="h-4 w-4" />
                              </button>
                           )}

                           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                              <div className="space-y-4">
                                 <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Task Title</label>
                                    <input 
                                       value={item.title} 
                                       onChange={e => updateItem(idx, 'title', e.target.value)}
                                       placeholder="e.g. Implement Navigation API..." 
                                       className="w-full bg-background border border-secondary rounded-lg px-4 py-2.5 text-sm font-medium focus:border-accent focus:ring-1 focus:ring-accent outline-none shadow-sm" 
                                    />
                                 </div>
                                 <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Description</label>
                                    <textarea 
                                       value={item.description} 
                                       onChange={e => updateItem(idx, 'description', e.target.value)}
                                       placeholder="Detailed requirements..." 
                                       rows={3}
                                       className="w-full bg-background border border-secondary rounded-lg px-4 py-2.5 text-sm font-medium focus:border-accent focus:ring-1 focus:ring-accent outline-none shadow-sm resize-none" 
                                    />
                                 </div>
                              </div>
                              <div className="space-y-4">
                                 <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                       <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Complexity</label>
                                       <select 
                                          value={item.difficulty} 
                                          onChange={e => updateItem(idx, 'difficulty', e.target.value)}
                                          className="w-full bg-background border border-secondary rounded-lg px-4 py-2.5 text-sm font-medium focus:border-accent focus:ring-1 focus:ring-accent outline-none shadow-sm"
                                       >
                                          <option value="Easy">Easy</option>
                                          <option value="Medium">Medium</option>
                                          <option value="Hard">Hard</option>
                                       </select>
                                    </div>
                                    <div className="space-y-1.5">
                                       <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Deadline</label>
                                       <input 
                                          value={item.deadline} 
                                          onChange={e => updateItem(idx, 'deadline', e.target.value)}
                                          type="date" 
                                          className="w-full bg-background border border-secondary rounded-lg px-4 py-2.5 text-sm font-medium focus:border-accent focus:ring-1 focus:ring-accent outline-none shadow-sm cursor-pointer" 
                                       />
                                    </div>
                                 </div>
                                 <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Role/Focus</label>
                                    <input 
                                       value={item.role} 
                                       onChange={e => updateItem(idx, 'role', e.target.value)}
                                       placeholder="e.g. Frontend Developer" 
                                       className="w-full bg-background border border-secondary rounded-lg px-4 py-2.5 text-sm font-medium focus:border-accent focus:ring-1 focus:ring-accent outline-none shadow-sm" 
                                    />
                                 </div>
                              </div>
                           </div>
                        </div>
                     ))}

                     {!editingTask && (
                        <button 
                           onClick={addItem}
                           className="w-full py-3.5 border border-dashed border-secondary rounded-xl text-muted-foreground hover:border-accent hover:text-accent transition-all flex items-center justify-center gap-2 hover:bg-accent/5 font-bold text-xs uppercase tracking-wider"
                        >
                           <Plus className="h-4 w-4" /> Add Another Task
                        </button>
                     )}

                     <div className="pt-6">
                        <button 
                           onClick={editingTask ? handleUpdateSingle : handleAllocateAll}
                           disabled={loading || !formData.projectId || !formData.employeeId || formData.items.some(i => !i.title)}
                           className="w-full py-3.5 bg-foreground text-background rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-accent hover:text-white transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 border-none"
                        >
                           {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : editingTask ? (
                              <><CheckCircle2 className="h-4 w-4" /> Save Changes</>
                           ) : (
                              <><Zap className="h-4 w-4" /> Dispatch Allocations</>
                           )}
                        </button>
                     </div>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
}
