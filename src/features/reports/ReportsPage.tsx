// ═══════════════════════════════════════════════════════
//  Reports Page — Multi-dimensional Reports & Exports
// ═══════════════════════════════════════════════════════

import { useState, useMemo } from 'react';
import {
  FileText, Download, Users,
  CreditCard, Activity, CheckCircle2
} from 'lucide-react';
import { useStore } from '@/store';
import { formatCurrency, formatDate } from '@/utils';
import { Card, Select } from '@/components/ui/primitives';
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
            sana: formatDate(t.date),
            turi: t.type,
            yonalish: t.direction === 'IN' ? 'Kirim' : 'Chiqim',
            miqdor: t.amount,
            mijoz: parent?.fullName ?? '—',
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
            boshlangan: formatDate(s.startTime),
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
            bajarilganSeanslar: childSessions,
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

  return (
    <div className="px-4 lg:px-6 py-6 max-w-[1600px] mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Tizimli hisobotlar"
          description="Barcha yo‘nalishlar bo‘yicha batafsil ma’lumotlar va eksport qilish moduli"
        />
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            leftIcon={<Download className="w-4 h-4" />}
            onClick={handleExportCSV}
          >
            CSV Yuklab olish
          </Button>
          <Button
            variant="secondary"
            leftIcon={<FileText className="w-4 h-4" />}
            onClick={handleExportJSON}
          >
            JSON Yuklab olish
          </Button>
        </div>
      </div>

      {/* Report Type Switcher */}
      <div className="flex flex-wrap gap-2">
        {[
          { type: 'FINANCE' as const, label: 'Moliyaviy hisobot', icon: CreditCard },
          { type: 'ATTENDANCE' as const, label: 'Davomat hisoboti', icon: CheckCircle2 },
          { type: 'SESSIONS' as const, label: 'Seanslar hisoboti', icon: Activity },
          { type: 'CHILDREN' as const, label: 'Bolalar ro‘yxati', icon: Users },
        ].map(item => {
          const Icon = item.icon;
          return (
            <button
              key={item.type}
              onClick={() => setReportType(item.type)}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all ${
                reportType === item.type
                  ? 'bg-brand-500 text-white shadow-sm shadow-brand-500/25 scale-[1.02]'
                  : 'bg-white border border-warm-200 text-charcoal-700 hover:border-brand-400'
              }`}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Filter strip */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-semibold text-charcoal-500">Filtrlar:</span>

            {/* Date Range */}
            <div className="flex items-center gap-1.5 text-xs">
              <input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                className="border border-warm-300 rounded-xl px-2.5 py-1.5 bg-white text-charcoal-700 outline-none"
              />
              <span className="text-charcoal-400">—</span>
              <input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                className="border border-warm-300 rounded-xl px-2.5 py-1.5 bg-white text-charcoal-700 outline-none"
              />
            </div>

            {/* Specialist filter for sessions and attendance */}
            {(reportType === 'SESSIONS' || reportType === 'ATTENDANCE') && (
              <div className="w-52">
                <Select
                  value={specialistFilter}
                  onChange={e => setSpecialistFilter(e.target.value)}
                  className="py-1 text-xs"
                >
                  <option value="">Barcha mutaxassislar</option>
                  {specialists.map(s => (
                    <option key={s.id} value={s.id}>{s.fullName}</option>
                  ))}
                </Select>
              </div>
            )}
          </div>

          <span className="text-xs text-charcoal-400">
            {reportData.length} ta yozuv shakllantirildi
          </span>
        </div>
      </Card>

      {/* Live Preview Table */}
      <Card className="overflow-x-auto">
        {reportData.length === 0 ? (
          <div className="p-12 text-center text-charcoal-400 text-sm">
            Tanlangan mezonlar bo‘yicha hisobot ma’lumotlari topilmadi.
          </div>
        ) : (
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-warm-50/80 border-b border-warm-200">
                {Object.keys(reportData[0]).map(key => (
                  <th key={key} className="py-3 px-4 font-bold text-charcoal-700 uppercase tracking-wider text-[11px]">
                    {key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-warm-100">
              {reportData.slice(0, 50).map((row, idx) => (
                <tr key={idx} className="hover:bg-warm-50/50 transition-colors">
                  {Object.values(row).map((val, i) => (
                    <td key={i} className="py-3 px-4 text-charcoal-800 font-medium">
                      {typeof val === 'number' && String(val).length >= 5 ? formatCurrency(val) : String(val ?? '—')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
