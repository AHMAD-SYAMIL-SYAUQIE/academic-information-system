# ========================================
# 🚀 START DUAL SERVER - DEVELOPMENT MODE
# Sistem Absensi dan Nilai Akademik v2.0
# ========================================

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     🚀 STARTING DEVELOPMENT SERVERS...                    ║" -ForegroundColor Green
Write-Host "║     Sistem Absensi dan Nilai Akademik v2.0.0              ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Cek apakah folder frontend ada
if (-Not (Test-Path "D:\SISTEM ABSEN DAN NILAI\frontend")) {
    Write-Host "❌ ERROR: Folder 'frontend' tidak ditemukan!" -ForegroundColor Red
    Write-Host "   Pastikan Anda menjalankan script dari folder root project." -ForegroundColor Yellow
    pause
    exit 1
}

# Cek apakah node_modules sudah terinstall
Set-Location "D:\SISTEM ABSEN DAN NILAI\frontend"
if (-Not (Test-Path "node_modules")) {
    Write-Host "⚠️  WARNING: Dependencies belum terinstall!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Menjalankan npm install..." -ForegroundColor Cyan
    npm install
    Write-Host ""
}

Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Gray
Write-Host "  📋 DUAL SERVER ARCHITECTURE" -ForegroundColor Yellow
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Gray
Write-Host ""
Write-Host "  Server 1: 🌐 Frontend (Next.js)      → Port 3000" -ForegroundColor Cyan
Write-Host "  Server 2: 📄 PDF Generator            → Port 4000" -ForegroundColor Cyan
Write-Host ""
Write-Host "  ⚠️  PENTING: Kedua server HARUS berjalan bersamaan!" -ForegroundColor Red
Write-Host "  💡 Tip: Jangan tutup window yang akan terbuka!" -ForegroundColor Yellow
Write-Host ""
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Gray
Write-Host ""

Start-Sleep -Seconds 2

# Kill existing node processes (cleanup)
Write-Host "🧹 Membersihkan processes lama..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1

# Start Terminal 1 - Frontend Server
Write-Host "🎨 Membuka Terminal 1: Frontend Server (Port 3000)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'D:\SISTEM ABSEN DAN NILAI\frontend'; Write-Host '🌐 FRONTEND SERVER' -ForegroundColor Green; Write-Host '══════════════════════════════════════' -ForegroundColor Cyan; Write-Host ''; npm run dev"

Start-Sleep -Seconds 3

# Start Terminal 2 - PDF Server
Write-Host "📄 Membuka Terminal 2: PDF Server (Port 4000)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'D:\SISTEM ABSEN DAN NILAI\frontend'; Write-Host '📄 PDF GENERATION SERVER' -ForegroundColor Green; Write-Host '══════════════════════════════════════' -ForegroundColor Cyan; Write-Host ''; npm run pdf-server"

Write-Host ""
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Gray
Write-Host ""
Write-Host "✅ Kedua server sedang starting..." -ForegroundColor Green
Write-Host ""
Write-Host "Tunggu beberapa detik, lalu akses:" -ForegroundColor White
Write-Host ""
Write-Host "  🌐 Frontend:   http://localhost:3000" -ForegroundColor Cyan
Write-Host "  📄 PDF Server: http://localhost:4000/health" -ForegroundColor Cyan
Write-Host ""
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Gray
Write-Host ""
Write-Host "💡 Tips:" -ForegroundColor Yellow
Write-Host "  • Jangan tutup kedua terminal yang terbuka" -ForegroundColor White
Write-Host "  • Tekan Ctrl+C di masing-masing terminal untuk stop server" -ForegroundColor White
Write-Host "  • Jika ada error, cek terminal untuk detail" -ForegroundColor White
Write-Host ""
Write-Host "🐛 Troubleshooting:" -ForegroundColor Yellow
Write-Host "  • Port sudah dipakai: Get-Process -Name node | Stop-Process -Force" -ForegroundColor White
Write-Host "  • Lihat CARA_JALANKAN.ps1 untuk panduan lengkap" -ForegroundColor White
Write-Host ""
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Gray
Write-Host ""
Write-Host "Script selesai. Server berjalan di background terminals." -ForegroundColor Green
Write-Host "Tekan Enter untuk menutup window ini..." -ForegroundColor Cyan
Write-Host ""
pause
