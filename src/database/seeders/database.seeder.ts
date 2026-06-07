import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import * as bcrypt from 'bcrypt';

import { User, UserRole, UserStatus } from '../../modules/users/schemas/user.schema';
import { Project, ProjectStatus } from '../../modules/projects/schemas/project.schema';
import { ProjectTypeEntity } from '../../modules/projects/schemas/project-type.schema';
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
import { IndicatorHistory } from '../../modules/indicators/schemas/indicator-history.schema';

// ─────────────────────────────────────────────────────────────────────────────
//  TEXT POOLS
//  Project 1 (positive): high satisfaction, clear benefit, enthusiasm
//  Project 2 (negative): disappointment, poor quality, no benefit
// ─────────────────────────────────────────────────────────────────────────────

// Project 1 — Pre-survey (expectations, goals)
const P1_PRE_TEXTS = [
  'أتطلع بشوق لتطوير مهاراتي البرمجية واكتساب خبرة عملية في مجال الذكاء الاصطناعي',
  'أهدف إلى تعلم تقنيات البرمجة الحديثة لأتمكن من الحصول على وظيفة في شركة تقنية كبرى',
  'أريد أن أستفيد من هذا البرنامج لبناء مشروع تقني ناجح يحل مشكلة حقيقية في مجتمعي',
  'أتوق لتعلم تطوير التطبيقات وأساسيات الأمن السيبراني لتعزيز مستقبلي المهني',
  'أسعى لاكتساب مهارات تحليل البيانات والذكاء الاصطناعي لأكون جاهزاً لسوق العمل',
  'أرغب في تطوير نفسي تقنياً والتواصل مع خبراء الصناعة لبناء شبكة علاقات مهنية قوية',
  'أهدف لتعلم أساسيات تطوير الويب وبناء مشاريع عملية قابلة للتطبيق في السوق',
  'أطمح لاكتساب مهارات البرمجة الاحترافية والتفكير المنطقي لحل المشكلات المعقدة',
  'أريد استثمار هذه الفرصة لتعلم أحدث التقنيات وتطبيقها في مشاريع واقعية',
  'أسعى لتحقيق طفرة نوعية في مسيرتي المهنية من خلال هذا البرنامج التقني المتخصص',
  'أتطلع لاكتساب خبرة عملية حقيقية في مجال تطوير البرمجيات وإدارة المشاريع التقنية',
  'أريد تطوير مهاراتي في الأمن السيبراني وحماية البيانات لأخدم الأمن الوطني الرقمي',
  'أهدف لفهم أسس التحول الرقمي وكيفية تطبيقه لتحديث بيئات العمل في مؤسستي',
  'أتوق لاكتساب مهارات إدارة المشاريع التقنية وقيادة الفرق في بيئات الأعمال الرقمية',
  'أسعى لتعلم مبادئ علم البيانات والتحليل الإحصائي لاتخاذ قرارات ذكية مبنية على الأرقام',
  'أريد استغلال هذا البرنامج لتعميق فهمي للحوسبة السحابية وتقنياتها الحديثة',
  'أطمح لاكتساب مهارات التفكير التصميمي وأدواته لحل مشكلات المستخدمين بطرق إبداعية',
  'أهدف لبناء مشروع تقني متكامل أتمكن من تقديمه للمستثمرين ضمن البرنامج التدريبي',
  'أريد تطوير مهاراتي في البرمجة بالذكاء الاصطناعي ونماذج اللغة الكبيرة كـ ChatGPT',
  'أسعى لتعزيز ثقتي بنفسي تقنياً وتحقيق أهداف مهنية طموحة في عالم التكنولوجيا',
];

// Project 1 — Post-survey (extremely positive feedback)
const P1_POST_TEXTS = [
  'هذا البرنامج من أفضل ما حضرته في حياتي — المحتوى عالي الجودة والمدربون استثنائيون',
  'تجربة تعليمية متميزة جداً غيّرت مساري المهني بالكامل واكتسبت مهارات لا تقدر بثمن',
  'استفدت استفادة رائعة وطائلة من هذا البرنامج وأشعر أنني أصبحت مؤهلاً لسوق العمل تماماً',
  'المحتوى التدريبي كان ثرياً ومتطوراً جداً وطبّقته فوراً في مشروعي الشخصي بنجاح كبير',
  'أنصح بشدة كل من يريد التميز في المجال التقني بالالتحاق بهذا البرنامج الاستثنائي',
  'البرنامج فاق توقعاتي بمراحل وخرجت منه بكفاءات حقيقية وشبكة علاقات مهنية قيّمة',
  'المدربون كانوا ملهمين للغاية ويمتلكون خبرة ميدانية عميقة أضافت قيمة استثنائية للبرنامج',
  'تعلمت خلال هذا البرنامج ما لم أتعلمه في سنوات الدراسة وهذا يدل على جودته الرفيعة',
  'البيئة التعليمية كانت محفزة ومثيرة للإبداع وكل يوم كنت أتحمس أكثر للحضور والتعلم',
  'هذا البرنامج استثمار حقيقي في المستقبل وأنا ممتن جداً لفرصة المشاركة فيه',
  'تمكنت من بناء مشروع تقني متكامل ضمن البرنامج وأنا فخور جداً بالنتيجة التي حققتها',
  'الدعم المستمر من الفريق التدريبي كان استثنائياً وجعل التعلم ممتعاً وفعّالاً في آن واحد',
  'اكتسبت ثقة بنفسي لم أكن أتخيل امتلاكها قبل الانضمام لهذا البرنامج الرائع',
  'البرنامج طور تفكيري المنطقي وقدرتي على حل المشكلات التقنية المعقدة بكفاءة عالية',
  'أحمد الله كثيراً على فرصة المشاركة في هذا البرنامج الذي غيّر حياتي للأفضل',
  'المشاريع التطبيقية كانت تحدياً حقيقياً ومكّنتني من تطبيق كل ما تعلمته بصورة عملية',
  'خرجت من البرنامج بمهارات تقنية عالية ومشروع جاهز للتسويق أمام المستثمرين',
  'التنظيم الرائع والمحتوى القوي والمدربون المتميزون جعلوا هذه التجربة لا تُنسى',
  'أشعر بفارق واضح وملموس في قدراتي قبل وبعد البرنامج وهذا أعظم دليل على نجاحه',
  'بلا تردد سأشارك في أي برنامج مستقبلي تنظمه هذه المبادرة الرائعة والمؤثرة',
];

// Project 2 — Pre-survey (basic expectations, neutral)
const P2_PRE_TEXTS = [
  'أحتاج لدعم أسرتي في تحسين وضعها الاقتصادي وأتمنى أن يساعد هذا البرنامج',
  'أريد تعلم طرق زراعية حديثة لتحسين الإنتاج في أرضنا بالمنطقة الريفية',
  'أسعى لتطوير مهاراتي في إدارة الموارد المحدودة وتحقيق أقصى استفادة منها',
  'أتطلع للحصول على دعم في تسويق منتجاتي الزراعية والوصول لأسواق أوسع',
  'أريد تعلم أساليب التعامل مع التحديات الاقتصادية التي تواجه الأسر الريفية',
  'أهدف للاستفادة من الخبرات المشتركة مع أبناء المنطقة لتحسين أحوالنا المعيشية',
  'أحتاج لمعرفة كيفية الوصول لبرامج الدعم الحكومي المتاحة للأسر الريفية',
  'أسعى لتطوير مهاراتي في الحرف اليدوية وتسويقها بطريقة أفضل وأكثر ربحية',
  'أريد فهم حقوقي كمزارع وكيفية التعامل مع الجهات الحكومية والتعاونيات الزراعية',
  'أتطلع للاستفادة من البرنامج في تحسين إدارة مواردنا الطبيعية بشكل مستدام',
  'أريد تعلم تقنيات الري الحديثة والزراعة المائية لتوفير المياه وزيادة الإنتاج',
  'أسعى للاستفادة من الخبرات الزراعية لتحويل الأراضي البور إلى أراضٍ منتجة',
  'أحتاج لدعم في بناء استراتيجية اقتصادية لأسرتي تضمن استقراراً مالياً مستداماً',
  'أريد اكتساب مهارات جديدة تمكّنني من إيجاد مصادر دخل إضافية لأسرتي',
  'أتطلع لتعلم أساليب التخزين والحفاظ على المنتجات الزراعية لتقليل الهدر',
  'أسعى لفهم آليات تأسيس تعاونيات زراعية ناجحة تجمع المزارعين في منطقتنا',
  'أريد تطوير مهاراتي في محاسبة المشاريع الصغيرة وإدارة التدفق النقدي بكفاءة',
  'أهدف للاستفادة من البرنامج لتنويع مصادر دخل أسرتي وتقليل الاعتماد على الزراعة',
  'أحتاج لمعرفة كيفية مواجهة المتغيرات المناخية وتكيّف الزراعة معها',
  'أريد تعلم تقنيات المحاصيل عالية القيمة لتحسين دخل أسرتي من محدودية الأرض',
];

