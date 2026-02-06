# ========================================
# SCRIPT INSTALASI OTOMATIS
# Sistem Absensi & Akademik Sekolah
# ========================================

Write-Host "================================" -ForegroundColor Cyan
Write-Host "🏫 SISTEM ABSENSI & AKADEMIK (NEXT.JS)" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check prerequisites
Write-Host "🔍 Checking prerequisites..." -ForegroundColor Yellow
Write-Host ""

# Check Node.js
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js tidak ditemukan. Silakan install dari https://nodejs.org" -ForegroundColor Red
    exit 1
}

# Check MySQL
try {
    $mysqlVersion = mysql --version
    Write-Host "✅ MySQL terinstall" -ForegroundColor Green
} catch {
    Write-Host "⚠️ MySQL tidak ditemukan. Pastikan service MySQL berjalan dan bisa diakses." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "📦 INSTALASI APLIKASI (FRONTEND)" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Frontend installation
Set-Location frontend

Write-Host "Installing application dependencies..." -ForegroundColor Yellow
npm install

if (-not (Test-Path ".env.local")) {
    Write-Host "Creating .env.local file..." -ForegroundColor Yellow
    @"
# Ganti dengan URL koneksi database MySQL Anda
DATABASE_URL="mysql://root:@127.0.0.1:3306/sistem_sekolah"
"@ | Out-File -FilePath ".env.local" -Encoding utf8
    Write-Host "✅ File .env.local created!" -ForegroundColor Green
    Write-Host "⚠️ PENTING: Edit file 'frontend/.env.local' dan sesuaikan DATABASE_URL jika perlu." -ForegroundColor Yellow
    
    $continue = Read-Host "Sudah memeriksa .env.local? (y/n)"
    if ($continue -ne "y") {
        Write-Host "Installation paused. Edit 'frontend/.env.local' lalu jalankan script lagi." -ForegroundColor Yellow
        exit 0
    }
}

Write-Host "Pushing database schema..." -ForegroundColor Yellow
npx prisma db push

Write-Host "Generating Prisma Client..." -ForegroundColor Yellow
npx prisma generate

Write-Host "Seeding database with sample data..." -ForegroundColor Yellow
npx prisma db seed

Write-Host "✅ Application setup completed!" -ForegroundColor Green

Set-Location ..

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "🎉 INSTALASI SELESAI!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📋 LANGKAH SELANJUTNYA:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Buka terminal baru, jalankan APLIKASI:" -ForegroundColor White
Write-Host "   cd frontend" -ForegroundColor Cyan
Write-Host "   npm run dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Buka browser: http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "🔐 AKUN DEFAULT:" -ForegroundColor Yellow
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Admin   : admin / password123" -ForegroundColor Green
Write-Host "Guru    : guru1 / password123" -ForegroundColor Green
Write-Host "Siswa   : siswa1 / password123" -ForegroundColor Green
Write-Host ""
Write-Host "Selamat menggunakan! 🚀" -ForegroundColor Green
