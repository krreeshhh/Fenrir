"use client"

import { useState, useEffect } from "react";
import {
   Users,
   Shield,
   ShieldCheck,
   ShieldAlert,
   Activity,
   TrendingUp,
   Zap,
   Globe,
   UserPlus
} from "lucide-react";
import { cn } from "@/utils/cn";
import { createClient } from "@/utils/supabase";
import { DashboardSkeleton } from "@/components/Skeleton";

export default function AdminDashboard() {
   const [stats, setStats] = useState({
      totalUsers: 0,
      roleDistribution: {} as Record<string, number>,
      recentActivity: [] as any[]
   });
   const [loading, setLoading] = useState(true);
   const supabase = createClient();

   useEffect(() => {
      fetchAdminStats();
   }, []);

   const fetchAdminStats = async () => {
      setLoading(true);
      
      const { data: users, count } = await supabase
         .from('users_metadata')
         .select('*', { count: 'exact' });

      if (users) {
         const distribution = users.reduce((acc: any, curr: any) => {
            acc[curr.role] = (acc[curr.role] || 0) + 1;
            return acc;
         }, {});

         setStats({
            totalUsers: count || 0,
            roleDistribution: distribution,
            recentActivity: users.slice(0, 5) // Mocking activity with recent users
         });
      }
      setLoading(false);
   };

   if (loading) return <DashboardSkeleton />;

   return (
      <div className="space-y-6 pb-16">
         {/* Admin Hero */}
         <div className="bg-background border border-secondary rounded-xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between shadow-sm relative overflow-hidden group gap-6">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-150 transition-all duration-700 pointer-events-none">
               <Shield className="h-40 w-40 text-accent" />
            </div>
            <div className="text-center sm:text-left z-10">
               <p className="text-xs font-bold text-accent uppercase tracking-wider mb-2">Central Governance Node</p>
               <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-tight">Administrative Override</h2>
               <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-4 flex flex-wrap items-center justify-center sm:justify-start gap-4">
                  <div className="flex items-center gap-2">System: <span className="text-green-500">OPERATIONAL</span></div>
                  <span className="hidden sm:block w-1.5 h-1.5 rounded-full bg-secondary" />
                  <div className="flex items-center gap-2">Authority: <span className="text-foreground">LVL 9</span></div>
               </div>
            </div>
            <div className="flex items-center gap-8 sm:gap-12 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 sm:border-l border-secondary pt-6 sm:pt-0 sm:pl-12">
               <div className="text-left sm:text-right">
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">UPTIME</p>
                  <p className="text-2xl sm:text-3xl font-bold text-accent tracking-tighter">99.99%</p>
               </div>
               <div className="text-right">
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">HEALTH</p>
                  <span className="inline-flex items-center gap-2 px-2.5 py-1 bg-green-500/10 text-green-500 rounded-lg border border-green-500/20 font-bold text-[11px] uppercase tracking-wider leading-none">
                     <ShieldCheck className="h-3 w-3" /> Secure
                  </span>
               </div>
            </div>
         </div>

         {/* Stats Grid */}
         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <QuickStat label="Total Nodes" value={stats.totalUsers} icon={Users} />
            <QuickStat label="Unit Heads" value={stats.roleDistribution.unit_head || 0} icon={Globe} accent />
            <QuickStat label="Managers" value={stats.roleDistribution.manager || 0} icon={Zap} />
            <QuickStat label="System Load" value="LOW" icon={Activity} green />
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3 space-y-6">
               {/* Role Distribution Visualization (Simplified) */}
               <div className="space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider">Network Architecture</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <DistributionCard label="Employees" count={stats.roleDistribution.employee || 0} percentage={(stats.roleDistribution.employee || 0) / stats.totalUsers * 100} color="bg-foreground" />
                     <DistributionCard label="Project Leads" count={stats.roleDistribution.project_lead || 0} percentage={(stats.roleDistribution.project_lead || 0) / stats.totalUsers * 100} color="bg-accent" />
                  </div>
               </div>

               {/* Recent Node Accessions */}
               <div className="space-y-4 pt-4">
                  <div className="flex items-center justify-between">
                     <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                        <UserPlus className="h-5 w-5 text-accent" /> Recent Node Accessions
                     </h3>
                     <button onClick={() => window.location.href = '/admin/users'} className="text-xs font-bold text-accent hover:underline uppercase tracking-wider">Audit Registry</button>
                  </div>
                  <div className="bg-background border border-secondary rounded-xl divide-y divide-secondary overflow-hidden shadow-sm">
                     {stats.recentActivity.map((user, i) => (
                        <div key={user.id} className="flex items-center justify-between p-5 hover:bg-secondary/10 transition-colors group">
                           <div className="flex items-center gap-4">
                              <div className="h-10 w-10 rounded-xl bg-secondary border border-secondary flex items-center justify-center font-bold text-xs group-hover:bg-foreground group-hover:text-background transition-all shadow-sm">
                                 {user.full_name[0]}
                              </div>
                              <div>
                                 <p className="text-sm font-bold uppercase tracking-tight">{user.full_name}</p>
                                 <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mt-0.5 opacity-60">ID: PVT-{user.id.slice(0, 8).toUpperCase()}</p>
                              </div>
                           </div>
                           <div className="text-right">
                              <span className="text-xs font-bold bg-secondary/50 text-foreground border border-secondary px-3 py-1.5 rounded-lg uppercase tracking-wider shadow-inner">
                                 {user.role?.replace('_', ' ')}
                              </span>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            </div>

            <div className="space-y-6">
               <h3 className="text-sm font-bold uppercase tracking-wider">System Protocol</h3>
               <div className="bg-foreground text-background rounded-2xl p-8 text-center shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-150 transition-transform duration-700">
                     <ShieldAlert className="h-20 w-20 text-accent" />
                  </div>
                  <ShieldCheck className="h-12 w-12 mx-auto mb-4 animate-float text-accent" />
                  <h5 className="font-bold text-xs uppercase tracking-wider">Governance Module</h5>
                  <p className="text-[11px] font-bold opacity-60 mt-4 uppercase tracking-wider leading-relaxed">Centralized role management and system-wide overrides active.</p>
                  <button className="mt-8 w-full py-4 bg-accent text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-accent/20 hover:scale-105 active:scale-95 transition-all">
                     System Maintenance
                  </button>
               </div>
            </div>
         </div>
      </div>
   );
}

function QuickStat({ label, value, icon: Icon, accent = false, green = false }: any) {
   return (
      <div className={cn(
         "bg-background border rounded-xl p-5 shadow-sm transition-all hover:scale-[1.02]",
         accent ? "border-accent/40 bg-accent/5 ring-1 ring-accent/10" : "border-secondary"
      )}>
         <div className="flex items-center gap-2 mb-2">
            <Icon className={cn("h-4 w-4", accent ? "text-accent" : green ? "text-green-500" : "text-muted-foreground")} />
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{label}</p>
         </div>
         <p className={cn("text-xl font-bold tracking-tight", green ? "text-green-500" : "")}>{value}</p>
      </div>
   );
}

function DistributionCard({ label, count, percentage, color }: any) {
   return (
      <div className="bg-background border border-secondary rounded-xl p-6 shadow-sm">
         <div className="flex justify-between items-center mb-4">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
            <span className="text-sm font-bold">{count}</span>
         </div>
         <div className="h-2 w-full bg-secondary rounded-full overflow-hidden border border-secondary">
            <div className={cn("h-full transition-all duration-1000", color)} style={{ width: `${percentage}%` }} />
         </div>
      </div>
   );
}
