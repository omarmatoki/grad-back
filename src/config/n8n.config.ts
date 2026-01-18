import { registerAs } from '@nestjs/config';

export default registerAs('n8n', () => ({
  webhookUrl: process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/analyze-impact',
  apiKey: process.env.N8N_API_KEY || '',
  timeout: parseInt(process.env.N8N_TIMEOUT || '60000', 10),
  retryAttempts: 3,
  retryDelay: 1000,
}));
