# ROLE FILE - Backend (grad-back)
> اقرأ هذا الملف لفهم المشروع كاملاً دون الحاجة لقراءة باقي الملفات

---

## اسم المشروع
**Social Impact Platform - Backend API**

---

## الغرض
API backend لمنصة قياس الأثر المجتمعي. يوفر REST API كامل لإدارة المشاريع الاجتماعية، الاستبيانات، المستفيدين، الأنشطة، ومؤشرات الأداء، مع تكامل مع الذكاء الاصطناعي عبر n8n.

---

## التقنيات المستخدمة

| التقنية | الإصدار | الغرض |
|---------|---------|--------|
| NestJS | 10.3 | Backend Framework |
| TypeScript | 5.3 | Language |
| MongoDB | 8.0 | Database (NoSQL) |
| Mongoose | 8.0 | ODM for MongoDB |
| Passport.js + JWT | - | Authentication |
| bcrypt | 5.1 | Password Hashing |
| Helmet | 7.1 | Security Headers |
| Swagger | - | API Documentation |
| Throttler | - | Rate Limiting |
| n8n | - | AI Workflow Automation |
| Axios | 1.6 | HTTP Client (for n8n) |
| class-validator | 0.14 | DTO Validation |
| Docker + docker-compose | - | Containerization |

---

## هيكل المشروع

```
src/
├── main.ts                    # Bootstrap: Port, CORS, Swagger, Pipes, Guards
├── app.module.ts              # Root Module يجمع كل الموديولات
├── common/
│   ├── decorators/            # @CurrentUser, @Public, @Roles
│   ├── filters/               # HttpExceptionFilter (global)
│   ├── guards/                # JwtAuthGuard, RolesGuard
│   ├── interceptors/          # TransformInterceptor (response format)
│   └── interfaces/            # RequestUser interface
├── config/
│   ├── app.config.ts          # Port, API prefix, CORS, throttling
│   ├── database.config.ts     # MongoDB URI
│   ├── jwt.config.ts          # JWT secret & expiration
│   └── n8n.config.ts          # n8n webhook URL & API key
├── database/
│   └── seeders/               # Initial data seeding scripts
└── modules/
    ├── auth/                  # تسجيل دخول، تسجيل، refresh token
    ├── users/                 # إدارة المستخدمين
    ├── projects/              # إدارة المشاريع
    ├── surveys/               # استبيانات + أسئلة + ردود + تحليلات
    ├── activities/            # أنشطة + تسجيل + حضور
    ├── beneficiaries/         # المستفيدين
    ├── participants/          # المشاركين الأفراد
    ├── indicators/            # مؤشرات الأداء KPIs
    ├── analysis/              # تحليل ذكاء اصطناعي عبر n8n
    └── dashboard/             # إحصائيات لوحة التحكم
```

---

## قاعدة البيانات (MongoDB Collections)

### 1. users
```
{ name, email, password(hashed), role(admin|staff|viewer), status(active|inactive|suspended),
  phone, organization, department, lastLoginAt, emailVerified, refreshToken }
```

### 2. projects
```
{ name, description, type(needs_assessment|intervention|evaluation|mixed),
  status(draft|active|completed|archived), owner→User, team[→User],
  startDate, endDate, location, targetGroups[], budget{total,currency,spent},
  goals{short_term[], long_term[]}, tags[] }
```

### 3. beneficiaries
```
{ project→Project, beneficiaryType(person|area|group), name, city, region,
  populationSize, notes }
```

### 4. activities
```
{ project→Project, title, description, activityDate, startTime, endTime, location,
  capacity, registeredCount, attendedCount, speaker,
  activityType(training|workshop|seminar|consultation|field_visit|awareness_campaign|service_delivery|other),
  status(planned|in_progress|completed|cancelled) }
Virtual: isFull, availableSpots
```

### 5. participants
```
{ beneficiary→Beneficiary, project→Project, fullName, email, phone, nationalId,
  age, gender, educationLevel, occupation, city,
  participationType(full_time|part_time|online|in_person|hybrid),
  attendanceSessions, totalSessions, attendanceRate(calculated),
  preAssessmentScore, postAssessmentScore, improvementPercentage(calculated),
  status(active|completed|dropped|pending) }
Pre-save: calculates attendanceRate & improvementPercentage
```

### 6. activity_participants
```
{ activity→Activity, participant→Participant,
  attendanceStatus(present|absent|excused|late),
  checkInTime, checkOutTime, engagementLevel, participationScore,
  feedback, satisfactionRating, preAssessmentScore, postAssessmentScore, certificate }
Unique: activity + participant
```

