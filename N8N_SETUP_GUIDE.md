# n8n Setup Guide for Social Impact Platform

## Overview
This guide explains how to set up n8n to work with LLaMA for AI-powered analysis in the Social Impact Platform.

---

## Prerequisites

1. **n8n installed** (Docker or npm)
2. **Ollama with LLaMA model** installed locally or on a server
3. **NestJS Backend** running (the platform)

---

## Installation Steps

### 1. Install n8n

#### Option A: Using Docker (Recommended)
```bash
docker run -d \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n
```

#### Option B: Using npm
```bash
npm install -g n8n
n8n start
```

Access n8n at: `http://localhost:5678`

---

### 2. Install Ollama and LLaMA

#### Install Ollama
```bash
# Linux/Mac
curl -fsSL https://ollama.ai/install.sh | sh

# Windows
# Download from https://ollama.ai/download
```

#### Pull LLaMA Model
```bash
# Pull LLaMA 3 70B (recommended for production)
ollama pull llama3:70b

# Or use smaller model for testing
ollama pull llama3:8b

# Or Arabic-optimized model
ollama pull aya:35b
```

#### Start Ollama Server
```bash
ollama serve
```

Ollama runs on: `http://localhost:11434`

---

### 3. Import Workflow into n8n

1. Open n8n: `http://localhost:5678`
2. Click **"Workflows"** → **"Import from File"**
3. Select `n8n-workflow-example.json` from the project
4. Click **"Import"**

---

### 4. Configure Ollama Credentials in n8n

1. In n8n, go to **Settings** → **Credentials**
2. Click **"Add Credential"**
3. Search for **"Ollama"**
4. Configure:
   - **Base URL**: `http://localhost:11434`
   - **Model**: `llama3:70b`
   - **Temperature**: `0.3` (for consistent results)
5. Click **"Save"**

---

### 5. Activate the Workflow

1. Open the imported workflow
2. Click **"Activate"** toggle in top-right
3. Note the webhook URL (e.g., `http://localhost:5678/webhook/analyze-impact`)

---

### 6. Update NestJS Configuration

Update `.env` file in NestJS backend:

```env
N8N_WEBHOOK_URL=http://localhost:5678/webhook/analyze-impact
N8N_API_KEY=your-optional-api-key
N8N_TIMEOUT=60000
```

---

## Testing the Integration

### Test 1: Simple Text Analysis

```bash
curl -X POST http://localhost:5678/webhook/analyze-impact \
  -H "Content-Type: application/json" \
  -d '{
    "projectInfo": {
      "id": "test123",
      "name": "Test Project",
      "description": "Testing",
      "type": "test"
    },
    "textData": [
      "البرنامج كان ممتاز وتعلمت مهارات جديدة مفيدة جداً",
      "أنا سعيد بالمشاركة وأتمنى المزيد من هذه البرامج"
    ],
    "language": "ar",
    "analysisType": "text_analysis"
  }'
```

Expected response:
```json
{
  "success": true,
  "data": {
    "textAnalysis": {
      "sentiment": "very_positive",
      "sentimentScore": 0.85,
      "confidence": 0.92,
      "keywords": ["برنامج", "مهارات", "سعيد"],
      "summary": "..."
    }
  }
}
```

### Test 2: Via NestJS API

```bash
# Login first
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password"}'

# Then analyze
curl -X POST http://localhost:3000/api/v1/analysis/survey-responses \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "...",
    "surveyId": "...",
    "responses": [...],
    "language": "ar"
  }'
```

---

## Workflow Customization

### Modify Prompts

Edit the prompt templates in each LLaMA node:

1. Click on **"LLaMA - Text Analysis"** node
2. Modify the **"Prompt"** field
3. Adjust temperature (0.1-1.0):
   - Lower (0.1-0.3): More consistent, factual
   - Higher (0.7-1.0): More creative, varied

### Add Custom Analysis Types

1. Add new condition in **"Route by Analysis Type"** node
2. Create new LLaMA node with custom prompt
3. Connect to **"Structure Response"** node

---

## Production Deployment

### 1. Deploy n8n on Server

```bash
# Using Docker Compose
docker-compose up -d n8n
```

`docker-compose.yml`:
```yaml
version: '3.8'
services:
  n8n:
    image: n8nio/n8n
    restart: always
    ports:
      - "5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=secure_password
      - WEBHOOK_URL=https://n8n.yourdomain.com
    volumes:
      - ~/.n8n:/home/node/.n8n
```

### 2. Deploy Ollama with GPU

```bash
# With NVIDIA GPU
docker run -d \
  --gpus all \
  -p 11434:11434 \
  -v ollama:/root/.ollama \
  --name ollama \
  ollama/ollama

# Then pull model
docker exec -it ollama ollama pull llama3:70b
```

