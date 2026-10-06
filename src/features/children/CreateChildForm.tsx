// ═══════════════════════════════════════════════════════
//  Create Child Form — React Hook Form + Zod
// ═══════════════════════════════════════════════════════
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useStore, useAuth } from '@/store';
import { Input, Select, Textarea, DatePicker } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';

const schema = z.object({
  fullName: z.string().min(2, 'Ism kamida 2 ta belgidan iborat bo\'lishi kerak'),
  dateOfBirth: z.string().min(1, 'Tug\'ilgan sanani kiriting').refine(d => new Date(d) <= new Date(), 'Tug\'ilgan sana kelajakda bo\'lishi mumkin emas'),
  gender: z.enum(['MALE', 'FEMALE'], { required_error: 'Jinsini tanlang' }),
  parentId: z.string().min(1, 'Ota-onani tanlang'),
  assignedSpecialistId: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  emergencyContact: z.string().optional(),
  notes: z.string().optional(),
  diagnosis: z.string().optional(),
  allergies: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  onSuccess: () => void;
  onCancel: () => void;
  defaultParentId?: string;
}

export function CreateChildForm({ onSuccess, onCancel, defaultParentId }: Props) {
  const { currentUser } = useAuth();
  const parents = useStore(s => s.parents);
  const specialists = useStore(s => s.specialists);
  const createChild = useStore(s => s.createChild);

  const effectiveParentId = defaultParentId || (currentUser?.role === 'PARENT' ? currentUser.id : undefined);

  const { register, handleSubmit, control, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      gender: 'MALE',
      parentId: effectiveParentId || '',
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      createChild({
        ...data,
        parentId: effectiveParentId || data.parentId,
        status: 'ACTIVE',
        gender: data.gender as 'MALE' | 'FEMALE',
      });
      onSuccess();
    } catch (err: unknown) {
      console.error('Child creation error:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <Input
            label="To'liq ism"
            required
            placeholder="Masalan: Ahmad Karimov"
            error={errors.fullName?.message}
            {...register('fullName')}
          />
        </div>
        <Controller
          control={control}
          name="dateOfBirth"
          render={({ field }) => (
            <DatePicker
              label="Tug'ilgan sana"
              required
              placeholder="KK.OO.YYYY"
              error={errors.dateOfBirth?.message}
              max={new Date().toISOString().split('T')[0]}
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
        <Select
          label="Jinsi"
          required
          options={[
            { value: 'MALE', label: 'O\'g\'il' },
            { value: 'FEMALE', label: 'Qiz' },
          ]}
          error={errors.gender?.message}
          {...register('gender')}
        />
        {currentUser?.role === 'PARENT' ? (
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-charcoal-700">Ota-ona / vasiy</label>
            <div className="h-10 px-3 flex items-center rounded-[10px] bg-warm-100/70 border border-warm-200 text-xs font-semibold text-charcoal-800">
              {currentUser.fullName} ({currentUser.phone || "Sizning hisobingiz"})
            </div>
            <input type="hidden" value={currentUser.id} {...register('parentId')} />
          </div>
        ) : (
          <Select
            label="Ota-ona / vasiy"
            required
            placeholder="Ota-onani tanlang"
            options={parents.map(p => ({ value: p.id, label: `${p.fullName} (${p.phone})` }))}
            error={errors.parentId?.message}
            {...register('parentId')}
          />
        )}
        <Select
          label="Mutaxassis"
          placeholder="Mutaxassisni tanlang"
          options={specialists.filter(s => s.status === 'ACTIVE').map(s => ({ value: s.id, label: `${s.fullName} — ${s.specialization}` }))}
          error={errors.assignedSpecialistId?.message}
          {...register('assignedSpecialistId')}
        />
        <Input
          label="Telefon raqam"
          type="tel"
          placeholder="+998901234567"
          error={errors.phone?.message}
          {...register('phone')}
        />
        <Input
          label="Manzil"
          placeholder="Toshkent, Yunusobod..."
          error={errors.address?.message}
          {...register('address')}
        />
        <div className="sm:col-span-2">
          <Input
            label="Favqulodda aloqa"
            placeholder="+998901234567 (ota-ona 2)"
            error={errors.emergencyContact?.message}
            {...register('emergencyContact')}
          />
        </div>
        <div className="sm:col-span-2">
          <Textarea
            label="Admin eslatmalari"
            placeholder="Bola haqida muhim ma'lumotlar..."
            rows={2}
            {...register('notes')}
          />
        </div>
        <div className="sm:col-span-2">
          <Textarea
            label="Tibbiy eslatmalar (ixtiyoriy)"
            placeholder="Allergiyalar, maxsus ehtiyojlar... (bu ma'lumot faqat tibbiy xodimlar uchun)"
            rows={2}
            {...register('diagnosis')}
          />
        </div>
      </div>
      <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 mt-6 pt-4 border-t border-warm-100">
        <Button variant="secondary" type="button" onClick={onCancel} className="w-full sm:w-auto">Bekor qilish</Button>
        <Button type="submit" loading={isSubmitting} className="w-full sm:w-auto">Saqlash</Button>
      </div>
    </form>
  );
}
