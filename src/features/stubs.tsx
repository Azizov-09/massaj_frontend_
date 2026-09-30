// ═══════════════════════════════════════════════════════
//  Stub pages for routes not yet fully implemented
// ═══════════════════════════════════════════════════════
import { Hammer } from 'lucide-react';
import { Card, EmptyState } from '@/components/ui/primitives';
import { PageHeader } from '@/components/ui/KpiCard';

function ComingSoon({ title, description }: { title: string; description?: string }) {
  return (
    <div className="px-4 lg:px-6 py-6 max-w-[1600px] mx-auto space-y-5">
      <PageHeader title={title} description={description} />
      <Card>
        <EmptyState
          icon={<Hammer className="w-6 h-6" />}
          title="Tez orada"
          description="Bu sahifa hali qurilmoqda. Ko'p o'tmay ishga tushadi."
          className="py-20"
        />
      </Card>
    </div>
  );
}

export function SchedulePage() { return <ComingSoon title="Jadval" description="Kunlik va haftalik jadval ko'rinishi" />; }
export function AttendancePage() { return <ComingSoon title="Davomat" description="Bolalar va mutaxassislar davomati" />; }
export function AssessmentsPage() { return <ComingSoon title="Baholashlar" description="Bolalar rivojlanish baholashlari" />; }
export function ProgressPage() { return <ComingSoon title="Rivojlanish" description="Bolalar rivojlanish dinamikasi" />; }
export function GoalsPage() { return <ComingSoon title="Maqsadlar" description="Terapiya maqsadlari va natijalar" />; }
export function TransactionsPage() { return <ComingSoon title="Tranzaksiyalar" description="Barcha moliyaviy harakatlar tarixi" />; }
export function BalancePage() { return <ComingSoon title="Balanslar" description="Barcha ota-onalar balansi" />; }
export function AnalyticsPage() { return <ComingSoon title="Analitika" description="Kengaytirilgan hisobotlar va grafiklar" />; }
export function ReportsPage() { return <ComingSoon title="Hisobotlar" description="Export va chop etish uchun hisobotlar" />; }
export function ActivityLogsPage() { return <ComingSoon title="Faollik jurnali" description="Tizim harakatlar tarixi" />; }
export function SettingsPage() { return <ComingSoon title="Sozlamalar" description="Tizim va profil sozlamalari" />; }
export function ProfilePage() { return <ComingSoon title="Profil" description="Shaxsiy ma'lumotlar" />; }
export function AdminsPage() { return <ComingSoon title="Adminlar" description="Tizim administratorlari boshqaruvi" />; }
export function EmployeesPage() { return <ComingSoon title="Xodimlar" description="Markaz xodimlar ro'yxati" />; }

// Admin dashboard (reuse super admin layout, different data scope)
export { SuperAdminDashboard as AdminDashboard } from '@/features/dashboard/SuperAdminDashboard';

// Specialist & Parent dashboards
export function SpecialistDashboard() { return <ComingSoon title="Mutaxassis paneli" description="Kunlik jadval va seans boshqaruvi" />; }
export function ParentDashboard() { return <ComingSoon title="Ota-ona paneli" description="Bola rivojlanishi va to'lovlar" />; }
