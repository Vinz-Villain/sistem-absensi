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
      console.log('🎉 TABEL KEHADIRAN BERHASIL DIBUAT DI AIVEN!');
    }
    connection.end();
  });
});