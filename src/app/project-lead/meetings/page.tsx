import { 
  Calendar, 
  Video, 
  MapPin, 
  Clock, 
  ChevronLeft,
  ChevronRight,
  Plus,
  ShieldAlert,
  Users,
  VideoIcon
} from "lucide-react";
import { cn } from "@/utils/cn";

const leadMeetings = [
  { id: 1, title: "Resource Alignment Sync", time: "10:00 AM - 11:30 AM", date: "Today", type: "Google Meet", organizer: "Sarah Manager", status: "Critical" },
  { id: 2, title: "Team Weekly Sync", time: "2:00 PM - 3:00 PM", date: "Today", type: "In Person", organizer: "Me", status: "Recurring" },
  { id: 3, title: "Q3 Milestone Review", time: "11:00 AM - 12:30 PM", date: "Tomorrow", type: "Google Meet", organizer: "Katherine Head", status: "Evaluation" },
];

export default function ProjectLeadMeetingsPage() {
  return (
    <div className="space-y-6 pb-16">
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="h-4 w-4 text-accent" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-accent">Operational Schedule</span>
          </div>
          <h2 className="text-xl font-bold">Command Calendar</h2>
          <p className="text-xs text-muted-foreground font-medium">Active meeting sessions for Project Lead node.</p>
        </div>
        <button className="px-4 py-2 bg-foreground text-background rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-accent transition-all flex items-center gap-2">
          <Plus className="h-4 w-4" /> New Meeting
        </button>
      </div>

      <div className="flex flex-col xl:flex-row gap-6">
        
        {/* Calendar Side Pane */}
        <div className="w-full xl:w-[320px] space-y-6">
           <div className="bg-background border border-secondary rounded-xl p-6 shadow-sm overflow-hidden relative group">
              <div className="flex justify-between items-center mb-6">
                 <div>
                    <h3 className="text-sm font-bold uppercase tracking-tight">March 2026</h3>
                 </div>
                 <div className="flex gap-1">
                    <button className="h-7 w-7 rounded-md hover:bg-secondary border border-secondary flex justify-center items-center transition-all"><ChevronLeft className="h-4 w-4" /></button>
                    <button className="h-7 w-7 rounded-md hover:bg-secondary border border-secondary flex justify-center items-center transition-all"><ChevronRight className="h-4 w-4" /></button>
                 </div>
              </div>
              
              <div className="grid grid-cols-7 gap-y-4 text-center text-[9px] font-bold uppercase text-muted-foreground/60 mb-2 border-b border-secondary pb-2">
                 {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <span key={i}>{d}</span>)}
              </div>
              
              <div className="grid grid-cols-7 gap-y-2 gap-x-1 text-center text-xs">
                 {Array.from({ length: 31 }).map((_, i) => (
                    <div 
                      key={i} 
                      className={cn(
                        "h-8 flex justify-center items-center rounded-lg transition-all relative font-bold", 
                        (i + 1) === 11 ? "bg-accent text-white shadow-md z-10" : "hover:bg-secondary/50",
                        [10, 11, 14, 22].includes(i + 1) ? "after:content-[''] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:h-0.5 after:w-0.5 after:rounded-full after:bg-accent" : ""
                      )}
                    >
                       {i + 1}
                    </div>
                 ))}
              </div>
           </div>

           <div className="bg-secondary/10 border border-secondary rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2">
                 <ShieldAlert className="h-4 w-4 text-accent" />
                 <h4 className="text-[10px] font-bold uppercase tracking-widest text-foreground">Priority Alert</h4>
              </div>
              <p className="text-[11px] font-medium leading-relaxed text-muted-foreground">
                <span className="font-bold text-foreground italic">SARAH MANAGER</span> has flagged the "Resource Alignment Sync" as critical for today.
              </p>
           </div>
        </div>

        {/* Schedule List */}
        <div className="flex-1 space-y-3">
           {leadMeetings.map((mtg) => (
             <div key={mtg.id} className="p-5 bg-background border border-secondary rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:border-accent/30 transition-all">
                <div className="flex-1">
                   <div className="flex items-center gap-3 mb-2">
                      <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 bg-secondary/50 rounded-md border border-secondary">{mtg.date}</span>
                      <span className={cn(
                        "text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md flex items-center gap-1 border",
                        mtg.status === 'Critical' ? "bg-red-500/10 text-red-500 border-red-500/20" : "bg-accent/10 text-accent border-accent/20"
                      )}>
                        {mtg.status === 'Critical' && <ShieldAlert className="h-3 w-3" />}
                        {mtg.status}
                      </span>
                   </div>
                   <div>
                      <h4 className="text-base font-bold group-hover:text-accent transition-colors">{mtg.title}</h4>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-[10px] font-bold text-muted-foreground">
                         <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {mtg.time}</span>
                         <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> {mtg.organizer}</span>
                         <span className="flex items-center gap-1.5">
                            {mtg.type === "Google Meet" ? <VideoIcon className="h-3.5 w-3.5" /> : <MapPin className="h-3.5 w-3.5" />}
                            {mtg.type}
                         </span>
                      </div>
                   </div>
                </div>
                
                <div className="flex gap-2">
                   {mtg.type === "Google Meet" ? (
                      <button className="flex-1 md:flex-none px-4 py-2 bg-foreground text-background rounded-lg font-bold text-[10px] uppercase tracking-widest hover:bg-accent transition-all">
                         Join Meet
                      </button>
                   ) : (
                      <button className="flex-1 md:flex-none px-4 py-2 bg-secondary/30 border border-secondary text-foreground rounded-lg font-bold text-[10px] uppercase tracking-widest hover:bg-secondary transition-all">
                         Details
                      </button>
                   )}
                </div>
             </div>
           ))}

           <div className="p-8 border-2 border-dashed border-secondary rounded-xl flex flex-col items-center justify-center text-center opacity-40">
              <Clock className="h-8 w-8 mb-2 text-muted-foreground" />
              <p className="text-[10px] font-bold uppercase tracking-widest">End of Daily Schedule</p>
           </div>
        </div>

      </div>
    </div>
  );
}
