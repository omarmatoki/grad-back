# مواصفات قيد الدراسةات UML — منصة قياس الأثر الاجتماعي

> **ملاحظة للذكاء الاصطناعي:** هذا الملف يحتوي على وصف تفصيلي كامل لجميع قيد الدراسةات UML المطلوبة للمشروع.
> اقرأ كل قسم بعناية قبل البدء في رسم أي قيد الدراسة.
> ارسم جميع القيد الدراسةات بصيغة **Mermaid** داخل كتلة كود، وأضف عنواناً واضحاً وشرحاً مختصراً لكل قيد الدراسة.
> استخدم `autonumber` و `activate/deactivate` في جميع قيد الدراسةات التسلسل.

---

## أولاً: نظرة عامة على النظام

**اسم المنصة:** منصة قياس الأثر الاجتماعي (Social Impact Measurement Platform)

**الهدف:** منصة خلفية (Backend) متكاملة تُمكّن المنظمات غير الربحية من إدارة برامجها الاجتماعية بالكامل، بدءاً من إنشاء المشاريع والأنشطة، وتسجيل المستفيدين والمشاركين، وبناء الاستبيانات وتحليل إجاباتها بالذكاء الاصطناعي، وصولاً إلى تتبع مؤشرات الأداء عبر الزمن.

**التقنيات المستخدمة:**
- إطار العمل: NestJS (Node.js + TypeScript)
- قاعدة البيانات: MongoDB (عبر Mongoose ODM)
- المصادقة: JWT Bearer Tokens + صلاحيات RBAC
- نمط API: RESTful موثّق بـ Swagger
- الخدمة الخارجية: محرك N8N للتحليل الآلي بالذكاء الاصطناعي

---

## ثانياً: الجهات الفاعلة (Actors)

### الجهات البشرية الداخلية (Human Internal Actors)

| الجهة الفاعلة | الوصف | الصلاحيات |
|---|---|---|
| **المسؤول (Admin)** | مدير النظام بكامل الصلاحيات | وصول كامل لجميع العمليات، إدارة المستخدمين، إنشاء الاستبيانات، إعداد المؤشرات |
| **المدير (Manager)** | مشرف برنامج أو مشروع | إنشاء المشاريع والأنشطة، عرض التحليلات والتقارير، لا يستطيع إدارة المستخدمين |
| **الموظف (Staff)** | عضو فريق تنفيذي | قراءة البيانات، تسجيل المستفيدين والمشاركين، رفع إجابات الاستبيانات نيابةً عنهم |

### الجهات البشرية الخارجية (Human External Actors)

| الجهة الفاعلة | الوصف |
|---|---|
| **المستفيد (Beneficiary)** | شخص أو منطقة مستهدفة بالبرنامج. يُملأ الاستبيان باسمه مباشرةً أو عبر الموظف. ليس مستخدماً للنظام (لا يملك تسجيل دخول). |

### الجهات النظامية الخارجية (System External Actors)

| الجهة الفاعلة | الوصف |
|---|---|
| **محرك N8N (N8N Engine)** | خدمة أتمتة خارجية. تستقبل النصوص من النظام عبر HTTP، تُحلّلها بالذكاء الاصطناعي، ثم تُرسل النتائج مرة أخرى عبر Webhook. |

---

## ثالثاً: طبقات المعمارية للنظام (Architecture Layers)

> استخدم هذه الأسماء بالضبط كـ Lifelines في جميع قيد الدراسةات التسلسل:

```
Client              → المستدعي (المتصفح / تطبيق / Postman)
JwtAuthGuard        → حارس التحقق من الـ JWT في NestJS
RolesGuard          → حارس التحقق من الصلاحيات في NestJS
[Module]Controller  → مثال: SurveysController, ProjectsController
[Module]Service     → مثال: SurveysService, ActivitiesService
[Model]             → نموذج Mongoose (وكيل مجموعة MongoDB)
MongoDB             → قاعدة البيانات الفعلية
N8NEngine           → الخدمة الخارجية (للتحليل النصي فقط)
```

---

## رابعاً: الوحدات وحالات الاستخدام الكاملة

### الوحدة 1: المصادقة وإدارة الجلسة (Authentication)

| الكود | حالة الاستخدام | الجهة الفاعلة |
|---|---|---|
| UC-01 | تسجيل الدخول بالبريد وكلمة المرور، استقبال JWT | Admin / Manager / Staff |
| UC-02 | الوصول لمسار محمي `<<include>>` التحقق من JWT | جميع المستخدمين |
| UC-03 | تطبيق قيود الدور `<<include>>` فحص الصلاحية | جميع المستخدمين |

---

### الوحدة 2: إدارة المستخدمين (User Management) — المسؤول فقط

| الكود | حالة الاستخدام | الجهة الفاعلة |
|---|---|---|
| UC-04 | إنشاء حساب مستخدم جديد (تحديد الدور: مسؤول/مدير/موظف) | Admin |
| UC-05 | عرض قائمة جميع المستخدمين | Admin |
| UC-06 | تحديث بيانات المستخدم أو تغيير دوره | Admin |
| UC-07 | تعليق حساب مستخدم أو إعادة تفعيله | Admin |
| UC-08 | حذف مستخدم من النظام | Admin |

