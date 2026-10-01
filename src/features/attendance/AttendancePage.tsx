// ═══════════════════════════════════════════════════════
//  Attendance Page — Real-time Daily Attendance Journal
// ═══════════════════════════════════════════════════════

import { useState, useMemo } from 'react';
import {
  Calendar, CheckCircle2, Clock, XCircle, AlertCircle,
  ChevronLeft, ChevronRight, UserCheck, Search
} from 'lucide-react';
import { useStore, useAuth } from '@/store';
import { cn } from '@/utils';
import { Card, Badge, Avatar, Select, EmptyState, DatePicker } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { PageHeader, KpiCard } from '@/components/ui/KpiCard';
import type { AttendanceStatus } from '@/types';

const ATTENDANCE_OPTIONS: {
  status: AttendanceStatus;
  label: string;
  title: string;
  icon: typeof CheckCircle2;
  activeClass: string;
  iconColor: string;
}[] = [
  {
    status: 'PRESENT',
    label: 'Keldi',
    title: 'Keldi (mashg‘ulotda qatnashdi)',
    icon: CheckCircle2,
    activeClass: 'bg-emerald-600 text-white shadow-xs',
    iconColor: 'text-emerald-600',
  },
  {
    status: 'LATE',
    label: 'Kechikdi',
    title: 'Kechikdi',
    icon: Clock,
    activeClass: 'bg-amber-500 text-white shadow-xs',
    iconColor: 'text-amber-500',
  },
  {
    status: 'ABSENT',
    label: 'Sababli',
    title: 'Sababli kelmadi',
    icon: AlertCircle,
    activeClass: 'bg-blue-600 text-white shadow-xs',
    iconColor: 'text-blue-500',
  },
  {
    status: 'NO_SHOW',
    label: 'Sababsiz',
    title: 'Sababsiz kelmadi',
    icon: XCircle,
    activeClass: 'bg-rose-600 text-white shadow-xs',
    iconColor: 'text-rose-500',
  },
];

