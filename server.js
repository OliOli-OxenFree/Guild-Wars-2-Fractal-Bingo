import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// 1. Initialize Express App & Server Config
const app = express();
const PORT = process.env.PORT || 10000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 2. Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 3. In-Memory Store for Bingo Cards
// Key: cardId (string), Value: { grid: Array, lastAccessed: timestamp }
const cards = new Map();

// Helper Function: Shuffle Array (Fisher-Yates)
function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Helper Function: Generate 5x5 Bingo Grid with Center Free Space
function createBingoGrid(options) {
  const shuffled = shuffle(options);
  const grid = [];
  let optionIdx = 0;

  for (let row = 0; row < 5; row++) {
    const gridRow = [];
    for (let col = 0; col < 5; col++) {
      if (row === 2 && col === 2) {
        gridRow.push({ type: 'free', label: 'FREE' });
      } else {
        const label = shuffled[optionIdx % shuffled.length];
        gridRow.push({ type: 'normal', label });
        optionIdx++;
      }
    }
    grid.push(gridRow);
  }

  return grid;
}

// ==========================================
// API ROUTES
// ==========================================

// POST /api/generate - Generate 5 Card Links
app.post('/api/generate', (req, res) => {
  const { options } = req.body;

  if (!options || !Array.isArray(options) || options.length === 0) {
    return res.status(400).json({ error: 'Please provide an array of options.' });
  }

  const generatedUrls = [];
  const protocol = req.protocol;
  const host = req.get('host');

  for (let i = 0; i < 5; i++) {
    const cardId = Math.random().toString(36).substring(2, 10);
    const grid = createBingoGrid(options);

    cards.set(cardId, {
      grid,
      lastAccessed: Date.now()
    });

    generatedUrls.push(`${protocol}://${host}/card/${cardId}`);
  }

  res.json({ urls: generatedUrls });
});

// GET /api/cards/:id - Fetch Single Bingo Card Data
app.get('/api/cards/:id', (req, res) => {
  const card = cards.get(req.params.id);

  if (!card) {
    return res.status(404).json({ error: 'Card not found or expired.' });
  }

  card.lastAccessed = Date.now();
  res.json(card);
});

// DELETE /api/cards/:id - Delete Card Route (called on tab close or manual trigger)
app.delete('/api/cards/:id', (req, res) => {
  if (cards.has(req.params.id)) {
    cards.delete(req.params.id);
    return res.json({ success: true, message: 'Card successfully deleted.' });
  }
  res.status(404).json({ error: 'Card not found.' });
});

// ==========================================
// PAGE ROUTING
// ==========================================

// Serve Card View Page
app.get('/card/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'card.html'));
});

// Fallback Route to Index
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`Guild Wars 2 Fractal Bingo running on http://localhost:${PORT}`);
});
