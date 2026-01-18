# Deployment Guide

## Quick Start (Development)

### 1. Local Development Setup

```bash
# Clone repository
git clone <repository-url>
cd grad-back

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Update .env with your settings
nano .env

# Start MongoDB (if not using Docker)
# Download from: https://www.mongodb.com/try/download/community

# Start development server
npm run start:dev
```

Access API: `http://localhost:3000/api/v1`
Access Swagger: `http://localhost:3000/api/docs`

---

## Docker Deployment (Recommended)

### 1. Prerequisites
- Docker Engine 20.10+
- Docker Compose 2.0+
- 4GB RAM minimum (8GB recommended for LLaMA)

### 2. Quick Start with Docker

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

Services will be available at:
- **Backend API**: http://localhost:3000
- **Swagger Docs**: http://localhost:3000/api/docs
- **n8n**: http://localhost:5678 (admin/n8n_secure_password)
- **MongoDB**: localhost:27017
- **Ollama**: http://localhost:11434

### 3. Initialize LLaMA Model

```bash
# Pull LLaMA model (one-time setup)
docker exec -it social-impact-ollama ollama pull llama3:70b

# Or use smaller model for testing
docker exec -it social-impact-ollama ollama pull llama3:8b

# Verify model is ready
docker exec -it social-impact-ollama ollama list
```

### 4. Import n8n Workflow

1. Access n8n: http://localhost:5678
2. Login with credentials from docker-compose.yml
3. Import `n8n-workflow-example.json`
4. Configure Ollama credentials in n8n
5. Activate workflow

### 5. Create First User

```bash
# Via API
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@example.com",
    "password": "SecurePass123!"
  }'
```

---

## Production Deployment

### Option 1: Cloud VM (AWS, DigitalOcean, etc.)

#### 1. Server Requirements

**Minimum Specs:**
- 4 CPU cores
- 16GB RAM (32GB for LLaMA 70B)
- 100GB SSD storage
- Ubuntu 22.04 LTS

**Recommended Specs:**
- 8 CPU cores
- 32GB RAM
- 200GB SSD
- NVIDIA GPU (optional, for faster AI)

#### 2. Initial Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt install docker-compose-plugin

# Install nginx
sudo apt install nginx certbot python3-certbot-nginx

# Reboot
sudo reboot
```

#### 3. Clone and Configure

```bash
# Clone repository
git clone <repository-url>
cd grad-back

# Create production .env
cp .env.example .env.production

