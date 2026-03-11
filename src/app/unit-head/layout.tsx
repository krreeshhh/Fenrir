import DashboardShell from "@/components/DashboardShell";

export default function UnitHeadLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell role="unit_head">{children}</DashboardShell>;
}
