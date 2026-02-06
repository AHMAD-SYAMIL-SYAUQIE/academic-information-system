// frontend/app/api/laporan/export/absensi/excel/[kelasUuid]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import * as ExcelJS from 'exceljs';

const prisma = new PrismaClient();

// Helper: Get rekap absensi untuk SINGLE MAPEL (GURU mode)
async function getRekapAbsensiSingleMapel(kelasUuid: string, mapelUuid: string, bulan?: number, tahun?: number) {
  const siswaList = await prisma.siswa.findMany({
    where: { kelasUuid },
    orderBy: { namaLengkap: 'asc' },
  });

  const startDate = new Date(tahun || new Date().getFullYear(), (bulan || 1) - 1, 1);
  const endDate = new Date(tahun || new Date().getFullYear(), bulan || 12, 0);

  // Get mapel info dengan guru
  const mapel = await prisma.mapel.findUnique({
    where: { uuid: mapelUuid },
    include: {
      teachingAssignments: {
        where: { kelasUuid },
        include: { guru: true }
      }
    }
  });

  const result = await Promise.all(
    siswaList.map(async (siswa) => {
      const absensiList = await prisma.absensi.findMany({
        where: {
          siswaUuid: siswa.uuid,
          sesiAbsensi: {
            tanggal: { gte: startDate, lte: endDate },
            mapelUuid: mapelUuid // Filter by specific mapel
          },
        },
        select: { status: true },
      });

      const counts = { hadir: 0, izin: 0, sakit: 0, alpha: 0 };
      absensiList.forEach((a) => {
        const status = a.status.toLowerCase();
        if (status === 'hadir') counts.hadir++;
        else if (status === 'izin') counts.izin++;
        else if (status === 'sakit') counts.sakit++;
        else if (status === 'alpha') counts.alpha++;
      });

      const total = counts.hadir + counts.izin + counts.sakit + counts.alpha;
      const persentase = total > 0 ? Math.round((counts.hadir / total) * 100) : 0;

      return {
        siswa: { uuid: siswa.uuid, nis: siswa.nis, namaLengkap: siswa.namaLengkap },
        data: { ...counts, total, persentase },
      };
    })
  );

  return {
    mapelInfo: {
      namaMapel: mapel?.namaMapel || 'Unknown',
      namaGuru: mapel?.teachingAssignments?.[0]?.guru?.namaLengkap || null
    },
    data: result
  };
}

// Helper: Get rekap absensi untuk ALL MAPEL (ADMIN mode)
async function getRekapAbsensiAllMapel(kelasUuid: string, bulan?: number, tahun?: number) {
  const startDate = new Date(tahun || new Date().getFullYear(), (bulan || 1) - 1, 1);
  const endDate = new Date(tahun || new Date().getFullYear(), bulan || 12, 0);

  // Cari semua sesi absensi di kelas ini dalam periode tertentu
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
    }
  });

  // Group by mapelUuid
  const mapelMap = new Map();
  sesiRecords.forEach(sesi => {
    if (sesi.mapelUuid && !mapelMap.has(sesi.mapelUuid)) {
      mapelMap.set(sesi.mapelUuid, {
        namaMapel: sesi.mapel?.namaMapel || 'Unknown',
        namaGuru: sesi.mapel?.teachingAssignments?.[0]?.guru?.namaLengkap || null
      });
    }
  });

  // Fetch data untuk setiap mapel
  const result = [];
  for (const [mapelUuid, mapelInfo] of mapelMap.entries()) {
    const data = await getRekapAbsensiSingleMapel(kelasUuid, mapelUuid, bulan, tahun);
    result.push({
      mapelInfo: mapelInfo,
      data: data.data
    });
  }

  return result;
}

