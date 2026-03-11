"use client"

import { useState, useEffect } from "react";
import {
   Users,
   Target,
   Briefcase,
   Plus,
   Search,
   CheckCircle2,
   AlertCircle,
   ArrowUpRight,
   ShieldCheck,
   Building,
   X,
   Globe,
   Loader2
} from "lucide-react";
import { cn } from "@/utils/cn";
import { createClient } from "@/utils/supabase";
import { useUser } from "@/components/UserContext";

export default function ProjectAllocationPage() {
   const [isCreating, setIsCreating] = useState(false);
   const [search, setSearch] = useState("");
   const [projects, setProjects] = useState<any[]>([]);
   const [leads, setLeads] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);
   const [formData, setFormData] = useState({ name: '', leadId: '', budget: '' });
   const { userId } = useUser();
   const supabase = createClient();

   useEffect(() => {
      if (userId) fetchData();
   }, [userId]);

   const fetchData = async () => {
      setLoading(true);
      
      // 1. Fetch projects managed by this manager
      const { data: projData } = await supabase
         .from('projects')
         .select('*')
         .eq('manager_id', userId);
      setProjects(projData || []);

      // 2. Fetch all leads for the assignment dropdown
      const { data: leadData } = await supabase
         .from('users_metadata')
         .select('id, full_name')
         .eq('role', 'project_lead');
      setLeads(leadData || []);

      setLoading(false);
   };

   const filtered = projects.filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase())
   );

   const handleCreate = async () => {
      if (!formData.name || !formData.leadId) return;
      setLoading(true);

      // 1. Insert into projects table
      const { data: newProj, error: projError } = await supabase
         .from('projects')
         .insert({
            name: formData.name,
            manager_id: userId,
            status: 'Active',
            completion_percentage: 0
         })
         .select()
         .single();

      if (newProj) {
         // 2. Assign the lead
         await supabase
            .from('project_allocations')
            .insert({
               project_id: newProj.id,
               project_lead_id: formData.leadId
            });

         setIsCreating(false);
         setFormData({ name: '', leadId: '', budget: '' });
         fetchData();
      }
      setLoading(false);
   };

   if (loading && projects.length === 0) return (
      <div className="flex h-[60vh] items-center justify-center">
         <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
   );

   return (
      <div className="space-y-6 pb-16">
         <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
               <Briefcase className="h-5 w-5 text-accent" />
               <h2 className="text-xl font-bold">Project Orchestration</h2>
            </div>
            <button
               onClick={() => setIsCreating(true)}
               className="flex items-center gap-2 px-4 py-2.5 bg-foreground text-background rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-accent transition-all shadow-lg active:scale-95"
            >
               <Plus className="h-4 w-4" /> New Project
            </button>
         </div>

         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <QuickStat label="Managed Clusters" value={projects.length} icon={Target} accent />
            <QuickStat label="Personnel" value={24} icon={Users} />
            <QuickStat label="Asset Value" value="$420k" icon={Globe} />
            <QuickStat label="Unit Status" value="SECURE" icon={CheckCircle2} green />
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3 space-y-4">
               <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black uppercase tracking-widest">Active Portfolio</h3>
                  <div className="flex items-center gap-2 bg-background border border-secondary rounded-lg px-3 py-2 shadow-inner">
                     <Search className="h-4 w-4 text-muted-foreground" />
                     <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        type="text"
                        placeholder="FILTER NODES..."
                        className="bg-transparent border-none outline-none text-xs font-black w-40 placeholder:text-muted-foreground/30 uppercase tracking-widest"
                     />
                  </div>
               </div>

               <div className="bg-background border border-secondary rounded-xl divide-y divide-secondary overflow-hidden shadow-sm">
                  {filtered.length === 0 ? (
                     <div className="p-12 text-center text-muted-foreground uppercase text-[10px] font-black tracking-widest opacity-40">No active project nodes</div>
                  ) : filtered.map(p => (
                     <div key={p.id} className="p-5 hover:bg-secondary/10 transition-colors group">
                        <div className="flex items-center justify-between mb-4">
                           <div className="flex items-center gap-3">
                              <h4 className="text-sm font-black uppercase tracking-tight group-hover:text-accent transition-colors">{p.name}</h4>
                              <span className={cn(
                                 "text-[8px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded border shadow-sm",
                                 p.status === 'Alert' ? "text-red-500 border-red-500/20 bg-red-500/5" : "text-green-500 border-green-500/20 bg-green-500/5"
                              )}>{p.status}</span>
                           </div>
                           <div className="flex items-center gap-3">
                              <button className="h-8 w-8 rounded-lg bg-secondary/50 flex items-center justify-center group-hover:bg-accent group-hover:text-white transition-all shadow-sm">
                                 <ArrowUpRight className="h-4 w-4" />
                              </button>
                           </div>
                        </div>
                        <div className="space-y-2">
                           <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                              <span>System Completion</span>
                              <span className="text-accent">{p.completion_percentage}%</span>
                           </div>
                           <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden border border-secondary shadow-inner">
                              <div
                                 className={cn("h-full rounded-full transition-all duration-1000", p.status === 'Alert' ? "bg-red-500" : "bg-foreground")}
                                 style={{ width: `${p.completion_percentage}%` }}
                              />
                           </div>
                        </div>
                     </div>
                  ))}
               </div>
            </div>

            <div className="space-y-6">
               <h3 className="text-sm font-black uppercase tracking-widest">Unit Health</h3>
               <div className="bg-foreground text-background rounded-xl p-8 text-center shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-150 transition-transform duration-700">
                     <ShieldCheck className="h-20 w-20" />
                  </div>
                  <Target className="h-10 w-10 text-accent mx-auto mb-4" />
                  <h5 className="font-black text-xs uppercase tracking-[0.2em]">Efficiency Index</h5>
                  <p className="text-4xl font-black mt-3 text-white tracking-tighter">94.2%</p>
                  <p className="text-[9px] font-bold opacity-60 mt-4 uppercase tracking-widest leading-relaxed">System performance is optimized. All nodes operating within standard parameters.</p>
                  <button className="mt-8 w-full py-3 bg-accent text-white rounded-lg font-black text-[10px] uppercase tracking-[0.3em] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-accent/40">
                     SYNC REPORT
                  </button>
               </div>
            </div>
         </div>

         {/* Create Project Modal */}
         {isCreating && (
            <div className="fixed inset-0 bg-background/80 backdrop-blur-xl z-[100] flex items-center justify-center p-6">
               <div className="bg-background w-full max-w-xl rounded-2xl border border-secondary p-10 shadow-3xl animate-in zoom-in-95 fade-in duration-300">
                  <div className="flex items-center justify-between mb-8">
                     <div>
                        <h3 className="text-lg font-black uppercase tracking-tight">Project Node Initialization</h3>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Commit a new cluster to the portfolio</p>
                     </div>
                     <button
                        onClick={() => setIsCreating(false)}
                        className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center hover:bg-muted transition-all active:scale-90"
                     >
                        <X className="h-5 w-5" />
                     </button>
                  </div>

                  <div className="space-y-6">
                     <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Project Identity</label>
                        <div className="flex items-center gap-3 px-4 py-4 bg-secondary/20 border border-secondary focus-within:border-accent/40 rounded-xl transition-all shadow-inner">
                           <Building className="h-4 w-4 text-muted-foreground" />
                           <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} type="text" placeholder="CLUSTER NAME..." className="bg-transparent border-none outline-none text-xs font-black w-full placeholder:text-muted-foreground/30 uppercase tracking-widest" />
                        </div>
                     </div>

                     <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Authorized project lead</label>
                        <div className="flex items-center gap-3 px-4 py-4 bg-secondary/20 border border-secondary focus-within:border-accent/40 rounded-xl transition-all shadow-inner">
                           <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                           <select 
                              value={formData.leadId} 
                              onChange={e => setFormData({...formData, leadId: e.target.value})}
                              className="bg-transparent border-none outline-none text-xs font-black w-full uppercase tracking-widest"
                           >
                              <option value="">SELECT COMMAND NODE...</option>
                              {leads.map(l => <option key={l.id} value={l.id}>{l.full_name}</option>)}
                           </select>
                        </div>
                     </div>
                  </div>

                  <button 
                     onClick={handleCreate}
                     disabled={loading || !formData.name || !formData.leadId}
                     className="mt-10 w-full py-4 bg-foreground text-background rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-accent hover:text-white transition-all flex items-center justify-center gap-3 shadow-2xl active:scale-95 disabled:opacity-50"
                  >
                     {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><CheckCircle2 className="h-5 w-5" /> Authorize Cluster</>}
                  </button>
               </div>
            </div>
         )}
      </div>
   );
}

function QuickStat({ label, value, icon: Icon, accent = false, green = false }: any) {
   return (
      <div className={cn(
         "bg-background border rounded-lg p-5 shadow-sm transition-all hover:scale-[1.02]",
         accent ? "border-accent/40 bg-accent/5 ring-1 ring-accent/10" : "border-secondary"
      )}>
         <div className="flex items-center gap-2 mb-2">
            <Icon className={cn("h-3.5 w-3.5", accent ? "text-accent" : green ? "text-green-500" : "text-muted-foreground")} />
            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{label}</p>
         </div>
         <p className={cn("text-xl font-black tracking-tight", green && "text-green-500")}>{value}</p>
      </div>
   );
}
