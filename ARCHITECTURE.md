# Social Impact Platform - Architecture Documentation

## System Overview

Enterprise-grade backend system built with NestJS, MongoDB, and AI-powered analysis via n8n webhooks for measuring and evaluating social impact of community initiatives.

---

## Architecture Patterns

### 1. Clean Architecture
- **Domain Layer**: Schemas/Entities (MongoDB Models)
- **Application Layer**: Services (Business Logic)
- **Infrastructure Layer**: Controllers, DTOs, Guards
- **External Integration**: n8n AI Service

### 2. Modular Design
Each feature is self-contained in its own module:
- Users & Authentication
- Projects Management
- Surveys & Responses
- Analysis & AI Integration
- Indicators & Reporting

---

## Database Design (MongoDB)

### Entity Relationship Diagram

```
Users (1) ──────→ (N) Projects
Projects (1) ────→ (N) Beneficiaries
Projects (1) ────→ (N) Activities
Projects (1) ────→ (N) Surveys
Projects (1) ────→ (N) Indicators
Projects (1) ────→ (N) Topics
Projects (1) ────→ (N) Text_Analysis

Beneficiaries (1) ──→ (N) Participants
Beneficiaries (1) ──→ (N) Survey_Responses

Activities (1) ───→ (N) Activity_Participants
Activities (1) ───→ (N) Surveys

Participants (N) ←→ (N) Activities (via Activity_Participants)
Participants (1) ──→ (N) Survey_Responses

Surveys (1) ──────→ (N) Survey_Questions
Surveys (1) ──────→ (N) Survey_Responses

Survey_Responses (1) ─→ (N) Survey_Answers

Survey_Questions (1) ──→ (N) Survey_Answers

Survey_Answers (1) ──→ (1) Text_Analysis

Activity_Participants (1) → (1) Text_Analysis

Text_Analysis (1) ──→ (N) Text_Topics

Topics (1) ───────→ (N) Text_Topics

Indicators (1) ───→ (N) Indicator_History
```

---

## Collections (Schemas) Documentation

### 1. Users
**Purpose**: System users with role-based access

| Field | Type | Description |
|-------|------|-------------|
| name | String | Full name |
| email | String | Unique email (indexed) |
| password | String | Hashed password |
| role | Enum | admin, manager, viewer |
| status | Enum | active, inactive, suspended |
| phone | String | Phone number |
| organization | String | Organization name |
| department | String | Department |
| avatar | String | Avatar URL |
| lastLoginAt | Date | Last login timestamp |
| emailVerified | Boolean | Email verification status |

**Indexes**: email, role, status

---

### 2. Projects
**Purpose**: Main entity for social impact initiatives

| Field | Type | Description |
|-------|------|-------------|
| name | String | Project name |
| description | String | Detailed description |
| type | Enum | needs_assessment, intervention, evaluation, mixed |
| status | Enum | draft, active, completed, archived |
| owner | ObjectId → User | Project owner |
| team | Array[ObjectId] → User | Team members |
| startDate | Date | Project start date |
| endDate | Date | Project end date |
| location | String | Geographic location |
| targetGroups | Array[String] | Target beneficiary groups |
| budget | Object | { total, currency, spent } |
| goals | Object | { short_term[], long_term[] } |
| tags | Array[String] | Searchable tags |

**Indexes**: owner, status, type, startDate

---

### 3. Beneficiaries
**Purpose**: Individuals/groups benefiting from projects

| Field | Type | Description |
|-------|------|-------------|
| project | ObjectId → Project | Parent project |
| name | String | Beneficiary name |
| type | Enum | individual, family, community, organization |
| code | String | Anonymous identifier |
| region | String | Geographic region |
| area | String | Area/district |
| city | String | City |
| district | String | District |
| age | Number | Age |
| gender | Enum | male, female, other |
| phone | String | Contact phone |
| email | String | Contact email |
| educationLevel | String | Education level |
| employmentStatus | String | Employment status |
| familySize | Number | Family members count |
| monthlyIncome | Number | Monthly income |
| specialNeeds | Array[String] | Special needs/disabilities |
| demographics | Object | Custom demographic data |
| isActive | Boolean | Active status |

