// ═══════════════════════════════════════════════════════
//  DebtorsKpis — KPI metric summary cards for Debtors
// ═══════════════════════════════════════════════════════
import { TrendingDown, Users, DollarSign, AlertCircle } from 'lucide-react';
import { KpiCard } from '@/components/ui/KpiCard';

interface DebtorsKpisProps {
  isParent: boolean;
  totalDebt: number;
  debtorsCount: number;
  avgDebt: number;
  maxDebt: number;
}

export function DebtorsKpis({
  isParent,
  totalDebt,
  debtorsCount,
  avgDebt,
  maxDebt,
}: DebtorsKpisProps) {
  if (isParent) {
    return (
      <div className="hidden md:grid md:grid-cols-3 gap-3.5">
        <KpiCard
          label="Sizning qarzingiz"
          value={totalDebt}
          format="currency"
          description="To'lanishi lozim bo'lgan mablag'"
          icon={<TrendingDown className="w-4 h-4 text-rose-600" />}
          accentColor="danger"
          index={0}
        />
        <KpiCard
          label="Qarz bo'lgan bolalar"
          value={debtorsCount}
          description="Farzandlar soni"
          icon={<Users className="w-4 h-4 text-amber-600" />}
          accentColor="gold"
          index={1}
        />
        <KpiCard
          label="Status"
          value={totalDebt > 0 ? "Qarzdorlik mavjud" : "Qarz yo'q"}
          format="text"
          description="Joriy to'lov holati"
          icon={<AlertCircle className="w-4 h-4 text-brand-600" />}
          accentColor="brand"
          index={2}
        />
      </div>
    );
  }

  return (
    <div className="hidden md:grid md:grid-cols-4 gap-3.5">
      <KpiCard
        label="Jami qarz"
        value={totalDebt}
        format="currency"
        description="Umumiy qarz summasi"
        icon={<TrendingDown className="w-4 h-4 text-rose-600" />}
        accentColor="danger"
        index={0}
      />
      <KpiCard
        label="Qarzdorlar soni"
        value={debtorsCount}
        description="Qarzdor mijozlar"
        icon={<Users className="w-4 h-4 text-amber-600" />}
        accentColor="gold"
        index={1}
      />
      <KpiCard
        label="O'rtacha qarz"
        value={avgDebt}
        format="currency"
        description="Har bir mijozga to'g'ri keluvchi"
        icon={<DollarSign className="w-4 h-4 text-blue-600" />}
        accentColor="blue"
        index={2}
      />
      <KpiCard
        label="Maksimal qarz"
        value={maxDebt}
        format="currency"
        description="Eng katta qarzdorlik"
        icon={<AlertCircle className="w-4 h-4 text-brand-600" />}
        accentColor="brand"
        index={3}
      />
    </div>
  );
}
