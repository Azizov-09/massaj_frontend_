// ═══════════════════════════════════════════════════════
//  MASSAJ CRM — Seed Mock Data
//  Realistic Uzbek names, UZS amounts, relational IDs
// ═══════════════════════════════════════════════════════

import {
  AdminUser,
  Specialist,
  Parent,
  Child,
  Service,
  Appointment,
  Session,
  AttendanceRecord,
  Assessment,
  ProgressNote,
  Goal,
  Transaction,
  Payment,
  Notification,
  ActivityLog,
  Employee,
} from '@/types';

// ─── Demo Users (Auth) ────────────────────────────────────

export const DEMO_CREDENTIALS = [
  { email: 'superadmin@demo.com', password: 'demo123', role: 'SUPER_ADMIN' as const },
  { email: 'specialist@demo.com', password: 'demo123', role: 'SPECIALIST' as const },
  { email: 'parent@demo.com', password: 'demo123', role: 'PARENT' as const },
];

// ─── Admins ──────────────────────────────────────────────

export const ADMINS: AdminUser[] = [
  {
    id: 'admin-1',
    email: 'superadmin@demo.com',
    fullName: 'Alisher Nazarov',
    phone: '+998901234567',
    role: 'SUPER_ADMIN',
    status: 'ACTIVE',
    lastLogin: '2026-09-26T08:15:00+05:00',
    createdAt: '2024-01-01T00:00:00+05:00',
  },
  {
    id: 'admin-2',
    email: 'admin@demo.com',
    fullName: 'Nilufar Rashidova',
    phone: '+998901234568',
    role: 'ADMIN',
    status: 'ACTIVE',
    lastLogin: '2026-09-26T09:00:00+05:00',
    createdAt: '2024-02-15T00:00:00+05:00',
  },
  {
    id: 'admin-3',
    email: 'admin2@massaj.uz',
    fullName: 'Sardor Mirzayev',
    phone: '+998901234569',
    role: 'ADMIN',
    status: 'ACTIVE',
    lastLogin: '2026-09-25T17:30:00+05:00',
    createdAt: '2024-03-10T00:00:00+05:00',
  },
  {
    id: 'admin-4',
    email: 'admin3@massaj.uz',
    fullName: 'Dildora Yusupova',
    phone: '+998901234570',
    role: 'ADMIN',
    status: 'ACTIVE',
    lastLogin: '2026-09-24T11:45:00+05:00',
    createdAt: '2024-05-20T00:00:00+05:00',
  },
  {
    id: 'admin-5',
    email: 'admin4@massaj.uz',
    fullName: 'Jasur Toshmatov',
    phone: '+998901234571',
    role: 'ADMIN',
    status: 'INACTIVE',
    lastLogin: '2026-08-10T10:00:00+05:00',
    createdAt: '2024-07-01T00:00:00+05:00',
  },
];

// ─── Employees ────────────────────────────────────────────

export const EMPLOYEES: Employee[] = [
  { id: 'emp-1', fullName: 'Mohira Ergasheva', position: 'Qabulxona administratori', phone: '+998901111001', status: 'ACTIVE', joinedAt: '2024-02-01T00:00:00+05:00' },
  { id: 'emp-2', fullName: "Bobur Xo'jayev", position: 'Registrator', phone: '+998901111002', status: 'ACTIVE', joinedAt: '2024-03-15T00:00:00+05:00' },
  { id: 'emp-3', fullName: 'Zulfiya Qosimova', position: 'Kassir', phone: '+998901111003', status: 'ACTIVE', joinedAt: '2024-04-10T00:00:00+05:00' },
  { id: 'emp-4', fullName: 'Ulugbek Salimov', position: 'Xizmat ko\'rsatuvchi', phone: '+998901111004', status: 'ACTIVE', joinedAt: '2024-05-01T00:00:00+05:00' },
  { id: 'emp-5', fullName: 'Maftuna Normatova', position: 'Tozalovchi', phone: '+998901111005', status: 'ACTIVE', joinedAt: '2024-06-01T00:00:00+05:00' },
  { id: 'emp-6', fullName: 'Sherzod Razzaqov', position: 'Qo\'riqchi', phone: '+998901111006', status: 'ACTIVE', joinedAt: '2024-06-15T00:00:00+05:00' },
  { id: 'emp-7', fullName: 'Lobar Abdullayeva', position: 'Registrator', phone: '+998901111007', status: 'INACTIVE', joinedAt: '2024-07-01T00:00:00+05:00' },
  { id: 'emp-8', fullName: 'Humoyun Qodirov', position: 'Xizmat ko\'rsatuvchi', phone: '+998901111008', status: 'ACTIVE', joinedAt: '2024-08-01T00:00:00+05:00' },
];

// ─── Specialists ──────────────────────────────────────────

