import { test } from "node:test";
import assert from "node:assert/strict";
import type { Category, Item } from "../shared/types.ts";
import { matchCategory, matchItem, normalize } from "./matcher.ts";

const squad: (Item | null)[] = [
  { id: "salah", name: "محمد صلاح", aliases: ["صلاح"] },
  { id: "messi", name: "Lionel Messi", aliases: ["leo", "messi", "ميسي"] },
  { id: "ronaldo", name: "Cristiano Ronaldo", aliases: ["cr7", "ronaldo"] },
];

const categories: Category[] = [
  { id: "food", name: "Middle East Foods", nameAr: "أكلات الشرق الأوسط", items: [] },
  { id: "cities", name: "Middle East Cities", nameAr: "مدن الشرق الأوسط", items: [] },
];

test("Arabic spelling variants collapse to one string", () => {
  assert.equal(normalize("مُحَمَّد"), normalize("محمد"));
  assert.equal(normalize("أحمد إبراهيم آمنة"), normalize("احمد ابراهيم امنة"));
  assert.equal(normalize("موسى"), normalize("موسي"));
  assert.equal(normalize("فتوشة"), normalize("فتوشه"));
  assert.equal(normalize("م\u0640ح\u0640م\u0640د"), normalize("محمد"));
  assert.equal(normalize("٤"), "4");
});

test("the first word of a two-word name still counts", () => {
  assert.equal(matchItem("محمد", squad), "salah");
  assert.equal(matchCategory("أكلات", categories), "food");
  assert.equal(matchCategory("مدن", categories), "cities");
});

test("the front of a single-word name still counts", () => {
  const players: (Item | null)[] = [
    { id: "auh", name: "أبوظبي", aliases: [] },
    { id: "dxb", name: "دبي", aliases: [] },
  ];
  assert.equal(matchItem("ابوظ", players), "auh");
  assert.equal(matchItem("دب", players), "dxb");
});

test("a misspelling still counts", () => {
  assert.equal(matchItem("misi", squad), "messi");
  const players: (Item | null)[] = [
    { id: "shawarma", name: "شاورما", aliases: [] },
    { id: "kabsa", name: "كبسة", aliases: [] },
  ];
  assert.equal(matchItem("شاورمي", players), "shawarma");
});

test("short Arabic words are never guessed at", () => {
  const players: (Item | null)[] = [
    { id: "casablanca", name: "الدار البيضاء", aliases: ["كازابلانكا", "casablanca"] },
    { id: "salah", name: "محمد صلاح", aliases: ["صلاح"] },
  ];
  assert.equal(matchItem("صباح الخير جميعا", players), null);
  assert.equal(matchItem("صباح الخير", players), null);
  assert.equal(matchItem("صلاح", players), "salah");
});

test("Latin behaviour is unchanged", () => {
  assert.equal(normalize("  Cristiano  RONALDO! "), "cristiano ronaldo");
  assert.equal(normalize("Zinédine Zidane"), "zinedine zidane");
  assert.equal(matchItem("CR7", squad), "ronaldo");
  assert.equal(matchItem("i vote messi", squad), "messi");
  assert.equal(matchItem("messi wins", squad), "messi");
});

test("unrelated chat never becomes a vote", () => {
  assert.equal(matchItem("hello chat", squad), null);
  assert.equal(matchItem("غدا نلتقي", squad), null);
  assert.equal(matchCategory("مرحبا", categories), null);
});

test("two competitors sharing a first word need more letters", () => {
  const players: (Item | null)[] = [
    { id: "helmy", name: "Ahmed Helmy", aliases: [] },
    { id: "ezz", name: "Ahmed Ezz", aliases: [] },
  ];
  assert.equal(matchItem("Ahmed Helmy", players), "helmy");
  assert.equal(matchItem("Ahmed", players), null);
  assert.equal(matchItem("Ahme", players), null);
});

test("a dedicated Arabic name is matchable without an alias", () => {
  const players: (Item | null)[] = [
    { id: "keffiyeh", name: "Keffiyeh", nameAr: "الكوفية", aliases: [] },
    { id: "abaya", name: "Abaya", nameAr: "العباية", aliases: [] },
  ];
  assert.equal(matchItem("الكوفية", players), "keffiyeh");
  assert.equal(matchItem("عباية", players), "abaya");
});

test("an equally close typo is refused rather than guessed", () => {
  const players: (Item | null)[] = [
    { id: "a", name: "runner", aliases: [] },
    { id: "b", name: "runnex", aliases: [] },
  ];
  assert.equal(matchItem("runnes", players), null);
  assert.equal(matchItem("runner", players), "a");
});