// Legacy helper (backward compatibility)
async function getRekapAbsensi(kelasUuid: string, bulan?: number, tahun?: number) {
  const siswaList = await prisma.siswa.findMany({
    where: { kelasUuid },
    include: { user: true },
    orderBy: { namaLengkap: 'asc' },
  });

  const startDate = new Date(tahun || new Date().getFullYear(), (bulan || 1) - 1, 1);
  const endDate = new Date(tahun || new Date().getFullYear(), bulan || 12, 0);

  const result = await Promise.all(
    siswaList.map(async (siswa) => {
      const absensiList = await prisma.absensi.findMany({
        where: {
          siswaUuid: siswa.uuid,
          sesiAbsensi: {
            tanggal: {
              gte: startDate,
              lte: endDate,
            },
          },
        },
        select: { status: true },
      });

      const counts = {
        hadir: 0,
        izin: 0,
        sakit: 0,
        alpha: 0,
      };

      absensiList.forEach((a) => {
        const status = a.status.toLowerCase();
        if (status === 'hadir') counts.hadir++;
        else if (status === 'izin') counts.izin++;
        else if (status === 'sakit') counts.sakit++;
        else if (status === 'alpha') counts.alpha++;
      });

      const total = counts.hadir + counts.izin + counts.sakit + counts.alpha;
      const persentase = total > 0 ? Math.round((counts.hadir / total) * 100) : 0;

      return {
        siswa: {
          uuid: siswa.uuid,
          nis: siswa.nis,
          namaLengkap: siswa.namaLengkap,
        },
        data: {
          ...counts,
          total,
          persentase,
        },
      };
    })
  );

  return result;
}

