"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/components/UserContext";
import {
   User, Mail, Briefcase, Lock,
   Loader2, CheckCircle2, LogOut, Camera, Star, AlertCircle
} from "lucide-react";
import { createClient } from "@/utils/supabase";
import { cn } from "@/utils/cn";
import { ProfileSkeleton } from "@/components/Skeleton";

export default function ProfileView() {
   const router = useRouter();
   const supabase = createClient();
   const { fullName, firstName, lastName, email, role, score, userId, joinedDate, loading, refreshName, avatarUrl, refreshAvatar } = useUser();

   const [editFirst, setEditFirst] = useState("");
   const [editLast, setEditLast] = useState("");
   const [initialized, setInitialized] = useState(false);
   const [saving, setSaving] = useState(false);
   const [saved, setSaved] = useState(false);
   const [saveError, setSaveError] = useState("");
   const [uploading, setUploading] = useState(false);

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

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
       try {
          setUploading(true);
          const file = event.target.files?.[0];
          if (!file) return;
 
          const formData = new FormData();
          formData.append("file", file);
          formData.append("userId", userId);
 
          const response = await fetch("/api/profile/upload", {
             method: "POST",
             body: formData,
          });
 
          if (!response.ok) {
             const errorData = await response.json();
             throw new Error(errorData.error || "Upload failed");
          }
 
          const { publicUrl } = await response.json();
          refreshAvatar(publicUrl);
          setSaved(true);
          setTimeout(() => setSaved(false), 2500);
       } catch (error: any) {
          setSaveError("Upload failed: " + error.message);
       } finally {
          setUploading(false);
       }
    };

   const initials = editFirst.slice(0, 1).toUpperCase() || email.slice(0, 1).toUpperCase() || "?";
   const fullDisplayName = `${editFirst} ${editLast}`.trim() || fullName || "User";

   if (loading) return <ProfileSkeleton />;

   return (
      <div className="space-y-6 pb-16 max-w-5xl mx-auto">
         <div className="flex items-center justify-between border-b border-secondary/50 pb-6">
            <div className="flex items-center gap-3">
               <div className="h-10 w-10 bg-accent/10 rounded-xl flex items-center justify-center border border-accent/20">
                  <User className="h-5 w-5 text-accent" />
               </div>
               <div>
                  <h2 className="text-2xl font-bold tracking-tight">My Profile</h2>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-0.5">Account Settings</p>
               </div>
            </div>
            <button onClick={handleSignOut} className="flex items-center gap-2 px-5 py-2.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg font-bold text-[11px] uppercase tracking-wider hover:bg-red-500/20 hover:border-red-500/30 transition-all active:scale-95">
               <LogOut className="h-4 w-4" /> Sign Out
            </button>
         </div>

         <div className="bg-background border border-secondary rounded-2xl overflow-hidden shadow-sm">
            <div className="h-24 relative"><div className="absolute inset-0 bg-gradient-to-r from-accent/20 to-secondary/20" /></div>
            <div className="px-8 pb-8 -mt-12 relative flex flex-col md:flex-row md:items-end justify-between gap-6">
               <div className="flex items-end gap-5">
                  <div className="relative group">
                     <div className="h-24 w-24 rounded-2xl bg-foreground text-background font-bold text-4xl flex items-center justify-center border-2 border-background shadow-md overflow-hidden bg-cover bg-center" style={avatarUrl ? { backgroundImage: `url(${avatarUrl})` } : {}}>
                        {!avatarUrl && initials}
                        {uploading && (
                           <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                              <Loader2 className="h-6 w-6 text-white animate-spin" />
                           </div>
                        )}
                     </div>
                     <label
                        htmlFor="avatar-upload"
                        className="absolute -bottom-2 -right-2 h-8 w-8 rounded-xl bg-accent text-white flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                     >
                        <Camera className="h-4 w-4" />
                        <input
                           type="file"
                           id="avatar-upload"
                           className="hidden"
                           accept="image/*"
                           onChange={handleFileUpload}
                           disabled={uploading}
                        />
                     </label>
                  </div>
                  <div className="pb-1 space-y-1">
                     <h3 className="text-2xl font-bold tracking-tight">{fullDisplayName}</h3>
                     <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-accent/80" />
                        {role.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                     </p>
                  </div>
               </div>
               <div className="pb-1">
                  <p className="text-xs font-bold text-muted-foreground bg-secondary/30 px-3 py-1.5 rounded-lg border border-secondary/50">Joined {joinedDate}</p>
               </div>
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
               <div className="bg-background border border-secondary rounded-2xl p-8 shadow-sm">
                  <h3 className="text-sm font-bold flex items-center gap-2 mb-6"><User className="h-4 w-4 text-accent" /> Personal Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                     <ProfileField label="First Name" value={editFirst} onChange={setEditFirst} />
                     <ProfileField label="Last Name" value={editLast} onChange={setEditLast} />
                     <div className="sm:col-span-2"><ProfileField label="Email Address" value={email} icon={Mail} disabled /></div>
                     <div className="sm:col-span-2"><ProfileField label="Role" value={role.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())} disabled /></div>
                  </div>
                  <div className="mt-8 flex items-center gap-4 pt-6 border-t border-secondary">
                     <button onClick={handleSaveChanges} disabled={saving} className="px-6 py-3 bg-foreground text-background rounded-lg font-bold text-xs uppercase tracking-wider hover:bg-accent transition-all flex items-center gap-2 disabled:opacity-50 active:scale-95 shadow-sm">
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}{saving ? "Saving..." : "Save Changes"}
                     </button>
                     {saved && <span className="flex items-center gap-1.5 text-green-500 text-sm font-bold animate-in fade-in"><CheckCircle2 className="h-4 w-4" /> Updated Successfully</span>}
                     {saveError && <span className="flex items-center gap-1.5 text-red-500 text-sm font-bold"><AlertCircle className="h-4 w-4" /> {saveError}</span>}
                  </div>
               </div>
            </div>

            <div className="space-y-6">
               <div className="bg-foreground text-background rounded-2xl p-8 space-y-4 shadow-md relative overflow-hidden">
                  <div className="absolute -right-4 -top-4 opacity-5 pointer-events-none">
                     <Lock className="h-32 w-32" />
                  </div>
                  <div className="flex items-center gap-3 relative z-10"><Lock className="h-6 w-6 text-accent" /><h4 className="text-lg font-bold">Security</h4></div>
                  <p className="text-sm opacity-80 leading-relaxed font-medium relative z-10">Protected by 256‑bit AES encryption via Google OAuth.</p>
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2 w-fit relative z-10"><CheckCircle2 className="h-4 w-4" /> Session Encrypted</div>
               </div>

               <div className="bg-background border border-secondary rounded-2xl p-8 space-y-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-3"><Star className="h-6 w-6 text-amber-500" /><h4 className="text-lg font-bold text-foreground">Rank XP</h4></div>
                  </div>
                  <div className="text-5xl font-bold tracking-tight flex items-baseline gap-1">
                     {score.toLocaleString()} <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">XP</span>
                  </div>
                  <div className="w-full h-2.5 bg-secondary/50 rounded-full overflow-hidden border border-secondary">
                     <div className="h-full rounded-full bg-gradient-to-r from-accent to-amber-500 transition-all duration-1000 ease-out" style={{ width: `${Math.min((score / 5000) * 100, 100)}%` }} />
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
         <label className="text-xs font-bold text-muted-foreground">{label}</label>
         <div className={cn("flex items-center gap-3 px-4 py-3 bg-background border rounded-lg transition-all shadow-sm", disabled ? "opacity-60 cursor-not-allowed border-secondary bg-secondary/5" : "border-secondary focus-within:border-accent focus-within:ring-1 focus-within:ring-accent hover:border-accent/50")}>
            {Icon && <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
            <input type="text" value={value} disabled={disabled} onChange={onChange ? (e: any) => onChange(e.target.value) : undefined} className="bg-transparent border-none outline-none flex-1 text-sm font-medium w-full placeholder:text-muted-foreground/50" />
         </div>
      </div>
   );
}
