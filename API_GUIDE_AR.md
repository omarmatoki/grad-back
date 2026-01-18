# دليل استخدام API - باللغة العربية

## جدول المحتويات
1. [الإعداد الأولي](#الإعداد-الأولي)
2. [المستفيدون (Beneficiaries)](#المستفيدون-beneficiaries)
3. [الأنشطة (Activities)](#الأنشطة-activities)
4. [المشاركون (Participants)](#المشاركون-participants)
5. [المؤشرات (Indicators)](#المؤشرات-indicators)

---

## الإعداد الأولي

### 1. تشغيل المشروع:
```bash
npm run start:dev
```

### 2. الحصول على Token:

#### تسجيل مستخدم جديد:
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "أحمد محمد",
    "email": "ahmed@example.com",
    "password": "Test123456!",
    "role": "manager"
  }'
```

#### تسجيل الدخول:
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ahmed@example.com",
    "password": "Test123456!"
  }'
```

**الاستجابة:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "أحمد محمد",
    "email": "ahmed@example.com",
    "role": "manager"
  }
}
```

**احفظ الـ access_token لاستخدامه في جميع الطلبات التالية!**

---

## المستفيدون (Beneficiaries)

### إنشاء مستفيد جديد

#### مثال 1: شخص (Person)
```bash
curl -X POST http://localhost:3000/api/v1/beneficiaries \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "project": "PROJECT_ID",
    "beneficiaryType": "person",
    "name": "فاطمة أحمد",
    "city": "جدة",
    "region": "مكة المكرمة",
    "notes": "مستفيدة من برنامج التدريب المهني"
  }'
```

#### مثال 2: منطقة (Area)
```bash
curl -X POST http://localhost:3000/api/v1/beneficiaries \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "project": "PROJECT_ID",
    "beneficiaryType": "area",
    "name": "حي النهضة",
    "city": "الرياض",
    "region": "الوسطى",
    "populationSize": 15000,
    "notes": "منطقة مستهدفة للتطوير الحضري"
  }'
```

#### مثال 3: مجموعة (Group)
```bash
curl -X POST http://localhost:3000/api/v1/beneficiaries \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "project": "PROJECT_ID",
    "beneficiaryType": "group",
    "name": "جمعية رواد الأعمال",
    "city": "الدمام",
    "region": "الشرقية",
    "populationSize": 250,
    "notes": "مجموعة من رواد الأعمال الشباب"
  }'
```

### جلب جميع المستفيدين
```bash
curl -X GET "http://localhost:3000/api/v1/beneficiaries" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### جلب مستفيدي مشروع معين
```bash
curl -X GET "http://localhost:3000/api/v1/beneficiaries/project/PROJECT_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### جلب المستفيدين حسب النوع
```bash
# الأشخاص فقط
curl -X GET "http://localhost:3000/api/v1/beneficiaries/type/person" \
  -H "Authorization: Bearer YOUR_TOKEN"

# المناطق فقط
curl -X GET "http://localhost:3000/api/v1/beneficiaries/type/area" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### جلب المستفيدين حسب الموقع
```bash
curl -X GET "http://localhost:3000/api/v1/beneficiaries/location?city=الرياض&region=الوسطى" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### إحصائيات المستفيدين
```bash
curl -X GET "http://localhost:3000/api/v1/beneficiaries/statistics" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**الاستجابة:**
```json
{
  "total": 150,
  "byType": {
    "person": 100,
    "area": 30,
    "group": 20
  }
}
```

---

## الأنشطة (Activities)

### إنشاء نشاط

#### مثال 1: ورشة عمل تدريبية
```bash
curl -X POST http://localhost:3000/api/v1/activities \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "project": "PROJECT_ID",
    "title": "ورشة عمل: مهارات القيادة",
    "description": "ورشة تدريبية متقدمة في تطوير مهارات القيادة الإدارية",
    "activityDate": "2026-02-20",
    "startTime": "09:00",
    "endTime": "15:00",
    "location": "قاعة المؤتمرات - الرياض",
    "capacity": 50,
    "speaker": "د. محمد العلي",
    "activityType": "WORKSHOP",
    "status": "PLANNED"
  }'
```

#### مثال 2: محاضرة توعوية
```bash
curl -X POST http://localhost:3000/api/v1/activities \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "project": "PROJECT_ID",
    "title": "محاضرة: ريادة الأعمال الاجتماعية",
    "description": "محاضرة توعوية عن أهمية المشاريع الاجتماعية",
    "activityDate": "2026-02-25",
    "startTime": "17:00",
    "endTime": "19:00",
    "location": "مركز الملك فهد الثقافي",
    "capacity": 200,
    "speaker": "أ. سارة أحمد",
    "activityType": "SEMINAR",
    "status": "PLANNED"
  }'
```