// Project 2 — Post-survey (strongly negative feedback)
const P2_POST_TEXTS = [
  'البرنامج كان مخيباً للآمال تماماً ولم يقدم أي شيء جديد أو مفيد لواقعنا الريفي',
  'ضياع وقت كامل لم أستفد منه شيئاً يذكر، المحتوى سطحي جداً ومنفصل عن احتياجاتنا',
  'تنظيم سيء جداً، المدربون غير مؤهلين وغير ملمّين بواقع الأسر الريفية ومشاكلها',
  'لم يُعالج البرنامج أي من التحديات الحقيقية التي نواجهها ولا أعلم ما الفائدة منه',
  'كنت أتوقع محتوى عملياً قابلاً للتطبيق لكنني خرجت بيدين فارغتين وخيبة أمل كبيرة',
  'إهدار للموارد والوقت والجهد، لا يمكنني أن أنصح أحداً بالمشاركة في هذا البرنامج المتردي',
  'المدربون لم يفهموا احتياجاتنا الفعلية وقدّموا معلومات نظرية لا قيمة لها على أرض الواقع',
  'البرنامج فشل فشلاً ذريعاً في تحقيق أهدافه المعلنة ولا يختلف عن الدورات الفارغة المعتادة',
  'لا يوجد أي متابعة حقيقية بعد البرنامج ولم نتلق الدعم الموعود به قبل بدء التسجيل',
  'أشعر بخديعة كبيرة بعد المشاركة، الوعود كانت كثيرة والتنفيذ كان صفراً تقريباً',
  'المحتوى التدريبي قديم ومتقادم ولا يتناسب مع التحديات الراهنة التي نعيشها يومياً',
  'البرنامج لم يستهدف الاحتياجات الحقيقية للأسر الريفية بل كان استعراضاً إعلامياً فارغاً',
  'غياب التطبيق العملي جعل المعلومات المقدمة مجرد حديث في الهواء بلا قيمة ولا أثر',
  'الموارد المخصصة للبرنامج لم توظَّف بشكل صحيح وكان يمكن إنجاز أضعاف هذا بنفس الميزانية',
  'لم أشهد أي أثر إيجابي واضح على حياة المشاركين ووضعهم الاقتصادي بعد انتهاء البرنامج',
  'البرنامج مجرد نظريات في الهواء لا ترتبط بواقعنا ولن تحل مشكلة واحدة من مشاكلنا',
  'مضيعة حقيقية للوقت والجهد، كنت أنجز أعمالي الزراعية بدلاً من حضور هذه الجلسات',
  'المدرب كان غير متمكن من المادة وعاجزاً عن الإجابة على أبسط الأسئلة الميدانية',
  'لم يتحقق أي من الأهداف المعلنة وأنا محبط جداً من هذه التجربة المؤلمة والمضيعة',
  'أتمنى استرداد ساعاتي التي أهدرتها في هذا البرنامج الفاشل الذي لم يفد أحداً',
];

// ─── Name components ──────────────────────────────────────────────────────────
const MALE_FIRST  = ['عبدالله','محمد','أحمد','خالد','سعود','فيصل','عمر','طارق','وليد','زياد','بندر','ماجد','فهد','تركي','رائد','سعد','يوسف','علي','حمد','نواف'];
const FEMALE_FIRST = ['نورة','سارة','فاطمة','هدى','ريم','لطيفة','أسماء','أميرة','وفاء','نوف','عزة','شيماء','دلال','إيمان','رنا','هنوف','ميسون','لبنى','هيفاء','جواهر'];
const LAST_NAMES  = ['السعيد','القحطاني','المطيري','الزهراني','العتيبي','العمري','الشهري','الحربي','الدوسري','الغامدي','الرشيدي','البلوي','القرني','الأسمري','الثبيتي','الجهني','العنزي','الشمري','الحميد','القاسم'];
const CITIES  = ['الرياض','جدة','الدمام','مكة المكرمة','المدينة المنورة','الطائف','تبوك','أبها'];
const REGIONS = ['الوسطى','مكة المكرمة','الشرقية','مكة المكرمة','المدينة المنورة','مكة المكرمة','تبوك','عسير'];
const EDUCATIONS  = ['بكالوريوس','ماجستير','دبلوم','ثانوي','بكالوريوس','بكالوريوس','دكتوراه','متوسط'];
const PROFESSIONS = ['باحث عن عمل','موظف حكومي','موظف قطاع خاص','ربة منزل','معلم','طالب','مدرب','رائد أعمال'];

// ─────────────────────────────────────────────────────────────────────────────

@Injectable()
export class DatabaseSeeder {
  private readonly logger = new Logger(DatabaseSeeder.name);

  constructor(
    @InjectModel(User.name)               private userModel: Model<User>,
    @InjectModel(Project.name)            private projectModel: Model<Project>,
    @InjectModel(ProjectTypeEntity.name)  private projectTypeModel: Model<ProjectTypeEntity>,
    @InjectModel(Beneficiary.name)        private beneficiaryModel: Model<Beneficiary>,
    @InjectModel(ActivityBeneficiary.name) private activityBeneficiaryModel: Model<ActivityBeneficiary>,
    @InjectModel(Activity.name)           private activityModel: Model<Activity>,
    @InjectModel(Participant.name)        private participantModel: Model<Participant>,
    @InjectModel(ActivityParticipant.name) private activityParticipantModel: Model<ActivityParticipant>,
    @InjectModel(Survey.name)             private surveyModel: Model<Survey>,
    @InjectModel(SurveyQuestion.name)     private surveyQuestionModel: Model<SurveyQuestion>,
    @InjectModel(SurveySubmission.name)   private submissionModel: Model<SurveySubmission>,
    @InjectModel(SurveyCorrectAnswer.name) private correctAnswerModel: Model<SurveyCorrectAnswer>,
    @InjectModel(TextAnalysis.name)       private textAnalysisModel: Model<TextAnalysis>,
    @InjectModel(Topic.name)              private topicModel: Model<Topic>,
    @InjectModel(TextTopic.name)          private textTopicModel: Model<TextTopic>,
    @InjectModel(Indicator.name)          private indicatorModel: Model<Indicator>,
    @InjectModel(IndicatorHistory.name)   private indicatorHistoryModel: Model<IndicatorHistory>,
    @InjectConnection() private connection: Connection,
  ) {}

