import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/absensi/sesi/[uuid]/monitoring
// Untuk monitoring real-time absensi di sesi tertentu
export async function GET(
  request: NextRequest,
  { params }: { params: { uuid: string } }
) {
  try {
    const sesiUuid = params.uuid

    // Get sesi detail dengan relasi lengkap
    const sesi = await prisma.sesiAbsensi.findUnique({
      where: { uuid: sesiUuid },
      include: {
        kelas: true,
        mapel: true,
        guru: true,
        qrCode: {
          where: { isExpired: false },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    })

    if (!sesi) {
      return NextResponse.json({ message: 'Sesi tidak ditemukan' }, { status: 404 })
    }

    // Get all siswa in this class
    const allSiswa = await prisma.siswa.findMany({
      where: { kelasUuid: sesi.kelasUuid! },
      include: { user: true },
      orderBy: { namaLengkap: 'asc' }
    })

    // Get absensi untuk sesi ini
    const absensiRecords = await prisma.absensi.findMany({
      where: { sesiAbsensiUuid: sesiUuid },
      include: {
        siswa: {
          include: { kelas: true }
        }
      },
      orderBy: { scanTime: 'desc' }
    })

    // Create map untuk cepat lookup
    const absensiMap = new Map(
      absensiRecords.map(a => [a.siswaUuid, a])
    )

    // Combine data: all siswa dengan status absensi mereka
    const siswaWithStatus = allSiswa.map(siswa => {
      const absensi = absensiMap.get(siswa.uuid)
      
      return {
        uuid: siswa.uuid,
        nis: siswa.nis,
        namaLengkap: siswa.namaLengkap,
        jenisKelamin: siswa.jenisKelamin,
        status: absensi?.status || 'BELUM_ABSEN',
        waktuAbsen: absensi?.scanTime || null,
        keterangan: absensi?.keterangan || null,
        absensiUuid: absensi?.uuid || null
      }
    })

    // Summary statistics
    const summary = {
      total: allSiswa.length,
      hadir: absensiRecords.filter(a => a.status === 'HADIR').length,
      izin: absensiRecords.filter(a => a.status === 'IZIN').length,
      sakit: absensiRecords.filter(a => a.status === 'SAKIT').length,
      alpha: absensiRecords.filter(a => a.status === 'ALPHA').length,
      belumAbsen: allSiswa.length - absensiRecords.length
    }

    return NextResponse.json({
      sesi: {
        uuid: sesi.uuid,
        tanggal: sesi.tanggal,
        jamMulai: sesi.jamMulai,
        jamSelesai: sesi.jamSelesai,
        status: sesi.status,
        kelas: sesi.kelas ? {
          uuid: sesi.kelas.uuid,
          namaKelas: sesi.kelas.namaKelas
        } : null,
        mapel: sesi.mapel ? {
          uuid: sesi.mapel.uuid,
          namaMapel: sesi.mapel.namaMapel
        } : null,
        guru: {
          uuid: sesi.guru.uuid,
          namaLengkap: sesi.guru.namaLengkap
        },
        qrCode: sesi.qrCode[0] || null
      },
      summary,
      siswa: siswaWithStatus,
      lastUpdate: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error monitoring sesi:', error)
    return NextResponse.json({ 
      message: 'Terjadi kesalahan saat mengambil data monitoring',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
