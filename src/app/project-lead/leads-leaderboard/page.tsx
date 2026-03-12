"use client"

import { useState, useEffect } from "react";
import { Trophy, ShieldCheck } from "lucide-react";
import { cn } from "@/utils/cn";
import { createClient } from "@/utils/supabase";
import { useUser } from "@/components/UserContext";
import { SimpleLeaderboardSkeleton } from "@/components/Skeleton";

export default function LeadsLeaderboardPagePL() {
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
            <h2 className="text-xl font-bold">Lead Rankings</h2>
         </div>
         <p className="text-sm text-muted-foreground -mt-2">See how you rank among other project leads across the organization.</p>

         <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {leads.slice(0, 3).map((u, i) => (
               <div key={u.id} className={cn(
                  "bg-background border rounded-lg p-4 text-center shadow-sm relative overflow-hidden",
                  u.id === userId ? "border-accent/40 bg-accent/5 ring-1 ring-accent/20" : "border-secondary"
               )}>
                  {i === 0 && <div className="absolute top-0 right-0 p-2"><Trophy className="h-4 w-4 text-yellow-500" /></div>}
                  <div className={cn("h-10 w-10 rounded-lg mx-auto flex items-center justify-center font-black text-sm mb-2",
                     i === 0 ? "bg-accent text-white" : i === 1 ? "bg-foreground text-background" : "bg-secondary border-2 border-foreground"
                  )}>{u.full_name[0]}</div>
                  <p className="text-sm font-bold truncate">{u.full_name}</p>
                  <p className="text-xs font-black text-accent">{u.score.toLocaleString()}</p>
               </div>
            ))}
         </div>

         <div className="bg-background border border-secondary rounded-lg divide-y divide-secondary overflow-hidden">
            <div className="p-4 bg-secondary/10">
               <h3 className="text-sm font-bold flex items-center gap-2"><Trophy className="h-4 w-4 text-accent" /> All Lead Rankings</h3>
            </div>
            {leads.map(user => (
               <div key={user.id} className={cn(
                  "flex items-center justify-between p-4 hover:bg-secondary/10 transition-colors group", 
                  user.id === userId && "bg-accent/5 border-l-2 border-l-accent"
               )}>
                  <div className="flex items-center gap-4">
                     <span className="text-sm font-black text-muted-foreground/30 w-6">{user.rank}</span>
                     <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center font-black text-sm border-2 transition-all",
                        user.rank === 1 ? "bg-accent text-white border-accent" : "bg-secondary border-secondary group-hover:bg-foreground group-hover:text-background"
                     )}>{user.full_name[0]}</div>
                     <div>
                        <p className="text-sm font-bold group-hover:text-accent transition-colors">{user.full_name}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{user.unit || "Operations"} Unit</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-4">
                     <span className="text-sm font-black w-24 text-right pr-2">{user.score.toLocaleString()} points</span>
                  </div>
               </div>
            ))}
         </div>
      </div>
   );
}
