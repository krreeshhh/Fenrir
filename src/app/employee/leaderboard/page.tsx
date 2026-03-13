"use client"

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase";
import {
   Trophy,
   ArrowUpRight,
   Activity,
   TrendingUp,
   Star
} from "lucide-react";
import { cn } from "@/utils/cn";
import { LeaderboardSkeleton } from "@/components/Skeleton";

export default function LeaderboardPage() {
   const supabase = createClient();
   const [filter, setFilter] = useState<'all'>('all'); // Removed static departments, keeping all for now
   const [loading, setLoading] = useState(true);
   const [users, setUsers] = useState<any[]>([]);
   const [myRank, setMyRank] = useState<any>(null);
   const [userName, setUserName] = useState("Loading...");

   useEffect(() => {
      fetchLeaderboard();
   }, []);

   const fetchLeaderboard = async () => {
      setLoading(true);

      try {
         // 1. Parallel Fetch of user session and leaderboard data
         const [authRes, leadRes] = await Promise.all([
            supabase.auth.getUser(),
            supabase
               .from('users_metadata')
               .select('*')
               .eq('role', 'employee')
               .order('score', { ascending: false })
         ]);

         const user = authRes.data?.user;
         const leadData = leadRes.data;
         const error = leadRes.error;

         if (!user) {
            setLoading(false);
            return;
         }

         setUserName(user.user_metadata?.full_name || user.email?.split('@')[0] || "Employee");

         if (error || !leadData) {
            console.error(error);
            setLoading(false);
            return;
         }

         // Add rankings
         const rankedUsers = leadData.map((u, index) => ({
            ...u,
            rank: index + 1,
            department: u.role.replace('_', ' ').toUpperCase()
         }));

         setUsers(rankedUsers);

         const me = rankedUsers.find(u => u.id === user.id);
         if (me) setMyRank(me);
      } catch (err) {
         console.error("Leaderboard Sync Failure:", err);
      } finally {
         setLoading(false);
      }
   };

   const topThree = users.slice(0, 3);
   const displayUser = myRank;

   return (

      <div className="space-y-6 pb-16">

         {/* Page Header */}
         <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
               <Trophy className="h-5 w-5 text-accent" />
               <h2 className="text-xl font-bold">Performance Leaderboard</h2>
            </div>
         </div>

         {loading ? (
            <LeaderboardSkeleton />
         ) : (
            <>
               {/* My standing banner */}
               {displayUser && (
                  <div className={cn(
                     "bg-background border rounded-lg p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4",
                     displayUser.rank <= 3 ? "border-accent/40" : "border-secondary"
                  )}>
                     <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full border-2 border-accent flex items-center justify-center text-lg font-bold shrink-0 relative">
                           <span className="text-secondary/20 font-bold text-4xl absolute z-0 left-[-15px] bottom-[-5px]">#</span>
                           <span className="relative z-10">{displayUser.rank}</span>
                        </div>
                        <div>
                           <p className="text-sm font-bold opacity-70">Your Global Rank</p>
                           <p className="text-lg font-bold tracking-tight">{displayUser.full_name}</p>
                        </div>
                     </div>
                     <div className="text-left sm:text-right">
                        <p className="text-sm font-bold opacity-70 mb-1">Total Score</p>
                        <p className="flex items-center gap-1.5 sm:justify-end font-bold text-2xl">
                           {displayUser.score} <Activity className="h-5 w-5 text-accent" />
                        </p>
                     </div>
                  </div>
               )}

               <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                  {/* Top 3 Spotlight */}
                  <div className="lg:col-span-1 space-y-4">
                     <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                        <Star className="h-4 w-4" /> Top Employees
                     </h3>
                     <div className="space-y-3">
                        {topThree.map((user, idx) => (
                           <div key={user.id} className={cn(
                              "bg-background border p-4 rounded-xl flex items-center gap-4 relative overflow-hidden transition-all hover:scale-105 group",
                              idx === 0 ? "border-accent/60 shadow-[0_0_20px_-5px_rgba(59,130,246,0.3)] bg-accent/5" : "border-secondary/40"
                           )}>
                              {idx === 0 && (
                                 <div className="absolute top-0 right-0 p-1.5 rounded-bl-xl bg-accent text-white shadow-lg">
                                    <Trophy className="h-3.5 w-3.5" />
                                 </div>
                              )}
                              <div className={cn(
                                 "h-10 w-8 flex items-center justify-center font-black text-2xl shrink-0",
                                 idx === 0 ? "text-accent" : "text-muted-foreground/20"
                              )}>
                                 {user.rank}
                              </div>
                              <div className="h-10 w-10 shrink-0 rounded-xl bg-secondary/30 border border-secondary flex items-center justify-center text-[10px] font-black text-accent overflow-hidden relative bg-cover bg-center" style={user.avatar_url ? { backgroundImage: `url(${user.avatar_url})` } : {}}>
                                 {!user.avatar_url && user.full_name.slice(0, 2).toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                 <p className="text-sm font-bold truncate group-hover:text-accent transition-colors">{user.full_name}</p>
                                 <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mt-0.5">{user.department}</p>
                              </div>
                              <div className="text-right">
                                 <p className="text-sm font-black text-foreground">{user.score}</p>
                                 <p className="text-[9px] font-bold text-accent uppercase tracking-tighter">Impact</p>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>

                  {/* Full Rankings list */}
                  <div className="lg:col-span-3 space-y-3">
                     <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                           <TrendingUp className="h-4 w-4" /> All Employees
                        </h3>
                        <p className="text-xs uppercase font-bold tracking-wider text-muted-foreground">{users.length} Active Records</p>
                     </div>

                     <div className="bg-background border border-secondary rounded-xl overflow-x-auto shadow-sm">
                        <table className="w-full text-left font-bold text-sm min-w-[550px]">
                           <thead className="bg-secondary/20 text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b border-secondary">
                              <tr>
                                 <th className="p-5 w-20 text-center">Rank</th>
                                 <th className="p-5">Strategic Operator</th>
                                 <th className="p-5 text-right w-32">Impact Score</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-secondary/50">
                              {users.map((user) => (
                                 <tr key={user.id} className={cn("transition-all hover:bg-accent/5 group", displayUser && user.id === displayUser.id && "bg-accent/[0.03]")}>
                                    <td className="p-5 text-center">
                                       <span className={cn(
                                          "inline-flex items-center justify-center h-8 w-8 rounded-lg font-black text-sm",
                                          user.rank <= 3 ? "bg-accent/10 text-accent" : "text-muted-foreground/40"
                                       )}>
                                          {user.rank}
                                       </span>
                                    </td>
                                     <td className="p-5">
                                        <div className="flex items-center gap-3">
                                           <div className="h-9 w-9 shrink-0 rounded-xl bg-secondary/30 border border-secondary flex items-center justify-center text-[10px] font-black text-accent overflow-hidden relative group-hover:border-accent/40 transition-colors bg-cover bg-center" style={user.avatar_url ? { backgroundImage: `url(${user.avatar_url})` } : {}}>
                                              {!user.avatar_url && user.full_name.slice(0, 2).toUpperCase()}
                                           </div>
                                          <div>
                                             <p className={cn("text-sm font-bold tracking-tight", displayUser && user.id === displayUser.id ? "text-accent" : "text-foreground")}>
                                                {user.full_name} {displayUser && user.id === displayUser.id && "(You)"}
                                             </p>
                                             <p className="text-[9px] font-black uppercase tracking-tighter text-muted-foreground/50 mt-0.5">{user.department}</p>
                                          </div>
                                       </div>
                                    </td>
                                    <td className="p-5 text-right">
                                       <div className="flex flex-col items-end">
                                          <span className="font-black text-base tracking-tight">{user.score}</span>
                                          <span className="text-[9px] font-bold text-accent uppercase tracking-tighter">PNT Impact</span>
                                       </div>
                                    </td>
                                 </tr>
                              ))}
                           </tbody>
                        </table>
                     </div>
                  </div>
               </div>
            </>
         )}
      </div>

   );
}
