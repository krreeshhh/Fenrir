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
         .from('project_allocations')
         .select(`
            project_lead_id,
            users_metadata!inner (full_name, score, role)
         `)
         .in('project_id', projectIds);

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
         {/* Stats Row */}
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <QuickStat title="Human Capital Index" value={stats.personnelCount} icon={Users} highlight={true} />
            <QuickStat title="Active Operations" value={stats.projectCount} icon={Target} />
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3 space-y-6">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <div className="h-10 w-10 bg-accent/10 rounded-xl flex items-center justify-center border border-accent/20">
                        <Zap className="h-5 w-5 text-accent" />
                     </div>
                     <div>
                        <h3 className="text-xl font-bold tracking-tight">Cluster Project Monitor</h3>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-0.5">Real-time operational status</p>
                     </div>
                  </div>
               </div>

               <div className="bg-background border border-secondary rounded-[24px] shadow-sm overflow-hidden">
                  <table className="w-full text-left">
                     <thead>
                        <tr className="bg-secondary/20 border-b border-secondary">
                           <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Operation Name</th>
                           <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Initialized</th>
                           <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Integrity</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-secondary">
                        {stats.managedProjects.map((proj: any, i: number) => (
                           <tr key={i} className="hover:bg-secondary/10 transition-colors group">
                              <td className="px-6 py-4">
                                 <div className="flex items-center gap-3">
                                    <div className="h-2 w-2 rounded-full bg-accent shadow-blue-glow" />
                                    <span className="text-sm font-bold">{proj.name}</span>
                                 </div>
                              </td>
                              <td className="px-6 py-4">
                                 <span className="text-xs font-bold text-muted-foreground uppercase">{new Date(proj.created_at).toLocaleDateString()}</span>
                              </td>
                               <td className="px-6 py-4 text-right">
                                 <span className={cn(
                                    "inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border text-[10px] font-black uppercase tracking-tighter",
                                    proj.status === 'active' ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                 )}>
                                    Status: {proj.status || 'Active'}
                                 </span>
                              </td>
                           </tr>
                        ))}
                        {stats.managedProjects.length === 0 && (
                           <tr>
                              <td colSpan={3} className="px-10 py-20 text-center text-sm font-bold text-muted-foreground opacity-50 uppercase tracking-widest">
                                 No active project nodes detected
                              </td>
                           </tr>
                        )}
                     </tbody>
                  </table>
               </div>
            </div>

            {/* Sidebar Command Intelligence */}
            <div className="space-y-6">
               <div className="bg-background border border-secondary rounded-[24px] p-6 shadow-sm">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
                     <Activity className="h-3 w-3 text-accent" /> Strategic Correspondence
                  </h4>
                  <div className="space-y-4">
                     {recentMails.length > 0 ? recentMails.map((mail: any) => (
                        <div key={mail.id} className="pb-3 border-b border-secondary/50 last:border-0 last:pb-0">
                           <p className="text-xs font-bold line-clamp-1">{mail.subject}</p>
                           <p className="text-[10px] text-muted-foreground font-bold uppercase mt-1">From: {mail.sender?.full_name || 'System'}</p>
                        </div>
                     )) : (
                        <p className="text-[10px] text-muted-foreground font-bold uppercase py-4">No recent directives</p>
                     )}
                  </div>
               </div>

               <div className="bg-background border border-secondary rounded-[24px] p-6 shadow-sm">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
                     <Video className="h-3 w-3 text-accent" /> Tactical Alignments
                  </h4>
                  <div className="space-y-4">
                     {upcomingMeetings.length > 0 ? upcomingMeetings.map((mtg: any) => (
                        <div key={mtg.id} className="p-3 bg-secondary/10 border border-secondary/30 rounded-xl">
                           <p className="text-xs font-bold line-clamp-1">{mtg.title}</p>
                           <p className="text-[10px] text-accent font-bold uppercase mt-1">
                              {new Date(mtg.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                           </p>
                        </div>
                     )) : (
                        <p className="text-[10px] text-muted-foreground font-bold uppercase py-4 text-center border border-dashed border-secondary/50 rounded-xl">Idle</p>
                     )}
                  </div>
                  <button onClick={() => window.location.href = '/manager/meetings'} className="w-full mt-4 py-2 bg-foreground text-background text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-accent transition-all">
                     View Schedule
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

