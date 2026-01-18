import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as compression from 'compression';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Get config service
  const configService = app.get(ConfigService);
  const port = configService.get<number>('app.port') || 3000;
  const apiPrefix = configService.get<string>('app.apiPrefix') || 'api/v1';
  const corsOrigin = configService.get<string>('app.corsOrigin') || 'http://localhost:4200';

  // Security
  app.use(helmet());
  app.use(compression());

  // CORS - Enhanced configuration for frontend integration
  app.enableCors({
    origin: process.env.NODE_ENV === 'production'
      ? corsOrigin.split(',') // Support multiple origins in production
      : true, // Allow all origins in development
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    credentials: true,
    maxAge: 3600, // Cache preflight requests for 1 hour
  });

  // Global prefix
  app.setGlobalPrefix(apiPrefix);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle('Social Impact Measurement Platform API')
    .setDescription(
      `
      # Social Impact Platform - API Documentation

      Enterprise-grade backend for measuring and evaluating social impact of community initiatives.

      ## Features
      - **Project Management**: Create and manage social impact projects
      - **Survey System**: Build surveys with multiple question types
      - **Response Collection**: Collect pre/post evaluation data
      - **AI Analysis**: Automated text analysis, sentiment detection, topic extraction via n8n
      - **Impact Evaluation**: Compare pre/post surveys and calculate improvements
      - **Indicator Tracking**: Define and monitor KPIs with historical trends
      - **Comprehensive Reporting**: Generate insights and recommendations

      ## Authentication
      All endpoints (except auth/register and auth/login) require JWT token in Authorization header:
      \`Authorization: Bearer <token>\`

      ## Roles
      - **Admin**: Full access to all features
      - **Manager**: Can create/manage projects, surveys, and view analytics
      - **Viewer**: Read-only access to assigned projects

      ## Workflow Examples

      ### 1. Needs Assessment Workflow
      1. Create Project (type: needs_assessment)
      2. Add Beneficiaries to project
      3. Create Survey (type: needs_assessment)
      4. Add Questions to survey
      5. Collect Responses from beneficiaries
      6. Analyze responses with AI → Extract topics and insights

      ### 2. Impact Evaluation Workflow
      1. Create Project and Activity
      2. Add Participants to activity
      3. Create Pre-Survey (type: pre_evaluation)
      4. Collect Pre-Survey responses
      5. Conduct Activity
      6. Create Post-Survey (type: post_evaluation)
      7. Collect Post-Survey responses
      8. Run Impact Evaluation → Compare pre/post and get AI insights

      ### 3. Indicator Monitoring Workflow
      1. Define Indicators for project
      2. Record measurements in Indicator_History
      3. Track trends over time
      4. Generate reports
      `,
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Authentication', 'User authentication and authorization')
    .addTag('Users', 'User management')
    .addTag('Projects', 'Project CRUD operations')
    .addTag('Surveys', 'Survey builder and response collection')
    .addTag('Analysis', 'AI-powered analysis and impact evaluation')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  await app.listen(port);

  console.log(`
  ╔═══════════════════════════════════════════════════════════════╗
  ║                                                               ║
  ║   Social Impact Measurement Platform - Backend API           ║
  ║                                                               ║
  ║   🚀 Server running on: http://localhost:${port}                  ║
  ║   📚 API Documentation: http://localhost:${port}/api/docs         ║
  ║   🔧 Environment: ${configService.get('app.nodeEnv')}                              ║
  ║                                                               ║
  ╚═══════════════════════════════════════════════════════════════╝
  `);
}

bootstrap();
