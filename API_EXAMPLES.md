# API Usage Examples

## Base URL
```
http://localhost:3000/api/v1
```

## Authentication

### 1. Register New User
```http
POST /auth/register
Content-Type: application/json

{
  "name": "Ahmed Ali",
  "email": "ahmed@example.com",
  "password": "SecurePass123!",
  "phone": "+966501234567",
  "organization": "Social Development Center"
}

Response:
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "name": "Ahmed Ali",
    "email": "ahmed@example.com",
    "role": "viewer"
  }
}
```

### 2. Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "ahmed@example.com",
  "password": "SecurePass123!"
}

Response:
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "name": "Ahmed Ali",
    "email": "ahmed@example.com",
    "role": "viewer"
  }
}
```

### 3. Get Current User Profile
```http
GET /auth/profile
Authorization: Bearer {access_token}

Response:
{
  "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
  "name": "Ahmed Ali",
  "email": "ahmed@example.com",
  "role": "viewer",
  "organization": "Social Development Center",
  "createdAt": "2024-01-15T10:00:00Z"
}
```

---

## Projects

### 1. Create Project
```http
POST /projects
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "name": "Youth Empowerment Initiative 2024",
  "description": "A comprehensive program to empower youth through education and skills training",
  "type": "intervention",
  "status": "active",
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "location": "Riyadh, Saudi Arabia",
  "targetGroups": ["Youth 18-25", "Unemployed individuals"],
  "budget": {
    "total": 500000,
    "currency": "SAR",
    "spent": 0
  },
  "goals": {
    "short_term": [
      "Train 100 youth in employability skills",
      "Achieve 70% course completion rate"
    ],
    "long_term": [
      "Increase youth employment rate by 30%",
      "Create sustainable impact in community"
    ]
  },
  "tags": ["education", "employment", "youth", "skills"]
}

Response:
{
  "_id": "65a1b2c3d4e5f6g7h8i9j0k2",
  "name": "Youth Empowerment Initiative 2024",
  "type": "intervention",
  "status": "active",
  "owner": "65a1b2c3d4e5f6g7h8i9j0k1",
  "team": ["65a1b2c3d4e5f6g7h8i9j0k1"],
  "createdAt": "2024-01-15T10:00:00Z"
}
```

### 2. Get All Projects
```http
GET /projects
Authorization: Bearer {access_token}

Response:
[
  {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k2",
    "name": "Youth Empowerment Initiative 2024",
    "type": "intervention",
    "status": "active",
    "owner": {
      "name": "Ahmed Ali",
      "email": "ahmed@example.com"
    }
  }
]
```

### 3. Get Project Statistics
```http
GET /projects/65a1b2c3d4e5f6g7h8i9j0k2/statistics
Authorization: Bearer {access_token}

Response:
{
  "project": {
    "id": "65a1b2c3d4e5f6g7h8i9j0k2",
    "name": "Youth Empowerment Initiative 2024",
    "status": "active"
  },
  "statistics": {
    "totalBeneficiaries": 150,
    "totalActivities": 12,
    "totalSurveys": 4,
    "completionRate": 87.5
  }
}
```

---

## Surveys

### 1. Create Survey
```http
POST /surveys
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "title": "Pre-Training Assessment",
  "description": "Assess participants' knowledge before the training program",
  "type": "pre_evaluation",
  "project": "65a1b2c3d4e5f6g7h8i9j0k2",
  "startDate": "2024-01-20T00:00:00Z",
  "endDate": "2024-01-25T23:59:59Z",
  "isAnonymous": false,
  "allowMultipleResponses": false,
  "welcomeMessage": "Welcome! This survey will help us understand your current knowledge level.",
  "thankYouMessage": "Thank you for completing the assessment!",
  "targetResponses": 100,
  "tags": ["assessment", "baseline", "knowledge"],
  "settings": {
    "showProgressBar": true,
    "randomizeQuestions": false,
    "requiredCompletion": true,
    "language": "ar"
  }
}

