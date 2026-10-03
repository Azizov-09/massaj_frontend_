// ═══════════════════════════════════════════════════════
//  Schedule Page — Interactive Day & Week Calendar
// ═══════════════════════════════════════════════════════

import { useState, useMemo } from 'react';
import {
  ChevronLeft, ChevronRight, Plus,
  CheckCircle2, Play, XCircle,
  Calendar, Clock, CalendarCheck
} from 'lucide-react';
import { useStore, useAuth } from '@/store';
import { formatDate, getAppointmentStatusColor, getAppointmentStatusLabel, cn } from '@/utils';
import { Card, Badge, Select, DatePicker, Avatar } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { PageHeader, KpiCard } from '@/components/ui/KpiCard';
import { Modal } from '@/components/ui/Modal';
import { CreateAppointmentForm } from '@/features/appointments/CreateAppointmentForm';
import type { Appointment } from '@/types';

const DEFAULT_TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
];

function getPeriodInfo(time: string) {
  const hour = parseInt(time.split(':')[0], 10);
  if (hour < 12) {
    return { label: 'Ertalab', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200/80' };
  } else if (hour <= 13) {
    return { label: 'Tushlik', badgeClass: 'bg-warm-100 text-charcoal-700 border-warm-200' };
  } else if (hour < 18) {
    return { label: 'Tushdan so‘ng', badgeClass: 'bg-blue-50 text-blue-700 border-blue-200/80' };
  } else {
    return { label: 'Kechki', badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200/80' };
  }
}

export function SchedulePage() {
  const { currentUser } = useAuth();
  const appointments = useStore(s => s.appointments);
  const children = useStore(s => s.children);
  const specialists = useStore(s => s.specialists);
  const services = useStore(s => s.services);
  const confirmAppointment = useStore(s => s.confirmAppointment);
  const startSession = useStore(s => s.startSession);
  const cancelAppointment = useStore(s => s.cancelAppointment);
  const clinicSettings = useStore(s => s.clinicSettings);

  const timeSlots = useMemo(() => {
    const startH = parseInt((clinicSettings?.workStart || '08:00').split(':')[0], 10);
    const endH = parseInt((clinicSettings?.workEnd || '18:00').split(':')[0], 10);
    const slots: string[] = [];
    for (let h = startH; h <= endH; h++) {
      slots.push(`${String(h).padStart(2, '0')}:00`);
    }
    return slots.length > 0 ? slots : DEFAULT_TIME_SLOTS;
  }, [clinicSettings?.workStart, clinicSettings?.workEnd]);

  // Today string
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Selected date
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [specialistFilter, setSpecialistFilter] = useState<string>(
    currentUser?.role === 'SPECIALIST' ? currentUser.id : ''
  );

  // Selected appointment for detail drawer/modal
  const [activeAppointment, setActiveAppointment] = useState<Appointment | null>(null);

  // Create Appointment modal state with prefilled date/time
  const [showCreate, setShowCreate] = useState(false);
  const [createInitialDate, setCreateInitialDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [createInitialTime, setCreateInitialTime] = useState<string>('09:00');

  const handleOpenCreate = (date?: string, time?: string) => {
    setCreateInitialDate(date || selectedDate);
    setCreateInitialTime(time || '09:00');
    setShowCreate(true);
  };

  // Date navigation helpers
  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - (viewMode === 'day' ? 1 : 7));
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + (viewMode === 'day' ? 1 : 7));
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  // Week days calculation
  const weekDates = useMemo(() => {
    const curr = new Date(selectedDate);
    const day = curr.getDay(); // 0 is Sunday
    const diff = curr.getDate() - day + (day === 0 ? -6 : 1); // Monday
    const monday = new Date(curr.setDate(diff));

    const days: { dateStr: string; dayName: string; dayNum: number }[] = [];
    const dayNames = ['Dush', 'Sesh', 'Chor', 'Pay', 'Juma', 'Shan'];

    for (let i = 0; i < 6; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push({
        dateStr: d.toISOString().split('T')[0],
        dayName: dayNames[i],
        dayNum: d.getDate(),
      });
    }
    return days;
  }, [selectedDate]);

  // Selected month name for week mode
  const selectedMonthName = useMemo(() => {
    const d = new Date(selectedDate);
    const monthNames = [
      'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
      'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'
    ];
    return `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
  }, [selectedDate]);

  // Formatted date title for Day view
  const formattedDateTitle = useMemo(() => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const dayNames = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
    const monthNames = [
      'yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun',
      'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'
    ];
    return `${d}-${monthNames[m - 1]} ${y}-yil, ${dayNames[dateObj.getDay()]}`;
  }, [selectedDate]);

  // Filtered appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter(apt => {
      const targetSpecialistId = currentUser?.role === 'SPECIALIST' ? currentUser.id : specialistFilter;
      if (targetSpecialistId && apt.specialistId !== targetSpecialistId) return false;
      if (viewMode === 'day') {
        return apt.date === selectedDate;
      } else {
        return weekDates.some(w => w.dateStr === apt.date);
      }
    });
  }, [appointments, selectedDate, specialistFilter, viewMode, weekDates, currentUser]);

  // KPIs calculation
  const kpis = useMemo(() => {
    const total = filteredAppointments.length;
    const pending = filteredAppointments.filter(a => ['SCHEDULED', 'CONFIRMED'].includes(a.status)).length;
    const completed = filteredAppointments.filter(a => a.status === 'COMPLETED').length;

    let freeSlots = 0;
    if (viewMode === 'day') {
      const occupiedHours = new Set(filteredAppointments.map(a => a.startTime.split(':')[0]));
      freeSlots = timeSlots.filter(t => !occupiedHours.has(t.split(':')[0])).length;
    } else {
      const occupiedPairs = new Set(filteredAppointments.map(a => `${a.date}_${a.startTime.split(':')[0]}`));
      let totalOccupied = 0;
      weekDates.forEach(w => {
        timeSlots.forEach(t => {
          if (occupiedPairs.has(`${w.dateStr}_${t.split(':')[0]}`)) {
            totalOccupied++;
          }
        });
      });
      freeSlots = Math.max(0, weekDates.length * timeSlots.length - totalOccupied);
    }

    return { total, pending, completed, freeSlots };
  }, [filteredAppointments, viewMode, weekDates, timeSlots]);

  // Appointment action handlers
  const handleConfirm = (id: string) => {
    confirmAppointment(id);
    setActiveAppointment(null);
  };

  const handleStart = (id: string) => {
    startSession(id);
    setActiveAppointment(null);
  };

  const handleCancel = (id: string) => {
    cancelAppointment(id);
    setActiveAppointment(null);
  };

  return (
    <div className="px-4 lg:px-6 py-6 max-w-[1600px] mx-auto space-y-5">
      <PageHeader
        title="Jadval"
        description="Kunlik va haftalik uchrashuvlar taqvimi hamda bandlik monitoringi"
        actions={
          <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => handleOpenCreate(selectedDate, '09:00')}>
            Yangi uchrashuv
          </Button>
        }
      />

      {/* ─── Metric KPI Cards Strip ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <KpiCard
          label="Jami qabullar"
          value={kpis.total}
          description={viewMode === 'day' ? "Tanlangan kundagi uchrashuvlar" : "Haftalik jami uchrashuvlar"}
          icon={<Calendar className="w-5 h-5 text-brand-600" />}
          accentColor="brand"
          index={0}
        />
        <KpiCard
          label="Kutilmoqda"
          value={kpis.pending}
          description="Rejadagi va tasdiqlangan"
          icon={<Clock className="w-5 h-5 text-amber-600" />}
          accentColor="gold"
          index={1}
        />
        <KpiCard
          label="Yakunlangan"
          value={kpis.completed}
          description="Muvaffaqiyatli seanslar"
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
          accentColor="sage"
          index={2}
        />
        <KpiCard
          label="Bo‘sh slotlar"
          value={kpis.freeSlots}
          description={viewMode === 'day' ? "Bugun mavjud vaqtlar" : "Hafta bo‘yicha bo‘sh slotlar"}
          icon={<CalendarCheck className="w-5 h-5 text-purple-600" />}
          accentColor="purple"
          index={3}
        />
      </div>

      {/* ─── Control Bar ─── */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Date Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleToday}
              className="h-9 px-3 rounded-[10px] text-xs font-semibold text-charcoal-700 bg-white border border-warm-300 hover:bg-warm-50 shadow-2xs cursor-pointer"
            >
              Bugun
            </Button>
            <div className="flex items-center bg-white border border-warm-300 rounded-[10px] shadow-2xs hover:border-warm-400 transition-colors h-9">
              <button
                type="button"
                onClick={handlePrevDay}
                className="h-full px-2.5 flex items-center justify-center text-charcoal-500 hover:text-charcoal-800 hover:bg-warm-100 rounded-l-[9px] transition-colors cursor-pointer"
                title={viewMode === 'day' ? 'Oldingi kun' : 'Oldingi hafta'}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {viewMode === 'day' ? (
                <div className="flex items-center border-x border-warm-200">
                  <span className="px-3 text-xs font-semibold text-charcoal-800 whitespace-nowrap min-w-[130px] text-center hidden sm:inline-block">
                    {formattedDateTitle}
                  </span>
                  <div className="w-32 border-l sm:border-l border-warm-200">
                    <DatePicker
                      size="sm"
                      value={selectedDate}
                      onChange={e => setSelectedDate(e.target.value)}
                      clearable={false}
                      aria-label="Sanani tanlash"
                      triggerClassName="border-0 shadow-none rounded-none py-1.5 focus:ring-0 bg-transparent text-center font-medium"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-center border-x border-warm-200">
                  <span className="px-3 text-xs font-semibold text-charcoal-800 whitespace-nowrap min-w-[130px] text-center">
                    {weekDates[0]?.dayNum} - {weekDates[5]?.dayNum} {selectedMonthName}
                  </span>
                  <div className="w-32 border-l border-warm-200">
                    <DatePicker
                      size="sm"
                      value={selectedDate}
                      onChange={e => setSelectedDate(e.target.value)}
                      clearable={false}
                      aria-label="Sanani tanlash"
                      triggerClassName="border-0 shadow-none rounded-none py-1.5 focus:ring-0 bg-transparent text-center font-medium"
                    />
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handleNextDay}
                className="h-full px-2.5 flex items-center justify-center text-charcoal-500 hover:text-charcoal-800 hover:bg-warm-100 rounded-r-[9px] transition-colors cursor-pointer"
                title={viewMode === 'day' ? 'Keyingi kun' : 'Keyingi hafta'}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filters & View Switcher */}
          <div className="flex items-center gap-3">
            {currentUser?.role !== 'SPECIALIST' && (
              <div className="w-48 sm:w-56">
                <Select
                  value={specialistFilter}
                  onChange={e => setSpecialistFilter(e.target.value)}
                  className="h-9 text-xs rounded-[10px] shadow-2xs border-warm-300"
                >
                  <option value="">Barcha mutaxassislar ({specialists.length})</option>
                  {specialists.map(s => (
                    <option key={s.id} value={s.id}>{s.fullName}</option>
                  ))}
                </Select>
              </div>
            )}

            <div className="flex items-center h-9 p-1 rounded-[10px] bg-warm-100/90 border border-warm-200/80 shadow-2xs gap-1">
              <button
                type="button"
                onClick={() => setViewMode('day')}
                className={cn(
                  'h-7 px-3 text-xs font-semibold rounded-[7px] transition-all cursor-pointer',
                  viewMode === 'day' ? 'bg-white shadow-xs text-charcoal-900' : 'text-charcoal-500 hover:text-charcoal-900'
                )}
              >
                Kunlik
              </button>
              <button
                type="button"
                onClick={() => setViewMode('week')}
                className={cn(
                  'h-7 px-3 text-xs font-semibold rounded-[7px] transition-all cursor-pointer',
                  viewMode === 'week' ? 'bg-white shadow-xs text-charcoal-900' : 'text-charcoal-500 hover:text-charcoal-900'
                )}
              >
                Haftalik
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* ─── Legend & Guidance Strip ─── */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-charcoal-500 px-1">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-charcoal-400 font-medium">Holat:</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            Kutilmoqda
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-sage-600" />
            Tasdiqlangan
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-brand-500" />
            Jarayonda
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
            Yakunlangan
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            Bekor qilingan
          </span>
        </div>
        <div className="text-[11px] text-charcoal-400 hidden md:block">
          💡 Bo‘sh vaqt slotini bosish orqali yangi uchrashuvni tezda band qilishingiz mumkin
        </div>
      </div>

      {/* ─── Day View ─── */}
      {viewMode === 'day' && (
        <Card className="overflow-hidden border border-warm-200 shadow-2xs">
          <div className="divide-y divide-warm-100">
            {timeSlots.map(time => {
              const slotApts = filteredAppointments.filter(a => a.startTime.startsWith(time.split(':')[0]));
              const period = getPeriodInfo(time);
              const isToday = selectedDate === todayStr;
              const currentHour = new Date().getHours();
              const isCurrentSlot = isToday && parseInt(time.split(':')[0], 10) === currentHour;

              return (
                <div
                  key={time}
                  className={cn(
                    'flex min-h-[116px] group transition-colors relative',
                    isCurrentSlot ? 'bg-brand-50/25' : 'hover:bg-warm-50/30'
                  )}
                >
                  {isCurrentSlot && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-500 rounded-r z-10" />
                  )}

                  {/* Time Badge Column */}
                  <div className="w-20 sm:w-28 p-2 sm:p-3.5 border-r border-warm-100 flex flex-col items-center justify-center shrink-0 bg-warm-50/35 select-none">
                    <span className="text-xs sm:text-sm font-bold text-charcoal-900 tracking-tight">
                      {time}
                    </span>
                    <span className={cn('text-[9px] sm:text-[10px] font-semibold px-1.5 sm:px-2 py-0.5 rounded-[6px] border mt-1 sm:mt-1.5 whitespace-nowrap', period.badgeClass)}>
                      {period.label}
                    </span>
                    {isCurrentSlot && (
                      <span className="inline-flex items-center gap-1 text-[8px] sm:text-[9px] font-bold text-brand-600 mt-1 uppercase tracking-wider">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
                        Hozir
                      </span>
                    )}
                  </div>

                  {/* Slot Content Area */}
                  <div className="flex-1 p-2 sm:p-3 flex items-stretch">
                    {slotApts.length === 0 ? (
                      <button
                        type="button"
                        onClick={() => handleOpenCreate(selectedDate, time)}
                        className="w-full min-h-[76px] sm:min-h-[92px] h-full border-2 border-dashed border-warm-200/90 hover:border-brand-400 bg-warm-50/20 hover:bg-brand-50/30 rounded-[14px] p-2.5 sm:px-4 sm:py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 transition-all duration-150 group/slot cursor-pointer text-left focus:outline-hidden focus:ring-2 focus:ring-brand-400"
                      >
                        <div className="flex items-center gap-2.5 sm:gap-3">
                          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-warm-100 group-hover/slot:bg-brand-100 text-charcoal-400 group-hover/slot:text-brand-600 flex items-center justify-center transition-colors shadow-2xs shrink-0">
                            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform group-hover/slot:rotate-90 duration-200" />
                          </div>
                          <div>
                            <span className="text-xs font-semibold text-charcoal-700 group-hover/slot:text-brand-800 transition-colors block">
                              Bo‘sh vaqt sloti — {time}
                            </span>
                            <span className="text-[10px] sm:text-[11px] text-charcoal-400 group-hover/slot:text-brand-600 transition-colors line-clamp-1 sm:line-clamp-none">
                              Ushbu soatga yangi uchrashuv belgilash uchun bosing
                            </span>
                          </div>
                        </div>
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 bg-white group-hover/slot:bg-brand-50 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-warm-200 group-hover/slot:border-brand-300 shadow-2xs transition-all duration-150 self-end sm:self-auto shrink-0">
                          <Plus className="w-3.5 h-3.5" />
                          Yozilish
                        </span>
                      </button>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 w-full items-stretch">
                        {slotApts.map(apt => {
                          const child = children.find(c => c.id === apt.childId);
                          const spec = specialists.find(s => s.id === apt.specialistId);
                          const svc = services.find(s => s.id === apt.serviceId);
                          return (
                            <div
                              key={apt.id}
                              onClick={() => setActiveAppointment(apt)}
                              className="p-3.5 rounded-[14px] border border-warm-200/90 bg-white hover:border-brand-400 hover:shadow-xs shadow-[0_1px_3px_0_rgb(0_0_0/0.06)] transition-all cursor-pointer flex flex-col justify-between group/card relative min-h-[92px] h-full"
                            >
                              <div>
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <Avatar name={child?.fullName ?? 'Bola'} size="xs" />
                                    <div className="min-w-0">
                                      <span className="text-xs font-bold text-charcoal-900 truncate block group-hover/card:text-brand-700 transition-colors">
                                        {child?.fullName ?? 'Noma’lum bola'}
                                      </span>
                                      <span className="text-[10px] text-charcoal-400 truncate block">
                                        {spec?.fullName ? `Mutaxassis: ${spec.fullName}` : 'Mutaxassis belgilanmagan'}
                                      </span>
                                    </div>
                                  </div>
                                  <Badge className={getAppointmentStatusColor(apt.status)} dot>
                                    {getAppointmentStatusLabel(apt.status)}
                                  </Badge>
                                </div>
                              </div>

                              <div className="flex items-center justify-between text-[11px] pt-2.5 mt-1 border-t border-warm-100 text-charcoal-600">
                                <span className="truncate font-medium text-charcoal-700">{svc?.name ?? 'Xizmat'}</span>
                                <span className="font-semibold text-charcoal-800 bg-warm-100/70 px-2 py-0.5 rounded-[6px] text-[10px] whitespace-nowrap">
                                  {apt.startTime} - {apt.endTime}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                        {slotApts.length > 0 && slotApts.length < 3 && (
                          <button
                            type="button"
                            onClick={() => handleOpenCreate(selectedDate, time)}
                            className="border border-dashed border-warm-200 hover:border-brand-300 bg-warm-50/20 hover:bg-brand-50/30 rounded-[14px] p-3 flex items-center justify-center gap-1.5 text-xs font-medium text-charcoal-400 hover:text-brand-700 transition-all cursor-pointer min-h-[92px] h-full"
                            title="Ushbu soatga yana uchrashuv qo‘shish"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>+ Qo‘shish</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* ─── Week View ─── */}
      {viewMode === 'week' && (
        <Card className="overflow-x-auto touch-scroll-x scrollbar-thin border border-warm-200 shadow-2xs">
          <div className="min-w-[960px]">
            {/* Week Header Row */}
            <div className="grid grid-cols-7 border-b border-warm-200 bg-warm-50/50">
              <div className="p-3 text-center text-xs font-bold text-charcoal-400 border-r border-warm-100 flex items-center justify-center">
                Vaqt
              </div>
              {weekDates.map(w => {
                const isToday = w.dateStr === todayStr;
                return (
                  <div
                    key={w.dateStr}
                    className={cn(
                      'p-3 text-center border-r border-warm-100 last:border-r-0 transition-colors',
                      isToday && 'bg-brand-50/70 font-semibold'
                    )}
                  >
                    <p className={cn('text-xs font-medium', isToday ? 'text-brand-700 font-bold' : 'text-charcoal-500')}>
                      {w.dayName}
                    </p>
                    <div className="mt-0.5 flex items-center justify-center">
                      <span
                        className={cn(
                          'text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full',
                          isToday ? 'bg-brand-600 text-white shadow-2xs' : 'text-charcoal-900'
                        )}
                      >
                        {w.dayNum}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Time Slot Rows */}
            <div className="divide-y divide-warm-100">
              {timeSlots.map(time => (
                <div key={time} className="grid grid-cols-7 min-h-[80px]">
                  <div className="p-2 text-center text-xs font-bold text-charcoal-500 border-r border-warm-100 flex flex-col items-center justify-center bg-warm-50/20">
                    <span>{time}</span>
                  </div>
                  {weekDates.map(w => {
                    const apts = filteredAppointments.filter(
                      a => a.date === w.dateStr && a.startTime.startsWith(time.split(':')[0])
                    );
                    const isToday = w.dateStr === todayStr;
                    return (
                      <div
                        key={w.dateStr}
                        className={cn(
                          'p-1.5 border-r border-warm-100 last:border-r-0 space-y-1.5 relative group/wcell transition-colors',
                          isToday ? 'bg-brand-50/10' : 'hover:bg-warm-50/30'
                        )}
                      >
                        {apts.length === 0 ? (
                          <button
                            type="button"
                            onClick={() => handleOpenCreate(w.dateStr, time)}
                            className="w-full h-full min-h-[58px] rounded-lg border border-transparent group-hover/wcell:border-dashed group-hover/wcell:border-brand-300 group-hover/wcell:bg-brand-50/30 flex items-center justify-center text-transparent group-hover/wcell:text-brand-600 transition-all cursor-pointer"
                            title={`${w.dayName}, ${time} ga uchrashuv yozish`}
                          >
                            <Plus className="w-4 h-4 opacity-0 group-hover/wcell:opacity-100 transition-opacity" />
                          </button>
                        ) : (
                          apts.map(apt => {
                            const child = children.find(c => c.id === apt.childId);
                            return (
                              <div
                                key={apt.id}
                                onClick={() => setActiveAppointment(apt)}
                                className="p-2 rounded-[10px] border border-warm-200 bg-white hover:border-brand-400 hover:shadow-xs shadow-2xs cursor-pointer transition-all text-[11px] min-h-[58px] flex flex-col justify-between"
                              >
                                <div className="flex items-center gap-1.5 mb-1">
                                  <Avatar name={child?.fullName ?? 'Bola'} size="xs" />
                                  <p className="font-bold text-charcoal-900 truncate leading-tight">
                                    {child?.fullName}
                                  </p>
                                </div>
                                <div className="flex items-center justify-between text-[10px] text-charcoal-500">
                                  <span>{apt.startTime}</span>
                                  <Badge className={cn('text-[9px] px-1 py-0', getAppointmentStatusColor(apt.status))}>
                                    {getAppointmentStatusLabel(apt.status)}
                                  </Badge>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* ─── Appointment Detail Modal ─── */}
      <Modal
        isOpen={!!activeAppointment}
        onClose={() => setActiveAppointment(null)}
        title="Uchrashuv tafsilotlari"
        size="md"
      >
        {activeAppointment && (() => {
          const child = children.find(c => c.id === activeAppointment.childId);
          const spec = specialists.find(s => s.id === activeAppointment.specialistId);
          const svc = services.find(s => s.id === activeAppointment.serviceId);

          return (
            <div className="space-y-4">
              <div className="p-4 rounded-[14px] bg-warm-50/80 border border-warm-200/90 shadow-2xs flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar name={child?.fullName ?? 'Bola'} size="md" />
                  <div>
                    <h4 className="text-base font-bold text-charcoal-900">{child?.fullName}</h4>
                    <p className="text-xs text-charcoal-500">Mutaxassis: {spec?.fullName ?? 'Biriktirilmagan'}</p>
                  </div>
                </div>
                <Badge className={getAppointmentStatusColor(activeAppointment.status)} dot>
                  {getAppointmentStatusLabel(activeAppointment.status)}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-[12px] bg-white border border-warm-200 shadow-2xs">
                  <span className="text-charcoal-400 block mb-1">Xizmat turi</span>
                  <span className="font-semibold text-charcoal-800">{svc?.name ?? '—'}</span>
                  {svc?.durationMinutes && (
                    <span className="text-[11px] text-charcoal-400 block mt-0.5">Davomiyligi: {svc.durationMinutes} daqiqa</span>
                  )}
                </div>
                <div className="p-3.5 rounded-[12px] bg-white border border-warm-200 shadow-2xs">
                  <span className="text-charcoal-400 block mb-1">Vaqti va sanasi</span>
                  <span className="font-semibold text-charcoal-800">
                    {formatDate(activeAppointment.date)}
                  </span>
                  <span className="text-[11px] text-charcoal-500 block mt-0.5 font-medium">
                    {activeAppointment.startTime} - {activeAppointment.endTime}
                  </span>
                </div>
              </div>

              {activeAppointment.notes && (
                <div className="p-3.5 rounded-[12px] bg-white border border-warm-200 text-xs shadow-2xs">
                  <span className="text-charcoal-400 block mb-1 font-medium">Izoh / Qo‘shimcha ma’lumot</span>
                  <p className="text-charcoal-700 whitespace-pre-wrap">{activeAppointment.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap items-center justify-end gap-2.5 pt-4 border-t border-warm-100">
                {activeAppointment.status === 'SCHEDULED' && (
                  <Button
                    size="sm"
                    variant="success"
                    leftIcon={<CheckCircle2 className="w-4 h-4" />}
                    onClick={() => handleConfirm(activeAppointment.id)}
                    className="shadow-2xs font-semibold"
                  >
                    Tasdiqlash
                  </Button>
                )}
                {activeAppointment.status === 'CONFIRMED' && (
                  <Button
                    size="sm"
                    variant="primary"
                    leftIcon={<Play className="w-3.5 h-3.5" />}
                    onClick={() => handleStart(activeAppointment.id)}
                    className="shadow-2xs font-semibold"
                  >
                    Seansni boshlash
                  </Button>
                )}
                {activeAppointment.status === 'SCHEDULED' && (
                  <Button
                    size="sm"
                    variant="secondary"
                    leftIcon={<Play className="w-3.5 h-3.5 text-brand-600" />}
                    onClick={() => handleStart(activeAppointment.id)}
                  >
                    Seansni boshlash
                  </Button>
                )}
                {activeAppointment.status === 'IN_PROGRESS' && (
                  <div className="flex items-center gap-2 text-xs font-semibold text-brand-700 bg-brand-50 px-3 py-1.5 rounded-[10px] border border-brand-200">
                    <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
                    Seans ayni paytda davom etmoqda
                  </div>
                )}
                {activeAppointment.status === 'COMPLETED' && (
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-[10px] border border-emerald-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Seans muvaffaqiyatli yakunlangan
                  </div>
                )}
                {activeAppointment.status === 'CANCELLED' && (
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-700 bg-rose-50 px-3 py-1.5 rounded-[10px] border border-rose-200">
                    <XCircle className="w-4 h-4 text-rose-600" />
                    Uchrashuv bekor qilingan
                  </div>
                )}
                {['SCHEDULED', 'CONFIRMED'].includes(activeAppointment.status) && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-danger-main hover:bg-danger-50 ml-auto sm:ml-0"
                    leftIcon={<XCircle className="w-3.5 h-3.5" />}
                    onClick={() => handleCancel(activeAppointment.id)}
                  >
                    Bekor qilish
                  </Button>
                )}
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* ─── Create Appointment Modal ─── */}
      <Modal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        title="Yangi uchrashuv belgilash"
        size="md"
      >
        <CreateAppointmentForm
          defaultDate={createInitialDate}
          defaultTime={createInitialTime}
          onSuccess={() => setShowCreate(false)}
          onCancel={() => setShowCreate(false)}
        />
      </Modal>
    </div>
  );
}
