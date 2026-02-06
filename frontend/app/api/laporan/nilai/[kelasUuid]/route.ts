import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { kelasUuid: string } }
) {
  try {
    const url = new URL(request.url)
    const mapelUuid = url.searchParams.get('mapelUuid')

    // Find all siswa in kelas
    const allSiswa = await prisma.siswa.findMany({ 
      where: { kelasUuid: params.kelasUuid },
      orderBy: { nis: 'asc' }
    })
    const siswaUuids = allSiswa.map((s) => s.uuid)

    const where: any = { siswaUuid: { in: siswaUuids } }
    if (mapelUuid) where.mapelUuid = mapelUuid

    const nilai = await prisma.nilai.findMany({ where })

    // Calculate grade function
    const getGrade = (nilaiAkhir: number) => {
      if (nilaiAkhir >= 85) return 'A'
      if (nilaiAkhir >= 75) return 'B'
      if (nilaiAkhir >= 65) return 'C'
      if (nilaiAkhir >= 55) return 'D'
      return 'E'
    }

    // Group by siswa and breakdown by jenis
    const result = allSiswa.map((siswa) => {
      const siswaNilai = nilai.filter(n => n.siswaUuid === siswa.uuid)
      const nilaiTugas = siswaNilai.find(n => n.jenisNilai === 'TUGAS')?.nilai ?? null
      const nilaiUH = siswaNilai.find(n => n.jenisNilai === 'UH')?.nilai ?? null
      const nilaiUTS = siswaNilai.find(n => n.jenisNilai === 'UTS')?.nilai ?? null
      const nilaiUAS = siswaNilai.find(n => n.jenisNilai === 'UAS')?.nilai ?? null

      // Calculate nilai akhir (20% tugas, 20% UH, 30% UTS, 30% UAS)
      let nilaiAkhir = null
      let grade = '-'
      if (nilaiTugas !== null && nilaiUH !== null && nilaiUTS !== null && nilaiUAS !== null) {
        nilaiAkhir = Math.round(
          (Number(nilaiTugas) * 0.2 + 
           Number(nilaiUH) * 0.2 + 
           Number(nilaiUTS) * 0.3 + 
           Number(nilaiUAS) * 0.3) * 100
        ) / 100
        grade = getGrade(nilaiAkhir)
      }

      return {
        siswa: {
          uuid: siswa.uuid,
          nis: siswa.nis,
          namaLengkap: siswa.namaLengkap
        },
        data: {
          nilaiTugas,
          nilaiUH,
          nilaiUTS,
          nilaiUAS,
          nilaiAkhir,
          grade
        }
      }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error laporan nilai:', error)
    return NextResponse.json({ message: 'Server error' }, { status: 500 })
  }
}