  // ─── Main entry point ─────────────────────────────────────────────────────
  async seed() {
    this.logger.log('🌱 Starting two-project focused seeding (positive + negative)...');

    try {
      await this.clearAll();

      const users        = await this.seedUsers();
      const projectTypes = await this.seedProjectTypes(users);
      const projects     = await this.seedProjects(users, projectTypes);
      const beneficiaries = await this.seedBeneficiaries();
      const activities   = await this.seedActivities(projects);
      const participants = await this.seedParticipants(beneficiaries);
      await this.seedActivityParticipants(activities, participants);
      await this.seedActivityBeneficiaries(activities, beneficiaries);
      const surveys      = await this.seedSurveys(activities);
      const questions    = await this.seedSurveyQuestions(surveys);
      const submissionCount = await this.seedSurveySubmissions(surveys, beneficiaries, questions, projects);
      const correctAnswers  = await this.seedCorrectAnswers(surveys, questions);
      const indicators   = await this.seedIndicators(projects);
      await this.seedIndicatorHistory(indicators);

      this.logger.log('✅ Seeding completed!');
      this.logger.log('');
      this.logger.log('══════════════════════════════════════════════════');
      this.logger.log('  المشروع 1: مشروع تطوير مهارات الشباب التقني');
      this.logger.log('  التقييم: إيجابي ممتاز ✅');
      this.logger.log('  المشروع 2: مشروع دعم الأسر الريفية');
      this.logger.log('  التقييم: سلبي فاشل ❌');
      this.logger.log('══════════════════════════════════════════════════');

      return {
        users: users.length,
        projects: projects.length,
        beneficiaries: beneficiaries.length,
        activities: activities.length,
        participants: participants.length,
        surveys: surveys.length,
        questions: questions.length,
        submissions: submissionCount,
        correctAnswers: correctAnswers.length,
        indicators: indicators.length,
      };
    } catch (error) {
      this.logger.error('❌ Seeding error:', error);
      throw error;
    }
  }

  // ─── Clear ALL collections ────────────────────────────────────────────────
  private async clearAll() {
    this.logger.log('🗑️  Clearing all collections...');
    await this.indicatorHistoryModel.deleteMany({});
    await this.indicatorModel.deleteMany({});
    await this.textTopicModel.deleteMany({});
    await this.topicModel.deleteMany({});
    await this.textAnalysisModel.deleteMany({});
    await this.correctAnswerModel.deleteMany({});
    await this.submissionModel.deleteMany({});
    await this.surveyQuestionModel.deleteMany({});
    await this.surveyModel.deleteMany({});
    await this.activityParticipantModel.deleteMany({});
    await this.activityBeneficiaryModel.deleteMany({});
    await this.participantModel.deleteMany({});
    await this.activityModel.deleteMany({});
    await this.beneficiaryModel.deleteMany({});
    await this.projectTypeModel.deleteMany({});
    await this.projectModel.deleteMany({});
    await this.userModel.deleteMany({});
    try { await this.connection.db!.dropCollection('surveyresponses'); } catch { /* ok */ }
    this.logger.log('✅ All collections cleared');
  }

  // ─── Users ────────────────────────────────────────────────────────────────
  private async seedUsers() {
    this.logger.log('👤 Seeding users...');
    const pw = await bcrypt.hash('Test123456!', 10);
    const users = await this.userModel.insertMany([
      { name: 'أحمد المدير',    email: 'admin@example.com',   password: pw, role: UserRole.ADMIN, status: UserStatus.ACTIVE, phone: '+966501234567' },
      { name: 'فاطمة المشرفة', email: 'manager@example.com', password: pw, role: UserRole.STAFF, status: UserStatus.ACTIVE, phone: '+966509876543' },
      { name: 'محمد المحلل',   email: 'analyst@example.com', password: pw, role: UserRole.STAFF, status: UserStatus.ACTIVE, phone: '+966505555555' },
      { name: 'سارة القحطاني', email: 'sarah@example.com',   password: pw, role: UserRole.STAFF, status: UserStatus.ACTIVE, phone: '+966502222222' },
    ]);
    this.logger.log(`✅ ${users.length} users`);
    return users;
  }

  // ─── Project Types ────────────────────────────────────────────────────────
  private async seedProjectTypes(users: any[]) {
    this.logger.log('🏷️  Seeding project types...');
    const adminId = users[0]._id;
    const types = await this.projectTypeModel.insertMany([
      { value: 'تمكين_شبابي',   label: 'تمكين شبابي',   createdBy: adminId },
      { value: 'تمكين_اقتصادي', label: 'تمكين اقتصادي', createdBy: adminId },
    ]);
    this.logger.log(`✅ ${types.length} project types`);
    return types;
  }

  // ─── Projects (2 total) ───────────────────────────────────────────────────
  // Project index 0 = POSITIVE, index 1 = NEGATIVE
  private async seedProjects(users: any[], _types: any[]) {
    this.logger.log('📁 Seeding 2 projects (1 positive, 1 negative)...');
    const adminId = users[0]._id;
    const staffId = users[1]._id;

    const projects = await this.projectModel.insertMany([
      // ── Project 1: POSITIVE ──────────────────────────────────────────────
      {
        user_id: adminId,
        name: 'مشروع تطوير مهارات الشباب التقني',
        description: 'برنامج تدريبي متكامل وعالي الجودة يهدف إلى تمكين الشباب تقنياً من خلال تطوير مهاراتهم في البرمجة والذكاء الاصطناعي وريادة الأعمال الرقمية، مع توفير بيئة تعلم متميزة ومدربين متخصصين ذوي خبرة عالية',
        type: 'تمكين_شبابي',
        status: ProjectStatus.COMPLETED,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
        location: 'الرياض',
        targetGroups: ['الشباب من 18-35 سنة', 'الخريجون الجدد', 'الباحثون عن عمل في قطاع التقنية'],
        goals: {
          short_term: ['تطوير مهارات البرمجة والذكاء الاصطناعي', 'بناء مشاريع تقنية عملية', 'توفير شهادات احترافية معتمدة'],
          long_term: ['توظيف 500 شاب في شركات التقنية', 'إطلاق 50 مشروعاً تقنياً ناشئاً', 'بناء جيل رقمي مؤهل'],
        },
        budget: { total: 5000000, spent: 4850000, currency: 'SAR' },
      },
      // ── Project 2: NEGATIVE ──────────────────────────────────────────────
      {
        user_id: staffId,
        name: 'مشروع دعم الأسر الريفية',
        description: 'برنامج يهدف إلى دعم الأسر في المناطق الريفية من خلال تقديم تدريب على الأساليب الزراعية الحديثة والتسويق، إلا أن التنفيذ الفعلي جاء دون المستوى المطلوب وأخفق في تحقيق أهدافه المرسومة',
        type: 'تمكين_اقتصادي',
        status: ProjectStatus.IN_PROGRESS,
        startDate: new Date('2025-03-01'),
        endDate: new Date('2025-12-31'),
        location: 'أبها',
        targetGroups: ['الأسر الريفية', 'المزارعون الصغار', 'النساء في المناطق الريفية'],
        goals: {
          short_term: ['تطوير الإنتاج الزراعي', 'تحسين التسويق', 'رفع الوعي بالأساليب الحديثة'],
          long_term: ['تحسين دخل 300 أسرة ريفية', 'خلق فرص عمل محلية', 'تطوير المنطقة الريفية'],
        },
        budget: { total: 2000000, spent: 1800000, currency: 'SAR' },
      },
    ]);

    this.logger.log(`✅ ${projects.length} projects created`);
    this.logger.log('   → [0] مشروع تطوير مهارات الشباب التقني  ← POSITIVE ✅');
    this.logger.log('   → [1] مشروع دعم الأسر الريفية             ← NEGATIVE ❌');
    return projects;
  }

