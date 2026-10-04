// Create Parent Form
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useStore } from '@/store';
import { Input, Textarea } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { generateStrongPassword } from '@/utils';
import { Eye, EyeOff, RefreshCw, KeyRound, ShieldCheck } from 'lucide-react';

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
    try {
      createParent({
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
    } catch (err: unknown) {
      console.error('Parent creation error:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <Input label="To'liq ism" required placeholder="Masalan: Karimova Nilufar" error={errors.fullName?.message} {...register('fullName')} />
      
      <div className="grid grid-cols-2 gap-4">
        <Input label="Telefon" required type="tel" placeholder="+998901234567" error={errors.phone?.message} {...register('phone')} />
        <Input label="Email" type="email" placeholder="email@example.com" error={errors.email?.message} {...register('email')} />
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

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-warm-100">
        <Button variant="secondary" type="button" onClick={onCancel}>Bekor qilish</Button>
        <Button type="submit" loading={isSubmitting}>Saqlash</Button>
      </div>
    </form>
  );
}
