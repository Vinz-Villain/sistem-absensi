require('dotenv').config();
const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
});

const createTableQuery = `
  CREATE TABLE IF NOT EXISTS kehadiran (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama VARCHAR(255) NOT NULL,
    status ENUM('Hadir', 'Izin', 'Sakit') NOT NULL,
    foto LONGTEXT NULL,
    waktu TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`;

connection.connect((err) => {
  if (err) {
    console.error('❌ Gagal connect ke Aiven:', err.message);
    return;
  }
  console.log('✅ Berhasil terhubung ke Database Aiven!');

  connection.query(createTableQuery, (err, results) => {
    if (err) {
      console.error('❌ Gagal buat tabel:', err.message);
    } else {
      console.log('🎉 TABEL KEHADIRAN BERHASIL DIBUAT / DIPERBARUI DI AIVEN!');
      
      // Jalankan ALTER TABLE jika kolom foto belum ada di tabel lama
      connection.query("ALTER TABLE kehadiran ADD COLUMN foto LONGTEXT NULL", (alterErr) => {
        if (alterErr) {
          // Abaikan jika kolom foto sudah ada (ER_DUP_FIELDNAME)
          console.log('ℹ️ Status kolom foto:', alterErr.message.includes('Duplicate column') ? 'Sudah ada' : alterErr.message);
        } else {
          console.log('✅ Kolom foto berhasil ditambahkan ke tabel kehadiran!');
        }
        connection.end();
      });
    }
  });
});