  // ─── Beneficiaries (60 total: 40 male + 20 female) ───────────────────────
  private async seedBeneficiaries() {
    this.logger.log('👥 Seeding 60 beneficiaries...');
    const data: any[] = [];

    for (let i = 0; i < 40; i++) {
      const ci = i % CITIES.length;
      data.push({
        beneficiaryType: BeneficiaryType.INDIVIDUAL,
        name: `${MALE_FIRST[i % 20]} ${LAST_NAMES[(i + 5) % 20]} ${LAST_NAMES[i % 20]}`,
        gender: 'male', age: 20 + (i % 20),
        city: CITIES[ci], region: REGIONS[ci],
        educationLevel: EDUCATIONS[i % 8], profession: PROFESSIONS[i % 8],
        phone: `+96650${String(1000000 + i).slice(1)}`,
        email: `male${i + 1}@example.com`,
        nationalId: `1${String(100000000 + i)}`,
      });
    }
    for (let i = 0; i < 20; i++) {
      const ci = (i + 3) % CITIES.length;
      data.push({
        beneficiaryType: BeneficiaryType.INDIVIDUAL,
        name: `${FEMALE_FIRST[i % 20]} ${LAST_NAMES[(i + 10) % 20]} ${LAST_NAMES[(i + 2) % 20]}`,
        gender: 'female', age: 20 + (i % 20),
        city: CITIES[ci], region: REGIONS[ci],
        educationLevel: EDUCATIONS[(i + 2) % 8], profession: PROFESSIONS[(i + 3) % 8],
        phone: `+96660${String(1000000 + i).slice(1)}`,
        email: `female${i + 1}@example.com`,
        nationalId: `2${String(100000000 + i)}`,
      });
    }

    const beneficiaries = await this.beneficiaryModel.insertMany(data);
    this.logger.log(`✅ ${beneficiaries.length} beneficiaries`);
    return beneficiaries;
  }

  // ─── Activities (4 per project = 8 total) ────────────────────────────────
  // Project 1 activities: all COMPLETED, high capacity
  // Project 2 activities: 2 COMPLETED with issues, 1 CANCELLED, 1 IN_PROGRESS (struggling)
  private async seedActivities(projects: any[]) {
    this.logger.log('📅 Seeding 8 activities (4 per project)...');

    const activitiesData: any[] = [
      // ── Project 1 (POSITIVE) activities ──────────────────────────────────
      {
        project: projects[0]._id,
        title: 'ورشة البرمجة بالذكاء الاصطناعي وتطبيقاته العملية',
        description: 'ورشة عمل متقدمة ومركّزة لتعلم تقنيات الذكاء الاصطناعي وتطبيقاتها العملية في مختلف المجالات مع نماذج تطبيقية حقيقية',
        activityDate: new Date('2025-02-15'),
        startTime: '09:00', endTime: '17:00',
        location: 'الرياض — مركز الابتكار التقني',
        capacity: 50, registeredCount: 49,
        activityType: ActivityType.WORKSHOP,
        status: ActivityStatus.COMPLETED,
        tags: ['ذكاء اصطناعي', 'برمجة', 'تطبيقات'],
      },
      {
        project: projects[0]._id,
        title: 'دورة تطوير تطبيقات الجوال والويب الاحترافية',
        description: 'دورة تدريبية شاملة لتطوير تطبيقات الجوال والويب باستخدام أحدث التقنيات والأدوات في السوق مع مشاريع حقيقية',
        activityDate: new Date('2025-04-20'),
        startTime: '09:00', endTime: '16:00',
        location: 'الرياض — مركز التدريب التقني',
        capacity: 40, registeredCount: 39,
        activityType: ActivityType.TRAINING,
        status: ActivityStatus.COMPLETED,
        tags: ['تطوير تطبيقات', 'ويب', 'جوال'],
      },
      {
        project: projects[0]._id,
        title: 'ملتقى ريادة الأعمال التقنية والشركات الناشئة',
        description: 'ملتقى سنوي يجمع رواد الأعمال الشباب والمستثمرين وخبراء الصناعة لتبادل الخبرات وعرض المشاريع الواعدة',
        activityDate: new Date('2025-07-10'),
        startTime: '09:00', endTime: '18:00',
        location: 'الرياض — فندق الريتز كارلتون',
        capacity: 150, registeredCount: 148,
        activityType: ActivityType.SEMINAR,
        status: ActivityStatus.COMPLETED,
        tags: ['ريادة أعمال', 'شركات ناشئة', 'استثمار'],
      },
      {
        project: projects[0]._id,
        title: 'برنامج الأمن السيبراني وحماية البيانات المتقدم',
        description: 'برنامج تدريبي متخصص في الأمن السيبراني واختبار الاختراق وأساليب الحماية الرقمية للأفراد والمؤسسات',
        activityDate: new Date('2025-10-05'),
        startTime: '09:00', endTime: '17:00',
        location: 'الرياض — مركز الأمن الرقمي',
        capacity: 35, registeredCount: 34,
        activityType: ActivityType.TRAINING,
        status: ActivityStatus.COMPLETED,
        tags: ['أمن سيبراني', 'حماية', 'رقمي'],
      },
      // ── Project 2 (NEGATIVE) activities ──────────────────────────────────
      {
        project: projects[1]._id,
        title: 'ورشة الأساليب الزراعية الحديثة',
        description: 'ورشة لتقديم أساليب الزراعة الحديثة للمزارعين في المناطق الريفية — حضور ضعيف ومحتوى غير ملائم',
        activityDate: new Date('2025-04-10'),
        startTime: '09:00', endTime: '15:00',
        location: 'أبها — قاعة المجتمع المحلي',
        capacity: 60, registeredCount: 14,
        activityType: ActivityType.WORKSHOP,
        status: ActivityStatus.COMPLETED,
        tags: ['زراعة', 'ريفي', 'تدريب'],
      },
      {
        project: projects[1]._id,
        title: 'دورة التسويق الزراعي والمنتجات المحلية',
        description: 'دورة في التسويق المحلي للمنتجات الزراعية — التزمت بالإلغاء بسبب غياب المدرب وضعف الإقبال',
        activityDate: new Date('2025-06-15'),
        startTime: '09:00', endTime: '15:00',
        location: 'أبها — مركز التدريب الزراعي',
        capacity: 50, registeredCount: 8,
        activityType: ActivityType.TRAINING,
        status: ActivityStatus.CANCELLED,
        tags: ['تسويق', 'زراعة', 'منتجات'],
      },
      {
        project: projects[1]._id,
        title: 'يوم التوعية بالدعم الحكومي للمزارعين',
        description: 'يوم توعوي حول برامج الدعم الحكومي — منظم بشكل سيء ولم يصل للجمهور المستهدف الأساسي',
        activityDate: new Date('2025-08-20'),
        startTime: '10:00', endTime: '14:00',
        location: 'أبها — ساحة البلدية',
        capacity: 200, registeredCount: 22,
        activityType: ActivityType.SEMINAR,
        status: ActivityStatus.COMPLETED,
        tags: ['دعم حكومي', 'توعية', 'مزارعون'],
      },
      {
        project: projects[1]._id,
        title: 'ورشة تقنيات الري والمياه الحديثة',
        description: 'ورشة عن تقنيات الري الحديثة — تأجّل مراراً وحضر عدد قليل جداً مقارنة بالطاقة الاستيعابية',
        activityDate: new Date('2025-11-10'),
        startTime: '09:00', endTime: '14:00',
        location: 'أبها — مزرعة نموذجية',
        capacity: 80, registeredCount: 11,
        activityType: ActivityType.WORKSHOP,
        status: ActivityStatus.IN_PROGRESS,
        tags: ['ري', 'مياه', 'زراعة حديثة'],
      },
    ];

    const activities = await this.activityModel.insertMany(activitiesData);
    this.logger.log(`✅ ${activities.length} activities`);
    return activities;
  }