**Indexes**: project, type, region+area

---

### 4. Activities
**Purpose**: Project activities and interventions

| Field | Type | Description |
|-------|------|-------------|
| project | ObjectId → Project | Parent project |
| name | String | Activity name |
| description | String | Description |
| type | Enum | training, workshop, seminar, etc. |
| status | Enum | planned, in_progress, completed, cancelled |
| startDate | Date | Start date |
| endDate | Date | End date |
| location | String | Venue |
| duration | Number | Duration in minutes |
| facilitator | String | Facilitator name |
| targetParticipants | Number | Target participant count |
| actualParticipants | Number | Actual participant count |
| objectives | Array[String] | Learning objectives |
| materials | Array[String] | Required materials |
| resources | Object | Budget, equipment, venue details |

**Indexes**: project, status, type, startDate

---

### 5. Participants
**Purpose**: Individuals participating in activities

| Field | Type | Description |
|-------|------|-------------|
| beneficiary | ObjectId → Beneficiary | Related beneficiary |
| name | String | Participant name |
| email | String | Email |
| phone | String | Phone |
| age | Number | Age |
| gender | String | Gender |
| occupation | String | Current occupation |
| educationLevel | String | Education level |
| status | Enum | registered, attended, absent, cancelled |
| registrationDate | Date | Registration timestamp |
| interests | Array[String] | Areas of interest |
| skills | Array[String] | Existing skills |
| emergencyContact | String | Emergency contact |
| isActive | Boolean | Active status |

**Indexes**: beneficiary, status, email

---

### 6. Activity_Participants (Junction Table)
**Purpose**: Many-to-many relationship between activities and participants

| Field | Type | Description |
|-------|------|-------------|
| activity | ObjectId → Activity | Activity reference |
| participant | ObjectId → Participant | Participant reference |
| attendanceStatus | Enum | present, absent, excused, late |
| checkInTime | Date | Check-in timestamp |
| checkOutTime | Date | Check-out timestamp |
| engagementLevel | Enum | low, medium, high, very_high |
| participationScore | Number | Participation score (0-100) |
| feedback | String | Participant feedback |
| satisfactionRating | Number | Rating (1-5) |
| completedTasks | Array[String] | Completed tasks |
| preAssessmentScore | Number | Pre-activity score |
| postAssessmentScore | Number | Post-activity score |
| certificate | String | Certificate URL |

**Indexes**: activity+participant (unique compound), activity, participant

---

### 7. Surveys
**Purpose**: Survey definitions

| Field | Type | Description |
|-------|------|-------------|
| title | String | Survey title |
| description | String | Description |
| type | Enum | needs_assessment, pre_evaluation, post_evaluation, satisfaction, feedback |
| status | Enum | draft, active, closed, archived |
| project | ObjectId → Project | Related project (optional) |
| activity | ObjectId → Activity | Related activity (optional) |
| startDate | Date | Survey start date |
| endDate | Date | Survey end date |
| isAnonymous | Boolean | Anonymous responses |
| allowMultipleResponses | Boolean | Allow multiple submissions |
| welcomeMessage | String | Welcome text |
| thankYouMessage | String | Thank you text |
| targetResponses | Number | Target response count |
| totalResponses | Number | Actual response count |
| tags | Array[String] | Tags |
| settings | Object | { showProgressBar, randomizeQuestions, language } |

**Indexes**: project, activity, type, status

---

### 8. Survey_Questions
**Purpose**: Survey question definitions

| Field | Type | Description |
|-------|------|-------------|
| survey | ObjectId → Survey | Parent survey |
| questionText | String | Question text |
| type | Enum | text, textarea, number, single_choice, multiple_choice, rating, scale, matrix, yes_no, etc. |
| order | Number | Question order |
| isRequired | Boolean | Required question |
| description | String | Help text |
| placeholder | String | Placeholder text |
| options | Array[String] | Answer options (for choice questions) |
| validation | Object | { min, max, pattern, errorMessage } |
| ratingConfig | Object | { min, max, minLabel, maxLabel, step } |
| matrixConfig | Object | { rows[], columns[] } |
| conditional | Object | { dependsOn, showIf } |
| category | String | Question category |
| tags | Array[String] | Tags |