---

### الوحدة 3: إدارة المشاريع (Project Management) — المسؤول والمدير

| الكود | حالة الاستخدام | الجهة الفاعلة |
|---|---|---|
| UC-09 | إنشاء مشروع (النوع، الأهداف، الميزانية، الفريق) | Admin, Manager |
| UC-10 | تحديث بيانات المشروع | Admin, Manager |
| UC-11 | تعيين أعضاء الفريق للمشروع (مرجع لكيانات المستخدمين) | Admin, Manager |
| UC-12 | عرض المشاريع وتصفيتها | Admin, Manager, Staff |
| UC-13 | حذف المشروع (حذف متسلسل للأنشطة) | Admin |
| UC-14 | عرض لوحة تحكم المشروع (إحصاءات مُجمَّعة) | Admin, Manager |

---

### الوحدة 4: إدارة الأنشطة (Activity Management) — المسؤول والمدير

| الكود | حالة الاستخدام | الجهة الفاعلة |
|---|---|---|
| UC-15 | إنشاء نشاط ضمن مشروع (النوع، التاريخ، السعة) | Admin, Manager |
| UC-16 | تحديث بيانات النشاط | Admin, Manager |
| UC-17 | تغيير حالة النشاط: مُخطَّط ← قيد التنفيذ ← مكتمل | Admin, Manager |
| UC-18 | عرض أنشطة مشروع معين | Admin, Manager, Staff |
| UC-19 | حذف النشاط | Admin |

---

### الوحدة 5: إدارة المستفيدين (Beneficiary Management)

| الكود | حالة الاستخدام | الجهة الفاعلة |
|---|---|---|
| UC-20 | تسجيل مستفيد جديد (فرد أو منطقة جغرافية) | Admin, Manager, Staff |
| UC-21 | تحديث بيانات مستفيد | Admin, Manager, Staff |
| UC-22 | البحث عن مستفيد وعرض القائمة | Admin, Manager, Staff |
| UC-23 | تسجيل مستفيد في نشاط `<<extend>>` تسجيل درجة التفاعل والمشاركة والرضا | Admin, Manager, Staff |
| UC-24 | إلغاء تسجيل مستفيد من نشاط | Admin, Manager |
| UC-25 | حذف سجل مستفيد | Admin |

---

### الوحدة 6: إدارة المشاركين (Participant Management)

| الكود | حالة الاستخدام | الجهة الفاعلة |
|---|---|---|
| UC-26 | تسجيل مشارك جديد (ربط اختياري بمستفيد) | Admin, Manager, Staff |
| UC-27 | تحديث بيانات المشارك | Admin, Manager, Staff |
| UC-28 | تسجيل مشارك في نشاط (فريد لكل نشاط) | Admin, Manager, Staff |
| UC-29 | إلغاء تسجيل مشارك من نشاط | Admin, Manager |
| UC-30 | عرض المشاركين (بحسب النشاط أو عامة) | Admin, Manager, Staff |

---

### الوحدة 7: بناء الاستبيان (Survey Management) — المسؤول فقط للإنشاء والتعديل

| الكود | حالة الاستخدام | الجهة الفاعلة | ملاحظات |
|---|---|---|---|
| UC-31 | إنشاء استبيان مرتبط بنشاط (النوع: تقييم/اختبار/رضا) — يبدأ بحالة "مسودة" | Admin | — |
| UC-32 | إضافة سؤال للاستبيان | Admin | 14 نوع سؤال: text, textarea, number, email, phone, date, single_choice, multiple_choice, dropdown, rating, scale, matrix, file_upload, yes_no |
| | `<<extend>>` ضبط المنطق الشرطي (أظهر إذا كانت إجابة سؤال آخر = قيمة محددة) | Admin | — |
| UC-33 | تحديث سؤال | Admin | — |
| UC-34 | حذف سؤال (حذف متسلسل للإجابات الصحيحة) | Admin | — |
| UC-35 | إضافة إجابة صحيحة لسؤال اختباري (قيمة مكتوبة/رقمية/منطقية/تاريخ) | Admin | يمكن إضافة إجابات صحيحة متعددة لسؤال واحد |
| UC-36 | حذف إجابة صحيحة | Admin | — |
| UC-37 | نشر الاستبيان (مسودة ← نشط) | Admin | — |
| UC-38 | إغلاق الاستبيان (نشط ← مغلق) | Admin | — |
| UC-39 | حذف الاستبيان (حذف متسلسل: أسئلة + إجابات + استجابات) | Admin | — |

---

### الوحدة 8: تقديم الاستجابات (Survey Response Submission)

| الكود | حالة الاستخدام | الجهة الفاعلة | ملاحظات |
|---|---|---|---|
| UC-40 | تقديم إجابات الاستبيان | Staff, Beneficiary | **النموذج المسطّح:** يُنشئ وثيقة SurveySubmission واحدة لكل إجابة (كل سؤال = وثيقة مستقلة) |
| | `<<include>>` التحقق من اكتمال الأسئلة الإلزامية | — | إذا فُقد سؤال إلزامي → 400 Bad Request |
| | `<<include>>` إنشاء وثيقة استجابة لكل إجابة | — | يُخزّن: survey + question + beneficiary + القيمة المكتوبة/الرقمية/المنطقية/التاريخية + توقيت الجلسة |
| | `<<include>>` زيادة عداد totalResponses في الاستبيان | — | — |
| | `<<extend>>` تصحيح تلقائي بمقارنة الإجابات الصحيحة → تحديد حقل isCorrect | — | فقط في الاستبيانات الاختبارية |