  // ─── Participants ─────────────────────────────────────────────────────────
  private async seedParticipants(beneficiaries: any[]) {
    this.logger.log('🎓 Seeding participants...');
    const individuals = beneficiaries.filter((b: any) => b.beneficiaryType === BeneficiaryType.INDIVIDUAL);

    const participants = await this.participantModel.insertMany(
      individuals.map((b: any, i: number) => ({
        beneficiary: b._id,
        fullName: b.name,
        email: `participant${i + 1}@example.com`,
        phone: b.phone, age: b.age,
        gender: i % 2 === 0 ? Gender.MALE : Gender.FEMALE,
        city: b.city,
        educationLevel: b.educationLevel,
        occupation: b.profession,
        status: i % 7 === 6 ? ParticipantStatus.COMPLETED
               : i % 7 === 5 ? ParticipantStatus.DROPPED
               : ParticipantStatus.ACTIVE,
      })),
    );

    this.logger.log(`✅ ${participants.length} participants`);
    return participants;
  }

  // ─── Activity Participants ────────────────────────────────────────────────
  private async seedActivityParticipants(activities: any[], participants: any[]) {
    this.logger.log('🔗 Seeding activity participants...');
    const data: any[] = [];
    const seen = new Set<string>();

    // Project 1 activities (0-3): many participants
    for (let ai = 0; ai < 4; ai++) {
      const count = Math.min(30, participants.length);
      for (let pi = 0; pi < count; pi++) {
        const key = `${activities[ai]._id}-${participants[pi]._id}`;
        if (!seen.has(key)) { seen.add(key); data.push({ activity: activities[ai]._id, participant: participants[pi]._id }); }
      }
    }
    // Project 2 activities (4-7): very few participants
    for (let ai = 4; ai < 8; ai++) {
      const count = Math.min(5, participants.length);
      for (let pi = 0; pi < count; pi++) {
        const key = `${activities[ai]._id}-${participants[pi + 30 < participants.length ? pi + 30 : pi]._id}`;
        const p = participants[pi + 30 < participants.length ? pi + 30 : pi];
        if (!seen.has(key)) { seen.add(key); data.push({ activity: activities[ai]._id, participant: p._id }); }
      }
    }

    await this.activityParticipantModel.insertMany(data);
    this.logger.log(`✅ ${data.length} activity-participant links`);
  }

  // ─── Activity Beneficiaries ───────────────────────────────────────────────
  private async seedActivityBeneficiaries(activities: any[], beneficiaries: any[]) {
    this.logger.log('🔗 Seeding activity beneficiaries...');
    const data: any[] = [];
    const seen = new Set<string>();

    for (let ai = 0; ai < 4; ai++) {
      const count = Math.min(35, beneficiaries.length);
      for (let bi = 0; bi < count; bi++) {
        const key = `${activities[ai]._id}-${beneficiaries[bi]._id}`;
        if (!seen.has(key)) { seen.add(key); data.push({ activity: activities[ai]._id, beneficiary: beneficiaries[bi]._id }); }
      }
    }
    for (let ai = 4; ai < 8; ai++) {
      const count = Math.min(8, beneficiaries.length);
      for (let bi = 0; bi < count; bi++) {
        const bIdx = bi + 35 < beneficiaries.length ? bi + 35 : bi;
        const key = `${activities[ai]._id}-${beneficiaries[bIdx]._id}`;
        if (!seen.has(key)) { seen.add(key); data.push({ activity: activities[ai]._id, beneficiary: beneficiaries[bIdx]._id }); }
      }
    }

    await this.activityBeneficiaryModel.insertMany(data);
    this.logger.log(`✅ ${data.length} activity-beneficiary links`);
  }

  // ─── Surveys (2 per activity = 16 total) ──────────────────────────────────
  // Activity 0-3 belong to project 1 (positive) → high targetResponses, CLOSED/ACTIVE
  // Activity 4-7 belong to project 2 (negative) → low targetResponses, mostly CLOSED
  private async seedSurveys(activities: any[]) {
    this.logger.log('📝 Seeding 16 surveys...');
    const surveysData: any[] = [];

    activities.forEach((activity, ai) => {
      const isPositiveProject = ai < 4;

      const preStatus  = ai < 3 ? SurveyStatus.CLOSED : (isPositiveProject ? SurveyStatus.CLOSED : SurveyStatus.CLOSED);
      const postStatus = ai < 3 ? SurveyStatus.CLOSED : (isPositiveProject ? SurveyStatus.ACTIVE : SurveyStatus.CLOSED);
      const preTarget  = isPositiveProject ? 300 : 80;
      const postTarget = isPositiveProject ? 280 : 60;

      surveysData.push({
        activity: activity._id,
        title: `تقييم قبلي — ${activity.title.substring(0, 40)}`,
        description: 'يقيس هذا الاستبيان مستوى المعرفة والاحتياجات قبل بدء النشاط',
        type: SurveyType.PRE_EVALUATION,
        status: preStatus,
        targetResponses: preTarget,
        totalResponses: 0,
        isAnonymous: false,
        welcomeMessage: 'نرحب بمشاركتك — إجاباتك ستساعدنا على تقديم أفضل برنامج ممكن',
        thankYouMessage: 'شكراً على مشاركتك القيّمة',
      });

      surveysData.push({
        activity: activity._id,
        title: `تقييم بعدي ورضا — ${activity.title.substring(0, 40)}`,
        description: 'يقيس هذا الاستبيان مدى رضا المستفيدين ومستوى تحقق الأهداف',
        type: SurveyType.POST_EVALUATION,
        status: postStatus,
        targetResponses: postTarget,
        totalResponses: 0,
        isAnonymous: false,
        welcomeMessage: 'نقدر وقتك — آراؤك تساعدنا على التحسين المستمر',
        thankYouMessage: 'نشكرك على إكمال الاستبيان',
      });
    });

    const surveys = await this.surveyModel.insertMany(surveysData);
    this.logger.log(`✅ ${surveys.length} surveys`);
    return surveys;
  }

