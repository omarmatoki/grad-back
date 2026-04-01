-- ============================================================================
-- Database Schema DDL for Grad-Back Project
-- Generated from MongoDB Schemas
-- ============================================================================

-- ============================================================================
-- USERS TABLE
-- ============================================================================
CREATE TABLE `Users` (
  `user_id` varchar(255) PRIMARY KEY,
  `name` varchar(255),
  `email` varchar(255) UNIQUE,
  `password` varchar(255),
  `role` ENUM('admin', 'staff', 'viewer') DEFAULT 'viewer',
  `status` ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
  `phone` varchar(255),
  `organization` varchar(255),
  `department` varchar(255),
  `lastLoginAt` datetime,
  `emailVerified` boolean DEFAULT FALSE,
  `refreshToken` text,
  `created_at` datetime,
  `updated_at` datetime
);

-- ============================================================================
-- PROJECTS TABLE
-- ============================================================================
CREATE TABLE `Projects` (
  `project_id` varchar(255) PRIMARY KEY,
  `owner` varchar(255),
  `name` varchar(255),
  `description` text,
  `type` varchar(255),
  `status` varchar(255),
  `startDate` date,
  `endDate` date,
  `location` varchar(255),
  `targetGroups` json,
  `budget` json,
  `goals` json,
  `tags` json,
  `metadata` json,
  `created_at` datetime,
  `updated_at` datetime
);

-- ============================================================================
-- PROJECT TEAM MEMBERS TABLE (Many-to-Many)
-- ============================================================================
CREATE TABLE `Project_Team_Members` (
  `project_id` varchar(255),
  `user_id` varchar(255),
  `added_at` datetime,
  PRIMARY KEY (`project_id`, `user_id`)
);

-- ============================================================================
-- BENEFICIARIES TABLE
-- ============================================================================
CREATE TABLE `Beneficiaries` (
  `beneficiary_id` varchar(255) PRIMARY KEY,
  `project_id` varchar(255),
  `beneficiaryType` varchar(255),
  `name` varchar(255),
  `city` varchar(255),
  `region` varchar(255),
  `populationSize` int,
  `notes` text,
  `created_at` datetime,
  `updated_at` datetime
);

-- ============================================================================
-- ACTIVITIES TABLE
-- ============================================================================
CREATE TABLE `Activities` (
  `activity_id` varchar(255) PRIMARY KEY,
  `project_id` varchar(255),
  `title` varchar(255),
  `description` text,
  `activityDate` date,
  `startTime` time,
  `endTime` time,
  `location` varchar(255),
  `capacity` int,
  `registeredCount` int,
  `attendedCount` int,
  `speaker` varchar(255),
  `activityType` varchar(255),
  `status` varchar(255),
  `created_at` datetime,
  `updated_at` datetime
);

-- ============================================================================
-- PARTICIPANTS TABLE
-- ============================================================================
CREATE TABLE `Participants` (
  `participant_id` varchar(255) PRIMARY KEY,
  `beneficiary_id` varchar(255),
  `project_id` varchar(255),
  `fullName` varchar(255),
  `email` varchar(255),
  `phone` varchar(255),
  `nationalId` varchar(255) UNIQUE,
  `age` int,
  `gender` varchar(255),
  `educationLevel` varchar(255),
  `occupation` varchar(255),
  `city` varchar(255),
  `participationType` varchar(255),
  `registrationDate` datetime,
  `attendanceSessions` int,
  `totalSessions` int,
  `attendanceRate` decimal,
  `preAssessmentScore` decimal,
  `postAssessmentScore` decimal,
  `improvementPercentage` decimal,
  `status` varchar(255),
  `created_at` datetime,
  `updated_at` datetime
);

