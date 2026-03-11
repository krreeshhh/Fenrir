import DashboardShell from "@/components/DashboardShell";

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell role="manager">{children}</DashboardShell>;
}
