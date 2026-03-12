"use client"

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase";
import {
   CheckCircle2,
   AlertCircle,
   MessageSquare,
   Star,
   Zap,
   Target,
   ClipboardCheck,
   Clock,
   ArrowUpRight,
   Activity,
   ChevronLeft,
   Layers,
   ArrowRight,
   Frown,
   Meh,
   Smile,
   Briefcase,
   ShieldCheck,
   Sparkles,
   ChevronDown,
   ChevronUp
} from "lucide-react";
import { cn } from "@/utils/cn";
import { ListSkeleton } from "@/components/Skeleton";

export default function ChecklistPage() {
   const supabase = createClient();
   const [projectsMap, setProjectsMap] = useState<Record<string, any>>({});
   const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
   const [completedTasks, setCompletedTasks] = useState<string[]>([]);
   const [showFeedback, setShowFeedback] = useState<string | null>(null);
   const [loading, setLoading] = useState(true);
   const [userName, setUserName] = useState("Loading...");
   const [feedbackData, setFeedbackData] = useState({ rating: '', reference: '' });
   const [expandedProject, setExpandedProject] = useState<string | null>(null);

   useEffect(() => {
      fetchAllocations();
   }, []);

   const fetchAllocations = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUserName(user.user_metadata?.full_name || user.email?.split('@')[0] || "Employee");

      // Fetch the employee's assigned tasks joined thoughtfully with the checklists and projects
      const { data, error } = await supabase
         .from('checklist_allocations')
         .select(`
            id,
            status,
            difficulty_rating,
            score_awarded,
            checklists (
               id,
               title,
               description,
               projects (
                  id,
                  name,
                  description,
                  deadline,
                  priority,
                  risk_factor,
                  latency
               )
            )
         `)
         .eq('employee_id', user.id);

      if (error || !data) {
         console.error(error);
         setLoading(false);
         return;
      }

      // Reformat the raw join back into the map we need
      const pMap: Record<string, any> = {};
      const completed: string[] = [];
      
      data.forEach((allocation: any) => {
         // Support both array and object response patterns from Supabase
         const checklist = Array.isArray(allocation.checklists) ? allocation.checklists[0] : allocation.checklists;
         const project = Array.isArray(checklist?.projects) ? checklist.projects[0] : checklist?.projects;

         const pId = project?.id;
         const pName = project?.name || "Unknown Cluster";
         
         if (!pId) return;
         if (!pMap[pId]) {
            pMap[pId] = { 
               id: pId, 
               name: pName, 
               description: project?.description || "High-level operational cluster focusing on systemic integration.",
               deadline: project?.deadline || "2024-12-31",
               priority: project?.priority || "Medium",
               riskFactor: project?.risk_factor || "Optimal",
               latency: project?.latency || "18ms",
               tasks: [] 
            };
         }

         pMap[pId].tasks.push({
            alloc_id: allocation.id,
            id: checklist?.id,
            title: checklist?.title || "Untitled Directive",
            description: checklist?.description || "No specific mission parameters provided for this node.",
            status: allocation.status,
            difficulty: allocation.difficulty_rating || "Medium",
            impact: allocation.score_awarded || 100
         });

         if (allocation.status === 'completed') {
            completed.push(allocation.id);
         }
      });

      setProjectsMap(pMap);
      setCompletedTasks(completed);
      
      // We no longer auto-select the first project
      setSelectedProjectId(null);
      
      setLoading(false);
   };
   const toggleTask = async (alloc_id: string, currentStatus: string) => {
      const isCompleted = currentStatus === 'completed';
      const newStatus = isCompleted ? 'ongoing' : 'completed';

      // Optimistic update
      if (isCompleted) {
         setCompletedTasks(prev => prev.filter(id => id !== alloc_id));
      } else {
         setCompletedTasks(prev => [...prev, alloc_id]);
         setFeedbackData({ rating: '', reference: '' });
         setShowFeedback(alloc_id);
      }

      // Update DB for task
      await supabase
         .from('checklist_allocations')
         .update({ status: newStatus })
         .eq('id', alloc_id);

      // Recursive update of local projectsMap for column consistency
      const updatedMap = { ...projectsMap };
      let affectedProjectId = null;
      for (const pId in updatedMap) {
         const taskIdx = updatedMap[pId].tasks.findIndex((t: any) => t.alloc_id === alloc_id);
         if (taskIdx !== -1) {
            updatedMap[pId].tasks[taskIdx].status = newStatus;
            affectedProjectId = pId;
            break;
         }
      }
      setProjectsMap(updatedMap);

      // If we are unchecking, we still need to update the project completion in DB
      if (isCompleted && affectedProjectId) {
         const proj = updatedMap[affectedProjectId];
         const doneCount = proj.tasks.filter((t: any) => completedTasks.includes(t.alloc_id) && t.alloc_id !== alloc_id).length;
         const totalCount = proj.tasks.length;
         const newPerc = Math.round((doneCount / totalCount) * 100);

         await supabase
            .from('projects')
            .update({ 
               completion_percentage: newPerc,
               status: 'active' // Definitely not completed if we just unchecked something
            })
            .eq('id', affectedProjectId);
      }
   };

   const submitFeedback = async () => {
      if (!showFeedback) return;
      
      // 1. Update the allocation with feedback
      await supabase
         .from('checklist_allocations')
         .update({ 
            difficulty_rating: feedbackData.rating,
            employee_note: feedbackData.reference 
         })
         .eq('id', showFeedback);

      // 2. Refresh project completion in DB
      if (selectedProject) {
         const doneCount = selectedProject.tasks.filter((t: any) => 
            completedTasks.includes(t.alloc_id) || t.alloc_id === showFeedback
         ).length;
         const totalCount = selectedProject.tasks.length;
         const newPerc = Math.round((doneCount / totalCount) * 100);

         await supabase
            .from('projects')
            .update({ 
               completion_percentage: newPerc,
               status: newPerc === 100 ? 'completed' : 'active'
            })
            .eq('id', selectedProject.id);
      }
      
      // 3. Full Refresh to sync Kanban views/Stats
      await fetchAllocations();
      setShowFeedback(null);
   };

   const selectedProject = selectedProjectId ? projectsMap[selectedProjectId] : null;

   const safeDate = (dateStr: string) => {
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? "TBD" : d.toLocaleDateString();
   };

   const projectValues = Object.values(projectsMap);

   const getProjectStatus = (project: any) => {
      const done = project.tasks.filter((t: any) => completedTasks.includes(t.alloc_id)).length;
      const total = project.tasks.length;
      if (done === 0) return 'new';
      if (done === total) return 'completed';
      return 'ongoing';
   };

   const priorityWeight: Record<string, number> = { 'High': 3, 'Medium': 2, 'Low': 1 };

   const sortProjects = (projs: any[]) => {
      return [...projs].sort((a, b) => {
         const pA = priorityWeight[a.priority] || 0;
         const pB = priorityWeight[b.priority] || 0;
         if (pB !== pA) return pB - pA;
         return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      });
   };

   const newlyAllocated = sortProjects(projectValues.filter(p => getProjectStatus(p) === 'new'));
   const ongoingProjects = sortProjects(projectValues.filter(p => getProjectStatus(p) === 'ongoing'));
   const completedProjects = sortProjects(projectValues.filter(p => getProjectStatus(p) === 'completed'));

   const progressPerc = selectedProject && selectedProject.tasks.length > 0 
      ? Math.round((selectedProject.tasks.filter((t: any) => completedTasks.includes(t.alloc_id)).length / selectedProject.tasks.length) * 100)
      : 0;

   return (
      
         <div className="space-y-6 pb-16">

            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
               <div className="flex items-center gap-2">
                  <ClipboardCheck className="h-5 w-5 text-accent" />
                  <h2 className="text-xl font-bold">{selectedProjectId ? "Project Checklist" : "Mission Clusters"}</h2>
               </div>
               {selectedProjectId && (
                  <button 
                     onClick={() => setSelectedProjectId(null)}
                     className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-accent hover:underline"
                  >
                     <ChevronLeft className="h-4 w-4" /> Back to Clusters
                  </button>
               )}
            </div>

            {loading ? (
               <ListSkeleton />
            ) : !selectedProject ? (
               <div className="space-y-8">
                  {/* Newly Allocated Section */}
                  <AccordionSection 
                     title="Fresh Missions" 
                     projects={newlyAllocated}
                     icon={<Zap className="h-5 w-5 text-accent" />}
                     expanded={expandedProject}
                     onToggle={(id: string) => setExpandedProject(expandedProject === id ? null : id)}
                     completedTasks={completedTasks}
                     onToggleTask={toggleTask}
                     safeDate={safeDate}
                  />

                  {/* Ongoing Operations Section */}
                  <AccordionSection 
                     title="Active Synchronization" 
                     projects={ongoingProjects}
                     icon={<Activity className="h-5 w-5 text-amber-500" />}
                     expanded={expandedProject}
                     onToggle={(id: string) => setExpandedProject(expandedProject === id ? null : id)}
                     completedTasks={completedTasks}
                     onToggleTask={toggleTask}
                     safeDate={safeDate}
                  />

                  {/* Finished Section */}
                  <AccordionSection 
                     title="Validated Clusters" 
                     projects={completedProjects}
                     icon={<CheckCircle2 className="h-5 w-5 text-green-500" />}
                     expanded={expandedProject}
                     onToggle={(id: string) => setExpandedProject(expandedProject === id ? null : id)}
                     completedTasks={completedTasks}
                     onToggleTask={toggleTask}
                     safeDate={safeDate}
                  />
               </div>
            ) : (
               /* Task Checklist View */
               <>
                  {/* Progress Header */}
                  <div className="bg-background border border-secondary rounded-xl p-6 shadow-sm relative overflow-hidden">
                     <div className="absolute top-0 right-0 p-6 opacity-5">
                        <Target className="h-20 w-20 text-accent" />
                     </div>
                     <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                        <div className="flex items-center gap-6">
                           <div className={cn(
                              "h-16 w-1 border-r-4 rounded-full",
                              selectedProject.priority === 'High' ? "border-red-500" :
                              selectedProject.priority === 'Medium' ? "border-amber-500" :
                              "border-green-500"
                           )} />
                           <div>
                              <p className="text-xs font-bold text-accent uppercase tracking-wider mb-1">Operational Cluster — {selectedProject.priority} Priority</p>
                              <h2 className="text-2xl font-bold uppercase tracking-tight">{selectedProject.name}</h2>
                              <p className="text-xs font-bold text-muted-foreground uppercase mt-1">Completion Window: {safeDate(selectedProject.deadline)}</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-6">
                           <div className="text-right">
                              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Sync Progress</p>
                              <p className="text-3xl font-bold text-foreground">{progressPerc}%</p>
                           </div>
                           <div className="w-48 h-3 bg-secondary rounded-full overflow-hidden border border-secondary">
                              <div className="h-full bg-accent rounded-full transition-all duration-1000" style={{ width: `${progressPerc}%` }} />
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                     {/* Task List */}
                     <div className="lg:col-span-3 space-y-4">
                        <div className="flex items-center justify-between">
                           <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                              <ClipboardCheck className="h-5 w-5 text-accent" /> Deployment Nodes
                           </h3>
                           <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                              {selectedProject.tasks.filter((t: any) => completedTasks.includes(t.alloc_id)).length} / {selectedProject.tasks.length} Completed
                           </span>
                        </div>

                        {selectedProject.tasks.map((task: any) => {
                           const isChecked = completedTasks.includes(task.alloc_id);
                           return (
                              <div
                                 key={task.alloc_id}
                                 className={cn(
                                    "bg-background border rounded-xl p-5 transition-all group relative overflow-hidden",
                                    isChecked ? "border-accent/20 bg-accent/5" : "border-secondary hover:border-accent/40 shadow-sm"
                                 )}
                              >
                                 <div className="flex items-start gap-5">
                                    <button
                                       onClick={() => toggleTask(task.alloc_id, isChecked ? 'completed' : 'ongoing')}
                                       className={cn(
                                          "h-7 w-7 rounded-lg flex items-center justify-center transition-all border shrink-0 mt-1",
                                          isChecked
                                             ? "bg-accent border-accent text-white shadow-lg shadow-accent/20"
                                             : "bg-secondary/40 border-secondary hover:border-accent"
                                       )}
                                    >
                                       <CheckCircle2 className={cn("h-5 w-5", isChecked ? "scale-110" : "scale-0")} />
                                    </button>

                                    <div className="flex-1 min-w-0">
                                       <div className="flex justify-between items-start">
                                          <div>
                                             <p className={cn("text-base font-bold uppercase tracking-tight transition-all", isChecked && "text-muted-foreground line-through")}>
                                                {task.title}
                                             </p>
                                             <p className="text-[11px] font-bold text-muted-foreground mt-1 leading-relaxed">
                                                MISSION DIRECTIVE: {task.description}
                                             </p>
                                          </div>
                                          <div className="text-right hidden sm:block">
                                             <p className="text-[11px] font-bold text-muted-foreground uppercase mb-1">Impact</p>
                                             <p className="text-lg font-bold text-accent">+{task.impact}</p>
                                          </div>
                                       </div>
                                       
                                       <div className="flex items-center gap-4 mt-4">
                                          <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground bg-secondary/20 px-2 py-1 rounded">
                                             <Clock className="h-3 w-3 text-accent" /> REF: {task.alloc_id.slice(0, 8).toUpperCase()}
                                          </span>
                                          <span className={cn(
                                             "text-[11px] font-bold uppercase tracking-wider px-2 py-1 rounded border",
                                             task.difficulty === 'Hard' ? "text-red-500 border-red-500/20 bg-red-500/5" : "text-accent border-accent/20 bg-accent/5"
                                          )}>
                                             {task.difficulty} Complexity
                                          </span>
                                       </div>
                                    </div>
                                 </div>
                              </div>
                           );
                        })}
                     </div>

                     {/* Side Panel */}
                     <div className="space-y-6">
                        <div className="bg-background border border-secondary rounded-xl p-6 shadow-sm">
                           <h3 className="text-sm font-bold uppercase tracking-wider mb-6">Cluster Analysis</h3>
                           <div className="space-y-6">
                              <div className="divide-y divide-secondary/50">
                                 <InsightRow label="Total Nodes" value={selectedProject.tasks.length} />
                                 <InsightRow label="Operational Impact" value={`${selectedProject.tasks.reduce((acc: number, t: any) => acc + t.impact, 0)} PNT`} color="text-accent" />
                                 <InsightRow label="Sync Latency" value={selectedProject.latency} />
                                 <InsightRow label="Risk Factor" value={selectedProject.riskFactor} color={selectedProject.riskFactor === 'High' ? 'text-red-500' : 'text-green-500'} />
                              </div>
                           </div>
                        </div>

                        <div className="bg-foreground text-background rounded-2xl p-8 text-center shadow-xl relative overflow-hidden group">
                           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-150 transition-transform duration-700">
                              <Star className="h-16 w-16 text-accent" />
                           </div>
                           <ShieldCheck className="h-10 w-10 text-accent mx-auto mb-4" />
                           <h5 className="font-bold text-xs uppercase tracking-wider">Validated Node</h5>
                           <p className="text-[11px] font-bold opacity-60 mt-4 uppercase tracking-wider leading-relaxed">Cluster integrity is maintained via real-time global matrix synchronization.</p>
                        </div>
                     </div>
                  </div>
               </>
            )}

            {/* Feedback Modal */}
            {showFeedback && (
               <div className="fixed inset-0 bg-background/80 backdrop-blur-xl z-[100] flex items-center justify-center p-6">
                  <div className="bg-background w-full max-w-lg rounded-2xl border border-secondary p-8 shadow-2xl animate-in zoom-in-95 duration-300 relative overflow-hidden">
                     <div className="absolute top-0 right-0 p-8 opacity-5">
                        <Sparkles className="h-32 w-32 text-accent" />
                     </div>
                     
                     <div className="text-center mb-8 relative z-10">
                        <div className="h-16 w-16 bg-accent text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-accent/20">
                           <Star className="h-8 w-8" />
                        </div>
                        <h3 className="text-2xl font-bold uppercase tracking-tight">Mission Sync Complete</h3>
                        <p className="text-sm font-bold text-muted-foreground mt-2 uppercase tracking-wider">How was the task transition?</p>
                     </div>

                     <div className="space-y-8 relative z-10">
                        <div className="space-y-4">
                           <label className="text-xs font-bold uppercase tracking-wider text-accent text-center block">Operational Sentiments</label>
                           <div className="grid grid-cols-3 gap-4">
                              {[
                                 { emoji: "😩", label: "Struggling", color: "hover:bg-red-500", text: "text-red-500" },
                                 { emoji: "😐", label: "Okay", color: "hover:bg-amber-500", text: "text-amber-500" },
                                 { emoji: "💪", label: "Crushing it", color: "hover:bg-green-500", text: "text-green-500" }
                              ].map(node => (
                                 <button 
                                    key={node.label} 
                                    onClick={() => setFeedbackData({...feedbackData, rating: node.label})}
                                    className={cn(
                                       "flex flex-col items-center gap-3 p-4 border border-secondary rounded-xl transition-all group scale-100 active:scale-95",
                                       feedbackData.rating === node.label ? "bg-accent border-accent text-white" : "hover:border-accent/40"
                                    )}
                                 >
                                    <span className="text-3xl">{node.emoji}</span>
                                    <span className={cn("text-[11px] font-bold uppercase tracking-wider", feedbackData.rating === node.label ? "text-white" : "text-muted-foreground")}>
                                       {node.label}
                                    </span>
                                 </button>
                              ))}
                           </div>
                        </div>

                        <div className="space-y-4">
                           <label className="text-xs font-bold uppercase tracking-wider text-accent flex items-center gap-2">
                              <MessageSquare className="h-3.5 w-3.5" /> Mission References / Notes (Optional)
                           </label>
                           <div className="relative">
                              <textarea
                                 value={feedbackData.reference}
                                 onChange={e => setFeedbackData({...feedbackData, reference: e.target.value})}
                                 className="w-full bg-secondary/20 border border-secondary focus:border-accent/40 rounded-xl p-4 text-[13px] font-bold outline-none min-h-[120px] transition-all shadow-inner focus:shadow-xl placeholder:text-muted-foreground/30"
                                 placeholder="Log any blockers, technical references, or deployment notes..."
                              />
                           </div>
                        </div>

                        <button
                           onClick={submitFeedback}
                           className="w-full py-5 bg-foreground text-background rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-accent transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95"
                        >
                           SYNC TO MATRIX <ArrowUpRight className="h-5 w-5" />
                        </button>
                     </div>
                  </div>
               </div>
            )}
         </div>
      
   );
}

