/**
 * The bottom coach tour's script. Copy lives here in English and Arabic so the
 * tour can be edited without touching the player. Each step names the Control
 * tab it belongs to and a stable `data-tour` target selector.
 */
export type TourTab = "run" | "settings" | "queue" | "sim";

export type TourDemo = "tabs" | "tap" | "pick" | "slide" | "toggle" | "gift";

export interface LocalizedCopy {
  en: string;
  ar: string;
  tr?: string;
}

export interface TourStep {
  id: string;
  /** The page the step belongs to. Defaults to the Control room. */
  route?: "control" | "studio";
  tab: TourTab;
  /** A CSS selector for the real control to highlight, or null for a centered card. */
  target: string | null;
  title: LocalizedCopy;
  body: LocalizedCopy;
  example: LocalizedCopy;
  demo: TourDemo;
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    tab: "run",
    target: null,
    title: { en: "Welcome to Pick League", ar: "مرحبًا بك في Pick League" },
    body: {
      en: "A quick five-minute tour. You will see the four Control tabs and the Studio. Nothing is changed — this is only a preview.",
      ar: "جولة سريعة مدتها خمس دقائق. ستتعرف على تبويبات التحكم الأربعة والاستوديو. لن نغيّر أي إعداد — هذه معاينة فقط.",
      tr: "Beş dakikalık kısa bir tur. Dört Kontrol sekmesini ve Stüdyo'yu göreceksiniz. Hiçbir ayar değişmez — bu yalnızca bir önizlemedir.",
    },
    example: { en: "Four tabs, one show.", ar: "أربعة تبويبات، عرض واحد.", tr: "Dört sekme, tek gösteri." },
    demo: "tabs",
  },
  {
    id: "run-start",
    tab: "run",
    target: '[data-tour="battle-primary"]',
    title: { en: "Start and pause the show", ar: "ابدأ العرض أو أوقفه مؤقتًا" },
    body: {
      en: "This is the main button. Press Start show to run the automatic sequence; Pause, Resume and Skip sit right beside it.",
      ar: "هذا هو الزر الرئيسي. اضغط «ابدأ العرض» لبدء التسلسل التلقائي، وأزرار الإيقاف المؤقت والاستئناف والتخطي بجانبه.",
      tr: "Ana düğme budur. Otomatik akışı başlatmak için Gösteriyi başlat'a basın; Duraklat, Devam ve Atla hemen yanındadır.",
    },
    example: { en: "Tap the big button.", ar: "اضغط الزر الكبير.", tr: "Büyük düğmeye dokunun." },
    demo: "tap",
  },
  {
    id: "run-behavior",
    tab: "run",
    target: '[data-tour="run-behavior"]',
    title: { en: "Round behaviour switches", ar: "مفاتيح سلوك الجولة" },
    body: {
      en: "These switches decide one vote per viewer, vote changes, automatic next match and category, auto phase, and the on-screen vote instructions.",
      ar: "هذه المفاتيح تحدد: صوت واحد لكل مشاهد، تغيير الصوت، الانتقال التلقائي للمباراة والفئة، تبديل العرض تلقائيًا، وتعليمات التصويت على الشاشة.",
      tr: "Bu anahtarlar izleyici başına tek oy, oy değişimi, otomatik sonraki maç ve kategori, otomatik aşama ve ekrandaki oy talimatlarını belirler.",
    },
    example: { en: "Flip a switch.", ar: "بدّل مفتاحًا.", tr: "Bir anahtarı çevirin." },
    demo: "toggle",
  },
  {
    id: "category-vote",
    tab: "run",
    target: '[data-tour="poll-button"]',
    title: { en: "Start a category vote", ar: "ابدأ تصويت الفئة" },
    body: {
      en: "Let chat pick the next category. Press the green button; the standings appear under it and the show opens on the winning category.",
      ar: "دع الدردشة تختار الفئة التالية. اضغط الزر الأخضر؛ تظهر النتائج تحته ويفتح العرض على الفئة الفائزة.",
      tr: "Sıradaki kategoriyi sohbet seçsin. Yeşil düğmeye basın; sıralama altında görünür ve gösteri kazanan kategoriyle açılır.",
    },
    example: { en: "Pick a category.", ar: "اختر فئة.", tr: "Bir kategori seçin." },
    demo: "pick",
  },
  {
    id: "new-match",
    tab: "run",
    target: '[data-tour="match-start"]',
    title: { en: "Make a new category match", ar: "ابدأ مباراة فئة جديدة" },
    body: {
      en: "Pick a category from the dropdown above, then press Start / restart. That launches a fresh bracket for that category. The green button is only for letting chat vote on the category.",
      ar: "اختر فئة من القائمة أعلاه ثم اضغط «ابدأ / إعادة». يبدأ ذلك قوسًا جديدًا لتلك الفئة. الزر الأخضر مخصص فقط لتصويت الدردشة على الفئة.",
      tr: "Yukarıdaki listeden bir kategori seçin, sonra Başlat / yeniden başlat'a basın. Bu, o kategori için yeni bir braket başlatır. Yeşil düğme yalnızca sohbetin kategori oylaması içindir.",
    },
    example: { en: "Choose, then start.", ar: "اختر ثم ابدأ.", tr: "Seçin, sonra başlatın." },
    demo: "tap",
  },
  {
    id: "queue",
    tab: "queue",
    target: '[data-tour="queue-panel"]',
    title: { en: "Line up the next categories", ar: "رتّب الفئات التالية" },
    body: {
      en: "Pick a category here to chain it after the current one. The queue decides what plays automatically next.",
      ar: "اختر فئة هنا لتضيفها بعد الفئة الحالية. تحدد قائمة الانتظار ما سيُعرض تلقائيًا بعد ذلك.",
      tr: "Geçerli kategoriden sonra eklemek için burada bir kategori seçin. Sıra, otomatik olarak neyin oynayacağını belirler.",
    },
    example: { en: "Add to the queue.", ar: "أضف إلى قائمة الانتظار.", tr: "Sıraya ekleyin." },
    demo: "pick",
  },
  {
    id: "studio-overview",
    route: "studio",
    tab: "run",
    target: '[data-tour="studio-categories"]',
    title: { en: "Studio: your content library", ar: "الاستوديو: مكتبة المحتوى" },
    body: {
      en: "Studio is where every category lives. The left panel holds the categories for the active language. From here you can create, import, and see which categories are ready.",
      ar: "الاستوديو هو مكان كل الفئات. تحتوي اللوحة اليسرى على فئات اللغة النشطة. من هنا يمكنك الإنشاء والاستيراد ومعرفة الفئات الجاهزة.",
      tr: "Stüdyo tüm kategorilerin yaşadığı yerdir. Sol panel etkin dilin kategorilerini tutar. Buradan oluşturabilir, içe aktarabilir ve hangi kategorilerin hazır olduğunu görebilirsiniz.",
    },
    example: { en: "One library per language.", ar: "مكتبة واحدة لكل لغة.", tr: "Dil başına bir kitaplık." },
    demo: "tabs",
  },
  {
    id: "studio-new",
    route: "studio",
    tab: "run",
    target: '[data-tour="studio-new"]',
    title: { en: "Start a new category", ar: "ابدأ فئة جديدة" },
    body: {
      en: "Press + New to open a blank category. Use Import to load a JSON file, or open an existing category from the grid below to edit it.",
      ar: "اضغط + جديد لفتح فئة فارغة. استخدم «استيراد» لتحميل ملف JSON، أو افتح فئة موجودة من الشبكة بالأسفل لتعديلها.",
      tr: "Boş bir kategori açmak için + Yeni'ye basın. JSON dosyası yüklemek için İçe Aktar'ı kullanın veya düzenlemek için aşağıdaki ızgaradan mevcut bir kategoriyi açın.",
    },
    example: { en: "Create or open a category.", ar: "أنشئ فئة أو افتح واحدة.", tr: "Bir kategori oluşturun veya açın." },
    demo: "tap",
  },
  {
    id: "studio-editor",
    route: "studio",
    tab: "run",
    target: '[data-tour="studio-editor"]',
    title: { en: "The category card", ar: "بطاقة الفئة" },
    body: {
      en: "This is the full card editor: the category name, the two gift icons used for left and right, and up to 16 competitors. Each competitor can have a name, chat aliases, a photo or an emoji. Save when done.",
      ar: "هذا هو محرر البطاقة الكامل: اسم الفئة، وأيقونتا الهدايا لليمين واليسار، وحتى 16 متسابقًا. لكل متسابق اسم وأسماء دردشة وصورة أو رمز تعبيري. احفظ عند الانتهاء.",
      tr: "Bu tam kart düzenleyicisidir: kategori adı, sol ve sağ için iki hediye simgesi ve 16 yarışmacıya kadar. Her yarışmacının adı, sohbet takma adları, fotoğrafı veya emojisi olabilir. Bitince kaydedin.",
    },
    example: { en: "Name, gifts, competitors.", ar: "الاسم، الهدايا، المتسابقون.", tr: "Ad, hediyeler, yarışmacılar." },
    demo: "pick",
  },
  {
    id: "studio-photos",
    route: "studio",
    tab: "run",
    target: '[data-tour="studio-fetch-photos"]',
    title: { en: "Fill the photos", ar: "املأ الصور" },
    body: {
      en: "Fetch all photos grabs free Wikimedia images for every competitor. Inside a category you can also upload and crop your own, or paste an image link. Photo coverage shows what is missing.",
      ar: "«جلب كل الصور» يجلب صورًا مجانية من ويكيميديا لكل متسابق. داخل الفئة يمكنك أيضًا رفع صورك وقصّها أو لصق رابط صورة. يُظهر «تغطية الصور» ما ينقص.",
      tr: "Tüm fotoğrafları getir, her yarışmacı için Wikimedia'dan ücretsiz görseller alır. Kategori içinde kendi fotoğrafınızı yükleyip kırpabilir veya bir görsel bağlantısı yapıştırabilirsiniz. Fotoğraf kapsamı eksikleri gösterir.",
    },
    example: { en: "Every card gets a face.", ar: "لكل بطاقة وجه.", tr: "Her karta bir yüz." },
    demo: "gift",
  },
  {
    id: "studio-content",
    route: "studio",
    tab: "run",
    target: '[data-tour="studio-content"]',
    title: { en: "Manage the whole library", ar: "أدر المكتبة كاملة" },
    body: {
      en: "The Content panel lists every competitor, how many photos each category has, and the category order. Edit, delete, reorder, or create a category from here. Saved changes are ready for Queue and Run.",
      ar: "تسرد لوحة المحتوى كل متسابق، وعدد صور كل فئة، وترتيب الفئات. عدّل أو احذف أو أعد الترتيب أو أنشئ فئة من هنا. التغييرات المحفوظة جاهزة في قائمة الانتظار والتشغيل.",
      tr: "İçerik paneli her yarışmacıyı, her kategorinin kaç fotoğrafı olduğunu ve kategori sırasını listeler. Buradan düzenleyin, silin, yeniden sıralayın veya kategori oluşturun. Kaydedilen değişiklikler Sıra ve Çalıştır için hazırdır.",
    },
    example: { en: "Reorder and keep it tidy.", ar: "أعد الترتيب وحافظ على التنظيم.", tr: "Yeniden sıralayın ve düzenli tutun." },
    demo: "pick",
  },
  {
    id: "settings-timings",
    tab: "settings",
    target: '[data-tour="settings-timings"]',
    title: { en: "Round length and vote weight", ar: "مدة الجولة ووزن التصويت" },
    body: {
      en: "Round seconds, sudden death, chat weight and gift weight. The show timings below control how long each phase stays on screen.",
      ar: "ثواني الجولة، الموت المفاجئ، وزن الدردشة ووزن الهدية. توقيتات العرض بالأسفل تتحكم في مدة كل مرحلة على الشاشة.",
      tr: "Tur süresi, ani ölüm, sohbet ağırlığı ve hediye ağırlığı. Aşağıdaki gösteri süreleri her aşamanın ekranda ne kadar kalacağını belirler.",
    },
    example: { en: "Adjust a number.", ar: "عدّل رقمًا.", tr: "Bir sayıyı ayarlayın." },
    demo: "slide",
  },
  {
    id: "style-background",
    tab: "settings",
    target: '[data-tour="style-background"]',
    title: { en: "Background and photos", ar: "الخلفية والصور" },
    body: {
      en: "Open Appearance to pick the show background colour. Competitor photos are edited in Studio.",
      ar: "افتح «المظهر» لاختيار لون خلفية العرض. تُعدّل صور المتسابقين في الاستوديو.",
      tr: "Gösteri arka plan rengini seçmek için Görünüm'ü açın. Yarışmacı fotoğrafları Stüdyo'da düzenlenir.",
    },
    example: { en: "Change the colour.", ar: "غيّر اللون.", tr: "Rengi değiştirin." },
    demo: "slide",
  },
  {
    id: "advanced",
    tab: "settings",
    target: '[data-tour="settings-advanced"]',
    title: { en: "Show tuning", ar: "ضبط العرض" },
    body: {
      en: "Advanced holds the show-look sliders, bracket pacing and the visual toggles. Open it when you want finer control over how the show moves.",
      ar: "يحتوي «متقدم» على أشرطة مظهر العرض وإيقاع القوس ومفاتيح العرض. افتحه عندما تريد تحكمًا أدق في حركة العرض.",
      tr: "Gelişmiş; gösteri görünümü kaydırıcılarını, braket hızını ve görsel anahtarları içerir. Gösterinin akışı üzerinde daha ince kontrol için açın.",
    },
    example: { en: "Fine-tune the show.", ar: "اضبط العرض بدقة.", tr: "Gösteriyi ince ayarlayın." },
    demo: "toggle",
  },
  {
    id: "done",
    tab: "run",
    target: null,
    title: { en: "You're ready", ar: "أنت جاهز" },
    body: {
      en: "That is the whole loop: pick a category, start the show, let chat vote, and crown a champion. Reopen this tour any time from Get started.",
      ar: "هذه هي الحلقة كاملة: اختر فئة، ابدأ العرض، دع الدردشة تصوّت، وتوّج بطلًا. أعد فتح الجولة في أي وقت من زر «ابدأ العرض».",
      tr: "Döngü bu kadar: bir kategori seçin, gösteriyi başlatın, sohbet oy versin ve şampiyonu taçlandırın. Bu turu istediğiniz zaman Başla düğmesinden yeniden açın.",
    },
    example: { en: "Go live when ready.", ar: "انطلق عندما تكون جاهزًا.", tr: "Hazır olduğunuzda yayına geçin." },
    demo: "gift",
  },
];
