import type { Lang } from "../../shared/types.ts";

/**
 * The one list of every sound the host can replace with an upload. There are no
 * built-in tones any more — a cue plays only when a file exists at
 * `data/sounds/<id>.<ext>` (uploaded from Control → Sound).
 *
 * Each entry says when the cue fires and what it is meant to sound like, so the
 * host can find a matching file quickly.
 */
export interface CueDef {
  id: string;
  group: string;
  when: Record<Lang, string>;
  what: Record<Lang, string>;
}

export const CUE_CATALOG: CueDef[] = [
  // ---- category ----
  {
    id: "category.start",
    group: "category",
    when: { ar: "عند فتح شاشة التصويت على الفئة التالية", en: "The show opens the “vote for the next category” screen" },
    what: { ar: "نغمة صاعدة ترحيبية (حوالي ١٫٢ ثانية)", en: "A rising, welcoming sting (~1.2s)" },
  },
  {
    id: "category.vote",
    group: "category",
    when: { ar: "كل رسالة دردشة تصوّت لفئة", en: "Each chat message that votes for a category" },
    what: { ar: "نقرة قصيرة وهادئة", en: "A quick, soft tick" },
  },
  {
    id: "category.winner",
    group: "category",
    when: { ar: "عند إغلاق تصويت الفئة واختيار فئة", en: "The category vote closes and a category is chosen" },
    what: { ar: "زخرفة قصيرة مبهجة من ٣ نغمات", en: "A short uplifting 3-note flourish" },
  },

  // ---- round ----
  {
    id: "round.intro",
    group: "round",
    when: { ar: "عند إعلان جولة جديدة (دور الـ16 ← النهائي)", en: "A new round is announced (Round of 16 → Final)" },
    what: { ar: "تصاعد تشويق يكبر مع كل جولة", en: "A tension riser that grows bigger each round" },
  },

  // ---- bracket (the cinematic) ----
  {
    id: "bracket.intro",
    group: "bracket",
    when: { ar: "عند بدء الحركة السينمائية للجدول (تقريب)", en: "The bracket cinematic starts (zoom-in)" },
    what: { ar: "صوت انزلاق حماسي", en: "An energetic whoosh" },
  },
  {
    id: "bracket.focus",
    group: "bracket",
    when: { ar: "عندما تستقر الكاميرا على المباراة الجارية", en: "The camera settles on the live match" },
    what: { ar: "نقرة صغيرة", en: "A small tick" },
  },
  {
    id: "bracket.zoom.in",
    group: "bracket",
    when: { ar: "أثناء التقريب نحو المباراة الجارية", en: "During the bracket zoom into the live match" },
    what: { ar: "مسح صاعد", en: "A rising sweep" },
  },
  {
    id: "bracket.reveal",
    group: "bracket",
    when: { ar: "عندما تكشف الحركة عن المباراة التالية", en: "The cinematic reveals the next match / outcome" },
    what: { ar: "نغمة مشرقة من ٤ نغمات", en: "A bright 4-note hit" },
  },
  {
    id: "bracket.loser",
    group: "bracket",
    when: { ar: "عند خروج متسابق من الجدول", en: "A competitor is eliminated in the bracket" },
    what: { ar: "ثُدّ هابط هادئ", en: "A soft descending thud" },
  },
  {
    id: "bracket.tension",
    group: "bracket",
    when: { ar: "الأدوار المتأخرة فقط (نصف النهائي/النهائي) داخل الجدول", en: "Later rounds only (semis/final) during the bracket" },
    what: { ar: "نبض يشبه دقات القلب", en: "A heartbeat pulse" },
  },
  {
    id: "bracket.outro",
    group: "bracket",
    when: { ar: "عند انتهاء الحركة السينمائية للجدول (تبعيد)", en: "The bracket cinematic winds down (zoom-out)" },
    what: { ar: "انحدار هادئ", en: "A smooth wind-down" },
  },
  {
    id: "bracket.winner",
    group: "bracket",
    when: { ar: "عند تقدّم فائز في الجدول", en: "The bracket advances a winner" },
    what: { ar: "تأكيد دافئ من نغمتين", en: "A warm 2-note confirmation" },
  },

  // ---- match ----
  {
    id: "match.countdown",
    group: "match",
    when: { ar: "العدّ ٣-٢-١ قبل انطلاق المباراة", en: "The 3-2-1 just before a match goes live" },
    what: { ar: "صفير عدّ قصير", en: "A short countdown beep" },
  },
  {
    id: "match.start",
    group: "match",
    when: { ar: "عند انطلاق المباراة", en: "A match goes live" },
    what: { ar: "زقزقة ثلاثية مشرقة مع ضربة", en: "A bright triple chirp with a kick" },
  },
  {
    id: "match.tick",
    group: "match",
    when: { ar: "كل ثانية من آخر ١٠ ثوانٍ", en: "Each of the last 10 seconds" },
    what: { ar: "تكّة ساعة قصيرة", en: "A short clock tick" },
  },
  {
    id: "match.suddenDeath",
    group: "match",
    when: { ar: "عند التعادل والدخول في الموت المفاجئ", en: "A tie triggers sudden death" },
    what: { ar: "طعنة درامية منخفضة", en: "A low dramatic stab" },
  },
  {
    id: "match.end",
    group: "match",
    when: { ar: "عند انتهاء وقت المباراة", en: "The match clock ends" },
    what: { ar: "ضربة ختامية", en: "A closing impact" },
  },

  // ---- votes ----
  {
    id: "vote.chat",
    group: "votes",
    when: { ar: "كل صوت دردشة خلال المباراة (محدود التكرار)", en: "Every chat vote during a match (rate-limited)" },
    what: { ar: "نبضة صغيرة جدًا", en: "A tiny blip" },
  },
  {
    id: "vote.gift.small",
    group: "votes",
    when: { ar: "وصول هدية صغيرة (أقل من ١٠ عملات)", en: "A small gift arrives (under 10 coins)" },
    what: { ar: "لمعة مبهجة من نغمتين", en: "A cheerful 2-note sparkle" },
  },
  {
    id: "vote.gift.medium",
    group: "votes",
    when: { ar: "هدية متوسطة (١٠–٤٩ عملة)", en: "A medium gift (10–49 coins)" },
    what: { ar: "مقطع من ٣ نغمات", en: "A 3-note riff" },
  },
  {
    id: "vote.gift.large",
    group: "votes",
    when: { ar: "هدية كبيرة (٥٠ عملة أو أكثر)", en: "A big gift (50+ coins)" },
    what: { ar: "فانفار كبير من ٤ نغمات", en: "A big 4-note fanfare" },
  },
  {
    id: "vote.lead",
    group: "votes",
    when: { ar: "عند تغيّر المتصدّر في التصويت", en: "The vote lead changes sides" },
    what: { ar: "تنبيه صاعد من نغمتين", en: "A rising 2-note alert" },
  },

  // ---- result ----
  {
    id: "result.win",
    group: "result",
    when: { ar: "عند ظهور شاشة النتيجة", en: "The result screen appears" },
    what: { ar: "تسلسل مبهج من ٤ نغمات", en: "An uplifting 4-note run" },
  },
  {
    id: "result.lose",
    group: "result",
    when: { ar: "عند إظهار الطرف الخاسر", en: "The losing side is shown" },
    what: { ar: "نغمة هابطة هادئة", en: "A soft descending tone" },
  },

  // ---- champion / top pickers ----
  {
    id: "champion.win",
    group: "champion",
    when: { ar: "عند تتويج البطل (وأيضًا زر «اختبار الصوت»)", en: "A champion is crowned (also the “test sound” cue)" },
    what: { ar: "فانفار نصر كامل", en: "A full victory fanfare" },
  },
  {
    id: "champion.reveal",
    group: "champion",
    when: { ar: "بعد ٠٫٨ ثانية من التتويج", en: "0.8s after a champion is crowned" },
    what: { ar: "بريق ولمعان", en: "A shimmer / sparkle" },
  },
  {
    id: "champion.supporter",
    group: "champion",
    when: { ar: "عند كشف كل من أعلى الداعمين في النهائي", en: "Each top supporter is revealed on the final" },
    what: { ar: "رنّة مشرقة", en: "A bright ping" },
  },

  // ---- live events ----
  {
    id: "live.like",
    group: "live",
    when: { ar: "عند تفاعل المشاهدين بالإعجاب (محدود التكرار)", en: "Viewers are liking (rate-limited)" },
    what: { ar: "نقرة ماريمبا هادئة", en: "A soft marimba tick" },
  },
  {
    id: "live.follow",
    group: "live",
    when: { ar: "متابع جديد", en: "A new follower" },
    what: { ar: "جرس من نغمتين", en: "A 2-note chime" },
  },
  {
    id: "live.share",
    group: "live",
    when: { ar: "عند مشاركة البث", en: "A viewer shares the stream" },
    what: { ar: "نبضة من نغمتين", en: "A 2-note blip" },
  },
  {
    id: "live.subscribe",
    group: "live",
    when: { ar: "مشترك جديد", en: "A new subscriber" },
    what: { ar: "صعود من ٤ نغمات", en: "A 4-note rise" },
  },
  {
    id: "live.member",
    group: "live",
    when: { ar: "عضو جديد ينضم (محدود التكرار)", en: "A new member joins (rate-limited)" },
    what: { ar: "نغمة دافئة واحدة", en: "A single warm tone" },
  },
];

export const CUE_IDS: string[] = CUE_CATALOG.map((c) => c.id);

export const CUE_BY_ID: Record<string, CueDef> = Object.fromEntries(CUE_CATALOG.map((c) => [c.id, c]));

/** The catalog grouped in display order. */
export const CUE_GROUPS: { group: string; cues: CueDef[] }[] = (() => {
  const order: string[] = [];
  const map = new Map<string, CueDef[]>();
  for (const cue of CUE_CATALOG) {
    if (!map.has(cue.group)) {
      map.set(cue.group, []);
      order.push(cue.group);
    }
    map.get(cue.group)!.push(cue);
  }
  return order.map((group) => ({ group, cues: map.get(group)! }));
})();
