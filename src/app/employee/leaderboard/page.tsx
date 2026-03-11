"use client"

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase";
import {
   Trophy,
   ArrowUpRight,
   Activity,
   TrendingUp,
   Star,
   Loader2
} from "lucide-react";
import { cn } from "@/utils/cn";

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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      setUserName(user.user_metadata?.full_name || user.email?.split('@')[0] || "Employee");

      const { data: leadData, error } = await supabase
         .from('users_metadata')
         .select('*')
         .order('score', { ascending: false });

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

      setLoading(false);
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
               <div className="flex gap-2">
                  <button className="bg-accent text-white border-accent px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest border transition-all">
                     GLOBAL
                  </button>
               </div>
            </div>

            {loading ? (
               <div className="h-64 flex flex-col items-center justify-center text-muted-foreground gap-4">
                  <Loader2 className="h-8 w-8 animate-spin text-accent" />
                  <p className="text-xs font-bold uppercase tracking-widest">Querying Global Matrix...</p>
               </div>
            ) : (
               <>
                  {/* My standing banner */}
                  {displayUser && (
                     <div className={cn(
                        "bg-background border rounded-lg p-5 flex items-center justify-between",
                        displayUser.rank <= 3 ? "border-accent/40" : "border-secondary"
                     )}>
                        <div className="flex items-center gap-4">
                           <div className="h-12 w-12 rounded-full border-2 border-accent flex items-center justify-center text-lg font-black shrink-0 relative">
                              <span className="text-secondary/20 font-black text-4xl absolute z-0 left-[-15px] bottom-[-5px]">#</span>
                              <span className="relative z-10">{displayUser.rank}</span>
                           </div>
                           <div>
                              <p className="text-sm font-bold opacity-70">Your Global Rank</p>
                              <p className="text-lg font-black tracking-tight">{displayUser.full_name}</p>
                           </div>
                        </div>
                        <div className="text-right">
                           <p className="text-sm font-bold opacity-70 mb-1">Total Impact Score</p>
                           <p className="flex items-center gap-1.5 justify-end font-black text-2xl">
                              {displayUser.score} <Activity className="h-5 w-5 text-accent" />
                           </p>
                        </div>
                     </div>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                     {/* Top 3 Spotlight */}
                     <div className="lg:col-span-1 space-y-4">
                        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                           <Star className="h-4 w-4" /> Top Matrix
                        </h3>
                        <div className="space-y-3">
                           {topThree.map((user, idx) => (
                              <div key={user.id} className={cn(
                                 "bg-background border p-4 rounded-lg flex items-center gap-3 relative overflow-hidden transition-all hover:scale-105",
                                 idx === 0 ? "border-accent/60 shadow-[0_0_15px_-3px_rgba(59,130,246,0.3)]" : "border-secondary/40"
                              )}>
                                 {idx === 0 && <div className="absolute top-0 right-0 p-1 rounded-bl-lg bg-accent/10 border-b border-l border-accent/20"><Trophy className="h-3 w-3 text-accent" /></div>}
                                 <div className={cn(
                                    "font-black text-xl w-6 flex justify-center",
                                    idx === 0 ? "text-accent" : "text-muted-foreground/30"
                                 )}>
                                    {user.rank}
                                 </div>
                                 <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold truncate">{user.full_name}</p>
                                    <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mt-0.5">{user.department}</p>
                                 </div>
                                 <p className="font-black text-sm">{user.score}</p>
                              </div>
                           ))}
                        </div>
                     </div>

                     {/* Full Rankings list */}
                     <div className="lg:col-span-3 space-y-3">
                        <div className="flex items-center justify-between mb-4">
                           <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                              <TrendingUp className="h-4 w-4" /> All Operators
                           </h3>
                           <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">{users.length} Active Records</p>
                        </div>

                        <div className="bg-background border border-secondary rounded-lg overflow-hidden">
                           <table className="w-full text-left font-bold text-sm">
                              <thead className="bg-secondary/20 text-[10px] uppercase tracking-widest text-muted-foreground border-b border-secondary">
                                 <tr>
                                    <th className="p-4 w-16 text-center">Rnk</th>
                                    <th className="p-4">Operator</th>
                                    <th className="p-4">Dept_Code</th>
                                    <th className="p-4 text-right">Impact</th>
                                    <th className="p-4 w-12"></th>
                                 </tr>
                              </thead>
                              <tbody className="divide-y divide-secondary">
                                 {users.map((user) => (
                                    <tr key={user.id} className={cn("transition-colors hover:bg-secondary/10", displayUser && user.id === displayUser.id && "bg-accent/5")}>
                                       <td className="p-4 text-center font-black text-muted-foreground">#{user.rank}</td>
                                       <td className="p-4 px-4 overflow-hidden">
                                          <div className="flex items-center gap-2 truncate">
                                             <div className="h-6 w-6 shrink-0 rounded bg-secondary flex items-center justify-center text-[10px]">
                                                {user.full_name.slice(0, 2).toUpperCase()}
                                             </div>
                                             {displayUser && user.id === displayUser.id ? <span className="text-accent">{user.full_name} (You)</span> : user.full_name}
                                          </div>
                                       </td>
                                       <td className="p-4">
                                          <span className="px-2 py-0.5 rounded border border-secondary bg-secondary/20 text-[9px] tracking-widest uppercase truncate max-w-[100px] inline-block">
                                             {user.department}
                                          </span>
                                       </td>
                                       <td className="p-4 text-right font-black">{user.score}</td>
                                       <td className="p-4 text-center">
                                          <ArrowUpRight className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-pointer" />
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
