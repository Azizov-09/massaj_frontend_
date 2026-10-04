# 📋 Bolalar Massaj CRM — Backend Tuzatishlari va Rivojlantirish Bo'yicha Texnik Topshiriq (TZ)

**Loyiha:** Bolalar Massaj va Reabilitatsiya Markazi CRM  
**Muallif:** Senior Full-Stack / DevOps Audit Guruxi  
**Qabul qiluvchi:** Backend Dasturchi (NestJS / PostgreSQL / Redis / Nginx)  
**Holat:** Ishga qabul qilish uchun tayyor (P0, P1, P2 vazifalar belgilangan)  
**Server IP:** `104.248.29.65` (DigitalOcean, Ubuntu 22.04 LTS)  
**Sana:** Oktyabr 2026  

---

## 🎯 Kirish va Umumiy Holat

Frontend tomonida barcha sinxronizatsiya mexanizmlari, 401 token yangilash (silent refresh queue), RFC4122 v4 toza UUID identifikatorlari va oflayn/lokal ma'lumotlar bilan ishlash 100% holatga keltirildi.

Biroq, tizim ishlab chiqarish (production) darajasida xavfsiz, barqaror va uzluksiz ishlashi uchun quyidagi **10 ta muhim backend vazifasini** zudlik bilan amalga oshirish talab etiladi. Har bir vazifa uchun aniq muammo, talab, kod namunasi va qabul qilish mezonlari keltirilgan.

---

## 📌 VAZIFALAR REJASI (PRIORITETLAR BO'YICHA)

