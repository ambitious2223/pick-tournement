import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { RoundId } from "../../shared/types.ts";

export type Lang = "ar" | "en";

const STORAGE_KEY = "pl.lang";

interface Entry {
  ar: string;
  en: string;
}

export const DICT = {
  "common.connecting": { ar: "جارٍ الاتصال…", en: "Connecting…" },
  "common.tbd": { ar: "؟", en: "TBD" },
  "common.save": { ar: "حفظ", en: "Save" },
  "common.saved": { ar: "تم الحفظ ✓", en: "Saved ✓" },
  "common.delete": { ar: "حذف", en: "Delete" },
  "common.clear": { ar: "مسح", en: "clear" },
  "common.close": { ar: "إغلاق", en: "Close" },

  "nav.control": { ar: "التحكم", en: "Control" },
  "nav.studio": { ar: "الاستوديو", en: "Studio" },
  "nav.overlay": { ar: "الأوفرلاي", en: "Overlay" },
  "nav.broadcast": { ar: "البث", en: "Broadcast" },
  "nav.debug": { ar: "تصحيح", en: "debug" },
  "nav.offline": {
    ar: "تعذّر الوصول إلى الخادم — أغلق هذه النافذة وشغّل Tournament.bat مرة أخرى.",
    en: "Server not reachable — close this window and run Tournament.bat again.",
  },

  "nav.setup": { ar: "الإعداد", en: "Setup" },
  "setup.badge": { ar: "دليل الإعداد", en: "Setup guide" },
  "setup.title": { ar: "جهّز العرض في دقائق", en: "Get the show running in minutes" },
  "setup.intro": {
    ar: "هذه خطوات لمرة واحدة. بعدها كل شيء يعمل تلقائياً — لا حاجة للتبديل بين الشاشات.",
    en: "These are one-time steps. After that everything runs automatically — no switching between screens.",
  },
  "setup.s1.title": { ar: "1) شغّل الخادم", en: "1) Start the server" },
  "setup.s1.body": {
    ar: "انقر نقراً مزدوجاً على Tournament.bat. يفتح غرفة التحكم على 127.0.0.1:8787.",
    en: "Double-click Tournament.bat. It opens the Control Room on 127.0.0.1:8787.",
  },
  "setup.s2.title": { ar: "2) صِل تيك توك (عبر Tikora)", en: "2) Connect TikTok (via Tikora)" },
  "setup.s2.body": {
    ar: "شغّل تطبيق Tikora (يتصل بتيك توك). من Tikora انسخ معرّف ومفتاح لعبة Pick League، ثم في التصحيح ← الاتصال المباشر ألصقهما واحفظ. لا حاجة لاسم المستخدم.",
    en: "Start your Tikora app (it connects to TikTok). In Tikora copy the Pick League game slug + key, then in Debug → Live connection paste and Save. No username needed.",
  },
  "setup.s3.title": { ar: "3) جهّز الفئات (اختياري)", en: "3) Prepare categories (optional)" },
  "setup.s3.body": {
    ar: "من الاستوديو أنشئ الفئات وعدّل العناصر والصور. هناك 10 فئات جاهزة.",
    en: "In the Studio, create categories and edit items and photos. Ten categories are already seeded.",
  },
  "setup.s4.title": { ar: "4) ابدأ العرض", en: "4) Start the show" },
  "setup.s4.body": {
    ar: "من غرفة التحكم، اختر فئة أو املأ القائمة، ثم اضغط \"العرض ← ابدأ\". يتولّى التسلسل التالي: تصويت الفئة ← مقدمة الجولة ← الجدول ← المباريات ← النتائج ← البطل، ثم ينتقل تلقائياً إلى الفئة التالية.",
    en: "From the Control Room pick a category or fill the queue, then press Show → Start. It runs: category vote → round intro → bracket → matches → results → champion, then the next category automatically.",
  },
  "setup.s5.title": { ar: "5) أضفه إلى OBS", en: "5) Add it to OBS" },
  "setup.s5.body": {
    ar: "أضف مصدر متصفح (Browser Source) بالرابط ‎http://127.0.0.1:8787/overlay وغيّر حجمه ليناسب المنطقة الوسطى بين الكاميرا والتعليقات. الخلفية شفافة افتراضياً؛ ويمكنك ضبط هوامش آمنة من الإعدادات. اضغط زر الصوت مرة واحدة على صفحة البث لتفعيل الصوت (يفعّله OBS تلقائياً).",
    en: "Add a Browser Source with http://127.0.0.1:8787/overlay and size it to the middle band between your camera and comments. The background is transparent by default; tune safe-area margins in Settings. Press the sound button once on the broadcast page to enable audio (OBS does this automatically).",
  },
  "setup.s6.title": { ar: "6) تدرّب بدون تيك توك", en: "6) Rehearse without TikTok" },
  "setup.s6.body": {
    ar: "من غرفة التحكم، شغّل \"جمهور مُحاكى\" أو استخدم حاقن الأصوات في التصحيح لتدريب كامل دون اتصال مباشر.",
    en: "In the Control Room turn on 'Simulated crowd', or use the Debug vote injector, to rehearse a full run without a live connection.",
  },
  "setup.openControl": { ar: "افتح غرفة التحكم", en: "Open Control Room" },
  "setup.openDebug": { ar: "إعداد الاتصال المباشر", en: "Set up live connection" },
  "setup.openBroadcast": { ar: "افتح البث", en: "Open broadcast" },

  "home.badge": { ar: "مسابقة تيك توك المباشرة", en: "TikTok Live Bracket" },
  "home.title1": { ar: "16 متسابقًا.", en: "16 competitors." },
  "home.title2": { ar: "بطل واحد.", en: "One champion." },
  "home.body": {
    ar: "يصوّت المشاهدون بكتابة اسم اللاعب الظاهر على الشاشة أو بإرسال الهدية الموضحة بجانب الجهة. كل مباراة تعمل بمؤقّت قابل للضبط، والفئات تتسلسل تلقائيًا — دون رجوع للخلف.",
    en: "Viewers vote by typing the on-screen name or sending the gift shown beside a side. Every match runs on a configurable timer, and categories chain automatically — no looping back.",
  },
  "home.setup.title": { ar: "الإعداد والبدء", en: "Setup & Start" },
  "home.setup.body": {
    ar: "دليل مختصر لمرة واحدة: شغّل الخادم، صِل تيك توك عبر Tikora، ثم أضف مصدر OBS وابدأ العرض.",
    en: "A short one-time guide: start the server, connect TikTok via Tikora, add the OBS source, and start the show.",
  },
  "home.control.title": { ar: "غرفة التحكم", en: "Control Room" },
  "home.control.body": {
    ar: "أدِر البطولة: ابدأ، أوقف مؤقتًا، مدّد الوقت، افرض الفائز، وأدِر قائمة الفئات والمحاكي.",
    en: "Run the tournament: start, pause, extend, force winners, manage the category queue and the simulator.",
  },
  "home.studio.title": { ar: "استوديو المحتوى", en: "Content Studio" },
  "home.studio.body": {
    ar: "أنشئ فئات و16 عنصرًا، وأضف الأسماء البديلة والهدايا، وارفع صور العناصر.",
    en: "Create categories and 16 items, add aliases and gifts, upload item photos.",
  },
  "home.debug.title": { ar: "وحدة التصحيح", en: "Debug Console" },
  "home.debug.body": {
    ar: "احقن أصواتًا، افرض النتائج، حاكِ الجمهور، واضبط الاتصال المباشر ومزيج الصوت، وافحص الحالة الخام.",
    en: "Inject votes, force outcomes, simulate crowds, set up the live connection and the sound mixer, and inspect raw state.",
  },
  "home.overlay.title": { ar: "أوفرلاي OBS", en: "OBS Overlay" },
  "home.overlay.body": {
    ar: "مصدر المتصفح الشفاف. أضف http://127.0.0.1:8787/overlay إلى OBS.",
    en: "The transparent browser source. Add http://127.0.0.1:8787/overlay to OBS.",
  },

  "show.idleTitle": { ar: "لا يوجد عرض حالياً", en: "No show running" },
  "show.idleHint": { ar: "استعد للتصويت!", en: "Get ready to vote!" },
  "show.preview": { ar: "معاينة — يبقى البث شفافاً داخل OBS", en: "Preview — stays transparent inside OBS" },
  "show.categoryTitle": { ar: "صوّتوا للفئة القادمة", en: "Vote for the next category" },
  "show.categoryHint": { ar: "اكتبوا اسم الفئة في الدردشة للتصويت", en: "Type a category name in chat to vote" },
  "show.bracketTitle": { ar: "الجدول", en: "Bracket" },
  "show.resultTitle": { ar: "النتيجة", en: "Result" },
  "show.winner": { ar: "الفائز", en: "Winner" },
  "show.paused": { ar: "متوقف مؤقتاً", en: "Paused" },
  "show.phase.category": { ar: "تصويت الفئة", en: "Category vote" },
  "show.phase.round-intro": { ar: "مقدمة الجولة", en: "Round intro" },
  "show.phase.bracket-intro": { ar: "الجدول — البداية", en: "Bracket — start" },
  "show.phase.match": { ar: "المباراة", en: "Match" },
  "show.phase.bracket-outro": { ar: "الجدول — النهاية", en: "Bracket — end" },
  "show.phase.result": { ar: "النتيجة", en: "Result" },
  "show.phase.champion": { ar: "البطل", en: "Champion" },
  "show.start": { ar: "▶ ابدأ العرض", en: "▶ Start show" },
  "show.stop": { ar: "■ إيقاف العرض", en: "■ Stop show" },
  "show.pause": { ar: "إيقاف مؤقت", en: "Pause" },
  "show.resume": { ar: "استئناف", en: "Resume" },
  "show.skip": { ar: "تخطٍّ للمرحلة", en: "Skip phase" },
  "show.confirmStop": { ar: "إيقاف العرض؟", en: "Stop the show?" },
  "show.seconds": { ar: "ثانية", en: "seconds" },
  "show.autoHint": {
    ar: "التسلسل التلقائي: تصويت الفئة ← الجدول ← المباريات واحدة تلو الأخرى حتى البطل.",
    en: "Automatic sequence: category vote → bracket → matches one after another until the champion.",
  },

  "round.r16": { ar: "دور الـ16", en: "Round of 16" },
  "round.qf": { ar: "ربع النهائي", en: "Quarterfinals" },
  "round.sf": { ar: "نصف النهائي", en: "Semifinals" },
  "round.final": { ar: "النهائي الكبير", en: "Grand Final" },

  "status.idle": { ar: "خامل", en: "idle" },
  "status.running": { ar: "قيد التشغيل", en: "running" },
  "status.paused": { ar: "متوقف مؤقتًا", en: "paused" },
  "status.done": { ar: "انتهى", en: "done" },

  "stage.waitingTitle": { ar: "بانتظار الجدول التالي…", en: "Waiting for the next bracket…" },
  "stage.pickCategory": { ar: "اختر فئة من اليسار للبدء.", en: "Pick a category on the left to begin." },
  "stage.matchOf": { ar: "مباراة {n} / {total}", en: "Match {n} / {total}" },
  "vote.howTo": { ar: "كيف تصوّت", en: "How to vote" },
  "vote.freeChip": { ar: "💬 مجاناً: اكتب الاسم في الدردشة (+{weight})", en: "💬 Free: type the name in chat (+{weight})" },
  "vote.giftChip": { ar: "🎁 هدية: أرسل الهدية (+{weight})", en: "🎁 Gift: send the gift (+{weight})" },
  "vote.instruction": {
    ar: "صوت واحد لكل مشاهد — الهدية هي ما يمنحك وزناً أكبر.",
    en: "One vote per viewer — the gift is what gives you more.",
  },
  "stage.votes": { ar: "{n} صوت", en: "{n} votes" },
  "stage.total": { ar: "{n} إجمالًا", en: "{n} total" },
  "stage.totalVoters": { ar: "{n} صوت · {v} مصوّت", en: "{n} votes · {v} voters" },
  "stage.championOf": { ar: "البطل · {category}", en: "Champion · {category}" },
  "stage.wins": { ar: "يفوز بالبطولة", en: "wins the tournament" },
  "stage.seconds": { ar: "ثانية", en: "seconds" },
  "stage.paused": { ar: "متوقف", en: "paused" },
  "stage.frozen": { ar: "❄ مجمّد", en: "frozen ❄" },

  "control.run": { ar: "التشغيل", en: "Run" },
  "control.bracketView": { ar: "عرض الجدول", en: "Bracket view" },
  "control.matchView": { ar: "عرض المباراة", en: "Match view" },
  "control.pickCategory": { ar: "اختر فئة…", en: "Pick a category…" },
  "control.start": { ar: "ابدأ / أعد", en: "Start / restart" },
  "control.nextCategory": { ar: "الفئة التالية", en: "Next category" },
  "control.demo1": { ar: "▶ عرض جدول واحد", en: "▶ Demo 1 bracket" },
  "control.demo1Title": {
    ar: "شغّل جدولًا كاملًا بسرعة (فئة غنية بالصور) مع أصوات محاكاة",
    en: "Play one full bracket fast (photo-rich category) with simulated votes",
  },
  "control.demoAll": { ar: "⏩ عرض الكل", en: "⏩ Demo all" },
  "control.demoAllTitle": {
    ar: "شغّل كل الفئات متتالية وبسرعة مع أصوات محاكاة",
    en: "Play every category back-to-back, fast, with simulated votes",
  },
  "control.stopReset": { ar: "■ إيقاف / إعادة", en: "■ Stop / reset" },
  "control.statusLine": { ar: "{category} · {status}", en: "{category} · {status}" },
  "control.simOn": { ar: " · المحاكي مفعّل", en: " · simulator on" },
  "control.resume": { ar: "استئناف", en: "Resume" },
  "control.pause": { ar: "إيقاف مؤقت", en: "Pause" },
  "control.skip": { ar: "تخطٍّ", en: "Skip" },
  "control.extend": { ar: "+10 ث", en: "+10s" },
  "control.forceL": { ar: "فوز يسار", en: "Force L" },
  "control.forceR": { ar: "فوز يمين", en: "Force R" },
  "control.shortcuts": {
    ar: "اختصارات: مسافة تشغيل/إيقاف · N التالي · L/R فرض الفائز · B الجدول · M المباراة",
    en: "Shortcuts: Space start/pause · N next · L/R force winner · B bracket · M match",
  },
  "control.show": { ar: "العرض", en: "Show" },
  "control.sound": { ar: "الصوت", en: "Sound" },
  "control.settings": { ar: "الإعدادات", en: "Settings" },
  "control.queue": { ar: "القائمة", en: "Queue" },
  "control.simulator": { ar: "المحاكي", en: "Simulator" },
  "control.simulatorToggle": { ar: "جمهور مُحاكى (بدون تيك توك)", en: "Simulated crowd (no TikTok needed)" },
  "control.simulatorHelp": {
    ar: "يرسل أصوات دردشة وهدايا وهمية إلى المباراة الجارية لتتدرب على بطولة كاملة دون اتصال.",
    en: "Fires fake chat + gift votes at the live match so you can rehearse a full tournament offline.",
  },
  "control.simHintOn": { ar: "مفعّل", en: "on" },
  "control.confirmReset": {
    ar: "هل تريد إيقاف الجلسة كاملة وإعادة ضبطها؟ سيُمحى الجدول الحالي.",
    en: "Stop and reset the whole session? This clears the current tournament.",
  },

  "settings.roundSeconds": { ar: "الجولة (ث)", en: "Round (s)" },
  "settings.suddenDeath": { ar: "الموت المفاجئ (ث)", en: "Sudden death (s)" },
  "settings.chatWeight": { ar: "وزن التصويت المجاني (دردشة)", en: "Free vote weight (chat)" },
  "settings.giftWeight": { ar: "وزن الهدايا", en: "Gift weight" },
  "settings.tieRule": { ar: "قاعدة التعادل", en: "Tie rule" },
  "settings.tie.sudden": { ar: "الموت المفاجئ", en: "Sudden death" },
  "settings.tie.random": { ar: "عشوائي", en: "Random" },
  "settings.tie.seed": { ar: "التصنيف الأعلى", en: "Higher seed" },
  "settings.dedupe": { ar: "صوت واحد لكل مشاهد", en: "One chat vote per viewer" },
  "settings.autoNextMatch": { ar: "بدء المباراة التالية تلقائيًا", en: "Auto-start next match" },
  "settings.autoNextTournament": { ar: "الانتقال للبطولة التالية تلقائيًا", en: "Auto-chain next tournament" },
  "settings.autoStageView": { ar: "تبديل تلقائي (جدول ← مباراة)", en: "Auto phase (bracket → match)" },
  "settings.showVoteHint": { ar: "إظهار تعليمات التصويت على الشاشة", en: "Show voting instructions on screen" },
  "settings.showTimings": { ar: "توقيتات العرض", en: "Show timings" },
  "settings.showBackground": { ar: "خلفية البث", en: "Broadcast background" },
  "settings.bg.transparent": { ar: "شفافة (فوق الكاميرا)", en: "Transparent (over camera)" },
  "settings.bg.dark": { ar: "داكنة (ملء الشاشة)", en: "Dark (full screen)" },
  "settings.safeTop": { ar: "هامش آمن أعلى %", en: "Safe top %" },
  "settings.safeBottom": { ar: "هامش آمن أسفل %", en: "Safe bottom %" },
  "settings.stageTextScale": { ar: "حجم نص المباراة", en: "Match text size" },
  "settings.categorySeconds": { ar: "تصويت الفئة (ث)", en: "Category vote (s)" },
  "settings.roundIntroSeconds": { ar: "مقدمة الجولة (ث)", en: "Round intro (s)" },
  "settings.bracketIntroSeconds": { ar: "الجدول — البداية (ث)", en: "Bracket start (s)" },
  "settings.bracketOutroSeconds": { ar: "الجدول — النهاية (ث)", en: "Bracket end (s)" },
  "settings.resultSeconds": { ar: "مدة النتيجة (ث)", en: "Result (s)" },

  "queue.add": { ar: "أضف فئة…", en: "Add a category…" },
  "queue.empty": {
    ar: "فارغ. اختر واحدة من الأعلى لتُضاف بعد الفئة الحالية.",
    en: "Empty. Pick one above to chain it after the current category.",
  },
  "queue.clear": { ar: "تفريغ القائمة", en: "Clear queue" },

  "debug.title": { ar: "تصحيح", en: "Debug" },
  "debug.voteInjector": { ar: "حاقن الأصوات", en: "Vote injector" },
  "debug.chatMessage": { ar: "رسالة الدردشة", en: "Chat message" },
  "debug.viewer": { ar: "المشاهد", en: "Viewer" },
  "debug.chatVote": { ar: "صوت دردشة", en: "Chat vote" },
  "debug.giftVote": { ar: "صوت هدية", en: "Gift vote" },
  "debug.giftId": { ar: "معرّف الهدية", en: "Gift id" },
  "debug.burst": { ar: "الدفعة", en: "Burst" },
  "debug.simulateVoters": { ar: "حاكِ {n} مصوّتًا", en: "Simulate {n} voters" },
  "debug.forceOutcomes": { ar: "فرض النتائج", en: "Force outcomes" },
  "debug.forceLeft": { ar: "فرض اليسار", en: "Force left" },
  "debug.forceRight": { ar: "فرض اليمين", en: "Force right" },
  "debug.skipResolve": { ar: "تخطٍّ / حسم", en: "Skip / resolve" },
  "debug.extend30": { ar: "مدّد +30 ث", en: "Extend +30s" },
  "debug.jump": { ar: "انتقال", en: "Jump" },
  "debug.display": { ar: "العرض", en: "Display" },
  "debug.displayHelp": { ar: "كبّر نص المباراة (الأسماء، الأصوات، الرؤوس، شريط التصويت، وتعليمات التصويت) على غرفة التحكم والبث معاً.", en: "Scale match text (header, names, votes, vote bar and vote hint) on both the Control Room and the broadcast." },
  "debug.photos": { ar: "الصور", en: "Photos" },
  "debug.testImages": { ar: "اختبر صور المباراة الحالية", en: "Test current match images" },
  "debug.dangerZone": { ar: "منطقة الخطر", en: "Danger zone" },
  "debug.resetSession": { ar: "إعادة ضبط الجلسة", en: "Reset session" },
  "debug.clearUploads": { ar: "مسح المرفوعات", en: "Clear uploads" },
  "debug.reseed": { ar: "إعادة توليد الفئات", en: "Reseed categories" },
  "debug.currentMatch": { ar: "المباراة الحالية", en: "Current match" },
  "debug.votersA": { ar: "مصوّتو A: {names}", en: "voters A: {names}" },
  "debug.votersB": { ar: "مصوّتو B: {names}", en: "voters B: {names}" },
  "debug.none": { ar: "لا أحد", en: "none" },
  "debug.noLiveMatch": { ar: "لا مباراة جارية.", en: "No live match." },
  "debug.eventLog": { ar: "سجل الأحداث", en: "Event log" },
  "debug.rawState": { ar: "الحالة الخام", en: "Raw state" },
  "sound.enable": { ar: "اضغط لتشغيل الصوت", en: "Tap to enable sound" },
  "sound.title": { ar: "الصوت والموسيقى", en: "Sound & Music" },
  "sound.master": { ar: "الرئيسي", en: "Master" },
  "sound.music": { ar: "الموسيقى", en: "Music" },
  "sound.sfx": { ar: "المؤثرات", en: "SFX" },
  "sound.voice": { ar: "الصوت البشري", en: "Voice" },
  "sound.muted": { ar: "كتم الصوت", en: "Mute" },
  "sound.musicEnabled": { ar: "تشغيل الموسيقى", en: "Music on" },
  "sound.auto": { ar: "تلقائي (حسب الجولة)", en: "Auto (by round)" },
  "sound.cues": { ar: "المؤثرات الصوتية", en: "Sound effects" },
  "sound.tracks": { ar: "مقاطع الموسيقى", en: "Music tracks" },
  "sound.pickHint": {
    ar: "اضغط على مقطع ليصبح موسيقى الخلفية للعرض.",
    en: "Tap a track to make it the show's background music.",
  },
  "effect.block": { ar: "🚫 ممنوع التسجيل", en: "🚫 blocked" },
  "effect.secs": { ar: "ث", en: "s" },
  "sound.preview": { ar: "معاينة", en: "Preview" },
  "sound.previewAll": { ar: "معاينة الكل", en: "Preview all" },
  "sound.test": { ar: "🔊 اختبار الصوت", en: "🔊 Test sound" },
  "sound.stop": { ar: "إيقاف", en: "Stop" },
  "sound.hint": {
    ar: "الإعدادات تُطبّق مباشرة على صفحة البث. اختبر كل مؤثر من هنا؛ ملفاتك في data/sounds تتجاوز الأصوات المدمجة تلقائياً.",
    en: "Settings apply live to the broadcast. Preview each cue here; files in data/sounds automatically override the built-in synth.",
  },

  "live.title": { ar: "الاتصال المباشر", en: "Live connection" },
  "live.url": { ar: "عنوان المرحّل (Tikora)", en: "Relay URL (Tikora)" },
  "live.slug": { ar: "معرّف اللعبة (Slug)", en: "Game slug" },
  "live.key": { ar: "مفتاح اللعبة (Key)", en: "Game key" },
  "live.connect": { ar: "اتصال", en: "Connect" },
  "live.disconnect": { ar: "قطع الاتصال", en: "Disconnect" },
  "live.connected": { ar: "متصل", en: "Connected" },
  "live.disconnected": { ar: "غير متصل", en: "Disconnected" },
  "live.save": { ar: "حفظ الإعدادات", en: "Save settings" },
  "live.saved": { ar: "تم الحفظ ✓", en: "Saved ✓" },
  "live.lastEvent": { ar: "آخر حدث", en: "Last event" },
  "live.eventFeed": { ar: "الأحداث الأخيرة", en: "Recent events" },
  "live.supporters": { ar: "أهم الداعمين (أعلى 5)", en: "Top supporters (5)" },
  "live.noEvents": { ar: "لا أحداث بعد.", en: "No events yet." },
  "live.noSupporters": { ar: "لا داعمين بعد.", en: "No supporters yet." },
  "live.points": { ar: "{n} نقطة", en: "{n} pts" },
  "live.inject": { ar: "إدخال حدث تجريبي", en: "Inject test event" },
  "live.injectChat": { ar: "دردشة", en: "Chat" },
  "live.injectGift": { ar: "هدية", en: "Gift" },
  "live.hint": {
    ar: "يتصل هذا بمرحّل Tikora المحلي (ws://127.0.0.1:27016) الذي يوفّر أحداث تيك توك. أدخل معرّف اللعبة والمفتاح من Tikora لتسجيل بيك ليغ كلعبة. لا حاجة لاسم المستخدم.",
    en: "Connects to the local Tikora hub relay (ws://127.0.0.1:27016) that provides TikTok events. Enter the game slug + key from Tikora to register Pick League as a game. No username needed.",
  },
  "live.counts": { ar: "دردشة {chat} · هدايا {gift} · تفاعلات {other}", en: "chat {chat} · gifts {gift} · other {other}" },

  "debug.noPhoto": { ar: "المباراة الحالية بلا صورة لأي طرف", en: "current match has no photo for either side" },
  "debug.imgOk": { ar: "سليم  {url}  ({w}×{h})", en: "OK  {url}  ({w}x{h})" },
  "debug.imgFail": { ar: "فشل  {url}  (تعذّر التحميل)", en: "FAIL  {url}  (could not load)" },
  "debug.sideA": { ar: "أ:", en: "A:" },
  "debug.sideB": { ar: "ب:", en: "B:" },
  "debug.chatPlaceholder": { ar: "اسم", en: "name" },
  "debug.confirmReset": {
    ar: "إعادة ضبط الجلسة كاملة؟ سيُمحى الجدول الحالي والسجل.",
    en: "Reset the whole session? This clears the current tournament and log.",
  },
  "debug.confirmClearUploads": {
    ar: "حذف كل الصور المرفوعة؟ لا يمكن التراجع.",
    en: "Delete every uploaded photo? This cannot be undone.",
  },
  "debug.confirmReseed": {
    ar: "سيتم استبدال كل الفئات بالقيم الافتراضية المدمجة. ستفقد تعديلاتك.",
    en: "Overwrite all categories with the built-in defaults? Your edits will be lost.",
  },

  "studio.categories": { ar: "الفئات", en: "Categories" },
  "studio.new": { ar: "+ جديد", en: "+ New" },
  "studio.import": { ar: "استيراد", en: "Import" },
  "studio.fetchAll": { ar: "⬇ جلب كل الصور", en: "⬇ Fetch all photos" },
  "studio.fetching": { ar: "جارٍ الجلب…", en: "Fetching…" },
  "studio.editCategory": { ar: "تعديل الفئة", en: "Edit category" },
  "studio.selectOrCreate": { ar: "اختر فئة أو أنشئ واحدة", en: "Select or create a category" },
  "studio.hint": {
    ar: "اختر فئة من اليسار، أو أنشئ واحدة جديدة. كل فئة تحتوي 16 عنصرًا باسم وأسماء بديلة لمطابقة الدردشة ورمز تعبيري بديل وصورة اختيارية.",
    en: "Pick a category on the left, or create a new one. Each category holds 16 items with a name, aliases for chat matching, an emoji fallback, and an optional photo.",
  },
  "studio.categoryName": { ar: "اسم الفئة", en: "Category name" },
  "studio.leftGift": { ar: "هدية اليسار", en: "left gift" },
  "studio.rightGift": { ar: "هدية اليمين", en: "right gift" },
  "studio.saveCategory": { ar: "حفظ الفئة", en: "Save category" },
  "studio.fetchPhotos": { ar: "جلب الصور", en: "Fetch photos" },
  "studio.exportJson": { ar: "تصدير JSON", en: "Export JSON" },
  "studio.failed": { ar: "فشل: {error}", en: "Failed: {error}" },
  "studio.fetchSummary": {
    ar: "أُضيفت {changed} صورة، و{skipped} بلا صورة مجانية.",
    en: "Added {changed} photo(s), {skipped} without a free image.",
  },
  "studio.serverUnreachable": { ar: "تعذّر الوصول إلى الخادم.", en: "Could not reach the server." },

  "item.name": { ar: "الاسم", en: "Name" },
  "item.aliases": { ar: "الأسماء البديلة، بفاصلة", en: "aliases, comma" },
  "item.photo": { ar: "صورة", en: "photo" },
  "item.clearPhoto": { ar: "مسح الصورة", en: "clear" },

  "error.title": { ar: "حدث خطأ في هذه الصفحة", en: "This page hit an error" },
  "error.body": {
    ar: "بقية التطبيق بخير. يمكنك إعادة التحميل أو الرجوع إلى غرفة التحكم.",
    en: "The rest of the app is fine. You can reload, or go back to the Control Room.",
  },
  "error.tryAgain": { ar: "حاول مجددًا", en: "Try again" },
  "error.goControl": { ar: "اذهب لغرفة التحكم", en: "Go to Control Room" },

  "lang.switch": { ar: "English", en: "العربية" },
  "lang.label": { ar: "اللغة", en: "Language" },
} as const satisfies Record<string, Entry>;

export type TKey = keyof typeof DICT;

function format(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? `{${key}}`));
}

interface I18nValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  dir: "rtl" | "ltr";
  t: (key: TKey, vars?: Record<string, string | number>) => string;
  round: (round: RoundId) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

export function initialLang(): Lang {
  try {
    return localStorage.getItem(STORAGE_KEY) === "en" ? "en" : "ar";
  } catch {
    return "ar";
  }
}

export function I18nProvider({ children }: { children: ReactNode }): ReactNode {
  const [lang, setLangState] = useState<Lang>(initialLang);
  const dir = lang === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang, dir]);

  const setLang = useCallback((next: Lang) => {
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
    setLangState(next);
  }, []);

  const t = useCallback<I18nValue["t"]>((key, vars) => format(DICT[key][lang], vars), [lang]);

  const round = useCallback<I18nValue["round"]>((id) => DICT[`round.${id}` as TKey][lang], [lang]);

  const value = useMemo<I18nValue>(() => ({ lang, setLang, dir, t, round }), [lang, setLang, dir, t, round]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}
