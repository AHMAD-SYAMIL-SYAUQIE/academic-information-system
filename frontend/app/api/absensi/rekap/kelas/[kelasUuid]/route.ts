import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { kelasUuid: string } }
) {
  try {
    const url = new URL(request.url)
    const sesiAbsensiUuid = url.searchParams.get('sesiAbsensiUuid')

    const where: any = { kelasUuid: params.kelasUuid }
    if (sesiAbsensiUuid) where.uuid = sesiAbsensiUuid

    // Get all sesi for the class (or single sesi if provided)
    const sesi = await prisma.sesiAbsensi.findMany({ where })

    // For each sesi, get attendance summary
    const results = []
    for (const s of sesi) {
      const total = await prisma.absensi.count({ where: { sesiAbsensiUuid: s.uuid } })
      results.push({ sesi: s, total })
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error('Error rekap kelas:', error)
    return NextResponse.json({ message: 'Server error' }, { status: 500 })
  }
}