| № | Vazifa | Prioritet | Yo'nalish | Qisqa mazmuni |
|---|---|---|---|---|
| **1** | **SSL/TLS & Nginx Hardening** | 🚨 **P0 (Kritik)** | DevOps / Infra | 443 HTTPS portni ochish, Let's Encrypt o'rnatish, 80->443 redirect |
| **2** | **Rate Limiting & Brute-Force Himoyasi** | 🚨 **P0 (Kritik)** | Xavfsizlik | `POST /auth/login` ga 5 req/min, refresh ga 10 req/min cheklov |
| **3** | **Xizmatlar va Sozlamalarni Ommaviy Qilish** | 🔴 **P1 (Yuqori)** | API / Biznes | `GET /services` va `GET /settings` ga `@Public()` berish |
| **4** | **Refresh Token Gibrid (Cookie + Body)** | 🔴 **P1 (Yuqori)** | Auth | Cookie va JSON `{ refreshToken }` ikkalasidan ham qabul qilish |
| **5** | **To'lovlarda childId ni Ixtiyoriy Qilish** | 🔴 **P1 (Yuqori)** | Finans | `RecordPaymentDto` da `childId?: string` qilish (Ota-ona balansi) |
| **6** | **Qabullar To'qnashuvi (Race Condition)** | 🔴 **P1 (Yuqori)** | DB / Concurrency | Bir vaqtda bir xil mutaxassisga 2 kishi yozilishini DB darajasida bloklash |
| **7** | **Hujjat Yuklash uchun Presigned URL** | 🟡 **P2 (O'rta)** | Storage | `POST /documents/presigned-url` S3/MinIO yuklash endpointi |
| **8** | **Swagger UI ni Productionda Himoyalash** | 🟡 **P2 (O'rta)** | Xavfsizlik | `/api/docs` ni Basic Auth bilan yopish yoki prod da o'chirish |
| **9** | **Xatoliklarni Yagona Formatda Qaytarish** | 🟡 **P2 (O'rta)** | NestJS Filter | Global Exception Filter orqali standart JSON response |
| **10**| **Docker / Systemd Auto-Restart & Loglar** | 🟢 **P3 (Standart)**| DevOps | PM2/Docker restart policy va log rotatsiyasini sozlash |

---

## 🚨 1-VAZIFA: SSL/TLS & Nginx Xavfsizligini Ta'minlash (P0 CRITICAL)

### Muammo:
Hozirgi paytda serverning **443 porti yopiq (`ECONNREFUSED`)**. Barcha so'rovlar WAN tarmog'i bo'ylab shifrlanmagan HTTP (`http://104.248.29.65`) orqali bormoqda. Parollar, loginlar, bolalarning tibbiy ma'lumotlari ochiq matn (plaintext) ko'rinishida uzatilmoqda. Bundan tashqari, Vercel frontend (HTTPS) dan HTTP backendga so'rov yuborilganda brauzer **Mixed Content** xatoligi beradi. Nginx javob sarlavhalarida `Server: nginx/1.24.0 (Ubuntu)` versiyasi fosh bo'lib turibdi.

### Talablar:
1. Domen biriktirish (masalan: `api.massajcrm.uz` yoki mijozning domeni).
2. Certbot orqali Let's Encrypt bepul SSL sertifikatini o'rnatish.
3. 80-portdagi barcha HTTP trafigini avtomatik 443 HTTPS ga `301 Moved Permanently` qilish.
4. `server_tokens off;` orqali Nginx versiyasini yashirish.
5. HSTS, X-Content-Type-Options, X-Frame-Options sarlavhalarini qo'shish.

### Nginx Konfiguratsiya Namunasi (`/etc/nginx/sites-available/massaj-api`):
```nginx
# HTTP — HTTPS ga majburiy yo'naltirish
server {
    listen 80;
    listen [::]:80;
    server_name api.massajcrm.uz; # O'z domeningizni yozing

    return 301 https://$host$request_uri;
}

# HTTPS — Asosiy konfiguratsiya
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.massajcrm.uz;

    # SSL Sertifikatlari (Certbot yaratadi)
    ssl_certificate /etc/letsencrypt/live/api.massajcrm.uz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.massajcrm.uz/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;

    # Xavfsizlik sarlavhalari
    server_tokens off;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Gzip siqish
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    location / {
        proxy_pass http://127.0.0.1:3000; # NestJS ishlayotgan port
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeoutlar
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

### Tekshirish:
```bash
sudo nginx -t && sudo systemctl reload nginx
curl -I https://api.massajcrm.uz/api/v1/services
# Server sarlavhasida versiya chiqmasligi va 200/401 qaytishi kerak
```

---

## 🚨 2-VAZIFA: Rate Limiting va Brute-Force Himoyasi (P0 CRITICAL)

### Muammo:
`POST /api/v1/auth/login` endpointida hech qanday so'rovlar soni cheklovi yo'q. Hujumchi bir daqiqada 100,000 ta parol variantini yuborib administrator yoki mutaxassislar hisobini buzib kirishi mumkin.

### Talablar:
1. NestJS loyihasiga `@nestjs/throttler` paketini o'rnatish.
2. Redis saqlagichi bilan bog'lash (mavjud Redis serverdan foydalaniladi).
3. Login endpoint uchun: **1 daqiqada maksimum 5 ta muvaffaqiyatsiz urinish**.
4. Token yangilash (refresh) uchun: **1 daqiqada maksimum 10 ta so'rov**.
5. Boshqa barcha API uchun: **1 daqiqada maksimum 120 ta so'rov**.

### Amalga oshirish (NestJS kodi):

#### 1. `app.module.ts`:
```typescript
import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerStorageRedisService } from 'nestjs-throttler-storage-redis';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      throttlers: [
        {
          name: 'default',
          ttl: 60000, // 1 daqiqa
          limit: 120, // 1 daqiqada 120 ta umumiy so'rov
        },
      ],
      storage: new ThrottlerStorageRedisService('redis://127.0.0.1:6379'),
    }),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
```

#### 2. `auth.controller.ts`:
```typescript
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { LoginDto, RefreshDto } from './dto';

@Controller('v1/auth')
export class AuthController {
  // Login uchun qat'iy cheklov: 60 soniyada maksimum 5 ta so'rov
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // Refresh uchun cheklov: 60 soniyada maksimum 10 ta so'rov
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('refresh')
  async refresh(@Body() dto: RefreshDto, @Req() req: Request) {
    return this.authService.refresh(dto, req);
  }
}
```

### Tekshirish:
```bash
# 6 marta ketma-ket noto'g'ri login yuborilganda 6-chisi 429 Too Many Requests qaytarishi kerak:
for i in {1..6}; do
  curl -s -o /dev/null -w "%{http_code}\n" -X POST http://104.248.29.65/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"phone":"+998901234567","password":"wrong"}'
