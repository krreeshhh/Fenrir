"use client"

import { useState, useEffect } from "react";
import {
   Users,
   Search,
   Shield,
   Save,
   Loader2,
   MoreVertical,
   CheckCircle2,
   AlertCircle,
   X,
   Filter
} from "lucide-react";
import { cn } from "@/utils/cn";
import { createClient } from "@/utils/supabase";
import { ListSkeleton } from "@/components/Skeleton";

const ROLES = ['employee', 'project_lead', 'manager', 'unit_head', 'admin'];

export default function UserGovernancePage() {
   const [users, setUsers] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);
   const [searchTerm, setSearchTerm] = useState("");
   const [updating, setUpdating] = useState<string | null>(null);
   const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
   const [showAdmins, setShowAdmins] = useState(true);
   const [currentAdminId, setCurrentAdminId] = useState<string | null>(null);
   const supabase = createClient();

   useEffect(() => {
      fetchUsers();
      const getAdmin = async () => {
         const { data: { user } } = await supabase.auth.getUser();
         if (user) setCurrentAdminId(user.id);
      };
      getAdmin();
   }, []);

   const fetchUsers = async () => {
      setLoading(true);
      const { data, error } = await supabase
         .from('users_metadata')
         .select('*')
         .order('full_name');

      if (data) setUsers(data);
      setLoading(false);
   };

   const updateRole = async (userId: string, newRole: string) => {
      if (userId === currentAdminId && newRole !== 'admin') {
          if (!confirm("You are about to remove your own administrative authority. You will lose access to this dashboard immediately. Continue?")) {
              return;
          }
      }

      setUpdating(userId);
      const { error } = await supabase
         .from('users_metadata')
         .update({ role: newRole })
         .eq('id', userId);

      if (error) {
         setMessage({ type: 'error', text: "Failed to recalibrate authority: " + error.message });
      } else {
         setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
         setMessage({ type: 'success', text: "System node authority recalibrated successfully." });
         setTimeout(() => setMessage(null), 3000);
         
         if (userId === currentAdminId && newRole !== 'admin') {
             window.location.href = '/'; // Kick out if self-demoted
         }
      }
      setUpdating(null);
   };

   const filtered = users.filter(u => {
      const matchesSearch = u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            u.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesAdminFilter = showAdmins || u.role !== 'admin';
      return matchesSearch && matchesAdminFilter;
   });

   if (loading) return <ListSkeleton />;

   return (
      <div className="space-y-6 pb-16">
         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
               <Shield className="h-5 w-5 text-accent" />
               <h2 className="text-xl font-bold uppercase tracking-tight">Governance Registry</h2>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <button 
                  onClick={() => setShowAdmins(!showAdmins)}
                  className={cn(
                      "flex items-center justify-center gap-2 px-4 py-2 border rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all shadow-sm",
                      showAdmins ? "bg-accent text-white border-accent" : "bg-background border-secondary text-muted-foreground hover:border-accent/40"
                  )}
                >
                    <Filter className="h-3.5 w-3.5" /> {showAdmins ? "Showing All Nodes" : "Hiding Admin Nodes"}
                </button>
                <div className="flex items-center gap-3 bg-background border border-secondary rounded-lg px-4 py-2 shadow-inner">
                   <Search className="h-4 w-4 text-muted-foreground" />
                   <input 
                      value={searchTerm} 
                      onChange={e => setSearchTerm(e.target.value)} 
                      type="text" 
                      placeholder="SEARCH SYSTEM NODES..." 
                      className="bg-transparent text-xs font-bold uppercase outline-none w-full sm:w-48 placeholder:text-muted-foreground/30 tracking-wider" 
                   />
                </div>
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

         <div className="bg-background border border-secondary rounded-xl overflow-hidden shadow-sm overflow-x-auto">
            <table className="w-full text-left min-w-[600px]">
               <thead className="bg-secondary/10 border-b border-secondary">
                  <tr>
                     <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">User Identity Node</th>
                     <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Authority Protocol</th>
                     <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-right">Action Override</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-secondary">
                  {filtered.map(user => (
                     <tr key={user.id} className="hover:bg-accent/5 transition-all group">
                        <td className="px-6 py-5">
                           <div className="flex items-center gap-4">
                              <div className="h-10 w-10 rounded-xl bg-secondary border border-secondary flex items-center justify-center font-bold text-xs group-hover:bg-foreground group-hover:text-background transition-all shadow-sm">
                                 {user.full_name[0]}
                              </div>
                              <div>
                                 <p className="text-sm font-bold uppercase tracking-tight">{user.full_name} {user.id === currentAdminId && <span className="ml-2 text-[10px] px-1.5 py-0.5 bg-accent text-white rounded">(YOU)</span>}</p>
                                 <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5 opacity-60">{user.email}</p>
                              </div>
                           </div>
                        </td>
                        <td className="px-6 py-5">
                           <div className="flex items-center gap-3">
                              <select 
                                 value={user.role} 
                                 onChange={e => updateRole(user.id, e.target.value)}
                                 disabled={updating === user.id}
                                 className="bg-secondary/30 border border-secondary rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wider outline-none focus:border-accent/40 transition-all appearance-none pr-8 cursor-pointer disabled:opacity-50 shadow-inner"
                              >
                                 {ROLES.map(r => (
                                    <option key={r} value={r}>{r.replace('_', ' ')}</option>
                                 ))}
                              </select>
                           </div>
                        </td>
                        <td className="px-6 py-5 text-right">
                           <div className="flex items-center justify-end gap-2">
                              {updating === user.id ? (
                                 <Loader2 className="h-5 w-5 animate-spin text-accent" />
                              ) : (
                                 <div className="h-8 w-8 rounded-lg bg-secondary/50 flex items-center justify-center hover:bg-foreground hover:text-background transition-all shadow-sm cursor-pointer group-hover:scale-110">
                                    <MoreVertical className="h-4 w-4" />
                                 </div>
                              )}
                           </div>
                        </td>
                     </tr>
                  ))}
                  {filtered.length === 0 && (
                     <tr><td colSpan={3} className="p-16 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground opacity-30">No matching system nodes recorded</td></tr>
                  )}
               </tbody>
            </table>
         </div>
      </div>
   );
}
