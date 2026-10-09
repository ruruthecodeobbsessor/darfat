// Labels are localized; the saved values stay stable when the language changes.
const options = rows => rows.trim().split("\n").map(row => {
  const [en, ckb, ar] = row.trim().split("|");
  return { value: ckb || en, en, ckb: ckb || en, ar: ar || en };
});

export const INTEREST_OPTIONS = options(`
Technology & programming|تەکنەلۆژیا و پڕۆگرامسازی|التكنولوجيا والبرمجة
Design & creativity|دیزاین و داهێنان|التصميم والإبداع
Entrepreneurship & business|کارئافرینی و بازرگانی|ريادة الأعمال والتجارة
Science & research|زانست و توێژینەوە|العلوم والبحث
Arts & media|هونەر و میدیا|الفنون والإعلام
Volunteering & community|کاری خۆبەخشی و کۆمەڵایەتی|التطوع والمجتمع
Education & teaching|پەروەردە و فێرکردن|التعليم والتدريس
Environment & nature|ژینگە و سروشت|البيئة والطبيعة
Sports & health|وەرزش و تەندروستی|الرياضة والصحة
Languages & translation|زمان و وەرگێڕان|اللغات والترجمة
Writing & literature|نووسین و ئەدەب|الكتابة والأدب
Music|مۆسیقا|الموسيقى
Web development|گەشەپێدانی وێب|تطوير الويب
Mobile apps|ئەپی مۆبایل|تطبيقات الهاتف
Artificial intelligence|ژیریی دەستکرد|الذكاء الاصطناعي
Data science|زانستی داتا|علم البيانات
Cybersecurity|ئاسایشی سایبەری|الأمن السيبراني
Robotics|ڕۆبۆتیک|الروبوتات
Game development|دروستکردنی یاری|تطوير الألعاب
Gaming & esports|یاری و وەرزشی ئەلیکترۆنی|الألعاب والرياضات الإلكترونية
Graphic design|دیزاینی گرافیک|التصميم الجرافيكي
UI/UX design|دیزاینی UI/UX|تصميم تجربة المستخدم
Architecture|تەلارسازی|الهندسة المعمارية
Interior design|دیزاینی ناوەوە|التصميم الداخلي
Fashion|مۆدە|الموضة
Photography|وێنەگرتن|التصوير الفوتوغرافي
Filmmaking|فیلمسازی|صناعة الأفلام
Animation|ئەنیمەیشن|الرسوم المتحركة
Drawing & painting|وێنەکێشان و نیگارکێشان|الرسم والتلوين
Crafts|کاری دەستی|الحرف اليدوية
Content creation|دروستکردنی ناوەڕۆک|صناعة المحتوى
Journalism|ڕۆژنامەوانی|الصحافة
Social media|میدیای کۆمەڵایەتی|وسائل التواصل الاجتماعي
Marketing|بەبازاڕکردن|التسويق
Finance & investing|دارایی و وەبەرهێنان|التمويل والاستثمار
Accounting|ژمێریاری|المحاسبة
Economics|ئابووری|الاقتصاد
Product management|بەڕێوەبردنی بەرهەم|إدارة المنتجات
Project management|بەڕێوەبردنی پڕۆژە|إدارة المشاريع
Leadership|سەرکردایەتی|القيادة
Public speaking|قسەکردن بۆ جەماوەر|التحدث أمام الجمهور
Law|یاسا|القانون
Human rights|مافەکانی مرۆڤ|حقوق الإنسان
History|مێژوو|التاريخ
Psychology|دەروونناسی|علم النفس
Sociology|کۆمەڵناسی|علم الاجتماع
Philosophy|فەلسەفە|الفلسفة
Medicine|پزیشکی|الطب
Mental wellbeing|تەندروستی دەروونی|الصحة النفسية
Nutrition|خۆراکناسی|التغذية
Fitness|فیتنەس|اللياقة البدنية
Football|تۆپی پێ|كرة القدم
Basketball|تۆپی سەبەتە|كرة السلة
Hiking|شاخەوانی|المشي الجبلي
Travel|گەشتکردن|السفر
Cooking|چێشتلێنان|الطبخ
Reading|خوێندنەوە|القراءة
Sustainability|بەردەوامی ژینگەیی|الاستدامة
Renewable energy|وزەی نوێبووەوە|الطاقة المتجددة
Agriculture|کشتوکاڵ|الزراعة
Animal welfare|پاراستنی ئاژەڵان|رعاية الحيوانات
Astronomy|ئەستێرەناسی|علم الفلك
Mathematics|بیرکاری|الرياضيات
Engineering|ئەندازیاری|الهندسة
Electronics|ئەلیکترۆنیک|الإلكترونيات
Community organizing|ڕێکخستنی کۆمەڵگە|تنظيم المجتمع
Culture & heritage|کەلتوور و میرات|الثقافة والتراث
Debate|مشتومڕ|المناظرة
Event planning|ڕێکخستنی چالاکی|تنظيم الفعاليات
Personal development|گەشەپێدانی کەسی|التطوير الشخصي
`);