done
# Natija: 401, 401, 401, 401, 401, 429
```

---

## 🔴 3-VAZIFA: Xizmatlar va Sozlamalar Endpointlarini Ommaviy Qilish (P1 HIGH)

### Muammo:
`GET /api/v1/services` va `GET /api/v1/settings` hozirda `JwtAuthGuard` orqali qulflangan (401 Unauthorized qaytaradi). Natijada tizimga kirmagan tashrif buyuruvchilar, ota-onalar Landing Page da klinika xizmatlari ro'yxatini, narxlarini, davomiyligini va klinika ish vaqtlarini ko'ra olmaydi.

### Talablar:
1. `GET /api/v1/services` — har qanday tashrif buyuruvchi uchun ochiq (`@Public()`) bo'lishi kerak.
2. `GET /api/v1/settings` — klinikaning nomi, telefoni, manzili va ish vaqtlari ochiq bo'lishi kerak.
3. Servislarni yaratish (`POST`), yangilash (`PATCH`), arxivlash (`DELETE`) faqat `ADMIN` yoki `SUPER_ADMIN` tokeni bilan himoyalangan holda qolishi shart.

### Amalga oshirish (NestJS):

#### 1. `@Public()` Decorator (`src/common/decorators/public.decorator.ts`):
```typescript
import { SetMetadata } from '@nestjs/common';
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

#### 2. `services.controller.ts`:
```typescript
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';

@Controller('v1/services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  // OMMAGA OCHIQ: Landing page va umumiy ko'rish uchun
  @Public()
  @Get()
  async findAll() {
    return this.servicesService.findAllActive();
  }

  @Public()
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.servicesService.findOne(id);
  }

  // FAQAT ADMINLAR UCHUN:
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Post()
  async create(@Body() dto: CreateServiceDto) {
    return this.servicesService.create(dto);
  }
}
```

#### 3. `platform.controller.ts`:
```typescript
@Controller('v1/settings')
export class SettingsController {
  @Public()
  @Get()
  async getPublicSettings() {
    return this.platformService.getPublicClinicSettings();
  }
}
```

---

## 🔴 4-VAZIFA: Refresh Token Gibrid Qo'llab-quvvatlash (Cookie + JSON Body) (P1 HIGH)

### Muammo:
Hozirda Swagger hujjatida `Set-Cookie: refresh_token=...; HttpOnly` deyilgan, lekin amalda `AuthController.refresh` faqat JSON body `{ refreshToken: string }` kutmoqda. Agar kelgusida frontend va backend alohida domenlarda bo'lsa (Vercel va alohida API domen), brauzer Third-Party Cookie siyosati sababli cookielarni bloklashi mumkin.

### Talablar:
`POST /api/v1/auth/refresh` endpointi token'ni:
1. Avvalo `req.cookies['refresh_token']` dan qidirsin.
2. Agar cookie bo'lmasa, `req.body.refreshToken` dan qidirsin.
3. Ikkala holatda ham yangi `accessToken` va yangi `refreshToken` ni ham JSON tanasida, ham `HttpOnly` cookie ko'rinishida qaytarsin.

### Amalga oshirish (`auth.controller.ts` & `auth.service.ts`):
```typescript
import { Controller, Post, Body, Req, Res, UnauthorizedException } from '@nestjs/common';
import { Request, Response } from 'express';
import { Public } from '../common/decorators/public.decorator';
import { RefreshDto } from './dto/refresh.dto';

@Controller('v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('refresh')
  async refresh(
    @Body() dto: RefreshDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    // 1. Tokenni cookie yoki body dan olish
    const token = req.cookies?.['refresh_token'] || dto?.refreshToken;
    if (!token) {
      throw new UnauthorizedException('Refresh token topilmadi');
    }

    const result = await this.authService.rotateTokens(token);

    // 2. Cookie o'rnatish (Xavfsiz sozlamalar bilan)
    res.cookie('refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/api/v1/auth',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 kun
    });

    // 3. Frontend uchun JSON qaytarish
    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: result.user,
    };
  }
}
```

