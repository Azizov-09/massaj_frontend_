// ═══════════════════════════════════════════════════════
//  Analytics Page — Visual Business Intelligence Dashboard
// ═══════════════════════════════════════════════════════

import { useState, useMemo } from 'react';
import {
  TrendingUp, Users, DollarSign, Activity
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { useStore } from '@/store';
import { formatCurrency, formatCurrencyCompact } from '@/utils';
import { Card, CardHeader, CardBody } from '@/components/ui/primitives';
import { PageHeader, KpiCard } from '@/components/ui/KpiCard';

const COLORS = ['#f97316', '#4a8063', '#d97706', '#2563eb', '#8b5cf6', '#ec4899'];

export function AnalyticsPage() {
  const transactions = useStore(s => s.transactions);
  const appointments = useStore(s => s.appointments);
  const sessions = useStore(s => s.sessions);
  const specialists = useStore(s => s.specialists);
  const services = useStore(s => s.services);
  const attendance = useStore(s => s.attendance);

  const [timeRange, setTimeRange] = useState<'7days' | 'month' | 'year'>('month');

  // Revenue & Charges trend data
  const revenueTrend = useMemo(() => {
    // Generate recent dates
    const days = timeRange === '7days' ? 7 : timeRange === 'month' ? 14 : 12;
    const map: Record<string, { date: string; Tushum: number; Xarajat: number }> = {};

    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      if (timeRange === 'year') {
        d.setMonth(now.getMonth() - i);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        map[key] = { date: key, Tushum: 0, Xarajat: 0 };
      } else {
        d.setDate(now.getDate() - i);
        const key = d.toISOString().split('T')[0];
        map[key] = { date: key.slice(5), Tushum: 0, Xarajat: 0 };
      }
    }

    transactions.forEach(t => {
      const dKey = timeRange === 'year' ? t.date.slice(0, 7) : t.date.split('T')[0];
      const lookup = timeRange === 'year' ? dKey : dKey.slice(5);
      if (map[lookup] || map[dKey]) {
        const item = map[lookup] || map[dKey];
        if (t.direction === 'IN') item.Tushum += t.amount;
        else item.Xarajat += t.amount;
      }
    });

    return Object.values(map);
  }, [transactions, timeRange]);

  // Specialist workload
  const specialistWorkload = useMemo(() => {
    return specialists.map(sp => {
      const specSessions = sessions.filter(s => s.specialistId === sp.id && s.status === 'COMPLETED');
      return {
        name: sp.fullName.split(' ')[0],
        seanslar: specSessions.length,
      };
    });
  }, [specialists, sessions]);

  // Service popularity
  const servicePopularity = useMemo(() => {
    return services.map(svc => {
      const count = sessions.filter(s => s.serviceId === svc.id).length;
      return {
        name: svc.name,
        seanslar: count,
      };
    }).sort((a, b) => b.seanslar - a.seanslar).slice(0, 5);
  }, [services, sessions]);

  // Appointment status donut
  const appointmentStatusData = useMemo(() => {
    const statuses = ['SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];
    const labels: Record<string, string> = {
      SCHEDULED: 'Rejalashtirilgan',
      CONFIRMED: 'Tasdiqlangan',
      COMPLETED: 'Yakunlangan',
      CANCELLED: 'Bekor qilingan',
    };
    return statuses.map((st, i) => {
      const count = appointments.filter(a => a.status === st).length;
      return {
        name: labels[st] || st,
        value: count,
        color: COLORS[i % COLORS.length],
      };
    }).filter(d => d.value > 0);
  }, [appointments]);

  // Totals
  const totalRevenue = transactions.filter(t => t.direction === 'IN').reduce((acc, t) => acc + t.amount, 0);
  const totalCompletedSessions = sessions.filter(s => s.status === 'COMPLETED').length;
  const attendanceRate = attendance.length > 0
    ? Math.round((attendance.filter(a => a.status === 'PRESENT' || a.status === 'LATE').length / attendance.length) * 100)
    : 95;

  return (
    <div className="px-4 lg:px-6 py-6 max-w-[1600px] mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Biznes analitika"
          description="Moliyaviy ko‘rsatkichlar, seanslar samaradorligi va xodimlar yuklamasi"
        />
        <div className="w-full sm:w-auto inline-flex items-center justify-between sm:justify-start h-9 p-1 rounded-[10px] bg-warm-100/90 border border-warm-200/80 shadow-2xs gap-1">
          <button
            onClick={() => setTimeRange('7days')}
            className={`flex-1 sm:flex-initial text-center h-7 px-3 text-xs font-semibold rounded-[7px] transition-all ${
              timeRange === '7days' ? 'bg-white shadow-2xs text-charcoal-900 font-bold' : 'text-charcoal-500 hover:text-charcoal-900'
            }`}
          >
            7 kun
          </button>
          <button
            onClick={() => setTimeRange('month')}
            className={`flex-1 sm:flex-initial text-center h-7 px-3 text-xs font-semibold rounded-[7px] transition-all ${
              timeRange === 'month' ? 'bg-white shadow-2xs text-charcoal-900 font-bold' : 'text-charcoal-500 hover:text-charcoal-900'
            }`}
          >
            Shu oy
          </button>
          <button
            onClick={() => setTimeRange('year')}
            className={`flex-1 sm:flex-initial text-center h-7 px-3 text-xs font-semibold rounded-[7px] transition-all ${
              timeRange === 'year' ? 'bg-white shadow-2xs text-charcoal-900 font-bold' : 'text-charcoal-500 hover:text-charcoal-900'
            }`}
          >
            Shu yil
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <KpiCard
          label="Jami tushum"
          value={formatCurrencyCompact(totalRevenue)}
          description="Barcha muolajalar tushumi"
          icon={<DollarSign className="w-5 h-5 text-brand-600" />}
          accentColor="brand"
          changeType="positive"
          index={0}
        />
        <KpiCard
          label="Bajarilgan seanslar"
          value={totalCompletedSessions}
          description="Muvaffaqiyatli seanslar"
          icon={<Activity className="w-5 h-5 text-emerald-600" />}
          accentColor="sage"
          changeType="positive"
          index={1}
        />
        <KpiCard
          label="Davomat ko‘rsatkichi"
          value={`${attendanceRate}%`}
          description="Bolalar davomati darajasi"
          icon={<Users className="w-5 h-5 text-amber-500" />}
          accentColor="gold"
          index={2}
        />
        <KpiCard
          label="O‘rtacha seans narxi"
          value={formatCurrencyCompact(totalCompletedSessions > 0 ? Math.round(totalRevenue / totalCompletedSessions) : 100000)}
          description="Har bir seans bo'yicha"
          icon={<TrendingUp className="w-5 h-5 text-blue-500" />}
          accentColor="blue"
          index={3}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Revenue Area Chart */}
        <div className="lg:col-span-8">
          <Card className="h-full">
            <CardHeader>
              <h3 className="text-sm font-bold text-charcoal-900">Daromad va Xarajat dinamikasi</h3>
              <p className="text-xs text-charcoal-400">Kirim va Chiqim oqimi taqqoslanishi</p>
            </CardHeader>
            <CardBody>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueTrend}>
                    <defs>
                      <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4a8063" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#4a8063" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f4ece1" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#8c827a' }} />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#8c827a' }}
                      tickFormatter={v => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : `${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip formatter={(v: unknown) => [formatCurrency(Number(v) || 0), '']} />
                    <Legend />
                    <Area type="monotone" dataKey="Tushum" stroke="#f97316" strokeWidth={2.5} fillOpacity={1} fill="url(#colorIn)" />
                    <Area type="monotone" dataKey="Xarajat" stroke="#4a8063" strokeWidth={2.5} fillOpacity={1} fill="url(#colorOut)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Appointment Status Donut */}
        <div className="lg:col-span-4">
          <Card className="h-full">
            <CardHeader>
              <h3 className="text-sm font-bold text-charcoal-900">Uchrashuvlar taqsimoti</h3>
              <p className="text-xs text-charcoal-400">Statuslar bo‘yicha uchrashuvlar holati</p>
            </CardHeader>
            <CardBody className="flex flex-col items-center">
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={appointmentStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {appointmentStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: unknown) => [String(v ?? ''), '']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="w-full space-y-2 mt-4">
                {appointmentStatusData.map((d) => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-charcoal-600 font-medium">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                      {d.name}
                    </span>
                    <span className="font-bold text-charcoal-900">{d.value} ta</span>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Specialist workload Bar Chart */}
        <div className="lg:col-span-6">
          <Card>
            <CardHeader>
              <h3 className="text-sm font-bold text-charcoal-900">Mutaxassislar yuklamasi</h3>
              <p className="text-xs text-charcoal-400">O‘tkazilgan seanslar soni mutaxassislar kesimida</p>
            </CardHeader>
            <CardBody>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={specialistWorkload}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f4ece1" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#8c827a' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#8c827a' }} />
                    <Tooltip />
                    <Bar dataKey="seanslar" fill="#f97316" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Service Popularity Bar Chart */}
        <div className="lg:col-span-6">
          <Card>
            <CardHeader>
              <h3 className="text-sm font-bold text-charcoal-900">Eng ommabop xizmatlar</h3>
              <p className="text-xs text-charcoal-400">Eng ko‘p o‘tkazilgan muolajalar</p>
            </CardHeader>
            <CardBody>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={servicePopularity} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f4ece1" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#8c827a' }} />
                    <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 10, fill: '#8c827a' }} />
                    <Tooltip />
                    <Bar dataKey="seanslar" fill="#4a8063" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
