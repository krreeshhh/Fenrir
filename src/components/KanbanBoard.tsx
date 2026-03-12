"use client"

import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Calendar, MoreHorizontal, User, Clock, Zap, Target, Layers, ShieldCheck, ArrowUpRight, Activity } from "lucide-react";
import { cn } from "@/utils/cn";
import { createClient } from "@/utils/supabase";
import { Skeleton } from "./Skeleton";

export type TaskStatus = "not_started" | "ongoing" | "completed";

export interface Task {
  id: string;
  title: string;
  project: string;
  priority: "Low" | "Medium" | "High";
  deadline: string;
  status: TaskStatus;
}

const columns: { id: TaskStatus; title: string, icon: any }[] = [
  { id: "not_started", title: "Node Queue", icon: Layers },
  { id: "ongoing", title: "Operational", icon: Activity },
  { id: "completed", title: "Validated", icon: ShieldCheck },
];

export default function KanbanBoard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('checklist_allocations')
      .select(`
        id,
        status,
        deadline,
        difficulty_rating,
        checklists (
          title,
          projects (
            name
          )
        )
      `)
      .eq('employee_id', user.id);

    if (error) {
      console.error("Error fetching tasks:", error);
    } else if (data) {
      const formattedTasks: Task[] = data.map((item: any) => ({
        id: item.id,
        title: item.checklists?.title || "Untitled Task",
        project: item.checklists?.projects?.name || "No Project",
        priority: (item.difficulty_rating || "Medium") as any,
        deadline: item.deadline ? new Date(item.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase() : "NO DATE",
        status: item.status as TaskStatus
      }));
      setTasks(formattedTasks);
    }
    setLoading(false);
  };

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newStatus = destination.droppableId as TaskStatus;
    
    // Optimistic update
    const newTasks = Array.from(tasks);
    const taskIndex = newTasks.findIndex(t => t.id === draggableId);
    if (taskIndex !== -1) {
      newTasks[taskIndex].status = newStatus;
      setTasks(newTasks);
    }

    // Persist to DB
    const { error } = await supabase
      .from('checklist_allocations')
      .update({ status: newStatus })
      .eq('id', draggableId);

    if (error) {
      console.error("Error updating task status:", error);
      fetchTasks(); // Rollback if error
    }
  };

  if (loading) {
     return (
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
            {[1, 2, 3].map((i) => (
               <div key={i} className="flex flex-col rounded-2xl border bg-background shadow-sm h-[600px] p-6 space-y-6">
                  <div className="flex items-center justify-between">
                     <Skeleton className="h-6 w-32" />
                     <Skeleton className="h-6 w-6 rounded-full" />
                  </div>
                  <div className="space-y-4 pt-6">
                     <Skeleton className="h-32 w-full rounded-xl" />
                     <Skeleton className="h-32 w-full rounded-xl" />
                  </div>
               </div>
            ))}
         </div>
     )
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full min-h-[600px] p-6">
        {columns.map((col) => (
          <div key={col.id} className="flex flex-col rounded-2xl border border-secondary/20 bg-background shadow-sm h-full">
            <div className="flex items-center justify-between p-6 border-b border-secondary/20 bg-secondary/5">
               <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-background border rounded-lg flex items-center justify-center text-secondary-foreground shadow-sm">
                     <col.icon className="h-4 w-4 text-accent" />
                  </div>
                  <h3 className="font-bold text-sm tracking-tight">
                    {col.title}
                  </h3>
               </div>
               <span className="bg-secondary/20 border border-secondary text-foreground text-xs font-bold px-2.5 py-1 rounded-md shadow-sm">
                 {tasks.filter(t => t.status === col.id).length}
               </span>
            </div>

            <Droppable droppableId={col.id}>
              {(provided, snapshot) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className={cn(
                    "flex-1 flex flex-col gap-6 p-6 min-h-[300px] transition-all duration-500",
                    snapshot.isDraggingOver ? "bg-secondary/5 rotate-1" : "bg-transparent"
                  )}
                >
                  {tasks
                    .filter((task) => task.status === col.id)
                    .map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={cn(
                              "bg-background p-6 rounded-xl border border-secondary/50 shadow-sm transition-all duration-300 group hover:border-accent/40 relative overflow-hidden active:scale-[0.98]",
                              snapshot.isDragging ? "ring-2 ring-accent/20 shadow-lg scale-[1.02] z-50 border-accent" : "hover:-translate-y-1 hover:shadow-md"
                            )}
                          >
                            <div className="flex justify-between items-center mb-4">
                              <span className={cn(
                                "text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border transition-all",
                                task.priority === "High" ? "bg-red-500/5 text-red-600 border-red-500/20" :
                                task.priority === "Medium" ? "bg-amber-500/5 text-amber-600 border-amber-500/20" :
                                "bg-blue-500/5 text-blue-600 border-blue-500/20"
                              )}>
                                {task.priority} Priority
                              </span>
                              <div className="text-[10px] font-bold text-muted-foreground flex items-center gap-1.5">
                                <Clock className="h-3 w-3" /> {task.deadline}
                              </div>
                            </div>
                            
                            <h4 className="font-bold text-base tracking-tight mb-2 group-hover:text-accent transition-colors leading-tight">{task.title}</h4>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-6 flex items-center gap-2">
                               <Target className="h-3 w-3" /> {task.project}
                            </p>

                            <div className="flex items-center justify-between pt-4 border-t border-secondary/30">
                                <div className="flex -space-x-2">
                                   <div className="h-8 w-8 rounded-full bg-secondary text-secondary-foreground border-2 border-background flex items-center justify-center text-[10px] font-bold shadow-sm">ME</div>
                                   <div className="h-8 w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[10px] font-bold shadow-sm">SM</div>
                                </div>
                                <button className="h-8 w-8 rounded-lg bg-secondary/50 hover:bg-accent hover:text-white flex items-center justify-center transition-all shadow-sm">
                                   <ArrowUpRight className="h-4 w-4" />
                                </button>
                            </div>

                            <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-5 translate-x-4 group-hover:translate-x-0 transition-all pointer-events-none">
                               <Zap className="h-16 w-16" />
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
}
