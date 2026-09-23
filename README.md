# فرصتك (Forsatek)

منصة مغربية مجانية 100% لتجميع الفرص (وظائف، مباريات، منح، تكوينات) مع تحديث تلقائي يومي عبر GitHub Actions.

## طريقة التشغيل على GitHub Pages

1. أنشئ مستودعاً جديداً على GitHub باسم `forsatek`
2. ارفع جميع الملفات
3. من **Settings → Pages** اختر: Branch = `main`، Folder = `/ (root)` ثم احفظ
4. بعد دقيقتين سيكون موقعك متاحاً على: `https://username.github.io/forsatek`

## تفعيل التحديث التلقائي اليومي

1. اذهب إلى **Settings → Actions → General**
2. في أسفل الصفحة: **Workflow permissions** ← اختر **Read and write permissions** ← احفظ
3. من تبويب **Actions** ← اختر "تحديث الفرص اليومي" ← **Run workflow** للتشغيل اليدوي الأول

## إضافة فرص يدوياً

عدّل ملف `data/opportunities.json` وأضف بطاقة جديدة مع وضع `"manual": true` حتى لا يحذفها الجالب الآلي.

## بنية المشروع

- `index.html` — الصفحة الرئيسية (بحث + تصفية + عداد الأجل)
- `detail.html` — صفحة تفاصيل كل فرصة
- `data/opportunities.json` — قاعدة بيانات الفرص
- `scraper/scraper.py` — جالب الفرص التلقائي من مصدرين:
  - **emploi-public.ma** (قطاع عمومي: وظائف، مباريات)
  - **marocannonces.com** فئة Offres emploi رقم 309 (قطاع خاص)
- `.github/workflows/scrape.yml` — تحديث يومي تلقائي


## صانع السيرة الذاتية الذكي (cv.html)

- معاينة حية أثناء الكتابة + حفظ تلقائي في المتصفح
- طباعة / حفظ PDF بضغطة واحدة
- توليد الملخص واقتراح المهارات عبر Gemini API (مجاني — المستخدم يضع مفتاحه الخاص من aistudio.google.com، ويُحفظ في متصفحه فقط ولا يُرسل لأي خادم)