-- ============================================================================
-- ACTIVITY PARTICIPANTS TABLE
-- ============================================================================
CREATE TABLE `Activity_Participants` (
  `id` varchar(255) PRIMARY KEY,
  `activity_id` varchar(255),
  `participant_id` varchar(255),
  `attendanceStatus` varchar(255),
  `checkInTime` datetime,
  `checkOutTime` datetime,
  `engagementLevel` varchar(255),
  `participationScore` decimal,
  `satisfactionRating` int,
  `feedback` text,
  `completedTasks` json,
  `preAssessmentScore` decimal,
  `postAssessmentScore` decimal,
  `certificate` varchar(500),
  `customData` json,
  `notes` text,
  `created_at` datetime,
  `updated_at` datetime
);

-- ============================================================================
-- INDICATORS TABLE
-- ============================================================================
CREATE TABLE `Indicators` (
  `indicator_id` varchar(255) PRIMARY KEY,
  `project_id` varchar(255),
  `name` varchar(255),
  `description` text,
  `indicatorType` varchar(255),
  `measurementMethod` text,
  `targetValue` decimal,
  `actualValue` decimal,
  `unit` varchar(255),
  `customUnit` varchar(100),
  `calculationFormula` text,
  `dataSource` text,
  `baselineValue` decimal,
  `trend` varchar(255),
  `lastCalculatedAt` datetime,
  `frequency` varchar(100),
  `responsiblePerson` varchar(255),
  `isActive` boolean,
  `tags` json,
  `thresholds` json,
  `metadata` json,
  `created_at` datetime,
  `updated_at` datetime
);

-- ============================================================================
-- INDICATOR HISTORY TABLE
-- ============================================================================
CREATE TABLE `Indicator_History` (
  `history_id` varchar(255) PRIMARY KEY,
  `indicator_id` varchar(255),
  `recordedValue` decimal,
  `calculatedAt` datetime,
  `source` varchar(255),
  `notes` text,
  `measuredBy` varchar(255),
  `status` varchar(255),
  `previousValue` decimal,
  `changeAmount` decimal,
  `changePercentage` decimal,
  `context` json,
  `attachments` json,
  `verifiedBy` varchar(255),
  `verifiedAt` datetime,
  `adjustmentReason` json,
  `metadata` json,
  `created_at` datetime
);

-- ============================================================================
-- SURVEYS TABLE
-- ============================================================================
CREATE TABLE `Surveys` (
  `survey_id` varchar(255) PRIMARY KEY,
  `project_id` varchar(255),
  `activity_id` varchar(255),
  `title` varchar(255),
  `description` text,
  `type` varchar(255),
  `status` varchar(255),
  `startDate` datetime,
  `endDate` datetime,
  `isAnonymous` boolean,
  `allowMultipleResponses` boolean,
  `welcomeMessage` text,
  `thankYouMessage` text,
  `targetResponses` int,
  `totalResponses` int,
  `tags` json,
  `settings` json,
  `customFields` json,
  `created_at` datetime,
  `updated_at` datetime
);

-- ============================================================================
-- SURVEY QUESTIONS TABLE
-- ============================================================================
CREATE TABLE `Survey_Questions` (
  `question_id` varchar(255) PRIMARY KEY,
  `survey_id` varchar(255),
  `questionText` text,
  `type` varchar(255),
  `order` int,
  `isRequired` boolean,
  `description` text,
  `placeholder` varchar(500),
  `options` json,
  `validation` json,
  `ratingConfig` json,
  `matrixConfig` json,
  `conditional` json,
  `category` varchar(255),
  `tags` json,
  `customFields` json,
  `isQuiz` boolean DEFAULT FALSE,
  `correctAnswer` json,
  `points` decimal,
  `created_at` datetime,
  `updated_at` datetime
);

