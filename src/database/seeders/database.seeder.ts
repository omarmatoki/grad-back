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

// ─── Text response pools ──────────────────────────────────────────────────────

const YOUTH_PRE_TEXTS = [
  'أتطلع إلى تطوير مهاراتي القيادية والإدارية للحصول على فرصة عمل في شركة كبرى',
  'هدفي من البرنامج اكتساب مهارات التواصل والعمل الجماعي التي يطلبها سوق العمل',
  'أريد تطوير مهارات البرمجة وتقنية المعلومات لأستطيع التقدم لوظائف تقنية متخصصة',
  'أبحث عن طريقة لتحويل شغفي بريادة الأعمال إلى مشروع حقيقي مدر للدخل',
  'أعاني من ضعف الثقة بالنفس عند التحدث أمام الجمهور وأريد تجاوز هذه العقبة',
  'مضى عام كامل على تخرجي ولم أجد عملاً، آمل أن يفتح هذا البرنامج أمامي آفاقاً جديدة',
  'أطمح للعمل في مجال التسويق الرقمي ولدي أفكار إبداعية أحتاج فقط للأدوات اللازمة',
  'أريد تعلم كيفية إعداد السيرة الذاتية الاحترافية والتحضير لمقابلات العمل بشكل صحيح',
  'أسعى لتطوير مهاراتي في إدارة الوقت والتخطيط الاستراتيجي لأكون أكثر إنتاجية',
  'أواجه تحدياً في التوازن بين الدراسة والعمل، وأحتاج لاستراتيجيات عملية للتغلب على ذلك',
  'أرغب في فهم آليات الاقتصاد الرقمي وكيف يمكنني الاستفادة منه في مسيرتي المهنية',
  'أحتاج إلى توجيه في اختيار مسار مهني مناسب لمهاراتي واهتماماتي وشخصيتي',
  'أتساءل عن أفضل الطرق لبناء شبكة علاقات مهنية قوية في عصر التواصل الاجتماعي',
  'أريد تعلم مهارات التفاوض وكيفية المطالبة بحقوقي في بيئة العمل بشكل محترف',
  'أهدف إلى تأسيس شركة ناشئة لكنني أفتقر للخبرة في الأعمال والتمويل والتسويق',
  'أشعر أن مناهجنا الجامعية لم تعدنا بشكل كافٍ لمتطلبات سوق العمل الفعلية',
  'أريد تطوير مهاراتي في التحليل واتخاذ القرار لأصبح أكثر قدرة على حل المشكلات',
  'أطمح لأن أكون رائد أعمال ناجحاً يوفر فرص عمل لأبناء منطقتي',
  'أحتاج إلى تطوير لغتي الإنجليزية المهنية للتمكن من التعامل مع الشركات الدولية',
  'أرغب في استكشاف مجالات العمل الحر والاستشارات المهنية كبديل عن العمل التقليدي',
];

const YOUTH_POST_TEXTS = [
  'البرنامج التدريبي غيّر نظرتي للعمل بشكل جذري واكتسبت أدوات عملية حقيقية أستخدمها يومياً',
  'تعلمت في هذا البرنامج كيف أدير وقتي بشكل أفضل وأضع أهدافاً ذكية قابلة للقياس',
  'المحتوى التدريبي ممتاز لكن أتمنى التركيز أكثر على التطبيق العملي بدل النظري',
  'البرنامج أثار فيّ شغفاً حقيقياً نحو ريادة الأعمال وأنا الآن في طور التخطيط لمشروعي',
  'لم يكن البرنامج بمستوى توقعاتي، كنت أتوقع محتوى أعمق وأشمل في بعض الموضوعات',
  'الورشة ساعدتني على فهم مفهوم القيادة الفعالة وطبّقته فعلاً في مجموعتي الدراسية',
  'استفدت كثيراً من النقاشات الجماعية وتبادل الخبرات مع المشاركين من خلفيات متنوعة',
  'أحتاج إلى المزيد من التدريب العملي على مهارات التواصل والتفاوض في مواقف حقيقية',
  'المدرب كان ممتازاً ويمتلك خبرة ميدانية حقيقية جعلت المعلومات ذات معنى وقابلة للتطبيق',
  'هذا البرنامج ضروري لكل شاب يريد الدخول في سوق العمل بثقة وأدوات احترافية',
  'أتمنى أن تكون هناك متابعة دورية بعد انتهاء البرنامج لقياس التقدم ودعم الاستمرارية',
  'الجدول الزمني للبرنامج مناسب لكن فترات الاستراحة قصيرة جداً مما يؤثر على التركيز',
  'تعلمت كيف أبني شبكة علاقات مهنية قوية وكيف أستثمرها بشكل صحيح ومهني',
  'البرنامج أعطاني الأدوات والثقة اللازمة لبدء رحلتي المهنية بشكل واثق ومنظم',
  'اكتشفت خلال البرنامج قدرات ومواهب قيادية لم أكن أعلم بوجودها في شخصيتي',
  'المناهج التدريبية بحاجة إلى تحديث مستمر لمواكبة التغييرات السريعة في سوق العمل',
  'التواصل مع زملاء من خلفيات مهنية مختلفة كان من أبرز الفوائد التي لا تقدر بثمن',
  'أقترح إضافة ورش عملية حول إدارة الضغط والصحة النفسية للشباب في بيئة العمل',
  'البرنامج أعاد تشكيل تفكيري وطريقة نظرتي للتحديات المهنية كفرص وليس عقبات',
  'أشعر بثقة أكبر الآن في قدرتي على قيادة فريق عمل وتحقيق نتائج ملموسة',
];

const FAMILIES_PRE_TEXTS = [
  'أريد تحويل هوايتي في صناعة الحلويات إلى مشروع تجاري حقيقي يدر دخلاً منتظماً لأسرتي',
  'أواجه صعوبة في تسعير منتجاتي اليدوية وأحتاج لتعلم أساليب التسعير الصحيحة والمربحة',
  'أرغب في تعلم التسويق الإلكتروني عبر وسائل التواصل الاجتماعي للوصول لأكبر عدد من العملاء',
  'أحتاج إلى معرفة الخطوات القانونية والإدارية لتأسيس مشروع منزلي صغير بشكل رسمي',
  'أملك مهارات يدوية متميزة في الخياطة لكنني لا أعرف كيف أبدأ في تسويقها بفاعلية',
  'أريد معرفة كيفية إدارة المال وفصل ميزانية المشروع عن ميزانية المنزل بشكل صحيح',
  'أتساءل كيف يمكنني التوسع في مشروعي الحالي الصغير والوصول لأسواق خارج منطقتي',
  'أحتاج إلى دعم في التعامل مع العملاء وكيفية الحفاظ على علاقات جيدة معهم وبناء الولاء',
  'أريد تعلم كيفية إعداد خطة عمل احترافية لعرضها على المستثمرين أو طلب التمويل',
  'أبحث عن شبكة من السيدات الرائدات للتعاون والتبادل التجاري وتشجيع بعضنا البعض',
  'أواجه تحدياً كبيراً في توازن مسؤوليات رعاية الأسرة مع متطلبات المشروع والإدارة',
  'أريد تعلم تصوير منتجاتي بشكل احترافي لعرضها بشكل جذاب عبر الإنترنت',
  'أحتاج لمعرفة كيفية التعامل مع المنافسة في السوق وتمييز منتجاتي عن المنافسين',
  'أطمح لبناء علامة تجارية خاصة بي تعكس جودة ومميزات منتجاتي اليدوية الأصيلة',
  'أريد معرفة كيفية الاستفادة من برامج الدعم الحكومي والتمويل المتاحة للمشاريع الصغيرة',
  'أحتاج إلى تطوير مهاراتي في الخدمة اللوجستية والتوصيل لضمان وصول منتجاتي لعملائي',
  'أريد تعلم كيفية الحصول على شهادات الجودة للمنتجات الغذائية لتعزيز ثقة العملاء',
  'أبحث عن طرق مبتكرة لتقليل تكاليف الإنتاج مع الحفاظ على جودة منتجاتي',
  'أريد فهم كيفية إدارة المخزون والطلبيات بكفاءة لتجنب الهدر والخسائر غير الضرورية',
  'أطمح لتطوير منتجاتي التقليدية لتناسب الأذواق الحديثة والأسواق الدولية المتنامية',
];

const FAMILIES_POST_TEXTS = [
  'البرنامج ساعدني فعلاً على تحويل هوايتي في الطبخ إلى مشروع تجاري صغير يدر دخلاً حقيقياً',
  'تعلمت كيف أسعّر منتجاتي بشكل صحيح وكيف أحقق هامش ربح مناسب يضمن استمرارية المشروع',
  'الدعم المقدم من البرنامج والمرشدين ساعدني على الانطلاق بثقة وتجاوز مخاوفي الأولى',
  'أحتاج إلى مزيد من التوجيه العملي في مجال التسويق الإلكتروني لمنتجاتي المنزلية',
  'البرنامج فتح لي أبواباً وفرصاً جديدة لم أكن أتخيل الوصول إليها من قبل',
  'تعلمت كيف أدير مالية مشروعي بشكل منفصل عن ميزانية المنزل وهذا غيّر كل شيء',
  'الورش العملية التطبيقية كانت مفيدة جداً وقدّمت حلولاً عملية مباشرة لمشاكلي الفعلية',
  'أتمنى أن يتضمن البرنامج مزيداً من الجلسات حول خدمة العملاء وبناء الولاء والثقة',
  'استطعت من خلال البرنامج زيادة دخلي الشهري من مشروعي بنسبة تجاوزت توقعاتي',
  'منتجاتي اليدوية لها طلب واسع لكن نحتاج إلى منصات تسويقية أفضل ودعم في التصوير',
  'البرنامج غيّر نظرتي من مجرد ربة منزل إلى رائدة أعمال حقيقية فاعلة في مجتمعها',
  'لا أزال أواجه تحدياً حقيقياً في توازن مسؤوليات المنزل مع متطلبات نمو المشروع',
  'تعلمت كيف أعرض منتجاتي بشكل احترافي جذاب عبر وسائل التواصل الاجتماعي المختلفة',
  'الشبكة التسويقية والعلاقات التي وفرها البرنامج ساعدتني في الوصول لعملاء جدد كثر',
  'لا أزال أحتاج إلى دعم في تطوير عبوات وتغليف احترافي يليق بجودة منتجاتي',
  'البرنامج أعطاني الجرأة والمعرفة للمطالبة بسعر عادل مناسب لجهدي وجودة منتجاتي',
  'تعلمت أهمية الاتساق في الجودة والتسليم للحفاظ على الزبائن وكسب ثقتهم المستمرة',
  'أشعر بفخر وإنجاز حقيقي أنني أسهم بشكل ملموس في دخل أسرتي من خلال مشروعي',
  'البرنامج وفر لي شبكة رائعة من السيدات الرائدات للتعاون والتعلم المتبادل والنمو',
  'أقترح بشدة إضافة برنامج رعاية مصاحب للأطفال ليتمكن جميع الأمهات من الحضور',
];