---

### الوحدة 9: تحليلات الاستبيان (Survey Analytics & Retrieval)

| الكود | حالة الاستخدام | الجهة الفاعلة | ملاحظات |
|---|---|---|---|
| UC-41 | عرض كل جلسات الاستجابة (مُجمَّعة بحسب المستفيد + وقت البدء) | Admin, Manager, Staff | — |
| UC-42 | عرض وثيقة استجابة واحدة بمعرّفها | Admin, Manager, Staff | — |
| UC-43 | عرض جلسة كاملة بمفتاح الجلسة (surveyId_beneficiaryId_timestamp) | Admin, Manager, Staff | — |
| UC-44 | عرض تحليلات الاستبيان | Admin, Manager | إجمالي الجلسات والاستجابات + تحليل لكل سؤال: رقمي (متوسط/أدنى/أعلى)، اختياري (توزيع)، نصي (عينات)، نعم/لا (نسب) |

---

### الوحدة 10: التحليل النصي بالذكاء الاصطناعي (Text Analysis)

| الكود | حالة الاستخدام | الجهة الفاعلة | ملاحظات |
|---|---|---|---|
| UC-45 | رفع نص للتحليل (مرتبط بمشروع، يبدأ بحالة "قيد الانتظار") | Admin, Manager | `<<include>>` إرسال النص لمحرك N8N عبر HTTP POST |
| UC-46 | استقبال نتائج التحليل من N8N عبر Webhook | N8N Engine | `<<include>>` تحديث حالة TextAnalysis → مكتمل + حفظ: تحليل المشاعر، الكلمات المفتاحية، الكيانات، الملخص |
| UC-47 | عرض قائمة التحليلات النصية بحسب المشروع | Admin, Manager | — |
| UC-48 | عرض نتيجة تحليل نصي واحد | Admin, Manager | — |
| UC-49 | إنشاء موضوع (Topic) يدوياً (مرتبط بمشروع، مع كلمات مفتاحية) | Admin, Manager | — |
| UC-50 | ربط موضوع بتحليل نصي (TextTopic: درجة الصلة، الثقة، الاقتباسات) | Admin, Manager | — |
| UC-51 | عرض المواضيع بحسب المشروع | Admin, Manager, Staff | — |
| UC-52 | حذف موضوع | Admin | — |

---

### الوحدة 11: إدارة المؤشرات (Indicator Management)

| الكود | حالة الاستخدام | الجهة الفاعلة | ملاحظات |
|---|---|---|---|
| UC-53 | إنشاء مؤشر للمشروع (النوع، وحدة القياس، القيمة المستهدفة، الأساس، الحدود) | Admin, Manager | الأنواع: input/output/outcome/impact/process/custom |
| UC-54 | تحديث تعريف المؤشر | Admin, Manager | — |
| UC-55 | تسجيل قياس جديد للمؤشر (IndicatorHistory) | Admin, Manager | `<<include>>` تحديث actualValue في المؤشر + حساب اتجاه التغيير (improving/stable/declining) |
| | `<<extend>>` التحقق من صحة مراجع السياق (نشاط أو استبيان) إن وُجدت | — | — |
| UC-56 | التحقق من صحة أو تعديل قياس تاريخي | Admin, Manager | — |
| UC-57 | عرض مؤشرات المشروع | Admin, Manager, Staff | — |
| UC-58 | عرض تاريخ قياسات المؤشر (بيانات زمنية متسلسلة) | Admin, Manager | — |
| UC-59 | حذف المؤشر | Admin | — |

---

## خامساً: مواصفات قيد الدراسةات حالات الاستخدام (Use Case Diagrams)

### قيد الدراسة A1: نظرة عامة على المنصة (System Overview)

**المطلوب:** قيد الدراسة شامل يضم جميع الجهات الفاعلة الخمس وجميع الوحدات الإحدى عشرة كصناديق فرعية (subgraph/subsystem)، مع أبرز 3-5 حالات استخدام لكل وحدة. أظهر علاقات التعميم بين Admin ← Manager ← Staff.

**العلاقات المطلوبة:**
```
علاقات التعميم (Generalization):
  Admin يشمل صلاحيات Manager
  Manager يشمل صلاحيات Staff

علاقات الارتباط الرئيسية:
  Admin       → إدارة المستخدمين (UC-04 إلى UC-08)
  Admin       → بناء الاستبيان (UC-31 إلى UC-39)
  Manager     → إدارة المشاريع (UC-09 إلى UC-14)
  Manager     → إدارة الأنشطة (UC-15 إلى UC-19)
  Manager     → التحليل النصي (UC-45 إلى UC-52)
  Manager     → المؤشرات (UC-53 إلى UC-59)
  Staff       → إدارة المستفيدين (UC-20 إلى UC-25)
  Staff       → إدارة المشاركين (UC-26 إلى UC-30)
  Staff       → تقديم الاستجابات (UC-40)
  Beneficiary → تقديم الاستجابات (UC-40)
  N8NEngine   → استقبال نتائج التحليل (UC-46)

علاقات الشمول (<<include>>):
  أي حالة استخدام محمية تشمل: التحقق من JWT + فحص الصلاحية
```

