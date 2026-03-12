"use client"

import { useState, useEffect } from "react";
import { 
   Users, 
   Search, 
   MoreVertical, 
   ShieldCheck, 
   Activity, 
   ArrowUpRight, 
   UserPlus, 
   Loader2, 
   Zap, 
   TrendingUp,
   CheckCircle2,
   AlertCircle,
   X,
   Shield
} from "lucide-react";
import { cn } from "@/utils/cn";
import { createClient } from "@/utils/supabase";

const MANAGEABLE_ROLES = ['employee', 'project_lead', 'manager', 'unit_head'];

export default function UnitHeadEmployeesPage() {
   const [employees, setEmployees] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);
   const [searchTerm, setSearchTerm] = useState("");
   const [updating, setUpdating] = useState<string | null>(null);
   const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
   const supabase = createClient();

   useEffect(() => { fetchEmployees(); }, []);

   const fetchEmployees = async () => {
      setLoading(true);
      const { data: users, error } = await supabase
         .from('users_metadata')
         .select(`
            *, 
            checklist_allocations (
               status, 
               checklists (
                  projects (name)
               )
            )
         `)
         .order('score', { ascending: false });

      if (error) {
         console.error("Error fetching personnel:", error);
      } else if (users) {
         const formatted = users.map((u, index) => {
            const ongoingCount = u.checklist_allocations?.filter((a: any) => a.status === 'ongoing').length || 0;
            const total = u.checklist_allocations?.length || 1;
            const load = Math.min(100, Math.round((ongoingCount / total) * 100) + 20);
            return {
               id: u.id,
               name: u.full_name,
               email: u.email,
               role: u.role || 'Personnel',
               project: u.checklist_allocations?.[0]?.checklists?.projects?.name || "Unassigned Cluster",
               status: 'Active',
               load,
               score: u.score || 0,
               rank: index + 1
            };
         });
         setEmployees(formatted);
      }
      setLoading(false);
   };

   const updatePersonnelRole = async (userId: string, newRole: string) => {
      setUpdating(userId);
      const { error } = await supabase
         .from('users_metadata')
         .update({ role: newRole })
         .eq('id', userId);

      if (error) {
         setMessage({ type: 'error', text: "Authorization Override Failed: " + error.message });
      } else {
         setEmployees(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
         setMessage({ type: 'success', text: "Personnel authority recalibrated successfully." });
         setTimeout(() => setMessage(null), 3000);
      }
      setUpdating(null);
   };

   const filtered = employees.filter(e =>
      e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.email?.toLowerCase().includes(searchTerm.toLowerCase())
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
               <h2 className="text-xl font-bold uppercase tracking-tight">Personnel Network Hub</h2>
            </div>
            <button className="flex items-center gap-2 px-6 py-2.5 bg-foreground text-background rounded-lg font-bold text-xs uppercase tracking-wider hover:bg-accent hover:text-white transition-all shadow-lg active:scale-95">
               <Zap className="h-4 w-4" /> Authorize Personnel
            </button>
         </div>

         {message && (
            <div className={cn(
               "p-4 rounded-xl border flex items-center justify-between animate-in fade-in slide-in-from-top-2",
               message.type === 'success' ? "bg-green-500/10 border-green-500/20 text-green-500" : "bg-red-500/10 border-red-500/20 text-red-500"
            )}>
               <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider">
                  {message.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                  {message.text}
               </div>
               <button onClick={() => setMessage(null)}><X className="h-4 w-4" /></button>
            </div>
         )}

         {/* Sector Metrics */}
         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-background border border-accent/40 rounded-xl p-5 shadow-sm transition-all hover:scale-[1.02]">
               <div className="flex items-center gap-2 mb-2"><Users className="h-3.5 w-3.5 text-accent" /><p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Active Nodes</p></div>
               <p className="text-2xl font-bold tracking-tighter">{employees.length}</p>
            </div>
            <div className="bg-background border border-secondary rounded-xl p-5 shadow-sm transition-all hover:scale-[1.02]">
               <div className="flex items-center gap-2 mb-2"><Activity className="h-3.5 w-3.5 text-muted-foreground" /><p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Network Load</p></div>
               <p className="text-2xl font-bold tracking-tighter">74%</p>
            </div>
            <div className="grid grid-cols-1 gap-1">
                <div className="bg-background border border-secondary rounded-xl p-5 shadow-sm transition-all hover:scale-[1.02]">
                <div className="flex items-center gap-1.5 mb-2"><TrendingUp className="h-3.5 w-3.5 text-accent" /><p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Efficiency</p></div>
                <p className="text-2xl font-bold tracking-tighter">9.2</p>
                </div>
            </div>
            <div className="bg-background border border-secondary rounded-xl p-5 shadow-sm transition-all hover:scale-[1.02]">
               <div className="flex items-center gap-2 mb-2"><ShieldCheck className="h-3.5 w-3.5 text-green-500" /><p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">System Sync</p></div>
               <p className="text-2xl font-bold text-green-500 uppercase tracking-tighter">SECURED</p>
            </div>
         </div>

         <div className="bg-background border border-secondary rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-secondary flex items-center justify-between bg-secondary/5">
               <div className="flex items-center gap-3 bg-background border border-secondary rounded-lg px-4 py-2 shadow-inner">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} type="text" placeholder="FILTER PERSONNEL NODE..." className="bg-transparent text-xs font-bold uppercase outline-none w-48 placeholder:text-muted-foreground/30 tracking-wider" />
               </div>
               <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{filtered.length} nodes connected</span>
            </div>
            <table className="w-full text-left">
               <thead className="bg-secondary/10 border-b border-secondary">
                  <tr>
                     <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Identity</th>
                     <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Functional Authority</th>
                     <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground hidden md:table-cell">Operational Cluster</th>
                     <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-right">Performance Score</th>
                     <th className="px-6 py-4" />
                  </tr>
               </thead>
               <tbody className="divide-y divide-secondary">
                  {filtered.length === 0 ? (
                     <tr><td colSpan={5} className="p-16 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground opacity-30">No matching personnel nodes recorded in system</td></tr>
                  ) : filtered.map(emp => (
                     <tr key={emp.id} className="hover:bg-accent/5 transition-all group">
                        <td className="px-6 py-5">
                           <div className="flex items-center gap-4">
                              <span className="text-xs font-bold text-muted-foreground/30 w-4">{emp.rank}</span>
                              <div className="h-10 w-10 rounded-xl bg-secondary border border-secondary flex items-center justify-center font-bold text-xs group-hover:bg-foreground group-hover:text-background transition-all shadow-sm">
                                 {emp.name[0]}
                              </div>
                              <div>
                                 <p className="text-sm font-bold uppercase tracking-tight">{emp.name}</p>
                                 <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5 opacity-60">NODE: PVT-ID-{emp.id.slice(0, 4).toUpperCase()}</p>
                              </div>
                           </div>
                        </td>
                        <td className="px-6 py-5">
                           {emp.role === 'admin' ? (
                               <div className="flex items-center gap-2 px-3 py-1.5 bg-accent/10 border border-accent/20 rounded-lg w-fit">
                                    <Shield className="h-3 w-3 text-accent" />
                                    <span className="text-[11px] font-bold text-accent uppercase tracking-wider">SYSTEM ADMIN</span>
                               </div>
                           ) : (
                               <select 
                                 value={emp.role} 
                                 onChange={e => updatePersonnelRole(emp.id, e.target.value)}
                                 disabled={updating === emp.id}
                                 className="bg-secondary/30 border border-secondary rounded-lg px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider outline-none focus:border-accent/40 transition-all appearance-none pr-8 cursor-pointer disabled:opacity-50 shadow-inner"
                              >
                                 {MANAGEABLE_ROLES.map(r => (
                                    <option key={r} value={r}>{r.replace('_', ' ')} Authority</option>
                                 ))}
                              </select>
                           )}
                        </td>
                        <td className="px-6 py-5 hidden md:table-cell">
                           <div className="space-y-2">
                              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1 truncate max-w-[140px]">{emp.project}</p>
                              <div className="h-1.5 w-full max-w-[120px] bg-secondary rounded-full overflow-hidden border border-secondary shadow-inner">
                                 <div className="h-full bg-foreground rounded-full transition-all duration-1000" style={{ width: `${emp.load}%` }} />
                              </div>
                           </div>
                        </td>
                        <td className="px-6 py-5 text-right">
                           <span className="text-base font-bold tracking-tighter text-accent">{emp.score?.toLocaleString()}</span>
                           <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider opacity-40">SYSTEM POINTS</p>
                        </td>
                        <td className="px-6 py-5 text-right">
                           <div className="flex items-center justify-end gap-2">
                               {updating === emp.id ? (
                                   <Loader2 className="h-5 w-5 animate-spin text-accent" />
                               ) : (
                                   <button className="h-8 w-8 rounded-lg hover:bg-foreground hover:text-background flex items-center justify-center text-muted-foreground transition-all shadow-sm">
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
