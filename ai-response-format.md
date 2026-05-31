# تنسيق رد الذكاء الاصطناعي — دليل شامل

## نظرة عامة

يتوقع النظام من Ollama (عبر n8n) ردوداً بـ JSON صرف بدون أي نص إضافي.
أنواع التحليل الأربعة لها schemas مختلفة موضحة أدناه.

---

## أنواع التحليل (`analysisType`)

| النوع | الوصف |
|-------|-------|
| `text_analysis` | تحليل النصوص المفتوحة وتصنيف المشاعر |
| `topic_extraction` | استخراج الموضوعات من الردود |
| `impact_evaluation` | مقارنة قبلي/بعدي لتقييم الأثر |
| `comprehensive` | تحليل شامل يجمع الثلاثة |

---

## 1. `text_analysis` — تحليل النصوص

### المدخلات
```json
{
  "analysisType": "text_analysis",
  "language": "ar",
  "projectInfo": { "name": "برنامج تمكين الشباب المهني" },
  "textData": [
    "البرنامج التدريبي غيّر نظرتي للعمل بشكل جذري واكتسبت أدوات عملية حقيقية",
    "تعلمت في هذا البرنامج كيف أدير وقتي بشكل أفضل وأضع أهدافاً ذكية",
    "لم يكن البرنامج بمستوى توقعاتي، كنت أتوقع محتوى أعمق وأشمل"
  ]
}
```

### الرد الصحيح ✅
```json
{
  "textAnalysis": {
    "sentiment": "positive",
    "sentimentScore": 0.42,
    "confidence": 0.86,
    "keywords": [
      { "word": "البرنامج", "frequency": 3, "relevance": 0.9 },
      { "word": "مهارات", "frequency": 2, "relevance": 0.8 },
      { "word": "إدارة الوقت", "frequency": 1, "relevance": 0.7 }
    ],
    "entities": [
      { "text": "برنامج تمكين الشباب", "type": "PROGRAM", "relevance": 0.9 }
    ],
    "summary": "يُعبّر المستفيدون بشكل عام عن تجربة إيجابية مع البرنامج، ويبرزون فوائد عملية في إدارة الوقت وتطوير المهارات، مع وجود بعض الملاحظات النقدية على عمق المحتوى.",
    "emotions": {
      "joy": 0.45,
      "satisfaction": 0.38,
      "disappointment": 0.12,
      "hope": 0.05
    }
  },
  "topics": [
    { "name": "تطوير المهارات المهنية", "keywords": ["مهارات", "إدارة الوقت", "أهداف"], "relevance": 0.85, "sentiment": "positive" },
    { "name": "جودة المحتوى التدريبي", "keywords": ["محتوى", "توقعات", "عمق"], "relevance": 0.65, "sentiment": "neutral" }
  ],
  "recommendations": [
    "تعزيز الجانب التطبيقي في البرنامج لتلبية توقعات المشاركين",
    "إضافة جلسات متعمقة للموضوعات ذات الطلب الأعلى"
  ],
  "insights": [
    "72% من المستجيبين يُبدون رضا إيجابياً عاماً عن البرنامج",
    "إدارة الوقت هي المهارة الأكثر ذكراً في الردود الإيجابية",
    "المشاركون الأقل رضا يطالبون بمحتوى أكثر عمقاً وتخصصاً"
  ]
}
```

### قواعد الحقول
| الحقل | النوع | النطاق | ملاحظة |
|-------|-------|--------|--------|
| `sentiment` | string | `positive` / `negative` / `neutral` | إلزامي |
| `sentimentScore` | number | -1.0 إلى 1.0 | موجب = إيجابي، سالب = سلبي |
| `confidence` | number | 0.0 إلى 1.0 | مستوى ثقة النموذج |
| `keywords[].word` | string | — | الكلمة باللغة العربية |
| `keywords[].frequency` | number | ≥ 1 | عدد مرات الظهور |
| `keywords[].relevance` | number | 0.0 إلى 1.0 | مدى الأهمية |
| `entities[].type` | string | PERSON, ORG, PROGRAM, PLACE | اختياري |
| `summary` | string | — | ملخص عربي من 2-4 جمل |

---

## 2. `topic_extraction` — استخراج الموضوعات

### المدخلات
```json
{
  "analysisType": "topic_extraction",
  "language": "ar",
  "projectInfo": { "name": "مبادرة الأسر المنتجة" },
  "surveyData": {
    "responses": [
      "البرنامج ساعدني على تحويل هوايتي إلى مشروع تجاري صغير",
      "تعلمت كيف أسعّر منتجاتي بشكل صحيح",
      "الدعم المقدم ساعدني على الانطلاق بثقة"
    ]
  }
}
```

