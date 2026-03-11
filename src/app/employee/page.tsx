"use client"

import { useState, useEffect } from "react";
import KanbanBoard from "@/components/KanbanBoard";
import {
   BarChart3,
   TrendingUp,
   CheckCircle2,
   ShieldCheck,
   Activity,
   Globe,
   Cpu,
   Layers
} from "lucide-react";
import { cn } from "@/utils/cn";
import { createClient } from "@/utils/supabase";

export default function EmployeeDashboard() {
   const [userData, setUserData] = useState<any>(null);
   const [stats, setStats] = useState({
      tasksCount: 0,
      payoutsCount: 0,
      validatedCount: 0,
      rank: 0,
      score: 0
   });
   const [loading, setLoading] = useState(true);
   const supabase = createClient();

   useEffect(() => {
      fetchDashboardData();
   }, []);

   const fetchDashboardData = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: metadata } = await supabase
         .from('users_metadata')
         .select('*')
         .eq('id', user.id)
         .single();

      if (metadata) {
         setUserData(metadata);
         setStats(prev => ({ ...prev, score: metadata.score }));
      }

      const { count: totalTasks } = await supabase
         .from('checklist_allocations')
         .select('*', { count: 'exact', head: true })
         .eq('employee_id', user.id);

      const { count: validatedTasks } = await supabase
         .from('checklist_allocations')
         .select('*', { count: 'exact', head: true })
         .eq('employee_id', user.id)
         .eq('verified', true);

      const { count: revenueCount } = await supabase
         .from('revenue_records')
         .select('*', { count: 'exact', head: true })
         .eq('employee_id', user.id);

      const { data: rankData } = await supabase
         .from('users_metadata')
         .select('id, score')
         .order('score', { ascending: false });

      const myRank = (rankData && user)
         ? rankData.findIndex(r => r.id === user.id) + 1
         : 0;

      setStats({
         tasksCount: totalTasks || 0,
         payoutsCount: revenueCount || 0,
         validatedCount: validatedTasks || 0,
         rank: myRank,
         score: metadata?.score || 0
      });

      setLoading(false);
   };

   if (loading) {
      return (
         
            <div className="flex items-center justify-center min-h-[60vh]">
               <div className="flex flex-col items-center gap-4">
                  <div className="h-10 w-10 border-4 border-secondary border-t-accent rounded-full animate-spin"></div>
                  <p className="text-sm font-medium text-muted-foreground">Loading dashboard...</p>
               </div>
            </div>
         
      )
   }

   return (
      
         <div className="space-y-6 pb-16">

            {/* Welcome Banner */}
            <div className="bg-background border border-secondary rounded-lg p-6 flex items-center justify-between">
               <div>
                  <p className="text-xs font-bold text-accent uppercase tracking-widest mb-1">Welcome back</p>
                  <h2 className="text-xl font-bold">{userData?.full_name}</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                     You have <span className="font-bold text-foreground">{stats.tasksCount - stats.validatedCount} pending tasks</span> today.
                  </p>
               </div>
               <div className="hidden md:flex items-center gap-6">
                  <div className="text-center">
                     <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Score</p>
                     <p className="text-2xl font-black text-accent">{stats.score.toLocaleString()}</p>
                  </div>
                  <div className="text-center">
                     <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Rank</p>
                     <p className="text-2xl font-black">#{stats.rank.toString().padStart(2, '0')}</p>
                  </div>
               </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               <StatCard title="Total Tasks" value={stats.tasksCount} icon={Layers} highlight={false} />
               <StatCard title="Validated" value={stats.validatedCount} icon={CheckCircle2} highlight={false} />
               <StatCard title="Payouts" value={stats.payoutsCount} icon={TrendingUp} highlight={true} />
               <StatCard title="Security" value="Verified" icon={ShieldCheck} highlight={false} />
            </div>

            {/* Kanban Board */}
            <div>
               <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                     <Activity className="h-5 w-5 text-accent" />
                     <h3 className="text-lg font-bold">Task Board</h3>
                  </div>
                  <div className="px-3 py-1 bg-accent/10 border border-accent/20 rounded-lg text-[10px] font-bold text-accent uppercase tracking-widest">
                     Real-time Sync
                  </div>
               </div>
               <div className="bg-secondary/5 border border-secondary rounded-lg p-2 min-h-[500px]">
                  <KanbanBoard />
               </div>
            </div>
         </div>
      
   );
}

function StatCard({ title, value, icon: Icon, highlight = false }: any) {
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
         <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{title}</p>
         <p className="text-xl font-black tracking-tight">{value}</p>
      </div>
   );
}
