import DashboardShell from "@/components/DashboardShell";

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell role="employee">{children}</DashboardShell>;
}
