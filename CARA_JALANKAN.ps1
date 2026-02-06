# ========================================
# 🚀 PANDUAN LENGKAP MENJALANKAN SISTEM
# Sistem Absensi dan Nilai Akademik
# ========================================

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     🎓 SISTEM ABSENSI DAN NILAI AKADEMIK v2.0.0          ║" -ForegroundColor Green
Write-Host "║     Panduan Lengkap Instalasi & Menjalankan Server        ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# ========================================
# LANGKAH 1: SETUP DATABASE
# ========================================
Write-Host "📊 LANGKAH 1: SETUP DATABASE MYSQL" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Gray
Write-Host ""
Write-Host "  1. Pastikan MySQL service berjalan (via XAMPP/WAMP/Standalone)" -ForegroundColor White
Write-Host "     • XAMPP: Start Apache + MySQL di Control Panel" -ForegroundColor Gray
Write-Host "     • Standalone: " -ForegroundColor Gray -NoNewline
Write-Host "Get-Service MySQL* | Start-Service" -ForegroundColor Cyan
Write-Host ""
Write-Host "  2. Buat database baru:" -ForegroundColor White
Write-Host "     mysql -u root -p" -ForegroundColor Cyan
Write-Host "     CREATE DATABASE sistem_sekolah CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" -ForegroundColor Cyan
Write-Host "     EXIT;" -ForegroundColor Cyan
Write-Host ""
Write-Host "  ✅ Database 'sistem_sekolah' berhasil dibuat!" -ForegroundColor Green
Write-Host ""

# ========================================
# LANGKAH 2: INSTALL DEPENDENCIES
# ========================================
Write-Host "📦 LANGKAH 2: INSTALL DEPENDENCIES" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Gray
Write-Host ""
Write-Host "  Masuk ke folder frontend:" -ForegroundColor White
Write-Host "  cd 'D:\SISTEM ABSEN DAN NILAI\frontend'" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Install semua dependencies (estimasi 2-3 menit):" -ForegroundColor White
Write-Host "  npm install" -ForegroundColor Cyan
Write-Host ""

# ========================================
# LANGKAH 3: KONFIGURASI ENVIRONMENT
# ========================================
Write-Host "⚙️  LANGKAH 3: KONFIGURASI ENVIRONMENT" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Gray
Write-Host ""
Write-Host "  Buat/edit file .env.local di folder frontend:" -ForegroundColor White
Write-Host "  notepad .env.local" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Isi dengan konfigurasi berikut:" -ForegroundColor White
Write-Host "  ┌─────────────────────────────────────────────────────┐" -ForegroundColor Gray
Write-Host "  │ DATABASE_URL='mysql://root:@127.0.0.1:3306/sistem_sekolah'" -ForegroundColor Cyan
Write-Host "  │ JWT_SECRET='your-super-secret-jwt-key-here'         │" -ForegroundColor Cyan
Write-Host "  │                                                      │" -ForegroundColor Gray
Write-Host "  │ # SMTP (Optional - untuk forgot password)           │" -ForegroundColor Green
Write-Host "  │ SMTP_HOST='smtp.gmail.com'                          │" -ForegroundColor Cyan
Write-Host "  │ SMTP_PORT=465                                        │" -ForegroundColor Cyan
Write-Host "  │ SMTP_SECURE=true                                     │" -ForegroundColor Cyan
Write-Host "  │ SMTP_USER='your-email@gmail.com'                    │" -ForegroundColor Cyan
Write-Host "  │ SMTP_PASS='your-app-password'                       │" -ForegroundColor Cyan
Write-Host "  └─────────────────────────────────────────────────────┘" -ForegroundColor Gray
Write-Host ""
Write-Host "  ⚠️  PENTING: Ganti 'root:@' dengan username:password MySQL Anda!" -ForegroundColor Red
Write-Host "  Contoh: mysql://root:mypassword@127.0.0.1:3306/sistem_sekolah" -ForegroundColor Yellow
Write-Host ""

# ========================================
# LANGKAH 4: SETUP DATABASE SCHEMA
# ========================================
Write-Host "🗄️  LANGKAH 4: SETUP DATABASE SCHEMA" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Gray
Write-Host ""
Write-Host "  Jalankan perintah berikut satu per satu:" -ForegroundColor White
Write-Host ""
Write-Host "  1. Generate Prisma Client:" -ForegroundColor White
Write-Host "     npx prisma generate" -ForegroundColor Cyan
Write-Host ""
Write-Host "  2. Push schema ke database:" -ForegroundColor White
Write-Host "     npx prisma db push" -ForegroundColor Cyan
Write-Host ""
Write-Host "  3. Seed data dummy (Admin, Guru, Siswa):" -ForegroundColor White
Write-Host "     npm run prisma:seed" -ForegroundColor Cyan
Write-Host ""
Write-Host "  ✅ Database siap digunakan dengan data dummy!" -ForegroundColor Green
Write-Host ""

