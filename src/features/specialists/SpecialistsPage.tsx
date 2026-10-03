// Specialists Page — Senior Medical/Wellness CRM Table standard
import { useState, useMemo } from 'react';
import {
  Plus, Search, Stethoscope, Users, Award, Clock, X, Phone,
  Mail, Calendar, Eye, CheckCircle2, ChevronRight, Briefcase
} from 'lucide-react';
import { useStore } from '@/store';
import { getEntityStatusColor, getEntityStatusLabel, cn } from '@/utils';
import { DataTable, Column } from '@/components/tables/DataTable';
import { Card, Avatar, Badge, Select } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { PageHeader, KpiCard } from '@/components/ui/KpiCard';
import { Modal } from '@/components/ui/Modal';
import { Input, Textarea } from '@/components/ui/primitives';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Specialist } from '@/types';

const schema = z.object({
  fullName: z.string().min(2, 'Ism kamida 2 ta belgi'),
  phone: z.string().min(9, 'Telefon'),
  email: z.string().email('Email noto\'g\'ri').optional().or(z.literal('')),
  specialization: z.string().min(2, 'Mutaxassislikni kiriting'),
  experienceYears: z.string().optional(),
  bio: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

const DAY_NAMES = ['Yak', 'Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan'];

export function SpecialistsPage() {
  const specialists = useStore(s => s.specialists);
  const sessions = useStore(s => s.sessions);
  const appointments = useStore(s => s.appointments);
  const createSpecialist = useStore(s => s.createSpecialist);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [showCreate, setShowCreate] = useState(false);
  const [selectedSpecialist, setSelectedSpecialist] = useState<Specialist | null>(null);

  // Sessions count map
  const sessionsCountMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of sessions) {
      if (s.status === 'COMPLETED') {
        map.set(s.specialistId, (map.get(s.specialistId) || 0) + 1);
      }
    }
    return map;
  }, [sessions]);

  // Appointments count map
  const upcomingAppointmentsMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of appointments) {
      if (a.status === 'SCHEDULED' || a.status === 'CONFIRMED') {
        map.set(a.specialistId, (map.get(a.specialistId) || 0) + 1);
      }
    }
    return map;
  }, [appointments]);

  // Counts
  const activeCount = useMemo(() => specialists.filter(s => s.status === 'ACTIVE').length, [specialists]);
  const inactiveCount = specialists.length - activeCount;
  const completedSessions = sessions.filter(s => s.status === 'COMPLETED').length;
  const avgExp = specialists.length > 0
    ? Math.round(specialists.reduce((sum, s) => sum + (s.experience || 0), 0) / specialists.length)
    : 0;

  // Filtered
  const filtered = useMemo(() => {
    return specialists.filter(s => {
      if (search) {
        const q = search.toLowerCase();
        const matchName = s.fullName.toLowerCase().includes(q);
        const matchSpec = s.specialization.toLowerCase().includes(q);
        const matchPhone = s.phone.toLowerCase().includes(q);
        if (!matchName && !matchSpec && !matchPhone) return false;
      }
      if (statusFilter === 'ACTIVE' && s.status !== 'ACTIVE') return false;
      if (statusFilter === 'INACTIVE' && s.status !== 'INACTIVE') return false;
      return true;
    });
  }, [specialists, search, statusFilter]);

  const hasActiveFilters = search !== '' || statusFilter !== 'ALL';

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('ALL');
  };

  const columns: Column<Specialist>[] = [
    {
      key: 'fullName',
      header: 'Mutaxassis',
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-3">
          <Avatar name={row.fullName} src={row.avatar} size="md" className="font-semibold" />
          <div className="min-w-0">
            <p className="font-semibold text-charcoal-900 text-sm tracking-tight truncate hover:text-brand-700 transition-colors">
              {row.fullName}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <a
                href={`tel:${row.phone}`}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 text-xs text-charcoal-500 hover:text-brand-600 transition-colors"
              >
                <Phone className="w-3 h-3 text-charcoal-400" />
                <span>{row.phone}</span>
              </a>
              {row.email && (
                <span className="hidden xl:inline-flex items-center gap-1 text-[11px] text-charcoal-400 max-w-[130px] truncate">
                  <Mail className="w-2.5 h-2.5" />
                  {row.email}
                </span>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'specialization',
      header: 'Yo\'nalish va Tajriba',
      sortable: true,
      cell: (row) => (
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[6px] text-xs font-semibold bg-brand-50/80 text-brand-800 border border-brand-200/60">
            <Stethoscope className="w-3 h-3 text-brand-600 shrink-0" />
            <span>{row.specialization}</span>
          </div>
          {row.experience ? (
            <p className="text-[11px] text-charcoal-500 flex items-center gap-1">
              <Award className="w-3 h-3 text-amber-500" />
              <span>{row.experience} yil amaliy tajriba</span>
            </p>
          ) : null}
        </div>
      ),
    },
    {
      key: 'workingHours' as any,
      header: 'Ish jadvali',
      cell: (row) => (
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs text-charcoal-700 font-medium">
            <Clock className="w-3.5 h-3.5 text-brand-600 shrink-0" />
            <span>{row.workingHours?.start || '09:00'} – {row.workingHours?.end || '18:00'}</span>
          </div>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5, 6].map(dayIndex => {
              const isWorking = row.workingDays?.includes(dayIndex);
              return (
                <span
                  key={dayIndex}
                  className={cn(
                    "text-[10px] px-1 py-0.2 rounded font-medium",
                    isWorking
                      ? "bg-brand-50 text-brand-700 font-semibold"
                      : "bg-warm-100 text-charcoal-400 opacity-60"
                  )}
                  title={DAY_NAMES[dayIndex]}
                >
                  {DAY_NAMES[dayIndex]}
                </span>
              );
            })}
          </div>
        </div>
      ),
    },
    {
      key: 'sessionsCount' as any,
      header: 'Seanslar',
      sortable: true,
      cell: (row) => {
        const count = sessionsCountMap.get(row.id) || 0;
        const upcoming = upcomingAppointmentsMap.get(row.id) || 0;
        return (
          <div className="space-y-0.5">
            <span className="inline-flex items-center gap-1 text-sm font-bold text-charcoal-900 tabular-nums">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              {count} ta yakunlangan
            </span>
            {upcoming > 0 && (
              <p className="text-[11px] text-charcoal-500 tabular-nums">
                {upcoming} ta navbatda
              </p>
            )}
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Holat',
      sortable: true,
      cell: (row) => (
        <Badge className={getEntityStatusColor(row.status)} dot>
          {getEntityStatusLabel(row.status)}
        </Badge>
      ),
    },
    {
      key: 'actions' as any,
      header: 'Amallar',
      cell: (row) => (
        <div className="flex items-center justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedSpecialist(row);
            }}
            className="h-8 px-2.5 text-xs text-charcoal-600 hover:text-brand-700 hover:bg-brand-50/60"
          >
            <Eye className="w-3.5 h-3.5 mr-1" />
            Ko'rish
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="px-4 lg:px-6 py-6 max-w-[1600px] mx-auto space-y-5">
      <PageHeader
        title="Mutaxassislar"
        description={`Jami ${specialists.length} ta mutaxassis, ${activeCount} ta faol xodim`}
        actions={
          <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowCreate(true)}>
            Mutaxassis qo'shish
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <KpiCard
          label="Faol mutaxassislar"
          value={activeCount}
          description={`${specialists.length} nafardan`}
          icon={<Stethoscope className="w-4 h-4 text-brand-600" />}
          accentColor="brand"
          index={0}
        />
        <KpiCard
          label="Bajarilgan seanslar"
          value={completedSessions}
          description="Barcha vaqt davomida"
          icon={<Award className="w-4 h-4 text-emerald-600" />}
          accentColor="sage"
          index={1}
        />
        <KpiCard
          label="O‘rtacha tajriba"
          value={`${avgExp} yil`}
          description="Malakali mutaxassislar"
          icon={<Clock className="w-4 h-4 text-amber-500" />}
          accentColor="gold"
          index={2}
        />
        <KpiCard
          label="Jami xodimlar"
          value={specialists.length}
          description={inactiveCount > 0 ? `${inactiveCount} nafar nofaol` : 'Barchasi faol'}
          icon={<Users className="w-4 h-4 text-blue-500" />}
          accentColor="blue"
          index={3}
        />
      </div>

      <Card className="overflow-hidden border border-warm-200/90 shadow-xs">
        {/* Quick Tabs */}
        <div className="flex items-center gap-1.5 px-4 py-3 border-b border-warm-200/70 overflow-x-auto touch-scroll-x scrollbar-thin w-full">
          <button
            onClick={(e) => {
              setStatusFilter('ALL');
              e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
            }}
            className={cn(
              "shrink-0 px-3 py-1.5 rounded-[8px] text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer select-none",
              statusFilter === 'ALL'
                ? "bg-brand-600 text-white shadow-xs"
                : "text-charcoal-600 hover:bg-warm-100 hover:text-charcoal-900"
            )}
          >
            Barchasi
            <span className={cn(
              "px-1.5 py-0.2 rounded-full text-[10px] font-bold",
              statusFilter === 'ALL' ? "bg-white/20 text-white" : "bg-warm-200 text-charcoal-600"
            )}>
              {specialists.length}
            </span>
          </button>

          <button
            onClick={(e) => {
              setStatusFilter('ACTIVE');
              e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
            }}
            className={cn(
              "shrink-0 px-3 py-1.5 rounded-[8px] text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer select-none",
              statusFilter === 'ACTIVE'
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-charcoal-600 hover:bg-emerald-50 hover:text-emerald-800"
            )}
          >
            Faol
            <span className={cn(
              "px-1.5 py-0.2 rounded-full text-[10px] font-bold",
              statusFilter === 'ACTIVE' ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-800"
            )}>
              {activeCount}
            </span>
          </button>

          <button
            onClick={(e) => {
              setStatusFilter('INACTIVE');
              e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
            }}
            className={cn(
              "shrink-0 px-3 py-1.5 rounded-[8px] text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer select-none",
              statusFilter === 'INACTIVE'
                ? "bg-charcoal-700 text-white shadow-xs"
                : "text-charcoal-600 hover:bg-warm-100 hover:text-charcoal-900"
            )}
          >
            Nofaol
            <span className={cn(
              "px-1.5 py-0.2 rounded-full text-[10px] font-bold",
              statusFilter === 'INACTIVE' ? "bg-white/20 text-white" : "bg-warm-200 text-charcoal-600"
            )}>
              {inactiveCount}
            </span>
          </button>
        </div>

        {/* Filter bar */}
        <div className="p-3.5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 border-b border-warm-100 bg-warm-50/40">
          <div className="flex flex-1 items-center gap-2.5">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-400 pointer-events-none" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Ism, telefon yoki mutaxassislik..."
                className="w-full h-9 pl-9 pr-8 text-xs border border-warm-300 rounded-[10px] bg-white shadow-2xs placeholder:text-charcoal-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition-all"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-charcoal-400 hover:text-charcoal-600 hover:bg-warm-100 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="h-9 px-2.5 text-xs text-charcoal-500 hover:text-charcoal-800"
              >
                Filtrni tozalash
              </Button>
            )}
          </div>

          <div className="flex items-center justify-between md:justify-end gap-3 text-xs text-charcoal-500">
            <span>
              Ko'rsatilmoqda: <strong className="text-charcoal-900 font-semibold">{filtered.length}</strong> / {specialists.length}
            </span>
          </div>
        </div>

        {/* Data Table */}
        <DataTable
          data={filtered}
          columns={columns}
          keyExtractor={r => r.id}
          onRowClick={(specialist) => setSelectedSpecialist(specialist)}
          tableClassName="min-w-[900px]"
          emptyTitle="Mutaxassislar topilmadi"
          emptyDescription={
            hasActiveFilters
              ? "Qidiruv parametrlariga mos keluvchi mutaxassis topilmadi. Filtrni tozalab ko'ring."
              : "Tizimda hozircha mutaxassislar ro'yxatga olinmagan."
          }
          emptyIcon={<Stethoscope className="w-5 h-5" />}
        />

        {/* Footer Summary */}
        <div className="px-4 py-3 bg-warm-50/70 border-t border-warm-200/80 flex flex-wrap items-center justify-between gap-3 text-xs text-charcoal-500">
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-brand-500" />
              Jami mutaxassislar: <strong className="text-charcoal-800 font-semibold">{specialists.length}</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Faol mutaxassislar: <strong className="text-emerald-700 font-semibold">{activeCount}</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-brand-600" />
              Bajarilgan seanslar: <strong className="text-charcoal-800 font-semibold">{completedSessions}</strong>
            </span>
          </div>
          <span className="text-[11px] text-charcoal-400">
            Qator ustiga bosib mutaxassisning batafsil profilini ko'rishingiz mumkin
          </span>
        </div>
      </Card>

      {/* Specialist Details Modal */}
      {selectedSpecialist && (
        <Modal
          isOpen={!!selectedSpecialist}
          onClose={() => setSelectedSpecialist(null)}
          title="Mutaxassis profili"
          size="md"
        >
          <div className="space-y-4">
            {/* Header Card */}
            <div className="flex items-start gap-3.5 p-4 rounded-xl bg-warm-50 border border-warm-200/70">
              <Avatar name={selectedSpecialist.fullName} src={selectedSpecialist.avatar} size="lg" className="font-bold" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-base font-bold text-charcoal-900 truncate">
                    {selectedSpecialist.fullName}
                  </h3>
                  <Badge className={getEntityStatusColor(selectedSpecialist.status)} dot>
                    {getEntityStatusLabel(selectedSpecialist.status)}
                  </Badge>
                </div>
                <p className="text-xs font-medium text-brand-700 mt-0.5">
                  {selectedSpecialist.specialization}
                </p>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-charcoal-600">
                  <a
                    href={`tel:${selectedSpecialist.phone}`}
                    className="inline-flex items-center gap-1 hover:text-brand-600 font-medium text-charcoal-800"
                  >
                    <Phone className="w-3.5 h-3.5 text-charcoal-400" />
                    {selectedSpecialist.phone}
                  </a>
                  {selectedSpecialist.email && (
                    <span className="inline-flex items-center gap-1 text-charcoal-500">
                      <Mail className="w-3.5 h-3.5 text-charcoal-400" />
                      {selectedSpecialist.email}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl border border-warm-200/80 bg-white">
                <p className="text-xs text-charcoal-400 font-medium">Bajarilgan seanslar</p>
                <p className="text-lg font-bold text-charcoal-900 tabular-nums mt-0.5">
                  {sessionsCountMap.get(selectedSpecialist.id) || 0} ta
                </p>
              </div>
              <div className="p-3 rounded-xl border border-warm-200/80 bg-white">
                <p className="text-xs text-charcoal-400 font-medium">Ish tajribasi</p>
                <p className="text-lg font-bold text-amber-600 tabular-nums mt-0.5">
                  {selectedSpecialist.experience ? `${selectedSpecialist.experience} yil` : 'Belgilanmagan'}
                </p>
              </div>
            </div>

            {/* Working Schedule */}
            <div className="p-3.5 rounded-xl border border-warm-200/80 bg-white space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-charcoal-400">
                Ish tartibi va soatlari
              </h4>
              <div className="flex items-center justify-between text-xs">
                <span className="text-charcoal-500 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-brand-600" />
                  Ish vaqti:
                </span>
                <span className="font-semibold text-charcoal-800">
                  {selectedSpecialist.workingHours?.start || '09:00'} – {selectedSpecialist.workingHours?.end || '18:00'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs pt-1.5 border-t border-warm-100">
                <span className="text-charcoal-500 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-brand-600" />
                  Ish kunlari:
                </span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5, 6].map(dayIndex => {
                    const isWorking = selectedSpecialist.workingDays?.includes(dayIndex);
                    return (
                      <span
                        key={dayIndex}
                        className={cn(
                          "text-[10px] px-1.5 py-0.5 rounded font-medium",
                          isWorking
                            ? "bg-brand-50 text-brand-800 font-bold border border-brand-200/50"
                            : "bg-warm-100 text-charcoal-400 opacity-60"
                        )}
                      >
                        {DAY_NAMES[dayIndex]}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Bio if exists */}
            {selectedSpecialist.bio && (
              <div className="p-3 rounded-xl bg-warm-50 border border-warm-200/60 text-xs text-charcoal-600">
                <span className="font-semibold text-charcoal-800">Qisqacha bio: </span>
                {selectedSpecialist.bio}
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-warm-100">
              <Button variant="secondary" onClick={() => setSelectedSpecialist(null)}>
                Yopish
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Create Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Yangi mutaxassis" size="md">
        <CreateSpecialistForm
          createSpecialist={createSpecialist}
          onSuccess={() => setShowCreate(false)}
          onCancel={() => setShowCreate(false)}
        />
      </Modal>
    </div>
  );
}

interface CreateSpecialistFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  createSpecialist: (data: Omit<Specialist, 'id' | 'createdAt'>) => Specialist;
}

function CreateSpecialistForm({ onSuccess, onCancel, createSpecialist }: CreateSpecialistFormProps) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({ resolver: zodResolver(schema) });
  const onSubmit = async (data: FormValues) => {
    await new Promise(r => setTimeout(r, 300));
    createSpecialist({
      fullName: data.fullName,
      phone: data.phone,
      email: data.email || '',
      specialization: data.specialization,
      experience: Number(data.experienceYears) || 0,
      status: 'ACTIVE',
      role: 'SPECIALIST',
      workingDays: [1, 2, 3, 4, 5],
      workingHours: { start: '09:00', end: '18:00' },
      bio: data.bio || '',
    });
    onSuccess();
  };
  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <Input label="To'liq ism" required placeholder="Masalan: Dr. Aziz Nazarov" error={errors.fullName?.message} {...register('fullName')} />
      <Input label="Mutaxassislik" required placeholder="Massaj terapevti, Fizioterapevt..." error={errors.specialization?.message} {...register('specialization')} />
      <div className="grid grid-cols-2 gap-4">
        <Input label="Telefon" required type="tel" placeholder="+998901234567" error={errors.phone?.message} {...register('phone')} />
        <Input label="Email" type="email" placeholder="doctor@massaj.uz" {...register('email')} />
      </div>
      <Input label="Tajriba (yil)" type="number" placeholder="5" min="0" {...register('experienceYears')} />
      <Textarea label="Qisqacha bio" placeholder="Mutaxassis haqida ma'lumot..." rows={2} {...register('bio')} />
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-warm-100">
        <Button variant="secondary" type="button" onClick={onCancel}>Bekor qilish</Button>
        <Button type="submit" loading={isSubmitting}>Saqlash</Button>
      </div>
    </form>
  );
}
