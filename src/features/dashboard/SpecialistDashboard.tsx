// ═══════════════════════════════════════════════════════
//  Specialist Dashboard — Daily Clinical Workspace
//  Senior Medical/Wellness CRM Standard
// ═══════════════════════════════════════════════════════

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar, CheckCircle2, Clock, Play, Award,
  Users, Activity, ChevronRight, FileText, Plus,
  Stethoscope, AlertCircle, HeartPulse, User,
  CalendarCheck, ArrowRight
} from 'lucide-react';
import { useAuth, useStore } from '@/store';
import { formatDate, cn, getAppointmentStatusColor, getAppointmentStatusLabel } from '@/utils';
import { differenceInYears, parseISO } from 'date-fns';
import { Card, CardHeader, CardBody, Badge, Avatar, EmptyState, ProgressBar, Textarea, Select } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { KpiCard } from '@/components/ui/KpiCard';
import { Modal } from '@/components/ui/Modal';

type ScheduleFilter = 'ALL' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

export function SpecialistDashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const appointments = useStore(s => s.appointments);
  const sessions = useStore(s => s.sessions);
  const children = useStore(s => s.children);
  const services = useStore(s => s.services);
  const startSession = useStore(s => s.startSession);
  const createProgressNote = useStore(s => s.createProgressNote);

  const [scheduleFilter, setScheduleFilter] = useState<ScheduleFilter>('ALL');
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteForm, setNoteForm] = useState({
    childId: '',
    note: '',
    recommendation: '',
  });

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Today's appointments for this specialist
  const todayAppointments = useMemo(() => {
    return appointments
      .filter(a => a.specialistId === currentUser?.id && a.date === todayStr)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [appointments, currentUser?.id, todayStr]);

  const completedTodayCount = useMemo(() => {
    return todayAppointments.filter(a => a.status === 'COMPLETED').length;
  }, [todayAppointments]);

  const inProgressTodayCount = useMemo(() => {
    return todayAppointments.filter(a => a.status === 'IN_PROGRESS').length;
  }, [todayAppointments]);

  const completionRate = todayAppointments.length > 0
    ? Math.round((completedTodayCount / todayAppointments.length) * 100)
    : 0;

  // Filtered today's appointments
  const filteredAppointments = useMemo(() => {
    return todayAppointments.filter(apt => {
      if (scheduleFilter === 'PENDING') return apt.status === 'SCHEDULED' || apt.status === 'CONFIRMED';
      if (scheduleFilter === 'IN_PROGRESS') return apt.status === 'IN_PROGRESS';
      if (scheduleFilter === 'COMPLETED') return apt.status === 'COMPLETED';
      return true;
    });
  }, [todayAppointments, scheduleFilter]);

  // Assigned children
  const assignedChildren = useMemo(() => {
    return children.filter(c => c.assignedSpecialistId === currentUser?.id);
  }, [children, currentUser?.id]);

  // Specialist's completed sessions
  const completedSessions = useMemo(() => {
    return sessions.filter(s => s.specialistId === currentUser?.id && s.status === 'COMPLETED');
  }, [sessions, currentUser?.id]);

  // Next upcoming appointment
  const nextAppointment = useMemo(() => {
    return todayAppointments.find(a => a.status === 'CONFIRMED' || a.status === 'SCHEDULED');
  }, [todayAppointments]);

  const handleStartAppointmentSession = (aptId: string) => {
    startSession(aptId);
    navigate('/dashboard/specialist/sessions');
  };

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteForm.childId || !noteForm.note.trim()) return;

    const fullNote = noteForm.recommendation.trim()
      ? `${noteForm.note.trim()}\n\n[Uy vazifasi]: ${noteForm.recommendation.trim()}`
      : noteForm.note.trim();

    createProgressNote({
      childId: noteForm.childId,
      specialistId: currentUser?.id || '',
      note: fullNote,
      date: todayStr,
    });

    setShowNoteModal(false);
    setNoteForm({ childId: '', note: '', recommendation: '' });
  };

  return (
    <div className="px-4 lg:px-6 py-6 max-w-[1600px] mx-auto space-y-5">
      {/* ─── Specialist Welcome Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-black text-charcoal-900 tracking-tight">
              Assalomu alaykum, {currentUser?.fullName}!
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-brand-50 text-brand-700 border border-brand-200/80 shadow-2xs">
              <Stethoscope className="w-3.5 h-3.5" />
              {currentUser?.role === 'SPECIALIST' ? 'Klinik amaliyotchi' : 'Mutaxassis'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-charcoal-500 mt-1">
            Bugungi rejalashtirilgan muolajalar, bemor bolalar parvarishi va klinik telemetriya paneli
          </p>
        </div>

        {/* Quick Header Buttons */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <Button
            size="sm"
            variant="secondary"
            leftIcon={<Calendar className="w-4 h-4" />}
            onClick={() => navigate('/dashboard/specialist/schedule')}
          >
            Haftalik jadval
          </Button>
          <Button
            size="sm"
            variant="secondary"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => {
              if (assignedChildren[0]) {
                setNoteForm(prev => ({ ...prev, childId: assignedChildren[0].id }));
              }
              setShowNoteModal(true);
            }}
          >
            Kuzatuv qaydi
          </Button>
          <Button
            size="sm"
            leftIcon={<Activity className="w-4 h-4" />}
            onClick={() => navigate('/dashboard/specialist/sessions')}
          >
            Seanslar bo‘limi
          </Button>
        </div>
      </div>

      {/* ─── Operational Health Strip ─── */}
      <div className="p-4 rounded-xl bg-brand-50/70 border border-brand-200/80 shadow-2xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center text-xs">
          {/* Progress metric */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between font-semibold text-charcoal-700">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-brand-600" />
                Bugungi reja bajarilishi:
              </span>
              <strong className="text-charcoal-900">{completedTodayCount} / {todayAppointments.length} muolaja ({completionRate}%)</strong>
            </div>
            <ProgressBar value={completionRate} fillClassName="bg-brand-500" />
          </div>

          {/* Next upcoming appointment */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[8px] bg-white border border-brand-200/80 flex items-center justify-center shrink-0 shadow-2xs text-brand-700">
              <CalendarCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-charcoal-900 truncate">
                {nextAppointment
                  ? `Navbatdagi: ${nextAppointment.startTime} — ${children.find(c => c.id === nextAppointment.childId)?.fullName}`
                  : "Bugun boshqa qabullar yo'q"}
              </p>
              <p className="text-[11px] text-charcoal-500 truncate">
                {nextAppointment
                  ? services.find(s => s.id === nextAppointment.serviceId)?.name || 'Reabilitatsiya muolajasi'
                  : todayAppointments.length > 0
                  ? "Barcha rejalashtirilgan seanslar yakunlandi"
                  : "Bugungi kunga qabullar belgilanmagan"}
              </p>
            </div>
          </div>

          {/* Working hours & clinical status */}
          <div className="flex items-center gap-2.5 sm:justify-end">
            <div className="w-8 h-8 rounded-[8px] bg-emerald-100/70 border border-emerald-200/80 flex items-center justify-center shrink-0 shadow-2xs text-emerald-700">
              <HeartPulse className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-emerald-950">Faol ish kuni rejimi</p>
              <p className="text-[11px] text-emerald-700">Smena: 09:00 — 18:00 (Reabilitatsiya)</p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── KPI Cards Strip (4 Cards) ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <KpiCard
          label="Bugungi muolajalar"
          value={todayAppointments.length}
          accentColor="brand"
          icon={<Clock className="w-5 h-5 text-brand-600" />}
          description={`${completedTodayCount} tasi muvaffaqiyatli yakunlandi`}
          index={0}
        />
        <KpiCard
          label="Biriktirilgan bolalar"
          value={assignedChildren.length}
          description="Doimiy nazoratimdagi bemorlar"
          accentColor="sage"
          icon={<Users className="w-5 h-5 text-emerald-600" />}
          index={1}
        />
        <KpiCard
          label="Bajarilgan seanslar"
          value={completedSessions.length}
          description="Jami o‘tkazilgan reabilitatsiya"
          accentColor="gold"
          icon={<CheckCircle2 className="w-5 h-5 text-amber-600" />}
          index={2}
        />
        <KpiCard
          label="Kasbiy reyting"
          value={completedSessions.length > 0 ? "4.95 / 5.0" : "0.0 / 5.0"}
          description={completedSessions.length > 0 ? "Ota-onalar bahosi asosida" : "Hozircha baholanmagan"}
          accentColor="blue"
          icon={<Award className="w-5 h-5 text-blue-600" />}
          change={completedSessions.length > 0 ? "A’lo darajada" : undefined}
          changeType={completedSessions.length > 0 ? "positive" : undefined}
          index={3}
        />
      </div>

      {/* ─── Main Content Grid ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Today's Schedule Card (8 cols) */}
        <div className="lg:col-span-8">
          <Card className="overflow-hidden border border-warm-200/90 shadow-xs h-full flex flex-col justify-between">
            <div>
              <div className="p-4 bg-warm-50/70 border-b border-warm-200/80 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-charcoal-900">
                    Bugungi qabullar rejasi ({formatDate(todayStr)})
                  </h3>
                  <p className="text-xs text-charcoal-400 mt-0.5">
                    Belgilangan vaqt bo‘yicha keluvchi bemor bolalar ro‘yxati
                  </p>
                </div>

                {/* Status Tabs */}
                <div className="flex items-center gap-1 bg-white p-0.5 rounded-[8px] border border-warm-200/90 shadow-2xs">
                  {[
                    { key: 'ALL', label: 'Barchasi', count: todayAppointments.length },
                    { key: 'PENDING', label: 'Kutilayotgan', count: todayAppointments.filter(a => a.status === 'SCHEDULED' || a.status === 'CONFIRMED').length },
                    { key: 'IN_PROGRESS', label: 'Jarayonda', count: inProgressTodayCount },
                    { key: 'COMPLETED', label: 'Yakunlangan', count: completedTodayCount },
                  ].map(tab => {
                    const isActive = scheduleFilter === tab.key;
                    return (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setScheduleFilter(tab.key as ScheduleFilter)}
                        className={cn(
                          'px-2.5 py-1 text-xs font-semibold rounded-[6px] transition-all cursor-pointer whitespace-nowrap inline-flex items-center gap-1.5',
                          isActive
                            ? 'bg-charcoal-900 text-white shadow-xs'
                            : 'text-charcoal-500 hover:text-charcoal-800'
                        )}
                      >
                        <span>{tab.label}</span>
                        <span
                          className={cn(
                            'text-[10px] px-1.5 py-0.5 rounded-full font-bold tabular-nums',
                            isActive ? 'bg-white/20 text-white' : 'bg-warm-100 text-charcoal-600'
                          )}
                        >
                          {tab.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Schedule list */}
              <div className="divide-y divide-warm-100">
                {filteredAppointments.length === 0 ? (
                  <div className="p-12">
                    <EmptyState
                      title="Qabullar topilmadi"
                      description="Ushbu filtr bo‘yicha bugun uchrashuvlar mavjud emas"
                      icon={<Calendar className="w-6 h-6 text-charcoal-400" />}
                    />
                  </div>
                ) : (
                  filteredAppointments.map(apt => {
                    const child = children.find(c => c.id === apt.childId);
                    const svc = services.find(s => s.id === apt.serviceId);
                    const childAge = child?.dateOfBirth ? differenceInYears(new Date(), parseISO(child.dateOfBirth)) : null;
                    const isCompleted = apt.status === 'COMPLETED';
                    const isInProgress = apt.status === 'IN_PROGRESS';

                    return (
                      <div
                        key={apt.id}
                        className="p-4 sm:p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-warm-50/60 transition-colors"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          {/* Time Slot Badge */}
                          <div className="text-center w-14 shrink-0 py-1.5 px-1 rounded-[8px] bg-warm-50 border border-warm-200/80">
                            <p className="text-xs font-bold text-charcoal-900 tabular-nums">{apt.startTime}</p>
                            <p className="text-[10px] text-charcoal-400 font-medium tabular-nums">{apt.endTime}</p>
                          </div>

                          <Avatar name={child?.fullName ?? 'Bola'} size="md" className="shrink-0 ring-2 ring-warm-100 shadow-2xs" />

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-sm font-bold text-charcoal-900 truncate">
                                {child?.fullName}
                              </h4>
                              {childAge !== null && (
                                <span className="text-[10px] font-semibold text-charcoal-600 bg-warm-100 px-1.5 py-0.5 rounded-[4px]">
                                  {childAge} yosh
                                </span>
                              )}
                              <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-[6px] border shadow-2xs', getAppointmentStatusColor(apt.status))}>
                                {getAppointmentStatusLabel(apt.status)}
                              </span>
                            </div>

                            <p className="text-xs text-charcoal-500 font-medium mt-0.5 truncate">
                              {svc?.name || 'Reabilitatsiya muolajasi'}
                              {child?.diagnosis && (
                                <span className="text-charcoal-400"> • Tashxis: {child.diagnosis}</span>
                              )}
                            </p>

                            {apt.notes && (
                              <p className="text-[11px] text-charcoal-500 mt-1 italic truncate max-w-md">
                                "{apt.notes}"
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          {!isCompleted && !isInProgress && (
                            <Button
                              size="sm"
                              leftIcon={<Play className="w-3.5 h-3.5 fill-current" />}
                              onClick={() => handleStartAppointmentSession(apt.id)}
                            >
                              Seansni boshlash
                            </Button>
                          )}
                          {isInProgress && (
                            <Button
                              size="sm"
                              variant="secondary"
                              className="bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100"
                              leftIcon={<Activity className="w-3.5 h-3.5" />}
                              onClick={() => navigate('/dashboard/specialist/sessions')}
                            >
                              Jarayonda (O‘tish)
                            </Button>
                          )}
                          {isCompleted && (
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-[8px] border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Muvaffaqiyatli yakunlandi
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Bottom link to sessions */}
            <div className="p-3 bg-warm-50/70 border-t border-warm-100 flex items-center justify-between text-xs text-charcoal-500">
              <span>Bugun jami reja: <strong>{todayAppointments.length} ta bemor</strong></span>
              <button
                type="button"
                onClick={() => navigate('/dashboard/specialist/sessions')}
                className="font-bold text-brand-600 hover:text-brand-700 inline-flex items-center gap-1 cursor-pointer"
              >
                Barcha faol seanslarni ochish <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </Card>
        </div>

        {/* Right Column: Assigned Children & Quick Tools (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          {/* Assigned Children Card */}
          <Card className="overflow-hidden border border-warm-200/90 shadow-xs">
            <div className="p-4 bg-warm-50/70 border-b border-warm-200/80 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-charcoal-900">Menga biriktirilgan bolalar</h3>
                <p className="text-xs text-charcoal-400 mt-0.5">Nazoratimdagi kichik bemorlar</p>
              </div>
              <Badge variant="neutral">{assignedChildren.length} nafar</Badge>
            </div>

            <div className="divide-y divide-warm-100 max-h-[260px] overflow-y-auto">
              {assignedChildren.length === 0 ? (
                <div className="p-6 text-center text-xs text-charcoal-400">
                  Hozircha biriktirilgan bolalar yo‘q
                </div>
              ) : (
                assignedChildren.slice(0, 5).map(c => {
                  const childAge = c.dateOfBirth ? differenceInYears(new Date(), parseISO(c.dateOfBirth)) : null;
                  return (
                    <div
                      key={c.id}
                      onClick={() => navigate('/dashboard/specialist/children')}
                      className="p-3 sm:px-4 flex items-center justify-between hover:bg-warm-50/60 cursor-pointer transition-colors group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar name={c.fullName} size="sm" className="shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-charcoal-900 truncate group-hover:text-brand-600 transition-colors">
                            {c.fullName}
                          </p>
                          <p className="text-[11px] text-charcoal-400 truncate">
                            {childAge !== null ? `${childAge} yosh` : ''} {c.diagnosis ? `• ${c.diagnosis}` : ''}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-charcoal-400 group-hover:text-charcoal-700 group-hover:translate-x-0.5 transition-all shrink-0" />
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-2.5 bg-warm-50/60 border-t border-warm-100 text-center">
              <button
                type="button"
                onClick={() => navigate('/dashboard/specialist/children')}
                className="text-xs text-brand-600 hover:text-brand-700 font-bold inline-flex items-center gap-1 cursor-pointer"
              >
                Barcha bolalar ro‘yxati <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </Card>

          {/* Quick Clinical Shortcuts Card */}
          <Card className="p-4 border border-warm-200/90 shadow-xs bg-gradient-to-br from-white via-white to-warm-50/60 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-charcoal-500">
              Klinik tezkor amallar
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="secondary"
                size="sm"
                className="justify-start text-xs font-medium"
                leftIcon={<FileText className="w-3.5 h-3.5 text-brand-600" />}
                onClick={() => navigate('/dashboard/specialist/progress')}
              >
                Kuzatuv qaydi
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="justify-start text-xs font-medium"
                leftIcon={<Activity className="w-3.5 h-3.5 text-emerald-600" />}
                onClick={() => navigate('/dashboard/specialist/assessments')}
              >
                Baholash (5 ball)
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="justify-start text-xs font-medium"
                leftIcon={<CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />}
                onClick={() => navigate('/dashboard/specialist/attendance')}
              >
                Davomat
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="justify-start text-xs font-medium"
                leftIcon={<Calendar className="w-3.5 h-3.5 text-blue-600" />}
                onClick={() => navigate('/dashboard/specialist/schedule')}
              >
                Jadval
              </Button>
            </div>
          </Card>

          {/* Clinical Advice Reminder */}
          <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 shadow-2xs space-y-1.5 text-xs text-emerald-950">
            <div className="flex items-center gap-1.5 font-bold text-emerald-900">
              <AlertCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Klinik eslatma</span>
            </div>
            <p className="text-emerald-800 text-[11px] leading-relaxed">
              Har bir seans yakunlangach, bolaning holatini xulosalab, ota-onaga uy sharoitida bajariladigan maxsus mashqlarni tayinlash reabilitatsiya samaradorligini oshiradi.
            </p>
          </div>
        </div>
      </div>

      {/* ─── Modal: Quick Progress Note ─── */}
      <Modal
        isOpen={showNoteModal}
        onClose={() => setShowNoteModal(false)}
        title="Tezkor klinik kuzatuv qaydi"
        size="md"
      >
        <form onSubmit={handleSaveNote} className="space-y-4">
          <Select
            label="Bemor bola"
            required
            value={noteForm.childId}
            onChange={e => setNoteForm({ ...noteForm, childId: e.target.value })}
            options={[
              { value: '', label: 'Bolani tanlang...' },
              ...children.map(c => ({ value: c.id, label: c.fullName })),
            ]}
          />

          <Textarea
            label="Kuzatuv xulosasi va dinamika"
            required
            rows={4}
            placeholder="Bolaning mushak tonusi, koordinatsiyasi, bugungi seansga javob reaksiyasi..."
            value={noteForm.note}
            onChange={e => setNoteForm({ ...noteForm, note: e.target.value })}
          />

          <Textarea
            label="Ota-ona uchun uy vazifasi va tavsiyalar (ixtiyoriy)"
            rows={2}
            placeholder="Uyda bajariladigan massaj yoki jismoniy mashqlar..."
            value={noteForm.recommendation}
            onChange={e => setNoteForm({ ...noteForm, recommendation: e.target.value })}
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-warm-100">
            <Button variant="secondary" type="button" onClick={() => setShowNoteModal(false)}>
              Bekor qilish
            </Button>
            <Button type="submit">
              Saqlash
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
