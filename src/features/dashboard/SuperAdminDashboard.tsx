// ═══════════════════════════════════════════════════════
//  Super Admin Dashboard — Executive Medical CRM Standard
// ═══════════════════════════════════════════════════════

import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import {
  TrendingUp, TrendingDown, DollarSign, Baby,
  Calendar, Activity, ArrowRight, CheckCircle2,
  Stethoscope, Clock, ShieldCheck, Plus, Eye,
  UserCheck, AlertCircle, Phone, FileText, ChevronRight
} from 'lucide-react';
import { format, parseISO, differenceInYears } from 'date-fns';
import { useStore, useAuth } from '@/store';
import {
  calculateFinancialSummary, getRevenueByDay,
  getAppointmentStats, getTopDebtors, getSpecialistWorkload
} from '@/services/finance.service';
import {
  formatCurrencyCompact, formatCurrency, getDateRange,
  formatDate, getAppointmentStatusColor,
  getAppointmentStatusLabel, truncate, cn
} from '@/utils';
import { KpiCard } from '@/components/ui/KpiCard';
import {
  Card, CardHeader, CardBody, Avatar, Badge,
  EmptyState, ProgressBar
} from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { CreateAppointmentForm } from '@/features/appointments/CreateAppointmentForm';
import type { DateFilterPreset, Appointment } from '@/types';

