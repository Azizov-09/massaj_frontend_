import {
  Baby, Stethoscope, Heart, Award, Activity, Shield
} from 'lucide-react';

export const NAV_LINKS = [
  { label: 'Bosh sahifa', href: '#hero' },
  { label: 'Markaz haqida', href: '#about' },
  { label: 'Xizmatlar', href: '#services' },
  { label: 'Jarayon', href: '#process' },
  { label: 'Mutaxassislar', href: '#specialists' },
  { label: 'FAQ', href: '#faq' },
  { label: 'Aloqa', href: '#contact' },
];

export const TRUST_METRICS = [
  { value: '500+', label: 'Sog‘lomlashgan bolalar', icon: Baby, color: 'text-brand-500' },
  { value: '15+', label: 'Malakali mutaxassislar', icon: Stethoscope, color: 'text-sage-600' },
  { value: '98%', label: 'Mamnun ota-onalar', icon: Heart, color: 'text-gold-500' },
  { value: '5+ yil', label: 'Amaliy tajriba', icon: Award, color: 'text-brand-600' },
];

export const PROCESS_STEPS = [
  {
    step: '01',
    title: 'Birlamchi ko‘rik va konsultatsiya',
    desc: 'Mutaxassis bolaning jismoniy holati, mushak tonusi va harakat faolligini batafsil baholaydi.',
    icon: Stethoscope,
  },
  {
    step: '02',
    title: 'Individual reabilitatsiya rejasi',
    desc: 'Har bir bolaning yoshi va xususiyatlariga mos individual mashg‘ulotlar va massaj dasturi tuziladi.',
    icon: Activity,
  },
  {
    step: '03',
    title: 'Professional davolash seanslari',
    desc: 'Sertifikatlangan mutaxassislar nazorati ostida qulay va xavfsiz muhitda muolajalar o‘tkaziladi.',
    icon: Heart,
  },
  {
    step: '04',
    title: 'Dinamik kuzatuv va monitoring',
    desc: 'Har seansdan so‘ng ota-onalarga taraqqiyot hisoboti beriladi va kerakli tavsiyalar ko‘rsatiladi.',
    icon: Shield,
  },
];

export const TESTIMONIALS = [
  {
    name: 'Gulnoza Karimova',
    child: 'Jasurbek (1.5 yosh)',
    text: 'Bolamda gipertonus tashxisi qo‘yilgan edi. 10 kunlik massaj kursidan so‘ng o‘tirishi va oyoqlaridagi taranglik sezilarli darajada yumshadi. Mutaxassislarga katta rahmat!',
    rating: 5,
  },
  {
    name: 'Bobur Mirzayev',
    child: 'Farangiz (3 yosh)',
    text: 'Markazning xizmat sifati va tozaligi ajoyib. Har bir seansdan so‘ng mutaxassis shaxsan tushuntirish beradi. Qizim muolajalarga quvonch bilan boradi.',
    rating: 5,
  },
  {
    name: 'Shahlo Umarova',
    child: 'Imronbek (8 oylik)',
    text: 'Emaklashda qiyinchilik bo‘layotgan edi. 2 haftalik kompleks reabilitatsiyadan keyin o‘zi dadil emaklay boshladi. Natija biz kutgandan ham a’lo bo‘ldi.',
    rating: 5,
  },
];

export const FAQS = [
  {
    q: 'Bolalar massaji qaysi yoshdan boshlab tavsiya etiladi?',
    a: 'Profilaktik va davolovchi massajlar bolaning 1 oyligidan boshlab shifokor ko‘rigi va tavsiyasiga ko‘ra o‘tkazilishi mumkin.',
  },
  {
    q: 'Bitta massaj kursi necha seansdan iborat?',
    a: 'Odatda standart reabilitatsiya kursi 10 yoki 12 seansdan iborat bo‘ladi. Har bir seans davomiyligi 30 dan 60 daqiqagacha davom etadi.',
  },
  {
    q: 'Seans paytida ota-ona bolaning yonida bo‘lishi mumkinmi?',
    a: 'Albatta! Bolaning o‘zini erkin va xavfsiz his qilishi uchun ota-onalarning barcha seanslarda birga bo‘lishi rag‘batlantiriladi.',
  },
  {
    q: 'Qanday holatlarda massaj muolajalari mumkin emas?',
    a: 'Tana harorati yuqori bo‘lganda, o‘tkir shamollash, yuqumli teri toshmalari va qon ketish xavfi mavjud bo‘lganda massaj vaqtincha to‘xtatiladi.',
  },
  {
    q: 'Konsultatsiyaga qanday yozilish mumkin?',
    a: 'Saytimizdagi online forma orqali ariza qoldirishingiz yoki bevosita telefon raqamlarimiz orqali administrator bilan bog‘lanishingiz mumkin.',
  },
];
