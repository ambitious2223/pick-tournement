import type { Category, Item } from "../shared/types.ts";

/** Shortest fragment that may count as a vote. */
const MIN_PREFIX = 3;
/** Shortest word fuzzy matching will even consider. */
const MIN_FUZZY = 4;
/** Biggest edit distance a typo may have. */
const MAX_DISTANCE = 2;

/**
 * Case/diacritic-insensitive normalisation for chat matching.
 *
 * Arabic is folded so every common way of typing a name collapses to one
 * string: tashkeel and other marks, tatweel, every alef/hamza variant
 * (أ إ آ ؤ ئ), alef maqsura ى → ي, taa marbuta ة → ه, and Arabic-Indic digits.
 * Latin gets accent stripping and lowercasing.
 */
export function normalize(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/\u0640/g, "")
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, "")
    .replace(/[\u0300-\u036F]/g, "")
    .replace(/\u0629/g, "\u0647")
    .replace(/\u0649/g, "\u064A")
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Edit distance that gives up as soon as it cannot stay under `cap`. */
function levenshtein(a: string, b: string, cap: number): number {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > cap) return cap + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur: number[] = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const value = Math.min(
        (cur[j - 1] ?? 0) + 1,
        (prev[j] ?? 0) + 1,
        (prev[j - 1] ?? 0) + cost,
      );
      cur.push(value);
      if (value < rowMin) rowMin = value;
    }
    if (rowMin > cap) return cap + 1;
    prev = cur;
  }
  return prev[b.length] ?? cap + 1;
}

/**
 * Everything a viewer could type and clearly mean this name: the whole name,
 * the name sitting inside a longer message, the first word of a two-word name,
 * or the first few letters of it. Higher is a better match.
 */
function strongScore(msg: string, key: string, words: string[]): number {
  if (!key) return 0;
  if (msg === key) return 1000 + key.length;
  if (msg.startsWith(`${key} `) || msg.endsWith(` ${key}`) || msg.includes(` ${key} `)) {
    return 900 + key.length;
  }
  // The whole message is the front of the name: "محمد صلا", "Ahmed H".
  if (msg.length >= MIN_PREFIX && key.startsWith(msg)) return 750 + msg.length;
  // Only the front of the message may act as a *partial* name, because words
  // like "علي" and "محمد" turn up in prayers and small talk. A full name
  // anywhere in the message is already covered by the rules above.
  const lead = words[0] ?? "";
  if (!lead) return 0;
  // Inside a message the fragment has to carry real weight.
  const floor = words.length > 1 ? 4 : MIN_PREFIX;
  if (lead === key) return 900 + key.length;
  // The word runs straight past the name — Arabic chat often drops spaces.
  if (lead.startsWith(key) && key.length >= floor) return 800 + key.length;
  // The front of the name: "محمد" for "محمد صلاح", "ابوظ" for "أبوظبي".
  if (key.startsWith(lead) && lead.length >= floor) {
    return 700 + 2 * lead.length - key.length;
  }
  return 0;
}

/**
 * The message is a piece of the name rather than the other way round.
 * Arabic gets a lower floor (2) because its words are short and its script has
 * no capitals; a 2-letter Latin fragment stays too easy to hit by accident.
 * This lives in the fallback tier, so it only ever wins when it is unique.
 */
function fragmentScore(msg: string, key: string): number {
  const floor = /[\u0600-\u06FF]/.test(msg) ? 2 : MIN_PREFIX;
  if (msg.length < floor) return 0;
  return key.includes(msg) ? 600 + msg.length : 0;
}

function isArabic(word: string): boolean {
  return /[\u0600-\u06FF]/.test(word);
}

/**
 * How wrong a spelling may be for this pair.
 *
 * Two short Arabic words are never tolerated: its trilateral roots make
 * 4-letter neighbours (صباح/صلاح, الخير/الدار) routine, so guessing there would
 * vote for whoever happens to be playing. Longer Arabic pairs get one edit
 * unless one of them is 7+ letters. Latin keeps two edits from 5 letters up.
 * Arabic spelling variety is mostly hamza/ta/ya and tashkeel, which
 * `normalize` already removes exactly, so little is lost by demanding this.
 */
