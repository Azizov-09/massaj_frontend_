// ═══════════════════════════════════════════════════════
//  Login Page — Senior Healthcare/Pediatric CRM Split-Screen Authentication
// ═══════════════════════════════════════════════════════

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye, EyeOff, Heart, ArrowRight, ArrowLeft, ShieldCheck,
  Users, Lock, Stethoscope,
  Phone, HelpCircle, Shield
} from 'lucide-react';
import { cn } from '@/utils';
import { useAuth, useStore } from '@/store';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

const loginSchema = z.object({
  email: z.string().min(3, "Telefon raqami yoki email kiritilishi shart"),
  password: z.string().min(6, 'Parol kamida 6 ta belgidan iborat bo‘lishi kerak'),
  rememberMe: z.boolean().optional(),
});

type LoginForm = z.infer<typeof loginSchema>;


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
  const [showForgotModal, setShowForgotModal] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: true,
    },
  });

  const onSubmit = async (data: LoginForm) => {
    setServerError('');
    const result = await login(data.email, data.password);
    if (result.success) {
      const userRole = useStore.getState().currentUser?.role;
      if (userRole && ROLE_REDIRECTS[userRole]) {
        navigate(ROLE_REDIRECTS[userRole], { replace: true });
        return;
      }
      navigate('/dashboard/super-admin', { replace: true });
    } else {
      setServerError(result.error ?? "Login yoki parol noto'g'ri");
    }
  };

  const handleForgotHelp = () => {
    setShowForgotModal(true);
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-warm-50 text-charcoal-900 selection:bg-brand-500 selection:text-white">
      {/* ═══════════════════════════════════════════════════════
          LEFT SHOWCASE PANEL (Desktop & Tablet Large)
      ═════════════════════════════════════════════════════════ */}
      <div className="hidden lg:flex flex-col w-[480px] xl:w-[560px] 2xl:w-[620px] shrink-0 bg-[#0e141b] text-white relative overflow-hidden border-r border-charcoal-800/80">
        {/* Ambient atmospheric medical lighting */}
        <div className="absolute top-[-10%] left-[-15%] w-[420px] h-[420px] rounded-full bg-brand-500/18 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[5%] right-[-10%] w-[380px] h-[380px] rounded-full bg-emerald-500/12 blur-[100px] pointer-events-none" />
        <div className="absolute top-[45%] right-[-5%] w-[260px] h-[260px] rounded-full bg-amber-500/10 blur-[90px] pointer-events-none" />

        {/* Subtle geometric grid background */}
        <div
          className="absolute inset-0 opacity-[0.035] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle, #ffffff 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        />

        <div className="relative z-10 flex flex-col h-full p-10 xl:p-14 justify-between">
          {/* Top Brand Block */}
          <div>
            <Link
              to="/landing"
              className="inline-flex items-center gap-3.5 group transition-transform active:scale-95"
            >
              <div className="w-11 h-11 rounded-[12px] bg-gradient-to-tr from-brand-600 via-brand-500 to-amber-500 flex items-center justify-center shadow-lg shadow-brand-500/25 group-hover:scale-105 transition-all">
                <Heart className="w-6 h-6 text-white fill-white/20" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-xl tracking-tight text-white">MASSAJ</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-500/20 text-brand-300 border border-brand-400/30">
                    CRM v2.5
                  </span>
                </div>
                <p className="text-white/50 text-[11px] font-medium tracking-wide">
                  Bolalar massaj va reabilitatsiya markazi
                </p>
              </div>
            </Link>
          </div>

          {/* Center Clinical Telemetry & Hero Highlight */}
          <div className="my-auto py-8 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs text-white/90 font-medium mb-4 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Klinik telemetriya va real-vaqt monitoringi
              </div>
              <h2 className="text-3xl xl:text-4xl font-extrabold text-white leading-tight">
                Bolajonlar salomatligi uchun{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-amber-300 to-emerald-400">
                  professional CRM
                </span>
              </h2>
              <p className="text-white/65 text-sm xl:text-base leading-relaxed mt-3 max-w-md">
                Muolajalar jadvali, klinik baholash, mutaxassis tavsiyalari va shaffof moliyaviy hisob-kitoblar bir tizimda.
              </p>
            </motion.div>

            {/* Elevated Interactive Showcase Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="p-5 rounded-2xl bg-white/[0.07] backdrop-blur-xl border border-white/10 shadow-2xl space-y-4"
            >
              {/* Telemetry pill row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-white/[0.05] border border-white/5">
                  <div className="flex items-center gap-2 text-white/50 text-xs mb-1">
                    <Users className="w-3.5 h-3.5 text-brand-400" />
                    <span>Mijoz bolalar</span>
                  </div>
                  <p className="text-lg font-bold text-white">1,200+ nafar</p>
                  <span className="text-[11px] text-emerald-400 font-medium">99.2% tiklanish ko‘rsatkichi</span>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.05] border border-white/5">
                  <div className="flex items-center gap-2 text-white/50 text-xs mb-1">
                    <Stethoscope className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Mutaxassislar</span>
                  </div>
                  <p className="text-lg font-bold text-white">14 nafar shifokor</p>
                  <span className="text-[11px] text-brand-300 font-medium">Nevrolog & Ortoped</span>
                </div>
              </div>

              {/* Patient progress simulation snippet */}
              <div className="p-3 rounded-xl bg-white/[0.05] border border-white/5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-brand-500/30 text-brand-300 flex items-center justify-center font-bold text-[10px]">
                      AA
                    </div>
                    <span className="font-semibold text-white/90">Amir Aliyev (6 yosh)</span>
                  </div>
                  <span className="text-emerald-400 font-bold tabular-nums">85% natija</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-emerald-400 w-[85%]" />
                </div>
                <p className="text-[11px] text-white/50 truncate">
                  Muolaja kursi: Umumiy rivojlantiruvchi bolalar massaji
                </p>
              </div>
            </motion.div>
          </div>

          {/* Bottom Trust & Compliance Strip */}
          <div className="pt-6 border-t border-white/10 flex items-center justify-between text-xs text-white/50">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>256-bit shifrlangan klinik audit</span>
            </div>
            <span className="text-white/30">Tibbiy standart</span>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          RIGHT AUTHENTICATION FORM AREA
      ═════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col justify-between p-4 sm:p-6 md:p-10 lg:p-12 relative overflow-y-auto">
        {/* Top navigation helper row */}
        <div className="flex items-center justify-between w-full max-w-md mx-auto mb-6">
          <Link
            to="/landing"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-charcoal-500 hover:text-brand-600 transition-colors p-1 -ml-1 rounded-[8px]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Asosiy sahifaga qaytish</span>
          </Link>
          <div className="flex items-center gap-1.5 text-xs text-charcoal-400">
            <Phone className="w-3.5 h-3.5 text-brand-500" />
            <span className="hidden sm:inline">Qo‘llab-quvvatlash:</span>
            <a href="tel:+998712000000" className="font-semibold text-charcoal-700 hover:text-brand-600">
              +998 71 200 00 00
            </a>
          </div>
        </div>

        {/* Center Container Card */}
        <div className="w-full max-w-md mx-auto my-auto">
          {/* Mobile Top Brand Header */}
          <div className="flex items-center gap-3 mb-6 lg:hidden">
            <div className="w-10 h-10 rounded-[12px] bg-gradient-to-tr from-brand-600 to-amber-500 flex items-center justify-center shadow-md shadow-brand-500/20">
              <Heart className="w-5 h-5 text-white fill-white/20" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg text-charcoal-900">MASSAJ CRM</span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-brand-50 text-brand-700 border border-brand-200">
                  Bolalar Klinikasi
                </span>
              </div>
              <p className="text-xs text-charcoal-400">Reabilitatsiya va massaj markazi</p>
            </div>
          </div>

          {/* Elevated Card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-white rounded-2xl border border-warm-200/90 shadow-xl shadow-warm-900/[0.04] p-6 sm:p-8"
          >
            {/* Header Titles */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-1.5">
                <h1 className="text-2xl font-black text-charcoal-900 tracking-tight">
                  Tizimga kirish
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                  Xavfsiz ulanish
                </span>
              </div>
              <p className="text-xs sm:text-sm text-charcoal-500 leading-relaxed">
                Klinik boshqaruv, qabullar monitoringi va shaxsiy kabinetga kirish uchun ma’lumotlaringizni kiriting
              </p>
            </div>

            {/* ─── Login Form ─── */}
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
              {/* Phone or Email Input */}
              <div>
                <label htmlFor="email" className="block text-xs font-bold text-charcoal-700 mb-1.5">
                  Telefon raqami yoki Email <span className="text-rose-600" aria-hidden>*</span>
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-charcoal-400 pointer-events-none">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    id="email"
                    type="text"
                    autoComplete="username"
                    placeholder="+998 90 123 45 67 yoki email"
                    {...register('email')}
                    className={cn(
                      'w-full bg-white border rounded-[10px] pl-10 pr-4 py-2.5 text-xs sm:text-sm text-charcoal-900 placeholder:text-charcoal-400 shadow-2xs',
                      'transition-all outline-none',
                      'hover:border-warm-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100',
                      errors.email ? 'border-rose-500' : 'border-warm-300'
                    )}
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? 'email-error' : undefined}
                  />
                </div>
                {errors.email && (
                  <p id="email-error" className="mt-1 text-xs text-rose-600 font-medium">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="password" className="block text-xs font-bold text-charcoal-700">
                    Parol <span className="text-rose-600" aria-hidden>*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleForgotHelp}
                    className="text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline transition-colors"
                  >
                    Parolni unutdingizmi?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-charcoal-400 pointer-events-none">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    {...register('password')}
                    className={cn(
                      'w-full bg-white border rounded-[10px] pl-10 pr-11 py-2.5 text-xs sm:text-sm text-charcoal-900 placeholder:text-charcoal-400 shadow-2xs',
                      'transition-all outline-none',
                      'hover:border-warm-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100',
                      errors.password ? 'border-rose-500' : 'border-warm-300'
                    )}
                    aria-invalid={!!errors.password}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-400 hover:text-charcoal-700 p-1 rounded transition-colors cursor-pointer"
                    aria-label={showPassword ? 'Parolni yashirish' : 'Parolni ko‘rsatish'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-rose-600 font-medium">{errors.password.message}</p>
                )}
              </div>

              {/* Remember me checkbox */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-charcoal-600 select-none">
                  <input
                    type="checkbox"
                    id="rememberMe"
                    {...register('rememberMe')}
                    className="w-4 h-4 rounded-[4px] border-warm-300 text-brand-600 focus:ring-brand-500/20 cursor-pointer"
                  />
                  <span>Meni eslab qol</span>
                </label>
                <span className="text-[11px] text-charcoal-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Xavfsiz sessiya
                </span>
              </div>

              {/* Server-side Error Alert */}
              <AnimatePresence>
                {serverError && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="p-3.5 rounded-[10px] bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 flex items-center gap-2"
                    role="alert"
                  >
                    <span className="w-2 h-2 rounded-full bg-rose-600 shrink-0" />
                    <span>{serverError}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Main Submit Button */}
              <Button
                type="submit"
                loading={isSubmitting}
                className="w-full h-11 text-sm font-bold shadow-sm shadow-brand-500/20 cursor-pointer justify-center"
                rightIcon={!isSubmitting ? <ArrowRight className="w-4 h-4" /> : undefined}
              >
                {isSubmitting ? 'Tizimga ulanmoqda...' : 'Kirish'}
              </Button>
            </form>
          </motion.div>

          {/* Bottom Security Notice */}
          <div className="text-center mt-5 space-y-1">
            <p className="text-[11px] text-charcoal-400">
              © {new Date().getFullYear()} Bolalar Massaj va Reabilitatsiya Markazi. Barcha huquqlar himoyalangan.
            </p>
          </div>
        </div>

        {/* Bottom empty placeholder for spacing */}
        <div className="hidden lg:block h-2" />
      </div>

      {/* ─── Forgot Password Information Modal ─── */}
      <Modal
        isOpen={showForgotModal}
        onClose={() => setShowForgotModal(false)}
        title="Parolni qayta tiklash"
        size="sm"
      >
        <div className="space-y-4 text-xs text-charcoal-600">
          <div className="p-3.5 rounded-xl bg-warm-100/70 border border-warm-200/80 flex items-start gap-3">
            <HelpCircle className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-charcoal-900 text-sm">Xavfsizlik eslatmasi</p>
              <p className="mt-1 leading-relaxed">
                Tibbiy va klinik ma'lumotlar xavfsizligi sababli, foydalanuvchi hisobi paroli faqat markaz administratsiyasi tomonidan tasdiqlanadi.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="font-bold text-charcoal-800">Qayta tiklash tartibi:</p>
            <ol className="list-decimal list-inside space-y-1 text-charcoal-600 leading-relaxed">
              <li>Markaz operatori yoki administratoriga qo‘ng‘iroq qiling.</li>
              <li>Tizimda ro‘yxatdan o‘tgan telefon raqamingizni tasdiqlang.</li>
              <li>SMS orqali kelgan bir martalik kod yordamida yangi parol o‘rnating.</li>
            </ol>
          </div>

          <div className="p-3 rounded-xl bg-white border border-warm-200 flex items-center justify-between">
            <span className="font-medium text-charcoal-500">Administrator telefoni:</span>
            <a href="tel:+998712000000" className="font-bold text-brand-600 hover:underline">
              +998 71 200 00 00
            </a>
          </div>

          <div className="pt-2 flex justify-end">
            <Button variant="secondary" onClick={() => setShowForgotModal(false)} className="w-full sm:w-auto">
              Tushunarli
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
