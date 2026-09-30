# 🩺 Bolalar Massaj va Reabilitatsiya Markazi — CRM Frontend

Zamonaviy bolalar reabilitatsiya va massaj markazi boshqaruvi uchun mo‘ljallangan korporativ CRM tizimi frontend qismi.

---

## 🚀 Texnologik Stek

- **Freymvork:** React 19 + TypeScript + Vite 8
- **Marshrutlash:** React Router v7 (Lazy loading & Code splitting)
- **Holat boshqaruvi (State Management):** Zustand 5 (`useShallow` bilan optimallashtirilgan)
- **Stilizatsiya:** Tailwind CSS
- **Animatsiyalar:** Framer Motion
- **Grafiklar & Dashboard:** Recharts
- **Ikonkalar:** Lucide React
- **Sanalar bilan ishlash:** Date-fns
- **Testlash:** Vitest (JSDOM)
- **Linter:** Oxlint

---

## 📁 Loyiha Strukturasi

```text
src/
├── components/          # Umumiy UI va Layout komponentlari
│   ├── layout/          # Sidebar, Header, AppLayout, DashboardLayout
│   └── ui/              # Button, Modal, DataTable, ErrorBoundary, KpiCard
├── data/                # Dastlabki mock ma'lumotlar (seed.ts)
├── features/            # Modulli biznes funksionalliklar (Domain-driven)
│   ├── activity/        # Tizim harakatlari jurnali (Audit logs)
│   ├── admins/          # Administratorlar boshqaruvi
│   ├── analytics/       # Tahliliy hisobotlar va diagrammalar
│   ├── appointments/    # Qabullar ro‘yxati va band qilish
│   ├── assessments/     # Birlamchi va davriy diagnostika
│   ├── attendance/      # Davomat qaydnomalari
│   ├── auth/            # Kirish, Guardlar va Ruxsatlar
│   ├── balance/         # Mijozlar balansi
│   ├── children/        # Reabilitatsiyadagi bolalar kartochkalari
│   ├── dashboard/       # Rollar bo‘yicha dashboardlar (Admin, Specialist, Parent)
│   ├── debtors/         # Qarzdorlik monitoringi
│   ├── employees/       # Xodimlar boshqaruvi
│   ├── goals/           # Reabilitatsiya maqsadlari
│   ├── landing/         # Ommaviy Landing sahifasi
│   ├── notifications/   # Xabarnomalar
│   ├── parents/         # Ota-onalar profillari
│   ├── payments/        # To‘lovlar monitoringi
│   ├── profile/         # Shaxsiy profil sozlamalari
│   ├── progress/        # Bolaning dinamik rivojlanish grafigi
│   ├── reports/         # Moliyaviy va operatsion hisobotlar
│   ├── schedule/        # Mutaxassislar ish jadvali
│   ├── services/        # Markaz xizmatlari katalogi
│   ├── sessions/        # Muolaja seanslari
│   ├── settings/        # Markaz sozlamalari
│   ├── specialists/     # Mutaxassislar ro‘yxati
│   └── transactions/    # Moliyaviy tranzaksiyalar
├── router.tsx           # Asosiy yo‘naltirish (Code-split marshrutlar)
├── services/            # API mijozi va moliya kalkulyatori
├── store/               # Zustand global do‘koni
├── types/               # TypeScript turlari va interfeyslari
└── utils/               # Yordamchi utilitalar (formatlash, sana, ID)
```

---

## 🏃 Loyihani Ishga Tushirish

### 1. Bog‘liqliklarni o‘rnatish:
```bash
npm install
```

### 2. Dasturchi rejimida ishga tushirish (Dev Server):
```bash
npm run dev -- --port 3001
```
Ilova `http://localhost:3001` manzilida ishga tushadi.

### 3. Avtomatlashgan testlarni yurgizish:
```bash
npm run test
```

### 4. Ishlab chiqarish (Production) build yaratish:
```bash
npm run build
```

### 5. Kod sifatini tekshirish (Linter):
```bash
npm run lint
```

---

## 👥 Demo Rollar va Kirish Ma'lumotlari

Tizimda 3 xil foydalanuvchi roli mavjud (Login sahifasidagi 1-klik tezkor tugmalar orqali ham kirish mumkin):

1. **Super Admin:** `admin@demo.com` / `admin123`
   - Barcha modullar, to‘lovlar, xodimlar, moliya, sozlamalar va tizim tahliliga to‘liq ruxsat.
2. **Mutaxassis (Specialist):** `specialist@demo.com` / `specialist123`
   - O‘z bemorlari, mashg‘ulotlar jadvali, davomat, diagnostika va natijalar monitoringi.
3. **Ota-ona (Parent):** `parent@demo.com` / `parent123`
   - Faqat o‘z farzandlarining grafigi, to‘lovlar tarixi, qarzdorlik holati va rivojlanish dinamikasi.

---

## 📝 O‘zgarishlar Tarixi va Arxitektura Auditlari

Loyihada amalga oshirilgan barcha tizimli optimallashtirishlar va xatoliklar tuzatishlari haqida batafsil ma'lumot olish uchun [CHANGELOG.md](./CHANGELOG.md) hujjatiga qarang.
Ko‘p agentli dasturlash jamoasi qoidalari uchun esa [AGENTS.md](./AGENTS.md) ga qarang.