### جلب الأنشطة القادمة
```bash
curl -X GET "http://localhost:3000/api/v1/activities/upcoming" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### جلب أنشطة مشروع معين
```bash
curl -X GET "http://localhost:3000/api/v1/activities/project/PROJECT_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### جلب الأنشطة ضمن فترة زمنية
```bash
curl -X GET "http://localhost:3000/api/v1/activities/date-range?startDate=2026-02-01&endDate=2026-02-28" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### تسجيل مشارك في نشاط
```bash
curl -X POST "http://localhost:3000/api/v1/activities/ACTIVITY_ID/register" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "participantId": "PARTICIPANT_ID"
  }'
```

### تسجيل حضور المشاركين
```bash
curl -X PATCH "http://localhost:3000/api/v1/activities/ACTIVITY_ID/attendance" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "attendedCount": 45
  }'
```

### إحصائيات الأنشطة
```bash
# إحصائيات عامة
curl -X GET "http://localhost:3000/api/v1/activities/statistics" \
  -H "Authorization: Bearer YOUR_TOKEN"

# إحصائيات مشروع معين
curl -X GET "http://localhost:3000/api/v1/activities/statistics?projectId=PROJECT_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**الاستجابة:**
```json
{
  "total": 25,
  "totalRegistered": 850,
  "totalAttended": 720,
  "totalCapacity": 1200,
  "attendanceRate": 84.7,
  "capacityUtilization": 70.8,
  "byStatus": {
    "PLANNED": 5,
    "IN_PROGRESS": 3,
    "COMPLETED": 15,
    "CANCELLED": 2
  },
  "byType": {
    "WORKSHOP": 10,
    "TRAINING": 8,
    "SEMINAR": 5,
    "CONFERENCE": 2
  }
}
```

### تقرير مفصل لنشاط
```bash
curl -X GET "http://localhost:3000/api/v1/activities/ACTIVITY_ID/report" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## المشاركون (Participants)

### إنشاء مشارك جديد

```bash
curl -X POST http://localhost:3000/api/v1/participants \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "beneficiary": "BENEFICIARY_ID",
    "project": "PROJECT_ID",
    "fullName": "خالد عبدالله",
    "email": "khalid@example.com",
    "phone": "+966501234567",
    "nationalId": "1234567890",
    "age": 28,
    "gender": "MALE",
    "educationLevel": "بكالوريوس",
    "occupation": "مهندس",
    "city": "الرياض",
    "participationType": "متدرب",
    "totalSessions": 10,
    "status": "ACTIVE"
  }'
```

### تحديث حضور مشارك

#### طريقة 1: تحديث الحضور مباشرة
```bash
curl -X PATCH "http://localhost:3000/api/v1/participants/PARTICIPANT_ID/attendance" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "attendanceSessions": 8,
    "totalSessions": 10
  }'
```

**النتيجة:** سيتم حساب `attendanceRate` تلقائياً = 80%

#### طريقة 2: زيادة عدد الحضور بمقدار 1
```bash
curl -X POST "http://localhost:3000/api/v1/participants/PARTICIPANT_ID/increment-attendance" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### تحديث درجات التقييم

```bash
curl -X PATCH "http://localhost:3000/api/v1/participants/PARTICIPANT_ID/assessment-scores" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "preAssessmentScore": 65,
    "postAssessmentScore": 85
  }'
```

**النتيجة:** سيتم حساب `improvementPercentage` تلقائياً = 30.77%

### تحديث حضور جماعي (Bulk Update)

```bash
curl -X POST "http://localhost:3000/api/v1/participants/bulk-attendance" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "updates": [
      {"id": "PARTICIPANT_ID_1", "attended": true},
      {"id": "PARTICIPANT_ID_2", "attended": true},
      {"id": "PARTICIPANT_ID_3", "attended": false}
    ]
  }'
```

### إحصائيات مشارك واحد