---

### قيد الدراسة A2: دورة حياة الاستبيان الكاملة (Survey Lifecycle)

**المطلوب:** قيد الدراسة تفصيلي للوحدات 7 و8 و9 يشمل جميع حالات الاستخدام (UC-31 إلى UC-44) مع كل علاقات `<<include>>` و`<<extend>>` بدقة.

**العلاقات المطلوبة:**
```
المشاركون: Admin, Staff, Beneficiary

Admin:
  - إنشاء الاستبيان (UC-31)
  - إضافة سؤال (UC-32)
      <<extend>> ضبط الشرط التلقائي  (اختياري)
  - تحديث سؤال (UC-33)
  - حذف سؤال (UC-34)
      <<include>> حذف الإجابات الصحيحة المرتبطة
  - إضافة إجابة صحيحة (UC-35)
  - حذف إجابة صحيحة (UC-36)
  - نشر الاستبيان (UC-37)
  - إغلاق الاستبيان (UC-38)
  - حذف الاستبيان (UC-39)
      <<include>> حذف جميع الأسئلة
      <<include>> حذف جميع الاستجابات

Staff, Beneficiary:
  - تقديم الاستجابات (UC-40)
      <<include>> التحقق من الأسئلة الإلزامية
      <<include>> إنشاء وثيقة لكل إجابة
      <<include>> زيادة عداد الاستجابات
      <<extend>> تصحيح تلقائي (في الاستبيانات الاختبارية)

Admin, Manager, Staff:
  - عرض الجلسات (UC-41)
  - عرض استجابة بمعرّفها (UC-42)
  - عرض جلسة بمفتاحها (UC-43)
  - عرض التحليلات (UC-44)
```

---

### قيد الدراسة A3: التحليل النصي والمؤشرات (Analysis & Indicators)

**المطلوب:** قيد الدراسة تفصيلي للوحدات 10 و11 يشمل حالات الاستخدام (UC-45 إلى UC-59) مع N8N Engine كجهة فاعلة خارجية.

**العلاقات المطلوبة:**
```
المشاركون: Admin, Manager, Staff, N8NEngine

Admin, Manager:
  - رفع نص للتحليل (UC-45)
      <<include>> إرسال النص لـ N8N عبر HTTP
  - عرض قائمة التحليلات (UC-47)
  - عرض تحليل واحد (UC-48)
  - إنشاء موضوع (UC-49)
  - ربط موضوع بتحليل (UC-50)
  - حذف موضوع (UC-52) — Admin فقط

N8NEngine:
  - إرسال نتائج التحليل (UC-46)
      <<include>> تحديث سجل TextAnalysis

Admin, Manager, Staff:
  - عرض المواضيع (UC-51)

Admin, Manager:
  - إنشاء مؤشر (UC-53)
  - تحديث مؤشر (UC-54)
  - تسجيل قياس (UC-55)
      <<include>> تحديث actualValue في المؤشر
      <<include>> حساب الاتجاه (improving/stable/declining)
      <<extend>> التحقق من السياق (نشاط/استبيان)
  - التحقق من قياس تاريخي (UC-56)
  - حذف مؤشر (UC-59) — Admin فقط

Admin, Manager, Staff:
  - عرض مؤشرات المشروع (UC-57)
  - عرض تاريخ قياسات المؤشر (UC-58)
```

---

## سادساً: مواصفات قيد الدراسةات التسلسل (Sequence Diagrams)

> **قاعدة عامة لجميع القيد الدراسةات:**
> كل مسار محمي يبدأ دائماً بـ:
> `Client → JwtAuthGuard → MongoDB (جلب المستخدم) → RolesGuard → Controller`
> يمكن تمثيل هذا الجزء كـ `ref` fragment بعد القيد الدراسة B10.

---

### قيد الدراسة B1: تسجيل الدخول (User Login)

**المسار السعيد (Happy Path):**
```
1. Client يُرسل: POST /api/v1/auth/login { email, password }
2. AuthController.login(dto) يستدعي AuthService.login(email, password)
3. AuthService يستعلم عن المستخدم: UserModel.findOne({ email })
4. MongoDB يُعيد وثيقة المستخدم
5. AuthService يتحقق من كلمة المرور: bcrypt.compare(password, hash)
6. AuthService يُولّد الرمز: JwtService.sign({ userId, role })
7. AuthController يُعيد: 200 OK { access_token: "eyJ..." }
```

**المسارات البديلة (Alt Fragments):**
```
alt [البريد غير موجود]:
  MongoDB يُعيد null
  AuthService يرمي: 401 Unauthorized "بيانات الدخول غير صحيحة"

alt [كلمة المرور خاطئة]:
  bcrypt.compare يُعيد false
  AuthService يرمي: 401 Unauthorized "بيانات الدخول غير صحيحة"

alt [الحساب معلّق]:
  AuthService يتحقق من user.status === 'suspended'
  AuthService يرمي: 403 Forbidden "الحساب معلّق"
```

