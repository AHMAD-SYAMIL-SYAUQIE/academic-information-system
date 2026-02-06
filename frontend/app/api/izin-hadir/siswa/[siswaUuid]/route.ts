import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { siswaUuid: string } }
) {
  try {
    const records = await prisma.izinHadir.findMany({ where: { siswaUuid: params.siswaUuid } })
    return NextResponse.json(records)
  } catch (error) {
    console.error('Error get izin by siswa:', error)
    return NextResponse.json({ message: 'Server error' }, { status: 500 })
  }
}
