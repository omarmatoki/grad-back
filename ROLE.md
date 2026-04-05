# دليل المشروع الشامل - منصة قياس الأثر الاجتماعي
> **اقرأ هذا الملف لفهم المشروع كاملاً:** كل جزئية، كل سيناريو، كل خطوة عمل، وكل جدول في قاعدة البيانات.

---

## فهرس المحتويات

1. [نظرة عامة على المشروع](#1-نظرة-عامة-على-المشروع)
2. [هيكل المشروع الكامل](#2-هيكل-المشروع-الكامل)
3. [كيف يبدأ التطبيق - سير التشغيل](#3-كيف-يبدأ-التطبيق---سير-التشغيل)
4. [طبقات المشروع - Layer Architecture](#4-طبقات-المشروع)
5. [قاعدة البيانات - شرح كل جدول](#5-قاعدة-البيانات---شرح-كل-جدول)
6. [سير عمل المصادقة والصلاحيات](#6-سير-عمل-المصادقة-والصلاحيات)
7. [الموديولات - شرح تفصيلي لكل موديول](#7-الموديولات---شرح-تفصيلي)
8. [سيناريوهات العمل الكاملة](#8-سيناريوهات-العمل-الكاملة)
9. [تكامل الذكاء الاصطناعي - n8n](#9-تكامل-الذكاء-الاصطناعي)
10. [نظام الاستجابات والأخطاء](#10-نظام-الاستجابات-والأخطاء)
11. [متغيرات البيئة والإعدادات](#11-متغيرات-البيئة-والإعدادات)
12. [Docker وبيئة التشغيل](#12-docker-وبيئة-التشغيل)

---

## 1. نظرة عامة على المشروع

### ما هو المشروع؟
منصة **قياس الأثر الاجتماعي** هي نظام متكامل لإدارة المشاريع الاجتماعية وقياس تأثيرها على المجتمع. تُمكّن المنظمات الاجتماعية من:
- إدارة مشاريعها ومتابعة تقدمها
- تسجيل المستفيدين والمشاركين
- إنشاء استبيانات وجمع البيانات
- قياس مؤشرات الأداء (KPIs)
- تحليل البيانات بالذكاء الاصطناعي

### التقنيات الأساسية

| التقنية | الدور |
|---------|-------|
| **NestJS** | إطار العمل الرئيسي - يوفر هيكل Modules/Controllers/Services |
| **TypeScript** | لغة البرمجة - تضيف أنواع البيانات (Types) لـ JavaScript |
| **MongoDB** | قاعدة البيانات - تخزين البيانات بصيغة JSON مرنة |
| **Mongoose** | يربط NestJS بـ MongoDB ويحدد شكل البيانات (Schema) |
| **JWT** | نظام التوثيق - يولّد رمزاً مشفراً يُثبت هوية المستخدم |
| **Passport.js** | مكتبة تدير استراتيجيات المصادقة (JWT في حالتنا) |
| **Swagger** | يولّد صفحة توثيق تفاعلية للـ API تلقائياً |
| **n8n** | منصة أتمتة تربط التطبيق بنماذج الذكاء الاصطناعي |
| **Docker** | يغلّف التطبيق في حاويات تعمل على أي جهاز |

---

## 2. هيكل المشروع الكامل

```
grad-back/
│
├── src/                          ← كل كود التطبيق هنا
│   ├── main.ts                   ← نقطة البداية الوحيدة للتطبيق
│   ├── app.module.ts             ← الموديول الجذر يجمع كل شيء
│   │
│   ├── config/                   ← إعدادات البيئة
│   │   ├── app.config.ts         ← المنفذ، CORS، معدل الطلبات
│   │   ├── database.config.ts    ← رابط MongoDB
│   │   ├── jwt.config.ts         ← مفاتيح وإعدادات JWT
│   │   └── n8n.config.ts         ← رابط خدمة الذكاء الاصطناعي
│   │
│   ├── common/                   ← أدوات مشتركة بين كل الموديولات
│   │   ├── decorators/
│   │   │   ├── roles.decorator.ts       ← @Roles() لتحديد من يدخل
│   │   │   ├── current-user.decorator.ts ← @CurrentUser() لجلب المستخدم
│   │   │   └── public.decorator.ts      ← @Public() للمسارات المفتوحة
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts        ← يتحقق من صحة JWT
│   │   │   └── roles.guard.ts           ← يتحقق من صلاحية الدور
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts ← يوحّد شكل رسائل الخطأ
│   │   ├── interceptors/
│   │   │   └── transform.interceptor.ts ← يوحّد شكل كل الاستجابات
│   │   └── interfaces/
│   │       └── request-user.interface.ts ← شكل بيانات المستخدم في الـ Request
│   │
│   ├── database/
│   │   └── seeders/              ← بيانات أولية لاختبار التطبيق
│   │       ├── seed.ts           ← نقطة تشغيل الـ Seeder
│   │       └── database.seeder.ts ← يملأ قاعدة البيانات ببيانات تجريبية
│   │
│   └── modules/                  ← الوحدات الوظيفية للتطبيق
│       ├── auth/                 ← تسجيل الدخول والتوثيق
│       ├── users/                ← إدارة المستخدمين
│       ├── projects/             ← إدارة المشاريع
│       ├── beneficiaries/        ← إدارة المستفيدين
│       ├── activities/           ← إدارة الأنشطة والفعاليات
│       ├── participants/         ← إدارة المشاركين
│       ├── surveys/              ← الاستبيانات والأسئلة والردود
│       ├── indicators/           ← مؤشرات الأداء KPIs
│       ├── analysis/             ← تحليل الذكاء الاصطناعي
│       └── dashboard/            ← لوحة الإحصائيات
│
├── dist/                         ← الكود المُترجم (لا تعدل هنا)
├── docker-compose.yml            ← تعريف خدمات Docker
├── Dockerfile                    ← وصفة بناء صورة Docker
├── .env                          ← متغيرات البيئة السرية
└── package.json                  ← تبعيات المشروع والأوامر
```

### كل موديول يحتوي على نفس الهيكل:
```
modules/[اسم]/
├── [اسم].module.ts      ← يُعرّف الموديول ويربط المكونات
├── [اسم].controller.ts  ← يستقبل طلبات HTTP ويحدد المسارات
├── [اسم].service.ts     ← منطق العمل الفعلي (Business Logic)
├── schemas/             ← شكل البيانات في قاعدة البيانات
└── dto/                 ← شكل البيانات القادمة من المستخدم
```

---

## 3. كيف يبدأ التطبيق - سير التشغيل

### الخطوات من `npm run start:dev` حتى استقبال أول طلب:

```
1. Node.js يقرأ src/main.ts
        ↓
2. NestFactory.create(AppModule) ← يبني كل الموديولات
        ↓
3. إعداد الأدوات العالمية:
   ├── helmet()           ← يضيف ترويسات أمان HTTP
   ├── compression()      ← يضغط الاستجابات
   ├── enableCors()       ← يسمح للـ Frontend بالاتصال
   ├── ValidationPipe     ← يتحقق من كل البيانات الواردة
   ├── JwtAuthGuard       ← يحمي كل المسارات افتراضياً
   ├── RolesGuard         ← يتحقق من الصلاحيات
   ├── HttpExceptionFilter ← يوحد رسائل الخطأ
   └── TransformInterceptor ← يوحد شكل الاستجابات
        ↓
4. تهيئة Swagger على /api/docs
        ↓
5. app.listen(3000) ← التطبيق جاهز لاستقبال الطلبات
```

### ماذا يحدث عند وصول طلب HTTP؟

```
الطلب يصل ←──────────────────────────────────────────┐
        ↓                                              │
[JwtAuthGuard]                                         │
├── هل المسار عليه @Public()؟                          │
│   نعم → تجاوز التحقق                                 │
│   لا  → تحقق من رمز JWT في الترويسة                  │
│         ├── رمز غير موجود أو منتهي → 401 Unauthorized │
│         └── رمز صحيح → جلب بيانات المستخدم من DB     │
        ↓                                              │
[RolesGuard]                                           │
├── هل المسار عليه @Roles()؟                           │
│   لا  → تجاوز                                        │
│   نعم → هل دور المستخدم في القائمة؟                  │
│         لا  → 403 Forbidden                          │
│         نعم → المتابعة                               │
        ↓                                              │
[ValidationPipe]                                       │
├── تحقق من البيانات المرسلة (DTO)                     │
│   خطأ → 400 Bad Request مع تفاصيل الخطأ              │
│   صحيح → المتابعة                                    │
        ↓                                              │
[Controller] ← يستقبل الطلب ويمرره للـ Service         │
        ↓                                              │
[Service] ← يُنفذ منطق العمل                           │
        ↓                                              │
[MongoDB] ← يحفظ أو يجلب البيانات                      │
        ↓                                              │
[TransformInterceptor] ← يُغلّف النتيجة               │
        ↓                                              │
الاستجابة تعود للمستخدم ──────────────────────────────┘
```

---

## 4. طبقات المشروع

### أ. طبقة الإعداد (Config Layer)
ملفات `src/config/` تقرأ متغيرات `.env` وتُصدرها بشكل منظم:

```typescript
// database.config.ts
MONGODB_URI=mongodb://localhost:27017/social-impact-platform

// jwt.config.ts
JWT_SECRET=...         // مفتاح تشفير Access Token (7 أيام)
JWT_REFRESH_SECRET=... // مفتاح تشفير Refresh Token (30 يوم)

// n8n.config.ts
N8N_WEBHOOK_URL=...    // رابط n8n لإرسال النصوص للتحليل
N8N_TIMEOUT=60000      // مهلة 60 ثانية للانتظار

// app.config.ts
PORT=3000
CORS_ORIGIN=http://localhost:3001  // عنوان الـ Frontend
THROTTLE_LIMIT=100     // أقصى 100 طلب في الدقيقة
```

### ب. طبقة الأدوات المشتركة (Common Layer)

#### المزخرفات (Decorators)
```typescript
@Public()
// يضع علامة على المسار أنه لا يحتاج JWT
// مثال: تسجيل الدخول، التسجيل

@Roles(UserRole.ADMIN)
// يُحدد أن هذا المسار للمدير فقط
// يعمل مع RolesGuard

@CurrentUser()
// يسحب بيانات المستخدم من الـ Request مباشرة
// بدلاً من req.user
```

#### الحراس (Guards)
```
JwtAuthGuard:
├── يقرأ ترويسة: Authorization: Bearer {token}
├── يُحلل الـ JWT ويتحقق منه
├── يجلب المستخدم من قاعدة البيانات
└── يضع بياناته في req.user

RolesGuard:
├── يقرأ الأدوار المطلوبة من @Roles()
├── يقارنها بـ req.user.role
└── يسمح أو يرفض الدخول
```

#### المرشح (Filter)
```typescript
// HttpExceptionFilter يحول كل خطأ إلى هذا الشكل:
{
  "statusCode": 404,
  "message": "المورد غير موجود",
  "error": "Not Found",
  "timestamp": "2024-01-18T12:00:00.000Z",
  "path": "/api/v1/projects/123"
}
```

#### المعترض (Interceptor)
```typescript
// TransformInterceptor يحول كل استجابة ناجحة إلى هذا الشكل:
{
  "statusCode": 200,
  "message": "تمت العملية بنجاح",
  "data": { ... النتيجة الفعلية ... },
  "timestamp": "2024-01-18T12:00:00.000Z"
}
```

---

## 5. قاعدة البيانات - شرح كل جدول

### مخطط العلاقات العامة
```
User ──────┬── يملك ──────→ Project
           │                    │
           └── عضو في ──────────┤
                                ├── له ──→ Beneficiary
                                │              │
                                ├── له ──→ Activity ←── يُسجّل ── Participant
                                │                                       │
                                ├── له ──→ Survey                       │
                                │            ├── له ──→ Question        │
                                │            └── له ──→ Response ←──────┘
                                │                          └── له ──→ Answer
                                │                                    └── له ──→ TextAnalysis
                                │                                                   └── مرتبط بـ ──→ Topic
                                └── له ──→ Indicator
                                              └── له ──→ IndicatorHistory
```

---

### جدول 1: المستخدمون (users)

**الغرض:** تخزين حسابات كل من يستخدم المنصة.

```
الحقل               | النوع    | الشرح
--------------------|----------|--------------------------------------------------
_id                 | ObjectId | معرف فريد يولّده MongoDB تلقائياً
name                | String   | الاسم الكامل (مطلوب)
email               | String   | البريد الإلكتروني (فريد، بالأحرف الصغيرة)
password            | String   | كلمة المرور مُشفرة بـ bcrypt (لا تظهر في الردود)
role                | Enum     | admin | staff | viewer (الافتراضي: viewer)
status              | Enum     | active | inactive | suspended (الافتراضي: active)
phone               | String   | رقم الهاتف (اختياري)
organization        | String   | اسم المنظمة (اختياري)
department          | String   | القسم (اختياري)
lastLoginAt         | Date     | آخر وقت دخول (يتحدث عند كل تسجيل دخول)
emailVerified       | Boolean  | هل تم التحقق من البريد (الافتراضي: false)
refreshToken        | String   | رمز التحديث المحفوظ (للتحقق عند التجديد)
createdAt           | Date     | تاريخ الإنشاء (تلقائي)
updatedAt           | Date     | تاريخ آخر تعديل (تلقائي)
```

**الأدوار وصلاحياتها:**
```
admin  → يرى كل شيء، ينشئ/يعدل/يحذف كل شيء، يدير المستخدمين
staff  → ينشئ أنشطة ومستفيدين، يسجل حضور، لا يدير المستخدمين
viewer → قراءة فقط، لا ينشئ ولا يحذف
```

**الفهارس (Indexes):**
- `email` ← بحث سريع عند تسجيل الدخول
- `role` ← تصفية حسب الدور
- `status` ← تصفية حسب الحالة
- `createdAt` ← ترتيب زمني

---

### جدول 2: المشاريع (projects)

**الغرض:** تخزين المشاريع الاجتماعية التي تديرها المنظمة.

```
الحقل               | النوع       | الشرح
--------------------|-------------|--------------------------------------------------
_id                 | ObjectId    | معرف فريد
name                | String      | اسم المشروع (مطلوب)
description         | String      | وصف تفصيلي
type                | Enum        | نوع المشروع:
                    |             |   needs_assessment = تقييم احتياجات
                    |             |   intervention = تدخل مباشر
                    |             |   evaluation = تقييم برنامج
                    |             |   mixed = مختلط
status              | Enum        | draft | active | completed | archived
owner               | Ref→User    | مالك المشروع (يُضاف تلقائياً من المستخدم الحالي)
team                | [Ref→User]  | قائمة أعضاء الفريق
startDate           | Date        | تاريخ البداية
endDate             | Date        | تاريخ النهاية
location            | String      | الموقع الجغرافي
targetGroups        | [String]    | الفئات المستهدفة
budget.total        | Number      | الميزانية الإجمالية
budget.currency     | String      | العملة (الافتراضي: SAR)
budget.spent        | Number      | المبلغ المُنفق
goals.short_term    | [String]    | الأهداف قصيرة المدى
goals.long_term     | [String]    | الأهداف بعيدة المدى
tags                | [String]    | وسوم للتصنيف
```

**الفهارس:**
- `owner` ← جلب مشاريع مالك معين
- `status` ← تصفية النشطة/المكتملة
- `type` ← تصفية حسب النوع
- `startDate` ← ترتيب زمني
- `text` على (name, description) ← بحث نصي

---

### جدول 3: المستفيدون (beneficiaries)

**الغرض:** الفئات أو المناطق أو الأشخاص الذين يستفيدون من المشروع.

```
الحقل               | النوع    | الشرح
--------------------|----------|--------------------------------------------------
_id                 | ObjectId | معرف فريد
project             | Ref→Project | المشروع المرتبط به
beneficiaryType     | Enum     | person = شخص فرد
                    |          | area = منطقة جغرافية
                    |          | group = مجموعة/شريحة
name                | String   | اسم المستفيد أو المنطقة أو المجموعة
city                | String   | المدينة
region              | String   | المنطقة/المحافظة
populationSize      | Number   | عدد الأفراد في هذه الفئة
notes               | String   | ملاحظات إضافية
```

**ملاحظة مهمة:** المستفيد (Beneficiary) يختلف عن المشارك (Participant):
- **المستفيد** = الفئة المستهدفة (مثل: "أطفال حي الربوة")
- **المشارك** = شخص فعلي سجّل في نشاط (مثال: "محمد أحمد، عمره 12 سنة")

---

### جدول 4: الأنشطة (activities)

**الغرض:** الفعاليات والأنشطة الميدانية للمشروع.

```
الحقل               | النوع       | الشرح
--------------------|-------------|--------------------------------------------------
_id                 | ObjectId    | معرف فريد
project             | Ref→Project | المشروع المرتبط
title               | String      | عنوان النشاط
description         | String      | وصف تفصيلي
activityDate        | Date        | تاريخ النشاط
startTime           | String      | وقت البداية بصيغة "HH:mm"
endTime             | String      | وقت النهاية بصيغة "HH:mm"
location            | String      | مكان الانعقاد
capacity            | Number      | الطاقة الاستيعابية القصوى
registeredCount     | Number      | عدد المسجلين (يتحدث آلياً)
attendedCount       | Number      | عدد الحضور الفعلي
speaker             | String      | المتحدث أو المدرب
activityType        | Enum        | training = تدريب
                    |             | workshop = ورشة عمل
                    |             | seminar = ندوة
                    |             | consultation = استشارة
                    |             | field_visit = زيارة ميدانية
                    |             | awareness_campaign = حملة توعية
                    |             | service_delivery = تقديم خدمة
                    |             | other = أخرى
status              | Enum        | planned | in_progress | completed | cancelled
```

**الحقول المحسوبة (Virtuals - لا تُحفظ في DB):**
```
isFull         = registeredCount >= capacity
availableSpots = capacity - registeredCount
```

**القواعد التجارية:**
- لا يمكن تسجيل أكثر من الطاقة الاستيعابية
- endTime يجب أن يكون بعد startTime
- attendedCount لا يمكن أن يتجاوز registeredCount

---

### جدول 5: المشاركون (participants)

**الغرض:** الأشخاص الفعليون الذين يشاركون في الأنشطة مع تفاصيلهم وتقييماتهم.

```
الحقل                 | النوع          | الشرح
----------------------|----------------|--------------------------------------------------
_id                   | ObjectId       | معرف فريد
beneficiary           | Ref→Beneficiary| المستفيد المرتبط به
project               | Ref→Project    | المشروع
fullName              | String         | الاسم الكامل
email                 | String         | البريد الإلكتروني
phone                 | String         | رقم الهاتف
nationalId            | String         | رقم الهوية
age                   | Number         | العمر
gender                | Enum           | male | female
educationLevel        | String         | المستوى التعليمي
occupation            | String         | المهنة
city                  | String         | المدينة
participationType     | Enum           | full_time | part_time | online | in_person | hybrid
registrationDate      | Date           | تاريخ التسجيل
attendanceSessions    | Number         | عدد الجلسات التي حضرها فعلاً
totalSessions         | Number         | إجمالي عدد الجلسات في البرنامج
attendanceRate        | Number         | نسبة الحضور (محسوبة تلقائياً)
preAssessmentScore    | Number         | درجة التقييم القبلي (0-100)
postAssessmentScore   | Number         | درجة التقييم البعدي (0-100)
improvementPercentage | Number         | نسبة التحسن (محسوبة تلقائياً)
status                | Enum           | active | completed | dropped | pending
```

**الحسابات التلقائية (Pre-save Middleware):**
```
attendanceRate        = (attendanceSessions / totalSessions) × 100
improvementPercentage = ((postAssessmentScore - preAssessmentScore) / preAssessmentScore) × 100
```

---

### جدول 6: مشاركو الأنشطة (activity_participants)

**الغرض:** ربط المشاركين بالأنشطة مع تفاصيل حضورهم في كل نشاط.

```
الحقل                 | النوع           | الشرح
----------------------|-----------------|--------------------------------------------------
_id                   | ObjectId        | معرف فريد
activity              | Ref→Activity    | النشاط
participant           | Ref→Participant | المشارك
attendanceStatus      | Enum            | present | absent | excused | late
checkInTime           | Date            | وقت الحضور
checkOutTime          | Date            | وقت الانصراف
engagementLevel       | Number          | مستوى التفاعل (1-10)
participationScore    | Number          | درجة المشاركة
feedback              | String          | تعليق المشارك
satisfactionRating    | Number          | تقييم الرضا (1-5)
preAssessmentScore    | Number          | درجة ما قبل النشاط
postAssessmentScore   | Number          | درجة ما بعد النشاط
certificate           | Boolean         | هل حصل على شهادة؟
```

**قيد التفرد:** لا يمكن أن يُسجّل نفس المشارك في نفس النشاط مرتين.

---

### جدول 7: الاستبيانات (surveys)

**الغرض:** نماذج جمع البيانات من المستفيدين لقياس الاحتياجات أو التأثير.

```
الحقل                  | النوع       | الشرح
-----------------------|-------------|--------------------------------------------------
_id                    | ObjectId    | معرف فريد
title                  | String      | عنوان الاستبيان
description            | String      | وصف الغرض منه
type                   | Enum        | needs_assessment = تقييم احتياجات (قبل المشروع)
                       |             | pre_evaluation = تقييم قبلي (قبل البرنامج)
                       |             | post_evaluation = تقييم بعدي (بعد البرنامج)
                       |             | satisfaction = قياس رضا المستفيدين
                       |             | feedback = جمع آراء
                       |             | custom = مخصص
status                 | Enum        | draft | active | closed | archived
project                | Ref→Project | المشروع
activity               | Ref→Activity| النشاط المرتبط (اختياري)
startDate              | Date        | تاريخ فتح الاستبيان
endDate                | Date        | تاريخ إغلاقه
isAnonymous            | Boolean     | هل الإجابات مجهولة الهوية؟
allowMultipleResponses | Boolean     | هل يُسمح بالإجابة أكثر من مرة؟
welcomeMessage         | String      | رسالة ترحيب تظهر في البداية
thankYouMessage        | String      | رسالة شكر تظهر في النهاية
targetResponses        | Number      | العدد المستهدف من الردود
totalResponses         | Number      | عدد الردود الفعلية
settings.showProgressBar      | Boolean | إظهار شريط التقدم
settings.randomizeQuestions   | Boolean | ترتيب عشوائي للأسئلة
settings.requiredCompletion   | Boolean | يجب إكمال كل الأسئلة
settings.language             | String  | لغة الاستبيان
```

---

### جدول 8: أسئلة الاستبيان (survey_questions)

**الغرض:** الأسئلة المكوّنة لكل استبيان.

```
الحقل         | النوع        | الشرح
--------------|--------------|--------------------------------------------------
survey        | Ref→Survey   | الاستبيان المرتبط
questionText  | String       | نص السؤال
order         | Number       | ترتيب السؤال في القائمة
type          | Enum         | text = إجابة نصية قصيرة
              |              | textarea = إجابة نصية طويلة
              |              | number = رقم
              |              | email = بريد إلكتروني
              |              | phone = هاتف
              |              | date = تاريخ
              |              | single_choice = اختيار واحد
              |              | multiple_choice = اختيارات متعددة
              |              | dropdown = قائمة منسدلة
              |              | rating = تقييم بالنجوم
              |              | scale = مقياس رقمي (1-10 مثلاً)
              |              | matrix = جدول أسئلة
              |              | file_upload = رفع ملف
              |              | yes_no = نعم/لا
isRequired    | Boolean      | هل الإجابة إجبارية؟
options       | [String]     | خيارات الإجابة (للأسئلة ذات الخيارات)
validation    | Object       | {min, max, minLength, maxLength, pattern}
ratingConfig  | Object       | {min, max, minLabel, maxLabel, step}
conditional   | Object       | {dependsOn: SurveyQuestion, showIf: value}
              |              | يُظهر السؤال فقط إذا كانت إجابة سؤال آخر = قيمة معينة
```

---

### جدول 9: ردود الاستبيان (survey_responses)

**الغرض:** تسجيل كل مرة يملأ فيها شخص استبياناً.

```
الحقل                | النوع          | الشرح
---------------------|----------------|--------------------------------------------------
survey               | Ref→Survey     | الاستبيان
beneficiary          | Ref→Beneficiary| المستفيد (إذا كان استبيان مجموعة)
participant          | Ref→Participant | المشارك الفرد
status               | Enum           | in_progress | completed | abandoned
startedAt            | Date           | وقت بدء ملء الاستبيان
completedAt          | Date           | وقت الإنهاء
timeSpent            | Number         | الوقت بالثواني
completionPercentage | Number         | نسبة الإكمال (0-100)
ipAddress            | String         | عنوان IP (للتتبع)
userAgent            | String         | بيانات المتصفح
metadata.deviceType  | String         | mobile | tablet | desktop
metadata.browser     | String         | نوع المتصفح
metadata.os          | String         | نظام التشغيل
```

---

### جدول 10: إجابات الاستبيان (survey_answers)

**الغرض:** الإجابة الفعلية لكل سؤال في كل رد.

```
الحقل          | النوع            | الشرح
---------------|------------------|--------------------------------------------------
surveyResponse | Ref→SurveyResponse | الرد المرتبط
question       | Ref→SurveyQuestion | السؤال
valueType      | Enum             | text | number | boolean | date | array | object
textValue      | String           | الإجابة النصية
numberValue    | Number           | الإجابة الرقمية
booleanValue   | Boolean          | إجابة نعم/لا
dateValue      | Date             | إجابة التاريخ
arrayValue     | [Mixed]          | الإجابات المتعددة
objectValue    | Object           | الإجابة المركبة (Matrix)
isSkipped      | Boolean          | هل تجاوز المستخدم هذا السؤال؟
timeSpent      | Number           | الوقت الذي قضاه في هذا السؤال (بالثواني)
```

---

### جدول 11: مؤشرات الأداء (indicators)

**الغرض:** قياس تقدم المشروع نحو أهدافه بمؤشرات كمية.

```
الحقل              | النوع       | الشرح
-------------------|-------------|--------------------------------------------------
project            | Ref→Project | المشروع
name               | String      | اسم المؤشر (مثل: "عدد المستفيدين")
description        | String      | شرح المؤشر
indicatorType      | Enum        | input = مدخلات (موارد مستخدمة)
                   |             | output = مخرجات (نتائج مباشرة)
                   |             | outcome = نتائج (تأثير قصير المدى)
                   |             | impact = أثر (تغيير بعيد المدى)
                   |             | process = عمليات (كفاءة التنفيذ)
                   |             | custom = مخصص
targetValue        | Number      | القيمة المستهدفة
actualValue        | Number      | القيمة الفعلية الحالية
unit               | Enum        | number | percentage | currency | hours | days | score | rating
calculationFormula | String      | معادلة الحساب (اختيارية)
baselineValue      | Number      | القيمة الأساسية قبل المشروع
trend              | Enum        | improving | stable | declining | no_data
thresholds.critical   | Number  | حد الخطر (أقل من X يعني مشكلة)
thresholds.warning    | Number  | حد التحذير
thresholds.good       | Number  | مستوى جيد
thresholds.excellent  | Number  | مستوى ممتاز
frequency          | String      | تكرار القياس (يومي/أسبوعي/شهري)
isActive           | Boolean     | هل المؤشر نشط؟
```

**الحقل المحسوب (Getter):**
```
achievementRate = (actualValue / targetValue) × 100
// مثال: هدف 1000 شخص، حققنا 750 → achievementRate = 75%
```

**منطق حساب الاتجاه (Trend):**
```
يُحسب من آخر 5 قياسات في السجل:
- إذا كان المعدل يرتفع → improving
- إذا كان ثابتاً (تغيير < 5%) → stable
- إذا كان ينخفض → declining
- إذا لا توجد بيانات كافية → no_data
```

---

### جدول 12: سجل المؤشرات (indicator_histories)

**الغرض:** حفظ كل قياس يتم تسجيله للمؤشر مع مرور الوقت.

```
الحقل              | النوع         | الشرح
-------------------|---------------|--------------------------------------------------
indicator          | Ref→Indicator | المؤشر المرتبط
recordedValue      | Number        | القيمة المسجلة في هذا الوقت
calculatedAt       | Date          | وقت التسجيل
source             | String        | مصدر البيانات (استبيان/تقرير/يدوي)
previousValue      | Number        | القيمة السابقة قبل هذا التسجيل
changeAmount       | Number        | مقدار التغيير (+ أو -)
changePercentage   | Number        | نسبة التغيير
status             | Enum          | recorded | verified | adjusted | deleted
verifiedBy         | Ref→User      | من تحقق من صحة هذه القيمة
notes              | String        | ملاحظات
```

---

### جدول 13: تحليلات النصوص (text_analyses)

**الغرض:** نتائج تحليل الذكاء الاصطناعي للنصوص المفتوحة.

```
الحقل              | النوع           | الشرح
-------------------|-----------------|--------------------------------------------------
project            | Ref→Project     | المشروع
surveyAnswer       | Ref→SurveyAnswer| الإجابة النصية التي جرى تحليلها
originalText       | String          | النص الأصلي
cleanedText        | String          | النص بعد التنظيف
sentiment          | Enum            | very_negative | negative | neutral | positive | very_positive
sentimentScore     | Number          | درجة المشاعر من -1 (سلبي جداً) إلى +1 (إيجابي جداً)
keywords           | [String]        | الكلمات المفتاحية المستخرجة
entities           | [Object]        | الكيانات: أشخاص، أماكن، منظمات
themes             | [String]        | المواضيع الرئيسية
emotions.joy       | Number          | نسبة الفرح (0-1)
emotions.sadness   | Number          | نسبة الحزن
emotions.anger     | Number          | نسبة الغضب
emotions.fear      | Number          | نسبة الخوف
emotions.trust     | Number          | نسبة الثقة
summary            | String          | ملخص النص
actionItems        | [String]        | إجراءات مقترحة
status             | Enum            | pending | processing | completed | failed
```

---

### جدول 14: المواضيع (topics)

**الغرض:** المواضيع المتكررة المستخرجة من تحليل النصوص.

```
الحقل          | النوع       | الشرح
---------------|-------------|--------------------------------------------------
project        | Ref→Project | المشروع
name           | String      | اسم الموضوع
keywords       | [String]    | الكلمات المرتبطة بهذا الموضوع
frequency      | Number      | عدد مرات الظهور في النصوص
relevanceScore | Number      | درجة الأهمية (0-1)
overallSentiment | String    | المشاعر العامة تجاه هذا الموضوع
averageSentiment | Number    | متوسط درجة المشاعر
statistics.totalMentions  | Number | إجمالي الإشارات
statistics.uniqueSources  | Number | عدد المصادر المختلفة
statistics.firstSeenAt    | Date   | أول ظهور
statistics.lastSeenAt     | Date   | آخر ظهور
```

**قيد التفرد:** لا يمكن أن يتكرر اسم نفس الموضوع في نفس المشروع.

---

### جدول 15: ربط النصوص بالمواضيع (text_topics)

**الغرض:** جدول الربط بين تحليل نص معين وموضوع معين (علاقة كثير إلى كثير).

```
textAnalysis | Ref→TextAnalysis | النص المحلَّل
topic        | Ref→Topic        | الموضوع
relevance    | Number           | مدى ارتباط هذا النص بالموضوع (0-1)
confidence   | Number           | درجة ثقة النموذج (0-1)
mentionedKeywords | [String]    | الكلمات المفتاحية التي ظهرت
mentionCount | Number           | عدد مرات ذكر الموضوع في هذا النص
excerpt      | String           | مقتطف من النص يتضمن الموضوع
```

---

## 6. سير عمل المصادقة والصلاحيات

### خطوة 1: التسجيل (Register)

```
المستخدم يرسل:
POST /api/v1/auth/register
{
  "name": "أحمد علي",
  "email": "ahmed@example.com",
  "password": "SecurePassword123!"
}

ما يحدث داخلياً:
1. ValidationPipe يتحقق من البيانات (بريد صحيح؟ كلمة مرور 8 أحرف+؟)
2. AuthService.register() يُستدعى
3. يتحقق إذا البريد مسجل مسبقاً → 409 Conflict إذا نعم
4. bcrypt.hash(password, 10) ← يُشفر كلمة المرور
5. يُنشئ مستخدم جديد بدور VIEWER افتراضياً
6. يُرجع بيانات المستخدم (بدون كلمة المرور)
```

### خطوة 2: تسجيل الدخول (Login)

```
المستخدم يرسل:
POST /api/v1/auth/login
{
  "email": "ahmed@example.com",
  "password": "SecurePassword123!"
}

ما يحدث داخلياً:
1. AuthService.login() يستدعي validateUser()
2. UsersService.findByEmail() ← يجلب المستخدم مع كلمة المرور
3. bcrypt.compare(inputPassword, hashedPassword) ← يتحقق من كلمة المرور
4. يُحدّث lastLoginAt
5. generateTokens() ينشئ:
   ├── accessToken: JWT ينتهي بعد 7 أيام
   │   payload: { _id, email, role }
   └── refreshToken: JWT يُخزن في DB، ينتهي بعد 30 يوم

الرد:
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": { "name": "أحمد علي", "role": "viewer", ... }
}
```

### خطوة 3: استخدام التوكن

```
كل طلب محمي:
GET /api/v1/projects
Headers:
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

ما يحدث:
1. JwtAuthGuard يقرأ الترويسة
2. يُحلل JWT ويتحقق من التوقيع
3. يستخرج { _id, email, role } من الـ payload
4. يجلب المستخدم الكامل من قاعدة البيانات
5. يضعه في req.user
6. المتابعة إلى الـ Controller
```

### خطوة 4: تجديد التوكن (Refresh)

```
عندما ينتهي accessToken:
POST /api/v1/auth/refresh
{
  "refreshToken": "eyJhbGc..."
}

ما يحدث:
1. يتحقق من صحة الـ refreshToken
2. يقارنه بالمخزون في DB
3. إذا صح → يُصدر accessToken جديد
4. إذا لا → 401 Unauthorized (يجب تسجيل الدخول مجدداً)
```

---

## 7. الموديولات - شرح تفصيلي

### موديول المصادقة (Auth Module)

**المسارات:**
```
POST /api/v1/auth/register    ← @Public() (لا يحتاج JWT)
POST /api/v1/auth/login       ← @Public()
POST /api/v1/auth/refresh     ← @Public()
GET  /api/v1/auth/profile     ← محمي (يحتاج JWT)
```

**ملاحظة:** كل المستخدمين الجدد يُسجلون بدور `viewer` تلقائياً. المدير فقط يستطيع رفع الدور إلى `staff` أو `admin`.

---

### موديول المستخدمين (Users Module)

**المسارات:**
```
POST   /api/v1/users       ← @Roles(ADMIN) فقط
GET    /api/v1/users       ← @Roles(ADMIN) فقط
GET    /api/v1/users/:id   ← أي مستخدم مسجل
PATCH  /api/v1/users/:id   ← @Roles(ADMIN) فقط
DELETE /api/v1/users/:id   ← @Roles(ADMIN) فقط
```

**عند إنشاء مستخدم:**
- يتحقق من عدم تكرار البريد الإلكتروني
- يُشفر كلمة المرور قبل الحفظ
- لا تظهر كلمة المرور في أي استجابة (`select: false`)

---

### موديول المشاريع (Projects Module)

**المسارات:**
```
POST   /api/v1/projects                         ← @Roles(ADMIN)
GET    /api/v1/projects                         ← مع فلترة: search, status, type, dateFrom, dateTo
GET    /api/v1/projects/my-projects             ← مشاريع المستخدم الحالي (مالك أو عضو)
GET    /api/v1/projects/:id                     ← تفاصيل مع populate للـ owner والـ team
GET    /api/v1/projects/:id/statistics          ← إحصائيات: مستفيدون، أنشطة، استبيانات
PATCH  /api/v1/projects/:id                     ← @Roles(ADMIN)
DELETE /api/v1/projects/:id                     ← @Roles(ADMIN)
POST   /api/v1/projects/:id/team/:memberId      ← @Roles(ADMIN) إضافة عضو
DELETE /api/v1/projects/:id/team/:memberId      ← @Roles(ADMIN) حذف عضو
```

**عند إنشاء مشروع:**
- يُضاف المستخدم الحالي تلقائياً كـ `owner`
- يُضاف أيضاً إلى قائمة `team`

---

### موديول الأنشطة (Activities Module)

**المسارات:**
```
POST  /api/v1/activities                    ← إنشاء
GET   /api/v1/activities                    ← كل الأنشطة
GET   /api/v1/activities/upcoming           ← الأنشطة القادمة (من اليوم فصاعداً)
GET   /api/v1/activities/statistics         ← إحصائيات: معدل حضور، استخدام الطاقة
GET   /api/v1/activities/project/:id        ← أنشطة مشروع معين
GET   /api/v1/activities/date-range         ← تصفية بنطاق تاريخ
GET   /api/v1/activities/:id               ← نشاط واحد
GET   /api/v1/activities/:id/report        ← تقرير تفصيلي
PATCH /api/v1/activities/:id               ← تعديل
DELETE /api/v1/activities/:id              ← حذف
POST  /api/v1/activities/:id/register      ← تسجيل مشارك (يزيد registeredCount)
POST  /api/v1/activities/:id/unregister    ← إلغاء تسجيل (يُنقص registeredCount)
PATCH /api/v1/activities/:id/attendance    ← تحديث عدد الحضور
PATCH /api/v1/activities/:id/capacity      ← تغيير الطاقة الاستيعابية
```

---

### موديول المشاركين (Participants Module)

**المسارات:**
```
POST  /api/v1/participants                          ← تسجيل مشارك جديد
GET   /api/v1/participants                          ← كل المشاركين
GET   /api/v1/participants/project/:id              ← مشاركو مشروع
GET   /api/v1/participants/beneficiary/:id          ← مشارك حسب مستفيد
GET   /api/v1/participants/project/:id/stats        ← إحصائيات: جنس، عمر، تحسن
GET   /api/v1/participants/:id                      ← مشارك واحد
GET   /api/v1/participants/:id/stats               ← إحصائيات مشارك واحد
PATCH /api/v1/participants/:id                      ← تعديل بيانات
DELETE /api/v1/participants/:id                     ← حذف
PATCH /api/v1/participants/:id/attendance           ← تحديث الحضور (يُعيد حساب النسبة)
POST  /api/v1/participants/:id/attendance/increment ← زيادة جلسة حضور واحدة
PATCH /api/v1/participants/:id/total-sessions       ← تعيين إجمالي الجلسات
PATCH /api/v1/participants/:id/assessment-scores    ← تحديث درجات التقييم
POST  /api/v1/participants/attendance/bulk-update   ← تحديث جماعي للحضور
```

---

### موديول الاستبيانات (Surveys Module)

**المسارات:**
```
POST   /api/v1/surveys                           ← إنشاء استبيان
GET    /api/v1/surveys                           ← كل الاستبيانات
GET    /api/v1/surveys/:id                       ← استبيان واحد
PATCH  /api/v1/surveys/:id                       ← تعديل
DELETE /api/v1/surveys/:id                       ← حذف (يحذف الأسئلة معه)
GET    /api/v1/surveys/:id/questions             ← الأسئلة مرتبة حسب order
GET    /api/v1/surveys/:id/analytics             ← تحليلات: إحصائيات كل سؤال
GET    /api/v1/surveys/:id/responses             ← كل الردود
POST   /api/v1/surveys/questions                 ← إضافة سؤال
PATCH  /api/v1/surveys/questions/:id             ← تعديل سؤال
DELETE /api/v1/surveys/questions/:id             ← حذف سؤال
POST   /api/v1/surveys/responses                 ← إرسال رد جديد
GET    /api/v1/surveys/responses/:id             ← رد واحد مع إجاباته
```

**عند إرسال رد:**
1. يتحقق من أن الاستبيان نشط (status = active)
2. يتحقق من الأسئلة الإلزامية
3. يُنشئ `SurveyResponse` ثم `SurveyAnswer` لكل سؤال
4. يُحدّث `totalResponses` في الاستبيان

---

### موديول المؤشرات (Indicators Module)

**المسارات:**
```
POST  /api/v1/indicators                        ← إنشاء مؤشر
GET   /api/v1/indicators                        ← كل المؤشرات
GET   /api/v1/indicators/statistics             ← إحصائيات حسب النوع
GET   /api/v1/indicators/count                  ← عدد المؤشرات
GET   /api/v1/indicators/off-track              ← مؤشرات دون الهدف
GET   /api/v1/indicators/project/:id            ← مؤشرات مشروع
GET   /api/v1/indicators/type/:type             ← حسب النوع
GET   /api/v1/indicators/trend/:trend           ← حسب الاتجاه
GET   /api/v1/indicators/:id                    ← مؤشر واحد
GET   /api/v1/indicators/:id/history            ← سجل القياسات
PATCH /api/v1/indicators/:id                    ← تعديل
DELETE /api/v1/indicators/:id                   ← حذف (يحذف السجل معه)
POST  /api/v1/indicators/:id/record-value       ← تسجيل قيمة جديدة
POST  /api/v1/indicators/:id/calculate-trend    ← إعادة حساب الاتجاه
POST  /api/v1/indicators/:id/calculate-from-formula ← حساب من المعادلة
```

---

### موديول التحليل (Analysis Module)

**المسارات:**
```
POST /api/v1/analysis/survey-responses   ← @Roles(ADMIN) تحليل ردود استبيان
POST /api/v1/analysis/impact-evaluation  ← @Roles(ADMIN) مقارنة قبل/بعد
POST /api/v1/analysis/needs-topics       ← @Roles(ADMIN) استخراج مواضيع
POST /api/v1/analysis/comprehensive      ← @Roles(ADMIN) تحليل شامل
GET  /api/v1/analysis/project/:id        ← جلب نتائج تحليلات مشروع
```

---

### موديول لوحة التحكم (Dashboard Module)

**المسارات:**
```
GET /api/v1/dashboard/stats   ← إحصائيات حسب دور المستخدم
```

**ما يُرجعه:**
```json
{
  "totalProjects": 12,
  "activeProjects": 5,
  "completedProjects": 4,
  "totalSurveys": 28,
  "totalBeneficiaries": 450,
  "totalResponses": 1200,
  "completionRate": 78.5,
  "impactScore": 0
}
```

**فلترة حسب الدور:**
```
admin  → يرى إحصائيات كل المشاريع
staff  → يرى إحصائيات المشاريع التي هو مالكها أو عضو فيها
viewer → يرى إحصائيات المشاريع التي هو عضو فيها
```

---

## 8. سيناريوهات العمل الكاملة

### السيناريو الأول: دورة حياة مشروع اجتماعي كامل

```
الخطوة 1: المدير يُنشئ المشروع
────────────────────────────────
POST /api/v1/projects
{
  "name": "برنامج تمكين الشباب",
  "type": "intervention",
  "status": "active",
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "location": "الرياض",
  "targetGroups": ["شباب 18-25"],
  "goals": {
    "short_term": ["تدريب 500 شاب"],
    "long_term": ["خفض البطالة في الفئة المستهدفة"]
  },
  "budget": { "total": 500000, "currency": "SAR" }
}
→ يُنشئ المشروع ويُضيف المدير كـ owner تلقائياً

الخطوة 2: إضافة أعضاء الفريق
────────────────────────────────
POST /api/v1/projects/{projectId}/team/{staffUserId}
→ يُضيف الموظف للفريق

الخطوة 3: تعريف المستفيدين
────────────────────────────────
POST /api/v1/beneficiaries
{
  "project": "{projectId}",
  "beneficiaryType": "group",
  "name": "شباب حي النسيم",
  "city": "الرياض",
  "region": "النسيم",
  "populationSize": 2000
}

الخطوة 4: إنشاء استبيان تقييم احتياجات
────────────────────────────────────────
POST /api/v1/surveys
{
  "title": "تقييم احتياجات الشباب",
  "type": "needs_assessment",
  "project": "{projectId}",
  "status": "active"
}

POST /api/v1/surveys/questions  ← إضافة الأسئلة
{
  "survey": "{surveyId}",
  "questionText": "ما أهم المهارات التي تحتاجها؟",
  "type": "multiple_choice",
  "options": ["برمجة", "تسويق", "مبيعات", "تصميم"],
  "isRequired": true,
  "order": 1
}

الخطوة 5: جمع البيانات من المستفيدين
───────────────────────────────────────
POST /api/v1/surveys/responses
{
  "survey": "{surveyId}",
  "beneficiary": "{beneficiaryId}",
  "answers": [
    { "question": "{q1Id}", "arrayValue": ["برمجة", "تسويق"] }
  ]
}

الخطوة 6: تحليل النتائج بالذكاء الاصطناعي
────────────────────────────────────────────
POST /api/v1/analysis/needs-topics
{
  "projectId": "{projectId}",
  "surveyId": "{surveyId}"
}
→ يُرسل النصوص لـ n8n → يستقبل المواضيع والمشاعر → يحفظها

الخطوة 7: إنشاء الأنشطة بناءً على الاحتياجات
──────────────────────────────────────────────
POST /api/v1/activities
{
  "project": "{projectId}",
  "title": "دورة البرمجة للمبتدئين",
  "activityType": "training",
  "activityDate": "2024-03-01",
  "startTime": "09:00",
  "endTime": "17:00",
  "capacity": 30,
  "location": "مركز التدريب - الرياض"
}

الخطوة 8: تسجيل المشاركين
────────────────────────────────
POST /api/v1/participants
{
  "project": "{projectId}",
  "beneficiary": "{beneficiaryId}",
  "fullName": "محمد أحمد",
  "age": 22,
  "gender": "male",
  "phone": "0501234567"
}

POST /api/v1/activities/{activityId}/register
← يزيد registeredCount بمقدار 1

الخطوة 9: إنشاء التقييم القبلي (Pre-Assessment)
──────────────────────────────────────────────────
POST /api/v1/surveys  ← نوع pre_evaluation
POST /api/v1/surveys/responses ← المشاركون يملؤونه

الخطوة 10: تسجيل الحضور بعد النشاط
──────────────────────────────────────
PATCH /api/v1/activities/{activityId}/attendance
{ "attendedCount": 28 }

PATCH /api/v1/participants/{participantId}/attendance
{ "attendanceSessions": 1, "totalSessions": 1 }
→ يحسب attendanceRate = 100%

الخطوة 11: التقييم البعدي (Post-Assessment)
─────────────────────────────────────────────
POST /api/v1/surveys  ← نوع post_evaluation
POST /api/v1/surveys/responses ← المشاركون يملؤونه

PATCH /api/v1/participants/{id}/assessment-scores
{ "preAssessmentScore": 45, "postAssessmentScore": 78 }
→ improvementPercentage = ((78-45)/45) × 100 = 73.3%

الخطوة 12: قياس مؤشرات الأداء
────────────────────────────────
POST /api/v1/indicators
{
  "project": "{projectId}",
  "name": "عدد المستفيدين المدربين",
  "indicatorType": "output",
  "targetValue": 500,
  "actualValue": 0,
  "unit": "number"
}

POST /api/v1/indicators/{id}/record-value
{ "recordedValue": 28, "source": "نتائج الدورة الأولى" }
→ actualValue يصبح 28، يُحسب الاتجاه

الخطوة 13: تحليل الأثر الشامل
────────────────────────────────
POST /api/v1/analysis/impact-evaluation
{ "projectId": "{projectId}" }
→ مقارنة pre/post surveys → تقرير شامل

الخطوة 14: مراجعة النتائج في لوحة التحكم
──────────────────────────────────────────
GET /api/v1/dashboard/stats
GET /api/v1/projects/{id}/statistics
```

---

### السيناريو الثاني: استبيان رضا بعد فعالية

```
1. موظف (staff) يُنشئ استبيان رضا:
   POST /api/v1/surveys
   { "type": "satisfaction", "activity": "{activityId}", "isAnonymous": true }

2. يُضيف أسئلة التقييم:
   - "كيف تقيّم المحتوى؟" → type: rating (1-5)
   - "هل حقق النشاط توقعاتك؟" → type: yes_no
   - "اقتراحاتك للتحسين؟" → type: textarea

3. المشاركون يملؤون الاستبيان:
   POST /api/v1/surveys/responses
   {
     "answers": [
       { "question": "{q1}", "numberValue": 4 },
       { "question": "{q2}", "booleanValue": true },
       { "question": "{q3}", "textValue": "أتمنى زيادة الوقت العملي" }
     ]
   }

4. الإجابات النصية تُرسل للتحليل:
   POST /api/v1/analysis/survey-responses
   → n8n يحلل "أتمنى زيادة الوقت العملي"
   → النتيجة: sentiment = positive, keywords = ["وقت عملي", "تحسين"]

5. المدير يرى التحليلات:
   GET /api/v1/surveys/{id}/analytics
   → متوسط التقييم: 4.2/5
   → 87% قالوا "نعم" للتوقعات
   → المواضيع: "الوقت العملي", "المحتوى", "المدرب"
```

---

### السيناريو الثالث: تتبع مؤشر الأداء شهرياً

```
المدير يُنشئ مؤشر:
POST /api/v1/indicators
{
  "name": "نسبة توظيف الخريجين",
  "indicatorType": "outcome",
  "targetValue": 60,          ← هدف: 60% من المتدربين يجدون وظيفة
  "actualValue": 0,
  "unit": "percentage",
  "baselineValue": 20,        ← قبل البرنامج كانت 20%
  "thresholds": {
    "critical": 30,           ← أقل من 30% = خطر
    "warning": 45,            ← أقل من 45% = تحذير
    "good": 55,               ← 55%+ = جيد
    "excellent": 65            ← 65%+ = ممتاز
  },
  "frequency": "monthly"
}

شهر يناير:
POST /api/v1/indicators/{id}/record-value
{ "recordedValue": 25, "source": "استبيان المتابعة - يناير" }
→ changeAmount = +5 من baseline

شهر فبراير:
POST /api/v1/indicators/{id}/record-value
{ "recordedValue": 35 }
→ trend يصبح: improving

شهر مارس:
POST /api/v1/indicators/{id}/record-value
{ "recordedValue": 52 }
→ achievementRate = 52/60 × 100 = 86.7%
→ trend: improving

GET /api/v1/indicators/{id}/history
→ يُظهر: 25 → 35 → 52 مع نسب التغيير

GET /api/v1/indicators/off-track
→ يُظهر المؤشرات التي لم تصل للهدف بعد
```

---

### السيناريو الرابع: تحليل البيانات بالذكاء الاصطناعي

```
عملية التحليل خطوة بخطوة:

1. المدير يطلب تحليل ردود استبيان:
   POST /api/v1/analysis/survey-responses
   { "surveyId": "{surveyId}", "projectId": "{projectId}" }

2. analysis.service.ts يجمع كل الإجابات النصية من DB

3. يُرسلها لـ n8n-ai.service.ts:
   POST {N8N_WEBHOOK_URL}
   {
     "type": "text_analysis",
     "texts": ["أتمنى التحسين...", "البرنامج مفيد جداً...", ...],
     "projectId": "..."
   }

4. n8n يُعالج النصوص عبر LLM (LLaMA أو GPT):
   - يُحدد المشاعر لكل نص
   - يستخرج الكلمات المفتاحية
   - يُصنّف المواضيع

5. n8n يُرجع النتائج:
   {
     "analyses": [
       {
         "text": "أتمنى التحسين...",
         "sentiment": "positive",
         "sentimentScore": 0.6,
         "keywords": ["تحسين", "جودة"],
         "themes": ["رضا جزئي"]
       }
     ],
     "topics": ["جودة التدريب", "الوقت", "المحتوى"]
   }

6. analysis.service.ts يحفظ في DB:
   - TextAnalysis ← لكل نص
   - Topic ← للمواضيع الجديدة
   - TextTopic ← الربط بينهما

7. المدير يرى النتائج:
   GET /api/v1/analysis/project/{projectId}
```

---

## 9. تكامل الذكاء الاصطناعي

### المعمارية الكاملة

```
┌─────────────┐    HTTP POST    ┌──────────┐    يُشغّل    ┌─────────────┐
│   NestJS    │ ─────────────→ │   n8n    │ ────────────→ │ LLM (LLaMA) │
│  Backend    │                │ Workflow │               │  أو GPT     │
└─────────────┘                └──────────┘               └─────────────┘
       ↑                            │
       └────────── النتائج ─────────┘
```

### إعدادات n8n (n8n.config.ts)
```
N8N_WEBHOOK_URL  = رابط webhook في n8n يستقبل الطلبات
N8N_API_KEY      = مفتاح API للمصادقة
N8N_TIMEOUT      = 60 ثانية (التحليل قد يأخذ وقتاً)
retryAttempts    = 3 محاولات عند الفشل
retryDelay       = 1000ms بين كل محاولة (Exponential Backoff)
```

### أنواع التحليل المدعومة

| النوع | الغرض | المدخلات | المخرجات |
|-------|--------|----------|----------|
| `text_analysis` | تحليل نص مفتوح | نصوص إجابات | مشاعر، كلمات مفتاحية، ملخص |
| `topic_extraction` | استخراج مواضيع | مجموعة نصوص | قائمة مواضيع + تكرارها |
| `impact_evaluation` | قياس الأثر | بيانات قبل/بعد | تقرير التغيير والتحسن |
| `comprehensive` | تحليل شامل | بيانات المشروع كله | تقرير متكامل |

### منطق إعادة المحاولة (Retry Logic)
```
المحاولة 1: إرسال الطلب
    ↓ فشل
انتظار 1 ثانية
    ↓
المحاولة 2: إعادة الإرسال
    ↓ فشل
انتظار 2 ثانية
    ↓
المحاولة 3: إعادة الإرسال
    ↓ فشل
رمي خطأ: "فشل التحليل بعد 3 محاولات"
```

---

## 10. نظام الاستجابات والأخطاء

### شكل الاستجابة الناجحة (200, 201)
```json
{
  "statusCode": 200,
  "message": "تمت العملية بنجاح",
  "data": {
    // النتيجة الفعلية هنا
  },
  "timestamp": "2024-01-18T12:00:00.000Z"
}
```

### أكواد الأخطاء الشائعة

| الكود | المعنى | السبب الشائع |
|-------|--------|--------------|
| `400` | Bad Request | بيانات غير صحيحة أو ناقصة |
| `401` | Unauthorized | لا يوجد JWT أو منتهي الصلاحية |
| `403` | Forbidden | الدور لا يملك الصلاحية |
| `404` | Not Found | المورد غير موجود في DB |
| `409` | Conflict | بيانات مكررة (مثل: بريد مستخدم سبق) |
| `429` | Too Many Requests | تجاوز حد الطلبات (100/دقيقة) |
| `500` | Internal Server Error | خطأ غير متوقع في السيرفر |

### شكل الخطأ
```json
{
  "statusCode": 404,
  "message": "المشروع غير موجود",
  "error": "Not Found",
  "timestamp": "2024-01-18T12:00:00.000Z",
  "path": "/api/v1/projects/invalid-id"
}
```

---

## 11. متغيرات البيئة والإعدادات

```env
# بيئة التشغيل
NODE_ENV=development          # أو production

# السيرفر
PORT=3000
API_PREFIX=api/v1             # كل المسارات تبدأ بـ /api/v1

# قاعدة البيانات
MONGODB_URI=mongodb://localhost:27017/social-impact-platform

# JWT - المصادقة
JWT_SECRET=your-super-secret-key-here
JWT_EXPIRATION=7d
JWT_REFRESH_SECRET=your-refresh-secret-here
JWT_REFRESH_EXPIRATION=30d

# الذكاء الاصطناعي
N8N_WEBHOOK_URL=http://localhost:5678/webhook/analyze-impact
N8N_API_KEY=your-n8n-api-key
N8N_TIMEOUT=60000             # 60 ثانية

# CORS - السماح للـ Frontend
CORS_ORIGIN=http://localhost:3001

# تحديد معدل الطلبات
THROTTLE_TTL=60               # نافذة زمنية 60 ثانية
THROTTLE_LIMIT=100            # أقصى 100 طلب في النافذة
```

---

## 12. Docker وبيئة التشغيل

### الخدمات الأربع

```yaml
social-impact-api:            # تطبيق NestJS
  port: 3000
  depends_on: mongodb
  environment: .env

mongodb:                      # قاعدة البيانات
  port: 27017
  volume: mongodb_data        # البيانات تبقى حتى بعد إيقاف الحاوية

social-impact-n8n:            # محرك الذكاء الاصطناعي
  port: 5678
  volume: n8n_data
  environment:
    WEBHOOK_URL: ...

social-impact-ollama:         # نموذج LLaMA محلي
  port: 11434
  volume: ollama_data         # النموذج محمّل محلياً
```

### أوامر التشغيل
```bash
# تطوير (مع hot reload)
npm run start:dev

# بناء للإنتاج
npm run build

# تشغيل الإنتاج
npm run start:prod

# تهيئة بيانات أولية
npm run seed

# تشغيل كل الخدمات بـ Docker
docker-compose up -d

# إيقاف الخدمات
docker-compose down
```

### البيانات التجريبية (Seed)
عند تشغيل `npm run seed`، يُنشئ النظام تلقائياً:
```
المستخدمون:
  admin@example.com / Admin123!     ← مدير النظام
  manager@example.com / Manager123! ← مدير مشروع
  viewer@example.com / Viewer123!   ← مشاهد

+ 3 مشاريع + 7 مستفيدين + 5 أنشطة + 6 مشاركين
+ 4 استبيانات + 11 سؤال + 5 ردود + 15 إجابة
+ 2 تحليلات + 2 مواضيع + 2 مؤشرات
```

---

## ملاحظات تقنية مهمة

### تسلسل التبعيات عند إنشاء البيانات
```
يجب أن يكون موجوداً أولاً:
User → Project → Beneficiary → Participant
                             → Activity → ActivityParticipant
             → Survey → SurveyQuestion → SurveyResponse → SurveyAnswer → TextAnalysis
             → Indicator → IndicatorHistory
```

### الحقول التي تُحسب تلقائياً (لا ترسلها)
```
attendanceRate        ← يُحسب من attendanceSessions/totalSessions
improvementPercentage ← يُحسب من pre/postAssessmentScore
achievementRate       ← يُحسب من actualValue/targetValue
isFull               ← يُحسب من registeredCount/capacity
availableSpots       ← يُحسب من capacity-registeredCount
trend                ← يُحسب من آخر 5 قياسات في التاريخ
```

### الحقول التي لا تظهر في الاستجابات أبداً
```
password             ← select: false في الـ Schema
refreshToken         ← لا يُرجع للأمان
```