export const SPECIALISTS: Specialist[] = [
  {
    id: 'spec-1',
    email: 'specialist@demo.com',
    fullName: 'Kamola Azimova',
    phone: '+998901234580',
    role: 'SPECIALIST',
    status: 'ACTIVE',
    specialization: 'Bolalar massaji',
    experience: 8,
    workingDays: [1, 2, 3, 4, 5],
    workingHours: { start: '09:00', end: '18:00' },
    bio: 'Bolalar massaji bo\'yicha 8 yillik tajribaga ega mutaxassis. Asosiy yo\'nalish: muskul tonusini tiklash, harakatlanish koordinatsiyasini yaxshilash.',
    rating: 4.9,
    createdAt: '2024-01-15T00:00:00+05:00',
  },
  {
    id: 'spec-2',
    email: 'aziz@massaj.uz',
    fullName: 'Aziz Karimov',
    phone: '+998901234581',
    role: 'SPECIALIST',
    status: 'ACTIVE',
    specialization: 'Reabilitatsiya terapevti',
    experience: 12,
    workingDays: [1, 2, 3, 4, 5, 6],
    workingHours: { start: '08:00', end: '17:00' },
    bio: 'Neurologik reabilitatsiya va harakat buzilishlarini davolashda katta tajribaga ega.',
    rating: 4.8,
    createdAt: '2024-01-10T00:00:00+05:00',
  },
  {
    id: 'spec-3',
    email: 'zebo@massaj.uz',
    fullName: 'Zebo Tursunova',
    phone: '+998901234582',
    role: 'SPECIALIST',
    status: 'ACTIVE',
    specialization: 'Fizioterapevt',
    experience: 5,
    workingDays: [1, 3, 4, 5],
    workingHours: { start: '10:00', end: '19:00' },
    bio: 'Bolalar uchun maxsus fizioterapiya dasturlari va sport reabilitatsiyasida ixtisoslashgan.',
    rating: 4.7,
    createdAt: '2024-02-20T00:00:00+05:00',
  },
  {
    id: 'spec-4',
    email: 'murod@massaj.uz',
    fullName: 'Murod Xasanov',
    phone: '+998901234583',
    role: 'SPECIALIST',
    status: 'ACTIVE',
    specialization: 'Ortopedik massaj mutaxassisi',
    experience: 9,
    workingDays: [1, 2, 3, 4, 5],
    workingHours: { start: '09:00', end: '18:00' },
    bio: 'Bolalar umurtqa pog\'onasi va bo\'g\'im muammolarida ixtisoslashgan.',
    rating: 4.6,
    createdAt: '2024-03-05T00:00:00+05:00',
  },
  {
    id: 'spec-5',
    email: 'gulnora@massaj.uz',
    fullName: 'Gulnora Yodgorova',
    phone: '+998901234584',
    role: 'SPECIALIST',
    status: 'ACTIVE',
    specialization: 'Bolalar massaji',
    experience: 6,
    workingDays: [1, 2, 4, 5, 6],
    workingHours: { start: '09:00', end: '17:00' },
    bio: 'Chaqaloqlar va kichik yoshdagi bolalar uchun maxsus massaj texnikalarida mutaxassis.',
    rating: 4.8,
    createdAt: '2024-04-01T00:00:00+05:00',
  },
  {
    id: 'spec-6',
    email: 'behruz@massaj.uz',
    fullName: 'Behruz Mamadaliyev',
    phone: '+998901234585',
    role: 'SPECIALIST',
    status: 'ACTIVE',
    specialization: 'Reabilitatsiya terapevti',
    experience: 7,
    workingDays: [1, 2, 3, 5],
    workingHours: { start: '10:00', end: '19:00' },
    bio: 'Harakat va muvozanat buzilishlari bilan ishlovchi reabilitatsiya mutaxassisi.',
    rating: 4.5,
    createdAt: '2024-05-10T00:00:00+05:00',
  },
  {
    id: 'spec-7',
    email: 'sarvinoz@massaj.uz',
    fullName: 'Sarvinoz Holmatova',
    phone: '+998901234586',
    role: 'SPECIALIST',
    status: 'ACTIVE',
    specialization: 'Logoped-massaj mutaxassisi',
    experience: 4,
    workingDays: [2, 3, 4, 5, 6],
    workingHours: { start: '09:00', end: '17:00' },
    bio: 'Nutq va yuz muskullari massajida maxsus ta\'lim olgan.',
    rating: 4.7,
    createdAt: '2024-06-01T00:00:00+05:00',
  },
  {
    id: 'spec-8',
    email: 'shamsiddin@massaj.uz',
    fullName: 'Shamsiddin Nazarov',
    phone: '+998901234587',
    role: 'SPECIALIST',
    status: 'ACTIVE',
    specialization: 'Sport reabilitatsiyasi',
    experience: 10,
    workingDays: [1, 2, 3, 4, 5],
    workingHours: { start: '08:00', end: '17:00' },
    bio: "Yoshlar sport jarohatlarini davolash va oldini olish bo'yicha mutaxassis.",
    rating: 4.6,
    createdAt: '2024-07-15T00:00:00+05:00',
  },
  {
    id: 'spec-9',
    email: 'manzura@massaj.uz',
    fullName: 'Manzura Sultonova',
    phone: '+998901234588',
    role: 'SPECIALIST',
    status: 'ACTIVE',
    specialization: 'Fizioterapevt',
    experience: 3,
    workingDays: [1, 3, 5],
    workingHours: { start: '11:00', end: '18:00' },
    bio: 'Pediatrik fizioterapiya va ergoterapi yo\'nalishida ishlaydi.',
    rating: 4.4,
    createdAt: '2024-08-01T00:00:00+05:00',
  },
  {
    id: 'spec-10',
    email: 'davron@massaj.uz',
    fullName: 'Davron Xoliqov',
    phone: '+998901234589',
    role: 'SPECIALIST',
    status: 'ACTIVE',
    specialization: 'Ortopedik massaj mutaxassisi',
    experience: 11,
    workingDays: [1, 2, 3, 4, 5, 6],
    workingHours: { start: '09:00', end: '18:00' },
    bio: 'Bolalar tana holatini yaxshilash va skoliozni davolashda katta tajriba.',
    rating: 4.9,
    createdAt: '2024-09-10T00:00:00+05:00',
  },
  {
    id: 'spec-11',
    email: 'nargiza@massaj.uz',
    fullName: 'Nargiza Umarova',
    phone: '+998901234590',
    role: 'SPECIALIST',
    status: 'ACTIVE',
    specialization: 'Bolalar massaji',
    experience: 6,
    workingDays: [2, 4, 5, 6],
    workingHours: { start: '10:00', end: '18:00' },
    bio: 'Immunitetni kuchaytiruvchi massaj texnikalarida ixtisoslashgan.',
    rating: 4.7,
    createdAt: '2024-10-01T00:00:00+05:00',
  },
  {
    id: 'spec-12',
    email: 'hamid@massaj.uz',
    fullName: 'Hamidjon Tojiboyev',
    phone: '+998901234591',
    role: 'SPECIALIST',
    status: 'ACTIVE',
    specialization: 'Reabilitatsiya terapevti',
    experience: 8,
    workingDays: [1, 2, 3, 4, 5],
    workingHours: { start: '09:00', end: '18:00' },
    bio: 'Autizm spektri buzilishi va maxsus ehtiyojli bolalar bilan ishlash tajribasi bor.',
    rating: 4.8,
    createdAt: '2025-01-15T00:00:00+05:00',
  },
  {
    id: 'spec-13',
    email: 'dilnoza@massaj.uz',
    fullName: 'Dilnoza Hasanova',
    phone: '+998901234592',
    role: 'SPECIALIST',
    status: 'ACTIVE',
    specialization: 'Fizioterapevt',
    experience: 5,
    workingDays: [1, 3, 4, 5],
    workingHours: { start: '09:00', end: '17:00' },
    bio: 'Gidroterapiya va issiqlik terapiyasi usullarida ixtisoslashgan fizioterapevt.',
    rating: 4.5,
    createdAt: '2025-02-01T00:00:00+05:00',
  },
  {
    id: 'spec-14',
    email: 'otabek@massaj.uz',
    fullName: 'Otabek Yunusov',
    phone: '+998901234593',
    role: 'SPECIALIST',
    status: 'INACTIVE',
    specialization: 'Bolalar massaji',
    experience: 2,
    workingDays: [1, 2, 3],
    workingHours: { start: '10:00', end: '16:00' },
    bio: 'Yangi mezbon mutaxassis, bolalar massaji amaliyotini o\'zlashtirish bosqichida.',
    rating: 4.2,
    createdAt: '2025-04-01T00:00:00+05:00',
  },
  {
    id: 'spec-15',
    email: 'shahnoza@massaj.uz',
    fullName: 'Shahnoza Rajabova',
    phone: '+998901234594',
    role: 'SPECIALIST',
    status: 'ACTIVE',
    specialization: 'Ortopedik massaj mutaxassisi',
    experience: 7,
    workingDays: [1, 2, 3, 4, 5],
    workingHours: { start: '09:00', end: '18:00' },
    bio: "Tekis oyoq va boshqa oyoq muammolari bo'yicha ortopedik massaj mutaxassisi.",
    rating: 4.6,
    createdAt: '2025-05-01T00:00:00+05:00',
  },
];

// ─── Services ─────────────────────────────────────────────

export const SERVICES: Service[] = [
  {
    id: 'svc-1',
    name: 'Umumiy bolalar massaji',
    description: 'Umumiy tonus va immunitetni yaxshilash uchun klassik massaj kursi',
    durationMinutes: 45,
    price: 100_000,
    status: 'ACTIVE',
    createdAt: '2024-01-01T00:00:00+05:00',
    color: '#f97316',
  },
  {
    id: 'svc-2',
    name: "Reabilitatsiya mashg'uloti",
    description: 'Harakat tizimini tiklash va muvofiqlashtirishni yaxshilash uchun seans',
    durationMinutes: 60,
    price: 150_000,
    status: 'ACTIVE',
    createdAt: '2024-01-01T00:00:00+05:00',
    color: '#4a8063',
  },
  {
    id: 'svc-3',
    name: "Individual mashg'ulot",
    description: 'Bolaning individual ehtiyojlariga moslashtirilgan maxsus seans',
    durationMinutes: 60,
    price: 180_000,
    status: 'ACTIVE',
    createdAt: '2024-01-01T00:00:00+05:00',
    color: '#f59e0b',
  },
  {
    id: 'svc-4',
    name: 'Ortopedik massaj',
    description: "Umurtqa pog'onasi va bo'g'im muammolari uchun maxsus massaj",
    durationMinutes: 50,
    price: 130_000,
    status: 'ACTIVE',
    createdAt: '2024-02-01T00:00:00+05:00',
    color: '#c24f0c',
  },
  {
    id: 'svc-5',
    name: 'Neurologik reabilitatsiya',
    description: 'Miya va asab tizimi bilan bog\'liq muammolarni davolash uchun seans',
    durationMinutes: 75,
    price: 200_000,
    status: 'ACTIVE',
    createdAt: '2024-02-15T00:00:00+05:00',
    color: '#6a9e82',
  },
  {
    id: 'svc-6',
    name: 'Chaqaloqlar massaji',
    description: '0-12 oy yoshdagi chaqaloqlar uchun maxsus massaj',
    durationMinutes: 30,
    price: 80_000,
    status: 'ACTIVE',
    createdAt: '2024-03-01T00:00:00+05:00',
    color: '#ff9640',
  },
  {
    id: 'svc-7',
    name: 'Sport reabilitatsiyasi',
    description: "Sport jarohatlaridan tiklash va oldini olish bo'yicha seans",
    durationMinutes: 60,
    price: 160_000,
    status: 'ACTIVE',
    createdAt: '2024-04-01T00:00:00+05:00',
    color: '#7e654a',
  },
  {
    id: 'svc-8',
    name: 'Logopedik massaj',
    description: 'Nutq va yuz muskullari massaji',
    durationMinutes: 40,
    price: 110_000,
    status: 'ARCHIVED',
    createdAt: '2024-05-01T00:00:00+05:00',
    color: '#b5afa8',
  },
];

// ─── Parents ──────────────────────────────────────────────

