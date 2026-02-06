// pdf-server.js
// Server mandiri untuk menangani pembuatan PDF yang intensif
// Jalankan server ini secara terpisah: node frontend/pdf-server.js
require('dotenv').config({ path: '.env.local' });

const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const path = require('path');

// Setup pdfMake dengan vfs fonts sekali saja di awal
const pdfMake = require('pdfmake/build/pdfmake');
const vfsFonts = require('pdfmake/build/vfs_fonts');
// vfsFonts LANGSUNG adalah vfs object, tidak ada .pdfMake.vfs
pdfMake.vfs = vfsFonts;

const prisma = new PrismaClient();
const app = express();
const port = 4000; // Port terpisah untuk server PDF

app.use(cors()); // Izinkan request dari Next.js (yang berjalan di port berbeda)
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'PDF Server is running', timestamp: new Date().toISOString() });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: '📄 PDF Server for Sistem Absensi & Akademik',
    status: 'running',
    endpoints: [
      'GET /health - Health check',
      'GET /test - Test endpoint',
      'GET /api/laporan/export/absensi/pdf/:kelasUuid - Export absensi PDF',
      'GET /api/laporan/export/nilai/pdf/:kelasUuid - Export nilai PDF'
    ]
  });
});

// Test endpoint - untuk cek database connection
app.get('/test', async (req, res) => {
  try {
    const kelasList = await prisma.kelas.findMany({ take: 5 });
    const siswaCount = await prisma.siswa.count();
    const guruCount = await prisma.guru.count();
    
    res.json({
      status: 'OK',
      message: 'Database connected',
      data: {
        totalKelas: kelasList.length,
        totalSiswa: siswaCount,
        totalGuru: guruCount,
        kelasList: kelasList.map(k => ({ uuid: k.uuid, nama: k.namaKelas }))
      }
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR', 
      message: 'Database connection failed',
      error: error.message 
    });
  }
});

// --- LOGIKA BERSAMA (dipindahkan dari file route) ---

// Helper function untuk rekap absensi SINGLE MAPEL (GURU)
async function getRekapAbsensiSingleMapel(kelasUuid, mapelUuid, bulan, tahun) {
  const siswaList = await prisma.siswa.findMany({
    where: { kelasUuid },
    include: { user: true },
    orderBy: { namaLengkap: 'asc' },
  });
  const startDate = new Date(tahun, bulan - 1, 1);
  const endDate = new Date(tahun, bulan, 0);

  return Promise.all(
    siswaList.map(async (siswa) => {
      const absensiList = await prisma.absensi.findMany({
        where: {
          siswaUuid: siswa.uuid,
          sesiAbsensi: {
            tanggal: { gte: startDate, lte: endDate },
            mapelUuid: mapelUuid
          },
        },
        select: { status: true },
      });
      const counts = { hadir: 0, izin: 0, sakit: 0, alpha: 0 };
      absensiList.forEach((a) => {
        counts[a.status.toLowerCase()]++;
      });
      const total = Object.values(counts).reduce((s, c) => s + c, 0);
      const persentase = total > 0 ? Math.round((counts.hadir / total) * 100) : 0;
      return { siswa, data: { ...counts, persentase } };
    })
  );
}

// Helper function untuk rekap absensi ALL MAPEL (ADMIN)
async function getRekapAbsensiAllMapel(kelasUuid, bulan, tahun) {
  const startDate = new Date(tahun, bulan - 1, 1);
  const endDate = new Date(tahun, bulan, 0);

  // Ambil semua mapel yang ada sesi absensi di kelas ini
  const sesiRecords = await prisma.sesiAbsensi.findMany({
    where: {
      kelasUuid,
      tanggal: { gte: startDate, lte: endDate },
      mapelUuid: { not: null }
    },
    include: {
      mapel: {
        include: {
          teachingAssignments: {
            where: { kelasUuid },
            include: { guru: true }
          }
        }
      }
    },
  });

  const mapelMap = new Map();
  sesiRecords.forEach(s => {
    if (s.mapelUuid && !mapelMap.has(s.mapelUuid)) {
      const guruData = s.mapel?.teachingAssignments[0]?.guru || null;
      mapelMap.set(s.mapelUuid, {
        uuid: s.mapel.uuid,
        namaMapel: s.mapel.namaMapel,
        kodeMapel: s.mapel.kodeMapel,
        guru: guruData
      });
    }
  });

  const mapelList = Array.from(mapelMap.values());

  // Untuk setiap mapel, ambil rekap absensi siswa
  const result = await Promise.all(
    mapelList.map(async (mapel) => {
      const siswaData = await getRekapAbsensiSingleMapel(kelasUuid, mapel.uuid, bulan, tahun);
      return { 
        mapelInfo: {
          namaMapel: mapel.namaMapel,
          namaGuru: mapel.guru?.namaLengkap || null
        },
        data: siswaData
      };
    })
  );

  return result;
}

// Helper function untuk rekap absensi (Legacy - untuk backward compatibility)
async function getRekapAbsensi(kelasUuid, bulan, tahun) {
  const siswaList = await prisma.siswa.findMany({
    where: { kelasUuid },
    include: { user: true },
    orderBy: { namaLengkap: 'asc' },
  });
  const startDate = new Date(tahun, bulan - 1, 1);
  const endDate = new Date(tahun, bulan, 0);

  return Promise.all(
    siswaList.map(async (siswa) => {
      const absensiList = await prisma.absensi.findMany({
        where: {
          siswaUuid: siswa.uuid,
          sesiAbsensi: {
            tanggal: { gte: startDate, lte: endDate },
          },
        },
        select: { status: true },
      });
      const counts = { hadir: 0, izin: 0, sakit: 0, alpha: 0 };
      absensiList.forEach((a) => {
        counts[a.status.toLowerCase()]++;
      });
      const total = Object.values(counts).reduce((s, c) => s + c, 0);
      const persentase = total > 0 ? Math.round((counts.hadir / total) * 100) : 0;
      return { siswa, data: { ...counts, persentase } };
    })
  );
}

