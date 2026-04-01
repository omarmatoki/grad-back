CREATE TABLE `Users` (
  `user_id` varchar(255) PRIMARY KEY,
  `name` varchar(255),
  `email` varchar(255) UNIQUE,
  `password` varchar(255),
  `role` varchar(255),
  `status` varchar(255),
  `phone` varchar(255),
  `organization` varchar(255),
  `department` varchar(255),
  `lastLoginAt` datetime,
  `emailVerified` boolean,
  `created_at` datetime,
  `updated_at` datetime
);

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
  `created_at` datetime,
  `updated_at` datetime
);

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

CREATE TABLE `Participants` (
  `participant_id` varchar(255) PRIMARY KEY,
  `beneficiary_id` varchar(255),
  `project_id` varchar(255),
  `fullName` varchar(255),
  `email` varchar(255),
  `phone` varchar(255),
  `nationalId` varchar(255),
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
  `preAssessmentScore` decimal,
  `postAssessmentScore` decimal,
  `created_at` datetime,
  `updated_at` datetime
);

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
  `targetResponses` int,
  `totalResponses` int,
  `created_at` datetime,
  `updated_at` datetime
);

CREATE TABLE `Survey_Questions` (
  `question_id` varchar(255) PRIMARY KEY,
  `survey_id` varchar(255),
  `questionText` text,
  `type` varchar(255),
  `order` int,
  `isRequired` boolean,
  `options` json,
  `validation` json,
  `created_at` datetime,
  `updated_at` datetime
);

CREATE TABLE `Survey_Responses` (
  `response_id` varchar(255) PRIMARY KEY,
  `survey_id` varchar(255),
  `beneficiary_id` varchar(255),
  `participant_id` varchar(255),
  `status` varchar(255),
  `startedAt` datetime,
  `completedAt` datetime,
  `timeSpent` int,
  `completionPercentage` decimal,
  `created_at` datetime,
  `updated_at` datetime
);

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
  `timeSpent` int,
  `isSkipped` boolean,
  `created_at` datetime,
  `updated_at` datetime
);

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
  `summary` text,
  `status` varchar(255),
  `analyzedAt` datetime,
  `created_at` datetime,
  `updated_at` datetime
);

CREATE TABLE `Topics` (
  `topic_id` varchar(255) PRIMARY KEY,
  `project_id` varchar(255),
  `name` varchar(255),
  `description` text,
  `keywords` json,
  `frequency` int,
  `relevanceScore` decimal,
  `overallSentiment` varchar(255),
  `averageSentiment` decimal,
  `isActive` boolean,
  `created_at` datetime,
  `updated_at` datetime
);

CREATE TABLE `Text_Topics` (
  `id` varchar(255) PRIMARY KEY,
  `textAnalysis_id` varchar(255),
  `topic_id` varchar(255),
  `relevance` decimal,
  `confidence` decimal,
  `mentionCount` int
);

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
  `calculationFormula` text,
  `dataSource` text,
  `baselineValue` decimal,
  `trend` varchar(255),
  `lastCalculatedAt` datetime,
  `isActive` boolean,
  `created_at` datetime,
  `updated_at` datetime
);

CREATE TABLE `Indicator_History` (
  `history_id` varchar(255) PRIMARY KEY,
  `indicator_id` varchar(255),
  `recordedValue` decimal,
  `calculatedAt` datetime,
  `source` varchar(255),
  `status` varchar(255),
  `notes` text,
  `created_at` datetime
);

ALTER TABLE `Users` COMMENT = 'مستخدمو النظام (مدراء، محللون، ومستعرضون)';

ALTER TABLE `Projects` COMMENT = 'المشاريع والمبادرات التي يتم إدارتها';

ALTER TABLE `Beneficiaries` COMMENT = 'المستفيدون المباشرون أو المناطق المستهدفة';

ALTER TABLE `Activities` COMMENT = 'الأنشطة الميدانية أو التدريبية ضمن المشاريع';

ALTER TABLE `Participants` COMMENT = 'الأفراد المشاركون في البرامج والأنشطة';

ALTER TABLE `Activity_Participants` COMMENT = 'سجل حضور المشاركين في الأنشطة وتقييمهم';

ALTER TABLE `Surveys` COMMENT = 'أدوات جمع البيانات (قبلي، بعدي، قياس أثر)';

ALTER TABLE `Survey_Questions` COMMENT = 'الأسئلة التفصيلية لكل استبيان';

