import { useMemo } from 'react';
import { TrendingDown, Phone, Users, DollarSign, AlertCircle } from 'lucide-react';
import { useStore, useAuth } from '@/store';
import { getTopDebtors } from '@/services/finance.service';
import { formatCurrencyCompact } from '@/utils';
import { Card, Avatar, EmptyState, ProgressBar } from '@/components/ui/primitives';
import { PageHeader, KpiCard } from '@/components/ui/KpiCard';

export function DebtorsPage() {
  const { currentUser } = useAuth();
  const transactions = useStore(s => s.transactions);
  const children = useStore(s => s.children);
  const parents = useStore(s => s.parents);

  const isParent = currentUser?.role === 'PARENT';
  const allDebtors = useMemo(() => getTopDebtors(transactions, children, parents, 100), [transactions, children, parents]);
  const debtors = useMemo(() => {
    if (isParent && currentUser) {
      return allDebtors.filter(d => d.parentId === currentUser.id);
    }
    return allDebtors;
  }, [allDebtors, isParent, currentUser]);

  const totalDebt = debtors.reduce((s, d) => s + d.debt, 0);
  const maxDebt = Math.max(...debtors.map(d => d.debt), 1);
  const avgDebt = debtors.length > 0 ? Math.round(totalDebt / debtors.length) : 0;

  return (
    <div className="px-4 lg:px-6 py-6 max-w-[1600px] mx-auto space-y-5">
      <PageHeader
        title={isParent ? "Qarzdorlik holati" : "Qarzdorlar"}
        description={isParent ? "Hisob-kitob va qarzdorlik bo'yicha ma'lumot" : "Balans va qarz holati"}
      />

      {isParent ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <KpiCard label="Sizning qarzingiz" value={totalDebt} format="currency" icon={<TrendingDown className="w-4 h-4 text-rose-600" />} accentColor="danger" index={0} />
          <KpiCard label="Qarz bo'lgan bolalar" value={debtors.length} icon={<Users className="w-4 h-4 text-amber-600" />} accentColor="gold" index={1} />
          <KpiCard label="Status" value={totalDebt > 0 ? "Qarzdorlik mavjud" : "Qarz yo'q"} format="text" icon={<AlertCircle className="w-4 h-4 text-brand-600" />} accentColor="brand" index={2} />
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <KpiCard label="Jami qarz" value={totalDebt} format="currency" description="Umumiy qarz summasi" icon={<TrendingDown className="w-4 h-4 text-rose-600" />} accentColor="danger" index={0} />
          <KpiCard label="Qarzdorlar soni" value={debtors.length} description="Qarzdor mijozlar" icon={<Users className="w-4 h-4 text-amber-600" />} accentColor="gold" index={1} />
          <KpiCard label="O'rtacha qarz" value={avgDebt} format="currency" description="Har bir mijozga" icon={<DollarSign className="w-4 h-4 text-blue-600" />} accentColor="blue" index={2} />
          <KpiCard label="Maksimal qarz" value={maxDebt} format="currency" description="Eng katta qarzdorlik" icon={<AlertCircle className="w-4 h-4 text-brand-600" />} accentColor="brand" index={3} />
        </div>
      )}

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