### 3. Secure with HTTPS

Use nginx reverse proxy:

```nginx
server {
    listen 443 ssl;
    server_name n8n.yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:5678;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 4. Update Backend Config

```env
N8N_WEBHOOK_URL=https://n8n.yourdomain.com/webhook/analyze-impact
N8N_API_KEY=production-api-key-here
```

---

## Performance Optimization

### 1. Model Selection

| Model | Parameters | Speed | Quality | Use Case |
|-------|-----------|-------|---------|----------|
| llama3:8b | 8B | Fast | Good | Testing, simple tasks |
| llama3:70b | 70B | Slow | Excellent | Production, complex analysis |
| aya:35b | 35B | Medium | Excellent for Arabic | Arabic text focus |

### 2. Batch Processing

For large datasets, process in batches:

```typescript
// In NestJS
const batchSize = 10;
for (let i = 0; i < texts.length; i += batchSize) {
  const batch = texts.slice(i, i + batchSize);
  await n8nAiService.analyzeText(projectId, name, batch);
}
```

### 3. Caching

Cache frequent analyses:

```typescript
// In NestJS service
private cache = new Map();

async analyzeText(texts: string[]) {
  const cacheKey = texts.join('|');
  if (this.cache.has(cacheKey)) {
    return this.cache.get(cacheKey);
  }

  const result = await this.n8nAiService.analyzeText(...);
  this.cache.set(cacheKey, result);
  return result;
}
```

---

## Troubleshooting

### Issue 1: n8n Webhook Not Responding

**Solution**:
```bash
# Check n8n logs
docker logs n8n

# Verify webhook is active
curl http://localhost:5678/webhook-test/analyze-impact
```

### Issue 2: Ollama Model Not Found

**Solution**:
```bash
# List available models
ollama list

# Pull missing model
ollama pull llama3:70b
```

### Issue 3: Timeout Errors

**Solution**:
- Increase timeout in `.env`: `N8N_TIMEOUT=120000`
- Use smaller model
- Reduce text batch size

### Issue 4: Arabic Text Not Processing Correctly

**Solution**:
- Use `aya:35b` model (better for Arabic)
- Add language hint in prompt: "Respond in Arabic"
- Ensure UTF-8 encoding

---

## Monitoring

### 1. n8n Execution History

- View in n8n UI: **Executions** tab
- Check for errors and execution time

### 2. Ollama Metrics

```bash
# Check Ollama status
curl http://localhost:11434/api/tags

# Monitor resource usage
docker stats ollama
```

### 3. NestJS Logs

```typescript
// In n8n-ai.service.ts
this.logger.log(`AI analysis completed in ${processingTime}ms`);
this.logger.error(`AI analysis failed: ${error.message}`);
```

---

## Advanced Features

### 1. Multi-Model Routing

Route different analysis types to different models:

```javascript
// In n8n workflow
const modelMap = {
  'text_analysis': 'llama3:70b',
  'topic_extraction': 'aya:35b',
  'impact_evaluation': 'llama3:70b'
};

const selectedModel = modelMap[$json.analysisType];
```

### 2. Prompt Templates

Store prompts in database for easy updates:

```sql
-- prompts table
CREATE TABLE prompts (
  id UUID PRIMARY KEY,
  type VARCHAR(50),
  template TEXT,
  language VARCHAR(10),
  model VARCHAR(50)
);
```

### 3. A/B Testing

Test different prompts/models:

```typescript
const useExperimentalPrompt = Math.random() < 0.5;
const prompt = useExperimentalPrompt
  ? experimentalPrompt
  : standardPrompt;
```

---

## Security Best Practices

1. **Enable Authentication** on n8n
2. **Use API Keys** for webhook access
3. **Validate Input** before sending to AI
4. **Rate Limit** requests to prevent abuse
5. **Sanitize Output** before saving to database
6. **Use HTTPS** in production
7. **Rotate API Keys** regularly

---

## Cost Considerations

### Local Deployment (Ollama)
- **Cost**: Free (hardware only)
- **Pros**: No per-request fees, full control
- **Cons**: Requires powerful hardware

### Cloud AI Services (Alternative)
- **OpenAI GPT-4**: ~$0.03 per 1K tokens
- **Anthropic Claude**: ~$0.025 per 1K tokens
- **Azure OpenAI**: Similar pricing

For 10,000 analyses/month:
- **Ollama (local)**: $0 + electricity
- **Cloud APIs**: $300-500/month

---

## Next Steps

1. Test the workflow with sample data
2. Customize prompts for your use case
3. Monitor performance and accuracy
4. Scale based on usage
5. Implement caching and optimization

---

## Support

- n8n Docs: https://docs.n8n.io
- Ollama Docs: https://ollama.ai/docs
- LLaMA Models: https://llama.meta.com
