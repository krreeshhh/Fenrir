"use client"

import { useState, useEffect } from "react";
import {
   Calendar,
   Video,
   Clock,
   Plus,
   X,
   Loader2,
   CheckCircle2,
   VideoIcon,
   Users,
   Filter,
   Monitor
} from "lucide-react";
import { cn } from "@/utils/cn";
import { createClient } from "@/utils/supabase";
import { MeetingCalendar } from "@/components/MeetingCalendar";

export default function ProjectLeadMeetingsPage() {
   const [meetings, setMeetings] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);
   const [showCreateModal, setShowCreateModal] = useState(false);
   const [employees, setEmployees] = useState<any[]>([]);
   const [submitting, setSubmitting] = useState(false);
   const [selectedDate, setSelectedDate] = useState<Date | null>(null);

   const [formData, setFormData] = useState({
      title: '',
      date: '',
      time: '',
      duration: '30',
      participants: [] as string[]
   });

   const supabase = createClient();
   const [currentTime, setCurrentTime] = useState(new Date());

   useEffect(() => {
      fetchData();
      const timer = setInterval(() => setCurrentTime(new Date()), 60000);
      return () => clearInterval(timer);
   }, []);

   const isJoinable = (scheduledAt: string) => {
      const startTime = new Date(scheduledAt).getTime();
      const now = currentTime.getTime();
      return now >= startTime - 5 * 60 * 1000;
   };

   const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await fetch('/api/meetings/cleanup', { method: 'POST' });

      const { data: mData, error: mError } = await supabase
         .from('meeting_participants')
         .select(`meeting:meetings (*)`)
         .eq('user_id', user.id);

      if (mError) console.error('Lead Meetings Fetch Error:', mError);
      if (mData) setMeetings(mData.map(d => d.meeting).filter(Boolean));

      const { data: eData } = await supabase
         .from('users_metadata')
         .select('id, full_name, email')
         .eq('role', 'employee');

      if (eData) setEmployees(eData);
      setLoading(false);
   };

   const handleCreateMeeting = async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitting(true);
      const scheduledAt = new Date(`${formData.date}T${formData.time}`).toISOString();

      try {
         const resp = await fetch('/api/meetings/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
               title: formData.title,
               scheduledAt,
               durationMinutes: parseInt(formData.duration),
               participants: formData.participants
            })
         });

         if (resp.ok) {
            setShowCreateModal(false);
            setFormData({ title: '', date: '', time: '', duration: '30', participants: [] });
            fetchData();
         }
      } catch (err) {
         console.error(err);
      } finally {
         setSubmitting(false);
      }
   };

   const toggleParticipant = (id: string) => {
      setFormData(prev => ({
         ...prev,
         participants: prev.participants.includes(id)
            ? prev.participants.filter(pid => pid !== id)
            : [...prev.participants, id]
      }));
   };

   const nextMeeting = [...meetings]
      .filter(m => new Date(m.scheduled_at).getTime() >= currentTime.getTime())
      .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())[0] ?? null;

   const displayedMeetings = [...meetings]
      .filter(m => {
         if (!selectedDate) return true;
         const d = new Date(m.scheduled_at);
         return (
            d.getFullYear() === selectedDate.getFullYear() &&
            d.getMonth() === selectedDate.getMonth() &&
            d.getDate() === selectedDate.getDate()
         );
      })
      .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());

   return (
      <div className="space-y-6 pb-16">
         {/* Header */}
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-secondary/50 pb-6">
            <div className="flex items-center gap-3">
               <div className="h-10 w-10 bg-accent/10 rounded-xl flex items-center justify-center border border-accent/20">
                  <Calendar className="h-5 w-5 text-accent" />
               </div>
               <div>
                  <h2 className="text-2xl font-bold tracking-tight">Command Calendar</h2>
                  <p className="text-xs font-bold text-muted-foreground mt-0.5 uppercase tracking-wider">Active Meeting Sessions</p>
               </div>
            </div>
            <button
               onClick={() => setShowCreateModal(true)}
               className="flex items-center justify-center gap-2 px-6 py-2.5 bg-foreground text-background rounded-lg font-bold text-[11px] uppercase tracking-wider hover:bg-accent hover:text-white transition-all shadow-sm active:scale-95 w-full md:w-auto"
            >
               <Plus className="h-4 w-4" /> Schedule Meeting
            </button>
         </div>

         {/* Next Meeting Banner */}
         {nextMeeting && (
            <div className="bg-background border border-accent/30 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-8 opacity-5 -rotate-12 group-hover:rotate-0 transition-transform duration-1000 pointer-events-none">
                  <VideoIcon className="h-32 w-32 text-accent" />
               </div>
               <div className="relative z-10">
                  <p className="text-xs font-bold text-accent uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                     <Clock className="h-3 w-3" /> Next Meeting
                  </p>
                  <h3 className="text-xl font-bold tracking-tight">{nextMeeting.title}</h3>
                  <div className="flex flex-wrap items-center gap-3 mt-3">
                     <span className="flex items-center gap-1.5 text-xs font-bold bg-secondary/30 px-3 py-1 rounded-md text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        {new Date(nextMeeting.scheduled_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                     </span>
                     <span className="flex items-center gap-1.5 text-xs font-bold bg-secondary/30 px-3 py-1 rounded-md text-muted-foreground">
                        <Monitor className="h-3.5 w-3.5" /> Remote
                     </span>
                  </div>
               </div>
               {isJoinable(nextMeeting.scheduled_at) ? (
                  <a
                     href={nextMeeting.link}
                     target="_blank"
                     rel="noreferrer"
                     className="relative z-10 flex items-center justify-center gap-2 px-6 py-3 bg-foreground text-background rounded-lg font-bold text-xs uppercase tracking-wider hover:bg-accent hover:text-white transition-all shadow-md active:scale-95 w-full md:w-auto"
                  >
                     <Video className="h-4 w-4" /> Enter Node
                  </a>
               ) : (
                  <div className="relative z-10 flex items-center justify-center gap-2 px-6 py-3 bg-secondary/30 border border-secondary text-muted-foreground rounded-lg font-bold text-xs uppercase tracking-wider cursor-not-allowed w-full md:w-auto">
                     <Clock className="h-4 w-4" /> Standby
                  </div>
               )}
            </div>
         )}

         {/* Calendar + List */}
         <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Functional Calendar */}
            <div className="space-y-3">
               <MeetingCalendar
                  meetings={meetings}
                  selectedDate={selectedDate}
                  onSelectDate={setSelectedDate}
               />
               {selectedDate && (
                  <div className="bg-accent/5 border border-accent/20 rounded-xl p-3 text-center">
                     <p className="text-[10px] font-black uppercase tracking-widest text-accent">Filtering by</p>
                     <p className="text-sm font-bold mt-0.5">
                        {selectedDate.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                     </p>
                     <p className="text-[10px] font-bold text-muted-foreground mt-0.5">{displayedMeetings.length} meeting{displayedMeetings.length !== 1 ? 's' : ''}</p>
                  </div>
               )}
            </div>

            {/* Meeting List */}
            <div className="lg:col-span-3 space-y-4">
               <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold flex items-center gap-2">
                     <VideoIcon className="h-4 w-4 text-accent" />
                     {selectedDate
                        ? `Meetings on ${selectedDate.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}`
                        : 'All Upcoming Sessions'}
                  </h3>
                  {selectedDate && (
                     <button onClick={() => setSelectedDate(null)} className="text-xs font-bold text-accent hover:underline flex items-center gap-1">
                        <Filter className="h-3 w-3" /> Clear Filter
                     </button>
                  )}
               </div>

               {loading ? (
                  <div className="p-12 border border-dashed border-secondary rounded-xl text-center flex flex-col items-center justify-center gap-3">
                     <Loader2 className="h-6 w-6 animate-spin text-accent" />
                     <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Scanning Schedule...</p>
                  </div>
               ) : displayedMeetings.length === 0 ? (
                  <div className="p-12 bg-background border border-secondary rounded-xl text-center shadow-sm">
                     <Users className="h-8 w-8 text-muted-foreground/20 mx-auto mb-3" />
                     <p className="text-sm font-medium text-muted-foreground">
                        {selectedDate ? 'No meetings on this date.' : 'No active sessions in current window.'}
                     </p>
                  </div>
               ) : (
                  <div className="grid grid-cols-1 gap-4">
                     {displayedMeetings.map(mtg => {
                        const joinable = isJoinable(mtg.scheduled_at);
                        return (
                           <div key={mtg.id} className="p-6 bg-background border border-secondary rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-accent/40 transition-all shadow-sm hover:shadow-md group">
                              <div className="flex-1">
                                 <div className="flex items-center gap-3 mb-2">
                                    <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 bg-secondary/50 text-foreground rounded-md border border-secondary">
                                       {new Date(mtg.scheduled_at).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                                    </span>
                                    <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                                       <Clock className="h-3.5 w-3.5" />
                                       {new Date(mtg.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    {joinable && (
                                       <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 bg-green-500/10 text-green-500 border border-green-500/20 rounded-md animate-pulse">Live</span>
                                    )}
                                 </div>
                                 <h4 className="text-lg font-bold tracking-tight group-hover:text-accent transition-colors">{mtg.title}</h4>
                                 <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-2 text-xs font-medium text-muted-foreground">
                                    <span className="flex items-center gap-1.5"><VideoIcon className="h-3.5 w-3.5" /> Remote · {mtg.duration_minutes ?? 30} min</span>
                                 </div>
                              </div>
                              {joinable ? (
                                 <a
                                    href={mtg.link}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-6 py-2.5 bg-foreground text-background border border-foreground rounded-lg font-bold text-[11px] uppercase hover:bg-accent hover:border-accent hover:text-white transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95 w-full md:w-auto"
                                 >
                                    Enter Node
                                 </a>
                              ) : (
                                 <div className="px-6 py-2.5 bg-secondary/30 border border-secondary text-muted-foreground/60 rounded-lg font-bold text-[11px] uppercase tracking-wider cursor-not-allowed flex items-center justify-center gap-2 w-full md:w-auto">
                                    <Clock className="h-3.5 w-3.5" /> Locked
                                 </div>
                              )}
                           </div>
                        );
                     })}
                  </div>
               )}
            </div>
         </div>

         {/* Create Meeting Modal */}
         {showCreateModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
               <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} />
               <div className="relative bg-background border border-secondary rounded-2xl p-8 w-full max-w-lg shadow-xl animate-in zoom-in-95 duration-200">
                  <button onClick={() => setShowCreateModal(false)} className="absolute top-5 right-5 p-2 bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground rounded-lg transition-colors">
                     <X className="h-5 w-5" />
                  </button>
                  <div className="mb-8">
                     <h3 className="text-xl font-bold tracking-tight">Schedule Meeting</h3>
                     <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-1">Configure meeting parameters</p>
                  </div>
                  <form onSubmit={handleCreateMeeting} className="space-y-6">
                     <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Meeting Title</label>
                        <input required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full bg-background border border-secondary rounded-lg px-4 py-2.5 text-sm font-medium focus:border-accent focus:ring-1 focus:ring-accent outline-none placeholder:text-muted-foreground/40 transition-all" placeholder="e.g., Q3 Planning Session" />
                     </div>
                     <div className="grid grid-cols-2 gap-5">
                        <div className="space-y-2">
                           <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Date</label>
                           <input required type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className="w-full bg-background border border-secondary rounded-lg px-4 py-2.5 text-sm font-medium focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all" />
                        </div>
                        <div className="space-y-2">
                           <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Time</label>
                           <input required type="time" value={formData.time} onChange={e => setFormData({ ...formData, time: e.target.value })} className="w-full bg-background border border-secondary rounded-lg px-4 py-2.5 text-sm font-medium focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all" />
                        </div>
                     </div>
                     <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                           <span>Select Participants</span>
                           <span className="text-accent">{formData.participants.length} Selected</span>
                        </label>
                        <div className="max-h-40 overflow-y-auto border border-secondary rounded-lg bg-secondary/5 p-2 grid grid-cols-1 gap-1">
                           {employees.map(emp => (
                              <button type="button" key={emp.id} onClick={() => toggleParticipant(emp.id)} className={cn("flex justify-between items-center px-3 py-2 text-xs font-bold rounded-md transition-all text-left", formData.participants.includes(emp.id) ? "bg-accent/10 text-accent border border-accent/20" : "hover:bg-secondary text-foreground border border-transparent")}>
                                 <div>
                                    <p className="font-bold">{emp.full_name}</p>
                                    <p className="text-[10px] text-muted-foreground">{emp.email}</p>
                                 </div>
                                 {formData.participants.includes(emp.id) && <CheckCircle2 className="h-3.5 w-3.5" />}
                              </button>
                           ))}
                           {employees.length === 0 && <div className="p-4 text-center text-xs text-muted-foreground">No eligible personnel found.</div>}
                        </div>
                     </div>
                     <div className="pt-2">
                        <button disabled={submitting} className="w-full py-3.5 bg-foreground text-background rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-accent hover:text-white transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50">
                           {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calendar className="h-4 w-4" />}
                           {submitting ? 'Processing...' : 'Schedule Meeting'}
                        </button>
                     </div>
                  </form>
               </div>
            </div>
         )}
      </div>
   );
}