### 7. indicators
```
{ project→Project, name, description,
  indicatorType(input|output|outcome|impact|process|custom),
  targetValue, actualValue, unit, calculationFormula, baselineValue,
  trend(improving|stable|declining|no_data),
  thresholds{critical,warning,good,excellent}, frequency, isActive }
Getter: achievementRate = actualValue/targetValue*100
```

### 8. indicator_histories
```
{ indicator→Indicator, recordedValue, calculatedAt, source,
  previousValue, changeAmount, changePercentage,
  status(recorded|verified|adjusted|deleted), verifiedBy }
```

### 9. surveys
```
{ title, description, type(needs_assessment|pre_evaluation|post_evaluation|satisfaction|feedback|custom),
  status(draft|active|closed|archived), project→Project, activity→Activity,
  startDate, endDate, isAnonymous, allowMultipleResponses,
  welcomeMessage, thankYouMessage, targetResponses, totalResponses,
  settings{showProgressBar, randomizeQuestions, requiredCompletion, language} }
```

### 10. survey_questions
```
{ survey→Survey, questionText, order,
  type(text|textarea|number|email|phone|date|single_choice|multiple_choice|dropdown|rating|scale|matrix|file_upload|yes_no),
  isRequired, options[], validation{min,max,minLength,maxLength,pattern},
  ratingConfig{min,max,minLabel,maxLabel,step},
  conditional{dependsOn→Question, showIf} }
```

### 11. survey_responses
```
{ survey→Survey, beneficiary→Beneficiary, participant→Participant,
  status(in_progress|completed|abandoned),
  startedAt, completedAt, timeSpent, completionPercentage,
  ipAddress, userAgent, metadata{deviceType,browser,os} }
```

### 12. survey_answers
```
{ response→SurveyResponse, question→SurveyQuestion,
  valueType(text|number|boolean|date|array|object),
  textValue, numberValue, booleanValue, dateValue, arrayValue, objectValue,
  isSkipped, timeSpent }
```

### 13. text_analyses
```
{ project→Project, surveyAnswer→SurveyAnswer, originalText, cleanedText,
  sentiment(very_negative|negative|neutral|positive|very_positive), sentimentScore(-1..1),
  keywords[], entities[], themes[], emotions{joy,sadness,anger,fear,surprise,trust},
  summary, actionItems[],
  status(pending|processing|completed|failed), n8nResponse }
```

### 14. topics
```
{ project→Project, name, keywords[], frequency, relevanceScore,
  overallSentiment, averageSentiment, isActive,
  statistics{totalMentions, uniqueSources, firstSeenAt, lastSeenAt} }
Unique: project + name
```

### 15. text_topics (junction table)
```
{ textAnalysis→TextAnalysis, topic→Topic, relevance, confidence,
  mentionedKeywords[], mentionCount, excerpt }
```

---

## API Endpoints الكاملة

### Auth (Public)
```
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/refresh
GET  /api/v1/auth/profile
```

### Users (Admin Only)
```
POST/GET         /api/v1/users
GET/PATCH/DELETE /api/v1/users/:id
```

### Projects
```
POST/GET                        /api/v1/projects
GET                             /api/v1/projects/my-projects
GET/PATCH/DELETE                /api/v1/projects/:id
GET                             /api/v1/projects/:id/statistics
POST/DELETE                     /api/v1/projects/:id/team/:memberId
```

### Beneficiaries
```
POST/GET   /api/v1/beneficiaries
GET        /api/v1/beneficiaries/statistics | /count
GET        /api/v1/beneficiaries/project/:projectId
GET        /api/v1/beneficiaries/type/:type
GET        /api/v1/beneficiaries/location
GET/PATCH/DELETE /api/v1/beneficiaries/:id
```

### Surveys (13 endpoints)
```
POST/GET           /api/v1/surveys
GET/PATCH/DELETE   /api/v1/surveys/:id
GET                /api/v1/surveys/:id/questions | /analytics | /responses
POST               /api/v1/surveys/questions
PATCH/DELETE       /api/v1/surveys/questions/:questionId
POST               /api/v1/surveys/responses
GET                /api/v1/surveys/responses/:responseId
```

### Activities (13 endpoints)
```
POST/GET           /api/v1/activities
GET                /api/v1/activities/upcoming | /statistics
GET                /api/v1/activities/project/:projectId
GET                /api/v1/activities/date-range
GET/PATCH/DELETE   /api/v1/activities/:id
GET                /api/v1/activities/:id/report
POST               /api/v1/activities/:id/register | /unregister
PATCH              /api/v1/activities/:id/attendance | /capacity
```

