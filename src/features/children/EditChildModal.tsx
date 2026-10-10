// ═══════════════════════════════════════════════════════
//  Edit Child Modal — React Hook Form + Zod + Phone Mask
// ═══════════════════════════════════════════════════════
import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useStore } from '@/store';
import { Modal } from '@/components/ui/Modal';
import { Input, Select, Textarea, DatePicker } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { formatUzbekPhoneInput } from '@/utils';
import type { Child } from '@/types';

const editSchema = z.object({
  fullName: z.string().min(2, "Ism kamida 2 ta belgidan iborat bo'lishi kerak"),
  dateOfBirth: z
    .string()
    .min(1, "Tug'ilgan sanani kiriting")
    .refine(d => new Date(d) <= new Date(), "Tug'ilgan sana kelajakda bo'lishi mumkin emas"),
  gender: z.enum(['MALE', 'FEMALE']),
  parentId: z.string().min(1, 'Ota-onani tanlang'),
  phone: z
    .string()
    .min(1, 'Telefon raqamini kiriting')
    .regex(/^\+998 \(\d{2}\) \d{3}-\d{2}-\d{2}$/, "Telefon raqamini to'liq kiriting: +998 (XX) XXX-XX-XX"),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED']),
  assignedSpecialistId: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  diagnosis: z.string().optional(),
});

type EditFormValues = z.infer<typeof editSchema>;

interface Props {
  isOpen: boolean;
  child: Child | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export function EditChildModal({ isOpen, child, onClose, onSuccess }: Props) {
  const parents = useStore(s => s.parents);
  const specialists = useStore(s => s.specialists);
  const updateChild = useStore(s => s.updateChild);

  const parent = child ? parents.find(p => p.id === child.parentId) : null;
  const initialPhone = child?.phone || parent?.phone || '';

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting, isValid },
  } = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    mode: 'onChange',
  });

  useEffect(() => {
    if (child) {
      reset({
        fullName: child.fullName || '',
        dateOfBirth: child.dateOfBirth || '',
        gender: (child.gender as 'MALE' | 'FEMALE') || 'MALE',
        parentId: child.parentId || '',
        phone: formatUzbekPhoneInput(initialPhone),
        status: child.status || 'ACTIVE',
        assignedSpecialistId: child.assignedSpecialistId || '',
        address: child.address || '',
        notes: child.notes || '',
        diagnosis: child.diagnosis || '',
      });
    }
  }, [child, reset, initialPhone]);

  if (!child) return null;

  const onSubmit = async (data: EditFormValues) => {
    try {
      updateChild(child.id, {
        fullName: data.fullName,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        parentId: data.parentId,
        phone: data.phone,
        status: data.status,
        assignedSpecialistId: data.assignedSpecialistId || undefined,
        address: data.address,
        notes: data.notes,
        diagnosis: data.diagnosis,
      });
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      console.error('Child update error:', err);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Bolani tahrirlash"
      description={`${child.fullName} ma'lumotlarini yangilash`}
      size="lg"
    >
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
              { value: 'MALE', label: "O'g'il" },
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

          <Controller
            control={control}
            name="phone"
            render={({ field }) => (
              <Input
                label="Telefon raqam"
                required
                type="tel"
                placeholder="+998 (90) 123-45-67"
                error={errors.phone?.message}
                value={field.value || ''}
                onChange={(e) => {
                  const formatted = formatUzbekPhoneInput(e.target.value);
                  field.onChange(formatted);
                }}
              />
            )}
          />

          <Select
            label="Holati"
            required
            options={[
              { value: 'ACTIVE', label: 'Faol' },
              { value: 'INACTIVE', label: 'Nofaol' },
              { value: 'ARCHIVED', label: 'Arxivlangan' },
            ]}
            error={errors.status?.message}
            {...register('status')}
          />

          <Select
            label="Biriktirilgan mutaxassis"
            placeholder="Mutaxassisni tanlang (ixtiyoriy)"
            options={specialists
              .filter(s => s.status === 'ACTIVE')
              .map(s => ({ value: s.id, label: `${s.fullName} — ${s.specialization}` }))}
            error={errors.assignedSpecialistId?.message}
            {...register('assignedSpecialistId')}
          />

          <div className="sm:col-span-2">
            <Input
              label="Yashash manzili"
              placeholder="Toshkent, Yunusobod..."
              error={errors.address?.message}
              {...register('address')}
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
              label="Tibbiy eslatmalar va tashxis (ixtiyoriy)"
              placeholder="Allergiyalar, maxsus ehtiyojlar..."
              rows={2}
              {...register('diagnosis')}
            />
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 mt-6 pt-4 border-t border-warm-100">
          <Button variant="secondary" type="button" onClick={onClose} className="w-full sm:w-auto">
            Bekor qilish
          </Button>
          <Button
            type="submit"
            loading={isSubmitting}
            disabled={!isValid || isSubmitting}
            className="w-full sm:w-auto"
          >
            Saqlash
          </Button>
        </div>
      </form>
    </Modal>
  );
}
