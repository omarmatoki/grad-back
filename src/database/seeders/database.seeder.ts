import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import * as bcrypt from 'bcrypt';

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
import { IndicatorHistory } from '../../modules/indicators/schemas/indicator-history.schema';

// ─────────────────────────────────────────────────────────────────────────────
// Text response pools — 20 varied Arabic texts per project theme
// Mix of positive, neutral, and critical to give AI rich sentiment signals
// ─────────────────────────────────────────────────────────────────────────────

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
    this.logger.log('🌱 Starting database seeding...');

    try {
      await this.clearDatabase();

      const users        = await this.seedUsers();
      const projects     = await this.seedProjects(users);
      const beneficiaries = await this.seedBeneficiaries();
      const activities   = await this.seedActivities(projects);
      const participants = await this.seedParticipants(beneficiaries);
      const surveys      = await this.seedSurveys(activities);
      const questions    = await this.seedSurveyQuestions(surveys);
      const submissions  = await this.seedSurveySubmissions(surveys, beneficiaries, questions);
      const correctAnswers = await this.seedCorrectAnswers(surveys, questions);
      const indicators   = await this.seedIndicators(projects);
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

  // ─── Clear all collections ────────────────────────────────────────────────
  private async clearDatabase() {
    this.logger.log('🗑️  Clearing existing data...');
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
    await this.projectModel.deleteMany({});
    await this.userModel.deleteMany({});

    // Drop obsolete surveyresponses collection if it exists
    try {
      await this.connection.db!.dropCollection('surveyresponses');
      this.logger.log('🗑️  Dropped obsolete surveyresponses collection');
    } catch {
      // Collection doesn't exist — that's fine
    }

    this.logger.log('✅ Database cleared');
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

    this.logger.log(`✅ Created ${users.length} users`);
    return users;
  }

  // ─── Projects (4 different sectors) ──────────────────────────────────────
  private async seedProjects(users: any[]) {
    this.logger.log('📁 Seeding projects...');

    const projects = await this.projectModel.insertMany([
      {
        user_id: users[0]._id,
        name: 'برنامج تمكين الشباب',
        description: 'برنامج تدريبي شامل يهدف إلى تمكين الشباب وتطوير مهاراتهم القيادية والمهنية والحياتية وتهيئتهم لسوق العمل',
        type: 'تمكين شبابي',
        status: ProjectStatus.IN_PROGRESS,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2026-12-31'),
        location: 'الرياض',
        targetGroups: ['الشباب من 18-35 سنة', 'الخريجون الجدد', 'الباحثون عن عمل'],
        goals: {
          short_term: ['تطوير المهارات القيادية', 'بناء الثقة بالنفس', 'تحسين مهارات التواصل'],
          long_term: ['تأهيل 1000 شاب لسوق العمل', 'خفض معدل البطالة', 'بناء قادة المستقبل'],
        },
        budget: { total: 5000000, spent: 2100000, currency: 'SAR' },
      },
      {
        user_id: users[1]._id,
        name: 'مبادرة الأسر المنتجة',
        description: 'دعم الأسر وربات المنازل لإنشاء مشاريع منزلية مدرة للدخل وتطوير مهاراتهن في إدارة الأعمال والتسويق',
        type: 'تمكين اقتصادي',
        status: ProjectStatus.IN_PROGRESS,
        startDate: new Date('2025-03-01'),
        endDate: new Date('2026-06-30'),
        location: 'جدة',
        targetGroups: ['ربات المنازل', 'الأسر ذات الدخل المحدود', 'النساء الراغبات في العمل'],
        goals: {
          short_term: ['تعليم مهارات التسويق الإلكتروني', 'تطوير المنتجات', 'فهم إدارة المال'],
          long_term: ['تمكين 500 أسرة من تحقيق دخل إضافي', 'خلق بيئة أعمال نسائية', 'تعزيز الاستقلالية الاقتصادية'],
        },
        budget: { total: 2000000, spent: 780000, currency: 'SAR' },
      },
      {
        user_id: users[2]._id,
        name: 'برنامج الصحة المجتمعية',
        description: 'تعزيز الوعي الصحي ونشر ثقافة الوقاية والعيش الصحي في المجتمع من خلال برامج تثقيفية وتدريبية متخصصة',
        type: 'توعية صحية',
        status: ProjectStatus.IN_PROGRESS,
        startDate: new Date('2025-02-01'),
        endDate: new Date('2026-01-31'),
        location: 'الدمام',
        targetGroups: ['المجتمع العام', 'مرضى الأمراض المزمنة', 'الأسر', 'كبار السن'],
        goals: {
          short_term: ['رفع الوعي الصحي', 'تعليم الإسعافات الأولية', 'تشجيع الفحص الدوري'],
          long_term: ['خفض معدل الأمراض المزمنة', 'بناء مجتمع صحي واعٍ', 'تحسين جودة الحياة'],
        },
        budget: { total: 1500000, spent: 650000, currency: 'SAR' },
      },
      {
        user_id: users[3]._id,
        name: 'مشروع تطوير التعليم',
        description: 'تطوير مهارات المعلمين وتحديث أساليبهم التدريسية باستخدام التقنية والأساليب التعليمية الحديثة لرفع جودة التعليم',
        type: 'تطوير تعليمي',
        status: ProjectStatus.IN_PROGRESS,
        startDate: new Date('2025-04-01'),
        endDate: new Date('2026-03-31'),
        location: 'مكة المكرمة',
        targetGroups: ['المعلمون', 'المشرفون التربويون', 'قادة المدارس'],
        goals: {
          short_term: ['تطوير أساليب التدريس', 'توظيف التقنية التعليمية', 'تحسين بيئة التعلم'],
          long_term: ['رفع مستوى التحصيل الدراسي', 'تحديث المنظومة التعليمية', 'تأهيل جيل قادر على الإبداع'],
        },
        budget: { total: 3000000, spent: 1100000, currency: 'SAR' },
      },
    ]);

    this.logger.log(`✅ Created ${projects.length} projects`);
    return projects;
  }

  // ─── Beneficiaries (40 individuals) ──────────────────────────────────────
  private async seedBeneficiaries() {
    this.logger.log('👥 Seeding 40 beneficiaries...');

    const names = [
      ['عبدالله محمد السعيد', 'male', 24, 'الرياض'],
      ['نورة أحمد القحطاني', 'female', 26, 'الرياض'],
      ['خالد عبدالرحمن المطيري', 'male', 29, 'الرياض'],
      ['سارة إبراهيم الزهراني', 'female', 23, 'الرياض'],
      ['محمد فهد العتيبي', 'male', 31, 'جدة'],
      ['هدى خالد العمري', 'female', 28, 'جدة'],
      ['علي سعد الشهري', 'male', 27, 'جدة'],
      ['منى عبدالله الحربي', 'female', 32, 'جدة'],
      ['طارق يوسف الدوسري', 'male', 25, 'الدمام'],
      ['ريم محمد الغامدي', 'female', 30, 'الدمام'],
      ['فيصل عمر الرشيدي', 'male', 35, 'الدمام'],
      ['لطيفة ناصر البلوي', 'female', 22, 'الدمام'],
      ['عمر سلطان القرني', 'male', 33, 'مكة المكرمة'],
      ['أسماء حمد الأسمري', 'female', 27, 'مكة المكرمة'],
      ['يوسف راشد الثبيتي', 'male', 26, 'مكة المكرمة'],
      ['أميرة عبدالعزيز الجهني', 'female', 29, 'مكة المكرمة'],
      ['بندر سعيد العنزي', 'male', 34, 'الرياض'],
      ['وفاء محمد الشمري', 'female', 36, 'الرياض'],
      ['حمد عبدالله الحميد', 'male', 28, 'جدة'],
      ['نوف سليمان القاسم', 'female', 31, 'جدة'],
      ['سعود فواز المالكي', 'male', 23, 'الدمام'],
      ['عزة خالد العسيري', 'female', 25, 'الدمام'],
      ['رائد علي الصاعدي', 'male', 30, 'مكة المكرمة'],
      ['شيماء سعد الجبري', 'female', 24, 'مكة المكرمة'],
      ['ماجد نايف السبيعي', 'male', 32, 'الرياض'],
      ['دلال محمد الزياني', 'female', 27, 'الرياض'],
      ['فهد طلال البقمي', 'male', 29, 'جدة'],
      ['إيمان عبدالرحمن السلمي', 'female', 33, 'جدة'],
      ['عادل حسن المرزوقي', 'male', 26, 'الدمام'],
      ['رنا يوسف الحسيني', 'female', 28, 'الدمام'],
      ['وليد سعد الوادعي', 'male', 31, 'مكة المكرمة'],
      ['هنوف فهد الرويلي', 'female', 22, 'مكة المكرمة'],
      ['زياد عمر العجمي', 'male', 35, 'الرياض'],
      ['ميسون خالد الشريف', 'female', 30, 'الرياض'],
      ['أحمد وليد المقرن', 'male', 27, 'جدة'],
      ['لبنى ناصر الخضيري', 'female', 26, 'جدة'],
      ['تركي جاسم الحربي', 'male', 24, 'الدمام'],
      ['هيفاء سلطان الموسى', 'female', 32, 'الدمام'],
      ['مساعد حمود العنزي', 'male', 29, 'مكة المكرمة'],
      ['جواهر فيصل السدحان', 'female', 25, 'مكة المكرمة'],
    ];

    const educations = ['بكالوريوس', 'ماجستير', 'دبلوم', 'ثانوي', 'بكالوريوس', 'بكالوريوس'];
    const professions = ['باحث عن عمل', 'موظف', 'ربة منزل', 'معلم', 'طالب', 'مدرب'];

    const beneficiaries = await this.beneficiaryModel.insertMany(
      names.map(([name, gender, age, city], i) => ({
        beneficiaryType: BeneficiaryType.INDIVIDUAL,
        name,
        gender,
        age,
        city,
        region: ['الوسطى', 'مكة المكرمة', 'الشرقية', 'مكة المكرمة'][i % 4],
        educationLevel: educations[i % educations.length],
        profession: professions[i % professions.length],
        phone: `+9665${String(10000000 + i).slice(1)}`,
      })),
    );

    this.logger.log(`✅ Created ${beneficiaries.length} beneficiaries`);
    return beneficiaries;
  }

  // ─── Activities (3 per project = 12 total) ───────────────────────────────
  private async seedActivities(projects: any[]) {
    this.logger.log('📅 Seeding activities...');

    const activitiesData = [
      // ── Project 0: Youth Empowerment ──────────────────────────────────────
      {
        project: projects[0]._id,
        title: 'ورشة مهارات القيادة والتأثير',
        description: 'ورشة تدريبية مكثفة لتطوير مهارات القيادة الفعالة وبناء القدرة على التأثير الإيجابي',
        activityDate: new Date('2025-03-15'),
        startTime: '09:00', endTime: '16:00',
        location: 'قاعة المؤتمرات — فندق الرياض الكبير',
        capacity: 60, registeredCount: 55,
        activityType: ActivityType.WORKSHOP,
        status: ActivityStatus.COMPLETED,
        tags: ['قيادة', 'تأثير', 'تطوير'],
      },
      {
        project: projects[0]._id,
        title: 'دورة البرمجة والذكاء الاصطناعي للمبتدئين',
        description: 'تعلم أساسيات البرمجة بـ Python وتطبيقات الذكاء الاصطناعي في حل مشكلات العمل',
        activityDate: new Date('2025-06-20'),
        startTime: '17:00', endTime: '21:00',
        location: 'معمل الحاسب — جامعة الملك سعود',
        capacity: 40, registeredCount: 38,
        activityType: ActivityType.TRAINING,
        status: ActivityStatus.COMPLETED,
        tags: ['برمجة', 'ذكاء اصطناعي', 'تقنية'],
      },
      {
        project: projects[0]._id,
        title: 'ملتقى ريادة الأعمال الشبابي',
        description: 'ملتقى يجمع رواد الأعمال الناجحين مع الشباب الطامحين لتبادل الخبرات وبناء الشبكات',
        activityDate: new Date('2025-10-10'),
        startTime: '10:00', endTime: '18:00',
        location: 'مركز الملك عبدالعزيز الثقافي',
        capacity: 150, registeredCount: 140,
        activityType: ActivityType.SEMINAR,
        status: ActivityStatus.COMPLETED,
        tags: ['ريادة', 'شبكات', 'أعمال'],
      },

      // ── Project 1: Productive Families ────────────────────────────────────
      {
        project: projects[1]._id,
        title: 'ورشة التسويق الإلكتروني للمشاريع المنزلية',
        description: 'استراتيجيات عملية للتسويق عبر وسائل التواصل الاجتماعي وبناء متجر إلكتروني ناجح',
        activityDate: new Date('2025-04-10'),
        startTime: '10:00', endTime: '15:00',
        location: 'مركز تدريب سيدات الأعمال — جدة',
        capacity: 50, registeredCount: 47,
        activityType: ActivityType.WORKSHOP,
        status: ActivityStatus.COMPLETED,
        tags: ['تسويق', 'إلكتروني', 'مشاريع'],
      },
      {
        project: projects[1]._id,
        title: 'دورة إدارة المشاريع الصغيرة والتمويل',
        description: 'أساسيات إدارة المشاريع المنزلية الصغيرة وكيفية الوصول إلى مصادر التمويل المتاحة',
        activityDate: new Date('2025-07-25'),
        startTime: '16:00', endTime: '20:00',
        location: 'مركز التميز للمرأة العاملة',
        capacity: 45, registeredCount: 42,
        activityType: ActivityType.TRAINING,
        status: ActivityStatus.COMPLETED,
        tags: ['إدارة', 'تمويل', 'مشاريع صغيرة'],
      },
      {
        project: projects[1]._id,
        title: 'معرض المنتجات المحلية والبازار السنوي',
        description: 'معرض سنوي يتيح للمستفيدات عرض وبيع منتجاتهن وبناء قاعدة عملاء حقيقية',
        activityDate: new Date('2025-11-05'),
        startTime: '09:00', endTime: '21:00',
        location: 'مركز جدة الدولي للمعارض',
        capacity: 100, registeredCount: 95,
        activityType: ActivityType.SEMINAR,
        status: ActivityStatus.COMPLETED,
        tags: ['معرض', 'منتجات', 'بيع'],
      },

      // ── Project 2: Community Health ───────────────────────────────────────
      {
        project: projects[2]._id,
        title: 'ورشة الإسعافات الأولية والحوادث المنزلية',
        description: 'تدريب عملي على مهارات الإسعافات الأولية والتعامل الصحيح مع حالات الطوارئ المنزلية',
        activityDate: new Date('2025-03-20'),
        startTime: '09:00', endTime: '14:00',
        location: 'المركز الصحي الشامل — حي الفيصلية',
        capacity: 40, registeredCount: 38,
        activityType: ActivityType.WORKSHOP,
        status: ActivityStatus.COMPLETED,
        tags: ['إسعافات', 'طوارئ', 'صحة'],
      },
      {
        project: projects[2]._id,
        title: 'برنامج إدارة الأمراض المزمنة',
        description: 'برنامج تثقيفي شامل للمرضى المزمنين وذويهم حول إدارة الحالات الصحية وتحسين جودة الحياة',
        activityDate: new Date('2025-06-15'),
        startTime: '16:00', endTime: '19:00',
        location: 'مستشفى الملك فهد التخصصي',
        capacity: 60, registeredCount: 55,
        activityType: ActivityType.TRAINING,
        status: ActivityStatus.COMPLETED,
        tags: ['أمراض مزمنة', 'سكري', 'ضغط'],
      },
      {
        project: projects[2]._id,
        title: 'يوم الصحة المجتمعي المفتوح',
        description: 'فعالية مجتمعية مفتوحة تشمل فحوصات مجانية ومحاضرات توعوية وورش صحة نفسية',
        activityDate: new Date('2025-09-22'),
        startTime: '08:00', endTime: '20:00',
        location: 'الحديقة العامة — حي النسيم',
        capacity: 500, registeredCount: 420,
        activityType: ActivityType.SEMINAR,
        status: ActivityStatus.COMPLETED,
        tags: ['توعية', 'فحص', 'مجتمع'],
      },

      // ── Project 3: Education Development ─────────────────────────────────
      {
        project: projects[3]._id,
        title: 'ورشة الأساليب التدريسية التفاعلية الحديثة',
        description: 'تطوير مهارات المعلمين في توظيف الأساليب التدريسية الحديثة والتعلم النشط والتعاوني',
        activityDate: new Date('2025-05-12'),
        startTime: '08:00', endTime: '15:00',
        location: 'مركز التطوير التربوي — مكة المكرمة',
        capacity: 50, registeredCount: 48,
        activityType: ActivityType.WORKSHOP,
        status: ActivityStatus.COMPLETED,
        tags: ['أساليب تدريسية', 'تفاعل', 'تطوير'],
      },
      {
        project: projects[3]._id,
        title: 'دورة التقنية التعليمية وأدوات الذكاء الاصطناعي',
        description: 'تدريب عملي على أحدث الأدوات والتقنيات التعليمية الرقمية وتطبيقات الذكاء الاصطناعي',
        activityDate: new Date('2025-08-18'),
        startTime: '09:00', endTime: '16:00',
        location: 'معمل الحاسب التعليمي — جامعة أم القرى',
        capacity: 35, registeredCount: 33,
        activityType: ActivityType.TRAINING,
        status: ActivityStatus.COMPLETED,
        tags: ['تقنية', 'ذكاء اصطناعي', 'تعليم'],
      },
      {
        project: projects[3]._id,
        title: 'مؤتمر التعليم المستدام ورؤية 2030',
        description: 'مؤتمر تربوي يناقش مستقبل التعليم في ضوء رؤية 2030 وتحديات القرن الحادي والعشرين',
        activityDate: new Date('2025-12-01'),
        startTime: '08:00', endTime: '17:00',
        location: 'قاعة المؤتمرات الكبرى — فندق هيلتون',
        capacity: 200, registeredCount: 185,
        activityType: ActivityType.SEMINAR,
        status: ActivityStatus.COMPLETED,
        tags: ['مؤتمر', 'رؤية 2030', 'تعليم مستدام'],
      },
    ];

    const activities = await this.activityModel.insertMany(activitiesData);
    this.logger.log(`✅ Created ${activities.length} activities`);
    return activities;
  }

  // ─── Participants (sample) ────────────────────────────────────────────────
  private async seedParticipants(beneficiaries: any[]) {
    this.logger.log('🎓 Seeding participants...');
    const genders = [Gender.MALE, Gender.FEMALE];
    const participants = await this.participantModel.insertMany(
      beneficiaries.slice(0, 20).map((b, i) => ({
        beneficiary: b._id,
        fullName: b.name,
        email: `participant${i + 1}@example.com`,
        phone: b.phone,
        age: b.age,
        gender: genders[i % 2],
        city: b.city,
        educationLevel: b.educationLevel,
        occupation: b.profession,
        status: i % 5 === 4 ? ParticipantStatus.COMPLETED : ParticipantStatus.ACTIVE,
      })),
    );
    this.logger.log(`✅ Created ${participants.length} participants`);
    return participants;
  }

  // ─── Surveys (2 per activity = 24 total) ─────────────────────────────────
  private async seedSurveys(activities: any[]) {
    this.logger.log('📝 Seeding surveys...');

    const preTitles = [
      'استبيان دراسة الاحتياج — قبل التدريب',
      'تقييم الاحتياجات التدريبية القبلية',
      'مسح الاحتياجات قبل الانضمام للبرنامج',
      'استبيان التوقعات والأهداف القبلي',
    ];
    const postTitles = [
      'استبيان الرضا والتقييم البعدي',
      'قياس الأثر والنتائج بعد البرنامج',
      'تقييم الفائدة والتطبيق بعد التدريب',
      'استبيان المتابعة وقياس التحسن',
    ];

    const surveysData: any[] = [];
    activities.forEach((activity, i) => {
      surveysData.push({
        activity: activity._id,
        title: `${preTitles[i % preTitles.length]} — ${activity.title.substring(0, 30)}`,
        description: 'يهدف هذا الاستبيان إلى قياس مستوى المعرفة والاحتياجات قبل بدء البرنامج لتصميم محتوى مناسب',
        type: SurveyType.EVALUATION,
        status: SurveyStatus.CLOSED,
        targetResponses: 40,
        totalResponses: 38,
        isAnonymous: false,
      });
      surveysData.push({
        activity: activity._id,
        title: `${postTitles[i % postTitles.length]} — ${activity.title.substring(0, 30)}`,
        description: 'يقيس هذا الاستبيان مدى تحقق الأهداف التعليمية ومستوى رضا المستفيدين عن البرنامج',
        type: SurveyType.SATISFACTION,
        status: SurveyStatus.CLOSED,
        targetResponses: 40,
        totalResponses: 36,
        isAnonymous: false,
      });
    });

    const surveys = await this.surveyModel.insertMany(surveysData);
    this.logger.log(`✅ Created ${surveys.length} surveys`);
    return surveys;
  }

  // ─── Questions (5 per survey, 2 text) ────────────────────────────────────
  private async seedSurveyQuestions(surveys: any[]) {
    this.logger.log('❓ Seeding survey questions...');

    // Pre-survey (even index) question templates
    const preTextQ1 = [
      'ما هي أهدافك الرئيسية من المشاركة في هذا البرنامج؟',
      'ما الذي تأمل في تعلمه أو تطويره خلال هذا البرنامج؟',
      'ما هي التحديات التي تواجهها حالياً في هذا المجال؟',
      'كيف تصف وضعك الحالي قبل الانضمام لهذا البرنامج؟',
    ];
    const preTextQ2 = [
      'ما هي توقعاتك من هذا البرنامج وكيف تأمل أن يغير حياتك؟',
      'صِف بإيجاز خبرتك السابقة في هذا المجال وأبرز تحدياتك؟',
      'ما الذي يمنعك حتى الآن من تحقيق أهدافك في هذا المجال؟',
      'ما هو أكبر تحدٍ شخصي أو مهني تريد التغلب عليه؟',
    ];
    // Post-survey (odd index) question templates
    const postTextQ1 = [
      'ما هي أهم ثلاثة أشياء استفدتها من هذا البرنامج وكيف ستطبقها؟',
      'كيف أثّر هذا البرنامج على نظرتك أو أسلوبك أو طريقة تفكيرك؟',
      'ما الذي تغير فيك أو في أسلوبك بعد المشاركة في هذا البرنامج؟',
      'ما أبرز المكاسب التي حققتها من هذا البرنامج التدريبي؟',
    ];
    const postTextQ2 = [
      'ما هي اقتراحاتك لتحسين البرنامج وجعله أكثر فائدة؟',
      'هل تنصح الآخرين بالمشاركة في هذا البرنامج؟ ولماذا؟',
      'ما الجوانب التي أعجبتك وما التي تحتاج إلى تطوير؟',
      'كيف تقيّم تجربتك الكاملة في البرنامج بكلماتك الخاصة؟',
    ];

    const singleOptions = [
      ['مبتدئ تماماً', 'لديّ خبرة بسيطة', 'خبرة متوسطة', 'خبير ومتقدم'],
      ['أقل من سنة', 'من 1-3 سنوات', 'من 3-5 سنوات', 'أكثر من 5 سنوات'],
      ['للمرة الأولى', 'سبق لي الحضور مرة', 'حضرت عدة مرات', 'مشارك منتظم'],
      ['18-24 سنة', '25-30 سنة', '31-40 سنة', 'أكثر من 40 سنة'],
    ];

    const questionsData: any[] = [];
    surveys.forEach((survey, si) => {
      const isPre = si % 2 === 0;
      const qi = Math.floor(si / 2) % 4;

      questionsData.push({
        survey: survey._id,
        questionText: isPre ? preTextQ1[qi] : postTextQ1[qi],
        type: 'textarea',
        isRequired: true,
        description: 'يرجى الإجابة بتفصيل كافٍ لا يقل عن جملتين',
      });
      questionsData.push({
        survey: survey._id,
        questionText: isPre ? preTextQ2[qi] : postTextQ2[qi],
        type: 'textarea',
        isRequired: true,
        description: 'إجابتك ستساعد في تطوير البرنامج وتحسين تجربة المستفيدين',
      });
      questionsData.push({
        survey: survey._id,
        questionText: isPre ? 'قيّم مستوى معرفتك الحالية في هذا المجال من 1 إلى 10' : 'قيّم البرنامج بشكل عام من 1 إلى 10',
        type: 'rating',
        isRequired: true,
      });
      questionsData.push({
        survey: survey._id,
        questionText: isPre ? 'ما مستوى خبرتك في هذا المجال؟' : 'ما مدى استيعابك للمحتوى المقدم؟',
        type: 'single_choice',
        options: isPre ? singleOptions[qi] : ['لم أستوعب كثيراً', 'استوعبت القليل', 'استوعبت المعظم', 'استوعبت بالكامل'],
        isRequired: true,
      });
      questionsData.push({
        survey: survey._id,
        questionText: isPre ? 'هل سبق لك حضور برامج مشابهة من قبل؟' : 'هل ستطبق ما تعلمته في حياتك العملية؟',
        type: 'yes_no',
        isRequired: true,
      });
    });

    const questions = await this.surveyQuestionModel.insertMany(questionsData);
    this.logger.log(`✅ Created ${questions.length} questions (${surveys.length * 2} text questions)`);
    return questions;
  }

  // ─── Submissions ──────────────────────────────────────────────────────────
  // Strategy: for each survey, pick 20 beneficiaries and generate submissions.
  // For textarea questions — use the themed text pool (cycling).
  // For other questions — generate sensible typed values.
  private async seedSurveySubmissions(surveys: any[], beneficiaries: any[], questions: any[]) {
    this.logger.log('📨 Seeding survey submissions (~1200 text responses)...');

    // Determine which text pool to use based on activity/project index (survey index maps back)
    // surveys[0,1]  = activity 0 (project 0) → YOUTH
    // surveys[2,3]  = activity 1 (project 0) → YOUTH
    // surveys[4,5]  = activity 2 (project 0) → YOUTH
    // surveys[6,7]  = activity 3 (project 1) → FAMILIES
    // surveys[8,9]  = activity 4 (project 1) → FAMILIES
    // surveys[10,11]= activity 5 (project 1) → FAMILIES
    // surveys[12,13]= activity 6 (project 2) → HEALTH
    // surveys[14,15]= activity 7 (project 2) → HEALTH
    // surveys[16,17]= activity 8 (project 2) → HEALTH
    // surveys[18,19]= activity 9 (project 3) → EDUCATION
    // surveys[20,21]= activity 10 (project 3)→ EDUCATION
    // surveys[22,23]= activity 11 (project 3)→ EDUCATION

    const pools = [
      [YOUTH_PRE_TEXTS, YOUTH_POST_TEXTS],     // project 0 activity 0
      [YOUTH_PRE_TEXTS, YOUTH_POST_TEXTS],     // project 0 activity 1
      [YOUTH_PRE_TEXTS, YOUTH_POST_TEXTS],     // project 0 activity 2
      [FAMILIES_PRE_TEXTS, FAMILIES_POST_TEXTS], // project 1 activity 0
      [FAMILIES_PRE_TEXTS, FAMILIES_POST_TEXTS], // project 1 activity 1
      [FAMILIES_PRE_TEXTS, FAMILIES_POST_TEXTS], // project 1 activity 2
      [HEALTH_PRE_TEXTS, HEALTH_POST_TEXTS],   // project 2 activity 0
      [HEALTH_PRE_TEXTS, HEALTH_POST_TEXTS],   // project 2 activity 1
      [HEALTH_PRE_TEXTS, HEALTH_POST_TEXTS],   // project 2 activity 2
      [EDUCATION_PRE_TEXTS, EDUCATION_POST_TEXTS], // project 3 activity 0
      [EDUCATION_PRE_TEXTS, EDUCATION_POST_TEXTS], // project 3 activity 1
      [EDUCATION_PRE_TEXTS, EDUCATION_POST_TEXTS], // project 3 activity 2
    ];

    const RESPONDENTS_PER_SURVEY = 80; // 2 rounds × 40 beneficiaries
    let allSubmissions: any[] = [];

    // 5 questions per survey in order: Q0=textarea, Q1=textarea, Q2=rating, Q3=single, Q4=yes_no
    for (let si = 0; si < surveys.length; si++) {
      const survey = surveys[si];
      const activityIdx = Math.floor(si / 2);
      const isPre = si % 2 === 0;
      const [prePool, postPool] = pools[activityIdx];
      const textPool = isPre ? prePool : postPool;
      const sessionBase = new Date(2025, (si % 10) + 1, 15);

      // Questions for this survey (5 questions, 5 * survey_index to 5 * survey_index + 4)
      const qStart = si * 5;
      const sQuestions = questions.slice(qStart, qStart + 5);
      if (sQuestions.length < 5) continue;

      const [q0, q1, q2, q3, q4] = sQuestions;

      for (let bi = 0; bi < RESPONDENTS_PER_SURVEY; bi++) {
        const beneficiary = beneficiaries[bi % beneficiaries.length];
        const startedAt = new Date(sessionBase.getTime() + bi * 60_000);
        const completedAt = new Date(startedAt.getTime() + (300 + bi * 20) * 1000);
        const base = { survey: survey._id, beneficiary: beneficiary._id, startedAt, completedAt };

        // Q0 — textarea (text pool cycling)
        allSubmissions.push({ ...base, question: q0._id, textValue: textPool[bi % textPool.length] });

        // Q1 — textarea (different offset so we get variety)
        allSubmissions.push({ ...base, question: q1._id, textValue: textPool[(bi + 7) % textPool.length] });

        // Q2 — rating (1-10, varies by respondent)
        const rating = isPre ? (3 + (bi % 5)) : (6 + (bi % 5));
        allSubmissions.push({ ...base, question: q2._id, numberValue: rating });

        // Q3 — single_choice
        const choiceIdx = bi % 4;
        const opts = q3.options || [];
        allSubmissions.push({ ...base, question: q3._id, textValue: opts[choiceIdx] || 'خيار أول' });

        // Q4 — yes_no
        allSubmissions.push({ ...base, question: q4._id, booleanValue: bi % 3 !== 0 });
      }
    }

    // Insert in batches of 500 to avoid memory issues
    let total = 0;
    for (let i = 0; i < allSubmissions.length; i += 500) {
      const batch = allSubmissions.slice(i, i + 500);
      await this.submissionModel.insertMany(batch);
      total += batch.length;
    }

    this.logger.log(`✅ Created ${total} survey submissions`);
    return allSubmissions;
  }

  // ─── Correct Answers ──────────────────────────────────────────────────────
  // One record per gradeable question (rating, single_choice, yes_no).
  // Textarea questions are open-ended and have no correct answer.
  private async seedCorrectAnswers(surveys: any[], questions: any[]) {
    this.logger.log('✔️  Seeding correct answers...');

    // Pre-survey single_choice options match what was generated in seedSurveyQuestions
    const preSingleOptions = [
      ['مبتدئ تماماً', 'لديّ خبرة بسيطة', 'خبرة متوسطة', 'خبير ومتقدم'],
      ['أقل من سنة', 'من 1-3 سنوات', 'من 3-5 سنوات', 'أكثر من 5 سنوات'],
      ['للمرة الأولى', 'سبق لي الحضور مرة', 'حضرت عدة مرات', 'مشارك منتظم'],
      ['18-24 سنة', '25-30 سنة', '31-40 سنة', 'أكثر من 40 سنة'],
    ];

    const correctAnswers: any[] = [];

    for (let si = 0; si < surveys.length; si++) {
      const isPre = si % 2 === 0;
      const qi = Math.floor(si / 2) % 4;
      const qStart = si * 5;
      const sQuestions = questions.slice(qStart, qStart + 5);
      if (sQuestions.length < 5) continue;
      const [, , q2, q3, q4] = sQuestions;

      // Q2 — rating: expected minimum score
      // Pre: baseline knowledge expected at 5/10; Post: satisfaction expected at 8/10
      correctAnswers.push({
        question: q2._id,
        numberValue: isPre ? 5 : 8,
      });

      // Q3 — single_choice: the "model" answer for each question variant
      // Pre: third option (متوسط / mid-level); Post: "استوعبت بالكامل" (full comprehension)
      correctAnswers.push({
        question: q3._id,
        textValue: isPre ? preSingleOptions[qi][2] : 'استوعبت بالكامل',
      });

      // Q4 — yes_no
      // Pre: "هل سبق لك حضور برامج مشابهة؟" — no strict correct, skip
      // Post: "هل ستطبق ما تعلمته؟" — correct = true
      if (!isPre) {
        correctAnswers.push({
          question: q4._id,
          booleanValue: true,
        });
      }
    }

    await this.correctAnswerModel.insertMany(correctAnswers);
    this.logger.log(`✅ Created ${correctAnswers.length} correct answers`);
    return correctAnswers;
  }

  // ─── Indicators (3-4 per project = 14 total) ─────────────────────────────
  private async seedIndicators(projects: any[]) {
    this.logger.log('📊 Seeding indicators...');

    const indicators = await this.indicatorModel.insertMany([
      // ── Project 0: Youth Empowerment ──────────────────────────────────────
      {
        project: projects[0]._id,
        name: 'عدد الشباب المستفيدين المدرّبين',
        description: 'إجمالي عدد الشباب الذين أكملوا البرنامج التدريبي بنجاح بنسبة حضور 80% فأكثر',
        indicatorType: IndicatorType.OUTPUT,
        measurementMethod: 'سجلات الحضور وشهادات الإتمام',
        targetValue: 1000, actualValue: 750, unit: MeasurementUnit.NUMBER,
        dataSource: 'نظام إدارة التدريب', baselineValue: 0,
        trend: TrendDirection.IMPROVING, isActive: true,
      },
      {
        project: projects[0]._id,
        name: 'نسبة التحسن في المهارات القيادية',
        description: 'متوسط النسبة المئوية للتحسن في درجات التقييم القبلي والبعدي لمهارات القيادة',
        indicatorType: IndicatorType.OUTCOME,
        measurementMethod: 'مقارنة نتائج الاختبارات القبلية والبعدية',
        targetValue: 35, actualValue: 28.5, unit: MeasurementUnit.PERCENTAGE,
        dataSource: 'نتائج الاستبيانات', baselineValue: 0,
        trend: TrendDirection.IMPROVING, isActive: true,
      },
      {
        project: projects[0]._id,
        name: 'معدل توظيف المستفيدين بعد 6 أشهر',
        description: 'نسبة المشاركين الذين حصلوا على وظيفة أو بدأوا مشروعاً خلال 6 أشهر من انتهاء البرنامج',
        indicatorType: IndicatorType.IMPACT,
        measurementMethod: 'استبيان متابعة بعد 6 أشهر من الانتهاء',
        targetValue: 65, actualValue: 52, unit: MeasurementUnit.PERCENTAGE,
        dataSource: 'استبيان المتابعة الدورية', baselineValue: 30,
        trend: TrendDirection.IMPROVING, isActive: true,
      },

      // ── Project 1: Productive Families ────────────────────────────────────
      {
        project: projects[1]._id,
        name: 'عدد الأسر التي أطلقت مشاريع منزلية',
        description: 'عدد الأسر التي بدأت فعلياً تنفيذ مشاريع منزلية مدرة للدخل وقدّمت خطط أعمال',
        indicatorType: IndicatorType.OUTPUT,
        measurementMethod: 'تسجيل الأسر التي قدمت خطة عمل وبدأت التنفيذ',
        targetValue: 500, actualValue: 310, unit: MeasurementUnit.NUMBER,
        dataSource: 'سجلات البرنامج', baselineValue: 0,
        trend: TrendDirection.IMPROVING, isActive: true,
      },
      {
        project: projects[1]._id,
        name: 'متوسط الدخل الشهري الإضافي للأسرة',
        description: 'متوسط الدخل الشهري الإضافي الذي حققته الأسر المشاركة من مشاريعها المنزلية',
        indicatorType: IndicatorType.OUTCOME,
        measurementMethod: 'استبيان شهري ميداني لقياس إيرادات الأسر',
        targetValue: 3500, actualValue: 2200, unit: MeasurementUnit.CURRENCY,
        dataSource: 'تقارير الأسر المالية الشهرية', baselineValue: 0,
        trend: TrendDirection.IMPROVING, isActive: true,
      },
      {
        project: projects[1]._id,
        name: 'معدل نجاة المشاريع بعد سنة',
        description: 'نسبة المشاريع التي استمرت في العمل بعد مرور سنة كاملة على تأسيسها',
        indicatorType: IndicatorType.IMPACT,
        measurementMethod: 'متابعة سنوية للمشاريع المسجلة في البرنامج',
        targetValue: 70, actualValue: 58, unit: MeasurementUnit.PERCENTAGE,
        dataSource: 'قواعد بيانات البرنامج', baselineValue: 0,
        trend: TrendDirection.STABLE, isActive: true,
      },

      // ── Project 2: Community Health ───────────────────────────────────────
      {
        project: projects[2]._id,
        name: 'عدد الأفراد الذين أكملوا الفحص الصحي الدوري',
        description: 'إجمالي عدد الأفراد الذين أجروا فحوصات صحية دورية من خلال البرنامج',
        indicatorType: IndicatorType.OUTPUT,
        measurementMethod: 'سجلات الفحوصات الطبية وبطاقات المتابعة',
        targetValue: 2000, actualValue: 1450, unit: MeasurementUnit.NUMBER,
        dataSource: 'سجلات المراكز الصحية', baselineValue: 0,
        trend: TrendDirection.IMPROVING, isActive: true,
      },
      {
        project: projects[2]._id,
        name: 'نسبة الوعي بعوامل الخطر الصحية',
        description: 'نسبة المشاركين الذين أثبتوا وعياً كافياً بعوامل الخطر الصحية في التقييم البعدي',
        indicatorType: IndicatorType.OUTCOME,
        measurementMethod: 'اختبار معرفي في التقييم القبلي والبعدي',
        targetValue: 80, actualValue: 68, unit: MeasurementUnit.PERCENTAGE,
        dataSource: 'نتائج الاستبيانات المعرفية', baselineValue: 35,
        trend: TrendDirection.IMPROVING, isActive: true,
      },
      {
        project: projects[2]._id,
        name: 'نسبة الانخفاض في حوادث الطوارئ المنزلية',
        description: 'معدل انخفاض حوادث الطوارئ المنزلية في المناطق المستهدفة مقارنة بالفترة السابقة',
        indicatorType: IndicatorType.IMPACT,
        measurementMethod: 'مراجعة سجلات الطوارئ في المستشفيات والإسعاف',
        targetValue: 25, actualValue: 18, unit: MeasurementUnit.PERCENTAGE,
        dataSource: 'بيانات الهلال الأحمر والمستشفيات', baselineValue: 0,
        trend: TrendDirection.IMPROVING, isActive: true,
      },

      // ── Project 3: Education Development ─────────────────────────────────
      {
        project: projects[3]._id,
        name: 'عدد المعلمين الذين أكملوا برامج التطوير',
        description: 'إجمالي عدد المعلمين والمشرفين الذين أتموا برامج التطوير المهني المعتمدة',
        indicatorType: IndicatorType.OUTPUT,
        measurementMethod: 'شهادات الإتمام وسجلات الحضور الرسمية',
        targetValue: 500, actualValue: 380, unit: MeasurementUnit.NUMBER,
        dataSource: 'إدارة التدريب والتطوير', baselineValue: 0,
        trend: TrendDirection.IMPROVING, isActive: true,
      },
      {
        project: projects[3]._id,
        name: 'معدل تطبيق الأساليب الحديثة في الفصل',
        description: 'نسبة المعلمين المدرّبين الذين يطبقون فعلياً الأساليب التدريسية الحديثة بانتظام',
        indicatorType: IndicatorType.OUTCOME,
        measurementMethod: 'زيارات صفية تقييمية من قِبل المشرفين التربويين',
        targetValue: 75, actualValue: 61, unit: MeasurementUnit.PERCENTAGE,
        dataSource: 'تقارير الزيارات الإشرافية', baselineValue: 20,
        trend: TrendDirection.IMPROVING, isActive: true,
      },
      {
        project: projects[3]._id,
        name: 'نسبة تحسن التحصيل الدراسي للطلاب',
        description: 'متوسط نسبة التحسن في درجات الطلاب في الفصول التي يدرّس بها معلمون مدرّبون',
        indicatorType: IndicatorType.IMPACT,
        measurementMethod: 'مقارنة نتائج الاختبارات المدرسية قبل وبعد تدريب المعلمين',
        targetValue: 20, actualValue: 14.5, unit: MeasurementUnit.PERCENTAGE,
        dataSource: 'نتائج الاختبارات المدرسية الرسمية', baselineValue: 0,
        trend: TrendDirection.IMPROVING, isActive: true,
      },
    ]);

    this.logger.log(`✅ Created ${indicators.length} indicators`);
    return indicators;
  }

  // ─── Indicator History (3 records per indicator) ─────────────────────────
  private async seedIndicatorHistory(indicators: any[]) {
    this.logger.log('📈 Seeding indicator history...');

    const historyData: any[] = [];
    indicators.forEach((ind, i) => {
      const target = ind.targetValue;
      const actual = ind.actualValue;
      const q1 = Math.round(actual * 0.4);
      const q2 = Math.round(actual * 0.65);
      const q3 = actual;

      historyData.push(
        {
          indicator: ind._id,
          recordedValue: q1,
          calculatedAt: new Date(`2025-0${(i % 6) + 4}-01`),
          source: 'تقرير الربع الأول',
          notes: 'بداية التسجيل والقياس الأولي',
          previousValue: ind.baselineValue || 0,
          changeAmount: q1 - (ind.baselineValue || 0),
          changePercentage: ind.baselineValue ? Math.round(((q1 - ind.baselineValue) / ind.baselineValue) * 100) : 0,
          status: 'verified',
        },
        {
          indicator: ind._id,
          recordedValue: q2,
          calculatedAt: new Date(`2025-0${(i % 6) + 7}-01`),
          source: 'تقرير منتصف العام',
          notes: `التقدم مستمر نحو الهدف (${target})`,
          previousValue: q1,
          changeAmount: q2 - q1,
          changePercentage: Math.round(((q2 - q1) / q1) * 100),
          status: 'verified',
        },
        {
          indicator: ind._id,
          recordedValue: q3,
          calculatedAt: new Date('2026-01-15'),
          source: 'تقرير نهاية العام',
          notes: `القيمة الحالية — ${Math.round((actual / target) * 100)}% من الهدف`,
          previousValue: q2,
          changeAmount: q3 - q2,
          changePercentage: Math.round(((q3 - q2) / q2) * 100),
          status: 'recorded',
        },
      );
    });

    await this.indicatorHistoryModel.insertMany(historyData);
    this.logger.log(`✅ Created ${historyData.length} indicator history entries`);
    return historyData;
  }
}