-- ============================================================================
-- SURVEY RESPONSES TABLE
-- ============================================================================
CREATE TABLE `Survey_Responses` (
  `response_id` varchar(255) PRIMARY KEY,
  `survey_id` varchar(255),
  `beneficiary_id` varchar(255),
  `participant_id` varchar(255),
  `status` varchar(255),
  `startedAt` datetime,
  `completedAt` datetime,
  `timeSpent` int,
  `ipAddress` varchar(45),
  `userAgent` text,
  `location` varchar(500),
  `completionPercentage` decimal,
  `metadata` json,
  `customFields` json,
  `created_at` datetime,
  `updated_at` datetime
);

-- ============================================================================
-- SURVEY ANSWERS TABLE
-- ============================================================================
CREATE TABLE `Survey_Answers` (
  `answer_id` varchar(255) PRIMARY KEY,
  `response_id` varchar(255),
  `question_id` varchar(255),
  `valueType` varchar(255),
  `textValue` text,
  `numberValue` decimal,
  `booleanValue` boolean,
  `dateValue` date,
  `arrayValue` json,
  `objectValue` json,
  `fileUrl` varchar(500),
  `timeSpent` int,
  `revisionCount` int,
  `isSkipped` boolean,
  `metadata` json,
  `created_at` datetime,
  `updated_at` datetime
);

-- ============================================================================
-- TEXT ANALYSIS TABLE
-- ============================================================================
CREATE TABLE `Text_Analysis` (
  `analysis_id` varchar(255) PRIMARY KEY,
  `project_id` varchar(255),
  `surveyAnswer_id` varchar(255),
  `activityParticipant_id` varchar(255),
  `originalText` text,
  `cleanedText` text,
  `sentiment` varchar(255),
  `sentimentScore` decimal,
  `sentimentConfidence` decimal,
  `keywords` json,
  `entities` json,
  `themes` json,
  `emotions` json,
  `summary` text,
  `actionItems` json,
  `language` varchar(50),
  `wordCount` int,
  `characterCount` int,
  `status` varchar(255),
  `analyzedAt` datetime,
  `errorMessage` text,
  `n8nResponse` json,
  `metadata` json,
  `created_at` datetime,
  `updated_at` datetime
);

-- ============================================================================
-- TOPICS TABLE
-- ============================================================================
CREATE TABLE `Topics` (
  `topic_id` varchar(255) PRIMARY KEY,
  `project_id` varchar(255),
  `name` varchar(255),
  `description` text,
  `keywords` json,
  `frequency` int,
  `relevanceScore` decimal,
  `category` varchar(255),
  `relatedTopics` json,
  `overallSentiment` varchar(255),
  `averageSentiment` decimal,
  `isActive` boolean,
  `statistics` json,
  `metadata` json,
  `created_at` datetime,
  `updated_at` datetime
);

-- ============================================================================
-- TEXT TOPICS TABLE (Junction)
-- ============================================================================
CREATE TABLE `Text_Topics` (
  `id` varchar(255) PRIMARY KEY,
  `textAnalysis_id` varchar(255),
  `topic_id` varchar(255),
  `relevance` decimal,
  `confidence` decimal,
  `mentionedKeywords` json,
  `mentionCount` int,
  `positions` json,
  `excerpt` text,
  `metadata` json,
  `created_at` datetime,
  `updated_at` datetime
);

-- ============================================================================
-- TABLE COMMENTS (Arabic Descriptions)
-- ============================================================================
ALTER TABLE `Users` COMMENT = 'مستخدمو النظام (مدراء، محللون، ومستعرضون)';

ALTER TABLE `Projects` COMMENT = 'المشاريع والمبادرات التي يتم إدارتها';

ALTER TABLE `Project_Team_Members` COMMENT = 'فريق العمل في كل مشروع (علاقة متعددة لمتعدد)';

ALTER TABLE `Beneficiaries` COMMENT = 'المستفيدون المباشرون أو المناطق المستهدفة';

ALTER TABLE `Activities` COMMENT = 'الأنشطة الميدانية أو التدريبية ضمن المشاريع';

ALTER TABLE `Participants` COMMENT = 'الأفراد المشاركون في البرامج والأنشطة';