ALTER TABLE `Survey_Responses` COMMENT = 'عمليات الاستجابة للاستبيانات';

ALTER TABLE `Survey_Answers` COMMENT = 'الإجابات الفعلية لكل سؤال';

ALTER TABLE `Text_Analysis` COMMENT = 'نتائج تحليل النصوص بالذكاء الاصطناعي';

ALTER TABLE `Topics` COMMENT = 'الموضوعات والتوجهات المستخرجة';

ALTER TABLE `Text_Topics` COMMENT = 'درجة ارتباط النص بموضوع معين';

ALTER TABLE `Indicators` COMMENT = 'مؤشرات قياس الأداء والأثر للمشاريع';

ALTER TABLE `Indicator_History` COMMENT = 'تتبع التغير التاريخي في قيم المؤشرات';

ALTER TABLE `Projects` ADD FOREIGN KEY (`owner`) REFERENCES `Users` (`user_id`);

ALTER TABLE `Beneficiaries` ADD FOREIGN KEY (`project_id`) REFERENCES `Projects` (`project_id`);

ALTER TABLE `Activities` ADD FOREIGN KEY (`project_id`) REFERENCES `Projects` (`project_id`);

ALTER TABLE `Participants` ADD FOREIGN KEY (`beneficiary_id`) REFERENCES `Beneficiaries` (`beneficiary_id`);

ALTER TABLE `Participants` ADD FOREIGN KEY (`project_id`) REFERENCES `Projects` (`project_id`);

ALTER TABLE `Activity_Participants` ADD FOREIGN KEY (`activity_id`) REFERENCES `Activities` (`activity_id`);

ALTER TABLE `Activity_Participants` ADD FOREIGN KEY (`participant_id`) REFERENCES `Participants` (`participant_id`);

ALTER TABLE `Surveys` ADD FOREIGN KEY (`project_id`) REFERENCES `Projects` (`project_id`);

ALTER TABLE `Surveys` ADD FOREIGN KEY (`activity_id`) REFERENCES `Activities` (`activity_id`);

ALTER TABLE `Survey_Questions` ADD FOREIGN KEY (`survey_id`) REFERENCES `Surveys` (`survey_id`);

ALTER TABLE `Survey_Responses` ADD FOREIGN KEY (`survey_id`) REFERENCES `Surveys` (`survey_id`);

ALTER TABLE `Survey_Responses` ADD FOREIGN KEY (`beneficiary_id`) REFERENCES `Beneficiaries` (`beneficiary_id`);

ALTER TABLE `Survey_Responses` ADD FOREIGN KEY (`participant_id`) REFERENCES `Participants` (`participant_id`);

ALTER TABLE `Survey_Answers` ADD FOREIGN KEY (`response_id`) REFERENCES `Survey_Responses` (`response_id`);

ALTER TABLE `Survey_Answers` ADD FOREIGN KEY (`question_id`) REFERENCES `Survey_Questions` (`question_id`);

ALTER TABLE `Text_Analysis` ADD FOREIGN KEY (`project_id`) REFERENCES `Projects` (`project_id`);

ALTER TABLE `Text_Analysis` ADD FOREIGN KEY (`surveyAnswer_id`) REFERENCES `Survey_Answers` (`answer_id`);

ALTER TABLE `Text_Analysis` ADD FOREIGN KEY (`activityParticipant_id`) REFERENCES `Activity_Participants` (`id`);

ALTER TABLE `Topics` ADD FOREIGN KEY (`project_id`) REFERENCES `Projects` (`project_id`);

ALTER TABLE `Text_Topics` ADD FOREIGN KEY (`textAnalysis_id`) REFERENCES `Text_Analysis` (`analysis_id`);

ALTER TABLE `Text_Topics` ADD FOREIGN KEY (`topic_id`) REFERENCES `Topics` (`topic_id`);

ALTER TABLE `Indicators` ADD FOREIGN KEY (`project_id`) REFERENCES `Projects` (`project_id`);

ALTER TABLE `Indicator_History` ADD FOREIGN KEY (`indicator_id`) REFERENCES `Indicators` (`indicator_id`);

ALTER TABLE `Participants` ADD FOREIGN KEY (`email`) REFERENCES `Participants` (`beneficiary_id`);

ALTER TABLE `Activity_Participants` ADD FOREIGN KEY (`checkInTime`) REFERENCES `Activity_Participants` (`id`);
