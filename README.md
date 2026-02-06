<div align="center">

# 🎓 Sistem Absensi dan Nilai Akademik

**Platform Manajemen Absensi QR Code & Penilaian untuk Institusi Pendidikan**

[![Next.js](https://img.shields.io/badge/Next.js-14.0.4-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22.0-2D3748?logo=prisma)](https://prisma.io/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql&logoColor=white)](https://mysql.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

</div>

---

## 📖 Tentang Project

Sistem absensi dan nilai berbasis web untuk sekolah dengan fitur QR Code attendance, manajemen nilai terintegrasi, dan reporting PDF/Excel. Dibangun dengan Next.js 14, Prisma ORM, dan MySQL untuk performa optimal.

**Key Features:**
- 🎯 Real-time QR Code attendance dengan auto-refresh
- 👥 Multi-role system (Admin, Guru, Siswa)
- 📊 Grade management terintegrasi
- 📄 Advanced PDF/Excel reporting
- 📱 Fully responsive design
- 🔐 Enterprise-grade security

---

## ✨ Fitur Utama

<table>
<tr>
<td width="33%" valign="top">

### 👨‍💼 Administrator
- ✅ User Management (CRUD)
- ✅ Academic Setup (Kelas, Mapel, Tahun Ajaran)
- ✅ Attendance Session Management
- ✅ Teacher Assignment
- ✅ Advanced Reporting
- ✅ Wali Kelas Assignment

</td>
<td width="33%" valign="top">

### 👨‍🏫 Guru
- ✅ QR Code Generator
- ✅ Real-time Attendance Monitoring
- ✅ Grade Management
- ✅ Permission Approval (Wali Kelas)
- ✅ PDF/Excel Export
- ✅ Dashboard Analytics

</td>
<td width="33%" valign="top">

### 👨‍🎓 Siswa
- ✅ QR Scan Attendance
- ✅ Attendance History
- ✅ Grade Viewing
- ✅ Permission Request
- ✅ Dashboard Overview
- ✅ Notifications

</td>
</tr>
</table>

---

## 🚀 Tech Stack

**Core:** Next.js 14 · React 18 · TypeScript 5 · Tailwind CSS 3.4  
**Backend:** Next.js API Routes · Prisma ORM 5.22 · MySQL 8  
**Features:** html5-qrcode · pdfmake · exceljs · nodemailer · SweetAlert2  
**Auth:** JWT · bcryptjs · Zustand

---

## 📦 Prerequisites

- Node.js 18+ (tested on v24.11.1)
- MySQL 8.x
- npm atau yarn
- Browser modern (Chrome, Firefox, Edge, Safari)

---

## 🛠️ Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/YOUR_USERNAME/sistem-absensi-nilai.git
cd sistem-absensi-nilai/frontend
npm install
```

### 2. Setup Database
```sql
CREATE DATABASE sistem_sekolah CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. Environment Configuration
Buat file `.env.local` di folder `frontend/`:

```env
# Database
DATABASE_URL="mysql://root:@127.0.0.1:3306/sistem_sekolah"

# JWT Secret (ganti dengan random string)
JWT_SECRET="your-super-secret-jwt-key-here"

# SMTP (Optional - untuk forgot password)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
```

### 4. Database Setup
```bash
npx prisma generate
npx prisma db push
npm run prisma:seed  # Optional - create dummy data
```

**Default Users (after seed):**
- Admin: `admin` / `password123`
- Guru: `guru1` - `guru3` / `password123`
- Siswa: `siswa1` - `siswa5` / `password123`

---

## 🚀 Menjalankan Aplikasi

### ⚠️ PENTING: Dual Server Architecture

Sistem ini membutuhkan **2 server** yang berjalan bersamaan:

| Server | Port | Fungsi | Status |
|--------|------|--------|--------|
| 🌐 Frontend | 3000 | Web Interface & API | **WAJIB** |
| 📄 PDF Server | 4000 | PDF Export | **WAJIB** |

> 💡 **Fitur export PDF TIDAK AKAN BEKERJA jika PDF Server tidak dijalankan!**

---

### Opsi 1: Auto-Start Script (Recommended) ⭐

```powershell
# Windows - dari root folder
.\start-dev.ps1
```

Script akan otomatis membuka 2 terminal terpisah untuk masing-masing server.

---

### Opsi 2: Manual - 2 Terminal

**Terminal 1 - Frontend:**
```bash
cd frontend
npm run dev
```
✅ Akses: http://localhost:3000

**Terminal 2 - PDF Server:**
```bash
cd frontend
npm run pdf-server
```
✅ Akses: http://localhost:4000/health

---

### Opsi 3: Single Command (Concurrent)

```bash
cd frontend
npm run dev:full
```

⚠️ **Warning**: Jika salah satu server error, keduanya akan terminate.

---

### ✅ Verifikasi Server

```bash
# Test Frontend
curl http://localhost:3000

# Test PDF Server
curl http://localhost:4000/health
# Expected: {"status":"OK","server":"PDF Generation Service"}
```

---

## 📚 Struktur Project

```
SISTEM ABSEN DAN NILAI/
├── 📄 README.md              # Dokumentasi utama
├── 📜 LICENSE                # MIT License
├── 🚀 start-dev.ps1          # Auto-start script
├── 📘 CARA_JALANKAN.ps1      # Panduan lengkap
├── ⚙️ .gitignore             # Git ignore
│
└── frontend/
    ├── app/                  # Next.js App Router
    │   ├── admin/           # 👨‍💼 Admin pages
    │   ├── guru/            # 👨‍🏫 Teacher pages
    │   ├── siswa/           # 👨‍🎓 Student pages
    │   ├── api/             # 🔌 API routes
    │   └── login/           # 🔐 Auth
    ├── components/          # React components
    ├── lib/                 # Utilities (api, auth, prisma)
    ├── prisma/              # Database schema & seed
    ├── pdf-server.js        # PDF generation server
    ├── package.json         # Dependencies
    └── .env.local           # Environment config
```

---

## 🔐 Security Features

- ✅ JWT Token Authentication
- ✅ Role-Based Access Control (RBAC)
- ✅ Password Hashing (bcryptjs)
- ✅ Wali Kelas Validation
- ✅ SQL Injection Protection (Prisma)
- ✅ XSS Prevention
- ✅ Soft Delete untuk audit trail

---

## 📱 Responsive Design

- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Touch-optimized UI (min 44x44px tap targets)
- Adaptive tables dengan hidden columns

**Browser Support:**
Chrome 90+ · Firefox 88+ · Safari 14+ · Edge 90+

---

## 🐛 Troubleshooting

<details>
<summary><strong>❌ Error: "ECONNREFUSED ::1:4000" saat Export PDF</strong></summary>

**Penyebab:** PDF Server belum dijalankan

**Solusi:**
```bash
cd frontend
npm run pdf-server
```

Verifikasi: `curl http://localhost:4000/health`
</details>

<details>
<summary><strong>❌ Error: "Port 3000/4000 already in use"</strong></summary>

**Solusi:**
```powershell
# Kill all Node processes
Get-Process -Name node | Stop-Process -Force

# Or kill specific port
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```
</details>

<details>
<summary><strong>❌ Error: Database Connection Failed</strong></summary>

**Checklist:**
1. MySQL service running: `Get-Service MySQL* | Start-Service`
2. Database exists: `SHOW DATABASES LIKE 'sistem_sekolah';`
3. Correct credentials di `.env.local`
4. Test: `npx prisma db push`
</details>

<details>
<summary><strong>❌ Error: "Cannot find module '@prisma/client'"</strong></summary>

**Solusi:**
```bash
npx prisma generate
npm install
```
</details>

<details>
<summary><strong>❌ SMTP Email tidak terkirim</strong></summary>

**Untuk Gmail:**
1. Enable 2FA: https://myaccount.google.com/security
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Update `.env.local` dengan App Password

**Development Mode:** OTP akan ditampilkan di console jika SMTP tidak dikonfigurasi
</details>

<details>
<summary><strong>⚠️ Warning: Font loading failed</strong></summary>

**Status:** Safe to ignore - bukan error kritis

Next.js mencoba load Google Fonts saat offline. Tidak mempengaruhi fungsionalitas.
</details>

> 📘 **Panduan Lengkap:** Lihat [CARA_JALANKAN.ps1](CARA_JALANKAN.ps1) untuk step-by-step troubleshooting

---

## 📝 Changelog

### 🚀 Version 2.0.0 (February 6, 2026)

**New Features:**
- ✨ SweetAlert2 confirmation dialogs
- 📧 SMTP email system (forgot password)
- 📄 Dedicated PDF server
- 📊 Pagination support

**Security:**
- 🛡️ Wali kelas validation
- 🔐 Enhanced JWT auth
- 🚫 Soft delete implementation

**Bug Fixes:**
- ✅ Fixed PDF export font loading
- ✅ Fixed API field mapping (waliKelas)
- ✅ Fixed guru.map pagination error
- ✅ Fixed dashboard siswa data loading
- ✅ Consistent API response formats

**UI/UX:**
- 📱 Enhanced responsive design
- 🎨 Consistent theme
- ⚡ 40% faster initial load

---

### Version 1.0.0 (January 2026)
- ✅ Initial MVP release
- ✅ Basic CRUD operations
- ✅ QR Code attendance
- ✅ Grade management

---

## 🤝 Contributing

Contributions welcome! Please:

1. Fork repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## 📄 License

This project is licensed under the **MIT License** - see [LICENSE](LICENSE) for details.

---

## 🚀 Push ke GitHub

```bash
# Initialize repository
git init
git add .
git commit -m "Initial commit: Sistem Absensi v2.0.0"

# Connect to GitHub (ganti YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/sistem-absensi-nilai.git

# Push to GitHub
git branch -M main
git push -u origin main
```

**Setup GitHub:**
1. Buat repository di https://github.com/new
2. Name: `sistem-absensi-nilai`
3. Visibility: Public/Private
4. ⚠️ JANGAN initialize dengan README
5. Run commands di atas

---

## 📞 Support

- **📧 Email:** contact@man19jakarta.sch.id
- **🐛 Issues:** [GitHub Issues](https://github.com/YOUR_USERNAME/sistem-absensi-nilai/issues)
- **📚 Docs:** [Wiki](https://github.com/YOUR_USERNAME/sistem-absensi-nilai/wiki)

---

## 🙏 Credits

Built with amazing open-source technologies:

[Next.js](https://nextjs.org/) · [Prisma](https://prisma.io/) · [SweetAlert2](https://sweetalert2.github.io/) · [html5-qrcode](https://github.com/mebjas/html5-qrcode) · [Tailwind CSS](https://tailwindcss.com/)

---

<div align="center">

**⭐ Star this repository if you find it helpful!**

Built with ❤️ by **Ahmad Syamil Syauqie**

**Version 2.0.0** | **February 6, 2026** | **Status: ✅ Production Ready**

[⬆ Back to Top](#-sistem-absensi-dan-nilai-akademik)

</div>