const HEALTH_PRE_TEXTS = [
  'أريد فهم كيف أتبع نظاماً غذائياً صحياً مناسباً لظروفي العائلية ومحدودية الميزانية',
  'أعاني من أمراض مزمنة وأحتاج إلى معرفة كيف أتعامل معها وأحسّن جودة حياتي اليومية',
  'قلة الوعي الصحي في مجتمعنا تقلقني كثيراً وأريد أن أكون سفيراً صحياً في حيّي',
  'أرغب في تعلم الإسعافات الأولية الأساسية للتصرف الصحيح في حالات الطوارئ العائلية',
  'أواجه صعوبة في قياس مستوى السكر والضغط بشكل منتظم وأريد تعلم المتابعة الذاتية',
  'صحة أطفالي تقلقني كثيراً وأحتاج لمعرفة علامات الخطر وكيف أكشف المشاكل مبكراً',
  'أريد تعلم كيفية تحضير وجبات صحية سريعة ومناسبة لأسرتي المشغولة في ظل الحياة الحديثة',
  'أتساءل كيف يمكنني تشجيع عائلتي بأكملها على ممارسة الرياضة وتبني نمط حياة صحي',
  'أعاني من الضغط النفسي المستمر وأحتاج إلى استراتيجيات عملية للتعامل معه وتخفيفه',
  'أريد معرفة كيف أتجنب الأمراض المزمنة الشائعة مثل السكري والضغط والقلب في منطقتنا',
  'تشغلني صحة الوالدين المسنين وأحتاج لتوجيه في تقديم الرعاية المناسبة لهم في المنزل',
  'أريد فهم تأثير التوتر والقلق على الصحة الجسدية وكيفية الوقاية من عواقبه طويلة الأمد',
  'أبحث عن طرق طبيعية وعملية لتحسين نوعية النوم وتعزيز الطاقة والنشاط اليومي',
  'أحتاج لمعرفة كيف أقرأ نتائج التحاليل الطبية وأفهمها دون الحاجة لشرح طبيب في كل مرة',
  'أريد تثقيف أطفالي حول الصحة منذ الصغر لبناء عادات صحية تدوم معهم طوال حياتهم',
  'يقلقني انتشار الأمراض المعدية في مجتمعنا وأريد معرفة طرق الوقاية الفعالة والعملية',
  'أحتاج إلى معلومات موثوقة حول صحة المرأة في مراحلها المختلفة وكيفية الرعاية الذاتية',
  'أريد تعلم كيف أتعامل مع الإصابات الرياضية البسيطة وأحمي أطفالي أثناء ممارستهم للرياضة',
  'أبحث عن معلومات علمية موثوقة حول التطعيمات وأهميتها لحماية صحة عائلتي',
  'أريد فهم العلاقة بين الصحة النفسية والجسدية وكيف أحسّن كليهما بشكل متكامل',
];

const HEALTH_POST_TEXTS = [
  'البرنامج الصحي رفع مستوى وعيي بشكل كبير بأهمية الغذاء الصحي وتأثيره الإيجابي على حياتي',
  'تعلمت كيف أكتشف مبكراً بعض الأعراض المرضية الخطرة وما الإجراء الصحيح للتعامل معها',
  'ورشة الصحة النفسية كانت استثنائية وساعدتني فعلاً على التعامل مع ضغوط الحياة اليومية',
  'أحتاج إلى مزيد من المعلومات التفصيلية حول إدارة أمراض السكري والضغط المنتشرة في بيئتنا',
  'الفريق الطبي المتطوع قدّم خدمة إنسانية رائعة حقيقية لأبناء الحي في جلسات مباشرة',
  'البرنامج غيّر عاداتي الغذائية والحركية اليومية نحو الأفضل بشكل لافت وملموس',
  'أتمنى زيادة عدد الجلسات التوعوية حول صحة الطفل والأمومة فهي من أكثر الاحتياجات إلحاحاً',
  'تعلمت الإسعافات الأولية الأساسية وأشعر بمسؤولية وقدرة أكبر تجاه مجتمعي وعائلتي',
  'البرنامج كشف لي أنني كنت أمارس عادات غذائية خاطئة منذ سنوات طويلة دون أن أدري',
  'الحصص التعليمية حول الوقاية من الأمراض المزمنة كانت مفيدة ومغيّرة للسلوك اليومي',
  'يجب أن تكون مثل هذه البرامج الصحية متاحة ومنتشرة في جميع أحياء المدينة دون استثناء',
  'تعلمت كيف أقرأ الملصقات الغذائية وأختار المنتجات الصحية المناسبة لاحتياجات عائلتي',
  'البرنامج أوجد وعياً مجتمعياً حقيقياً بأهمية الفحص الدوري والوقاية قبل وقوع المرض',
  'أشعر أن البرنامج كان قصيراً جداً قياساً بضخامة وأهمية الموضوعات الصحية التي يتناولها',
  'فهمت للمرة الأولى أن العلاقات الاجتماعية الجيدة هي جزء لا يتجزأ من الصحة العامة الحقيقية',
  'لأول مرة في حياتي أفهم كيف أدير أدويتي المزمنة بشكل صحيح ومنتظم وآمن',
  'البرنامج نشر ثقافة الصحة الوقائية الهامة بدل الانتظار حتى يقع المرض والاضطرار للعلاج',
  'تغيّرت نظرتي الجذرية للرياضة من كونها ترفاً غير ضروري إلى ضرورة حياتية لا غنى عنها',
  'جلسات المختصين النفسيين أزالت عني وصمة الخوف والخجل من طلب المساعدة النفسية',
  'أقترح بشدة إدراج زيارات منزلية دورية للعائلات التي تعاني من الأمراض المزمنة',
];

const EDUCATION_PRE_TEXTS = [
  'أعاني من صعوبة في إشراك الطلاب وتحفيزهم داخل الفصل وأحتاج لأساليب تفاعلية جديدة فعّالة',
  'أريد تطوير مهاراتي في توظيف التقنية الحديثة داخل الفصل الدراسي بشكل فعّال ومنظم',
  'أواجه تحدياً حقيقياً في التعامل مع الطلاب ذوي صعوبات التعلم المتنوعة ضمن الفصل الواحد',
  'أحتاج إلى استراتيجيات عملية وفعالة لإدارة سلوك الطلاب والحفاظ على بيئة تعلم إيجابية',
  'أرغب في تطوير مهاراتي في التقييم التكويني المستمر لتحسين مخرجات العملية التعليمية',
  'أشعر أن أساليبي التدريسية التقليدية لم تعد كافية لتلبية احتياجات جيل الطلاب الرقمي الجديد',
  'أريد تعلم كيفية تصميم مناهج دراسية تفاعلية تراعي الفروق الفردية بين الطلاب المختلفين',
  'أحتاج للتطوير في مهارة طرح الأسئلة الفكرية المحفزة للتفكير النقدي الإبداعي عند الطلاب',
  'أواجه صعوبة في تحفيز الطلاب الضعيفين وغير المتفاعلين على المشاركة الإيجابية في الفصل',
  'أريد تعلم أساليب التعلم التعاوني وكيفية تطبيقها بشكل فعّال في الفصول الكبيرة العدد',
  'أبحث عن طرق لدمج المهارات الحياتية والتفكير النقدي ضمن المناهج الدراسية التقليدية',
  'أحتاج إلى تطوير مهارات التواصل الفعال مع أولياء الأمور لبناء شراكة تعليمية حقيقية',
  'أريد معرفة أفضل أساليب التغذية الراجعة الفعّالة التي تحفز الطلاب على التحسن المستمر',
  'أواجه إرهاقاً وظيفياً متزايداً وأحتاج لاستراتيجيات للحفاظ على الشغف المهني وتجديد الطاقة',
  'أريد تعلم كيفية توظيف الذكاء الاصطناعي في تصميم المواد التعليمية وتخصيص التعلم',
  'أحتاج إلى أدوات قياس فعالة وموضوعية لتقييم مهارات التفكير العليا لدى الطلاب',
  'أرغب في تطوير مهاراتي في بناء بيئة صفية آمنة داعمة لجميع الطلاب نفسياً وأكاديمياً',
  'أواجه تحدياً في تغطية المنهج الدراسي الكثيف ضمن الوقت المحدود المتاح في الفصل',
  'أريد تعلم كيفية استخدام قصص النجاح والحالات الواقعية كأدوات تعليمية مؤثرة وفعّالة',
  'أحتاج إلى مزيد من الفهم للتطورات الأخيرة في علم النفس التعليمي وتطبيقاتها الميدانية',
];

