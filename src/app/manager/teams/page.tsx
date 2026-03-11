"use client"

import { useState, useEffect } from "react";
import {
   Users,
   Search,
   Filter,
   MoreVertical,
   Zap,
   Mail,
   CheckCircle2,
   AlertCircle,
   Loader2,
   TrendingUp,
   X,
   Shield
} from "lucide-react";
import { cn } from "@/utils/cn";
import { createClient } from "@/utils/supabase";

const PROMOTABLE_ROLES = ['employee', 'project_lead', 'manager'];

export default function ManagerTeamsPage() {
   const [employees, setEmployees] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);
   const [search, setSearch] = useState("");
   const [updating, setUpdating] = useState<string | null>(null);
   const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
   const supabase = createClient();

   useEffect(() => {
      fetchEmployees();
   }, []);

   const fetchEmployees = async () => {
      setLoading(true);
      const { data, error } = await supabase
         .from('users_metadata')
         .select('*')
         .or('role.eq.employee,role.eq.project_lead') // Manager can see employees and project leads in their cluster
         .order('score', { ascending: false });

      if (error) {
         console.error("Error fetching employees:", error);
      } else {
         setEmployees(data || []);
      }
      setLoading(false);
   };

   const updateRole = async (userId: string, newRole: string) => {
      setUpdating(userId);
      const { error } = await supabase
         .from('users_metadata')
         .update({ role: newRole })
         .eq('id', userId);

      if (error) {
         setMessage({ type: 'error', text: "Promotion Failed: " + error.message });
      } else {
         setEmployees(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
         setMessage({ type: 'success', text: "Personnel authority recalibrated." });
         setTimeout(() => setMessage(null), 3000);
      }
      setUpdating(null);
   };

   const filtered = employees.filter(e =>
      e.full_name.toLowerCase().includes(search.toLowerCase()) ||
      (e.department || "").toLowerCase().includes(search.toLowerCase())
   );

   if (loading) return (
      <div className="flex h-[60vh] items-center justify-center">
         <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
   );

   return (
      <div className="space-y-6 pb-16">
         <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
               <Users className="h-5 w-5 text-accent" />
               <h2 className="text-xl font-bold uppercase tracking-tight">Personnel Directory</h2>
            </div>
            <button className="flex items-center gap-2 px-6 py-2.5 bg-foreground text-background rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-accent hover:text-white transition-all shadow-lg active:scale-95">
               <Zap className="h-4 w-4" /> Export Personnel Data
            </button>
         </div>

         {message && (
            <div className={cn(
               "p-4 rounded-xl border flex items-center justify-between animate-in fade-in slide-in-from-top-2",
               message.type === 'success' ? "bg-green-500/10 border-green-500/20 text-green-500" : "bg-red-500/10 border-red-500/20 text-red-500"
            )}>
               <div className="flex items-center gap-2 font-black text-[10px] uppercase tracking-widest">
                  {message.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                  {message.text}
               </div>
               <button onClick={() => setMessage(null)}><X className="h-4 w-4" /></button>
            </div>
         )}

         <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-background border border-secondary rounded-xl p-5 shadow-sm">
               <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Total Nodes</p>
               <p className="text-2xl font-black">{employees.length}</p>
            </div>
            <div className="bg-background border border-secondary rounded-xl p-5 shadow-sm">
               <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Cluster Authority</p>
               <p className="text-2xl font-black text-green-500 uppercase">Active</p>
            </div>
            <div className="bg-background border border-secondary rounded-xl p-5 shadow-sm">
               <div className="flex items-center gap-1.5 mb-1"><TrendingUp className="h-3.5 w-3.5 text-accent" /><p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Aggregate Score</p></div>
               <p className="text-2xl font-black tracking-tight">{employees.reduce((s, e) => s + (e.score || 0), 0).toLocaleString()} <span className="text-[10px] opacity-40">PTS</span></p>
            </div>
         </div>

         <div className="bg-background border border-secondary rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-secondary flex items-center justify-between bg-secondary/5">
               <div className="flex items-center gap-3 bg-background border border-secondary rounded-lg px-4 py-2 shadow-inner">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <input value={search} onChange={e => setSearch(e.target.value)} type="text" placeholder="FILTER PERSONNEL..." className="bg-transparent text-[10px] font-black uppercase outline-none w-48 placeholder:text-muted-foreground/30 tracking-widest" />
               </div>
               <button className="flex items-center gap-2 px-4 py-2 border border-secondary rounded-lg text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:bg-foreground hover:text-background transition-all shadow-sm">
                  <Filter className="h-3.5 w-3.5" /> Filter Matrix
               </button>
            </div>
            <table className="w-full text-left">
               <thead className="bg-secondary/10 border-b border-secondary">
                  <tr>
                     <th className="px-6 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">Identity Node</th>
                     <th className="px-6 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">Functional Authority</th>
                     <th className="px-6 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground text-right">Performance Score</th>
                     <th className="px-6 py-4" />
                  </tr>
               </thead>
               <tbody className="divide-y divide-secondary">
                  {filtered.length === 0 ? (
                     <tr><td colSpan={4} className="p-12 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-30">No matching personnel nodes recorded</td></tr>
                  ) : filtered.map(emp => (
                     <tr key={emp.id} className="hover:bg-accent/5 transition-all group">
                        <td className="px-6 py-5">
                           <div className="flex items-center gap-4">
                              <div className="h-10 w-10 rounded-xl bg-secondary border border-secondary flex items-center justify-center font-black text-xs group-hover:bg-foreground group-hover:text-background transition-all shadow-sm">
                                 {emp.full_name[0]}
                              </div>
                              <div>
                                 <p className="text-sm font-black uppercase tracking-tight">{emp.full_name}</p>
                                 <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5 opacity-60">ID: {emp.id.slice(0, 8)}</p>
                              </div>
                           </div>
                        </td>
                        <td className="px-6 py-5">
                           <select 
                              value={emp.role} 
                              onChange={e => updateRole(emp.id, e.target.value)}
                              disabled={updating === emp.id}
                              className="bg-secondary/30 border border-secondary rounded-lg px-3 py-1.5 text-[9px] font-black uppercase tracking-widest outline-none focus:border-accent/40 transition-all appearance-none pr-8 cursor-pointer disabled:opacity-50 shadow-inner"
                           >
                              {PROMOTABLE_ROLES.map(r => (
                                 <option key={r} value={r}>{r.replace('_', ' ')} Authority</option>
                              ))}
                           </select>
                        </td>
                        <td className="px-6 py-5 text-right">
                           <span className="text-base font-black tracking-tighter text-accent">{emp.score?.toLocaleString()}</span>
                        </td>
                        <td className="px-6 py-5 text-right">
                           <div className="flex items-center justify-end gap-2">
                               {updating === emp.id ? (
                                   <Loader2 className="h-5 w-5 animate-spin text-accent" />
                               ) : (
                                   <button className="h-8 w-8 rounded-lg hover:bg-foreground hover:text-background flex items-center justify-center text-muted-foreground transition-all">
                                       <MoreVertical className="h-4 w-4" />
                                   </button>
                               )}
                           </div>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
   );
}
