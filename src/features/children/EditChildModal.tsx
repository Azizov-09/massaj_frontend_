// ═══════════════════════════════════════════════════════
//  Edit Child Modal — React Hook Form + Zod + Phone Mask
// ═══════════════════════════════════════════════════════
import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useStore } from '@/store';
import { Modal } from '@/components/ui/Modal';
import { Input, Select, Textarea, DatePicker } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { formatUzbekPhoneInput, cn } from '@/utils';
import { AlertCircle } from 'lucide-react';
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

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [duplicateField, setDuplicateField] = useState<'phone' | 'fullName' | null>(null);

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
      setSubmitError(null);
      setDuplicateField(null);
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
    setSubmitError(null);
    setDuplicateField(null);
    try {
      await updateChild(child.id, {
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
    } catch (err: any) {
      console.error('Child update error:', err);
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 600);
      const msg = err?.message || "Serverda xatolik yuz berdi";
      setSubmitError(msg);

      const lower = msg.toLowerCase();
      if (err?.status === 409 || lower.includes('telefon') || lower.includes('phone')) {
        setDuplicateField('phone');
      } else if (lower.includes('bola') || lower.includes('ism') || lower.includes('name')) {
        setDuplicateField('fullName');
      }
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
                Iltimos, ma'lumotlarni tekshirib qaytadan urinib ko'ring.
              </p>
            </div>
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Input
              label="To'liq ism"
              required
              placeholder="Masalan: Ahmad Karimov"
              error={duplicateField === 'fullName' ? submitError || errors.fullName?.message : errors.fullName?.message}
              className={duplicateField === 'fullName' ? 'border-danger-main ring-2 ring-danger-main/20 bg-danger-surface/20' : undefined}
              {...register('fullName', {
                onChange: () => {
                  if (duplicateField === 'fullName') setDuplicateField(null);
                }
              })}
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
                error={duplicateField === 'phone' ? submitError || errors.phone?.message : errors.phone?.message}
                className={duplicateField === 'phone' ? 'border-danger-main ring-2 ring-danger-main/20 bg-danger-surface/20' : undefined}
                value={field.value || ''}
                onChange={(e) => {
                  if (duplicateField === 'phone') setDuplicateField(null);
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
