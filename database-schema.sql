-- ============================================================================
-- Database Schema DDL — Social Impact Measurement Platform
-- Generated from current NestJS/Mongoose schemas
-- ============================================================================

-- ============================================================================
-- USERS
-- ============================================================================
CREATE TABLE `Users` (
  `_id`        varchar(24) PRIMARY KEY COMMENT 'MongoDB ObjectId',
  `name`       varchar(255) NOT NULL,
  `email`      varchar(255) NOT NULL UNIQUE,
  `password`   varchar(255) NOT NULL,
  `role`       ENUM('Admin','Manager','Staff') NOT NULL DEFAULT 'Staff',
  `status`     ENUM('active','suspended','pending') NOT NULL DEFAULT 'active',
  `phone`      varchar(50),
  `createdAt`  datetime NOT NULL,
  `updatedAt`  datetime NOT NULL
) COMMENT = 'مستخدمو النظام (مسؤولون، مدراء، موظفون)';

-- ============================================================================
-- PROJECTS
-- ============================================================================
CREATE TABLE `Projects` (
  `_id`          varchar(24) PRIMARY KEY COMMENT 'MongoDB ObjectId',
  `user_id`      varchar(24) NOT NULL COMMENT 'FK → Users._id (مالك المشروع)',
  `name`         varchar(255) NOT NULL,
  `description`  text        NOT NULL,
  `type`         ENUM('educational','health','training','intervention','evaluation','mixed') NOT NULL,
  `status`       ENUM('in_progress','completed','planned') NOT NULL DEFAULT 'planned',
  `startDate`    date        NOT NULL,
  `endDate`      date,
  `location`     varchar(255),
  `targetGroups` json        COMMENT 'مصفوفة نصية بالفئات المستهدفة',
  `budget`       json        COMMENT '{ total, currency, spent? }',
  `goals`        json        COMMENT '{ short_term: [], long_term: [] }',
  `metadata`     json,
  `createdAt`    datetime    NOT NULL,
  `updatedAt`    datetime    NOT NULL
) COMMENT = 'المشاريع والمبادرات التي تديرها المنظمة';

-- ============================================================================
-- BENEFICIARIES
-- ============================================================================
CREATE TABLE `Beneficiaries` (
  `_id`             varchar(24)  PRIMARY KEY COMMENT 'MongoDB ObjectId',
  `beneficiaryType` ENUM('individual','area') NOT NULL,
  `name`            varchar(255) NOT NULL,
  -- Individual fields
  `age`             int          UNSIGNED,
  `educationLevel`  varchar(255),
  `profession`      varchar(255),
  `gender`          varchar(20),
  `phone`           varchar(50),
  `email`           varchar(255),
  `nationalId`      varchar(50),
  -- Area fields
  `areaSize`        decimal(12,4) COMMENT 'بالكيلومتر المربع أو الوحدة المعتمدة',
  `population`      int          UNSIGNED,
  -- Shared location
  `city`            varchar(255),
  `region`          varchar(255),
  `notes`           text,
  `createdAt`       datetime     NOT NULL,
  `updatedAt`       datetime     NOT NULL
) COMMENT = 'المستفيدون المباشرون — أفراد أو مناطق جغرافية';

-- ============================================================================
-- ACTIVITIES
-- ============================================================================
CREATE TABLE `Activities` (
  `_id`            varchar(24)  PRIMARY KEY COMMENT 'MongoDB ObjectId',
  `project`        varchar(24)  NOT NULL COMMENT 'FK → Projects._id',
  `title`          varchar(255) NOT NULL,
  `description`    text         NOT NULL,
  `activityDate`   date         NOT NULL,
  `startTime`      varchar(5)   DEFAULT '00:00' COMMENT 'HH:mm',
  `endTime`        varchar(5)                   COMMENT 'HH:mm',
  `location`       varchar(255),
  `capacity`       int UNSIGNED NOT NULL DEFAULT 0,
  `registeredCount` int UNSIGNED NOT NULL DEFAULT 0,
  `activityType`   ENUM('training','workshop','seminar','consultation','field_visit','awareness_campaign','service_delivery','other') NOT NULL,
  `status`         ENUM('planned','in_progress','completed','cancelled') NOT NULL DEFAULT 'planned',
  `tags`           json         COMMENT 'مصفوفة وسوم',
  `createdAt`      datetime     NOT NULL,
  `updatedAt`      datetime     NOT NULL
) COMMENT = 'الأنشطة الميدانية أو التدريبية ضمن المشاريع';

