// ═══════════════════════════════════════════════════════
//  Attendance Page — Real-time Daily Attendance Journal
// ═══════════════════════════════════════════════════════

import { useState, useMemo } from 'react';
import {
  Calendar, CheckCircle2, Clock, XCircle, AlertCircle,
  Users, ChevronLeft, ChevronRight, UserCheck, Search, Filter
} from 'lucide-react';
import { useStore, useAuth } from '@/store';
import { formatDate, cn } from '@/utils';
import { Card, Badge, Avatar, Select, EmptyState } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { PageHeader, KpiCard } from '@/components/ui/KpiCard';
import type { AttendanceStatus } from '@/types';

export function AttendancePage() {
  const { currentUser } = useAuth();
  const appointments = useStore(s => s.appointments);
  const attendance = useStore(s => s.attendance);
  const children = useStore(s => s.children);
  const specialists = useStore(s => s.specialists);
  const services = useStore(s => s.services);
  const recordAttendance = useStore(s => s.recordAttendance);

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
      if (specialistFilter && a.specialistId !== specialistFilter) return false;
      return true;
    });
  }, [appointments, selectedDate, specialistFilter]);

  // Combined attendance records for the day's appointments
  const attendanceItems = useMemo(() => {
    return dayAppointments.map(apt => {
      const child = children.find(c => c.id === apt.childId);
      const spec = specialists.find(s => s.id === apt.specialistId);
      const svc = services.find(s => s.id === apt.serviceId);
      const attRecord = attendance.find(
        att => att.appointmentId === apt.id || (att.childId === apt.childId && att.date === selectedDate)
      );

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
  }, [dayAppointments, attendance, children, specialists, services, selectedDate, search]);

  // Daily statistics
  const stats = useMemo(() => {
    const total = dayAppointments.length;
    let present = 0;
    let late = 0;
    let absent = 0;
    let noShow = 0;

    dayAppointments.forEach(apt => {
      const att = attendance.find(
        a => a.appointmentId === apt.id || (a.childId === apt.childId && a.date === selectedDate)
      );
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
  }, [dayAppointments, attendance, selectedDate]);

  const handleMark = (appointmentId: string, childId: string, specialistId: string, status: AttendanceStatus) => {
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
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <KpiCard
          label="Davomat darajasi"
          value={`${stats.rate}%`}
          change={`${stats.present + stats.late} / ${stats.total} qatnashdi`}
          changeType={stats.rate >= 80 ? 'positive' : 'negative'}
          icon={<UserCheck className="w-5 h-5 text-brand-500" />}
        />
        <KpiCard
          label="Kelganlar"
          value={stats.present}
          icon={<CheckCircle2 className="w-5 h-5 text-sage-600" />}
        />
        <KpiCard
          label="Kechikkanlar"
          value={stats.late}
          icon={<Clock className="w-5 h-5 text-gold-500" />}
        />
        <KpiCard
          label="Sababli kelmagan"
          value={stats.absent}
          icon={<AlertCircle className="w-5 h-5 text-blue-500" />}
        />
        <KpiCard
          label="Sababsiz kelmagan"
          value={stats.noShow}
          icon={<XCircle className="w-5 h-5 text-danger-main" />}
        />
      </div>

      {/* Control bar */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Date Picker & Prev/Next */}
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={setToday}>
              Bugun
            </Button>
            <div className="flex items-center gap-1 bg-warm-100 p-1 rounded-xl">
              <button onClick={prevDay} className="p-1.5 hover:bg-white rounded-lg text-charcoal-700">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 text-xs sm:text-sm font-semibold text-charcoal-900 min-w-[140px] text-center">
                {formatDate(selectedDate)}
              </span>
              <button onClick={nextDay} className="p-1.5 hover:bg-white rounded-lg text-charcoal-700">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="text-xs border border-warm-300 rounded-xl px-2.5 py-1.5 bg-white text-charcoal-700 outline-none focus:border-brand-500"
            />
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
                className="w-full text-xs pl-8 pr-3 py-1.5 border border-warm-300 rounded-xl bg-white outline-none focus:border-brand-500"
              />
            </div>

            {currentUser?.role !== 'SPECIALIST' && (
              <div className="w-48 sm:w-56">
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
          <div className="divide-y divide-warm-100">
            {attendanceItems.map(({ appointment, child, specialist, service, status }) => (
              <div
                key={appointment.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-warm-50/50 transition-colors"
              >
                {/* Child & Appointment Info */}
                <div className="flex items-center gap-3.5 min-w-[260px]">
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

                {/* Status indicator */}
                <div className="flex items-center gap-3">
                  <div className="text-left sm:text-right">
                    <span className="text-[11px] text-charcoal-400 block mb-0.5">Holati</span>
                    {getStatusBadge(status)}
                  </div>

                  {/* Quick Action Toggle Buttons */}
                  <div className="flex items-center gap-1.5 bg-warm-100/80 p-1 rounded-xl">
                    <button
                      onClick={() => handleMark(appointment.id, appointment.childId, appointment.specialistId, 'PRESENT')}
                      className={cn(
                        'px-2.5 py-1 text-xs font-semibold rounded-lg transition-all',
                        status === 'PRESENT'
                          ? 'bg-sage-600 text-white shadow-xs'
                          : 'text-charcoal-600 hover:bg-white hover:text-charcoal-900'
                      )}
                      title="Keldi"
                    >
                      Keldi
                    </button>
                    <button
                      onClick={() => handleMark(appointment.id, appointment.childId, appointment.specialistId, 'LATE')}
                      className={cn(
                        'px-2.5 py-1 text-xs font-semibold rounded-lg transition-all',
                        status === 'LATE'
                          ? 'bg-gold-500 text-white shadow-xs'
                          : 'text-charcoal-600 hover:bg-white hover:text-charcoal-900'
                      )}
                      title="Kechikdi"
                    >
                      Kechikdi
                    </button>
                    <button
                      onClick={() => handleMark(appointment.id, appointment.childId, appointment.specialistId, 'ABSENT')}
                      className={cn(
                        'px-2.5 py-1 text-xs font-semibold rounded-lg transition-all',
                        status === 'ABSENT'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-charcoal-600 hover:bg-white hover:text-charcoal-900'
                      )}
                      title="Sababli kelmadi"
                    >
                      Sababli
                    </button>
                    <button
                      onClick={() => handleMark(appointment.id, appointment.childId, appointment.specialistId, 'NO_SHOW')}
                      className={cn(
                        'px-2.5 py-1 text-xs font-semibold rounded-lg transition-all',
                        status === 'NO_SHOW'
                          ? 'bg-danger-main text-white shadow-xs'
                          : 'text-charcoal-600 hover:bg-white hover:text-charcoal-900'
                      )}
                      title="Sababsiz kelmadi"
                    >
                      Sababsiz
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