Response:
{
  "_id": "65a1b2c3d4e5f6g7h8i9j0k3",
  "title": "Pre-Training Assessment",
  "type": "pre_evaluation",
  "status": "draft",
  "totalResponses": 0
}
```

### 2. Add Questions to Survey
```http
POST /surveys/questions
Authorization: Bearer {access_token}
Content-Type: application/json

// Question 1: Rating
{
  "survey": "65a1b2c3d4e5f6g7h8i9j0k3",
  "questionText": "How would you rate your current knowledge of digital marketing?",
  "type": "rating",
  "order": 1,
  "isRequired": true,
  "description": "1 = No knowledge, 5 = Expert level",
  "ratingConfig": {
    "min": 1,
    "max": 5,
    "minLabel": "No Knowledge",
    "maxLabel": "Expert",
    "step": 1
  },
  "category": "Knowledge Assessment"
}

// Question 2: Multiple Choice
{
  "survey": "65a1b2c3d4e5f6g7h8i9j0k3",
  "questionText": "Which of the following digital marketing channels have you used? (Select all that apply)",
  "type": "multiple_choice",
  "order": 2,
  "isRequired": true,
  "options": [
    "Social Media (Facebook, Twitter, Instagram)",
    "Email Marketing",
    "Search Engine Marketing (Google Ads)",
    "Content Marketing",
    "None of the above"
  ],
  "category": "Experience"
}

// Question 3: Open Text
{
  "survey": "65a1b2c3d4e5f6g7h8i9j0k3",
  "questionText": "What are your main goals for learning digital marketing?",
  "type": "textarea",
  "order": 3,
  "isRequired": true,
  "placeholder": "Please describe your goals in detail...",
  "validation": {
    "minLength": 50,
    "maxLength": 1000,
    "errorMessage": "Please provide at least 50 characters"
  },
  "category": "Goals"
}
```

### 3. Submit Survey Response
```http
POST /surveys/responses
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "survey": "65a1b2c3d4e5f6g7h8i9j0k3",
  "participant": "65a1b2c3d4e5f6g7h8i9j0k4",
  "answers": [
    {
      "question": "65a1b2c3d4e5f6g7h8i9j0k5",
      "valueType": "number",
      "numberValue": 3,
      "timeSpent": 5
    },
    {
      "question": "65a1b2c3d4e5f6g7h8i9j0k6",
      "valueType": "array",
      "arrayValue": [
        "Social Media (Facebook, Twitter, Instagram)",
        "Email Marketing"
      ],
      "timeSpent": 8
    },
    {
      "question": "65a1b2c3d4e5f6g7h8i9j0k7",
      "valueType": "text",
      "textValue": "أهدافي الرئيسية هي تعلم كيفية إنشاء حملات إعلانية فعالة على وسائل التواصل الاجتماعي وزيادة التفاعل مع العملاء المحتملين. أريد أيضاً فهم كيفية قياس نجاح الحملات التسويقية واستخدام البيانات لتحسين الأداء.",
      "timeSpent": 120
    }
  ],
  "language": "ar",
  "metadata": {
    "deviceType": "mobile",
    "browser": "Chrome"
  }
}

Response:
{
  "response": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k8",
    "survey": "65a1b2c3d4e5f6g7h8i9j0k3",
    "status": "completed",
    "completionPercentage": 100
  },
  "answers": [ ... ],
  "message": "Survey response submitted successfully"
}
```

### 4. Get Survey Analytics
```http
GET /surveys/65a1b2c3d4e5f6g7h8i9j0k3/analytics
Authorization: Bearer {access_token}

