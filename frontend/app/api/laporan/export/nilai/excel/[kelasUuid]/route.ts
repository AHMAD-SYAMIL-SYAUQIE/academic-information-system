// frontend/app/api/laporan/export/nilai/excel/[kelasUuid]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import * as ExcelJS from 'exceljs';

const prisma = new PrismaClient();

// Helper function to get rekap nilai for SINGLE mapel (GURU mode)
async function getRekapNilaiSingleMapel(kelasUuid: string, mapelUuid: string) {
  const siswaList = await prisma.siswa.findMany({
    where: { kelasUuid },
    include: { user: true },
    orderBy: { namaLengkap: 'asc' },
  });

  const result = await Promise.all(
    siswaList.map(async (siswa) => {
      const whereClause: any = { siswaUuid: siswa.uuid, mapelUuid };

      const nilaiList = await prisma.nilai.findMany({
        where: whereClause,
        include: { mapel: true },
      });

      // Group nilai by jenis
      const nilaiByJenis: Record<string, number[]> = {
        TUGAS: [],
        UH: [],
        UTS: [],
        UAS: [],
      };

      nilaiList.forEach((n) => {
        if (nilaiByJenis[n.jenisNilai]) {
          nilaiByJenis[n.jenisNilai].push(n.nilai);
        }
      });

      const avgTugas = nilaiByJenis.TUGAS.length > 0
        ? nilaiByJenis.TUGAS.reduce((a, b) => a + b, 0) / nilaiByJenis.TUGAS.length
        : null;
      const avgUH = nilaiByJenis.UH.length > 0
        ? nilaiByJenis.UH.reduce((a, b) => a + b, 0) / nilaiByJenis.UH.length
        : null;
      const avgUTS = nilaiByJenis.UTS.length > 0
        ? nilaiByJenis.UTS.reduce((a, b) => a + b, 0) / nilaiByJenis.UTS.length
        : null;
      const avgUAS = nilaiByJenis.UAS.length > 0
        ? nilaiByJenis.UAS.reduce((a, b) => a + b, 0) / nilaiByJenis.UAS.length
        : null;

      // Calculate final grade (Tugas 20%, UH 20%, UTS 30%, UAS 30%)
      let nilaiAkhir: number | null = null;
      if (avgTugas !== null && avgUH !== null && avgUTS !== null && avgUAS !== null) {
        nilaiAkhir = (avgTugas * 0.2) + (avgUH * 0.2) + (avgUTS * 0.3) + (avgUAS * 0.3);
      }

      const getGrade = (nilai: number | null): string => {
        if (nilai === null) return '-';
        if (nilai >= 85) return 'A';
        if (nilai >= 75) return 'B';
        if (nilai >= 65) return 'C';
        if (nilai >= 55) return 'D';
        return 'E';
      };

      return {
        siswa: {
          uuid: siswa.uuid,
          nis: siswa.nis,
          namaLengkap: siswa.namaLengkap,
        },
        data: {
          nilaiTugas: avgTugas ? Math.round(avgTugas * 100) / 100 : null,
          nilaiUH: avgUH ? Math.round(avgUH * 100) / 100 : null,
          nilaiUTS: avgUTS ? Math.round(avgUTS * 100) / 100 : null,
          nilaiUAS: avgUAS ? Math.round(avgUAS * 100) / 100 : null,
          nilaiAkhir: nilaiAkhir ? Math.round(nilaiAkhir * 100) / 100 : null,
          grade: getGrade(nilaiAkhir),
        },
      };
    })
  );

  return result;
}

