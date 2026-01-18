# Postman Testing Guide

## Quick Start

### 1. Import Collection & Environment

#### Import Collection
1. Open Postman
2. Click **Import** button (top left)
3. Select `postman-collection.json`
4. Click **Import**

#### Import Environment
1. Click **Environments** tab (left sidebar)
2. Click **Import**
3. Select `postman-environment.json`
4. Click **Import**

#### Activate Environment
1. Click environment dropdown (top right)
2. Select **"Social Impact Platform - Local"**

---

## 2. Test Workflow (Step by Step)

### Step 1: Authentication

#### A. Register New User
1. Navigate to: `1. Authentication` → `Register New User`
2. Click **Send**
3. ✅ Check Response:
   - Status: `201 Created`
   - Body contains `access_token` and `user` object
4. 🔑 Token automatically saved to environment

#### B. Login (Alternative)
1. Navigate to: `1. Authentication` → `Login`
2. Update email/password if needed
3. Click **Send**
4. ✅ Token automatically saved

#### C. Get Profile
1. Navigate to: `1. Authentication` → `Get Current User Profile`
2. Click **Send**
3. ✅ Should return your user data

**✅ Authentication Complete!**

---

### Step 2: Create Project

1. Navigate to: `3. Projects` → `Create Project`
2. Review the JSON body (Arabic project example)
3. Click **Send**
4. ✅ Check Response:
   - Status: `201 Created`
   - Copy the `_id` value
5. 🔑 Project ID automatically saved to environment

**Verify:**
- Navigate to: `3. Projects` → `Get All Projects`
- Click **Send**
- ✅ Should see your created project

---

### Step 3: Create Survey

1. Navigate to: `4. Surveys` → `Create Survey`
2. Body already uses `{{project_id}}` variable
3. Click **Send**
4. ✅ Check Response:
   - Status: `201 Created`
5. 🔑 Survey ID automatically saved

---

### Step 4: Add Questions

#### Add All Question Types:

1. **Rating Question**
   - Navigate to: `5. Survey Questions` → `Add Rating Question`
   - Click **Send**
   - ✅ Question ID saved

2. **Multiple Choice Question**
   - Navigate to: `5. Survey Questions` → `Add Multiple Choice Question`
   - Click **Send**

3. **Text Question**
   - Navigate to: `5. Survey Questions` → `Add Text Question`
   - Click **Send**

4. **Single Choice**
   - Navigate to: `5. Survey Questions` → `Add Single Choice Question`
   - Click **Send**

5. **Scale Question**
   - Navigate to: `5. Survey Questions` → `Add Scale Question`
   - Click **Send**

6. **Yes/No Question**
   - Navigate to: `5. Survey Questions` → `Add Yes/No Question`
   - Click **Send**

**Verify Questions:**
- Navigate to: `5. Survey Questions` → `Get Survey Questions`
- Click **Send**
- ✅ Should return array with 6 questions
- 📝 **Copy all question IDs** for next step

---

### Step 5: Submit Survey Response

⚠️ **Important**: Update question IDs first!

1. Navigate to: `6. Survey Responses` → `Submit Survey Response`
2. **Update the body** - Replace these placeholders with actual IDs:
   - `RATING_QUESTION_ID_HERE` → Your rating question ID
   - `MULTIPLE_CHOICE_QUESTION_ID_HERE` → Your multiple choice question ID
   - `TEXT_QUESTION_ID_HERE` → Your text question ID
   - `SINGLE_CHOICE_QUESTION_ID_HERE` → Your single choice question ID
   - `SCALE_QUESTION_ID_HERE` → Your scale question ID
   - `YES_NO_QUESTION_ID_HERE` → Your yes/no question ID

3. Click **Send**
4. ✅ Response submitted successfully

**How to get Question IDs:**
```javascript
// From "Get Survey Questions" response
{
  "_id": "65a1b2c3d4e5f6g7h8i9j0k5",  // This is the question ID
  "questionText": "كيف تقيم مستوى معرفتك...",
  "type": "rating"
}
```

