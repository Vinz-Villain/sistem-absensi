const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  ssl: {
    rejectUnauthorized: false
  },
  connectionLimit: 5,
  connectTimeout: 10000
});

function query(sql, params) {
  return new Promise((resolve, reject) => {
    pool.query(sql, params, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
}

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// ==========================================
// 2. SISTEM CRUD (Create, Read, Update, Delete)
// ==========================================

// READ: Menampilkan semua data absen
app.get('/api/absen', async (req, res) => {
  try {
    const results = await query("SELECT * FROM kehadiran ORDER BY waktu DESC");
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE: Menambah data absen baru
app.post('/api/absen', async (req, res) => {
  const { nama, status } = req.body;
  try {
    const result = await query("INSERT INTO kehadiran (nama, status) VALUES (?, ?)", [nama, status]);
    res.json({ pesan: "Berhasil absen!", id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE: Menghapus data absen berdasarkan ID
app.delete('/api/absen/:id', async (req, res) => {
  const id = req.params.id;
  try {
    await query("DELETE FROM kehadiran WHERE id = ?", [id]);
    res.json({ pesan: "Data absen dihapus!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE: Mengubah data absen berdasarkan ID
app.put('/api/absen/:id', async (req, res) => {
  const id = req.params.id;
  const { nama, status } = req.body;
  try {
    await query("UPDATE kehadiran SET nama = ?, status = ? WHERE id = ?", [nama, status, id]);
    res.json({ pesan: "Data absen berhasil diperbarui!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 3. MENYALAKAN SERVER
// ==========================================
if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server berjalan di http://localhost:${port}`);
  });
}

module.exports = app;