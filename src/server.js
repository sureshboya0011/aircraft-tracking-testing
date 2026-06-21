const express = require('express');
const path = require('path');
const { AircraftStore } = require('./aircraftStore');

const app = express();
const store = new AircraftStore();

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// Feature 0 — Health check
app.get('/health', (_req, res) => res.type('text/plain').send('OK'));

// Feature 1 — Register aircraft
app.post('/aircraft', (req, res, next) => {
  try {
    const created = store.add(req.body || {});
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

// Feature 1 — List all aircraft
app.get('/aircraft', (_req, res) => {
  res.json(store.list());
});

// Feature 3 — Tracking views (must be declared BEFORE /aircraft/:id)
app.get('/aircraft/in-progress', (_req, res) => {
  res.json(store.listInProgress());
});

app.get('/aircraft/scheduled-today', (_req, res) => {
  res.json(store.listScheduledToday());
});

// Feature 5 — Summary
app.get('/aircraft/summary', (_req, res) => {
  res.json(store.summary());
});

// Get single aircraft (includes history — Feature 5)
app.get('/aircraft/:id', (req, res, next) => {
  const record = store.get(req.params.id);
  if (!record) {
    return next(Object.assign(new Error(`Aircraft '${req.params.id}' not found.`), { status: 404 }));
  }
  res.json(record);
});

// Feature 2 — Update status
app.patch('/aircraft/:id/status', (req, res, next) => {
  try {
    const { status } = req.body || {};
    const updated = store.updateStatus(req.params.id, status);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// 404 for unknown routes
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
});

// Centralized error handler — Feature 4 (clear error messages)
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Aircraft Maintenance Tracker running on http://localhost:${PORT}`);
    console.log(`Health: http://localhost:${PORT}/health`);
    console.log(`Demo UI: http://localhost:${PORT}/`);
  });
}

module.exports = app;
