import { fetchPhotos } from "../server/photos.ts";

const args = process.argv.slice(2);
const category = args.find((a) => a.startsWith("--category="))?.slice("--category=".length);
const limitArg = args.find((a) => a.startsWith("--limit="));
const limit = limitArg ? Number(limitArg.slice("--limit=".length)) || undefined : undefined;
const force = args.includes("--force");

const summary = await fetchPhotos({ category, limit, force });

console.log(`\nDone. ${summary.changed} photo(s) downloaded, ${summary.skipped} without a free image.`);
console.log("Coverage per category:");
for (const c of summary.coverage) {
  console.log(`  ${c.have}/${c.total}  ${c.name}`);
}
console.log("Log: data/photos.log");