ALTER TABLE `Activity_Participants` COMMENT = 'سجل حضور المشاركين في الأنشطة وتقييمهم';

ALTER TABLE `Indicators` COMMENT = 'مؤشرات قياس الأداء والأثر للمشاريع';

ALTER TABLE `Indicator_History` COMMENT = 'تتبع التغير التاريخي في قيم المؤشرات';

ALTER TABLE `Surveys` COMMENT = 'أدوات جمع البيانات (قبلي، بعدي، قياس أثر)';

ALTER TABLE `Survey_Questions` COMMENT = 'الأسئلة التفصيلية لكل استبيان';

ALTER TABLE `Survey_Responses` COMMENT = 'عمليات الاستجابة للاستبيانات';

ALTER TABLE `Survey_Answers` COMMENT = 'الإجابات الفعلية لكل سؤال';

ALTER TABLE `Text_Analysis` COMMENT = 'نتائج تحليل النصوص بالذكاء الاصطناعي';

ALTER TABLE `Topics` COMMENT = 'الموضوعات والتوجهات المستخرجة';

ALTER TABLE `Text_Topics` COMMENT = 'درجة ارتباط النص بموضوع معين';

-- ============================================================================
-- FOREIGN KEY CONSTRAINTS
-- ============================================================================

-- Users Foreign Keys
-- (No foreign keys for Users table)

-- Projects Foreign Keys
ALTER TABLE `Projects` ADD FOREIGN KEY (`owner`) REFERENCES `Users` (`user_id`);

-- Project Team Members Foreign Keys
ALTER TABLE `Project_Team_Members` ADD FOREIGN KEY (`project_id`) REFERENCES `Projects` (`project_id`);
ALTER TABLE `Project_Team_Members` ADD FOREIGN KEY (`user_id`) REFERENCES `Users` (`user_id`);

-- Beneficiaries Foreign Keys
ALTER TABLE `Beneficiaries` ADD FOREIGN KEY (`project_id`) REFERENCES `Projects` (`project_id`);

-- Activities Foreign Keys
ALTER TABLE `Activities` ADD FOREIGN KEY (`project_id`) REFERENCES `Projects` (`project_id`);

-- Participants Foreign Keys
ALTER TABLE `Participants` ADD FOREIGN KEY (`beneficiary_id`) REFERENCES `Beneficiaries` (`beneficiary_id`);
ALTER TABLE `Participants` ADD FOREIGN KEY (`project_id`) REFERENCES `Projects` (`project_id`);

-- Activity Participants Foreign Keys
ALTER TABLE `Activity_Participants` ADD FOREIGN KEY (`activity_id`) REFERENCES `Activities` (`activity_id`);
ALTER TABLE `Activity_Participants` ADD FOREIGN KEY (`participant_id`) REFERENCES `Participants` (`participant_id`);

-- Indicators Foreign Keys
ALTER TABLE `Indicators` ADD FOREIGN KEY (`project_id`) REFERENCES `Projects` (`project_id`);

-- Indicator History Foreign Keys
ALTER TABLE `Indicator_History` ADD FOREIGN KEY (`indicator_id`) REFERENCES `Indicators` (`indicator_id`);

-- Surveys Foreign Keys
ALTER TABLE `Surveys` ADD FOREIGN KEY (`project_id`) REFERENCES `Projects` (`project_id`);
ALTER TABLE `Surveys` ADD FOREIGN KEY (`activity_id`) REFERENCES `Activities` (`activity_id`);

-- Survey Questions Foreign Keys
ALTER TABLE `Survey_Questions` ADD FOREIGN KEY (`survey_id`) REFERENCES `Surveys` (`survey_id`);

