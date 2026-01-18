# 🚀 Quick Start Guide - 5 Minutes to Running System

## Step 1: Prerequisites (2 minutes)

```bash
# Check if installed
docker --version
docker-compose --version
git --version

# If not installed, download:
# - Docker Desktop: https://www.docker.com/products/docker-desktop
# - Git: https://git-scm.com/downloads
```

---

## Step 2: Clone & Setup (1 minute)

```bash
# Clone repository
git clone <repository-url>
cd "grad back"

# Create environment file
cp .env.example .env

# No need to edit .env for local testing - defaults work!
```

---

## Step 3: Start Everything (1 minute)

```bash
# Start all services (MongoDB, Backend, n8n, Ollama)
docker-compose up -d

# View logs (optional)
docker-compose logs -f backend
```

**Wait 30 seconds for services to start...**

---

## Step 4: Download AI Model (1 minute)

```bash
# Pull LLaMA 3 model (8B - smaller, faster for testing)
docker exec -it social-impact-ollama ollama pull llama3:8b

# Or 70B model (better quality, slower)
# docker exec -it social-impact-ollama ollama pull llama3:70b
```

---

## Step 5: Test It! (30 seconds)

### Option A: Using Browser (Swagger)

1. Open: http://localhost:3000/api/docs
2. Click **"Authorize"** button
3. First, register/login (no token needed for these)
4. Copy the `access_token` from response
5. Click **"Authorize"** again, paste: `Bearer YOUR_TOKEN`
6. Try any endpoint!

### Option B: Using Postman

1. Import `postman-collection.json`
2. Import `postman-environment.json`
3. Select environment (top right)
4. Run: `1. Authentication` → `Register New User`
5. Token auto-saved! Try other requests.

### Option C: Using curl

```bash
# Register
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "Test123456!"
  }'

# Copy the access_token from response, then:

# Get Projects
curl http://localhost:3000/api/v1/projects \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## ✅ System Running!

You now have:
- ✅ Backend API: http://localhost:3000
- ✅ Swagger Docs: http://localhost:3000/api/docs
- ✅ n8n: http://localhost:5678 (admin/n8n_secure_password)
- ✅ MongoDB: localhost:27017
- ✅ Mongo Express: http://localhost:8081 (admin/admin) - Optional

---

## 🎯 Next Steps

### For Testing:
1. Read [POSTMAN_GUIDE.md](POSTMAN_GUIDE.md:1)
2. Follow step-by-step workflow
3. Test all features

### For Development:
1. Read [ARCHITECTURE.md](ARCHITECTURE.md:1)
2. Understand the system design
3. Start coding!

### For Production:
1. Read [DEPLOYMENT.md](DEPLOYMENT.md:1)
2. Configure production .env
3. Deploy to server

---

## 📚 Full Documentation

| File | Purpose |
|------|---------|
| [README.md](README.md:1) | Project overview |
| [ARCHITECTURE.md](ARCHITECTURE.md:1) | **Complete system design** ⭐ |
| [API_EXAMPLES.md](API_EXAMPLES.md:1) | API usage examples |
| [POSTMAN_GUIDE.md](POSTMAN_GUIDE.md:1) | Postman testing guide |
| [N8N_SETUP_GUIDE.md](N8N_SETUP_GUIDE.md:1) | n8n & LLaMA setup |
| [DEPLOYMENT.md](DEPLOYMENT.md:1) | Production deployment |
| [TESTING_GUIDE.md](TESTING_GUIDE.md:1) | Complete testing |
| [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md:1) | What's included |

---

## 🔧 Troubleshooting

### Services won't start?
```bash
# Check what's running
docker-compose ps

# Restart everything
docker-compose down
docker-compose up -d

# Check logs
docker-compose logs
```

### Can't connect to backend?
```bash
# Wait 30 seconds for MongoDB to start
# Then restart backend
docker-compose restart backend

# Check logs
docker-compose logs backend
```

### n8n not responding?
```bash
# Check n8n is running
curl http://localhost:5678

# Restart n8n
docker-compose restart n8n
```

### AI analysis fails?
```bash
# Check Ollama model is downloaded
docker exec -it social-impact-ollama ollama list

# If empty, pull model
docker exec -it social-impact-ollama ollama pull llama3:8b

# Verify n8n workflow is imported and active
# Go to http://localhost:5678
# Import n8n-workflow-example.json
# Click "Active" toggle
```

---

## 🎓 Learning Path

### Day 1: Understanding
1. Read [ARCHITECTURE.md](ARCHITECTURE.md:1) - 30 min
2. Understand database schemas
3. Review API endpoints

### Day 2: Testing
1. Follow [POSTMAN_GUIDE.md](POSTMAN_GUIDE.md:1) - 1 hour
2. Test all workflows
3. Understand responses

### Day 3: Development
1. Study code structure
2. Modify a module
3. Add new feature

### Day 4: Production
1. Follow [DEPLOYMENT.md](DEPLOYMENT.md:1)
2. Deploy to server
3. Configure production

---

## 💡 Quick Tips

### Stop All Services
```bash
docker-compose down
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f n8n
```

### Restart Service
```bash
docker-compose restart backend
docker-compose restart n8n
```

### Access MongoDB Shell
```bash
docker exec -it social-impact-mongodb mongosh \
  -u admin \
  -p secure_password_change_me \
  --authenticationDatabase admin \
  social-impact-platform
```

### Reset Everything
```bash
# Stop and remove everything
docker-compose down -v

# Remove all data (WARNING: deletes database!)
docker volume rm grad-back_mongodb_data

# Start fresh
docker-compose up -d
```

---

## 📞 Get Help

1. **Check logs first**: `docker-compose logs`
2. **Read relevant guide**: See table above
3. **Common issues**: [TESTING_GUIDE.md](TESTING_GUIDE.md:1) troubleshooting section
4. **Still stuck?**: Check GitHub issues

---

## 🎉 Success Indicators

Your system is working if:

✅ Swagger opens at http://localhost:3000/api/docs
✅ Register/Login works
✅ Can create project
✅ Can create survey
✅ Can submit responses
✅ AI analysis returns results (topics, sentiment)
✅ MongoDB has data (check Mongo Express)

---

## 🏆 You're Ready!

The platform is now running and ready for:
- ✅ Testing
- ✅ Development
- ✅ Integration
- ✅ Production deployment

**Total setup time: ~5 minutes**

**Next:** Choose your path:
- **Tester?** → [POSTMAN_GUIDE.md](POSTMAN_GUIDE.md:1)
- **Developer?** → [ARCHITECTURE.md](ARCHITECTURE.md:1)
- **DevOps?** → [DEPLOYMENT.md](DEPLOYMENT.md:1)

---

**Built with ❤️ using NestJS, MongoDB, n8n & LLaMA**

*Happy Coding! 🚀*