**Indexes**: survey+order, survey, type

---

### 9. Survey_Responses
**Purpose**: Survey response sessions

| Field | Type | Description |
|-------|------|-------------|
| survey | ObjectId → Survey | Survey reference |
| beneficiary | ObjectId → Beneficiary | Respondent (if beneficiary) |
| participant | ObjectId → Participant | Respondent (if participant) |
| status | Enum | in_progress, completed, abandoned |
| startedAt | Date | Start timestamp |
| completedAt | Date | Completion timestamp |
| timeSpent | Number | Time spent (seconds) |
| ipAddress | String | IP address |
| userAgent | String | Browser info |
| location | String | Geographic location |
| completionPercentage | Number | Completion % (0-100) |
| metadata | Object | Additional metadata |

**Indexes**: survey, beneficiary, participant, status

---

### 10. Survey_Answers
**Purpose**: Individual question answers

| Field | Type | Description |
|-------|------|-------------|
| surveyResponse | ObjectId → SurveyResponse | Parent response |
| question | ObjectId → SurveyQuestion | Question reference |
| valueType | Enum | text, number, boolean, date, array, object |
| textValue | String | Text answer |
| numberValue | Number | Numeric answer |
| booleanValue | Boolean | Yes/No answer |
| dateValue | Date | Date answer |
| arrayValue | Array[String] | Multiple choice answers |
| objectValue | Object | Complex answer (matrix, etc.) |
| fileUrl | String | Uploaded file URL |
| timeSpent | Number | Time on question (seconds) |
| revisionCount | Number | How many times changed |
| isSkipped | Boolean | Question skipped |

**Indexes**: surveyResponse+question (unique), surveyResponse, question

---

### 11. Text_Analysis
**Purpose**: AI-powered text analysis results

| Field | Type | Description |
|-------|------|-------------|
| project | ObjectId → Project | Related project |
| surveyAnswer | ObjectId → SurveyAnswer | Source answer (optional) |
| activityParticipant | ObjectId → ActivityParticipant | Source participant feedback (optional) |
| originalText | String | Original text |
| cleanedText | String | Cleaned/preprocessed text |
| sentiment | Enum | very_negative, negative, neutral, positive, very_positive |
| sentimentScore | Number | Score (-1 to 1) |
| sentimentConfidence | Number | Confidence (0-1) |
| keywords | Array[String] | Extracted keywords |
| entities | Array[String] | Named entities |
| themes | Array[Object] | { name, relevance, keywords[] } |
| emotions | Object | { joy, sadness, anger, fear, surprise, trust } |
| summary | String | AI-generated summary |
| actionItems | Array[String] | Extracted action items |
| language | String | Detected language |
| wordCount | Number | Word count |
| characterCount | Number | Character count |
| status | Enum | pending, processing, completed, failed |
| analyzedAt | Date | Analysis timestamp |
| errorMessage | String | Error (if failed) |
| n8nResponse | Object | Raw n8n response |

**Indexes**: project, surveyAnswer, sentiment, status

---

### 12. Topics
**Purpose**: Discovered topics/themes from analysis

| Field | Type | Description |
|-------|------|-------------|
| project | ObjectId → Project | Parent project |
| name | String | Topic name |
| description | String | Topic description |
| keywords | Array[String] | Related keywords |
| frequency | Number | Mention count |
| relevanceScore | Number | Relevance (0-1) |
| category | String | Topic category |
| relatedTopics | Array[String] | Related topic names |
| overallSentiment | String | positive, negative, neutral, mixed |
| averageSentiment | Number | Average sentiment score |
| isActive | Boolean | Active status |
| statistics | Object | { totalMentions, uniqueSources, firstSeenAt, lastSeenAt } |

**Indexes**: project, name, frequency, project+name (unique)

---

### 13. Text_Topics (Junction Table)
**Purpose**: Links text analyses to topics

| Field | Type | Description |
|-------|------|-------------|
| textAnalysis | ObjectId → TextAnalysis | Text analysis reference |
| topic | ObjectId → Topic | Topic reference |
| relevance | Number | Relevance score (0-1) |
| confidence | Number | AI confidence (0-1) |
| mentionedKeywords | Array[String] | Keywords found in text |
| mentionCount | Number | Number of mentions |
| positions | Array[Object] | { start, end, context } |
| excerpt | String | Sample text showing topic |

