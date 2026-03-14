"use client"

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ShieldAlert, ArrowLeft, RefreshCw } from "lucide-react";

export default function AuthCodeError() {
  const searchParams = useSearchParams();
  const errorMessage = searchParams.get('error') || "The operational handshake between the authentication provider and our backend node has encountered a critical failure.";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute top-1/4 -right-1/4 w-3/4 h-3/4 bg-red-500/10 rounded-full blur-[60px] select-none -z-10"></div>
        <div className="absolute -bottom-1/4 -left-1/4 w-3/4 h-3/4 bg-orange-500/10 rounded-full blur-[40px] select-none -z-10"></div>

        <div className="w-full max-w-2xl text-center space-y-12">
            <div className="inline-flex items-center justify-center p-8 bg-red-50 text-red-600 rounded-[48px] shadow-2xl animate-bounce">
                <ShieldAlert className="h-16 w-16" />
            </div>

            <div className="space-y-6">
                <h1 className="text-3xl font-bold tracking-tighter leading-tight">
                    Code <span className="text-red-600">Sync Failure</span>
                </h1>
                <p className="text-muted-foreground font-medium text-xl leading-relaxed max-w-lg mx-auto">
                    {errorMessage}
                </p>
            </div>

            <div className="bg-muted/30 border-2 border-dashed border-muted rounded-[32px] p-10 text-left space-y-4">
                <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" /> Recommended Recovery:
                </h3>
                <ul className="space-y-3 text-sm font-bold opacity-80 list-disc pl-5">
                    <li>Ensure you have run the <code className="bg-background px-2 py-1 rounded">supabase/setup.sql</code> and <code className="bg-background px-2 py-1 rounded">supabase/functions.sql</code> in your Supabase SQL Editor.</li>
                    <li>Verify your Google OAuth Client ID and Secret are correctly configured in both the Supabase Dashboard and your <code className="bg-background px-2 py-1 rounded">.env</code> file.</li>
                    <li>Clear your browser cookies and try the authorization loop again.</li>
                </ul>
            </div>

            <div className="flex flex-col md:flex-row gap-6 justify-center">
                <Link 
                    href="/"
                    className="px-12 py-6 bg-secondary-foreground text-secondary rounded-[32px] font-bold text-xs uppercase tracking-wider shadow-2xl flex items-center justify-center gap-4 hover:scale-105 transition-all"
                >
                    <ArrowLeft className="h-4 w-4" /> Return to Terminal
                </Link>
            </div>
        </div>
    </div>
  );
}
