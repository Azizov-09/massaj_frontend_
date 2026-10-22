// Create Parent Form
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useStore } from '@/store';
import { Input, Textarea } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { generateStrongPassword, cn } from '@/utils';
import { Eye, EyeOff, RefreshCw, KeyRound, ShieldCheck, AlertCircle } from 'lucide-react';

const schema = z.object({
  fullName: z.string().min(2, 'Ism kamida 2 ta belgi'),
  phone: z.string().min(9, 'Telefon raqamni kiriting'),
  password: z
    .string()
    .min(12, 'Parol kamida 12 ta belgidan iborat bo\'lishi shart')
    .regex(/[A-Z]/, 'Kamida 1 ta katta harf (A-Z) bo\'lishi shart')
    .regex(/[a-z]/, 'Kamida 1 ta kichik harf (a-z) bo\'lishi shart')
    .regex(/[0-9]/, 'Kamida 1 ta raqam (0-9) bo\'lishi shart'),
  email: z.string().email('Noto\'g\'ri email').optional().or(z.literal('')),
  address: z.string().optional(),
  notes: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;
interface Props { onSuccess: () => void; onCancel: () => void; }

export function CreateParentForm({ onSuccess, onCancel }: Props) {
  const createParent = useStore(s => s.createParent);
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
      address: '',
      notes: '',
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
      await createParent({
        fullName: data.fullName,
        phone: data.phone,
        email: data.email || `${data.phone.replace(/\D/g, '')}@parent.uz`,
        address: data.address,
        notes: data.notes,
        status: 'ACTIVE',
        role: 'PARENT',
        childrenIds: [],
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

      <Input label="To'liq ism" required placeholder="Masalan: Karimova Nilufar" error={errors.fullName?.message} {...register('fullName')} />
      
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
          placeholder="email@example.com"
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

      <Input label="Manzil" placeholder="Toshkent, Yunusobod..." error={errors.address?.message} {...register('address')} />
      <Textarea label="Izoh" placeholder="Qo'shimcha ma'lumot..." rows={2} {...register('notes')} />

      <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 pt-4 border-t border-warm-100">
        <Button variant="secondary" type="button" onClick={onCancel} className="w-full sm:w-auto">Bekor qilish</Button>
        <Button type="submit" loading={isSubmitting} className="w-full sm:w-auto">Saqlash</Button>
      </div>
    </form>
  );
}
