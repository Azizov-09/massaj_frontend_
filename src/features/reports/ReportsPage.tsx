// ═══════════════════════════════════════════════════════
//  Reports Page — Senior Medical/Wellness CRM Standard
//  Features: Filterable, Searchable, Paginated DataTable,
//  Mobile Card View, CSV/JSON Exports with UTF-8 BOM
// ═══════════════════════════════════════════════════════

import { useState, useMemo } from 'react';
import {
  FileText, Download, Users, CreditCard, Activity,
  CheckCircle2, Calendar, Filter, ArrowDownLeft,
  ArrowUpRight, AlertCircle, Search, X, Baby, Phone,
  Clock, XCircle
} from 'lucide-react';
import { useStore } from '@/store';
import {
  formatCurrency, formatDate, formatDateTime, cn
} from '@/utils';
import { Card, Select, DatePicker, Badge, EmptyState } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/KpiCard';
import { DataTable, Column, MobileCardConfig } from '@/components/tables/DataTable';

type ReportType = 'FINANCE' | 'ATTENDANCE' | 'SESSIONS' | 'CHILDREN';

interface FinanceRow {
  id: string;
  sana: string;
  turi: string;
  yonalish: 'Kirim' | 'Chiqim';
  miqdor: number;
  mijoz: string;
  bola: string;
  izoh: string;
}

interface AttendanceRow {
  id: string;
  sana: string;
  bola: string;
  mutaxassis: string;
  holat: string;
  izoh: string;
}

interface SessionsRow {
  id: string;
  boshlangan: string;
  bola: string;
  mutaxassis: string;
  xizmat: string;
  holat: string;
  kuzatuv: string;
}

interface ChildrenRow {
  id: string;
  ism: string;
  tugilganSana: string;
  jinsi: string;
  otaOna: string;
  telefon: string;
  bajarilganSeanslar: string;
  holat: string;
}

type AnyReportRow = FinanceRow | AttendanceRow | SessionsRow | ChildrenRow;