---

### قيد الدراسة B2: إنشاء مشروع وتعيين الفريق (Create Project & Assign Team)

**المسار السعيد:**
```
1. Client يُرسل: POST /api/v1/projects مع JWT
   [ref: التحقق من JWT والصلاحية (B10)]
2. ProjectsController.create(dto) يستدعي ProjectsService.create(dto, userId)
3. ProjectsService ينشئ وثيقة: ProjectModel.create({ ...dto, user_id: userId })
4. MongoDB يُعيد المشروع المنشأ
5. ProjectsController يُعيد: 201 Created { project }
```

**المسارات البديلة:**
```
opt [المشروع غير موجود عند التحديث]:
  ProjectsService يرمي: 404 Not Found "المشروع غير موجود"
```

---

### قيد الدراسة B3: تسجيل مستفيد في نشاط (Enroll Beneficiary in Activity)

**المسار السعيد:**
```
1. Client يُرسل: POST /api/v1/activities/:activityId/beneficiaries
   Body: { beneficiaryId, interactionLevel: 4, participationDegree: 3, satisfactionRating: 5 }
   [ref: التحقق من JWT والصلاحية (B10)]

2. ActivitiesController.enrollBeneficiary(activityId, dto)
3. ActivitiesService يتحقق من وجود النشاط:
   ActivityModel.findById(activityId)
4. MongoDB يُعيد النشاط

5. ActivitiesService يتحقق من وجود المستفيد:
   BeneficiaryModel.findById(beneficiaryId)
6. MongoDB يُعيد المستفيد

7. ActivitiesService يتحقق من السعة:
   activity.registeredCount < activity.capacity

8. ActivitiesService يتحقق من عدم التسجيل المسبق:
   ActivityBeneficiaryModel.findOne({ activity: activityId, beneficiary: beneficiaryId })
9. MongoDB يُعيد: null (غير مسجّل)

10. ActivitiesService ينشئ: ActivityBeneficiaryModel.create({ activity, beneficiary, interactionLevel, ... })
11. ActivitiesService يُحدّث العداد: ActivityModel.findByIdAndUpdate(activityId, { $inc: { registeredCount: 1 } })
12. Controller يُعيد: 201 Created { enrollment }
```

**المسارات البديلة:**
```
alt [النشاط مكتمل السعة (activity.capacity > 0 && registeredCount >= capacity)]:
  ActivitiesService يرمي: 400 Bad Request "النشاط بلغ الطاقة الاستيعابية"

alt [المستفيد مسجّل مسبقاً]:
  MongoDB يُعيد وثيقة موجودة
  ActivitiesService يرمي: 409 Conflict "المستفيد مسجّل بالفعل في هذا النشاط"

alt [النشاط غير موجود]:
  ActivitiesService يرمي: 404 Not Found
```

---

### قيد الدراسة B4: بناء استبيان كامل (Create Survey with Questions & Correct Answers)

**المسار السعيد:**
```
1. Client يُرسل: POST /api/v1/surveys
   Body: { activityId, title, description, type: "test", status: "draft" }
   [ref: التحقق من JWT والصلاحية - Admin فقط (B10)]

2. SurveysController.createSurvey(dto)
3. SurveysService يتحقق من وجود النشاط: ActivityModel.findById(activityId)
4. MongoDB يُعيد النشاط
5. SurveysService ينشئ: SurveyModel.create(dto)
6. Controller يُعيد: 201 Created { survey }

--- [إضافة سؤال اختياري] ---
7. Client يُرسل: POST /api/v1/surveys/questions
   Body: { surveyId, questionText: "كم عمرك؟", type: "number", isRequired: true }

8. SurveysController.addQuestion(dto)
9. SurveysService.findOneSurvey(surveyId) — التحقق من وجود الاستبيان
10. SurveyModel.findById(surveyId) → MongoDB يُعيد الاستبيان
11. SurveysService ينشئ: SurveyQuestionModel.create(dto)
12. Controller يُعيد: 201 Created { question }

--- [إضافة إجابة صحيحة] ---
13. Client يُرسل: POST /api/v1/surveys/correct-answers
    Body: { questionId, textValue: "باريس" }

14. SurveysController.addCorrectAnswer(dto)
15. SurveysService.questionModel.findById(questionId) — التحقق من وجود السؤال
16. MongoDB يُعيد السؤال
17. SurveysService ينشئ: SurveyCorrectAnswerModel.create(dto)
18. Controller يُعيد: 201 Created { correctAnswer }
```

**المسارات البديلة:**
```
opt [الاستبيان غير موجود عند إضافة سؤال]:
  SurveysService يرمي: 404 Not Found "الاستبيان غير موجود"

opt [السؤال غير موجود عند إضافة إجابة صحيحة]:
  SurveysService يرمي: 404 Not Found "السؤال غير موجود"
```

---

### قيد الدراسة B5: تقديم إجابات الاستبيان (Submit Survey Response)