// Helper function untuk get semua mapel dengan nilai (ADMIN mode)
async function getRekapNilaiAllMapel(kelasUuid: string) {
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

// Export nilai to Excel - GURU MODE (Single Sheet)
async function exportNilaiExcelGuru(kelasUuid: string, mapelUuid: string): Promise<Buffer> {
  const data = await getRekapNilaiSingleMapel(kelasUuid, mapelUuid);
  const kelas = await prisma.kelas.findUnique({ 
    where: { uuid: kelasUuid },
    include: { tahunAjaran: true }
  });
  const mapel = await prisma.mapel.findUnique({ 
    where: { uuid: mapelUuid },
    include: { guru: true }
  });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Sistem Absensi & Akademik';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet(mapel?.namaMapel || 'Nilai');

  // Header
  worksheet.mergeCells('A1:I1');
  worksheet.getCell('A1').value = `DAFTAR NILAI SISWA`;
  worksheet.getCell('A1').font = { bold: true, size: 16 };
  worksheet.getCell('A1').alignment = { horizontal: 'center' };

  worksheet.mergeCells('A2:I2');
  worksheet.getCell('A2').value = `Mata Pelajaran: ${mapel?.namaMapel || '-'}`;
  worksheet.getCell('A2').font = { bold: true, size: 12 };
  worksheet.getCell('A2').alignment = { horizontal: 'center' };

  worksheet.mergeCells('A3:I3');
  worksheet.getCell('A3').value = `Kelas: ${kelas?.namaKelas || '-'} | Guru: ${mapel?.guru?.namaLengkap || '-'}`;
  worksheet.getCell('A3').alignment = { horizontal: 'center' };

  // Table headers
  worksheet.addRow([]);
  const headerRow = worksheet.addRow(['No', 'NIS', 'Nama Siswa', 'Tugas (20%)', 'UH (20%)', 'UTS (30%)', 'UAS (30%)', 'Nilai Akhir', 'Grade']);
  headerRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '4472C4' } };
    cell.font = { bold: true, color: { argb: 'FFFFFF' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };
  });

  // Data rows
  data.forEach((row, index) => {
    const dataRow = worksheet.addRow([
      index + 1,
      row.siswa.nis,
      row.siswa.namaLengkap,
      row.data.nilaiTugas ?? '-',
      row.data.nilaiUH ?? '-',
      row.data.nilaiUTS ?? '-',
      row.data.nilaiUAS ?? '-',
      row.data.nilaiAkhir ?? '-',
      row.data.grade,
    ]);
    dataRow.eachCell((cell, colNumber) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });
    dataRow.getCell(3).alignment = { horizontal: 'left', vertical: 'middle' };
  });

  // Column widths
  worksheet.columns = [
    { width: 5 },
    { width: 15 },
    { width: 30 },
    { width: 12 },
    { width: 12 },
    { width: 12 },
    { width: 12 },
    { width: 12 },
    { width: 10 },
  ];

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

