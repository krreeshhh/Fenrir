import DashboardShell from "@/components/DashboardShell";

export default function ProjectLeadLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell role="project_lead">{children}</DashboardShell>;
}
