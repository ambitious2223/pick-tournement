import { writeFileSync } from "node:fs";
import { buildManifest } from "./manifest.ts";

const target = new URL("../tikora.manifest.json", import.meta.url);
const manifest = buildManifest();
writeFileSync(target, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
console.log(`wrote tikora.manifest.json — ${manifest.effects.length} effects, ${manifest.events.length} events`);
