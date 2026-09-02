const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Konfigurasi Cloudinary
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
  });
} else if (process.env.CLOUDINARY_URL) {
  cloudinary.config({ secure: true });
}

// Helper upload gambar ke Cloudinary
async function uploadFotoKeCloudinary(fotoInput) {
  if (!fotoInput) return null;
  // Jika sudah berupa URL gambar
  if (typeof fotoInput === 'string' && fotoInput.startsWith('http')) {
    return fotoInput;
  }
  const hasCloudinary = (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) || process.env.CLOUDINARY_URL;
  if (hasCloudinary && typeof fotoInput === 'string' && fotoInput.startsWith('data:image')) {
    try {
      const uploadRes = await cloudinary.uploader.upload(fotoInput, {
        folder: 'absensi_bukti',
        resource_type: 'image'
      });
      return uploadRes.secure_url;
    } catch (err) {
      console.error('❌ Gagal upload foto ke Cloudinary:', err.message);
      return fotoInput;
    }
  }
  return fotoInput;
}

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

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

// Pastikan kolom foto tersedia pada tabel kehadiran
pool.query("ALTER TABLE kehadiran ADD COLUMN foto LONGTEXT NULL", (err) => {
  if (err && !err.message.includes('Duplicate column') && err.code !== 'ER_DUP_FIELDNAME') {
    console.log('Catatan migrasi db:', err.message);
  }
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
  const { nama, status, foto } = req.body;
  try {
    const fotoUrl = await uploadFotoKeCloudinary(foto);
    const result = await query("INSERT INTO kehadiran (nama, status, foto) VALUES (?, ?, ?)", [nama, status, fotoUrl || null]);
    res.json({ pesan: "Berhasil absen!", id: result.insertId, fotoUrl });
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
  const { nama, status, foto } = req.body;
  try {
    if (foto !== undefined) {
      const fotoUrl = await uploadFotoKeCloudinary(foto);
      await query("UPDATE kehadiran SET nama = ?, status = ?, foto = ? WHERE id = ?", [nama, status, fotoUrl, id]);
    } else {
      await query("UPDATE kehadiran SET nama = ?, status = ? WHERE id = ?", [nama, status, id]);
    }
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