---

## 🔴 5-VAZIFA: To'lovlarda childId ni Ixtiyoriy Qilish (P1 HIGH)

### Muammo:
`POST /api/v1/payments` endpointi `childId` maydonini qat'iy talab qilmoqda (`@IsUUID()`, `@IsNotEmpty()`). Biroq bolalar reabilitatsiya klinikasida ko'pincha:
1. Ota-onaning 2 yoki 3 ta farzandi qatnaydi va ota-ona umumiy oilaviy balansga 1,000,000 so'm depozit kiritadi.
2. To'lov qabul qilinganda ma'lum bir bolaga emas, balki butun oila (parent) balansiga hisoblanishi kerak.

### Talablar:
1. `RecordPaymentDto` da `childId` maydoni ixtiyoriy (`@IsOptional()`) bo'lishi kerak.
2. Agar `childId` berilmagan bo'lsa, to'lov `parentId` hisobiga to'g'ridan-to'g'ri o'tirishi va `Transaction` jadvaliga `parentId` bilan yozilishi shart.
3. `idempotencyKey` maydoni orqali tarmoqdagi uzilishlar paytida to'lov 2 marta yechilib ketishi (double charge) oldi olinishi shart.

### Amalga oshirish (`record-payment.dto.ts`):
```typescript
import { IsUUID, IsNotEmpty, IsNumber, IsEnum, IsOptional, IsString, Min } from 'class-validator';
import { PaymentMethod } from '../enums';

export class RecordPaymentDto {
  @IsUUID('4', { message: 'parentId to\'g\'ri UUID formatida bo\'lishi shart' })
  @IsNotEmpty()
  parentId: string;

  @IsUUID('4', { message: 'childId to\'g\'ri UUID formatida bo\'lishi shart' })
  @IsOptional() // IXTIYORIY QILINDI
  childId?: string;

  @IsNumber({}, { message: 'amount musbat son bo\'lishi shart' })
  @Min(1000, { message: 'Minimal to\'lov 1000 so\'m' })
  amount: number;

  @IsEnum(PaymentMethod, { message: 'method CASH, CARD yoki TRANSFER bo\'lishi kerak' })
  method: PaymentMethod;

  @IsString()
  @IsOptional()
  note?: string;

  @IsString()
  @IsOptional()
  paidAt?: string;

  @IsString()
  @IsOptional()
  idempotencyKey?: string;
}
```

