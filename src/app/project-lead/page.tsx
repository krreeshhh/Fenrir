"use client"

import { useState, useEffect } from "react";
import {
   BarChart3,
   TrendingUp,
   Users,
   CheckCircle2,
   Target,
   Zap,
   ShieldCheck,
   ChevronRight,
   Plus,
   ArrowUpRight,
   FolderLock,
   Activity,
   Mail,
   Video
} from "lucide-react";
import { cn } from "@/utils/cn";
import { createClient } from "@/utils/supabase";
import { DashboardSkeleton } from "@/components/Skeleton";

export default function ProjectLeadDashboard() {
   const [stats, setStats] = useState({
      activeProjects: [] as any[],
      pendingValidations: [] as any[],
      teamCount: 0,
      unitScore: 0,
      velocity: "+12%",
      avgCompletion: 0,
      leadRankings: [] as any[]
   });
   const [userData, setUserData] = useState<any>(null);
   const [loading, setLoading] = useState(true);
   const [recentMails, setRecentMails] = useState<any[]>([]);
   const [upcomingMeetings, setUpcomingMeetings] = useState<any[]>([]);
   const supabase = createClient();

   useEffect(() => {
      fetchLeadData();
   }, []);

   const fetchLeadData = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: me } = await supabase
         .from('users_metadata')
         .select('*')
         .eq('id', user.id)
         .single();
      setUserData(me);

      const { data: allocations, error: allocError } = await supabase
         .from('projects')
         .select(`
            id,
            name,
            completion_percentage,
            status
         `)
         .eq('project_lead_id', user.id);

      if (allocError) console.error("Projects Fetch Error:", allocError);

      const overseeingProjects = allocations || [];
      const projectIds = overseeingProjects.map((p: any) => p.id);

      const { data: teamData } = await supabase
         .from('checklist_allocations')
         .select(`employee_id, checklists!inner (project_id)`)
         .in('checklists.project_id', projectIds);

      const uniqueEmployees = new Set(teamData?.map((t: any) => t.employee_id));

      const { data: pending, error: pendError } = await supabase
         .from('checklist_allocations')
         .select(`
          id, created_at,
          users_metadata (full_name),
          checklists!inner (title, project_id)
        `)
         .in('checklists.project_id', projectIds)
         .eq('verified', false)
         .limit(5);

      const { data: ranks, error: leadRanksError } = await supabase
         .from('users_metadata')
         .select('*')
         .eq('role', 'project_lead')
         .order('score', { ascending: false })
         .limit(5);

      const avgComp = overseeingProjects.length > 0
         ? Math.round(overseeingProjects.reduce((sum, p) => sum + Number(p.completion_percentage), 0) / overseeingProjects.length)
         : 0;

      const newStats = {
         activeProjects: overseeingProjects,
         pendingValidations: pending || [],
         teamCount: uniqueEmployees.size,
         unitScore: me?.score || 0,
         velocity: "+14%",
         avgCompletion: avgComp,
         leadRankings: ranks || []
      };

      if (allocError || pendError || leadRanksError) {
         console.error("Errors:", { allocError, pendError, leadRanksError });
      }

      setStats(newStats);

      // Fetch Recent Mails (Inbox)
      const { data: mails } = await supabase
         .from('messages')
         .select('id, subject, sent_at, sender:sender_id(full_name)')
         .eq('receiver_id', user.id)
         .order('sent_at', { ascending: false })
         .limit(3);
      setRecentMails(mails || []);

      // Fetch Upcoming Meetings
      const { data: meetings } = await supabase
         .from('meetings')
         .select(`
            id,
            title,
            scheduled_at,
            meeting_participants!inner(user_id)
         `)
         .eq('meeting_participants.user_id', user.id)
         .gte('scheduled_at', new Date().toISOString())
         .order('scheduled_at', { ascending: true })
         .limit(2);
      setUpcomingMeetings(meetings || []);

      setLoading(false);
   };

   if (loading) return <DashboardSkeleton />;

   return (
      <div className="space-y-6 pb-16">

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Active Projects Minimal List */}
            <div className="lg:col-span-2 space-y-4">
               <div className="flex items-center justify-between mb-2 px-1">
                  <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Project Status</h3>
               </div>

               <div className="bg-background border border-secondary rounded-2xl divide-y divide-secondary shadow-sm overflow-hidden">
                  {stats.activeProjects.length > 0 ? stats.activeProjects.map((p, i) => (
                     <div key={p.id} className="p-5 flex items-center justify-between hover:bg-secondary/10 transition-colors group">
                        <div className="flex-1">
                           <p className="text-sm font-bold tracking-tight group-hover:text-accent transition-colors">{p.name}</p>
                           <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1 opacity-60">{p.status}</p>
                        </div>
                        <div className="flex items-center gap-6">
                           <div className="text-right">
                              <p className="text-[11px] font-bold mb-1">{Math.round(p.completion_percentage || 0)}% SYNCED</p>
                              <div className="h-1 w-24 bg-secondary rounded-full overflow-hidden">
                                 <div
                                    className="h-full bg-accent rounded-full transition-all duration-1000"
                                    style={{ width: `${Math.round(p.completion_percentage || 0)}%` }}
                                 />
                              </div>
                           </div>
                           <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-accent group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                        </div>
                     </div>
                  )) : (
                     <div className="p-12 text-center text-xs font-bold text-muted-foreground/40 uppercase tracking-widest">
                        No active assignments detected
                     </div>
                  )}
               </div>

               {/* Pending Validations - Moved to Left Side */}
               <div className="mt-8 space-y-4">
                  <div className="flex items-center justify-between mb-2 px-1">
                     <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Validations</h3>
                  </div>
                  <div className="bg-background border border-secondary rounded-2xl p-6 shadow-sm">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {stats.pendingValidations.length > 0 ? stats.pendingValidations.map((v) => (
                           <div key={v.id} className="group p-4 bg-secondary/10 hover:bg-secondary/20 rounded-xl transition-all border border-secondary/30 hover:border-accent/40 cursor-pointer flex flex-col justify-between">
                              <div>
                                 <p className="text-sm font-bold truncate">{v.users_metadata?.full_name}</p>
                                 <p className="text-[10px] text-muted-foreground font-bold uppercase mt-1 truncate">{v.checklists?.title}</p>
                              </div>
                              <div className="mt-4 flex items-center justify-between">
                                 <span className="text-[9px] font-black text-accent uppercase tracking-tighter">Awaiting Signal</span>
                                 <ChevronRight className="h-3 w-3 text-accent/40 group-hover:text-accent transition-colors" />
                              </div>
                           </div>
                        )) : (
                           <div className="col-span-full text-center py-12 border border-dashed border-secondary/50 rounded-xl bg-secondary/5">
                              <ShieldCheck className="h-8 w-8 text-accent/20 mx-auto mb-2" />
                              <p className="text-[10px] text-muted-foreground font-bold uppercase opacity-60">All Systems Validated</p>
                           </div>
                        )}
                     </div>
                     {stats.pendingValidations.length > 0 && (
                        <button onClick={() => window.location.href = '/project-lead/checklist-completion'} className="w-full mt-6 py-3 bg-foreground text-background text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-accent transition-all shadow-lg shadow-black/20">
                           Initiate Personnel Review
                        </button>
                     )}
                  </div>
               </div>
            </div>

            {/* Critical Validations Sidebar */}
            <div className="space-y-6">
               {/* Communication Overview */}
               <div className="bg-background border border-secondary rounded-2xl p-6 shadow-sm">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-5 flex items-center gap-2">
                     <Mail className="h-3.5 w-3.5 text-accent" /> Intelligence
                  </h4>
                  <div className="space-y-4">
                     {recentMails.length > 0 ? recentMails.map((mail: any) => (
                        <div key={mail.id} className="group cursor-pointer">
                           <p className="text-xs font-bold truncate group-hover:text-accent transition-colors">{mail.subject}</p>
                           <p className="text-[9px] text-muted-foreground font-bold uppercase mt-1">From: {mail.sender?.full_name}</p>
                        </div>
                     )) : (
                        <p className="text-[10px] text-muted-foreground/40 font-bold uppercase py-2">Inbox Clear</p>
                     )}
                  </div>
                  <button onClick={() => window.location.href = '/project-lead/mail'} className="w-full mt-4 py-2 border border-secondary rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-secondary/20 transition-all">
                     Open Comm-Link
                  </button>
               </div>

               {/* Briefing Overview */}
               <div className="bg-background border border-secondary rounded-2xl p-6 shadow-sm">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-5 flex items-center gap-2">
                     <Video className="h-3.5 w-3.5 text-accent" /> Briefings
                  </h4>
                  <div className="space-y-3">
                     {upcomingMeetings.length > 0 ? upcomingMeetings.map((mtg: any) => (
                        <div key={mtg.id} className="p-3 bg-secondary/20 border border-secondary rounded-xl flex items-center justify-between">
                           <p className="text-xs font-bold truncate pr-2">{mtg.title}</p>
                           <p className="text-[9px] text-accent font-black uppercase whitespace-nowrap">
                              {new Date(mtg.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                           </p>
                        </div>
                     )) : (
                        <p className="text-[10px] text-muted-foreground/40 font-bold uppercase py-2 text-center border border-dashed border-secondary/50 rounded-xl">No Meetings</p>
                     )}
                  </div>
                  <button onClick={() => window.location.href = '/project-lead/meetings'} className="w-full mt-4 py-2 border border-secondary rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-secondary/20 transition-all">
                     Sync Schedule
                  </button>
               </div>
            </div>
         </div>
      </div>
   );
}

function QuickStat({ title, value, icon: Icon, highlight = false }: any) {
   return (
      <div className={cn(
         "bg-background border rounded-lg p-4 shadow-sm transition-all group",
         highlight ? "border-accent/40" : "border-secondary hover:border-accent/30"
      )}>
         <div className="flex items-center justify-between mb-3">
            <div className={cn(
               "p-2 rounded-lg border",
               highlight ? "bg-accent/10 border-accent text-accent" : "bg-secondary/50 border-secondary text-muted-foreground"
            )}>
               <Icon className="h-4 w-4" />
            </div>
         </div>
         <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">{title}</p>
         <p className="text-xl font-bold tracking-tight">{value}</p>
      </div>
   );
}
