// Specialists Page — Senior Medical/Wellness CRM Table standard
import { useState, useMemo } from 'react';
import {
  Plus, Search, Stethoscope, Users, Award, Clock, X, Phone,
  Mail, Calendar, Eye, EyeOff, CheckCircle2,
  KeyRound, ShieldCheck, RefreshCw, Pencil, AlertCircle
} from 'lucide-react';
import { useStore } from '@/store';
import { getEntityStatusColor, getEntityStatusLabel, cn, generateStrongPassword } from '@/utils';
import { DataTable, Column, getAvatarGradient } from '@/components/tables/DataTable';
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
  phone: z.string().min(9, 'Telefon raqamni kiriting'),
  password: z
    .string()
    .min(12, 'Parol kamida 12 ta belgidan iborat bo\'lishi shart')
    .regex(/[A-Z]/, 'Kamida 1 ta katta harf (A-Z) bo\'lishi shart')
    .regex(/[a-z]/, 'Kamida 1 ta kichik harf (a-z) bo\'lishi shart')
    .regex(/[0-9]/, 'Kamida 1 ta raqam (0-9) bo\'lishi shart'),
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
  const updateSpecialist = useStore(s => s.updateSpecialist);
  const deleteSpecialist = useStore(s => s.deleteSpecialist);
  const addToast = useStore(s => s.addToast);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [showCreate, setShowCreate] = useState(false);
  const [selectedSpecialist, setSelectedSpecialist] = useState<Specialist | null>(null);
  const [editingSpecialist, setEditingSpecialist] = useState<Specialist | null>(null);
  const [deletingSpecialist, setDeletingSpecialist] = useState<Specialist | null>(null);

  const [editForm, setEditForm] = useState<{
    fullName: string;
    phone: string;
    email: string;
    specialization: string;
    experience: number;
    bio: string;
    status: 'ACTIVE' | 'INACTIVE';
  }>({
    fullName: '',
    phone: '',
    email: '',
    specialization: '',
    experience: 0,
    bio: '',
    status: 'ACTIVE',
  });
  const [editErrors, setEditErrors] = useState<{ fullName?: string; phone?: string; specialization?: string }>({});
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [editSubmitError, setEditSubmitError] = useState<string | null>(null);
  const [editIsShaking, setEditIsShaking] = useState(false);
  const [isDeletingLoading, setIsDeletingLoading] = useState(false);

  const handleOpenEdit = (specialist: Specialist) => {
    setEditingSpecialist(specialist);
    setEditSubmitError(null);
    setEditForm({
      fullName: specialist.fullName || '',
      phone: specialist.phone || '',
      email: specialist.email || '',
      specialization: specialist.specialization || '',
      experience: specialist.experience || 0,
      bio: specialist.bio || '',
      status: specialist.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
    });
    setEditErrors({});
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSpecialist) return;
    setEditSubmitError(null);

    const errors: { fullName?: string; phone?: string; specialization?: string } = {};
    if (!editForm.fullName.trim()) errors.fullName = 'Ism familiyani kiriting';
    if (!editForm.phone.trim()) errors.phone = 'Telefon raqamni kiriting';
    if (!editForm.specialization.trim()) errors.specialization = 'Mutaxassislikni kiriting';

    if (Object.keys(errors).length > 0) {
      setEditErrors(errors);
      setEditIsShaking(true);
      setTimeout(() => setEditIsShaking(false), 500);
      return;
    }

    setIsEditSubmitting(true);
    try {
      await updateSpecialist(editingSpecialist.id, {
        fullName: editForm.fullName.trim(),
        phone: editForm.phone.trim(),
        email: editForm.email.trim() || undefined,
        specialization: editForm.specialization.trim(),
        experience: Number(editForm.experience) || 0,
        bio: editForm.bio.trim() || undefined,
        status: editForm.status,
      });
      setEditingSpecialist(null);
      setEditErrors({});
      setEditSubmitError(null);
    } catch (err: any) {
      setEditIsShaking(true);
      setTimeout(() => setEditIsShaking(false), 600);
      setEditSubmitError(err?.message || 'Serverda xatolik yuz berdi');
    } finally {
      setIsEditSubmitting(false);
    }
  };

  const handleToggleStatus = (specialist: Specialist) => {
    const nextStatus = specialist.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    updateSpecialist(specialist.id, { status: nextStatus });
    addToast({
      type: 'info',
      title: nextStatus === 'ACTIVE' ? "Mutaxassis faollashtirildi" : "Mutaxassis nofaol qilindi",
      description: `${specialist.fullName} holati o'zgartirildi`,
    });
  };

  const handleDeleteSpecialist = (specialist: Specialist) => {
    setDeletingSpecialist(specialist);
  };

  const confirmDeleteSpecialist = async () => {
    if (!deletingSpecialist) return;
    setIsDeletingLoading(true);
    try {
      await deleteSpecialist(deletingSpecialist.id);
      setDeletingSpecialist(null);
    } catch {
      // toast already shown in store
    } finally {
      setIsDeletingLoading(false);
    }
  };

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
        const matchName = s.fullName?.toLowerCase().includes(q);
        const matchSpec = s.specialization?.toLowerCase().includes(q);
        const matchPhone = s.phone?.toLowerCase().includes(q);
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
      key: 'workingHours',
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
                    "text-[10px] px-1 py-0.5 rounded font-medium",
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
      key: 'sessionsCount',
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
      key: 'actions',
      header: 'Amallar',
      cell: (row) => (
        <div className="flex items-center justify-end gap-1.5">
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
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenEdit(row);
            }}
            className="h-8 px-2.5 text-xs text-brand-600 border-brand-200 hover:bg-brand-50 hover:border-brand-300"
          >
            <Pencil className="w-3.5 h-3.5 mr-1" />
            Tahrirlash
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteSpecialist(row);
            }}
            className="h-8 px-2 text-xs text-rose-600 hover:bg-rose-50"
            title="O'chirish"
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="px-4 lg:px-6 py-6 max-w-[1600px] mx-auto space-y-6">
      <PageHeader
        icon={<Stethoscope className="w-5 h-5 text-white" />}
        title="Mutaxassislar"
        description={`Jami ${specialists.length} ta mutaxassis, ${activeCount} ta faol xodim`}
        actions={
          <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowCreate(true)}>
            Mutaxassis qo'shish
          </Button>
        }
      />

      {/* KPI Cards — Visible on tablet/desktop, cleanly hidden on mobile to give immediate list access matching educorecrm */}
      <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-3.5">
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

      <Card className="overflow-visible border border-warm-200/90 rounded-2xl shadow-xs">
        {/* Quick Tabs — Desktop/tablet filter pills */}
        <div className="hidden sm:flex items-center gap-1.5 px-4 py-3 border-b border-warm-200/70 overflow-x-auto touch-scroll-x scrollbar-thin w-full bg-warm-50/30">
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
              "px-1.5 py-0.5 rounded-full text-[10px] font-bold",
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
              "px-1.5 py-0.5 rounded-full text-[10px] font-bold",
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
              "px-1.5 py-0.5 rounded-full text-[10px] font-bold",
              statusFilter === 'INACTIVE' ? "bg-white/20 text-white" : "bg-warm-200 text-charcoal-600"
            )}>
              {inactiveCount}
            </span>
          </button>
        </div>

        {/* Filter bar: Search and status dropdown */}
        <div className="p-3.5 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-warm-100 bg-white">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-400 pointer-events-none" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Ism, telefon yoki mutaxassislik..."
              className="w-full h-10 pl-9.5 pr-8 text-xs sm:text-sm border border-warm-200 rounded-xl bg-white shadow-2xs placeholder:text-charcoal-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-charcoal-400 hover:text-charcoal-600 hover:bg-warm-100 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status filter (Mobile only: on desktop, pills tab bar handles status) */}
          <div className="sm:hidden w-full">
            <Select
              size="sm"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              triggerClassName="h-10 rounded-xl text-xs sm:text-sm font-medium border-warm-200 shadow-2xs w-full"
              options={[
                { value: 'ALL', label: `Barcha holatlar (${specialists.length})` },
                { value: 'ACTIVE', label: `Faol mutaxassislar (${activeCount})` },
                { value: 'INACTIVE', label: `Nofaol mutaxassislar (${inactiveCount})` },
              ]}
              aria-label="Holat bo'yicha filter"
            />
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="h-10 px-3 rounded-xl border border-warm-200 bg-warm-50 text-xs font-semibold text-charcoal-600 hover:bg-warm-100 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              Tozalash
            </button>
          )}
        </div>

        {/* Data Table with EducoreCRM Expandable Accordion Architecture */}
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
          mobileCardConfig={(specialist, index) => {
            const initials = specialist.fullName
              ? specialist.fullName.split(' ').map(n => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
              : 'M';

            return {
              avatarText: initials,
              avatarGradient: getAvatarGradient(index, specialist.fullName),
              title: specialist.fullName,
              subtitle: specialist.specialization,
              status: (
                <span className={cn(
                  "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border",
                  specialist.status === 'ACTIVE'
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200/60"
                    : "bg-warm-100 text-charcoal-600 border-warm-200"
                )}>
                  <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", specialist.status === 'ACTIVE' ? "bg-emerald-500" : "bg-charcoal-400")} />
                  {specialist.status === 'ACTIVE' ? 'Faol' : 'Nofaol'}
                </span>
              ),
              details: [
                { label: 'Tajriba', value: `${specialist.experience || 0} yil` },
                {
                  label: 'Telefon',
                  value: (
                    <a href={`tel:${specialist.phone}`} onClick={e => e.stopPropagation()} className="text-brand-600 font-medium hover:underline">
                      {specialist.phone}
                    </a>
                  ),
                },
                { label: 'Bajarilgan seanslar', value: `${sessionsCountMap.get(specialist.id) || 0} ta` },
                { label: 'Kutilayotgan qabullar', value: `${upcomingAppointmentsMap.get(specialist.id) || 0} ta` },
              ],
              actions: (
                <div className="grid grid-cols-2 gap-2 w-full pt-1">
                  <button
                    type="button"
                    onClick={() => setSelectedSpecialist(specialist)}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg border border-warm-200 bg-white text-charcoal-700 text-xs font-medium hover:bg-warm-50 active:bg-warm-100 shadow-2xs transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-charcoal-500 shrink-0" />
                    <span className="truncate">Ko'rish</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(specialist)}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg border border-brand-200 bg-brand-50 text-brand-700 text-xs font-medium hover:bg-brand-100 active:bg-brand-200 shadow-2xs transition-colors cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                    <span className="truncate">Tahrirlash</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(specialist)}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg border border-warm-200 bg-white text-charcoal-700 text-xs font-medium hover:bg-warm-50 active:bg-warm-100 shadow-2xs transition-colors cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span className="truncate">{specialist.status === 'ACTIVE' ? 'Nofaol qilish' : 'Faollashtirish'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteSpecialist(specialist)}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg border border-rose-200 bg-rose-50 text-rose-600 text-xs font-medium hover:bg-rose-100 active:bg-rose-200 shadow-2xs transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">O'chirish</span>
                  </button>
                </div>
              ),
            };
          }}
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

      {/* Edit Specialist Modal */}
      {editingSpecialist && (
        <Modal
          isOpen={!!editingSpecialist}
          onClose={() => { if (!isEditSubmitting) { setEditingSpecialist(null); setEditErrors({}); setEditSubmitError(null); } }}
          title="Mutaxassisni tahrirlash"
          size="md"
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <Button
                variant="secondary"
                size="sm"
                disabled={isEditSubmitting}
                onClick={() => { setEditingSpecialist(null); setEditErrors({}); setEditSubmitError(null); }}
              >
                Bekor qilish
              </Button>
              <Button
                size="sm"
                loading={isEditSubmitting}
                onClick={handleSaveEdit as any}
              >
                Saqlash
              </Button>
            </div>
          }
        >
          <form onSubmit={handleSaveEdit} className={`space-y-4 py-2 transition-transform ${editIsShaking ? 'animate-shake' : ''}`}>
            {editSubmitError && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-danger-surface border-2 border-danger-main/40 text-danger-main text-xs font-medium shadow-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-sm">{editSubmitError}</p>
                  <p className="text-[11px] text-danger-main/80 mt-0.5">Iltimos, ma'lumotlarni tekshirib qaytadan urinib ko'ring.</p>
                </div>
              </div>
            )}
            <Input
              label="To‘liq ism"
              required
              placeholder="Masalan: Dr. Sardor Rustamov"
              value={editForm.fullName}
              error={editErrors.fullName}
              onChange={e => {
                setEditForm({ ...editForm, fullName: e.target.value });
                if (editErrors.fullName) setEditErrors({ ...editErrors, fullName: undefined });
              }}
            />

            <Input
              label="Mutaxassislik"
              required
              placeholder="Masalan: Fizioterapiya, Bolalar massaji"
              value={editForm.specialization}
              error={editErrors.specialization}
              onChange={e => {
                setEditForm({ ...editForm, specialization: e.target.value });
                if (editErrors.specialization) setEditErrors({ ...editErrors, specialization: undefined });
              }}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Telefon raqam"
                required
                type="tel"
                placeholder="+998901234567"
                value={editForm.phone}
                error={editErrors.phone}
                onChange={e => {
                  setEditForm({ ...editForm, phone: e.target.value });
                  if (editErrors.phone) setEditErrors({ ...editErrors, phone: undefined });
                }}
              />

              <Input
                label="Tajriba (yil)"
                type="number"
                min="0"
                max="60"
                placeholder="5"
                value={editForm.experience || ''}
                onChange={e => setEditForm({ ...editForm, experience: parseInt(e.target.value, 10) || 0 })}
              />
            </div>

            <Input
              label="Email (ixtiyoriy)"
              type="email"
              placeholder="specialist@massaj.uz"
              value={editForm.email}
              onChange={e => setEditForm({ ...editForm, email: e.target.value })}
            />

            <Select
              label="Hisob holati"
              value={editForm.status}
              onChange={e => setEditForm({ ...editForm, status: e.target.value as 'ACTIVE' | 'INACTIVE' })}
            >
              <option value="ACTIVE">Faol (Qabullarni qabul qiladi)</option>
              <option value="INACTIVE">Nofaol (Tizimga kirish cheklangan)</option>
            </Select>

            <Textarea
              label="Qisqacha bio"
              rows={3}
              placeholder="Mutaxassis haqida qisqacha ma'lumot..."
              value={editForm.bio}
              onChange={e => setEditForm({ ...editForm, bio: e.target.value })}
            />
          </form>
        </Modal>
      )}

      {/* In-App Delete Confirmation Modal (no browser native dialog) */}
      {deletingSpecialist && (
        <Modal
          isOpen={!!deletingSpecialist}
          onClose={() => { if (!isDeletingLoading) setDeletingSpecialist(null); }}
          title="Mutaxassisni o'chirish"
          size="sm"
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <Button
                variant="secondary"
                size="sm"
                disabled={isDeletingLoading}
                onClick={() => setDeletingSpecialist(null)}
              >
                Bekor qilish
              </Button>
              <Button
                variant="danger"
                size="sm"
                loading={isDeletingLoading}
                onClick={confirmDeleteSpecialist}
              >
                Ha, o'chirish
              </Button>
            </div>
          }
        >
          <div className="space-y-3 py-2 text-charcoal-700">
            <p className="text-sm">
              Haqiqatan ham <strong className="font-semibold text-charcoal-900">{deletingSpecialist.fullName}</strong> mutaxassisini tizimdan o'chirishni tasdiqlaysizmi?
            </p>
            <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200/80 rounded-lg p-2.5">
              ⚠️ Ushbu mutaxassisning profili nofaol qilinadi va tizimdan olib tashlanadi.
            </p>
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
  createSpecialist: (data: Omit<Specialist, 'id' | 'createdAt'>, password?: string) => Promise<Specialist>;
}