```bash
curl -X GET "http://localhost:3000/api/v1/participants/PARTICIPANT_ID/stats" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**الاستجابة:**
```json
{
  "participant": {
    "fullName": "خالد عبدالله",
    "email": "khalid@example.com"
  },
  "attendance": {
    "attendanceSessions": 8,
    "totalSessions": 10,
    "attendanceRate": 80
  },
  "assessment": {
    "preAssessmentScore": 65,
    "postAssessmentScore": 85,
    "improvementPercentage": 30.77,
    "improvement": "متميز"
  }
}
```

### إحصائيات مشروع كامل

```bash
curl -X GET "http://localhost:3000/api/v1/participants/project/PROJECT_ID/stats" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**الاستجابة:**
```json
{
  "overview": {
    "totalParticipants": 150,
    "activeParticipants": 120,
    "completedParticipants": 25,
    "withdrawnParticipants": 5,
    "averageAttendanceRate": 82.5,
    "averagePreScore": 64.3,
    "averagePostScore": 81.7,
    "averageImprovement": 27.1
  },
  "byGender": {
    "MALE": 90,
    "FEMALE": 60
  },
  "byCity": {
    "الرياض": 70,
    "جدة": 45,
    "الدمام": 35
  },
  "ageDistribution": {
    "averageAge": 29.5,
    "minAge": 18,
    "maxAge": 55
  }
}
```

---

## المؤشرات (Indicators)

### إنشاء مؤشر جديد

#### مثال 1: مؤشر إنتاجية (Output Indicator)
```bash
curl -X POST http://localhost:3000/api/v1/indicators \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "project": "PROJECT_ID",
    "indicatorType": "OUTPUT",
    "name": "عدد المتدربين المستفيدين",
    "description": "إجمالي عدد الأشخاص الذين أكملوا البرنامج التدريبي",
    "measurementMethod": "عد المشاركين الذين حضروا 80% على الأقل",
    "targetValue": 1000,
    "actualValue": 0,
    "unit": "PERSON",
    "dataSource": "نظام إدارة التدريب",
    "baselineValue": 0
  }'
```

#### مثال 2: مؤشر نتيجة (Outcome Indicator)
```bash
curl -X POST http://localhost:3000/api/v1/indicators \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "project": "PROJECT_ID",
    "indicatorType": "OUTCOME",
    "name": "نسبة تحسن المهارات",
    "description": "النسبة المئوية للتحسن في مهارات المتدربين",
    "measurementMethod": "مقارنة نتائج التقييم القبلي والبعدي",
    "targetValue": 30,
    "actualValue": 0,
    "unit": "PERCENTAGE",
    "dataSource": "نتائج الاختبارات",
    "baselineValue": 0
  }'
```

#### مثال 3: مؤشر أثر (Impact Indicator)
```bash
curl -X POST http://localhost:3000/api/v1/indicators \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "project": "PROJECT_ID",
    "indicatorType": "IMPACT",
    "name": "معدل التوظيف بعد التدريب",
    "description": "نسبة المتدربين الذين حصلوا على وظيفة خلال 6 أشهر",
    "measurementMethod": "مسح ميداني للمتدربين بعد 6 أشهر",
    "targetValue": 70,
    "actualValue": 0,
    "unit": "PERCENTAGE",
    "dataSource": "استبيان المتابعة",
    "baselineValue": 35
  }'
```

### تسجيل قيمة جديدة للمؤشر (⭐ مهم جداً)

```bash
curl -X POST "http://localhost:3000/api/v1/indicators/INDICATOR_ID/record-value" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recordedValue": 850,
    "source": "تقرير الربع الأول 2026",
    "notes": "زيادة ملحوظة في عدد المستفيدين"
  }'
```

**ما يحدث تلقائياً:**
1. ✅ يتم إنشاء سجل جديد في `Indicator_History`
2. ✅ يتم حساب التغيير عن القيمة السابقة
3. ✅ يتم تحديث `actualValue` في المؤشر إلى 850
4. ✅ يتم تحديث `lastCalculatedAt`
5. ✅ يتم إعادة حساب الاتجاه (trend) تلقائياً

**الاستجابة:**
```json
{
  "_id": "...",
  "indicator": "INDICATOR_ID",
  "recordedValue": 850,
  "previousValue": 720,
  "changeAmount": 130,
  "changePercentage": 18.06,
  "calculatedAt": "2026-01-18T10:30:00.000Z",
  "source": "تقرير الربع الأول 2026",
  "status": "RECORDED"
}
```

### جلب السجل التاريخي للمؤشر

