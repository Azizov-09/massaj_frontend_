// ═══════════════════════════════════════════════════════
//  Create Child Form — React Hook Form + Zod + Phone Mask
// ═══════════════════════════════════════════════════════
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useStore, useAuth } from '@/store';
import { Input, Select, Textarea, DatePicker } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { formatUzbekPhoneInput, cn } from '@/utils';
import { AlertCircle } from 'lucide-react';

const schema = z.object({
  fullName: z.string().min(2, "Ism kamida 2 ta belgidan iborat bo'lishi kerak"),
  dateOfBirth: z
    .string()
    .min(1, "Tug'ilgan sanani kiriting")
    .refine(d => new Date(d) <= new Date(), "Tug'ilgan sana kelajakda bo'lishi mumkin emas"),
  gender: z.enum(['MALE', 'FEMALE'], { required_error: 'Jinsini tanlang' }),
  parentId: z.string().min(1, 'Ota-onani tanlang'),
  phone: z
    .string()
    .min(1, 'Telefon raqamini kiriting')
    .regex(/^\+998 \(\d{2}\) \d{3}-\d{2}-\d{2}$/, "Telefon raqamini to'liq kiriting: +998 (XX) XXX-XX-XX"),
  assignedSpecialistId: z.string().optional(),
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

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [duplicateField, setDuplicateField] = useState<'phone' | 'fullName' | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting, isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: {
      fullName: '',
      gender: 'MALE',
      parentId: effectiveParentId || '',
      phone: '',
      dateOfBirth: '',
      address: '',
      emergencyContact: '',
      notes: '',
      diagnosis: '',
    },
  });

  const onSubmit = async (data: FormValues) => {
    setSubmitError(null);
    setDuplicateField(null);
    try {
      await createChild({
        ...data,
        parentId: effectiveParentId || data.parentId,
        status: 'ACTIVE',
        gender: data.gender as 'MALE' | 'FEMALE',
      });
      onSuccess();
    } catch (err: any) {
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

        <Controller
          control={control}
          name="gender"
          render={({ field }) => (
            <Select
              label="Jinsi"
              required
              options={[
                { value: 'MALE', label: "O'g'il" },
                { value: 'FEMALE', label: 'Qiz' },
              ]}
              value={field.value}
              onChange={e => field.onChange(e.target.value)}
              error={errors.gender?.message}
            />
          )}
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
          <Controller
            control={control}
            name="parentId"
            render={({ field }) => (
              <Select
                label="Ota-ona / vasiy"
                required
                placeholder="Ota-onani tanlang"
                options={parents.map(p => ({ value: p.id, label: `${p.fullName} (${p.phone})` }))}
                value={field.value}
                onChange={e => field.onChange(e.target.value)}
                error={errors.parentId?.message}
              />
            )}
          />
        )}

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
          label="Biriktirilgan mutaxassis"
          placeholder="Mutaxassisni tanlang (ixtiyoriy)"
          options={specialists
            .filter(s => s.status === 'ACTIVE')
            .map(s => ({ value: s.id, label: `${s.fullName} — ${s.specialization}` }))}
          error={errors.assignedSpecialistId?.message}
          {...register('assignedSpecialistId')}
        />

        <Input
          label="Yashash manzili"
          placeholder="Toshkent, Yunusobod..."
          error={errors.address?.message}
          {...register('address')}
        />

        <div className="sm:col-span-2">
          <Controller
            control={control}
            name="emergencyContact"
            render={({ field }) => (
              <Input
                label="Favqulodda aloqa (ixtiyoriy)"
                type="tel"
                placeholder="+998 (90) 123-45-67"
                error={errors.emergencyContact?.message}
                value={field.value || ''}
                onChange={(e) => {
                  const formatted = formatUzbekPhoneInput(e.target.value);
                  field.onChange(formatted);
                }}
              />
            )}
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
            placeholder="Allergiyalar, maxsus ehtiyojlar... (bu ma'lumot faqat tibbiy xodimlar uchun)"
            rows={2}
            {...register('diagnosis')}
          />
        </div>
      </div>

      <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 mt-6 pt-4 border-t border-warm-100">
        <Button variant="secondary" type="button" onClick={onCancel} className="w-full sm:w-auto">
          Bekor qilish
        </Button>
        <Button
          type="submit"
          loading={isSubmitting}
          disabled={!isValid || isSubmitting}
          title={!isValid ? "Barcha majburiy maydonlarni (Ism, Ota-ona, Tel, Sana) to'ldiring" : undefined}
          className="w-full sm:w-auto"
        >
          Saqlash
        </Button>
      </div>
    </form>
  );
}