// Export nilai to Excel - ADMIN MODE (Multi Sheet - 1 per Mapel)
async function exportNilaiExcelAdmin(kelasUuid: string): Promise<Buffer> {
  const dataPerMapel = await getRekapNilaiAllMapel(kelasUuid);
  const kelas = await prisma.kelas.findUnique({ 
    where: { uuid: kelasUuid },
    include: { tahunAjaran: true }
  });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Sistem Absensi & Akademik';
  workbook.created = new Date();

  // Jika tidak ada data nilai sama sekali
  if (dataPerMapel.length === 0) {
    const worksheet = workbook.addWorksheet('Info');
    worksheet.getCell('A1').value = 'Belum ada data nilai untuk kelas ini';
    worksheet.getCell('A1').font = { bold: true, size: 14 };
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  // Buat sheet per mapel
  dataPerMapel.forEach(({ mapel, data }) => {
    const sheetName = mapel.namaMapel.substring(0, 30); // Excel sheet name limit
    const worksheet = workbook.addWorksheet(sheetName);

    // Header
    worksheet.mergeCells('A1:I1');
    worksheet.getCell('A1').value = `REKAP NILAI AKADEMIK`;
    worksheet.getCell('A1').font = { bold: true, size: 16 };
    worksheet.getCell('A1').alignment = { horizontal: 'center' };

    worksheet.mergeCells('A2:I2');
    worksheet.getCell('A2').value = `Mata Pelajaran: ${mapel.namaMapel}`;
    worksheet.getCell('A2').font = { bold: true, size: 12 };
    worksheet.getCell('A2').alignment = { horizontal: 'center' };

    worksheet.mergeCells('A3:I3');
    worksheet.getCell('A3').value = `Kelas: ${kelas?.namaKelas || '-'} | Guru: ${mapel.guru?.namaLengkap || '-'} | Semester: ${kelas?.tahunAjaran?.semester || '-'}`;
    worksheet.getCell('A3').alignment = { horizontal: 'center' };

    // Table headers
    worksheet.addRow([]);
    const headerRow = worksheet.addRow(['No', 'NIS', 'Nama Siswa', 'Tugas (20%)', 'UH (20%)', 'UTS (30%)', 'UAS (30%)', 'Nilai Akhir', 'Grade']);
    headerRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'ED7D31' } };
      cell.font = { bold: true, color: { argb: 'FFFFFF' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });

    // Data rows
    data.forEach((row, index) => {
      const dataRow = worksheet.addRow([
        index + 1,
        row.siswa.nis,
        row.siswa.namaLengkap,
        row.data.nilaiTugas ?? '-',
        row.data.nilaiUH ?? '-',
        row.data.nilaiUTS ?? '-',
        row.data.nilaiUAS ?? '-',
        row.data.nilaiAkhir ?? '-',
        row.data.grade,
      ]);
      dataRow.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      });
      dataRow.getCell(3).alignment = { horizontal: 'left', vertical: 'middle' };
    });

    // Column widths
    worksheet.columns = [
      { width: 5 },
      { width: 15 },
      { width: 30 },
      { width: 12 },
      { width: 12 },
      { width: 12 },
      { width: 12 },
      { width: 12 },
      { width: 10 },
    ];
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export async function GET(request: NextRequest, { params }: { params: { kelasUuid: string } }) {
  try {
    const kelasUuid = params.kelasUuid;
    const searchParams = request.nextUrl.searchParams;
    const mapelUuid = searchParams.get('mapelUuid');
    const role = searchParams.get('role'); // Ambil role dari query param

    let buffer: Buffer;
    let filename: string;

    // GURU Mode - Single mapel, must have mapelUuid
    if (role === 'GURU' && mapelUuid) {
      buffer = await exportNilaiExcelGuru(kelasUuid, mapelUuid);
      
      // Generate filename: nilai-matematika-kelas-X.xlsx
      const kelas = await prisma.kelas.findUnique({ where: { uuid: kelasUuid } });
      const mapel = await prisma.mapel.findUnique({ where: { uuid: mapelUuid } });
      const kelasName = kelas?.namaKelas?.replace(/\s+/g, '-') || 'kelas';
      const mapelName = mapel?.namaMapel?.replace(/\s+/g, '-') || 'mapel';
      filename = `nilai-${mapelName}-${kelasName}.xlsx`;
      
    } 
    // ADMIN Mode - All mapel, multi-sheet
    else if (role === 'ADMIN') {
      buffer = await exportNilaiExcelAdmin(kelasUuid);
      
      // Generate filename: rekap-nilai-kelas-X-semester-1.xlsx
      const kelas = await prisma.kelas.findUnique({ 
        where: { uuid: kelasUuid },
        include: { tahunAjaran: true }
      });
      const kelasName = kelas?.namaKelas?.replace(/\s+/g, '-') || 'kelas';
      const semester = kelas?.tahunAjaran?.semester || '1';
      filename = `rekap-nilai-${kelasName}-semester-${semester}.xlsx`;
      
    } 
    // Fallback - Backward compatibility (jika tidak ada role)
    else if (mapelUuid) {
      buffer = await exportNilaiExcelGuru(kelasUuid, mapelUuid);
      filename = `nilai-${Date.now()}.xlsx`;
    } else {
      buffer = await exportNilaiExcelAdmin(kelasUuid);
      filename = `rekap-nilai-${Date.now()}.xlsx`;
    }

    const uint8Array = new Uint8Array(buffer);

    return new NextResponse(new Blob([uint8Array]), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error generating Excel:', error);
    return NextResponse.json({ message: 'Gagal membuat file Excel', error: String(error) }, { status: 500 });
  }
}