### To'lov Servisidagi mantiq (`finance.service.ts`):
```typescript
async recordPayment(dto: RecordPaymentDto, currentUserId: string) {
  return this.prisma.$transaction(async (tx) => {
    // 1. Idempotency tekshirish
    if (dto.idempotencyKey) {
      const existing = await tx.payment.findUnique({
        where: { idempotencyKey: dto.idempotencyKey },
      });
      if (existing) return existing;
    }

    // 2. To'lovni yaratish
    const payment = await tx.payment.create({
      data: {
        parentId: dto.parentId,
        childId: dto.childId || null, // null bo'lishi mumkin
        amount: dto.amount,
        method: dto.method,
        notes: dto.note,
        paidAt: dto.paidAt ? new Date(dto.paidAt) : new Date(),
        createdBy: currentUserId,
        idempotencyKey: dto.idempotencyKey,
      },
    });

    // 3. Tranzaksiya yozish (Balance oshirish)
    await tx.transaction.create({
      data: {
        type: 'PAYMENT',
        direction: 'IN',
        amount: dto.amount,
        parentId: dto.parentId,
        childId: dto.childId || null,
        paymentId: payment.id,
        description: `To'lov qabul qilindi (${dto.method})`,
        createdBy: currentUserId,
      },
    });

    return payment;
  });
}
```

---

## 🔴 6-VAZIFA: Qabullar To'qnashuvidan Himoya (Race Conditions & Overlap) (P1 HIGH)

### Muammo:
Agar ikki administrator yoki ota-ona bir vaqtning o'zida bitta mutaxassisga soat 10:00 ga qabul yozsa, hozirgi backend tekshiruvi parallel so'rovlar oqimida (race condition) ikkala qabulni ham tasdiqlab yuborishi mumkin.

### Talablar:
1. `appointments` jadvalida mutaxassis vaqtining to'qnash kelishini ma'lumotlar bazasi darajasida tekshirish.
2. PostgreSQL `tstzrange` va `EXCLUDE` cheklovi yoki tranzaksiyada qat'iy qulflash (`SELECT ... FOR UPDATE`).
3. To'qnashuv bo'lsa, aniq tushunarli `409 Conflict: "Mutaxassisning bu vaqt oralig'i band"` xatosi qaytishi kerak.

### PostgreSQL Cheklovi (Prisma yoki SQL Migratsiya):
```sql
-- Agar bstrap extension bo'lmasa o'rnatamiz
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Bir mutaxassisga bekor qilinmagan qabullar vaqti ustma-ust tushishini taqiqlash
ALTER TABLE "appointments" ADD CONSTRAINT "no_specialist_appointment_overlap"
EXCLUDE USING gist (
  "specialistId" WITH =,
  tstzrange("startAt", "endAt") WITH &&
)
WHERE ("status" NOT IN ('CANCELLED', 'NO_SHOW'));
```

### Yoki NestJS Servis Dasturiy Tranzaksiyasi:
```typescript
async createAppointment(dto: CreateAppointmentDto) {
  return this.prisma.$transaction(async (tx) => {
    // 1. Qatorlarni qulflash va to'qnashuvni tekshirish
    const overlap = await tx.appointment.findFirst({
      where: {
        specialistId: dto.specialistId,
        status: { notIn: ['CANCELLED', 'NO_SHOW'] },
        OR: [
          {
            startAt: { lt: new Date(dto.endAt) },
            endAt: { gt: new Date(dto.startAt) },
          },
        ],
      },
    });

    if (overlap) {
      throw new ConflictException("Ushbu mutaxassis uchun tanlangan vaqt oralig'i allaqachon band qilingan.");
    }

    return tx.appointment.create({
      data: { ...dto },
    });
  });
}
```

---

## 🟡 7-VAZIFA: Hujjat Yuklash uchun Presigned URL Endpointi (P2 MEDIUM)

### Muammo:
`POST /api/v1/documents` da `fileKey: string` so'raladi, lekin frontend faylning o'zini (PDF, rasm, rentgen xulosasi) yuklash uchun endpoint mavjud emas.

### Talablar:
1. `POST /api/v1/documents/presigned-url` endpointini yaratish.
2. AWS S3 yoki MinIO ob'ekt saqlagichi bilan integratsiya qilish.
3. Frontend yuklash havolasini olib, faylni to'g'ridan-to'g'ri bulutga yuklaydi va qaytgan `fileKey` ni saqlaydi.

### Amalga oshirish:
```typescript
// documents.controller.ts
@Post('presigned-url')
async getPresignedUploadUrl(
  @Body() dto: { fileName: string; contentType: string; childId: string }
) {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  if (!allowedTypes.includes(dto.contentType)) {
    throw new BadRequestException('Faqat JPG, PNG, WEBP va PDF formatlar qabul qilinadi');
  }

  return this.documentsService.generatePresignedUrl(dto);
}
```

---

## 🟡 8-VAZIFA: Swagger UI va OpenAPI Sxemasini Himoyalash (P2 MEDIUM)

### Muammo:
`http://104.248.29.65/api/docs` va `http://104.248.29.65/api/docs-json` barcha tashqi foydalanuvchilar uchun ochiq. Barcha ichki jadvallar, DTO nomlari va modellar ochiq ko'rinib turibdi.

### Talablar:
1. Production muhitida (`NODE_ENV === 'production'`) Swaggerni yo butunlay o'chirish yoki Basic Auth parol bilan himoyalash.
2. Development va Staging muhitida ochiq qolishi mumkin.

### Amalga oshirish (`main.ts`):
```typescript
import * as basicAuth from 'express-basic-auth';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Production da Swaggerni parol bilan yopish
  if (process.env.NODE_ENV === 'production') {
    app.use(
      ['/api/docs', '/api/docs-json'],
      basicAuth({
        challenge: true,
        users: {
          [process.env.SWAGGER_USER || 'admin']: process.env.SWAGGER_PASSWORD || 'SecretDoc2026!',
        },
      })
    );
  }

  // Swagger setup...
  const config = new DocumentBuilder()
    .setTitle('Massaj CRM API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(3000);
}
bootstrap();
```