-- ============================================================================
-- ACTIVITY_BENEFICIARIES  (junction: activity ↔ beneficiary)
-- ============================================================================
CREATE TABLE `Activity_Beneficiaries` (
  `_id`                 varchar(24) PRIMARY KEY COMMENT 'MongoDB ObjectId',
  `beneficiary`         varchar(24) NOT NULL COMMENT 'FK → Beneficiaries._id',
  `activity`            varchar(24) NOT NULL COMMENT 'FK → Activities._id',
  `interactionLevel`    tinyint UNSIGNED COMMENT '1 (minimal) – 5 (intensive)',
  `participationDegree` tinyint UNSIGNED COMMENT '1 (passive) – 5 (fully active)',
  `satisfactionRating`  tinyint UNSIGNED COMMENT '1 (very dissatisfied) – 5 (very satisfied)',
  `notes`               text,
  `createdAt`           datetime NOT NULL,
  `updatedAt`           datetime NOT NULL,
  UNIQUE KEY `uq_ab_beneficiary_activity` (`beneficiary`, `activity`)
) COMMENT = 'ربط المستفيدين بالأنشطة مع درجات التفاعل والمشاركة والرضا';

-- ============================================================================
-- PARTICIPANTS
-- ============================================================================
CREATE TABLE `Participants` (
  `_id`            varchar(24)  PRIMARY KEY COMMENT 'MongoDB ObjectId',
  `beneficiary`    varchar(24)           COMMENT 'FK → Beneficiaries._id (اختياري)',
  `fullName`       varchar(255) NOT NULL,
  `email`          varchar(255),
  `phone`          varchar(50),
  `nationalId`     varchar(50)  UNIQUE,
  `age`            int UNSIGNED,
  `gender`         ENUM('male','female','other'),
  `city`           varchar(255),
  `educationLevel` varchar(255) COMMENT 'المستوى التعليمي (نص حر)',
  `occupation`     varchar(255) COMMENT 'المهنة أو المسمى الوظيفي (نص حر)',
  `status`         ENUM('active','completed','dropped','pending') NOT NULL DEFAULT 'pending',
  `createdAt`      datetime     NOT NULL,
  `updatedAt`      datetime     NOT NULL
) COMMENT = 'الأفراد المشاركون في البرامج والأنشطة';

-- ============================================================================
-- ACTIVITY_PARTICIPANTS  (junction: activity ↔ participant)
-- ============================================================================
CREATE TABLE `Activity_Participants` (
  `_id`         varchar(24) PRIMARY KEY COMMENT 'MongoDB ObjectId',
  `activity`    varchar(24) NOT NULL COMMENT 'FK → Activities._id',
  `participant` varchar(24) NOT NULL COMMENT 'FK → Participants._id',
  `createdAt`   datetime    NOT NULL,
  `updatedAt`   datetime    NOT NULL,
  UNIQUE KEY `uq_ap_activity_participant` (`activity`, `participant`)
) COMMENT = 'ربط المشاركين بالأنشطة (مشارك لا يُسجّل في نشاط واحد أكثر من مرة)';

-- ============================================================================
-- SURVEYS
-- ============================================================================
CREATE TABLE `Surveys` (
  `_id`             varchar(24)  PRIMARY KEY COMMENT 'MongoDB ObjectId',
  `activity`        varchar(24)  NOT NULL COMMENT 'FK → Activities._id',
  `title`           varchar(255) NOT NULL,
  `description`     text         NOT NULL,
  `type`            ENUM('evaluation','test','satisfaction') NOT NULL,
  `status`          ENUM('draft','active','closed','archived') NOT NULL DEFAULT 'draft',
  `isAnonymous`     boolean      NOT NULL DEFAULT FALSE,
  `welcomeMessage`  text,
  `thankYouMessage` text,
  `targetResponses` int UNSIGNED  NOT NULL DEFAULT 0,
  `totalResponses`  int UNSIGNED  NOT NULL DEFAULT 0,
  `tags`            json          COMMENT 'مصفوفة وسوم',
  `settings`        json          COMMENT '{ showProgressBar?, randomizeQuestions?, requiredCompletion?, language? }',
  `customFields`    json,
  `createdAt`       datetime      NOT NULL,
  `updatedAt`       datetime      NOT NULL
) COMMENT = 'أدوات جمع البيانات (تقييمي، اختباري، قياس رضا)';