function allowedDistance(a: string, b: string): number {
  const shortest = Math.min(a.length, b.length);
  const longest = Math.max(a.length, b.length);
  if (isArabic(a) && isArabic(b)) {
    if (shortest <= 4) return 0;
    return longest >= 7 ? MAX_DISTANCE : 1;
  }
  return longest >= 5 ? MAX_DISTANCE : 1;
}

/**
 * Misspellings: how close one word of the message is to one word of the name.
 *
 * Only single-word messages are considered — a vote *is* the name, while two or
 * more words are chat ("الحمد لله", "صباح الخير"), and guessing there is how a
 * greeting becomes a vote for whoever happens to be playing.
 */
function fuzzyScore(words: string[], key: string): number {
  if (words.length > 1) return 0;
  const keyWords = key.split(" ");
  let best = 0;
  for (const word of words) {
    if (word.length < MIN_FUZZY) continue;
    for (const keyWord of keyWords) {
      if (keyWord.length < MIN_FUZZY) continue;
      const cap = allowedDistance(word, keyWord);
      if (cap === 0) continue;
      const distance = levenshtein(word, keyWord, cap);
      if (distance === 0 || distance > cap) continue;
      if (distance * 2 > Math.min(word.length, keyWord.length)) continue;
      const score = 500 - distance * 25;
      if (score > best) best = score;
    }
  }
  return best;
}

interface Candidate {
  id: string;
  keys: string[];
}

/**
 * Picks the candidate for a normalised message.
 *
 * Near matches (exact, whole name, first word, first letters) always win and
 * ties are broken by the longest name, exactly as before. Only when nothing
 * matched do we fall back to fragments and typo distance — and then only when
 * one candidate is clearly better than the rest, so a vote never lands on the
 * wrong competitor because two names were similarly misspelled.
 */
function pick(candidates: Candidate[], msg: string): string | null {
  const words = msg.split(" ").filter((w) => w.length > 0);

  const near: { id: string; score: number; len: number }[] = [];
  for (const candidate of candidates) {
    for (const key of candidate.keys) {
      const score = strongScore(msg, key, words);
      if (score > 0) near.push({ id: candidate.id, score, len: key.length });
    }
  }
  if (near.length > 0) {
    // An exact name or the name sitting inside the message always wins.
    const whole = near.filter((hit) => hit.score >= 900);
    let best: { id: string; score: number; len: number } | null = null;
    for (const hit of whole.length > 0 ? whole : []) {
      if (!best || hit.score > best.score || (hit.score === best.score && hit.len > best.len)) best = hit;
    }
    if (best) return best.id;
    // Below that, two competitors matched the same fragment (two "Ahmed"s) —
    // refuse rather than pick one at random and ask for more letters.
    if (new Set(near.map((hit) => hit.id)).size > 1) return null;
    const only = near[0];
    return only ? only.id : null;
  }

  const scores = new Map<string, number>();
  for (const candidate of candidates) {
    let best = 0;
    for (const key of candidate.keys) {
      best = Math.max(best, fragmentScore(msg, key), fuzzyScore(words, key));
    }
    if (best > 0) scores.set(candidate.id, best);
  }
  if (scores.size === 0) return null;

  let topId: string | null = null;
  let top = -1;
  let second = -1;
  for (const [id, score] of scores) {
    if (score > top) {
      second = top;
      top = score;
      topId = id;
    } else if (score > second) {
      second = score;
    }
  }
  if (topId === null || top <= second) return null;
  return topId;
}

function keysFor(item: Item): string[] {
  const keys = [normalize(item.name), ...item.aliases.map(normalize)];
  return keys.filter((k) => k.length > 0);
}

export function matchItem(text: string, items: (Item | null)[]): string | null {
  const msg = normalize(text);
  if (!msg) return null;
  const candidates: Candidate[] = [];
  for (const item of items) {
    if (!item) continue;
    const keys = keysFor(item);
    if (keys.length > 0) candidates.push({ id: item.id, keys });
  }
  return pick(candidates, msg);
}

/** Matches a chat message to a category by its name (English or Arabic). */
export function matchCategory(text: string, categories: Category[]): string | null {
  const msg = normalize(text);
  if (!msg) return null;
  const candidates: Candidate[] = [];
  for (const category of categories) {
    const keys = [normalize(category.name), normalize(category.nameAr ?? "")].filter((k) => k.length > 0);
    if (keys.length > 0) candidates.push({ id: category.id, keys });
  }
  return pick(candidates, msg);
}