Response:
{
  "survey": {
    "id": "65a1b2c3d4e5f6g7h8i9j0k3",
    "title": "Pre-Training Assessment",
    "type": "pre_evaluation"
  },
  "totalResponses": 87,
  "completedResponses": 85,
  "averageCompletionTime": 245,
  "questionAnalytics": [
    {
      "questionId": "65a1b2c3d4e5f6g7h8i9j0k5",
      "questionText": "How would you rate your current knowledge...",
      "type": "rating",
      "totalAnswers": 85,
      "analysis": {
        "average": 2.8,
        "min": 1,
        "max": 5,
        "count": 85
      }
    },
    {
      "questionId": "65a1b2c3d4e5f6g7h8i9j0k6",
      "questionText": "Which digital marketing channels...",
      "type": "multiple_choice",
      "totalAnswers": 85,
      "analysis": {
        "distribution": {
          "Social Media": 72,
          "Email Marketing": 45,
          "Search Engine Marketing": 23,
          "Content Marketing": 31,
          "None": 8
        }
      }
    }
  ]
}
```

---

## Analysis (AI-Powered)

### 1. Analyze Survey Responses
```http
POST /analysis/survey-responses
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "projectId": "65a1b2c3d4e5f6g7h8i9j0k2",
  "surveyId": "65a1b2c3d4e5f6g7h8i9j0k3",
  "responses": [
    {
      "textValue": "أهدافي الرئيسية هي تعلم التسويق الرقمي لتطوير مشروعي الصغير..."
    },
    {
      "textValue": "أريد معرفة كيفية استخدام وسائل التواصل الاجتماعي للوصول للعملاء..."
    }
  ],
  "language": "ar"
}

Response:
{
  "analyzedResponses": 2,
  "topics": [
    {
      "name": "التسويق عبر وسائل التواصل الاجتماعي",
      "keywords": ["فيسبوك", "انستغرام", "تويتر", "تفاعل"],
      "relevance": 0.92,
      "sentiment": "positive"
    },
    {
      "name": "تطوير المشاريع الصغيرة",
      "keywords": ["مشروع", "تطوير", "نمو", "ريادة"],
      "relevance": 0.85,
      "sentiment": "positive"
    }
  ],
  "overallSentiment": {
    "overall": "positive",
    "score": 0.73
  },
  "insights": [
    "Most participants are interested in social media marketing",
    "Strong focus on practical business applications",
    "High motivation for learning new skills"
  ]
}
```

### 2. Evaluate Impact (Pre/Post Comparison)
```http
POST /analysis/impact-evaluation
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "projectId": "65a1b2c3d4e5f6g7h8i9j0k2",
  "activityId": "65a1b2c3d4e5f6g7h8i9j0k9",
  "preSurveyData": {
    "averageKnowledgeScore": 2.8,
    "averageConfidence": 2.5,
    "responses": [ ... ]
  },
  "postSurveyData": {
    "averageKnowledgeScore": 4.3,
    "averageConfidence": 4.1,
    "responses": [ ... ]
  },
  "indicators": [
    {
      "name": "Knowledge Score",
      "currentValue": 4.3,
      "targetValue": 4.0,
      "category": "outcome"
    },
    {
      "name": "Confidence Level",
      "currentValue": 4.1,
      "targetValue": 4.0,
      "category": "outcome"
    }
  ],
  "language": "ar"
}