**المسار السعيد:**
```
1. Client يُرسل: POST /api/v1/surveys/submissions
   Body: {
     survey: "surveyId",
     beneficiary: "beneficiaryId",
     answers: [
       { question: "q1", textValue: "إجابة 1" },
       { question: "q2", numberValue: 4 },
       { question: "q3", booleanValue: true }
     ]
   }
   [ref: التحقق من JWT والصلاحية (B10)]

2. SurveysController.submitResponse(dto)
3. SurveysService.findOneSurvey(survey) — التحقق من وجود الاستبيان
4. SurveyModel.findById(surveyId) → MongoDB يُعيد الاستبيان

5. SurveysService.getQuestions(surveyId)
6. SurveyQuestionModel.find({ survey: surveyId }) → MongoDB يُعيد قائمة الأسئلة

7. SurveysService يُحدّد الأسئلة الإلزامية ويتحقق من تغطيتها
   [يُقارن requiredQuestions مع answeredQuestionIds]

8. SurveysService يُحدّد وقت بداية الجلسة: sessionStartedAt = new Date()

--- loop [لكل إجابة في dto.answers] ---
9.  SurveysService ينشئ: SurveySubmissionModel.create({
      survey, question, beneficiary,
      startedAt: sessionStartedAt,
      completedAt: new Date(),
      textValue/numberValue/booleanValue/dateValue
    })
10. MongoDB يحفظ وثيقة الاستجابة
--- end loop ---

11. SurveysService يُحدّث العداد:
    SurveyModel.findByIdAndUpdate(surveyId, { $inc: { totalResponses: 1 } })

12. SurveysController يُعيد: 201 Created {
      sessionId: "surveyId_beneficiaryId_timestamp",
      submissionsCount: 3,
      submittedAt: "..."
    }
```

**المسارات البديلة:**
```
alt [سؤال إلزامي غير مُجاب]:
  SurveysService يُحدّد الأسئلة الإلزامية المفقودة
  يرمي: 400 Bad Request "الأسئلة الإلزامية التالية غير مُجابة: ..."

alt [الاستبيان غير موجود]:
  SurveysService يرمي: 404 Not Found

opt [تصحيح تلقائي — استبيان اختباري]:
  SurveysService يجلب الإجابات الصحيحة لكل سؤال
  يُقارن الإجابة المُدخلة مع الإجابة الصحيحة
  يُحدّث حقل isCorrect في كل وثيقة SurveySubmission
```

---

### قيد الدراسة B6: تحليلات الاستبيان (Get Survey Analytics)

**المسار السعيد:**
```
1. Client يُرسل: GET /api/v1/surveys/:id/analytics
   [ref: التحقق من JWT والصلاحية (B10)]

2. SurveysController.getSurveyAnalytics(surveyId)
3. SurveysService.findOneSurvey(surveyId)
4. SurveyModel.findById(surveyId).populate('activity') → MongoDB

5. SurveysService.getQuestions(surveyId)
6. SurveyQuestionModel.find({ survey: surveyId }).sort({ createdAt: 1 }) → MongoDB

7. SurveysService يجلب جميع الاستجابات:
   SurveySubmissionModel.find({ survey: surveyId }) → MongoDB

8. SurveysService يُحسب الجلسات الفريدة:
   [تجميع: beneficiary + startedAt → Set من المفاتيح الفريدة]

--- loop [لكل سؤال في قائمة الأسئلة] ---
9.  SurveysService.analyzeQuestions يجلب استجابات السؤال:
    SurveySubmissionModel.find({ survey: surveyId, question: question._id })

10. SurveysService.analyzeAnswersByType يُحدّد نوع التحليل:

    alt [rating / scale / number]:
      analyzeNumericAnswers → يحسب: average, min, max, count

    alt [single_choice / multiple_choice / dropdown]:
      analyzeChoiceAnswers → يبني: distribution map, total

    alt [text / textarea]:
      analyzeTextAnswers → يعيد: count, averageLength, samples[0..4]

    alt [yes_no]:
      analyzeYesNoAnswers → يحسب: yes, no, yesPercentage, noPercentage
--- end loop ---

11. SurveysController يُعيد: 200 OK {
      survey: { id, title, type },
      totalSessions: N,
      totalSubmissions: M,
      questionAnalytics: [{ questionId, questionText, type, totalAnswers, analysis }]
    }
```

---

### قيد الدراسة B7: التحليل النصي بالذكاء الاصطناعي (AI Text Analysis + N8N Webhook)

**الجزء الأول — رفع النص:**
```
1. Client يُرسل: POST /api/v1/analysis
   Body: { projectId, originalText: "نص مفتوح...", source: "survey" }
   [ref: التحقق من JWT والصلاحية (B10)]

2. AnalysisController.create(dto)
3. AnalysisService.create(dto)
4. TextAnalysisModel.create({ project, originalText, source, status: "pending" })
5. MongoDB يُعيد الوثيقة المحفوظة

--- par [المعالجة المتوازية] ---
   الفرع 1: AnalysisService يرسل طلباً غير متزامن لـ N8N:
     HttpService.post(N8N_WEBHOOK_URL, { textAnalysisId, text })
     N8NEngine يستقبل الطلب ويبدأ المعالجة

   الفرع 2: Controller يُعيد فوراً للعميل:
     202 Accepted { textAnalysisId, status: "pending", message: "التحليل قيد المعالجة" }
--- end par ---
```

