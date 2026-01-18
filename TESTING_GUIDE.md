# Testing Guide - Social Impact Platform

## Overview
This guide provides step-by-step instructions for testing all features of the platform.

---

## Prerequisites

```bash
# System running
✓ MongoDB running (port 27017)
✓ Backend running (port 3000)
✓ n8n running (port 5678)
✓ Ollama running (port 11434)
✓ LLaMA model loaded
```

---

## Test 1: Health Checks

### Check All Services

```bash
# Backend Health
curl http://localhost:3000/api/v1/health
# Expected: 200 OK

# MongoDB Health
curl -I http://localhost:27017
# Expected: Connection

# n8n Health
curl http://localhost:5678
# Expected: n8n login page

# Ollama Health
curl http://localhost:11434/api/tags
# Expected: JSON with models list
```

---

## Test 2: Authentication Flow

### 1. Register New User

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "Test123456!",
    "organization": "Test Org"
  }'
```

**Expected Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "...",
    "name": "Test User",
    "email": "test@example.com",
    "role": "viewer"
  }
}
```

**✅ Save the `access_token` for next tests**

### 2. Login

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123456!"
  }'
```

### 3. Get Profile

```bash
curl -X GET http://localhost:3000/api/v1/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**✅ Pass**: Profile returned with user data

---

## Test 3: Project Management

### 1. Create Project

```bash
curl -X POST http://localhost:3000/api/v1/projects \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Youth Program 2024",
    "description": "Testing project creation",
    "type": "intervention",
    "startDate": "2024-01-01",
    "location": "Riyadh",
    "targetGroups": ["Youth"],
    "tags": ["test"]
  }'
```

**✅ Save the project `_id`**

### 2. Get All Projects

```bash
curl -X GET http://localhost:3000/api/v1/projects \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**✅ Pass**: Array with your created project

### 3. Get Project by ID

```bash
curl -X GET http://localhost:3000/api/v1/projects/PROJECT_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Test 4: Survey Creation & Submission

### 1. Create Survey

```bash
curl -X POST http://localhost:3000/api/v1/surveys \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Pre-Training Survey",
    "description": "Testing survey creation",
    "type": "pre_evaluation",
    "project": "PROJECT_ID_HERE",
    "isAnonymous": false,
    "targetResponses": 10
  }'
```

**✅ Save the survey `_id`**

### 2. Add Rating Question

```bash
curl -X POST http://localhost:3000/api/v1/surveys/questions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "survey": "SURVEY_ID_HERE",
    "questionText": "Rate your knowledge level",
    "type": "rating",
    "order": 1,
    "isRequired": true,
    "ratingConfig": {
      "min": 1,
      "max": 5,
      "minLabel": "Poor",
      "maxLabel": "Excellent"
    }
  }'
```

**✅ Save question `_id`**

### 3. Add Text Question

```bash
curl -X POST http://localhost:3000/api/v1/surveys/questions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "survey": "SURVEY_ID_HERE",
    "questionText": "What are your learning goals?",
    "type": "textarea",
    "order": 2,
    "isRequired": true,
    "placeholder": "Describe your goals..."
  }'
```

### 4. Get Survey Questions

```bash
curl -X GET http://localhost:3000/api/v1/surveys/SURVEY_ID/questions \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**✅ Pass**: Array with 2 questions

### 5. Submit Survey Response

```bash
curl -X POST http://localhost:3000/api/v1/surveys/responses \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "survey": "SURVEY_ID_HERE",
    "answers": [
      {
        "question": "RATING_QUESTION_ID",
        "valueType": "number",
        "numberValue": 3
      },
      {
        "question": "TEXT_QUESTION_ID",
        "valueType": "text",
        "textValue": "أريد تعلم مهارات جديدة في مجال التسويق الرقمي لتطوير مشروعي الخاص"
      }
    ]
  }'
```

**✅ Pass**: Response submitted successfully

### 6. Get Survey Analytics

```bash
curl -X GET http://localhost:3000/api/v1/surveys/SURVEY_ID/analytics \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**✅ Pass**: Analytics with question breakdown

---

## Test 5: AI Analysis (Critical)

### Setup: Submit Multiple Responses

Submit 3-5 survey responses with different Arabic text answers.

### 1. Test Text Analysis

```bash
curl -X POST http://localhost:3000/api/v1/analysis/survey-responses \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "PROJECT_ID",
    "surveyId": "SURVEY_ID",
    "responses": [
      {
        "textValue": "البرنامج كان ممتاز وتعلمت مهارات مفيدة جداً في التسويق الرقمي"
      },
      {
        "textValue": "أنا سعيد جداً بالمشاركة وأتمنى المزيد من هذه البرامج التدريبية"
      },
      {
        "textValue": "الدورة ساعدتني كثيراً في فهم وسائل التواصل الاجتماعي للأعمال"
      }
    ],
    "language": "ar"
  }'
```