**Indexes**: textAnalysis+topic (unique), textAnalysis, topic, relevance

---

### 14. Indicators
**Purpose**: Impact measurement indicators/KPIs

| Field | Type | Description |
|-------|------|-------------|
| project | ObjectId → Project | Parent project |
| name | String | Indicator name |
| description | String | Description |
| type | Enum | quantitative, qualitative, composite |
| category | Enum | input, output, outcome, impact |
| unit | Enum | number, percentage, currency, hours, days, score, rating, custom |
| customUnit | String | Custom unit name |
| baselineValue | Number | Starting value |
| targetValue | Number | Target value |
| currentValue | Number | Current value |
| achievementRate | Number | % of target achieved |
| calculationFormula | String | Formula for composite indicators |
| trend | Enum | up, down, stable, fluctuating |
| dataSource | String | Data source |
| collectionMethod | String | How data is collected |
| frequency | String | Measurement frequency |
| responsiblePerson | String | Who measures |
| isActive | Boolean | Active status |
| tags | Array[String] | Tags |
| thresholds | Object | { critical, warning, good, excellent } |
| lastMeasuredAt | Date | Last measurement date |

**Indexes**: project, type, category, isActive

---

### 15. Indicator_History
**Purpose**: Historical indicator measurements

| Field | Type | Description |
|-------|------|-------------|
| indicator | ObjectId → Indicator | Parent indicator |
| value | Number | Measured value |
| measuredAt | Date | Measurement date |
| measuredBy | String | Who measured |
| status | Enum | recorded, verified, adjusted, deleted |
| notes | String | Measurement notes |
| dataSource | String | Data source |
| previousValue | Number | Previous value |
| changeAmount | Number | Absolute change |
| changePercentage | Number | Percentage change |
| context | Object | { activity, survey, event, period } |
| attachments | Array[String] | Supporting documents |
| verifiedBy | String | Who verified |
| verifiedAt | Date | Verification date |
| adjustmentReason | Object | { reason, adjustedBy, adjustedAt, originalValue } |

**Indexes**: indicator+measuredAt, indicator, measuredAt, status

---

## n8n Integration Architecture

### How it Works

```
NestJS Backend                n8n Workflow               LLaMA AI
     │                              │                       │
     │  1. Collect Data             │                       │
     ├──────────────────────────────►                       │
     │  POST /webhook/analyze       │                       │
     │  {                           │                       │
     │    projectInfo,              │  2. Process Prompt    │
     │    textData,                 ├──────────────────────►│
     │    indicators,               │                       │
     │    analysisType              │                       │
     │  }                           │                       │
     │                              │  3. AI Analysis       │
     │                              │◄──────────────────────┤
     │                              │  {                    │
     │                              │    sentiment,         │
     │  4. Save Results             │    topics,            │
     │◄──────────────────────────── │    recommendations    │
     │  {                           │  }                    │
     │    success: true,            │                       │
     │    data: { ... }             │                       │
     │  }                           │                       │
     │                              │                       │
     │  5. Store in MongoDB         │                       │
     │  - Text_Analysis             │                       │
     │  - Topics                    │                       │
     │  - Indicators                │                       │
     └──────────────────────────────────────────────────────┘
```

### n8n Payload Structure

```typescript
{
  projectInfo: {
    id: "project_id",
    name: "Project Name",
    description: "Description",
    type: "needs_assessment",
    goals: { ... }
  },
  surveyData: {
    preSurvey: [...],
    postSurvey: [...],
    responses: [...]
  },
  textData: ["text1", "text2", ...],
  indicators: [
    { name: "Knowledge Score", currentValue: 85, targetValue: 90 }
  ],
  language: "ar",
  analysisType: "comprehensive"
}
```

### n8n Response Structure

