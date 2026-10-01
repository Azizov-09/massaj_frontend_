// ═══════════════════════════════════════════════════════
//  Create Appointment Form
// ═══════════════════════════════════════════════════════
import { useForm, useWatch, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useStore, useAuth } from '@/store';
import { Select, Textarea, DatePicker, TimePicker, Badge, Avatar } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { Clock } from 'lucide-react';

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
  defaultTime?: string;
}

export function CreateAppointmentForm({ onSuccess, onCancel, defaultDate, defaultTime }: Props) {
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
      childId: '',
      specialistId: '',
      serviceId: '',
      date: defaultDate || new Date().toISOString().split('T')[0],
      startTime: defaultTime || '09:00',
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

  const selectedService = services.find(s => s.id === selectedServiceId);
  const selectedChild = allChildren.find(c => c.id === selectedChildId);
  const parentId = selectedChild?.parentId ?? (isParent && currentUser ? currentUser.id : '');
  const parent = parents.find(p => p.id === parentId);

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
        <Controller
          control={control}
          name="childId"
          render={({ field }) => (
            <Select
              label="Bola"
              required
              placeholder="Bolani tanlang"
              options={availableChildren.filter(c => c.status === 'ACTIVE').map(c => ({ value: c.id, label: c.fullName }))}
              error={errors.childId?.message}
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
        <Controller
          control={control}
          name="specialistId"
          render={({ field }) => (
            <Select
              label="Mutaxassis"
              required
              placeholder="Mutaxassisni tanlang"
              options={specialists.filter(s => s.status === 'ACTIVE').map(s => ({ value: s.id, label: `${s.fullName} — ${s.specialization}` }))}
              error={errors.specialistId?.message}
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
        {selectedChild && (
          <div className="sm:col-span-2 flex flex-wrap items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-[12px] bg-warm-50/80 border border-warm-200/80 text-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <Avatar name={selectedChild.fullName} src={selectedChild.avatar} size="xs" />
              <div className="truncate">
                <span className="font-semibold text-charcoal-900">{selectedChild.fullName}</span>
                {selectedChild.dateOfBirth && (
                  <span className="text-charcoal-500 ml-1.5 font-normal">
                    ({new Date().getFullYear() - new Date(selectedChild.dateOfBirth).getFullYear()} yosh)
                  </span>
                )}
              </div>
            </div>
            {parent && (
              <div className="flex items-center gap-1.5 text-charcoal-600 shrink-0">
                <span className="text-charcoal-400">Ota-onasi:</span>
                <span className="font-medium text-charcoal-800">{parent.fullName}</span>
                {parent.phone && (
                  <span className="text-charcoal-500 font-mono text-[11px]">({parent.phone})</span>
                )}
              </div>
            )}
          </div>
        )}
        <Controller
          control={control}
          name="serviceId"
          render={({ field }) => (
            <Select
              label="Xizmat"
              required
              placeholder="Xizmatni tanlang"
              options={services.filter(s => s.status === 'ACTIVE').map(s => ({ value: s.id, label: `${s.name} (${s.durationMinutes} daq · ${(s.price / 1000).toFixed(0)}K so'm)` }))}
              error={errors.serviceId?.message}
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
        <Controller
          control={control}
          name="date"
          render={({ field }) => (
            <DatePicker
              label="Sana"
              required
              error={errors.date?.message}
              min={new Date().toISOString().split('T')[0]}
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
        <Controller
          control={control}
          name="startTime"
          render={({ field }) => (
            <TimePicker
              label="Boshlanish vaqti"
              required
              error={errors.startTime?.message}
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
        <div>
          <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1.5">
            Tugash vaqti
          </label>
          <div className="flex items-center justify-between px-3.5 h-[42px] bg-warm-50/60 border border-warm-200/80 rounded-[10px] text-charcoal-700">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Clock className="w-4 h-4 text-charcoal-400" />
              <span className={endTime ? 'text-charcoal-900 font-mono font-bold' : 'text-charcoal-400 font-normal italic'}>
                {endTime || '--:--'}
              </span>
            </div>
            {selectedService ? (
              <Badge variant="neutral" className="text-[11px] py-0 px-2 font-medium">
                {selectedService.durationMinutes} daq seans
              </Badge>
            ) : (
              <span className="text-[11px] text-charcoal-400">Xizmat kutilmoqda</span>
            )}
          </div>
          <p className="text-[11px] text-charcoal-500 mt-1">
            {endTime ? 'Boshlanish vaqti va davomiylikka asosan' : 'Xizmat tanlanganda avtomatik hisoblanadi'}
          </p>
        </div>
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
