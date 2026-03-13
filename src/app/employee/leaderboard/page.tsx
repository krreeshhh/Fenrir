"use client"

import { useState, useEffect } from "react";
import { Trophy, TrendingUp, Activity, Star } from "lucide-react";
import { cn } from "@/utils/cn";
import { createClient } from "@/utils/supabase";
import { LeaderboardSkeleton } from "@/components/Skeleton";
import { Avatar, RankBadge } from "@/components/Avatar";

export default function LeaderboardPage() {
   const supabase = createClient();
   const [loading, setLoading] = useState(true);
   const [users, setUsers] = useState<any[]>([]);
   const [myRank, setMyRank] = useState<any>(null);

   useEffect(() => { fetchLeaderboard(); }, []);

   const fetchLeaderboard = async () => {
      setLoading(true);
      try {
         const [authRes, leadRes] = await Promise.all([
            supabase.auth.getUser(),
            supabase.from('users_metadata').select('*').eq('role', 'employee').order('score', { ascending: false })
         ]);

         const user = authRes.data?.user;
         const leadData = leadRes.data;
         if (!user || !leadData) { setLoading(false); return; }

         const rankedUsers = leadData.map((u, index) => ({ ...u, rank: index + 1 }));
         setUsers(rankedUsers);
         const me = rankedUsers.find(u => u.id === user.id);
         if (me) setMyRank(me);
      } catch (err) {
         console.error("Leaderboard fetch error:", err);
      } finally {
         setLoading(false);
      }
   };

   const topThree = users.slice(0, 3);

   return (
      <div className="space-y-8 pb-16">
         {/* Header */}
         <div className="flex items-center justify-between border-b border-secondary/50 pb-6">
            <div className="flex items-center gap-3">
               <div className="h-10 w-10 bg-amber-500/10 rounded-xl flex items-center justify-center border border-amber-500/20">
                  <Trophy className="h-5 w-5 text-amber-500" />
               </div>
               <div>
                  <h2 className="text-2xl font-bold tracking-tight">Performance Leaderboard</h2>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mt-0.5">Employee Rankings</p>
               </div>
            </div>
            {users.length > 0 && (
               <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total</p>
                  <p className="text-xl font-black">{users.length} <span className="text-xs text-muted-foreground font-bold">Members</span></p>
               </div>
            )}
         </div>

         {loading ? <LeaderboardSkeleton /> : (
            <>
               {/* My Standing Banner */}
               {myRank && (
                  <div className={cn(
                     "bg-background border rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm",
                     myRank.rank <= 3 ? "border-accent/40 bg-accent/5" : "border-secondary"
                  )}>
                     <div className="flex items-center gap-4">
                        <RankBadge rank={myRank.rank} large />
                        <Avatar name={myRank.full_name} avatarUrl={myRank.avatar_url} size="md" />
                        <div>
                           <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Your Standing</p>
                           <p className="text-lg font-bold">{myRank.full_name}</p>
                        </div>
                     </div>
                     <div className="text-left sm:text-right">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Total Score</p>
                        <p className="text-2xl font-black flex items-center gap-1.5 sm:justify-end">
                           {myRank.score?.toLocaleString()} <Activity className="h-5 w-5 text-accent" />
                        </p>
                     </div>
                  </div>
               )}

               {/* Podium */}
               {topThree.length > 0 && (
                  <div>
                     <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-4">
                        <Star className="h-4 w-4 text-amber-500" /> Top Performers
                        <div className="flex-1 h-px bg-secondary/60" />
                     </h3>
                     <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {topThree.map((u, i) => (
                           <div key={u.id} className={cn(
                              "bg-background border rounded-2xl p-6 text-center shadow-sm relative overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1 group",
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

               {/* Full Table */}
               <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-4">
                     <TrendingUp className="h-4 w-4" /> Full Rankings
                     <div className="flex-1 h-px bg-secondary/60" />
                     <span className="text-accent">{users.length} operators</span>
                  </h3>
                  <div className="bg-background border border-secondary rounded-2xl overflow-hidden shadow-sm">
                     <table className="w-full text-left text-sm min-w-[480px]">
                        <thead className="bg-secondary/20 text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b border-secondary">
                           <tr>
                              <th className="p-4 w-20 text-center">Rank</th>
                              <th className="p-4">Operator</th>
                              <th className="p-4 text-right">Score</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-secondary/50">
                           {users.map(u => (
                              <tr key={u.id} className={cn(
                                 "transition-all hover:bg-secondary/10 group",
                                 myRank && u.id === myRank.id && "bg-accent/5"
                              )}>
                                 <td className="p-4 text-center">
                                    <div className="flex justify-center">
                                       <RankBadge rank={u.rank} />
                                    </div>
                                 </td>
                                 <td className="p-4">
                                    <div className="flex items-center gap-3">
                                       <Avatar name={u.full_name} avatarUrl={u.avatar_url} size="sm" />
                                       <div>
                                          <p className={cn("font-bold text-sm", myRank && u.id === myRank.id ? "text-accent" : "group-hover:text-accent transition-colors")}>
                                             {u.full_name} {myRank && u.id === myRank.id && <span className="text-[10px] bg-accent/10 text-accent px-1.5 py-0.5 rounded-md ml-1 font-black">YOU</span>}
                                          </p>
                                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">Employee</p>
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
                  </div>
               </div>
            </>
         )}
      </div>
   );
}