export function AttendancePage() {
  const { currentUser } = useAuth();
  const appointments = useStore(s => s.appointments);
  const attendance = useStore(s => s.attendance);
  const children = useStore(s => s.children);
  const specialists = useStore(s => s.specialists);
  const services = useStore(s => s.services);
  const recordAttendance = useStore(s => s.recordAttendance);
  const removeAttendance = useStore(s => s.removeAttendance);

  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [specialistFilter, setSpecialistFilter] = useState(
    currentUser?.role === 'SPECIALIST' ? currentUser.id : ''
  );
  const [search, setSearch] = useState('');

  // Date shortcuts
  const setToday = () => setSelectedDate(new Date().toISOString().split('T')[0]);
  const prevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };
  const nextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  // Appointments on selected day
  const dayAppointments = useMemo(() => {
    return appointments.filter(a => {
      if (a.date !== selectedDate) return false;
      const targetSpecialistId = currentUser?.role === 'SPECIALIST' ? currentUser.id : specialistFilter;
      if (targetSpecialistId && a.specialistId !== targetSpecialistId) return false;
      return true;
    });
  }, [appointments, selectedDate, specialistFilter, currentUser]);

  // Combined attendance records for the day's appointments (strictly per appointmentId)
  const attendanceItems = useMemo(() => {
    return dayAppointments.map(apt => {
      const child = children.find(c => c.id === apt.childId);
      const spec = specialists.find(s => s.id === apt.specialistId);
      const svc = services.find(s => s.id === apt.serviceId);
      const attRecord = attendance.find(att => att.appointmentId === apt.id);

      return {
        appointment: apt,
        child,
        specialist: spec,
        service: svc,
        attendanceRecord: attRecord,
        status: attRecord?.status ?? null,
      };
    }).filter(item => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        item.child?.fullName.toLowerCase().includes(q) ||
        item.specialist?.fullName.toLowerCase().includes(q) ||
        item.service?.name.toLowerCase().includes(q)
      );
    });
  }, [dayAppointments, attendance, children, specialists, services, search]);

  // Daily statistics
  const stats = useMemo(() => {
    const total = dayAppointments.length;
    let present = 0;
    let late = 0;
    let absent = 0;
    let noShow = 0;

    dayAppointments.forEach(apt => {
      const att = attendance.find(a => a.appointmentId === apt.id);
      if (att) {
        if (att.status === 'PRESENT') present++;
        else if (att.status === 'LATE') late++;
        else if (att.status === 'ABSENT') absent++;
        else if (att.status === 'NO_SHOW') noShow++;
      }
    });

    const attended = present + late;
    const rate = total > 0 ? Math.round((attended / total) * 100) : 0;

    return { total, present, late, absent, noShow, rate };
  }, [dayAppointments, attendance]);

  const handleMark = (
    appointmentId: string,
    childId: string,
    specialistId: string,
    status: AttendanceStatus,
    currentStatus: AttendanceStatus | null
  ) => {
    if (currentUser?.role === 'SPECIALIST' && specialistId !== currentUser.id) return;
    if (currentStatus === status) {
      removeAttendance(appointmentId);
      return;
    }
    recordAttendance({
      appointmentId,
      childId,
      specialistId,
      date: selectedDate,
      status,
      note: `Belgilandi: ${status}`,
    });
  };

  const getStatusBadge = (status: AttendanceStatus | null) => {
    switch (status) {
      case 'PRESENT':
        return <Badge variant="success">Keldi</Badge>;
      case 'LATE':
        return <Badge variant="warning">Kechikdi</Badge>;
      case 'ABSENT':
        return <Badge variant="info">Sababli kelmadi</Badge>;
      case 'NO_SHOW':
        return <Badge variant="danger">Sababsiz kelmadi</Badge>;
      default:
        return <Badge variant="neutral">Kutilmoqda</Badge>;
    }
  };

  return (
    <div className="px-4 lg:px-6 py-6 max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Davomat jurnali"
        description="Har kungi seanslar va uchrashuvlar bo‘yicha bolalar qatnashuvi"
      />

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <KpiCard
          label="Davomat darajasi"
          value={`${stats.rate}%`}
          change={`${stats.present + stats.late} / ${stats.total} qatnashdi`}
          changeType={stats.rate >= 80 ? 'positive' : 'negative'}
          icon={<UserCheck className="w-5 h-5 text-brand-600" />}
          accentColor="brand"
          index={0}
        />
        <KpiCard
          label="Kelganlar"
          value={stats.present}
          description="O‘z vaqtida qatnashdi"
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
          accentColor="sage"
          index={1}
        />
        <KpiCard
          label="Kechikkanlar"
          value={stats.late}
          description="Darsga kechikib keldi"
          icon={<Clock className="w-5 h-5 text-amber-500" />}
          accentColor="gold"
          index={2}
        />
        <KpiCard
          label="Sababli kelmagan"
          value={stats.absent}
          description="Oldindan ogohlantirilgan"
          icon={<AlertCircle className="w-5 h-5 text-blue-500" />}
          accentColor="blue"
          index={3}
        />
        <KpiCard
          label="Sababsiz kelmagan"
          value={stats.noShow}
          description="Qatnashmadi"
          icon={<XCircle className="w-5 h-5 text-rose-500" />}
          accentColor="danger"
          index={4}
        />
      </div>

      {/* Control bar */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Date Picker & Prev/Next */}
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={setToday}
              className="h-9 px-3 rounded-[10px] text-xs font-semibold text-charcoal-700 bg-white border border-warm-300 hover:bg-warm-50 shadow-2xs"
            >
              Bugun
            </Button>
            <div className="flex items-center bg-white border border-warm-300 rounded-[10px] shadow-2xs hover:border-warm-400 transition-colors h-9">
              <button
                type="button"
                onClick={prevDay}
                className="h-full px-2.5 flex items-center justify-center text-charcoal-500 hover:text-charcoal-800 hover:bg-warm-100 rounded-l-[9px] transition-colors"
                title="Oldingi kun"
                aria-label="Oldingi kun"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="w-36 border-x border-warm-200">
                <DatePicker
                  size="sm"
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  clearable={false}
                  aria-label="Sanani tanlash"
                  triggerClassName="border-0 shadow-none rounded-none py-1.5 focus:ring-0 bg-transparent text-center font-medium"
                />
              </div>
              <button
                type="button"
                onClick={nextDay}
                className="h-full px-2.5 flex items-center justify-center text-charcoal-500 hover:text-charcoal-800 hover:bg-warm-100 rounded-r-[9px] transition-colors"
                title="Keyingi kun"
                aria-label="Keyingi kun"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3">
            <div className="relative w-48 sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-400" />
              <input
                type="text"
                placeholder="Bola yoki mutaxassis..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full h-9 text-xs pl-8 pr-3 border border-warm-300 rounded-[10px] bg-white outline-none focus:border-brand-500 shadow-2xs placeholder:text-charcoal-400"
              />
            </div>

            {currentUser?.role !== 'SPECIALIST' && (
              <div className="w-48 sm:w-56">
                <Select
                  value={specialistFilter}
                  onChange={e => setSpecialistFilter(e.target.value)}
                  className="h-9 text-xs rounded-[10px] shadow-2xs border-warm-300"
                >
                  <option value="">Barcha mutaxassislar</option>
                  {specialists.map(s => (
                    <option key={s.id} value={s.id}>{s.fullName}</option>
                  ))}
                </Select>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Attendance List */}
      <Card className="overflow-hidden">
        {attendanceItems.length === 0 ? (
          <EmptyState
            title="Belgilangan sanada uchrashuvlar mavjud emas"
            description="Boshqa sanani tanlang yoki yangi uchrashuv rejalashtiring"
            icon={<Calendar className="w-6 h-6" />}
            className="py-16"
          />
        ) : (
          <div>
            {/* Table Header Strip for perfect alignment and visual clarity */}
            <div className="hidden sm:flex items-center justify-between px-5 py-3 bg-warm-50/80 border-b border-warm-200 text-xs font-semibold text-charcoal-500 uppercase tracking-wider">
              <span>Bola va mashg‘ulot ma’lumotlari</span>
              <span className="w-[380px] text-center">Davomat holati</span>
            </div>

            <div className="divide-y divide-warm-100">
              {attendanceItems.map(({ appointment, child, specialist, service, status }) => {
                const canEdit = currentUser?.role !== 'SPECIALIST' || appointment.specialistId === currentUser?.id;

                return (
                  <div
                    key={appointment.id}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-warm-50/50 transition-colors"
                  >
                    {/* Child & Appointment Info */}
                    <div className="flex items-center gap-3.5 min-w-[260px] flex-1">
                      <Avatar name={child?.fullName ?? 'Bola'} size="md" />
                      <div>
                        <h4 className="text-sm font-bold text-charcoal-900">{child?.fullName ?? 'Noma’lum'}</h4>
                        <p className="text-xs text-charcoal-500">
                          {service?.name} • <span className="font-semibold text-brand-600">{appointment.startTime} - {appointment.endTime}</span>
                        </p>
                        <p className="text-[11px] text-charcoal-400 mt-0.5">
                          Mutaxassis: {specialist?.fullName ?? '—'}
                        </p>
                      </div>
                    </div>

                    {/* Attendance Status Action / Indicator */}
                    {canEdit ? (
                      <div className="w-full sm:w-[380px] flex-shrink-0">
                        <div className="grid grid-cols-4 p-1 bg-warm-100/90 rounded-[10px] border border-warm-200/90 shadow-2xs gap-1">
                          {ATTENDANCE_OPTIONS.map(opt => {
                            const isSelected = status === opt.status;
                            const Icon = opt.icon;
                            return (
                              <button
                                key={opt.status}
                                type="button"
                                onClick={() => handleMark(appointment.id, appointment.childId, appointment.specialistId, opt.status, status)}
                                className={cn(
                                  'h-8 px-1.5 flex items-center justify-center gap-1.5 rounded-[7px] text-xs font-semibold transition-all duration-150 cursor-pointer',
                                  isSelected
                                    ? cn(opt.activeClass, 'ring-1 ring-black/5')
                                    : 'text-charcoal-600 hover:text-charcoal-900 hover:bg-white/80'
                                )}
                                title={opt.title}
                              >
                                <Icon className={cn('w-3.5 h-3.5 flex-shrink-0', isSelected ? 'text-white' : opt.iconColor)} />
                                <span className="truncate">{opt.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="w-full sm:w-[380px] flex-shrink-0 flex items-center justify-start sm:justify-end">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-charcoal-400">Holati:</span>
                          {getStatusBadge(status)}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