### الرد الصحيح ✅
```json
{
  "topics": [
    {
      "name": "ريادة الأعمال والمشاريع الصغيرة",
      "keywords": ["مشروع", "هواية", "تجاري", "انطلاق"],
      "relevance": 0.88,
      "sentiment": "positive"
    },
    {
      "name": "التسعير وإدارة المال",
      "keywords": ["تسعير", "منتجات", "صحيح"],
      "relevance": 0.72,
      "sentiment": "positive"
    },
    {
      "name": "الدعم والإرشاد",
      "keywords": ["دعم", "مقدم", "ثقة"],
      "relevance": 0.65,
      "sentiment": "positive"
    }
  ],
  "insights": [
    "الموضوع الأبرز هو تحويل الهوايات إلى دخل، ويعكس الهدف الرئيسي للمبادرة",
    "الثقة بالنفس تبرز كأثر نفسي مهم بجانب الأثر الاقتصادي"
  ]
}
```

---

## 3. `impact_evaluation` — تقييم الأثر

### المدخلات
```json
{
  "analysisType": "impact_evaluation",
  "language": "ar",
  "projectInfo": { "name": "برنامج تمكين الشباب المهني" },
  "surveyData": {
    "preSurvey": [
      { "question": "قيّم مستوى معرفتك الحالية من 1 إلى 10", "answer": 4 },
      { "question": "ما مستوى خبرتك؟", "answer": "مبتدئ تماماً" },
      { "question": "هل سبق لك حضور برامج مشابهة؟", "answer": false }
    ],
    "postSurvey": [
      { "question": "قيّم البرنامج بشكل عام من 1 إلى 10", "answer": 8 },
      { "question": "ما مدى استيعابك للمحتوى؟", "answer": "استوعبت المعظم" },
      { "question": "هل ستطبق ما تعلمته؟", "answer": true }
    ]
  },
  "indicators": [
    { "name": "نسبة التحسن في المهارات", "target": 35, "unit": "percentage" },
    { "name": "عدد المستفيدين المدرّبين", "target": 2000, "unit": "number" }
  ]
}
```

### الرد الصحيح ✅
```json
{
  "impactEvaluation": {
    "overallImpact": 0.74,
    "improvements": [
      {
        "indicator": "نسبة التحسن في المهارات",
        "improvement": 0.26,
        "significance": "high"
      },
      {
        "indicator": "مستوى الاستيعاب والفهم",
        "improvement": 0.40,
        "significance": "high"
      },
      {
        "indicator": "نية التطبيق العملي",
        "improvement": 0.33,
        "significance": "medium"
      }
    ],
    "analysis": "يظهر البرنامج أثراً إيجابياً ملموساً على المشاركين، إذ ارتفع متوسط تقييم المعرفة من 4 إلى 8 على مقياس 10، كما انتقل معظم المشاركين من مستوى 'مبتدئ تماماً' إلى 'استوعبت المعظم'. معدل التطبيق المتوقع مرتفع حيث أكد 80% من المشاركين نيتهم تطبيق ما تعلموه."
  },
  "recommendations": [
    "التركيز على استمرار المتابعة بعد البرنامج لضمان التطبيق الفعلي",
    "إضافة برنامج إرشادي لمدة 3 أشهر بعد انتهاء التدريب"
  ],
  "insights": [
    "ارتفاع متوسط الدرجات بمعدل 100% يعكس أثراً تعليمياً قوياً",
    "النسبة المرتفعة للتطبيق المتوقع (80%) مؤشر إيجابي على جودة المحتوى"
  ]
}
```

### قواعد الحقول
| الحقل | النوع | النطاق | ملاحظة |
|-------|-------|--------|--------|
| `overallImpact` | number | 0.0 إلى 1.0 | الأثر الإجمالي |
| `improvements[].indicator` | string | — | اسم المؤشر من المدخلات |
| `improvements[].improvement` | number | 0.0 إلى 1.0 | نسبة التحسن |
| `improvements[].significance` | string | `high` / `medium` / `low` | أهمية التحسن |
| `analysis` | string | — | تحليل نثري عربي |

---

## 4. `comprehensive` — التحليل الشامل

