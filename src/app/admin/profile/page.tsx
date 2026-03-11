"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/components/UserContext";
import {
   User, Mail, Briefcase, Lock, Calendar,
   Loader2, CheckCircle2, LogOut, Camera, Star, Shield,
   Save,
   ShieldCheck
} from "lucide-react";
import { createClient } from "@/utils/supabase";
import { cn } from "@/utils/cn";

export default function AdminProfilePage() {
   const router = useRouter();
   const supabase = createClient();
   const { fullName, firstName, lastName, email, role, score, userId, joinedDate, loading, refreshName } = useUser();

   const [initialized, setInitialized] = useState(false);
   const [editFirst, setEditFirst] = useState("");
   const [editLast, setEditLast] = useState("");
   const [saving, setSaving] = useState(false);
   const [saved, setSaved] = useState(false);
   const [saveError, setSaveError] = useState("");

   if (!loading && !initialized) {
      setEditFirst(firstName);
      setEditLast(lastName);
      setInitialized(true);
   }

   const handleSignOut = async () => { await supabase.auth.signOut(); router.push('/'); router.refresh(); };

   const handleSaveChanges = async () => {
      setSaving(true); setSaveError("");
      const newFullName = `${editFirst} ${editLast}`.trim();
      if (!newFullName) { setSaving(false); setSaveError("Name cannot be empty"); return; }
      const { error } = await supabase.from('users_metadata').update({ full_name: newFullName }).eq('id', userId);
      if (error) { setSaveError("Save failed: " + error.message); }
      else { refreshName(newFullName); setSaved(true); setTimeout(() => setSaved(false), 2500); }
      setSaving(false);
   };

   const initials = editFirst.slice(0, 1).toUpperCase() || email.slice(0, 1).toUpperCase() || "?";
   const fullDisplayName = `${editFirst} ${editLast}`.trim() || fullName || "Administrator";

   if (loading) return (
      <div className="flex h-[60vh] items-center justify-center">
         <div className="text-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-accent mx-auto" />
            <p className="text-muted-foreground font-black text-[10px] uppercase tracking-widest animate-pulse">Syncing Authority Profile...</p>
         </div>
      </div>
   );

   return (
      <div className="space-y-6 pb-16 max-w-5xl mx-auto">
         <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
               <Shield className="h-5 w-5 text-accent" />
               <h2 className="text-xl font-black uppercase tracking-tight">Authority Profile</h2>
            </div>
            <button onClick={handleSignOut} className="flex items-center gap-2 px-6 py-2.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-lg active:scale-95">
               <LogOut className="h-4 w-4" /> Exit Authority
            </button>
         </div>

         <div className="bg-background border border-secondary rounded-2xl overflow-hidden shadow-sm relative group">
            <div className="h-24 relative bg-secondary/10">
               <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-accent/20 to-transparent" />
               <Shield className="absolute top-4 right-6 h-12 w-12 text-accent/5 group-hover:scale-125 transition-transform duration-1000" />
            </div>
            <div className="px-8 pb-8 -mt-12 relative">
               <div className="flex items-end gap-6">
                  <div className="relative group">
                     <div className="h-24 w-24 rounded-2xl bg-foreground text-background font-black text-4xl flex items-center justify-center border-8 border-background shadow-2xl transition-all group-hover:bg-accent group-hover:text-white">
                        {initials}
                     </div>
                     <button className="absolute -bottom-1 -right-1 h-8 w-8 rounded-lg bg-accent text-white flex items-center justify-center shadow-lg transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all">
                        <Camera className="h-4 w-4" />
                     </button>
                  </div>
                  <div className="pb-2 space-y-1">
                     <h3 className="text-2xl font-black uppercase tracking-tight">{fullDisplayName}</h3>
                     <p className="text-[10px] font-black text-accent flex items-center gap-2 uppercase tracking-[0.2em] bg-accent/10 px-3 py-1 rounded-lg w-fit">
                        <Shield className="h-3 w-3" /> Root Authority Node
                     </p>
                  </div>
               </div>
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
               <div className="bg-background border border-secondary rounded-2xl p-8 shadow-sm">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-8 flex items-center gap-2"><User className="h-4 w-4 text-accent" /> Identity Parameters</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                     <ProfileField label="First Assignment" value={editFirst} onChange={setEditFirst} />
                     <ProfileField label="Last Assignment" value={editLast} onChange={setEditLast} />
                     <div className="sm:col-span-2"><ProfileField label="System Email" value={email} icon={Mail} disabled /></div>
                  </div>
                  <div className="mt-10 flex items-center gap-4 pt-6 border-t border-secondary">
                     <button onClick={handleSaveChanges} disabled={saving} className="px-8 py-3 bg-foreground text-background rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-accent hover:text-white transition-all flex items-center gap-3 shadow-xl active:scale-95 disabled:opacity-50">
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        {saving ? "UPDATING SYSTEM..." : "CONFIRM IDENTITY"}
                     </button>
                     {saved && <span className="flex items-center gap-2 text-green-500 text-[10px] font-black uppercase tracking-widest animate-in fade-in"><CheckCircle2 className="h-4 w-4" /> Parameters Synchronized</span>}
                  </div>
               </div>
            </div>

            <div className="space-y-6">
               <div className="bg-foreground text-background rounded-2xl p-8 space-y-6 shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-150 transition-transform duration-700">
                     <Lock className="h-20 w-20 text-accent" />
                  </div>
                  <div className="flex items-center gap-3"><Lock className="h-6 w-6 text-accent" /><h4 className="text-xs font-black uppercase tracking-widest">Authority Lock</h4></div>
                  <p className="text-[10px] font-bold opacity-60 leading-relaxed uppercase tracking-widest">Global override permissions enabled. Session secured by Root Access Protocol.</p>
                  <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.3em] text-green-400 bg-green-500/10 rounded-lg px-3 py-2 w-fit shadow-inner">
                     <ShieldCheck className="h-3 w-3" /> Root Access Secured
                  </div>
               </div>

               <div className="bg-background border border-secondary rounded-2xl p-8 space-y-4 shadow-sm">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">System Metadata</h4>
                  <div className="space-y-4 text-[10px] font-black uppercase tracking-[0.1em]">
                     <div className="flex justify-between border-b border-secondary/50 pb-2"><span className="text-muted-foreground">Authorized Since</span><span>{joinedDate}</span></div>
                     <div className="flex justify-between border-b border-secondary/50 pb-2"><span className="text-muted-foreground">Node Cluster</span><span>Central Admin</span></div>
                     <div className="flex justify-between"><span className="text-muted-foreground">Authority ID</span><span className="text-accent">{userId.slice(0, 12)}...</span></div>
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
}

function ProfileField({ label, value, onChange, icon: Icon, disabled = false }: any) {
   return (
      <div className="space-y-2">
         <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">{label}</label>
         <div className={cn(
            "flex items-center gap-3 px-4 py-4 bg-secondary/20 border rounded-xl transition-all shadow-inner",
            disabled ? "opacity-50 cursor-not-allowed border-secondary" : "border-secondary focus-within:border-accent/60 focus-within:bg-background"
         )}>
            {Icon && <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
            <input
               type="text"
               value={value}
               disabled={disabled}
               onChange={onChange ? (e: any) => onChange(e.target.value) : undefined}
               className="bg-transparent border-none outline-none flex-1 text-xs font-black w-full uppercase tracking-widest placeholder:text-muted-foreground/30"
            />
         </div>
      </div>
   );
}
