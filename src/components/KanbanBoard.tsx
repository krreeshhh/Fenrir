"use client"

import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Calendar, MoreHorizontal, User, Clock, Zap, Target, Layers, ShieldCheck, ArrowUpRight, Activity } from "lucide-react";
import { cn } from "@/utils/cn";
import { createClient } from "@/utils/supabase";

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
        <div className="flex items-center justify-center min-h-[400px]">
           <div className="flex flex-col items-center gap-4">
              <div className="h-12 w-12 border-4 border-muted border-t-secondary-foreground rounded-full animate-spin"></div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Syncing Operational Nodes...</p>
           </div>
        </div>
     )
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 h-full min-h-[600px] p-6">
        {columns.map((col) => (
          <div key={col.id} className="flex flex-col rounded-[48px] border-4 border-secondary/5 bg-background shadow-inner h-full">
            <div className="flex items-center justify-between p-8 border-b-2 border-muted/50">
               <div className="flex items-center gap-4">
                  <div className="h-10 w-10 bg-muted rounded-xl flex items-center justify-center text-secondary-foreground">
                     <col.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-black text-lg tracking-tighter uppercase">
                    {col.title}
                  </h3>
               </div>
               <span className="bg-secondary-foreground text-secondary text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg">
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
                              "bg-background p-8 rounded-[40px] border-4 border-muted shadow-sm transition-all duration-300 group hover:border-secondary-foreground relative overflow-hidden active:scale-95",
                              snapshot.isDragging ? "ring-8 ring-secondary/20 shadow-3xl scale-105 z-50 border-secondary-foreground" : "hover:translate-x-1"
                            )}
                          >
                            <div className="flex justify-between items-center mb-6">
                              <span className={cn(
                                "text-[9px] font-black uppercase tracking-[0.2em] px-3.5 py-1.5 rounded-full border-2 transition-all",
                                task.priority === "High" ? "bg-red-500/10 text-red-600 border-red-500/20" :
                                task.priority === "Medium" ? "bg-yellow-500/10 text-yellow-600 border-yellow-500/20" :
                                "bg-blue-500/10 text-blue-600 border-blue-500/20"
                              )}>
                                {task.priority} Priority
                              </span>
                              <div className="text-[10px] font-black text-muted-foreground transition-colors group-hover:text-secondary-foreground flex items-center gap-2">
                                <Clock className="h-3 w-3" /> {task.deadline}
                              </div>
                            </div>
                            
                            <h4 className="font-black text-xl tracking-tight mb-3 group-hover:text-secondary-foreground leading-none">{task.title}</h4>
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-10 flex items-center gap-2">
                               <Target className="h-3 w-3" /> {task.project}
                            </p>

                            <div className="flex items-center justify-between pt-6 border-t-2 border-muted/50">
                                <div className="flex -space-x-3">
                                   <div className="h-10 w-10 rounded-xl bg-secondary text-secondary-foreground border-2 border-background flex items-center justify-center text-[10px] font-black shadow-md">ME</div>
                                   <div className="h-10 w-10 rounded-xl bg-muted border-2 border-background flex items-center justify-center text-[10px] font-black shadow-md">SM</div>
                                </div>
                                <button className="h-12 w-12 rounded-2xl bg-muted group-hover:bg-secondary-foreground group-hover:text-secondary flex items-center justify-center transition-all shadow-xl group-hover:scale-110">
                                   <ArrowUpRight className="h-6 w-6" />
                                </button>
                            </div>

                            <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-5 translate-x-10 group-hover:translate-x-0 transition-all pointer-events-none">
                               <Zap className="h-20 w-20" />
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
