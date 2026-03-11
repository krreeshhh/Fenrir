"use client"

import {
   Calendar,
   Video,
   MapPin,
   Clock,
   ChevronLeft,
   ChevronRight,
   ArrowUpRight,
   Monitor,
   Plus
} from "lucide-react";
import { cn } from "@/utils/cn";

const upcomingMeetings = [
   { id: 1, title: "Kickoff: Project Hydra", time: "10:00 AM - 11:00 AM", date: "Today", type: "Google Meet", organizer: "James Lead", zoom: true },
   { id: 2, title: "Sprint Planning", time: "2:00 PM - 3:00 PM", date: "Tomorrow", type: "Google Meet", organizer: "Sarah Manager", zoom: true },
   { id: 3, title: "1:1 with Manager", time: "4:00 PM - 4:30 PM", date: "Friday", type: "In Person", organizer: "Sarah Manager", zoom: false },
];

export default function MeetingsPage() {
   return (
      
         <div className="space-y-6 pb-16">

            {/* Page Header */}
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-accent" />
                  <h2 className="text-xl font-bold">Meetings</h2>
               </div>
               <button className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg font-bold text-xs uppercase tracking-widest hover:scale-105 transition-all">
                  <Plus className="h-4 w-4" /> Schedule
               </button>
            </div>

            {/* Next Meeting Banner */}
            <div className="bg-background border border-accent/30 rounded-lg p-5 flex items-center justify-between">
               <div>
                  <p className="text-[10px] font-bold text-accent uppercase tracking-widest mb-1">Next Meeting</p>
                  <h3 className="text-base font-bold">Kickoff: Project Hydra</h3>
                  <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                     <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> 10:00 AM Today</span>
                     <span className="flex items-center gap-1"><Monitor className="h-3.5 w-3.5" /> Google Meet</span>
                  </div>
               </div>
               <button className="flex items-center gap-2 px-5 py-2.5 bg-foreground text-background rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-accent transition-all">
                  <Video className="h-4 w-4" /> Join Now
               </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
               {/* Calendar */}
               <div className="space-y-4">
                  <div className="bg-background border border-secondary rounded-lg p-5">
                     <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold">March 2026</h3>
                        <div className="flex gap-1">
                           <button className="h-7 w-7 rounded-lg bg-secondary flex items-center justify-center hover:bg-foreground hover:text-background transition-all">
                              <ChevronLeft className="h-4 w-4" />
                           </button>
                           <button className="h-7 w-7 rounded-lg bg-secondary flex items-center justify-center hover:bg-foreground hover:text-background transition-all">
                              <ChevronRight className="h-4 w-4" />
                           </button>
                        </div>
                     </div>

                     <div className="grid grid-cols-7 gap-1 text-center text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 mb-2">
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <span key={i}>{d}</span>)}
                     </div>

                     <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold">
                        {Array.from({ length: 31 }).map((_, i) => (
                           <div
                              key={i}
                              className={cn(
                                 "h-8 flex justify-center items-center rounded-lg cursor-pointer transition-all",
                                 (i + 1) === 11 ? "bg-foreground text-background shadow-lg scale-110 z-10" :
                                    [10, 14, 22].includes(i + 1) ? "bg-accent/10 text-accent font-black" :
                                       "text-muted-foreground/30 hover:bg-secondary"
                              )}
                           >
                              {i + 1}
                              {[10, 14, 22].includes(i + 1) && (i + 1) !== 11 && (
                                 <span className="absolute bottom-1 w-1 h-1 bg-accent rounded-full" />
                              )}
                           </div>
                        ))}
                     </div>
                  </div>

                  <button className="w-full py-3 bg-background border border-secondary rounded-lg font-bold text-xs uppercase tracking-widest text-muted-foreground hover:bg-foreground hover:text-background transition-all flex items-center justify-center gap-2">
                     <Calendar className="h-4 w-4" /> New Meeting
                  </button>
               </div>

               {/* Meeting List */}
               <div className="lg:col-span-3 space-y-3">
                  <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Upcoming Meetings</h3>
                  <div className="bg-background border border-secondary rounded-lg divide-y divide-secondary">
                     {upcomingMeetings.map((mtg) => (
                        <div key={mtg.id} className="p-4 hover:bg-secondary/10 transition-colors group">
                           <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                 <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 bg-foreground text-background rounded-lg">{mtg.date}</span>
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                       <Clock className="h-3 w-3" /> {mtg.time}
                                    </span>
                                 </div>
                                 <h4 className="text-sm font-bold group-hover:text-accent transition-colors">{mtg.title}</h4>
                                 <div className="flex items-center gap-3 mt-1">
                                    <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground">
                                       <div className="h-5 w-5 rounded bg-secondary flex items-center justify-center text-[9px] font-black">
                                          {mtg.organizer[0]}
                                       </div>
                                       {mtg.organizer}
                                    </div>
                                    <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground">
                                       {mtg.zoom ? <Video className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
                                       {mtg.type}
                                    </div>
                                 </div>
                              </div>
                              <button className={cn(
                                 "px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-widest border flex items-center gap-1.5 shrink-0 transition-all",
                                 mtg.zoom
                                    ? "bg-foreground text-background border-foreground hover:bg-accent"
                                    : "bg-background text-muted-foreground border-secondary hover:border-accent/40"
                              )}>
                                 {mtg.zoom ? "Join" : "View"}
                                 <ArrowUpRight className="h-3.5 w-3.5" />
                              </button>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            </div>
         </div>
      
   );
}