function CreateSpecialistForm({ onSuccess, onCancel, createSpecialist }: CreateSpecialistFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [duplicateField, setDuplicateField] = useState<'phone' | 'email' | null>(null);

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: '',
      phone: '',
      password: generateStrongPassword(14),
      email: '',
      specialization: '',
      experienceYears: '3',
      bio: '',
    },
  });

  const handleGeneratePassword = () => {
    const newPwd = generateStrongPassword(14);
    setValue('password', newPwd, { shouldValidate: true });
  };

  const onSubmit = async (data: FormValues) => {
    setSubmitError(null);
    setDuplicateField(null);
    try {
      await createSpecialist({
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
      }, data.password);
      onSuccess();
    } catch (err: any) {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 600);
      const msg = err?.message || "Serverda xatolik yuz berdi";
      setSubmitError(msg);

      const lower = msg.toLowerCase();
      if (err?.status === 409 || lower.includes('telefon') || lower.includes('phone')) {
        setDuplicateField('phone');
      } else if (lower.includes('email')) {
        setDuplicateField('email');
      }
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className={cn("space-y-4 transition-transform", isShaking && "animate-shake")}
    >
      {submitError && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-danger-surface border-2 border-danger-main/40 text-danger-main text-xs font-medium shadow-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-sm">{submitError}</p>
            <p className="text-[11px] text-danger-main/80 mt-0.5">
              Iltimos, boshqa telefon raqami yoki ma'lumot kiriting.
            </p>
          </div>
        </div>
      )}

      <Input label="To'liq ism" required placeholder="Masalan: Dr. Aziz Nazarov" error={errors.fullName?.message} {...register('fullName')} />
      <Input label="Mutaxassislik" required placeholder="Massaj terapevti, Fizioterapevt..." error={errors.specialization?.message} {...register('specialization')} />
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Telefon"
          required
          type="tel"
          placeholder="+998901234567"
          error={duplicateField === 'phone' ? submitError || errors.phone?.message : errors.phone?.message}
          className={duplicateField === 'phone' ? 'border-danger-main ring-2 ring-danger-main/20 bg-danger-surface/20' : undefined}
          {...register('phone', {
            onChange: () => {
              if (duplicateField === 'phone') setDuplicateField(null);
            }
          })}
        />
        <Input
          label="Email"
          type="email"
          placeholder="doctor@massaj.uz"
          error={duplicateField === 'email' ? submitError || errors.email?.message : errors.email?.message}
          className={duplicateField === 'email' ? 'border-danger-main ring-2 ring-danger-main/20 bg-danger-surface/20' : undefined}
          {...register('email', {
            onChange: () => {
              if (duplicateField === 'email') setDuplicateField(null);
            }
          })}
        />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-charcoal-700 flex items-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5 text-brand-600" />
            <span>Kirish paroli</span>
            <span className="text-danger-main">*</span>
          </label>
          <button
            type="button"
            onClick={handleGeneratePassword}
            className="inline-flex items-center gap-1 text-[11px] text-brand-600 hover:text-brand-800 font-medium transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            Tasodifiy parol generatsiya qilish
          </button>
        </div>
        <Input
          type={showPassword ? 'text' : 'password'}
          placeholder="Kamida 12 ta belgi (katta/kichik harf, raqam)"
          error={errors.password?.message}
          {...register('password')}
          className="font-mono text-sm"
          rightAddon={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
              className="text-charcoal-400 hover:text-charcoal-700 transition-colors focus:outline-none"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
        />
        <div className="flex items-center gap-1.5 text-[11px] text-charcoal-500 pt-0.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>Backend talabi: kamida 12 ta belgi, katta harf, kichik harf va raqam.</span>
        </div>
      </div>

      <Input label="Tajriba (yil)" type="number" placeholder="5" min="0" {...register('experienceYears')} />
      <Textarea label="Qisqacha bio" placeholder="Mutaxassis haqida ma'lumot..." rows={2} {...register('bio')} />
      <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 pt-4 border-t border-warm-100">
        <Button variant="secondary" type="button" onClick={onCancel} disabled={isSubmitting} className="w-full sm:w-auto">Bekor qilish</Button>
        <Button type="submit" loading={isSubmitting} className="w-full sm:w-auto">Saqlash</Button>
      </div>
    </form>
  );
}