export function ReportsPage() {
  const transactions = useStore(s => s.transactions);
  const sessions = useStore(s => s.sessions);
  const children = useStore(s => s.children);
  const specialists = useStore(s => s.specialists);
  const services = useStore(s => s.services);
  const attendance = useStore(s => s.attendance);
  const parents = useStore(s => s.parents);

  const [reportType, setReportType] = useState<ReportType>('FINANCE');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [specialistFilter, setSpecialistFilter] = useState('');

  // 1. Raw filtered dataset based on date and specialist
  const rawReportData = useMemo(() => {
    switch (reportType) {
      case 'FINANCE':
        return transactions.filter(t => {
          const tDate = (t.date || '').split('T')[0];
          if (dateFrom && tDate && tDate < dateFrom) return false;
          if (dateTo && tDate && tDate > dateTo) return false;
          return true;
        }).map(t => {
          const parent = parents.find(p => p.id === t.parentId);
          const child = children.find(c => c.id === t.childId);
          return {
            id: t.id,
            sana: formatDateTime(t.date),
            turi: t.type || 'PAYMENT',
            yonalish: (t.direction === 'IN' ? 'Kirim' : 'Chiqim') as 'Kirim' | 'Chiqim',
            miqdor: t.amount || 0,
            mijoz: parent?.fullName ?? 'Markaz hisobiga',
            bola: child?.fullName ?? '—',
            izoh: t.description || '—',
          };
        });

      case 'ATTENDANCE':
        return attendance.filter(a => {
          const aDate = (a.date || '').split('T')[0];
          if (dateFrom && aDate && aDate < dateFrom) return false;
          if (dateTo && aDate && aDate > dateTo) return false;
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
            holat: a.status || 'ATTENDED',
            izoh: a.note || '—',
          };
        });

      case 'SESSIONS':
        return sessions.filter(s => {
          const sDate = (s.startTime || '').split('T')[0];
          if (dateFrom && sDate && sDate < dateFrom) return false;
          if (dateTo && sDate && sDate > dateTo) return false;
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
            holat: s.status || 'COMPLETED',
            kuzatuv: s.observation || s.note || '—',
          };
        });

      case 'CHILDREN':
        return children.map(c => {
          const parent = parents.find(p => p.id === c.parentId);
          const childSessions = sessions.filter(s => s.childId === c.id && s.status === 'COMPLETED').length;
          return {
            id: c.id,
            ism: c.fullName || '—',
            tugilganSana: formatDate(c.dateOfBirth),
            jinsi: c.gender === 'MALE' ? 'O‘g‘il' : 'Qiz',
            otaOna: parent?.fullName ?? '—',
            telefon: parent?.phone ?? '—',
            bajarilganSeanslar: `${childSessions} ta`,
            holat: c.status || 'ACTIVE',
          };
        });
    }
  }, [reportType, dateFrom, dateTo, specialistFilter, transactions, attendance, sessions, children, parents, specialists, services]);

  // 2. Search filtered dataset
  const filteredData = useMemo(() => {
    if (!search.trim()) return rawReportData;
    const q = search.toLowerCase();

    return rawReportData.filter(row => {
      return Object.values(row).some(val =>
        String(val ?? '').toLowerCase().includes(q)
      );
    });
  }, [rawReportData, search]);

  const hasActiveFilters = Boolean(search || dateFrom || dateTo || specialistFilter);

  const resetFilters = () => {
    setSearch('');
    setDateFrom('');
    setDateTo('');
    setSpecialistFilter('');
  };

  // 3. Export CSV handler with clean headers & UTF-8 BOM
  const handleExportCSV = () => {
    if (filteredData.length === 0) return;

    let headers: string[] = [];
    let rows: (string | number)[][] = [];

    if (reportType === 'FINANCE') {
      headers = ['ID', 'Sana', 'Operatsiya turi', 'Yo‘nalish', 'Summa (so‘m)', 'Mijoz', 'Bola', 'Tavsif'];
      rows = (filteredData as FinanceRow[]).map(r => [
        r.id,
        r.sana,
        r.turi,
        r.yonalish,
        r.miqdor,
        `"${r.mijoz.replace(/"/g, '""')}"`,
        `"${r.bola.replace(/"/g, '""')}"`,
        `"${r.izoh.replace(/"/g, '""')}"`,
      ]);
    } else if (reportType === 'ATTENDANCE') {
      headers = ['ID', 'Sana', 'Bola', 'Mutaxassis', 'Davomat holati', 'Izoh'];
      rows = (filteredData as AttendanceRow[]).map(r => [
        r.id,
        r.sana,
        `"${r.bola.replace(/"/g, '""')}"`,
        `"${r.mutaxassis.replace(/"/g, '""')}"`,
        r.holat,
        `"${r.izoh.replace(/"/g, '""')}"`,
      ]);
    } else if (reportType === 'SESSIONS') {
      headers = ['ID', 'Boshlangan vaqti', 'Bola', 'Mutaxassis', 'Xizmat turi', 'Holati', 'Kuzatuv'];
      rows = (filteredData as SessionsRow[]).map(r => [
        r.id,
        r.boshlangan,
        `"${r.bola.replace(/"/g, '""')}"`,
        `"${r.mutaxassis.replace(/"/g, '""')}"`,
        `"${r.xizmat.replace(/"/g, '""')}"`,
        r.holat,
        `"${r.kuzatuv.replace(/"/g, '""')}"`,
      ]);
    } else {
      headers = ['ID', 'Bola ismi', 'Tug‘ilgan sana', 'Jinsi', 'Ota-onasi', 'Telefon', 'Bajarilgan seanslar', 'Holati'];
      rows = (filteredData as ChildrenRow[]).map(r => [
        r.id,
        `"${r.ism.replace(/"/g, '""')}"`,
        r.tugilganSana,
        r.jinsi,
        `"${r.otaOna.replace(/"/g, '""')}"`,
        `"${r.telefon.replace(/"/g, '""')}"`,
        r.bajarilganSeanslar,
        r.holat,
      ]);
    }

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(row => row.join(','))].join('\r\n');
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

  // 4. Export JSON handler
  const handleExportJSON = () => {
    if (filteredData.length === 0) return;
    const jsonString = JSON.stringify(filteredData, null, 2);
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

  // 5. Columns definitions per report type
  const financeColumns: Column<FinanceRow>[] = [
    {
      key: 'id',
      header: 'Tranzaksiya',
      sortable: true,
      cell: (row) => (
        <div className="space-y-0.5">
          <span className="font-mono text-xs font-bold text-charcoal-800 tracking-tight">
            {row.id}
          </span>
          <div className="flex items-center gap-1.5 text-[11px] text-charcoal-400">
            <Calendar className="w-3 h-3" />
            <span>{row.sana}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'yonalish',
      header: 'Yo‘nalish',
      sortable: true,
      cell: (row) => (
        <span
          className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-[6px] text-xs font-semibold border",
            row.yonalish === 'Kirim'
              ? "bg-emerald-50 text-emerald-700 border-emerald-200/60"
              : "bg-brand-50 text-brand-800 border-brand-200/60"
          )}
        >
          {row.yonalish === 'Kirim' ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
          {row.yonalish}
        </span>
      ),
    },
    {
      key: 'turi',
      header: 'Operatsiya turi',
      sortable: true,
      cell: (row) => {
        const typeMap: Record<string, { label: string; className: string }> = {
          PAYMENT: { label: 'To‘lov', className: 'bg-emerald-50 text-emerald-700 border-emerald-200/60' },
          SESSION_CHARGE: { label: 'Seans haqi', className: 'bg-brand-50 text-brand-800 border-brand-200/60' },
          REFUND: { label: 'Qaytarish', className: 'bg-blue-50 text-blue-700 border-blue-200/60' },
          ADJUSTMENT: { label: 'Tuzatish', className: 'bg-warm-100 text-charcoal-700 border-warm-200' },
          EXPENSE: { label: 'Xarajat', className: 'bg-rose-50 text-rose-700 border-rose-200/60' },
        };
        const item = typeMap[row.turi] || { label: row.turi, className: 'bg-warm-100 text-charcoal-700 border-warm-200' };
        return (
          <span className={cn("inline-flex items-center px-2 py-0.5 rounded-[6px] text-xs font-semibold border", item.className)}>
            {item.label}
          </span>
        );
      },
    },
    {
      key: 'miqdor',
      header: 'Summa',
      sortable: true,
      cell: (row) => (
        <span
          className={cn(
            'font-bold text-xs tabular-nums inline-flex items-center px-2 py-0.5 rounded-[6px]',
            row.yonalish === 'Kirim'
              ? 'text-emerald-700 bg-emerald-50/70 border border-emerald-200/50'
              : 'text-charcoal-900 bg-warm-100/80 border border-warm-200/60'
          )}
        >
          {row.yonalish === 'Kirim' ? '+' : '-'}{formatCurrency(row.miqdor)}
        </span>
      ),
    },
    {
      key: 'mijoz',
      header: 'Mijoz (Ota-ona / Bola)',
      cell: (row) => (
        <div className="space-y-1">
          <span className="font-semibold text-xs text-charcoal-900 truncate max-w-[160px] block">
            {row.mijoz}
          </span>
          {row.bola && row.bola !== '—' && (
            <div className="inline-flex items-center gap-1 text-[11px] text-charcoal-500 bg-warm-100 px-1.5 py-0.5 rounded">
              <Baby className="w-2.5 h-2.5 text-charcoal-400" />
              <span className="truncate max-w-[120px]">{row.bola}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'izoh',
      header: 'Tavsif',
      cell: (row) => (
        <span className="text-xs text-charcoal-500 max-w-[200px] block truncate" title={row.izoh}>
          {row.izoh}
        </span>
      ),
    },
  ];

  const attendanceColumns: Column<AttendanceRow>[] = [
    {
      key: 'sana',
      header: 'Sana',
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-1.5 text-xs font-semibold text-charcoal-800">
          <Calendar className="w-3.5 h-3.5 text-brand-500" />
          <span>{row.sana}</span>
        </div>
      ),
    },
    {
      key: 'bola',
      header: 'Bola',
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-1.5">
          <Baby className="w-3.5 h-3.5 text-charcoal-400" />
          <span className="font-semibold text-xs text-charcoal-900">{row.bola}</span>
        </div>
      ),
    },
    {
      key: 'mutaxassis',
      header: 'Mutaxassis',
      sortable: true,
      cell: (row) => (
        <span className="text-xs font-medium text-charcoal-700">{row.mutaxassis}</span>
      ),
    },
    {
      key: 'holat',
      header: 'Holat',
      sortable: true,
      cell: (row) => {
        const statusMap: Record<string, { label: string; className: string }> = {
          PRESENT: { label: 'Keldi', className: 'bg-emerald-50 text-emerald-700 border-emerald-200/60' },
          ATTENDED: { label: 'Keldi', className: 'bg-emerald-50 text-emerald-700 border-emerald-200/60' },
          LATE: { label: 'Kechikdi', className: 'bg-amber-50 text-amber-700 border-amber-200/60' },
          ABSENT: { label: 'Sababli', className: 'bg-blue-50 text-blue-700 border-blue-200/60' },
          NO_SHOW: { label: 'Sababsiz', className: 'bg-rose-50 text-rose-700 border-rose-200/60' },
        };
        const item = statusMap[row.holat] || { label: row.holat, className: 'bg-warm-100 text-charcoal-700 border-warm-200' };
        return (
          <span className={cn("inline-flex items-center px-2 py-0.5 rounded-[6px] text-xs font-semibold border", item.className)}>
            {item.label}
          </span>
        );
      },
    },
    {
      key: 'izoh',
      header: 'Qayd / Izoh',
      cell: (row) => (
        <span className="text-xs text-charcoal-500 max-w-[220px] block truncate" title={row.izoh}>
          {row.izoh}
        </span>
      ),
    },
  ];

  const sessionsColumns: Column<SessionsRow>[] = [
    {
      key: 'boshlangan',
      header: 'Vaqti',
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-1.5 text-xs font-semibold text-charcoal-800">
          <Clock className="w-3.5 h-3.5 text-brand-500" />
          <span>{row.boshlangan}</span>
        </div>
      ),
    },
    {
      key: 'bola',
      header: 'Bola',
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-1.5">
          <Baby className="w-3.5 h-3.5 text-charcoal-400" />
          <span className="font-semibold text-xs text-charcoal-900">{row.bola}</span>
        </div>
      ),
    },
    {
      key: 'mutaxassis',
      header: 'Mutaxassis',
      sortable: true,
      cell: (row) => (
        <span className="text-xs font-medium text-charcoal-700">{row.mutaxassis}</span>
      ),
    },
    {
      key: 'xizmat',
      header: 'Xizmat turi',
      sortable: true,
      cell: (row) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-[6px] text-xs font-semibold bg-warm-100 text-charcoal-800 border border-warm-200">
          {row.xizmat}
        </span>
      ),
    },
    {
      key: 'holat',
      header: 'Holat',
      sortable: true,
      cell: (row) => {
        const statusMap: Record<string, { label: string; className: string }> = {
          COMPLETED: { label: 'Yakunlangan', className: 'bg-emerald-50 text-emerald-700 border-emerald-200/60' },
          IN_PROGRESS: { label: 'Jarayonda', className: 'bg-amber-50 text-amber-700 border-amber-200/60' },
          CANCELLED: { label: 'Bekor qilingan', className: 'bg-rose-50 text-rose-700 border-rose-200/60' },
        };
        const item = statusMap[row.holat] || { label: row.holat, className: 'bg-warm-100 text-charcoal-700 border-warm-200' };
        return (
          <span className={cn("inline-flex items-center px-2 py-0.5 rounded-[6px] text-xs font-semibold border", item.className)}>
            {item.label}
          </span>
        );
      },
    },
    {
      key: 'kuzatuv',
      header: 'Kuzatuv / Izoh',
      cell: (row) => (
        <span className="text-xs text-charcoal-500 max-w-[220px] block truncate" title={row.kuzatuv}>
          {row.kuzatuv}
        </span>
      ),
    },
  ];

  const childrenColumns: Column<ChildrenRow>[] = [
    {
      key: 'ism',
      header: 'Bola ismi',
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-1.5">
          <Baby className="w-3.5 h-3.5 text-brand-500" />
          <span className="font-semibold text-xs text-charcoal-900">{row.ism}</span>
        </div>
      ),
    },
    {
      key: 'tugilganSana',
      header: 'Tug‘ilgan sana',
      sortable: true,
      cell: (row) => (
        <span className="text-xs text-charcoal-600 tabular-nums">{row.tugilganSana}</span>
      ),
    },
    {
      key: 'jinsi',
      header: 'Jinsi',
      sortable: true,
      cell: (row) => (
        <span className={cn(
          "inline-flex items-center px-2 py-0.5 rounded-[6px] text-xs font-semibold border",
          row.jinsi === 'O‘g‘il'
            ? "bg-blue-50 text-blue-700 border-blue-200/60"
            : "bg-pink-50 text-pink-700 border-pink-200/60"
        )}>
          {row.jinsi}
        </span>
      ),
    },
    {
      key: 'otaOna',
      header: 'Ota-ona',
      sortable: true,
      cell: (row) => (
        <span className="text-xs font-medium text-charcoal-800">{row.otaOna}</span>
      ),
    },
    {
      key: 'telefon',
      header: 'Telefon',
      cell: (row) => (
        row.telefon && row.telefon !== '—' ? (
          <a
            href={`tel:${row.telefon}`}
            className="inline-flex items-center gap-1 text-xs text-emerald-700 hover:text-emerald-800 font-medium hover:underline"
          >
            <Phone className="w-3 h-3" />
            <span>{row.telefon}</span>
          </a>
        ) : (
          <span className="text-xs text-charcoal-400">—</span>
        )
      ),
    },
    {
      key: 'bajarilganSeanslar',
      header: 'Seanslar',
      sortable: true,
      cell: (row) => (
        <span className="font-bold text-xs tabular-nums text-charcoal-800 bg-warm-100 px-2 py-0.5 rounded border border-warm-200">
          {row.bajarilganSeanslar}
        </span>
      ),
    },
    {
      key: 'holat',
      header: 'Holat',
      sortable: true,
      cell: (row) => (
        <Badge variant={row.holat === 'ACTIVE' ? 'success' : 'neutral'} dot>
          {row.holat === 'ACTIVE' ? 'Faol' : row.holat}
        </Badge>
      ),
    },
  ];

  // 6. Mobile Card configurations per report type
  const mobileCardConfig = (row: AnyReportRow): MobileCardConfig => {
    if (reportType === 'FINANCE') {
      const r = row as FinanceRow;
      return {
        title: r.mijoz,
        subtitle: `${r.id} • ${r.sana}`,
        status: (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 px-2 py-0.5 rounded-[6px] text-xs font-bold border",
              r.yonalish === 'Kirim'
                ? "bg-emerald-50 text-emerald-700 border-emerald-200/60"
                : "bg-brand-50 text-brand-800 border-brand-200/60"
            )}
          >
            {r.yonalish === 'Kirim' ? '+' : '-'}{formatCurrency(r.miqdor)}
          </span>
        ),
        details: [
          { label: "Operatsiya turi", value: r.turi },
          { label: "Bola", value: r.bola },
          { label: "Yo'nalish", value: r.yonalish },
          { label: "Tavsif", value: r.izoh, fullWidth: true },
        ],
      };
    }

    if (reportType === 'ATTENDANCE') {
      const r = row as AttendanceRow;
      return {
        title: r.bola,
        subtitle: `${r.mutaxassis} • ${r.sana}`,
        status: (
          <Badge variant={r.holat === 'PRESENT' || r.holat === 'ATTENDED' ? 'success' : 'neutral'} dot>
            {r.holat}
          </Badge>
        ),
        details: [
          { label: "Mutaxassis", value: r.mutaxassis },
          { label: "Sana", value: r.sana },
          { label: "Qayd", value: r.izoh, fullWidth: true },
        ],
      };
    }

    if (reportType === 'SESSIONS') {
      const r = row as SessionsRow;
      return {
        title: r.bola,
        subtitle: `${r.xizmat} • ${r.boshlangan}`,
        status: (
          <Badge variant={r.holat === 'COMPLETED' ? 'success' : r.holat === 'IN_PROGRESS' ? 'warning' : 'neutral'} dot>
            {r.holat}
          </Badge>
        ),
        details: [
          { label: "Mutaxassis", value: r.mutaxassis },
          { label: "Xizmat", value: r.xizmat },
          { label: "Kuzatuv", value: r.kuzatuv, fullWidth: true },
        ],
      };
    }

    const r = row as ChildrenRow;
    return {
      title: r.ism,
      subtitle: `Ota-onasi: ${r.otaOna}`,
      status: (
        <Badge variant={r.holat === 'ACTIVE' ? 'success' : 'neutral'} dot>
          {r.holat === 'ACTIVE' ? 'Faol' : r.holat}
        </Badge>
      ),
      details: [
        { label: "Telefon", value: r.telefon },
        { label: "Tug'ilgan sana", value: r.tugilganSana },
        { label: "Jinsi", value: r.jinsi },
        { label: "Seanslar", value: r.bajarilganSeanslar },
      ],
    };
  };

  return (
    <div className="px-4 lg:px-6 py-6 max-w-[1600px] mx-auto space-y-5">
      {/* Page Header */}
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
            disabled={filteredData.length === 0}
            className="w-full sm:w-auto justify-center shadow-2xs font-semibold text-xs h-9"
          >
            CSV Eksport
          </Button>
          <Button
            variant="secondary"
            leftIcon={<FileText className="w-4 h-4" />}
            onClick={handleExportJSON}
            disabled={filteredData.length === 0}
            className="w-full sm:w-auto justify-center shadow-2xs font-semibold text-xs h-9"
          >
            JSON Eksport
          </Button>
        </div>
      </div>

      {/* Mobile Report Type Dropdown */}
      <div className="sm:hidden w-full">
        <Select
          size="sm"
          value={reportType}
          onChange={e => {
            setReportType(e.target.value as ReportType);
            setSearch('');
          }}
          triggerClassName="h-10 rounded-xl text-xs font-semibold border-warm-200 shadow-2xs w-full bg-white"
          options={REPORT_TABS.map(item => ({ value: item.type, label: item.label }))}
          aria-label="Hisobot turi"
        />
      </div>

      {/* Report Type Switcher Tabs — Desktop/tablet pills */}
      <div className="hidden sm:flex flex-wrap gap-2 pb-1 sm:pb-0">
        {REPORT_TABS.map(item => {
          const Icon = item.icon;
          const isActive = reportType === item.type;
          return (
            <button
              key={item.type}
              onClick={() => {
                setReportType(item.type);
                setSearch('');
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

      {/* Filter and Search Bar */}
      <Card className="p-3.5 border border-warm-200/90 shadow-xs">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div className="flex flex-1 flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-400 pointer-events-none" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Hisobot bo'yicha qidirish..."
                className="w-full h-9 pl-9 pr-8 text-xs border border-warm-300 rounded-[10px] bg-white shadow-2xs placeholder:text-charcoal-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition-all font-medium text-charcoal-800"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-charcoal-400 hover:text-charcoal-600 hover:bg-warm-100 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Date Range Filters (for transaction, attendance, session reports) */}
            {reportType !== 'CHILDREN' && (
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
            )}

            {/* Specialist filter for sessions and attendance */}
            {(reportType === 'SESSIONS' || reportType === 'ATTENDANCE') && (
              <div className="w-full sm:w-52">
                <Select
                  size="sm"
                  triggerClassName="h-9 rounded-[10px] text-xs shadow-2xs border-warm-300 w-full font-medium"
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

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="h-9 px-2.5 text-xs text-charcoal-500 hover:text-charcoal-800 w-full sm:w-auto"
              >
                Filtrni tozalash
              </Button>
            )}
          </div>

          <div className="flex items-center justify-between lg:justify-end gap-3 text-xs text-charcoal-500 shrink-0">
            <span>
              Shakllantirildi: <strong className="text-charcoal-900 font-bold">{filteredData.length}</strong> ta yozuv
            </span>
          </div>
        </div>
      </Card>

      {/* Main Paginated Data Table with Mobile Card View */}
      <Card className="overflow-hidden border border-warm-200/90 shadow-xs">
        {reportType === 'FINANCE' && (
          <DataTable
            data={filteredData as FinanceRow[]}
            columns={financeColumns}
            keyExtractor={r => r.id}
            tableClassName="min-w-[900px]"
            mobileCardConfig={mobileCardConfig as any}
            pageSize={10}
            stickyHeader
            emptyTitle="Moliyaviy ma'lumot topilmadi"
            emptyDescription="Tanlangan vaqt oralig'i yoki mezonlar bo‘yicha qaydlar mavjud emas."
            emptyIcon={<CreditCard className="w-6 h-6 text-charcoal-400" />}
            emptyAction={
              hasActiveFilters ? (
                <Button size="sm" variant="secondary" onClick={resetFilters} leftIcon={<X className="w-3.5 h-3.5" />}>
                  Filtrlarni tozalash
                </Button>
              ) : undefined
            }
          />
        )}

        {reportType === 'ATTENDANCE' && (
          <DataTable
            data={filteredData as AttendanceRow[]}
            columns={attendanceColumns}
            keyExtractor={r => r.id}
            tableClassName="min-w-[850px]"
            mobileCardConfig={mobileCardConfig as any}
            pageSize={10}
            stickyHeader
            emptyTitle="Davomat ma'lumotlari topilmadi"
            emptyDescription="Tanlangan vaqt oralig'i yoki mutaxassis bo‘yicha qaydlar mavjud emas."
            emptyIcon={<CheckCircle2 className="w-6 h-6 text-charcoal-400" />}
            emptyAction={
              hasActiveFilters ? (
                <Button size="sm" variant="secondary" onClick={resetFilters} leftIcon={<X className="w-3.5 h-3.5" />}>
                  Filtrlarni tozalash
                </Button>
              ) : undefined
            }
          />
        )}

        {reportType === 'SESSIONS' && (
          <DataTable
            data={filteredData as SessionsRow[]}
            columns={sessionsColumns}
            keyExtractor={r => r.id}
            tableClassName="min-w-[850px]"
            mobileCardConfig={mobileCardConfig as any}
            pageSize={10}
            stickyHeader
            emptyTitle="Seanslar hisoboti topilmadi"
            emptyDescription="Tanlangan filtr mezonlariga mos keluvchi seanslar mavjud emas."
            emptyIcon={<Activity className="w-6 h-6 text-charcoal-400" />}
            emptyAction={
              hasActiveFilters ? (
                <Button size="sm" variant="secondary" onClick={resetFilters} leftIcon={<X className="w-3.5 h-3.5" />}>
                  Filtrlarni tozalash
                </Button>
              ) : undefined
            }
          />
        )}

        {reportType === 'CHILDREN' && (
          <DataTable
            data={filteredData as ChildrenRow[]}
            columns={childrenColumns}
            keyExtractor={r => r.id}
            tableClassName="min-w-[850px]"
            mobileCardConfig={mobileCardConfig as any}
            pageSize={10}
            stickyHeader
            emptyTitle="Bolalar ro'yxati topilmadi"
            emptyDescription="Qidiruv bo'yicha hech qanday bola ma'lumoti topilmadi."
            emptyIcon={<Users className="w-6 h-6 text-charcoal-400" />}
            emptyAction={
              hasActiveFilters ? (
                <Button size="sm" variant="secondary" onClick={resetFilters} leftIcon={<X className="w-3.5 h-3.5" />}>
                  Filtrlarni tozalash
                </Button>
              ) : undefined
            }
          />
        )}

        {/* Footer Summary Notice */}
        {filteredData.length > 0 && (
          <div className="px-4 py-3 bg-warm-50/70 border-t border-warm-200/80 flex flex-wrap items-center justify-between gap-3 text-xs text-charcoal-500">
            <span>
              Jami: <strong className="text-charcoal-800 font-bold">{filteredData.length}</strong> ta hisobot qaydi
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
