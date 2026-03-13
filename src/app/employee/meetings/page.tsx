"use client"

import { useState, useEffect } from "react";
import {
   Calendar,
   Video,
   Clock,
   ArrowUpRight,
   Monitor,
   ShieldAlert,
   Loader2
} from "lucide-react";
import { cn } from "@/utils/cn";
import { createClient } from "@/utils/supabase";

export default function MeetingsPage() {
   const [meetings, setMeetings] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);
   const [syncingId, setSyncingId] = useState<string | null>(null);
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
      const fiveMinutesInMs = 5 * 60 * 1000;
      return now >= (startTime - fiveMinutesInMs);
   };

   const fetchMeetings = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Clean up expired meetings before fetching
      await fetch('/api/meetings/cleanup', { method: 'POST' });

      const { data, error } = await supabase
         .from('meeting_participants')
         .select(`
            id,
            is_synced,
            meeting:meetings (*)
         `)
         .eq('user_id', user.id);

      if (error) {
         console.error('Meetings Fetch Error:', error);
      }

      if (data) {
         // Flatten meeting data and include is_synced from the junction table
         const formattedMeetings = data.map(d => {
            if (!d.meeting) return null;
            return {
               ...(d.meeting as any),
               is_synced: d.is_synced
            };
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
            // Update local state to reflect sync
            setMeetings(prev => prev.map(m =>
               m.id === meetingId ? { ...m, is_synced: true } : m
            ));
         }
      } catch (err) {
         console.error('Sync error:', err);
      } finally {
         setSyncingId(null);
      }
   };

   const formatTime = (dateStr: string) => {
      return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
   };

   const formatDateLabel = (dateStr: string) => {
      const d = new Date(dateStr);
      const today = new Date();
      if (d.toDateString() === today.toDateString()) return "Today";
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
   };

   const nextMeeting = meetings
      .filter(m => new Date(m.scheduled_at) > new Date())
      .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())[0];

   return (
      <div className="space-y-6 pb-16">
         {/* Page Header */}
         <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
               <Calendar className="h-5 w-5 text-accent" />
               <h2 className="text-xl font-bold uppercase tracking-tighter">Meetings Assigned</h2>
            </div>
         </div>

         {/* Next Meeting Banner */}
         {nextMeeting && (
            <div className="bg-background border border-accent/30 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between shadow-sm">
               <div className="flex-1 mb-4 md:mb-0">
                  <p className="text-xs font-bold text-accent uppercase tracking-wider mb-1">Next Scheduled Synchronization</p>
                  <h3 className="text-xl font-bold tracking-tight">{nextMeeting.title}</h3>
                  <div className="flex items-center gap-4 mt-3 text-sm font-medium text-muted-foreground">
                     <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {formatTime(nextMeeting.scheduled_at)} {formatDateLabel(nextMeeting.scheduled_at)}</span>
                     <span className="flex items-center gap-1.5"><Monitor className="h-4 w-4" /> Remote Node</span>
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
                        <Video className="h-4 w-4" /> Initialize Link
                     </a>
                  ) : (
                     <div className="flex items-center gap-2 px-5 py-2.5 bg-secondary/50 border border-secondary text-muted-foreground rounded-lg font-bold text-xs uppercase tracking-wider cursor-not-allowed">
                        <Clock className="h-4 w-4" /> Locked (T-5m)
                     </div>
                  )}
               </div>
            </div>
         )}

         <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Meeting List */}
            <div className="lg:col-span-4 space-y-4">
               <h3 className="text-sm font-bold flex items-center gap-2 px-2"><Calendar className="h-4 w-4 text-accent" /> Upcoming Meetings</h3>
               <div className="space-y-4">
                  {loading ? (
                     <div className="p-12 text-center border-2 border-secondary border-dashed rounded-xl opacity-50">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Scanning for signals...</p>
                     </div>
                  ) : meetings.length === 0 ? (
                     <div className="p-12 text-center border-2 border-secondary border-dashed rounded-xl">
                        <Video className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">No Active Meeting Nodes Found</p>
                     </div>
                  ) : meetings.sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()).map((mtg) => (
                     <div key={mtg.id} className="p-6 bg-background border border-secondary rounded-xl hover:border-accent/40 shadow-sm transition-all group relative">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                           <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-2">
                                 <span className="text-xs font-bold uppercase tracking-wider px-2 py-1 bg-secondary/50 border border-secondary rounded-md">{formatDateLabel(mtg.scheduled_at)}</span>
                                 <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider">
                                    <Clock className="h-3.5 w-3.5" /> {formatTime(mtg.scheduled_at)}
                                 </span>
                                 {mtg.is_synced && (
                                    <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-1 bg-green-500/10 text-green-500 border border-green-500/20 rounded-md">SYNCED</span>
                                 )}
                              </div>
                              <h4 className="text-lg font-bold tracking-tight group-hover:text-accent transition-colors mb-2">{mtg.title}</h4>
                              <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground">
                                 <span className="flex items-center gap-1.5"><Monitor className="h-3.5 w-3.5" /> Remote Synchronization</span>
                                 <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {mtg.duration_minutes} MIN</span>
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
                                    Join Node <ArrowUpRight className="h-3 w-3" />
                                 </a>
                              ) : (
                                 <div className="px-5 py-2.5 bg-secondary/30 border border-secondary text-muted-foreground rounded-lg font-bold text-xs uppercase tracking-wider cursor-not-allowed flex justify-center items-center gap-2 flex-1 md:flex-none">
                                    <Clock className="h-3.5 w-3.5" />Wait Till Time
                                 </div>
                              )}
                           </div>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         </div>
      </div>
   );
}

