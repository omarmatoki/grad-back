import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';

// Schemas
import { User, UserRole, UserStatus } from '../../modules/users/schemas/user.schema';
import { Project, ProjectStatus } from '../../modules/projects/schemas/project.schema';
import { Beneficiary, BeneficiaryType } from '../../modules/beneficiaries/schemas/beneficiary.schema';
import { Activity, ActivityType, ActivityStatus } from '../../modules/activities/schemas/activity.schema';
import { Participant, ParticipantStatus, Gender } from '../../modules/participants/schemas/participant.schema';
import { ActivityBeneficiary } from '../../modules/beneficiaries/schemas/activity-beneficiary.schema';
import { ActivityParticipant } from '../../modules/participants/schemas/activity-participant.schema';
import { Survey, SurveyType, SurveyStatus } from '../../modules/surveys/schemas/survey.schema';
import { SurveyQuestion } from '../../modules/surveys/schemas/survey-question.schema';
import { SurveySubmission } from '../../modules/surveys/schemas/survey-submission.schema';
import { SurveyCorrectAnswer } from '../../modules/surveys/schemas/survey-correct-answer.schema';
import { TextAnalysis } from '../../modules/analysis/schemas/text-analysis.schema';
import { Topic } from '../../modules/analysis/schemas/topic.schema';
import { TextTopic } from '../../modules/analysis/schemas/text-topic.schema';
import { Indicator, IndicatorType, MeasurementUnit, TrendDirection } from '../../modules/indicators/schemas/indicator.schema';
import { IndicatorHistory, MeasurementStatus } from '../../modules/indicators/schemas/indicator-history.schema';