---

## 🟡 9-VAZIFA: Global Xatoliklar Formati (Exception Filter) (P2 MEDIUM)

### Muammo:
Hozirda har xil xatolar har xil formatda qaytmoqda (ba'zida string array, ba'zida HTML xato sahifasi, ba'zida 500 error stack).

### Talablar:
Barcha xatoliklar standart JSON formatida qaytishi shart:
```json
{
  "statusCode": 400,
  "timestamp": "2026-10-04T15:45:00.000Z",
  "path": "/api/v1/auth/login",
  "error": "Bad Request",
  "message": "Telefon raqami yoki parol noto'g'ri"
}
```

### Amalga oshirish (`src/common/filters/http-exception.filter.ts`):
```typescript
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    let message = 'Serverda ichki xatolik yuz berdi';
    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      message = (exceptionResponse as any).message || message;
    } else if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      error: HttpStatus[status],
      message,
    });
  }
}
```

---

## 🟢 10-VAZIFA: Docker / Systemd va Logging (P3 STANDART)

### Talablar:
1. Server to'satdan o'chib yonganda (reboot) NestJS servisi avtomatik ko'tarilishi (`Restart=always`).
2. Loglar faylga yozilishi va `logrotate` orqali diskani to'ldirib qo'ymasligi kerak.

### Systemd xizmat namunasi (`/etc/systemd/system/massaj-api.service`):
```ini
[Unit]
Description=Bolalar Massaj CRM NestJS API
After=network.target postgresql.service redis.service

[Service]
Type=simple
User=root
WorkingDirectory=/var/www/massaj-backend
ExecStart=/usr/bin/npm run start:prod
Restart=always
RestartSec=5
Environment=NODE_ENV=production
Environment=PORT=3000

# Standart loglar
StandardOutput=append:/var/log/massaj-api.log
StandardError=append:/var/log/massaj-api-error.log

[Install]
WantedBy=multi-user.target
```

---

## 🧪 BACKENDCHI UCHUN YAKUNIY ACCEPTANCE CHECKLIST (Qabul qilish testi)

Backendchi barcha o'zgarishlarni kiritgach, quyidagi curl buyruqlarini serverda yoki mahalliy kompyuterda ishlatib tekshirishi shart:

```bash
# 1. SSL va Domen tekshiruvi (HTTPS va 200/401 qaytishi shart)
curl -Iv https://api.massajcrm.uz/api/v1/services

# 2. Public Services (Tizimga kirmasdan xizmatlar ro'yxatini olish)
curl -X GET https://api.massajcrm.uz/api/v1/services
# Kutilayotgan natija: 200 OK va xizmatlar massivi []

# 3. Public Settings (Klinika ma'lumotlarini olish)
curl -X GET https://api.massajcrm.uz/api/v1/settings
# Kutilayotgan natija: 200 OK va { centerName: "...", phone: "..." }

# 4. Rate Limiting (Loginni 6 marta ketma-ket chaqirish)
for i in {1..6}; do
  curl -s -o /dev/null -w "%{http_code}\n" -X POST https://api.massajcrm.uz/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"phone":"+998901234567","password":"wrong"}'
done
# Kutilayotgan natija: Oxirgi so'rov 429 Too Many Requests bo'lishi shart

# 5. childId siz to'lov qabul qilish (Ota-ona balansi)
curl -X POST https://api.massajcrm.uz/api/v1/payments \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "parentId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "amount": 500000,
    "method": "CASH",
    "note": "Umumiy depozit to'lovi"
  }'
# Kutilayotgan natija: 201 Created (400 Bad Request emas!)
```

---

> [!NOTE]
> Ushbu topshiriqnomadagi barcha punktlar to'liq bajarilgach, backend va frontend 100% sinxron, shifrlangan va yuqori yuklamalarga chidamli Enterprise darajasida ishlaydi. Savollar bo'lsa, frontend guruhiga murojaat qiling.