# Edit with production values
nano .env.production
```

**.env.production** example:
```env
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb://admin:STRONG_PASSWORD@mongodb:27017/social-impact-platform?authSource=admin
JWT_SECRET=GENERATE_STRONG_SECRET_HERE
JWT_EXPIRATION=7d
N8N_WEBHOOK_URL=http://n8n:5678/webhook/analyze-impact
CORS_ORIGIN=https://yourdomain.com
```

#### 4. Start Services

```bash
# Start with production config
docker-compose -f docker-compose.yml --env-file .env.production up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f backend
```

#### 5. Configure Nginx Reverse Proxy

Create `/etc/nginx/sites-available/social-impact`:

```nginx
# Backend API
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# n8n
server {
    listen 80;
    server_name n8n.yourdomain.com;

    location / {
        proxy_pass http://localhost:5678;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/social-impact /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 6. Enable HTTPS with Let's Encrypt

```bash
sudo certbot --nginx -d api.yourdomain.com -d n8n.yourdomain.com
```

#### 7. Configure Firewall

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

---

### Option 2: Kubernetes Deployment

See `k8s/` directory for Kubernetes manifests (advanced).

---

## Database Backup

### Automated Backups

Create backup script `/usr/local/bin/backup-mongodb.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/backups/mongodb"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

docker exec social-impact-mongodb mongodump \
  --username admin \
  --password secure_password_change_me \
  --authenticationDatabase admin \
  --out /tmp/backup_$DATE

docker cp social-impact-mongodb:/tmp/backup_$DATE $BACKUP_DIR/

# Keep only last 7 days
find $BACKUP_DIR -type d -mtime +7 -exec rm -rf {} \;

echo "Backup completed: $BACKUP_DIR/backup_$DATE"
```

Schedule with cron:
```bash
sudo chmod +x /usr/local/bin/backup-mongodb.sh
sudo crontab -e

# Add line (daily at 2 AM):
0 2 * * * /usr/local/bin/backup-mongodb.sh
```

### Manual Backup

```bash
# Backup
docker exec social-impact-mongodb mongodump \
  --username admin \
  --password secure_password_change_me \
  --authenticationDatabase admin \
  --out /tmp/backup

docker cp social-impact-mongodb:/tmp/backup ./mongodb-backup-$(date +%Y%m%d)

# Restore
docker cp ./mongodb-backup-20240115 social-impact-mongodb:/tmp/restore
docker exec social-impact-mongodb mongorestore \
  --username admin \
  --password secure_password_change_me \
  --authenticationDatabase admin \
  /tmp/restore
```

---

## Monitoring

### Health Checks

```bash
# Backend health
curl http://localhost:3000/api/v1/health

# MongoDB health
docker exec social-impact-mongodb mongosh \
  --username admin \
  --password secure_password_change_me \
  --authenticationDatabase admin \
  --eval "db.adminCommand('ping')"

# n8n health
curl http://localhost:5678/healthz

# Ollama health
curl http://localhost:11434/api/tags
```

### Resource Monitoring

```bash
# Docker stats
docker stats

# Disk usage
docker system df

# Logs
docker-compose logs -f --tail=100 backend
```

### Setup Monitoring Stack (Optional)

Use Prometheus + Grafana for advanced monitoring.

---

## Scaling

### Horizontal Scaling (Multiple Backend Instances)

1. Update docker-compose.yml:

```yaml
backend:
  # ... existing config
  deploy:
    replicas: 3
```

2. Add load balancer (nginx):

```nginx
upstream backend {
    least_conn;
    server localhost:3001;
    server localhost:3002;
    server localhost:3003;
}

server {
    location / {
        proxy_pass http://backend;
    }
}
```

### Database Scaling

For production, use MongoDB Atlas or replica sets.

---

## Security Checklist

- [ ] Change all default passwords
- [ ] Generate strong JWT secret
- [ ] Enable HTTPS (SSL/TLS)
- [ ] Configure firewall (ufw/iptables)
- [ ] Set up fail2ban for SSH
- [ ] Regular security updates
- [ ] Enable MongoDB authentication
- [ ] Restrict MongoDB to localhost
- [ ] Use environment variables for secrets
- [ ] Enable rate limiting
- [ ] Regular backups
- [ ] Monitor logs for suspicious activity

---

## Troubleshooting

### Backend Won't Start

```bash
# Check logs
docker-compose logs backend

# Common issues:
# 1. MongoDB not ready → wait for healthcheck
# 2. Port 3000 in use → change PORT in .env
# 3. Missing .env file → create from .env.example
```

### n8n Workflow Errors

```bash
# Check n8n logs
docker-compose logs n8n

# Verify Ollama connection
docker exec -it social-impact-n8n curl http://ollama:11434/api/tags
```

### Ollama Out of Memory

```bash
# Use smaller model
docker exec -it social-impact-ollama ollama pull llama3:8b

# Or add more RAM to server
```

### High CPU Usage

```bash
# Check which service
docker stats

# If Ollama:
# - Use smaller model
# - Limit concurrent requests
# - Add GPU support
```

---

## Rollback

### Rollback to Previous Version

```bash
# Stop current version
docker-compose down

# Checkout previous version
git checkout <previous-commit-hash>

# Rebuild and start
docker-compose up -d --build
```

### Database Rollback

```bash
# Restore from backup
docker cp ./mongodb-backup-20240115 social-impact-mongodb:/tmp/restore
docker exec social-impact-mongodb mongorestore --drop /tmp/restore
```

---

## Performance Tuning

### MongoDB Indexes

Indexes are defined in schemas, but verify:

```javascript
db.users.getIndexes()
db.projects.getIndexes()
db.surveys.getIndexes()
```

### Caching

Add Redis for caching (optional):

```yaml
# In docker-compose.yml
redis:
  image: redis:7-alpine
  ports:
    - "6379:6379"
```

### Optimize LLaMA

```bash
# Use quantized models (smaller, faster)
ollama pull llama3:70b-q4_0

# Adjust context size
# In n8n, add to Ollama config:
num_ctx: 2048  # Default is 4096
```

---

## CI/CD Pipeline

Example GitHub Actions (`.github/workflows/deploy.yml`):

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /app/grad-back
            git pull
            docker-compose up -d --build
```

---

## Support

For issues or questions:
1. Check logs: `docker-compose logs`
2. Review documentation
3. Open GitHub issue
4. Contact support team

---

## License

See LICENSE file for details.
