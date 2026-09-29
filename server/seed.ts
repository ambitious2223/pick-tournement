import { promises as fs } from "node:fs";
import path from "node:path";
import type { Category, Gift, Item } from "../shared/types.ts";
import { CATEGORIES_DIR, ensureDirs } from "./store.ts";

type SeedItem = [name: string, aliases: string, emoji?: string];

interface SeedCategory {
  id: string;
  name: string;
  emoji: string;
  items: SeedItem[];
}

const DEFAULT_GIFT_PAIR: [Gift, Gift] = [
  { id: "rose", name: "Rose", icon: "🌹" },
  { id: "tiktok", name: "TikTok", icon: "🎵" },
];

const SEED: SeedCategory[] = [
  {
    id: "arab-football",
    name: "Arab Football Stars",
    emoji: "⚽",
    items: [
      ["Mohamed Salah", "محمد صلاح, salah"],
      ["Riyad Mahrez", "رياض محرز, mahrez"],
      ["Achraf Hakimi", "أشرف حكيمي, hakimi"],
      ["Hakim Ziyech", "حكيم زياش, ziyech"],
      ["Yassine Bounou", "ياسين بونو, bono"],
      ["Salem Al-Dawsari", "سالم الدوسري, al dawsari"],
      ["Ali Al-Bulaihi", "علي البليهي"],
      ["Mohamed Elneny", "محمد النني, elneny"],
      ["Mahmoud Trezeguet", "محمود تريزيجيه, trezeguet"],
      ["Mostafa Mohamed", "مصطفى محمد"],
      ["Firas Al-Buraikan", "فراس البريكان"],
      ["Sofiane Boufal", "سفيان بوفال"],
      ["Ayoub El Kaabi", "أيوب الكعبي"],
      ["Youssef Msakni", "يوسف المساكني"],
      ["Ali Mabkhout", "علي مبخوت"],
      ["Yacine Brahimi", "ياسين براهيمي"],
    ],
  },
  {
    id: "arab-singers",
    name: "Arab Singers",
    emoji: "🎤",
    items: [
      ["Amr Diab", "عمرو دياب"],
      ["Mohamed Ramadan", "محمد رمضان"],
      ["Nancy Ajram", "نانسي عجرم"],
      ["Fairuz", "فيروز"],
      ["Umm Kulthum", "أم كلثوم"],
      ["Kadim Al Sahir", "كاظم الساهر"],
      ["Elissa", "إليسا"],
      ["Ragheb Alama", "راغب علامة"],
      ["Sherine", "شيرين"],
      ["Tamer Hosny", "تامر حسني"],
      ["Hussain Al Jassmi", "حسين الجسمي"],
      ["Balqees", "بلقيس"],
      ["Ahlam", "أحلام"],
      ["Mohammed Abdu", "محمد عبده"],
      ["Angham", "أنغام"],
      ["Wael Kfoury", "وائل كفوري"],
    ],
  },
  {
    id: "arab-actors",
    name: "Arab Actors",
    emoji: "🎬",
    items: [
      ["Adel Emam", "عادل إمام"],
      ["Ahmed Helmy", "أحمد حلمي"],
      ["Mona Zaki", "منى زكي"],
      ["Youssef El Sherif", "يوسف الشريف"],
      ["Hend Sabri", "هند صبري"],
      ["Amina Khalil", "أمينة خليل"],
      ["Hassan El Raddad", "حسن الرداد"],
      ["Eyad Nassar", "إياد نصار"],
      ["Nadine Nassib Njeim", "نادين نسيب نجيم"],
      ["Karim Abdel Aziz", "كريم عبد العزيز"],
      ["Ahmed Ezz", "أحمد عز"],
      ["Nelly Karim", "نيللي كريم"],
      ["Dhafer L'Abidine", "ظافر العابدين"],
      ["Menna Shalabi", "منة شلبي"],
      ["Asser Yassin", "آسر ياسين"],
      ["Ghada Adel", "غادة عادل"],
    ],
  },
  {
    id: "quran-reciters",
    name: "Quran Reciters",
    emoji: "📖",
    items: [
      ["Mishary Alafasy", "مشاري العفاسي, alafasy"],
      ["Abdul Rahman Al-Sudais", "عبد الرحمن السديس, sudais"],
      ["Maher Al Muaiqly", "ماهر المعيقلي, muaiqly"],
      ["Abdul Basit Abdul Samad", "عبد الباسط عبد الصمد"],
      ["Saad Al-Ghamdi", "سعد الغامدي"],
      ["Yasser Al-Dosari", "ياسر الدوسري"],
      ["Omar Al-Kazabri", "عمر القزابري"],
      ["Mahmoud Khalil Al-Hussary", "محمود خليل الحصري"],
      ["Muhammad Siddiq Al-Minshawi", "محمد صديق المنشاوي"],
      ["Mustafa Ismail", "مصطفى إسماعيل"],
      ["Ali Al-Huthaify", "علي الحذيفي"],
      ["Saud Al-Shuraim", "سعود الشريم"],
      ["Ahmed Al-Ajmi", "أحمد العجمي"],
      ["Fares Abbad", "فارس عباد"],
      ["Idris Abkar", "إدريس أبكر"],
      ["Abdul Rahman Mossad", "عبد الرحمن مسعد"],
    ],
  },
  {
    id: "me-foods",
    name: "Middle Eastern Foods",
    emoji: "🍽️",
    items: [
      ["Kabsa", "كبسة", "🍚"],
      ["Shawarma", "شاورما", "🌯"],
      ["Falafel", "فلافل", "🧆"],
      ["Hummus", "حمص", "🥣"],
      ["Mansaf", "منسف", "🍲"],
      ["Koshari", "كشري", "🍝"],
      ["Maqluba", "مقلوبة", "🍛"],
      ["Mandi", "مندي", "🍗"],
      ["Fattoush", "فتوش", "🥗"],
      ["Tabbouleh", "تبولة", "🌿"],
      ["Shish Tawook", "شيش طاووق", "🍢"],
      ["Molokhia", "ملوخية", "🍜"],
      ["Kibbeh", "كبة", "🥟"],
      ["Foul Medames", "فول مدمس", "🫘"],
      ["Musakhan", "مسخن", "🍗"],
      ["Harees", "هريس", "🥣"],
    ],
  },
  {
    id: "me-cities",
    name: "Middle Eastern Cities",
    emoji: "🏙️",
    items: [
      ["Dubai", "دبي", "🌆"],
      ["Riyadh", "الرياض", "🏙️"],
      ["Cairo", "القاهرة", "🐪"],
      ["Doha", "الدوحة", "🏗️"],
      ["Abu Dhabi", "أبوظبي", "🏛️"],
      ["Beirut", "بيروت", "🌊"],
      ["Amman", "عمّان", "🏛️"],
      ["Casablanca", "الدار البيضاء", "🕌"],
      ["Istanbul", "إسطنبول", "🌉"],
      ["Mecca", "مكة", "🕋"],
      ["Medina", "المدينة المنورة", "🕌"],
      ["Muscat", "مسقط", "⛵"],
      ["Kuwait City", "مدينة الكويت", "🏙️"],
      ["Manama", "المنامة", "🌴"],
      ["Jeddah", "جدة", "⚓"],
      ["Alexandria", "الإسكندرية", "🌊"],
    ],
  },
  {
    id: "me-landmarks",
    name: "Middle Eastern Landmarks",
    emoji: "🕌",
    items: [
      ["Burj Khalifa", "برج خليفة", "🏗️"],
      ["Kaaba", "الكعبة", "🕋"],
      ["Petra", "البتراء", "🏛️"],
      ["Pyramids of Giza", "أهرامات الجيزة", "🔺"],
      ["Masjid al-Haram", "المسجد الحرام", "🕌"],
      ["Al-Aqsa Mosque", "المسجد الأقصى", "🕌"],
      ["Burj Al Arab", "برج العرب", "⛵"],
      ["Sheikh Zayed Grand Mosque", "جامع الشيخ زايد", "🕌"],
      ["Hagia Sophia", "آيا صوفيا", "🏛️"],
      ["Blue Mosque", "المسجد الأزرق", "🕌"],
      ["Dead Sea", "البحر الميت", "🌊"],
      ["Nile River", "نهر النيل", "🚤"],
      ["Palm Jumeirah", "نخلة جميرا", "🌴"],
      ["Al-Ula", "العلا", "🏜️"],
      ["Wadi Rum", "وادي رم", "🏜️"],
      ["Citadel of Aleppo", "قلعة حلب", "🏰"],
    ],
  },
  {
    id: "arab-sweets",
    name: "Arabic Desserts & Drinks",
    emoji: "🍮",
    items: [
      ["Kunafa", "كنافة", "🍮"],
      ["Baklava", "بقلاوة", "🥮"],
      ["Luqaimat", "لقيمات", "🍩"],
      ["Umm Ali", "أم علي", "🥧"],
      ["Basbousa", "بسبوسة", "🍰"],
      ["Muhallebi", "مهلبية", "🍨"],
      ["Qatayef", "قطايف", "🥟"],
      ["Ma'amoul", "معمول", "🍪"],
      ["Arabic Coffee", "قهوة عربية", "☕"],
      ["Moroccan Mint Tea", "شاي مغربي", "🍵"],
      ["Karkade", "كركديه", "🌺"],
      ["Sahlab", "سحلب", "🥛"],
      ["Jallab", "جلاب", "🥤"],
      ["Ayran", "عيران", "🥛"],
      ["Qamar al-Din", "قمر الدين", "🍑"],
      ["Tamarind Drink", "تمر هندي", "🥤"],
    ],
  },
  {
    id: "me-history",
    name: "Historical Scholars & Leaders",
    emoji: "📜",
    items: [
      ["Al-Khwarizmi", "الخوارزمي", "🔢"],
      ["Ibn Sina", "ابن سينا", "🩺"],
      ["Ibn Battuta", "ابن بطوطة", "🧭"],
      ["Ibn Khaldun", "ابن خلدون", "📚"],
      ["Al-Razi", "الرازي", "⚗️"],
      ["Saladin", "صلاح الدين الأيوبي", "⚔️"],
      ["Harun al-Rashid", "هارون الرشيد", "👑"],
      ["Tariq ibn Ziyad", "طارق بن زياد", "🔥"],
      ["Al-Idrisi", "الإدريسي", "🗺️"],
      ["Jabir ibn Hayyan", "جابر بن حيان", "🧪"],
      ["Al-Biruni", "البيروني", "🌍"],
      ["Ibn Rushd", "ابن رشد", "📖"],
      ["Al-Masudi", "المسعودي", "📜"],
      ["Nizam al-Mulk", "نظام الملك", "🏛️"],
      ["Omar Khayyam", "عمر الخيام", "✒️"],
      ["Ibn al-Haytham", "ابن الهيثم", "👁️"],
    ],
  },
  {
    id: "me-countries",
    name: "Middle Eastern Countries",
    emoji: "🌍",
    items: [
      ["Saudi Arabia", "السعودية, ksa", "🇸🇦"],
      ["United Arab Emirates", "الإمارات, uae", "🇦🇪"],
      ["Egypt", "مصر", "🇪🇬"],
      ["Qatar", "قطر", "🇶🇦"],
      ["Kuwait", "الكويت", "🇰🇼"],
      ["Bahrain", "البحرين", "🇧🇭"],
      ["Oman", "عمان", "🇴🇲"],
      ["Jordan", "الأردن", "🇯🇴"],
      ["Lebanon", "لبنان", "🇱🇧"],
      ["Syria", "سوريا", "🇸🇾"],
      ["Iraq", "العراق", "🇮🇶"],
      ["Yemen", "اليمن", "🇾🇪"],
      ["Morocco", "المغرب", "🇲🇦"],
      ["Algeria", "الجزائر", "🇩🇿"],
      ["Tunisia", "تونس", "🇹🇳"],
      ["Palestine", "فلسطين", "🇵🇸"],
    ],
  },
];

