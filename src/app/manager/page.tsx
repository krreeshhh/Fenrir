"use client"

import { useState, useEffect } from "react";
import {
   BarChart,
   TrendingUp,
   Users,
   CheckCircle2,
   Target,
   Zap,
   DollarSign,
   ArrowUpRight,
   ShieldCheck,
   Briefcase,
   Activity,
   Video
} from "lucide-react";
import { cn } from "@/utils/cn";
import { createClient } from "@/utils/supabase";
import { DashboardSkeleton } from "@/components/Skeleton";

export default function ManagerDashboard() {
   const [stats, setStats] = useState({
      personnelCount: 0,
      leadCount: 0,
      assetValue: 0,
      projectCount: 0,
      activeLeads: [] as any[],
      managedProjects: [] as any[]
   });
   const [userData, setUserData] = useState<any>(null);
   const [loading, setLoading] = useState(true);
   const [recentMails, setRecentMails] = useState<any[]>([]);
   const [upcomingMeetings, setUpcomingMeetings] = useState<any[]>([]);
   const supabase = createClient();

   useEffect(() => {
      fetchManagerData();
   }, []);

   const fetchManagerData = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: me } = await supabase
         .from('users_metadata')
         .select('*')
         .eq('id', user.id)
         .single();
      setUserData(me);

      const { data: managedProjects } = await supabase
         .from('projects')
         .select('id, name, created_at, status')
         .eq('manager_id', user.id);

      const projectIds = managedProjects?.map((p: any) => p.id) || [];

      // Leads overseeing these projects
      const { data: leadsData } = await supabase
         .from('projects')
         .select(`
            project_lead_id,
            users_metadata!projects_project_lead_id_fkey(full_name, score, role)
         `)
         .in('id', projectIds)
         .not('project_lead_id', 'is', null);

      const uniqueLeads = Array.from(new Map(leadsData?.map((l: any) => [l.project_lead_id, l.users_metadata])).values());

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

      // Find employees reporting to these projects
      const { data: checklistData } = await supabase
         .from('checklists')
         .select('id')
         .in('project_id', projectIds);

      const checklistIds = checklistData?.map((c: any) => c.id) || [];

      const { data: taskAllocations } = await supabase
         .from('checklist_allocations')
         .select('employee_id')
         .in('checklist_id', checklistIds);

      const uniqueEmployees = new Set(taskAllocations?.map((t: any) => t.employee_id));

      // Calculate asset value (from revenue_records)
      const { data: revenueData } = await supabase
         .from('revenue_records')
         .select('amount')
         .in('employee_id', Array.from(uniqueEmployees));

      const totalAsset = revenueData?.reduce((sum: any, item: any) => sum + Number(item.amount), 0) || 0;

      setStats({
         personnelCount: uniqueEmployees.size,
         leadCount: uniqueLeads.length,
         assetValue: totalAsset,
         projectCount: projectIds.length,
         activeLeads: (uniqueLeads as any[]).sort((a, b) => b.score - a.score).slice(0, 5),
         managedProjects: managedProjects || []
      });

      setLoading(false);
   };

   if (loading) return <DashboardSkeleton />;

   return (
      <div className="space-y-6 pb-16">
         {/* Minimal Manager Header */}
         <div className="bg-background border border-secondary rounded-2xl p-8 flex flex-col md:flex-row md:items-center justify-between gap-8 shadow-sm relative overflow-hidden">
            <div className="space-y-2 relative z-10">
               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-accent">Operations Manager</p>
               <h2 className="text-2xl font-bold tracking-tight">{userData?.full_name}</h2>
               <p className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                  Overseeing <span className="text-foreground font-bold">{stats.projectCount} Strategic Projects</span> 
                  <span className="w-1 h-1 rounded-full bg-secondary" />
                  Directing <span className="text-foreground font-bold">{stats.personnelCount} Operators</span>
               </p>
            </div>
            <div className="flex items-center gap-10 border-t md:border-t-0 md:border-l border-secondary pt-8 md:pt-0 md:pl-10 relative z-10">
               <div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Portfolio Value</p>
                  <p className="text-2xl font-bold tracking-tighter text-white">${(stats.assetValue / 1000).toFixed(1)}K</p>
               </div>
               <div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Lead Count</p>
                  <p className="text-2xl font-bold tracking-tighter text-accent">{stats.leadCount}</p>
               </div>
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Active Operations List */}
            <div className="lg:col-span-2 space-y-4">
               <div className="flex items-center justify-between mb-2 px-1">
                  <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Active Operations</h3>
               </div>

               <div className="bg-background border border-secondary rounded-2xl divide-y divide-secondary shadow-sm overflow-hidden">
                  {stats.managedProjects.length > 0 ? stats.managedProjects.map((proj: any) => (
                     <div key={proj.id} className="p-5 flex items-center justify-between hover:bg-secondary/10 transition-colors group">
                        <div className="flex items-center gap-4">
                           <div className="h-2 w-2 rounded-full bg-accent shadow-blue-glow animate-pulse" />
                           <p className="font-bold text-sm tracking-tight">{proj.name}</p>
                        </div>
                        <div className="flex items-center gap-6">
                           <p className="text-[10px] font-bold text-muted-foreground uppercase">{new Date(proj.created_at).toLocaleDateString()}</p>
                           <span className={cn(
                              "px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-tighter border",
                              proj.status === 'active' ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                           )}>
                              {proj.status || 'Active'}
                           </span>
                        </div>
                     </div>
                  )) : (
                     <div className="p-12 text-center">
                        <p className="text-xs font-bold text-muted-foreground/50 uppercase tracking-widest">No active nodes</p>
                     </div>
                  )}
               </div>
            </div>

            {/* Compact Insights Sidebar */}
            <div className="space-y-6">
               <div className="bg-background border border-secondary rounded-2xl p-6 shadow-sm">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-5 flex items-center gap-2">
                     <Activity className="h-3 w-3 text-accent" /> Intelligence
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
               </div>

               <div className="bg-background border border-secondary rounded-2xl p-6 shadow-sm">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-5 flex items-center gap-2">
                     <Video className="h-3 w-3 text-accent" /> Briefings
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
                        <p className="text-[10px] text-muted-foreground/40 font-bold uppercase py-2 text-center border border-dashed border-secondary/50 rounded-xl">Clear Schedule</p>
                     )}
                  </div>
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

