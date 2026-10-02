// ═══════════════════════════════════════════════════════
//  Parent Dashboard — Family Portal & Child Progress
//  Senior Medical/Wellness CRM Standard
// ═══════════════════════════════════════════════════════

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Heart, Calendar, CheckCircle2, CreditCard,
  AlertCircle, Plus, Copy, Check, Clock, Stethoscope,
  Activity, ArrowRight, Baby, UserCheck, ChevronRight
} from 'lucide-react';
import { useAuth, useStore } from '@/store';
import { formatCurrency, formatDate, cn } from '@/utils';
import { differenceInYears, parseISO } from 'date-fns';
import { calculateParentBalance } from '@/services/finance.service';
import { Card, CardHeader, CardBody, Badge, Avatar, EmptyState, ProgressBar } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { KpiCard } from '@/components/ui/KpiCard';
import { Modal } from '@/components/ui/Modal';
import { CreateAppointmentForm } from '@/features/appointments/CreateAppointmentForm';

export function ParentDashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [showBookModal, setShowBookModal] = useState(false);
  const [copiedNoteId, setCopiedNoteId] = useState<string | null>(null);

  const parentId = currentUser?.id ?? '';
  const children = useStore(s => s.children);
  const appointments = useStore(s => s.appointments);
  const sessions = useStore(s => s.sessions);
  const specialists = useStore(s => s.specialists);
  const services = useStore(s => s.services);
  const transactions = useStore(s => s.transactions);
  const goals = useStore(s => s.goals);
  const progressNotes = useStore(s => s.progressNotes);

  // Parent's children
  const myChildren = useMemo(() => {
    return children.filter(c => c.parentId === parentId);
  }, [children, parentId]);

  const childIds = useMemo(() => myChildren.map(c => c.id), [myChildren]);

  // Financial status
  const finance = useMemo(() => {
    if (!parentId) return { balance: 0, debt: 0 };
    return calculateParentBalance(parentId, childIds, transactions);
  }, [parentId, childIds, transactions]);

  // Upcoming appointments for my children
  const upcomingAppointments = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return appointments
      .filter(a => childIds.includes(a.childId) && a.date >= today && a.status !== 'CANCELLED')
      .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))
      .slice(0, 5);
  }, [appointments, childIds]);

  // Active goals for my children
  const myGoals = useMemo(() => {
    return goals.filter(g => childIds.includes(g.childId));
  }, [goals, childIds]);

  // Recent specialist notes & recommendations
  const recentNotes = useMemo(() => {
    return progressNotes
      .filter(p => childIds.includes(p.childId))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 4);
  }, [progressNotes, childIds]);

  const handleCopyNote = (id: string, text: string) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
      setCopiedNoteId(id);
      setTimeout(() => setCopiedNoteId(null), 2000);
    }
  };

  return (
    <div className="px-4 lg:px-6 py-6 max-w-[1600px] mx-auto space-y-5">
      {/* ─── Welcome Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-black text-charcoal-900 tracking-tight flex items-center gap-2">
              Assalomu alaykum, {currentUser?.fullName}!
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200/80 shadow-2xs">
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
              Oila va ota-onalar portali
            </span>
          </div>
          <p className="text-xs sm:text-sm text-charcoal-500 mt-1">
            Farzandingizning reabilitatsiya jarayoni, navbatdagi qabullar, mutaxassis tavsiyalari va to‘lovlar monitoringi
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <Button
            size="sm"
            variant="secondary"
            leftIcon={<CreditCard className="w-4 h-4" />}
            onClick={() => navigate('/dashboard/parent/balance')}
          >
            Mening hisobim
          </Button>
          <Button
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setShowBookModal(true)}
          >
            Qabulga yozilish
          </Button>
        </div>
      </div>

      {/* ─── Financial Status Callout Banner (if debt or deposit) ─── */}
      {finance.debt > 0 ? (
        <div className="p-4 rounded-xl bg-rose-50/80 border border-rose-200/90 shadow-2xs flex items-center justify-between gap-4 flex-wrap text-xs">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <div>
              <p className="font-bold text-rose-950 text-sm">
                Hisobingizda {formatCurrency(finance.debt)} qarzdorlik mavjud
              </p>
              <p className="text-rose-700 text-xs">
                Keyingi qabullarning kechikishini oldini olish uchun to‘lovni amalga oshirishni tavsiya qilamiz
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="secondary"
            className="bg-white text-rose-800 border-rose-200 hover:bg-rose-100"
            onClick={() => navigate('/dashboard/parent/balance')}
          >
            To‘lovni ko‘rish
          </Button>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/80 shadow-2xs flex items-center justify-between gap-4 flex-wrap text-xs">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold text-emerald-950 text-sm">
                Barcha to‘lovlar muvozanatda • Depozit: {formatCurrency(finance.balance)}
              </p>
              <p className="text-emerald-700 text-xs">
                Farzandlaringiz uchun barcha reabilitatsiya seanslari jadval bo‘yicha to‘siqlarsiz davom etmoqda
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="secondary"
            className="bg-white text-emerald-800 border-emerald-200 hover:bg-emerald-100"
            onClick={() => navigate('/dashboard/parent/balance')}
          >
            Hisob tafsiloti
          </Button>
        </div>
      )}

      {/* ─── KPI Cards Strip ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <KpiCard
          label="Mening farzandlarim"
          value={myChildren.length}
          description="Markazda ro'yxatdan o'tgan"
          accentColor="brand"
          icon={<Baby className="w-5 h-5 text-brand-600" />}
          index={0}
        />
        <KpiCard
          label="Navbatdagi qabullar"
          value={upcomingAppointments.length}
          description="Rejalashtirilgan muolajalar"
          accentColor="blue"
          icon={<Calendar className="w-5 h-5 text-blue-600" />}
          index={1}
        />
        <KpiCard
          label="Joriy depozit balansi"
          value={formatCurrency(finance.balance)}
          description="Hisobdagi erkin mablag'"
          accentColor="sage"
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
          changeType="positive"
          index={2}
        />
        <KpiCard
          label="Qarzdorlik holati"
          value={formatCurrency(finance.debt)}
          description={finance.debt > 0 ? "To'lov amalga oshirish lozim" : "Qarzdorlik mavjud emas"}
          accentColor="danger"
          icon={<AlertCircle className="w-5 h-5 text-rose-600" />}
          changeType={finance.debt > 0 ? 'negative' : 'positive'}
          index={3}
        />
      </div>

      {/* ─── Children Overview Cards ─── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-charcoal-900">Farzandlarim kartochkalari</h3>
          <span className="text-xs text-charcoal-400 font-medium">Jami: {myChildren.length} nafar bola</span>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {myChildren.map(c => {
            const spec = specialists.find(s => s.id === c.assignedSpecialistId);
            const childSessions = sessions.filter(s => s.childId === c.id && s.status === 'COMPLETED').length;
            const childAge = c.dateOfBirth ? differenceInYears(new Date(), parseISO(c.dateOfBirth)) : null;

            return (
              <Card key={c.id} className="p-5 border border-warm-200/90 shadow-xs hover:border-warm-300 transition-colors h-full flex flex-col justify-between bg-white">
                <div>
                  <div className="flex items-center gap-3">
                    <Avatar name={c.fullName} size="md" className="ring-2 ring-warm-100 shadow-2xs" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-sm font-bold text-charcoal-900 truncate">{c.fullName}</h4>
                        {childAge !== null && (
                          <span className="text-[10px] font-semibold text-charcoal-600 bg-warm-100 px-1.5 py-0.2 rounded-[4px]">
                            {childAge} yosh
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-charcoal-400 mt-0.5">
                        Tug‘ilgan: {formatDate(c.dateOfBirth)}
                      </p>
                      {c.diagnosis && (
                        <p className="text-[11px] font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-[4px] border border-brand-200 inline-block mt-1 truncate max-w-full">
                          {c.diagnosis}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-warm-100 space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-charcoal-500 font-medium">Mas'ul shifokor:</span>
                      <span className="font-bold text-charcoal-900">{spec?.fullName ?? 'Biriktirilmagan'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-charcoal-500 font-medium">Bajarilgan seanslar:</span>
                      <span className="font-extrabold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-[4px] border border-brand-200 tabular-nums">
                        {childSessions} ta seans
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-warm-100 flex items-center gap-2">
                  <Button
                    size="xs"
                    variant="secondary"
                    className="flex-1 justify-center"
                    onClick={() => navigate('/dashboard/parent/progress')}
                  >
                    Rivojlanish xaritasi
                  </Button>
                  <Button
                    size="xs"
                    className="flex-1 justify-center"
                    onClick={() => setShowBookModal(true)}
                  >
                    Qabul belgilash
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* ─── Bottom Content: Upcoming Schedule & Specialist Advice ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Upcoming Appointments (7 cols) */}
        <div className="lg:col-span-7">
          <Card className="overflow-hidden border border-warm-200/90 shadow-xs h-full flex flex-col justify-between">
            <div>
              <div className="p-4 bg-warm-50/70 border-b border-warm-200/80 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-charcoal-900">Yaqinlashayotgan qabullar</h3>
                  <p className="text-xs text-charcoal-400 mt-0.5">Farzandlaringiz uchun belgilangan muolajalar</p>
                </div>
                <Badge variant="neutral">{upcomingAppointments.length} ta reja</Badge>
              </div>

              <div className="divide-y divide-warm-100">
                {upcomingAppointments.length === 0 ? (
                  <div className="p-10">
                    <EmptyState
                      title="Rejalashtirilgan qabullar yo‘q"
                      description="Markaz shifokori yoki ma'muriyati orqali yangi seansga yozilishingiz mumkin"
                      icon={<Calendar className="w-6 h-6 text-charcoal-400" />}
                      action={
                        <Button size="sm" onClick={() => setShowBookModal(true)}>
                          Qabulga yozilish
                        </Button>
                      }
                    />
                  </div>
                ) : (
                  upcomingAppointments.map(apt => {
                    const child = children.find(c => c.id === apt.childId);
                    const spec = specialists.find(s => s.id === apt.specialistId);
                    const svc = services.find(s => s.id === apt.serviceId);

                    return (
                      <div key={apt.id} className="p-4 flex items-center justify-between gap-3 hover:bg-warm-50/60 transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-12 text-center py-1 px-1 rounded-[8px] bg-warm-50 border border-warm-200/80 shrink-0">
                            <span className="text-xs font-bold text-charcoal-900 block tabular-nums">{apt.startTime}</span>
                            <span className="text-[10px] text-charcoal-400 block tabular-nums">{apt.endTime}</span>
                          </div>

                          <Avatar name={child?.fullName ?? 'Bola'} size="sm" className="shrink-0" />

                          <div className="min-w-0">
                            <p className="text-sm font-bold text-charcoal-900 truncate">{child?.fullName}</p>
                            <p className="text-xs text-charcoal-500 truncate">
                              {svc?.name} • Shifokor: <strong className="text-charcoal-800">{spec?.fullName}</strong>
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-xs font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-[6px] border border-brand-200 block">
                            {formatDate(apt.date)}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="p-3 bg-warm-50/70 border-t border-warm-100 text-center">
              <button
                type="button"
                onClick={() => navigate('/dashboard/parent/appointments')}
                className="text-xs text-brand-600 hover:text-brand-700 font-bold inline-flex items-center gap-1 cursor-pointer"
              >
                Barcha qabullar tarixini ko‘rish <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </Card>
        </div>

        {/* Goals & Specialist Recommendations (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Active Goals Card */}
          <Card className="overflow-hidden border border-warm-200/90 shadow-xs">
            <div className="p-4 bg-warm-50/70 border-b border-warm-200/80 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-charcoal-900">Reabilitatsiya maqsadlari</h3>
                <p className="text-xs text-charcoal-400 mt-0.5">Bolaning erishayotgan jismoniy natijalari</p>
              </div>
              <Badge variant="neutral">{myGoals.length} ta</Badge>
            </div>

            <div className="p-4 space-y-3.5">
              {myGoals.length === 0 ? (
                <div className="py-6 text-center text-xs text-charcoal-400">
                  Hozircha reabilitatsiya maqsadlari belgilanmagan
                </div>
              ) : (
                myGoals.map(g => (
                  <div key={g.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-charcoal-800 truncate">{g.title}</span>
                      <span className="text-brand-700 font-extrabold tabular-nums">{g.progress}%</span>
                    </div>
                    <ProgressBar
                      value={g.progress}
                      fillClassName={g.progress >= 80 ? 'bg-emerald-600' : 'bg-brand-500'}
                    />
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Specialist Recommendations Card */}
          <Card className="overflow-hidden border border-warm-200/90 shadow-xs">
            <div className="p-4 bg-warm-50/70 border-b border-warm-200/80 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-charcoal-900">Mutaxassis tavsiyalari va uy mashqlari</h3>
                <p className="text-xs text-charcoal-400 mt-0.5">Uy sharoitida bajariladigan jismoniy tavsiyalar</p>
              </div>
              <Stethoscope className="w-4 h-4 text-emerald-600" />
            </div>

            <div className="divide-y divide-warm-100 max-h-[280px] overflow-y-auto">
              {recentNotes.length === 0 ? (
                <div className="p-8 text-center text-xs text-charcoal-400">
                  Hozircha uy mashqlari tavsiyalari mavjud emas
                </div>
              ) : (
                recentNotes.map(n => {
                  const child = children.find(c => c.id === n.childId);
                  return (
                    <div key={n.id} className="p-3.5 space-y-1.5 hover:bg-warm-50/50 transition-colors">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-charcoal-900">{child?.fullName}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-charcoal-400">{formatDate(n.date)}</span>
                          <button
                            type="button"
                            onClick={() => handleCopyNote(n.id, n.note)}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-[4px] border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer"
                            title="Tavsiyani nusxalash"
                          >
                            {copiedNoteId === n.id ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span>Nusxalandi!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Nusxalash</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-charcoal-700 leading-relaxed font-medium">
                        {n.note}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* ─── Modal: Create Appointment ─── */}
      <Modal
        isOpen={showBookModal}
        onClose={() => setShowBookModal(false)}
        title="Yangi qabulga yozilish"
        size="md"
      >
        <CreateAppointmentForm
          onSuccess={() => setShowBookModal(false)}
          onCancel={() => setShowBookModal(false)}
        />
      </Modal>
    </div>
  );
}
