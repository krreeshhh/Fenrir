"use client"

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  CheckSquare,
  Mail,
  Users,
  Trophy,
  Wallet,
  User,
  Video,
  CheckCircle,
  Settings,
  FolderLock,
  Target,
  BarChart,
  MessageSquare,
  Sun,
  Moon,
  LogOut,
  Plus,
  ShieldAlert,
  Shield,
  Zap,
  ChevronLeft,
  ChevronRight,
  Menu
} from "lucide-react";
import { cn } from "@/utils/cn";
import { useTheme } from "next-themes";
import { UserRole, createClient } from "@/utils/supabase";

interface SidebarProps {
  role: UserRole;
  userName?: string;
  isCompact?: boolean;
  onToggleCompact?: () => void;
}

const navItemsByRole: Record<UserRole, { label: string, href: string, icon: any }[]> = {
  employee: [
    { label: "Dashboard", href: "/employee", icon: LayoutDashboard },
    { label: "Checklist", href: "/employee/checklist", icon: CheckSquare },
    { label: "Mail", href: "/employee/mail", icon: Mail },
    { label: "Meetings", href: "/employee/meetings", icon: Video },
    { label: "Leaderboard", href: "/employee/leaderboard", icon: Trophy },
    { label: "Profile", href: "/employee/profile", icon: User },
  ],
  project_lead: [
    { label: "Dashboard", href: "/project-lead", icon: LayoutDashboard },
    { label: "Allocation", href: "/project-lead/checklist-allocation", icon: Plus },
    { label: "Projects", href: "/project-lead/projects-allocated", icon: FolderLock },
    { label: "Completion", href: "/project-lead/checklist-completion", icon: CheckCircle },
    { label: "Mail", href: "/project-lead/mail", icon: Mail },
    { label: "Meetings", href: "/project-lead/meetings", icon: Video },
    { label: "PL Leaderboard", href: "/project-lead/leads-leaderboard", icon: Trophy },
    { label: "Emp Leaderboard", href: "/project-lead/emp-leaderboard", icon: Trophy },
    { label: "Profile", href: "/project-lead/profile", icon: User },
  ],
  manager: [
    { label: "Dashboard", href: "/manager", icon: LayoutDashboard },
    { label: "Project Allocation", href: "/manager/project-allocation", icon: Target },
    { label: "Meetings", href: "/manager/meetings", icon: Video },
    { label: "Teams", href: "/manager/teams", icon: Users },
    { label: "PL Leaderboard", href: "/manager/leads-leaderboard", icon: Trophy },
    { label: "Emp Leaderboard", href: "/manager/emp-leaderboard", icon: Trophy },
    { label: "Profile", href: "/manager/profile", icon: User },
  ],
  unit_head: [
    { label: "Dashboard", href: "/unit-head", icon: LayoutDashboard },
    { label: "All Employees", href: "/unit-head/employees", icon: Users },
    { label: "Projects Overview", href: "/unit-head/projects", icon: BarChart },
    { label: "Profile", href: "/unit-head/profile", icon: User },
  ],
  admin: [
    { label: "Admin Dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "User Governance", href: "/admin/users", icon: Shield },
    { label: "Profile", href: "/admin/profile", icon: User },
  ],
};

export default function Sidebar({ role, userName, isCompact = false, onToggleCompact }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const supabase = createClient();
  const items = navItemsByRole[role];

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <aside className={cn(
      "fixed left-0 top-0 h-screen transition-all duration-500 ease-in-out bg-background border-r border-secondary flex flex-col z-50 overflow-hidden",
      isCompact ? "w-20" : "w-72"
    )}>

      {/* Sidebar Logo & Toggle */}
      <div className={cn("p-6 flex items-center justify-between", isCompact ? "flex-col gap-8" : "flex-row")}>
        <div className="flex items-center gap-3 group">
          <div className="h-8 w-8 min-w-8 rounded-lg bg-foreground text-background flex items-center justify-center shadow-lg group-hover:bg-accent group-hover:text-white transition-all duration-300">
            <ShieldAlert className="h-4 w-4" />
          </div>
          {!isCompact && (
            <div className="animate-in fade-in slide-in-from-left-2 duration-500">
              <h1 className="text-lg font-black tracking-tighter leading-none">PIVOT SYSTEM</h1>
            </div>
          )}
        </div>

        <button
          onClick={onToggleCompact}
          className={cn(
            "p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground",
            isCompact ? "rotate-180" : ""
          )}
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>



      <nav className="flex-1 px-4 overflow-y-auto pt-4 space-y-1 custom-scrollbar">
        {items.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={isCompact ? item.label : ""}
              className={cn(
                "flex items-center gap-4 px-4 py-2.5 rounded-lg transition-all group relative overflow-hidden",
                isActive
                  ? "bg-foreground text-background shadow-blue-glow"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <item.icon className={cn(
                "h-4 w-4 min-w-4 transition-transform group-hover:scale-110",
                isActive ? "text-accent" : "text-muted-foreground group-hover:text-foreground"
              )} />
              {!isCompact && (
                <span className="font-black tracking-tight text-xs uppercase animate-in fade-in slide-in-from-left-2 duration-500">{item.label}</span>
              )}
              {isActive && !isCompact && (
                <div className="absolute right-0 top-0 h-full w-1 bg-accent rounded-l-full animate-in slide-in-from-right duration-500"></div>
              )}
            </Link>
          )
        })}
      </nav>

      <div className={cn("p-4 border-t border-secondary space-y-6 bg-secondary/10", isCompact ? "flex flex-col items-center" : "")}>
        {userName && (
          <div className={cn("flex items-center gap-4 px-2", isCompact ? "justify-center" : "")}>
            <div className="h-8 w-8 min-w-8 rounded-lg bg-accent text-white flex items-center justify-center font-black shadow-lg border border-white/10">
              {userName[0].toUpperCase()}
            </div>
            {!isCompact && (
              <div className="overflow-hidden animate-in fade-in slide-in-from-left-2 duration-500">
                <p className="text-sm font-black truncate tracking-tight">{userName}</p>
              </div>
            )}
          </div>
        )}

        <div className={cn("flex flex-col gap-2 w-full", isCompact ? "items-center" : "")}>
          <div className={cn("grid gap-2 w-full", isCompact ? "grid-cols-1" : "grid-cols-2")}>
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              title={isCompact ? "Theme" : ""}
              className={cn(
                "flex items-center justify-center gap-2 p-3 rounded-lg bg-background border border-secondary hover:border-accent transition-all text-[10px] font-black uppercase tracking-widest shadow-sm",
                isCompact ? "h-10 w-10 p-0 mx-auto" : ""
              )}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              {!isCompact && (theme === 'dark' ? "Day" : "Night")}
            </button>

            <button
              onClick={handleSignOut}
              title={isCompact ? "Sign Out" : ""}
              className={cn(
                "flex items-center justify-center gap-2 p-3 rounded-lg bg-background border border-secondary hover:border-red-500 hover:text-red-500 transition-all text-[10px] font-black uppercase tracking-widest shadow-sm",
                isCompact ? "h-10 w-10 p-0 mx-auto" : ""
              )}
            >
              <LogOut className="h-4 w-4" />
              {!isCompact && "Exit"}
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