export const PARENTS: Parent[] = [
  { id: 'par-1', email: 'parent@demo.com', fullName: 'Feruza Aliyeva', phone: '+998901234600', role: 'PARENT', status: 'ACTIVE', childrenIds: ['child-1', 'child-2'], address: 'Toshkent, Yunusobod t., 15-uy', createdAt: '2024-06-01T00:00:00+05:00' },
  { id: 'par-2', email: 'par2@test.com', fullName: 'Ibrohim Karimov', phone: '+998901234601', role: 'PARENT', status: 'ACTIVE', childrenIds: ['child-3'], address: 'Toshkent, Chilonzor t., 23-uy', createdAt: '2024-06-05T00:00:00+05:00' },
  { id: 'par-3', email: 'par3@test.com', fullName: "Zulfiya Xo'jayeva", phone: '+998901234602', role: 'PARENT', status: 'ACTIVE', childrenIds: ['child-4', 'child-5'], address: 'Toshkent, Mirzo Ulug\'bek t., 8-uy', createdAt: '2024-06-10T00:00:00+05:00' },
  { id: 'par-4', email: 'par4@test.com', fullName: 'Bobur Toshmatov', phone: '+998901234603', role: 'PARENT', status: 'ACTIVE', childrenIds: ['child-6'], address: 'Toshkent, Shayxontohur t., 5-uy', createdAt: '2024-06-15T00:00:00+05:00' },
  { id: 'par-5', email: 'par5@test.com', fullName: 'Munira Hasanova', phone: '+998901234604', role: 'PARENT', status: 'ACTIVE', childrenIds: ['child-7', 'child-8', 'child-9'], address: 'Samarqand, Registon ko\'chasi, 42-uy', createdAt: '2024-06-20T00:00:00+05:00' },
  { id: 'par-6', email: 'par6@test.com', fullName: "Doniyor Yusupov", phone: '+998901234605', role: 'PARENT', status: 'ACTIVE', childrenIds: ['child-10'], address: 'Toshkent, Yashnobod t., 19-uy', createdAt: '2024-07-01T00:00:00+05:00' },
  { id: 'par-7', email: 'par7@test.com', fullName: 'Shahlo Nazarova', phone: '+998901234606', role: 'PARENT', status: 'ACTIVE', childrenIds: ['child-11', 'child-12'], address: 'Toshkent, Uchtepa t., 3-uy', createdAt: '2024-07-05T00:00:00+05:00' },
  { id: 'par-8', email: 'par8@test.com', fullName: "Aziza Ergasheva", phone: '+998901234607', role: 'PARENT', status: 'ACTIVE', childrenIds: ['child-13'], address: 'Namangan, Markaziy ko\'cha, 7-uy', createdAt: '2024-07-10T00:00:00+05:00' },
  { id: 'par-9', email: 'par9@test.com', fullName: 'Javlon Mirzayev', phone: '+998901234608', role: 'PARENT', status: 'ACTIVE', childrenIds: ['child-14', 'child-15'], address: "Toshkent, O'rta Chirchiq t., 11-uy", createdAt: '2024-07-15T00:00:00+05:00' },
  { id: 'par-10', email: 'par10@test.com', fullName: 'Nodira Qosimova', phone: '+998901234609', role: 'PARENT', status: 'ACTIVE', childrenIds: ['child-16'], address: 'Toshkent, Bektimir t., 22-uy', createdAt: '2024-07-20T00:00:00+05:00' },
  { id: 'par-11', email: 'par11@test.com', fullName: 'Rustam Holmatov', phone: '+998901234610', role: 'PARENT', status: 'ACTIVE', childrenIds: ['child-17'], address: 'Andijon, Asaka ko\'chasi, 14-uy', createdAt: '2024-08-01T00:00:00+05:00' },
  { id: 'par-12', email: 'par12@test.com', fullName: 'Malika Rahimova', phone: '+998901234611', role: 'PARENT', status: 'ACTIVE', childrenIds: ['child-18', 'child-19'], address: 'Toshkent, Olmazor t., 6-uy', createdAt: '2024-08-05T00:00:00+05:00' },
  { id: 'par-13', email: 'par13@test.com', fullName: 'Sherzod Abdullayev', phone: '+998901234612', role: 'PARENT', status: 'ACTIVE', childrenIds: ['child-20'], address: 'Buxoro, Navoiy ko\'chasi, 35-uy', createdAt: '2024-08-10T00:00:00+05:00' },
  { id: 'par-14', email: 'par14@test.com', fullName: 'Nozima Umarova', phone: '+998901234613', role: 'PARENT', status: 'ACTIVE', childrenIds: ['child-21'], address: 'Toshkent, Sergeli t., 9-uy', createdAt: '2024-08-15T00:00:00+05:00' },
  { id: 'par-15', email: 'par15@test.com', fullName: 'Firdavs Jurayev', phone: '+998901234614', role: 'PARENT', status: 'ACTIVE', childrenIds: ['child-22', 'child-23'], address: 'Toshkent, Yakkasaroy t., 17-uy', createdAt: '2024-09-01T00:00:00+05:00' },
  { id: 'par-16', email: 'par16@test.com', fullName: 'Ozoda Xoliqova', phone: '+998901234615', role: 'PARENT', status: 'ACTIVE', childrenIds: ['child-24'], address: 'Toshkent, Bektemir t., 4-uy', createdAt: '2024-09-10T00:00:00+05:00' },
  { id: 'par-17', email: 'par17@test.com', fullName: 'Mansur Tojiboyev', phone: '+998901234616', role: 'PARENT', status: 'ACTIVE', childrenIds: ['child-25'], address: 'Toshkent, Uchtepa t., 28-uy', createdAt: '2024-09-15T00:00:00+05:00' },
  { id: 'par-18', email: 'par18@test.com', fullName: 'Sabohat Ergasheva', phone: '+998901234617', role: 'PARENT', status: 'ACTIVE', childrenIds: ['child-26', 'child-27'], address: 'Qo\'qon, Mustaqillik ko\'chasi, 12-uy', createdAt: '2024-10-01T00:00:00+05:00' },
  { id: 'par-19', email: 'par19@test.com', fullName: "Ikrom Yo'ldoshev", phone: '+998901234618', role: 'PARENT', status: 'ACTIVE', childrenIds: ['child-28'], address: 'Toshkent, Akmal-Ikrom t., 31-uy', createdAt: '2024-10-10T00:00:00+05:00' },
  { id: 'par-20', email: 'par20@test.com', fullName: 'Mohira Tillayeva', phone: '+998901234619', role: 'PARENT', status: 'ACTIVE', childrenIds: ['child-29'], address: 'Toshkent, Mirzo Ulug\'bek t., 20-uy', createdAt: '2024-10-15T00:00:00+05:00' },
  { id: 'par-21', email: 'par21@test.com', fullName: 'Odil Xasanov', phone: '+998901234620', role: 'PARENT', status: 'ACTIVE', childrenIds: ['child-30'], address: 'Toshkent, Chilonzor t., 44-uy', createdAt: '2024-11-01T00:00:00+05:00' },
  { id: 'par-22', email: 'par22@test.com', fullName: 'Lola Mirzaeva', phone: '+998901234621', role: 'PARENT', status: 'ACTIVE', childrenIds: ['child-31', 'child-32'], address: 'Toshkent, Yunusobod t., 8-uy', createdAt: '2024-11-05T00:00:00+05:00' },
  { id: 'par-23', email: 'par23@test.com', fullName: 'Hamza Sultanov', phone: '+998901234622', role: 'PARENT', status: 'ACTIVE', childrenIds: ['child-33'], address: 'Toshkent, Shayxontohur t., 16-uy', createdAt: '2024-11-10T00:00:00+05:00' },
  { id: 'par-24', email: 'par24@test.com', fullName: 'Dilrabo Rajabova', phone: '+998901234623', role: 'PARENT', status: 'ACTIVE', childrenIds: ['child-34'], address: 'Toshkent, Yashnobod t., 3-uy', createdAt: '2024-11-15T00:00:00+05:00' },
  { id: 'par-25', email: 'par25@test.com', fullName: 'Abdulaziz Normatov', phone: '+998901234624', role: 'PARENT', status: 'ACTIVE', childrenIds: ['child-35'], address: 'Toshkent, Olmazor t., 10-uy', createdAt: '2024-12-01T00:00:00+05:00' },
  { id: 'par-26', email: 'par26@test.com', fullName: 'Nafisa Tursunova', phone: '+998901234625', role: 'PARENT', status: 'ACTIVE', childrenIds: ['child-36'], address: 'Toshkent, Bektimir t., 7-uy', createdAt: '2025-01-05T00:00:00+05:00' },
  { id: 'par-27', email: 'par27@test.com', fullName: 'Eldor Razzaqov', phone: '+998901234626', role: 'PARENT', status: 'ACTIVE', childrenIds: ['child-37', 'child-38'], address: 'Toshkent, Sergeli t., 25-uy', createdAt: '2025-01-10T00:00:00+05:00' },
  { id: 'par-28', email: 'par28@test.com', fullName: 'Umida Qodirov', phone: '+998901234627', role: 'PARENT', status: 'ACTIVE', childrenIds: ['child-39'], address: "Toshkent, O'rta Chirchiq t., 6-uy", createdAt: '2025-02-01T00:00:00+05:00' },
  { id: 'par-29', email: 'par29@test.com', fullName: 'Nuriddin Qosimov', phone: '+998901234628', role: 'PARENT', status: 'INACTIVE', childrenIds: ['child-40'], address: 'Toshkent, Yunusobod t., 33-uy', createdAt: '2025-02-15T00:00:00+05:00' },
  { id: 'par-30', email: 'par30@test.com', fullName: 'Kamola Umarova', phone: '+998901234629', role: 'PARENT', status: 'ACTIVE', childrenIds: ['child-41', 'child-42'], address: 'Toshkent, Mirzo Ulug\'bek t., 15-uy', createdAt: '2025-03-01T00:00:00+05:00' },
  { id: 'par-31', email: 'par31@test.com', fullName: 'Shukur Salimov', phone: '+998901234630', role: 'PARENT', status: 'ACTIVE', childrenIds: ['child-43'], address: 'Toshkent, Uchtepa t., 39-uy', createdAt: '2025-03-10T00:00:00+05:00' },
  { id: 'par-32', email: 'par32@test.com', fullName: 'Barno Xolmatova', phone: '+998901234631', role: 'PARENT', status: 'ACTIVE', childrenIds: ['child-44'], address: 'Toshkent, Chilonzor t., 51-uy', createdAt: '2025-04-01T00:00:00+05:00' },
  { id: 'par-33', email: 'par33@test.com', fullName: 'Alimjon Turayev', phone: '+998901234632', role: 'PARENT', status: 'ACTIVE', childrenIds: ['child-45', 'child-46'], address: 'Toshkent, Yakkasaroy t., 22-uy', createdAt: '2025-04-15T00:00:00+05:00' },
  { id: 'par-34', email: 'par34@test.com', fullName: 'Sitora Nazarova', phone: '+998901234633', role: 'PARENT', status: 'ACTIVE', childrenIds: ['child-47'], address: 'Toshkent, Akmal-Ikrom t., 4-uy', createdAt: '2025-05-01T00:00:00+05:00' },
  { id: 'par-35', email: 'par35@test.com', fullName: "Oybek Jo'rayev", phone: '+998901234634', role: 'PARENT', status: 'ACTIVE', childrenIds: ['child-48', 'child-49', 'child-50'], address: 'Toshkent, Bektemir t., 13-uy', createdAt: '2025-05-15T00:00:00+05:00' },
];

