// ═══════════════════════════════════════════════════════
//  Schedule Page — Interactive Day & Week Calendar
// ═══════════════════════════════════════════════════════

import { useState, useMemo } from 'react';
import {
  ChevronLeft, ChevronRight, Plus,
  CheckCircle, Play, XCircle
} from 'lucide-react';
import { useStore, useAuth } from '@/store';
import { formatDate, getAppointmentStatusColor, getAppointmentStatusLabel, cn } from '@/utils';
import { Card, Badge, Select, DatePicker } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/KpiCard';
import { Modal } from '@/components/ui/Modal';
import { CreateAppointmentForm } from '@/features/appointments/CreateAppointmentForm';
import type { Appointment } from '@/types';

const TIME_SLOTS = [
  '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00'
];

export function SchedulePage() {
  const { currentUser } = useAuth();
  const appointments = useStore(s => s.appointments);
  const children = useStore(s => s.children);
  const specialists = useStore(s => s.specialists);
  const services = useStore(s => s.services);
  const confirmAppointment = useStore(s => s.confirmAppointment);
  const startSession = useStore(s => s.startSession);
  const cancelAppointment = useStore(s => s.cancelAppointment);

  // Selected date
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [specialistFilter, setSpecialistFilter] = useState<string>(
    currentUser?.role === 'SPECIALIST' ? currentUser.id : ''
  );

  // Selected appointment for detail drawer/modal
  const [activeAppointment, setActiveAppointment] = useState<Appointment | null>(null);
  const [showCreate, setShowCreate] = useState(false);

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
        description="Kunlik va haftalik uchrashuvlar taqvimi"
        actions={
          <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowCreate(true)}>
            Yangi uchrashuv
          </Button>
        }
      />

      {/* Control bar */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Date Controls */}
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={handleToday}>
              Bugun
            </Button>
            <div className="flex items-center gap-1 bg-warm-100/70 p-1 rounded-xl">
              <button
                onClick={handlePrevDay}
                className="p-1.5 hover:bg-white rounded-lg text-charcoal-700 transition-colors"
                title="Oldingi"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 text-sm font-semibold text-charcoal-900 min-w-[120px] text-center">
                {viewMode === 'day' ? formatDate(selectedDate) : `${weekDates[0]?.dayNum} - ${weekDates[5]?.dayNum} ${formatDate(selectedDate).split(' ')[1]}`}
              </span>
              <button
                onClick={handleNextDay}
                className="p-1.5 hover:bg-white rounded-lg text-charcoal-700 transition-colors"
                title="Keyingi"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="w-36">
              <DatePicker
                size="sm"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                clearable={false}
                aria-label="Sanani tanlash"
              />
            </div>
          </div>

          {/* Filters & View switcher */}
          <div className="flex items-center gap-3">
            {currentUser?.role !== 'SPECIALIST' && (
              <div className="w-56">
                <Select
                  value={specialistFilter}
                  onChange={e => setSpecialistFilter(e.target.value)}
                  className="py-1.5 text-xs"
                >
                  <option value="">Barcha mutaxassislar</option>
                  {specialists.map(s => (
                    <option key={s.id} value={s.id}>{s.fullName}</option>
                  ))}
                </Select>
              </div>
            )}

            <div className="flex rounded-xl bg-warm-100 p-1">
              <button
                onClick={() => setViewMode('day')}
                className={cn(
                  'px-3 py-1 text-xs font-semibold rounded-lg transition-all',
                  viewMode === 'day' ? 'bg-white shadow-xs text-charcoal-900' : 'text-charcoal-500 hover:text-charcoal-900'
                )}
              >
                Kunlik
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={cn(
                  'px-3 py-1 text-xs font-semibold rounded-lg transition-all',
                  viewMode === 'week' ? 'bg-white shadow-xs text-charcoal-900' : 'text-charcoal-500 hover:text-charcoal-900'
                )}
              >
                Haftalik
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* ─── Day View ─── */}
      {viewMode === 'day' && (
        <Card className="overflow-hidden">
          <div className="divide-y divide-warm-100">
            {TIME_SLOTS.map(time => {
              const slotApts = filteredAppointments.filter(a => a.startTime.startsWith(time.split(':')[0]));
              return (
                <div key={time} className="flex min-h-[85px] group hover:bg-warm-50/40 transition-colors">
                  <div className="w-20 sm:w-24 p-3 border-r border-warm-100 text-xs font-bold text-charcoal-400 flex items-start justify-center">
                    {time}
                  </div>
                  <div className="flex-1 p-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {slotApts.length === 0 ? (
                      <div className="h-full flex items-center text-xs text-charcoal-300 italic px-2">
                        Bo‘sh vaqt
                      </div>
                    ) : (
                      slotApts.map(apt => {
                        const child = children.find(c => c.id === apt.childId);
                        const spec = specialists.find(s => s.id === apt.specialistId);
                        const svc = services.find(s => s.id === apt.serviceId);
                        return (
                          <div
                            key={apt.id}
                            onClick={() => setActiveAppointment(apt)}
                            className="p-2.5 rounded-xl border border-warm-200/80 bg-white hover:border-brand-400 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between"
                          >
                            <div className="flex items-center justify-between gap-1 mb-1.5">
                              <span className="text-xs font-bold text-charcoal-900 truncate">
                                {child?.fullName ?? 'Noma’lum bola'}
                              </span>
                              <Badge className={getAppointmentStatusColor(apt.status)}>
                                {getAppointmentStatusLabel(apt.status)}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between text-[11px] text-charcoal-500">
                              <span className="truncate">{svc?.name ?? 'Xizmat'}</span>
                              <span className="font-semibold text-charcoal-700">{apt.startTime} - {apt.endTime}</span>
                            </div>
                            {spec && (
                              <p className="text-[10px] text-charcoal-400 mt-1 truncate">
                                Mutaxassis: {spec.fullName}
                              </p>
                            )}
                          </div>
                        );
                      })
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
        <Card className="overflow-x-auto">
          <div className="min-w-[900px]">
            {/* Week header row */}
            <div className="grid grid-cols-7 border-b border-warm-200 bg-warm-50/70">
              <div className="p-3 text-center text-xs font-bold text-charcoal-400 border-r border-warm-100">
                Vaqt
              </div>
              {weekDates.map(w => (
                <div
                  key={w.dateStr}
                  className={cn(
                    'p-3 text-center border-r border-warm-100 last:border-r-0',
                    w.dateStr === new Date().toISOString().split('T')[0] && 'bg-brand-50/60'
                  )}
                >
                  <p className="text-xs text-charcoal-500 font-medium">{w.dayName}</p>
                  <p className="text-sm font-bold text-charcoal-900">{w.dayNum}</p>
                </div>
              ))}
            </div>

            {/* Time slot rows */}
            <div className="divide-y divide-warm-100">
              {TIME_SLOTS.map(time => (
                <div key={time} className="grid grid-cols-7 min-h-[75px]">
                  <div className="p-2 text-center text-xs font-bold text-charcoal-400 border-r border-warm-100 flex items-center justify-center">
                    {time}
                  </div>
                  {weekDates.map(w => {
                    const apts = filteredAppointments.filter(
                      a => a.date === w.dateStr && a.startTime.startsWith(time.split(':')[0])
                    );
                    return (
                      <div
                        key={w.dateStr}
                        className="p-1.5 border-r border-warm-100 last:border-r-0 space-y-1 hover:bg-warm-50/50 transition-colors"
                      >
                        {apts.map(apt => {
                          const child = children.find(c => c.id === apt.childId);
                          return (
                            <div
                              key={apt.id}
                              onClick={() => setActiveAppointment(apt)}
                              className="p-1.5 rounded-lg border border-warm-200 bg-white text-[11px] hover:border-brand-400 cursor-pointer shadow-2xs"
                            >
                              <p className="font-bold text-charcoal-900 truncate">{child?.fullName}</p>
                              <span className="text-[10px] text-charcoal-500">{apt.startTime}</span>
                            </div>
                          );
                        })}
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
              <div className="p-4 rounded-2xl bg-warm-50 border border-warm-100 flex items-center justify-between">
                <div>
                  <h4 className="text-base font-bold text-charcoal-900">{child?.fullName}</h4>
                  <p className="text-xs text-charcoal-500">Mutaxassis: {spec?.fullName}</p>
                </div>
                <Badge className={getAppointmentStatusColor(activeAppointment.status)}>
                  {getAppointmentStatusLabel(activeAppointment.status)}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-white border border-warm-200">
                  <span className="text-charcoal-400 block mb-1">Xizmat turi</span>
                  <span className="font-semibold text-charcoal-800">{svc?.name ?? '—'}</span>
                </div>
                <div className="p-3 rounded-xl bg-white border border-warm-200">
                  <span className="text-charcoal-400 block mb-1">Vaqt</span>
                  <span className="font-semibold text-charcoal-800">
                    {formatDate(activeAppointment.date)}, {activeAppointment.startTime} - {activeAppointment.endTime}
                  </span>
                </div>
              </div>

              {activeAppointment.notes && (
                <div className="p-3 rounded-xl bg-white border border-warm-200 text-xs">
                  <span className="text-charcoal-400 block mb-1">Izoh</span>
                  <p className="text-charcoal-700">{activeAppointment.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap items-center justify-end gap-2 pt-4 border-t border-warm-100">
                {activeAppointment.status === 'SCHEDULED' && (
                  <Button
                    size="sm"
                    variant="secondary"
                    leftIcon={<CheckCircle className="w-3.5 h-3.5 text-sage-600" />}
                    onClick={() => handleConfirm(activeAppointment.id)}
                  >
                    Tasdiqlash
                  </Button>
                )}
                {['SCHEDULED', 'CONFIRMED'].includes(activeAppointment.status) && (
                  <Button
                    size="sm"
                    leftIcon={<Play className="w-3.5 h-3.5" />}
                    onClick={() => handleStart(activeAppointment.id)}
                  >
                    Seansni boshlash
                  </Button>
                )}
                {['SCHEDULED', 'CONFIRMED'].includes(activeAppointment.status) && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-danger-main hover:bg-danger-50"
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
          defaultDate={selectedDate}
          onSuccess={() => setShowCreate(false)}
          onCancel={() => setShowCreate(false)}
        />
      </Modal>
    </div>
  );
}
