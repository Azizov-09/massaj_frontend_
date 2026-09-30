# 🛠️ Massaj CRM — Frontend Texnik O‘zgarishlar va Tuzatishlar Jurnali (Changelog)

Ushbu hujjatda **Senior Frontend Engineer** va **AGENTS.md** arxitektura qoidalari asosida loyihada amalga oshirilgan barcha tizimli tuzatishlar, refaktoringlar, xavfsizlik va optimallashtirish ishlari bosqichma-bosqich qayd etib boriladi.

---

## 📌 2026-10-01: Arxitektura, Xavfsizlik va Unumdorlik Tuzatishlari (Audit Fixes)

### 1. [P1] Mutaxassis (SPECIALIST) 403 Xatoligi va Dead Routing
- **Fayllar:** 
  - [`src/router.tsx`](file:///home/Bekzod/Desktop/massaj_frontend_/src/router.tsx)
  - [`src/features/auth/guards.tsx`](file:///home/Bekzod/Desktop/massaj_frontend_/src/features/auth/guards.tsx)
  - [`src/components/layout/Sidebar.tsx`](file:///home/Bekzod/Desktop/massaj_frontend_/src/components/layout/Sidebar.tsx)
  - [`src/components/layout/Header.tsx`](file:///home/Bekzod/Desktop/massaj_frontend_/src/components/layout/Header.tsx)
  - [`src/features/auth/LoginPage.tsx`](file:///home/Bekzod/Desktop/massaj_frontend_/src/features/auth/LoginPage.tsx)
  - [`src/data/seed.ts`](file:///home/Bekzod/Desktop/massaj_frontend_/src/data/seed.ts)
- **Muammo va Sabab:**
  `SPECIALIST` roli bilan tizimga kirganda `ROLE_REDIRECTS.SPECIALIST` mavjud bo‘lmagan `/dashboard/doctor` manziliga yo‘naltirar va routerda bunday marshrut bo‘lmagani sababli foydalanuvchi doimiy `403 Forbidden` ekraniga tushib qolardi. Shuningdek, `Sidebar` va `Header`da ushbu rol uchun navigatsiya menyusi belgilanmagan edi.
- **Yechim:**
  1. `router.tsx` da `specialistRoutes` to‘liq yaratildi (`SpecialistDashboard`, `ChildrenPage`, `SchedulePage`, `AppointmentsPage`, `AttendancePage`, `SessionsPage`, `ProgressPage`, `GoalsPage`, `AssessmentsPage`).
  2. `ROLE_REDIRECTS.SPECIALIST` to‘g‘ri `/dashboard/specialist` manziliga yo‘naltirildi.
  3. `Sidebar.tsx` va `Header.tsx` ga `getSpecialistNav` yordamchi funksiyasi qo‘shildi.
  4. `LoginPage.tsx` va `seed.ts` da `specialist@demo.com` tezkor test hisobi integratsiya qilindi.
- **Tekshiruv:** `src/features/auth/guards.test.ts` orqali 4 ta test yozildi va muvaffaqiyatli o‘tdi.

---

### 2. [P1] Monolit Bundle va Code-Splitting (1.33 MB -> 174 KB)
- **Fayllar:**
  - [`src/router.tsx`](file:///home/Bekzod/Desktop/massaj_frontend_/src/router.tsx)
  - [`vite.config.ts`](file:///home/Bekzod/Desktop/massaj_frontend_/vite.config.ts)
- **Muammo va Sabab:**
  Barcha 24 ta sahifa `router.tsx` ning yuqori qismida statik tarzda import qilingani uchun Vite loyihani bitta ulkan 1.33 MB li monolit chunk qilib yig‘ayotgan edi. Bu birinchi yuklanish tezligini (LCP/FCP) keskin tushirardi.
- **Yechim:**
  1. Barcha sahifalar `React.lazy()` orqali dinamik yuklanishga o‘tkazildi va `<Suspense fallback={<PageFallback />}>` bilan ta’minlandi.
  2. `vite.config.ts` da Rollup `manualChunks` funksiyasi sozlanib, `vendor-react` (React, React Router), `vendor-motion` (Framer Motion) va `vendor-charts` (Recharts) alohida keshlanadigan chunklarga ajratildi.
- **Natija:**
  - Boshlang‘ich kirish chunk (`index-*.js`) **1.33 MB dan 174 KB ga (Gzip: 46 KB)** qisqardi!
  - `LandingPage` alohida chunk sifatida bor-yo‘g‘i **35.8 KB (Gzip: 8.7 KB)** hajmga tushdi.

---

### 3. [P1] Tizimli Error Boundary va Xatoliklardan Himoyalanish
- **Fayllar:**
  - [`src/components/ui/ErrorBoundary.tsx`](file:///home/Bekzod/Desktop/massaj_frontend_/src/components/ui/ErrorBoundary.tsx)
  - [`src/router.tsx`](file:///home/Bekzod/Desktop/massaj_frontend_/src/router.tsx)
- **Muammo va Sabab:**
  Ilovada bitta ham `ErrorBoundary` mavjud emas edi. Har qanday kutilmagan frontend xatosi (masalan, noto‘g‘ri ma'lumot formati) butun ilovani "oq ekran" (white screen of death) qilib yiqitardi.
- **Yechim:**
  Kompaniya brendiga mos, qulay tiklanish tugmasi ("Sahifani yangilash", "Bosh sahifaga qaytish") va xatolik tafsilotlarini chiroyli ko‘rsatuvchi `ErrorBoundary` komponenti yaratilib, router va asosiy sahifalarga o‘rnatildi.

---

### 4. [P1] Qarzdorlar Sahifasidagi Maxfiy Ma'lumotlar Xavfsizligi (Data Leak)
- **Fayllar:**
  - [`src/features/debtors/DebtorsPage.tsx`](file:///home/Bekzod/Desktop/massaj_frontend_/src/features/debtors/DebtorsPage.tsx)
- **Muammo va Sabab:**
  Ota-ona (`PARENT`) o‘z qarzdorligini ko‘rishida filtr ID bo‘yicha emas, balki ism va telefon raqami matnini solishtirish (`d.parentName === currentUser.fullName`) orqali qilingan edi. Ismi o‘xshash boshqa foydalanuvchilarning moliyaviy qarzlari ko‘rinib qolish xavfi mavjud edi.
- **Yechim:**
  Filtr qat'iy mantiqqa o‘tkazildi: `d.parentId === currentUser.id`.

---

### 5. [P2] Moliya Xizmatidagi Soxta Ko‘paytma (`* 0.15`)
- **Fayllar:**
  - [`src/services/finance.service.ts`](file:///home/Bekzod/Desktop/massaj_frontend_/src/services/finance.service.ts)
- **Muammo va Sabab:**
  `getFinancialSummary` funksiyasida to‘langan qarzlar summasi `const paidDebts = totalDebt * 0.15;` ko‘rinishida sun'iy 15% deb qattiq yozib qo‘yilgan edi. Bu buxgalteriya hisobotlarini butunlay buzardi.
- **Yechim:**
  Soxta 15% o‘chirildi va tranzaksiyalar reyestri (`transactions`) bo‘yicha haqiqiy ikki yoqlama buxgalteriya yozuvlari (ledger-based exact calculation) joriy etildi.

---

### 6. [P2] Bolalar Jadvalida Kvadratik $O(N \times M)$ Unumdorlik Muammosi
- **Fayllar:**
  - [`src/features/children/ChildrenPage.tsx`](file:///home/Bekzod/Desktop/massaj_frontend_/src/features/children/ChildrenPage.tsx)
- **Muammo va Sabab:**
  Jadvalning har bir qatori render bo‘lganda, har bir bola uchun `payments.filter()` va `appointments.filter()` qayta-qayta ishga tushib, render paytida 50,000+ ortiqcha array sikllarini hosil qilayotgan edi.
- **Yechim:**
  `useMemo` orqali `balancesMap` va `nextAppointmentsMap` Hash Map lari oldindan bir marta hisoblab olindi va qatorlarda `$O(1)` konstant vaqtda ma'lumot olish ta'minlandi.

---

### 7. [P2] Xavfsiz UUID va Zustand Render Tsikllari
- **Fayllar:**
  - [`src/utils/index.ts`](file:///home/Bekzod/Desktop/massaj_frontend_/src/utils/index.ts)
  - [`src/store/index.ts`](file:///home/Bekzod/Desktop/massaj_frontend_/src/store/index.ts)
  - [`src/features/auth/guards.tsx`](file:///home/Bekzod/Desktop/massaj_frontend_/src/features/auth/guards.tsx)
  - [`src/features/stubs.tsx`](file:///home/Bekzod/Desktop/massaj_frontend_/src/features/stubs.tsx) (o‘chirildi)
- **Muammo va Sabab:**
  - `generateId` da `Math.random().toString(36)` ishlatilgan (kolliziya xavfi yuqori).
  - Zustand selektorlari yangi obyekt qaytarishi sababli har safar qayta render chaqirilar edi.
  - `guards.tsx` da brauzer anti-patterni bo‘lgan `javascript:history.back()` va xom `<a>` teglari bor edi.
  - Ishlatilmaydigan keraksiz o‘lik kod (`stubs.tsx`) mavjud edi.
- **Yechim:**
  1. `crypto.randomUUID()` xavfsiz generatsiyasi joriy qilindi.
  2. `useAuth`, `useToasts`, `useSidebar` selektorlariga `zustand/react/shallow` dan `useShallow` ulandi.
  3. `guards.tsx` dagi navigatsiya `useNavigate` va `<Link>` ga o‘tkazildi.
  4. `src/features/stubs.tsx` o‘chirildi.

---

### 8. [P2] 927 Qatorli LandingPage Refaktoringi
- **Fayllar:**
  - [`src/features/landing/landing.data.ts`](file:///home/Bekzod/Desktop/massaj_frontend_/src/features/landing/landing.data.ts)
  - [`src/features/landing/components/BookingModal.tsx`](file:///home/Bekzod/Desktop/massaj_frontend_/src/features/landing/components/BookingModal.tsx)
  - [`src/features/landing/LandingPage.tsx`](file:///home/Bekzod/Desktop/massaj_frontend_/src/features/landing/LandingPage.tsx)
- **Muammo va Sabab:**
  Landing page 927 qatordan iborat monolit bo‘lib, barcha statik ma'lumotlar, modal formasi va sahifa mantiqi bitta faylga to‘kib tashlangan edi.
- **Yechim:**
  Statik massivlar `landing.data.ts` ga, qabulga yozilish modali esa alohida `BookingModal.tsx` komponentiga ajratildi. Sahifa o‘lchami sezilarli qisqarib, modullilikka erishildi.

---

### 9. [P1] REST API Abstraksiyasi va Kelajakdagi Backend Integratsiyasiga Tayyorgarlik
- **Fayllar:**
  - [`src/services/api.ts`](file:///home/Bekzod/Desktop/massaj_frontend_/src/services/api.ts)
  - [`src/services/api.test.ts`](file:///home/Bekzod/Desktop/massaj_frontend_/src/services/api.test.ts)
- **Tavsif:**
  Backend (NestJS) ulanganda frontend kodini qayta yozib o‘tirmaslik uchun markazlashtirilgan `apiClient` tayyorlandi. U `VITE_API_URL` mavjud bo‘lganda real backendga, aks holda lokal mock tizimiga murojaat qilish mexanizmiga ega.

---

### 10. [P1] DataTable Paginatsiyasidagi Matematik Nuqson va Kalitlar Takrorlanishi
- **Fayllar:**
  - [`src/components/ui/DataTable.tsx`](file:///home/Bekzod/Desktop/massaj_frontend_/src/components/ui/DataTable.tsx)
- **Muammo va Sabab:**
  `DataTable` da `Math.max(1, Math.min(page - 2, totalPages - 4)) + i` formulasi chekka sahifalarda (masalan, 10-sahifada bo‘lganda) bir xil sahifa raqamlarini (masalan, `[1, 2, 3, 8, 8, 9, 10]`) generatsiya qilgan. Bu React konsolida `Warning: Encountered two children with the same key` xatosini keltirib chiqarar va UI da sahifalarni chalkashtirardi.
- **Yechim:**
  Paginatsiya uchun ko‘p tarmoqli ellipsisli (`...`) toza `getPageItems(page, totalPages)` algoritmi joriy etildi. Har bir sahifa va oraliq markeriga unikal `key` tayinlandi.

---

### 11. [P1] Mutaxassislar Bo‘yicha Ma'lumotlar Izolyatsiyasi (Data Bleed)
- **Fayllar:**
  - [`src/features/appointments/AppointmentsPage.tsx`](file:///home/Bekzod/Desktop/massaj_frontend_/src/features/appointments/AppointmentsPage.tsx)
  - [`src/features/sessions/SessionsPage.tsx`](file:///home/Bekzod/Desktop/massaj_frontend_/src/features/sessions/SessionsPage.tsx)
- **Muammo va Sabab:**
  Mutaxassis (`SPECIALIST`) qabullar va seanslar sahifasiga kirganida butun klinikadagi barcha shifokorlarning bemorlari va jadvallarini ko‘ra olar, hatto boshqa shifokorning seansini "Bajarildi" deb belgilab qo‘yish imkoniyatiga ega edi.
- **Yechim:**
  Agar joriy foydalanuvchi `SPECIALIST` bo‘lsa, qabullar va seanslar ro‘yxati `specialistId === currentUser.id` bo‘yicha avtomatik filtrlashga o‘tkazildi. Shuningdek, seansni faqat tayinlangan mutaxassis yoki administrator yakunlay olishi kafolatlandi.

---

### 12. [P1] Kassa/To‘lov Qabul Qilish Ruxsatlari Cheklovi
- **Fayllar:**
  - [`src/features/payments/PaymentsPage.tsx`](file:///home/Bekzod/Desktop/massaj_frontend_/src/features/payments/PaymentsPage.tsx)
- **Muammo va Sabab:**
  "To‘lov qabul qilish" tugmasi har qanday xodim uchun, shu jumladan shifokorlar uchun ham ochiq edi. Bu kassa intizomini buzish xavfini tug‘dirardi.
- **Yechim:**
  To‘lov qabul qilish huquqi `canManagePayments` (`SUPER_ADMIN` va `ADMIN`) orqali himoyalandi.

---

### 13. [P1] Zustand Store Arxitekturasiga Rioya Qilish va Relyatsion Bog‘liqlik
- **Fayllar:**
  - [`src/store/index.ts`](file:///home/Bekzod/Desktop/massaj_frontend_/src/store/index.ts)
  - [`src/features/admins/AdminsPage.tsx`](file:///home/Bekzod/Desktop/massaj_frontend_/src/features/admins/AdminsPage.tsx)
  - [`src/features/employees/EmployeesPage.tsx`](file:///home/Bekzod/Desktop/massaj_frontend_/src/features/employees/EmployeesPage.tsx)
- **Muammo va Sabab:**
  `AdminsPage` va `EmployeesPage` da yangi xodim qo‘shishda to‘g‘ridan-to‘g‘ri `useStore.setState` chaqirilib, store enkapsulyatsiyasi buzilgan va audit loglar yozilmay qolgan edi. Shuningdek, `createChild` yangi bola yaratilganda ota-onaning `childrenIds` massiviga bolani bog‘lamas edi.
- **Yechim:**
  1. Store da standart `createAdmin` va `createEmployee` actionlari yaratildi.
  2. `createChild` mantiqan to‘ldirilib, bola qo‘shilganda uning ota-onasining `childrenIds` ro‘yxatiga ham ID immutabel tarzda qo‘shilishi ta'minlandi.

---

### 14. [P2] Sozlamalar va Profil Ma'lumotlarini Doimiy Saqlash (Persistence)
- **Fayllar:**
  - [`src/store/index.ts`](file:///home/Bekzod/Desktop/massaj_frontend_/src/store/index.ts)
  - [`src/features/profile/ProfilePage.tsx`](file:///home/Bekzod/Desktop/massaj_frontend_/src/features/profile/ProfilePage.tsx)
  - [`src/features/settings/SettingsPage.tsx`](file:///home/Bekzod/Desktop/massaj_frontend_/src/features/settings/SettingsPage.tsx)
- **Muammo va Sabab:**
  Profil va Klinika sozlamalari sahifalarida saqlash bosilganda soxta `setTimeout` ishlardi va sahifa yangilansa barcha o‘zgarishlar yo‘qolardi. Shuningdek, ma'lumotlarni tozalashda brauzerning xom `confirm()` va barcha brauzer ma'lumotlarini o‘chiruvchi `localStorage.clear()` ishlatilgan edi.
- **Yechim:**
  1. `updateCurrentUser`, `clinicSettings` va `updateClinicSettings` doimiy `localStorage` ga saqlanadigan store actionlari qo‘shildi.
  2. `localStorage.clear()` o‘rniga faqat tizim keshini tozalovchi xavfsiz `resetStore()` joriy etildi va zamonaviy `<ConfirmDialog>` bilan almashtirildi.

---

### 15. [P2] $O(1)$ Hash Map va Dashboard Filtrlarini Tuzatish
- **Fayllar:**
  - [`src/features/parents/ParentsPage.tsx`](file:///home/Bekzod/Desktop/massaj_frontend_/src/features/parents/ParentsPage.tsx)
  - [`src/features/dashboard/SuperAdminDashboard.tsx`](file:///home/Bekzod/Desktop/massaj_frontend_/src/features/dashboard/SuperAdminDashboard.tsx)
- **Muammo va Sabab:**
  - `ParentsPage` da har bir qatorda balansni hisoblashda kvadratik tsikllar mavjud edi.
  - `SuperAdminDashboard` da daromad grafigi tanlangan davrga (`range`) qaramasdan qattiq `'last7days'` bo‘yicha hisoblanardi va 12 ta ishlatilmaydigan o‘zgaruvchilar mavjud edi.
- **Yechim:**
  1. `ParentsPage` da `parentBalancesMap` orqali $O(1)$ balans hisobi joriy etildi.
  2. Dashboarddagi davr filtri to‘liq dinamik qilindi va ortiqcha importlar tozalandi.

---

### 16. [P2] CSV Eksport Standartlari va UTF-8 BOM
- **Fayllar:**
  - [`src/features/reports/ReportsPage.tsx`](file:///home/Bekzod/Desktop/massaj_frontend_/src/features/reports/ReportsPage.tsx)
  - [`src/features/transactions/TransactionsPage.tsx`](file:///home/Bekzod/Desktop/massaj_frontend_/src/features/transactions/TransactionsPage.tsx)
- **Muammo va Sabab:**
  CSV yuklab olishda o‘zbek tilidagi harflar (`o‘`, `g‘`, `sh`, `ch`) Microsoft Excel dasturida koding buzilishi (mojibake) bilan ochilar edi. Shuningdek, vergul va qo‘shtirnoqlar to‘g‘ri escape qilinmagan edi.
- **Yechim:**
  `\uFEFF` (UTF-8 Byte Order Mark) qo‘shildi, barcha matnlar qo‘shtirnoq bilan o‘ralib ichki qo‘shtirnoqlar dublyaj qilindi va xavfsiz `Blob` URL mexanizmi joriy etildi.

---

### 17. [P2] Qabullarda Takroriy Vaqtga Yozilish (Double-Booking) Himoyasi
- **Fayllar:**
  - [`src/features/appointments/components/CreateAppointmentForm.tsx`](file:///home/Bekzod/Desktop/massaj_frontend_/src/features/appointments/components/CreateAppointmentForm.tsx)
- **Muammo va Sabab:**
  Bir mutaxassisga ayni bir vaqt oralig‘iga bir nechta bemorni yozib qo‘yish mumkin edi (slot to‘qnashuvi tekshiruvi yo‘q edi).
- **Yechim:**
  Shaklni tasdiqlashda mutaxassisning tanlangan sana va vaqtdagi bandligi tekshirilib, to‘qnashuv bo‘lsa ogohlantirish beruvchi mantiq qo‘shildi.

---

### 18. [P2] Modal Komponentida WCAG 2.1 Focus Trap
- **Fayllar:**
  - [`src/components/ui/Modal.tsx`](file:///home/Bekzod/Desktop/massaj_frontend_/src/components/ui/Modal.tsx)
- **Muammo va Sabab:**
  Klaviatura yordamida harakatlanuvchi foydalanuvchilar ochiq modalda `Tab` bosganda fokus fondagi ko‘rinmas elementlarga chiqib ketardi.
- **Yechim:**
  Modal ochiqligida `Tab` va `Shift+Tab` bosilganda fokus faqat modal ichidagi interaktiv elementlar bo‘ylab aylanadigan to‘liq WCAG 2.1 Focus Trap joriy etildi.

---

### 19. [P1] Davomat va Taqvim Jadvallarida Mutaxassis Ma'lumotlari Izolyatsiyasi
- **Fayllar:**
  - [`src/features/attendance/AttendancePage.tsx`](file:///home/Bekzod/Desktop/massaj_frontend_/src/features/attendance/AttendancePage.tsx)
  - [`src/features/schedule/SchedulePage.tsx`](file:///home/Bekzod/Desktop/massaj_frontend_/src/features/schedule/SchedulePage.tsx)
- **Muammo va Sabab:**
  `AttendancePage` va `SchedulePage` da mutaxassis (`SPECIALIST`) hisobi bilan kirilganda boshqa shifokorlarning qabullari ko‘rinib qolishi yoki ular nomidan davomat belgilanishi ehtimoli bor edi.
- **Yechim:**
  Ikkala sahifada ham ma'lumotlarni saralashda `targetSpecialistId = currentUser?.role === 'SPECIALIST' ? currentUser.id : specialistFilter` qat'iy tekshiruvi kiritildi. Shuningdek, `AttendancePage` da `handleMark` orqali shifokor faqat o‘z qabuliga davomat yoza olishi kafolatlandi.

---

## 📊 Hozirgi Metrikalar va Holat
- **Avtomatlashgan Testlar:** 4 test to‘plami, **19/19 test muvaffaqiyatli (100% PASS)**.
- **TypeScript:** 0 ta xatolik (`tsc --noEmit` to‘liq toza).
- **Vite Production Build:** 1.91 soniyada 0 xatolik bilan muvaffaqiyatli yakunlanadi.
- **Linter (oxlint):** 0 ta xatolik.
- **Dev Server:** `http://localhost:3001` da barqaror ishlamoqda.
- **Xavfsizlik & Ruxsatlar:** Barcha 5 ta asosiy rol (`SUPER_ADMIN`, `ADMIN`, `SPECIALIST`, `OPERATOR`, `PARENT`) bo‘yicha to‘liq izolyatsiya va tekshiruvlar amalga oshirilgan.
