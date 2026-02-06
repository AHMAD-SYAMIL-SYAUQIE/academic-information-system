import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { kelasUuid: string } }
) {
  try {
    const url = new URL(request.url)
    const bulan = url.searchParams.get('bulan')
    const tahun = url.searchParams.get('tahun')

    // Find sesi in kelas
    const sesiWhere: any = { kelasUuid: params.kelasUuid }

    const sesi = await prisma.sesiAbsensi.findMany({ where: sesiWhere })

    // Filter by month/year
    let sesiFiltered = sesi
    if (bulan || tahun) {
      sesiFiltered = sesi.filter((s) => {
        const d = new Date(s.tanggal)
        if (bulan && d.getMonth() + 1 !== parseInt(bulan)) return false
        if (tahun && d.getFullYear() !== parseInt(tahun)) return false
        return true
      })
    }

    const sesiUuids = sesiFiltered.map((s) => s.uuid)
    const totalSesi = sesiUuids.length

    // Get all siswa in kelas
    const allSiswa = await prisma.siswa.findMany({ 
      where: { kelasUuid: params.kelasUuid },
      orderBy: { nis: 'asc' }
    })

    const absensi = await prisma.absensi.findMany({ 
      where: { sesiAbsensiUuid: { in: sesiUuids } }
    })

    // Group by siswa and count status
    const result = allSiswa.map((siswa) => {
      const siswaAbsensi = absensi.filter(a => a.siswaUuid === siswa.uuid)
      const hadir = siswaAbsensi.filter(a => a.status === 'HADIR').length
      const izin = siswaAbsensi.filter(a => a.status === 'IZIN').length
      const sakit = siswaAbsensi.filter(a => a.status === 'SAKIT').length
      const alpha = siswaAbsensi.filter(a => a.status === 'ALPHA').length
      const totalAbsensi = hadir + izin + sakit + alpha
      const persentase = totalSesi > 0 ? Math.round((hadir / totalSesi) * 100) : 0

      return {
        siswa: {
          uuid: siswa.uuid,
          nis: siswa.nis,
          namaLengkap: siswa.namaLengkap
        },
        data: {
          hadir,
          izin,
          sakit,
          alpha,
          persentase
        }
      }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error laporan absensi:', error)
    return NextResponse.json({ message: 'Server error' }, { status: 500 })
  }
}