### Participants (14 endpoints)
```
POST/GET           /api/v1/participants
GET                /api/v1/participants/project/:projectId
GET                /api/v1/participants/beneficiary/:beneficiaryId
GET                /api/v1/participants/project/:projectId/stats
GET/PATCH/DELETE   /api/v1/participants/:id
GET                /api/v1/participants/:id/stats
PATCH/POST         /api/v1/participants/:id/attendance[/increment]
PATCH              /api/v1/participants/:id/total-sessions | /assessment-scores
POST               /api/v1/participants/attendance/bulk-update
```

### Indicators (14 endpoints)
```
POST/GET           /api/v1/indicators
GET                /api/v1/indicators/statistics | /count | /off-track
GET                /api/v1/indicators/project/:projectId
GET                /api/v1/indicators/type/:type | /trend/:trend
GET/PATCH/DELETE   /api/v1/indicators/:id
GET                /api/v1/indicators/:id/history
POST               /api/v1/indicators/:id/record-value
POST               /api/v1/indicators/:id/calculate-trend | /calculate-from-formula
```

### Analysis (AI - Admin Only)
```
POST /api/v1/analysis/survey-responses
POST /api/v1/analysis/impact-evaluation
POST /api/v1/analysis/needs-topics
POST /api/v1/analysis/comprehensive
GET  /api/v1/analysis/project/:projectId
```

### Dashboard
```
GET /api/v1/dashboard/stats
```

**الإجمالي: 50+ endpoint**

---

## المصادقة والصلاحيات

### JWT Strategy
- Token من Authorization header: `Bearer {token}`
- Payload: `{ _id, email, role }`
- Access Token: 7 أيام | Refresh Token: 30 يوم

### الأدوار
```
admin  → كل الصلاحيات
staff  → إنشاء أنشطة، مستفيدين، تسجيل حضور
viewer → قراءة فقط
```

### Decorators
- `@Public()` - بدون JWT
- `@Roles(UserRole.ADMIN)` - يحدد الأدوار المطلوبة
- `@CurrentUser()` - يحقن المستخدم الحالي

### Response Format (TransformInterceptor)
```json
{
  "statusCode": 200,
  "message": "Success",
  "data": { ... },
  "timestamp": "2024-01-18T12:00:00Z"
}
```

---

## تكامل الذكاء الاصطناعي (n8n)

### المعمارية
```
NestJS → POST webhook → n8n Workflow → LLM (LLaMA/GPT) → Response → MongoDB
```

### خدمة n8n (src/modules/analysis/services/n8n-ai.service.ts)
- Retry logic: 3 محاولات مع exponential backoff
- Timeout: 60 ثانية
- أنواع التحليل:
  - `text_analysis`: Sentiment، keywords، entities، emotions
  - `impact_evaluation`: مقارنة pre/post surveys
  - `topic_extraction`: استخراج مواضيع النقاش
  - `comprehensive`: تحليل شامل للمشروع

### نتائج التحليل تُحفظ في
- `text_analyses` - تحليل النصوص
- `topics` - المواضيع المستخرجة
- `text_topics` - ربط النصوص بالمواضيع

---

## متغيرات البيئة (.env)
```env
NODE_ENV=development
PORT=3000
API_PREFIX=api/v1
MONGODB_URI=mongodb://localhost:27017/social-impact-platform
JWT_SECRET=...
JWT_EXPIRATION=7d
JWT_REFRESH_SECRET=...
JWT_REFRESH_EXPIRATION=30d
N8N_WEBHOOK_URL=http://localhost:5678/webhook/analyze-impact
N8N_API_KEY=...
N8N_TIMEOUT=60000
CORS_ORIGIN=http://localhost:3001
THROTTLE_TTL=60
THROTTLE_LIMIT=100
```

---

## Docker Services
```yaml
services:
  social-impact-api:    # NestJS app - port 3000
  mongodb:              # MongoDB - port 27017
  social-impact-n8n:    # n8n automation - port 5678
  social-impact-ollama: # LLaMA AI model - port 11434
```

---

## Swagger API Docs
- URL: `http://localhost:3000/api/docs`
- Bearer token support مدمج

---

## Scripts
```bash
npm run start:dev   # Development with watch
npm run build       # Build for production
npm run start:prod  # Start production
npm run seed        # Seed initial data
npm run test        # Run tests
```