-- ============================================================================
-- SURVEY_QUESTIONS
-- ============================================================================
CREATE TABLE `Survey_Questions` (
  `_id`         varchar(24)  PRIMARY KEY COMMENT 'MongoDB ObjectId',
  `survey`      varchar(24)  NOT NULL COMMENT 'FK → Surveys._id',
  `questionText` text        NOT NULL,
  `type`        ENUM('text','textarea','number','email','phone','date',
                     'single_choice','multiple_choice','dropdown',
                     'rating','scale','matrix','file_upload','yes_no') NOT NULL,
  `isRequired`  boolean      NOT NULL DEFAULT FALSE,
  `description` text,
  `options`     json         COMMENT 'مصفوفة خيارات الإجابة (للأسئلة الاختيارية)',
  `conditional` json         COMMENT '{ dependsOn?: questionId, showIf?: any }',
  `tags`        json         COMMENT 'مصفوفة وسوم',
  `createdAt`   datetime     NOT NULL,
  `updatedAt`   datetime     NOT NULL
) COMMENT = 'أسئلة الاستبيان — بدون ratingConfig / matrixConfig / placeholder / category / customFields';

-- ============================================================================
-- SURVEY_CORRECT_ANSWERS
-- ============================================================================
CREATE TABLE `Survey_Correct_Answers` (
  `_id`          varchar(24) PRIMARY KEY COMMENT 'MongoDB ObjectId',
  `question`     varchar(24) NOT NULL COMMENT 'FK → Survey_Questions._id',
  `textValue`    text,
  `numberValue`  decimal(18,4),
  `booleanValue` boolean,
  `dateValue`    date,
  `createdAt`    datetime    NOT NULL,
  `updatedAt`    datetime    NOT NULL
) COMMENT = 'الإجابات الصحيحة للأسئلة الاختبارية (يمكن أن يكون للسؤال أكثر من إجابة صحيحة)';

-- ============================================================================
-- SURVEY_SUBMISSIONS  (نموذج مسطّح: وثيقة واحدة لكل إجابة لكل سؤال)
-- ============================================================================
CREATE TABLE `Survey_Submissions` (
  `_id`          varchar(24) PRIMARY KEY COMMENT 'MongoDB ObjectId',
  `survey`       varchar(24) NOT NULL COMMENT 'FK → Surveys._id',
  `question`     varchar(24) NOT NULL COMMENT 'FK → Survey_Questions._id',
  `beneficiary`  varchar(24)          COMMENT 'FK → Beneficiaries._id (اختياري)',
  `startedAt`    datetime    NOT NULL  COMMENT 'بداية جلسة الاستجابة',
  `completedAt`  datetime             COMMENT 'نهاية جلسة الاستجابة',
  -- قيمة الإجابة (نوع واحد فقط يكون ممتلئاً)
  `textValue`    text,
  `numberValue`  decimal(18,4),
  `booleanValue` boolean,
  `dateValue`    date,
  -- التصحيح التلقائي (فقط في الاستبيانات الاختبارية)
  `isCorrect`    boolean,
  `createdAt`    datetime    NOT NULL,
  `updatedAt`    datetime    NOT NULL
) COMMENT = 'إجابات الاستبيانات — نموذج مسطّح (سجل واحد لكل سؤال في كل جلسة)';

