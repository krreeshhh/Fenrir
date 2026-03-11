"use client"

import { useState } from "react"
import Sidebar from "@/components/Sidebar"
import { UserRole } from "@/utils/supabase"
import { UserProvider, useUser } from "@/components/UserContext"
import Chatbot from "./Chatbot"
import { cn } from "@/utils/cn"
import { Bell } from "lucide-react"

interface DashboardShellProps {
  children: React.ReactNode;
  // role is still passed from the page so nav items are known immediately (no async flash)
  role: UserRole;
}

export default function DashboardShell({ children, role }: DashboardShellProps) {
  return (
    <UserProvider>
      <ShellInner role={role}>{children}</ShellInner>
    </UserProvider>
  );
}

function ShellInner({ children, role }: DashboardShellProps) {
  const [isSidebarCompact, setIsSidebarCompact] = useState(false);
  const { fullName, loading } = useUser();

  const displayName = loading ? "..." : (fullName || "User");
  const initials = displayName.slice(0, 1).toUpperCase();

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar - Naturally Stationary */}
      <Sidebar
        role={role}
        userName={displayName}
        isCompact={isSidebarCompact}
        onToggleCompact={() => setIsSidebarCompact(!isSidebarCompact)}
      />

      {/* Main Container - Right Side */}
      <div className={cn(
        "flex-1 flex flex-col transition-all duration-500 h-full",
        isSidebarCompact ? "ml-20" : "ml-72"
      )}>

        {/* Topbar - Stationary */}
        <header className="h-20 border-b border-secondary/50 bg-background/80 px-6 md:px-10 flex items-center justify-between shrink-0">
          <div className="animate-in fade-in slide-in-from-left-2 duration-500">
            <h1 className="text-lg font-black tracking-tighter leading-none">PIVOT</h1>
          </div>

          <div className="flex items-center gap-6">
            <button className="p-2.5 bg-secondary/30 border border-secondary/50 rounded-lg hover:border-accent/40 hover:bg-secondary/60 transition-all text-muted-foreground hover:text-accent group relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2 h-2 w-2 bg-accent rounded-full border-2 border-background animate-pulse" />
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-secondary/50">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-black leading-none mb-1">{displayName}</p>
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Status: Active</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-foreground text-background flex items-center justify-center font-black text-lg shadow-lg border border-accent/10">
                {initials}
              </div>
            </div>
          </div>
        </header>

        {/* Content Area - Scrolling */}
        <main className="flex-1 overflow-y-auto p-6 md:p-10 scrollbar-hide">
          <div className="max-w-[1400px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
            {children}
          </div>
          {/* Chatbot stays relative to the viewport/page layout */}
          <Chatbot />
        </main>
      </div>
    </div>
  );
}
