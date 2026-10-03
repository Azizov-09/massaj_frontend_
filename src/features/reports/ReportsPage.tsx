// ═══════════════════════════════════════════════════════
//  Reports Page — Senior Medical/Wellness CRM Table standard
// ═══════════════════════════════════════════════════════

import { useState, useMemo } from 'react';
import {
  FileText, Download, Users, CreditCard, Activity,
  CheckCircle2, Calendar, Filter, ArrowDownLeft,
  ArrowUpRight, AlertCircle
} from 'lucide-react';
import { useStore } from '@/store';
import {
  formatCurrency, formatCurrencyCompact, formatDate,
  formatDateTime, cn
} from '@/utils';
import { Card, Select, DatePicker, Badge, EmptyState } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/KpiCard';

type ReportType = 'FINANCE' | 'ATTENDANCE' | 'SESSIONS' | 'CHILDREN';

export function ReportsPage() {
  const transactions = useStore(s => s.transactions);
  const sessions = useStore(s => s.sessions);
  const children = useStore(s => s.children);
  const specialists = useStore(s => s.specialists);
  const services = useStore(s => s.services);
  const attendance = useStore(s => s.attendance);
  const parents = useStore(s => s.parents);

  const [reportType, setReportType] = useState<ReportType>('FINANCE');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [specialistFilter, setSpecialistFilter] = useState('');

  // Generated report data based on reportType
  const reportData = useMemo(() => {
    switch (reportType) {
      case 'FINANCE':
        return transactions.filter(t => {
          if (dateFrom && t.date.split('T')[0] < dateFrom) return false;
          if (dateTo && t.date.split('T')[0] > dateTo) return false;
          return true;
        }).map(t => {
          const parent = parents.find(p => p.id === t.parentId);
          const child = children.find(c => c.id === t.childId);
          return {
            id: t.id,
            sana: formatDateTime(t.date),
            turi: t.type,
            yonalish: t.direction === 'IN' ? 'Kirim' : 'Chiqim',
            miqdor: t.amount,
            mijoz: parent?.fullName ?? 'Markaz hisobiga',
            bola: child?.fullName ?? '—',
            izoh: t.description || '—',
          };
        });

      case 'ATTENDANCE':
        return attendance.filter(a => {
          if (dateFrom && a.date < dateFrom) return false;
          if (dateTo && a.date > dateTo) return false;
          if (specialistFilter && a.specialistId !== specialistFilter) return false;
          return true;
        }).map(a => {
          const child = children.find(c => c.id === a.childId);
          const spec = specialists.find(s => s.id === a.specialistId);
          return {
            id: a.id,
            sana: formatDate(a.date),
            bola: child?.fullName ?? '—',
            mutaxassis: spec?.fullName ?? '—',
            holat: a.status,
            izoh: a.note || '—',
          };
        });

      case 'SESSIONS':
        return sessions.filter(s => {
          const sDate = s.startTime.split('T')[0];
          if (dateFrom && sDate < dateFrom) return false;
          if (dateTo && sDate > dateTo) return false;
          if (specialistFilter && s.specialistId !== specialistFilter) return false;
          return true;
        }).map(s => {
          const child = children.find(c => c.id === s.childId);
          const spec = specialists.find(sp => sp.id === s.specialistId);
          const svc = services.find(sv => sv.id === s.serviceId);
          return {
            id: s.id,
            boshlangan: formatDateTime(s.startTime),
            bola: child?.fullName ?? '—',
            mutaxassis: spec?.fullName ?? '—',
            xizmat: svc?.name ?? '—',
            holat: s.status,
            kuzatuv: s.observation || s.note || '—',
          };
        });

      case 'CHILDREN':
        return children.map(c => {
          const parent = parents.find(p => p.id === c.parentId);
          const childSessions = sessions.filter(s => s.childId === c.id && s.status === 'COMPLETED').length;
          return {
            id: c.id,
            ism: c.fullName,
            tugilganSana: formatDate(c.dateOfBirth),
            jinsi: c.gender === 'MALE' ? 'O‘g‘il' : 'Qiz',
            otaOna: parent?.fullName ?? '—',
            telefon: parent?.phone ?? '—',
            bajarilganSeanslar: `${childSessions} ta`,
            holat: c.status,
          };
        });
    }
  }, [reportType, dateFrom, dateTo, specialistFilter, transactions, attendance, sessions, children, parents, specialists, services]);

  const handleExportCSV = () => {
    if (reportData.length === 0) return;
    const keys = Object.keys(reportData[0]);
    const headerRow = keys.join(',');
    const bodyRows = reportData.map(row =>
      keys.map(k => {
        const val = String((row as Record<string, unknown>)[k] ?? '');
        return `"${val.replace(/"/g, '""')}"`;
      }).join(',')
    );
    const csvContent = '\uFEFF' + [headerRow, ...bodyRows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${reportType.toLowerCase()}_hisobot_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    if (reportData.length === 0) return;
    const jsonString = JSON.stringify(reportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${reportType.toLowerCase()}_hisobot_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const REPORT_TABS = [
    { type: 'FINANCE' as const, label: 'Moliyaviy hisobot', icon: CreditCard },
    { type: 'ATTENDANCE' as const, label: 'Davomat hisoboti', icon: CheckCircle2 },
    { type: 'SESSIONS' as const, label: 'Seanslar hisoboti', icon: Activity },
    { type: 'CHILDREN' as const, label: 'Bolalar ro‘yxati', icon: Users },
  ];

  return (
    <div className="px-4 lg:px-6 py-6 max-w-[1600px] mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Tizimli hisobotlar va tahlillar"
          description="Barcha yo‘nalishlar bo‘yicha batafsil ma’lumotlar va eksport qilish moduli"
        />
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
          <Button
            variant="secondary"
            leftIcon={<Download className="w-4 h-4" />}
            onClick={handleExportCSV}
            disabled={reportData.length === 0}
            className="w-full sm:w-auto justify-center"
          >
            CSV Eksport
          </Button>
          <Button
            variant="secondary"
            leftIcon={<FileText className="w-4 h-4" />}
            onClick={handleExportJSON}
            disabled={reportData.length === 0}
            className="w-full sm:w-auto justify-center"
          >
            JSON Eksport
          </Button>
        </div>
      </div>

      {/* Report Type Switcher Tabs */}
      <div className="flex flex-nowrap sm:flex-wrap overflow-x-auto touch-scroll-x scrollbar-thin gap-2 pb-1 sm:pb-0 -mx-0.5 px-0.5">
        {REPORT_TABS.map(item => {
          const Icon = item.icon;
          const isActive = reportType === item.type;
          return (
            <button
              key={item.type}
              onClick={(e) => {
                setReportType(item.type);
                e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
              }}
              className={cn(
                "px-3.5 py-2 rounded-[10px] font-semibold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 select-none",
                isActive
                  ? "bg-brand-600 text-white shadow-xs"
                  : "bg-white border border-warm-200/90 text-charcoal-700 hover:border-brand-300 hover:bg-warm-50/50"
              )}
            >
              <Icon className={cn("w-4 h-4", isActive ? "text-white" : "text-brand-600")} />
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Filter strip */}
      <Card className="p-4 border border-warm-200/90 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
            <span className="text-xs font-semibold text-charcoal-500 whitespace-nowrap">Filtr parametrlar:</span>

            {/* Date Range */}
            <div className="flex items-center gap-1.5 text-xs w-full sm:w-auto">
              <div className="flex-1 sm:w-36">
                <DatePicker
                  size="sm"
                  triggerClassName="h-9 rounded-[10px] text-xs shadow-2xs border-warm-300 w-full"
                  value={dateFrom}
                  onChange={e => setDateFrom(e.target.value)}
                  placeholder="Dan boshlab"
                  aria-label="Boshlanish sanasi"
                />
              </div>
              <span className="text-charcoal-400 shrink-0">—</span>
              <div className="flex-1 sm:w-36">
                <DatePicker
                  size="sm"
                  triggerClassName="h-9 rounded-[10px] text-xs shadow-2xs border-warm-300 w-full"
                  value={dateTo}
                  onChange={e => setDateTo(e.target.value)}
                  placeholder="Gacha"
                  aria-label="Tugash sanasi"
                />
              </div>
            </div>

            {/* Specialist filter for sessions and attendance */}
            {(reportType === 'SESSIONS' || reportType === 'ATTENDANCE') && (
              <div className="w-full sm:w-56">
                <Select
                  size="sm"
                  triggerClassName="h-9 rounded-[10px] text-xs shadow-2xs border-warm-300 w-full"
                  value={specialistFilter}
                  onChange={e => setSpecialistFilter(e.target.value)}
                  options={[
                    { value: '', label: 'Barcha mutaxassislar' },
                    ...specialists.map(s => ({ value: s.id, label: s.fullName })),
                  ]}
                  aria-label="Mutaxassis bo'yicha filter"
                />
              </div>
            )}
          </div>

          <span className="text-xs text-charcoal-500 font-medium">
            Shakllantirildi: <strong className="text-charcoal-900 font-bold">{reportData.length}</strong> ta yozuv
          </span>
        </div>
      </Card>

      {/* Live Preview Table */}
      <Card className="overflow-hidden border border-warm-200/90 shadow-xs">
        {reportData.length === 0 ? (
          <EmptyState
            title="Hisobot ma'lumotlari topilmadi"
            description="Tanlangan vaqt oralig'i yoki mezonlar bo‘yicha qaydlar mavjud emas."
            icon={<FileText className="w-6 h-6 text-charcoal-400" />}
            className="py-16"
          />
        ) : (
          <div className="overflow-x-auto touch-scroll-x scrollbar-thin">
            <table className="w-full text-left text-xs border-collapse min-w-[850px]">
              <thead>
                <tr className="bg-warm-100/70 border-b border-warm-200/90">
                  {Object.keys(reportData[0]).map(key => (
                    <th
                      key={key}
                      className="py-3 px-4 font-bold text-charcoal-700 uppercase tracking-wider text-[11px]"
                    >
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-100 bg-white">
                {reportData.slice(0, 100).map((row, idx) => (
                  <tr key={idx} className="hover:bg-brand-50/20 transition-colors">
                    {Object.entries(row).map(([key, val], i) => {
                      // Formatting helper
                      const isAmount = key === 'miqdor' && typeof val === 'number';
                      const isDirection = key === 'yonalish';
                      const isStatus = key === 'holat';

                      return (
                        <td key={i} className="py-3 px-4 text-charcoal-800 font-medium">
                          {isAmount ? (
                            <span className="font-bold tabular-nums text-emerald-700">
                              {formatCurrency(val as number)}
                            </span>
                          ) : isDirection ? (
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 px-2 py-0.5 rounded-[6px] text-xs font-semibold border",
                                val === 'Kirim'
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200/60"
                                  : "bg-brand-50 text-brand-800 border-brand-200/60"
                              )}
                            >
                              {val === 'Kirim' ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                              {String(val)}
                            </span>
                          ) : isStatus ? (
                            <Badge dot>{String(val)}</Badge>
                          ) : (
                            <span className="truncate max-w-[200px] block">
                              {String(val ?? '—')}
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer Summary */}
        {reportData.length > 0 && (
          <div className="px-4 py-3 bg-warm-50/70 border-t border-warm-200/80 flex flex-wrap items-center justify-between gap-3 text-xs text-charcoal-500">
            <span>
              Ko‘rsatilmoqda: <strong className="text-charcoal-800 font-semibold">{Math.min(100, reportData.length)}</strong> / {reportData.length} ta yozuv
            </span>
            <span className="text-[11px] text-charcoal-400">
              To'liq ma'lumotlarni CSV yoki JSON formatida yuklab olishingiz mumkin
            </span>
          </div>
        )}
      </Card>
    </div>
  );
}