function slug(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function buildCategory(seed: SeedCategory): Category {
  const items: Item[] = seed.items.map(([name, aliases, itemEmoji]) => {
    const item: Item = {
      id: slug(name),
      name,
      aliases: aliases
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean),
    };
    if (itemEmoji) item.emoji = itemEmoji;
    return item;
  });
  return {
    id: seed.id,
    name: seed.name,
    items,
    giftPair: DEFAULT_GIFT_PAIR,
  };
}

export async function seedCategories(force = false): Promise<string[]> {
  await ensureDirs();
  const written: string[] = [];
  for (const seed of SEED) {
    const file = path.join(CATEGORIES_DIR, `${seed.id}.json`);
    if (!force) {
      const exists = await fs
        .stat(file)
        .then(() => true)
        .catch(() => false);
      if (exists) continue;
    }
    const category = buildCategory(seed);
    await fs.writeFile(file, `${JSON.stringify(category, null, 2)}\n`, "utf8");
    written.push(seed.id);
  }
  return written;
}

export async function ensureSeeded(): Promise<void> {
  const written = await seedCategories(false);
  if (written.length > 0) {
    console.log(`[seed] created ${written.length} categories: ${written.join(", ")}`);
  }
}

const invokedDirectly = process.argv[1]?.replace(/\\/g, "/").endsWith("server/seed.ts");
if (invokedDirectly) {
  seedCategories(process.argv.includes("--force")).then((written) => {
    console.log(written.length ? `[seed] wrote: ${written.join(", ")}` : "[seed] nothing to do (use --force)");
  });
}
