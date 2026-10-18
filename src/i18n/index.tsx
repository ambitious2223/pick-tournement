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
  "nav.setup": { ar: "الدليل", en: "Guide" },
  "nav.offline": {
    ar: "تعذّر الوصول إلى الخادم — أغلق هذه النافذة وشغّل Tournament.bat مرة أخرى.",
    en: "Server not reachable — close this window and run Tournament.bat again.",
  },

  "setup.badge": { ar: "دليل الإعداد", en: "Setup guide" },
  "setup.title": { ar: "جهّز العرض للبث", en: "Get the show on air" },
  "setup.intro": {
    ar: "اتبع المسار مرة واحدة. حالة الجاهزية بالأسفل تُظهر ما هو جاهز الآن، وكل خطوة تفتح نافذة قصيرة مع رابط مباشر للشاشة الصحيحة.",
    en: "Follow the path once. The live status below shows what is already ready, and every step opens a short pop-out with a direct link to the right screen.",
  },
  "setup.readiness": { ar: "الجاهزية الآن", en: "Live readiness" },
  "setup.status.server": { ar: "التطبيق", en: "App" },
  "setup.status.tikora": { ar: "Tikora", en: "Tikora" },
  "setup.status.categories": { ar: "الفئات", en: "Categories" },
  "setup.status.queue": { ar: "القائمة", en: "Queue" },
  "setup.status.sound": { ar: "ملفات الصوت", en: "Sound files" },
  "setup.status.show": { ar: "العرض", en: "Show" },
  "setup.status.soundValue": { ar: "{have} / {total}", en: "{have} / {total}" },
  "setup.stepsTitle": { ar: "مسار الإعداد", en: "Your setup path" },
  "setup.stepsHint": { ar: "اضغط أي خطوة لعرض التفاصيل والرابط المباشر.", en: "Click a step for details and a direct link." },
  "setup.details": { ar: "التفاصيل", en: "Details" },
  "setup.stepOf": { ar: "الخطوة {n} من {total}", en: "Step {n} of {total}" },
  "setup.back": { ar: "السابق", en: "Back" },
  "setup.next": { ar: "التالي", en: "Next" },
  "setup.quick.openRun": { ar: "افتح التشغيل", en: "Open Run" },
  "setup.quick.openShow": { ar: "افتح نافذة العرض", en: "Open show window" },
  "setup.quick.openStudio": { ar: "افتح الاستوديو", en: "Open Studio" },
  "setup.copyOverlay": { ar: "انسخ رابط العرض", en: "Copy overlay link" },
  "setup.copied": { ar: "تم النسخ", en: "Copied" },
  "setup.action.openControl": { ar: "افتح غرفة التحكم", en: "Open Control room" },
  "setup.action.openStudio": { ar: "افتح الاستوديو", en: "Open Studio" },
  "setup.action.openQueue": { ar: "افتح القائمة", en: "Open Queue" },
  "setup.action.openDebug": { ar: "افتح التصحيح", en: "Open Debug" },
  "setup.action.openSound": { ar: "افتح إعدادات الصوت", en: "Open sound settings" },
  "setup.action.openRun": { ar: "افتح التشغيل", en: "Open Run" },
  "setup.action.openShow": { ar: "افتح نافذة العرض", en: "Open show window" },
  "setup.action.openSim": { ar: "افتح المحاكي", en: "Open Simulator" },
  "setup.step.start.title": { ar: "شغّل Pick League", en: "Start Pick League" },
  "setup.step.start.summary": { ar: "افتح التطبيق وغرفة التحكم.", en: "Launch the app and open the Control room." },
  "setup.step.start.b1": { ar: "انقر نقراً مزدوجاً على Tournament.bat.", en: "Double-click Tournament.bat." },
  "setup.step.start.b2": {
    ar: "يثبّت المتطلبات في أول تشغيل، ثم يبني التطبيق ويفتح \u2066127.0.0.1:8787/control\u2069.",
    en: "It installs on the first run, builds, and opens 127.0.0.1:8787/control.",
  },
  "setup.step.start.b3": { ar: "اترك نافذة الطرفية مفتوحة أثناء البث.", en: "Leave the console window open while you stream." },
  "setup.step.library.title": { ar: "اختر مكتبة المحتوى", en: "Choose the content library" },
  "setup.step.library.summary": { ar: "العربية والإنجليزية مكتبتان منفصلتان.", en: "Arabic and English are separate libraries." },
  "setup.step.library.b1": { ar: "استخدم زر اللغة في الشريط العلوي.", en: "Use the language button in the top bar." },
  "setup.step.library.b2": { ar: "لكل مكتبة فئاتها وقائمتها الخاصة.", en: "Each library has its own categories and its own queue." },
  "setup.step.library.b3": { ar: "تبديل اللغة يوقف العرض الجاري أولاً.", en: "Switching language stops a running show first." },
  "setup.step.content.title": { ar: "جهّز الفئات والقائمة", en: "Prepare categories and the queue" },
  "setup.step.content.summary": { ar: "ابنِ بطاقات المتسابقين ثم رتّب ما سيُعرض بعدها.", en: "Build the card deck, then line up what plays next." },
  "setup.step.content.b1": {
    ar: "من الاستوديو أنشئ الفئات وعدّل المتسابقين والأسماء البديلة والصور.",
    en: "In Studio, create categories and edit competitors, aliases and photos.",
  },
  "setup.step.content.b2": {
    ar: "من تبويب القائمة اختر الفئات التي تأتي بعد الفئة الحالية.",
    en: "Use the Queue tab to choose the categories that follow the current one.",
  },
  "setup.step.content.b3": { ar: "يمكن رفع الصور أو قصّها أو جلبها تلقائياً.", en: "Photos can be uploaded, cropped, or fetched automatically." },
  "setup.step.tikora.title": { ar: "صِل تيك توك عبر Tikora", en: "Connect TikTok through Tikora" },
  "setup.step.tikora.summary": { ar: "Pick League يقرأ الأحداث المباشرة من Tikora المحلي.", en: "Pick League reads live events from your local Tikora hub." },
  "setup.step.tikora.b1": { ar: "شغّل Tikora واتركه متصلاً.", en: "Start Tikora and leave it connected." },
  "setup.step.tikora.b2": { ar: "مفتاح اللعبة يُجلب تلقائياً — لا نسخ ولا لصق.", en: "The game key is picked up automatically — no copying or pasting." },
  "setup.step.tikora.b3": {
    ar: "النقطة الخضراء في التصحيح ← الاتصال المباشر تعني أن الرابط يعمل.",
    en: "The green dot in Debug → Live connection means the link is up.",
  },
  "setup.step.sound.title": { ar: "اضبط الصوت مرة واحدة", en: "Set up sound once" },
  "setup.step.sound.summary": { ar: "رفع الملفات لمرة واحدة، والتحكم اليومي في التشغيل.", en: "Uploads are a one-time setup; everyday control stays on Run." },
  "setup.step.sound.b1": { ar: "افتح الإعدادات ← متقدّم ← ملفات الصوت.", en: "Open Settings → Advanced → Sound files." },
  "setup.step.sound.b2": {
    ar: "ارفع mp3 أو ogg أو wav أو webm أو m4a للمؤثرات التي تريدها؛ يبقى المؤثر صامتاً حتى ترفع ملفه.",
    en: "Upload mp3, ogg, wav, webm or m4a for the cues you want; a cue stays silent until uploaded.",
  },
  "setup.step.sound.b3": {
    ar: "بعد ذلك، الكتم ومستوى الصوت الرئيسي في التشغيل؛ اضغط زر الصوت مرة واحدة في نافذة العرض.",
    en: "After that, mute and master volume are on Run; tap the sound button once in the show window.",
  },
  "setup.step.obs.title": { ar: "أضف العرض إلى OBS", en: "Add the show to OBS" },
  "setup.step.obs.summary": { ar: "استخدم نافذة العرض كمصدر متصفح.", en: "Use the show window as a Browser Source." },
  "setup.step.obs.b1": { ar: "أضف مصدر متصفح (Browser Source) برابط العرض.", en: "Add a Browser Source with the overlay link." },
  "setup.step.obs.b2": { ar: "غيّر حجمه ليناسب مساحة العرض؛ لون الخلفية المختار يملؤه.", en: "Size it to the show area; the chosen background color fills it." },
  "setup.step.obs.b3": { ar: "اضغط زر الصوت مرة واحدة في نافذة العرض لتفعيل الصوت.", en: "Tap the sound button once on the show window to enable audio." },
  "setup.step.run.title": { ar: "شغّل العرض أو تدرّب", en: "Run or rehearse" },
  "setup.step.run.summary": { ar: "ابدأ العرض التلقائي، أو جرّب أولاً.", en: "Start the automatic show, or practice first." },
  "setup.step.run.b1": {
    ar: "من التشغيل اضغط \"ابدأ العرض\"؛ الإيقاف المؤقت والاستئناف والتخطي بجانبه.",
    en: "On Run, press Start show; Pause, Resume and Skip are beside it.",
  },
  "setup.step.run.b2": {
    ar: "مفاتيح سلوك الجولات تحت زر البدء: صوت واحد لكل مشاهد، تغيير التصويت، المباراة التالية، البطولة التالية، التبديل التلقائي وتعليمات التصويت.",
    en: "Round behavior switches live under Start show: one vote each, vote changes, auto next match/tournament, auto phase and vote instructions.",
  },
  "setup.step.run.b3": {
    ar: "لون الخلفية في الإعدادات ← المظهر ويظهر مباشرة على مسرح التحكم.",
    en: "Background color is in Settings → Appearance and previews on the Control stage.",
  },
  "setup.step.run.b4": { ar: "المحاكي فيه الجمهور المُحاكى والعروض التجريبية والتدريب الكامل.", en: "Simulator has the simulated crowd, demos and a full rehearsal." },

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
    ar: "اكتب أول كلمة أو كلمتين من اسم المتسابق في الدردشة لتصوّت — صوت واحد لكل مشاهد. الهدية تحتسب أكثر.",
    en: "Type the first word or two of a competitor's name in chat — one vote each. A gift counts for more.",
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
  "run.showTitle": { ar: "العرض التلقائي", en: "Automatic show" },
  "run.advanced": { ar: "خيارات المباراة المتقدمة", en: "Advanced match controls" },
  "run.behavior": { ar: "سلوك الجولات", en: "Round behavior" },
  "run.behaviorHint": {
    ar: "مرّر فوق أي خيار لقراءة شرحه.",
    en: "Hover any option to read what it does.",
  },
  "run.toggle.dedupe": { ar: "صوت واحد", en: "One vote each" },
  "run.toggle.dedupeDesc": {
    ar: "كل مشاهد يصوّت مرة واحدة فقط في المباراة.",
    en: "Each viewer can vote only once per match.",
  },
  "run.toggle.voteChange": { ar: "تغيير التصويت", en: "Vote changes" },
  "run.toggle.voteChangeDesc": {
    ar: "يمكن للمشاهد نقل صوته إلى الطرف الآخر.",
    en: "A viewer can move their vote to the other side.",
  },
  "run.toggle.nextMatch": { ar: "المباراة التالية", en: "Auto next match" },
  "run.toggle.nextMatchDesc": {
    ar: "تبدأ المباراة التالية تلقائياً.",
    en: "Start the next match automatically.",
  },
  "run.toggle.nextTournament": { ar: "البطولة التالية", en: "Next tournament" },
  "run.toggle.nextTournamentDesc": {
    ar: "الانتقال تلقائياً إلى الفئة التالية.",
    en: "Continue into the next category automatically.",
  },
  "run.toggle.stageView": { ar: "تبديل تلقائي", en: "Auto phase" },
  "run.toggle.stageViewDesc": {
    ar: "التبديل تلقائياً بين عرض الجدول وعرض المباراة.",
    en: "Switch between the bracket and match views automatically.",
  },
  "run.toggle.voteHint": { ar: "تعليمات التصويت", en: "Vote instructions" },
  "run.toggle.voteHintDesc": {
    ar: "إظهار تعليمات التصويت على نافذة العرض.",
    en: "Show the voting instructions on the show window.",
  },
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
  "control.rehearsal": { ar: "🎬 تدريب كامل", en: "🎬 Rehearsal" },
  "control.rehearsalTitle": {
    ar: "شغّل بطولة كاملة بالتوقيت الحقيقي مع أصوات محاكاة — لمعاينة العرض قبل البث المباشر",
    en: "Run one full bracket at real timings with simulated votes — preview the show before going live",
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
  "sim.practice": { ar: "جرّب العرض", en: "Try the show" },
  "sim.advancedHint": {
    ar: "هذه الخيارات تتحكم في شكل الحركة السينمائية وسرعتها على شاشة العرض.",
    en: "These options control how the bracket cinematic looks and how fast it moves on the show window.",
  },
  "sim.advancedMoved": {
    ar: "حجم الشاشة وإيقاع الجدول في الإعدادات ← متقدّم.",
    en: "Stage size and bracket pacing are in Settings → Advanced.",
  },
  "sim.show": { ar: "العرض التلقائي", en: "Automatic show" },
  "sim.stage": { ar: "حجم الشاشة", en: "Stage" },
  "sim.stageSize": { ar: "الحجم (صور + نص)", en: "Size (photos + text)" },
  "sim.pacing": { ar: "إيقاع الجدول السينمائي", en: "Bracket pacing" },
  "sim.intro": { ar: "مدة الدخول", en: "Intro length" },
  "sim.outro": { ar: "مدة الخروج", en: "Outro length" },
  "sim.recap": { ar: "مدة الملخّص", en: "Recap length" },
  "sim.bracketToggles": { ar: "مراحل الجدول السينمائي", en: "Bracket cinematic phases" },
  "sim.showIntro": { ar: "دخول الجدول (تكبير)", en: "Bracket intro (zoom in)" },
  "sim.showOutro": { ar: "خروج الجدول (تصغير)", en: "Bracket outro (zoom out)" },
  "sim.showRecap": { ar: "ملخّص الجولة الكامل", en: "Round recap" },
  "sim.bracketZoom": { ar: "قوة التقريب على المباراة", en: "Zoom strength" },
  "sim.controlCinematic": { ar: "معاينة الحركة السينمائية في لوحة التحكم", en: "Preview cinematic in Control" },
  "timeline.title": { ar: "الجدول الزمني المتوقّع للبطولة", en: "Estimated bracket timeline" },
  "timeline.total": { ar: "الإجمالي المتوقّع", en: "Estimated total" },
  "timeline.times": { ar: "×{n}", en: "×{n}" },
  "timeline.category": { ar: "تصويت الفئة", en: "Category vote" },
  "timeline.roundIntro": { ar: "مقدمة الجولة", en: "Round intro" },
  "timeline.bracketIntro": { ar: "دخول الجدول", en: "Bracket intro" },
  "timeline.match": { ar: "المباريات", en: "Matches" },
  "timeline.bracketOutro": { ar: "خروج الجدول", en: "Bracket outro" },
  "timeline.roundRecap": { ar: "ملخّص الجولة", en: "Round recap" },
  "timeline.result": { ar: "النتائج", en: "Results" },
  "timeline.champion": { ar: "البطل", en: "Champion" },
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
  "poll.hint": {
    ar: "اكتبوا الرقم (1–{max}) أو اسم الفئة في الدردشة",
    en: "Type the number (1–{max}) or the category name in chat",
  },
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
  "settings.showTimings": { ar: "توقيتات العرض", en: "Show timings" },
  "settings.appearance": { ar: "المظهر", en: "Appearance" },
  "settings.advanced": { ar: "متقدّم", en: "Advanced" },
  "settings.showLook": { ar: "شكل العرض وإيقاعه", en: "Show look & pacing" },
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
  "sound.title": { ar: "الصوت", en: "Sound" },
  "sound.quickHint": {
    ar: "الصوت يعمل في نافذة العرض — اضغط زر الصوت هناك مرة واحدة. لرفع الملفات أو ضبط المستويات الأخرى: الإعدادات ← متقدّم.",
    en: "Sound plays in the show window — tap its sound button once. To upload files or adjust the other buses: Settings → Advanced.",
  },
  "sound.filesTitle": { ar: "ملفات الصوت", en: "Sound files" },
  "sound.master": { ar: "الرئيسي", en: "Master" },
  "sound.sfx": { ar: "المؤثرات", en: "SFX" },
  "sound.voice": { ar: "الصوت البشري", en: "Voice" },
  "sound.muted": { ar: "كتم الصوت", en: "Mute" },
  "sound.cues": { ar: "المؤثرات الصوتية", en: "Sound effects" },
  "effect.block": { ar: "🚫 ممنوع التسجيل", en: "🚫 blocked" },
  "effect.secs": { ar: "ث", en: "s" },
  "sound.preview": { ar: "معاينة", en: "Preview" },
  "sound.test": { ar: "🔊 اختبار الصوت", en: "🔊 Test sound" },
  "sound.cuesTitle": { ar: "المؤثرات (مرحلة بمرحلة)", en: "Sound effects (by phase)" },
  "sound.upload": { ar: "ارفع", en: "Upload" },
  "sound.replace": { ar: "استبدل", en: "Replace" },
  "sound.removeUpload": { ar: "احذف الملف", en: "Remove file" },
  "sound.uploaded": { ar: "تم الرفع ✓", en: "Uploaded ✓" },
  "sound.uploadFailed": { ar: "تعذّر الرفع", en: "Upload failed" },
  "sound.uploadedBadge": { ar: "مرفوع", en: "Uploaded" },
  "sound.missingBadge": { ar: "ناقص", en: "Missing" },
  "sound.uploadHint": {
    ar: "لا توجد أصوات مدمجة — كل مؤثر يعمل فقط بعد رفع ملف له (mp3/ogg/wav/webm/m4a). اضغط الاسم لتشغيله أو إيقافه.",
    en: "No built-in tones — a cue plays only after you upload a file for it (mp3/ogg/wav/webm/m4a). Tap a name to mute/unmute it.",
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

  "studio.content": { ar: "المحتوى", en: "Content" },
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
  "content.edit": { ar: "تعديل الفئة", en: "Edit category" },
  "content.moveUp": { ar: "تحريك لأعلى", en: "Move up" },
  "content.moveDown": { ar: "تحريك لأسفل", en: "Move down" },
  "content.categoryName": { ar: "اسم الفئة", en: "Category name" },
  "content.competitorName": { ar: "اسم المتسابق", en: "Competitor name" },
  "content.aliases": { ar: "أسماء بديلة للمحادثة، بفاصلة", en: "Chat aliases, comma separated" },
  "content.uploadPhoto": { ar: "رفع صورة", en: "Upload photo" },
  "crop.title": { ar: "قصّ الصورة", en: "Crop photo" },
  "crop.hint": { ar: "اسحب الصورة وقرّبها لاختيار الجزء الذي سيظهر.", en: "Drag and zoom to choose the part that shows." },
  "crop.mode.crop": { ar: "قصّ", en: "Crop" },
  "crop.mode.stretch": { ar: "تمديد", en: "Stretch" },
  "crop.stretchHint": { ar: "الصورة كاملة تملأ المربع دون قصّ أي جزء.", en: "The whole photo fills the square, nothing cut off." },
  "crop.zoom": { ar: "تكبير", en: "Zoom" },
  "crop.apply": { ar: "قصّ ورفع", en: "Crop & upload" },
  "crop.stretchApply": { ar: "تمديد ورفع", en: "Stretch & upload" },
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
  "item.editCrop": { ar: "تعديل القصّ", en: "edit crop" },
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