// Helper function untuk rekap nilai SINGLE MAPEL (GURU)
async function getRekapNilaiSingleMapel(kelasUuid, mapelUuid) {
    const siswaList = await prisma.siswa.findMany({
        where: { kelasUuid },
        include: { user: true },
        orderBy: { namaLengkap: 'asc' },
      });
    
      return Promise.all(
        siswaList.map(async (siswa) => {
          const whereClause = { siswaUuid: siswa.uuid, mapelUuid };
    
          const nilaiList = await prisma.nilai.findMany({ where: whereClause });
          const nilaiByJenis = { TUGAS: [], UH: [], UTS: [], UAS: [] };
          nilaiList.forEach((n) => {
            if (nilaiByJenis[n.jenisNilai]) nilaiByJenis[n.jenisNilai].push(n.nilai);
          });
    
          const avg = (arr) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : null;
          const avgTugas = avg(nilaiByJenis.TUGAS);
          const avgUH = avg(nilaiByJenis.UH);
          const avgUTS = avg(nilaiByJenis.UTS);
          const avgUAS = avg(nilaiByJenis.UAS);
    
          let nilaiAkhir = null;
          if (avgTugas !== null && avgUH !== null && avgUTS !== null && avgUAS !== null) {
            nilaiAkhir = (avgTugas * 0.2) + (avgUH * 0.2) + (avgUTS * 0.3) + (avgUAS * 0.3);
          }
    
          const getGrade = (n) => n === null ? '-' : n >= 85 ? 'A' : n >= 75 ? 'B' : n >= 65 ? 'C' : n >= 55 ? 'D' : 'E';
    
          return {
            siswa,
            data: {
              nilaiTugas: avgTugas,
              nilaiUH: avgUH,
              nilaiUTS: avgUTS,
              nilaiUAS: avgUAS,
              nilaiAkhir: nilaiAkhir,
              grade: getGrade(nilaiAkhir),
            },
          };
        })
      );
}

// Helper function untuk rekap nilai ALL MAPEL (ADMIN)
async function getRekapNilaiAllMapel(kelasUuid) {
  // Ambil semua mapel yang ada nilai di kelas ini
  const nilaiRecords = await prisma.nilai.findMany({
    where: { siswa: { kelasUuid } },
    include: { 
      mapel: {
        include: {
          teachingAssignments: {
            where: { kelasUuid },
            include: { guru: true }
          }
        }
      }
    },
  });

  const mapelMap = new Map();
  nilaiRecords.forEach(n => {
    if (!mapelMap.has(n.mapelUuid)) {
      // Ambil guru pertama dari teaching assignments
      const guruData = n.mapel.teachingAssignments[0]?.guru || null;
      
      mapelMap.set(n.mapelUuid, {
        uuid: n.mapel.uuid,
        namaMapel: n.mapel.namaMapel,
        kodeMapel: n.mapel.kodeMapel,
        guru: guruData
      });
    }
  });

  const mapelList = Array.from(mapelMap.values());
  
  // Untuk setiap mapel, ambil rekap nilai siswa
  const result = await Promise.all(
    mapelList.map(async (mapel) => {
      const data = await getRekapNilaiSingleMapel(kelasUuid, mapel.uuid);
      return { mapel, data };
    })
  );

  return result;
}

// --- ENDPOINT SERVER PDF ---