  // ─── Survey Questions (8 per survey = 128 total) ──────────────────────────
  private async seedSurveyQuestions(surveys: any[]) {
    this.logger.log('❓ Seeding 128 questions (8 per survey)...');

    // Knowledge questions for post-surveys — Project 1 (tech domain)
    const P1_KNOWLEDGE = [
      { q: 'ما أفضل نهج لبناء نموذج تعلم آلي ناجح؟', opts: ['جمع بيانات نظيفة وممثّلة ثم اختيار الخوارزمية المناسبة', 'تطبيق أعقد خوارزمية متاحة فوراً', 'الاعتماد على بيانات قليلة مع نموذج بسيط', 'تجاهل مرحلة اختبار النموذج'], correct: 'جمع بيانات نظيفة وممثّلة ثم اختيار الخوارزمية المناسبة' },
      { q: 'ما أهم مبدأ في تطوير البرمجيات الاحترافية؟', opts: ['كتابة أكثر الأكواد تعقيداً', 'قابلية القراءة والصيانة والاختبار', 'تجنب التوثيق لتوفير الوقت', 'العمل منفرداً دون مراجعة'], correct: 'قابلية القراءة والصيانة والاختبار' },
      { q: 'ما معنى Agile في إدارة مشاريع البرمجيات؟', opts: ['تطوير الكود بأسرع وقت ممكن', 'منهجية مرنة تعتمد التطوير التدريجي والتحسين المستمر', 'إنهاء المشروع كاملاً قبل اختباره', 'عدم التخطيط والعمل بشكل عشوائي'], correct: 'منهجية مرنة تعتمد التطوير التدريجي والتحسين المستمر' },
      { q: 'ما أهم ممارسة في الأمن السيبراني؟', opts: ['مشاركة كلمات المرور مع الزملاء للسهولة', 'استخدام المصادقة متعددة العوامل وتحديث الأنظمة بانتظام', 'تجاهل تحديثات الأمان لتوفير الوقت', 'استخدام كلمة مرور واحدة لكل الأنظمة'], correct: 'استخدام المصادقة متعددة العوامل وتحديث الأنظمة بانتظام' },
    ];

    // Knowledge questions for post-surveys — Project 2 (agricultural domain)
    const P2_KNOWLEDGE = [
      { q: 'ما أفضل طريقة لتحسين إنتاجية الأرض الزراعية؟', opts: ['الزراعة بنفس المحصول سنوياً دون تغيير', 'تدوير المحاصيل وتحسين التربة بالأسمدة العضوية', 'استخدام المبيدات بكميات كبيرة', 'الاعتماد على مياه الأمطار فقط'], correct: 'تدوير المحاصيل وتحسين التربة بالأسمدة العضوية' },
      { q: 'ما أهم عامل في نجاح التسويق الزراعي؟', opts: ['خفض الأسعار دائماً', 'الجودة والوصول للسوق المناسب في التوقيت الصحيح', 'زيادة الإنتاج بغض النظر عن الطلب', 'تجنب التعامل مع الوسطاء'], correct: 'الجودة والوصول للسوق المناسب في التوقيت الصحيح' },
      { q: 'ما الهدف الرئيسي من تقنيات الري الحديثة؟', opts: ['استخدام أكبر قدر من المياه', 'توفير المياه وزيادة الكفاءة الإنتاجية', 'تقليل تكاليف العمالة فقط', 'إبقاء التربة رطبة دائماً'], correct: 'توفير المياه وزيادة الكفاءة الإنتاجية' },
      { q: 'كيف يمكن للمزارع الاستفادة من برامج الدعم الحكومي؟', opts: ['تجاهلها لأنها معقدة', 'التسجيل في برامج وزارة البيئة والزراعة والغذاء', 'الانتظار حتى تأتي المساعدة تلقائياً', 'الاعتماد على الجيران فقط'], correct: 'التسجيل في برامج وزارة البيئة والزراعة والغذاء' },
    ];

    const P1_MC_PRE  = ['البرمجة وتطوير البرمجيات', 'الذكاء الاصطناعي وتعلم الآلة', 'الأمن السيبراني', 'إدارة المشاريع التقنية', 'ريادة الأعمال الرقمية'];
    const P1_MC_POST = ['البرمجة الاحترافية والبرمجيات', 'نماذج الذكاء الاصطناعي التطبيقية', 'الأمن السيبراني المتقدم', 'قيادة الفرق التقنية', 'بناء وإطلاق المنتجات الرقمية'];
    const P2_MC_PRE  = ['أساليب الزراعة الحديثة', 'تقنيات الري والمياه', 'التسويق الزراعي', 'إدارة المزرعة', 'الدعم الحكومي'];
    const P2_MC_POST = ['الزراعة الحديثة', 'تقنيات الري', 'التسويق', 'إدارة الموارد', 'الشبكات التسويقية'];

    const PRE_EXP_OPTS = [
      ['مبتدئ تماماً', 'لديّ خبرة بسيطة', 'خبرة متوسطة', 'خبير ومتقدم'],
      ['أقل من سنة', 'من 1-3 سنوات', 'من 3-5 سنوات', 'أكثر من 5 سنوات'],
      ['للمرة الأولى', 'سبق لي الحضور مرة', 'حضرت عدة مرات', 'مشارك منتظم'],
      ['لا أعلم شيئاً', 'لديّ معرفة أساسية', 'لديّ معرفة كافية', 'لديّ خبرة واسعة'],
    ];

    const PRE_Q1 = [
      'ما هي أهدافك الرئيسية من المشاركة في هذا البرنامج؟',
      'ما الذي تأمل في تعلمه وتطويره خلال هذا البرنامج؟',
      'ما التحديات التي تواجهها حالياً في هذا المجال؟',
      'كيف تصف وضعك الحالي قبل الانضمام لهذا البرنامج؟',
    ];
    const PRE_Q2 = [
      'ما توقعاتك من هذا البرنامج وكيف تأمل أن يغير حياتك؟',
      'صِف خبرتك السابقة وأبرز تحدياتك في هذا المجال؟',
      'ما الذي يمنعك من تحقيق أهدافك في هذا المجال حتى الآن؟',
      'ما الأهداف المحددة التي تريد تحقيقها بنهاية البرنامج؟',
    ];
    const POST_Q1 = [
      'ما أهم ثلاثة أشياء استفدتها من هذا البرنامج وكيف ستطبقها؟',
      'كيف أثّر هذا البرنامج على أسلوبك وطريقة تفكيرك؟',
      'ما الذي تغيّر فيك بعد المشاركة في هذا البرنامج؟',
      'ما أبرز المكاسب التي حققتها من هذا البرنامج؟',
    ];
    const POST_Q2 = [
      'ما اقتراحاتك لتحسين البرنامج وجعله أكثر فائدة للمشاركين القادمين؟',
      'هل تنصح الآخرين بالمشاركة في هذا البرنامج؟ ولماذا؟',
      'ما الجوانب التي أعجبتك وما التي تحتاج إلى تطوير؟',
      'كيف تقيّم تجربتك الكاملة في البرنامج بكلماتك الخاصة؟',
    ];

    const questionsData: any[] = [];

    surveys.forEach((survey, si) => {
      const isPre       = si % 2 === 0;
      const activityIdx = Math.floor(si / 2);
      const isP1        = activityIdx < 4;
      const qi          = activityIdx % 4;
      const kqPool      = isP1 ? P1_KNOWLEDGE : P2_KNOWLEDGE;
      const kq          = kqPool[activityIdx % kqPool.length];
      const mcPre       = isP1 ? P1_MC_PRE  : P2_MC_PRE;
      const mcPost      = isP1 ? P1_MC_POST : P2_MC_POST;

      // Q1: textarea — main open question
      questionsData.push({
        survey: survey._id, order: 1,
        questionText: isPre ? PRE_Q1[qi] : POST_Q1[qi],
        type: 'textarea', isRequired: true,
        description: 'يرجى الإجابة بتفصيل كافٍ لا يقل عن جملتين',
      });

      // Q2: textarea — secondary open question
      questionsData.push({
        survey: survey._id, order: 2,
        questionText: isPre ? PRE_Q2[qi] : POST_Q2[qi],
        type: 'textarea', isRequired: true,
        description: 'إجابتك ستساعد في تطوير البرنامج',
      });

      // Q3: rating (1-5)
      questionsData.push({
        survey: survey._id, order: 3,
        questionText: isPre
          ? 'قيّم مستوى معرفتك الحالية في هذا المجال من 1 إلى 5'
          : 'قيّم البرنامج بشكل عام من 1 إلى 5',
        type: 'rating', isRequired: true,
        description: '1 = منخفض جداً، 5 = ممتاز',
      });

      // Q4: scale (1-10)
      questionsData.push({
        survey: survey._id, order: 4,
        questionText: isPre
          ? 'على مقياس من 1 إلى 10، كيف تقيّم استعدادك لهذا البرنامج؟'
          : 'على مقياس من 1 إلى 10، ما مستوى رضاك الكلي عن البرنامج؟',
        type: 'scale', isRequired: true,
        description: '1 = منخفض جداً، 10 = ممتاز',
      });

      // Q5: single_choice
      questionsData.push({
        survey: survey._id, order: 5,
        questionText: isPre ? 'ما مستوى خبرتك في هذا المجال؟' : kq.q,
        type: 'single_choice', isRequired: true,
        options: isPre ? PRE_EXP_OPTS[qi % 4] : kq.opts,
      });

      // Q6: multiple_choice
      questionsData.push({
        survey: survey._id, order: 6,
        questionText: isPre
          ? 'ما المجالات التي تحتاج إلى تطوير؟ (اختر كل ما ينطبق)'
          : 'ما المهارات التي طورتها من خلال البرنامج؟ (اختر كل ما ينطبق)',
        type: 'multiple_choice', isRequired: true,
        options: isPre ? mcPre : mcPost,
      });

      // Q7: yes_no
      questionsData.push({
        survey: survey._id, order: 7,
        questionText: isPre
          ? 'هل سبق لك حضور برامج مشابهة من قبل؟'
          : 'هل ستطبق ما تعلمته في حياتك العملية؟',
        type: 'yes_no', isRequired: true,
      });

      // Q8: number
      questionsData.push({
        survey: survey._id, order: 8,
        questionText: isPre
          ? 'كم سنة خبرتك في هذا المجال؟'
          : 'كم نسبة التحسن التي تشعر بها بعد البرنامج مقارنة بقبله؟ (%)',
        type: 'number', isRequired: false,
        description: isPre ? 'أدخل رقماً من 0 إلى 20' : 'أدخل نسبة مئوية من 0 إلى 100',
      });
    });

    const questions = await this.surveyQuestionModel.insertMany(questionsData);
    this.logger.log(`✅ ${questions.length} questions`);
    return questions;
  }

