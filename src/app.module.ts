import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';

// Configuration
import databaseConfig from './config/database.config';
import appConfig from './config/app.config';
import jwtConfig from './config/jwt.config';
import n8nConfig from './config/n8n.config';

// Modules
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { BeneficiariesModule } from './modules/beneficiaries/beneficiaries.module';
import { ActivitiesModule } from './modules/activities/activities.module';
import { ParticipantsModule } from './modules/participants/participants.module';
import { SurveysModule } from './modules/surveys/surveys.module';
import { AnalysisModule } from './modules/analysis/analysis.module';
import { IndicatorsModule } from './modules/indicators/indicators.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';

// Guards, Filters, Interceptors
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, appConfig, jwtConfig, n8nConfig],
    }),

    // Database
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('database.uri'),
      }),
      inject: [ConfigService],
    }),

    // Rate Limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ([{
        ttl: configService.get<number>('app.throttleTtl') || 60,
        limit: configService.get<number>('app.throttleLimit') || 100,
      }]),
      inject: [ConfigService],
    }),

    // Feature Modules
    UsersModule,
    AuthModule,
    ProjectsModule,
    BeneficiariesModule,
    ActivitiesModule,
    ParticipantsModule,
    SurveysModule,
    AnalysisModule,
    IndicatorsModule,
    DashboardModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
  ],
})
export class AppModule {}