Response:
{
  "improvements": [
    {
      "metric": "Knowledge Score",
      "preValue": 2.8,
      "postValue": 4.3,
      "improvement": 1.5,
      "improvementPercentage": 53.6
    },
    {
      "metric": "Confidence Level",
      "preValue": 2.5,
      "postValue": 4.1,
      "improvement": 1.6,
      "improvementPercentage": 64.0
    }
  ],
  "aiEvaluation": {
    "overallImpact": 87,
    "improvements": [
      {
        "indicator": "Knowledge",
        "improvement": 53.6,
        "significance": "high"
      },
      {
        "indicator": "Confidence",
        "improvement": 64.0,
        "significance": "very_high"
      }
    ],
    "analysis": "The training program showed excellent results with significant improvements in both knowledge and confidence levels. Participants demonstrated strong understanding of digital marketing concepts."
  },
  "recommendations": [
    "Continue with similar training format",
    "Add more hands-on practical exercises",
    "Provide ongoing mentorship for 3 months post-training",
    "Create alumni network for continued learning"
  ],
  "insights": [
    "Confidence improved more than knowledge, indicating effective teaching methods",
    "Participants are ready for advanced topics",
    "High satisfaction with practical components"
  ]
}
```

### 3. Extract Topics from Needs Assessment
```http
POST /analysis/needs-topics
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "projectId": "65a1b2c3d4e5f6g7h8i9j0k2",
  "projectName": "Community Needs Assessment 2024",
  "responses": [
    {
      "text": "نحتاج لبرامج تدريبية في مجال التكنولوجيا والبرمجة للشباب..."
    },
    {
      "text": "المنطقة تفتقر لفرص العمل وخاصة للنساء..."
    },
    {
      "text": "نحتاج مركز تدريب مهني يوفر دورات في المهن الحرفية..."
    }
  ],
  "language": "ar"
}

Response:
{
  "topics": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k10",
      "name": "التدريب التقني والبرمجة",
      "keywords": ["تكنولوجيا", "برمجة", "تدريب", "مهارات رقمية"],
      "frequency": 15,
      "relevanceScore": 0.94
    },
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k11",
      "name": "فرص العمل للنساء",
      "keywords": ["توظيف", "نساء", "فرص", "عمل"],
      "frequency": 12,
      "relevanceScore": 0.88
    },
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k12",
      "name": "التدريب المهني",
      "keywords": ["مهني", "حرف", "دورات", "مركز تدريب"],
      "frequency": 10,
      "relevanceScore": 0.82
    }
  ],
  "totalTopics": 3,
  "insights": [
    "Strong demand for technology and programming training",
    "Women's employment is a major concern",
    "Vocational training centers are needed"
  ]
}
```

### 4. Comprehensive Project Analysis
```http
POST /analysis/comprehensive
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "projectId": "65a1b2c3d4e5f6g7h8i9j0k2",
  "projectData": {
    "name": "Youth Empowerment Initiative 2024",
    "description": "Comprehensive youth program",
    "type": "intervention",
    "goals": {
      "short_term": ["Train 100 youth"],
      "long_term": ["Increase employment by 30%"]
    }
  },
  "allSurveyData": [ ... ],
  "indicators": [
    { "name": "Training Completion", "currentValue": 87, "targetValue": 90 },
    { "name": "Employment Rate", "currentValue": 32, "targetValue": 30 }
  ],
  "language": "ar"
}

Response:
{
  "textAnalysis": {
    "sentiment": "very_positive",
    "sentimentScore": 0.82,
    "confidence": 0.91,
    "keywords": ["تدريب", "توظيف", "مهارات", "نجاح"],
    "summary": "The project shows excellent results with high participant satisfaction..."
  },
  "topics": [ ... ],
  "impactEvaluation": {
    "overallImpact": 91,
    "achievements": [
      "Training completion rate: 87% (Target: 90%)",
      "Employment rate increased by 32% (Target: 30%)"
    ]
  },
  "recommendations": [
    "Expand program to reach more beneficiaries",
    "Strengthen partnerships with employers",
    "Develop advanced training tracks for graduates",
    "Create mentorship program"
  ],
  "insights": [
    "Project exceeded employment targets",
    "High satisfaction among participants",
    "Strong demand for continued support",
    "Successful model that can be replicated"
  ],
  "metadata": {
    "processingTime": 5420,
    "model": "llama-3-70b",
    "timestamp": "2024-01-15T14:30:00Z"
  }
}
```

### 5. Get Project Analysis History
```http
GET /analysis/project/65a1b2c3d4e5f6g7h8i9j0k2
Authorization: Bearer {access_token}

