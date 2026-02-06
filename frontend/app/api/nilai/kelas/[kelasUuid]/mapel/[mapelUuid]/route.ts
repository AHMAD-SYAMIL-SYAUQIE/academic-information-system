import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { kelasUuid: string; mapelUuid: string } }
) {
  try {
    // Find siswa in kelas
    const siswa = await prisma.siswa.findMany({ where: { kelasUuid: params.kelasUuid } })
    const siswaUuids = siswa.map((s) => s.uuid)

    const nilai = await prisma.nilai.findMany({ where: { siswaUuid: { in: siswaUuids }, mapelUuid: params.mapelUuid } })
    return NextResponse.json(nilai)
  } catch (error) {
    console.error('Error get nilai by kelas/mapel:', error)
    return NextResponse.json({ message: 'Server error' }, { status: 500 })
  }
}