  // ─── Survey Submissions ───────────────────────────────────────────────────
  // Project 1: HIGH ratings (post: rating 4-5, scale 8-10, improvement 70-95%)
  //            TEXT: clearly positive from P1_POST_TEXTS
  //            Knowledge Q5: mostly CORRECT answer (index 0 = correct)
  //
  // Project 2: LOW ratings (post: rating 1-2, scale 1-3, improvement 5-15%)
  //            TEXT: clearly negative from P2_POST_TEXTS
  //            Knowledge Q5: mostly WRONG answer (index 1,2,3 = wrong)
  private async seedSurveySubmissions(
    surveys: any[],
    beneficiaries: any[],
    questions: any[],
    projects: any[],
  ) {
    this.logger.log('📨 Seeding submissions...');

    const individuals = beneficiaries.filter((b: any) => b.beneficiaryType === BeneficiaryType.INDIVIDUAL);
    const Q = 8;
    let totalInserted = 0;

    for (let si = 0; si < surveys.length; si++) {
      const survey      = surveys[si];
      if (survey.status === SurveyStatus.DRAFT) continue;

      const activityIdx = Math.floor(si / 2);
      const isP1        = activityIdx < 4;
      const isPre       = si % 2 === 0;

      // Number of respondents
      let numRespondents: number;
      if (survey.status === SurveyStatus.CLOSED) {
        const ratio = isP1 ? (0.85 + (si % 5) * 0.02) : (0.50 + (si % 4) * 0.03);
        numRespondents = Math.floor(Math.floor(survey.targetResponses * ratio) / Q);
      } else {
        const ratio = isP1 ? 0.40 : 0.15;
        numRespondents = Math.floor(Math.floor(survey.targetResponses * ratio) / Q);
      }
      if (numRespondents === 0) continue;

      const qStart = si * Q;
      const sq = questions.slice(qStart, qStart + Q);
      if (sq.length < Q) continue;
      const [q0, q1, q2, q3, q4, q5, q6, q7] = sq;

      const sessionBase = new Date(2025, (activityIdx % 10) + 1, 15);
      const batch: any[] = [];

      const prePool  = isP1 ? P1_PRE_TEXTS  : P2_PRE_TEXTS;
      const postPool = isP1 ? P1_POST_TEXTS : P2_POST_TEXTS;
      const textPool = isPre ? prePool : postPool;

      for (let bi = 0; bi < numRespondents; bi++) {
        const beneficiary = individuals[bi % individuals.length];
        const startedAt   = new Date(sessionBase.getTime() + bi * 120_000);
        const completedAt = new Date(startedAt.getTime() + (300 + bi * 45) * 1000);
        const base = { survey: survey._id, beneficiary: beneficiary._id, startedAt, completedAt };

        // Q1 & Q2: textarea
        batch.push({ ...base, question: q0._id, textValue: textPool[bi % textPool.length] });
        batch.push({ ...base, question: q1._id, textValue: textPool[(bi + 7) % textPool.length] });

        // Q3: rating (1-5)
        // P1 post: 4-5 | P1 pre: 2-4 | P2 post: 1-2 | P2 pre: 2-4
        let ratingVal: number;
        if (isP1 && !isPre)       ratingVal = 4 + (bi % 2);         // 4 or 5
        else if (!isP1 && !isPre) ratingVal = 1 + (bi % 2);         // 1 or 2
        else                      ratingVal = 2 + (bi % 3);          // 2,3,4 (pre)
        batch.push({ ...base, question: q2._id, numberValue: ratingVal });

        // Q4: scale (1-10)
        // P1 post: 8-10 | P1 pre: 4-7 | P2 post: 1-3 | P2 pre: 3-6
        let scaleVal: number;
        if (isP1 && !isPre)       scaleVal = 8 + (bi % 3);          // 8,9,10
        else if (!isP1 && !isPre) scaleVal = 1 + (bi % 3);          // 1,2,3
        else if (isP1)            scaleVal = 4 + (bi % 4);           // 4-7
        else                      scaleVal = 3 + (bi % 4);           // 3-6
        batch.push({ ...base, question: q3._id, numberValue: Math.min(scaleVal, 10) });

        // Q5: single_choice
        const opts4 = q4.options ?? [];
        let opt4Idx: number;
        if (isPre) {
          opt4Idx = bi % Math.max(opts4.length, 1);
        } else if (isP1) {
          // Project 1 post: mostly correct (index 0 = correct), 85% correct
          opt4Idx = bi % 7 === 0 ? 1 : 0;
        } else {
          // Project 2 post: mostly wrong (avoid index 0 = correct), 20% correct
          opt4Idx = bi % 5 === 0 ? 0 : (1 + (bi % Math.max(opts4.length - 1, 1)));
        }
        batch.push({ ...base, question: q4._id, textValue: opts4[Math.min(opt4Idx, opts4.length - 1)] ?? '' });

        // Q6: multiple_choice
        const opts5 = q5.options ?? [];
        const arr5: string[] = [];
        const count5 = 2 + (bi % 2);
        for (let k = 0; k < count5 && k < opts5.length; k++) {
          arr5.push(opts5[(bi + k) % opts5.length]);
        }
        batch.push({ ...base, question: q5._id, arrayValue: arr5.length > 0 ? arr5 : opts5.slice(0, 2) });

        // Q7: yes_no
        // P1 post: 95% true | P2 post: 20% true (won't apply what they "learned")
        let boolVal: boolean;
        if (isPre)             boolVal = bi % 3 !== 0;
        else if (isP1)         boolVal = bi % 20 !== 0;   // 95% yes
        else                   boolVal = bi % 5 === 0;    // 20% yes
        batch.push({ ...base, question: q6._id, booleanValue: boolVal });

        // Q8: number
        // P1 post: improvement 70-95% | P2 post: improvement 5-15%
        let numVal: number;
        if (isPre)             numVal = bi % 11;
        else if (isP1)         numVal = 70 + (bi % 26);
        else                   numVal = 5  + (bi % 11);
        batch.push({ ...base, question: q7._id, numberValue: numVal });
      }

      for (let i = 0; i < batch.length; i += 500) {
        await this.submissionModel.insertMany(batch.slice(i, i + 500));
      }
      totalInserted += batch.length;
    }

    this.logger.log(`✅ ${totalInserted} submissions inserted`);
    return totalInserted;
  }