@Injectable()
export class DatabaseSeeder {
  private readonly logger = new Logger(DatabaseSeeder.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Project.name) private projectModel: Model<Project>,
    @InjectModel(Beneficiary.name) private beneficiaryModel: Model<Beneficiary>,
    @InjectModel(ActivityBeneficiary.name) private activityBeneficiaryModel: Model<ActivityBeneficiary>,
    @InjectModel(Activity.name) private activityModel: Model<Activity>,
    @InjectModel(Participant.name) private participantModel: Model<Participant>,
    @InjectModel(ActivityParticipant.name) private activityParticipantModel: Model<ActivityParticipant>,
    @InjectModel(Survey.name) private surveyModel: Model<Survey>,
    @InjectModel(SurveyQuestion.name) private surveyQuestionModel: Model<SurveyQuestion>,
    @InjectModel(SurveySubmission.name) private surveySubmissionModel: Model<SurveySubmission>,
    @InjectModel(SurveyCorrectAnswer.name) private surveyCorrectAnswerModel: Model<SurveyCorrectAnswer>,
    @InjectModel(TextAnalysis.name) private textAnalysisModel: Model<TextAnalysis>,
    @InjectModel(Topic.name) private topicModel: Model<Topic>,
    @InjectModel(TextTopic.name) private textTopicModel: Model<TextTopic>,
    @InjectModel(Indicator.name) private indicatorModel: Model<Indicator>,
    @InjectModel(IndicatorHistory.name) private indicatorHistoryModel: Model<IndicatorHistory>,
  ) {}

  async seed() {
    this.logger.log('🌱 Starting database seeding...');

    try {
      // Clear existing data
      await this.clearDatabase();

      // Seed in order (respecting foreign key relationships)
      const users = await this.seedUsers();
      const projects = await this.seedProjects(users);
      const beneficiaries = await this.seedBeneficiaries();
      const activities = await this.seedActivities(projects);
      const participants = await this.seedParticipants(beneficiaries, projects);
      const surveys = await this.seedSurveys(projects, activities);
      const questions = await this.seedSurveyQuestions(surveys);
      const submissions = await this.seedSurveySubmissions(surveys, beneficiaries, participants, questions);
      const textAnalyses = await this.seedTextAnalyses(projects);
      const topics = await this.seedTopics(projects);
      await this.seedTextTopics(textAnalyses, topics);
      const indicators = await this.seedIndicators(projects);
      await this.seedIndicatorHistory(indicators);

      this.logger.log('✅ Database seeding completed successfully!');

      return {
        users: users.length,
        projects: projects.length,
        beneficiaries: beneficiaries.length,
        activities: activities.length,
        participants: participants.length,
        surveys: surveys.length,
        questions: questions.length,
        submissions: submissions.length,
        textAnalyses: textAnalyses.length,
        topics: topics.length,
        indicators: indicators.length,
      };
    } catch (error) {
      this.logger.error('❌ Error seeding database:', error);
      throw error;
    }
  }

  private async clearDatabase() {
    this.logger.log('🗑️  Clearing existing data...');

    await this.indicatorHistoryModel.deleteMany({});
    await this.indicatorModel.deleteMany({});
    await this.textTopicModel.deleteMany({});
    await this.topicModel.deleteMany({});
    await this.textAnalysisModel.deleteMany({});
    await this.surveyCorrectAnswerModel.deleteMany({});
    await this.surveySubmissionModel.deleteMany({});
    await this.surveyQuestionModel.deleteMany({});
    await this.surveyModel.deleteMany({});
    await this.activityParticipantModel.deleteMany({});
    await this.participantModel.deleteMany({});
    await this.activityBeneficiaryModel.deleteMany({});
    await this.activityModel.deleteMany({});
    await this.beneficiaryModel.deleteMany({});
    await this.projectModel.deleteMany({});
    await this.userModel.deleteMany({});

    this.logger.log('✅ Database cleared');
  }

  private async seedUsers() {
    this.logger.log('👤 Seeding users...');

    const hashedPassword = await bcrypt.hash('Test123456!', 10);

    const users = await this.userModel.insertMany([
      {
        name: 'أحمد المدير',
        email: 'admin@example.com',
        password: hashedPassword,
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        phone: '+966501234567',
      },
      {
        name: 'فاطمة المشرفة',
        email: 'manager@example.com',
        password: hashedPassword,
        role: UserRole.STAFF,
        status: UserStatus.ACTIVE,
        phone: '+966509876543',
      },
      {
        name: 'محمد المحلل',
        email: 'analyst@example.com',
        password: hashedPassword,
        role: UserRole.STAFF,
        status: UserStatus.ACTIVE,
        phone: '+966505555555',
      },
      {
        name: 'سارة القحطاني',
        email: 'sarah@example.com',
        password: hashedPassword,
        role: UserRole.STAFF,
        status: UserStatus.ACTIVE,
        phone: '+966502222222',
      },
      {
        name: 'خالد العتيبي',
        email: 'khaled@example.com',
        password: hashedPassword,
        role: UserRole.STAFF,
        status: UserStatus.ACTIVE,
        phone: '+966503333333',
      },
    ]);

    this.logger.log(`✅ Created ${users.length} users`);
    return users;
  }

  private async seedProjects(users: any[]) {
    this.logger.log('📁 Seeding projects...');

    const projects = await this.projectModel.insertMany([
      {
        user_id: users[0]._id,
        name: 'برنامج تمكين الشباب',
        description: 'برنامج تدريبي شامل يهدف إلى تمكين الشباب وتطوير مهاراتهم المهنية والحياتية',
        type: 'intervention',
        status: ProjectStatus.IN_PROGRESS,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2026-12-31'),
        targetGroups: ['الشباب من 18-35 سنة', 'الخريجون الجدد'],
        goals: {
          short_term: ['تطوير المهارات المهنية', 'زيادة فرص التوظيف'],
          long_term: ['تأهيل 1000 شاب للدخول في سوق العمل', 'تعزيز الثقة بالنفس'],
        },
        budget: {
          total: 5000000,
          spent: 1200000,
          currency: 'SAR',
        },
        location: 'الرياض',
      },
      {
        user_id: users[1]._id,
        name: 'مبادرة الأسر المنتجة',
        description: 'دعم الأسر لإنشاء مشاريع منزلية مدرة للدخل',
        type: 'intervention',
        status: ProjectStatus.IN_PROGRESS,
        startDate: new Date('2025-03-01'),
        endDate: new Date('2026-06-30'),
        targetGroups: ['ربات البيوت', 'الأسر ذات الدخل المحدود'],
        goals: {
          short_term: ['تعليم مهارات جديدة', 'تسويق المنتجات'],
          long_term: ['تمكين 500 أسرة من تحقيق دخل إضافي', 'تحسين الوضع الاقتصادي للأسر'],
        },
        budget: {
          total: 2000000,
          spent: 450000,
          currency: 'SAR',
        },
        location: 'جدة',
      },
      {
        user_id: users[0]._id,
        name: 'برنامج محو الأمية الرقمية',
        description: 'تعليم المهارات الرقمية الأساسية لكبار السن',
        type: 'intervention',
        status: ProjectStatus.PLANNED,
        startDate: new Date('2026-02-01'),
        endDate: new Date('2026-08-31'),
        targetGroups: ['كبار السن +50 سنة'],
        goals: {
          short_term: ['استخدام الهاتف الذكي', 'التعامل مع الخدمات الإلكترونية'],
          long_term: ['تمكين 300 شخص من استخدام التقنية', 'سد الفجوة الرقمية'],
        },
        budget: {
          total: 800000,
          spent: 0,
          currency: 'SAR',
        },
        location: 'الدمام',
      },
    ]);

    this.logger.log(`✅ Created ${projects.length} projects`);
    return projects;
  }

  private async seedBeneficiaries() {
    this.logger.log('👥 Seeding beneficiaries...');

    const beneficiaries = await this.beneficiaryModel.insertMany([
      // Individual beneficiaries
      {
        beneficiaryType: BeneficiaryType.INDIVIDUAL,
        name: 'عبدالله محمد السعيد',
        age: 24,
        educationLevel: 'بكالوريوس',
        profession: 'باحث عن عمل',
        gender: 'male',
        phone: '+966501111111',
        nationalId: '1234567890',
        city: 'الرياض',
        region: 'الوسطى',
        notes: 'خريج جامعي باحث عن عمل',
      },
      {
        beneficiaryType: BeneficiaryType.INDIVIDUAL,
        name: 'نورة أحمد القحطاني',
        age: 26,
        educationLevel: 'بكالوريوس',
        profession: 'موظفة',
        gender: 'female',
        phone: '+966502222222',
        nationalId: '2345678901',
        city: 'الرياض',
        region: 'الوسطى',
        notes: 'تبحث عن فرص تطوير مهني',
      },
      {
        beneficiaryType: BeneficiaryType.INDIVIDUAL,
        name: 'منى عبدالرحمن الزهراني',
        age: 35,
        educationLevel: 'ثانوي',
        profession: 'ربة منزل',
        gender: 'female',
        phone: '+966503333333',
        city: 'جدة',
        region: 'مكة المكرمة',
        notes: 'ربة منزل تريد بدء مشروع خياطة',
      },
      {
        beneficiaryType: BeneficiaryType.INDIVIDUAL,
        name: 'هدى خالد العمري',
        age: 32,
        educationLevel: 'بكالوريوس',
        profession: 'ربة منزل',
        gender: 'female',
        phone: '+966504444444',
        city: 'جدة',
        region: 'مكة المكرمة',
        notes: 'متخصصة في صناعة الحلويات',
      },
      {
        beneficiaryType: BeneficiaryType.INDIVIDUAL,
        name: 'سعد إبراهيم المطيري',
        age: 58,
        educationLevel: 'ثانوي',
        profession: 'متقاعد',
        gender: 'male',
        phone: '+966505555555',
        city: 'الدمام',
        region: 'الشرقية',
        notes: 'متقاعد يرغب في تعلم التقنية',
      },

      // Area beneficiaries
      {
        beneficiaryType: BeneficiaryType.AREA,
        name: 'حي النسيم',
        city: 'جدة',
        region: 'مكة المكرمة',
        population: 25000,
        areaSize: 12,
        notes: 'منطقة سكنية بحاجة لدعم الأسر',
      },
      {
        beneficiaryType: BeneficiaryType.AREA,
        name: 'حي الفيصلية',
        city: 'الدمام',
        region: 'الشرقية',
        population: 18000,
        areaSize: 8,
        notes: 'تركيز عالي من كبار السن',
      },
    ]);

    this.logger.log(`✅ Created ${beneficiaries.length} beneficiaries`);
    return beneficiaries;
  }

  private async seedActivities(projects: any[]) {
    this.logger.log('📅 Seeding activities...');

    const activities = await this.activityModel.insertMany([
      // Project 1 activities
      {
        project: projects[0]._id,
        title: 'ورشة عمل: مهارات القيادة والإدارة',
        description: 'ورشة تدريبية شاملة لتطوير مهارات القيادة الفعالة',
        activityDate: new Date('2025-06-15'),
        startTime: '09:00',
        endTime: '15:00',
        location: 'قاعة المؤتمرات - مركز الملك فهد الثقافي',
        capacity: 60,
        registeredCount: 55,
        activityType: ActivityType.WORKSHOP,
        status: ActivityStatus.COMPLETED,
        tags: ['قيادة', 'إدارة', 'تطوير'],
      },
      {
        project: projects[0]._id,
        title: 'دورة تدريبية: البرمجة للمبتدئين',
        description: 'تعلم أساسيات البرمجة باستخدام Python',
        activityDate: new Date('2025-07-20'),
        startTime: '17:00',
        endTime: '21:00',
        location: 'معمل الحاسب - جامعة الملك سعود',
        capacity: 40,
        registeredCount: 38,
        activityType: ActivityType.TRAINING,
        status: ActivityStatus.COMPLETED,
        tags: ['برمجة', 'تقنية', 'شباب'],
      },
      {
        project: projects[0]._id,
        title: 'محاضرة: ريادة الأعمال في العصر الرقمي',
        description: 'كيف تبدأ مشروعك الناجح في الاقتصاد الرقمي',
        activityDate: new Date('2026-02-10'),
        startTime: '19:00',
        endTime: '21:00',
        location: 'قاعة الملك فيصل',
        capacity: 200,
        registeredCount: 175,
        activityType: ActivityType.SEMINAR,
        status: ActivityStatus.PLANNED,
        tags: ['ريادة', 'اقتصاد', 'رقمي'],
      },

      // Project 2 activities
      {
        project: projects[1]._id,
        title: 'ورشة عمل: تسويق المنتجات عبر وسائل التواصل',
        description: 'استراتيجيات فعالة للتسويق الإلكتروني',
        activityDate: new Date('2025-05-10'),
        startTime: '10:00',
        endTime: '14:00',
        location: 'مركز التدريب - جدة',
        capacity: 50,
        registeredCount: 48,
        activityType: ActivityType.WORKSHOP,
        status: ActivityStatus.COMPLETED,
        tags: ['تسويق', 'تواصل', 'أسر منتجة'],
      },
      {
        project: projects[1]._id,
        title: 'دورة: إدارة المشاريع الصغيرة',
        description: 'أساسيات إدارة المشاريع المنزلية الناجحة',
        activityDate: new Date('2025-08-15'),
        startTime: '16:00',
        endTime: '20:00',
        location: 'مركز سيدات الأعمال',
        capacity: 35,
        registeredCount: 32,
        activityType: ActivityType.TRAINING,
        status: ActivityStatus.COMPLETED,
        tags: ['إدارة', 'مشاريع', 'أسر'],
      },
    ]);

    this.logger.log(`✅ Created ${activities.length} activities`);
    return activities;
  }

  private async seedParticipants(beneficiaries: any[], _projects: any[]) {
    this.logger.log('🎓 Seeding participants...');

    const participants = await this.participantModel.insertMany([
      {
        beneficiary: beneficiaries[0]._id,
        fullName: 'عبدالله محمد السعيد',
        email: 'abdullah@example.com',
        phone: '+966501111111',
        nationalId: '1234567890',
        age: 24,
        gender: Gender.MALE,
        city: 'الرياض',
        educationLevel: 'بكالوريوس',
        occupation: 'باحث عن عمل',
        status: ParticipantStatus.ACTIVE,
      },
      {
        beneficiary: beneficiaries[1]._id,
        fullName: 'نورة أحمد القحطاني',
        email: 'noura@example.com',
        phone: '+966502222222',
        nationalId: '2345678901',
        age: 26,
        gender: Gender.FEMALE,
        city: 'الرياض',
        educationLevel: 'ماجستير',
        occupation: 'معلمة',
        status: ParticipantStatus.ACTIVE,
      },
      {
        beneficiary: beneficiaries[2]._id,
        fullName: 'منى عبدالرحمن الزهراني',
        email: 'mona@example.com',
        phone: '+966503333333',
        nationalId: '3456789012',
        age: 35,
        gender: Gender.FEMALE,
        city: 'جدة',
        educationLevel: 'ثانوية عامة',
        occupation: 'ربة منزل',
        status: ParticipantStatus.ACTIVE,
      },
      {
        beneficiary: beneficiaries[3]._id,
        fullName: 'هدى خالد العمري',
        email: 'huda@example.com',
        phone: '+966504444444',
        nationalId: '4567890123',
        age: 32,
        gender: Gender.FEMALE,
        city: 'جدة',
        educationLevel: 'بكالوريوس',
        occupation: 'محاسبة',
        status: ParticipantStatus.COMPLETED,
      },
      {
        beneficiary: beneficiaries[4]._id,
        fullName: 'سعد إبراهيم المطيري',
        email: 'saad@example.com',
        phone: '+966505555555',
        nationalId: '5678901234',
        age: 58,
        gender: Gender.MALE,
        city: 'الدمام',
        educationLevel: 'ثانوية عامة',
        occupation: 'متقاعد',
        status: ParticipantStatus.ACTIVE,
      },
    ]);

    this.logger.log(`✅ Created ${participants.length} participants`);
    return participants;
  }

  private async seedSurveys(projects: any[], activities: any[]) {
    this.logger.log('📝 Seeding surveys...');

    const surveys = await this.surveyModel.insertMany([
      {
        activity: activities[0]._id,
        title: 'اختبار قبلي - ورشة مهارات القيادة',
        description: 'قياس مستوى المهارات القيادية قبل الورشة',
        type: SurveyType.TEST,
        status: SurveyStatus.CLOSED,
        targetResponses: 55,
        totalResponses: 52,
      },
      {
        activity: activities[0]._id,
        title: 'اختبار بعدي - ورشة مهارات القيادة',
        description: 'قياس التحسن في المهارات القيادية بعد الورشة',
        type: SurveyType.TEST,
        status: SurveyStatus.CLOSED,
        targetResponses: 55,
        totalResponses: 50,
      },
      {
        activity: activities[1]._id,
        title: 'تقييم دورة البرمجة',
        description: 'تقييم شامل لدورة البرمجة للمبتدئين',
        type: SurveyType.EVALUATION,
        status: SurveyStatus.CLOSED,
        targetResponses: 40,
        totalResponses: 35,
      },
      {
        activity: activities[3]._id,
        title: 'استبيان رضا المستفيدات - ورشة التسويق',
        description: 'قياس مدى رضا الحاضرات عن ورشة التسويق',
        type: SurveyType.SATISFACTION,
        status: SurveyStatus.ACTIVE,
        targetResponses: 40,
        totalResponses: 28,
      },
    ]);

    this.logger.log(`✅ Created ${surveys.length} surveys`);
    return surveys;
  }

  private async seedSurveyQuestions(surveys: any[]) {
    this.logger.log('❓ Seeding survey questions...');

    const questions = await this.surveyQuestionModel.insertMany([
      // Survey 1 questions (استبيان دراسة احتياج)
      {
        survey: surveys[0]._id,
        questionText: 'ما هي المهارات التي ترغب في تطويرها؟',
        type: 'multiple_choice',
        options: ['القيادة والإدارة', 'البرمجة والتقنية', 'التسويق والمبيعات', 'المهارات الشخصية', 'إدارة المشاريع'],
        isRequired: true,
      },
      {
        survey: surveys[0]._id,
        questionText: 'ما هو مستوى خبرتك الحالي؟',
        type: 'single_choice',
        options: ['مبتدئ', 'متوسط', 'متقدم', 'خبير'],
        isRequired: true,
      },
      {
        survey: surveys[0]._id,
        questionText: 'ما هي أهدافك المهنية؟',
        type: 'textarea',
        isRequired: true,
      },

      // Survey 2 questions (تقييم قبلي)
      {
        survey: surveys[1]._id,
        questionText: 'قيّم مستوى مهاراتك القيادية الحالية',
        type: 'rating',
        isRequired: true,
      },
      {
        survey: surveys[1]._id,
        questionText: 'هل سبق لك العمل في منصب قيادي؟',
        type: 'yes_no',
        isRequired: true,
      },
      {
        survey: surveys[1]._id,
        questionText: 'ما هي نقاط القوة لديك في القيادة؟',
        type: 'textarea',
        isRequired: false,
      },

      // Survey 3 questions (تقييم بعدي)
      {
        survey: surveys[2]._id,
        questionText: 'قيّم مستوى مهاراتك القيادية بعد الورشة',
        type: 'rating',
        isRequired: true,
      },
      {
        survey: surveys[2]._id,
        questionText: 'ما مدى استفادتك من الورشة؟',
        type: 'scale',
        isRequired: true,
      },
      {
        survey: surveys[2]._id,
        questionText: 'ما هي أهم ثلاث معلومات استفدت منها؟',
        type: 'textarea',
        isRequired: true,
      },

      // Survey 4 questions (استبيان رضا)
      {
        survey: surveys[3]._id,
        questionText: 'ما مدى رضاك عن البرنامج بشكل عام؟',
        type: 'rating',
        isRequired: true,
      },
      {
        survey: surveys[3]._id,
        questionText: 'هل حقق البرنامج توقعاتك؟',
        type: 'yes_no',
        isRequired: true,
      },
      {
        survey: surveys[3]._id,
        questionText: 'ما هي اقتراحاتك لتحسين البرنامج؟',
        type: 'textarea',
        isRequired: false,
      },
    ]);

    this.logger.log(`✅ Created ${questions.length} survey questions`);
    return questions;
  }

  /**
   * Seeds SurveySubmission documents (flat model — one doc per question per respondent session).
   */
  private async seedSurveySubmissions(
    surveys: any[],
    beneficiaries: any[],
    _participants: any[],
    questions: any[],
  ) {
    this.logger.log('📨 Seeding survey submissions...');

    const session1Start = new Date('2025-01-15');
    const session2Start = new Date('2025-01-16');
    const session3Start = new Date('2025-06-12');
    const session4Start = new Date('2025-06-16');
    const session5Start = new Date('2025-08-10');

    const base = (survey: any, question: any, beneficiary: any, startedAt: Date) => ({
      survey: survey._id,
      question: question._id,
      beneficiary: beneficiary._id,
      startedAt,
      completedAt: new Date(startedAt.getTime() + 420_000),
    });

    const submissions = await this.surveySubmissionModel.insertMany([
      // Session 1 — survey 0, beneficiary 0
      { ...base(surveys[0], questions[0], beneficiaries[0], session1Start), textValue: 'القيادة والإدارة، البرمجة والتقنية' },
      { ...base(surveys[0], questions[1], beneficiaries[0], session1Start), textValue: 'مبتدئ' },
      { ...base(surveys[0], questions[2], beneficiaries[0], session1Start), textValue: 'أطمح للعمل في مجال تطوير البرمجيات وقيادة فريق تقني في شركة رائدة' },

      // Session 2 — survey 0, beneficiary 1
      { ...base(surveys[0], questions[0], beneficiaries[1], session2Start), textValue: 'المهارات الشخصية، التسويق والمبيعات' },
      { ...base(surveys[0], questions[1], beneficiaries[1], session2Start), textValue: 'متوسط' },
      { ...base(surveys[0], questions[2], beneficiaries[1], session2Start), textValue: 'أسعى لتطوير مهاراتي في التسويق الرقمي' },

      // Session 3 — survey 1 (pre-test), beneficiary 0
      { ...base(surveys[1], questions[3], beneficiaries[0], session3Start), numberValue: 3 },
      { ...base(surveys[1], questions[4], beneficiaries[0], session3Start), booleanValue: false },
      { ...base(surveys[1], questions[5], beneficiaries[0], session3Start), textValue: 'لدي القدرة على التواصل الجيد مع الآخرين وحل المشكلات' },

      // Session 4 — survey 2 (post-test), beneficiary 0
      { ...base(surveys[2], questions[6], beneficiaries[0], session4Start), numberValue: 4.5 },
      { ...base(surveys[2], questions[7], beneficiaries[0], session4Start), numberValue: 9 },
      { ...base(surveys[2], questions[8], beneficiaries[0], session4Start), textValue: 'تعلمت كيفية إدارة الفريق بفعالية، مهارات التفاوض، وكيفية اتخاذ القرارات الاستراتيجية' },

      // Session 5 — survey 3 (satisfaction), beneficiary 3
      { ...base(surveys[3], questions[9], beneficiaries[3], session5Start), numberValue: 5 },
      { ...base(surveys[3], questions[10], beneficiaries[3], session5Start), booleanValue: true },
      { ...base(surveys[3], questions[11], beneficiaries[3], session5Start), textValue: 'البرنامج ممتاز، أقترح زيادة عدد الورش العملية والتدريب على التسويق الإلكتروني' },
    ]);

    this.logger.log(`✅ Created ${submissions.length} survey submissions`);
    return submissions;
  }

  private async seedTextAnalyses(projects: any[]) {
    this.logger.log('🔍 Seeding text analyses...');

    const analyses = await this.textAnalysisModel.insertMany([
      {
        project: projects[0]._id,
        originalText: 'أطمح للعمل في مجال تطوير البرمجيات وقيادة فريق تقني في شركة رائدة',
        cleanedText: 'أطمح للعمل في مجال تطوير البرمجيات وقيادة فريق تقني في شركة رائدة',
        sentiment: 'positive',
        sentimentScore: 0.85,
        sentimentConfidence: 0.92,
        keywords: [
          { word: 'تطوير البرمجيات', relevance: 0.9 },
          { word: 'قيادة', relevance: 0.8 },
          { word: 'فريق تقني', relevance: 0.75 },
        ],
        entities: [{ text: 'برمجيات', type: 'technology' }],
        summary: 'طموح لتطوير مهارات تقنية وقيادية',
        status: 'completed',
        analyzedAt: new Date('2025-01-15'),
      },
      {
        project: projects[0]._id,
        originalText: 'تعلمت كيفية إدارة الفريق بفعالية، مهارات التفاوض، وكيفية اتخاذ القرارات الاستراتيجية',
        cleanedText: 'تعلمت كيفية إدارة الفريق بفعالية، مهارات التفاوض، وكيفية اتخاذ القرارات الاستراتيجية',
        sentiment: 'positive',
        sentimentScore: 0.9,
        sentimentConfidence: 0.95,
        keywords: [
          { word: 'إدارة الفريق', relevance: 0.9 },
          { word: 'التفاوض', relevance: 0.85 },
          { word: 'القرارات الاستراتيجية', relevance: 0.8 },
        ],
        entities: [],
        summary: 'تعلم مهارات إدارية واستراتيجية من الورشة',
        status: 'completed',
        analyzedAt: new Date('2025-06-16'),
      },
      {
        project: projects[1]._id,
        originalText: 'البرنامج ممتاز، أقترح زيادة عدد الورش العملية والتدريب على التسويق الإلكتروني',
        cleanedText: 'البرنامج ممتاز، أقترح زيادة عدد الورش العملية والتدريب على التسويق الإلكتروني',
        sentiment: 'positive',
        sentimentScore: 0.88,
        sentimentConfidence: 0.91,
        keywords: [
          { word: 'ورش عملية', relevance: 0.85 },
          { word: 'تسويق إلكتروني', relevance: 0.8 },
          { word: 'تدريب', relevance: 0.75 },
        ],
        entities: [],
        summary: 'تقييم إيجابي مع اقتراح بزيادة الورش العملية',
        status: 'completed',
        analyzedAt: new Date('2025-08-10'),
      },
    ]);

    this.logger.log(`✅ Created ${analyses.length} text analyses`);
    return analyses;
  }

  private async seedTopics(projects: any[]) {
    this.logger.log('🏷️  Seeding topics...');

    const topics = await this.topicModel.insertMany([
      {
        project: projects[0]._id,
        name: 'التطوير المهني',
        keywords: ['مهارات', 'تطوير', 'تدريب', 'قيادة', 'إدارة'],
        frequency: 25,
        averageSentiment: 0.82,
        relevanceScore: 0.9,
        overallSentiment: 'positive',
        isActive: true,
      },
      {
        project: projects[0]._id,
        name: 'البرمجة والتقنية',
        keywords: ['برمجة', 'تقنية', 'تطوير برمجيات', 'حاسب'],
        frequency: 18,
        averageSentiment: 0.78,
        relevanceScore: 0.75,
        overallSentiment: 'positive',
        isActive: true,
      },
      {
        project: projects[1]._id,
        name: 'ريادة الأعمال',
        keywords: ['مشروع', 'أعمال', 'تسويق', 'منتج', 'ربح'],
        frequency: 22,
        averageSentiment: 0.85,
        relevanceScore: 0.88,
        overallSentiment: 'positive',
        isActive: true,
      },
      {
        project: projects[1]._id,
        name: 'التمكين الاقتصادي',
        keywords: ['دخل', 'اقتصاد', 'أسرة', 'تمكين', 'استقلال'],
        frequency: 15,
        averageSentiment: 0.8,
        relevanceScore: 0.7,
        overallSentiment: 'positive',
        isActive: true,
      },
    ]);

    this.logger.log(`✅ Created ${topics.length} topics`);
    return topics;
  }

  private async seedTextTopics(textAnalyses: any[], topics: any[]) {
    this.logger.log('🔗 Seeding text-topics relationships...');

    const textTopics = await this.textTopicModel.insertMany([
      {
        textAnalysis: textAnalyses[0]._id,
        topic: topics[1]._id, // البرمجة والتقنية
        relevance: 0.92,
        confidence: 0.9,
        mentionCount: 3,
      },
      {
        textAnalysis: textAnalyses[0]._id,
        topic: topics[0]._id,
        relevance: 0.78,
        confidence: 0.85,
        mentionCount: 2,
      },
      {
        textAnalysis: textAnalyses[1]._id,
        topic: topics[0]._id,
        relevance: 0.95,
        confidence: 0.95,
        mentionCount: 4,
      },
      {
        textAnalysis: textAnalyses[2]._id,
        topic: topics[2]._id,
        relevance: 0.88,
        confidence: 0.9,
        mentionCount: 3,
      },
      {
        textAnalysis: textAnalyses[2]._id,
        topic: topics[3]._id,
        relevance: 0.82,
        confidence: 0.88,
        mentionCount: 2,
      },
    ]);

    this.logger.log(`✅ Created ${textTopics.length} text-topic relationships`);
    return textTopics;
  }

  private async seedIndicators(projects: any[]) {
    this.logger.log('📊 Seeding indicators...');

    const indicators = await this.indicatorModel.insertMany([
      {
        project: projects[0]._id,
        indicatorType: IndicatorType.OUTPUT,
        name: 'عدد المتدربين المستفيدين',
        description: 'إجمالي عدد الشباب الذين أكملوا البرنامج التدريبي بنجاح',
        measurementMethod: 'عد المشاركين الذين حضروا 80% من الجلسات على الأقل',
        targetValue: 1000,
        actualValue: 850,
        unit: MeasurementUnit.NUMBER,
        dataSource: 'نظام إدارة التدريب',
        baselineValue: 0,
        trend: TrendDirection.IMPROVING,
        lastCalculatedAt: new Date('2026-01-15'),
      },
      {
        project: projects[0]._id,
        indicatorType: IndicatorType.OUTCOME,
        name: 'نسبة تحسن المهارات',
        description: 'النسبة المئوية للتحسن في مهارات المتدربين (قياس قبلي/بعدي)',
        measurementMethod: 'مقارنة نتائج التقييم القبلي والبعدي',
        targetValue: 30,
        actualValue: 27.5,
        unit: MeasurementUnit.PERCENTAGE,
        dataSource: 'نتائج الاختبارات',
        baselineValue: 0,
        trend: TrendDirection.IMPROVING,
        lastCalculatedAt: new Date('2026-01-15'),
      },
      {
        project: projects[0]._id,
        indicatorType: IndicatorType.IMPACT,
        name: 'معدل التوظيف بعد التدريب',
        description: 'نسبة المتدربين الذين حصلوا على وظيفة خلال 6 أشهر من إنهاء البرنامج',
        measurementMethod: 'مسح ميداني للمتدربين بعد 6 أشهر من التخرج',
        targetValue: 70,
        actualValue: 58,
        unit: MeasurementUnit.PERCENTAGE,
        dataSource: 'استبيان المتابعة',
        baselineValue: 35,
        trend: TrendDirection.IMPROVING,
        lastCalculatedAt: new Date('2026-01-10'),
      },
      {
        project: projects[1]._id,
        indicatorType: IndicatorType.OUTPUT,
        name: 'عدد الأسر المستفيدة',
        description: 'عدد الأسر التي بدأت مشاريع منزلية مدرة للدخل',
        measurementMethod: 'عدد الأسر التي قدمت خطة عمل وبدأت التنفيذ',
        targetValue: 500,
        actualValue: 320,
        unit: MeasurementUnit.NUMBER,
        dataSource: 'سجلات البرنامج',
        baselineValue: 0,
        trend: TrendDirection.IMPROVING,
        lastCalculatedAt: new Date('2026-01-12'),
      },
      {
        project: projects[1]._id,
        indicatorType: IndicatorType.OUTCOME,
        name: 'متوسط الدخل الشهري الإضافي',
        description: 'متوسط الدخل الشهري الإضافي الذي حققته الأسر من مشاريعها',
        measurementMethod: 'استبيان شهري لقياس الإيرادات',
        targetValue: 3000,
        actualValue: 2450,
        unit: MeasurementUnit.CURRENCY,
        dataSource: 'تقارير الأسر المالية',
        baselineValue: 0,
        trend: TrendDirection.IMPROVING,
        lastCalculatedAt: new Date('2026-01-14'),
      },
    ]);

    this.logger.log(`✅ Created ${indicators.length} indicators`);
    return indicators;
  }

  private async seedIndicatorHistory(indicators: any[]) {
    this.logger.log('📈 Seeding indicator history...');

    const history = await this.indicatorHistoryModel.insertMany([
      // Indicator 1 history (عدد المتدربين)
      {
        indicator: indicators[0]._id,
        recordedValue: 650,
        calculatedAt: new Date('2025-10-01'),
        source: 'تقرير الربع الثالث',
        notes: 'تقدم جيد في التسجيل',
        previousValue: 500,
        changeAmount: 150,
        changePercentage: 30,
        status: 'VERIFIED',
      },
      {
        indicator: indicators[0]._id,
        recordedValue: 750,
        calculatedAt: new Date('2025-12-01'),
        source: 'تقرير الربع الرابع',
        notes: 'زيادة ملحوظة بعد الحملة التسويقية',
        previousValue: 650,
        changeAmount: 100,
        changePercentage: 15.38,
        status: 'VERIFIED',
      },
      {
        indicator: indicators[0]._id,
        recordedValue: 850,
        calculatedAt: new Date('2026-01-15'),
        source: 'تقرير يناير 2026',
        notes: 'اقتراب من الهدف المحدد',
        previousValue: 750,
        changeAmount: 100,
        changePercentage: 13.33,
        status: 'RECORDED',
      },

      // Indicator 2 history (نسبة تحسن المهارات)
      {
        indicator: indicators[1]._id,
        recordedValue: 22.5,
        calculatedAt: new Date('2025-09-01'),
        source: 'تقييم الفوج الأول',
        notes: 'نتائج التقييم البعدي للفوج الأول',
        previousValue: 0,
        changeAmount: 22.5,
        changePercentage: 0,
        status: 'VERIFIED',
      },
      {
        indicator: indicators[1]._id,
        recordedValue: 25.3,
        calculatedAt: new Date('2025-11-01'),
        source: 'تقييم الفوج الثاني',
        notes: 'تحسن في النتائج',
        previousValue: 22.5,
        changeAmount: 2.8,
        changePercentage: 12.44,
        status: 'VERIFIED',
      },
      {
        indicator: indicators[1]._id,
        recordedValue: 27.5,
        calculatedAt: new Date('2026-01-15'),
        source: 'تقييم الفوج الثالث',
        notes: 'استمرار التحسن',
        previousValue: 25.3,
        changeAmount: 2.2,
        changePercentage: 8.7,
        status: 'RECORDED',
      },

      // Indicator 3 history (معدل التوظيف)
      {
        indicator: indicators[2]._id,
        recordedValue: 45,
        calculatedAt: new Date('2025-08-01'),
        source: 'استبيان متابعة - الفوج الأول',
        notes: 'متابعة بعد 6 أشهر من التخرج',
        previousValue: 35,
        changeAmount: 10,
        changePercentage: 28.57,
        status: 'VERIFIED',
      },
      {
        indicator: indicators[2]._id,
        recordedValue: 52,
        calculatedAt: new Date('2025-11-01'),
        source: 'استبيان متابعة - الفوج الثاني',
        notes: 'تحسن ملحوظ',
        previousValue: 45,
        changeAmount: 7,
        changePercentage: 15.56,
        status: 'VERIFIED',
      },
      {
        indicator: indicators[2]._id,
        recordedValue: 58,
        calculatedAt: new Date('2026-01-10'),
        source: 'استبيان متابعة - الفوج الثالث',
        notes: 'اقتراب من الهدف',
        previousValue: 52,
        changeAmount: 6,
        changePercentage: 11.54,
        status: 'RECORDED',
      },

      // Indicator 4 history (عدد الأسر)
      {
        indicator: indicators[3]._id,
        recordedValue: 180,
        calculatedAt: new Date('2025-07-01'),
        source: 'تقرير منتصف العام',
        notes: 'بداية جيدة للبرنامج',
        previousValue: 0,
        changeAmount: 180,
        changePercentage: 0,
        status: 'VERIFIED',
      },
      {
        indicator: indicators[3]._id,
        recordedValue: 250,
        calculatedAt: new Date('2025-10-01'),
        source: 'تقرير الربع الثالث',
        notes: 'زيادة مستمرة',
        previousValue: 180,
        changeAmount: 70,
        changePercentage: 38.89,
        status: 'VERIFIED',
      },
      {
        indicator: indicators[3]._id,
        recordedValue: 320,
        calculatedAt: new Date('2026-01-12'),
        source: 'تقرير يناير',
        notes: 'تقدم مستمر نحو الهدف',
        previousValue: 250,
        changeAmount: 70,
        changePercentage: 28,
        status: 'RECORDED',
      },

      // Indicator 5 history (متوسط الدخل)
      {
        indicator: indicators[4]._id,
        recordedValue: 1800,
        calculatedAt: new Date('2025-08-01'),
        source: 'استبيان الدخل - الشهر الأول',
        notes: 'بداية تحقيق الدخل',
        previousValue: 0,
        changeAmount: 1800,
        changePercentage: 0,
        status: 'VERIFIED',
      },
      {
        indicator: indicators[4]._id,
        recordedValue: 2100,
        calculatedAt: new Date('2025-11-01'),
        source: 'استبيان الدخل - الربع الثالث',
        notes: 'تحسن في الإيرادات',
        previousValue: 1800,
        changeAmount: 300,
        changePercentage: 16.67,
        status: 'VERIFIED',
      },
      {
        indicator: indicators[4]._id,
        recordedValue: 2450,
        calculatedAt: new Date('2026-01-14'),
        source: 'استبيان الدخل - يناير',
        notes: 'استمرار النمو',
        previousValue: 2100,
        changeAmount: 350,
        changePercentage: 16.67,
        status: 'RECORDED',
      },
    ]);

    this.logger.log(`✅ Created ${history.length} indicator history entries`);
    return history;
  }
}
