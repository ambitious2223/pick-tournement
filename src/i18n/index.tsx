import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Lang, RoundId } from "../../shared/types.ts";
import { send } from "../lib/live.ts";

export type { Lang };

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
  "nav.offline": {
    ar: "تعذّر الوصول إلى الخادم — أغلق هذه النافذة وشغّل Tournament.bat مرة أخرى.",
    en: "Server not reachable — close this window and run Tournament.bat again.",
  },

  "show.idleTitle": { ar: "لا يوجد عرض حالياً", en: "No show running" },
  "show.idleHint": { ar: "استعد للتصويت!", en: "Get ready to vote!" },
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
  "show.phase.round-recap": { ar: "ملخّص الجولة", en: "Round recap" },
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
  "vote.freeChip": { ar: "💬 مجاني · +{weight}", en: "💬 Free · +{weight}" },
  "vote.giftChip": { ar: "🎁 هدية · +{weight}", en: "🎁 Gift · +{weight}" },
  "vote.instruction": {
    ar: "اكتب اسم المتسابق في الدردشة لتصوّت — صوت واحد لكل مشاهد. الهدية تحتسب أكثر.",
    en: "Type a competitor's name in chat — one vote each. A gift counts for more.",
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
  "control.show": { ar: "العرض", en: "Show" },
  "control.sound": { ar: "الصوت", en: "Sound" },
  "control.settings": { ar: "الإعدادات", en: "Settings" },
  "control.queue": { ar: "القائمة", en: "Queue" },
  "control.simulator": { ar: "المحاكي", en: "Simulator" },
  "control.simulatorToggle": { ar: "جمهور مُحاكى (بدون بث)", en: "Simulated crowd (no live feed)" },
  "control.simulatorHelp": {
    ar: "يرسل أصوات دردشة وهدايا وهمية إلى المباراة الجارية لتتدرب على بطولة كاملة دون اتصال.",
    en: "Fires fake chat + gift votes at the live match so you can rehearse a full tournament offline.",
  },
  "control.simHintOn": { ar: "مفعّل", en: "on" },

  "sim.volume": { ar: "شدة المحاكاة", en: "Simulator volume" },
  "sim.votesPerTick": { ar: "أصوات لكل نبضة", en: "Votes per tick" },
  "sim.tickSpeed": { ar: "سرعة النبضات", en: "Tick speed" },
  "sim.giftChance": { ar: "احتمال الهدايا", en: "Gift chance" },
  "sim.show": { ar: "العرض التلقائي", en: "Automatic show" },
  "sim.stage": { ar: "حجم الشاشة", en: "Stage" },
  "sim.stageSize": { ar: "الحجم (صور + نص)", en: "Size (photos + text)" },
  "sim.pacing": { ar: "إيقاع الجدول السينمائي", en: "Bracket pacing" },
  "sim.intro": { ar: "مدة الدخول", en: "Intro length" },
  "sim.outro": { ar: "مدة الخروج", en: "Outro length" },
  "sim.recap": { ar: "مدة الملخّص", en: "Recap length" },
  "control.confirmReset": {
    ar: "هل تريد إيقاف الجلسة كاملة وإعادة ضبطها؟ سيُمحى الجدول الحالي.",
    en: "Stop and reset the whole session? This clears the current tournament.",
  },
  "poll.button": { ar: "🗳️ ابدأ تصويت الفئات", en: "🗳️ Start category vote" },
  "poll.running": { ar: "التصويت جارٍ — اضغط للإيقاف", en: "Voting is live — tap to stop" },
  "poll.confirmReplace": {
    ar: "يوجد جدول قيد التشغيل. بدء تصويت فئات سيبدأ بطولة جديدة للفئة الفائزة. أتريد المتابعة؟",
    en: "A tournament is running. Starting a category vote begins a fresh tournament for the winning category. Continue?",
  },
  "poll.title": { ar: "صوّتوا للفئة القادمة", en: "Vote for the next category" },
  "poll.hint": { ar: "اكتبوا اسم الفئة في الدردشة", en: "Type a category name in chat" },
  "poll.votes": { ar: "{n} صوت", en: "{n} votes" },
  "poll.leading": { ar: "المتصدّر", en: "Leading" },
  "poll.standings": { ar: "الترتيب الحالي", en: "Live standings" },
  "poll.noVotes": { ar: "لا أصوات بعد", en: "No votes yet" },

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
  "settings.showBackground": { ar: "لون الخلفية", en: "Background color" },
  "settings.bracketPace": { ar: "إيقاع الجدول السينمائي", en: "Bracket cinematic pace" },
  "settings.stageTextScale": { ar: "حجم نص المباراة", en: "Match text size" },
  "settings.categorySeconds": { ar: "تصويت الفئة (ث)", en: "Category vote (s)" },
  "settings.roundIntroSeconds": { ar: "مقدمة الجولة (ث)", en: "Round intro (s)" },
  "settings.bracketIntroSeconds": { ar: "الجدول — البداية (ث)", en: "Bracket start (s)" },
  "settings.bracketOutroSeconds": { ar: "الجدول — النهاية (ث)", en: "Bracket end (s)" },
  "settings.roundRecapSeconds": { ar: "ملخّص الجولة (ث)", en: "Round recap (s)" },
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
  "debug.roundTimings": { ar: "توقيت الجولات (ثوانٍ)", en: "Round timings (seconds)" },
  "debug.roundR16": { ar: "دور الـ16", en: "Round of 16" },
  "debug.roundQf": { ar: "ربع النهائي", en: "Quarterfinals" },
  "debug.roundSf": { ar: "نصف النهائي", en: "Semifinals" },
  "debug.roundFinal": { ar: "النهائي", en: "Grand Final" },
  "debug.resetDefaults": { ar: "إعادة للافتراضي 30/40/50/60", en: "Reset to 30/40/50/60" },
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
  "sound.mutedBanner": { ar: "الصوت مكتوم — لن يُسمع أي شيء", en: "Sound is muted — nothing will play" },
  "sound.mutedShort": { ar: "صوت مكتوم — اضغط للتفعيل", en: "Muted — tap to enable" },
  "sound.statusOn": { ar: "الصوت يعمل · {context}", en: "Audio is ON · {context}" },
  "sound.statusBlocked": { ar: "المتصفح يحجب الصوت — اضغط للتفعيل", en: "The browser is blocking audio — tap to enable" },
  "sound.ctxRunning": { ar: "جاهز", en: "running" },
  "sound.ctxNotStarted": { ar: "لم يبدأ", en: "not started" },
  "sound.ctxSuspended": { ar: "معلّق", en: "suspended" },
  "sound.lastCue": { ar: "آخر مؤثر: {cue}", en: "last cue: {cue}" },
  "sound.noCueYet": { ar: "لا مؤثرات بعد", en: "no cues yet" },
  "sound.turnOn": { ar: "🔊 شغّل الصوت واختبره", en: "🔊 Turn sound on & test" },
  "sound.enabling": { ar: "جارٍ التشغيل…", en: "Enabling…" },
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
  "sound.cuesTitle": { ar: "المؤثرات (مرحلة بمرحلة)", en: "Sound effects (by phase)" },
  "sound.upload": { ar: "ارفع", en: "Upload" },
  "sound.replace": { ar: "استبدل", en: "Replace" },
  "sound.resetBuiltin": { ar: "الافتراضي", en: "Default" },
  "sound.customBadge": { ar: "مخصّص", en: "Custom" },
  "sound.builtinBadge": { ar: "مدمج", en: "Built-in" },
  "sound.uploaded": { ar: "تم الرفع ✓", en: "Uploaded ✓" },
  "sound.uploadFailed": { ar: "تعذّر الرفع", en: "Upload failed" },
  "sound.managerHint": {
    ar: "لكل مرحلة مؤثرها الخاص. ارفع ملفاً (mp3/ogg/wav/webm) ليحلّ محلّ الصوت المدمج، ثم استخدم «الافتراضي» للعودة.",
    en: "Every phase has its own cue. Upload a file (mp3/ogg/wav/webm) to replace the built-in sound, then use “Default” to revert.",
  },
  "sound.grp.category": { ar: "الفئة", en: "Category" },
  "sound.grp.round": { ar: "الجولة", en: "Round" },
  "sound.grp.bracket": { ar: "الجدول", en: "Bracket" },
  "sound.grp.match": { ar: "المباراة", en: "Match" },
  "sound.grp.votes": { ar: "الأصوات", en: "Votes" },
  "sound.grp.result": { ar: "النتيجة", en: "Result" },
  "sound.grp.champion": { ar: "البطل", en: "Champion" },
  "sound.grp.live": { ar: "التفاعل المباشر", en: "Live events" },

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

  "control.content": { ar: "المحتوى", en: "Content" },
  "content.coverage": { ar: "{have}/{total} صورة", en: "{have}/{total} photos" },
  "content.noPhoto": { ar: "بدون صورة", en: "no photo" },
  "content.competitors": { ar: "المتسابقون", en: "Competitors" },
  "content.remove": { ar: "إزالة", en: "Remove" },
  "content.deleteCategory": { ar: "حذف الفئة", en: "Delete category" },
  "content.confirmDelete": { ar: "حذف {name}؟", en: "Delete {name}?" },
  "content.lastCategory": { ar: "تحتاج إلى فئة واحدة على الأقل.", en: "You need at least one category." },
  "content.lastItem": { ar: "تحتاج إلى متسابق واحد على الأقل.", en: "You need at least one competitor." },
  "content.noCategories": { ar: "لا توجد فئات بعد.", en: "No categories yet." },
  "content.pick": { ar: "اختر فئة لعرض متسابقيها.", en: "Pick a category to see its competitors." },
  "content.queued": { ar: "في الطابور", en: "in queue" },
  "content.deleted": { ar: "تم الحذف ✓", en: "Deleted ✓" },
  "content.saved": { ar: "تم حفظ الفئة ✓", en: "Category saved ✓" },
  "content.saving": { ar: "جارٍ الحفظ…", en: "Saving…" },
  "content.newCategory": { ar: "+ فئة", en: "+ Category" },
  "content.defaultCategoryName": { ar: "فئة جديدة", en: "New Category" },
  "content.defaultCategoryNameAr": { ar: "فئة جديدة", en: "فئة جديدة" },
  "content.edit": { ar: "تعديل الفئة", en: "Edit category" },
  "content.moveUp": { ar: "تحريك لأعلى", en: "Move up" },
  "content.moveDown": { ar: "تحريك لأسفل", en: "Move down" },
  "content.categoryNameEn": { ar: "اسم الفئة بالإنجليزية", en: "Category name (English)" },
  "content.categoryNameAr": { ar: "اسم الفئة بالعربية", en: "Category name (Arabic)" },
  "content.categoryName": { ar: "اسم الفئة", en: "Category name" },
  "content.competitorName": { ar: "اسم المتسابق", en: "Competitor name" },
  "content.competitorNameEn": { ar: "الاسم بالإنجليزية", en: "Name (English)" },
  "content.competitorNameAr": { ar: "الاسم بالعربية", en: "Name (Arabic)" },
  "content.aliases": { ar: "أسماء بديلة للمحادثة، بفاصلة", en: "Chat aliases, comma separated" },
  "content.uploadPhoto": { ar: "رفع صورة", en: "Upload photo" },
  "crop.title": { ar: "قصّ الصورة", en: "Crop photo" },
  "crop.hint": { ar: "اسحب الصورة وقرّبها لاختيار الجزء الذي سيظهر.", en: "Drag and zoom to choose the part that shows." },
  "crop.zoom": { ar: "تكبير", en: "Zoom" },
  "crop.apply": { ar: "قصّ ورفع", en: "Crop & upload" },
  "crop.cancel": { ar: "إلغاء", en: "Cancel" },
  "content.photoUrl": { ar: "من رابط", en: "From link" },
  "content.fetchUrl": { ar: "جلب", en: "Fetch" },
  "content.addCompetitor": { ar: "+ إضافة متسابق", en: "+ Add competitor" },
  "content.maxItems": { ar: "الحد الأقصى 16 متسابقًا.", en: "16 competitors max." },

  "studio.categories": { ar: "الفئات", en: "Categories" },
  "studio.new": { ar: "+ جديد", en: "+ New" },
  "studio.import": { ar: "استيراد", en: "Import" },
  "studio.fetchAll": { ar: "⬇ جلب كل الصور", en: "⬇ Fetch all photos" },
  "studio.fetching": { ar: "جارٍ الجلب…", en: "Fetching…" },
  "studio.editCategory": { ar: "تعديل الفئة", en: "Edit category" },
  "studio.selectOrCreate": { ar: "اختر فئة أو أنشئ واحدة", en: "Select or create a category" },
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

  // Keep other open windows (e.g. the show window) on the same language.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setLangState(e.newValue === "en" ? "en" : "ar");
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setLang = useCallback((next: Lang) => {
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
    setLangState(next);
    void send("lang:set", next);
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
