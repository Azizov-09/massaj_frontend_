// ═══════════════════════════════════════════════════════
//  Create Child Form — React Hook Form + Zod
// ═══════════════════════════════════════════════════════
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useStore } from '@/store';
import { Input, Select, Textarea } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';

const schema = z.object({
  fullName: z.string().min(2, 'Ism kamida 2 ta belgidan iborat bo\'lishi kerak'),
  dateOfBirth: z.string().min(1, 'Tug\'ilgan sanani kiriting'),
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
}

export function CreateChildForm({ onSuccess, onCancel }: Props) {
  const parents = useStore(s => s.parents);
  const specialists = useStore(s => s.specialists);
  const createChild = useStore(s => s.createChild);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { gender: 'MALE' },
  });

  const onSubmit = async (data: FormValues) => {
    await new Promise(r => setTimeout(r, 300)); // Simulate async
    createChild({
      ...data,
      status: 'ACTIVE',
      gender: data.gender as 'MALE' | 'FEMALE',
    });
    onSuccess();
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
        <Input
          type="date"
          label="Tug'ilgan sana"
          required
          error={errors.dateOfBirth?.message}
          max={new Date().toISOString().split('T')[0]}
          {...register('dateOfBirth')}
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
        <Select
          label="Ota-ona / vasiy"
          required
          placeholder="Ota-onani tanlang"
          options={parents.map(p => ({ value: p.id, label: `${p.fullName} (${p.phone})` }))}
          error={errors.parentId?.message}
          {...register('parentId')}
        />
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
      <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-warm-100">
        <Button variant="secondary" type="button" onClick={onCancel}>Bekor qilish</Button>
        <Button type="submit" loading={isSubmitting}>Saqlash</Button>
      </div>
    </form>
  );
}