Response:
{
  "totalAnalyses": 45,
  "analyses": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k13",
      "sentiment": "positive",
      "sentimentScore": 0.75,
      "keywords": ["تدريب", "نجاح", "مهارات"],
      "analyzedAt": "2024-01-15T10:00:00Z"
    }
  ],
  "topics": [
    {
      "name": "التدريب التقني",
      "frequency": 23,
      "relevanceScore": 0.89
    }
  ],
  "sentimentDistribution": {
    "very_positive": 12,
    "positive": 25,
    "neutral": 7,
    "negative": 1,
    "very_negative": 0
  }
}
```

---

## Complete Workflow Example

### Scenario: Pre/Post Training Evaluation

```bash
# Step 1: Create Project
curl -X POST http://localhost:3000/api/v1/projects \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Digital Marketing Training 2024",
    "type": "intervention",
    "startDate": "2024-01-01"
  }'
# Returns: projectId

# Step 2: Create Activity
curl -X POST http://localhost:3000/api/v1/activities \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "project": "{projectId}",
    "name": "Digital Marketing Fundamentals Workshop",
    "type": "workshop",
    "startDate": "2024-02-01",
    "duration": 480
  }'
# Returns: activityId

# Step 3: Create Pre-Survey
curl -X POST http://localhost:3000/api/v1/surveys \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Pre-Workshop Assessment",
    "type": "pre_evaluation",
    "project": "{projectId}",
    "activity": "{activityId}"
  }'
# Returns: preSurveyId

# Step 4: Add Questions (repeat for each question)
curl -X POST http://localhost:3000/api/v1/surveys/questions \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "survey": "{preSurveyId}",
    "questionText": "Rate your digital marketing knowledge",
    "type": "rating",
    "order": 1,
    "ratingConfig": {"min": 1, "max": 5}
  }'

# Step 5: Collect Pre-Survey Responses (participants fill survey)
curl -X POST http://localhost:3000/api/v1/surveys/responses \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "survey": "{preSurveyId}",
    "participant": "{participantId}",
    "answers": [...]
  }'

# Step 6: Conduct Workshop (offline)

# Step 7: Create Post-Survey (same questions)
curl -X POST http://localhost:3000/api/v1/surveys \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Post-Workshop Assessment",
    "type": "post_evaluation",
    "project": "{projectId}",
    "activity": "{activityId}"
  }'

# Step 8: Collect Post-Survey Responses
# (Same as step 5 but with postSurveyId)

# Step 9: Evaluate Impact with AI
curl -X POST http://localhost:3000/api/v1/analysis/impact-evaluation \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "{projectId}",
    "activityId": "{activityId}",
    "preSurveyData": {...},
    "postSurveyData": {...},
    "indicators": [...]
  }'
# Returns: Comprehensive impact analysis with AI insights

# Step 10: View Analytics
curl -X GET http://localhost:3000/api/v1/analysis/project/{projectId} \
  -H "Authorization: Bearer {token}"
```

---

## Error Responses

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    "name should not be empty",
    "email must be an email"
  ]
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "You do not have permission to access this resource"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Project with ID 65a1b2c3d4e5f6g7h8i9j0k2 not found"
}
```

### 500 Internal Server Error
```json
{
  "statusCode": 500,
  "message": "Internal server error"
}
```

---

## Rate Limiting

The API has rate limiting enabled:
- **60 requests per minute** per IP address
- Exceeding the limit returns `429 Too Many Requests`

---

## Pagination

For endpoints returning lists, use query parameters:
```http
GET /projects?page=1&limit=10&sort=-createdAt
```

---

## Next Steps

1. Install dependencies: `npm install`
2. Configure environment variables in `.env`
3. Start MongoDB
4. Start the server: `npm run start:dev`
5. Access Swagger docs: `http://localhost:3000/api/docs`
6. Test APIs using Postman or curl