**الجزء الثاني — استقبال نتائج N8N:**
```
6. N8NEngine يُرسل: POST /api/v1/analysis/webhook/:textAnalysisId
   Body: {
     sentiment: { label: "positive", score: 0.85, confidence: 0.92 },
     keywords: ["مهارات", "قيادة", "تطوير"],
     entities: ["برنامج التمكين"],
     summary: "النص يعبّر عن رضا عالٍ..."
   }

7. AnalysisController.receiveWebhook(textAnalysisId, results)
8. AnalysisService.processWebhookResults(textAnalysisId, results)
9. TextAnalysisModel.findByIdAndUpdate(textAnalysisId, {
     status: "completed",
     sentiment: results.sentiment,
     keywords: results.keywords,
     entities: results.entities,
     summary: results.summary
   })
10. MongoDB يُعيد الوثيقة المحدَّثة
11. AnalysisController يُعيد لـ N8N: 200 OK { received: true }
```

**المسارات البديلة:**
```
alt [N8N فشل في المعالجة]:
  N8NEngine يُرسل: POST /api/v1/analysis/webhook/:id { status: "failed", error: "..." }
  AnalysisService يُحدّث: { status: "failed", errorMessage: "..." }

alt [معرّف التحليل غير موجود في الـ Webhook]:
  AnalysisService يرمي: 404 Not Found
  N8NEngine يستقبل: 404 (يُسجّل الخطأ)
```

---

### قيد الدراسة B8: تسجيل قياس مؤشر (Record Indicator Measurement)

**المسار السعيد:**
```
1. Client يُرسل: POST /api/v1/indicators/:indicatorId/history
   Body: {
     recordedValue: 75.5,
     calculatedAt: "2025-06-15",
     status: "recorded",
     notes: "قياس الربع الثاني",
     context_activity: "activityId" (اختياري)
   }
   [ref: التحقق من JWT والصلاحية (B10)]

2. IndicatorsController.recordMeasurement(indicatorId, dto)
3. IndicatorsService.findOne(indicatorId)
4. IndicatorModel.findById(indicatorId) → MongoDB يُعيد المؤشر

5. [opt] إذا أُرفق context_activity:
   IndicatorsService يتحقق: ActivityModel.findById(context_activity)
   MongoDB يُعيد النشاط (أو 404)

6. IndicatorsService ينشئ سجل التاريخ:
   IndicatorHistoryModel.create({
     indicator: indicatorId,
     recordedValue,
     calculatedAt,
     status,
     changeAmount: recordedValue - indicator.actualValue,
     changePercentage: ((recordedValue - indicator.actualValue) / indicator.actualValue) * 100
   })

7. IndicatorsService يُحسب الاتجاه:
   alt [recordedValue > indicator.actualValue]: trend = "improving"
   alt [recordedValue < indicator.actualValue]: trend = "declining"
   alt [recordedValue === indicator.actualValue]: trend = "stable"

8. IndicatorsService يُحدّث المؤشر:
   IndicatorModel.findByIdAndUpdate(indicatorId, {
     actualValue: recordedValue,
     trend: calculatedTrend
   })

9. Controller يُعيد: 201 Created { historyRecord, updatedIndicator }
```

**المسارات البديلة:**
```
alt [المؤشر غير موجود]:
  IndicatorsService يرمي: 404 Not Found "المؤشر غير موجود"

alt [النشاط المرجعي غير موجود]:
  IndicatorsService يرمي: 404 Not Found "النشاط المرجعي غير موجود"
```

---

### قيد الدراسة B9: حذف الاستبيان مع التسلسل (Delete Survey Cascade)

**المسار السعيد:**
```
1. Client يُرسل: DELETE /api/v1/surveys/:id
   [ref: التحقق من JWT والصلاحية - Admin فقط (B10)]

2. SurveysController.deleteSurvey(id)
3. SurveysService.deleteSurvey(id)

--- par [الحذف المتوازي] ---

   الفرع 1: حذف الاستجابات
     SurveysService: SurveySubmissionModel.deleteMany({ survey: id })
     MongoDB يحذف جميع وثائق الاستجابة
     MongoDB يُعيد: { deletedCount: N }

   الفرع 2: حذف الأسئلة وإجاباتها الصحيحة
     SurveysService: SurveyQuestionModel.find({ survey: id })
     MongoDB يُعيد قائمة معرّفات الأسئلة
     --- loop [لكل سؤال] ---
       SurveysService: SurveyCorrectAnswerModel.deleteMany({ question: questionId })
       MongoDB يحذف الإجابات الصحيحة
     --- end loop ---
     SurveysService: SurveyQuestionModel.deleteMany({ survey: id })
     MongoDB يحذف جميع الأسئلة

--- end par ---

4. SurveysService: SurveyModel.findByIdAndDelete(id)
5. MongoDB يحذف وثيقة الاستبيان ويُعيد الوثيقة المحذوفة

6. SurveysController يُعيد: 200 OK { message: "تم حذف الاستبيان وجميع بياناته بنجاح" }
```