function AccordionSection({ title, projects, icon, expanded, onToggle, completedTasks, onToggleTask, safeDate }: any) {
   if (projects.length === 0) return null;

   return (
      <div className="space-y-4">
         <div className="flex items-center gap-2 px-2">
            {icon}
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{title}</h3>
         </div>
         <div className="space-y-4">
            {projects.map((project: any) => {
               const isExpanded = expanded === project.id;
               const doneCount = project.tasks.filter((t: any) => completedTasks.includes(t.alloc_id)).length;
               const totalCount = project.tasks.length;
               const progress = Math.round((doneCount / totalCount) * 100);

               return (
                  <div 
                     key={project.id}
                     className="bg-background border border-secondary rounded-xl overflow-hidden transition-all duration-300 shadow-sm hover:border-accent/40"
                  >
                     <button 
                        onClick={() => onToggle(project.id)}
                        className={cn(
                           "flex w-full items-center justify-between p-6 text-left transition-colors group",
                           isExpanded ? "bg-secondary/10" : "hover:bg-secondary/5"
                        )}
                     >
                        <div className="flex items-center gap-4">
                           <div className={cn(
                              "h-12 w-1 border-r-4 rounded-full",
                              project.priority === 'High' ? "border-red-500" :
                              project.priority === 'Medium' ? "border-amber-500" :
                              "border-green-500"
                           )} />
                           <div>
                              <h3 className="text-xl font-bold uppercase tracking-tighter text-foreground group-hover:text-accent transition-colors">
                                 {project.name}
                              </h3>
                              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">
                                 Window: {safeDate(project.deadline)}
                              </p>
                           </div>
                        </div>

                        <div className="flex items-center gap-8">
                           <div className="flex items-center gap-6">
                              <div className="flex items-center gap-3">
                                 <span className="text-lg font-bold text-foreground uppercase tracking-tighter">{doneCount}/{totalCount}</span>
                                 <div className="h-3 w-32 border-2 border-secondary bg-secondary/10 hidden sm:block relative">
                                    <div 
                                       className="h-full bg-accent transition-all duration-700" 
                                       style={{ width: `${progress}%` }}
                                    />
                                 </div>
                              </div>
                              <div className={cn(
                                 "transition-transform duration-300",
                                 isExpanded ? "rotate-180" : "rotate-0"
                              )}>
                                 <ChevronDown className="h-6 w-6 text-accent" />
                              </div>
                           </div>
                        </div>
                     </button>

                     <div className={cn(
                        "overflow-hidden transition-all duration-500 ease-in-out bg-background border-t border-secondary",
                        isExpanded ? "max-h-[2000px] opacity-100 p-6 md:p-8" : "max-h-0 opacity-0 p-0"
                     )}>
                        <div className="space-y-4">
                           {project.tasks.map((task: any) => {
                              const isChecked = completedTasks.includes(task.alloc_id);
                              return (
                                 <button
                                    key={task.alloc_id}
                                    onClick={() => onToggleTask(task.alloc_id, isChecked ? 'completed' : 'ongoing')}
                                    className={cn(
                                       "flex w-full items-start gap-4 p-5 rounded-xl border transition-all group relative active:scale-[0.99]",
                                       isChecked 
                                          ? "opacity-60 grayscale-[0.5] border-secondary bg-secondary/10 shadow-none" 
                                          : "border-secondary hover:border-accent bg-background shadow-sm hover:shadow-md hover:-translate-y-0.5"
                                    )}
                                 >
                                    <div className="mt-1 flex-shrink-0">
                                       <div className={cn(
                                          "w-6 h-6 rounded-md border flex items-center justify-center transition-all",
                                          isChecked ? "bg-accent border-accent text-white" : "bg-background border-secondary"
                                       )}>
                                          {isChecked && <CheckCircle2 className="h-3.5 w-3.5" />}
                                       </div>
                                    </div>
                                    <div className="flex-1 text-left">
                                       <span className={cn(
                                          "text-lg font-bold leading-tight uppercase tracking-tighter transition-all block",
                                          isChecked ? "text-muted-foreground line-through" : "text-foreground group-hover:text-accent"
                                       )}>
                                          {task.title}
                                       </span>
                                       <p className="text-xs font-bold text-muted-foreground mt-1 uppercase tracking-wide opacity-70">
                                          Mission directive: {task.description}
                                       </p>
                                    </div>
                                    <div className="text-right">
                                       <span className="text-xs font-bold text-accent uppercase tracking-wider">+{task.impact} IMPACT</span>
                                    </div>
                                 </button>
                              );
                           })}
                        </div>
                     </div>
                  </div>
               );
            })}
         </div>
      </div>
   );
}

function InsightRow({ label, value, color }: any) {
   return (
      <div className="flex justify-between items-center p-4">
         <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
         <p className={cn("text-sm font-bold", color)}>{value}</p>
      </div>
   );
}
