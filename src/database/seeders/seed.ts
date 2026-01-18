import { NestFactory } from '@nestjs/core';
import { SeedModule } from './seed.module';
import { DatabaseSeeder } from './database.seeder';

async function bootstrap() {
  console.log('🌱 Starting database seeding process...\n');

  const app = await NestFactory.createApplicationContext(SeedModule);
  const seeder = app.get(DatabaseSeeder);

  try {
    const stats = await seeder.seed();

    console.log('\n✅ Database seeding completed successfully!\n');
    console.log('📊 Seeding Statistics:');
    console.log('─────────────────────────────────────');
    console.log(`👤 Users:              ${stats.users}`);
    console.log(`📁 Projects:           ${stats.projects}`);
    console.log(`👥 Beneficiaries:      ${stats.beneficiaries}`);
    console.log(`📅 Activities:         ${stats.activities}`);
    console.log(`🎓 Participants:       ${stats.participants}`);
    console.log(`📝 Surveys:            ${stats.surveys}`);
    console.log(`❓ Questions:          ${stats.questions}`);
    console.log(`📨 Responses:          ${stats.responses}`);
    console.log(`💬 Answers:            ${stats.answers}`);
    console.log(`🔍 Text Analyses:      ${stats.textAnalyses}`);
    console.log(`🏷️  Topics:             ${stats.topics}`);
    console.log(`📊 Indicators:         ${stats.indicators}`);
    console.log('─────────────────────────────────────\n');

    console.log('🔐 Default User Credentials:');
    console.log('─────────────────────────────────────');
    console.log('Admin:    admin@example.com    / Test123456!');
    console.log('Manager:  manager@example.com  / Test123456!');
    console.log('Viewer:   viewer@example.com   / Test123456!');
    console.log('─────────────────────────────────────\n');

    await app.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error during seeding:', error);
    await app.close();
    process.exit(1);
  }
}

bootstrap();
