"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ShieldAlert, Users, LayoutDashboard, ShieldCheck, Mail, Lock, ArrowUpRight, BarChart, LogIn, Shield, Loader2, Zap } from "lucide-react"
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
    }, 600);
  };


  const handleGoogleLogin = async () => {
    setLoading("google");
    
    // Check for Capacitor bridge in a more robust way
    const isCapacitor = typeof window !== 'undefined' && 
      ((window as any).Capacitor?.isNativePlatform?.() || 
       (window as any).Capacitor?.platform ||
       (window as any).webkit?.messageHandlers?.bridge);

    // We ALWAYS use the web redirect even on mobile to avoid PKCE origin issues.
    // The server will then bridge us back to the app scheme.
    const redirectUrl = `${window.location.origin}/auth/callback${isCapacitor ? '?source=app' : ''}`;

    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
          scope: 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/calendar.events',
        }
      },
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] p-6 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/10 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[40px] translate-y-1/2 -translate-x-1/2"></div>
      <div className="absolute inset-0 bg-white/[0.02] pointer-events-none"></div>

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-0 bg-background/40 backdrop-blur-2xl border border-white/5 rounded-[40px] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden relative z-10 ring-1 ring-white/10">

        {/* Branding Panel */}
        <div className="p-12 md:p-16 flex flex-col justify-between bg-gradient-to-br from-secondary/50 to-transparent border-r border-white/5 relative group">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_20%,_var(--accent)_0%,_transparent_25%)] opacity-5 group-hover:opacity-10 transition-opacity duration-1000"></div>

          <div className="relative z-10">
            <div className="inline-flex items-center justify-center h-20 w-20 bg-accent text-white rounded-3xl shadow-[0_20px_40px_-5px_var(--accent)] mb-8 transform hover:scale-110 hover:rotate-3 transition-all duration-500 ring-1 ring-white/20">
              <ShieldAlert className="h-10 w-10 animate-pulse" />
            </div>
            <h1 className="text-5xl font-bold tracking-tighter mb-4 leading-tight uppercase">
              Pivot <span className="text-accent underline decoration-accent/30 underline-offset-8">ERP</span>
            </h1>
            <p className="text-muted-foreground text-base leading-relaxed max-w-sm font-medium opacity-80">
              Strategic command interface for integrated workforce orchestration, capital deployment, and automated insights.
            </p>
          </div>

          <div className="pt-12 relative z-10">
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-2 bg-white/5 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 text-[11px] font-bold uppercase tracking-wider text-white/60 hover:text-white hover:border-accent/50 transition-all cursor-default shadow-sm">
                <Users className="h-4 w-4 text-accent" /> Personnel
              </span>
              <span className="flex items-center gap-2 bg-white/5 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 text-[11px] font-bold uppercase tracking-wider text-white/60 hover:text-white hover:border-accent/50 transition-all cursor-default shadow-sm">
                <LayoutDashboard className="h-4 w-4 text-accent" /> Matrix
              </span>
              <span className="flex items-center gap-2 bg-white/5 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 text-[11px] font-bold uppercase tracking-wider text-white/60 hover:text-white hover:border-accent/50 transition-all cursor-default shadow-sm">
                <Zap className="h-4 w-4 text-accent" /> Real-time
              </span>
            </div>
          </div>
        </div>

        {/* Auth Panel */}
        <div className="p-12 md:p-16 flex flex-col justify-center gap-12 bg-background/20 relative overflow-hidden">
          {/* Quick Role Select */}
          <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-700 delay-200">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-accent">Nodal Access</h3>
              <p className="text-2xl font-bold tracking-tight mt-1">Select Demographic Node</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <QuickCard title="Employee" icon={Users} onClick={() => handleQuickLogin('employee')} isLoading={loading === 'employee'} />
              <QuickCard title="Project Lead" icon={BarChart} onClick={() => handleQuickLogin('project_lead')} isLoading={loading === 'project_lead'} />
              <QuickCard title="Manager" icon={ShieldCheck} onClick={() => handleQuickLogin('manager')} isLoading={loading === 'manager'} />
              <QuickCard title="Unit Head" icon={ShieldAlert} onClick={() => handleQuickLogin('unit_head')} isLoading={loading === 'unit_head'} />
              <QuickCard title="System Admin" icon={Shield} onClick={() => handleQuickLogin('admin')} isLoading={loading === 'admin'} accent />
            </div>
          </div>

          {/* Secure Login */}
          <div className="pt-12 border-t border-white/5 space-y-8 animate-in fade-in slide-in-from-right-8 duration-700">
            <div className="text-center md:text-left">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground opacity-50">Global SSO</h2>
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                <ShieldAlert className="h-4 w-4" /> {error}
              </div>
            )}

            <button
              onClick={handleGoogleLogin}
              disabled={!!loading}
              className="group w-full py-5 bg-foreground text-background rounded-2xl font-bold text-xs uppercase tracking-wider hover:bg-accent hover:text-white transition-all duration-500 flex items-center justify-center gap-4 relative overflow-hidden shadow-2xl active:scale-95"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
              <span className="relative z-10 flex items-center gap-4">
                <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                {loading === 'google' ? "Synchronizing Auth..." : "Authorize with Google"}
              </span>
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}

function QuickCard({ title, icon: Icon, onClick, isLoading, accent = false }: any) {
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className={cn(
        "w-full flex items-center justify-between p-5 bg-white/[0.03] border rounded-2xl transition-all group text-left relative overflow-hidden active:scale-95",
        accent ? "border-accent/40 bg-accent/5" : "border-white/5 hover:border-accent/40 hover:bg-accent/5 hover:-translate-y-1"
      )}
    >
      <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-10 translate-x-4 group-hover:translate-x-0 transition-all pointer-events-none">
        <Icon className="h-12 w-12 text-accent" />
      </div>
      <div className="flex items-center gap-4 relative z-10">
        <div className={cn(
          "h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-500 ring-1 ring-white/10 shadow-lg",
          accent ? "bg-accent text-white" : "bg-background border border-white/5 group-hover:border-accent group-hover:bg-accent group-hover:text-white"
        )}>
          <Icon className="h-5 w-5" />
        </div>
        <span className="font-bold text-[11px] uppercase tracking-wider">{title}</span>
      </div>
      <div className="relative z-10">
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-accent" />
        ) : (
          <ArrowUpRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-accent transform group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
        )}
      </div>
    </button>
  )
}