**Submit Multiple Responses:**
- Change the `answers` values
- Click **Send** again (3-5 times)
- This creates test data for AI analysis

---

### Step 6: View Analytics

1. Navigate to: `6. Survey Responses` → `Get Survey Analytics`
2. Click **Send**
3. ✅ Check Response:
   - `totalResponses` count
   - `questionAnalytics` array with stats
   - Rating averages
   - Choice distributions

---

### Step 7: AI Analysis (The Magic! ✨)

⚠️ **Prerequisites:**
- n8n must be running
- Ollama must be running with LLaMA model
- At least 3-5 survey responses submitted

#### A. Analyze Survey Responses

1. Navigate to: `7. AI Analysis` → `Analyze Survey Responses`
2. Review the Arabic text in the body
3. Click **Send**
4. ⏳ Wait 5-10 seconds (AI processing)
5. ✅ Check Response:
```json
{
  "analyzedResponses": 5,
  "topics": [
    {
      "name": "التسويق الرقمي",
      "keywords": ["تسويق", "رقمي"],
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

**If it fails:**
```bash
# Check n8n
curl http://localhost:5678

# Check Ollama
curl http://localhost:11434/api/tags

# Check logs
docker logs social-impact-n8n
docker logs social-impact-ollama
```

#### B. Extract Topics (Needs Assessment)

1. Navigate to: `7. AI Analysis` → `Extract Topics (Needs Assessment)`
2. Click **Send**
3. ✅ Check topics extracted

#### C. Evaluate Impact (Pre/Post)

1. Navigate to: `7. AI Analysis` → `Evaluate Impact (Pre/Post)`
2. Click **Send**
3. ✅ Check improvements calculated

#### D. Comprehensive Analysis

1. Navigate to: `7. AI Analysis` → `Comprehensive Project Analysis`
2. Click **Send**
3. ✅ Full project analysis returned

---

### Step 8: Test n8n Directly (Optional)

This tests n8n webhook directly (bypasses NestJS):

1. Navigate to: `8. Test n8n Directly` → `Test n8n Webhook - Text Analysis`
2. Click **Send**
3. ✅ Should get AI response directly from n8n

---

## 3. All Available Requests

### 1. Authentication (3 requests)
- ✅ Register New User
- ✅ Login
- ✅ Get Current User Profile

### 2. Users Management (5 requests)
- Get All Users
- Get User by ID
- Create User (Admin)
- Update User
- Delete User

### 3. Projects (9 requests)
- ✅ Create Project
- ✅ Get All Projects
- Get My Projects
- Get Project by ID
- Get Project Statistics
- Update Project
- Delete Project
- Add Team Member
- Remove Team Member

### 4. Surveys (5 requests)
- ✅ Create Survey
- Get All Surveys
- Get Survey by ID
- Update Survey
- Delete Survey

### 5. Survey Questions (9 requests)
- ✅ Add Rating Question
- ✅ Add Multiple Choice Question
- ✅ Add Text Question
- Add Single Choice Question
- Add Scale Question
- Add Yes/No Question
- ✅ Get Survey Questions
- Update Question
- Delete Question

### 6. Survey Responses (4 requests)
- ✅ Submit Survey Response
- Get Survey Responses
- Get Response with Answers
- ✅ Get Survey Analytics

### 7. AI Analysis (5 requests)
- ✅ Analyze Survey Responses
- ✅ Extract Topics (Needs Assessment)
- ✅ Evaluate Impact (Pre/Post)
- ✅ Comprehensive Project Analysis
- Get Project Analysis History

### 8. Test n8n Directly (1 request)
- Test n8n Webhook

**Total: 41 API Requests**

---

## 4. Environment Variables

These are automatically set by test scripts:

| Variable | Description | Auto-Set By |
|----------|-------------|-------------|
| `access_token` | JWT Token | Login/Register |
| `user_id` | Current User ID | Login/Register |
| `project_id` | Current Project ID | Create Project |
| `survey_id` | Current Survey ID | Create Survey |
| `question_id` | Current Question ID | Add Question |
| `response_id` | Current Response ID | Submit Response |

**Manual Variables:**
- `base_url`: http://localhost:3000/api/v1
- `n8n_url`: http://localhost:5678

---

## 5. Tips & Tricks

### View Environment Variables
1. Click **Environments** (left sidebar)
2. Select **"Social Impact Platform - Local"**
3. See all saved variables

### Use Variables in Requests
```
{{variable_name}}
```

Example:
```
{{base_url}}/projects/{{project_id}}
```

### Save Custom Variables
In Tests tab:
```javascript
pm.environment.set('my_variable', 'value');
```

### Check Response Data
In Tests tab:
```javascript
var jsonData = pm.response.json();
console.log(jsonData);
pm.test("Status is 200", function () {
    pm.response.to.have.status(200);
});
```

---

## 6. Testing Checklist

Complete workflow test:

- [ ] Register user
- [ ] Login successful
- [ ] Get profile works
- [ ] Create project
- [ ] Create survey
- [ ] Add 6 questions (all types)
- [ ] Submit 3+ responses
- [ ] View analytics
- [ ] Run AI analysis
- [ ] Check topics extracted
- [ ] Evaluate impact
- [ ] Get comprehensive analysis

---

## 7. Common Issues

### Issue 1: "Unauthorized" Error
**Solution:**
```
1. Check environment is selected (top right)
2. Re-login to get new token
3. Verify token in environment variables
```

### Issue 2: "Question ID not found"
**Solution:**
```
1. Get questions: "Get Survey Questions"
2. Copy actual question IDs from response
3. Update "Submit Survey Response" body
```

### Issue 3: n8n Analysis Timeout
**Solution:**
```bash
# Increase timeout in .env
N8N_TIMEOUT=120000

