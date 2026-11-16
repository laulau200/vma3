import express from 'express';
import cors from 'cors';
import { DatabaseSync } from 'node:sqlite';

const app = express();
const db = new DatabaseSync('vma.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS vma_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_name TEXT NOT NULL,
    distance_m INTEGER NOT NULL,
    vma_kmh REAL NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

app.use(cors());
app.use(express.json());

app.post('/api/vma', (req, res) => {
  const { userName, distanceM } = req.body;

  if (!userName || typeof distanceM !== 'number' || distanceM <= 0) {
    return res.status(400).json({ error: 'Nom et distance valides requis.' });
  }

  const vma = distanceM / 200;

  db.prepare(
    `INSERT INTO vma_results (user_name, distance_m, vma_kmh)
     VALUES (?, ?, ?)`
  ).run(userName, distanceM, vma);

  const result = db
    .prepare(
      `SELECT * FROM vma_results
       WHERE user_name = ?
       ORDER BY id DESC
       LIMIT 1`
    )
    .get(userName);

  res.status(201).json(result);
});

app.get('/api/vma/:userName', (req, res) => {
  const result = db
    .prepare(
      `SELECT * FROM vma_results
       WHERE user_name = ?
       ORDER BY id DESC
       LIMIT 1`
    )
    .get(req.params.userName);

  if (!result) {
    return res.status(404).json({ error: 'Aucun résultat trouvé.' });
  }

  res.json(result);
});

app.get('/api/vma/:userName/history', (req, res) => {
  const results = db
    .prepare(
      `SELECT * FROM vma_results
       WHERE user_name = ?
       ORDER BY id DESC
       LIMIT 20`
    )
    .all(req.params.userName);

  res.json(results);
});

app.listen(3001, () => {
  console.log('API disponible sur http://localhost:3001');
});