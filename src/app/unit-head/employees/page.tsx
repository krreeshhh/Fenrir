"use client"

import { useState, useEffect } from "react";
import {
   Users,
   Search,
   MoreVertical,
   ShieldCheck,
   Activity,
   ArrowUpRight,
   TrendingUp,
   CheckCircle2,
   AlertCircle,
   X,
   Shield,
   Lock,
   Loader2
} from "lucide-react";
import { cn } from "@/utils/cn";
import { createClient } from "@/utils/supabase";

const MANAGEABLE_ROLES = ['employee', 'project_lead', 'manager', 'unit_head'];

export default function UnitHeadEmployeesPage() {
   const [employees, setEmployees] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);
   const [searchTerm, setSearchTerm] = useState("");
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
               <h2 className="text-xl font-bold uppercase tracking-tight">Directory</h2>
            </div>
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

         <div className="bg-background border border-secondary rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-secondary flex items-center justify-between bg-secondary/5">
               <div className="flex items-center gap-3 bg-background border border-secondary rounded-lg px-4 py-2 shadow-inner">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} type="text" placeholder="FILTER PERSONNEL NODE..." className="bg-transparent text-xs font-bold uppercase outline-none w-48 placeholder:text-muted-foreground/30 tracking-wider" />
               </div>
            </div>
            <table className="w-full text-left">
               <thead className="bg-secondary/10 border-b border-secondary">
                  <tr>
                     <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Employees</th>
                     <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Authority</th>
                     <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground hidden md:table-cell">Project Completion</th>
                     <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-right">Performance Score</th>

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
                                 <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5 opacity-60">Empid:{emp.id.slice(0, 4).toUpperCase()}</p>
                              </div>
                           </div>
                        </td>
                        <td className="px-6 py-5">
                           <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary/40 border border-secondary rounded-lg w-fit">
                              {emp.role === 'admin' ? <Shield className="h-3 w-3 text-accent" /> : <ShieldCheck className="h-3 w-3 text-blue-500" />}
                              <span className="text-[11px] font-bold text-foreground uppercase tracking-wider">{emp.role?.replace('_', ' ')}</span>
                           </div>
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
                           <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider opacity-40"></p>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
   );
}