```typescript
{
  success: true,
  data: {
    textAnalysis: {
      sentiment: "positive",
      sentimentScore: 0.75,
      confidence: 0.92,
      keywords: ["education", "employment", "skills"],
      entities: ["Riyadh", "Youth Center"],
      emotions: { joy: 0.8, trust: 0.7 }
    },
    topics: [
      {
        name: "Employment Skills",
        keywords: ["job", "training", "skills"],
        relevance: 0.9,
        sentiment: "positive"
      }
    ],
    impactEvaluation: {
      overallImpact: 85,
      improvements: [
        { indicator: "Knowledge", improvement: 20, significance: "high" }
      ]
    },
    recommendations: [
      "Focus more on practical skills training",
      "Increase follow-up support"
    ],
    insights: [
      "Participants show high satisfaction",
      "Strong desire for continued learning"
    ]
  },
  metadata: {
    processingTime: 4500,
    model: "llama-3-70b",
    timestamp: "2024-01-15T10:30:00Z"
  }
}
```

---

## API Workflows

### Workflow 1: Needs Assessment

```
1. POST /api/v1/projects
   → Create project (type: needs_assessment)

2. POST /api/v1/beneficiaries (multiple times)
   → Add beneficiaries from different regions

3. POST /api/v1/surveys
   → Create needs survey

4. POST /api/v1/surveys/questions (multiple times)
   → Add open-ended questions about needs

5. POST /api/v1/surveys/responses (multiple times)
   → Collect responses from beneficiaries

6. POST /api/v1/analysis/needs-topics
   → Extract topics and needs from responses
   → n8n analyzes text, returns topics
   → System saves to Topics collection

7. GET /api/v1/analysis/project/{projectId}
   → View discovered needs and topics
```

### Workflow 2: Pre/Post Impact Evaluation

```
1. POST /api/v1/activities
   → Create activity

2. POST /api/v1/participants (multiple times)
   → Register participants

3. POST /api/v1/surveys (type: pre_evaluation)
   → Create pre-survey

4. POST /api/v1/surveys/questions
   → Add knowledge/skill questions

5. POST /api/v1/surveys/responses
   → Collect pre-activity responses

6. [Activity takes place]

7. POST /api/v1/surveys (type: post_evaluation)
   → Create post-survey (same questions)

8. POST /api/v1/surveys/responses
   → Collect post-activity responses

9. POST /api/v1/analysis/impact-evaluation
   → Compare pre/post
   → n8n analyzes improvement
   → Returns recommendations

10. GET /api/v1/surveys/{surveyId}/analytics
    → View improvement metrics
```

### Workflow 3: Indicator Tracking

```
1. POST /api/v1/indicators
   → Define project indicators

2. POST /api/v1/indicators/{id}/history (periodic)
   → Record measurements

3. GET /api/v1/indicators/{id}/trend
   → View trends over time

4. POST /api/v1/analysis/comprehensive
   → Generate comprehensive project report
```

---

## Best Practices Implemented

### 1. Security
- JWT authentication on all endpoints
- Role-based access control (RBAC)
- Password hashing with bcrypt
- Helmet for HTTP headers security
- Rate limiting with throttler
- Input validation with class-validator

### 2. Performance
- MongoDB indexes on frequently queried fields
- Compound indexes for complex queries
- Pagination support
- Response caching where appropriate
- Connection pooling
- Compression middleware

### 3. Code Quality
- TypeScript for type safety
- DTOs for request validation
- Swagger documentation
- Modular architecture
- Separation of concerns
- Dependency injection

### 4. Error Handling
- Global exception filter
- Custom error messages
- Proper HTTP status codes
- Logging with NestJS Logger

### 5. Testing Strategy
- Unit tests for services
- E2E tests for API endpoints
- Integration tests for n8n
- Mock external dependencies

---

## Future Enhancements

1. **Real-time Updates**: WebSocket support for live analytics
2. **File Storage**: AWS S3 integration for documents/photos
3. **Email Notifications**: SendGrid integration
4. **Advanced Analytics**: ML models for prediction
5. **Multi-language**: i18n support
6. **Caching**: Redis for response caching
7. **Queue System**: Bull for background jobs
8. **Audit Logs**: Track all data changes
9. **Export**: PDF/Excel report generation
10. **Mobile API**: GraphQL endpoint for mobile apps

---

## Environment Variables

See `.env.example` for all required configurations.

---

## Contact & Support

For technical questions or support, refer to the README.md file.