export const SKILL_OPTIONS = options(`
Programming|پڕۆگرامسازی|البرمجة
JavaScript
TypeScript
Python
Java
C++
C#
PHP
Go
Rust
Swift
Kotlin
HTML
CSS
SQL
React
Next.js
Vue.js
Node.js
Flutter
React Native
Git & GitHub
Linux
Docker
Cloud computing|ژمێریاری هەوری|الحوسبة السحابية
Database management|بەڕێوەبردنی داتابەیس|إدارة قواعد البيانات
Data analysis|شیکردنەوەی داتا|تحليل البيانات
Machine learning|فێربوونی ئامێر|تعلم الآلة
Cybersecurity|ئاسایشی سایبەری|الأمن السيبراني
Software testing|تاقیکردنەوەی نەرمەکاڵا|اختبار البرمجيات
Microsoft Excel
Google Sheets
Power BI
Tableau
Statistics|ئامار|الإحصاء
Graphic design|دیزاینی گرافیک|التصميم الجرافيكي
UI/UX design|دیزاینی UI/UX|تصميم تجربة المستخدم
Figma
Adobe Photoshop
Adobe Illustrator
Canva
3D modeling|مۆدێلکردنی سێ ڕەهەندی|النمذجة ثلاثية الأبعاد
Blender
AutoCAD
Photography|وێنەگرتن|التصوير الفوتوغرافي
Video editing|دەستکاریکردنی ڤیدیۆ|تحرير الفيديو
Adobe Premiere Pro
After Effects
Animation|ئەنیمەیشن|الرسوم المتحركة
Illustration|وێنەکێشان|الرسم التوضيحي
Writing|نووسین|الكتابة
Copywriting|نووسینی ڕیکلام|الكتابة الإعلانية
Creative writing|نووسینی داهێنەرانە|الكتابة الإبداعية
Editing & proofreading|دەستکاری و پێداچوونەوە|التحرير والتدقيق
Research|توێژینەوە|البحث
Translation|وەرگێڕان|الترجمة
English|زمانی ئینگلیزی|اللغة الإنجليزية
Kurdish|زمانی کوردی|اللغة الكردية
Arabic|زمانی عەرەبی|اللغة العربية
Turkish|زمانی تورکی|اللغة التركية
Persian|زمانی فارسی|اللغة الفارسية
French|زمانی فەرەنسی|اللغة الفرنسية
German|زمانی ئەڵمانی|اللغة الألمانية
Communication|پەیوەندیکردن|التواصل
Public speaking|قسەکردن بۆ جەماوەر|التحدث أمام الجمهور
Teamwork|کاری تیمی|العمل الجماعي
Leadership|سەرکردایەتی|القيادة
Problem solving|چارەسەرکردنی کێشە|حل المشكلات
Critical thinking|بیرکردنەوەی ڕەخنەیی|التفكير النقدي
Time management|بەڕێوەبردنی کات|إدارة الوقت
Project management|بەڕێوەبردنی پڕۆژە|إدارة المشاريع
Event planning|ڕێکخستنی چالاکی|تنظيم الفعاليات
Negotiation|دانوستان|التفاوض
Customer service|خزمەتگوزاری کڕیار|خدمة العملاء
Sales|فرۆشتن|المبيعات
Digital marketing|بەبازاڕکردنی دیجیتاڵ|التسويق الرقمي
Social media management|بەڕێوەبردنی میدیای کۆمەڵایەتی|إدارة وسائل التواصل الاجتماعي
SEO
Business planning|پلاندانانی بازرگانی|تخطيط الأعمال
Accounting|ژمێریاری|المحاسبة
Budgeting|پلاندانانی بودجە|إعداد الميزانيات
Teaching|فێرکردن|التدريس
Mentoring|ڕێنماییکردن|الإرشاد
First aid|فریاکەوتنی سەرەتایی|الإسعافات الأولية
Music production|بەرهەمهێنانی مۆسیقا|الإنتاج الموسيقي
Drawing|نیگارکێشان|الرسم
Cooking|چێشتلێنان|الطبخ
Crafts|کاری دەستی|الحرف اليدوية
`);