  // ─── Correct Answers ──────────────────────────────────────────────────────
  private async seedCorrectAnswers(surveys: any[], questions: any[]) {
    this.logger.log('✔️  Seeding correct answers...');

    const P1_CORRECT = [
      'جمع بيانات نظيفة وممثّلة ثم اختيار الخوارزمية المناسبة',
      'قابلية القراءة والصيانة والاختبار',
      'منهجية مرنة تعتمد التطوير التدريجي والتحسين المستمر',
      'استخدام المصادقة متعددة العوامل وتحديث الأنظمة بانتظام',
    ];
    const P2_CORRECT = [
      'تدوير المحاصيل وتحسين التربة بالأسمدة العضوية',
      'الجودة والوصول للسوق المناسب في التوقيت الصحيح',
      'توفير المياه وزيادة الكفاءة الإنتاجية',
      'التسجيل في برامج وزارة البيئة والزراعة والغذاء',
    ];

    const Q = 8;
    const correctAnswers: any[] = [];

    for (let si = 0; si < surveys.length; si++) {
      const isPre       = si % 2 === 0;
      const activityIdx = Math.floor(si / 2);
      const isP1        = activityIdx < 4;

      const qStart = si * Q;
      const sq = questions.slice(qStart, qStart + Q);
      if (sq.length < Q) continue;
      const [,, q2, q3, q4,, q6, q7] = sq;

      // Q3 rating: expected — pre=3, post: P1=5, P2=2
      correctAnswers.push({ question: q2._id, numberValue: isPre ? 3 : (isP1 ? 5 : 2) });

      // Q4 scale: expected — pre=5, post: P1=9, P2=3
      correctAnswers.push({ question: q3._id, numberValue: isPre ? 5 : (isP1 ? 9 : 3) });

      if (!isPre) {
        // Q5 correct answer
        const correctPool = isP1 ? P1_CORRECT : P2_CORRECT;
        correctAnswers.push({ question: q4._id, textValue: correctPool[activityIdx % correctPool.length] });

        // Q7 yes_no: post should be true
        correctAnswers.push({ question: q6._id, booleanValue: true });

        // Q8 improvement: P1 expects 70%, P2 expects 30%
        correctAnswers.push({ question: q7._id, numberValue: isP1 ? 70 : 30 });
      }
    }

    await this.correctAnswerModel.insertMany(correctAnswers);
    this.logger.log(`✅ ${correctAnswers.length} correct answers`);
    return correctAnswers;
  }

  // ─── Indicators (3 per project = 6 total) ────────────────────────────────
  private async seedIndicators(projects: any[]) {
    this.logger.log('📊 Seeding 6 indicators...');

    const p1Indicators = [
      { name: 'عدد الشباب المدرّبين في المهارات التقنية', indicatorType: IndicatorType.OUTPUT,  targetValue: 500,  actualValue: 487,  unit: MeasurementUnit.NUMBER,     baselineValue: 0,  trend: TrendDirection.IMPROVING, description: 'إجمالي الشباب المدرّبين في برامج المهارات التقنية المتكاملة' },
      { name: 'نسبة رضا المستفيدين عن البرنامج',          indicatorType: IndicatorType.OUTCOME,  targetValue: 80,   actualValue: 92,   unit: MeasurementUnit.PERCENTAGE,  baselineValue: 0,  trend: TrendDirection.IMPROVING, description: 'متوسط نسبة الرضا العام المقاسة من خلال استبيانات التقييم البعدي' },
      { name: 'نسبة توظيف المستفيدين بعد 3 أشهر',          indicatorType: IndicatorType.IMPACT,   targetValue: 70,   actualValue: 74,   unit: MeasurementUnit.PERCENTAGE,  baselineValue: 20, trend: TrendDirection.IMPROVING, description: 'نسبة المشاركين الذين حصلوا على وظيفة أو أطلقوا مشروعاً تقنياً' },
    ];

    const p2Indicators = [
      { name: 'عدد الأسر الريفية المستفيدة من الدعم',       indicatorType: IndicatorType.OUTPUT,  targetValue: 300,  actualValue: 42,   unit: MeasurementUnit.NUMBER,     baselineValue: 0,  trend: TrendDirection.DECLINING, description: 'إجمالي الأسر الريفية التي شاركت في أنشطة البرنامج' },
      { name: 'نسبة رضا الأسر الريفية عن البرنامج',          indicatorType: IndicatorType.OUTCOME,  targetValue: 70,   actualValue: 18,   unit: MeasurementUnit.PERCENTAGE,  baselineValue: 0,  trend: TrendDirection.DECLINING, description: 'متوسط نسبة رضا الأسر المقاسة من خلال استبيانات التقييم' },
      { name: 'نسبة تحسن الدخل الزراعي للأسر المستفيدة',     indicatorType: IndicatorType.IMPACT,   targetValue: 40,   actualValue: 5,    unit: MeasurementUnit.PERCENTAGE,  baselineValue: 0,  trend: TrendDirection.DECLINING, description: 'نسبة التحسن في الدخل الزراعي الشهري بعد المشاركة في البرنامج' },
    ];

    const allData: any[] = [
      ...p1Indicators.map(i => ({ ...i, isActive: true, measurementMethod: 'استبيانات وسجلات المشاركة', frequency: 'ربع سنوي' })),
      ...p2Indicators.map(i => ({ ...i, isActive: true, measurementMethod: 'استبيانات وسجلات الحضور',   frequency: 'ربع سنوي' })),
    ];

    const indicators = await this.indicatorModel.insertMany(allData);

    // Link indicators to projects
    await this.projectModel.findByIdAndUpdate(projects[0]._id, {
      $set: { indicators: indicators.slice(0, 3).map(i => i._id) },
    });
    await this.projectModel.findByIdAndUpdate(projects[1]._id, {
      $set: { indicators: indicators.slice(3, 6).map(i => i._id) },
    });

    this.logger.log(`✅ ${indicators.length} indicators linked to projects`);
    return indicators;
  }

  // ─── Indicator History ────────────────────────────────────────────────────
  private async seedIndicatorHistory(indicators: any[]) {
    this.logger.log('📈 Seeding indicator history...');

    const historyData: any[] = [];

    indicators.forEach((ind, i) => {
      const isP1     = i < 3;
      const target   = ind.targetValue;
      const actual   = ind.actualValue;
      const baseline = ind.baselineValue ?? 0;

      let quarters: { value: number; date: Date; source: string; prev: number }[];

      if (isP1) {
        // Project 1: steady growth reaching/exceeding target
        const q1 = Math.round(actual * 0.22);
        const q2 = Math.round(actual * 0.48);
        const q3 = Math.round(actual * 0.78);
        const q4 = actual;
        quarters = [
          { value: q1, date: new Date('2025-03-31'), source: 'تقرير الربع الأول',  prev: baseline },
          { value: q2, date: new Date('2025-06-30'), source: 'تقرير الربع الثاني', prev: q1 },
          { value: q3, date: new Date('2025-09-30'), source: 'تقرير الربع الثالث', prev: q2 },
          { value: q4, date: new Date('2025-12-31'), source: 'تقرير نهاية العام',  prev: q3 },
        ];
      } else {
        // Project 2: slow start, stagnation, far below target
        const q1 = Math.round(actual * 0.30);
        const q2 = Math.round(actual * 0.55);
        const q3 = Math.round(actual * 0.80);
        const q4 = actual;
        quarters = [
          { value: q1, date: new Date('2025-05-31'), source: 'تقرير الربع الأول',  prev: baseline },
          { value: q2, date: new Date('2025-07-31'), source: 'تقرير الربع الثاني', prev: q1 },
          { value: q3, date: new Date('2025-10-31'), source: 'تقرير الربع الثالث', prev: q2 },
          { value: q4, date: new Date('2025-12-31'), source: 'تقرير نهاية العام',  prev: q3 },
        ];
      }

      quarters.forEach((q, qi) => {
        const changeAmt = q.value - q.prev;
        const changePct = q.prev > 0 ? Math.round((changeAmt / q.prev) * 100) : 0;
        historyData.push({
          indicator: ind._id,
          recordedValue: q.value,
          calculatedAt: q.date,
          source: q.source,
          notes: qi === 3
            ? `القيمة النهائية — حقق ${Math.round((actual / target) * 100)}% من الهدف (${target})`
            : `تقدم نحو الهدف (${target}) — اكتمل ${Math.round((q.value / target) * 100)}%`,
          previousValue: q.prev,
          changeAmount: changeAmt,
          changePercentage: changePct,
          status: qi < 3 ? 'verified' : 'recorded',
        });
      });
    });

    await this.indicatorHistoryModel.insertMany(historyData);
    this.logger.log(`✅ ${historyData.length} indicator history entries`);
  }
}
