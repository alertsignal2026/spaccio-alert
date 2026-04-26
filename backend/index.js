const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'spaccioalert',
  user: 'postgres',
  password: 'Milano2026',
});

const app = express();
app.use(cors());
app.use(express.json());
function distanzaKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

async function moderaSegnalazione(nuova) {
  const { id, latitudine, longitudine } = nuova;
  const result = await pool.query('SELECT * FROM segnalazioni WHERE id != $1', [id]);
  let simili = 0;
  const vicine = [];
  for (const s of result.rows) {
    const dist = distanzaKm(parseFloat(latitudine), parseFloat(longitudine), parseFloat(s.latitudine), parseFloat(s.longitudine));
    if (dist <= 0.1) { simili++; vicine.push(s.id); }
  }
  if (simili >= 2) {
    await pool.query('UPDATE segnalazioni SET validata = true WHERE id = $1', [id]);
    for (const vid of vicine) {
      await pool.query('UPDATE segnalazioni SET validata = true WHERE id = $1', [vid]);
    }
    console.log('Zona validata!');
  }
}

app.get('/', (req, res) => {
  res.json({ message: 'SpaccioAlert API attiva!' });
});

app.get('/segnalazioni', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM segnalazioni WHERE validata = true ORDER BY data_ora DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/segnalazioni', async (req, res) => {
  const { latitudine, longitudine, categoria, descrizione } = req.body;
  try {
    const result = await pool.query('INSERT INTO segnalazioni (latitudine, longitudine, categoria, descrizione) VALUES ($1, $2, $3, $4) RETURNING *', [latitudine, longitudine, categoria, descrizione]);
    const nuova = result.rows[0];
    await moderaSegnalazione(nuova);
    res.status(201).json({ message: 'Segnalazione ricevuta', id: nuova.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000, () => {
  console.log('Server avviato su porta 3000');
});