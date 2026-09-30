// Debtors Page
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { TrendingDown, ArrowRight, Phone } from 'lucide-react';
import { useStore, useAuth } from '@/store';
import { calculateChildBalance, getTopDebtors } from '@/services/finance.service';
import { formatCurrencyCompact, formatDate, cn } from '@/utils';
import { Card, Avatar, EmptyState, ProgressBar } from '@/components/ui/primitives';
import { PageHeader, KpiCard } from '@/components/ui/KpiCard';
import { DataTable, Column } from '@/components/tables/DataTable';

export function DebtorsPage() {
  const { currentUser } = useAuth();
  const transactions = useStore(s => s.transactions);
  const children = useStore(s => s.children);
  const parents = useStore(s => s.parents);

  const isParent = currentUser?.role === 'PARENT';
  const allDebtors = useMemo(() => getTopDebtors(transactions, children, parents, 100), [transactions, children, parents]);
  const debtors = useMemo(() => {
    if (isParent && currentUser) {
      return allDebtors.filter(d => d.parentPhone === currentUser.phone || d.parentName === currentUser.fullName);
    }
    return allDebtors;
  }, [allDebtors, isParent, currentUser]);

  const totalDebt = debtors.reduce((s, d) => s + d.debt, 0);
  const maxDebt = Math.max(...debtors.map(d => d.debt), 1);

  return (
    <div className="px-4 lg:px-6 py-6 max-w-[1600px] mx-auto space-y-5">
      <PageHeader
        title={isParent ? "Qarzdorlik holati" : "Qarzdorlar"}
        description={isParent ? "Hisob-kitob va qarzdorlik bo'yicha ma'lumot" : "Balans va qarz holati"}
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <KpiCard label={isParent ? "Sizning qarzingiz" : "Jami qarz"} value={totalDebt} format="currency" icon={<TrendingDown className="w-4 h-4" />} accentColor="danger" index={0} />
        <KpiCard label={isParent ? "Qarz bo'lgan bolalar" : "Qarzdorlar soni"} value={debtors.length} icon={<TrendingDown className="w-4 h-4" />} accentColor="gold" index={1} />
        <KpiCard label={isParent ? "Status" : "O'rtacha qarz"} value={isParent ? (totalDebt > 0 ? "Qarzdorlik mavjud" : "Qarz yo'q") : totalDebt} format={isParent ? "text" : "currency"} accentColor="brand" index={2} />
      </div>

      <Card>
        {debtors.length === 0 ? (
          <EmptyState
            title={isParent ? "Sizda qarzdorlik yo'q" : "Qarzdorlar yo'q"}
            description={isParent ? "Barcha muolajalar to'lovlari to'liq va o'z vaqtida amalga oshirilgan. Rahmat!" : "Barcha balanslar muvozanatda"}
            icon={<TrendingDown className="w-5 h-5 text-green-500" />}
            className="py-16"
          />
        ) : (
          <div className="divide-y divide-warm-50">
            {debtors.map((d, i) => (
              <div key={d.childId} className="px-5 py-4 flex items-center gap-4 hover:bg-warm-50/50 transition-colors">
                <span className="text-sm font-bold text-charcoal-300 w-6 text-center flex-shrink-0">{i + 1}</span>
                <Avatar name={d.childName} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-charcoal-900">{d.childName}</p>
                  <p className="text-xs text-charcoal-400">{d.parentName}</p>
                  <div className="mt-1.5 max-w-[200px]">
                    <ProgressBar value={(d.debt / maxDebt) * 100} fillClassName="bg-danger-main" />
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 text-charcoal-400">
                  <Phone className="w-3.5 h-3.5" />
                  <span className="text-xs">{d.parentPhone}</span>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-base font-bold text-danger-main tabular-nums">{formatCurrencyCompact(d.debt)}</p>
                  {d.balance > 0 && <p className="text-xs text-green-600">Balans: {formatCurrencyCompact(d.balance)}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
