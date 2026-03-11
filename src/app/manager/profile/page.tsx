"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/components/UserContext";
import {
   User, Mail, Briefcase, Lock, Calendar,
   Loader2, CheckCircle2, LogOut, Camera, Star
} from "lucide-react";
import { createClient } from "@/utils/supabase";
import { cn } from "@/utils/cn";

export default function ManagerProfilePage() {
   const router = useRouter();
   const supabase = createClient();
   const { fullName, firstName, lastName, email, role, score, userId, joinedDate, loading, refreshName } = useUser();

   const [syncing, setSyncing] = useState(false);
   const [syncDone, setSyncDone] = useState(false);
   const [editFirst, setEditFirst] = useState("");
   const [editLast, setEditLast] = useState("");
   const [initialized, setInitialized] = useState(false);
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

   const handleCalendarSync = async () => {
      setSyncing(true); await new Promise(r => setTimeout(r, 1500));
      setSyncDone(true); setTimeout(() => setSyncDone(false), 3000); setSyncing(false);
   };

   const initials = editFirst.slice(0, 1).toUpperCase() || email.slice(0, 1).toUpperCase() || "?";
   const fullDisplayName = `${editFirst} ${editLast}`.trim() || fullName || "Manager";

   if (loading) return (
      
         <div className="flex h-[60vh] items-center justify-center">
            <div className="text-center space-y-3">
               <Loader2 className="h-8 w-8 animate-spin text-accent mx-auto" />
               <p className="text-muted-foreground font-bold text-sm animate-pulse">Loading profile...</p>
            </div>
         </div>
      
   );

   return (
      
         <div className="space-y-6 pb-16 max-w-5xl mx-auto">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-2"><User className="h-5 w-5 text-accent" /><h2 className="text-xl font-black tracking-tight">My Profile</h2></div>
               <button onClick={handleSignOut} className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-red-500/20 transition-all">
                  <LogOut className="h-4 w-4" /> Sign Out
               </button>
            </div>

            <div className="bg-background border border-secondary rounded-2xl overflow-hidden shadow-sm">
               <div className="h-16 relative"><div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-accent/10 to-transparent" /></div>
               <div className="px-6 pb-6 -mt-10 relative">
                  <div className="flex items-end gap-4">
                     <div className="relative group">
                        <div className="h-20 w-20 rounded-2xl bg-foreground text-background font-black text-3xl flex items-center justify-center border-4 border-background shadow-xl">{initials}</div>
                        <button className="absolute -bottom-1 -right-1 h-7 w-7 rounded-lg bg-accent text-white flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all"><Camera className="h-3.5 w-3.5" /></button>
                     </div>
                     <div className="pb-1 space-y-0.5">
                        <h3 className="text-xl font-black tracking-tight">{fullDisplayName}</h3>
                        <p className="text-xs font-bold text-muted-foreground flex items-center gap-1.5"><Briefcase className="h-3 w-3" />{role.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}</p>
                        <p className="text-[10px] text-muted-foreground/70 font-bold uppercase tracking-widest">Joined {joinedDate}</p>
                     </div>
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
               <div className="lg:col-span-2 space-y-5">
                  <div className="bg-background border border-secondary rounded-2xl p-6">
                     <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-5 flex items-center gap-2"><User className="h-4 w-4 text-accent" /> Personal Information</h3>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <ProfileField label="First Name" value={editFirst} onChange={setEditFirst} />
                        <ProfileField label="Last Name" value={editLast} onChange={setEditLast} />
                        <div className="sm:col-span-2"><ProfileField label="Email Address" value={email} icon={Mail} disabled /></div>
                        <div className="sm:col-span-2"><ProfileField label="Role" value={role.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())} disabled /></div>
                     </div>
                     <div className="mt-6 flex items-center gap-3 pt-4 border-t border-secondary">
                        <button onClick={handleSaveChanges} disabled={saving} className="px-6 py-2.5 bg-foreground text-background rounded-xl font-black text-xs uppercase tracking-widest hover:bg-accent transition-all flex items-center gap-2 disabled:opacity-50">
                           {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}{saving ? "Saving..." : "Save Changes"}
                        </button>
                        {saved && <span className="flex items-center gap-1.5 text-green-600 text-xs font-bold animate-in fade-in"><CheckCircle2 className="h-4 w-4" /> Saved to database!</span>}
                        {saveError && <span className="text-red-500 text-xs font-bold">{saveError}</span>}
                     </div>
                  </div>
                  <div className="bg-background border border-secondary rounded-2xl p-6">
                     <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-5 flex items-center gap-2"><Calendar className="h-4 w-4 text-accent" /> Integrations</h3>
                     <div className="flex items-center justify-between p-4 bg-secondary/30 border border-secondary rounded-xl">
                        <div className="flex items-center gap-3">
                           <div className="h-9 w-9 rounded-lg bg-background border border-secondary flex items-center justify-center">
                              <svg className="h-5 w-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                           </div>
                           <div>
                              <p className="text-sm font-bold flex items-center gap-2">Google Calendar {syncDone && <CheckCircle2 className="h-4 w-4 text-green-500" />}</p>
                              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">Automated meeting sync</p>
                           </div>
                        </div>
                        <button onClick={handleCalendarSync} disabled={syncing} className={cn("px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-1.5", syncing ? "bg-secondary text-muted-foreground" : "bg-foreground text-background hover:bg-accent")}>
                           {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calendar className="h-4 w-4" />}{syncing ? "Syncing..." : "Sync Now"}
                        </button>
                     </div>
                  </div>
               </div>

               <div className="space-y-5">
                  <div className="bg-foreground text-background rounded-2xl p-6 space-y-4">
                     <div className="flex items-center gap-2"><Lock className="h-5 w-5 text-accent" /><h4 className="text-sm font-black">Security</h4></div>
                     <p className="text-xs opacity-60 leading-relaxed">Session protected by 256‑bit AES encryption via Google OAuth.</p>
                     <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-green-400 bg-green-500/10 rounded-lg px-2.5 py-1.5 w-fit"><CheckCircle2 className="h-3 w-3" /> Session Encrypted</div>
                  </div>
                  <div className="bg-background border border-secondary rounded-2xl p-6 space-y-4">
                     <div className="flex items-center gap-2"><Star className="h-5 w-5 text-yellow-500" /><h4 className="text-sm font-black">Performance Score</h4></div>
                     <div className="text-4xl font-black tracking-tight">{score.toLocaleString()}</div>
                     <div className="w-full h-2 bg-secondary rounded-full overflow-hidden"><div className="h-2 rounded-full bg-gradient-to-r from-accent to-yellow-400 transition-all duration-1000" style={{ width: `${Math.min((score / 5000) * 100, 100)}%` }} /></div>
                     <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{score >= 4000 ? "Top Performer" : score >= 2000 ? "Rising Star" : "Building momentum"}</p>
                  </div>
                  <div className="bg-background border border-secondary rounded-2xl p-6 space-y-3">
                     <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Account Info</h4>
                     <div className="space-y-2 text-xs">
                        <div className="flex justify-between"><span className="text-muted-foreground font-bold">Member since</span><span className="font-black">{joinedDate}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground font-bold">Auth provider</span><span className="font-black">Google OAuth</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground font-bold">User ID</span><span className="font-black text-muted-foreground/50">{userId.slice(0, 8)}…</span></div>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      
   );
}

function ProfileField({ label, value, onChange, icon: Icon, disabled = false }: any) {
   return (
      <div className="space-y-1.5">
         <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{label}</label>
         <div className={cn("flex items-center gap-3 px-4 py-3 bg-secondary/20 border rounded-xl transition-all", disabled ? "opacity-50 cursor-not-allowed border-secondary" : "border-secondary focus-within:border-accent/60 focus-within:bg-background")}>
            {Icon && <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
            <input type="text" value={value} disabled={disabled} onChange={onChange ? (e: any) => onChange(e.target.value) : undefined} className="bg-transparent border-none outline-none flex-1 text-sm font-bold w-full" />
         </div>
      </div>
   );
}