# ========================================
# LANGKAH 5: MENJALANKAN SERVER
# ========================================
Write-Host "🚀 LANGKAH 5: MENJALANKAN SERVER (DUAL SERVER ARCHITECTURE)" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Gray
Write-Host ""
Write-Host "  ⚠️  PENTING: Sistem membutuhkan 2 SERVER yang berjalan bersamaan!" -ForegroundColor Red
Write-Host ""
Write-Host "  ┌────────────────────────────────────────────────────────┐" -ForegroundColor Cyan
Write-Host "  │  Server 1: Frontend (Port 3000)  - Web Interface       │" -ForegroundColor White
Write-Host "  │  Server 2: PDF (Port 4000)       - Export PDF Laporan  │" -ForegroundColor White
Write-Host "  └────────────────────────────────────────────────────────┘" -ForegroundColor Cyan
Write-Host ""

Write-Host "  📍 OPSI A: Menjalankan dengan 2 Terminal (RECOMMENDED)" -ForegroundColor Green
Write-Host "  ────────────────────────────────────────────────────────" -ForegroundColor Gray
Write-Host ""
Write-Host "  Terminal 1 - Frontend Server:" -ForegroundColor White
Write-Host "  ┌─────────────────────────────────────────────────────┐" -ForegroundColor Gray
Write-Host "  │ cd 'D:\SISTEM ABSEN DAN NILAI\frontend'             │" -ForegroundColor Cyan
Write-Host "  │ npm run dev                                          │" -ForegroundColor Cyan
Write-Host "  │                                                      │" -ForegroundColor Gray
Write-Host "  │ ✅ Frontend: http://localhost:3000                   │" -ForegroundColor Green
Write-Host "  └─────────────────────────────────────────────────────┘" -ForegroundColor Gray
Write-Host ""
Write-Host "  Terminal 2 - PDF Server:" -ForegroundColor White
Write-Host "  ┌─────────────────────────────────────────────────────┐" -ForegroundColor Gray
Write-Host "  │ cd 'D:\SISTEM ABSEN DAN NILAI\frontend'             │" -ForegroundColor Cyan
Write-Host "  │ npm run pdf-server                                   │" -ForegroundColor Cyan
Write-Host "  │                                                      │" -ForegroundColor Gray
Write-Host "  │ ✅ PDF Server: http://localhost:4000                 │" -ForegroundColor Green
Write-Host "  └─────────────────────────────────────────────────────┘" -ForegroundColor Gray
Write-Host ""

Write-Host "  📍 OPSI B: Menjalankan dengan 1 Terminal (Concurrent)" -ForegroundColor Cyan
Write-Host "  ────────────────────────────────────────────────────────" -ForegroundColor Gray
Write-Host ""
Write-Host "  ┌─────────────────────────────────────────────────────┐" -ForegroundColor Gray
Write-Host "  │ cd 'D:\SISTEM ABSEN DAN NILAI\frontend'             │" -ForegroundColor Cyan
Write-Host "  │ npm run dev:full                                     │" -ForegroundColor Cyan
Write-Host "  │                                                      │" -ForegroundColor Gray
Write-Host "  │ ⚠️  Note: Jika 1 server error, keduanya terminate   │" -ForegroundColor Yellow
Write-Host "  └─────────────────────────────────────────────────────┘" -ForegroundColor Gray
Write-Host ""

# ========================================
# LANGKAH 6: AKSES APLIKASI
# ========================================
Write-Host "🌐 LANGKAH 6: AKSES APLIKASI" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Gray
Write-Host ""
Write-Host "  Buka browser dan akses:" -ForegroundColor White
Write-Host "  🔗 http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Default Login Credentials (setelah seed):" -ForegroundColor White
Write-Host ""
Write-Host "  👨‍💼 ADMIN" -ForegroundColor Green
Write-Host "     Username: admin" -ForegroundColor Cyan
Write-Host "     Password: password123" -ForegroundColor Cyan
Write-Host ""
Write-Host "  👨‍🏫 GURU" -ForegroundColor Green
Write-Host "     Username: guru1 / guru2 / guru3" -ForegroundColor Cyan
Write-Host "     Password: password123" -ForegroundColor Cyan
Write-Host ""
Write-Host "  👨‍🎓 SISWA" -ForegroundColor Green
Write-Host "     Username: siswa1 / siswa2 / siswa3 / siswa4 / siswa5" -ForegroundColor Cyan
Write-Host "     Password: password123" -ForegroundColor Cyan
Write-Host ""
Write-Host "  ⚠️  PENTING: Ganti password setelah login pertama!" -ForegroundColor Red
Write-Host ""

