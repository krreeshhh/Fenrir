"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ShieldAlert, Users, LayoutDashboard, ShieldCheck, Mail, Lock, ArrowUpRight, BarChart, LogIn } from "lucide-react"
import { createClient } from "@/utils/supabase"
import { cn } from "@/utils/cn"

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleQuickLogin = async (role: string) => {
    setLoading(role);
    setError(null);
    
    setTimeout(() => {
       const path = role.replace('_', '-');
       router.push(`/${path}`);
    }, 400);
  };


  const handleGoogleLogin = async () => {
    setLoading("google");
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-background border border-secondary rounded-2xl p-6 md:p-8 shadow-xl">
           
           {/* Logo & Intro */}
           <div className="space-y-6 md:pr-8 md:border-r border-secondary h-full flex flex-col justify-center">
              <div className="inline-flex items-center justify-center h-16 w-16 bg-accent text-white rounded-2xl shadow-sm mb-2">
                 <ShieldAlert className="h-8 w-8" />
              </div>
              <div>
                 <h1 className="text-3xl font-black mb-2">
                    Pivot ERP
                 </h1>
                 <p className="text-muted-foreground text-sm leading-relaxed max-w-sm">
                    Integrated enterprise resource planning with intelligent work tracking, resource deployment, and automated insights.
                 </p>
              </div>

              <div className="pt-6 mt-auto">
                 <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    <span className="flex items-center gap-1.5 bg-secondary/30 px-3 py-1.5 rounded-lg border border-secondary"><Users className="h-3.5 w-3.5 text-accent" /> Personnel Hub</span>
                    <span className="flex items-center gap-1.5 bg-secondary/30 px-3 py-1.5 rounded-lg border border-secondary"><LayoutDashboard className="h-3.5 w-3.5 text-accent" /> Global Matrix</span>
                 </div>
              </div>
           </div>

           {/* Login Interface */}
           <div className="space-y-8">
              
              {/* Manual Login */}
              <div className="space-y-5">
                 <div>
                    <h2 className="text-xl font-bold">Sign In</h2>
                    <p className="text-xs font-bold text-muted-foreground mt-1">Access your Pivot ERP workspace.</p>
                 </div>

                 {error && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-xs font-bold">
                       {error}
                    </div>
                 )}


                 <button 
                    onClick={handleGoogleLogin}
                    disabled={!!loading}
                    className="w-full py-3 bg-background border border-secondary rounded-lg font-bold text-xs uppercase tracking-widest hover:border-accent/40 transition-all flex items-center justify-center gap-2"
                 >
                    <svg className="h-4 w-4" viewBox="0 0 24 24">
                       <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                       <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                       <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                       <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Google
                 </button>
              </div>

              {/* Quick Role Select */}
              <div className="pt-6 border-t border-secondary space-y-4">
                 <div>
                    <h3 className="text-sm font-bold">Demo Environments</h3>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">Instant bypass, no password required</p>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-3">
                    <QuickCard title="Employee" icon={Users} onClick={() => handleQuickLogin('employee')} isLoading={loading === 'employee'} />
                    <QuickCard title="Project Lead" icon={BarChart} onClick={() => handleQuickLogin('project_lead')} isLoading={loading === 'project_lead'} />
                    <QuickCard title="Manager" icon={ShieldCheck} onClick={() => handleQuickLogin('manager')} isLoading={loading === 'manager'} />
                    <QuickCard title="Unit Head" icon={ShieldAlert} onClick={() => handleQuickLogin('unit_head')} isLoading={loading === 'unit_head'} />
                 </div>
              </div>

           </div>

        </div>
    </div>
  )
}

function QuickCard({ title, icon: Icon, onClick, isLoading }: any) {
   return (
      <button 
         onClick={onClick}
         disabled={isLoading}
         className="w-full flex items-center justify-between p-3 bg-secondary/10 border border-secondary rounded-lg hover:border-accent/40 hover:bg-secondary/30 transition-all group text-left"
      >
         <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-background border border-secondary flex items-center justify-center group-hover:border-accent/40 transition-colors">
               <Icon className="h-4 w-4 text-muted-foreground group-hover:text-accent transition-colors" />
            </div>
            <span className="font-bold text-xs">{title}</span>
         </div>
         {isLoading ? (
            <div className="h-3 w-3 border-[1.5px] border-muted border-t-accent rounded-full animate-spin"></div>
         ) : (
            <ArrowUpRight className="h-3 w-3 text-muted-foreground/50 group-hover:text-accent transition-colors" />
         )}
      </button>
   )
}
