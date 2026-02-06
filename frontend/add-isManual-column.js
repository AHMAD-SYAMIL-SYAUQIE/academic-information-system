/**
 * Script untuk menambahkan kolom isManual ke table absensi
 * Run dengan: node frontend/add-isManual-column.js
 */

const mysql = require('mysql2/promise');

async function addIsManualColumn() {
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    database: 'sistem_sekolah'
  });

  try {
    console.log('✅ Connected to MySQL database');

    // Check if column exists
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'sistem_sekolah' 
      AND TABLE_NAME = 'absensi' 
      AND COLUMN_NAME = 'isManual'
    `);

    if (columns.length > 0) {
      console.log('✅ Column "isManual" already exists in absensi table');
      await connection.end();
      return;
    }

    // Add column
    await connection.query(`
      ALTER TABLE absensi 
      ADD COLUMN isManual TINYINT(1) NOT NULL DEFAULT 0 
      AFTER keterangan
    `);

    console.log('✅ Column "isManual" added successfully to absensi table!');

    // Verify
    const [verify] = await connection.query(`
      SELECT COLUMN_NAME, DATA_TYPE, COLUMN_DEFAULT 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'sistem_sekolah' 
      AND TABLE_NAME = 'absensi' 
      AND COLUMN_NAME = 'isManual'
    `);

    console.log('✅ Verification:', verify[0]);
    console.log('🎉 Setup Complete!');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

addIsManualColumn();