# ========================================
# LANGKAH 7: VERIFIKASI SERVER
# ========================================
Write-Host "✅ LANGKAH 7: VERIFIKASI KEDUA SERVER BERJALAN" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Gray
Write-Host ""
Write-Host "  Test Frontend Server:" -ForegroundColor White
Write-Host "  curl http://localhost:3000" -ForegroundColor Cyan
Write-Host "  ✅ Expected: Halaman login tampil" -ForegroundColor Green
Write-Host ""
Write-Host "  Test PDF Server:" -ForegroundColor White
Write-Host "  curl http://localhost:4000/health" -ForegroundColor Cyan
Write-Host "  ✅ Expected: {'status':'OK','server':'PDF Generation Service'}" -ForegroundColor Green
Write-Host ""
Write-Host "  Test Full Integration (Export PDF):" -ForegroundColor White
Write-Host "  1. Login sebagai Admin/Guru" -ForegroundColor Gray
Write-Host "  2. Buka menu Laporan" -ForegroundColor Gray
Write-Host "  3. Klik Export PDF" -ForegroundColor Gray
Write-Host "  ✅ Expected: PDF berhasil di-download" -ForegroundColor Green
Write-Host ""

# ========================================
# TROUBLESHOOTING
# ========================================
Write-Host "🐛 TROUBLESHOOTING COMMON ISSUES" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Gray
Write-Host ""

Write-Host "  ❌ Error: Port 3000/4000 already in use" -ForegroundColor Red
Write-Host "  Solusi:" -ForegroundColor White
Write-Host "  Get-Process -Name node | Stop-Process -Force" -ForegroundColor Cyan
Write-Host ""

Write-Host "  ❌ Error: Cannot find module '@prisma/client'" -ForegroundColor Red
Write-Host "  Solusi:" -ForegroundColor White
Write-Host "  npx prisma generate" -ForegroundColor Cyan
Write-Host ""

Write-Host "  ❌ Error: Database connection failed" -ForegroundColor Red
Write-Host "  Solusi:" -ForegroundColor White
Write-Host "  1. Pastikan MySQL running: Get-Service MySQL* | Start-Service" -ForegroundColor Cyan
Write-Host "  2. Cek DATABASE_URL di .env.local (username, password, database name)" -ForegroundColor Cyan
Write-Host "  3. Test: npx prisma db push" -ForegroundColor Cyan
Write-Host ""

Write-Host "  ❌ Error: ECONNREFUSED ::1:4000 (saat export PDF)" -ForegroundColor Red
Write-Host "  Solusi:" -ForegroundColor White
Write-Host "  PDF Server belum dijalankan! Buka terminal baru:" -ForegroundColor Yellow
Write-Host "  cd 'D:\SISTEM ABSEN DAN NILAI\frontend'" -ForegroundColor Cyan
Write-Host "  npm run pdf-server" -ForegroundColor Cyan
Write-Host ""

# ========================================
# PENUTUP
# ========================================
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                 ✅ INSTALASI SELESAI!                     ║" -ForegroundColor Green
Write-Host "║                                                            ║" -ForegroundColor Green
Write-Host "║  Server Frontend: http://localhost:3000                   ║" -ForegroundColor White
Write-Host "║  Server PDF:      http://localhost:4000                   ║" -ForegroundColor White
Write-Host "║                                                            ║" -ForegroundColor Green
Write-Host "║  📚 README.md - Dokumentasi lengkap                       ║" -ForegroundColor Cyan
Write-Host "║  🐛 GitHub Issues - Report bugs                           ║" -ForegroundColor Cyan
Write-Host "║  💬 Contact: contact@man19jakarta.sch.id                  ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "💡 Tip: Gunakan start-dev.ps1 untuk auto-start kedua server!" -ForegroundColor Yellow
Write-Host ""
Write-Host "Built with ❤️  by MAN 19 Jakarta Development Team" -ForegroundColor Magenta
Write-Host ""