### الرد الصحيح ✅
```json
{
  "textAnalysis": {
    "sentiment": "positive",
    "sentimentScore": 0.35,
    "confidence": 0.84,
    "keywords": [
      { "word": "البرنامج", "frequency": 5, "relevance": 0.9 },
      { "word": "مهارات", "frequency": 4, "relevance": 0.85 },
      { "word": "التطبيق", "frequency": 3, "relevance": 0.75 }
    ],
    "entities": [
      { "text": "برنامج تمكين الشباب", "type": "PROGRAM", "relevance": 0.95 }
    ],
    "summary": "تكشف الردود عن مستوى إيجابي عام من الرضا والتطور، مع تحسينات واضحة في المهارات وزيادة في الثقة بالنفس.",
    "emotions": { "joy": 0.40, "satisfaction": 0.35, "hope": 0.20, "concern": 0.05 }
  },
  "topics": [
    { "name": "تطوير المهارات المهنية", "keywords": ["مهارات", "قيادة", "تواصل"], "relevance": 0.88, "sentiment": "positive" },
    { "name": "الثقة بالنفس والنمو الشخصي", "keywords": ["ثقة", "تغيير", "نمو"], "relevance": 0.75, "sentiment": "positive" },
    { "name": "جودة المحتوى والتدريب", "keywords": ["محتوى", "مدرب", "جودة"], "relevance": 0.68, "sentiment": "neutral" }
  ],
  "impactEvaluation": {
    "overallImpact": 0.72,
    "improvements": [
      { "indicator": "المعرفة والوعي", "improvement": 0.38, "significance": "high" },
      { "indicator": "الثقة بالنفس", "improvement": 0.25, "significance": "medium" }
    ],
    "analysis": "يُحقق البرنامج أثراً إيجابياً متعدد الأبعاد يشمل المهارات المهنية والنمو الشخصي، مع نسبة رضا كلية تتجاوز 70%."
  },
  "recommendations": [
    "زيادة حصص التطبيق العملي لتعزيز الاستيعاب",
    "إضافة برامج متابعة دورية بعد انتهاء التدريب",
    "توسيع موضوعات القيادة والريادة بناء على طلب المشاركين"
  ],
  "insights": [
    "الأثر الأقوى يظهر في محور المهارات العملية وليس النظرية",
    "المشاركون من الفئة العمرية 25-30 يُبدون أعلى مستوى رضا",
    "الردود السلبية تتركز في طلب المزيد من التطبيق وقصر المدة"
  ]
}
```

---

## أخطاء شائعة يجب تجنبها ❌

```json
// ❌ خطأ: sentiment بقيمة غير معترف بها
{ "sentiment": "mixed" }

// ✅ صحيح: استخدم positive / negative / neutral فقط
{ "sentiment": "positive" }
```

```json
// ❌ خطأ: sentimentScore خارج النطاق
{ "sentimentScore": 1.5 }

// ✅ صحيح: النطاق -1.0 إلى 1.0
{ "sentimentScore": 0.72 }
```

```json
// ❌ خطأ: overallImpact خارج النطاق
{ "overallImpact": 72 }

// ✅ صحيح: النطاق 0.0 إلى 1.0
{ "overallImpact": 0.72 }
```

```json
// ❌ خطأ: إضافة نص خارج JSON أو markdown
Sure! Here is the analysis:
```json { ... }```

// ✅ صحيح: JSON فقط بدون أي نص
{ ... }
```

```json
// ❌ خطأ: حقل مطلوب غائب تماماً لنوع التحليل
// comprehensive بدون textAnalysis
{ "topics": [...], "recommendations": [...] }

// ✅ صحيح: جميع الحقول موجودة
{ "textAnalysis": {...}, "topics": [...], "impactEvaluation": {...}, "recommendations": [...], "insights": [...] }
```

---

## ملخص الحقول الإلزامية حسب نوع التحليل

| الحقل | `text_analysis` | `topic_extraction` | `impact_evaluation` | `comprehensive` |
|-------|:-:|:-:|:-:|:-:|
| `textAnalysis` | ✅ | ❌ | ❌ | ✅ |
| `topics` | ✅ | ✅ | ❌ | ✅ |
| `impactEvaluation` | ❌ | ❌ | ✅ | ✅ |
| `recommendations` | ✅ | ❌ | ✅ | ✅ |
| `insights` | ✅ | ✅ | ✅ | ✅ |

---

## نصائح لتحسين جودة الرد

1. **اللغة**: استخدم العربية الفصحى في الملاحظات والتوصيات والملخصات
2. **الدقة**: لا تخترع مؤشرات أو حقائق غير موجودة في المدخلات
3. **الكلمات المفتاحية**: اقتبسها من النصوص الواردة فعلاً في المدخل
4. **التوصيات**: اجعلها قابلة للتنفيذ وذات صلة مباشرة بالبيانات
5. **الأرقام**: اعتمد على البيانات الكمية الواردة (تقييمات، نسب) لا التخمين
