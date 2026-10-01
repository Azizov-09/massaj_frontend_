// ═══════════════════════════════════════════════════════
//  Create Appointment Form
// ═══════════════════════════════════════════════════════
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useStore, useAuth } from '@/store';
import { Input, Select, Textarea } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';

const schema = z.object({
  childId: z.string().min(1, 'Bolani tanlang'),
  specialistId: z.string().min(1, 'Mutaxassisni tanlang'),
  serviceId: z.string().min(1, 'Xizmatni tanlang'),
  date: z.string().min(1, 'Sanani kiriting'),
  startTime: z.string().min(1, "Vaqtni kiriting"),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  onSuccess: () => void;
  onCancel: () => void;
  defaultDate?: string;
}

export function CreateAppointmentForm({ onSuccess, onCancel, defaultDate }: Props) {
  const { currentUser } = useAuth();
  const allChildren = useStore(s => s.children);
  const specialists = useStore(s => s.specialists);
  const services = useStore(s => s.services);
  const parents = useStore(s => s.parents);
  const appointments = useStore(s => s.appointments);
  const createAppointment = useStore(s => s.createAppointment);
  const addToast = useStore(s => s.addToast);

  const isParent = currentUser?.role === 'PARENT';
  const availableChildren = isParent && currentUser
    ? allChildren.filter(c => c.parentId === currentUser.id)
    : allChildren;

  const { register, handleSubmit, control, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      childId: availableChildren[0]?.id || '',
      date: defaultDate || new Date().toISOString().split('T')[0],
      startTime: '09:00',
    },
  });

  const selectedServiceId = useWatch({ control, name: 'serviceId' });
  const selectedChildId = useWatch({ control, name: 'childId' });

  const getEndTime = (start: string, serviceId: string) => {
    const svc = services.find(s => s.id === serviceId);
    if (!start || !svc) return '';
    const [h, m] = start.split(':').map(Number);
    const totalMins = h * 60 + m + svc.durationMinutes;
    return `${String(Math.floor(totalMins / 60)).padStart(2, '0')}:${String(totalMins % 60).padStart(2, '0')}`;
  };

  const startTime = useWatch({ control, name: 'startTime' }) || '09:00';
  const endTime = getEndTime(startTime, selectedServiceId);

  const selectedChild = allChildren.find(c => c.id === selectedChildId);
  const parentId = selectedChild?.parentId ?? (isParent && currentUser ? currentUser.id : '');

  const onSubmit = async (data: FormValues) => {
    await new Promise(r => setTimeout(r, 300));

    // Conflict check
    const hasConflict = appointments.some(a =>
      a.specialistId === data.specialistId &&
      a.date === data.date &&
      ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'].includes(a.status) &&
      a.startTime === data.startTime
    );

    if (hasConflict) {
      addToast({
        type: 'error',
        title: 'Vaqt band!',
        description: 'Ushbu mutaxassisning ko‘rsatilgan vaqtda boshqa qabuli mavjud. Iltimos, boshqa vaqt tanlang.',
      });
      return;
    }

    createAppointment({
      childId: data.childId,
      parentId,
      specialistId: data.specialistId,
      serviceId: data.serviceId,
      date: data.date,
      startTime: data.startTime,
      endTime,
      status: 'SCHEDULED',
      notes: data.notes,
    });
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="grid sm:grid-cols-2 gap-4">
        <Select
          label="Bola"
          required
          placeholder="Bolani tanlang"
          options={availableChildren.filter(c => c.status === 'ACTIVE').map(c => ({ value: c.id, label: c.fullName }))}
          error={errors.childId?.message}
          {...register('childId')}
        />
        <Select
          label="Mutaxassis"
          required
          placeholder="Mutaxassisni tanlang"
          options={specialists.filter(s => s.status === 'ACTIVE').map(s => ({ value: s.id, label: `${s.fullName} — ${s.specialization}` }))}
          error={errors.specialistId?.message}
          {...register('specialistId')}
        />
        <Select
          label="Xizmat"
          required
          placeholder="Xizmatni tanlang"
          options={services.filter(s => s.status === 'ACTIVE').map(s => ({ value: s.id, label: `${s.name} (${s.durationMinutes} daq · ${(s.price / 1000).toFixed(0)}K so'm)` }))}
          error={errors.serviceId?.message}
          {...register('serviceId')}
        />
        <Input
          type="date"
          label="Sana"
          required
          error={errors.date?.message}
          min={new Date().toISOString().split('T')[0]}
          {...register('date')}
        />
        <Input
          type="time"
          label="Boshlanish vaqti"
          required
          error={errors.startTime?.message}
          hint={endTime ? `Tugash: ${endTime}` : undefined}
          {...register('startTime')}
        />
        {parentId && (
          <div className="flex items-end pb-2">
            <p className="text-xs text-charcoal-500">
              Ota-ona: <span className="font-medium text-charcoal-800">{parents.find(p => p.id === parentId)?.fullName}</span>
            </p>
          </div>
        )}
        <div className="sm:col-span-2">
          <Textarea label="Izoh" placeholder="Qo'shimcha ma'lumot..." rows={2} {...register('notes')} />
        </div>
      </div>
      <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-warm-100">
        <Button variant="secondary" type="button" onClick={onCancel}>Bekor qilish</Button>
        <Button type="submit" loading={isSubmitting}>Saqlash</Button>
      </div>
    </form>
  );
}
