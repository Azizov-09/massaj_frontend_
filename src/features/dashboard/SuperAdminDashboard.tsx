// ═══════════════════════════════════════════════════════
//  Super Admin Dashboard — Executive overview
// ═══════════════════════════════════════════════════════
import { useState, useMemo } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  TrendingUp, TrendingDown, DollarSign, Users, Baby,
  Calendar, Activity, ArrowRight, Clock, CheckCircle,
  AlertCircle, Stethoscope,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { useStore } from '@/store';
import { calculateFinancialSummary, getRevenueByDay, getAppointmentStats, getTopDebtors, getSpecialistWorkload } from '@/services/finance.service';
import { formatCurrencyCompact, formatCurrency, formatAmount, getDateRange, formatDate, formatTime, getAppointmentStatusColor, getAppointmentStatusLabel, truncate } from '@/utils';
import { KpiCard, DateFilterTabs, PageHeader } from '@/components/ui/KpiCard';
import { Card, CardHeader, CardBody, Avatar, Badge, EmptyState, ProgressBar } from '@/components/ui/primitives';
import type { DateFilterPreset } from '@/types';
import { Link } from 'react-router-dom';

// ─── Custom tooltip for charts ────────────────────────────
function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-[10px] border border-warm-200 shadow-[0_4px_16px_-4px_rgb(0_0_0/0.1)] px-3 py-2.5 text-sm">
      {label && <p className="text-xs text-charcoal-400 mb-1.5 font-medium">{label}</p>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
          <span className="text-charcoal-600">{p.name}:</span>
          <span className="font-semibold text-charcoal-900 tabular-nums">{formatCurrencyCompact(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

export function SuperAdminDashboard() {
  const [dateFilter, setDateFilter] = useState<string>('thisMonth');

  const transactions = useStore(s => s.transactions);
  const appointments = useStore(s => s.appointments);
  const sessions = useStore(s => s.sessions);
  const children = useStore(s => s.children);
  const specialists = useStore(s => s.specialists);
  const parents = useStore(s => s.parents);
  const services = useStore(s => s.services);

  const summary = useMemo(() => calculateFinancialSummary(transactions, dateFilter as DateFilterPreset), [transactions, dateFilter]);
  const range = useMemo(() => getDateRange(dateFilter as DateFilterPreset), [dateFilter]);

  const revenueData = useMemo(() => {
    const data = getRevenueByDay(transactions, getDateRange('last7days'));
    return data.map(d => ({
      date: format(parseISO(d.date), 'dd MMM'),
      "Tushum": d.revenue,
      "Xarajat": d.charges,
    }));
  }, [transactions]);

  const aptStats = useMemo(() => getAppointmentStats(appointments, range), [appointments, range]);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayAppointments = appointments.filter(a => a.date === todayStr).sort((a, b) => a.startTime.localeCompare(b.startTime));
  const upcomingAppointments = appointments.filter(a => a.date >= todayStr && ['SCHEDULED', 'CONFIRMED'].includes(a.status)).slice(0, 5);

  const topDebtors = useMemo(() => getTopDebtors(transactions, children, parents, 5), [transactions, children, parents]);

  const specialistWorkload = useMemo(() => getSpecialistWorkload(sessions, specialists, services).slice(0, 5), [sessions, specialists, services]);

  const activeChildren = children.filter(c => c.status === 'ACTIVE').length;
  const activeSpecialists = specialists.filter(s => s.status === 'ACTIVE').length;
  const todaySessions = sessions.filter(s => s.startTime.startsWith(todayStr)).length;

  // Recent transactions
  const recentTransactions = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 6);

  // Appointment status donut
  const aptDonutData = [
    { name: 'Yakunlangan', value: aptStats.byStatus.COMPLETED, color: '#22c55e' },
    { name: 'Tasdiqlangan', value: aptStats.byStatus.CONFIRMED, color: '#4a8063' },
    { name: 'Rejalashtirilgan', value: aptStats.byStatus.SCHEDULED, color: '#64748b' },
    { name: 'Bekor qilingan', value: aptStats.byStatus.CANCELLED, color: '#f43f5e' },
    { name: 'Kelmagan', value: aptStats.byStatus.NO_SHOW, color: '#f59e0b' },
  ].filter(d => d.value > 0);

  return (
    <div className="px-4 lg:px-6 py-6 max-w-[1600px] mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-charcoal-900">Bosh sahifa</h1>
          <p className="text-sm text-charcoal-400 mt-0.5">Markazning umumiy ko'rsatkichlari</p>
        </div>
        <div className="sm:ml-auto">
          <DateFilterTabs value={dateFilter} onChange={setDateFilter} />
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          label="Jami tushum"
          value={summary.totalRevenue}
          format="currency"
          icon={<DollarSign className="w-4 h-4" />}
          accentColor="brand"
          trend={{ value: 12, label: 'o\'tgan oyga nisbatan' }}
          index={0}
        />
        <KpiCard
          label="Jami qarzdorlik"
          value={summary.totalDebt}
          format="currency"
          icon={<TrendingDown className="w-4 h-4" />}
          accentColor="danger"
          trend={{ value: -5, label: 'kamaydi' }}
          index={1}
        />
        <KpiCard
          label="Joriy balans"
          value={summary.currentBalance}
          format="currency"
          icon={<TrendingUp className="w-4 h-4" />}
          accentColor="sage"
          trend={{ value: 8 }}
          index={2}
        />
        <KpiCard
          label="Bugungi tushum"
          value={summary.todayRevenue}
          format="currency"
          icon={<DollarSign className="w-4 h-4" />}
          accentColor="gold"
          index={3}
        />
        <KpiCard
          label="Faol bolalar"
          value={activeChildren}
          format="number"
          icon={<Baby className="w-4 h-4" />}
          accentColor="brand"
          description={`${children.length} dan`}
          index={4}
        />
        <KpiCard
          label="Faol mutaxassislar"
          value={activeSpecialists}
          format="number"
          icon={<Stethoscope className="w-4 h-4" />}
          accentColor="sage"
          description={`${specialists.length} dan`}
          index={5}
        />
        <KpiCard
          label="Bugungi uchrashuvlar"
          value={todayAppointments.length}
          format="number"
          icon={<Calendar className="w-4 h-4" />}
          accentColor="gold"
          description={`${todayAppointments.filter(a => a.status === 'CONFIRMED').length} tasdiqlangan`}
          index={6}
        />
        <KpiCard
          label="Bugungi seanslar"
          value={todaySessions}
          format="number"
          icon={<Activity className="w-4 h-4" />}
          accentColor="brand"
          description="Bugun o'tkazilgan"
          index={7}
        />
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Revenue Area Chart */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
          className="lg:col-span-2"
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-charcoal-900">Moliyaviy ko'rsatkich</h3>
                <p className="text-xs text-charcoal-400 mt-0.5">So'nggi 7 kun</p>
              </div>
              <div className="flex items-center gap-3 text-xs text-charcoal-400">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-brand-500 inline-block" />Tushum</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-sage-400 inline-block" />Xarajat</span>
              </div>
            </CardHeader>
            <CardBody className="pt-2">
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={revenueData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="chargeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4a8063" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#4a8063" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0e8db" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#938c83' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#938c83' }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000000 ? `${(v / 1000000).toFixed(0)}M` : `${(v / 1000).toFixed(0)}K`} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="Tushum" stroke="#f97316" strokeWidth={2} fill="url(#revGrad)" dot={false} />
                  <Area type="monotone" dataKey="Xarajat" stroke="#4a8063" strokeWidth={2} fill="url(#chargeGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>
        </motion.div>

        {/* Appointment Donut */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.3 }}
        >
          <Card className="h-full">
            <CardHeader>
              <h3 className="text-sm font-semibold text-charcoal-900">Uchrashuvlar holati</h3>
              <p className="text-xs text-charcoal-400 mt-0.5">{aptStats.total} ta jami</p>
            </CardHeader>
            <CardBody className="flex flex-col items-center pt-2">
              {aptDonutData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={140}>
                    <PieChart>
                      <Pie data={aptDonutData} cx="50%" cy="50%" innerRadius={42} outerRadius={62} paddingAngle={3} dataKey="value">
                        {aptDonutData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: unknown) => [String(v ?? ''), '']} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="w-full space-y-1.5 mt-2">
                    {aptDonutData.map(d => (
                      <div key={d.name} className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 text-charcoal-500">
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                          {d.name}
                        </span>
                        <span className="font-semibold text-charcoal-800 tabular-nums">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <EmptyState title="Ma'lumot yo'q" className="py-8" />
              )}
            </CardBody>
          </Card>
        </motion.div>
      </div>

      {/* Middle Row: Schedule + Transactions */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Today's Schedule */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.3 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-charcoal-900">Bugungi jadval</h3>
                <p className="text-xs text-charcoal-400 mt-0.5">{todayAppointments.length} ta uchrashuv</p>
              </div>
              <Link to="/dashboard/super-admin/appointments" className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
                Hammasi <ArrowRight className="w-3 h-3" />
              </Link>
            </CardHeader>
            <div className="divide-y divide-warm-50">
              {todayAppointments.length === 0 ? (
                <EmptyState title="Bugun uchrashuvlar yo'q" icon={<Calendar className="w-5 h-5" />} className="py-8" />
              ) : (
                todayAppointments.slice(0, 6).map((apt, i) => {
                  const child = children.find(c => c.id === apt.childId);
                  const spec = specialists.find(s => s.id === apt.specialistId);
                  return (
                    <div key={apt.id} className="px-4 py-3 flex items-center gap-3 hover:bg-warm-50/50 transition-colors">
                      <div className="text-center w-12 flex-shrink-0">
                        <p className="text-xs font-bold text-charcoal-900">{apt.startTime}</p>
                        <p className="text-[10px] text-charcoal-400">{apt.endTime}</p>
                      </div>
                      <div className="w-px h-8 bg-warm-200 flex-shrink-0" />
                      <Avatar name={child?.fullName ?? '?'} size="xs" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-charcoal-900 truncate">{child?.fullName}</p>
                        <p className="text-xs text-charcoal-400 truncate">{spec?.fullName}</p>
                      </div>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${getAppointmentStatusColor(apt.status)}`}>
                        {getAppointmentStatusLabel(apt.status)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </motion.div>

        {/* Recent Transactions */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.3 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-charcoal-900">So'nggi tranzaksiyalar</h3>
                <p className="text-xs text-charcoal-400 mt-0.5">Oxirgi moliyaviy harakatlar</p>
              </div>
              <Link to="/dashboard/super-admin/transactions" className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
                Hammasi <ArrowRight className="w-3 h-3" />
              </Link>
            </CardHeader>
            <div className="divide-y divide-warm-50">
              {recentTransactions.map(txn => {
                const child = txn.childId ? children.find(c => c.id === txn.childId) : null;
                const parent = txn.parentId ? parents.find(p => p.id === txn.parentId) : null;
                return (
                  <div key={txn.id} className="px-4 py-3 flex items-center gap-3 hover:bg-warm-50/50 transition-colors">
                    <div className={`w-8 h-8 rounded-[10px] flex items-center justify-center flex-shrink-0 ${txn.direction === 'IN' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-danger-main'}`}>
                      {txn.direction === 'IN' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-charcoal-800 truncate">{truncate(txn.description, 30)}</p>
                      <p className="text-xs text-charcoal-400 truncate">
                        {child?.fullName ?? parent?.fullName ?? 'Tizim'} · {formatDate(txn.date)}
                      </p>
                    </div>
                    <p className={`text-sm font-bold tabular-nums flex-shrink-0 ${txn.direction === 'IN' ? 'text-green-600' : 'text-danger-main'}`}>
                      {txn.direction === 'IN' ? '+' : '-'}{formatCurrencyCompact(txn.amount)}
                    </p>
                  </div>
                );
              })}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Bottom Row: Debtors + Specialist Workload */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Top Debtors */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.3 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-charcoal-900">Yirik qarzdorlar</h3>
                <p className="text-xs text-charcoal-400 mt-0.5">Qarz bo'yicha top 5</p>
              </div>
              <Link to="/dashboard/super-admin/debtors" className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
                Barchasi <ArrowRight className="w-3 h-3" />
              </Link>
            </CardHeader>
            <div className="divide-y divide-warm-50">
              {topDebtors.length === 0 ? (
                <EmptyState title="Qarzdor yo'q" icon={<CheckCircle className="w-5 h-5" />} description="Barcha hisoblar muvozanatda" className="py-8" />
              ) : (
                topDebtors.map((d, i) => (
                  <div key={d.childId} className="px-4 py-3 flex items-center gap-3">
                    <span className="text-xs font-bold text-charcoal-400 w-4 flex-shrink-0">{i + 1}</span>
                    <Avatar name={d.childName} size="xs" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-charcoal-900 truncate">{d.childName}</p>
                      <p className="text-xs text-charcoal-400 truncate">{d.parentName}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-danger-main tabular-nums">{formatCurrencyCompact(d.debt)}</p>
                      {d.balance > 0 && <p className="text-[10px] text-green-600">Balans: {formatCurrencyCompact(d.balance)}</p>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </motion.div>

        {/* Specialist Workload */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.3 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-charcoal-900">Mutaxassis yuki</h3>
                <p className="text-xs text-charcoal-400 mt-0.5">Seans soni bo'yicha</p>
              </div>
              <Link to="/dashboard/super-admin/analytics" className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
                Tahlil <ArrowRight className="w-3 h-3" />
              </Link>
            </CardHeader>
            <div className="px-4 py-2 space-y-3">
              {specialistWorkload.length === 0 ? (
                <EmptyState title="Ma'lumot yo'q" className="py-8" />
              ) : (
                specialistWorkload.map(w => {
                  const maxSessions = Math.max(...specialistWorkload.map(x => x.completedSessions), 1);
                  return (
                    <div key={w.specialistId} className="flex items-center gap-3">
                      <Avatar name={w.specialistName} size="xs" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs font-medium text-charcoal-800 truncate">{w.specialistName}</p>
                          <span className="text-xs font-bold text-charcoal-600 tabular-nums ml-2 flex-shrink-0">{w.completedSessions}</span>
                        </div>
                        <ProgressBar
                          value={(w.completedSessions / maxSessions) * 100}
                          fillClassName="bg-brand-500"
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Monthly Revenue Summary Row */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.3 }}
      >
        <Card>
          <CardBody>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-xs text-charcoal-400 font-medium mb-1">Bu oy tushum</p>
                <p className="text-lg font-bold text-charcoal-900 tabular-nums">{formatCurrencyCompact(summary.monthlyRevenue)}</p>
              </div>
              <div>
                <p className="text-xs text-charcoal-400 font-medium mb-1">Bu yil tushum</p>
                <p className="text-lg font-bold text-charcoal-900 tabular-nums">{formatCurrencyCompact(summary.yearlyRevenue)}</p>
              </div>
              <div>
                <p className="text-xs text-charcoal-400 font-medium mb-1">Bu oy qarz</p>
                <p className="text-lg font-bold text-danger-main tabular-nums">{formatCurrencyCompact(summary.monthlyDebt)}</p>
              </div>
              <div>
                <p className="text-xs text-charcoal-400 font-medium mb-1">Yakunlangan seanslar</p>
                <p className="text-lg font-bold text-charcoal-900 tabular-nums">{sessions.filter(s => s.status === 'COMPLETED').length}</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </motion.div>
    </div>
  );
}
