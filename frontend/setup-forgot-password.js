// Quick setup script untuk create password_reset_otp table
// Run: node setup-forgot-password.js

const mysql = require('mysql2/promise');

async function setup() {
  console.log('🔧 Setting up Forgot Password table...\n');

  try {
    // Create connection
    const connection = await mysql.createConnection({
      host: '127.0.0.1',
      port: 3306,
      user: 'root',
      password: '',
      database: 'sistem_sekolah'
    });

    console.log('✅ Connected to MySQL database\n');

    // Create table
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS password_reset_otp (
        uuid VARCHAR(36) PRIMARY KEY,
        userUuid VARCHAR(36) NOT NULL,
        otp VARCHAR(6) NOT NULL,
        expiredAt DATETIME NOT NULL,
        isUsed BOOLEAN DEFAULT FALSE,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userUuid) REFERENCES user(uuid) ON DELETE CASCADE,
        INDEX idx_userUuid (userUuid),
        INDEX idx_otp (otp),
        INDEX idx_expiredAt (expiredAt)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await connection.execute(createTableSQL);
    console.log('✅ Table "password_reset_otp" created successfully!\n');

    // Check table exists
    const [rows] = await connection.execute(
      "SHOW TABLES LIKE 'password_reset_otp'"
    );

    if (rows.length > 0) {
      console.log('✅ Verification: Table exists in database\n');
      
      // Show table structure
      const [columns] = await connection.execute(
        "DESCRIBE password_reset_otp"
      );
      
      console.log('📋 Table Structure:');
      console.table(columns);
    }

    await connection.end();

    console.log('\n🎉 Setup Complete!\n');
    console.log('Next steps:');
    console.log('1. Setup SMTP credentials in .env.local');
    console.log('2. Run: npm run dev');
    console.log('3. Test forgot password flow\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Make sure MySQL is running (XAMPP/Laragon)');
    console.log('2. Check database name: sistem_sekolah');
    console.log('3. Check MySQL credentials (root, no password)\n');
    process.exit(1);
  }
}

setup();