**Expected Response:**
```json
{
  "analyzedResponses": 3,
  "topics": [
    {
      "name": "التسويق الرقمي",
      "keywords": ["تسويق", "رقمي", "وسائل التواصل"],
      "relevance": 0.92,
      "sentiment": "positive"
    }
  ],
  "overallSentiment": {
    "overall": "very_positive",
    "score": 0.85
  },
  "insights": [...]
}
```

**✅ Pass**: AI returned sentiment, topics, and insights

**⚠️ If fails:**
1. Check n8n is running: `curl http://localhost:5678`
2. Check Ollama: `curl http://localhost:11434/api/tags`
3. Check n8n workflow is activated
4. Check n8n logs: `docker logs social-impact-n8n`

### 2. Test Topic Extraction

```bash
curl -X POST http://localhost:3000/api/v1/analysis/needs-topics \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "PROJECT_ID",
    "projectName": "Needs Assessment",
    "responses": [
      {"text": "نحتاج لبرامج تدريبية في البرمجة"},
      {"text": "المنطقة تفتقر لفرص العمل"},
      {"text": "نريد مركز تدريب مهني"}
    ],
    "language": "ar"
  }'
```

**✅ Pass**: Topics extracted and saved to database

### 3. Test Impact Evaluation

```bash
curl -X POST http://localhost:3000/api/v1/analysis/impact-evaluation \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "PROJECT_ID",
    "activityId": "ACTIVITY_ID",
    "preSurveyData": {
      "averageKnowledgeScore": 2.5
    },
    "postSurveyData": {
      "averageKnowledgeScore": 4.2
    },
    "indicators": [
      {
        "name": "Knowledge",
        "currentValue": 4.2,
        "targetValue": 4.0
      }
    ],
    "language": "ar"
  }'
```

**✅ Pass**: Impact evaluation with improvements and recommendations

---

## Test 6: Database Verification

### Connect to MongoDB

```bash
# Using Docker
docker exec -it social-impact-mongodb mongosh \
  -u admin \
  -p secure_password_change_me \
  --authenticationDatabase admin \
  social-impact-platform

# Or use Mongo Express
# http://localhost:8081
```

### Check Collections

```javascript
// List all collections
show collections

// Expected collections:
// - users
// - projects
// - surveys
// - survey_questions
// - survey_responses
// - survey_answers
// - text_analyses
// - topics
// - text_topics

// Count documents
db.users.countDocuments()
db.projects.countDocuments()
db.surveys.countDocuments()

// Find your test data
db.projects.find({name: "Test Youth Program 2024"}).pretty()
db.surveys.find().pretty()
```

**✅ Pass**: All collections exist with test data

---

## Test 7: Swagger Documentation

### 1. Access Swagger UI

Open browser: http://localhost:3000/api/docs

### 2. Test Authentication

1. Click **"Authorize"** button (top right)
2. Enter: `Bearer YOUR_ACCESS_TOKEN`
3. Click **"Authorize"**

### 3. Test Endpoints via Swagger

Try executing:
- `GET /projects`
- `GET /surveys/{id}/analytics`
- `POST /analysis/survey-responses`

**✅ Pass**: All endpoints return expected data

---

## Test 8: Error Handling

### 1. Test Unauthorized Access

```bash
curl -X GET http://localhost:3000/api/v1/projects
# No Authorization header
```

**Expected:** `401 Unauthorized`

### 2. Test Invalid Data

```bash
curl -X POST http://localhost:3000/api/v1/projects \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "",
    "type": "invalid_type"
  }'
```

**Expected:** `400 Bad Request` with validation errors

### 3. Test Not Found

```bash
curl -X GET http://localhost:3000/api/v1/projects/invalid_id_here \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected:** `404 Not Found`

**✅ Pass**: All errors handled correctly

---

## Test 9: Performance Testing

### Test Concurrent Requests

```bash
# Install Apache Bench
sudo apt install apache2-utils

# Test 100 requests, 10 concurrent
ab -n 100 -c 10 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/v1/projects
```

**✅ Pass**:
- Requests per second > 50
- No failed requests
- Average response time < 200ms

---

## Test 10: n8n Workflow Testing

### 1. Access n8n

Open: http://localhost:5678

Login: `admin / n8n_secure_password`

### 2. Test Webhook Directly

```bash
curl -X POST http://localhost:5678/webhook/analyze-impact \
  -H "Content-Type: application/json" \
  -d '{
    "projectInfo": {
      "id": "test123",
      "name": "Test",
      "description": "Test",
      "type": "test"
    },
    "textData": [
      "البرنامج رائع وممتاز",
      "تعلمت الكثير من المهارات"
    ],
    "language": "ar",
    "analysisType": "text_analysis"
  }'
