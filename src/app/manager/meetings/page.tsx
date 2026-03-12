"use client"

import { useState, useEffect } from "react";
import {
   Calendar,
   Video,
   Clock,
   ChevronLeft,
   ChevronRight,
   Plus,
   Monitor,
   X,
   Loader2,
   CheckCircle2,
   VideoIcon,
   Users
} from "lucide-react";
import { cn } from "@/utils/cn";
import { createClient } from "@/utils/supabase";

export default function ManagerMeetingsPage() {
   const [meetings, setMeetings] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);
   const [showCreateModal, setShowCreateModal] = useState(false);
   const [projectLeads, setProjectLeads] = useState<any[]>([]);
   const [submitting, setSubmitting] = useState(false);

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
      const fiveMinutesInMs = 5 * 60 * 1000;
      return now >= startTime - fiveMinutesInMs;
   };

   const fetchData = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      // Clean up expired meetings before fetching
      await fetch('/api/meetings/cleanup', { method: 'POST' });

      // Fetch meetings where manager is a participant
      const { data: mData } = await supabase
         .from('meeting_participants')
         .select(`meeting:meetings (*)`)
         .eq('user_id', user.id);

      if (mData) {
         const validMeetings = mData.map((d: any) => d.meeting).filter(Boolean);
         setMeetings(validMeetings);
      }

      // Only fetch project leads as selectable participants
      const { data: leadsData } = await supabase
         .from('users_metadata')
         .select('id, full_name, email')
         .eq('role', 'project_lead');

      if (leadsData) setProjectLeads(leadsData);

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

   const currentMonth = currentTime.getMonth();
   const currentYear = currentTime.getFullYear();
   const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
   const currentMonthName = currentTime.toLocaleString('default', { month: 'long' });

   const nextMeeting = [...meetings]
      .filter(m => new Date(m.scheduled_at).getTime() >= currentTime.getTime())
      .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())[0] ?? null;

   return (
      <div className="space-y-6 pb-16">

         {/* Page Header */}
         <div className="flex items-center justify-between border-b border-secondary/50 pb-6">
            <div className="flex items-center gap-3">
               <div className="h-10 w-10 bg-accent/10 rounded-xl flex items-center justify-center border border-accent/20">
                  <Calendar className="h-5 w-5 text-accent" />
               </div>
               <div>
                  <h2 className="text-2xl font-bold tracking-tight">Meetings</h2>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mt-0.5">Project Lead Sessions</p>
               </div>
            </div>
            <button
               onClick={() => setShowCreateModal(true)}
               className="flex items-center gap-2 px-5 py-2.5 bg-foreground text-background rounded-lg font-bold text-[11px] uppercase tracking-wider hover:bg-accent hover:text-white transition-all shadow-sm active:scale-95"
            >
               <Plus className="h-4 w-4" /> Schedule
            </button>
         </div>

         {/* Next Meeting Banner */}
         <div className="bg-background border border-accent/30 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm shadow-accent/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 -rotate-12 group-hover:rotate-0 transition-transform duration-1000 pointer-events-none">
               <VideoIcon className="h-32 w-32 text-accent" />
            </div>
            <div className="relative z-10">
               <p className="text-xs font-bold text-accent uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Clock className="h-3 w-3" /> Next Meeting
               </p>
               <h3 className="text-xl font-bold tracking-tight">
                  {nextMeeting ? nextMeeting.title : 'No upcoming meetings'}
               </h3>
               {nextMeeting && (
                  <div className="flex flex-wrap items-center gap-4 mt-3 text-sm font-medium text-muted-foreground">
                     <span className="flex items-center gap-1.5 bg-secondary/30 px-3 py-1 rounded-md">
                        <Clock className="h-3.5 w-3.5" />
                        {new Date(nextMeeting.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                     </span>
                     <span className="flex items-center gap-1.5 bg-secondary/30 px-3 py-1 rounded-md">
                        <Monitor className="h-3.5 w-3.5" /> Remote Link
                     </span>
                  </div>
               )}
            </div>
            <button
               disabled={!nextMeeting || !isJoinable(nextMeeting.scheduled_at)}
               onClick={() => nextMeeting && window.open(nextMeeting.link, '_blank')}
               className="flex items-center justify-center gap-2 w-full md:w-auto px-6 py-3 bg-foreground text-background rounded-lg font-bold text-xs uppercase tracking-wider hover:bg-accent hover:text-white transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:active:scale-100 relative z-10"
            >
               <Video className="h-4 w-4" />
               {nextMeeting && isJoinable(nextMeeting.scheduled_at) ? 'Join Meeting' : 'Standby'}
            </button>
         </div>

         {/* Calendar + Meeting List */}
         <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

            {/* Mini Calendar */}
            <div className="space-y-4">
               <div className="bg-background border border-secondary rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                     <h3 className="text-sm font-bold">{currentMonthName} {currentYear}</h3>
                     <div className="flex gap-1.5">
                        <button className="h-8 w-8 rounded-lg bg-secondary/50 flex items-center justify-center hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
                           <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button className="h-8 w-8 rounded-lg bg-secondary/50 flex items-center justify-center hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
                           <ChevronRight className="h-4 w-4" />
                        </button>
                     </div>
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                     {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <span key={i}>{d}</span>)}
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium">
                     {Array.from({ length: daysInMonth }).map((_, i) => {
                        const day = i + 1;
                        const hasMeeting = meetings.some(m => {
                           const d = new Date(m.scheduled_at);
                           return d.getDate() === day && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
                        });
                        const isToday = new Date().getDate() === day && new Date().getMonth() === currentMonth;
                        return (
                           <div
                              key={i}
                              className={cn(
                                 "h-9 flex justify-center items-center rounded-lg cursor-pointer transition-all",
                                 isToday ? "bg-foreground text-background font-bold shadow-sm"
                                    : hasMeeting ? "bg-accent/10 text-accent font-bold"
                                       : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                              )}
                           >
                              {day}
                           </div>
                        );
                     })}
                  </div>
               </div>
            </div>

            {/* Meeting List */}
            <div className="lg:col-span-3 space-y-4">
               <h3 className="text-sm font-bold flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-accent" /> Upcoming Meetings
               </h3>
               <div className="bg-background border border-secondary rounded-xl divide-y divide-secondary overflow-hidden shadow-sm">
                  {loading ? (
                     <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
                        <Loader2 className="h-6 w-6 animate-spin text-accent" />
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Scanning Schedule...</p>
                     </div>
                  ) : meetings.length === 0 ? (
                     <div className="p-12 text-center">
                        <Users className="h-8 w-8 text-muted-foreground/20 mx-auto mb-3" />
                        <p className="text-sm font-medium text-muted-foreground">No meetings scheduled with project leads.</p>
                        <button
                           onClick={() => setShowCreateModal(true)}
                           className="mt-4 text-xs font-bold uppercase tracking-wider text-accent hover:underline"
                        >
                           Schedule one now
                        </button>
                     </div>
                  ) : (
                     meetings
                        .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
                        .map(mtg => {
                           const joinable = isJoinable(mtg.scheduled_at);
                           return (
                              <div key={mtg.id} className="p-5 hover:bg-secondary/10 transition-colors group">
                                 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                       <div className="flex items-center gap-3 mb-2">
                                          <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 bg-secondary/50 text-foreground rounded-md border border-secondary">
                                             {new Date(mtg.scheduled_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                          </span>
                                          <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                                             <Clock className="h-3.5 w-3.5" />
                                             {new Date(mtg.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                          </span>
                                       </div>
                                       <h4 className="text-base font-bold group-hover:text-accent transition-colors tracking-tight">{mtg.title}</h4>
                                       <div className="flex flex-wrap items-center gap-4 mt-2">
                                          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground/80 border bg-secondary/30 px-2 py-1 rounded-md">
                                             <Video className="h-3.5 w-3.5" /> Remote Link
                                          </div>
                                       </div>
                                    </div>
                                    {joinable ? (
                                       <button
                                          onClick={() => window.open(mtg.link, '_blank')}
                                          className="px-5 py-2 rounded-lg font-bold text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 w-full sm:w-auto shrink-0 transition-all bg-foreground text-background border border-foreground hover:bg-accent hover:border-accent hover:text-white active:scale-95"
                                       >
                                          Join Meeting
                                       </button>
                                    ) : (
                                       <div className="px-5 py-2 rounded-lg font-bold text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 w-full sm:w-auto shrink-0 bg-secondary/30 text-muted-foreground/60 border border-secondary cursor-not-allowed">
                                          <Clock className="h-3.5 w-3.5" /> Standby
                                       </div>
                                    )}
                                 </div>
                              </div>
                           );
                        })
                  )}
               </div>
            </div>
         </div>

         {/* Create Meeting Modal */}
         {showCreateModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
               <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} />
               <div className="relative bg-background border border-secondary rounded-2xl p-8 w-full max-w-lg shadow-xl animate-in zoom-in-95 duration-200">
                  <button
                     onClick={() => setShowCreateModal(false)}
                     className="absolute top-5 right-5 p-2 bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground rounded-lg transition-colors"
                  >
                     <X className="h-5 w-5" />
                  </button>

                  <div className="mb-8">
                     <h3 className="text-xl font-bold tracking-tight">Schedule Meeting</h3>
                     <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mt-1">With Project Leads</p>
                  </div>

                  <form onSubmit={handleCreateMeeting} className="space-y-6">
                     <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Meeting Title</label>
                        <input
                           required
                           value={formData.title}
                           onChange={e => setFormData({ ...formData, title: e.target.value })}
                           className="w-full bg-background border border-secondary rounded-lg px-4 py-2.5 text-sm font-medium focus:border-accent focus:ring-1 focus:ring-accent outline-none placeholder:text-muted-foreground/40 transition-all shadow-sm"
                           placeholder="e.g., Q3 Planning Session"
                        />
                     </div>

                     <div className="grid grid-cols-2 gap-5">
                        <div className="space-y-2">
                           <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Date</label>
                           <input
                              required
                              type="date"
                              value={formData.date}
                              onChange={e => setFormData({ ...formData, date: e.target.value })}
                              className="w-full bg-background border border-secondary rounded-lg px-4 py-2.5 text-sm font-medium focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all shadow-sm"
                           />
                        </div>
                        <div className="space-y-2">
                           <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Time</label>
                           <input
                              required
                              type="time"
                              value={formData.time}
                              onChange={e => setFormData({ ...formData, time: e.target.value })}
                              className="w-full bg-background border border-secondary rounded-lg px-4 py-2.5 text-sm font-medium focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all shadow-sm"
                           />
                        </div>
                     </div>

                     <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                           <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> Project Leads</span>
                           <span className="text-accent">{formData.participants.length} Selected</span>
                        </label>
                        <div className="max-h-44 overflow-y-auto border border-secondary rounded-lg bg-secondary/5 p-2 grid grid-cols-1 gap-1">
                           {projectLeads.map(lead => (
                              <button
                                 type="button"
                                 key={lead.id}
                                 onClick={() => toggleParticipant(lead.id)}
                                 className={cn(
                                    "flex justify-between items-center px-3 py-2.5 text-xs font-bold rounded-md transition-all text-left",
                                    formData.participants.includes(lead.id)
                                       ? "bg-accent/10 text-accent border border-accent/20"
                                       : "hover:bg-secondary text-foreground border border-transparent"
                                 )}
                              >
                                 <div>
                                    <p className="font-bold">{lead.full_name}</p>
                                    <p className="text-[10px] text-muted-foreground font-medium">{lead.email}</p>
                                 </div>
                                 {formData.participants.includes(lead.id) && (
                                    <CheckCircle2 className="h-4 w-4 text-accent shrink-0" />
                                 )}
                              </button>
                           ))}
                           {projectLeads.length === 0 && (
                              <div className="p-4 text-center text-xs text-muted-foreground">No project leads found.</div>
                           )}
                        </div>
                     </div>

                     <div className="pt-2">
                        <button
                           disabled={submitting || formData.participants.length === 0}
                           className="w-full py-3.5 bg-foreground text-background rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-accent hover:text-white transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:active:scale-100"
                        >
                           {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calendar className="h-4 w-4" />}
                           {submitting ? 'Scheduling...' : 'Schedule Meeting'}
                        </button>
                     </div>
                  </form>
               </div>
            </div>
         )}
      </div>
   );
}
