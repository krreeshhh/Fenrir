"use client"

import { useState, useEffect } from "react";
import { Trophy, TrendingUp, ShieldCheck } from "lucide-react";
import { cn } from "@/utils/cn";
import { createClient } from "@/utils/supabase";
import { useUser } from "@/components/UserContext";
import { SimpleLeaderboardSkeleton } from "@/components/Skeleton";
import { Avatar, RankBadge } from "@/components/Avatar";

export default function LeadsLeaderboardPageManager() {
   const [leads, setLeads] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);
   const { userId } = useUser();
   const supabase = createClient();

   useEffect(() => { fetchLeads(); }, []);

   const fetchLeads = async () => {
      setLoading(true);
      const { data } = await supabase
         .from('users_metadata')
         .select('*')
         .eq('role', 'project_lead')
         .order('score', { ascending: false });

      if (data) setLeads(data.map((lead, index) => ({ ...lead, rank: index + 1 })));
      setLoading(false);
   };

   if (loading) return <SimpleLeaderboardSkeleton />;

   return (
      <div className="space-y-8 pb-16">
         {/* Header */}
         <div className="flex items-center justify-between border-b border-secondary/50 pb-6">
            <div className="flex items-center gap-3">
               <div className="h-10 w-10 bg-accent/10 rounded-xl flex items-center justify-center border border-accent/20">
                  <ShieldCheck className="h-5 w-5 text-accent" />
               </div>
               <div>
                  <h2 className="text-2xl font-bold tracking-tight">Project Lead Rankings</h2>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mt-0.5">Performance scores across all project leads</p>
               </div>
            </div>
            <div className="text-right">
               <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total</p>
               <p className="text-xl font-black">{leads.length} <span className="text-xs text-muted-foreground font-bold">Leads</span></p>
            </div>
         </div>

         {/* Podium */}
         {leads.length > 0 && (
            <div>
               <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-4">
                  <Trophy className="h-4 w-4 text-amber-500" /> Top Leaders
                  <div className="flex-1 h-px bg-secondary/60" />
               </h3>
               <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {leads.slice(0, 3).map((u, i) => (
                     <div key={u.id} className={cn(
                        "bg-background border rounded-2xl p-6 text-center shadow-sm transition-all hover:shadow-lg hover:-translate-y-1",
                        i === 0 ? "border-amber-400/50 bg-amber-400/5" : "border-secondary hover:border-accent/30"
                     )}>
                        <div className="flex flex-col items-center gap-3">
                           <RankBadge rank={u.rank} large />
                           <Avatar name={u.full_name} avatarUrl={u.avatar_url} size="lg" />
                           <div>
                              <p className="text-base font-bold">{u.full_name}</p>
                              <p className="text-2xl font-black text-accent mt-1">{u.score?.toLocaleString()}</p>
                              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">XP Score</p>
                           </div>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         )}

         {/* Full Rankings */}
         <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-4">
               <TrendingUp className="h-4 w-4" /> All Lead Rankings
               <div className="flex-1 h-px bg-secondary/60" />
               <span className="text-accent">{leads.length} leads</span>
            </h3>
            <div className="bg-background border border-secondary rounded-2xl overflow-hidden shadow-sm">
               {leads.length === 0 ? (
                  <div className="p-12 text-center text-sm font-medium text-muted-foreground">No project leads in database.</div>
               ) : (
                  <table className="w-full text-left text-sm min-w-[480px]">
                     <thead className="bg-secondary/20 text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b border-secondary">
                        <tr>
                           <th className="p-4 w-20 text-center">Rank</th>
                           <th className="p-4">Project Lead</th>
                           <th className="p-4 text-right">Score</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-secondary/50">
                        {leads.map(u => (
                           <tr key={u.id} className="transition-all hover:bg-secondary/10 group">
                              <td className="p-4 text-center"><div className="flex justify-center"><RankBadge rank={u.rank} /></div></td>
                              <td className="p-4">
                                 <div className="flex items-center gap-3">
                                    <Avatar name={u.full_name} avatarUrl={u.avatar_url} size="sm" />
                                    <div>
                                       <p className="font-bold group-hover:text-accent transition-colors">{u.full_name}</p>
                                       <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{u.unit || "Operations"} Unit</p>
                                    </div>
                                 </div>
                              </td>
                              <td className="p-4 text-right">
                                 <p className="font-black text-base">{u.score?.toLocaleString()}</p>
                                 <p className="text-[10px] font-bold text-accent uppercase tracking-widest">XP</p>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               )}
            </div>
         </div>
      </div>
   );
}