**المسارات البديلة:**
```
alt [الاستبيان غير موجود]:
  SurveyModel.findByIdAndDelete يُعيد null
  SurveysService يرمي: 404 Not Found "الاستبيان غير موجود"
```

---

### قيد الدراسة B10: سلسلة حراسة المصادقة والصلاحيات (JWT Auth Guard Chain)

> **هذا قيد الدراسة مرجعي** يُستخدم في جميع القيد الدراسةات الأخرى عبر `ref` fragment.

**التدفق الكامل:**
```
1. Client يُرسل: HTTP Request مع الترويسة: Authorization: Bearer <token>

2. NestJS يوجّه الطلب إلى JwtAuthGuard.canActivate()

3. JwtAuthGuard يستخرج التوكن من الترويسة
   alt [لا يوجد توكن أو الصيغة خاطئة]:
     يرمي: 401 Unauthorized "التوكن مفقود"

4. JwtAuthGuard: JwtService.verify(token)
   alt [التوكن منتهي الصلاحية أو التوقيع خاطئ]:
     يرمي: 401 Unauthorized "التوكن غير صالح"

5. JwtAuthGuard يستخرج userId من الحمولة (payload.sub)

6. JwtAuthGuard: UserModel.findById(userId) → MongoDB
   alt [المستخدم غير موجود في قاعدة البيانات]:
     يرمي: 401 Unauthorized "المستخدم غير موجود"

7. MongoDB يُعيد وثيقة المستخدم
   JwtAuthGuard يُرفق المستخدم بالطلب: request.user = userDocument

8. RolesGuard.canActivate() يقرأ الأدوار المطلوبة من @Roles() decorator

   alt [الأدوار المطلوبة غير محددة (مسار عام)]:
     يُكمل المعالجة بدون فحص الدور

   alt [دور المستخدم غير مدرج في الأدوار المطلوبة]:
     يرمي: 403 Forbidden "ليس لديك صلاحية للوصول لهذا المورد"

9. الطلب يصل إلى [Module]Controller → يُكمل المعالجة الطبيعية
```

---

## سابعاً: متطلبات الجودة للذكاء الاصطناعي

1. **صحة Mermaid:** كل كتلة كود يجب أن تُعرض بدون أخطاء على https://mermaid.live
2. **استخدم `autonumber`** في جميع قيد الدراسةات التسلسل (sequenceDiagram)
3. **استخدم `activate` / `deactivate`** على كل Lifeline تُعالج استدعاءً
4. **الرسائل المتزامنة:** سهم صلب `->>` | **الرجوع:** سهم متقطع `-->>` | **غير متزامن:** أضف `Note over` توضيحية
5. **أسماء الـ Lifelines** يجب أن تطابق بالضبط ما ورد في قسم "طبقات المعمارية"
6. **أسماء الدوال** تعكس نمط NestJS الحقيقي: مثل `SurveysService.submitResponse(dto)`
7. **لا تحذف أي حالة استخدام** من الأقسام السابقة
8. **أضف `Note over`** لشرح القواعد التجارية غير الواضحة (مثل: النموذج المسطّح، الحذف المتسلسل)
9. **رتّب القيد الدراسةات بالترتيب:** A1 ← A2 ← A3 ← B1 ← B2 ← B3 ← B4 ← B5 ← B6 ← B7 ← B8 ← B9 ← B10
10. **لكل قيد الدراسة:** أضف عنواناً واضحاً (`## عنوان القيد الدراسة`) وشرحاً مختصراً (2-3 جمل) قبل كتلة الكود

---

## ثامناً: ترتيب التسليم المطلوب

```
## A1: نظرة عامة على المنصة (Use Case - System Overview)
[شرح مختصر]
```mermaid
...
```

## A2: دورة حياة الاستبيان (Use Case - Survey Lifecycle)
[شرح مختصر]
```mermaid
...
```

## A3: التحليل النصي والمؤشرات (Use Case - Analysis & Indicators)
[شرح مختصر]
```mermaid
...
```

## B1: تسجيل الدخول (Sequence - User Login)
...

## B2: إنشاء مشروع وتعيين الفريق (Sequence - Create Project)
...

## B3: تسجيل مستفيد في نشاط (Sequence - Enroll Beneficiary)
...

## B4: بناء استبيان كامل (Sequence - Build Survey)
...

## B5: تقديم إجابات الاستبيان (Sequence - Submit Response)
...

## B6: تحليلات الاستبيان (Sequence - Survey Analytics)
...

## B7: التحليل النصي بالذكاء الاصطناعي (Sequence - AI Text Analysis)
...

## B8: تسجيل قياس مؤشر (Sequence - Record Measurement)
...

## B9: حذف الاستبيان مع التسلسل (Sequence - Delete Survey Cascade)
...

## B10: سلسلة حراسة المصادقة (Sequence - JWT Auth Guard Chain)
...
```

---

*نهاية ملف المواصفات — يجب إنتاج جميع القيد الدراسةات الـ 13 بالترتيب المذكور أعلاه.*