const EDUCATION_POST_TEXTS = [
  'البرنامج أضاف أدوات تدريسية تفاعلية رائعة ومؤثرة إلى أساليبي وأرى نتائجها في الفصل',
  'تعلمت كيف أوظف التقنية الحديثة بشكل إيجابي وهادف في الفصل الدراسي دون إفراط',
  'أشعر بوضوح أن طلابي أصبحوا أكثر تفاعلاً وانخراطاً ومشاركة بعد تطبيق الأساليب الجديدة',
  'البرنامج ساعدني كثيراً على فهم احتياجات الطلاب من ذوي صعوبات التعلم وكيف أتعامل معهم',
  'أتمنى وجود متابعة مستمرة ودورية لقياس تأثير التدريب الفعلي على أداء الطلاب طويل الأمد',
  'التدريب على التعلم التعاوني والمجموعات غيّر شكل صفوفي الدراسية بالكامل نحو الأفضل',
  'أواجه تحديات حقيقية في تطبيق الأساليب الجديدة نظراً لضيق الوقت وكثافة المناهج المقررة',
  'فهمت أهمية التقييم التكويني المستمر في تحسين مسيرة الطالب التعليمية ورفع تحصيله',
  'البرنامج ولّد لديّ شغفاً جديداً متجدداً نحو مهنة التدريس والإبداع والابتكار فيها',
  'أحتاج إلى دعم أكبر ومستمر من الإدارة المدرسية لتطبيق ما تعلمته فعلياً في الصف',
  'التدريب على إدارة الفصل والسلوك كان الأكثر فائدة وتطبيقاً بالنسبة لي شخصياً',
  'تعلمت كيف أبني علاقة إيجابية ومتوازنة مع الطلاب تعزز بيئة التعلم الإيجابية',
  'أرى فرقاً واضحاً وملموساً في مستوى انتباه طلابي منذ تطبيق الأساليب والاستراتيجيات الجديدة',
  'البرنامج غفل عن التطرق الكافي لتحديات التدريس في المناطق النائية وقصور الإمكانات',
  'أشعر بامتنان كبير لأن هذا البرنامج جدد طاقتي وحماسي لمهنة التدريس بشكل حقيقي',
  'الأساليب القصصية والحكائية في التدريس التي تعلمتها غيّرت بيئة صفي وروحها تماماً',
  'أتمنى بشدة أن تترجم هذه البرامج إلى شكل دوري مستمر على مدار العام الدراسي كله',
  'فهمت من البرنامج الهام أن التعلم الحقيقي العميق يبدأ دائماً من شغف المعلم نفسه',
  'التقنيات التعليمية الحديثة تتطلب بنية تحتية تقنية قد لا تتوفر في كل مدرسة ومنطقة',
  'البرنامج أكد لي أن دور المعلم الحقيقي هو الإلهام والتوجيه وليس مجرد نقل المعلومات',
];

// ─── Name components for 200 beneficiaries ───────────────────────────────────

const MALE_FIRST = [
  'عبدالله', 'محمد', 'أحمد', 'خالد', 'سعود', 'فيصل', 'عمر', 'طارق',
  'وليد', 'زياد', 'بندر', 'ماجد', 'فهد', 'تركي', 'رائد', 'سعد',
  'مساعد', 'يوسف', 'علي', 'حمد',
];
const FEMALE_FIRST = [
  'نورة', 'سارة', 'فاطمة', 'هدى', 'ريم', 'لطيفة', 'أسماء', 'أميرة',
  'وفاء', 'نوف', 'عزة', 'شيماء', 'دلال', 'إيمان', 'رنا', 'هنوف',
  'ميسون', 'لبنى', 'هيفاء', 'جواهر',
];
const LAST_NAMES = [
  'السعيد', 'القحطاني', 'المطيري', 'الزهراني', 'العتيبي', 'العمري', 'الشهري', 'الحربي',
  'الدوسري', 'الغامدي', 'الرشيدي', 'البلوي', 'القرني', 'الأسمري', 'الثبيتي', 'الجهني',
  'العنزي', 'الشمري', 'الحميد', 'القاسم', 'المالكي', 'العسيري', 'الصاعدي', 'الجبري',
  'السبيعي', 'الزياني', 'البقمي', 'السلمي', 'المرزوقي', 'الحسيني', 'الوادعي', 'الرويلي',
  'العجمي', 'الشريف', 'المقرن', 'الخضيري', 'الموسى', 'السدحان', 'البحراني', 'النعيمي',
];
const CITIES = ['الرياض', 'جدة', 'الدمام', 'مكة المكرمة', 'المدينة المنورة', 'الطائف', 'تبوك', 'أبها'];
const REGIONS = ['الوسطى', 'مكة المكرمة', 'الشرقية', 'مكة المكرمة', 'المدينة المنورة', 'مكة المكرمة', 'تبوك', 'عسير'];
const EDUCATIONS = ['بكالوريوس', 'ماجستير', 'دبلوم', 'ثانوي', 'بكالوريوس', 'بكالوريوس', 'دكتوراه', 'متوسط'];
const PROFESSIONS = ['باحث عن عمل', 'موظف حكومي', 'موظف قطاع خاص', 'ربة منزل', 'معلم', 'طالب', 'مدرب', 'رائد أعمال'];

