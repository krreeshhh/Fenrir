"use client"

import { useState, useEffect } from "react";
import { Trophy, Star } from "lucide-react";
import { cn } from "@/utils/cn";
import { createClient } from "@/utils/supabase";
import { SimpleLeaderboardSkeleton } from "@/components/Skeleton";

export default function EmpLeaderboardPagePL() {
   const [employees, setEmployees] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);
   const supabase = createClient();

   useEffect(() => {
      fetchEmployees();
   }, []);

   const fetchEmployees = async () => {
      setLoading(true);
      const { data } = await supabase
         .from('users_metadata')
         .select('*')
         .eq('role', 'employee')
         .order('score', { ascending: false });

      if (data) {
         setEmployees(data.map((emp, index) => ({
            ...emp,
            rank: index + 1
         })));
      }
      setLoading(false);
   };

   if (loading) return <SimpleLeaderboardSkeleton />;

   return (
      <div className="space-y-6 pb-16">
         <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-accent" />
            <h2 className="text-xl font-bold">Team Performance Index</h2>
         </div>
         <p className="text-sm text-muted-foreground -mt-2">Track employee growth and score output across the organization.</p>

         <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {employees.slice(0, 3).map((u, i) => (
               <div key={u.id} className={cn(
                  "bg-background border rounded-lg p-4 text-center shadow-sm relative overflow-hidden", 
                  i === 0 ? "border-amber-400/50 bg-amber-400/5" : "border-secondary"
               )}>
                  {i === 0 && <Star className="h-4 w-4 text-amber-500 absolute top-2 right-2" />}
                  <div className={cn("h-10 w-10 rounded-lg mx-auto flex items-center justify-center font-black text-sm mb-2",
                     i === 0 ? "bg-amber-400 text-white shadow-lg" : i === 1 ? "bg-foreground text-background" : "bg-primary/10 text-primary"
                  )}>{u.full_name[0]}</div>
                  <p className="text-sm font-bold truncate">{u.full_name}</p>
                  <p className="text-xs font-black text-accent">{u.score.toLocaleString()}</p>
               </div>
            ))}
         </div>

         <div className="bg-background border border-secondary rounded-lg divide-y divide-secondary overflow-hidden">
            <div className="p-4 bg-secondary/10">
               <h3 className="text-sm font-bold flex items-center gap-2"><Star className="h-4 w-4 text-accent" /> Full Rankings</h3>
            </div>
            {employees.map(user => (
               <div key={user.id} className="flex items-center justify-between p-4 hover:bg-secondary/10 transition-colors group">
                  <div className="flex items-center gap-4">
                     <span className="text-sm font-black text-muted-foreground/30 w-6">{user.rank}</span>
                     <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center font-black text-sm border-2 transition-all",
                        user.rank <= 3 ? "bg-foreground text-background border-foreground text-white" : "bg-secondary border-secondary group-hover:bg-foreground group-hover:text-background"
                     )}>{user.full_name[0]}</div>
                     <div>
                        <p className="text-sm font-bold group-hover:text-accent transition-colors">{user.full_name}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{user.department || "Engineering"}</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-4">
                     <span className="text-sm font-black w-24 text-right pr-2">{user.score.toLocaleString()} pts</span>
                  </div>
               </div>
            ))}
         </div>
      </div>
   );
}
