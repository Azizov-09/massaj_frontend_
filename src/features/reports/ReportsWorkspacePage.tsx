import { WorkspaceTabs } from "@/components/ui/WorkspaceTabs";
import { ReportsPage } from "./ReportsPage";
import { AnalyticsPage } from "@/features/analytics/AnalyticsPage";
export function ReportsWorkspacePage() {
  return (
    <WorkspaceTabs
      tabs={[
        { id: "reports", label: "Hisobotlar", content: <ReportsPage /> },
        { id: "analytics", label: "Tahlil", content: <AnalyticsPage /> },
      ]}
    />
  );
}
