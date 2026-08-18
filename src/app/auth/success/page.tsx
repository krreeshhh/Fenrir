"use client"

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ShieldCheck, ArrowRight, Loader2, Smartphone } from "lucide-react";

export default function AuthSuccessBridge() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [counting, setCounting] = useState(3);
  const role = searchParams.get('role') || 'employee';
  const accessToken = searchParams.get('access_token');
  const refreshToken = searchParams.get('refresh_token');

  useEffect(() => {
    // 1. Try to redirect immediately using the custom scheme
    // We pass the tokens so the app can set its own session
    let appUrl = `com.pivot.app://auth/success?role=${role}`;
    if (accessToken && refreshToken) {
      appUrl += `&access_token=${accessToken}&refresh_token=${refreshToken}`;
    }
    
    // Check if we are in a mobile context
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (isMobile) {
      window.location.href = appUrl;
      
      // Countdown for fallback
      const timer = setInterval(() => {
        setCounting(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    } else {
        // If somehow reached on desktop, just go to dashboard
        router.push(`/${role}`);
    }
  }, [role, router, accessToken, refreshToken]);

  const handleManualRedirect = () => {
    let appUrl = `com.pivot.app://auth/success?role=${role}`;
    if (accessToken && refreshToken) {
      appUrl += `&access_token=${accessToken}&refresh_token=${refreshToken}`;
    }
    window.location.href = appUrl;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
        {/* Decorative Background */}
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,_rgba(34,197,94,0.05),transparent_70%)] -z-10"></div>
        
        <div className="w-full max-w-md text-center space-y-8 animate-in fade-in zoom-in duration-500">
            <div className="inline-flex items-center justify-center h-24 w-24 bg-green-500/10 text-green-500 rounded-full border border-green-500/20 shadow-2xl animate-bounce">
                <ShieldCheck className="h-12 w-12" />
            </div>

            <div className="space-y-4">
                <h1 className="text-3xl font-bold tracking-tight">Sync <span className="text-green-500">Authorized</span></h1>
                <p className="text-muted-foreground font-medium">
                    Session successfully established on the nodal network. Redirecting to the secure app interface...
                </p>
            </div>

            <div className="p-6 bg-secondary/30 rounded-3xl border border-secondary flex flex-col items-center gap-4">
                <div className="flex items-center gap-3">
                    <Loader2 className="h-4 w-4 animate-spin text-green-500" />
                    <span className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                        Handing over to Native Hub in {counting}s
                    </span>
                </div>
                
                <button 
                    onClick={handleManualRedirect}
                    className="w-full py-4 bg-foreground text-background rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-3 hover:bg-green-500 hover:text-white transition-all shadow-lg group active:scale-95"
                >
                    <Smartphone className="h-4 w-4" /> Open Native App <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </button>
            </div>

            <p className="text-[10px] font-bold text-muted-foreground opacity-40 uppercase tracking-[0.2em]">
                Secure Tunnel ID: {Math.random().toString(36).substring(7).toUpperCase()}
            </p>
        </div>
    </div>
  );
}