// ─── Children ─────────────────────────────────────────────

export const CHILDREN: Child[] = [
  { id: 'child-1', fullName: 'Amir Aliyev', dateOfBirth: '2020-03-15', gender: 'MALE', parentId: 'par-1', assignedSpecialistId: 'spec-1', status: 'ACTIVE', notes: 'Muskul tonusi past, muntazam massaj tavsiya etilgan', createdAt: '2024-06-01T00:00:00+05:00' },
  { id: 'child-2', fullName: 'Zara Aliyeva', dateOfBirth: '2022-07-20', gender: 'FEMALE', parentId: 'par-1', assignedSpecialistId: 'spec-5', status: 'ACTIVE', notes: 'Chaqaloqlar massaji kursi', createdAt: '2024-06-01T00:00:00+05:00' },
  { id: 'child-3', fullName: 'Sarvarbek Karimov', dateOfBirth: '2019-11-08', gender: 'MALE', parentId: 'par-2', assignedSpecialistId: 'spec-2', status: 'ACTIVE', notes: 'Reabilitatsiya kursi - harakat koordinatsiyasi', createdAt: '2024-06-05T00:00:00+05:00' },
  { id: 'child-4', fullName: "Malika Xo'jayeva", dateOfBirth: '2021-05-12', gender: 'FEMALE', parentId: 'par-3', assignedSpecialistId: 'spec-3', status: 'ACTIVE', notes: 'Tekis oyoq muammosi', createdAt: '2024-06-10T00:00:00+05:00' },
  { id: 'child-5', fullName: "Jasur Xo'jayev", dateOfBirth: '2018-09-25', gender: 'MALE', parentId: 'par-3', assignedSpecialistId: 'spec-4', status: 'ACTIVE', notes: 'Umurtqa pog\'onasi muammosi, ortopedik massaj', createdAt: '2024-06-10T00:00:00+05:00' },
  { id: 'child-6', fullName: 'Lola Toshmatova', dateOfBirth: '2023-01-30', gender: 'FEMALE', parentId: 'par-4', assignedSpecialistId: 'spec-5', status: 'ACTIVE', notes: 'Chaqaloq, umumiy tonus uchun massaj', createdAt: '2024-06-15T00:00:00+05:00' },
  { id: 'child-7', fullName: 'Ali Hasanov', dateOfBirth: '2017-04-18', gender: 'MALE', parentId: 'par-5', assignedSpecialistId: 'spec-2', status: 'ACTIVE', notes: 'Sport reabilitatsiyasi, tizzaga jarohat', createdAt: '2024-06-20T00:00:00+05:00' },
  { id: 'child-8', fullName: "Saodat Hasanova", dateOfBirth: '2020-08-03', gender: 'FEMALE', parentId: 'par-5', assignedSpecialistId: 'spec-1', status: 'ACTIVE', notes: 'Umumiy tonus yaxshilash kursi', createdAt: '2024-06-20T00:00:00+05:00' },
  { id: 'child-9', fullName: 'Umid Hasanov', dateOfBirth: '2022-12-10', gender: 'MALE', parentId: 'par-5', assignedSpecialistId: 'spec-5', status: 'INACTIVE', notes: 'Kurs yakunlandi, nazorat rejalashtirilgan', createdAt: '2024-06-20T00:00:00+05:00' },
  { id: 'child-10', fullName: 'Ziyoda Yusupova', dateOfBirth: '2019-02-22', gender: 'FEMALE', parentId: 'par-6', assignedSpecialistId: 'spec-12', status: 'ACTIVE', notes: 'Nutq rivojlanish kechikishi, logopedik massaj', createdAt: '2024-07-01T00:00:00+05:00' },
  { id: 'child-11', fullName: 'Sherzod Nazarov', dateOfBirth: '2018-06-14', gender: 'MALE', parentId: 'par-7', assignedSpecialistId: 'spec-4', status: 'ACTIVE', notes: 'Skolioz - dastlabki bosqich', createdAt: '2024-07-05T00:00:00+05:00' },
  { id: 'child-12', fullName: "Nilufar Nazarova", dateOfBirth: '2021-10-28', gender: 'FEMALE', parentId: 'par-7', assignedSpecialistId: 'spec-3', status: 'ACTIVE', notes: 'Oyoq bo\'g\'imi rivojlanishi', createdAt: '2024-07-05T00:00:00+05:00' },
  { id: 'child-13', fullName: 'Otabek Ergashev', dateOfBirth: '2020-04-05', gender: 'MALE', parentId: 'par-8', assignedSpecialistId: 'spec-1', status: 'ACTIVE', notes: 'Umumiy bolalar massaji kursi', createdAt: '2024-07-10T00:00:00+05:00' },
  { id: 'child-14', fullName: 'Dilnoza Mirzayeva', dateOfBirth: '2019-09-17', gender: 'FEMALE', parentId: 'par-9', assignedSpecialistId: 'spec-6', status: 'ACTIVE', notes: 'Harakat muvozanati buzilishi', createdAt: '2024-07-15T00:00:00+05:00' },
  { id: 'child-15', fullName: 'Kamron Mirzayev', dateOfBirth: '2022-03-08', gender: 'MALE', parentId: 'par-9', assignedSpecialistId: 'spec-5', status: 'ACTIVE', notes: 'Chaqaloqlar massaji, to\'rt oylik kurs', createdAt: '2024-07-15T00:00:00+05:00' },
  { id: 'child-16', fullName: 'Sabohat Qosimova', dateOfBirth: '2020-11-11', gender: 'FEMALE', parentId: 'par-10', assignedSpecialistId: 'spec-3', status: 'ACTIVE', notes: 'Oyoq muskullari kuchsizligi', createdAt: '2024-07-20T00:00:00+05:00' },
  { id: 'child-17', fullName: 'Muhammadrizo Holmatov', dateOfBirth: '2018-07-29', gender: 'MALE', parentId: 'par-11', assignedSpecialistId: 'spec-8', status: 'ACTIVE', notes: 'Sport reabilitatsiyasi, boldirlari jarohat', createdAt: '2024-08-01T00:00:00+05:00' },
  { id: 'child-18', fullName: 'Sarvar Rahimov', dateOfBirth: '2021-01-16', gender: 'MALE', parentId: 'par-12', assignedSpecialistId: 'spec-1', status: 'ACTIVE', notes: 'Umumiy tonus yaxshilash', createdAt: '2024-08-05T00:00:00+05:00' },
  { id: 'child-19', fullName: 'Zulfiya Rahimova', dateOfBirth: '2019-05-23', gender: 'FEMALE', parentId: 'par-12', assignedSpecialistId: 'spec-7', status: 'ACTIVE', notes: 'Nutq mashqlari va yuz massaji', createdAt: '2024-08-05T00:00:00+05:00' },
  { id: 'child-20', fullName: "Asilbek Abdullayev", dateOfBirth: '2020-08-31', gender: 'MALE', parentId: 'par-13', assignedSpecialistId: 'spec-2', status: 'ACTIVE', notes: 'Harakat reabilitatsiyasi', createdAt: '2024-08-10T00:00:00+05:00' },
  { id: 'child-21', fullName: 'Farangiz Umarova', dateOfBirth: '2022-02-14', gender: 'FEMALE', parentId: 'par-14', assignedSpecialistId: 'spec-5', status: 'ACTIVE', notes: 'Umumiy tonus uchun massaj', createdAt: '2024-08-15T00:00:00+05:00' },
  { id: 'child-22', fullName: 'Bobur Jurayev', dateOfBirth: '2018-12-05', gender: 'MALE', parentId: 'par-15', assignedSpecialistId: 'spec-10', status: 'ACTIVE', notes: 'Tana holati muammosi, davolash kursi', createdAt: '2024-09-01T00:00:00+05:00' },
  { id: 'child-23', fullName: 'Nilufar Jurayeva', dateOfBirth: '2020-06-19', gender: 'FEMALE', parentId: 'par-15', assignedSpecialistId: 'spec-3', status: 'ACTIVE', notes: 'Oyoq kamariga massaj', createdAt: '2024-09-01T00:00:00+05:00' },
  { id: 'child-24', fullName: 'Asliddin Xoliqov', dateOfBirth: '2021-09-08', gender: 'MALE', parentId: 'par-16', assignedSpecialistId: 'spec-1', status: 'ACTIVE', notes: 'Umumiy tonus yaxshilash', createdAt: '2024-09-10T00:00:00+05:00' },
  { id: 'child-25', fullName: 'Marjona Tojiboyeva', dateOfBirth: '2019-03-27', gender: 'FEMALE', parentId: 'par-17', assignedSpecialistId: 'spec-6', status: 'ACTIVE', notes: 'Muvozanat va koordinatsiya mashqlari', createdAt: '2024-09-15T00:00:00+05:00' },
  { id: 'child-26', fullName: 'Jamoliddin Ergashev', dateOfBirth: '2018-11-14', gender: 'MALE', parentId: 'par-18', assignedSpecialistId: 'spec-4', status: 'ACTIVE', notes: 'Umurtqa pog\'onasi korreksiyasi', createdAt: '2024-10-01T00:00:00+05:00' },
  { id: 'child-27', fullName: 'Feruza Ergasheva', dateOfBirth: '2021-04-02', gender: 'FEMALE', parentId: 'par-18', assignedSpecialistId: 'spec-5', status: 'INACTIVE', notes: 'Kurs tugadi, 3 oydan keyin nazorat', createdAt: '2024-10-01T00:00:00+05:00' },
  { id: 'child-28', fullName: "Nuriddin Yo'ldoshev", dateOfBirth: '2020-07-16', gender: 'MALE', parentId: 'par-19', assignedSpecialistId: 'spec-2', status: 'ACTIVE', notes: 'Oyoq tonus muammosi', createdAt: '2024-10-10T00:00:00+05:00' },
  { id: 'child-29', fullName: 'Xurshid Tillayev', dateOfBirth: '2022-01-22', gender: 'MALE', parentId: 'par-20', assignedSpecialistId: 'spec-5', status: 'ACTIVE', notes: 'Chaqaloqlar massaji', createdAt: '2024-10-15T00:00:00+05:00' },
  { id: 'child-30', fullName: 'Maftuna Xasanova', dateOfBirth: '2019-10-07', gender: 'FEMALE', parentId: 'par-21', assignedSpecialistId: 'spec-11', status: 'ACTIVE', notes: 'Immunitet kuchaytirish massaji', createdAt: '2024-11-01T00:00:00+05:00' },
  { id: 'child-31', fullName: 'Alibek Mirzaev', dateOfBirth: '2020-05-30', gender: 'MALE', parentId: 'par-22', assignedSpecialistId: 'spec-1', status: 'ACTIVE', notes: 'Umumiy tonus va harakatlanish', createdAt: '2024-11-05T00:00:00+05:00' },
  { id: 'child-32', fullName: 'Lobar Mirzaeva', dateOfBirth: '2022-09-04', gender: 'FEMALE', parentId: 'par-22', assignedSpecialistId: 'spec-5', status: 'ACTIVE', notes: 'Chaqaloq massaji kursi', createdAt: '2024-11-05T00:00:00+05:00' },
  { id: 'child-33', fullName: 'Firdavs Sultanov', dateOfBirth: '2019-01-18', gender: 'MALE', parentId: 'par-23', assignedSpecialistId: 'spec-8', status: 'ACTIVE', notes: 'Sport jismoniy tayyorgarlik', createdAt: '2024-11-10T00:00:00+05:00' },
  { id: 'child-34', fullName: 'Ziyoda Rajabova', dateOfBirth: '2021-06-25', gender: 'FEMALE', parentId: 'par-24', assignedSpecialistId: 'spec-3', status: 'ACTIVE', notes: 'Oyoq rivojlanishi kuzatuvi', createdAt: '2024-11-15T00:00:00+05:00' },
  { id: 'child-35', fullName: 'Hamza Normatov', dateOfBirth: '2020-02-09', gender: 'MALE', parentId: 'par-25', assignedSpecialistId: 'spec-4', status: 'ACTIVE', notes: 'Ortopedik muammo, davolash jarayonida', createdAt: '2024-12-01T00:00:00+05:00' },
  { id: 'child-36', fullName: 'Madina Tursunova', dateOfBirth: '2018-08-21', gender: 'FEMALE', parentId: 'par-26', assignedSpecialistId: 'spec-10', status: 'ACTIVE', notes: 'Umurtqa pog\'onasi tuzatish', createdAt: '2025-01-05T00:00:00+05:00' },
  { id: 'child-37', fullName: 'Sanjar Razzaqov', dateOfBirth: '2019-04-13', gender: 'MALE', parentId: 'par-27', assignedSpecialistId: 'spec-6', status: 'ACTIVE', notes: 'Harakat buzilishi', createdAt: '2025-01-10T00:00:00+05:00' },
  { id: 'child-38', fullName: 'Hulkar Razzaqova', dateOfBirth: '2022-10-01', gender: 'FEMALE', parentId: 'par-27', assignedSpecialistId: 'spec-9', status: 'ACTIVE', notes: 'Pediatrik fizioterapiya kursi', createdAt: '2025-01-10T00:00:00+05:00' },
  { id: 'child-39', fullName: "Eldor Qodirov", dateOfBirth: '2020-12-17', gender: 'MALE', parentId: 'par-28', assignedSpecialistId: 'spec-2', status: 'ACTIVE', notes: 'Reabilitatsiya davomi', createdAt: '2025-02-01T00:00:00+05:00' },
  { id: 'child-40', fullName: 'Zilola Qosimova', dateOfBirth: '2021-03-26', gender: 'FEMALE', parentId: 'par-29', assignedSpecialistId: 'spec-13', status: 'INACTIVE', notes: 'Kurs yakunlandi', createdAt: '2025-02-15T00:00:00+05:00' },
  { id: 'child-41', fullName: 'Akbar Umarov', dateOfBirth: '2018-05-08', gender: 'MALE', parentId: 'par-30', assignedSpecialistId: 'spec-4', status: 'ACTIVE', notes: 'Ortopedik muammo, aktiv kurs', createdAt: '2025-03-01T00:00:00+05:00' },
  { id: 'child-42', fullName: 'Dilfuza Umarova', dateOfBirth: '2021-11-19', gender: 'FEMALE', parentId: 'par-30', assignedSpecialistId: 'spec-1', status: 'ACTIVE', notes: 'Umumiy bolalar massaji', createdAt: '2025-03-01T00:00:00+05:00' },
  { id: 'child-43', fullName: 'Muhammadali Salimov', dateOfBirth: '2019-07-04', gender: 'MALE', parentId: 'par-31', assignedSpecialistId: 'spec-12', status: 'ACTIVE', notes: 'Autizm spektri - maxsus ehtiyojli', createdAt: '2025-03-10T00:00:00+05:00' },
  { id: 'child-44', fullName: 'Shahnoza Xolmatova', dateOfBirth: '2020-09-29', gender: 'FEMALE', parentId: 'par-32', assignedSpecialistId: 'spec-7', status: 'ACTIVE', notes: 'Nutq rivojlanishi mashqlari', createdAt: '2025-04-01T00:00:00+05:00' },
  { id: 'child-45', fullName: 'Jasurbek Turayev', dateOfBirth: '2018-02-11', gender: 'MALE', parentId: 'par-33', assignedSpecialistId: 'spec-8', status: 'ACTIVE', notes: 'Sport reabilitatsiyasi', createdAt: '2025-04-15T00:00:00+05:00' },
  { id: 'child-46', fullName: 'Nodira Turayeva', dateOfBirth: '2021-08-06', gender: 'FEMALE', parentId: 'par-33', assignedSpecialistId: 'spec-3', status: 'ACTIVE', notes: 'Oyoq holati kuzatuvi', createdAt: '2025-04-15T00:00:00+05:00' },
  { id: 'child-47', fullName: 'Farrux Nazarov', dateOfBirth: '2019-06-02', gender: 'MALE', parentId: 'par-34', assignedSpecialistId: 'spec-10', status: 'ACTIVE', notes: 'Tana holati korreksiyasi', createdAt: '2025-05-01T00:00:00+05:00' },
  { id: 'child-48', fullName: "Aziza Jo'rayeva", dateOfBirth: '2020-10-15', gender: 'FEMALE', parentId: 'par-35', assignedSpecialistId: 'spec-11', status: 'ACTIVE', notes: 'Immunitet kuchaytirish kursi', createdAt: '2025-05-15T00:00:00+05:00' },
  { id: 'child-49', fullName: "Mirzo Jo'rayev", dateOfBirth: '2022-04-28', gender: 'MALE', parentId: 'par-35', assignedSpecialistId: 'spec-5', status: 'ACTIVE', notes: 'Chaqaloq massaji', createdAt: '2025-05-15T00:00:00+05:00' },
  { id: 'child-50', fullName: "Gulsanam Jo'rayeva", dateOfBirth: '2018-03-19', gender: 'FEMALE', parentId: 'par-35', assignedSpecialistId: 'spec-15', status: 'ACTIVE', notes: 'Ortopedik massaj va tana holati', createdAt: '2025-05-15T00:00:00+05:00' },
  // A few more to reach 60
  { id: 'child-51', fullName: 'Behruz Qodirov', dateOfBirth: '2019-08-14', gender: 'MALE', parentId: 'par-28', assignedSpecialistId: 'spec-2', status: 'ACTIVE', notes: 'Reabilitatsiya davomi', createdAt: '2025-06-01T00:00:00+05:00' },
  { id: 'child-52', fullName: 'Saida Mirzaeva', dateOfBirth: '2021-12-25', gender: 'FEMALE', parentId: 'par-22', assignedSpecialistId: 'spec-1', status: 'ACTIVE', notes: 'Umumiy tonus', createdAt: '2025-06-05T00:00:00+05:00' },
  { id: 'child-53', fullName: 'Ibrohim Hasanov', dateOfBirth: '2020-02-02', gender: 'MALE', parentId: 'par-5', assignedSpecialistId: 'spec-6', status: 'ACTIVE', notes: 'Muvozanat mashqlari', createdAt: '2025-07-01T00:00:00+05:00' },
  { id: 'child-54', fullName: 'Mohira Yusupova', dateOfBirth: '2022-06-11', gender: 'FEMALE', parentId: 'par-6', assignedSpecialistId: 'spec-9', status: 'ACTIVE', notes: 'Fizioterapiya kursi', createdAt: '2025-07-10T00:00:00+05:00' },
  { id: 'child-55', fullName: 'Alimjon Rashidov', dateOfBirth: '2019-11-30', gender: 'MALE', parentId: 'par-8', assignedSpecialistId: 'spec-4', status: 'ACTIVE', notes: 'Ortopedik kuzatuv', createdAt: '2025-08-01T00:00:00+05:00' },
  { id: 'child-56', fullName: 'Sabrina Toshmatova', dateOfBirth: '2021-07-17', gender: 'FEMALE', parentId: 'par-4', assignedSpecialistId: 'spec-3', status: 'ACTIVE', notes: 'Oyoq rivojlanishi', createdAt: '2025-08-10T00:00:00+05:00' },
  { id: 'child-57', fullName: 'Shamsiddin Normatov', dateOfBirth: '2020-04-24', gender: 'MALE', parentId: 'par-25', assignedSpecialistId: 'spec-8', status: 'ACTIVE', notes: 'Sport reabilitatsiyasi', createdAt: '2025-08-15T00:00:00+05:00' },
  { id: 'child-58', fullName: 'Xilola Salimova', dateOfBirth: '2022-08-08', gender: 'FEMALE', parentId: 'par-31', assignedSpecialistId: 'spec-5', status: 'ACTIVE', notes: 'Chaqaloq massaji', createdAt: '2025-09-01T00:00:00+05:00' },
  { id: 'child-59', fullName: 'Doniyor Ergashev', dateOfBirth: '2019-03-05', gender: 'MALE', parentId: 'par-18', assignedSpecialistId: 'spec-10', status: 'ARCHIVED', notes: 'Kurs yakunlangan, arxivga olindi', createdAt: '2024-09-01T00:00:00+05:00' },
  { id: 'child-60', fullName: 'Gulbahor Tursunova', dateOfBirth: '2021-09-21', gender: 'FEMALE', parentId: 'par-26', assignedSpecialistId: 'spec-15', status: 'ACTIVE', notes: 'Ortopedik massaj kursi', createdAt: '2025-09-10T00:00:00+05:00' },
];

