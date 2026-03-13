"use client"

import { useState, useEffect } from "react";
import {
   Calendar,
   Video,
   Clock,
   ArrowUpRight,
   Monitor,
   Loader2,
   Filter
} from "lucide-react";
import { cn } from "@/utils/cn";
import { createClient } from "@/utils/supabase";
import { MeetingCalendar } from "@/components/MeetingCalendar";

export default function MeetingsPage() {
   const [meetings, setMeetings] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);
   const [syncingId, setSyncingId] = useState<string | null>(null);
   const [selectedDate, setSelectedDate] = useState<Date | null>(null);
   const supabase = createClient();

   const [currentTime, setCurrentTime] = useState(new Date());

   useEffect(() => {
      fetchMeetings();
      const timer = setInterval(() => setCurrentTime(new Date()), 60000);
      return () => clearInterval(timer);
   }, []);

   const isJoinable = (scheduledAt: string) => {
      const startTime = new Date(scheduledAt).getTime();
      const now = currentTime.getTime();
      return now >= startTime - 5 * 60 * 1000;
   };

   const fetchMeetings = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await fetch('/api/meetings/cleanup', { method: 'POST' });

      const { data, error } = await supabase
         .from('meeting_participants')
         .select(`id, is_synced, meeting:meetings (*)`)
         .eq('user_id', user.id);

      if (error) console.error('Meetings Fetch Error:', error);

      if (data) {
         const formattedMeetings = data.map(d => {
            if (!d.meeting) return null;
            return { ...(d.meeting as any), is_synced: d.is_synced };
         }).filter(Boolean);
         setMeetings(formattedMeetings);
      }
      setLoading(false);
   };

   const handleOkieeSync = async (meetingId: string) => {
      setSyncingId(meetingId);
      try {
         const resp = await fetch('/api/meetings/sync-employee', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ meetingId })
         });
         if (resp.ok) {
            setMeetings(prev => prev.map(m => m.id === meetingId ? { ...m, is_synced: true } : m));
         }
      } catch (err) {
         console.error('Sync error:', err);
      } finally {
         setSyncingId(null);
      }
   };

   const formatTime = (dateStr: string) =>
      new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

   const formatDateLabel = (dateStr: string) => {
      const d = new Date(dateStr);
      const today = new Date();
      if (d.toDateString() === today.toDateString()) return "Today";
      return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
   };

   const nextMeeting = meetings
      .filter(m => new Date(m.scheduled_at) > new Date())
      .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())[0];

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
         <div className="flex items-center justify-between border-b border-secondary/50 pb-6">
            <div className="flex items-center gap-3">
               <div className="h-10 w-10 bg-accent/10 rounded-xl flex items-center justify-center border border-accent/20">
                  <Calendar className="h-5 w-5 text-accent" />
               </div>
               <div>
                  <h2 className="text-2xl font-bold tracking-tight">Meetings Assigned</h2>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mt-0.5">Your Scheduled Sessions</p>
               </div>
            </div>
         </div>

         {/* Next Meeting Banner */}
         {nextMeeting && (
            <div className="bg-background border border-accent/30 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between shadow-sm">
               <div className="flex-1 mb-4 md:mb-0">
                  <p className="text-xs font-bold text-accent uppercase tracking-wider mb-1">Next Scheduled Meeting</p>
                  <h3 className="text-xl font-bold tracking-tight">{nextMeeting.title}</h3>
                  <div className="flex items-center gap-4 mt-3 text-sm font-medium text-muted-foreground">
                     <span className="flex items-center gap-1.5 text-xs">
                        <Clock className="h-4 w-4" /> {formatTime(nextMeeting.scheduled_at)} · {formatDateLabel(nextMeeting.scheduled_at)}
                     </span>
                     <span className="flex items-center gap-1.5 text-xs">
                        <Monitor className="h-4 w-4" /> Remote
                     </span>
                  </div>
               </div>
               <div className="flex items-center gap-3">
                  {!nextMeeting.is_synced && (
                     <button
                        onClick={() => handleOkieeSync(nextMeeting.id)}
                        disabled={syncingId === nextMeeting.id}
                        className="px-5 py-2.5 border border-accent bg-accent/10 text-accent font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-accent hover:text-white transition-all active:scale-95 shadow-sm"
                     >
                        {syncingId === nextMeeting.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sync Cal"}
                     </button>
                  )}
                  {isJoinable(nextMeeting.scheduled_at) ? (
                     <a
                        href={nextMeeting.link}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 px-6 py-2.5 bg-foreground text-background rounded-lg font-bold text-xs uppercase tracking-wider hover:bg-accent transition-all active:scale-95 shadow-sm"
                     >
                        <Video className="h-4 w-4" /> Join Meeting
                     </a>
                  ) : (
                     <div className="flex items-center gap-2 px-5 py-2.5 bg-secondary/50 border border-secondary text-muted-foreground rounded-lg font-bold text-xs uppercase tracking-wider cursor-not-allowed">
                        <Clock className="h-4 w-4" /> Locked (T-5m)
                     </div>
                  )}
               </div>
            </div>
         )}

         {/* Calendar + List */}
         <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

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
                  <h3 className="text-sm font-bold flex items-center gap-2 px-2">
                     <Calendar className="h-4 w-4 text-accent" />
                     {selectedDate
                        ? `Meetings on ${selectedDate.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}`
                        : 'All Upcoming Meetings'}
                  </h3>
                  {selectedDate && (
                     <button onClick={() => setSelectedDate(null)} className="text-xs font-bold text-accent hover:underline flex items-center gap-1 pr-2">
                        <Filter className="h-3 w-3" /> Clear Filter
                     </button>
                  )}
               </div>

               <div className="space-y-4">
                  {loading ? (
                     <div className="p-12 text-center border-2 border-secondary border-dashed rounded-xl opacity-50">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Scanning for signals...</p>
                     </div>
                  ) : displayedMeetings.length === 0 ? (
                     <div className="p-12 text-center border-2 border-secondary border-dashed rounded-xl">
                        <Video className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                           {selectedDate ? 'No meetings on this date' : 'No meetings scheduled'}
                        </p>
                     </div>
                  ) : (
                     displayedMeetings.map(mtg => (
                        <div key={mtg.id} className="p-6 bg-background border border-secondary rounded-xl hover:border-accent/40 shadow-sm transition-all group relative">
                           <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                              <div className="flex-1 min-w-0">
                                 <div className="flex items-center gap-3 mb-2">
                                    <span className="text-xs font-bold uppercase tracking-wider px-2 py-1 bg-secondary/50 border border-secondary rounded-md">
                                       {formatDateLabel(mtg.scheduled_at)}
                                    </span>
                                    <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider">
                                       <Clock className="h-3.5 w-3.5" /> {formatTime(mtg.scheduled_at)}
                                    </span>
                                    {mtg.is_synced && (
                                       <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-1 bg-green-500/10 text-green-500 border border-green-500/20 rounded-md">SYNCED</span>
                                    )}
                                    {isJoinable(mtg.scheduled_at) && (
                                       <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 bg-green-500/10 text-green-500 border border-green-500/20 rounded-md animate-pulse">Live</span>
                                    )}
                                 </div>
                                 <h4 className="text-lg font-bold tracking-tight group-hover:text-accent transition-colors mb-2">{mtg.title}</h4>
                                 <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground">
                                    <span className="flex items-center gap-1.5"><Monitor className="h-3.5 w-3.5" /> Remote</span>
                                    <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {mtg.duration_minutes} min</span>
                                 </div>
                              </div>
                              <div className="flex items-center gap-3 md:w-auto w-full">
                                 {!mtg.is_synced && (
                                    <button
                                       onClick={() => handleOkieeSync(mtg.id)}
                                       disabled={syncingId === mtg.id}
                                       className="px-5 py-2.5 bg-accent/10 border border-accent/20 text-accent rounded-lg font-bold text-xs uppercase tracking-wider hover:bg-accent hover:text-white transition-all active:scale-95 flex-1 md:flex-none"
                                    >
                                       {syncingId === mtg.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sync Cal"}
                                    </button>
                                 )}
                                 {isJoinable(mtg.scheduled_at) ? (
                                    <a
                                       href={mtg.link}
                                       target="_blank"
                                       rel="noreferrer"
                                       className="px-6 py-2.5 bg-foreground text-background rounded-lg font-bold text-xs uppercase tracking-wider hover:bg-accent transition-all flex justify-center items-center gap-2 active:scale-95 shadow-sm flex-1 md:flex-none"
                                    >
                                       Join <ArrowUpRight className="h-3 w-3" />
                                    </a>
                                 ) : (
                                    <div className="px-5 py-2.5 bg-secondary/30 border border-secondary text-muted-foreground rounded-lg font-bold text-xs uppercase tracking-wider cursor-not-allowed flex justify-center items-center gap-2 flex-1 md:flex-none">
                                       <Clock className="h-3.5 w-3.5" /> Standby
                                    </div>
                                 )}
                              </div>
                           </div>
                        </div>
                     ))
                  )}
               </div>
            </div>
         </div>
      </div>
   );
}