-- Survey Responses Foreign Keys
ALTER TABLE `Survey_Responses` ADD FOREIGN KEY (`survey_id`) REFERENCES `Surveys` (`survey_id`);
ALTER TABLE `Survey_Responses` ADD FOREIGN KEY (`beneficiary_id`) REFERENCES `Beneficiaries` (`beneficiary_id`);
ALTER TABLE `Survey_Responses` ADD FOREIGN KEY (`participant_id`) REFERENCES `Participants` (`participant_id`);

-- Survey Answers Foreign Keys
ALTER TABLE `Survey_Answers` ADD FOREIGN KEY (`response_id`) REFERENCES `Survey_Responses` (`response_id`);
ALTER TABLE `Survey_Answers` ADD FOREIGN KEY (`question_id`) REFERENCES `Survey_Questions` (`question_id`);

-- Text Analysis Foreign Keys
ALTER TABLE `Text_Analysis` ADD FOREIGN KEY (`project_id`) REFERENCES `Projects` (`project_id`);
ALTER TABLE `Text_Analysis` ADD FOREIGN KEY (`surveyAnswer_id`) REFERENCES `Survey_Answers` (`answer_id`);
ALTER TABLE `Text_Analysis` ADD FOREIGN KEY (`activityParticipant_id`) REFERENCES `Activity_Participants` (`id`);

-- Topics Foreign Keys
ALTER TABLE `Topics` ADD FOREIGN KEY (`project_id`) REFERENCES `Projects` (`project_id`);

-- Text Topics Foreign Keys
ALTER TABLE `Text_Topics` ADD FOREIGN KEY (`textAnalysis_id`) REFERENCES `Text_Analysis` (`analysis_id`);
ALTER TABLE `Text_Topics` ADD FOREIGN KEY (`topic_id`) REFERENCES `Topics` (`topic_id`);

-- ============================================================================
-- NOTES AND ENUM VALUES REFERENCE
-- ============================================================================

/*
ENUM VALUES REFERENCE (stored as varchar in database):

UserRole:
  - admin
  - manager
  - viewer

UserStatus:
  - active
  - inactive
  - suspended

ProjectStatus:
  - draft
  - active
  - completed
  - archived

ProjectType:
  - needs_assessment
  - intervention
  - evaluation
  - mixed

BeneficiaryType:
  - person
  - area
  - group

ActivityStatus:
  - planned
  - in_progress
  - completed
  - cancelled

ActivityType:
  - training
  - workshop
  - seminar
  - consultation
  - field_visit
  - awareness_campaign
  - service_delivery
  - other

ParticipantStatus:
  - active
  - completed
  - dropped
  - pending

ParticipationType:
  - full_time
  - part_time
  - online
  - in_person
  - hybrid

Gender:
  - male
  - female
  - other

AttendanceStatus:
  - present
  - absent
  - excused
  - late

EngagementLevel:
  - low
  - medium
  - high
  - very_high

IndicatorType:
  - input
  - output
  - outcome
  - impact
  - process
  - custom

MeasurementUnit:
  - number
  - percentage
  - currency
  - hours
  - days
  - score
  - rating
  - custom

TrendDirection:
  - improving
  - stable
  - declining
  - no_data

MeasurementStatus:
  - recorded
  - verified
  - adjusted
  - deleted

SurveyType:
  - needs_assessment
  - pre_evaluation
  - post_evaluation
  - satisfaction
  - feedback
  - custom

SurveyStatus:
  - draft
  - active
  - closed
  - archived

QuestionType:
  - text
  - textarea
  - number
  - email
  - phone
  - date
  - single_choice
  - multiple_choice
  - dropdown
  - rating
  - scale
  - matrix
  - file_upload
  - yes_no

ResponseStatus:
  - in_progress
  - completed
  - abandoned

AnswerValueType:
  - text
  - number
  - boolean
  - date
  - array
  - object

SentimentType:
  - very_negative
  - negative
  - neutral
  - positive
  - very_positive

AnalysisStatus:
  - pending
  - processing
  - completed
  - failed
*/

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