// ─── Appointments (300+) ──────────────────────────────────
// We'll generate them programmatically for realism

function makeAppointment(
  id: string,
  childId: string,
  parentId: string,
  specialistId: string,
  serviceId: string,
  date: string,
  startTime: string,
  endTime: string,
  status: Appointment['status'],
  notes?: string
): Appointment {
  return {
    id,
    childId,
    parentId,
    specialistId,
    serviceId,
    date,
    startTime,
    endTime,
    status,
    notes,
    createdAt: `${date}T08:00:00+05:00`,
    updatedAt: `${date}T${startTime}:00+05:00`,
  };
}

// Helper to add days
function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

// Generate realistic appointments over past 6 months (dynamically relative to current date)
const baseDate = new Date().toISOString().split('T')[0];

export const APPOINTMENTS: Appointment[] = [
  // Today's appointments
  makeAppointment('apt-1', 'child-1', 'par-1', 'spec-1', 'svc-1', baseDate, '09:00', '09:45', 'CONFIRMED', 'Oylik tekshiruv massaji'),
  makeAppointment('apt-2', 'child-3', 'par-2', 'spec-2', 'svc-2', baseDate, '10:00', '11:00', 'IN_PROGRESS'),
  makeAppointment('apt-3', 'child-7', 'par-5', 'spec-2', 'svc-7', baseDate, '11:30', '12:30', 'SCHEDULED'),
  makeAppointment('apt-4', 'child-10', 'par-6', 'spec-12', 'svc-5', baseDate, '13:00', '14:15', 'CONFIRMED'),
  makeAppointment('apt-5', 'child-14', 'par-9', 'spec-6', 'svc-2', baseDate, '14:30', '15:30', 'SCHEDULED'),
  makeAppointment('apt-6', 'child-22', 'par-15', 'spec-10', 'svc-4', baseDate, '15:00', '15:50', 'SCHEDULED'),
  makeAppointment('apt-7', 'child-5', 'par-3', 'spec-4', 'svc-4', baseDate, '09:30', '10:20', 'COMPLETED', 'Ortopedik massaj seansi'),
  makeAppointment('apt-8', 'child-8', 'par-5', 'spec-1', 'svc-1', baseDate, '16:00', '16:45', 'CANCELLED', 'Bola kasal bo\'lib qoldi'),
  makeAppointment('apt-9', 'child-30', 'par-21', 'spec-11', 'svc-1', baseDate, '11:00', '11:45', 'CONFIRMED'),
  makeAppointment('apt-10', 'child-43', 'par-31', 'spec-12', 'svc-5', baseDate, '12:00', '13:15', 'CONFIRMED'),

  // Yesterday
  makeAppointment('apt-11', 'child-2', 'par-1', 'spec-5', 'svc-6', addDays(baseDate, -1), '10:00', '10:30', 'COMPLETED'),
  makeAppointment('apt-12', 'child-4', 'par-3', 'spec-3', 'svc-2', addDays(baseDate, -1), '11:00', '12:00', 'COMPLETED'),
  makeAppointment('apt-13', 'child-11', 'par-7', 'spec-4', 'svc-4', addDays(baseDate, -1), '09:00', '09:50', 'COMPLETED'),
  makeAppointment('apt-14', 'child-18', 'par-12', 'spec-1', 'svc-1', addDays(baseDate, -1), '14:00', '14:45', 'NO_SHOW'),
  makeAppointment('apt-15', 'child-25', 'par-17', 'spec-6', 'svc-2', addDays(baseDate, -1), '15:00', '16:00', 'COMPLETED'),
  makeAppointment('apt-16', 'child-33', 'par-23', 'spec-8', 'svc-7', addDays(baseDate, -1), '10:30', '11:30', 'COMPLETED'),
  makeAppointment('apt-17', 'child-36', 'par-26', 'spec-10', 'svc-4', addDays(baseDate, -1), '13:00', '13:50', 'COMPLETED'),
  makeAppointment('apt-18', 'child-41', 'par-30', 'spec-4', 'svc-4', addDays(baseDate, -1), '16:00', '16:50', 'CANCELLED'),
  makeAppointment('apt-19', 'child-6', 'par-4', 'spec-5', 'svc-6', addDays(baseDate, -1), '09:30', '10:00', 'COMPLETED'),
  makeAppointment('apt-20', 'child-44', 'par-32', 'spec-7', 'svc-8', addDays(baseDate, -1), '11:30', '12:10', 'COMPLETED'),

  // Last week
  ...Array.from({ length: 60 }, (_, i) => {
    const childIndex = (i % 50) + 1;
    const childId = `child-${childIndex}`;
    const child = CHILDREN.find(c => c.id === childId)!;
    const specId = child?.assignedSpecialistId ?? 'spec-1';
    const svcId = `svc-${(i % 7) + 1}`;
    const dayOffset = -(2 + Math.floor(i / 10));
    const hours = ['09', '10', '11', '13', '14', '15', '16'][i % 7];
    const statuses: Appointment['status'][] = ['COMPLETED', 'COMPLETED', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'COMPLETED', 'COMPLETED'];
    return makeAppointment(
      `apt-${20 + i + 1}`,
      childId,
      child?.parentId ?? 'par-1',
      specId,
      svcId,
      addDays(baseDate, dayOffset),
      `${hours}:00`,
      `${hours}:45`,
      statuses[i % 7]
    );
  }),

  // Past months (historical)
  ...Array.from({ length: 220 }, (_, i) => {
    const childIndex = (i % 50) + 1;
    const childId = `child-${childIndex}`;
    const child = CHILDREN.find(c => c.id === childId)!;
    const specId = child?.assignedSpecialistId ?? 'spec-1';
    const svcId = `svc-${(i % 7) + 1}`;
    const dayOffset = -(8 + i * 1.2);
    const hours = ['09', '10', '11', '12', '13', '14', '15', '16'][i % 8];
    const statuses: Appointment['status'][] = ['COMPLETED', 'COMPLETED', 'COMPLETED', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'COMPLETED', 'COMPLETED'];
    return makeAppointment(
      `apt-${81 + i}`,
      childId,
      child?.parentId ?? 'par-1',
      specId,
      svcId,
      addDays(baseDate, Math.floor(-dayOffset)),
      `${hours}:00`,
      `${hours}:45`,
      statuses[i % 8]
    );
  }),
];

