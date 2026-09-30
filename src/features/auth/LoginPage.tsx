// ═══════════════════════════════════════════════════════
//  Login Page — Premium split-screen authentication
// ═══════════════════════════════════════════════════════
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Heart, ArrowRight, Shield, Activity, Users } from 'lucide-react';
import { cn } from '@/utils';
import { useAuth } from '@/store';
import { Button } from '@/components/ui/Button';

const loginSchema = z.object({
  email: z.string().email("Noto'g'ri email manzil"),
  password: z.string().min(6, 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak'),
  rememberMe: z.boolean().optional(),
});

type LoginForm = z.infer<typeof loginSchema>;

const DEMO_ACCOUNTS = [
  { email: 'superadmin@demo.com', password: 'demo123', role: 'Bosh Admin (Super Admin)', color: 'brand' },
  { email: 'specialist@demo.com', password: 'demo123', role: 'Mutaxassis (Specialist)', color: 'gold' },
  { email: 'parent@demo.com', password: 'demo123', role: 'Ota-ona (Parent)', color: 'sage' },
];

const ROLE_REDIRECTS: Record<string, string> = {
  SUPER_ADMIN: '/dashboard/super-admin',
  ADMIN: '/dashboard/super-admin',
  SPECIALIST: '/dashboard/specialist',
  PARENT: '/dashboard/parent',
};

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setServerError('');
    const result = await login(data.email, data.password);
    if (result.success) {
      // Determine role from current user - we'll get it from the store
      const role = localStorage.getItem('massaj-crm-store');
      if (role) {
        try {
          const parsed = JSON.parse(role);
          const userRole = parsed?.state?.currentUser?.role;
          if (userRole && ROLE_REDIRECTS[userRole]) {
            navigate(ROLE_REDIRECTS[userRole], { replace: true });
            return;
          }
        } catch {}
      }
      navigate('/dashboard/super-admin', { replace: true });
    } else {
      setServerError(result.error ?? "Xatolik yuz berdi");
    }
  };

  const fillDemo = (email: string, password: string) => {
    setValue('email', email);
    setValue('password', password);
  };

  const accentColors: Record<string, string> = {
    brand: 'bg-brand-50 text-brand-700 border-brand-200 hover:bg-brand-100',
    sage: 'bg-sage-50 text-sage-700 border-sage-200 hover:bg-sage-100',
    gold: 'bg-gold-50 text-gold-700 border-gold-200 hover:bg-gold-100',
    warm: 'bg-warm-100 text-warm-700 border-warm-300 hover:bg-warm-200',
  };

  return (
    <div className="min-h-screen flex bg-warm-100">
      {/* Left panel — Brand */}
      <div className="hidden lg:flex flex-col w-[480px] flex-shrink-0 bg-charcoal-900 relative overflow-hidden">
        {/* Background patterns */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-10 w-64 h-64 rounded-full border-2 border-white" />
          <div className="absolute bottom-32 right-5 w-40 h-40 rounded-full border border-white" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full border border-white opacity-20" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-brand-600/20 to-transparent" />

        <div className="relative z-10 flex flex-col h-full px-12 py-12">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-[12px] bg-brand-500 flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-lg leading-none">MASSAJ</p>
              <p className="text-white/40 text-[10px] tracking-widest uppercase font-medium">Bolalar reabilitatsiya markazi</p>
            </div>
          </motion.div>

          {/* Main message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mt-auto mb-12"
          >
            <h2 className="text-3xl font-bold text-white leading-tight mb-4">
              Bolalar salomatligi uchun<br />
              <span className="text-brand-400">professional yondashuv</span>
            </h2>
            <p className="text-white/60 text-base leading-relaxed max-w-sm">
              Massaj va reabilitatsiya xizmatlarini professional boshqarish uchun maxsus yaratilgan tizim
            </p>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="grid grid-cols-3 gap-4"
          >
            {[
              { icon: <Shield className="w-4 h-4" />, label: 'Xavfsiz tizim' },
              { icon: <Activity className="w-4 h-4" />, label: 'Real vaqt' },
              { icon: <Users className="w-4 h-4" />, label: 'Ko\'p foydalanuvchi' },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center gap-2 p-3 rounded-[12px] bg-white/5 text-center">
                <span className="text-brand-400">{item.icon}</span>
                <span className="text-white/60 text-xs font-medium">{item.label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Right panel — Login form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-[10px] bg-brand-500 flex items-center justify-center">
              <Heart className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-bold text-charcoal-900">MASSAJ CRM</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-charcoal-900">Xush kelibsiz</h1>
            <p className="text-sm text-charcoal-400 mt-1">Tizimga kirish uchun ma'lumotlaringizni kiriting</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-charcoal-700 mb-1.5">
                Email manzil <span className="text-danger-main" aria-hidden>*</span>
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="email@massaj.uz"
                {...register('email')}
                className={cn(
                  'w-full bg-white border rounded-[10px] px-4 py-2.5 text-sm text-charcoal-900 placeholder:text-charcoal-400',
                  'transition-colors outline-none',
                  'hover:border-warm-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100',
                  errors.email ? 'border-danger-main' : 'border-warm-300'
                )}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'email-error' : undefined}
              />
              {errors.email && <p id="email-error" className="mt-1 text-xs text-danger-main">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-charcoal-700 mb-1.5">
                Parol <span className="text-danger-main" aria-hidden>*</span>
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  {...register('password')}
                  className={cn(
                    'w-full bg-white border rounded-[10px] px-4 py-2.5 pr-11 text-sm text-charcoal-900 placeholder:text-charcoal-400',
                    'transition-colors outline-none',
                    'hover:border-warm-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100',
                    errors.password ? 'border-danger-main' : 'border-warm-300'
                  )}
                  aria-invalid={!!errors.password}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-400 hover:text-charcoal-700 transition-colors"
                  aria-label={showPassword ? 'Parolni yashirish' : 'Parolni ko\'rsatish'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-danger-main">{errors.password.message}</p>}
            </div>

            {/* Remember me */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="rememberMe"
                {...register('rememberMe')}
                className="w-4 h-4 rounded border-warm-300 text-brand-500 focus:ring-brand-100"
              />
              <label htmlFor="rememberMe" className="text-sm text-charcoal-600">Meni eslab qol</label>
            </div>

            {/* Server error */}
            {serverError && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-[10px] bg-red-50 border border-red-200 text-sm text-danger-main"
                role="alert"
              >
                {serverError}
              </motion.div>
            )}

            <Button
              type="submit"
              loading={isSubmitting}
              className="w-full h-11 text-base"
              rightIcon={!isSubmitting ? <ArrowRight className="w-4 h-4" /> : undefined}
            >
              {isSubmitting ? 'Kirish...' : 'Kirish'}
            </Button>
          </form>

          {/* Demo accounts */}
          <div className="mt-8">
            <p className="text-xs text-charcoal-400 font-medium text-center mb-3 uppercase tracking-wide">Demo hisoblar</p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map(acc => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => fillDemo(acc.email, acc.password)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2.5 rounded-[10px] border text-left transition-colors text-xs',
                    accentColors[acc.color]
                  )}
                >
                  <div className={cn('w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0', `bg-current opacity-20`)} />
                  <div>
                    <p className="font-semibold leading-none">{acc.role}</p>
                    <p className="text-[10px] opacity-70 mt-0.5">demo123</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
