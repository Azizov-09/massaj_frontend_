// ═══════════════════════════════════════════════════════
//  Public Landing Page — Premium Child Rehabilitation Center
// ═══════════════════════════════════════════════════════

import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, Shield, Calendar, Clock, MapPin, Phone,
  ChevronDown, ArrowRight, CheckCircle2, Award, Stethoscope,
  Activity, Star, Menu, X, Baby
} from 'lucide-react';
import { useStore, useAuth } from '@/store';
import { formatCurrencyCompact } from '@/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/primitives';
import { BookingModal } from './components/BookingModal';
import {
  NAV_LINKS,
  TRUST_METRICS,
  PROCESS_STEPS,
  TESTIMONIALS,
  FAQS,
} from './landing.data';

export function LandingPage() {
  const navigate = useNavigate();
  const allServices = useStore(s => s.services);
  const allSpecialists = useStore(s => s.specialists);
  const services = useMemo(() => allServices.filter(s => s.status === 'ACTIVE'), [allServices]);
  const specialists = useMemo(() => allSpecialists.filter(s => s.status === 'ACTIVE'), [allSpecialists]);
  const { currentUser } = useAuth();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string | undefined>();
  const [activeFaq, setActiveFaq] = useState<number | null>(0);

  const createParent = useStore(s => s.createParent);
  const createChild = useStore(s => s.createChild);
  const createAppointment = useStore(s => s.createAppointment);
  const addToast = useStore(s => s.addToast);

  // Quick consultation form state (on-page)
  const [quickForm, setQuickForm] = useState({
    parentName: '',
    phone: '',
    childName: '',
  });

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickForm.parentName || !quickForm.phone) return;

    try {
      const parent = createParent({
        fullName: quickForm.parentName,
        phone: quickForm.phone,
        email: `lead_${Date.now()}@landing.uz`,
        role: 'PARENT',
        status: 'ACTIVE',
        childrenIds: [],
      });

      const child = createChild({
        fullName: quickForm.childName || 'Yangi bola',
        dateOfBirth: new Date(Date.now() - 3 * 365 * 24 * 3600 * 1000).toISOString().split('T')[0],
        gender: 'MALE',
        parentId: parent.id,
        status: 'ACTIVE',
        notes: "Landing orqali tezkor ariza",
      });

      createAppointment({
        childId: child.id,
        parentId: parent.id,
        specialistId: specialists[0]?.id || 'spec-1',
        serviceId: services[0]?.id || 'svc-1',
        date: new Date(Date.now() + 24 * 3600 * 1000).toISOString().split('T')[0],
        startTime: '10:00',
        endTime: '10:45',
        status: 'SCHEDULED',
        notes: "Landing tezkor konsultatsiya arizasi",
      });

      addToast({
        type: 'success',
        title: "Qabulga so'rov yuborildi!",
        description: `${quickForm.parentName}, ma'lumotlaringiz qabul qilindi. Operator tez orada bog'lanadi.`,
      });

      setQuickForm({ parentName: '', phone: '', childName: '' });
    } catch {
      addToast({
        type: 'error',
        title: 'Xatolik yuz berdi',
        description: "Iltimos, qaytadan urinib ko'ring.",
      });
    }
  };

  const navLinks = NAV_LINKS;
  const trustMetrics = TRUST_METRICS;
  const processSteps = PROCESS_STEPS;
  const testimonials = TESTIMONIALS;
  const faqs = FAQS;

  return (
    <div className="min-h-screen bg-[#FFFDF9] text-charcoal-900 font-sans selection:bg-brand-500 selection:text-white">
      {/* ─── Top Bar Banner for logged in users ─── */}
      {currentUser && (
        <div className="bg-brand-500 text-white px-4 py-2 text-xs font-medium flex items-center justify-between">
          <div className="flex items-center gap-2 max-w-7xl mx-auto w-full justify-between">
            <span>Siz tizimga <b>{currentUser.fullName}</b> ({currentUser.role}) sifatida kirgansiz.</span>
            <Link
              to={`/dashboard/${currentUser.role === 'SUPER_ADMIN' ? 'super-admin' : currentUser.role.toLowerCase()}`}
              className="underline font-bold hover:text-warm-100 flex items-center gap-1"
            >
              Boshqaruv paneliga o‘tish <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* ─── Navigation Header ─── */}
      <header className="sticky top-0 z-40 bg-[#FFFDF9]/90 backdrop-blur-md border-b border-warm-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
              <Heart className="w-6 h-6 fill-white/20" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-charcoal-900">MASSAJ<span className="text-brand-500">.CRM</span></span>
              <p className="text-[11px] font-medium text-charcoal-500 uppercase tracking-wider">Bolalar Reabilitatsiya Markazi</p>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map(link => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-charcoal-700 hover:text-brand-500 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Action CTAs */}
          <div className="hidden sm:flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="md">
                Tizimga kirish
              </Button>
            </Link>
            <Button
              size="md"
              leftIcon={<Calendar className="w-4 h-4" />}
              onClick={() => setBookingModalOpen(true)}
            >
              Uchrashuv belgilash
            </Button>
          </div>

          {/* Mobile hamburger */}
          <div className="lg:hidden flex items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Mobil menyuni ochish yoki yopish"
              aria-expanded={mobileMenuOpen}
              className="p-2 text-charcoal-700 hover:bg-warm-100 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden border-b border-warm-200 bg-white px-4 py-6 space-y-4"
            >
              <div className="flex flex-col space-y-3">
                {navLinks.map(link => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-base font-medium text-charcoal-700 hover:text-brand-500"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
              <div className="pt-4 border-t border-warm-100 flex flex-col gap-2">
                <Link to="/login" className="w-full">
                  <Button variant="secondary" className="w-full">Tizimga kirish</Button>
                </Link>
                <Button className="w-full" onClick={() => { setMobileMenuOpen(false); setBookingModalOpen(true); }}>
                  Uchrashuv belgilash
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ─── Hero Section ─── */}
      <section id="hero" className="relative pt-12 pb-20 lg:pt-20 lg:pb-28 overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[400px] h-[400px] bg-gold-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-7 space-y-6"
            >
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-50 border border-brand-200/60 text-brand-600 text-xs font-semibold">
                <Award className="w-3.5 h-3.5" />
                <span>Professional bolalar massaji va jismoniy reabilitatsiya</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-charcoal-900 leading-[1.12]">
                Har bir qadamda <span className="text-brand-500">mehr va professional</span> g‘amxo‘rlik
              </h1>

              <p className="text-lg sm:text-xl text-charcoal-600 max-w-2xl leading-relaxed">
                Farzandingizning sog‘lom o‘sishi, to‘g‘ri qad-qomati va harakat faolligini oshirish uchun
                tajribali reabilitologlar va individual yondashuv.
              </p>

              <div className="pt-2 flex flex-wrap gap-4 items-center">
                <Button
                  size="lg"
                  className="shadow-lg shadow-brand-500/25"
                  leftIcon={<Calendar className="w-5 h-5" />}
                  onClick={() => setBookingModalOpen(true)}
                >
                  Uchrashuvga yozilish
                </Button>
                <Link to="/login">
                  <Button variant="secondary" size="lg" rightIcon={<ArrowRight className="w-4 h-4" />}>
                    Demo tizimni ko‘rish
                  </Button>
                </Link>
              </div>

              {/* Demo accounts quick pills */}
              <div className="pt-4 flex flex-wrap items-center gap-2 text-xs text-charcoal-500">
                <span className="font-semibold text-charcoal-700">Tezkor kirish:</span>
                <button
                  type="button"
                  onClick={() => navigate('/login?role=super-admin')}
                  className="cursor-pointer bg-white px-2.5 py-1 rounded-md border border-warm-200 hover:border-brand-500 hover:text-brand-500 transition-colors shadow-2xs font-medium"
                >
                  Super Admin
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/login?role=specialist')}
                  className="cursor-pointer bg-white px-2.5 py-1 rounded-md border border-warm-200 hover:border-brand-500 hover:text-brand-500 transition-colors shadow-2xs font-medium"
                >
                  Mutaxassis
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/login?role=parent')}
                  className="cursor-pointer bg-white px-2.5 py-1 rounded-md border border-warm-200 hover:border-brand-500 hover:text-brand-500 transition-colors shadow-2xs font-medium"
                >
                  Ota-ona
                </button>
              </div>
            </motion.div>

            {/* Right Card / Visual */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="lg:col-span-5 relative"
            >
              <div className="relative mx-auto max-w-md bg-white rounded-3xl p-6 shadow-xl border border-warm-200/80 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-warm-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center text-brand-500">
                      <Baby className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-charcoal-900 text-sm">Markaz ish tartibi</h4>
                      <p className="text-xs text-charcoal-500">Dush - Shan: 09:00 - 18:00</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-sage-50 text-sage-700 text-xs font-semibold">
                    Qabul ochiq
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="p-3.5 rounded-[14px] bg-warm-50/70 border border-warm-200/80 shadow-2xs flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-[10px] bg-brand-500/10 text-brand-600 flex items-center justify-center">
                        <Stethoscope className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-charcoal-900">Birlamchi ko‘rik</p>
                        <p className="text-[11px] text-charcoal-500">To‘liq jismoniy baholash</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-brand-600">Bepul</span>
                  </div>

                  <div className="p-3.5 rounded-[14px] bg-warm-50/70 border border-warm-200/80 shadow-2xs flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-[10px] bg-sage-50 text-sage-600 flex items-center justify-center">
                        <Activity className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-charcoal-900">Davolovchi massaj</p>
                        <p className="text-[11px] text-charcoal-500">45 daqiqa individual seans</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-charcoal-900">100 000 UZS</span>
                  </div>

                  <div className="p-3.5 rounded-[14px] bg-warm-50/70 border border-warm-200/80 shadow-2xs flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-[10px] bg-gold-50 text-gold-600 flex items-center justify-center">
                        <Shield className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-charcoal-900">Reabilitatsiya mashg‘uloti</p>
                        <p className="text-[11px] text-charcoal-500">60 daqiqa kompleks</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-charcoal-900">150 000 UZS</span>
                  </div>
                </div>

                <div className="pt-2 text-center">
                  <button
                    onClick={() => setBookingModalOpen(true)}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 text-white font-semibold text-sm hover:opacity-95 shadow-md shadow-brand-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    Hoziroq qabulga yozilish <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Trust stats strip */}
          <div className="mt-16 sm:mt-24 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {trustMetrics.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-2xl p-5 sm:p-6 border border-warm-200/70 shadow-xs flex items-center gap-4 hover:border-brand-300 transition-colors"
                >
                  <div className={`w-12 h-12 rounded-2xl bg-warm-50 flex items-center justify-center ${item.color} flex-shrink-0`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-charcoal-900 tracking-tight">{item.value}</h3>
                    <p className="text-xs sm:text-sm font-medium text-charcoal-500">{item.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── About Section ─── */}
      <section id="about" className="py-20 bg-warm-50/50 border-y border-warm-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-100 text-brand-700 text-xs font-semibold">
                Biz haqimizda
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-charcoal-900 tracking-tight">
                Bolangiz sog‘lig‘ini ishonchli qo‘llarga topshiring
              </h2>
              <p className="text-charcoal-600 leading-relaxed">
                Markazimiz bolalarda motorika, harakat faolligi, mushak tonusi (gipertonus va gipotonus) hamda qad-qomat buzilishlarini
                bartaraf etishga ixtisoslashgan. Biz har bir bolani iliq kutib olamiz va uning individual fiziologik xususiyatlariga
                asoslangan kompleks muolajalarni amalga oshiramiz.
              </p>

              <div className="space-y-3 pt-2">
                {[
                  'Tibbiy ma’lumotga va sertifikatlarga ega yuqori toifali mutaxassislar',
                  'Steril, xavfsiz va bolalar uchun psixologik qulay muhit',
                  'Har bir seans davomida ota-onalar bilan ochiq muloqot va maslahat',
                  'Rivojlanish dinamikasini tizimli va doimiy monitoring qilish',
                ].map((point, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-brand-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm font-medium text-charcoal-700">{point}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-6 grid grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-3xl border border-warm-200/80 shadow-xs space-y-2">
                <span className="text-3xl font-extrabold text-brand-500">100%</span>
                <h4 className="font-bold text-charcoal-900 text-sm">Individual yondashuv</h4>
                <p className="text-xs text-charcoal-500">Har bir bola uchun shaxsiy reabilitatsiya kartasi</p>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-warm-200/80 shadow-xs space-y-2 mt-6">
                <span className="text-3xl font-extrabold text-sage-600">5 ball</span>
                <h4 className="font-bold text-charcoal-900 text-sm">Standart baholash</h4>
                <p className="text-xs text-charcoal-500">Harakat, egiluvchanlik va bardoshlilik tahlili</p>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-warm-200/80 shadow-xs space-y-2">
                <span className="text-3xl font-extrabold text-gold-500">0+</span>
                <h4 className="font-bold text-charcoal-900 text-sm">Chaqaloqlardan boshlab</h4>
                <p className="text-xs text-charcoal-500">1 oylikdan maktab yoshigacha bo‘lgan bolalar</p>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-warm-200/80 shadow-xs space-y-2 mt-6">
                <span className="text-3xl font-extrabold text-brand-600">CRM</span>
                <h4 className="font-bold text-charcoal-900 text-sm">Shaxsiy kabinet</h4>
                <p className="text-xs text-charcoal-500">Ota-onalar uchun to‘liq onlayn shaffoflik</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Services Section ─── */}
      <section id="services" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-100 text-brand-700 text-xs font-semibold">
              Xizmatlarimiz
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-charcoal-900 tracking-tight">
              Keng qamrovli reabilitatsiya xizmatlari
            </h2>
            <p className="text-charcoal-600">
              Biz faqat yuqori samarali va bolalar salomatligi uchun tasdiqlangan uslubiyatlarni qo‘llaymiz.
            </p>
          </div>

          <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((svc) => (
              <div
                key={svc.id}
                className="bg-white rounded-3xl p-6 border border-warm-200/80 shadow-xs hover:shadow-md hover:border-brand-300 transition-all flex flex-col justify-between group"
              >
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-500 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                    <Heart className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-charcoal-900">{svc.name}</h3>
                  <p className="text-sm text-charcoal-600 leading-relaxed">{svc.description}</p>
                </div>

                <div className="pt-6 mt-6 border-t border-warm-100 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-charcoal-400 block">{svc.durationMinutes} daqiqa</span>
                    <span className="text-base font-bold text-brand-600">{formatCurrencyCompact(svc.price)}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setSelectedServiceId(svc.id);
                      setBookingModalOpen(true);
                    }}
                  >
                    Yozilish
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Process Section ─── */}
      <section id="process" className="py-20 bg-warm-50/50 border-y border-warm-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-100 text-brand-700 text-xs font-semibold">
              Reabilitatsiya bosqichlari
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-charcoal-900 tracking-tight">
              Jarayon qanday kechadi?
            </h2>
            <p className="text-charcoal-600">
              Boshlang‘ich konsultatsiyadan to‘liq tiklanishgacha bo‘lgan bosqichma-bosqich qadamlar.
            </p>
          </div>

          <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {processSteps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-3xl p-6 border border-warm-200/80 shadow-xs relative overflow-hidden"
                >
                  <span className="text-4xl font-black text-warm-200/70 absolute top-4 right-4">
                    {step.step}
                  </span>
                  <div className="w-11 h-11 rounded-2xl bg-brand-50 text-brand-500 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h4 className="text-base font-bold text-charcoal-900 mb-2">{step.title}</h4>
                  <p className="text-xs text-charcoal-600 leading-relaxed">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Specialists Section ─── */}
      <section id="specialists" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-100 text-brand-700 text-xs font-semibold">
              Jamoamiz
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-charcoal-900 tracking-tight">
              Malakali va mehribon mutaxassislar
            </h2>
            <p className="text-charcoal-600">
              Katta amaliy tajribaga ega shifokorlar va reabilitatsiya mutaxassislari.
            </p>
          </div>

          <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {specialists.slice(0, 6).map((spec) => (
              <div
                key={spec.id}
                className="bg-white rounded-3xl p-6 border border-warm-200/80 shadow-xs flex flex-col items-center text-center group hover:border-brand-300 transition-colors"
              >
                <div className="w-20 h-20 rounded-full bg-brand-100 border-2 border-brand-200 flex items-center justify-center text-2xl font-bold text-brand-700 mb-4 group-hover:scale-105 transition-transform">
                  {spec.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <h4 className="text-base font-bold text-charcoal-900">{spec.fullName}</h4>
                <p className="text-xs font-semibold text-brand-600 mt-1">{spec.specialization}</p>
                <p className="text-xs text-charcoal-500 mt-0.5">{spec.experience} yillik tajriba</p>
                <p className="text-xs text-charcoal-600 mt-3 line-clamp-3 leading-relaxed">
                  {spec.bio || 'Bolalar massaji va harakat terapiyasi bo‘yicha ixtisoslashgan mutaxassis.'}
                </p>
                <div className="mt-5 pt-4 border-t border-warm-100 w-full flex items-center justify-between text-xs text-charcoal-500">
                  <span>Dush - Juma</span>
                  <span className="font-semibold text-charcoal-800">{spec.workingHours.start} - {spec.workingHours.end}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Testimonials Section ─── */}
      <section className="py-20 bg-warm-50/50 border-y border-warm-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-100 text-brand-700 text-xs font-semibold">
              Ota-onalar fikrlari
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-charcoal-900 tracking-tight">
              Oila a’zolarimizning minnatdorchiligi
            </h2>
            <p className="text-charcoal-600">
              Biz bilan birga farzandining ilk qadamlariga erishgan ota-onalar so‘zlari.
            </p>
          </div>

          <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((t, idx) => (
              <div
                key={idx}
                className="bg-white rounded-3xl p-6 border border-warm-200/80 shadow-xs flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-1 text-gold-500">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-gold-400 text-gold-400" />
                    ))}
                  </div>
                  <p className="text-sm text-charcoal-700 italic leading-relaxed">
                    "{t.text}"
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-warm-100">
                  <p className="text-sm font-bold text-charcoal-900">{t.name}</p>
                  <p className="text-xs text-charcoal-500">{t.child}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ Section ─── */}
      <section id="faq" className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-100 text-brand-700 text-xs font-semibold">
              Ko‘p so‘raladigan savollar
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-charcoal-900 tracking-tight">
              Savollaringiz bormi?
            </h2>
            <p className="text-charcoal-600">
              Qabul va muolajalar haqida eng keng tarqalgan savollarga javoblar.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-warm-200/80 overflow-hidden shadow-xs transition-colors"
                >
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                    className="w-full px-6 py-4.5 text-left flex items-center justify-between gap-4 font-semibold text-charcoal-900 hover:text-brand-500 transition-colors"
                  >
                    <span className="text-sm sm:text-base">{faq.q}</span>
                    <ChevronDown className={`w-5 h-5 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180 text-brand-500' : 'text-charcoal-400'}`} />
                  </button>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="px-6 pb-5 text-sm text-charcoal-600 leading-relaxed border-t border-warm-100/60 pt-3"
                      >
                        {faq.a}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Contact & Location Section ─── */}
      <section id="contact" className="py-20 bg-warm-50/50 border-t border-warm-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-100 text-brand-700 text-xs font-semibold">
                Bizning manzil
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-charcoal-900 tracking-tight">
                Markazimizga marhamat
              </h2>
              <p className="text-charcoal-600 leading-relaxed">
                Toshkent shahrining markazida qulay joylashuv, bepul avtoturargoh va barcha qulayliklar bilan jihozlangan muolaja xonalari.
              </p>

              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-500 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-charcoal-900">Manzil</p>
                    <p className="text-sm text-charcoal-600">Toshkent sh., Yunusobod tumani, Amir Temur ko‘chasi, 107-B</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-500 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-charcoal-900">Telefon</p>
                    <p className="text-sm text-charcoal-600">+998 (71) 200-45-45</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-500 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-charcoal-900">Ish vaqti</p>
                    <p className="text-sm text-charcoal-600">Dushanba — Shanba: 09:00 dan 18:00 gacha</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Consultation Card */}
            <div className="lg:col-span-6 bg-white rounded-3xl p-8 border border-warm-200/80 shadow-md space-y-5">
              <h3 className="text-xl font-bold text-charcoal-900">Konsultatsiyaga yoziling</h3>
              <p className="text-xs text-charcoal-500">Mutaxassisimiz 15 daqiqa ichida siz bilan bog‘lanadi va ma’lumot beradi.</p>

              <form onSubmit={handleQuickSubmit} className="space-y-4">
                <Input
                  label="Ota-ona ismi"
                  required
                  placeholder="Ismingizni kiriting"
                  value={quickForm.parentName}
                  onChange={e => setQuickForm({ ...quickForm, parentName: e.target.value })}
                />
                <Input
                  label="Telefon raqam"
                  required
                  type="tel"
                  placeholder="+998 (90) 123-45-67"
                  value={quickForm.phone}
                  onChange={e => setQuickForm({ ...quickForm, phone: e.target.value })}
                />
                <Input
                  label="Bola ismi va yoshi"
                  placeholder="Masalan: Umar, 1.5 yosh"
                  value={quickForm.childName}
                  onChange={e => setQuickForm({ ...quickForm, childName: e.target.value })}
                />
                <Button type="submit" size="lg" className="w-full">
                  Ariza yuborish
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="bg-charcoal-900 text-warm-100 py-12 border-t border-charcoal-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center text-white font-bold">
              <Heart className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-white">MASSAJ.CRM</span>
              <p className="text-xs text-warm-300">Bolalar Massaj va Reabilitatsiya Markazi</p>
            </div>
          </div>

          <p className="text-xs text-warm-400 text-center md:text-left">
            © {new Date().getFullYear()} MASSAJ CRM. Barcha huquqlar himoyalangan.
          </p>

          <div className="flex items-center gap-4 text-xs text-warm-300">
            <Link to="/login" className="hover:text-white transition-colors">Tizimga kirish</Link>
            <span>•</span>
            <a href="#services" className="hover:text-white transition-colors">Xizmatlar</a>
            <span>•</span>
            <a href="#contact" className="hover:text-white transition-colors">Aloqa</a>
          </div>
        </div>
      </footer>

      {/* ─── Booking Modal ─── */}
      <BookingModal
        isOpen={bookingModalOpen}
        onClose={() => {
          setBookingModalOpen(false);
          setSelectedServiceId(undefined);
        }}
        services={services}
        specialists={specialists}
        initialServiceId={selectedServiceId}
      />
    </div>
  );
}