const en = {
  title: "Let’s get to know you", intro: "A few details to help you find opportunities that fit.",
  step: "Step", of: "of", required: "Required", optional: "Optional", back: "Back", continue: "Continue", finish: "Finish", saving: "Saving your profile…",
  name: "What is your name?", age: "How old are you?", bio: "Tell us about yourself", interests: "What are your interests?", skills: "What skills do you have?",
  nameHint: "Use the name you would like on your profile.", ageHint: "Enter a whole number between 10 and 100.", bioHint: "Share a little about your background or goals. You can skip this.",
  interestsHint: "Choose the topics you enjoy, or add your own.", skillsHint: "Choose what you can do, or add a custom skill. Any level is welcome.",
  searchInterests: "Search interests", searchSkills: "Search skills", otherInterest: "Other interest", customSkill: "Add a custom skill", customPlaceholder: "Type your own option", add: "Add", selected: "Selected", remove: "Remove", empty: "No options found. Add your own below.", selectionHint: "Select up to 30. Click a selected option again to remove it.",
  nameError: "Enter a name with 2–100 characters.", ageError: "Enter a whole-number age between 10 and 100.", bioError: "Keep your introduction under 500 characters.", tagLimit: "You can select up to 30 options.", tagLength: "Each option must contain 1–120 characters.", customRequired: "Type an option before adding it.", saveError: "Your profile could not be saved. Your answers are still here; please try again.", sessionError: "Your session has expired. Sign in again to save your profile.", signIn: "Sign in", saved: "Your profile has been saved.", details: "Your answers will be saved to your profile when you finish.",
};
const ckb = {
  title: "با یەکتر بناسین", intro: "چەند زانیارییەک بۆ دۆزینەوەی دەرفەتی گونجاو بۆ تۆ.",
  step: "هەنگاو", of: "لە", required: "پێویستە", optional: "ئارەزوومەندانە", back: "گەڕانەوە", continue: "بەردەوامبوون", finish: "تەواوکردن", saving: "پاشەکەوتکردنی پڕۆفایلەکەت…",
  name: "ناوت چییە؟", age: "تەمەنت چەندە؟", bio: "باسی خۆت بکە", interests: "حەزت لە چییە؟", skills: "چ لێهاتووییەکت هەیە؟",
  nameHint: "ئەو ناوە بنووسە کە دەتەوێت لە پڕۆفایلەکەتدا دەربکەوێت.", ageHint: "ژمارەیەکی تەواو لە نێوان 10 و 100 بنووسە.", bioHint: "کەمێک باسی خۆت یان ئامانجەکانت بکە. دەتوانیت ئەم هەنگاوە تێپەڕێنیت.",
  interestsHint: "ئەو بابەتانە هەڵبژێرە کە حەزت لێیانە، یان هی خۆت زیاد بکە.", skillsHint: "لێهاتووییەکانت هەڵبژێرە یان هی خۆت زیاد بکە. هەر ئاستێک بەخێربێت.",
  searchInterests: "گەڕان بۆ حەز و خولیا", searchSkills: "گەڕان بۆ لێهاتوویی", otherInterest: "حەز و خولیای دیکە", customSkill: "زیادکردنی لێهاتوویی خۆت", customPlaceholder: "هەڵبژاردەی خۆت بنووسە", add: "زیادکردن", selected: "هەڵبژێردراو", remove: "لابردنی", empty: "هەڵبژاردەیەک نەدۆزرایەوە. هی خۆت لە خوارەوە زیاد بکە.", selectionHint: "تا 30 هەڵبژاردە هەڵبژێرە. بۆ لابردن دووبارە کلیکی لەسەر بکە.",
  nameError: "ناوێک بە 2–100 پیت بنووسە.", ageError: "تەمەن بە ژمارەیەکی تەواو لە نێوان 10 و 100 بنووسە.", bioError: "باسی خۆت بە کەمتر لە 500 پیت بکە.", tagLimit: "دەتوانیت تا 30 هەڵبژاردە هەڵبژێریت.", tagLength: "هەر هەڵبژاردەیەک دەبێت 1–120 پیت بێت.", customRequired: "پێش زیادکردن هەڵبژاردەیەک بنووسە.", saveError: "پڕۆفایلەکەت پاشەکەوت نەکرا. وەڵامەکانت هەر لێرەن؛ تکایە دووبارە هەوڵ بدەوە.", sessionError: "کاتی چوونەژوورەوەت تەواو بووە. بۆ پاشەکەوتکردن دووبارە بچۆ ژوورەوە.", signIn: "چوونەژوورەوە", saved: "پڕۆفایلەکەت پاشەکەوت کرا.", details: "کاتێک تەواو دەکەیت، وەڵامەکانت لە پڕۆفایلەکەت پاشەکەوت دەکرێن.",
};
const ar = {
  title: "لنتعرف عليك", intro: "بعض التفاصيل لمساعدتك في العثور على فرص تناسبك.",
  step: "الخطوة", of: "من", required: "مطلوب", optional: "اختياري", back: "رجوع", continue: "متابعة", finish: "إنهاء", saving: "جارٍ حفظ ملفك…",
  name: "ما اسمك؟", age: "كم عمرك؟", bio: "أخبرنا عن نفسك", interests: "ما اهتماماتك؟", skills: "ما المهارات التي تمتلكها؟",
  nameHint: "اكتب الاسم الذي تريد ظهوره في ملفك الشخصي.", ageHint: "أدخل عدداً صحيحاً بين 10 و100.", bioHint: "شارك نبذة عن خلفيتك أو أهدافك. يمكنك تخطي هذه الخطوة.",
  interestsHint: "اختر المواضيع التي تحبها، أو أضف اهتماماتك الخاصة.", skillsHint: "اختر مهاراتك أو أضف مهارة خاصة. جميع المستويات مرحب بها.",
  searchInterests: "ابحث عن اهتمامات", searchSkills: "ابحث عن مهارات", otherInterest: "اهتمام آخر", customSkill: "أضف مهارة خاصة", customPlaceholder: "اكتب خيارك الخاص", add: "إضافة", selected: "المحدد", remove: "إزالة", empty: "لم نعثر على خيارات. أضف خيارك أدناه.", selectionHint: "اختر حتى 30 خياراً. اضغط على الخيار المحدد مجدداً لإزالته.",
  nameError: "أدخل اسماً من 2 إلى 100 حرف.", ageError: "أدخل عمراً صحيحاً بين 10 و100.", bioError: "اجعل نبذتك أقل من 500 حرف.", tagLimit: "يمكنك اختيار حتى 30 خياراً.", tagLength: "يجب أن يتكون كل خيار من 1 إلى 120 حرفاً.", customRequired: "اكتب خياراً قبل إضافته.", saveError: "تعذر حفظ ملفك. إجاباتك لا تزال هنا؛ حاول مجدداً.", sessionError: "انتهت جلستك. سجل الدخول مجدداً لحفظ ملفك.", signIn: "تسجيل الدخول", saved: "تم حفظ ملفك الشخصي.", details: "ستُحفظ إجاباتك في ملفك الشخصي عند الانتهاء.",
};

export const ONBOARDING_COPY = { en, ckb, ar };