```bash
# جلب آخر 10 قياسات
curl -X GET "http://localhost:3000/api/v1/indicators/INDICATOR_ID/history?limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"

# جلب القياسات ضمن فترة زمنية
curl -X GET "http://localhost:3000/api/v1/indicators/INDICATOR_ID/history?startDate=2026-01-01&endDate=2026-03-31" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**الاستجابة:**
```json
[
  {
    "_id": "...",
    "recordedValue": 850,
    "previousValue": 720,
    "changeAmount": 130,
    "changePercentage": 18.06,
    "calculatedAt": "2026-01-18T10:30:00.000Z"
  },
  {
    "_id": "...",
    "recordedValue": 720,
    "previousValue": 650,
    "changeAmount": 70,
    "changePercentage": 10.77,
    "calculatedAt": "2026-01-10T14:20:00.000Z"
  }
]
```

### جلب المؤشرات حسب الاتجاه (Trend)

```bash
# المؤشرات المتحسنة
curl -X GET "http://localhost:3000/api/v1/indicators/trend/IMPROVING" \
  -H "Authorization: Bearer YOUR_TOKEN"

# المؤشرات المستقرة
curl -X GET "http://localhost:3000/api/v1/indicators/trend/STABLE" \
  -H "Authorization: Bearer YOUR_TOKEN"

# المؤشرات المتراجعة
curl -X GET "http://localhost:3000/api/v1/indicators/trend/DECLINING" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### جلب المؤشرات المتأخرة عن الهدف

```bash
# المؤشرات التي حققت أقل من 80% من الهدف
curl -X GET "http://localhost:3000/api/v1/indicators/off-track?threshold=0.8" \
  -H "Authorization: Bearer YOUR_TOKEN"

# المؤشرات التي حققت أقل من 50% من الهدف
curl -X GET "http://localhost:3000/api/v1/indicators/off-track?threshold=0.5" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### إحصائيات المؤشرات

```bash
# إحصائيات جميع المشاريع
curl -X GET "http://localhost:3000/api/v1/indicators/statistics" \
  -H "Authorization: Bearer YOUR_TOKEN"

# إحصائيات مشروع معين
curl -X GET "http://localhost:3000/api/v1/indicators/statistics?projectId=PROJECT_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**الاستجابة:**
```json
{
  "total": 25,
  "byType": {
    "INPUT": 5,
    "OUTPUT": 8,
    "OUTCOME": 7,
    "IMPACT": 5
  },
  "byTrend": {
    "IMPROVING": 15,
    "STABLE": 6,
    "DECLINING": 3,
    "NO_DATA": 1
  },
  "performance": {
    "onTrack": 18,
    "atRisk": 5,
    "offTrack": 2
  },
  "averageAchievement": 78.5
}
```

---

## نصائح مهمة

### 1. استخدام المتغيرات في Postman:
```javascript
// بعد تسجيل الدخول، احفظ الـ token تلقائياً:
pm.environment.set("access_token", pm.response.json().access_token);

// بعد إنشاء مشروع، احفظ الـ ID:
pm.environment.set("project_id", pm.response.json()._id);
```

### 2. ترتيب العمليات الموصى به:

1. **تسجيل الدخول** → احصل على token
2. **إنشاء مشروع** → احصل على project_id
3. **إنشاء مستفيدين** → أضف المستفيدين للمشروع
4. **إنشاء أنشطة** → جدول الأنشطة
5. **إنشاء مشاركين** → سجل المشاركين (مرتبطين بالمستفيدين)
6. **تسجيل الحضور** → تتبع حضور المشاركين
7. **إنشاء مؤشرات** → حدد مؤشرات الأداء
8. **تسجيل قيم المؤشرات** → سجل التقدم بانتظام

### 3. التحقق من الصلاحيات:

| العملية | ADMIN | MANAGER | VIEWER |
|---------|-------|---------|--------|
| إنشاء | ✅ | ✅ | ❌ |
| قراءة | ✅ | ✅ | ✅ |
| تحديث | ✅ | ✅ | ❌ |
| حذف | ✅ | ❌* | ❌ |

*المدير لا يمكنه حذف المشاريع

### 4. معالجة الأخطاء:

```bash
# في حالة الخطأ 401 (Unauthorized)
# تحقق من الـ token أو سجل دخول من جديد

# في حالة الخطأ 403 (Forbidden)
# تحقق من صلاحيات المستخدم (role)

# في حالة الخطأ 404 (Not Found)
# تحقق من صحة الـ ID المستخدم

# في حالة الخطأ 400 (Bad Request)
# تحقق من صحة البيانات المُرسلة
```

---

## Swagger UI

للوصول السريع والتجربة التفاعلية:
```
http://localhost:3000/api/docs
```

جميع الـ endpoints موثقة بالكامل مع أمثلة وإمكانية التجربة المباشرة!

---

**استمتع باستخدام الـ API! 🚀**
