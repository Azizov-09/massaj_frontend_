// Specialists Page
import { useState, useMemo } from 'react';
import { Plus, Search, Stethoscope, Users, Award, Clock, X, Phone } from 'lucide-react';
import { useStore } from '@/store';
import { getEntityStatusColor, getEntityStatusLabel } from '@/utils';
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

export function SpecialistsPage() {
  const specialists = useStore(s => s.specialists);
  const sessions = useStore(s => s.sessions);
  const createSpecialist = useStore(s => s.createSpecialist);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const sessionsCountMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of sessions) {
      if (s.status === 'COMPLETED') {
        map.set(s.specialistId, (map.get(s.specialistId) || 0) + 1);
      }
    }
    return map;
  }, [sessions]);

  const filtered = useMemo(() => {
    return specialists.filter(s => {
      const q = search.toLowerCase();
      const matchSearch = !search || s.fullName.toLowerCase().includes(q) || s.specialization.toLowerCase().includes(q);
      const matchStatus = !statusFilter || s.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [specialists, search, statusFilter]);

  const columns: Column<Specialist>[] = [
    {
      key: 'fullName', header: 'Mutaxassis', sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={row.fullName} src={row.avatar} size="sm" />
          <div>
            <p className="font-semibold text-charcoal-900 text-sm">{row.fullName}</p>
            <p className="text-xs text-charcoal-400">{row.specialization}</p>
          </div>
        </div>
      )
    },
    {
      key: 'phone', header: 'Telefon',
      cell: (row) => (
        <span className="inline-flex items-center gap-1.5 text-xs text-charcoal-700 font-mono">
          <Phone className="w-3.5 h-3.5 text-charcoal-400" />
          {row.phone}
        </span>
      )
    },
    {
      key: 'sessionsCount', header: 'Seanslar',
      cell: (row) => {
        const count = sessionsCountMap.get(row.id) || 0;
        return <span className="text-sm font-bold text-charcoal-800 tabular-nums">{count}</span>;
      }
    },
    {
      key: 'experience', header: 'Tajriba',
      cell: (row) => <span className="text-xs text-charcoal-600 font-medium">{row.experience ? `${row.experience} yil` : '—'}</span>
    },
    {
      key: 'status', header: 'Holat',
      cell: (row) => <Badge className={getEntityStatusColor(row.status)} dot>{getEntityStatusLabel(row.status)}</Badge>
    },
  ];

  const active = specialists.filter(s => s.status === 'ACTIVE').length;
  const inactive = specialists.filter(s => s.status !== 'ACTIVE').length;
  const completedSessions = sessions.filter(s => s.status === 'COMPLETED').length;
  const avgExp = specialists.length > 0
    ? Math.round(specialists.reduce((sum, s) => sum + (s.experience || 0), 0) / specialists.length)
    : 0;

  return (
    <div className="px-4 lg:px-6 py-6 max-w-[1600px] mx-auto space-y-5">
      <PageHeader
        title="Mutaxassislar"
        description={`Jami ${specialists.length} ta mutaxassis, ${active} ta faol`}
        actions={<Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowCreate(true)}>Mutaxassis qo'shish</Button>}
      />

      {/* 4 Balanced KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <KpiCard
          label="Faol mutaxassislar"
          value={active}
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
          description="Malakali kadrlar"
          icon={<Clock className="w-4 h-4 text-amber-500" />}
          accentColor="gold"
          index={2}
        />
        <KpiCard
          label="Jami mutaxassislar"
          value={specialists.length}
          description={inactive > 0 ? `${inactive} nafar nofaol` : 'Barchasi faol'}
          icon={<Users className="w-4 h-4 text-blue-500" />}
          accentColor="blue"
          index={3}
        />
      </div>

      <Card>
        <div className="px-4 py-3 flex flex-wrap items-center gap-3 border-b border-warm-100">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-400 pointer-events-none" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Ism yoki mutaxassislik..."
              className="w-full h-9 pl-9 pr-8 text-xs border border-warm-300 rounded-[10px] bg-white shadow-2xs placeholder:text-charcoal-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100/80 outline-none transition-all"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-400 hover:text-charcoal-700">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="w-44">
            <Select
              size="sm"
              triggerClassName="h-9 rounded-[10px] text-xs shadow-2xs border-warm-300"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              options={[
                { value: '', label: 'Barcha holatlar' },
                { value: 'ACTIVE', label: 'Faol' },
                { value: 'INACTIVE', label: 'Nofaol' },
              ]}
              aria-label="Holat bo'yicha filter"
            />
          </div>

          {statusFilter && (
            <button
              onClick={() => setStatusFilter('')}
              className="flex items-center gap-1 text-xs text-danger-main hover:text-danger-dark font-medium"
            >
              <X className="w-3 h-3" /> Tozalash
            </button>
          )}

          <span className="ml-auto text-xs text-charcoal-400 font-medium">{filtered.length} ta mutaxassis</span>
        </div>
        <DataTable data={filtered} columns={columns}
          keyExtractor={r => r.id} emptyTitle="Mutaxassislar topilmadi" emptyIcon={<Stethoscope className="w-5 h-5" />} />
      </Card>
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
