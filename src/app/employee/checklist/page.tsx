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
   Loader2
} from "lucide-react";
import { cn } from "@/utils/cn";

export default function ChecklistPage() {
   const supabase = createClient();
   const [projectsMap, setProjectsMap] = useState<Record<string, any>>({});
   const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
   const [completedTasks, setCompletedTasks] = useState<string[]>([]);
   const [showFeedback, setShowFeedback] = useState<string | null>(null);
   const [loading, setLoading] = useState(true);
   const [userName, setUserName] = useState("Loading...");

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
               projects (
                  id,
                  name
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
         const pId = allocation.checklists?.projects?.id;
         const pName = allocation.checklists?.projects?.name || "Unknown Project";
         
         if (!pId) return;
         if (!pMap[pId]) {
            pMap[pId] = { id: pId, name: pName, tasks: [] };
         }

         pMap[pId].tasks.push({
            alloc_id: allocation.id,
            id: allocation.checklists.id,
            title: allocation.checklists.title,
            status: allocation.status,
            difficulty: allocation.difficulty_rating || "Medium",
            impact: allocation.score_awarded || 100
         });

         if (allocation.status === 'completed') {
            completed.push(allocation.alloc_id);
         }
      });

      setProjectsMap(pMap);
      setCompletedTasks(completed);
      
      const pKeys = Object.keys(pMap);
      if (pKeys.length > 0) {
         setSelectedProjectId(pKeys[0]);
      }
      
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
         setShowFeedback(alloc_id);
      }

      // Update DB
      await supabase
         .from('checklist_allocations')
         .update({ status: newStatus })
         .eq('id', alloc_id);
   };

   const selectedProject = selectedProjectId ? projectsMap[selectedProjectId] : null;
   const projectKeys = Object.keys(projectsMap);

   const progressPerc = selectedProject && selectedProject.tasks.length > 0 
      ? Math.round((selectedProject.tasks.filter((t: any) => completedTasks.includes(t.alloc_id)).length / selectedProject.tasks.length) * 100)
      : 0;

   return (
      
         <div className="space-y-6 pb-16">

            {/* Page Header */}
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-2">
                  <ClipboardCheck className="h-5 w-5 text-accent" />
                  <h2 className="text-xl font-bold">Task Checklist</h2>
               </div>
               <div className="flex gap-2">
                  {projectKeys.map(key => (
                     <button
                        key={key}
                        onClick={() => setSelectedProjectId(key)}
                        className={cn(
                           "px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-widest transition-all border",
                           selectedProjectId === key
                              ? "bg-accent text-white border-accent"
                              : "bg-background text-muted-foreground border-secondary hover:border-accent/40"
                        )}
                     >
                        {projectsMap[key].name}
                     </button>
                  ))}
               </div>
            </div>

            {loading ? (
               <div className="h-64 flex flex-col items-center justify-center text-muted-foreground gap-4">
                  <Loader2 className="h-8 w-8 animate-spin text-accent" />
                  <p className="text-xs font-bold uppercase tracking-widest">Integrating Live Sub-routines...</p>
               </div>
            ) : !selectedProject ? (
               <div className="h-64 flex flex-col items-center justify-center text-muted-foreground gap-4 border border-secondary rounded-lg border-dashed">
                  <p className="text-sm font-bold">No active checklist allocations found.</p>
               </div>
            ) : (
               <>
                  {/* Progress Bar */}
                  <div className="bg-background border border-secondary rounded-lg p-4">
                     <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-bold">{selectedProject.name} — Progress</p>
                        <p className="text-sm font-black">{progressPerc}%</p>
                     </div>
                     <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-accent rounded-full transition-all duration-700" style={{ width: `${progressPerc}%` }} />
                     </div>
                     <div className="flex justify-between mt-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        <span>{selectedProject.tasks.filter((t: any) => completedTasks.includes(t.alloc_id)).length} of {selectedProject.tasks.length} completed</span>
                        <span>Status: Validated</span>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                     {/* Task List */}
                     <div className="lg:col-span-3 space-y-3">
                        <div className="flex items-center justify-between">
                           <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Tasks</h3>
                           <div className="flex gap-2">
                              <span className="px-3 py-1 bg-secondary/50 border border-secondary rounded-lg text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                                 Ongoing: {selectedProject.tasks.filter((t: any) => !completedTasks.includes(t.alloc_id)).length}
                              </span>
                              <span className="px-3 py-1 bg-foreground text-background rounded-lg text-[9px] font-bold uppercase tracking-widest">
                                 Total: {selectedProject.tasks.length}
                              </span>
                           </div>
                        </div>

                        {selectedProject.tasks.map((task: any) => {
                           const isChecked = completedTasks.includes(task.alloc_id);
                           return (
                              <div
                                 key={task.alloc_id}
                                 className={cn(
                                    "bg-background border rounded-lg p-4 transition-all group",
                                    isChecked ? "border-accent/30 opacity-70" : "border-secondary hover:border-accent/40 hover:shadow-sm"
                                 )}
                              >
                                 <div className="flex items-center gap-4">
                                    <button
                                       onClick={() => toggleTask(task.alloc_id, isChecked ? 'completed' : 'ongoing')}
                                       className={cn(
                                          "h-6 w-6 rounded-md flex items-center justify-center transition-all border shrink-0",
                                          isChecked
                                             ? "bg-accent border-accent text-white"
                                             : "bg-secondary border-secondary hover:border-accent"
                                       )}
                                    >
                                       <CheckCircle2 className={cn("h-4 w-4", isChecked ? "opacity-100" : "opacity-0")} />
                                    </button>

                                    <div className="flex-1 min-w-0">
                                       <p className={cn("text-sm font-bold transition-all", isChecked && "line-through opacity-40")}>{task.title}</p>
                                       <div className="flex items-center gap-3 mt-1">
                                          <span className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground">
                                             <Clock className="h-3 w-3 text-accent" /> Alloc_Ref: {task.alloc_id.slice(0, 5).toUpperCase()}
                                          </span>
                                          <span className={cn(
                                             "text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border",
                                             task.difficulty === 'Hard' ? "text-red-500 border-red-500/20 bg-red-500/5" : "text-accent border-accent/20 bg-accent/5"
                                          )}>
                                             {task.difficulty}
                                          </span>
                                       </div>
                                    </div>

                                    <div className="text-right shrink-0">
                                       <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">Impact</p>
                                       <span className="text-sm font-black flex items-center gap-1 group-hover:text-accent transition-colors">
                                          <Zap className="h-3.5 w-3.5 fill-accent text-accent" />
                                          +{task.impact}
                                       </span>
                                    </div>
                                 </div>
                              </div>
                           );
                        })}
                     </div>

                     {/* Side Panel */}
                     <div className="space-y-4">
                        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Insights</h3>
                        <div className="bg-background border border-secondary rounded-lg divide-y divide-secondary">
                           <InsightRow label="Avg Difficulty" value="Medium-Hard" color="text-red-500" />
                           <InsightRow label="Total Impact" value={`+${selectedProject.tasks.reduce((acc: number, t: any) => acc + (t.impact || 0), 0)} Pts`} color="text-foreground" />
                           <InsightRow label="Validation Delay" value="0.2ms" color="text-accent" />
                        </div>

                        <div className="bg-foreground text-background rounded-lg p-5 text-center">
                           <Target className="h-8 w-8 text-accent mx-auto mb-3 group-hover:rotate-6 transition-transform" />
                           <h5 className="font-bold text-sm">Sector Status</h5>
                           <p className="text-xs opacity-60 mt-2">Unit efficiency at 85%.</p>
                           <button className="mt-4 w-full py-2.5 bg-accent text-white rounded-lg font-bold text-xs uppercase tracking-widest hover:scale-105 transition-all">
                              Global Matrix
                           </button>
                        </div>
                     </div>
                  </div>
               </>
            )}

            {/* Feedback Modal */}
            {showFeedback && (
               <div className="fixed inset-0 bg-background/80 backdrop-blur-xl z-[100] flex items-center justify-center p-6">
                  <div className="bg-background w-full max-w-lg rounded-lg border border-secondary p-8 shadow-2xl animate-in zoom-in-95 duration-300">
                     <div className="text-center mb-6">
                        <div className="h-12 w-12 bg-accent text-white rounded-lg flex items-center justify-center mx-auto mb-4">
                           <Star className="h-6 w-6" />
                        </div>
                        <h3 className="text-lg font-bold">Task Completed</h3>
                        <p className="text-sm text-muted-foreground mt-1">Please rate the difficulty and leave feedback.</p>
                     </div>

                     <div className="space-y-4">
                        <div>
                           <label className="text-[10px] font-bold uppercase tracking-widest mb-2 block text-accent">Difficulty</label>
                           <div className="grid grid-cols-4 gap-2">
                              {["Low", "Med", "High", "Crit"].map(lvl => (
                                 <button key={lvl} className="py-2 border border-secondary rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-accent hover:text-white hover:border-accent transition-all">
                                    {lvl}
                                 </button>
                              ))}
                           </div>
                        </div>

                        <div>
                           <label className="text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-2 text-accent">
                              <MessageSquare className="h-3.5 w-3.5" /> Feedback
                           </label>
                           <textarea
                              className="w-full bg-secondary/20 border border-secondary focus:border-accent rounded-lg p-3 text-sm outline-none min-h-[100px] transition-all"
                              placeholder="Log any blockers or notes..."
                           />
                        </div>

                        <button
                           onClick={() => setShowFeedback(null)}
                           className="w-full py-3 bg-foreground text-background rounded-lg font-bold text-sm uppercase tracking-widest hover:bg-accent transition-all flex items-center justify-center gap-2"
                        >
                           Submit <ArrowUpRight className="h-4 w-4" />
                        </button>
                     </div>
                  </div>
               </div>
            )}
         </div>
      
   );
}

function InsightRow({ label, value, color }: any) {
   return (
      <div className="flex justify-between items-center p-4">
         <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
         <p className={cn("text-sm font-bold", color)}>{value}</p>
      </div>
   );
}
