import { WorkspaceTabs } from "@/components/ui/WorkspaceTabs";
import { SettingsPage } from "./SettingsPage";
import { ProfilePage } from "@/features/profile/ProfilePage";
import { ActivityLogsPage } from "@/features/activity-logs/ActivityLogsPage";
export function OwnerSettingsPage() {
  return (
    <WorkspaceTabs
      tabs={[
        { id: "clinic", label: "Markaz", content: <SettingsPage /> },
        { id: "profile", label: "Profil va parol", content: <ProfilePage /> },
        {
          id: "activity",
          label: "Faollik tarixi",
          content: <ActivityLogsPage />,
        },
      ]}
    />
  );
}
