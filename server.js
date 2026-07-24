// Example in-memory store structure (adjust to your database if using one)
const cards = new Map(); // key: cardId, value: { grid, lastAccessed: Date.now() }

// ==========================================
// FAIL-SAFE: Automatic Cleanup Routine
// ==========================================
const INACTIVITY_LIMIT_MS = 3 * 60 * 60 * 1000; // 3 hours in milliseconds
const CLEANUP_INTERVAL_MS = 15 * 60 * 1000;      // Run check every 15 minutes

setInterval(() => {
  const now = Date.now();
  let deletedCount = 0;

  for (const [cardId, cardData] of cards.entries()) {
    if (now - cardData.lastAccessed > INACTIVITY_LIMIT_MS) {
      cards.delete(cardId);
      deletedCount++;
    }
  }

  if (deletedCount > 0) {
    console.log(`[Auto-Cleanup] Removed ${deletedCount} inactive card(s).`);
  }
}, CLEANUP_INTERVAL_MS);


// ==========================================
// API ROUTES
// ==========================================

// GET Card - Update lastAccessed timestamp whenever loaded
app.get('/api/cards/:id', (req, res) => {
  const card = cards.get(req.params.id);
  if (!card) {
    return res.status(404).json({ error: 'Card not found or expired' });
  }

  // Refresh activity timestamp on access
  card.lastAccessed = Date.now();
  res.json(card);
});

// DELETE Card - Manual deletion endpoint
app.delete('/api/cards/:id', (req, res) => {
  if (cards.has(req.params.id)) {
    cards.delete(req.params.id);
    return res.json({ success: true, message: 'Card successfully deleted.' });
  }
  res.status(404).json({ error: 'Card not found.' });
});