```

**Expected:** JSON response with sentiment, topics, keywords

**✅ Pass**: n8n returns structured AI analysis

---

## Test 11: Complete Workflow Test

### Scenario: Pre/Post Training Evaluation

```bash
# 1. Create project
PROJECT_ID=$(curl -s -X POST http://localhost:3000/api/v1/projects \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Complete Test","type":"intervention","startDate":"2024-01-01"}' \
  | jq -r '._id')

echo "Project ID: $PROJECT_ID"

# 2. Create pre-survey
PRE_SURVEY_ID=$(curl -s -X POST http://localhost:3000/api/v1/surveys \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"title\":\"Pre Test\",\"type\":\"pre_evaluation\",\"project\":\"$PROJECT_ID\"}" \
  | jq -r '._id')

echo "Pre-Survey ID: $PRE_SURVEY_ID"

# 3. Add question
QUESTION_ID=$(curl -s -X POST http://localhost:3000/api/v1/surveys/questions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"survey\":\"$PRE_SURVEY_ID\",\"questionText\":\"Rate knowledge\",\"type\":\"rating\",\"order\":1,\"ratingConfig\":{\"min\":1,\"max\":5}}" \
  | jq -r '._id')

# 4. Submit response
curl -X POST http://localhost:3000/api/v1/surveys/responses \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"survey\":\"$PRE_SURVEY_ID\",\"answers\":[{\"question\":\"$QUESTION_ID\",\"valueType\":\"number\",\"numberValue\":2}]}"

# 5. View analytics
curl -X GET http://localhost:3000/api/v1/surveys/$PRE_SURVEY_ID/analytics \
  -H "Authorization: Bearer $TOKEN"
```

**✅ Pass**: Complete workflow executes without errors

---

## Test Results Checklist

Mark each test as complete:

- [ ] Health checks all pass
- [ ] User registration works
- [ ] Login returns JWT token
- [ ] Project CRUD operations work
- [ ] Survey creation works
- [ ] Questions added successfully
- [ ] Survey responses submitted
- [ ] Analytics calculated correctly
- [ ] AI text analysis returns results
- [ ] Topics extracted by AI
- [ ] Impact evaluation works
- [ ] Database has all collections
- [ ] Swagger documentation accessible
- [ ] Error handling correct
- [ ] Performance acceptable
- [ ] n8n workflow responds
- [ ] Complete workflow succeeds

---

## Common Issues & Solutions

### Issue 1: "Cannot connect to MongoDB"

**Solution:**
```bash
# Check MongoDB is running
docker ps | grep mongodb

# Restart MongoDB
docker-compose restart mongodb
```

### Issue 2: "n8n webhook not responding"

**Solution:**
```bash
# Check n8n logs
docker logs social-impact-n8n

# Verify workflow is active
# Go to http://localhost:5678 and toggle workflow on
```

### Issue 3: "Ollama model not found"

**Solution:**
```bash
# Pull LLaMA model
docker exec -it social-impact-ollama ollama pull llama3:70b

# Verify
docker exec -it social-impact-ollama ollama list
```

### Issue 4: "JWT token expired"

**Solution:**
```bash
# Login again to get new token
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123456!"}'
```

### Issue 5: "Validation errors"

**Solution:**
- Check DTO requirements in Swagger docs
- Ensure all required fields are provided
- Check data types match schema

---

## Automated Testing (Future)

### Unit Tests

```bash
# Run unit tests (when implemented)
npm run test
```

### E2E Tests

```bash
# Run end-to-end tests (when implemented)
npm run test:e2e
```

### Coverage

```bash
# Generate coverage report (when implemented)
npm run test:cov
```

---

## Performance Benchmarks

**Expected Performance:**

| Operation | Time | Throughput |
|-----------|------|-----------|
| Login | < 100ms | 100 req/s |
| Get Projects | < 50ms | 200 req/s |
| Create Survey | < 200ms | 50 req/s |
| Submit Response | < 150ms | 70 req/s |
| AI Analysis | < 5s | 10 req/s |

---

## Test Data Cleanup

### Reset Database

```bash
# Drop all collections
docker exec -it social-impact-mongodb mongosh \
  -u admin \
  -p secure_password_change_me \
  --authenticationDatabase admin \
  social-impact-platform \
  --eval "db.dropDatabase()"

# Restart backend to recreate indexes
docker-compose restart backend
```

### Delete Test Project

```bash
curl -X DELETE http://localhost:3000/api/v1/projects/PROJECT_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Conclusion

If all tests pass, your system is fully functional and ready for:
- ✅ Development
- ✅ Integration Testing
- ✅ User Acceptance Testing (UAT)
- ✅ Production Deployment

---

**Testing Status**: Ready for comprehensive testing
**Last Updated**: 2024-01-17
