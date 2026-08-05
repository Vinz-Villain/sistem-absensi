const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config(); // Panggil dotenv di sini

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// Ubah koneksi database agar memanggil process.env
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

// ... sisa kodemu di bawahnya biarkan tetap sama ...

// Middleware: Memberitahu server untuk mengizinkan akses dari luar dan bisa membaca data JSON
app.use(cors());
app.use(express.json());

// Menampilkan halaman index.html saat membuka localhost:3000
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// 1. KONEKSI DATABASE
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',      // Username bawaan XAMPP
  password: '',      // Password bawaan XAMPP (kosong)
  database: 'db_absensi'
});

db.connect((err) => {
  if (err) throw err;
  console.log('Database MySQL berhasil terhubung!');
});

// ==========================================
// 2. SISTEM CRUD (Create, Read, Update, Delete)
// ==========================================

// READ: Menampilkan semua data absen
app.get('/api/absen', (req, res) => {
  db.query("SELECT * FROM kehadiran ORDER BY waktu DESC", (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// CREATE: Menambah data absen baru
app.post('/api/absen', (req, res) => {
  const { nama, status } = req.body;
  const sql = "INSERT INTO kehadiran (nama, status) VALUES (?, ?)";
  
  db.query(sql, [nama, status], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ pesan: "Berhasil absen!", id: result.insertId });
  });
});

// DELETE: Menghapus data absen berdasarkan ID
app.delete('/api/absen/:id', (req, res) => {
  const id = req.params.id;
  db.query("DELETE FROM kehadiran WHERE id = ?", [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ pesan: "Data absen dihapus!" });
  });
});

// UPDATE: Mengubah data absen berdasarkan ID
app.put('/api/absen/:id', (req, res) => {
  const id = req.params.id;
  const { nama, status } = req.body;
  
  const sql = "UPDATE kehadiran SET nama = ?, status = ? WHERE id = ?";
  
  db.query(sql, [nama, status, id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ pesan: "Data absen berhasil diperbarui!" });
  });
});

// ==========================================
// 3. MENYALAKAN SERVER
// ==========================================
app.listen(3000, () => {
  console.log('Server berjalan mulus di http://localhost:3000');
});
// Tambahkan baris ini di paling bawah file server.js
module.exports = app;