// ─── Sessions (derived from completed appointments) ───────

export const SESSIONS: Session[] = APPOINTMENTS
  .filter(apt => apt.status === 'COMPLETED' || apt.status === 'IN_PROGRESS')
  .slice(0, 250)
  .map((apt, i): Session => ({
    id: `ses-${i + 1}`,
    appointmentId: apt.id,
    childId: apt.childId,
    specialistId: apt.specialistId,
    serviceId: apt.serviceId,
    startTime: `${apt.date}T${apt.startTime}:00+05:00`,
    endTime: apt.status === 'IN_PROGRESS' ? undefined : `${apt.date}T${apt.endTime}:00+05:00`,
    status: apt.status === 'IN_PROGRESS' ? 'IN_PROGRESS' : 'COMPLETED',
    note: apt.status === 'COMPLETED' ? [
      'Seans yaxshi o\'tdi. Bola yaxshi munosabatda bo\'ldi.',
      "Harakatlanish yaxshilanishi kuzatildi. Tavsiya etilgan mashqlar bajarildi.",
      'Muskul tonusi anchagina yaxshilandi. Keyingi seans rejalashtirildi.',
      'Bola birinchi marta seans yakunigacha chidadi. Ijobiy dinamika kuzatilmoqda.',
      "Koordinatsiya mashqlari muvaffaqiyatli bajarildi. Ota-onaga uy mashqlari berildi.",
    ][i % 5] : undefined,
    observation: apt.status === 'COMPLETED' ? [
      "Muskul tonusi o'rtacha, sekin yaxshilanish kuzatilmoqda.",
      'Harakat amplitudasi kengaydi, koordinatsiya yaxshilandi.',
      "Bola faol ishtirok etdi, reaksiya ijobiy bo'ldi.",
      "Tana holati to'g'rilandi, umurtqa pog'onasi taranglik kamayganda.",
      'Muvozanat sezilarli darajada yaxshilandi.',
    ][i % 5] : undefined,
    recommendation: apt.status === 'COMPLETED' ? [
      "Kundalik 10 daqiqalik uyda mashq o'tkazish tavsiya etiladi.",
      "Sutka davomida tana holatiga e'tibor berish lozim.",
      'Har kuni ertalab oddiy cho\'zilish mashqlarini bajarish tavsiya etiladi.',
      "Keyingi seansga qadar erkin harakat rejimida bo'lish mumkin.",
      "Bolaning uyqu va dam olish rejimini nazorat qilish kerak.",
    ][i % 5] : undefined,
    createdAt: `${apt.date}T${apt.startTime}:00+05:00`,
  }));

