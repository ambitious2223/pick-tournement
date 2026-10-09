import { promises as fs } from "node:fs";
import path from "node:path";
import type { Category, Gift, Item } from "../shared/types.ts";
import { CATEGORIES_DIR, ensureDirs } from "./store.ts";

type SeedItem = [name: string, aliases: string, emoji?: string];

interface SeedCategory {
  id: string;
  name: string;
  nameAr: string;
  emoji: string;
  items: SeedItem[];
}

const DEFAULT_GIFT_PAIR: [Gift, Gift] = [
  { id: "rose", name: "Rose", icon: "🌹" },
  { id: "tiktok", name: "TikTok", icon: "🎵" },
];

const SEED: SeedCategory[] = [
  {
    id: "arab-singers",
    name: "Arab Singers",
    nameAr: "مطربون عرب",
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
    nameAr: "ممثلون عرب",
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
    id: "me-foods",
    name: "Middle Eastern Foods",
    nameAr: "أكلات الشرق الأوسط",
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
    nameAr: "مدن الشرق الأوسط",
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
    nameAr: "معالم الشرق الأوسط",
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
    nameAr: "حلويات ومشروبات عربية",
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
    nameAr: "علماء وقادة تاريخيون",
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
    nameAr: "دول الشرق الأوسط",
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
    nameAr: seed.nameAr,
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

/**
 * Adds the Arabic name (`nameAr`) to the built-in categories on existing installs.
 * It only touches a category when its stored name still matches the original English
 * seed name, so user-renamed or user-edited categories are left alone.
 */
export async function migrateCategoryArabicNames(): Promise<string[]> {
  await ensureDirs();
  const changed: string[] = [];
  for (const seed of SEED) {
    const file = path.join(CATEGORIES_DIR, `${seed.id}.json`);
    let raw: string;
    try {
      raw = await fs.readFile(file, "utf8");
    } catch {
      continue;
    }
    let category: Category;
    try {
      category = JSON.parse(raw) as Category;
    } catch {
      continue;
    }
    if (!category || category.id !== seed.id) continue;
    if (category.nameAr || category.name !== seed.name) continue;
    category.nameAr = seed.nameAr;
    await fs.writeFile(file, `${JSON.stringify(category, null, 2)}\n`, "utf8");
    changed.push(seed.id);
  }
  return changed;
}

export async function ensureSeeded(): Promise<void> {
  const written = await seedCategories(false);
  if (written.length > 0) {
    console.log(`[seed] created ${written.length} categories: ${written.join(", ")}`);
  }
  const migrated = await migrateCategoryArabicNames();
  if (migrated.length > 0) {
    console.log(`[seed] added Arabic names to ${migrated.length} categories`);
  }
}

const invokedDirectly = process.argv[1]?.replace(/\\/g, "/").endsWith("server/seed.ts");
if (invokedDirectly) {
  seedCategories(process.argv.includes("--force")).then((written) => {
    console.log(written.length ? `[seed] wrote: ${written.join(", ")}` : "[seed] nothing to do (use --force)");
  });
}
