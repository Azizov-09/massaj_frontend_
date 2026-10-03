// ═══════════════════════════════════════════════════════
//  Attendance Page — Real-time Daily Attendance Journal
// ═══════════════════════════════════════════════════════

import { useState, useMemo } from 'react';
import {
  Calendar, CheckCircle2, Clock, XCircle, AlertCircle,
  ChevronLeft, ChevronRight, UserCheck, Search, Users,
  CheckCheck, X, Sparkles, Quote, FileText
} from 'lucide-react';
import { useStore, useAuth } from '@/store';
import { cn } from '@/utils';
import { Card, Badge, Avatar, Select, EmptyState, DatePicker } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { PageHeader, KpiCard } from '@/components/ui/KpiCard';
import { Modal } from '@/components/ui/Modal';
import { format, parseISO, isToday, differenceInYears } from 'date-fns';
import { uz } from 'date-fns/locale';
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
  const parents = useStore(s => s.parents);
  const specialists = useStore(s => s.specialists);
  const services = useStore(s => s.services);
  const recordAttendance = useStore(s => s.recordAttendance);
  const removeAttendance = useStore(s => s.removeAttendance);

  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [specialistFilter, setSpecialistFilter] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilterTab, setStatusFilterTab] = useState<'ALL' | AttendanceStatus | 'UNMARKED'>('ALL');

  // Quick Note modal state
  const [editingNoteRecord, setEditingNoteRecord] = useState<{
    appointmentId: string;
    childName: string;
    serviceName: string;
    time: string;
    status: AttendanceStatus | null;
    note: string;
  } | null>(null);

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

  const dateFormatted = useMemo(() => {
    try {
      const d = parseISO(selectedDate);
      const str = format(d, 'EEEE, d-MMMM, yyyy', { locale: uz });
      return str.charAt(0).toUpperCase() + str.slice(1);
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  const isCurrentDay = useMemo(() => {
    try {
      return isToday(parseISO(selectedDate));
    } catch {
      return false;
    }
  }, [selectedDate]);

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
      const parent = parents.find(p => p.id === apt.parentId || (child && p.childrenIds.includes(child.id)));

      return {
        appointment: apt,
        child,
        parent,
        specialist: spec,
        service: svc,
        attendanceRecord: attRecord,
        status: attRecord?.status ?? null,
      };
    }).filter(item => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        item.child?.fullName?.toLowerCase().includes(q) ||
        item.specialist?.fullName?.toLowerCase().includes(q) ||
        item.service?.name?.toLowerCase().includes(q) ||
        item.parent?.fullName?.toLowerCase().includes(q)
      );
    });
  }, [dayAppointments, attendance, children, parents, specialists, services, search]);

  // Filtered by status tab
  const filteredAttendanceItems = useMemo(() => {
    return attendanceItems.filter(item => {
      if (statusFilterTab === 'ALL') return true;
      if (statusFilterTab === 'UNMARKED') return !item.status;
      return item.status === statusFilterTab;
    });
  }, [attendanceItems, statusFilterTab]);

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
    const unmarked = Math.max(0, total - (present + late + absent + noShow));

    return { total, present, late, absent, noShow, attended, rate, unmarked };
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

  const handleMarkAllPresent = () => {
    const unmarked = attendanceItems.filter(item => !item.status);
    if (unmarked.length === 0) return;
    unmarked.forEach(item => {
      recordAttendance({
        appointmentId: item.appointment.id,
        childId: item.appointment.childId,
        specialistId: item.appointment.specialistId,
        date: selectedDate,
        status: 'PRESENT',
        note: "O‘z vaqtida qatnashdi",
      });
    });
  };

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNoteRecord) return;
    const apt = appointments.find(a => a.id === editingNoteRecord.appointmentId);
    if (!apt) return;
    const targetStatus = editingNoteRecord.status || 'PRESENT';
    recordAttendance({
      appointmentId: editingNoteRecord.appointmentId,
      childId: apt.childId,
      specialistId: apt.specialistId,
      date: selectedDate,
      status: targetStatus,
      note: editingNoteRecord.note.trim() || undefined,
    });
    setEditingNoteRecord(null);
  };

  const getStatusBadge = (status: AttendanceStatus | null) => {
    switch (status) {
      case 'PRESENT':
        return <Badge variant="success" dot>Keldi</Badge>;
      case 'LATE':
        return <Badge variant="warning" dot>Kechikdi</Badge>;
      case 'ABSENT':
        return <Badge variant="info" dot>Sababli kelmadi</Badge>;
      case 'NO_SHOW':
        return <Badge variant="danger" dot>Sababsiz kelmadi</Badge>;
      default:
        return <Badge variant="neutral" dot>Kutilmoqda</Badge>;
    }
  };

  const canEditGeneral = currentUser?.role !== 'SPECIALIST';

  return (
    <div className="px-4 lg:px-6 py-6 max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Davomat jurnali"
        description="Har kungi seanslar va uchrashuvlar bo‘yicha bolalar qatnashuvi"
        actions={
          canEditGeneral && stats.unmarked > 0 ? (
            <Button
              size="sm"
              variant="secondary"
              onClick={handleMarkAllPresent}
              className="gap-2 bg-white text-emerald-700 hover:bg-emerald-50 border border-emerald-200/80 shadow-2xs font-semibold"
              title="Barcha kutilayotgan uchrashuvlarni 'Keldi' deb belgilash"
            >
              <CheckCheck className="w-4 h-4 text-emerald-600" />
              <span>Barchasini keldi deb belgilash ({stats.unmarked})</span>
            </Button>
          ) : undefined
        }
      />

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <KpiCard
          label="Davomat darajasi"
          value={`${stats.rate}%`}
          description={`${stats.present + stats.late} / ${stats.total} qatnashdi`}
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
      <Card className="p-4 space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Date Picker & Prev/Next */}
          <div className="flex flex-wrap items-center gap-2.5">
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
                className="h-full px-2.5 flex items-center justify-center text-charcoal-500 hover:text-charcoal-800 hover:bg-warm-100 rounded-l-[9px] transition-colors cursor-pointer"
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
                  triggerClassName="border-0 shadow-none rounded-none py-1.5 focus:ring-0 bg-transparent text-center font-semibold text-xs text-charcoal-800"
                />
              </div>
              <button
                type="button"
                onClick={nextDay}
                className="h-full px-2.5 flex items-center justify-center text-charcoal-500 hover:text-charcoal-800 hover:bg-warm-100 rounded-r-[9px] transition-colors cursor-pointer"
                title="Keyingi kun"
                aria-label="Keyingi kun"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Human date badge */}
            <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-warm-100/70 border border-warm-200/80 text-xs font-semibold text-charcoal-700">
              <Calendar className="w-3.5 h-3.5 text-brand-500" />
              <span>{dateFormatted}</span>
              {isCurrentDay && (
                <Badge variant="success" className="text-[10px] py-0 px-1 font-bold">
                  Bugun
                </Badge>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-48 sm:w-60">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Bola yoki mutaxassis..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full h-9 text-xs pl-8.5 pr-8 border border-warm-300 rounded-[10px] bg-white outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100/80 shadow-2xs placeholder:text-charcoal-400 transition-all"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-charcoal-400 hover:text-charcoal-700 p-0.5 rounded-full cursor-pointer"
                  title="Qidiruvni tozalash"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {currentUser?.role !== 'SPECIALIST' && (
              <div className="w-48 sm:w-56">
                <Select
                  size="sm"
                  triggerClassName="h-9 rounded-[10px] text-xs shadow-2xs border-warm-300"
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
        </div>

        {/* Quick Status Filter Tabs */}
        <div className="pt-2 border-t border-warm-100 flex items-center justify-between gap-2 overflow-x-auto touch-scroll-x scrollbar-thin">
          <div className="flex items-center gap-1.5 flex-nowrap">
            {[
              { key: 'ALL', label: 'Barchasi', count: stats.total },
              { key: 'PRESENT', label: 'Kelgan', count: stats.present },
              { key: 'LATE', label: 'Kechikkan', count: stats.late },
              { key: 'ABSENT', label: 'Sababli', count: stats.absent },
              { key: 'NO_SHOW', label: 'Sababsiz', count: stats.noShow },
              { key: 'UNMARKED', label: 'Kutilmoqda', count: stats.unmarked },
            ].map(tab => {
              const isActive = statusFilterTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={(e) => {
                    setStatusFilterTab(tab.key as any);
                    e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
                  }}
                  className={cn(
                    'shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-xs font-semibold transition-all cursor-pointer whitespace-nowrap select-none',
                    isActive
                      ? 'bg-charcoal-900 text-white shadow-xs'
                      : 'bg-white text-charcoal-600 hover:text-charcoal-900 hover:bg-warm-100 border border-warm-200/90 shadow-2xs'
                  )}
                >
                  <span>{tab.label}</span>
                  <span
                    className={cn(
                      'text-[10px] px-1.5 py-0.2 rounded-full font-bold tabular-nums',
                      isActive ? 'bg-white/20 text-white' : 'bg-warm-100 text-charcoal-700'
                    )}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          <span className="text-xs text-charcoal-400 font-medium shrink-0 hidden sm:inline-block">
            {filteredAttendanceItems.length} ta natija
          </span>
        </div>
      </Card>

      {/* Attendance List Card */}
      <Card className="overflow-hidden">
        {filteredAttendanceItems.length === 0 ? (
          <EmptyState
            title={dayAppointments.length === 0 ? 'Belgilangan sanada uchrashuvlar mavjud emas' : 'Tanlangan holat bo‘yicha natija topilmadi'}
            description={dayAppointments.length === 0 ? 'Boshqa sanani tanlang yoki yangi uchrashuv rejalashtiring' : 'Boshqa status filtrini tanlab ko‘ring'}
            icon={<Calendar className="w-6 h-6" />}
            className="py-16"
            action={
              statusFilterTab !== 'ALL' ? (
                <Button size="sm" variant="secondary" onClick={() => setStatusFilterTab('ALL')}>
                  Barcha uchrashuvlarni ko‘rish
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div>
            {/* Table Header Strip for perfect alignment and visual clarity */}
            <div className="hidden md:grid grid-cols-12 items-center px-5 py-3 bg-warm-50/80 border-b border-warm-200 text-xs font-semibold text-charcoal-500 uppercase tracking-wider">
              <span className="col-span-4">Bola va mashg‘ulot ma’lumotlari</span>
              <span className="col-span-3">Mutaxassis va vaqt</span>
              <span className="col-span-5 text-right pr-6">Davomat holati</span>
            </div>

            <div className="divide-y divide-warm-100">
              {filteredAttendanceItems.map(({ appointment, child, parent, specialist, service, status, attendanceRecord }) => {
                const canEdit = currentUser?.role !== 'SPECIALIST' || appointment.specialistId === currentUser?.id;

                return (
                  <div
                    key={appointment.id}
                    className="p-4 sm:p-5 flex flex-col md:grid md:grid-cols-12 md:items-center justify-between gap-4 hover:bg-warm-50/50 transition-colors group"
                  >
                    {/* Child & Parent Details (col-span-4) */}
                    <div className="flex items-center gap-3.5 min-w-0 md:col-span-4">
                      <Avatar name={child?.fullName ?? 'Bola'} size="md" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-charcoal-900 truncate">
                            {child?.fullName ?? 'Noma’lum'}
                          </h4>
                          {child?.dateOfBirth && (
                            <span className="text-[10px] font-semibold text-charcoal-500 bg-warm-100/90 px-1.5 py-0.5 rounded-[5px] shrink-0 border border-warm-200/60">
                              {differenceInYears(new Date(), parseISO(child.dateOfBirth))} yosh
                            </span>
                          )}
                        </div>
                        {parent && (
                          <p className="text-[11px] text-charcoal-500 flex items-center gap-1.5 mt-0.5 truncate">
                            <Users className="w-3 h-3 text-charcoal-400 shrink-0" />
                            <span className="truncate">{parent.fullName}</span>
                            {parent.phone && (
                              <span className="text-charcoal-400 text-[10px] shrink-0 font-mono">({parent.phone})</span>
                            )}
                          </p>
                        )}
                        {/* Mobile view service/time summary */}
                        <div className="flex md:hidden items-center gap-2 mt-1 text-xs text-charcoal-600">
                          <span className="font-semibold text-brand-600">{appointment.startTime} - {appointment.endTime}</span>
                          <span>•</span>
                          <span className="truncate font-medium">{service?.name}</span>
                        </div>
                      </div>
                    </div>

                    {/* Service, Specialist & Time Slot (col-span-3, desktop) */}
                    <div className="hidden md:flex flex-col min-w-0 md:col-span-3 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-[6px] text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200/70 truncate max-w-[210px]" title={service?.name}>
                          {service?.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-charcoal-600 truncate" title={`Mutaxassis: ${specialist?.fullName ?? '—'}`}>
                        <UserCheck className="w-3.5 h-3.5 text-charcoal-400 shrink-0" />
                        <span className="truncate font-medium">{specialist?.fullName ?? '—'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-brand-600">
                        <Clock className="w-3 h-3 text-brand-500 shrink-0" />
                        <span>{appointment.startTime} - {appointment.endTime}</span>
                      </div>
                    </div>

                    {/* Attendance Status Action / Indicator (col-span-5) */}
                    <div className="w-full md:col-span-5 flex flex-col items-start md:items-end gap-1.5">
                      {canEdit ? (
                        <div className="w-full md:w-[380px]">
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
                                    'h-8 px-1.5 flex items-center justify-center gap-1.5 rounded-[7px] text-xs font-semibold transition-all duration-150 cursor-pointer active:scale-95',
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

                          {/* Quick note & status feedback strip */}
                          <div className="flex items-center justify-between mt-1 px-1 text-[11px]">
                            {attendanceRecord?.note && attendanceRecord.note !== `Belgilandi: ${status}` ? (
                              <button
                                type="button"
                                onClick={() => setEditingNoteRecord({
                                  appointmentId: appointment.id,
                                  childName: child?.fullName ?? 'Bola',
                                  serviceName: service?.name ?? 'Xizmat',
                                  time: `${appointment.startTime} - ${appointment.endTime}`,
                                  status,
                                  note: attendanceRecord.note ?? '',
                                })}
                                className="flex items-center gap-1 text-charcoal-600 hover:text-brand-600 transition-colors truncate max-w-[260px] cursor-pointer"
                                title="Izohni tahrirlash"
                              >
                                <Quote className="w-3 h-3 text-brand-500 shrink-0" />
                                <span className="truncate italic">"{attendanceRecord.note}"</span>
                              </button>
                            ) : status ? (
                              <button
                                type="button"
                                onClick={() => setEditingNoteRecord({
                                  appointmentId: appointment.id,
                                  childName: child?.fullName ?? 'Bola',
                                  serviceName: service?.name ?? 'Xizmat',
                                  time: `${appointment.startTime} - ${appointment.endTime}`,
                                  status,
                                  note: '',
                                })}
                                className="text-charcoal-400 hover:text-brand-600 transition-colors flex items-center gap-1 cursor-pointer font-medium"
                                title="Izoh qo‘shish"
                              >
                                <FileText className="w-3 h-3" />
                                <span>+ Izoh kiritish</span>
                              </button>
                            ) : (
                              <span className="text-charcoal-400 text-[10px]">Holatni tanlang</span>
                            )}

                            {status && (
                              <span className="text-charcoal-400 text-[10px] ml-auto">
                                Bekor qilish uchun qayta bosing
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="w-full md:w-[380px] flex items-center justify-start md:justify-end">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-charcoal-400">Holati:</span>
                            {getStatusBadge(status)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Table Footer Summary Strip */}
            <div className="px-5 py-3.5 bg-warm-50/70 border-t border-warm-200/80 flex flex-wrap items-center justify-between gap-3 text-xs text-charcoal-600 font-medium">
              <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                <span>Jami: <strong className="text-charcoal-900 font-bold">{stats.total}</strong> ta uchrashuv</span>
                <span>•</span>
                <span className="text-emerald-700">Qatnashdi: <strong className="font-bold">{stats.present + stats.late}</strong> ta</span>
                <span>•</span>
                <span className="text-rose-700">Kelmagan: <strong className="font-bold">{stats.absent + stats.noShow}</strong> ta</span>
                {stats.unmarked > 0 && (
                  <>
                    <span>•</span>
                    <span className="text-amber-700">Kutilmoqda: <strong className="font-bold">{stats.unmarked}</strong> ta</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-charcoal-400">Davomat ko‘rsatkichi:</span>
                <span className={cn('font-bold tabular-nums px-2 py-0.5 rounded-[6px] text-xs border', stats.rate >= 80 ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80' : 'bg-amber-50 text-amber-700 border-amber-200/80')}>
                  {stats.rate}%
                </span>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Attendance Note Modal */}
      <Modal
        isOpen={!!editingNoteRecord}
        onClose={() => setEditingNoteRecord(null)}
        title="Davomatga izoh kiritish"
        size="md"
      >
        {editingNoteRecord && (
          <form onSubmit={handleSaveNote} className="space-y-4">
            <div className="p-3 bg-warm-50/80 rounded-[10px] border border-warm-200/80 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-charcoal-900">{editingNoteRecord.childName}</span>
                {getStatusBadge(editingNoteRecord.status)}
              </div>
              <p className="text-xs text-charcoal-500">
                {editingNoteRecord.serviceName} • <span className="font-semibold text-brand-600">{editingNoteRecord.time}</span>
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1.5">
                Izoh yoki sabab
              </label>
              <textarea
                rows={3}
                value={editingNoteRecord.note}
                onChange={e => setEditingNoteRecord({ ...editingNoteRecord, note: e.target.value })}
                placeholder="Masalan: 15 daqiqa kechikib keldi, ota-onasi telefon qilib ogohlantirdi..."
                className="w-full text-xs p-3 border border-warm-300 rounded-[10px] bg-white outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100/80 shadow-2xs placeholder:text-charcoal-400"
              />
            </div>

            {/* Quick Templates */}
            <div>
              <p className="text-[11px] font-semibold text-charcoal-500 mb-1.5 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-brand-500" />
                <span>Tezkor shablonlar:</span>
              </p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "Ota-onasi ogohlantirdi",
                  "15 daqiqa kechikib keldi",
                  "Salomatligi sababli kela olmadi",
                  "O‘z vaqtida qatnashdi",
                  "Tirbandlik sababli kechikdi",
                ].map(tmpl => (
                  <button
                    key={tmpl}
                    type="button"
                    onClick={() => setEditingNoteRecord({ ...editingNoteRecord, note: tmpl })}
                    className="text-[11px] px-2.5 py-1 rounded-[6px] bg-warm-100 text-charcoal-700 hover:bg-brand-50 hover:text-brand-700 border border-warm-200/80 transition-colors cursor-pointer"
                  >
                    {tmpl}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-warm-100">
              <Button type="button" variant="secondary" size="sm" onClick={() => setEditingNoteRecord(null)}>
                Bekor qilish
              </Button>
              <Button type="submit" size="sm">
                Izohni saqlash
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