@Injectable()
export class DatabaseSeeder {
  private readonly logger = new Logger(DatabaseSeeder.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Project.name) private projectModel: Model<Project>,
    @InjectModel(ProjectTypeEntity.name) private projectTypeModel: Model<ProjectTypeEntity>,
    @InjectModel(Beneficiary.name) private beneficiaryModel: Model<Beneficiary>,
    @InjectModel(ActivityBeneficiary.name) private activityBeneficiaryModel: Model<ActivityBeneficiary>,
    @InjectModel(Activity.name) private activityModel: Model<Activity>,
    @InjectModel(Participant.name) private participantModel: Model<Participant>,
    @InjectModel(ActivityParticipant.name) private activityParticipantModel: Model<ActivityParticipant>,
    @InjectModel(Survey.name) private surveyModel: Model<Survey>,
    @InjectModel(SurveyQuestion.name) private surveyQuestionModel: Model<SurveyQuestion>,
    @InjectModel(SurveySubmission.name) private submissionModel: Model<SurveySubmission>,
    @InjectModel(SurveyCorrectAnswer.name) private correctAnswerModel: Model<SurveyCorrectAnswer>,
    @InjectModel(TextAnalysis.name) private textAnalysisModel: Model<TextAnalysis>,
    @InjectModel(Topic.name) private topicModel: Model<Topic>,
    @InjectModel(TextTopic.name) private textTopicModel: Model<TextTopic>,
    @InjectModel(Indicator.name) private indicatorModel: Model<Indicator>,
    @InjectModel(IndicatorHistory.name) private indicatorHistoryModel: Model<IndicatorHistory>,
    @InjectConnection() private connection: Connection,
  ) {}

  // ─── Main entry point ─────────────────────────────────────────────────────
  async seed() {
    this.logger.log('🌱 Starting comprehensive database seeding...');

    try {
      // Keep existing users — create defaults only if none exist
      let users = await this.userModel.find().lean();
      if (users.length === 0) {
        this.logger.log('⚠️  No users found — creating default users...');
        users = (await this.seedUsers()) as any[];
      } else {
        this.logger.log(`✅ Found ${users.length} existing users — preserving them`);
      }

      await this.clearDatabase();

      const projectTypes  = await this.seedProjectTypes(users);
      const projects      = await this.seedProjects(users, projectTypes);
      const beneficiaries = await this.seedBeneficiaries();
      const activities    = await this.seedActivities(projects);
      const participants  = await this.seedParticipants(beneficiaries);
      const surveys       = await this.seedSurveys(activities);
      const questions     = await this.seedSurveyQuestions(surveys);
      const submissionCount = await this.seedSurveySubmissions(surveys, beneficiaries, questions);
      const correctAnswers  = await this.seedCorrectAnswers(surveys, questions);
      const indicators    = await this.seedIndicators(projects);
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
        submissions: submissionCount,
        correctAnswers: correctAnswers.length,
        indicators: indicators.length,
        textAnalyses: 0,
        topics: 0,
      };
    } catch (error) {
      this.logger.error('❌ Error seeding database:', error);
      throw error;
    }
  }

  // ─── Clear all collections except users ───────────────────────────────────
  private async clearDatabase() {
    this.logger.log('🗑️  Clearing data (users are preserved)...');
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
    // userModel is intentionally NOT cleared

    try {
      await this.connection.db!.dropCollection('surveyresponses');
      this.logger.log('🗑️  Dropped obsolete surveyresponses collection');
    } catch {
      // Collection doesn't exist — fine
    }

    this.logger.log('✅ Database cleared (users preserved)');
  }

  // ─── Users (fallback only) ─────────────────────────────────────────────────
  private async seedUsers() {
    const pw = await bcrypt.hash('Test123456!', 10);
    const users = await this.userModel.insertMany([
      { name: 'أحمد المدير',    email: 'admin@example.com',   password: pw, role: UserRole.ADMIN, status: UserStatus.ACTIVE, phone: '+966501234567' },
      { name: 'فاطمة المشرفة', email: 'manager@example.com', password: pw, role: UserRole.STAFF, status: UserStatus.ACTIVE, phone: '+966509876543' },
      { name: 'محمد المحلل',   email: 'analyst@example.com', password: pw, role: UserRole.STAFF, status: UserStatus.ACTIVE, phone: '+966505555555' },
      { name: 'سارة القحطاني', email: 'sarah@example.com',   password: pw, role: UserRole.STAFF, status: UserStatus.ACTIVE, phone: '+966502222222' },
    ]);
    this.logger.log(`✅ Created ${users.length} default users`);
    return users;
  }

  // ─── Project Types ────────────────────────────────────────────────────────
  // Normalized values must match what normalizeProjectTypeValue() produces:
  // spaces → underscores, Arabic chars preserved, lowercase
  private async seedProjectTypes(users: any[]) {
    this.logger.log('🏷️  Seeding project types...');

    const adminId = (users.find((u: any) => u.role === UserRole.ADMIN) ?? users[0])._id;

    const types = await this.projectTypeModel.insertMany([
      { value: 'تمكين_شبابي',   label: 'تمكين شبابي',   createdBy: adminId },
      { value: 'تمكين_اقتصادي', label: 'تمكين اقتصادي', createdBy: adminId },
      { value: 'توعية_صحية',    label: 'توعية صحية',    createdBy: adminId },
      { value: 'تطوير_تعليمي',  label: 'تطوير تعليمي',  createdBy: adminId },
    ]);

    this.logger.log(`✅ Created ${types.length} project types`);
    return types;
  }

  // ─── Projects (8 total — 2 per domain) ────────────────────────────────────
  private async seedProjects(users: any[], _projectTypes: any[]) {
    this.logger.log('📁 Seeding 8 projects...');

    const adminId = (users.find((u: any) => u.role === UserRole.ADMIN) ?? users[0])._id;
    const staff = users.filter((u: any) => u.role !== UserRole.ADMIN);
    const uid = (i: number) => (staff[i] ?? users[0])._id;

    const projects = await this.projectModel.insertMany([
      // ── Youth ──────────────────────────────────────────────────────────────
      {
        user_id: uid(0),
        name: 'برنامج تمكين الشباب المهني',
        description: 'برنامج تدريبي شامل يهدف إلى تمكين الشباب وتطوير مهاراتهم القيادية والمهنية وتهيئتهم لسوق العمل الحديث',
        type: 'تمكين_شبابي',
        status: ProjectStatus.IN_PROGRESS,
        startDate: new Date('2025-01-01'), endDate: new Date('2026-12-31'),
        location: 'الرياض',
        targetGroups: ['الشباب من 18-35 سنة', 'الخريجون الجدد', 'الباحثون عن عمل'],
        goals: {
          short_term: ['تطوير المهارات القيادية', 'بناء الثقة بالنفس', 'تحسين مهارات التواصل'],
          long_term: ['تأهيل 2000 شاب لسوق العمل', 'خفض معدل البطالة', 'بناء قادة المستقبل'],
        },
        budget: { total: 5000000, spent: 2100000, currency: 'SAR' },
      },
      {
        user_id: uid(0),
        name: 'مبادرة قيادات الشباب 2030',
        description: 'مبادرة وطنية لاستثمار طاقات الشباب وصقل مهاراتهم القيادية تماشياً مع متطلبات رؤية 2030',
        type: 'تمكين_شبابي',
        status: ProjectStatus.IN_PROGRESS,
        startDate: new Date('2025-02-01'), endDate: new Date('2026-09-30'),
        location: 'جدة',
        targetGroups: ['الشباب القيادي 20-30 سنة', 'طلاب الجامعات', 'الخريجون المتميزون'],
        goals: {
          short_term: ['تطوير الكفاءات القيادية', 'بناء مجتمع من القادة الشباب', 'رفع مستوى الوعي الوطني'],
          long_term: ['إعداد 500 قائد شاب', 'دعم رؤية 2030', 'تعزيز الهوية الوطنية'],
        },
        budget: { total: 3500000, spent: 1200000, currency: 'SAR' },
      },
      // ── Families ───────────────────────────────────────────────────────────
      {
        user_id: uid(1),
        name: 'مبادرة الأسر المنتجة',
        description: 'دعم الأسر وربات المنازل لإنشاء مشاريع منزلية مدرة للدخل وتطوير مهاراتهن في التسويق الإلكتروني',
        type: 'تمكين_اقتصادي',
        status: ProjectStatus.IN_PROGRESS,
        startDate: new Date('2025-03-01'), endDate: new Date('2026-06-30'),
        location: 'جدة',
        targetGroups: ['ربات المنازل', 'الأسر ذات الدخل المحدود', 'النساء الراغبات في العمل'],
        goals: {
          short_term: ['تعليم مهارات التسويق الإلكتروني', 'تطوير المنتجات', 'فهم إدارة المال'],
          long_term: ['تمكين 800 أسرة من تحقيق دخل إضافي', 'خلق بيئة أعمال نسائية', 'تعزيز الاستقلالية الاقتصادية'],
        },
        budget: { total: 2000000, spent: 780000, currency: 'SAR' },
      },
      {
        user_id: uid(1),
        name: 'برنامج تمكين المرأة الاقتصادي',
        description: 'برنامج متكامل يستهدف تمكين المرأة اقتصادياً من خلال تطوير مهاراتها المهنية وتوفير فرص العمل المناسبة',
        type: 'تمكين_اقتصادي',
        status: ProjectStatus.IN_PROGRESS,
        startDate: new Date('2025-04-01'), endDate: new Date('2026-10-31'),
        location: 'الرياض',
        targetGroups: ['المرأة العاملة', 'رائدات الأعمال', 'الخريجات الجدد'],
        goals: {
          short_term: ['تطوير المهارات المهنية', 'تعزيز ثقة المرأة بنفسها', 'بناء شبكة علاقات مهنية'],
          long_term: ['توظيف 300 امرأة', 'إطلاق 100 مشروع نسائي', 'رفع مشاركة المرأة في سوق العمل'],
        },
        budget: { total: 2500000, spent: 850000, currency: 'SAR' },
      },
      // ── Health ─────────────────────────────────────────────────────────────
      {
        user_id: uid(2) ?? adminId,
        name: 'برنامج الصحة المجتمعية الشاملة',
        description: 'تعزيز الوعي الصحي ونشر ثقافة الوقاية والعيش الصحي من خلال برامج تثقيفية وتدريبية متخصصة',
        type: 'توعية_صحية',
        status: ProjectStatus.IN_PROGRESS,
        startDate: new Date('2025-02-01'), endDate: new Date('2026-01-31'),
        location: 'الدمام',
        targetGroups: ['المجتمع العام', 'مرضى الأمراض المزمنة', 'الأسر', 'كبار السن'],
        goals: {
          short_term: ['رفع الوعي الصحي', 'تعليم الإسعافات الأولية', 'تشجيع الفحص الدوري'],
          long_term: ['خفض معدل الأمراض المزمنة', 'بناء مجتمع صحي واعٍ', 'تحسين جودة الحياة'],
        },
        budget: { total: 1500000, spent: 650000, currency: 'SAR' },
      },
      {
        user_id: uid(2) ?? adminId,
        name: 'مبادرة حياة صحية مستدامة',
        description: 'مبادرة مجتمعية لتعزيز نمط الحياة الصحي والوقاية من الأمراض وتحسين الرفاهية النفسية والجسدية',
        type: 'توعية_صحية',
        status: ProjectStatus.IN_PROGRESS,
        startDate: new Date('2025-05-01'), endDate: new Date('2026-04-30'),
        location: 'مكة المكرمة',
        targetGroups: ['الأسر', 'الشباب', 'المرضى المزمنون'],
        goals: {
          short_term: ['نشر ثقافة الغذاء الصحي', 'تشجيع ممارسة الرياضة', 'تعزيز الصحة النفسية'],
          long_term: ['خفض معدل البدانة', 'تحسين المؤشرات الصحية المجتمعية', 'تكوين سفراء صحة مجتمعيين'],
        },
        budget: { total: 1800000, spent: 520000, currency: 'SAR' },
      },
      // ── Education ──────────────────────────────────────────────────────────
      {
        user_id: adminId,
        name: 'مشروع تطوير التعليم الإبداعي',
        description: 'تطوير مهارات المعلمين وتحديث أساليبهم التدريسية باستخدام التقنية والأساليب الحديثة لرفع جودة التعليم',
        type: 'تطوير_تعليمي',
        status: ProjectStatus.IN_PROGRESS,
        startDate: new Date('2025-04-01'), endDate: new Date('2026-03-31'),
        location: 'مكة المكرمة',
        targetGroups: ['المعلمون', 'المشرفون التربويون', 'قادة المدارس'],
        goals: {
          short_term: ['تطوير أساليب التدريس', 'توظيف التقنية التعليمية', 'تحسين بيئة التعلم'],
          long_term: ['رفع مستوى التحصيل الدراسي', 'تحديث المنظومة التعليمية', 'تأهيل جيل مبدع'],
        },
        budget: { total: 3000000, spent: 1100000, currency: 'SAR' },
      },
      {
        user_id: adminId,
        name: 'برنامج تأهيل المعلمين المتميزين',
        description: 'برنامج متقدم لاختيار وتأهيل المعلمين المتميزين وتطوير قدراتهم القيادية لقيادة التحول في التعليم',
        type: 'تطوير_تعليمي',
        status: ProjectStatus.IN_PROGRESS,
        startDate: new Date('2025-06-01'), endDate: new Date('2026-05-31'),
        location: 'المدينة المنورة',
        targetGroups: ['المعلمون المتميزون', 'قادة التحول التعليمي', 'المشرفون التربويون'],
        goals: {
          short_term: ['انتقاء 200 معلم متميز', 'تطوير قدراتهم القيادية', 'بناء مجتمعات تعلم مهنية'],
          long_term: ['نشر ممارسات التميز التعليمي', 'تأسيس نواة قيادات تربوية', 'رفع جودة التعليم الوطني'],
        },
        budget: { total: 2800000, spent: 750000, currency: 'SAR' },
      },
    ]);

    this.logger.log(`✅ Created ${projects.length} projects`);
    return projects;
  }

  // ─── Beneficiaries (200: 100 male + 80 female + 20 area) ──────────────────
  private async seedBeneficiaries() {
    this.logger.log('👥 Seeding 200 beneficiaries...');

    const data: any[] = [];

    for (let i = 0; i < 100; i++) {
      const cityIdx = i % CITIES.length;
      data.push({
        beneficiaryType: BeneficiaryType.INDIVIDUAL,
        name: `${MALE_FIRST[i % 20]} ${LAST_NAMES[(i + 5) % 40]} ${LAST_NAMES[i % 40]}`,
        gender: 'male',
        age: 18 + (i % 30),
        city: CITIES[cityIdx],
        region: REGIONS[cityIdx],
        educationLevel: EDUCATIONS[i % 8],
        profession: PROFESSIONS[i % 8],
        phone: `+96650${String(1000000 + i).slice(1)}`,
        email: `male${i + 1}@example.com`,
        nationalId: `1${String(100000000 + i)}`,
      });
    }

    for (let i = 0; i < 80; i++) {
      const cityIdx = (i + 3) % CITIES.length;
      data.push({
        beneficiaryType: BeneficiaryType.INDIVIDUAL,
        name: `${FEMALE_FIRST[i % 20]} ${LAST_NAMES[(i + 10) % 40]} ${LAST_NAMES[(i + 2) % 40]}`,
        gender: 'female',
        age: 18 + (i % 35),
        city: CITIES[cityIdx],
        region: REGIONS[cityIdx],
        educationLevel: EDUCATIONS[(i + 2) % 8],
        profession: PROFESSIONS[(i + 3) % 8],
        phone: `+96660${String(1000000 + i).slice(1)}`,
        email: `female${i + 1}@example.com`,
        nationalId: `2${String(100000000 + i)}`,
      });
    }

    const areaNames = [
      'حي النخيل', 'حي الروابي', 'حي المروج', 'حي العزيزية', 'حي الصفا',
      'حي السلامة', 'حي الزهراء', 'حي الأندلس', 'حي الفيصلية', 'حي الملك فهد',
      'قرية العيون', 'قرية الحائط', 'منطقة الجوف', 'منطقة القنفذة', 'منطقة الليث',
      'حي الشرفية', 'حي الوادي', 'حي التضامن', 'حي الرمال', 'حي النسيم',
    ];
    for (let i = 0; i < 20; i++) {
      const cityIdx = i % CITIES.length;
      data.push({
        beneficiaryType: BeneficiaryType.AREA,
        name: areaNames[i],
        city: CITIES[cityIdx],
        region: REGIONS[cityIdx],
        areaSize: 2 + (i % 50),
        population: 500 + i * 200,
        notes: `منطقة مستهدفة ضمن البرنامج المجتمعي — ${areaNames[i]}`,
      });
    }

    const beneficiaries = await this.beneficiaryModel.insertMany(data);
    this.logger.log(`✅ Created ${beneficiaries.length} beneficiaries`);
    return beneficiaries;
  }

  // ─── Activities (5 per project = 40 total) ────────────────────────────────
  private async seedActivities(projects: any[]) {
    this.logger.log('📅 Seeding 40 activities (5 per project)...');

    // Activity position within project maps to date + status
    const DATES = [
      new Date('2025-02-15'), // pos 0 → completed
      new Date('2025-04-20'), // pos 1 → completed
      new Date('2025-07-10'), // pos 2 → completed
      new Date('2025-10-15'), // pos 3 → completed
      new Date('2026-03-20'), // pos 4 → planned
    ];
    const STATUSES = [
      ActivityStatus.COMPLETED,
      ActivityStatus.COMPLETED,
      ActivityStatus.COMPLETED,
      ActivityStatus.COMPLETED,
      ActivityStatus.PLANNED,
    ];

    // Templates per domain — 5 activities each
    const TEMPLATES: Record<string, any[]> = {
      youth: [
        { title: 'ورشة مهارات القيادة والتأثير الفعّال', type: ActivityType.WORKSHOP, capacity: 60, tags: ['قيادة', 'تأثير', 'تطوير'] },
        { title: 'دورة البرمجة والذكاء الاصطناعي للمبتدئين', type: ActivityType.TRAINING, capacity: 40, tags: ['برمجة', 'ذكاء اصطناعي', 'تقنية'] },
        { title: 'ملتقى ريادة الأعمال الشبابي السنوي', type: ActivityType.SEMINAR, capacity: 150, tags: ['ريادة', 'شبكات', 'أعمال'] },
        { title: 'برنامج التدريب الميداني في الشركات', type: ActivityType.TRAINING, capacity: 80, tags: ['تدريب', 'شركات', 'خبرة'] },
        { title: 'ورشة التخطيط المهني وبناء مسار الحياة', type: ActivityType.WORKSHOP, capacity: 50, tags: ['تخطيط', 'مهني', 'مستقبل'] },
      ],
      families: [
        { title: 'ورشة التسويق الإلكتروني للمشاريع المنزلية', type: ActivityType.WORKSHOP, capacity: 50, tags: ['تسويق', 'إلكتروني', 'مشاريع'] },
        { title: 'دورة إدارة المشاريع الصغيرة والتمويل', type: ActivityType.TRAINING, capacity: 45, tags: ['إدارة', 'تمويل', 'مشاريع صغيرة'] },
        { title: 'معرض المنتجات المحلية والبازار السنوي', type: ActivityType.SEMINAR, capacity: 100, tags: ['معرض', 'منتجات', 'بيع'] },
        { title: 'دورة التصوير الاحترافي للمنتجات', type: ActivityType.TRAINING, capacity: 30, tags: ['تصوير', 'منتجات', 'احترافي'] },
        { title: 'ورشة بناء العلامة التجارية والهوية البصرية', type: ActivityType.WORKSHOP, capacity: 40, tags: ['علامة تجارية', 'هوية', 'تسويق'] },
      ],
      health: [
        { title: 'ورشة الإسعافات الأولية والحوادث المنزلية', type: ActivityType.WORKSHOP, capacity: 40, tags: ['إسعافات', 'طوارئ', 'صحة'] },
        { title: 'برنامج إدارة الأمراض المزمنة وتحسين الحياة', type: ActivityType.TRAINING, capacity: 60, tags: ['أمراض مزمنة', 'سكري', 'ضغط'] },
        { title: 'يوم الصحة المجتمعي المفتوح والفحوصات المجانية', type: ActivityType.SEMINAR, capacity: 500, tags: ['توعية', 'فحص', 'مجتمع'] },
        { title: 'دورة التغذية الصحية والعلاجية للأسرة', type: ActivityType.TRAINING, capacity: 70, tags: ['تغذية', 'صحة', 'وقاية'] },
        { title: 'ورشة الصحة النفسية ومهارات إدارة الضغط', type: ActivityType.WORKSHOP, capacity: 45, tags: ['صحة نفسية', 'ضغط', 'رفاهية'] },
      ],
      education: [
        { title: 'ورشة الأساليب التدريسية التفاعلية الحديثة', type: ActivityType.WORKSHOP, capacity: 50, tags: ['أساليب تدريسية', 'تفاعل', 'تطوير'] },
        { title: 'دورة التقنية التعليمية وأدوات الذكاء الاصطناعي', type: ActivityType.TRAINING, capacity: 35, tags: ['تقنية', 'ذكاء اصطناعي', 'تعليم'] },
        { title: 'مؤتمر التعليم المستدام ورؤية 2030', type: ActivityType.SEMINAR, capacity: 200, tags: ['مؤتمر', 'رؤية 2030', 'تعليم مستدام'] },
        { title: 'دورة إدارة الفصل الدراسي والسلوك الإيجابي', type: ActivityType.TRAINING, capacity: 55, tags: ['إدارة صف', 'سلوك', 'تعليم'] },
        { title: 'ورشة التقييم التكويني وقياس تحصيل الطلاب', type: ActivityType.WORKSHOP, capacity: 45, tags: ['تقييم', 'قياس', 'تحصيل'] },
      ],
    };

    const DOMAIN_MAP = ['youth', 'youth', 'families', 'families', 'health', 'health', 'education', 'education'];

    const activitiesData: any[] = [];
    projects.forEach((project, pi) => {
      const domain = DOMAIN_MAP[pi % 8];
      const templates = TEMPLATES[domain];
      templates.forEach((tmpl, ai) => {
        activitiesData.push({
          project: project._id,
          title: tmpl.title,
          description: `${tmpl.title} — ضمن ${project.name}. يهدف إلى تطوير قدرات المستفيدين وتعزيز مخرجات البرنامج وتحقيق أهدافه الاستراتيجية.`,
          activityDate: DATES[ai],
          startTime: ai % 2 === 0 ? '09:00' : '16:00',
          endTime: ai % 2 === 0 ? '15:00' : '20:00',
          location: `${project.location} — ${tmpl.title.split(' ')[0]} مركز`,
          capacity: tmpl.capacity,
          registeredCount: Math.floor(tmpl.capacity * (0.75 + ((pi * 5 + ai) % 20) * 0.01)),
          activityType: tmpl.type,
          status: STATUSES[ai],
          tags: tmpl.tags,
        });
      });
    });

    const activities = await this.activityModel.insertMany(activitiesData);
    this.logger.log(`✅ Created ${activities.length} activities`);
    return activities;
  }

  // ─── Participants (120 from individual beneficiaries) ─────────────────────
  private async seedParticipants(beneficiaries: any[]) {
    this.logger.log('🎓 Seeding 120 participants...');

    const individuals = beneficiaries.filter((b: any) => b.beneficiaryType === BeneficiaryType.INDIVIDUAL);
    const genders = [Gender.MALE, Gender.FEMALE];

    const participants = await this.participantModel.insertMany(
      individuals.slice(0, 120).map((b: any, i: number) => ({
        beneficiary: b._id,
        fullName: b.name,
        email: `participant${i + 1}@example.com`,
        phone: b.phone,
        age: b.age,
        gender: genders[i % 2],
        city: b.city,
        educationLevel: b.educationLevel,
        occupation: b.profession,
        status: i % 6 === 5 ? ParticipantStatus.COMPLETED
               : i % 6 === 4 ? ParticipantStatus.DROPPED
               : ParticipantStatus.ACTIVE,
      })),
    );

    this.logger.log(`✅ Created ${participants.length} participants`);
    return participants;
  }

  // ─── Surveys (2 per activity = 80 total) ──────────────────────────────────
  // Survey status by activity position within project (0-4):
  //   pos 0,1,2 → both CLOSED  (targetResponses = 300)
  //   pos 3     → pre=CLOSED, post=ACTIVE  (300 / 250)
  //   pos 4     → pre=ACTIVE, post=DRAFT   (250 / 200)
  private async seedSurveys(activities: any[]) {
    this.logger.log('📝 Seeding 80 surveys (2 per activity)...');

    const surveysData: any[] = [];
    activities.forEach((activity, ai) => {
      const pos = ai % 5;

      let s0Status: SurveyStatus, s1Status: SurveyStatus;
      let s0Target: number, s1Target: number;

      if (pos <= 2) {
        s0Status = SurveyStatus.CLOSED;  s0Target = 300;
        s1Status = SurveyStatus.CLOSED;  s1Target = 300;
      } else if (pos === 3) {
        s0Status = SurveyStatus.CLOSED;  s0Target = 300;
        s1Status = SurveyStatus.ACTIVE;  s1Target = 250;
      } else {
        s0Status = SurveyStatus.ACTIVE;  s0Target = 250;
        s1Status = SurveyStatus.DRAFT;   s1Target = 200;
      }

      surveysData.push({
        activity: activity._id,
        title: `تقييم قبلي — ${activity.title.substring(0, 35)}`,
        description: 'يهدف هذا الاستبيان إلى قياس مستوى المعرفة والاحتياجات قبل بدء البرنامج',
        type: SurveyType.PRE_EVALUATION,
        status: s0Status,
        targetResponses: s0Target,
        totalResponses: 0,
        isAnonymous: false,
        welcomeMessage: 'نرحب بمشاركتك! إجاباتك ستساعدنا على تقديم أفضل برنامج ممكن',
        thankYouMessage: 'شكراً على مشاركتك القيّمة في الاستبيان',
      });

      surveysData.push({
        activity: activity._id,
        title: `تقييم بعدي ورضا — ${activity.title.substring(0, 35)}`,
        description: 'يقيس هذا الاستبيان مدى تحقق الأهداف ومستوى رضا المستفيدين عن البرنامج',
        type: SurveyType.POST_EVALUATION,
        status: s1Status,
        targetResponses: s1Target,
        totalResponses: 0,
        isAnonymous: false,
        welcomeMessage: 'نقدر وقتك! آراؤك تساعدنا على التحسين المستمر',
        thankYouMessage: 'نشكرك على إكمال الاستبيان — آراؤك ستعزز البرنامج',
      });
    });

    const surveys = await this.surveyModel.insertMany(surveysData);
    this.logger.log(`✅ Created ${surveys.length} surveys`);
    return surveys;
  }

  // ─── Questions (8 per survey = 640 total) ─────────────────────────────────
  private async seedSurveyQuestions(surveys: any[]) {
    this.logger.log('❓ Seeding 640 survey questions (8 per survey)...');

    const DOMAIN_MAP_Q = ['youth', 'youth', 'families', 'families', 'health', 'health', 'education', 'education'];

    const preTextQ1 = [
      'ما هي أهدافك الرئيسية من المشاركة في هذا البرنامج؟',
      'ما الذي تأمل في تعلمه أو تطويره خلال هذا البرنامج؟',
      'ما هي التحديات التي تواجهها حالياً في هذا المجال؟',
      'كيف تصف وضعك الحالي قبل الانضمام لهذا البرنامج؟',
      'ما الدوافع التي جعلتك تسجل في هذا البرنامج التدريبي؟',
      'ما هو مستوى خبرتك الحالية ومعرفتك في هذا المجال؟',
      'ما الفجوات التدريبية التي تشعر أنها تحتاج للتعزيز في مسيرتك؟',
      'كيف تعتقد أن هذا البرنامج سيغير وضعك وينعكس على حياتك؟',
    ];
    const preTextQ2 = [
      'ما هي توقعاتك من هذا البرنامج وكيف تأمل أن يغير حياتك؟',
      'صِف بإيجاز خبرتك السابقة في هذا المجال وأبرز تحدياتك؟',
      'ما الذي يمنعك حتى الآن من تحقيق أهدافك في هذا المجال؟',
      'ما هو أكبر تحدٍ شخصي أو مهني تريد التغلب عليه؟',
      'ما الأهداف المحددة التي تريد تحقيقها بنهاية هذا البرنامج؟',
      'كيف ستطبق ما ستتعلمه في حياتك اليومية أو بيئة عملك؟',
      'ما نوع الدعم الذي تحتاجه لاستثمار هذا البرنامج بأقصى طاقته؟',
      'هل سبق لك المشاركة في برامج مشابهة؟ وما أبرز الدروس المستفادة؟',
    ];
    const postTextQ1 = [
      'ما هي أهم ثلاثة أشياء استفدتها من هذا البرنامج وكيف ستطبقها؟',
      'كيف أثّر هذا البرنامج على نظرتك أو أسلوبك أو طريقة تفكيرك؟',
      'ما الذي تغير فيك أو في أسلوبك بعد المشاركة في هذا البرنامج؟',
      'ما أبرز المكاسب التي حققتها من هذا البرنامج التدريبي؟',
      'كيف ستستثمر ما تعلمته في تطوير مسيرتك المهنية والشخصية؟',
      'ما أكثر جانب أثّر فيك وغيّر طريقة تفكيرك في هذا البرنامج؟',
      'صِف تجربة التعلم التي مررت بها وكيف تقيّم جودة المحتوى؟',
      'ما التزامات والإجراءات التي ستتخذها بعد انتهاء البرنامج؟',
    ];
    const postTextQ2 = [
      'ما هي اقتراحاتك لتحسين البرنامج وجعله أكثر فائدة للمشاركين القادمين؟',
      'هل تنصح الآخرين بالمشاركة في هذا البرنامج؟ ولماذا بالتفصيل؟',
      'ما الجوانب التي أعجبتك وما التي تحتاج إلى تطوير أو تحسين؟',
      'كيف تقيّم تجربتك الكاملة في البرنامج بكلماتك الخاصة؟',
      'ما المقترحات التي تراها مهمة لضمان استمرار التعلم بعد البرنامج؟',
      'كيف قيّمت جودة المدربين ومستوى المحتوى التدريبي المقدم؟',
      'ما الأثر المتوقع لهذا البرنامج على حياتك المهنية على المدى البعيد؟',
      'ما التوصيات التي توصي بها لجعل هذا البرنامج أكثر تأثيراً وفاعلية؟',
    ];

    // Pre Q5: experience level options
    const preExpOptions = [
      ['مبتدئ تماماً', 'لديّ خبرة بسيطة', 'خبرة متوسطة', 'خبير ومتقدم'],
      ['أقل من سنة', 'من 1-3 سنوات', 'من 3-5 سنوات', 'أكثر من 5 سنوات'],
      ['للمرة الأولى', 'سبق لي الحضور مرة', 'حضرت عدة مرات', 'مشارك منتظم'],
      ['لا أعلم شيئاً', 'لديّ معرفة أساسية', 'لديّ معرفة كافية', 'لديّ خبرة واسعة'],
      ['غير مستعد', 'مستعد جزئياً', 'مستعد إلى حد ما', 'مستعد تماماً'],
      ['لا أثق في قدراتي', 'ثقة متوسطة', 'ثقة جيدة', 'ثقة عالية جداً'],
      ['بداية المشوار', 'في المراحل الأولى', 'في المنتصف', 'متقدم في المجال'],
      ['أبحث عن التوجيه', 'لديّ فهم أساسي', 'فهم جيد', 'خبير يبحث عن التطوير'],
    ];

    // Post Q5: domain-specific knowledge test questions (with correct answers)
    const POST_KNOWLEDGE: Record<string, { q: string; opts: string[]; correct: string }[]> = {
      youth: [
        { q: 'ما أول خطوة في بناء مشروع ريادي ناجح؟', opts: ['التسويق المكثف فوراً', 'تحديد المشكلة وجمهورها المستهدف', 'تأمين التمويل الكامل أولاً', 'تعيين فريق العمل قبل كل شيء'], correct: 'تحديد المشكلة وجمهورها المستهدف' },
        { q: 'ما أهم عناصر القيادة الفعّالة؟', opts: ['الصرامة المطلقة', 'الرؤية والتواصل والتأثير الإيجابي', 'السيطرة الكاملة على الفريق', 'تجنب التفويض'], correct: 'الرؤية والتواصل والتأثير الإيجابي' },
        { q: 'ما معنى SMART في تحديد الأهداف؟', opts: ['أهداف مثيرة ومشوقة', 'محددة وقابلة للقياس وقابلة للتحقيق وذات صلة ومحددة زمنياً', 'أهداف اجتماعية وتسويقية', 'أهداف مرنة وغير ملزمة'], correct: 'محددة وقابلة للقياس وقابلة للتحقيق وذات صلة ومحددة زمنياً' },
      ],
      families: [
        { q: 'ما الصيغة الصحيحة لتسعير المنتج المنزلي؟', opts: ['أقل من المنافسين دائماً', 'تكلفة الإنتاج + هامش ربح + قيمة المنتج للعميل', 'نسخ أسعار المنافسين', 'رفع السعر باستمرار'], correct: 'تكلفة الإنتاج + هامش ربح + قيمة المنتج للعميل' },
        { q: 'ما أهم عنصر في استمرار المشروع الصغير؟', opts: ['الإنتاج الكثير بأي ثمن', 'الجودة المستمرة وبناء ثقة العميل', 'تخفيض الأسعار باستمرار', 'التوسع السريع دون تخطيط'], correct: 'الجودة المستمرة وبناء ثقة العميل' },
        { q: 'ما أولى خطوات بناء هوية تجارية قوية؟', opts: ['شراء معدات غالية', 'تصميم شعار احترافي واختيار اسم مميز يعكس قيم المنتج', 'نسخ هوية المنافسين', 'التسويق قبل وضع الهوية'], correct: 'تصميم شعار احترافي واختيار اسم مميز يعكس قيم المنتج' },
      ],
      health: [
        { q: 'ما المدى الطبيعي لضغط الدم لدى البالغين؟', opts: ['60/90 ملم زئبق أو أقل', '120/80 ملم زئبق أو أقل', '140/100 ملم زئبق', '160/110 ملم زئبق'], correct: '120/80 ملم زئبق أو أقل' },
        { q: 'ما أهم سلوك لمريض السكري النوع الثاني؟', opts: ['تجنب الرياضة تماماً', 'مراقبة السكر والغذاء وممارسة النشاط البدني المنتظم', 'الاعتماد على الدواء فقط', 'تخطي الوجبات لخفض السكر'], correct: 'مراقبة السكر والغذاء وممارسة النشاط البدني المنتظم' },
        { q: 'ما أول إجراء عند الاشتباه بنوبة قلبية؟', opts: ['شرب الماء والانتظار', 'الاتصال بالإسعاف فوراً وعدم تحريك المصاب', 'إعطاء المريض أسبرين وإسعافه', 'نقله بالسيارة الخاصة للمستشفى'], correct: 'الاتصال بالإسعاف فوراً وعدم تحريك المصاب' },
      ],
      education: [
        { q: 'أي أسلوب يُعزّز التفكير النقدي لدى الطلاب بشكل أفعل؟', opts: ['الإلقاء المباشر وتدوين الملاحظات', 'الأسئلة المفتوحة والنقاش الموجّه', 'الاختبارات الكتابية التقليدية فقط', 'حفظ المفاهيم دون تطبيق'], correct: 'الأسئلة المفتوحة والنقاش الموجّه' },
        { q: 'ما أهم مؤشر على تعلم فعّال داخل الفصل؟', opts: ['صمت الطلاب وانتظامهم التام', 'تفاعل الطلاب وطرحهم للأسئلة', 'انتهاء المعلم من المنهج في الوقت', 'حصول الطلاب على درجات عالية فقط'], correct: 'تفاعل الطلاب وطرحهم للأسئلة' },
        { q: 'ما الفرق بين التقييم التكويني والختامي؟', opts: ['كلاهما نفس الشيء', 'التكويني يقيس التعلم أثناءه لتحسينه، الختامي يقيس المخرجات النهائية', 'التكويني للمعلم فقط والختامي للطالب', 'التكويني كتابي والختامي شفهي'], correct: 'التكويني يقيس التعلم أثناءه لتحسينه، الختامي يقيس المخرجات النهائية' },
      ],
    };

    // Q6 multiple_choice options per domain
    const MC_OPTIONS: Record<string, { pre: string[]; post: string[] }> = {
      youth:     { pre: ['مهارات القيادة والتأثير', 'التواصل الفعّال', 'إدارة الوقت والمهام', 'ريادة الأعمال', 'بناء الثقة بالنفس'], post: ['القيادة الفعّالة', 'التواصل المهني الاحترافي', 'إدارة الوقت والأولويات', 'التفكير الريادي والابتكار', 'التفكير الاستراتيجي'] },
      families:  { pre: ['التسويق الإلكتروني', 'إدارة المال والميزانية', 'تصوير المنتجات', 'التعامل مع العملاء', 'بناء العلامة التجارية'], post: ['التسويق عبر السوشيال ميديا', 'محاسبة المشاريع الصغيرة', 'التصوير الاحترافي', 'خدمة العملاء المتميزة', 'التسعير الاستراتيجي الصحيح'] },
      health:    { pre: ['التغذية الصحية والوقائية', 'إدارة الأمراض المزمنة', 'الإسعافات الأولية', 'الصحة النفسية', 'الوقاية من الأمراض'], post: ['التغذية الوقائية والعلاجية', 'إدارة السكري والضغط', 'الإسعافات الأولية المتقدمة', 'الصحة النفسية والاجتماعية', 'نمط الحياة الصحي المستدام'] },
      education: { pre: ['أساليب التدريس التفاعلية', 'التقنية التعليمية الحديثة', 'إدارة الفصل الدراسي', 'التقييم التكويني المستمر', 'التعلم التعاوني'], post: ['التدريس بالمشاريع الحياتية', 'توظيف الذكاء الاصطناعي', 'إدارة سلوك الطلاب إيجابياً', 'التقييم التكويني الفعّال', 'تحفيز الطلاب وإشراكهم'] },
    };

    const questionsData: any[] = [];

    surveys.forEach((survey, si) => {
      const isPre = si % 2 === 0;
      const qi = Math.floor(si / 2) % 8;
      const activityIdx = Math.floor(si / 2);
      const projectIdx  = Math.floor(activityIdx / 5);
      const domainKey   = DOMAIN_MAP_Q[projectIdx % 8];
      const kqPool      = POST_KNOWLEDGE[domainKey] ?? POST_KNOWLEDGE.youth;
      const kq          = kqPool[activityIdx % kqPool.length];
      const mcOpts      = MC_OPTIONS[domainKey] ?? MC_OPTIONS.youth;

      // Q1: textarea — main open question
      questionsData.push({
        survey: survey._id, order: 1,
        questionText: isPre ? preTextQ1[qi] : postTextQ1[qi],
        type: 'textarea', isRequired: true,
        description: 'يرجى الإجابة بتفصيل كافٍ لا يقل عن جملتين',
      });

      // Q2: textarea — secondary open question
      questionsData.push({
        survey: survey._id, order: 2,
        questionText: isPre ? preTextQ2[qi] : postTextQ2[qi],
        type: 'textarea', isRequired: true,
        description: 'إجابتك ستساعد في تطوير البرنامج وتحسين تجربة المستفيدين',
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
        description: '1 = منخفض جداً، 10 = ممتاز تماماً',
      });

      // Q5: single_choice — pre: experience level / post: knowledge test
      questionsData.push({
        survey: survey._id, order: 5,
        questionText: isPre ? 'ما مستوى خبرتك في هذا المجال؟' : kq.q,
        type: 'single_choice', isRequired: true,
        options: isPre ? preExpOptions[qi % preExpOptions.length] : kq.opts,
      });

      // Q6: multiple_choice — areas needing dev / skills gained
      questionsData.push({
        survey: survey._id, order: 6,
        questionText: isPre
          ? 'ما المجالات التي تحتاج إلى تطوير؟ (اختر كل ما ينطبق)'
          : 'ما المهارات التي طورتها من خلال البرنامج؟ (اختر كل ما ينطبق)',
        type: 'multiple_choice', isRequired: true,
        options: isPre ? mcOpts.pre : mcOpts.post,
      });

      // Q7: yes_no — prior experience / commitment to apply
      questionsData.push({
        survey: survey._id, order: 7,
        questionText: isPre
          ? 'هل سبق لك حضور برامج مشابهة من قبل؟'
          : 'هل ستطبق ما تعلمته في حياتك العملية؟',
        type: 'yes_no', isRequired: true,
      });

      // Q8: number — years of experience / improvement percentage
      questionsData.push({
        survey: survey._id, order: 8,
        questionText: isPre
          ? 'كم سنة خبرتك في هذا المجال؟'
          : 'كم نسبة التحسن التي تشعر بها بعد البرنامج مقارنة بقبله؟ (%)',
        type: 'number', isRequired: false,
        description: isPre ? 'أدخل رقماً من 0 إلى 30' : 'أدخل نسبة مئوية من 0 إلى 100',
      });
    });

    const questions = await this.surveyQuestionModel.insertMany(questionsData);
    this.logger.log(`✅ Created ${questions.length} questions (8 per survey)`);
    return questions;
  }

  // ─── Submissions ───────────────────────────────────────────────────────────
  // KEY INVARIANT: actual_submissions ≤ targetResponses for EVERY survey
  //
  // targetResponses = expected total submission docs (respondents × 8 questions)
  // CLOSED: ratio = 0.70 + (si % 10) × 0.025  → [0.70, 0.925]
  // ACTIVE: ratio = 0.20 + (si % 9)  × 0.04   → [0.20, 0.52]
  // DRAFT:  ratio = 0  → no submissions
  //
  // Pre-survey scores are lower than post-survey (shows program impact)
  private async seedSurveySubmissions(surveys: any[], beneficiaries: any[], questions: any[]) {
    this.logger.log('📨 Seeding survey submissions (8 questions, pre < post scores)...');

    const POOLS = [
      [YOUTH_PRE_TEXTS, YOUTH_POST_TEXTS],
      [YOUTH_PRE_TEXTS, YOUTH_POST_TEXTS],
      [FAMILIES_PRE_TEXTS, FAMILIES_POST_TEXTS],
      [FAMILIES_PRE_TEXTS, FAMILIES_POST_TEXTS],
      [HEALTH_PRE_TEXTS, HEALTH_POST_TEXTS],
      [HEALTH_PRE_TEXTS, HEALTH_POST_TEXTS],
      [EDUCATION_PRE_TEXTS, EDUCATION_POST_TEXTS],
      [EDUCATION_PRE_TEXTS, EDUCATION_POST_TEXTS],
    ];

    const individuals = beneficiaries.filter((b: any) => b.beneficiaryType === BeneficiaryType.INDIVIDUAL);
    const Q = 8; // questions per survey
    let totalInserted = 0;

    for (let si = 0; si < surveys.length; si++) {
      const survey = surveys[si];
      if (survey.status === SurveyStatus.DRAFT) continue;

      const ratio = survey.status === SurveyStatus.CLOSED
        ? 0.70 + (si % 10) * 0.025
        : 0.20 + (si % 9) * 0.04;

      const numRespondents = Math.floor(Math.floor(survey.targetResponses * ratio) / Q);
      if (numRespondents === 0) continue;

      const activityIdx = Math.floor(si / 2);
      const projectIdx  = Math.floor(activityIdx / 5);
      const isPre       = si % 2 === 0;
      const [prePool, postPool] = POOLS[projectIdx % 8];
      const textPool = isPre ? prePool : postPool;

      const qStart = si * Q;
      const sq = questions.slice(qStart, qStart + Q);
      if (sq.length < Q) continue;
      const [q0, q1, q2, q3, q4, q5, q6, q7] = sq;

      const sessionBase = new Date(2025, (activityIdx % 10) + 1, 15);
      const batch: any[] = [];

      for (let bi = 0; bi < numRespondents; bi++) {
        const beneficiary = individuals[bi % individuals.length];
        const startedAt   = new Date(sessionBase.getTime() + bi * 120_000);
        const completedAt = new Date(startedAt.getTime() + (300 + bi * 45) * 1000);
        const base = { survey: survey._id, beneficiary: beneficiary._id, startedAt, completedAt };

        // Q1 & Q2: textarea — text from domain pool
        batch.push({ ...base, question: q0._id, textValue: textPool[bi % textPool.length] });
        batch.push({ ...base, question: q1._id, textValue: textPool[(bi + 7) % textPool.length] });

        // Q3: rating (1-5) — pre: 2-4, post: 3-5 (improvement)
        const ratingVal = isPre ? 2 + (bi % 3) : 3 + (bi % 3);
        batch.push({ ...base, question: q2._id, numberValue: ratingVal });

        // Q4: scale (1-10) — pre: 3-7, post: 6-10 (clear improvement)
        const scaleVal = isPre ? 3 + (bi % 5) : 6 + (bi % 5);
        batch.push({ ...base, question: q3._id, numberValue: scaleVal });

        // Q5: single_choice — pre: spread all levels, post: higher levels (correct answer zone)
        const opts4 = q4.options ?? [];
        const opt4Idx = isPre
          ? bi % Math.max(opts4.length, 1)
          : Math.min(2 + (bi % 2), Math.max(opts4.length - 1, 0));
        batch.push({ ...base, question: q4._id, textValue: opts4[opt4Idx] ?? '' });

        // Q6: multiple_choice — select 2-3 items from options
        const opts5 = q5.options ?? [];
        const arr5: string[] = [];
        const count5 = 2 + (bi % 2);
        for (let k = 0; k < count5 && k < opts5.length; k++) {
          arr5.push(opts5[(bi + k) % opts5.length]);
        }
        batch.push({ ...base, question: q5._id, arrayValue: arr5.length > 0 ? arr5 : opts5.slice(0, 2) });

        // Q7: yes_no — pre: 66% true (had prior exp), post: 80% true (will apply)
        batch.push({ ...base, question: q6._id, booleanValue: isPre ? bi % 3 !== 0 : bi % 5 !== 0 });

        // Q8: number — pre: years experience (0-10), post: improvement % (10-85)
        const numVal = isPre ? bi % 11 : 10 + (bi % 76);
        batch.push({ ...base, question: q7._id, numberValue: numVal });
      }

      for (let i = 0; i < batch.length; i += 500) {
        await this.submissionModel.insertMany(batch.slice(i, i + 500));
      }
      totalInserted += batch.length;
    }

    this.logger.log(`✅ Created ${totalInserted} submissions`);
    return totalInserted;
  }

  // ─── Correct Answers ──────────────────────────────────────────────────────
  private async seedCorrectAnswers(surveys: any[], questions: any[]) {
    this.logger.log('✔️  Seeding correct answers...');

    const DOMAIN_MAP_CA = ['youth', 'youth', 'families', 'families', 'health', 'health', 'education', 'education'];

    // Correct answers for post Q5 knowledge questions (must match POST_KNOWLEDGE in seedSurveyQuestions)
    const POST_CORRECT: Record<string, string[]> = {
      youth:     ['تحديد المشكلة وجمهورها المستهدف', 'الرؤية والتواصل والتأثير الإيجابي', 'محددة وقابلة للقياس وقابلة للتحقيق وذات صلة ومحددة زمنياً'],
      families:  ['تكلفة الإنتاج + هامش ربح + قيمة المنتج للعميل', 'الجودة المستمرة وبناء ثقة العميل', 'تصميم شعار احترافي واختيار اسم مميز يعكس قيم المنتج'],
      health:    ['120/80 ملم زئبق أو أقل', 'مراقبة السكر والغذاء وممارسة النشاط البدني المنتظم', 'الاتصال بالإسعاف فوراً وعدم تحريك المصاب'],
      education: ['الأسئلة المفتوحة والنقاش الموجّه', 'تفاعل الطلاب وطرحهم للأسئلة', 'التكويني يقيس التعلم أثناءه لتحسينه، الختامي يقيس المخرجات النهائية'],
    };

    const Q = 8;
    const correctAnswers: any[] = [];

    for (let si = 0; si < surveys.length; si++) {
      const isPre  = si % 2 === 0;
      const qStart = si * Q;
      const sq     = questions.slice(qStart, qStart + Q);
      if (sq.length < Q) continue;
      // q0=textarea, q1=textarea, q2=rating, q3=scale, q4=single_choice, q5=multiple_choice, q6=yes_no, q7=number
      const [,, q2, q3, q4,, q6, q7] = sq;

      // Q3 (rating 1-5): expected — pre=3, post=4
      correctAnswers.push({ question: q2._id, numberValue: isPre ? 3 : 4 });

      // Q4 (scale 1-10): expected — pre=5, post=8
      correctAnswers.push({ question: q3._id, numberValue: isPre ? 5 : 8 });

      if (!isPre) {
        // Q5 (single_choice): correct knowledge test answer
        const activityIdx  = Math.floor(si / 2);
        const projectIdx   = Math.floor(activityIdx / 5);
        const domain       = DOMAIN_MAP_CA[projectIdx % 8];
        const correctPool  = POST_CORRECT[domain] ?? POST_CORRECT.youth;
        correctAnswers.push({ question: q4._id, textValue: correctPool[activityIdx % correctPool.length] });

        // Q7 (yes_no): post must be true (commitment to apply)
        correctAnswers.push({ question: q6._id, booleanValue: true });

        // Q8 (number): minimum expected improvement 30%
        correctAnswers.push({ question: q7._id, numberValue: 30 });
      }
    }

    await this.correctAnswerModel.insertMany(correctAnswers);
    this.logger.log(`✅ Created ${correctAnswers.length} correct answers`);
    return correctAnswers;
  }

  // ─── Indicators (3 per project = 24 total) ────────────────────────────────
  private async seedIndicators(projects: any[]) {
    this.logger.log('📊 Seeding 24 indicators (3 per project)...');

    type IndTemplate = { name: string; type: IndicatorType; target: number; actual: number; unit: MeasurementUnit; baseline: number; method: string; description: string };

    const TEMPLATES: Record<string, IndTemplate[]> = {
      youth: [
        { name: 'عدد الشباب المستفيدين المدرّبين', type: IndicatorType.OUTPUT, target: 2000, actual: 1450, unit: MeasurementUnit.NUMBER, baseline: 0, method: 'سجلات الحضور وشهادات الإتمام', description: 'إجمالي عدد الشباب الذين أكملوا البرنامج التدريبي بنجاح' },
        { name: 'نسبة التحسن في المهارات القيادية', type: IndicatorType.OUTCOME, target: 35, actual: 27, unit: MeasurementUnit.PERCENTAGE, baseline: 0, method: 'مقارنة نتائج الاختبارات القبلية والبعدية', description: 'متوسط نسبة التحسن في درجات تقييم المهارات' },
        { name: 'معدل توظيف المستفيدين بعد 6 أشهر', type: IndicatorType.IMPACT, target: 65, actual: 51, unit: MeasurementUnit.PERCENTAGE, baseline: 30, method: 'استبيان متابعة بعد 6 أشهر', description: 'نسبة المشاركين الذين حصلوا على وظيفة أو بدأوا مشروعاً' },
      ],
      families: [
        { name: 'عدد الأسر التي أطلقت مشاريع منزلية', type: IndicatorType.OUTPUT, target: 800, actual: 542, unit: MeasurementUnit.NUMBER, baseline: 0, method: 'تسجيل الأسر التي قدمت خطة عمل وبدأت التنفيذ', description: 'عدد الأسر التي بدأت فعلياً تنفيذ مشاريع مدرة للدخل' },
        { name: 'متوسط الدخل الشهري الإضافي للأسرة', type: IndicatorType.OUTCOME, target: 3500, actual: 2380, unit: MeasurementUnit.CURRENCY, baseline: 0, method: 'استبيان شهري ميداني لقياس إيرادات الأسر', description: 'متوسط الدخل الإضافي الذي حققته الأسر من مشاريعها' },
        { name: 'معدل نجاة المشاريع بعد سنة', type: IndicatorType.IMPACT, target: 70, actual: 57, unit: MeasurementUnit.PERCENTAGE, baseline: 0, method: 'متابعة سنوية للمشاريع المسجلة في البرنامج', description: 'نسبة المشاريع التي استمرت في العمل بعد سنة كاملة' },
      ],
      health: [
        { name: 'عدد المستفيدين من الفحوصات الصحية الدورية', type: IndicatorType.OUTPUT, target: 5000, actual: 3720, unit: MeasurementUnit.NUMBER, baseline: 0, method: 'سجلات الفحوصات الطبية وبطاقات المتابعة', description: 'إجمالي عدد الأفراد الذين أجروا فحوصات دورية من خلال البرنامج' },
        { name: 'نسبة الوعي بعوامل الخطر الصحية', type: IndicatorType.OUTCOME, target: 80, actual: 68, unit: MeasurementUnit.PERCENTAGE, baseline: 35, method: 'اختبار معرفي في التقييم القبلي والبعدي', description: 'نسبة المشاركين الذين أثبتوا وعياً كافياً بعوامل الخطر' },
        { name: 'نسبة الانخفاض في مضاعفات الأمراض المزمنة', type: IndicatorType.IMPACT, target: 25, actual: 17, unit: MeasurementUnit.PERCENTAGE, baseline: 0, method: 'مراجعة سجلات المستشفيات والإسعاف', description: 'معدل انخفاض مضاعفات الأمراض في المناطق المستهدفة' },
      ],
      education: [
        { name: 'عدد المعلمين الذين أكملوا برامج التطوير', type: IndicatorType.OUTPUT, target: 1000, actual: 768, unit: MeasurementUnit.NUMBER, baseline: 0, method: 'شهادات الإتمام وسجلات الحضور الرسمية', description: 'إجمالي عدد المعلمين الذين أتموا برامج التطوير المهني' },
        { name: 'معدل تطبيق الأساليب الحديثة في الفصل', type: IndicatorType.OUTCOME, target: 75, actual: 61, unit: MeasurementUnit.PERCENTAGE, baseline: 20, method: 'زيارات صفية تقييمية من قِبل المشرفين التربويين', description: 'نسبة المعلمين المدرّبين الذين يطبقون الأساليب الجديدة بانتظام' },
        { name: 'نسبة تحسن التحصيل الدراسي للطلاب', type: IndicatorType.IMPACT, target: 20, actual: 14, unit: MeasurementUnit.PERCENTAGE, baseline: 0, method: 'مقارنة نتائج الاختبارات المدرسية قبل وبعد التدريب', description: 'متوسط نسبة التحسن في درجات الطلاب لدى المعلمين المدرّبين' },
      ],
    };

    const DOMAIN_MAP = ['youth', 'youth', 'families', 'families', 'health', 'health', 'education', 'education'];

    const allData: any[] = [];
    projects.forEach((_, pi) => {
      const domain = DOMAIN_MAP[pi % 8];
      const variance = pi % 2 === 1 ? 0.88 : 1.0; // second project in domain slightly lower
      TEMPLATES[domain].forEach((tmpl) => {
        allData.push({
          name: tmpl.name,
          description: tmpl.description,
          indicatorType: tmpl.type,
          measurementMethod: tmpl.method,
          targetValue: tmpl.target,
          actualValue: Math.round(tmpl.actual * variance),
          unit: tmpl.unit,
          baselineValue: tmpl.baseline,
          trend: TrendDirection.IMPROVING,
          isActive: true,
        });
      });
    });

    const indicators = await this.indicatorModel.insertMany(allData);

    // Link 3 indicators per project
    await Promise.all(
      projects.map((project, pi) =>
        this.projectModel.findByIdAndUpdate(project._id, {
          $set: { indicators: indicators.slice(pi * 3, pi * 3 + 3).map((ind) => ind._id) },
        }),
      ),
    );

    this.logger.log(`✅ Created ${indicators.length} indicators linked to projects`);
    return indicators;
  }

  // ─── Indicator History (4 quarterly records per indicator = 96 total) ──────
  private async seedIndicatorHistory(indicators: any[]) {
    this.logger.log('📈 Seeding 96 indicator history records (4 per indicator)...');

    const historyData: any[] = [];
    indicators.forEach((ind, i) => {
      const target = ind.targetValue;
      const actual = ind.actualValue;
      const q1 = Math.round(actual * 0.25);
      const q2 = Math.round(actual * 0.50);
      const q3 = Math.round(actual * 0.75);
      const q4 = actual;

      const quarters = [
        { value: q1, date: new Date(`2025-0${2 + (i % 3)}-01`), source: 'تقرير الربع الأول',  prev: ind.baselineValue ?? 0 },
        { value: q2, date: new Date(`2025-0${5 + (i % 3)}-01`), source: 'تقرير الربع الثاني', prev: q1 },
        { value: q3, date: new Date(`2025-${9 + (i % 2) < 10 ? '0' : ''}${9 + (i % 2)}-01`), source: 'تقرير الربع الثالث', prev: q2 },
        { value: q4, date: new Date('2026-01-15'),               source: 'تقرير نهاية العام',  prev: q3 },
      ];

      quarters.forEach((q, qi) => {
        const changeAmt = q.value - q.prev;
        const changePct = q.prev > 0 ? Math.round((changeAmt / q.prev) * 100) : 0;
        historyData.push({
          indicator: ind._id,
          recordedValue: q.value,
          calculatedAt: q.date,
          source: q.source,
          notes: qi === 3
            ? `القيمة النهائية — ${Math.round((actual / target) * 100)}% من الهدف المحدد (${target})`
            : `تقدم مستمر نحو الهدف (${target}) — اكتمل ${Math.round((q.value / target) * 100)}%`,
          previousValue: q.prev,
          changeAmount: changeAmt,
          changePercentage: changePct,
          status: qi < 3 ? 'verified' : 'recorded',
        });
      });
    });

    await this.indicatorHistoryModel.insertMany(historyData);
    this.logger.log(`✅ Created ${historyData.length} indicator history entries`);
    return historyData;
  }
}
