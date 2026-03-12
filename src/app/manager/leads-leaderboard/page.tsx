"use client"

import { useState, useEffect } from "react";
import { Trophy, Star, ShieldCheck } from "lucide-react";
import { cn } from "@/utils/cn";
import { createClient } from "@/utils/supabase";
import { useUser } from "@/components/UserContext";
import { SimpleLeaderboardSkeleton } from "@/components/Skeleton";

export default function LeadsLeaderboardPageManager() {
   const [leads, setLeads] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);
   const { userId } = useUser();
   const supabase = createClient();

   useEffect(() => {
      fetchLeads();
   }, []);

   const fetchLeads = async () => {
      setLoading(true);
      const { data } = await supabase
         .from('users_metadata')
         .select('*')
         .eq('role', 'project_lead')
         .order('score', { ascending: false });

      if (data) {
         setLeads(data.map((lead, index) => ({
            ...lead,
            rank: index + 1
         })));
      }
      setLoading(false);
   };

   if (loading) return <SimpleLeaderboardSkeleton />;

   return (
      <div className="space-y-6 pb-16">
         <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-accent" />
            <h2 className="text-xl font-bold">Project Lead Rankings</h2>
         </div>
         <p className="text-sm text-muted-foreground -mt-2">Track performance and output scores across all reporting project leads.</p>

         <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {leads.slice(0, 3).map((u, i) => (
               <div key={u.id} className={cn(
                  "bg-background border rounded-xl p-6 text-center shadow-sm relative overflow-hidden transition-all hover:shadow-md",
                  i === 0 ? "border-amber-400/50 hover:border-amber-400 bg-amber-400/5" : "border-secondary hover:border-accent/40"
               )}>
                  {i === 0 && <Star className="h-6 w-6 text-amber-500 absolute top-4 right-4" />}
                  <div className={cn(
                     "h-12 w-12 rounded-xl mx-auto flex items-center justify-center font-bold text-lg mb-3 shadow-sm",
                     i === 0 ? "bg-amber-400 text-white" : i === 1 ? "bg-foreground text-background" : "bg-amber-700/80 text-white"
                  )}>{u.full_name[0]}</div>
                  <p className="text-base font-bold truncate mb-1">{u.full_name}</p>
                  <p className="text-sm font-bold text-accent">{u.score.toLocaleString()} <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider pl-1">XP</span></p>
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mt-1">Rank #{i + 1}</p>
               </div>
            ))}
         </div>

         <div className="bg-background border border-secondary rounded-xl divide-y divide-secondary overflow-hidden shadow-sm">
            <div className="p-5 flex items-center justify-between bg-secondary/10">
               <h3 className="text-sm font-bold flex items-center gap-2"><Trophy className="h-4 w-4 text-accent" /> All Lead Rankings</h3>
            </div>
            {leads.length === 0 ? (
               <div className="p-12 text-center text-sm font-medium text-muted-foreground">No personnel detected in database.</div>
            ) : leads.map(user => (
               <div key={user.id} className="flex items-center justify-between p-5 hover:bg-secondary/10 transition-colors group">
                  <div className="flex items-center gap-5">
                     <span className="text-xs font-bold text-muted-foreground/40 w-6 text-center">{user.rank}</span>
                     <div className={cn(
                        "h-10 w-10 rounded-xl flex items-center justify-center font-bold text-sm border transition-all shadow-sm",
                        user.rank <= 3 ? "bg-foreground text-background border-foreground text-white" : "bg-secondary/50 border-secondary group-hover:bg-foreground group-hover:text-background group-hover:border-foreground"
                     )}>{user.full_name[0]}</div>
                     <div>
                        <p className="text-sm font-bold group-hover:text-accent transition-colors">{user.full_name}</p>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-0.5">{user.unit || "Operations"} Unit</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-4">
                     <span className="text-sm font-bold w-24 text-right pr-2">{user.score.toLocaleString()} <span className="text-[11px] text-muted-foreground uppercase tracking-wider pl-1 font-bold">XP</span></span>
                  </div>
               </div>
            ))}
         </div>
      </div>
   );
}