-- ============================================================================
-- TEXT_ANALYSES
-- ============================================================================
CREATE TABLE `Text_Analyses` (
  `_id`                  varchar(24) PRIMARY KEY COMMENT 'MongoDB ObjectId',
  `project`              varchar(24) NOT NULL    COMMENT 'FK → Projects._id',
  `surveyAnswer`         varchar(24)             COMMENT 'FK → Survey_Submissions._id (اختياري)',
  `activityParticipant`  varchar(24)             COMMENT 'FK → Activity_Participants._id (اختياري)',
  `originalText`         text        NOT NULL,
  `cleanedText`          text,
  `sentiment`            ENUM('positive','negative','neutral'),
  `sentimentScore`       decimal(4,3) COMMENT '-1.000 إلى 1.000',
  `sentimentConfidence`  decimal(4,3) COMMENT '0.000 إلى 1.000',
  `keywords`             json         COMMENT '[{ word, frequency?, relevance? }]',
  `entities`             json         COMMENT '[{ text, type?, relevance? }]',
  `summary`              text,
  `status`               ENUM('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
  `analyzedAt`           datetime,
  `errorMessage`         text,
  `n8nResponse`          json         COMMENT 'الرد الخام من محرك N8N',
  `createdAt`            datetime    NOT NULL,
  `updatedAt`            datetime    NOT NULL
) COMMENT = 'نتائج تحليل النصوص بالذكاء الاصطناعي عبر محرك N8N';

-- ============================================================================
-- TOPICS
-- ============================================================================
CREATE TABLE `Topics` (
  `_id`             varchar(24)  PRIMARY KEY COMMENT 'MongoDB ObjectId',
  `project`         varchar(24)  NOT NULL COMMENT 'FK → Projects._id',
  `name`            varchar(255) NOT NULL,
  `description`     text,
  `keywords`        json         COMMENT 'مصفوفة كلمات مفتاحية',
  `frequency`       int UNSIGNED NOT NULL DEFAULT 0,
  `relevanceScore`  decimal(4,3) COMMENT '0.000 إلى 1.000',
  `category`        varchar(255),
  `relatedTopics`   json         COMMENT 'مصفوفة أسماء مواضيع مرتبطة',
  `overallSentiment` ENUM('positive','negative','neutral','mixed'),
  `averageSentiment` decimal(4,3) COMMENT '-1.000 إلى 1.000',
  `isActive`        boolean      NOT NULL DEFAULT TRUE,
  `statistics`      json         COMMENT '{ totalMentions, uniqueSources, firstSeenAt?, lastSeenAt? }',
  `metadata`        json,
  `createdAt`       datetime     NOT NULL,
  `updatedAt`       datetime     NOT NULL,
  UNIQUE KEY `uq_topic_project_name` (`project`, `name`)
) COMMENT = 'الموضوعات والتوجهات المستخرجة من تحليل النصوص';

-- ============================================================================
-- TEXT_TOPICS  (junction: textAnalysis ↔ topic)
-- ============================================================================
CREATE TABLE `Text_Topics` (
  `_id`              varchar(24) PRIMARY KEY COMMENT 'MongoDB ObjectId',
  `textAnalysis`     varchar(24) NOT NULL COMMENT 'FK → Text_Analyses._id',
  `topic`            varchar(24) NOT NULL COMMENT 'FK → Topics._id',
  `relevance`        decimal(4,3) NOT NULL COMMENT '0.000 إلى 1.000',
  `confidence`       decimal(4,3)          COMMENT '0.000 إلى 1.000',
  `mentionedKeywords` json        COMMENT 'مصفوفة الكلمات المفتاحية الظاهرة في النص',
  `mentionCount`     int UNSIGNED NOT NULL DEFAULT 1,
  `positions`        json         COMMENT '[{ start, end, context }]',
  `excerpt`          text,
  `metadata`         json,
  `createdAt`        datetime     NOT NULL,
  `updatedAt`        datetime     NOT NULL,
  UNIQUE KEY `uq_tt_analysis_topic` (`textAnalysis`, `topic`)
) COMMENT = 'درجة ارتباط كل نص بكل موضوع';

-- ============================================================================
-- INDICATORS
-- ============================================================================
CREATE TABLE `Indicators` (
  `_id`               varchar(24)  PRIMARY KEY COMMENT 'MongoDB ObjectId',
  `project`           varchar(24)  NOT NULL COMMENT 'FK → Projects._id',
  `name`              varchar(255) NOT NULL,
  `description`       text         NOT NULL,
  `indicatorType`     ENUM('input','output','outcome','impact','process','custom') NOT NULL,
  `measurementMethod` text,
  `targetValue`       decimal(18,4),
  `actualValue`       decimal(18,4),
  `unit`              ENUM('number','percentage','currency','hours','days','score','rating','custom'),
  `customUnit`        varchar(100)  COMMENT 'عند اختيار unit = custom',
  `calculationFormula` text,
  `dataSource`        text,
  `baselineValue`     decimal(18,4),
  `trend`             ENUM('improving','stable','declining','no_data') NOT NULL DEFAULT 'no_data',
  `lastCalculatedAt`  datetime,
  `frequency`         varchar(100)  COMMENT 'daily / weekly / monthly …',
  `responsiblePerson` varchar(255),
  `isActive`          boolean       NOT NULL DEFAULT TRUE,
  `tags`              json          COMMENT 'مصفوفة وسوم',
  `thresholds`        json          COMMENT '{ critical?, warning?, good?, excellent? }',
  `metadata`          json,
  `createdAt`         datetime      NOT NULL,
  `updatedAt`         datetime      NOT NULL
) COMMENT = 'مؤشرات قياس الأداء والأثر للمشاريع';

-- ============================================================================
-- INDICATOR_HISTORY
-- ============================================================================
CREATE TABLE `Indicator_History` (
  `_id`              varchar(24)  PRIMARY KEY COMMENT 'MongoDB ObjectId',
  `indicator`        varchar(24)  NOT NULL COMMENT 'FK → Indicators._id',
  `recordedValue`    decimal(18,4) NOT NULL,
  `calculatedAt`     date         NOT NULL,
  `source`           varchar(255),
  `notes`            text,
  `measuredBy`       varchar(255),
  `status`           ENUM('recorded','verified','adjusted','deleted') NOT NULL DEFAULT 'recorded',
  `previousValue`    decimal(18,4),
  `changeAmount`     decimal(18,4) COMMENT 'التغيّر المطلق',
  `changePercentage` decimal(10,4) COMMENT 'التغيّر النسبي %',
  `context`          json          COMMENT '{ activity?, survey?, event?, period? }',
  `attachments`      json          COMMENT 'مصفوفة روابط المرفقات',
  `verifiedBy`       varchar(255),
  `verifiedAt`       datetime,
  `adjustmentReason` json          COMMENT '{ reason, adjustedBy, adjustedAt, originalValue }',
  `metadata`         json,
  `createdAt`        datetime      NOT NULL
) COMMENT = 'تتبع التغيّر التاريخي في قيم المؤشرات';

-- ============================================================================
-- FOREIGN KEY CONSTRAINTS
-- ============================================================================

-- Projects
ALTER TABLE `Projects`
  ADD CONSTRAINT `fk_projects_user`
    FOREIGN KEY (`user_id`) REFERENCES `Users` (`_id`);

-- Beneficiaries — لا توجد مفاتيح خارجية (مستقلة عن المشاريع)

-- Activities
ALTER TABLE `Activities`
  ADD CONSTRAINT `fk_activities_project`
    FOREIGN KEY (`project`) REFERENCES `Projects` (`_id`);

-- Activity_Beneficiaries
ALTER TABLE `Activity_Beneficiaries`
  ADD CONSTRAINT `fk_ab_beneficiary`
    FOREIGN KEY (`beneficiary`) REFERENCES `Beneficiaries` (`_id`),
  ADD CONSTRAINT `fk_ab_activity`
    FOREIGN KEY (`activity`)    REFERENCES `Activities` (`_id`);

-- Participants
ALTER TABLE `Participants`
  ADD CONSTRAINT `fk_participants_beneficiary`
    FOREIGN KEY (`beneficiary`) REFERENCES `Beneficiaries` (`_id`);

-- Activity_Participants
ALTER TABLE `Activity_Participants`
  ADD CONSTRAINT `fk_ap_activity`
    FOREIGN KEY (`activity`)    REFERENCES `Activities` (`_id`),
  ADD CONSTRAINT `fk_ap_participant`
    FOREIGN KEY (`participant`) REFERENCES `Participants` (`_id`);

-- Surveys
ALTER TABLE `Surveys`
  ADD CONSTRAINT `fk_surveys_activity`
    FOREIGN KEY (`activity`) REFERENCES `Activities` (`_id`);

-- Survey_Questions
ALTER TABLE `Survey_Questions`
  ADD CONSTRAINT `fk_sq_survey`
    FOREIGN KEY (`survey`) REFERENCES `Surveys` (`_id`);

-- Survey_Correct_Answers
ALTER TABLE `Survey_Correct_Answers`
  ADD CONSTRAINT `fk_sca_question`
    FOREIGN KEY (`question`) REFERENCES `Survey_Questions` (`_id`);

-- Survey_Submissions
ALTER TABLE `Survey_Submissions`
  ADD CONSTRAINT `fk_ss_survey`
    FOREIGN KEY (`survey`)      REFERENCES `Surveys` (`_id`),
  ADD CONSTRAINT `fk_ss_question`
    FOREIGN KEY (`question`)    REFERENCES `Survey_Questions` (`_id`),
  ADD CONSTRAINT `fk_ss_beneficiary`
    FOREIGN KEY (`beneficiary`) REFERENCES `Beneficiaries` (`_id`);

-- Text_Analyses
ALTER TABLE `Text_Analyses`
  ADD CONSTRAINT `fk_ta_project`
    FOREIGN KEY (`project`)              REFERENCES `Projects` (`_id`),
  ADD CONSTRAINT `fk_ta_survey_submission`
    FOREIGN KEY (`surveyAnswer`)         REFERENCES `Survey_Submissions` (`_id`),
  ADD CONSTRAINT `fk_ta_activity_participant`
    FOREIGN KEY (`activityParticipant`)  REFERENCES `Activity_Participants` (`_id`);

-- Topics
ALTER TABLE `Topics`
  ADD CONSTRAINT `fk_topics_project`
    FOREIGN KEY (`project`) REFERENCES `Projects` (`_id`);

-- Text_Topics
ALTER TABLE `Text_Topics`
  ADD CONSTRAINT `fk_tt_text_analysis`
    FOREIGN KEY (`textAnalysis`) REFERENCES `Text_Analyses` (`_id`),
  ADD CONSTRAINT `fk_tt_topic`
    FOREIGN KEY (`topic`)        REFERENCES `Topics` (`_id`);

-- Indicators
ALTER TABLE `Indicators`
  ADD CONSTRAINT `fk_indicators_project`
    FOREIGN KEY (`project`) REFERENCES `Projects` (`_id`);

-- Indicator_History
ALTER TABLE `Indicator_History`
  ADD CONSTRAINT `fk_ih_indicator`
    FOREIGN KEY (`indicator`) REFERENCES `Indicators` (`_id`);

-- ============================================================================
-- INDEXES  (بالإضافة إلى ما هو ضمني في PRIMARY KEY / UNIQUE / FK)
-- ============================================================================

-- Users
CREATE INDEX `idx_users_role`      ON `Users` (`role`);
CREATE INDEX `idx_users_status`    ON `Users` (`status`);
CREATE INDEX `idx_users_createdAt` ON `Users` (`createdAt`);

-- Projects
CREATE INDEX `idx_projects_user_id`   ON `Projects` (`user_id`);
CREATE INDEX `idx_projects_status`    ON `Projects` (`status`);
CREATE INDEX `idx_projects_type`      ON `Projects` (`type`);
CREATE INDEX `idx_projects_startDate` ON `Projects` (`startDate`);
CREATE FULLTEXT INDEX `ft_projects_name_desc` ON `Projects` (`name`, `description`);

-- Beneficiaries
CREATE INDEX `idx_ben_type`       ON `Beneficiaries` (`beneficiaryType`);
CREATE INDEX `idx_ben_city_region` ON `Beneficiaries` (`city`, `region`);
CREATE INDEX `idx_ben_createdAt`  ON `Beneficiaries` (`createdAt`);

-- Activities
CREATE INDEX `idx_act_project_status`   ON `Activities` (`project`, `status`);
CREATE INDEX `idx_act_activityDate`     ON `Activities` (`activityDate`);
CREATE INDEX `idx_act_project_date`     ON `Activities` (`project`, `activityDate`);
CREATE INDEX `idx_act_status`           ON `Activities` (`status`);
CREATE INDEX `idx_act_type`             ON `Activities` (`activityType`);
CREATE FULLTEXT INDEX `ft_act_title_desc` ON `Activities` (`title`, `description`);

-- Activity_Beneficiaries
CREATE INDEX `idx_ab_activity`    ON `Activity_Beneficiaries` (`activity`);
CREATE INDEX `idx_ab_beneficiary` ON `Activity_Beneficiaries` (`beneficiary`);

-- Participants
CREATE INDEX `idx_par_beneficiary`    ON `Participants` (`beneficiary`);
CREATE INDEX `idx_par_city_gender`    ON `Participants` (`city`, `gender`);
CREATE INDEX `idx_par_email`          ON `Participants` (`email`);
CREATE INDEX `idx_par_createdAt`      ON `Participants` (`createdAt`);

-- Activity_Participants
CREATE INDEX `idx_ap_participant` ON `Activity_Participants` (`participant`);

-- Surveys
CREATE INDEX `idx_surv_activity` ON `Surveys` (`activity`);
CREATE INDEX `idx_surv_type`     ON `Surveys` (`type`);
CREATE INDEX `idx_surv_status`   ON `Surveys` (`status`);

-- Survey_Questions
CREATE INDEX `idx_sq_survey` ON `Survey_Questions` (`survey`);
CREATE INDEX `idx_sq_type`   ON `Survey_Questions` (`type`);

-- Survey_Correct_Answers
CREATE INDEX `idx_sca_question` ON `Survey_Correct_Answers` (`question`);

-- Survey_Submissions
CREATE INDEX `idx_ss_survey_question`    ON `Survey_Submissions` (`survey`, `question`);
CREATE INDEX `idx_ss_survey_beneficiary` ON `Survey_Submissions` (`survey`, `beneficiary`);
CREATE INDEX `idx_ss_ben_survey_started` ON `Survey_Submissions` (`beneficiary`, `survey`, `startedAt`);

-- Text_Analyses
CREATE INDEX `idx_ta_project`             ON `Text_Analyses` (`project`);
CREATE INDEX `idx_ta_survey_answer`       ON `Text_Analyses` (`surveyAnswer`);
CREATE INDEX `idx_ta_activity_participant` ON `Text_Analyses` (`activityParticipant`);
CREATE INDEX `idx_ta_sentiment`           ON `Text_Analyses` (`sentiment`);
CREATE INDEX `idx_ta_status`              ON `Text_Analyses` (`status`);
CREATE INDEX `idx_ta_analyzedAt`          ON `Text_Analyses` (`analyzedAt`);

-- Topics
CREATE INDEX `idx_top_project`        ON `Topics` (`project`);
CREATE INDEX `idx_top_name`           ON `Topics` (`name`);
CREATE INDEX `idx_top_frequency`      ON `Topics` (`frequency`);
CREATE INDEX `idx_top_relevanceScore` ON `Topics` (`relevanceScore`);

-- Text_Topics
CREATE INDEX `idx_tt_textAnalysis` ON `Text_Topics` (`textAnalysis`);
CREATE INDEX `idx_tt_topic`        ON `Text_Topics` (`topic`);
CREATE INDEX `idx_tt_relevance`    ON `Text_Topics` (`relevance`);

-- Indicators
CREATE INDEX `idx_ind_project`      ON `Indicators` (`project`);
CREATE INDEX `idx_ind_type`         ON `Indicators` (`indicatorType`);
CREATE INDEX `idx_ind_isActive`     ON `Indicators` (`isActive`);
CREATE INDEX `idx_ind_proj_type`    ON `Indicators` (`project`, `indicatorType`);
CREATE INDEX `idx_ind_proj_trend`   ON `Indicators` (`project`, `trend`);
CREATE INDEX `idx_ind_lastCalc`     ON `Indicators` (`lastCalculatedAt`);
CREATE FULLTEXT INDEX `ft_ind_name_desc` ON `Indicators` (`name`, `description`);

-- Indicator_History
CREATE INDEX `idx_ih_ind_calc`   ON `Indicator_History` (`indicator`, `calculatedAt`);
CREATE INDEX `idx_ih_indicator`  ON `Indicator_History` (`indicator`);
CREATE INDEX `idx_ih_calcAt`     ON `Indicator_History` (`calculatedAt`);
CREATE INDEX `idx_ih_status`     ON `Indicator_History` (`status`);
CREATE INDEX `idx_ih_createdAt`  ON `Indicator_History` (`createdAt`);

-- ============================================================================
-- ENUM VALUES REFERENCE
-- ============================================================================
/*
UserRole         : Admin | Manager | Staff
UserStatus       : active | suspended | pending

ProjectType      : educational | health | training | intervention | evaluation | mixed
ProjectStatus    : in_progress | completed | planned

BeneficiaryType  : individual | area

ActivityType     : training | workshop | seminar | consultation | field_visit
                   | awareness_campaign | service_delivery | other
ActivityStatus   : planned | in_progress | completed | cancelled

ParticipantStatus : active | completed | dropped | pending
Gender            : male | female | other

SurveyType    : evaluation | test | satisfaction
SurveyStatus  : draft | active | closed | archived

QuestionType  : text | textarea | number | email | phone | date
              | single_choice | multiple_choice | dropdown
              | rating | scale | matrix | file_upload | yes_no

MeasurementStatus  : recorded | verified | adjusted | deleted

SentimentType  : positive | negative | neutral
AnalysisStatus : pending | processing | completed | failed

IndicatorType  : input | output | outcome | impact | process | custom
MeasurementUnit: number | percentage | currency | hours | days | score | rating | custom
TrendDirection : improving | stable | declining | no_data

TopicSentiment : positive | negative | neutral | mixed
*/

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