// Endpoint untuk PDF Absensi
app.get('/api/laporan/export/absensi/pdf/:kelasUuid', async (req, res) => {
  try {
    const { kelasUuid } = req.params;
    const { bulan, tahun, mapelUuid, role } = req.query;

    console.log('📄 Request PDF Absensi:', { kelasUuid, bulan, tahun, mapelUuid, role });

    if (!kelasUuid || !bulan || !tahun) {
      console.log('❌ Parameter tidak lengkap');
      return res.status(400).json({ message: 'Parameter tidak lengkap' });
    }

    // Tentukan mode berdasarkan role
    const isGuruMode = role === 'GURU' && mapelUuid;
    const isAdminMode = role === 'ADMIN';
    
    console.log('🔍 Role Detection:', { role, isGuruMode, isAdminMode });
    console.log(isGuruMode ? '🎯 Mode: GURU - Single Mapel' : isAdminMode ? '🎯 Mode: ADMIN - Multi Mapel' : '🎯 Mode: Legacy');

    console.log('⏳ Fetching data...');
    let dataPerMapel = [];
    
    if (isGuruMode) {
      // GURU: Single mapel saja
      const siswaData = await getRekapAbsensiSingleMapel(kelasUuid, mapelUuid, parseInt(bulan), parseInt(tahun));
      
      // Get mapel info
      const mapel = await prisma.mapel.findUnique({
        where: { uuid: mapelUuid },
        include: {
          teachingAssignments: {
            where: { kelasUuid },
            include: { guru: true }
          }
        }
      });
      
      dataPerMapel = [{
        mapelInfo: {
          namaMapel: mapel?.namaMapel || 'Unknown',
          namaGuru: mapel?.teachingAssignments[0]?.guru?.namaLengkap || null
        },
        data: siswaData
      }];
      console.log('✅ Data fetched for single mapel:', dataPerMapel[0].mapelInfo.namaMapel);
    } else if (isAdminMode) {
      // ADMIN: All mapel with grouping
      dataPerMapel = await getRekapAbsensiAllMapel(kelasUuid, parseInt(bulan), parseInt(tahun));
      console.log('✅ Found', dataPerMapel.length, 'mapel with absensi');
      
      // Log detail setiap mapel
      dataPerMapel.forEach((item, idx) => {
        console.log(`   ${idx + 1}. ${item.mapelInfo.namaMapel} - Guru: ${item.mapelInfo.namaGuru} - Siswa: ${item.data.length}`);
      });
      
      // Jika tidak ada mapel, kembalikan error
      if (dataPerMapel.length === 0) {
        console.log('⚠️ Tidak ada mata pelajaran dengan data absensi di periode ini');
        return res.status(404).json({ message: 'Tidak ada data absensi untuk periode yang dipilih' });
      }
    } else {
      // Legacy mode (backward compatibility)
      const data = await getRekapAbsensi(kelasUuid, parseInt(bulan), parseInt(tahun));
      console.log('✅ Data fetched:', data.length, 'siswa');
      dataPerMapel = [{ mapelInfo: { namaMapel: 'Semua Mata Pelajaran', namaGuru: null }, data }];
    }
    
    const kelas = await prisma.kelas.findUnique({ 
      where: { uuid: kelasUuid },
      include: {
        tahunAjaran: true,
        waliGuru: true
      }
    });
    console.log('✅ Kelas:', kelas?.namaKelas);

    // Nama bulan Indonesia
    const namaBulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const bulanNama = namaBulan[parseInt(bulan) - 1];

    // Tanggal sekarang untuk tanda tangan
    const today = new Date();
    const tanggalCetak = `${today.getDate()} ${namaBulan[today.getMonth()]} ${today.getFullYear()}`;

    // Build content sections untuk setiap mapel
    const contentSections = [];
      
      dataPerMapel.forEach((mapelData, mapelIndex) => {
        console.log(`📚 Processing: ${mapelData.mapelInfo.namaMapel} (${mapelData.data.length} siswa)`);
        
        const mapelSection = [
          // Judul untuk mapel ini
          { text: 'LAPORAN ABSENSI SISWA', style: 'title', margin: [0, 10, 0, 5] },
          { text: `Periode: ${bulanNama} ${tahun}`, style: 'subtitle', margin: [0, 0, 0, 20] },
          
          // Info mapel dan guru (SELALU tampil untuk GURU dan ADMIN mode)
          ...(isGuruMode || isAdminMode ? [
            { text: `MATA PELAJARAN: ${mapelData.mapelInfo.namaMapel}`, style: 'mapelTitle', margin: [0, 0, 0, 5] },
            ...(mapelData.mapelInfo.namaGuru ? [
              { text: `Guru: ${mapelData.mapelInfo.namaGuru}`, style: 'guruName', margin: [0, 0, 0, 15] }
            ] : [])
          ] : []),
          
          // Informasi Umum
          {
            style: 'infoBox',
            table: {
              widths: [100, 5, '*', 100, 5, '*'],
              body: [
                [
                  { text: 'Kelas', bold: true }, 
                  { text: ':' }, 
                  { text: kelas?.namaKelas || '-' },
                  { text: 'Tahun Ajaran', bold: true }, 
                  { text: ':' }, 
                  { text: kelas?.tahunAjaran?.tahun || '-' }
                ],
                [
                  { text: 'Wali Kelas', bold: true }, 
                  { text: ':' }, 
                  { text: kelas?.waliGuru?.namaLengkap || kelas?.waliKelas || '-' },
                  { text: 'Semester', bold: true }, 
                  { text: ':' }, 
                  { text: kelas?.tahunAjaran?.semester || '-' }
                ]
              ]
            },
            layout: 'noBorders',
            margin: [0, 0, 0, 15]
          },

          // Tabel Data Absensi untuk mapel ini
          {
            style: 'tableData',
            table: {
              headerRows: 1,
              widths: [25, 50, '*', 40, 40, 40, 40, 55],
              body: [
                [
                  { text: 'No', style: 'tableHeader', alignment: 'center' },
                  { text: 'NIS', style: 'tableHeader', alignment: 'center' },
                  { text: 'Nama Siswa', style: 'tableHeader' },
                  { text: 'Hadir', style: 'tableHeader', alignment: 'center' },
                  { text: 'Izin', style: 'tableHeader', alignment: 'center' },
                  { text: 'Sakit', style: 'tableHeader', alignment: 'center' },
                  { text: 'Alpha', style: 'tableHeader', alignment: 'center' },
                  { text: 'Persentase', style: 'tableHeader', alignment: 'center' }
                ],
                ...mapelData.data.map((row, index) => [
                  { text: index + 1, alignment: 'center' },
                  { text: row.siswa.nis, alignment: 'center' },
                  { text: row.siswa.namaLengkap },
                  { text: row.data.hadir, alignment: 'center' },
                  { text: row.data.izin, alignment: 'center' },
                  { text: row.data.sakit, alignment: 'center' },
                  { text: row.data.alpha, alignment: 'center' },
                  { text: `${row.data.persentase}%`, alignment: 'center', bold: true }
                ])
              ]
            },
            layout: {
              hLineWidth: function (i, node) { return (i === 0 || i === 1 || i === node.table.body.length) ? 1 : 0.5; },
              vLineWidth: function (i, node) { return 0.5; },
              hLineColor: function (i) { return '#333333'; },
              vLineColor: function (i) { return '#333333'; }
            }
          }
        ];
        
        contentSections.push(...mapelSection);
        
        // Add page break kecuali mapel terakhir
        if (mapelIndex < dataPerMapel.length - 1) {
          contentSections.push({ text: '', pageBreak: 'after' });
        }
      });

    console.log('📝 Creating PDF document...');
    const docDefinition = {
      pageSize: 'A4',
      pageOrientation: 'landscape',
      pageMargins: [40, 120, 40, 80],
      
      header: function(currentPage, pageCount) {
        return {
          margin: [40, 20, 40, 15],
          stack: [
            // Kop Surat
            {
              columns: [
                {
                  width: 60,
                  stack: [
                    { text: '🏫', fontSize: 45, alignment: 'center', margin: [0, 0, 0, 0] }
                  ]
                },
                {
                  width: '*',
                  stack: [
                    { text: 'PEMERINTAH PROVINSI DKI JAKARTA', fontSize: 9, bold: true, alignment: 'center', margin: [0, 4, 0, 0] },
                    { text: 'DINAS PENDIDIKAN', fontSize: 9, bold: true, alignment: 'center', margin: [0, 1, 0, 1] },
                    { text: 'MAN 19 JAKARTA', fontSize: 15, bold: true, alignment: 'center', margin: [0, 1, 0, 2] },
                    { 
                      text: 'Jl. Raya Pondok Gede No. 10, Jakarta Timur 13760', 
                      fontSize: 8, 
                      alignment: 'center',
                      margin: [0, 1, 0, 0]
                    },
                    { 
                      text: 'Telp: (021) 12345678  |  Email: info@man19jkt.sch.id  |  Website: www.man19jkt.sch.id', 
                      fontSize: 8, 
                      alignment: 'center',
                      margin: [0, 1, 0, 0]
                    }
                  ]
                },
                {
                  width: 60,
                  text: ''
                }
              ]
            },
            // Garis Tebal Pemisah
            {
              margin: [0, 8, 0, 0],
              table: {
                widths: ['*'],
                heights: [3],
                body: [['']]
              },
              layout: {
                hLineWidth: function(i, node) { 
                  return (i === 0) ? 0 : 3;
                },
                vLineWidth: function() { return 0; },
                hLineColor: function() { return '#000000'; },
                paddingLeft: function() { return 0; },
                paddingRight: function() { return 0; },
                paddingTop: function() { return 0; },
                paddingBottom: function() { return 0; }
              }
            },
            // Garis Tipis kedua
            {
              margin: [0, 1, 0, 0],
              table: {
                widths: ['*'],
                heights: [1],
                body: [['']]
              },
              layout: {
                hLineWidth: function(i, node) { 
                  return (i === 0) ? 0 : 1;
                },
                vLineWidth: function() { return 0; },
                hLineColor: function() { return '#000000'; },
                paddingLeft: function() { return 0; },
                paddingRight: function() { return 0; },
                paddingTop: function() { return 0; },
                paddingBottom: function() { return 0; }
              }
            }
          ]
        };
      },

      content: contentSections,

      footer: function(currentPage, pageCount) {
        // Untuk GURU mode, tampilkan signature guru yang mengajar
        const signerName = isGuruMode && dataPerMapel[0]?.mapelInfo?.namaGuru 
          ? dataPerMapel[0].mapelInfo.namaGuru 
          : kelas?.waliGuru?.namaLengkap || kelas?.waliKelas || '(.......................)';
        
        const signerTitle = isGuruMode ? 'Guru Mata Pelajaran' : 'Wali Kelas';
        
        return {
          margin: [40, 20, 40, 0],
          columns: [
            { width: '*', text: '' },
            {
              width: 200,
              stack: [
                { text: `Jakarta, ${tanggalCetak}`, alignment: 'center', margin: [0, 0, 0, 5] },
                { text: signerTitle, alignment: 'center', bold: true, margin: [0, 0, 0, 50] },
                { text: signerName, alignment: 'center', bold: true, decoration: 'underline' },
                { text: kelas?.waliGuru?.nip ? `NIP. ${kelas.waliGuru.nip}` : '', alignment: 'center', fontSize: 9, margin: [0, 2, 0, 0] }
              ]
            }
          ]
        };
      },

      styles: {
        title: {
          fontSize: 14,
          bold: true,
          alignment: 'center'
        },
        subtitle: {
          fontSize: 11,
          alignment: 'center',
          italics: true
        },
        mapelTitle: {
          fontSize: 12,
          bold: true,
          alignment: 'center',
          color: '#2c5aa0'
        },
        guruName: {
          fontSize: 10,
          alignment: 'center',
          italics: true
        },
        infoBox: {
          fontSize: 10
        },
        tableHeader: {
          bold: true,
          fontSize: 10,
          fillColor: '#eeeeee'
        },
        tableData: {
          fontSize: 9
        }
      },
      
      defaultStyle: {
        font: 'Roboto'
      }
    };

    // Gunakan pdfMake yang sudah di-init di atas
    const pdfDocGenerator = pdfMake.createPdf(docDefinition);
    
    console.log('📝 Generating PDF...');
    pdfDocGenerator.getBuffer((buffer) => {
      // Dynamic filename based on role
      let filename;
      if (isGuruMode && dataPerMapel[0]) {
        const namaMapel = dataPerMapel[0].mapelInfo.namaMapel.replace(/\s+/g, '-');
        filename = `absensi-${namaMapel}-${kelas?.namaKelas}-${bulanNama}-${tahun}.pdf`;
      } else {
        filename = `rekap-absensi-${kelas?.namaKelas}-${bulanNama}-${tahun}.pdf`;
      }
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
      res.send(buffer);
      console.log('✅ PDF sent:', filename);
    });

  } catch (error) {
    console.error('❌ Error generating absensi PDF:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({ message: 'Gagal membuat PDF absensi', error: error.message });
  }
});

// Endpoint untuk PDF Nilai
app.get('/api/laporan/export/nilai/pdf/:kelasUuid', async (req, res) => {
    try {
        const { kelasUuid } = req.params;
        const { mapelUuid, role } = req.query;

        console.log('📄 Request PDF Nilai:', { kelasUuid, mapelUuid, role });

        const kelas = await prisma.kelas.findUnique({ 
          where: { uuid: kelasUuid },
          include: {
            tahunAjaran: true,
            waliGuru: true
          }
        });

        // Nama bulan Indonesia untuk tanggal cetak
        const namaBulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        const today = new Date();
        const tanggalCetak = `${today.getDate()} ${namaBulan[today.getMonth()]} ${today.getFullYear()}`;

        let docDefinition;

        // ========== GURU MODE: Single Mapel ==========
        if (role === 'GURU' && mapelUuid) {
          console.log('🎯 Mode: GURU - Single Mapel');
          const data = await getRekapNilaiSingleMapel(kelasUuid, mapelUuid);
          const mapel = await prisma.mapel.findUnique({ 
            where: { uuid: mapelUuid },
            include: { 
              teachingAssignments: {
                where: { kelasUuid },
                include: { guru: true }
              }
            }
          });

          const guruMapel = mapel?.teachingAssignments[0]?.guru || null;

          docDefinition = {
            pageSize: 'A4',
            pageOrientation: 'landscape',
            pageMargins: [40, 120, 40, 80],
            
            header: function(currentPage, pageCount) {
              return {
                margin: [40, 20, 40, 15],
                stack: [
                  {
                    columns: [
                      { width: 60, stack: [{ text: '🏫', fontSize: 45, alignment: 'center', margin: [0, 0, 0, 0] }] },
                      {
                        width: '*',
                        stack: [
                          { text: 'PEMERINTAH PROVINSI DKI JAKARTA', fontSize: 9, bold: true, alignment: 'center', margin: [0, 4, 0, 0] },
                          { text: 'DINAS PENDIDIKAN', fontSize: 9, bold: true, alignment: 'center', margin: [0, 1, 0, 1] },
                          { text: 'MAN 19 JAKARTA', fontSize: 15, bold: true, alignment: 'center', margin: [0, 1, 0, 2] },
                          { text: 'Jl. Raya Pondok Gede No. 10, Jakarta Timur 13760', fontSize: 8, alignment: 'center', margin: [0, 1, 0, 0] },
                          { text: 'Telp: (021) 12345678  |  Email: info@man19jkt.sch.id  |  Website: www.man19jkt.sch.id', fontSize: 8, alignment: 'center', margin: [0, 1, 0, 0] }
                        ]
                      },
                      { width: 60, text: '' }
                    ]
                  },
                  { margin: [0, 8, 0, 0], table: { widths: ['*'], heights: [3], body: [['']] }, layout: { hLineWidth: function(i) { return i === 0 ? 0 : 3; }, vLineWidth: () => 0, hLineColor: () => '#000000', paddingLeft: () => 0, paddingRight: () => 0, paddingTop: () => 0, paddingBottom: () => 0 } },
                  { margin: [0, 1, 0, 0], table: { widths: ['*'], heights: [1], body: [['']] }, layout: { hLineWidth: function(i) { return i === 0 ? 0 : 1; }, vLineWidth: () => 0, hLineColor: () => '#000000', paddingLeft: () => 0, paddingRight: () => 0, paddingTop: () => 0, paddingBottom: () => 0 } }
                ]
              };
            },

            content: [
              { text: 'DAFTAR NILAI SISWA', style: 'title', margin: [0, 10, 0, 5] },
              { text: `Mata Pelajaran: ${mapel?.namaMapel}`, style: 'subtitle', margin: [0, 0, 0, 20] },
              
              {
                style: 'infoBox',
                table: {
                  widths: [100, 5, '*', 100, 5, '*'],
                  body: [
                    [
                      { text: 'Kelas', bold: true }, { text: ':' }, { text: kelas?.namaKelas || '-' },
                      { text: 'Tahun Ajaran', bold: true }, { text: ':' }, { text: kelas?.tahunAjaran?.tahun || '-' }
                    ],
                    [
                      { text: 'Guru Mapel', bold: true }, { text: ':' }, { text: guruMapel?.namaLengkap || '-' },
                      { text: 'Semester', bold: true }, { text: ':' }, { text: kelas?.tahunAjaran?.semester || '-' }
                    ]
                  ]
                },
                layout: 'noBorders',
                margin: [0, 0, 0, 15]
              },

              {
                style: 'keterangan',
                table: {
                  widths: ['*'],
                  body: [[{ text: 'Keterangan: Nilai Akhir = (Tugas × 20%) + (UH × 20%) + (UTS × 30%) + (UAS × 30%)', fontSize: 8, italics: true, margin: [5, 3, 5, 3] }]]
                },
                layout: { fillColor: '#f0f0f0', hLineWidth: () => 0, vLineWidth: () => 0 },
                margin: [0, 0, 0, 10]
              },

              {
                style: 'tableData',
                table: {
                  headerRows: 1,
                  widths: [25, 50, '*', 45, 45, 45, 45, 55, 40],
                  body: [
                    [
                      { text: 'No', style: 'tableHeader', alignment: 'center' },
                      { text: 'NIS', style: 'tableHeader', alignment: 'center' },
                      { text: 'Nama Siswa', style: 'tableHeader' },
                      { text: 'Tugas', style: 'tableHeader', alignment: 'center' },
                      { text: 'UH', style: 'tableHeader', alignment: 'center' },
                      { text: 'UTS', style: 'tableHeader', alignment: 'center' },
                      { text: 'UAS', style: 'tableHeader', alignment: 'center' },
                      { text: 'Nilai Akhir', style: 'tableHeader', alignment: 'center' },
                      { text: 'Grade', style: 'tableHeader', alignment: 'center' }
                    ],
                    ...data.map((row, index) => [
                      { text: index + 1, alignment: 'center' },
                      { text: row.siswa.nis, alignment: 'center' },
                      { text: row.siswa.namaLengkap },
                      { text: row.data.nilaiTugas?.toFixed(1) ?? '-', alignment: 'center' },
                      { text: row.data.nilaiUH?.toFixed(1) ?? '-', alignment: 'center' },
                      { text: row.data.nilaiUTS?.toFixed(1) ?? '-', alignment: 'center' },
                      { text: row.data.nilaiUAS?.toFixed(1) ?? '-', alignment: 'center' },
                      { text: row.data.nilaiAkhir?.toFixed(1) ?? '-', alignment: 'center', bold: true },
                      { text: row.data.grade, alignment: 'center', bold: true, fillColor: row.data.grade === 'A' ? '#d4edda' : row.data.grade === 'B' ? '#d1ecf1' : row.data.grade === 'C' ? '#fff3cd' : row.data.grade === 'D' ? '#f8d7da' : row.data.grade === 'E' ? '#f5c6cb' : '#ffffff' }
                    ])
                  ]
                },
                layout: {
                  hLineWidth: function (i, node) { return (i === 0 || i === 1 || i === node.table.body.length) ? 1 : 0.5; },
                  vLineWidth: () => 0.5,
                  hLineColor: () => '#333333',
                  vLineColor: () => '#333333'
                }
              }
            ],

            footer: function() {
              return {
                margin: [40, 20, 40, 0],
                columns: [
                  { width: '*', text: '' },
                  {
                    width: 200,
                    stack: [
                      { text: `Jakarta, ${tanggalCetak}`, alignment: 'center', margin: [0, 0, 0, 5] },
                      { text: 'Guru Mata Pelajaran', alignment: 'center', bold: true, margin: [0, 0, 0, 50] },
                      { text: guruMapel?.namaLengkap || '(.......................)', alignment: 'center', bold: true, decoration: 'underline' },
                      { text: guruMapel?.nip ? `NIP. ${guruMapel.nip}` : '', alignment: 'center', fontSize: 9, margin: [0, 2, 0, 0] }
                    ]
                  }
                ]
              };
            },

            styles: {
              title: { fontSize: 14, bold: true, alignment: 'center' },
              subtitle: { fontSize: 11, alignment: 'center', italics: true },
              infoBox: { fontSize: 10 },
              keterangan: { fontSize: 8 },
              tableHeader: { bold: true, fontSize: 9, fillColor: '#eeeeee' },
              tableData: { fontSize: 8 }
            },
            
            defaultStyle: { font: 'Roboto' }
          };

        } 
        // ========== ADMIN MODE: Multi Mapel dengan Grouping ==========
        else if (role === 'ADMIN') {
          console.log('🎯 Mode: ADMIN - Multi Mapel');
          const dataPerMapel = await getRekapNilaiAllMapel(kelasUuid);
          console.log(`✅ Found ${dataPerMapel.length} mapel with nilai`);

          if (dataPerMapel.length === 0) {
            console.log('❌ No nilai data found');
            return res.status(404).json({ message: 'Belum ada data nilai untuk kelas ini' });
          }

          const contentSections = [];

          dataPerMapel.forEach(({ mapel, data }, mapelIndex) => {
            console.log(`📚 Processing: ${mapel.namaMapel} (${data.length} siswa)`);
            
            // Separator antar mapel (kecuali mapel pertama)
            if (mapelIndex > 0) {
              contentSections.push({ text: '', pageBreak: 'before' });
            }

            // Header Mapel
            contentSections.push({
              margin: [0, 10, 0, 5],
              table: {
                widths: ['*'],
                body: [[
                  {
                    stack: [
                      { text: `MATA PELAJARAN: ${mapel.namaMapel}`, fontSize: 12, bold: true, alignment: 'center' },
                      { text: `Guru: ${mapel.guru?.namaLengkap || '-'}`, fontSize: 10, italics: true, alignment: 'center', margin: [0, 2, 0, 0] }
                    ],
                    fillColor: '#e0e0e0',
                    margin: [5, 8, 5, 8]
                  }
                ]]
              },
              layout: {
                hLineWidth: () => 1,
                vLineWidth: () => 1,
                hLineColor: () => '#333333',
                vLineColor: () => '#333333'
              }
            });

            // Tabel Nilai
            contentSections.push({
              margin: [0, 10, 0, 20],
              style: 'tableData',
              table: {
                headerRows: 1,
                widths: [25, 50, '*', 45, 45, 45, 45, 55, 40],
                body: [
                  [
                    { text: 'No', style: 'tableHeader', alignment: 'center' },
                    { text: 'NIS', style: 'tableHeader', alignment: 'center' },
                    { text: 'Nama Siswa', style: 'tableHeader' },
                    { text: 'Tugas', style: 'tableHeader', alignment: 'center' },
                    { text: 'UH', style: 'tableHeader', alignment: 'center' },
                    { text: 'UTS', style: 'tableHeader', alignment: 'center' },
                    { text: 'UAS', style: 'tableHeader', alignment: 'center' },
                    { text: 'Nilai Akhir', style: 'tableHeader', alignment: 'center' },
                    { text: 'Grade', style: 'tableHeader', alignment: 'center' }
                  ],
                  ...data.map((row, index) => [
                    { text: index + 1, alignment: 'center' },
                    { text: row.siswa.nis, alignment: 'center' },
                    { text: row.siswa.namaLengkap },
                    { text: row.data.nilaiTugas?.toFixed(1) ?? '-', alignment: 'center' },
                    { text: row.data.nilaiUH?.toFixed(1) ?? '-', alignment: 'center' },
                    { text: row.data.nilaiUTS?.toFixed(1) ?? '-', alignment: 'center' },
                    { text: row.data.nilaiUAS?.toFixed(1) ?? '-', alignment: 'center' },
                    { text: row.data.nilaiAkhir?.toFixed(1) ?? '-', alignment: 'center', bold: true },
                    { text: row.data.grade, alignment: 'center', bold: true, fillColor: row.data.grade === 'A' ? '#d4edda' : row.data.grade === 'B' ? '#d1ecf1' : row.data.grade === 'C' ? '#fff3cd' : row.data.grade === 'D' ? '#f8d7da' : row.data.grade === 'E' ? '#f5c6cb' : '#ffffff' }
                  ])
                ]
              },
              layout: {
                hLineWidth: function (i, node) { return (i === 0 || i === 1 || i === node.table.body.length) ? 1 : 0.5; },
                vLineWidth: () => 0.5,
                hLineColor: () => '#333333',
                vLineColor: () => '#333333'
              }
            });
          });

          docDefinition = {
            pageSize: 'A4',
            pageOrientation: 'landscape',
            pageMargins: [40, 120, 40, 80],
            
            header: function() {
              return {
                margin: [40, 20, 40, 15],
                stack: [
                  {
                    columns: [
                      { width: 60, stack: [{ text: '🏫', fontSize: 45, alignment: 'center', margin: [0, 0, 0, 0] }] },
                      {
                        width: '*',
                        stack: [
                          { text: 'PEMERINTAH PROVINSI DKI JAKARTA', fontSize: 9, bold: true, alignment: 'center', margin: [0, 4, 0, 0] },
                          { text: 'DINAS PENDIDIKAN', fontSize: 9, bold: true, alignment: 'center', margin: [0, 1, 0, 1] },
                          { text: 'MAN 19 JAKARTA', fontSize: 15, bold: true, alignment: 'center', margin: [0, 1, 0, 2] },
                          { text: 'Jl. Raya Pondok Gede No. 10, Jakarta Timur 13760', fontSize: 8, alignment: 'center', margin: [0, 1, 0, 0] },
                          { text: 'Telp: (021) 12345678  |  Email: info@man19jkt.sch.id  |  Website: www.man19jkt.sch.id', fontSize: 8, alignment: 'center', margin: [0, 1, 0, 0] }
                        ]
                      },
                      { width: 60, text: '' }
                    ]
                  },
                  { margin: [0, 8, 0, 0], table: { widths: ['*'], heights: [3], body: [['']] }, layout: { hLineWidth: function(i) { return i === 0 ? 0 : 3; }, vLineWidth: () => 0, hLineColor: () => '#000000', paddingLeft: () => 0, paddingRight: () => 0, paddingTop: () => 0, paddingBottom: () => 0 } },
                  { margin: [0, 1, 0, 0], table: { widths: ['*'], heights: [1], body: [['']] }, layout: { hLineWidth: function(i) { return i === 0 ? 0 : 1; }, vLineWidth: () => 0, hLineColor: () => '#000000', paddingLeft: () => 0, paddingRight: () => 0, paddingTop: () => 0, paddingBottom: () => 0 } }
                ]
              };
            },

            content: [
              { text: 'REKAP NILAI AKADEMIK', style: 'title', margin: [0, 10, 0, 5] },
              { text: 'SEMUA MATA PELAJARAN', style: 'subtitle', margin: [0, 0, 0, 10] },
              
              {
                style: 'infoBox',
                table: {
                  widths: [100, 5, '*', 100, 5, '*'],
                  body: [
                    [
                      { text: 'Kelas', bold: true }, { text: ':' }, { text: kelas?.namaKelas || '-' },
                      { text: 'Tahun Ajaran', bold: true }, { text: ':' }, { text: kelas?.tahunAjaran?.tahun || '-' }
                    ],
                    [
                      { text: 'Wali Kelas', bold: true }, { text: ':' }, { text: kelas?.waliGuru?.namaLengkap || kelas?.waliKelas || '-' },
                      { text: 'Semester', bold: true }, { text: ':' }, { text: kelas?.tahunAjaran?.semester || '-' }
                    ]
                  ]
                },
                layout: 'noBorders',
                margin: [0, 0, 0, 10]
              },

              {
                style: 'keterangan',
                table: {
                  widths: ['*'],
                  body: [[{ text: 'Keterangan: Nilai Akhir = (Tugas × 20%) + (UH × 20%) + (UTS × 30%) + (UAS × 30%)', fontSize: 8, italics: true, margin: [5, 3, 5, 3] }]]
                },
                layout: { fillColor: '#f0f0f0', hLineWidth: () => 0, vLineWidth: () => 0 },
                margin: [0, 0, 0, 15]
              },

              ...contentSections
            ],

            footer: function() {
              return {
                margin: [40, 20, 40, 0],
                columns: [
                  { width: '*', text: '' },
                  {
                    width: 200,
                    stack: [
                      { text: `Jakarta, ${tanggalCetak}`, alignment: 'center', margin: [0, 0, 0, 5] },
                      { text: 'Wali Kelas', alignment: 'center', bold: true, margin: [0, 0, 0, 50] },
                      { text: kelas?.waliGuru?.namaLengkap || kelas?.waliKelas || '(.......................)', alignment: 'center', bold: true, decoration: 'underline' },
                      { text: kelas?.waliGuru?.nip ? `NIP. ${kelas.waliGuru.nip}` : '', alignment: 'center', fontSize: 9, margin: [0, 2, 0, 0] }
                    ]
                  }
                ]
              };
            },

            styles: {
              title: { fontSize: 14, bold: true, alignment: 'center' },
              subtitle: { fontSize: 11, alignment: 'center', italics: true },
              infoBox: { fontSize: 10 },
              keterangan: { fontSize: 8 },
              tableHeader: { bold: true, fontSize: 9, fillColor: '#eeeeee' },
              tableData: { fontSize: 8 }
            },
            
            defaultStyle: { font: 'Roboto' }
          };

        }
        // ========== FALLBACK: Backward Compatibility ==========
        else {
          const data = mapelUuid ? await getRekapNilaiSingleMapel(kelasUuid, mapelUuid) : [];
          const mapel = mapelUuid ? await prisma.mapel.findUnique({ where: { uuid: mapelUuid }, include: { guru: true } }) : null;

          // Same as GURU mode
          docDefinition = {
            pageSize: 'A4',
            pageOrientation: 'landscape',
            pageMargins: [40, 120, 40, 80],
            header: function() { return { margin: [40, 20, 40, 15], stack: [{ columns: [{ width: 60, stack: [{ text: '🏫', fontSize: 45, alignment: 'center' }] }, { width: '*', stack: [{ text: 'PEMERINTAH PROVINSI DKI JAKARTA', fontSize: 9, bold: true, alignment: 'center', margin: [0, 4, 0, 0] }, { text: 'DINAS PENDIDIKAN', fontSize: 9, bold: true, alignment: 'center', margin: [0, 1, 0, 1] }, { text: 'MAN 19 JAKARTA', fontSize: 15, bold: true, alignment: 'center', margin: [0, 1, 0, 2] }, { text: 'Jl. Raya Pondok Gede No. 10, Jakarta Timur 13760', fontSize: 8, alignment: 'center', margin: [0, 1, 0, 0] }, { text: 'Telp: (021) 12345678  |  Email: info@man19jkt.sch.id', fontSize: 8, alignment: 'center', margin: [0, 1, 0, 0] }] }, { width: 60, text: '' }] }, { margin: [0, 8, 0, 0], table: { widths: ['*'], heights: [3], body: [['']] }, layout: { hLineWidth: (i) => i === 0 ? 0 : 3, vLineWidth: () => 0, hLineColor: () => '#000000', paddingLeft: () => 0, paddingRight: () => 0, paddingTop: () => 0, paddingBottom: () => 0 } }, { margin: [0, 1, 0, 0], table: { widths: ['*'], heights: [1], body: [['']] }, layout: { hLineWidth: (i) => i === 0 ? 0 : 1, vLineWidth: () => 0, hLineColor: () => '#000000', paddingLeft: () => 0, paddingRight: () => 0, paddingTop: () => 0, paddingBottom: () => 0 } }] }; },
            content: [
              { text: 'DAFTAR NILAI SISWA', style: 'title', margin: [0, 10, 0, 5] },
              { text: mapel ? `Mata Pelajaran: ${mapel.namaMapel}` : 'Semua Mata Pelajaran', style: 'subtitle', margin: [0, 0, 0, 20] }
            ],
            footer: function() { return { margin: [40, 20, 40, 0], columns: [{ width: '*', text: '' }, { width: 200, stack: [{ text: `Jakarta, ${tanggalCetak}`, alignment: 'center', margin: [0, 0, 0, 5] }, { text: 'Wali Kelas', alignment: 'center', bold: true, margin: [0, 0, 0, 50] }, { text: kelas?.waliGuru?.namaLengkap || '(...)', alignment: 'center', bold: true, decoration: 'underline' }] }] }; },
            styles: { title: { fontSize: 14, bold: true, alignment: 'center' }, subtitle: { fontSize: 11, alignment: 'center', italics: true } },
            defaultStyle: { font: 'Roboto' }
          };
        }
        
        // Generate PDF
        console.log('📝 Generating PDF...');
        const pdfDocGenerator = pdfMake.createPdf(docDefinition);
        
        pdfDocGenerator.getBuffer((buffer) => {
          res.setHeader('Content-Type', 'application/pdf');
          
          let filename = 'daftar-nilai.pdf';
          if (role === 'GURU' && mapelUuid) {
            const mapelName = docDefinition.content[1].text.replace('Mata Pelajaran: ', '').replace(/\s+/g, '-');
            filename = `nilai-${mapelName}-${kelas?.namaKelas?.replace(/\s+/g, '-')}.pdf`;
          } else if (role === 'ADMIN') {
            filename = `rekap-nilai-${kelas?.namaKelas?.replace(/\s+/g, '-')}-semester-${kelas?.tahunAjaran?.semester || '1'}.pdf`;
          }
          
          res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
          res.send(buffer);
          console.log('✅ PDF sent:', filename);
        });

    } catch (error) {
        console.error('❌ Error generating nilai PDF:', error);
        res.status(500).json({ message: 'Gagal membuat PDF nilai', error: error.message });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

// Start server
const server = app.listen(port, () => {
  console.log(`🚀 Server PDF berjalan di http://localhost:${port}`);
  console.log(`📊 Health check: http://localhost:${port}/health`);
  console.log(`⏹️  Tekan CTRL+C untuk stop server`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    prisma.$disconnect();
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('\n🛑 Stopping PDF server...');
  server.close(() => {
    console.log('✅ PDF server stopped');
    prisma.$disconnect();
    process.exit(0);
  });
});