// ─── Attendance ────────────────────────────────────────────

export const ATTENDANCE: AttendanceRecord[] = APPOINTMENTS
  .filter(apt => ['COMPLETED', 'NO_SHOW', 'CANCELLED'].includes(apt.status))
  .slice(0, 250)
  .map((apt, i): AttendanceRecord => ({
    id: `att-${i + 1}`,
    childId: apt.childId,
    appointmentId: apt.id,
    specialistId: apt.specialistId,
    date: apt.date,
    status: apt.status === 'NO_SHOW' ? 'NO_SHOW' : apt.status === 'CANCELLED' ? 'ABSENT' : i % 10 === 0 ? 'LATE' : 'PRESENT',
    note: apt.status === 'NO_SHOW' ? "Bola kelmadi, ota-ona xabar bermadi" : undefined,
    createdAt: `${apt.date}T08:00:00+05:00`,
  }));

// ─── Assessments ──────────────────────────────────────────

const OBSERVATION_TEXTS = [
  "Harakat amplitudasi o'rtacha, maqsadli mashqlar davom ettirilmoqda.",
  "Koordinatsiya va muvozanat sezilarli darajada yaxshilandi.",
  "Muskul tonusi normal holga kelib bormoqda. Rivojlanish ijobiy.",
  "Bolaning jarayonga munosabati yaxshi, faol ishtirok etmoqda.",
  "Tana holati korreksiyasi davom etmoqda, sekin lekin barqaror yaxshilanish.",
  "Muskul kuchi oshdi, harakat koordinatsiyasi yaxshilandi.",
  "Dastlabki seanslarga nisbatan sezilarli ijobiy dinamika kuzatilmoqda.",
];

export const ASSESSMENTS: Assessment[] = Array.from({ length: 120 }, (_, i): Assessment => {
  const child = CHILDREN[i % CHILDREN.length];
  const spec = SPECIALISTS.find(s => s.id === child.assignedSpecialistId) ?? SPECIALISTS[0];
  const daysAgo = i * 3;
  return {
    id: `asmnt-${i + 1}`,
    childId: child.id,
    specialistId: spec.id,
    scores: {
      movement: Math.floor(Math.random() * 2) + 3,
      coordination: Math.floor(Math.random() * 2) + 3,
      flexibility: Math.floor(Math.random() * 2) + 2,
      activityTolerance: Math.floor(Math.random() * 2) + 3,
      sessionResponse: Math.floor(Math.random() * 2) + 3,
    },
    professionalObservation: OBSERVATION_TEXTS[i % OBSERVATION_TEXTS.length],
    date: addDays(baseDate, -daysAgo),
    createdAt: `${addDays(baseDate, -daysAgo)}T10:00:00+05:00`,
  };
});

// ─── Progress Notes ────────────────────────────────────────

export const PROGRESS_NOTES: ProgressNote[] = Array.from({ length: 80 }, (_, i): ProgressNote => {
  const child = CHILDREN[i % CHILDREN.length];
  const spec = SPECIALISTS.find(s => s.id === child.assignedSpecialistId) ?? SPECIALISTS[0];
  const daysAgo = i * 4;
  return {
    id: `prog-${i + 1}`,
    childId: child.id,
    specialistId: spec.id,
    note: OBSERVATION_TEXTS[i % OBSERVATION_TEXTS.length],
    date: addDays(baseDate, -daysAgo),
    createdAt: `${addDays(baseDate, -daysAgo)}T11:00:00+05:00`,
  };
});

// ─── Goals ────────────────────────────────────────────────

const GOAL_TITLES = [
  'Oyoq muskullarini mustahkamlash',
  'Tana holatini yaxshilash',
  'Harakat koordinatsiyasini rivojlantirish',
  "Muvozanat ko'nikmalarini shakllantirish",
  "Umurtqa pog'onasini to'g'rilash",
  'Muskul tonusini normallash',
  "Oyoq bo'g'imini mustahkamlash",
  'Immunitetni kuchaytirish',
  'Harakat amplitudasini kengaytirish',
  'Nutqni rivojlantirish (yuz massaji orqali)',
];

export const GOALS: Goal[] = Array.from({ length: 80 }, (_, i): Goal => {
  const child = CHILDREN[i % CHILDREN.length];
  const statuses: Goal['status'][] = ['ACTIVE', 'ACTIVE', 'COMPLETED', 'ACTIVE', 'PAUSED'];
  const status = statuses[i % 5];
  const progress = status === 'COMPLETED' ? 100 : status === 'PAUSED' ? Math.floor(Math.random() * 40) + 20 : Math.floor(Math.random() * 60) + 20;
  return {
    id: `goal-${i + 1}`,
    childId: child.id,
    title: GOAL_TITLES[i % GOAL_TITLES.length],
    description: `${child.fullName} uchun belgilangan maqsad: ${GOAL_TITLES[i % GOAL_TITLES.length].toLowerCase()}`,
    createdAt: `${addDays(baseDate, -(i * 7))}T09:00:00+05:00`,
    targetDate: addDays(baseDate, 90 - i * 2),
    status,
    progress,
    specialistNote: status === 'COMPLETED' ? 'Maqsad muvaffaqiyatli bajarildi.' : undefined,
  };
});

// ─── Transactions & Payments ──────────────────────────────

// Generate payments: parents pay 1-3 times, various amounts
const PAYMENT_AMOUNTS = [500_000, 1_000_000, 1_500_000, 2_000_000, 750_000, 1_200_000, 800_000, 3_000_000];
const PAYMENT_METHODS: Payment['method'][] = ['CASH', 'CARD', 'TRANSFER'];

export const PAYMENTS: Payment[] = Array.from({ length: 150 }, (_, i): Payment => {
  const parent = PARENTS[i % PARENTS.length];
  const childId = parent.childrenIds[0];
  const daysAgo = Math.floor(i * 1.5);
  const amount = PAYMENT_AMOUNTS[i % PAYMENT_AMOUNTS.length];
  return {
    id: `pay-${i + 1}`,
    parentId: parent.id,
    childId,
    amount,
    method: PAYMENT_METHODS[i % 3],
    date: `${addDays(baseDate, -daysAgo)}T10:00:00+05:00`,
    notes: i % 5 === 0 ? 'Oylik to\'lov' : undefined,
    transactionId: `txn-pay-${i + 1}`,
    createdBy: 'admin-2',
    createdAt: `${addDays(baseDate, -daysAgo)}T10:05:00+05:00`,
  };
});