// Export absensi Excel untuk GURU (single mapel, single sheet, blue header)
async function exportAbsensiExcelGuru(kelasUuid: string, mapelUuid: string, bulan?: number, tahun?: number) {
  const result = await getRekapAbsensiSingleMapel(kelasUuid, mapelUuid, bulan, tahun);
  const kelas = await prisma.kelas.findUnique({ where: { uuid: kelasUuid } });
  
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Sistem Absensi & Akademik';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Rekap Absensi');

  // Header styling
  worksheet.mergeCells('A1:H1');
  worksheet.getCell('A1').value = `REKAP ABSENSI - ${result.mapelInfo.namaMapel.toUpperCase()}`;
  worksheet.getCell('A1').font = { bold: true, size: 16 };
  worksheet.getCell('A1').alignment = { horizontal: 'center' };

  worksheet.mergeCells('A2:H2');
  worksheet.getCell('A2').value = `Kelas: ${kelas?.namaKelas || '-'} | Guru: ${result.mapelInfo.namaGuru || '-'} | Periode: ${bulan ? `Bulan ${bulan}` : 'Semua'} ${tahun || new Date().getFullYear()}`;
  worksheet.getCell('A2').alignment = { horizontal: 'center' };

  // Table headers (BLUE untuk GURU)
  worksheet.addRow([]);
  const headerRow = worksheet.addRow(['No', 'NIS', 'Nama Siswa', 'Hadir', 'Izin', 'Sakit', 'Alpha', 'Persentase']);
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
  result.data.forEach((row, index) => {
    const dataRow = worksheet.addRow([
      index + 1,
      row.siswa.nis,
      row.siswa.namaLengkap,
      row.data.hadir,
      row.data.izin,
      row.data.sakit,
      row.data.alpha,
      `${row.data.persentase}%`,
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
    { width: 10 },
    { width: 10 },
    { width: 10 },
    { width: 10 },
    { width: 15 },
  ];

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}

// Export absensi Excel untuk ADMIN (multi mapel, multi sheet, orange headers)
async function exportAbsensiExcelAdmin(kelasUuid: string, bulan?: number, tahun?: number) {
  const dataPerMapel = await getRekapAbsensiAllMapel(kelasUuid, bulan, tahun);
  const kelas = await prisma.kelas.findUnique({ 
    where: { uuid: kelasUuid },
    include: { tahunAjaran: true }
  });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Sistem Absensi & Akademik - ADMIN';
  workbook.created = new Date();

  // Buat sheet untuk setiap mapel
  dataPerMapel.forEach((mapelData) => {
    const sheetName = mapelData.mapelInfo.namaMapel.substring(0, 30); // Excel limit 31 chars
    const worksheet = workbook.addWorksheet(sheetName);

    // Header
    worksheet.mergeCells('A1:H1');
    worksheet.getCell('A1').value = `REKAP ABSENSI - ${mapelData.mapelInfo.namaMapel.toUpperCase()}`;
    worksheet.getCell('A1').font = { bold: true, size: 16 };
    worksheet.getCell('A1').alignment = { horizontal: 'center' };

    worksheet.mergeCells('A2:H2');
    worksheet.getCell('A2').value = `Kelas: ${kelas?.namaKelas || '-'} | Guru: ${mapelData.mapelInfo.namaGuru || '-'}`;
    worksheet.getCell('A2').alignment = { horizontal: 'center' };

    worksheet.mergeCells('A3:H3');
    worksheet.getCell('A3').value = `Periode: ${bulan ? `Bulan ${bulan}` : 'Semua'} ${tahun || new Date().getFullYear()} | Semester ${kelas?.tahunAjaran?.semester || '-'}`;
    worksheet.getCell('A3').alignment = { horizontal: 'center' };

    // Table headers (ORANGE untuk ADMIN)
    worksheet.addRow([]);
    const headerRow = worksheet.addRow(['No', 'NIS', 'Nama Siswa', 'Hadir', 'Izin', 'Sakit', 'Alpha', 'Persentase']);
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
    mapelData.data.forEach((row, index) => {
      const dataRow = worksheet.addRow([
        index + 1,
        row.siswa.nis,
        row.siswa.namaLengkap,
        row.data.hadir,
        row.data.izin,
        row.data.sakit,
        row.data.alpha,
        `${row.data.persentase}%`,
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
      { width: 10 },
      { width: 10 },
      { width: 10 },
      { width: 10 },
      { width: 15 },
    ];
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}

// Legacy function (backward compatibility)
async function exportAbsensiExcelLogic(kelasUuid: string, bulan?: number, tahun?: number) {
  const data = await getRekapAbsensi(kelasUuid, bulan, tahun);
  const kelas = await prisma.kelas.findUnique({ where: { uuid: kelasUuid } });
  
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Sistem Absensi & Akademik';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Rekap Absensi');

  // Header styling
  worksheet.mergeCells('A1:H1');
  worksheet.getCell('A1').value = `REKAP ABSENSI SISWA`;
  worksheet.getCell('A1').font = { bold: true, size: 16 };
  worksheet.getCell('A1').alignment = { horizontal: 'center' };

  worksheet.mergeCells('A2:H2');
  worksheet.getCell('A2').value = `Kelas: ${kelas?.namaKelas || '-'} | Periode: ${bulan ? `Bulan ${bulan}` : 'Semua'} ${tahun || new Date().getFullYear()}`;
  worksheet.getCell('A2').alignment = { horizontal: 'center' };

  // Table headers
  worksheet.addRow([]);
  const headerRow = worksheet.addRow(['No', 'NIS', 'Nama Siswa', 'Hadir', 'Izin', 'Sakit', 'Alpha', 'Persentase']);
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
      row.data.hadir,
      row.data.izin,
      row.data.sakit,
      row.data.alpha,
      `${row.data.persentase}%`,
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
    { width: 10 },
    { width: 10 },
    { width: 10 },
    { width: 10 },
    { width: 15 },
  ];

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}

export async function GET(request: NextRequest, { params }: { params: { kelasUuid: string } }) {
  try {
    const kelasUuid = params.kelasUuid;
    const searchParams = request.nextUrl.searchParams;
    const bulan = searchParams.get('bulan');
    const tahun = searchParams.get('tahun');
    const mapelUuid = searchParams.get('mapelUuid');
    const role = searchParams.get('role');

    const bulanInt = bulan ? parseInt(bulan) : undefined;
    const tahunInt = tahun ? parseInt(tahun) : undefined;

    let buffer: ArrayBuffer;
    let filename: string;

    const kelas = await prisma.kelas.findUnique({ where: { uuid: kelasUuid } });
    const bulanNama = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const bulanStr = bulanInt ? bulanNama[bulanInt - 1] : 'Semua';

    // Tentukan mode berdasarkan role
    if (role === 'GURU' && mapelUuid) {
      // GURU: Single sheet untuk mapel yang diajar
      buffer = await exportAbsensiExcelGuru(kelasUuid, mapelUuid, bulanInt, tahunInt);
      
      const mapel = await prisma.mapel.findUnique({ where: { uuid: mapelUuid } });
      const namaMapel = mapel?.namaMapel.replace(/\s+/g, '-') || 'mapel';
      filename = `absensi-${namaMapel}-${kelas?.namaKelas}-${bulanStr}-${tahunInt}.xlsx`;
    } else if (role === 'ADMIN') {
      // ADMIN: Multi sheet, satu sheet per mapel
      buffer = await exportAbsensiExcelAdmin(kelasUuid, bulanInt, tahunInt);
      filename = `rekap-absensi-${kelas?.namaKelas}-${bulanStr}-${tahunInt}.xlsx`;
    } else {
      // Legacy mode (backward compatibility)
      buffer = await exportAbsensiExcelLogic(kelasUuid, bulanInt, tahunInt);
      filename = `rekap-absensi-${Date.now()}.xlsx`;
    }

    return new NextResponse(new Blob([buffer]), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename=${filename}`,
      },
    });
  } catch (error) {
    console.error('Error generating Excel report:', error);
    return NextResponse.json({ message: 'Error generating Excel report' }, { status: 500 });
  }
}
