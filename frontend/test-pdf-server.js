// Test script untuk cek apakah PDF server berfungsi
const http = require('http');

// Test 1: Health check
console.log('Testing health endpoint...');
http.get('http://localhost:4000/health', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('✅ Health check:', data);
    testDatabase();
  });
}).on('error', (err) => {
  console.log('❌ Health check failed:', err.message);
});

// Test 2: Database connection
function testDatabase() {
  console.log('\nTesting database endpoint...');
  http.get('http://localhost:4000/test', (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      console.log('✅ Database test:', data);
      console.log('\n🎉 All tests passed!');
      console.log('\nSekarang coba export PDF dari browser:');
      console.log('1. Login sebagai guru1 / password123');
      console.log('2. Buka menu Laporan');
      console.log('3. Pilih Kelas & Export PDF');
    });
  }).on('error', (err) => {
    console.log('❌ Database test failed:', err.message);
  });
}