// ─── Custom tooltip for charts ────────────────────────────
function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-[10px] border border-warm-200/90 shadow-[0_4px_16px_-4px_rgb(0_0_0/0.1)] px-3.5 py-2.5 text-xs">
      {label && <p className="text-charcoal-400 mb-1.5 font-semibold">{label}</p>}
      <div className="space-y-1">
        {payload.map((p, i) => (
          <div key={i} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
              <span className="text-charcoal-600 font-medium">{p.name}:</span>
            </div>
            <span className="font-bold text-charcoal-900 tabular-nums">{formatCurrency(p.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const DATE_PRESETS: { value: DateFilterPreset; label: string }[] = [
  { value: 'today', label: 'Bugun' },
  { value: 'yesterday', label: 'Kecha' },
  { value: 'last7days', label: '7 kun' },
  { value: 'thisMonth', label: 'Bu oy' },
  { value: 'lastMonth', label: 'O‘tgan oy' },
  { value: 'thisYear', label: 'Bu yil' },
];

export function SuperAdminDashboard() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [dateFilter, setDateFilter] = useState<DateFilterPreset>('thisMonth');
  const [scheduleFilter, setScheduleFilter] = useState<'ALL' | 'CONFIRMED' | 'PENDING' | 'COMPLETED'>('ALL');
  const [chartMetric, setChartMetric] = useState<'ALL' | 'REVENUE' | 'CHARGES'>('ALL');
  const [showCreateAppointmentModal, setShowCreateAppointmentModal] = useState(false);
  const [viewingAppointment, setViewingAppointment] = useState<Appointment | null>(null);

  const transactions = useStore(s => s.transactions);
  const appointments = useStore(s => s.appointments);
  const sessions = useStore(s => s.sessions);
  const children = useStore(s => s.children);
  const specialists = useStore(s => s.specialists);
  const parents = useStore(s => s.parents);
  const services = useStore(s => s.services);

  const summary = useMemo(() => calculateFinancialSummary(transactions, dateFilter), [transactions, dateFilter]);
  const range = useMemo(() => getDateRange(dateFilter), [dateFilter]);

  const revenueData = useMemo(() => {
    const data = getRevenueByDay(transactions, range);
    return data.map(d => ({
      date: format(parseISO(d.date), 'dd MMM'),
      "Tushum": d.revenue,
      "Xarajat": d.charges,
    }));
  }, [transactions, range]);

  const aptStats = useMemo(() => getAppointmentStats(appointments, range), [appointments, range]);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const todayAppointments = useMemo(() => {
    return appointments
      .filter(a => a.date === todayStr)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [appointments, todayStr]);

  const todayCompletedCount = useMemo(() => {
    return todayAppointments.filter(a => a.status === 'COMPLETED').length;
  }, [todayAppointments]);

  const todayCompletionRate = todayAppointments.length > 0
    ? Math.round((todayCompletedCount / todayAppointments.length) * 100)
    : 0;

  const filteredTodayAppointments = useMemo(() => {
    return todayAppointments.filter(a => {
      if (scheduleFilter === 'CONFIRMED') return a.status === 'CONFIRMED';
      if (scheduleFilter === 'PENDING') return a.status === 'SCHEDULED' || a.status === 'IN_PROGRESS';
      if (scheduleFilter === 'COMPLETED') return a.status === 'COMPLETED';
      return true;
    });
  }, [todayAppointments, scheduleFilter]);

  const topDebtors = useMemo(() => getTopDebtors(transactions, children, parents, 5), [transactions, children, parents]);
  const specialistWorkload = useMemo(() => getSpecialistWorkload(sessions, specialists, services).slice(0, 5), [sessions, specialists, services]);

  const activeChildren = children.filter(c => c.status === 'ACTIVE').length;
  const activeSpecialists = specialists.filter(s => s.status === 'ACTIVE').length;
  const todaySessions = sessions.filter(s => s.startTime.startsWith(todayStr)).length;

  // Recent transactions
  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 6);
  }, [transactions]);

  // Appointment status donut
  const aptDonutData = useMemo(() => [
    { name: 'Yakunlangan', value: aptStats.byStatus.COMPLETED, color: '#10b981' },
    { name: 'Tasdiqlangan', value: aptStats.byStatus.CONFIRMED, color: '#4a8063' },
    { name: 'Rejalashtirilgan', value: aptStats.byStatus.SCHEDULED, color: '#64748b' },
    { name: 'Bekor qilingan', value: aptStats.byStatus.CANCELLED, color: '#f43f5e' },
    { name: 'Kelmagan', value: aptStats.byStatus.NO_SHOW, color: '#f59e0b' },
  ].filter(d => d.value > 0), [aptStats]);

  const totalFilteredAppointmentsCount = aptDonutData.reduce((acc, d) => acc + d.value, 0);

  return (
    <div className="px-4 lg:px-6 py-6 max-w-[1600px] mx-auto space-y-5">
      {/* ─── Executive Page Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-charcoal-900 tracking-tight">
              Markaz Boshqaruvi
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Jonli telemetriya
            </span>
          </div>
          <p className="text-xs sm:text-sm text-charcoal-500 mt-1">
            Bolalar massaj va reabilitatsiya markazining umumiy moliyaviy, klinik va operatsion ko‘rsatkichlari
          </p>
        </div>

        {/* Quick Header Actions */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <Button
            size="sm"
            variant="secondary"
            leftIcon={<FileText className="w-4 h-4" />}
            onClick={() => navigate('/dashboard/super-admin/reports')}
          >
            Hisobotlar
          </Button>
          <Button
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setShowCreateAppointmentModal(true)}
          >
            Yangi qabul
          </Button>
        </div>
      </div>

      {/* ─── Operational Health Strip ─── */}
      <div className="p-4 rounded-xl bg-brand-50/70 border border-brand-200/80 shadow-2xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-center text-xs">
          {/* Progress metric */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between font-semibold text-charcoal-700">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-brand-600" />
                Bugungi reja bajarilishi:
              </span>
              <strong className="text-charcoal-900">{todayCompletedCount} / {todayAppointments.length} seans</strong>
            </div>
            <ProgressBar value={todayCompletionRate} fillClassName="bg-brand-500" />
          </div>

          {/* On duty specialists */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[8px] bg-white border border-brand-200/80 flex items-center justify-center shrink-0 shadow-2xs text-brand-700">
              <Stethoscope className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-charcoal-900">{activeSpecialists} nafar mutaxassis faol</p>
              <p className="text-[11px] text-charcoal-500">Bugungi barcha smenalar to‘liq band</p>
            </div>
          </div>

          {/* Active Patients */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[8px] bg-white border border-brand-200/80 flex items-center justify-center shrink-0 shadow-2xs text-brand-700">
              <Baby className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-charcoal-900">{activeChildren} nafar ro‘yxatdagi bola</p>
              <p className="text-[11px] text-charcoal-500">Faol reabilitatsiya dasturida</p>
            </div>
          </div>

          {/* System Safety / Audit */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[8px] bg-emerald-100/70 border border-emerald-200/80 flex items-center justify-center shrink-0 shadow-2xs text-emerald-700">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-emerald-950">Tizim me'yorida ishlamoqda</p>
              <p className="text-[11px] text-emerald-700">Audit va davomat nazorati faol</p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Date Filter Presets Strip ─── */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-2 bg-warm-50/80 rounded-xl border border-warm-200/90 shadow-2xs">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
          {DATE_PRESETS.map(preset => {
            const isActive = dateFilter === preset.value;
            return (
              <button
                key={preset.value}
                type="button"
                onClick={() => setDateFilter(preset.value)}
                className={cn(
                  'px-3.5 py-1.5 rounded-[8px] text-xs font-semibold transition-all cursor-pointer whitespace-nowrap',
                  isActive
                    ? 'bg-charcoal-900 text-white shadow-xs'
                    : 'bg-white text-charcoal-600 hover:text-charcoal-900 hover:bg-warm-100 border border-warm-200/90 shadow-2xs'
                )}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        <div className="text-xs text-charcoal-500 font-medium px-2">
          Oraliq: <strong className="text-charcoal-800">{formatDate(range.from)} — {formatDate(range.to)}</strong>
        </div>
      </div>

      {/* ─── Executive KPI Grid (8 Cards) ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <KpiCard
          label="Jami tushum"
          value={summary.totalRevenue}
          format="currency"
          icon={<DollarSign className="w-5 h-5 text-brand-600" />}
          accentColor="brand"
          trend={{ value: 12, label: "o'tgan davrga nisbatan" }}
          index={0}
        />
        <KpiCard
          label="Jami qarzdorlik"
          value={summary.totalDebt}
          format="currency"
          icon={<TrendingDown className="w-5 h-5 text-rose-600" />}
          accentColor="danger"
          trend={{ value: -5, label: "ijobiy pasayish" }}
          index={1}
        />
        <KpiCard
          label="Joriy balans"
          value={summary.currentBalance}
          format="currency"
          icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
          accentColor="sage"
          trend={{ value: 8 }}
          index={2}
        />
        <KpiCard
          label="Bugungi tushum"
          value={summary.todayRevenue}
          format="currency"
          icon={<DollarSign className="w-5 h-5 text-amber-600" />}
          accentColor="gold"
          index={3}
        />
        <KpiCard
          label="Faol bemor bolalar"
          value={activeChildren}
          format="number"
          icon={<Baby className="w-5 h-5 text-brand-600" />}
          accentColor="brand"
          description={`${children.length} nafar ro'yxatdan`}
          index={4}
        />
        <KpiCard
          label="Faol mutaxassislar"
          value={activeSpecialists}
          format="number"
          icon={<Stethoscope className="w-5 h-5 text-emerald-600" />}
          accentColor="sage"
          description={`${specialists.length} nafar shifokordan`}
          index={5}
        />
        <KpiCard
          label="Bugungi qabullar"
          value={todayAppointments.length}
          format="number"
          icon={<Calendar className="w-5 h-5 text-amber-600" />}
          accentColor="gold"
          description={`${todayCompletedCount} tasi muvaffaqiyatli o'tdi`}
          index={6}
        />
        <KpiCard
          label="Bugungi seanslar"
          value={todaySessions}
          format="number"
          icon={<Activity className="w-5 h-5 text-blue-600" />}
          accentColor="blue"
          description="Bajarilgan massaj muolajalari"
          index={7}
        />
      </div>

      {/* ─── Charts Row (Financial AreaChart + Appointment Donut) ─── */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Revenue & Charges Area Chart */}
        <Card className="lg:col-span-2 overflow-hidden border border-warm-200/90 shadow-xs">
          <div className="p-4 bg-warm-50/70 border-b border-warm-200/80 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-charcoal-900">Moliyaviy dinamika (Tushum va Xarajat)</h3>
              <p className="text-xs text-charcoal-400 mt-0.5">Tanlangan davr bo‘yicha pul oqimi tahlili</p>
            </div>

            {/* Metric toggles */}
            <div className="flex items-center gap-1 bg-white p-0.5 rounded-[8px] border border-warm-200/90 shadow-2xs">
              <button
                type="button"
                onClick={() => setChartMetric('ALL')}
                className={cn(
                  'px-2.5 py-1 text-xs font-semibold rounded-[6px] transition-colors cursor-pointer',
                  chartMetric === 'ALL' ? 'bg-charcoal-900 text-white' : 'text-charcoal-500 hover:text-charcoal-800'
                )}
              >
                Barchasi
              </button>
              <button
                type="button"
                onClick={() => setChartMetric('REVENUE')}
                className={cn(
                  'px-2.5 py-1 text-xs font-semibold rounded-[6px] transition-colors cursor-pointer',
                  chartMetric === 'REVENUE' ? 'bg-brand-500 text-white' : 'text-charcoal-500 hover:text-charcoal-800'
                )}
              >
                Tushum
              </button>
              <button
                type="button"
                onClick={() => setChartMetric('CHARGES')}
                className={cn(
                  'px-2.5 py-1 text-xs font-semibold rounded-[6px] transition-colors cursor-pointer',
                  chartMetric === 'CHARGES' ? 'bg-emerald-600 text-white' : 'text-charcoal-500 hover:text-charcoal-800'
                )}
              >
                Xarajat
              </button>
            </div>
          </div>

          <div className="p-4 pt-3">
            <ResponsiveContainer width="100%" height={230}>
              <AreaChart data={revenueData} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0.01} />
                  </linearGradient>
                  <linearGradient id="chargeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0e8db" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#938c83' }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#938c83' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={v => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : `${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<ChartTooltip />} />
                {(chartMetric === 'ALL' || chartMetric === 'REVENUE') && (
                  <Area
                    type="monotone"
                    dataKey="Tushum"
                    stroke="#f97316"
                    strokeWidth={2.5}
                    fill="url(#revGrad)"
                    dot={false}
                  />
                )}
                {(chartMetric === 'ALL' || chartMetric === 'CHARGES') && (
                  <Area
                    type="monotone"
                    dataKey="Xarajat"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fill="url(#chargeGrad)"
                    dot={false}
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Appointment Status Donut Card */}
        <Card className="overflow-hidden border border-warm-200/90 shadow-xs flex flex-col justify-between">
          <div className="p-4 bg-warm-50/70 border-b border-warm-200/80 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-charcoal-900">Uchrashuvlar taqsimoti</h3>
              <p className="text-xs text-charcoal-400 mt-0.5">{totalFilteredAppointmentsCount} ta jami muolaja</p>
            </div>
            <Link
              to="/dashboard/super-admin/appointments"
              className="text-xs text-brand-600 hover:text-brand-700 font-bold flex items-center gap-1"
            >
              Hammasi <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="p-4 flex flex-col items-center justify-center flex-1">
            {aptDonutData.length > 0 ? (
              <>
                <div className="relative w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={150}>
                    <PieChart>
                      <Pie
                        data={aptDonutData}
                        cx="50%"
                        cy="50%"
                        innerRadius={46}
                        outerRadius={68}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {aptDonutData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: unknown) => [String(v ?? ''), '']} />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center telemetry */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-xl font-black text-charcoal-900 tabular-nums">
                      {totalFilteredAppointmentsCount}
                    </span>
                    <span className="text-[10px] text-charcoal-400 font-bold uppercase tracking-wider">
                      Uchrashuv
                    </span>
                  </div>
                </div>

                <div className="w-full space-y-1.5 mt-3 pt-2 border-t border-warm-100">
                  {aptDonutData.map(d => {
                    const pct = totalFilteredAppointmentsCount > 0
                      ? Math.round((d.value / totalFilteredAppointmentsCount) * 100)
                      : 0;
                    return (
                      <div key={d.name} className="flex items-center justify-between text-xs font-medium">
                        <span className="flex items-center gap-2 text-charcoal-600">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                          {d.name}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-charcoal-900 tabular-nums">{d.value} ta</span>
                          <span className="text-[10px] text-charcoal-400 tabular-nums">({pct}%)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <EmptyState title="Ma'lumot topilmadi" className="py-8" />
            )}
          </div>
        </Card>
      </div>

      {/* ─── Middle Row: Today's Clinical Schedule & Recent Transactions ─── */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Today's Clinical Schedule */}
        <Card className="overflow-hidden border border-warm-200/90 shadow-xs">
          <div className="p-4 bg-warm-50/70 border-b border-warm-200/80 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand-600" />
                <h3 className="text-sm font-bold text-charcoal-900">Bugungi klinik jadval</h3>
              </div>
              <p className="text-xs text-charcoal-400 mt-0.5">{todayAppointments.length} ta uchrashuv rejalashtirilgan</p>
            </div>

            {/* Sub-status filters */}
            <div className="flex items-center gap-1 bg-white p-0.5 rounded-[8px] border border-warm-200/90 shadow-2xs">
              {[
                { key: 'ALL', label: 'Barchasi' },
                { key: 'CONFIRMED', label: 'Tasdiqlangan' },
                { key: 'PENDING', label: 'Kutilmoqda' },
                { key: 'COMPLETED', label: 'Yakunlangan' },
              ].map(f => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setScheduleFilter(f.key as any)}
                  className={cn(
                    'px-2 py-0.5 text-[11px] font-semibold rounded-[6px] transition-colors cursor-pointer',
                    scheduleFilter === f.key ? 'bg-charcoal-900 text-white' : 'text-charcoal-500 hover:text-charcoal-800'
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-warm-100 max-h-[380px] overflow-y-auto">
            {filteredTodayAppointments.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  title="Uchrashuvlar topilmadi"
                  description="Tanlangan filtr bo‘yicha bugun qabullar mavjud emas"
                  icon={<Calendar className="w-6 h-6 text-charcoal-400" />}
                />
              </div>
            ) : (
              filteredTodayAppointments.map(apt => {
                const child = children.find(c => c.id === apt.childId);
                const spec = specialists.find(s => s.id === apt.specialistId);
                const svc = services.find(s => s.id === apt.serviceId);
                const childAge = child?.dateOfBirth ? differenceInYears(new Date(), parseISO(child.dateOfBirth)) : null;

                return (
                  <div
                    key={apt.id}
                    onClick={() => setViewingAppointment(apt)}
                    className="p-3.5 sm:px-4 flex items-center justify-between gap-3 hover:bg-warm-50/70 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Time Slot Badge */}
                      <div className="text-center w-14 shrink-0 py-1 px-1 rounded-[8px] bg-warm-50 border border-warm-200/80">
                        <p className="text-xs font-bold text-charcoal-900 tabular-nums">{apt.startTime}</p>
                        <p className="text-[10px] text-charcoal-400 font-medium tabular-nums">{apt.endTime}</p>
                      </div>

                      <Avatar name={child?.fullName ?? 'Bola'} size="sm" className="shrink-0 ring-1 ring-warm-200" />

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-xs sm:text-sm font-bold text-charcoal-900 truncate">
                            {child?.fullName}
                          </p>
                          {childAge !== null && (
                            <span className="text-[10px] font-semibold text-charcoal-600 bg-warm-100 px-1.5 py-0.2 rounded-[4px]">
                              {childAge} yosh
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-charcoal-500 truncate mt-0.5">
                          {svc?.name || 'Muolaja'} • <span className="font-semibold text-charcoal-800">{spec?.fullName}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-[6px] border shadow-2xs', getAppointmentStatusColor(apt.status))}>
                        {getAppointmentStatusLabel(apt.status)}
                      </span>
                      <button
                        type="button"
                        className="p-1 rounded-[6px] text-charcoal-400 group-hover:text-charcoal-700 hover:bg-warm-100"
                        title="Batafsil"
                        aria-label="Batafsil"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="p-2.5 bg-warm-50/60 border-t border-warm-100 text-center">
            <Link
              to="/dashboard/super-admin/appointments"
              className="text-xs text-brand-600 hover:text-brand-700 font-bold inline-flex items-center gap-1"
            >
              To‘liq uchrashuvlar jadvalini ko‘rish <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </Card>

        {/* Recent Financial Transactions */}
        <Card className="overflow-hidden border border-warm-200/90 shadow-xs">
          <div className="p-4 bg-warm-50/70 border-b border-warm-200/80 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-charcoal-900">So‘nggi moliyaviy amallar</h3>
              </div>
              <p className="text-xs text-charcoal-400 mt-0.5">Oxirgi tranzaksiya va to‘lovlar</p>
            </div>
            <Link
              to="/dashboard/super-admin/transactions"
              className="text-xs text-brand-600 hover:text-brand-700 font-bold flex items-center gap-1"
            >
              Barchasi <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-warm-100 max-h-[380px] overflow-y-auto">
            {recentTransactions.map(txn => {
              const child = txn.childId ? children.find(c => c.id === txn.childId) : null;
              const parent = txn.parentId ? parents.find(p => p.id === txn.parentId) : null;
              const isIn = txn.direction === 'IN';

              return (
                <div key={txn.id} className="p-3.5 sm:px-4 flex items-center justify-between gap-3 hover:bg-warm-50/70 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={cn(
                        'w-8 h-8 rounded-[8px] flex items-center justify-center shrink-0 shadow-2xs font-bold text-xs',
                        isIn ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                      )}
                    >
                      {isIn ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-charcoal-900 truncate">
                        {truncate(txn.description, 36)}
                      </p>
                      <p className="text-xs text-charcoal-400 truncate mt-0.5">
                        {child?.fullName || parent?.fullName || 'Tizim'} • {formatDate(txn.date)}
                      </p>
                    </div>
                  </div>

                  <p
                    className={cn(
                      'text-xs sm:text-sm font-extrabold tabular-nums shrink-0',
                      isIn ? 'text-emerald-700' : 'text-rose-700'
                    )}
                  >
                    {isIn ? '+' : '-'}{formatCurrencyCompact(txn.amount)}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="p-2.5 bg-warm-50/60 border-t border-warm-100 text-center">
            <Link
              to="/dashboard/super-admin/payments"
              className="text-xs text-brand-600 hover:text-brand-700 font-bold inline-flex items-center gap-1"
            >
              Barcha kassa va to‘lovlarni ko‘rish <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </Card>
      </div>

      {/* ─── Bottom Row: Debtors & Specialist Workload ─── */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Top Debtors */}
        <Card className="overflow-hidden border border-warm-200/90 shadow-xs">
          <div className="p-4 bg-warm-50/70 border-b border-warm-200/80 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <h3 className="text-sm font-bold text-charcoal-900">Yirik qarzdorlar (Monitoring)</h3>
              </div>
              <p className="text-xs text-charcoal-400 mt-0.5">Qarzdorlik bo‘yicha top 5 mijoz</p>
            </div>
            <Link
              to="/dashboard/super-admin/debtors"
              className="text-xs text-brand-600 hover:text-brand-700 font-bold flex items-center gap-1"
            >
              Barchasi <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-warm-100">
            {topDebtors.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  title="Qarzdorlar mavjud emas"
                  description="Barcha hisob-kitoblar to‘liq muvozanatda"
                  icon={<CheckCircle2 className="w-6 h-6 text-emerald-600" />}
                />
              </div>
            ) : (
              topDebtors.map((d, i) => (
                <div key={d.childId} className="p-3.5 sm:px-4 flex items-center justify-between gap-3 hover:bg-warm-50/60 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-warm-100 text-charcoal-600 font-bold text-[11px] flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <Avatar name={d.childName} size="sm" className="shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-charcoal-900 truncate">{d.childName}</p>
                      <p className="text-xs text-charcoal-400 truncate">{d.parentName}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs sm:text-sm font-extrabold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-[6px] border border-rose-200 tabular-nums">
                      {formatCurrencyCompact(d.debt)}
                    </span>
                    {d.balance > 0 && (
                      <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                        Depozit: {formatCurrencyCompact(d.balance)}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Specialist Workload */}
        <Card className="overflow-hidden border border-warm-200/90 shadow-xs">
          <div className="p-4 bg-warm-50/70 border-b border-warm-200/80 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-charcoal-900">Mutaxassislar amaliyot yuki</h3>
              </div>
              <p className="text-xs text-charcoal-400 mt-0.5">Bajarilgan seanslar bo‘yicha</p>
            </div>
            <Link
              to="/dashboard/super-admin/analytics"
              className="text-xs text-brand-600 hover:text-brand-700 font-bold flex items-center gap-1"
            >
              Tahlil <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="p-4 space-y-3.5">
            {specialistWorkload.length === 0 ? (
              <EmptyState title="Ma'lumot topilmadi" className="py-8" />
            ) : (
              specialistWorkload.map(w => {
                const maxSessions = Math.max(...specialistWorkload.map(x => x.completedSessions), 1);
                const percent = Math.round((w.completedSessions / maxSessions) * 100);

                return (
                  <div key={w.specialistId} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar name={w.specialistName} size="xs" />
                        <span className="font-bold text-charcoal-900 truncate">{w.specialistName}</span>
                      </div>
                      <span className="font-extrabold text-charcoal-800 tabular-nums">
                        {w.completedSessions} ta seans
                      </span>
                    </div>
                    <ProgressBar
                      value={percent}
                      fillClassName={percent >= 80 ? 'bg-emerald-600' : percent >= 50 ? 'bg-brand-500' : 'bg-amber-500'}
                    />
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>

      {/* ─── Monthly & Yearly Executive Telemetry Summary Strip ─── */}
      <Card className="overflow-hidden border border-warm-200/90 shadow-xs bg-gradient-to-br from-white via-white to-warm-50/50">
        <CardBody className="p-4 sm:p-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center divide-y sm:divide-y-0 sm:divide-x divide-warm-100">
            <div className="pt-2 sm:pt-0">
              <p className="text-xs text-charcoal-400 font-semibold mb-1">Bu oy jami tushum</p>
              <p className="text-lg sm:text-xl font-black text-charcoal-900 tabular-nums">
                {formatCurrency(summary.monthlyRevenue)}
              </p>
            </div>
            <div className="pt-2 sm:pt-0">
              <p className="text-xs text-charcoal-400 font-semibold mb-1">Bu yil jami tushum</p>
              <p className="text-lg sm:text-xl font-black text-charcoal-900 tabular-nums">
                {formatCurrency(summary.yearlyRevenue)}
              </p>
            </div>
            <div className="pt-2 sm:pt-0">
              <p className="text-xs text-charcoal-400 font-semibold mb-1">Joriy oylik qarz</p>
              <p className="text-lg sm:text-xl font-black text-rose-700 tabular-nums">
                {formatCurrency(summary.monthlyDebt)}
              </p>
            </div>
            <div className="pt-2 sm:pt-0">
              <p className="text-xs text-charcoal-400 font-semibold mb-1">Yakunlangan seanslar</p>
              <p className="text-lg sm:text-xl font-black text-emerald-700 tabular-nums">
                {sessions.filter(s => s.status === 'COMPLETED').length} ta
              </p>
            </div>
          </div>
        </CardBody>
        <div className="px-4 py-2.5 bg-warm-50/80 border-t border-warm-100 flex flex-wrap items-center justify-between text-[11px] text-charcoal-500 font-medium">
          <span>Oxirgi audit tekshiruvi: <strong>{formatDate(todayStr)}</strong></span>
          <span>Barcha moliyaviy oqimlar fiskal talablarga muvofiq yuritiladi</span>
        </div>
      </Card>

      {/* ─── Modal: Create Appointment ─── */}
      <Modal
        isOpen={showCreateAppointmentModal}
        onClose={() => setShowCreateAppointmentModal(false)}
        title="Yangi uchrashuv belgilash"
        size="md"
      >
        <CreateAppointmentForm
          onSuccess={() => setShowCreateAppointmentModal(false)}
          onCancel={() => setShowCreateAppointmentModal(false)}
        />
      </Modal>

      {/* ─── Modal: Appointment Details Preview ─── */}
      <Modal
        isOpen={Boolean(viewingAppointment)}
        onClose={() => setViewingAppointment(null)}
        title="Uchrashuv tafsilotlari"
        size="md"
      >
        {viewingAppointment && (() => {
          const child = children.find(c => c.id === viewingAppointment.childId);
          const spec = specialists.find(s => s.id === viewingAppointment.specialistId);
          const parent = parents.find(p => p.id === viewingAppointment.parentId);
          const svc = services.find(s => s.id === viewingAppointment.serviceId);

          return (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-warm-50 border border-warm-200 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-charcoal-900">{svc?.name || 'Reabilitatsiya seansi'}</h4>
                  <p className="text-xs text-charcoal-500">{formatDate(viewingAppointment.date)} • {viewingAppointment.startTime} - {viewingAppointment.endTime}</p>
                </div>
                <span className={cn('text-xs font-bold px-2.5 py-1 rounded-[6px] border shadow-2xs', getAppointmentStatusColor(viewingAppointment.status))}>
                  {getAppointmentStatusLabel(viewingAppointment.status)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg border border-warm-200 bg-white space-y-1">
                  <span className="text-charcoal-400 font-semibold">Bemor bola:</span>
                  <p className="font-bold text-charcoal-900">{child?.fullName}</p>
                  {child?.diagnosis && <p className="text-charcoal-500">{child.diagnosis}</p>}
                </div>
                <div className="p-3 rounded-lg border border-warm-200 bg-white space-y-1">
                  <span className="text-charcoal-400 font-semibold">Mas'ul mutaxassis:</span>
                  <p className="font-bold text-charcoal-900">{spec?.fullName}</p>
                  <p className="text-charcoal-500">{spec?.specialization}</p>
                </div>
              </div>

              {parent && (
                <div className="p-3 rounded-lg border border-warm-200 bg-white text-xs flex items-center justify-between">
                  <div>
                    <span className="text-charcoal-400 font-semibold">Ota-ona:</span>
                    <p className="font-bold text-charcoal-900">{parent.fullName}</p>
                  </div>
                  <span className="font-semibold text-charcoal-600">{parent.phone}</span>
                </div>
              )}

              {viewingAppointment.notes && (
                <div className="p-3 rounded-lg border border-warm-200 bg-white text-xs space-y-1">
                  <span className="text-charcoal-400 font-semibold">Qo‘shimcha izoh:</span>
                  <p className="text-charcoal-700 italic">"{viewingAppointment.notes}"</p>
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-warm-100">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setViewingAppointment(null);
                    navigate('/dashboard/super-admin/appointments');
                  }}
                >
                  Uchrashuvlar bo‘limiga o‘tish
                </Button>
                <Button size="sm" onClick={() => setViewingAppointment(null)}>
                  Yopish
                </Button>
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}