# Or use smaller LLaMA model
docker exec -it social-impact-ollama ollama pull llama3:8b
```

### Issue 4: "Project not found"
**Solution:**
```
1. Check project_id in environment
2. Create new project
3. Verify project_id is saved
```

---

## 8. Advanced: Run Collection

### Run All Tests Automatically

1. Click **Collections** (left sidebar)
2. Click **"..."** on collection name
3. Click **"Run collection"**
4. Configure:
   - Select requests to run
   - Set iterations (1)
   - Set delay (500ms)
5. Click **"Run Social Impact Platform"**

This runs all requests in sequence!

---

## 9. Export Results

### Export Test Results
1. After running collection
2. Click **"Export Results"**
3. Choose format (JSON/HTML)
4. Save report

### Share Collection
1. Click **"..."** on collection
2. Click **"Share"**
3. Generate link or export

---

## 10. Production Environment

Create new environment for production:

```json
{
  "name": "Social Impact Platform - Production",
  "values": [
    {
      "key": "base_url",
      "value": "https://api.yourdomain.com/api/v1"
    },
    {
      "key": "access_token",
      "value": ""
    }
  ]
}
```

Switch environment in dropdown (top right).

---

## 11. Quick Reference

### Arabic Text Examples

For testing AI analysis:

**Positive Responses:**
```
البرنامج كان ممتاز وتعلمت الكثير
الدورة مفيدة جداً وأتمنى المزيد
راض جداً عن المحتوى والتنظيم
```

**Neutral Responses:**
```
البرنامج جيد بشكل عام
المحتوى مقبول والوقت مناسب
```

**Negative Responses:**
```
البرنامج لم يكن بالمستوى المتوقع
كان هناك نقص في التنظيم
الوقت غير كافٍ للتطبيق العملي
```

---

## 12. Video Tutorial (If Available)

1. Import collection & environment
2. Run authentication
3. Create project & survey
4. Add questions
5. Submit responses
6. Run AI analysis
7. View results

---

## Support

For issues with Postman collection:
1. Check [TESTING_GUIDE.md](TESTING_GUIDE.md:1)
2. Review [API_EXAMPLES.md](API_EXAMPLES.md:1)
3. Verify backend is running
4. Check environment variables

---

**Happy Testing! 🚀**
