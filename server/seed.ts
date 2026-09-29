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
    id: "football",
    name: "Football / Players",
    emoji: "⚽",
    items: [
      ["Cristiano Ronaldo", "cr7, ronaldo"],
      ["Lionel Messi", "messi, leo"],
      ["Neymar Jr", "neymar"],
      ["Kylian Mbappe", "mbappe"],
      ["Erling Haaland", "haaland"],
      ["Karim Benzema", "benzema"],
      ["Luka Modric", "modric"],
      ["Kevin De Bruyne", "kdb"],
      ["Robert Lewandowski", "lewandowski"],
      ["Mohamed Salah", "salah"],
      ["Virgil van Dijk", "vvd"],
      ["Thibaut Courtois", "courtois"],
      ["Vinicius Junior", "vinicius"],
      ["Jude Bellingham", "bellingham"],
      ["Zinedine Zidane", "zidane"],
      ["Diego Maradona", "maradona"],
    ],
  },
  {
    id: "basketball",
    name: "Basketball / NBA",
    emoji: "🏀",
    items: [
      ["LeBron James", "lebron, king james"],
      ["Michael Jordan", "mj, jordan"],
      ["Kobe Bryant", "kobe"],
      ["Stephen Curry", "curry"],
      ["Kevin Durant", "kd, durant"],
      ["Giannis Antetokounmpo", "giannis, greek freak"],
      ["Luka Doncic", "luka"],
      ["Nikola Jokic", "jokic"],
      ["Joel Embiid", "embiid"],
      ["Jayson Tatum", "tatum"],
      ["Anthony Davis", "ad, davis"],
      ["James Harden", "harden"],
      ["Russell Westbrook", "westbrook"],
      ["Derrick Rose", "d rose"],
      ["Shaquille ONeal", "shaq"],
      ["Magic Johnson", "magic"],
    ],
  },
  {
    id: "movies",
    name: "Movies",
    emoji: "🎬",
    items: [
      ["The Godfather", "", "🍊"],
      ["The Dark Knight", "batman dark knight", "🦇"],
      ["Pulp Fiction", "", "🍔"],
      ["Inception", "", "🌀"],
      ["Interstellar", "", "🚀"],
      ["Fight Club", "", "🥊"],
      ["Forrest Gump", "", "🍫"],
      ["The Matrix", "", "🕶️"],
      ["Gladiator", "", "⚔️"],
      ["Titanic", "", "🚢"],
      ["Avengers Endgame", "avengers", "🛡️"],
      ["The Shawshank Redemption", "shawshank", "⛓️"],
      ["Goodfellas", "", "🔫"],
      ["The Lion King", "lion king", "🦁"],
      ["Spirited Away", "", "🐉"],
      ["Parasite", "", "🐛"],
    ],
  },
  {
    id: "tv-shows",
    name: "TV Shows",
    emoji: "📺",
    items: [
      ["Breaking Bad", "breaking bad, heisenberg", "🧪"],
      ["Game of Thrones", "got", "🐉"],
      ["The Wire", "", "📡"],
      ["The Sopranos", "sopranos", "🍝"],
      ["Friends", "", "☕"],
      ["Stranger Things", "", "👾"],
      ["The Office", "", "📎"],
      ["Lost", "", "🌴"],
      ["Sherlock", "", "🔍"],
      ["Peaky Blinders", "", "🎩"],
      ["The Mandalorian", "mandalorian", "🚀"],
      ["Money Heist", "la casa de papel", "💰"],
      ["Squid Game", "", "🦑"],
      ["Better Call Saul", "saul", "⚖️"],
      ["Dark", "", "⏳"],
      ["Narcos", "", "❄️"],
    ],
  },
  {
    id: "cartoon-characters",
    name: "Cartoon Characters",
    emoji: "🎨",
    items: [
      ["Mickey Mouse", "mickey", "🐭"],
      ["Bugs Bunny", "bugs", "🥕"],
      ["Tom Cat", "tom", "🐱"],
      ["Jerry Mouse", "jerry", "🧀"],
      ["SpongeBob", "spongebob squarepants", "🧽"],
      ["Patrick Star", "patrick", "⭐"],
      ["Homer Simpson", "homer", "🍩"],
      ["Bart Simpson", "bart", "🛹"],
      ["Scooby Doo", "scooby", "🐶"],
      ["Popeye", "", "💪"],
      ["Rick Sanchez", "rick", "🧪"],
      ["Morty Smith", "morty", "👦"],
      ["Gumball Watterson", "gumball", "🐈"],
      ["Ben Tennyson", "ben 10", "⌚"],
      ["Shrek", "", "🟢"],
      ["Woody", "", "🤠"],
    ],
  },
  {
    id: "anime-characters",
    name: "Anime Characters",
    emoji: "🍥",
    items: [
      ["Goku", "son goku", "🥋"],
      ["Vegeta", "prince vegeta", "👑"],
      ["Naruto Uzumaki", "naruto", "🍜"],
      ["Sasuke Uchiha", "sasuke", "⚡"],
      ["Monkey D Luffy", "luffy", "🏴‍☠️"],
      ["Roronoa Zoro", "zoro", "🗡️"],
      ["Itachi Uchiha", "itachi", "👁️"],
      ["Levi Ackerman", "levi", "🧹"],
      ["Eren Yeager", "eren", "🗿"],
      ["Saitama", "one punch man", "👊"],
      ["Light Yagami", "kira", "📓"],
      ["L Lawliet", "l", "🍬"],
      ["Tanjiro Kamado", "tanjiro", "💧"],
      ["Nezuko Kamado", "nezuko", "🎀"],
      ["Satoru Gojo", "gojo", "🕶️"],
      ["Ichigo Kurosaki", "ichigo", "⚔️"],
    ],
  },
  {
    id: "game-characters",
    name: "Video Game Characters",
    emoji: "🕹️",
    items: [
      ["Mario", "super mario", "🍄"],
      ["Luigi", "", "🍀"],
      ["Sonic the Hedgehog", "sonic", "💨"],
      ["Link", "zelda link", "🗡️"],
      ["Princess Zelda", "zelda", "👑"],
      ["Pikachu", "", "⚡"],
      ["Master Chief", "halo", "🪖"],
      ["Kratos", "god of war", "🪓"],
      ["Lara Croft", "tomb raider", "🏹"],
      ["Cloud Strife", "cloud", "🗡️"],
      ["Sephiroth", "", "🖤"],
      ["Sub Zero", "subzero", "❄️"],
      ["Scorpion", "", "🦂"],
      ["Steve", "minecraft steve", "⛏️"],
      ["Geralt of Rivia", "geralt", "🐺"],
      ["Nathan Drake", "drake", "🗺️"],
    ],
  },
  {
    id: "game-titles",
    name: "Video Game Titles",
    emoji: "🎮",
    items: [
      ["Minecraft", "", "⛏️"],
      ["Grand Theft Auto V", "gta, gta 5, gta v", "🚗"],
      ["Fortnite", "", "🏗️"],
      ["Roblox", "", "🟥"],
      ["Breath of the Wild", "zelda botw", "🏔️"],
      ["Elden Ring", "", "💍"],
      ["Call of Duty Warzone", "warzone", "🎯"],
      ["Among Us", "among us, imposter", "🔪"],
      ["PlayerUnknowns Battlegrounds", "pubg", "🪖"],
      ["Genshin Impact", "genshin", "🌸"],
      ["League of Legends", "lol", "⚔️"],
      ["Valorant", "", "🔫"],
      ["God of War", "", "🪓"],
      ["Red Dead Redemption 2", "rdr2, red dead", "🤠"],
      ["Skyrim", "elder scrolls", "🐉"],
      ["Cyberpunk 2077", "cyberpunk", "🌃"],
    ],
  },
  {
    id: "music-artists",
    name: "Music Artists",
    emoji: "🎤",
    items: [
      ["Michael Jackson", "mj, king of pop"],
      ["Taylor Swift", "taylor, swifties"],
      ["Drake", "", "🦉"],
      ["Beyonce", "beyonce"],
      ["Rihanna", "", "💎"],
      ["Eminem", "slim shady"],
      ["The Weeknd", "weeknd"],
      ["Billie Eilish", "billie"],
      ["Ariana Grande", "ariana"],
      ["Ed Sheeran", "ed"],
      ["Justin Bieber", "bieber"],
      ["Adele", "", "🎹"],
      ["Bad Bunny", "", "🐰"],
      ["Tupac", "2pac"],
      ["Queen", "freddie mercury"],
      ["BTS", "bangtan"],
    ],
  },
  {
    id: "tiktok-creators",
    name: "TikTok Creators",
    emoji: "🎵",
    items: [
      ["Charli DAmelio", "charli"],
      ["Khaby Lame", "khaby"],
      ["Addison Rae", "addison"],
      ["Bella Poarch", "bella"],
      ["MrBeast", "beast"],
      ["Zach King", "zach"],
      ["Josh Richards", "josh"],
      ["Bryce Hall", "bryce"],
      ["Liza Koshy", "liza"],
      ["David Dobrik", "david"],
      ["Dixie DAmelio", "dixie"],
      ["Loren Gray", "loren"],
      ["Avani Gregg", "avani"],
      ["Noah Beck", "noah"],
      ["Nessa Barrett", "nessa"],
      ["Jaden Hossler", "jaden"],
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

function buildCategory(seed: SeedCategory, emoji: string): Category {
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
  void emoji;
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
    const category = buildCategory(seed, seed.emoji);
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