// Generate all transactions
export const TRANSACTIONS: Transaction[] = [
  // Payment transactions (IN)
  ...PAYMENTS.map((pay): Transaction => ({
    id: `txn-pay-${pay.id}`,
    type: 'PAYMENT',
    direction: 'IN',
    amount: pay.amount,
    childId: pay.childId,
    parentId: pay.parentId,
    paymentId: pay.id,
    description: `To'lov qabul qilindi - ${pay.method}`,
    date: pay.date,
    createdAt: pay.createdAt,
    createdBy: pay.createdBy,
  })),

  // Session charge transactions (OUT)
  ...SESSIONS
    .filter(s => s.status === 'COMPLETED')
    .slice(0, 220)
    .map((ses, i): Transaction => {
      const service = SERVICES.find(sv => sv.id === ses.serviceId);
      const amount = service?.price ?? 100_000;
      return {
        id: `txn-ses-${i + 1}`,
        type: 'SESSION_CHARGE',
        direction: 'OUT',
        amount,
        childId: ses.childId,
        sessionId: ses.id,
        appointmentId: ses.appointmentId,
        description: `Seans narxi - ${service?.name ?? 'Xizmat'}`,
        date: ses.startTime,
        createdAt: ses.startTime,
        createdBy: ses.specialistId,
      };
    }),

  // A few refunds
  ...Array.from({ length: 8 }, (_, i): Transaction => ({
    id: `txn-ref-${i + 1}`,
    type: 'REFUND',
    direction: 'IN',
    amount: 150_000,
    parentId: PARENTS[i].id,
    childId: PARENTS[i].childrenIds[0],
    description: "Bekor qilingan seans uchun qaytarish",
    date: `${addDays(baseDate, -(i * 10 + 5))}T12:00:00+05:00`,
    createdAt: `${addDays(baseDate, -(i * 10 + 5))}T12:05:00+05:00`,
    createdBy: 'admin-2',
  })),

  // Some expenses
  ...Array.from({ length: 12 }, (_, i): Transaction => ({
    id: `txn-exp-${i + 1}`,
    type: 'EXPENSE',
    direction: 'OUT',
    amount: [80_000, 120_000, 50_000, 200_000, 350_000][i % 5],
    description: ["Massaj moyi xaridi", "Jihozlar xaridori", "Kommunal to'lov", "Ijarа to'lovi", "Dezinfeksiya vositalari"][i % 5],
    date: `${addDays(baseDate, -(i * 12))}T09:00:00+05:00`,
    createdAt: `${addDays(baseDate, -(i * 12))}T09:05:00+05:00`,
    createdBy: 'admin-1',
  })),
];

// ─── Notifications ────────────────────────────────────────

export const NOTIFICATIONS: Notification[] = [
  { id: 'notif-1', userId: 'admin-1', type: 'appointment', title: 'Yangi uchrashuvlar', message: "Bugun 10 ta uchrashuv rejalashtirilgan. Bir nechtasi tasdiqlanmagan.", isRead: false, relatedEntity: { type: 'appointment', id: 'apt-1' }, createdAt: '2026-09-26T08:00:00+05:00' },
  { id: 'notif-2', userId: 'admin-1', type: 'payment', title: "To'lov qabul qilindi", message: "Feruza Aliyevadan 1,000,000 so'm to'lov qabul qilindi.", isRead: false, relatedEntity: { type: 'payment', id: 'pay-1' }, createdAt: '2026-09-26T09:15:00+05:00' },
  { id: 'notif-3', userId: 'admin-1', type: 'session', title: 'Seans yakunlandi', message: "Kamola Azimova Amir Aliyev bilan seans yakunladi.", isRead: false, relatedEntity: { type: 'session', id: 'ses-7' }, createdAt: '2026-09-26T10:00:00+05:00' },
  { id: 'notif-4', userId: 'admin-1', type: 'system', title: 'Tizim yangilandi', message: "MASSAJ CRM tizimi muvaffaqiyatli yangilandi.", isRead: true, createdAt: '2026-09-25T18:00:00+05:00' },
  { id: 'notif-5', userId: 'admin-1', type: 'appointment', title: 'Uchrashuv bekor qilindi', message: "Jasur Xo'jayev 15:00 dagi uchrashuvini bekor qildi.", isRead: true, relatedEntity: { type: 'appointment', id: 'apt-8' }, createdAt: '2026-09-26T07:30:00+05:00' },
  // Demo specialist notification
  { id: 'notif-6', userId: 'spec-1', type: 'appointment', title: 'Bugungi jadvalingiz', message: "Bugun 09:00 da Amir Aliyev bilan massaj seansi.", isRead: false, relatedEntity: { type: 'appointment', id: 'apt-1' }, createdAt: '2026-09-26T08:30:00+05:00' },
  { id: 'notif-7', userId: 'spec-1', type: 'assessment', title: 'Yangi baholash so\'rovi', message: "Amir Aliyev uchun oylik baholash vaqti keldi.", isRead: false, relatedEntity: { type: 'child', id: 'child-1' }, createdAt: '2026-09-25T16:00:00+05:00' },
  // Demo parent notification
  { id: 'notif-8', userId: 'par-1', type: 'appointment', title: 'Uchrashuvingiz tasdiqlandi', message: "Ertangi 09:00 dagi Amir Aliyev bilan uchrashuv tasdiqlandi.", isRead: false, relatedEntity: { type: 'appointment', id: 'apt-1' }, createdAt: '2026-09-25T15:00:00+05:00' },
  { id: 'notif-9', userId: 'par-1', type: 'payment', title: 'Balans eslatmasi', message: "Zara Aliyeva uchun balans kamaymoqda. Iltimos to'ldirishni unutmang.", isRead: false, createdAt: '2026-09-24T12:00:00+05:00' },
  // Many more for admin
  ...Array.from({ length: 90 }, (_, i): Notification => ({
    id: `notif-${10 + i}`,
    userId: ['admin-1', 'admin-2', 'spec-1', 'par-1'][i % 4],
    type: (['appointment', 'payment', 'schedule', 'session', 'assessment', 'system'] as const)[i % 6],
    title: ['Uchrashuv eslatmasi', "To'lov eslatmasi", 'Jadval o\'zgardi', 'Seans yakunlandi', 'Baholash so\'rovi', 'Tizim xabari'][i % 6],
    message: `Xabar ${i + 10}: tizimdan avtomatik xabar.`,
    isRead: i % 3 !== 0,
    createdAt: `${addDays(baseDate, -(i % 30))}T${String(8 + (i % 10)).padStart(2, '0')}:00:00+05:00`,
  })),
];

// ─── Activity Logs ────────────────────────────────────────

export const ACTIVITY_LOGS: ActivityLog[] = [
  { id: 'log-1', actorId: 'admin-2', actorName: 'Nilufar Rashidova', actorRole: 'ADMIN', action: 'CREATE', entity: 'child', entityId: 'child-60', description: "Yangi bola qo'shildi: Gulbahor Tursunova", timestamp: '2026-09-26T09:10:00+05:00' },
  { id: 'log-2', actorId: 'spec-1', actorName: 'Kamola Azimova', actorRole: 'SPECIALIST', action: 'COMPLETE', entity: 'session', entityId: 'ses-7', description: "Amir Aliyev bilan seans yakunlandi", timestamp: '2026-09-26T09:50:00+05:00' },
  { id: 'log-3', actorId: 'admin-2', actorName: 'Nilufar Rashidova', actorRole: 'ADMIN', action: 'PAYMENT', entity: 'payment', entityId: 'pay-1', description: "Feruza Aliyevadan 1,000,000 so'm qabul qilindi", timestamp: '2026-09-26T09:15:00+05:00' },
  { id: 'log-4', actorId: 'admin-1', actorName: 'Alisher Nazarov', actorRole: 'SUPER_ADMIN', action: 'UPDATE', entity: 'service', entityId: 'svc-1', description: "Umumiy bolalar massaji narxi yangilandi", timestamp: '2026-09-25T17:00:00+05:00' },
  { id: 'log-5', actorId: 'admin-2', actorName: 'Nilufar Rashidova', actorRole: 'ADMIN', action: 'CREATE', entity: 'appointment', entityId: 'apt-1', description: "Amir Aliyev uchun uchrashuv yaratildi", timestamp: '2026-09-25T16:30:00+05:00' },
  ...Array.from({ length: 145 }, (_, i): ActivityLog => {
    const actors = [
      { id: 'admin-1', name: 'Alisher Nazarov', role: 'SUPER_ADMIN' as const },
      { id: 'admin-2', name: 'Nilufar Rashidova', role: 'ADMIN' as const },
      { id: 'spec-1', name: 'Kamola Azimova', role: 'SPECIALIST' as const },
      { id: 'spec-2', name: 'Aziz Karimov', role: 'SPECIALIST' as const },
    ];
    const actor = actors[i % actors.length];
    const actions: ActivityLog['action'][] = ['CREATE', 'UPDATE', 'COMPLETE', 'PAYMENT', 'CANCEL', 'LOGIN'];
    const entities: ActivityLog['entity'][] = ['child', 'appointment', 'session', 'payment', 'parent', 'specialist'];
    const action = actions[i % actions.length];
    const entity = entities[i % entities.length];
    return {
      id: `log-${6 + i}`,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action,
      entity,
      entityId: `${entity}-${(i % 20) + 1}`,
      description: `${actor.name} ${entity} bo'yicha ${action} amali bajardi`,
      timestamp: `${addDays(baseDate, -(i % 30))}T${String(8 + (i % 10)).padStart(2, '0')}:${String(i % 60).padStart(2, '0')}:00+05:00`,
    };
  }),
];
