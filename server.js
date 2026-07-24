import express from "express";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { nanoid } from "nanoid";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "data");
const CARDS_FILE = join(DATA_DIR, "cards.json");

const app = express();
const PORT = process.env.PORT || 3456;

app.use(express.json({ limit: "1mb" }));
app.use(express.static(join(__dirname, "public")));

function loadCards() {
  if (!existsSync(CARDS_FILE)) return {};
  try {
    return JSON.parse(readFileSync(CARDS_FILE, "utf8"));
  } catch {
    return {};
  }
}

function saveCards(cards) {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(CARDS_FILE, JSON.stringify(cards, null, 2), "utf8");
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Pick 24 labels for a 5x5 grid (center is free). Allows repeats if pool is small. */
function buildGrid(options) {
  const pool = options.map((s) => String(s).trim()).filter(Boolean);
  if (pool.length === 0) {
    throw new Error("At least one option is required.");
  }

  const picks = [];
  while (picks.length < 24) {
    const shuffled = shuffle(pool);
    for (const item of shuffled) {
      if (picks.length >= 24) break;
      picks.push(item);
    }
  }

  const grid = [];
  let idx = 0;
  for (let row = 0; row < 5; row++) {
    const line = [];
    for (let col = 0; col < 5; col++) {
      if (row === 2 && col === 2) {
        line.push({ type: "free", label: "FREE" });
      } else {
        line.push({ type: "option", label: picks[idx++] });
      }
    }
    grid.push(line);
  }
  return grid;
}

app.post("/api/generate", (req, res) => {
  const raw = req.body?.options;
  const options = Array.isArray(raw)
    ? raw
    : typeof raw === "string"
      ? raw.split(/\r?\n/)
      : [];

  const cleaned = options.map((s) => String(s).trim()).filter(Boolean);
  if (cleaned.length === 0) {
    return res.status(400).json({ error: "Provide at least one option." });
  }

  const cards = loadCards();
  const baseUrl = `${req.protocol}://${req.get("host")}`;
  const urls = [];

  for (let i = 0; i < 5; i++) {
    const id = nanoid(12);
    const grid = buildGrid(cleaned);
    cards[id] = {
      id,
      createdAt: new Date().toISOString(),
      grid,
    };
    urls.push(`${baseUrl}/c/${id}`);
  }

  saveCards(cards);
  res.json({ urls });
});

app.get("/api/cards/:id", (req, res) => {
  const cards = loadCards();
  const card = cards[req.params.id];
  if (!card) {
    return res.status(404).json({ error: "Card not found." });
  }
  res.json({ id: card.id, grid: card.grid });
});

app.get("/c/:id", (_req, res) => {
  res.sendFile(join(__dirname, "public", "card.html"));
});

app.listen(PORT, () => {
  console.log(`Guild Wars 2 Fractal Bingo running at http://localhost:${PORT}`);
});
